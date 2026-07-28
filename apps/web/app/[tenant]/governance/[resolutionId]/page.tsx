'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './resolution-details.module.css';

export default function ResolutionDetailPage() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || '';
  const resolutionId = (params?.resolutionId as string) || '';

  const [resolution, setResolution] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // RBAC & Member State
  const [userRole, setUserRole] = useState<string>('');
  const [currentMemberId, setCurrentMemberId] = useState<string>('');
  const [hasVoted, setHasVoted] = useState(false);
  const [submittingVote, setSubmittingVote] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (tenantSlug && resolutionId) {
      fetchResolution();
      fetchUserInfo();
    }
  }, [tenantSlug, resolutionId]);

  const fetchUserInfo = async () => {
    try {
      const mineRes = await fetch('/api/backend/associations/mine');
      if (mineRes.ok) {
        const myAssocs = await mineRes.json();
        const current = myAssocs.find((a: any) => a.slug === tenantSlug);
        if (current) setUserRole(current.role);
      }

      const memRes = await fetch(`/api/backend/associations/${tenantSlug}/members`);
      if (memRes.ok) {
        const mems = await memRes.json();
        // Current user's member object
        const me = mems.find((m: any) => m.isCurrent);
        if (me) setCurrentMemberId(me.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isBureau = userRole === 'PRESIDENT' || userRole === 'TREASURER' || userRole === 'SECRETARY';

  const fetchResolution = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/resolutions/${resolutionId}`);
      if (res.ok) {
        const data = await res.json();
        setResolution(data);

        if (currentMemberId && data.votes) {
          const voted = data.votes.some((v: any) => v.voterMemberId === currentMemberId);
          setHasVoted(voted);
        }
      } else {
        setError('Résolution introuvable.');
      }
    } catch (e) {
      setError('Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (resolution && currentMemberId && resolution.votes) {
      const voted = resolution.votes.some((v: any) => v.voterMemberId === currentMemberId);
      setHasVoted(voted);
    }
  }, [resolution, currentMemberId]);

  const handleCastVote = async (choice: 'FOR' | 'AGAINST' | 'ABSTAIN') => {
    setSubmittingVote(true);
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/resolutions/${resolutionId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choice }),
      });

      if (res.ok) {
        fetchResolution();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Erreur lors du vote.');
      }
    } catch (e) {
      alert('Erreur de connexion.');
    } finally {
      setSubmittingVote(false);
    }
  };

  const handleCloseResolution = async () => {
    if (!confirm('Voulez-vous vraiment clôturer le scrutin et enregistrer la délibération finale ?')) return;
    setClosing(true);
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/resolutions/${resolutionId}/close`, {
        method: 'POST',
      });

      if (res.ok) {
        fetchResolution();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Erreur lors de la clôture.');
      }
    } catch (e) {
      alert('Erreur de connexion.');
    } finally {
      setClosing(false);
    }
  };

  if (loading) return <div className={styles.container}>Chargement du scrutin...</div>;
  if (error || !resolution) return <div className={styles.container}>{error || 'Résolution introuvable.'}</div>;

  const isElection = resolution.category === 'BUREAU_ELECTION';

  return (
    <div className={styles.container}>
      <Link href={`/${tenantSlug}/governance`} className={styles.backBtn}>
        &larr; Retour à la gouvernance
      </Link>

      <div className={styles.headerCard}>
        <div>
          <h1 className={styles.title}>{resolution.title}</h1>
          <p className={styles.subtitle}>
            {isElection ? `Élection pour le poste de ${resolution.targetRole}` : 'Proposition de résolution'} |
            Scrutin : {resolution.voteType === 'SECRET_BALLOT' ? 'Bulletin Secret' : 'Vote Ouvert'}
          </p>
        </div>

        <div className={styles.statusBadge}>
          {resolution.status === 'OPEN'
            ? 'Scrutin En Cours'
            : resolution.status === 'PASSED'
            ? 'ADOPTÉ / ÉLU'
            : 'REJETÉ'}
        </div>
      </div>

      {/* Description & Détails */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="material-symbols-rounded">article</span> Objet de la Délibération
          </span>
        </h2>
        <div className={styles.description}>
          {resolution.description || 'Aucune description fournie.'}
        </div>

        {isElection && resolution.candidateMember && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#fafafa', border: '1px solid #e0e0e0', borderRadius: '0.5rem', fontWeight: 700, color: '#000' }}>
            Membre Candidat(e) au poste de {resolution.targetRole} : <strong>{resolution.candidateMember.profile?.firstName} {resolution.candidateMember.profile?.lastName || ''}</strong> ({resolution.candidateMember.user?.email || resolution.candidateMember.userEmail})
          </div>
        )}

        {resolution.status === 'PASSED' && isElection && resolution.electedMember && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '0.5rem', color: '#15803d', fontWeight: 700 }}>
            RÉSULTAT DE L'ÉLECTION : {resolution.electedMember?.profile?.firstName} {resolution.electedMember?.profile?.lastName} a été officiellement élu(e) au poste de {resolution.targetRole} ! Les rôles du bureau ont été mis à jour avec succès.
          </div>
        )}
      </div>

      {/* Zone de Vote */}
      {resolution.status === 'OPEN' && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="material-symbols-rounded">how_to_vote</span> Exprimez votre Vote
            </span>
            {hasVoted && <span style={{ fontSize: '0.9rem', color: '#15803d', fontWeight: 700 }}>✓ Vous avez déjà voté</span>}
          </div>

          {!hasVoted ? (
            <div className={styles.votingBox}>
              <button
                className={`${styles.voteBtn} ${styles.btnFor}`}
                onClick={() => handleCastVote('FOR')}
                disabled={submittingVote}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span className="material-symbols-rounded">thumb_up</span> VOTE POUR
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Approuver la résolution</span>
              </button>

              <button
                className={`${styles.voteBtn} ${styles.btnAgainst}`}
                onClick={() => handleCastVote('AGAINST')}
                disabled={submittingVote}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span className="material-symbols-rounded">thumb_down</span> VOTE CONTRE
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Rejeter la résolution</span>
              </button>

              <button
                className={`${styles.voteBtn} ${styles.btnAbstain}`}
                onClick={() => handleCastVote('ABSTAIN')}
                disabled={submittingVote}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <span className="material-symbols-rounded">front_hand</span> ABSTENTION
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 'normal' }}>Ne pas se prononcer</span>
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', background: '#fafafa', borderRadius: '0.5rem', color: '#555' }}>
              Votre vote a été bien pris en compte pour cette délibération.
            </div>
          )}
        </div>
      )}

      {/* Résultats et Statistiques */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="material-symbols-rounded">bar_chart</span> Résultats et Quorum
          </span>
          {isBureau && resolution.status === 'OPEN' && (
            <button className={styles.closeBtn} onClick={handleCloseResolution} disabled={closing}>
              {closing ? 'Clôture en cours...' : 'Clôturer le Scrutin & Délibérer'}
            </button>
          )}
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <h4>Participation (Quorum)</h4>
            <p>{resolution.stats?.quorumPercentage}%</p>
            <span style={{ fontSize: '0.8rem', color: resolution.stats?.isQuorumMet ? '#15803d' : '#991b1b', fontWeight: 700 }}>
              {resolution.stats?.isQuorumMet ? '✓ Quorum atteint (>=50%)' : '✗ Quorum non atteint'}
            </span>
          </div>

          <div className={styles.statBox}>
            <h4>Taux d'Approbation</h4>
            <p>{resolution.stats?.approvalPercentage}%</p>
            <span style={{ fontSize: '0.8rem', color: resolution.stats?.isMajorityMet ? '#15803d' : '#991b1b', fontWeight: 700 }}>
              {resolution.stats?.isMajorityMet ? '✓ Majorité atteinte (>=50%)' : '✗ Majorité insuffisante'}
            </span>
          </div>

          <div className={styles.statBox}>
            <h4>Voix POUR</h4>
            <p style={{ color: '#000' }}>{resolution.stats?.votesFor}</p>
          </div>

          <div className={styles.statBox}>
            <h4>Voix CONTRE</h4>
            <p style={{ color: '#000' }}>{resolution.stats?.votesAgainst}</p>
          </div>
        </div>
      </div>

      {/* Registre des Votants (Si Vote Ouvert) */}
      {resolution.voteType === 'OPEN_VOTE' && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📋 Émargement des Votants (Scrutin Ouvert)</h2>
          <table className={styles.votersTable}>
            <thead>
              <tr>
                <th>Membre Votant</th>
                <th>Choix exprimé</th>
                <th>Horodatage</th>
              </tr>
            </thead>
            <tbody>
              {resolution.votes?.map((v: any) => {
                const name = v.voter?.profile?.firstName
                  ? `${v.voter.profile.firstName} ${v.voter.profile.lastName || ''}`
                  : v.voter?.user?.email || 'Membre';

                return (
                  <tr key={v.id}>
                    <td><strong>{name}</strong></td>
                    <td>
                      <span style={{ fontWeight: 700, color: v.choice === 'FOR' ? '#15803d' : v.choice === 'AGAINST' ? '#991b1b' : '#666' }}>
                        {v.choice === 'FOR' ? 'POUR' : v.choice === 'AGAINST' ? 'CONTRE' : 'ABSTENTION'}
                      </span>
                    </td>
                    <td>{new Date(v.votedAt).toLocaleString('fr-FR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
