'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './governance.module.css';

interface Resolution {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: string;
  voteType: string;
  targetRole?: string;
  electedMember?: any;
  stats?: {
    totalVotes: number;
    votesFor: number;
    votesAgainst: number;
    quorumPercentage: number;
    approvalPercentage: number;
  };
}

const CATEGORY_LABELS: Record<string, string> = {
  GENERAL_PROPOSAL: 'Proposition Générale',
  STATUTE_AMENDMENT: 'Modification Statutaire',
  BUREAU_ELECTION: 'Élection du Bureau',
};

const ROLE_LABELS: Record<string, string> = {
  PRESIDENT: 'Président(e)',
  TREASURER: 'Trésorier(e)',
  SECRETARY: 'Secrétaire Général(e)',
  CENSOR: 'Censeur',
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Scrutin Ouvert',
  CLOSED: 'Clôturé',
  PASSED: 'Adopté / Élu',
  REJECTED: 'Rejeté',
};

export default function GovernancePage() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || '';

  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'OPEN' | 'CLOSED'>('OPEN');

  // RBAC State
  const [userRole, setUserRole] = useState<string>('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('GENERAL_PROPOSAL');
  const [voteType, setVoteType] = useState('OPEN_VOTE');
  const [targetRole, setTargetRole] = useState('PRESIDENT');
  const [candidateMemberId, setCandidateMemberId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (tenantSlug) {
      initPage();
    }
  }, [tenantSlug]);

  const fetchMembers = async () => {
    try {
      const memRes = await fetch(`/api/backend/associations/${tenantSlug}/members`);
      if (memRes.ok) {
        const mems = await memRes.json();
        const list = Array.isArray(mems) ? mems : mems?.data || [];
        setMembers(list);
        if (list.length > 0 && !candidateMemberId) {
          setCandidateMemberId(list[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching members:', e);
    }
  };

  const initPage = async () => {
    setLoading(true);
    try {
      // Fetch User Role
      const mineRes = await fetch('/api/backend/associations/mine');
      if (mineRes.ok) {
        const myAssocs = await mineRes.json();
        const current = myAssocs.find((a: any) => a.slug === tenantSlug || a.id === tenantSlug);
        if (current) setUserRole(current.role);
      }

      await fetchMembers();

      // Fetch Resolutions
      const res = await fetch(`/api/backend/associations/${tenantSlug}/resolutions`);
      if (res.ok) setResolutions(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isBureau = !userRole || userRole === 'PRESIDENT' || userRole === 'SECRETARY' || userRole === 'TREASURER' || userRole === 'ADMIN';

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    setIsSubmitting(true);
    setModalError('');

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/resolutions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          voteType,
          targetRole: category === 'BUREAU_ELECTION' ? targetRole : undefined,
          candidateMemberId: category === 'BUREAU_ELECTION' ? candidateMemberId : undefined,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setTitle('');
        setDescription('');
        setCategory('GENERAL_PROPOSAL');
        setVoteType('OPEN_VOTE');
        initPage();
      } else {
        const data = await res.json().catch(() => ({}));
        setModalError(data.message || 'Erreur lors de la création de la résolution.');
      }
    } catch (err) {
      setModalError('Erreur de connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openResolutions = resolutions.filter((r) => r.status === 'OPEN');
  const closedResolutions = resolutions.filter((r) => r.status === 'PASSED' || r.status === 'REJECTED' || r.status === 'CLOSED');
  const displayedResolutions = activeTab === 'OPEN' ? openResolutions : closedResolutions;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Gouvernance, Votes & Élections du Bureau</h1>
          <p className={styles.subtitle}>
            Soumettez des résolutions au vote et élisez les nouveaux membres du Bureau Exécutif.
          </p>
        </div>
        {isBureau && (
          <button
            className={styles.createBtn}
            onClick={() => {
              fetchMembers();
              setShowModal(true);
            }}
          >
            <span className="material-symbols-rounded">add</span>
            Nouvelle Résolution / Élection
          </button>
        )}
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <h3>Scrutins en Cours</h3>
            <p className={styles.statValue}>{openResolutions.length}</p>
          </div>
          <span className="material-symbols-rounded" style={{ fontSize: '2.5rem', opacity: 0.3 }}>
            how_to_vote
          </span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <h3>Délibérations Clôturées</h3>
            <p className={styles.statValue}>{closedResolutions.length}</p>
          </div>
          <span className="material-symbols-rounded" style={{ fontSize: '2.5rem', opacity: 0.3 }}>
            gavel
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'OPEN' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('OPEN')}
        >
          Scrutins Ouverts ({openResolutions.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'CLOSED' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('CLOSED')}
        >
          Résultats & Délibérations ({closedResolutions.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Chargement des résolutions...</div>
      ) : displayedResolutions.length === 0 ? (
        <div className={styles.emptyState}>
          <span className="material-symbols-rounded">vote</span>
          <h3>Aucune résolution trouvée</h3>
          <p>
            {activeTab === 'OPEN'
              ? 'Aucun vote n\'est actuellement en cours.'
              : 'Aucun résultat ou délibération enregistrée.'}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {displayedResolutions.map((r) => {
            const isElection = r.category === 'BUREAU_ELECTION';

            return (
              <Link key={r.id} href={`/${tenantSlug}/governance/${r.id}`} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.resTitle}>{r.title}</h3>
                  <span className={`${styles.catBadge} ${isElection ? styles.electionBadge : ''}`}>
                    {CATEGORY_LABELS[r.category] || r.category}
                  </span>
                </div>
                <div className={styles.cardBody}>
                  {isElection && r.targetRole && (
                    <p className={styles.detail}>
                      <strong>Poste à pourvoir :</strong> {ROLE_LABELS[r.targetRole] || r.targetRole}
                    </p>
                  )}

                  {isElection && (r as any).candidateMember && (
                    <p className={styles.detail} style={{ fontWeight: 700, color: '#000' }}>
                      Candidat(e) : {(r as any).candidateMember.profile?.firstName} {(r as any).candidateMember.profile?.lastName || ''}
                    </p>
                  )}

                  {r.status === 'PASSED' && r.electedMember && (
                    <p className={styles.detail} style={{ color: '#15803d', fontWeight: 700 }}>
                      Élu(e) : {r.electedMember?.profile?.firstName} {r.electedMember?.profile?.lastName}
                    </p>
                  )}

                  <p className={styles.detail}>
                    <strong>Type de vote :</strong> {r.voteType === 'SECRET_BALLOT' ? 'Bulletin Secret' : 'Vote Ouvert'}
                  </p>
                  <p className={styles.detail}>
                    <strong>Participation :</strong> {r.stats?.totalVotes || 0} vote(s) (Quorum : {r.stats?.quorumPercentage || 0}%)
                  </p>

                  <div className={styles.progressContainer}>
                    <div className={styles.progressBar} style={{ width: `${Math.min(r.stats?.quorumPercentage || 0, 100)}%` }} />
                  </div>
                </div>
                <div className={styles.cardFooter}>
                  <span className={styles.viewLink}>Voir les détails &rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal - Create Resolution */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Nouvelle Résolution / Élection</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>

            {modalError && <div className={styles.alertError}>{modalError}</div>}

            <form onSubmit={handleCreateSubmit} className={styles.form}>
              <div className={styles.field}>
                <label>Catégorie</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="GENERAL_PROPOSAL">Proposition Générale</option>
                  <option value="STATUTE_AMENDMENT">Modification des Statuts</option>
                  <option value="BUREAU_ELECTION">Élection d'un Membre du Bureau</option>
                </select>
              </div>

              {category === 'BUREAU_ELECTION' && (
                <>
                  <div className={styles.field}>
                    <label>Poste du Bureau à élire (Rôle)</label>
                    <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)}>
                      <option value="PRESIDENT">Président(e)</option>
                      <option value="TREASURER">Trésorier(e)</option>
                      <option value="SECRETARY">Secrétaire Général(e)</option>
                      <option value="CENSOR">Censeur</option>
                    </select>
                  </div>

                  <div className={styles.field}>
                    <label>Membre Candidat à ce poste</label>
                    <select
                      value={candidateMemberId}
                      onChange={(e) => setCandidateMemberId(e.target.value)}
                    >
                      {members.length === 0 ? (
                        <option value="">Aucun membre disponible</option>
                      ) : (
                        members.map((m: any) => {
                          const firstName = m.profile?.firstName || m.firstName || '';
                          const lastName = m.profile?.lastName || m.lastName || '';
                          const email = m.userEmail || m.user?.email || '';
                          const name = (firstName || lastName)
                            ? `${firstName} ${lastName}`.trim()
                            : (email || `Membre #${m.id?.slice(-4)}`);

                          return (
                            <option key={m.id} value={m.id}>
                              {name} ({m.role || 'MEMBER'})
                            </option>
                          );
                        })
                      )}
                    </select>
                  </div>
                </>
              )}

              <div className={styles.field}>
                <label>Titre du sujet soumis au vote</label>
                <input
                  type="text"
                  required
                  placeholder={category === 'BUREAU_ELECTION' ? 'ex: Élection du nouveau Président' : 'ex: Validation du règlement des secours'}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label>Description / Détails de la résolution</label>
                <textarea
                  rows={3}
                  placeholder="Explication des motifs et des enjeux pour l'association..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label>Modalité du scrutin</label>
                <select value={voteType} onChange={(e) => setVoteType(e.target.value)}>
                  <option value="OPEN_VOTE">✋ Vote Ouvert à main levée</option>
                  <option value="SECRET_BALLOT">🔒 Bulletin Secret (Anonymat des choix)</option>
                </select>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? 'Publication...' : 'Lancer le Scrutin'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
