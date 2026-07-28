'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './tontines.module.css';

interface Tontine {
  id: string;
  name: string;
  type: string;
  amountPerRound: number;
  frequency: string;
  status: string;
  caisse?: { id: string; name: string };
  members?: any[];
  rounds?: any[];
}

interface Member {
  id: string;
  profile?: { firstName?: string; lastName?: string };
  userEmail?: string;
  memberNumber?: string;
}

interface Caisse {
  id: string;
  name: string;
}

const TYPE_LABELS: Record<string, string> = {
  FIXED_ORDER: 'Rotative (Ordre Fixe)',
  AUCTION: 'Tontine à Enchères',
  RANDOM: 'Tirage au sort',
  MULTI_SHARES: 'Multi-parts',
  SOCIAL: 'Sociale / Accumulative',
};

export default function TontinesPage() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || '';

  const [tontines, setTontines] = useState<Tontine[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [caisses, setCaisses] = useState<Caisse[]>([]);
  const [loading, setLoading] = useState(true);

  // RBAC State
  const [userRole, setUserRole] = useState<string>('');
  const [currentMemberId, setCurrentMemberId] = useState<string>('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('FIXED_ORDER');
  const [amountPerRound, setAmountPerRound] = useState<number | ''>('');
  const [frequency, setFrequency] = useState('MONTHLY');
  const [caisseId, setCaisseId] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (tenantSlug) {
      initPage();
    }
  }, [tenantSlug]);

  const initPage = async () => {
    setLoading(true);
    try {
      // 1. Fetch user role
      const mineRes = await fetch('/api/backend/associations/mine');
      let role = 'MEMBER';
      let mId = '';
      if (mineRes.ok) {
        const myAssocs = await mineRes.json();
        const current = myAssocs.find((a: any) => a.slug === tenantSlug);
        if (current) {
          role = current.role;
          mId = current.memberId;
          setUserRole(role);
          setCurrentMemberId(mId);
        }
      }

      const isBureau = role === 'PRESIDENT' || role === 'TREASURER' || role === 'SECRETARY';

      // 2. Fetch Tontines
      const url = isBureau
        ? `/api/backend/associations/${tenantSlug}/tontines`
        : `/api/backend/associations/${tenantSlug}/tontines?memberId=${mId}`;
      const res = await fetch(url);
      if (res.ok) setTontines(await res.json());

      // 3. Fetch Members & Caisses
      fetchMembers();
      fetchCaisses();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/members`);
      if (res.ok) setMembers(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCaisses = async () => {
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/treasury/caisses`);
      if (res.ok) setCaisses(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const isBureau = userRole === 'PRESIDENT' || userRole === 'TREASURER' || userRole === 'SECRETARY';

  const toggleMemberSelection = (mId: string) => {
    if (selectedMemberIds.includes(mId)) {
      setSelectedMemberIds(selectedMemberIds.filter((id) => id !== mId));
    } else {
      setSelectedMemberIds([...selectedMemberIds, mId]);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amountPerRound || selectedMemberIds.length === 0) return;
    setIsSubmitting(true);
    setModalError('');

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/tontines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          type,
          amountPerRound: Number(amountPerRound),
          frequency,
          caisseId: caisseId || undefined,
          memberIds: selectedMemberIds,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setName('');
        setDescription('');
        setAmountPerRound('');
        setSelectedMemberIds([]);
        initPage();
      } else {
        const data = await res.json().catch(() => ({}));
        setModalError(data.message || 'Erreur lors de la création de la tontine.');
      }
    } catch (err) {
      setModalError('Erreur de connexion au serveur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalPotValue = tontines.reduce((sum, t) => {
    const roundsCount = t.rounds?.length || t.members?.length || 0;
    return sum + t.amountPerRound * roundsCount;
  }, 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{isBureau ? 'Gestion des Tontines' : 'Mes Tontines'}</h1>
          <p className={styles.subtitle}>
            {isBureau
              ? 'Organisez les tours de tontine, enregistrez les cotisations et attribuez les pots.'
              : 'Consultez vos cotisations dues, l\'historique des tours et les attributions.'}
          </p>
        </div>
        {isBureau && (
          <button className={styles.createBtn} onClick={() => setShowModal(true)}>
            <span className="material-symbols-rounded">add</span>
            Créer une Tontine
          </button>
        )}
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <h3>Tontines Actives</h3>
            <p className={styles.statValue}>{tontines.filter((t) => t.status === 'ACTIVE').length}</p>
          </div>
          <span className="material-symbols-rounded" style={{ fontSize: '2.5rem', opacity: 0.3 }}>
            repeat
          </span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <h3>Valeur Totale des Pots</h3>
            <p className={styles.statValue}>{totalPotValue.toLocaleString('fr-FR')} XAF</p>
          </div>
          <span className="material-symbols-rounded" style={{ fontSize: '2.5rem', opacity: 0.3 }}>
            savings
          </span>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Chargement des tontines...</div>
      ) : tontines.length === 0 ? (
        <div className={styles.emptyState}>
          <span className="material-symbols-rounded">repeat</span>
          <h3>Aucune tontine trouvée</h3>
          <p>
            {isBureau
              ? 'Créez votre première tontine pour commencer les souscriptions des membres.'
              : 'Vous ne faites partie d\'aucune tontine pour le moment.'}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {tontines.map((t) => {
            const memberCount = t.members?.length || 0;
            const potValue = t.amountPerRound * memberCount;

            return (
              <Link key={t.id} href={`/${tenantSlug}/tontines/${t.id}`} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.tontineName}>{t.name}</h3>
                  <span className={styles.typeBadge}>{TYPE_LABELS[t.type] || t.type}</span>
                </div>
                <div className={styles.cardBody}>
                  <p className={styles.amount}>
                    {t.amountPerRound.toLocaleString('fr-FR')} <small>XAF / tour</small>
                  </p>
                  <p className={styles.detail}>
                    <strong>Pot global :</strong> {potValue.toLocaleString('fr-FR')} XAF
                  </p>
                  <p className={styles.detail}>
                    <strong>Participants :</strong> {memberCount} membre(s)
                  </p>
                  {t.caisse && (
                    <p className={styles.detail}>
                      <strong>Caisse :</strong> {t.caisse.name}
                    </p>
                  )}
                </div>
                <div className={styles.cardFooter}>
                  <span>Consulter la tontine</span>
                  <span className="material-symbols-rounded">arrow_forward</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal - Create Tontine */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Nouvelle Tontine</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>

            {modalError && <div className={styles.alertError}>{modalError}</div>}

            <form onSubmit={handleCreateSubmit} className={styles.form}>
              <div className={styles.field}>
                <label>Nom de la tontine</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Tontine des Cadres 2026"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label>Description / Règles (Optionnel)</label>
                <textarea
                  rows={2}
                  placeholder="ex: Cotisation mensuelle payable au plus tard le 5."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label>Type de tontine</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="FIXED_ORDER">Rotative (Ordre Fixe)</option>
                  <option value="AUCTION">Tontine à Enchères (Vente du tour)</option>
                  <option value="RANDOM">Tirage au Sort</option>
                  <option value="SOCIAL">Sociale / Accumulation</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Montant de la cotisation par tour (XAF)</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="ex: 50000"
                  value={amountPerRound}
                  onChange={(e) => setAmountPerRound(Number(e.target.value) || '')}
                />
              </div>

              <div className={styles.field}>
                <label>Fréquence des tours</label>
                <select value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                  <option value="WEEKLY">Hebdomadaire</option>
                  <option value="BIWEEKLY">Bimensuelle</option>
                  <option value="MONTHLY">Mensuelle</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Caisse réceptrice / décaisseuse</label>
                <select value={caisseId} onChange={(e) => setCaisseId(e.target.value)}>
                  <option value="">-- Sélectionner une caisse (ou Caisse Principale par défaut) --</option>
                  {caisses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Membres participants ({selectedMemberIds.length} sélectionnés)</label>
                <div className={styles.membersSelector}>
                  {members.map((m) => {
                    const mName = m.profile?.firstName
                      ? `${m.profile.firstName} ${m.profile.lastName || ''}`
                      : m.userEmail || m.memberNumber;

                    return (
                      <label key={m.id} className={styles.memberCheck}>
                        <input
                          type="checkbox"
                          checked={selectedMemberIds.includes(m.id)}
                          onChange={() => toggleMemberSelection(m.id)}
                        />
                        <span>{mName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isSubmitting || selectedMemberIds.length === 0}>
                {isSubmitting ? 'Création...' : 'Créer et lancer la tontine'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
