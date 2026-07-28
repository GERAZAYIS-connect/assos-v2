'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './loan-details.module.css';

interface Repayment {
  id: string;
  amount: number;
  paidAt: string;
  notes?: string | null;
}

interface LoanDetails {
  id: string;
  amount: number;
  interestRate: number;
  totalToRepay: number;
  balanceRemaining: number;
  status: string;
  reason?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  createdAt: string;
  guarantorMemberId?: string | null;
  informalReminderAt?: string | null;
  informalReminderNotes?: string | null;
  borrower: {
    id: string;
    profile?: { firstName?: string; lastName?: string };
    user?: { email: string; phone?: string };
  };
  guarantor?: {
    id: string;
    profile?: { firstName?: string; lastName?: string };
    user?: { email: string };
  } | null;
  caisse: {
    id: string;
    name: string;
    type: string;
  };
  repayments: Repayment[];
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente d\'approbation',
  APPROVED: 'Approuvé / En cours',
  COMPLETED: 'Intégralement remboursé',
  REJECTED: 'Demande rejetée',
  AWAITING_URGENT_DECISION: 'En Attente (URGENT)',
};

export default function LoanDetailPage() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || '';
  const loanId = (params?.loanId as string) || '';

  const [loan, setLoan] = useState<LoanDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Repayment Modal State
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [repayAmount, setRepayAmount] = useState<number | ''>('');
  const [repayNotes, setRepayNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [repayError, setRepayError] = useState('');

  // Informal Reminder Modal State
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderNotes, setReminderNotes] = useState('');
  const [reminderError, setReminderError] = useState('');
  const [isSubmittingReminder, setIsSubmittingReminder] = useState(false);

  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (tenantSlug && loanId) {
      fetchLoanDetails();
      fetchUserRole();
    }
  }, [tenantSlug, loanId]);

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

  const fetchLoanDetails = async () => {
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/loans/${loanId}`);
      if (res.ok) {
        setLoan(await res.json());
      } else {
        setError('Prêt introuvable');
      }
    } catch (e) {
      setError('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Êtes-vous sûr de vouloir approuver ce prêt ? Le solde de la caisse sera déduit.')) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/loans/${loanId}/approve`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchLoanDetails();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Erreur lors de l\'approbation');
      }
    } catch (e) {
      alert('Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!confirm('Êtes-vous sûr de vouloir désapprouver (rejeter) cette demande de prêt ?')) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/loans/${loanId}/reject`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchLoanDetails();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Erreur lors du rejet');
      }
    } catch (e) {
      alert('Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRepaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repayAmount || repayAmount <= 0) return;
    setIsSubmitting(true);
    setRepayError('');

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/loans/${loanId}/repay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(repayAmount),
          notes: repayNotes,
        }),
      });

      if (res.ok) {
        setShowRepayModal(false);
        setRepayAmount('');
        setRepayNotes('');
        fetchLoanDetails();
      } else {
        const data = await res.json().catch(() => ({}));
        setRepayError(data.message || 'Erreur lors du remboursement.');
      }
    } catch (err) {
      setRepayError('Erreur de connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReminderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingReminder(true);
    setReminderError('');

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/loans/${loanId}/remind`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: reminderNotes }),
      });

      if (res.ok) {
        setShowReminderModal(false);
        setReminderNotes('');
        fetchLoanDetails();
      } else {
        const data = await res.json().catch(() => ({}));
        setReminderError(data.message || 'Erreur lors de l\'enregistrement de la relance.');
      }
    } catch (err) {
      setReminderError('Erreur de connexion.');
    } finally {
      setIsSubmittingReminder(false);
    }
  };

  if (loading) return <div className={styles.container}>Chargement du prêt...</div>;
  if (error || !loan) return <div className={styles.container}>{error || 'Prêt introuvable.'}</div>;

  const borrowerName = loan.borrower?.profile
    ? `${loan.borrower.profile.firstName} ${loan.borrower.profile.lastName || ''}`
    : loan.borrower?.user?.email || 'Membre';

  const guarantorName = loan.guarantor?.profile
    ? `${loan.guarantor.profile.firstName} ${loan.guarantor.profile.lastName || ''}`
    : loan.guarantor?.user?.email || null;

  const repaidAmount = loan.totalToRepay - loan.balanceRemaining;
  const progressPercent = Math.min(100, Math.round((repaidAmount / loan.totalToRepay) * 100));

  const isUrgent = loan.status === 'AWAITING_URGENT_DECISION';

  return (
    <div className={styles.container}>
      <Link href={`/${tenantSlug}/loans`} className={styles.backBtn}>
        &larr; Retour à la liste des prêts
      </Link>

      {/* URGENT Alert Banner */}
      {isUrgent && (
        <div style={{
          background: 'linear-gradient(135deg, #fff0f0 0%, #ffe0e0 100%)',
          border: '2px solid #ff3366',
          borderRadius: '0.75rem',
          padding: '1rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          color: '#cc0033',
          fontWeight: 600,
        }}>
          <span style={{ fontSize: '1.5rem' }}>⚠️</span>
          <div>
            <strong>Ce prêt nécessite une décision urgente.</strong>
            <div style={{ fontWeight: 400, fontSize: '0.88rem', marginTop: '0.2rem' }}>
              La demande est en attente depuis trop longtemps. Veuillez approuver ou rejeter cette demande dès que possible.
            </div>
          </div>
        </div>
      )}

      {/* Reminder History Banner */}
      {loan.informalReminderAt && (
        <div style={{
          background: '#fffbf0',
          border: '1px solid #f5a623',
          borderRadius: '0.75rem',
          padding: '0.75rem 1.25rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.75rem',
          fontSize: '0.9rem',
        }}>
          <span>📋</span>
          <div>
            <strong>Dernière relance informelle :</strong> {new Date(loan.informalReminderAt).toLocaleDateString('fr-FR')}
            {loan.informalReminderNotes && (
              <div style={{ color: '#666', marginTop: '0.2rem' }}>&ldquo;{loan.informalReminderNotes}&rdquo;</div>
            )}
          </div>
        </div>
      )}

      {/* Header Card */}
      <div className={styles.headerCard}>
        <div>
          <h1 className={styles.title}>Prêt de {borrowerName}</h1>
          <p className={styles.subtitle}>
            Statut : <strong style={isUrgent ? { color: '#ff3366' } : {}}>{STATUS_LABELS[loan.status] || loan.status}</strong>
          </p>
        </div>

        <div className={styles.headerActions}>
          {isBureau && loan.status === 'PENDING' && (
            <>
              <button className={styles.approveBtn} onClick={handleApprove} disabled={isSubmitting}>
                <span className="material-symbols-rounded">check_circle</span>
                {isSubmitting ? 'Traitement...' : 'Approuver le Prêt'}
              </button>
              <button className={styles.rejectBtn} onClick={handleReject} disabled={isSubmitting}>
                <span className="material-symbols-rounded">cancel</span>
                Rejeter / Désapprouver
              </button>
            </>
          )}

          {isBureau && (loan.status === 'APPROVED' || loan.status === 'AWAITING_URGENT_DECISION') && (
            <button
              onClick={() => setShowReminderModal(true)}
              style={{
                background: '#f5a623',
                color: '#fff',
                border: 'none',
                padding: '0.6rem 1rem',
                borderRadius: '0.5rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              📋 Relance Informelle
            </button>
          )}

          {(loan.status === 'APPROVED' || loan.status === 'DISBURSED') && loan.balanceRemaining > 0 && (
            <button className={styles.repayBtn} onClick={() => setShowRepayModal(true)}>
              <span className="material-symbols-rounded">payments</span>
              Enregistrer un remboursement
            </button>
          )}
        </div>
      </div>

      {/* Repayment Progress */}
      <div className={styles.progressSection}>
        <div className={styles.progressHeader}>
          <span>Avancement du remboursement ({progressPercent}%)</span>
          <span>
            {repaidAmount.toLocaleString('fr-FR')} XAF / {loan.totalToRepay.toLocaleString('fr-FR')} XAF
          </span>
        </div>
        <div className={styles.progressBarTrack}>
          <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Grid view */}
      <div className={styles.grid}>
        {/* Left column - Repayments History */}
        <div>
          <div className={styles.card}>
            <h2>Historique des Remboursements</h2>
            {loan.repayments.length === 0 ? (
              <p style={{ color: '#666', fontSize: '0.9rem' }}>Aucun remboursement effectué pour le moment.</p>
            ) : (
              <table className={styles.repaymentsTable}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Montant Remboursé</th>
                    <th>Note / Référence</th>
                  </tr>
                </thead>
                <tbody>
                  {loan.repayments.map((r) => (
                    <tr key={r.id}>
                      <td>{new Date(r.paidAt).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <strong>+{r.amount.toLocaleString('fr-FR')} XAF</strong>
                      </td>
                      <td>{r.notes || 'Remboursement prêt'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right column - Summary Info */}
        <div>
          <div className={styles.card}>
            <h2>Détails du Contrat</h2>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Capital initial</span>
              <span className={styles.infoValue}>{loan.amount.toLocaleString('fr-FR')} XAF</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Taux d'intérêt</span>
              <span className={styles.infoValue}>{loan.interestRate}%</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Total à rembourser</span>
              <span className={styles.infoValue}>{loan.totalToRepay.toLocaleString('fr-FR')} XAF</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Reste dû</span>
              <span className={styles.infoValue}>{loan.balanceRemaining.toLocaleString('fr-FR')} XAF</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Caisse source</span>
              <span className={styles.infoValue}>{loan.caisse?.name}</span>
            </div>
            {guarantorName && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Garant Solidaire</span>
                <span className={styles.infoValue} style={{ color: '#000', fontWeight: 600 }}>
                  🤝 {guarantorName}
                </span>
              </div>
            )}
            {loan.reason && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Motif</span>
                <span className={styles.infoValue}>{loan.reason}</span>
              </div>
            )}
            {loan.dueDate && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Date d'échéance</span>
                <span className={styles.infoValue}>{new Date(loan.dueDate).toLocaleDateString('fr-FR')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal - Repayment */}
      {showRepayModal && (
        <div className={styles.modalOverlay} onClick={() => setShowRepayModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Enregistrer un remboursement</h2>
              <button className={styles.closeBtn} onClick={() => setShowRepayModal(false)}>
                &times;
              </button>
            </div>

            {repayError && <div className={styles.alertError}>{repayError}</div>}

            <form onSubmit={handleRepaymentSubmit} className={styles.form}>
              <div className={styles.field}>
                <label>Montant du versement (XAF)</label>
                <input
                  type="number"
                  min="1"
                  max={loan.balanceRemaining}
                  required
                  placeholder={`max: ${loan.balanceRemaining}`}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(Number(e.target.value) || '')}
                />
              </div>

              <div className={styles.field}>
                <label>Notes / Référence du virement</label>
                <input
                  type="text"
                  placeholder="ex: Versement espèces en séance"
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting || !repayAmount}
              >
                {isSubmitting ? 'Enregistrement...' : 'Valider le remboursement'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal - Informal Reminder */}
      {showReminderModal && (
        <div className={styles.modalOverlay} onClick={() => setShowReminderModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>📋 Enregistrer une Relance Informelle</h2>
              <button className={styles.closeBtn} onClick={() => setShowReminderModal(false)}>
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1rem' }}>
              Enregistrez le contact informel avec le membre (appel téléphonique, message, etc.) pour tracer la démarche de recouvrement.
            </p>

            {reminderError && <div className={styles.alertError}>{reminderError}</div>}

            <form onSubmit={handleReminderSubmit} className={styles.form}>
              <div className={styles.field}>
                <label>Notes de la relance</label>
                <textarea
                  rows={4}
                  required
                  placeholder="ex: Contacté par téléphone le 28/07, promesse de paiement avant le 05/08."
                  value={reminderNotes}
                  onChange={(e) => setReminderNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.8rem',
                    borderRadius: '0.4rem',
                    border: '1px solid #ddd',
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmittingReminder || !reminderNotes.trim()}
                style={{ background: '#f5a623' }}
              >
                {isSubmittingReminder ? 'Enregistrement...' : '✓ Confirmer la Relance'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

