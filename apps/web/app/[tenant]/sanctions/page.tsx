'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './sanctions.module.css';

interface Member {
  id: string;
  status: string;
  profile?: { firstName?: string; lastName?: string };
  userEmail?: string;
  memberNumber?: string;
}

interface Caisse {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface Sanction {
  id: string;
  title: string;
  reason?: string | null;
  fineAmount: number;
  status: string;
  severity: string;
  createdAt: string;
  paidAt?: string | null;
  member: {
    id: string;
    profile?: { firstName?: string; lastName?: string };
    user?: { email: string };
  };
  caisse?: {
    id: string;
    name: string;
  } | null;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Impayée / En attente',
  PAID: 'Payée',
  EXCUSED: 'Excusée par le bureau',
  CANCELLED: 'Annulée',
};

const SEVERITY_LABELS: Record<string, string> = {
  MINOR: 'Mineure',
  MEDIUM: 'Moyenne',
  SEVERE: 'Grave',
};

export default function SanctionsPage() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || '';

  const [sanctions, setSanctions] = useState<Sanction[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [caisses, setCaisses] = useState<Caisse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [userRole, setUserRole] = useState<string>('');

  // Modal State - Issue Sanction
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [memberId, setMemberId] = useState('');
  const [title, setTitle] = useState('');
  const [reason, setReason] = useState('');
  const [fineAmount, setFineAmount] = useState<number | ''>('');
  const [severity, setSeverity] = useState<'MINOR' | 'MEDIUM' | 'SEVERE'>('MINOR');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [issueError, setIssueError] = useState('');

  // Overdue check state
  const [isCheckingOverdue, setIsCheckingOverdue] = useState(false);

  // Modal State - Pay Sanction
  const [selectedSanction, setSelectedSanction] = useState<Sanction | null>(null);
  const [payCaisseId, setPayCaisseId] = useState('');
  const [payError, setPayError] = useState('');

  useEffect(() => {
    if (tenantSlug) {
      fetchSanctions();
      fetchMembers();
      fetchCaisses();
      fetchUserRole();
    }
  }, [tenantSlug]);

  const fetchUserRole = async () => {
    try {
      const res = await fetch('/api/backend/associations/mine');
      if (res.ok) {
        const myAssocs = await res.json();
        const current = myAssocs.find((a: any) => a.slug === tenantSlug);
        if (current) setUserRole(current.role);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isBureau = userRole === 'PRESIDENT' || userRole === 'TREASURER' || userRole === 'SECRETARY';

  const fetchSanctions = async () => {
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/sanctions`);
      if (res.ok) setSanctions(await res.json());
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
      if (res.ok) {
        const data = await res.json();
        setCaisses(data);
        // Pre-select emergency caisse if available
        const emergency = data.find((c: any) => c.type === 'EMERGENCY' || c.name.toLowerCase().includes('secours'));
        if (emergency) setPayCaisseId(emergency.id);
        else if (data.length > 0) setPayCaisseId(data[0].id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberId || !title) return;
    setIsSubmitting(true);
    setIssueError('');

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/sanctions/issue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId,
          title,
          reason,
          fineAmount: Number(fineAmount) || 0,
          severity,
        }),
      });

      if (res.ok) {
        setShowIssueModal(false);
        setTitle('');
        setReason('');
        setFineAmount('');
        setMemberId('');
        fetchSanctions();
      } else {
        const data = await res.json().catch(() => ({}));
        setIssueError(data.message || 'Erreur lors de l\'émission.');
      }
    } catch (err) {
      setIssueError('Erreur de connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSanction || !payCaisseId) return;
    setIsSubmitting(true);
    setPayError('');

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/sanctions/${selectedSanction.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caisseId: payCaisseId,
        }),
      });

      if (res.ok) {
        setSelectedSanction(null);
        fetchSanctions();
      } else {
        const data = await res.json().catch(() => ({}));
        setPayError(data.message || 'Erreur lors du règlement.');
      }
    } catch (err) {
      setPayError('Erreur de connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (sanctionId: string, actionType: 'CANCEL' | 'EXCUSE') => {
    const actionName = actionType === 'EXCUSE' ? 'excuser' : 'annuler';
    if (!confirm(`Voulez-vous vraiment ${actionName} cette amende ?`)) return;

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/sanctions/${sanctionId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType }),
      });
      if (res.ok) fetchSanctions();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCheckOverdue = async () => {
    setIsCheckingOverdue(true);
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/sanctions/check-overdue`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Vérification terminée. ${data.suspendedMembersCount} membre(s) suspendu(s).`);
        fetchMembers(); // Rafraîchir les statuts des membres
      }
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la vérification.');
    } finally {
      setIsCheckingOverdue(false);
    }
  };

  const filteredSanctions = sanctions.filter((s) => {
    if (activeFilter === 'ALL') return true;
    return s.status === activeFilter;
  });

  const totalFinesIssued = sanctions.reduce((sum, s) => sum + s.fineAmount, 0);
  const totalFinesCollected = sanctions
    .filter((s) => s.status === 'PAID')
    .reduce((sum, s) => sum + s.fineAmount, 0);
  const totalPendingFines = sanctions
    .filter((s) => s.status === 'PENDING')
    .reduce((sum, s) => sum + s.fineAmount, 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Caisse de Secours & Amendes</h1>
          <p className={styles.subtitle}>
            Gestion des pénalités disciplinaires et collecte des amendes.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {(userRole === 'PRESIDENT' || userRole === 'TREASURER') && (
            <button 
              className={styles.outlineBtn} 
              onClick={handleCheckOverdue}
              disabled={isCheckingOverdue}
              style={{ background: '#fff', color: '#000', border: '1px solid #ddd', padding: '0.5rem 1rem', borderRadius: '0.4rem', fontWeight: 600, cursor: 'pointer' }}
            >
              {isCheckingOverdue ? 'Vérification...' : '🔍 Vérifier les Retards'}
            </button>
          )}
          <button className={styles.createBtn} onClick={() => setShowIssueModal(true)}>
            <span className="material-symbols-rounded">gavel</span>
            Infliger une amende / sanction
          </button>
        </div>
      </header>

      {/* Stats Summary */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={`material-symbols-rounded ${styles.statIcon}`}>gavel</span>
          <div>
            <div className={styles.statLabel}>Amendes Impayées (En attente)</div>
            <div className={styles.statValue}>{totalPendingFines.toLocaleString('fr-FR')} XAF</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={`material-symbols-rounded ${styles.statIcon}`}>savings</span>
          <div>
            <div className={styles.statLabel}>Total Encaissé (Secours)</div>
            <div className={styles.statValue}>{totalFinesCollected.toLocaleString('fr-FR')} XAF</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={`material-symbols-rounded ${styles.statIcon}`}>receipt_long</span>
          <div>
            <div className={styles.statLabel}>Total Amendes Émises</div>
            <div className={styles.statValue}>{totalFinesIssued.toLocaleString('fr-FR')} XAF</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {['ALL', 'PENDING', 'PAID', 'EXCUSED', 'CANCELLED'].map((filter) => (
          <button
            key={filter}
            className={`${styles.filterTab} ${activeFilter === filter ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter === 'ALL' ? 'Toutes les sanctions' : STATUS_LABELS[filter] || filter}
          </button>
        ))}
      </div>

      {/* Sanctions Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>Chargement des sanctions...</div>
        ) : filteredSanctions.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={`material-symbols-rounded ${styles.emptyIcon}`}>gavel</span>
            <p>Aucune sanction enregistrée pour ce filtre.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Membre</th>
                <th>Sanction / Infraction</th>
                <th>Gravité</th>
                <th>Montant Amende</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSanctions.map((sanction) => {
                const memberName = sanction.member?.profile
                  ? `${sanction.member.profile.firstName} ${sanction.member.profile.lastName || ''}`
                  : sanction.member?.user?.email || 'Membre';

                return (
                  <tr key={sanction.id}>
                    <td>
                      <div className={styles.memberName}>
                        {memberName}
                        {members.find((m) => m.id === sanction.member.id)?.status === 'SUSPENDED' && (
                          <span style={{ marginLeft: '0.5rem', background: '#ff3366', color: '#fff', fontSize: '0.65rem', padding: '0.1rem 0.3rem', borderRadius: '0.2rem', fontWeight: 'bold' }}>SUSPENDU</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.sanctionTitle}>{sanction.title}</div>
                      {sanction.reason && (
                        <div className={styles.sanctionReason}>{sanction.reason}</div>
                      )}
                    </td>
                    <td>
                      <span className={`${styles.severityBadge} ${styles[`severity_${sanction.severity}`]}`}>
                        {SEVERITY_LABELS[sanction.severity] || sanction.severity}
                      </span>
                    </td>
                    <td>
                      <strong>{(sanction.fineAmount || 0).toLocaleString('fr-FR')} XAF</strong>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status_${sanction.status}`]}`}>
                        {STATUS_LABELS[sanction.status] || sanction.status}
                      </span>
                    </td>
                    <td>{new Date(sanction.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      {sanction.status === 'PENDING' && sanction.fineAmount > 0 && (
                        <button
                          className={styles.payActionBtn}
                          onClick={() => setSelectedSanction(sanction)}
                        >
                          Régler
                        </button>
                      )}
                      {sanction.status === 'PENDING' && (
                        <button
                          className={styles.cancelActionBtn}
                          onClick={() => handleCancel(sanction.id, 'EXCUSE')}
                          title="Excuser"
                        >
                          Excuser
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal - Issue Sanction */}
      {showIssueModal && (
        <div className={styles.modalOverlay} onClick={() => setShowIssueModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Infliger une amende / sanction</h2>
              <button className={styles.closeBtn} onClick={() => setShowIssueModal(false)}>
                &times;
              </button>
            </div>

            {issueError && <div className={styles.alertError}>{issueError}</div>}

            <form onSubmit={handleIssueSubmit} className={styles.form}>
              <div className={styles.field}>
                <label>Membre concerné</label>
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  required
                >
                  <option value="">-- Sélectionner un membre --</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.profile?.firstName
                        ? `${m.profile.firstName} ${m.profile.lastName || ''}`
                        : m.userEmail || m.memberNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Intitulé de l'infraction</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Retard de 20 min à la séance"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label>Détails / Motif (optionnel)</label>
                <input
                  type="text"
                  placeholder="ex: Arrivée après l'appel des membres"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label>Montant de l'amende (XAF)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="ex: 1000 (0 si simple avertissement)"
                  value={fineAmount}
                  onChange={(e) => setFineAmount(Number(e.target.value) || '')}
                />
              </div>

              <div className={styles.field}>
                <label>Niveau de gravité</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as any)}
                >
                  <option value="MINOR">Mineure</option>
                  <option value="MEDIUM">Moyenne</option>
                  <option value="SEVERE">Grave</option>
                </select>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting || !memberId || !title}
              >
                {isSubmitting ? 'Émission...' : 'Infliger la sanction'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Pay Sanction */}
      {selectedSanction && (
        <div className={styles.modalOverlay} onClick={() => setSelectedSanction(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Règlement de l'amende</h2>
              <button className={styles.closeBtn} onClick={() => setSelectedSanction(null)}>
                &times;
              </button>
            </div>

            {payError && <div className={styles.alertError}>{payError}</div>}

            <p style={{ fontSize: '0.9rem', color: '#444', marginBottom: '1rem' }}>
              Paiement de l'amende : <strong>{(selectedSanction.fineAmount || 0).toLocaleString('fr-FR')} XAF</strong> pour "{selectedSanction.title}".
            </p>

            <form onSubmit={handlePaySubmit} className={styles.form}>
              <div className={styles.field}>
                <label>Caisse réceptrice des fonds</label>
                <select
                  value={payCaisseId}
                  onChange={(e) => setPayCaisseId(e.target.value)}
                  required
                >
                  <option value="">-- Sélectionner une caisse --</option>
                  {caisses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting || !payCaisseId}
              >
                {isSubmitting ? 'Traitement...' : 'Valider l\'encaissement'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
