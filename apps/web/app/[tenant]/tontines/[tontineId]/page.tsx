'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './tontine-details.module.css';
import ReceiptModal from '../../../components/ReceiptModal';
import TontineAuctionSimulator from '../../../components/TontineAuctionSimulator';
import TontineMeetingModal from '../../../components/TontineMeetingModal';

export default function TontineDetailPage() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || '';
  const tontineId = (params?.tontineId as string) || '';

  const [tontine, setTontine] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Receipt Modal State
  const [activeReceiptTxId, setActiveReceiptTxId] = useState<string | null>(null);

  // RBAC State
  const [userRole, setUserRole] = useState<string>('');

  // Modals
  const [showPayModal, setShowPayModal] = useState(false);
  const [payRoundId, setPayRoundId] = useState('');
  const [payMemberId, setPayMemberId] = useState('');
  const [payAmount, setPayAmount] = useState<number | ''>('');

  const [showAttributeModal, setShowAttributeModal] = useState(false);
  const [attrRoundId, setAttrRoundId] = useState('');
  const [attrBeneficiaryId, setAttrBeneficiaryId] = useState('');
  const [attrPotAmount, setAttrPotAmount] = useState<number | ''>('');
  const [attrAuctionAmount, setAttrAuctionAmount] = useState<number | ''>('');

  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [renewing, setRenewing] = useState(false);
  const [actionError, setActionError] = useState('');

  const handleRenewTontine = async () => {
    if (!confirm('Voulez-vous renouveler cette tontine et relancer un nouveau cycle de tours pour l\'ensemble des membres ?')) return;
    setRenewing(true);
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/tontines/${tontineId}/renew`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchTontine();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Erreur lors du renouvellement.');
      }
    } catch (err) {
      alert('Erreur de connexion.');
    } finally {
      setRenewing(false);
    }
  };

  useEffect(() => {
    if (tenantSlug && tontineId) {
      fetchTontine();
      fetchUserRole();
    }
  }, [tenantSlug, tontineId]);

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

  const fetchTontine = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/tontines/${tontineId}`);
      if (res.ok) {
        setTontine(await res.json());
      } else {
        setError('Tontine introuvable');
      }
    } catch (e) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handlePaySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payRoundId || !payMemberId || !payAmount || payAmount <= 0) return;
    setIsSubmitting(true);
    setActionError('');

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/tontines/rounds/${payRoundId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: payMemberId,
          amount: Number(payAmount),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowPayModal(false);
        fetchTontine();
        if (data.transaction?.id) {
          setActiveReceiptTxId(data.transaction.id);
        }
      } else {
        setActionError(data.message || 'Erreur lors du paiement.');
      }
    } catch (err) {
      setActionError('Erreur de connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAttributeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attrRoundId || !attrBeneficiaryId || !attrPotAmount || attrPotAmount <= 0) return;
    setIsSubmitting(true);
    setActionError('');

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/tontines/rounds/${attrRoundId}/attribute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          beneficiaryMemberId: attrBeneficiaryId,
          potAmount: Number(attrPotAmount),
          auctionAmount: Number(attrAuctionAmount) || 0,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setShowAttributeModal(false);
        fetchTontine();
        if (data.transaction?.id) {
          setActiveReceiptTxId(data.transaction.id);
        }
      } else {
        setActionError(data.message || 'Erreur lors de l\'attribution du pot.');
      }
    } catch (err) {
      setActionError('Erreur de connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className={styles.container}>Chargement de la tontine...</div>;
  if (error || !tontine) return <div className={styles.container}>{error || 'Tontine introuvable.'}</div>;

  const memberCount = tontine.members?.length || 0;
  const totalPot = tontine.amountPerRound * memberCount;

  return (
    <div className={styles.container}>
      <Link href={`/${tenantSlug}/tontines`} className={styles.backBtn}>
        &larr; Retour aux tontines
      </Link>

      <div className={styles.headerCard}>
        <div>
          <h1 className={styles.title}>{tontine.name}</h1>
          <p className={styles.subtitle}>
            {tontine.description || 'Tontine de l\'association'}
          </p>
          <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#ffffff', fontWeight: 500 }}>
            Cotisation : <strong>{tontine.amountPerRound.toLocaleString('fr-FR')} XAF / tour</strong> | Caisse : <strong>{tontine.caisse?.name || 'Caisse Principale'}</strong>
          </div>
          {tontine.status === 'COMPLETED' && (
            <div style={{ marginTop: '1rem', background: '#ffffff', color: '#000000', padding: '0.75rem 1rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div>
                <strong>🎉 Tontine Terminée !</strong> Tous les membres ont reçu leur pot pour ce cycle.
              </div>
              {isBureau && (
                <button
                  type="button"
                  onClick={handleRenewTontine}
                  disabled={renewing}
                  style={{ background: '#000', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.4rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}
                >
                  {renewing ? 'Renouvellement...' : '🔄 Renouveler la Tontine (Nouveau Cycle)'}
                </button>
              )}
            </div>
          )}
          {isBureau && tontine.status !== 'COMPLETED' && (
            <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
              {tontine.type === 'AUCTION' && (
                <button
                  type="button"
                  onClick={() => setShowSimulatorModal(true)}
                  style={{ background: '#f5a623', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.4rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  📈 Simuler Enchères
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowMeetingModal(true)}
                style={{ background: '#ff3366', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.4rem', fontWeight: 600, cursor: 'pointer' }}
              >
                🎤 Lancer Session en Direct
              </button>
            </div>
          )}
        </div>

        <div className={styles.statBadge}>
          <h4>Pot par Tour</h4>
          <p>{totalPot.toLocaleString('fr-FR')} XAF</p>
        </div>
      </div>

      <div className={styles.roundsSection}>
        <h2 className={styles.sectionTitle}>Tours de Tontine ({tontine.rounds?.length || 0})</h2>

        {(() => {
          const firstOpenRound = tontine.rounds?.find((r: any) => r.status === 'OPEN');
          const currentRoundId = firstOpenRound?.id;

          return tontine.rounds?.map((round: any) => {
            const isCurrentRound = round.id === currentRoundId;
            const isPastRound = round.status === 'CLOSED';
            const isFutureRound = round.status === 'OPEN' && !isCurrentRound;

            const beneficiaryName = round.beneficiary?.profile?.firstName
              ? `${round.beneficiary.profile.firstName} ${round.beneficiary.profile.lastName || ''}`
              : round.beneficiary?.user?.email || '-';

            const paidCount = round.contributions?.filter((c: any) => c.isPaid).length || 0;

            // Compact View for Future Rounds
            if (isFutureRound) {
              return (
                <div key={round.id} className={styles.roundCard} style={{ opacity: 0.75, background: '#fafafa' }}>
                  <div className={styles.roundHeader}>
                    <div>
                      <h3 className={styles.roundTitle}>
                        Tour #{round.roundNumber} <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'normal' }}>(Tour Futur)</span>
                      </h3>
                      <div style={{ fontSize: '0.85rem', color: '#111', marginTop: '0.25rem', fontWeight: 600 }}>
                        📅 Date d'échéance prévue : <strong>{new Date(round.dueDate).toLocaleDateString('fr-FR')}</strong>
                      </div>
                    </div>
                    <span className={styles.pendingBadge}>À VENIR</span>
                  </div>
                </div>
              );
            }

            // Detailed View for Past and Current Active Rounds
            return (
              <div
                key={round.id}
                className={styles.roundCard}
                style={isCurrentRound ? { border: '2px solid #000', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } : {}}
              >
                <div className={styles.roundHeader}>
                  <div>
                    <h3 className={styles.roundTitle}>
                      Tour #{round.roundNumber} {isCurrentRound && <span style={{ fontSize: '0.8rem', background: '#000', color: '#fff', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', marginLeft: '0.5rem' }}>TOUR ACTUEL</span>}
                    </h3>
                    <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>
                      Date : {new Date(round.dueDate).toLocaleDateString('fr-FR')} | Cotisations : {paidCount}/{memberCount} payées
                    </div>
                  </div>

                  <div className={styles.roundActions}>
                    {isCurrentRound && isBureau && (
                      <button
                        className={styles.actionBtn}
                        disabled={paidCount < memberCount}
                        style={paidCount < memberCount ? { opacity: 0.5, cursor: 'not-allowed', background: '#666' } : {}}
                        title={paidCount < memberCount ? `L'attribution requiert que tous les participants (${memberCount}) aient versé leur cotisation.` : ''}
                        onClick={() => {
                          if (paidCount < memberCount) return;
                          setAttrRoundId(round.id);
                          setAttrPotAmount(totalPot);
                          setShowAttributeModal(true);
                        }}
                      >
                        🏆 Attribuer le Pot {paidCount < memberCount ? `(${paidCount}/${memberCount})` : ''}
                      </button>
                    )}
                    {isPastRound && (
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#000' }}>
                        Gagnant : {beneficiaryName} ({(round.potAmount || 0).toLocaleString('fr-FR')} XAF)
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.roundBody}>
                  <table className={styles.contribTable}>
                    <thead>
                      <tr>
                        <th>Participant</th>
                        <th>Montant attendu</th>
                        <th>Statut</th>
                        <th>Date de règlement</th>
                        <th>Reçu PDF</th>
                        {isBureau && isCurrentRound && <th>Action</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {round.contributions?.map((contrib: any) => {
                        const mName = contrib.member?.profile?.firstName
                          ? `${contrib.member.profile.firstName} ${contrib.member.profile.lastName || ''}`
                          : contrib.member?.user?.email || 'Membre';

                        return (
                          <tr key={contrib.id}>
                            <td><strong>{mName}</strong></td>
                            <td>{contrib.amount.toLocaleString('fr-FR')} XAF</td>
                            <td>
                              {contrib.isPaid ? (
                                <span className={styles.paidBadge}>PAYÉ</span>
                              ) : (
                                <span className={styles.pendingBadge}>EN ATTENTE</span>
                              )}
                            </td>
                            <td>
                              {contrib.paidAt ? new Date(contrib.paidAt).toLocaleDateString('fr-FR') : '-'}
                            </td>
                            <td>
                              {contrib.transactionId ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveReceiptTxId(contrib.transactionId)}
                                  className={styles.receiptLink}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                >
                                  Reçu PDF
                                </button>
                              ) : (
                                '-'
                              )}
                            </td>
                            {isBureau && isCurrentRound && (
                              <td>
                                {!contrib.isPaid && (
                                  <button
                                    className={styles.outlineBtn}
                                    onClick={() => {
                                      setPayRoundId(round.id);
                                      setPayMemberId(contrib.memberId);
                                      setPayAmount(contrib.amount);
                                      setShowPayModal(true);
                                    }}
                                  >
                                    Enregistrer la cotisation
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          });
        })()}
      </div>

      {/* Modal - Pay Contribution */}
      {showPayModal && (
        <div className={styles.modalOverlay} onClick={() => setShowPayModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Encaisser la Cotisation</h2>
              <button className={styles.closeBtn} onClick={() => setShowPayModal(false)}>
                &times;
              </button>
            </div>

            {actionError && <div className={styles.alertError}>{actionError}</div>}

            <form onSubmit={handlePaySubmit} className={styles.form}>
              <div className={styles.field}>
                <label>Montant de la cotisation (XAF)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value) || '')}
                />
              </div>

              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? 'Traitement...' : 'Valider et créditer la caisse'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Attribute Pot */}
      {showAttributeModal && (
        <div className={styles.modalOverlay} onClick={() => setShowAttributeModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Attribuer le Pot du Tour</h2>
              <button className={styles.closeBtn} onClick={() => setShowAttributeModal(false)}>
                &times;
              </button>
            </div>

            {actionError && <div className={styles.alertError}>{actionError}</div>}

            <form onSubmit={handleAttributeSubmit} className={styles.form}>
              <div className={styles.field}>
                <label>Membre Bénéficiaire (Gagnant)</label>
                <select
                  value={attrBeneficiaryId}
                  onChange={(e) => setAttrBeneficiaryId(e.target.value)}
                  required
                >
                  <option value="">-- Sélectionner le gagnant (membres éligibles) --</option>
                  {(() => {
                    const previousWinnerIds = tontine.rounds
                      ?.filter((r: any) => r.status === 'CLOSED' && r.beneficiaryMemberId)
                      .map((r: any) => r.beneficiaryMemberId) || [];

                    const eligibleMembers = tontine.members?.filter(
                      (tm: any) => !previousWinnerIds.includes(tm.memberId)
                    ) || [];

                    return eligibleMembers.map((tm: any) => {
                      const name = tm.member?.profile?.firstName
                        ? `${tm.member.profile.firstName} ${tm.member.profile.lastName || ''}`
                        : tm.member?.user?.email || tm.memberId;
                      return (
                        <option key={tm.memberId} value={tm.memberId}>
                          {name}
                        </option>
                      );
                    });
                  })()}
                </select>
              </div>

              <div className={styles.field}>
                <label>Montant du Pot à verser (XAF)</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={attrPotAmount}
                  onChange={(e) => setAttrPotAmount(Number(e.target.value) || '')}
                />
              </div>

              {tontine.type === 'AUCTION' && (
                <div className={styles.field}>
                  <label>Montant de l'enchère gagnante (XAF)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="ex: 5000"
                    value={attrAuctionAmount}
                    onChange={(e) => setAttrAuctionAmount(Number(e.target.value) || '')}
                  />
                </div>
              )}

              <button type="submit" className={styles.submitBtn} disabled={isSubmitting || !attrBeneficiaryId}>
                {isSubmitting ? 'Traitement...' : 'Attribuer le Pot et Clôturer le Tour'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Simulator Modal */}
      {showSimulatorModal && (
        <TontineAuctionSimulator
          tontineId={tontineId}
          tenantSlug={tenantSlug}
          amountPerRound={tontine.amountPerRound}
          members={tontine.members || []}
          onClose={() => setShowSimulatorModal(false)}
          onSimulationComplete={(result) => {
            alert(`Simulation réussie !\nGagnant : ${result.winningMemberId}\nPot à verser : ${result.potToDisburse} XAF\nIntérêts : ${result.generatedInterest} XAF`);
            setShowSimulatorModal(false);
          }}
        />
      )}

      {/* Meeting Modal */}
      {showMeetingModal && (
        <TontineMeetingModal
          tontineId={tontineId}
          tenantSlug={tenantSlug}
          onClose={() => setShowMeetingModal(false)}
          onSuccess={() => {
            setShowMeetingModal(false);
            fetchTontine();
          }}
        />
      )}

      {/* Popup Modal for Receipt Download */}
      {activeReceiptTxId && (
        <ReceiptModal
          transactionId={activeReceiptTxId}
          tenantSlug={tenantSlug}
          onClose={() => setActiveReceiptTxId(null)}
        />
      )}
    </div>
  );
}
