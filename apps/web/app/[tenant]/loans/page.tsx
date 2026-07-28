'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './loans.module.css';

interface Member {
  id: string;
  profile?: { firstName?: string; lastName?: string };
  userEmail?: string;
  memberNumber?: string;
}

interface Caisse {
  id: string;
  name: string;
  type: string;
  balance: number;
  isLoanable: boolean;
}

interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  totalToRepay: number;
  balanceRemaining: number;
  status: string;
  reason?: string | null;
  createdAt: string;
  borrower: {
    id: string;
    profile?: { firstName?: string; lastName?: string };
    user?: { email: string };
  };
  caisse: {
    id: string;
    name: string;
    type: string;
  };
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  APPROVED: 'Approuvé / En cours',
  COMPLETED: 'Remboursé',
  REJECTED: 'Rejeté',
};

export default function LoansPage() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || '';

  const [loans, setLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [caisses, setCaisses] = useState<Caisse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  // RBAC State
  const [userRole, setUserRole] = useState<string>('');
  const [currentMemberId, setCurrentMemberId] = useState<string>('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [borrowerId, setBorrowerId] = useState('');
  const [caisseId, setCaisseId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [interestRate, setInterestRate] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [guarantorMemberId, setGuarantorMemberId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // SLA Urgency Check
  const [isCheckingUrgency, setIsCheckingUrgency] = useState(false);

  useEffect(() => {
    if (tenantSlug) {
      initPage();
    }
  }, [tenantSlug]);

  const initPage = async () => {
    setLoading(true);
    try {
      // 1. Fetch user role and memberId for this association
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

      // 2. Fetch Loans (if member, fetch only personal loans)
      const loansUrl = isBureau
        ? `/api/backend/associations/${tenantSlug}/loans`
        : `/api/backend/associations/${tenantSlug}/loans?memberId=${mId}`;
      const loansRes = await fetch(loansUrl);
      if (loansRes.ok) setLoans(await loansRes.json());

      // 3. Fetch Members and Caisses
      fetchMembers();
      fetchCaisses();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async (role = userRole, mId = currentMemberId) => {
    const isBureau = role === 'PRESIDENT' || role === 'TREASURER' || role === 'SECRETARY';
    const loansUrl = isBureau
      ? `/api/backend/associations/${tenantSlug}/loans`
      : `/api/backend/associations/${tenantSlug}/loans?memberId=${mId}`;
    try {
      const res = await fetch(loansUrl);
      if (res.ok) setLoans(await res.json());
    } catch (e) {
      console.error(e);
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
        const data: Caisse[] = await res.json();
        // Only keep caisses that are loanable
        setCaisses(data.filter((c) => c.isLoanable));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isBureau = userRole === 'PRESIDENT' || userRole === 'TREASURER' || userRole === 'SECRETARY';

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetBorrowerId = isBureau ? borrowerId : currentMemberId;
    if (!targetBorrowerId || !caisseId || !amount || amount <= 0) return;
    setIsSubmitting(true);
    setModalError('');

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/loans/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          borrowerMemberId: targetBorrowerId,
          caisseId,
          amount: Number(amount),
          interestRate: Number(interestRate) || 0,
          reason,
          dueDate: dueDate || undefined,
          guarantorMemberId: guarantorMemberId || undefined,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setAmount('');
        setReason('');
        setBorrowerId('');
        setCaisseId('');
        setGuarantorMemberId('');
        fetchLoans();
      } else {
        const data = await res.json().catch(() => ({}));
        setModalError(data.message || 'Erreur lors de la demande de prêt.');
      }
    } catch (err) {
      setModalError('Erreur de connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckUrgency = async () => {
    setIsCheckingUrgency(true);
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/loans/check-urgency`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Vérification terminée. ${data.urgentLoansCount} prêt(s) marqué(s) comme URGENT.`);
        fetchLoans();
      } else {
        alert('Erreur lors de la vérification.');
      }
    } catch (e) {
      console.error(e);
      alert('Erreur de connexion.');
    } finally {
      setIsCheckingUrgency(false);
    }
  };

  const filteredLoans = loans.filter((loan) => {
    if (activeFilter === 'ALL') return true;
    return loan.status === activeFilter;
  });

  const totalGranted = loans
    .filter((l) => l.status === 'APPROVED' || l.status === 'COMPLETED')
    .reduce((sum, l) => sum + l.totalToRepay, 0);

  const totalRemaining = loans
    .filter((l) => l.status === 'APPROVED')
    .reduce((sum, l) => sum + l.balanceRemaining, 0);

  const activeCount = loans.filter((l) => l.status === 'APPROVED').length;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{isBureau ? 'Gestion des Prêts' : 'Mes Prêts Personnels'}</h1>
          <p className={styles.subtitle}>
            {isBureau
              ? 'Demandes de prêt, octrois, suivi des intérêts et remboursements de l\'association.'
              : 'Consultez l\'état de vos emprunts et soumettez vos demandes de prêt au bureau.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {(userRole === 'PRESIDENT' || userRole === 'TREASURER') && (
            <button 
              className={styles.outlineBtn} 
              onClick={handleCheckUrgency}
              disabled={isCheckingUrgency}
              style={{ background: '#fff', color: '#000', border: '1px solid #ddd', padding: '0.5rem 1rem', borderRadius: '0.4rem', fontWeight: 600, cursor: 'pointer' }}
            >
              {isCheckingUrgency ? 'Vérification SLA...' : '⚠️ Vérifier Urgence SLA'}
            </button>
          )}
          <button className={styles.createBtn} onClick={() => setShowModal(true)}>
            <span className="material-symbols-rounded">add</span>
            {isBureau ? 'Demander / Octroyer un prêt' : 'Soumettre une demande de prêt'}
          </button>
        </div>
      </header>

      {/* Summary Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={`material-symbols-rounded ${styles.statIcon}`}>handshake</span>
          <div>
            <div className={styles.statLabel}>Prêts Actifs en Cours</div>
            <div className={styles.statValue}>{activeCount}</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={`material-symbols-rounded ${styles.statIcon}`}>pending_actions</span>
          <div>
            <div className={styles.statLabel}>Solde Restant à Recouvrer</div>
            <div className={styles.statValue}>{totalRemaining.toLocaleString('fr-FR')} XAF</div>
          </div>
        </div>
        <div className={styles.statCard}>
          <span className={`material-symbols-rounded ${styles.statIcon}`}>account_balance</span>
          <div>
            <div className={styles.statLabel}>Total des Prêts Octroyés</div>
            <div className={styles.statValue}>{totalGranted.toLocaleString('fr-FR')} XAF</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        {['ALL', 'PENDING', 'APPROVED', 'COMPLETED', 'REJECTED'].map((filter) => (
          <button
            key={filter}
            className={`${styles.filterTab} ${activeFilter === filter ? styles.activeFilter : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter === 'ALL' ? 'Tous les prêts' : STATUS_LABELS[filter] || filter}
          </button>
        ))}
      </div>

      {/* Loans Table */}
      <div className={styles.tableCard}>
        {loading ? (
          <div className={styles.emptyState}>Chargement des prêts...</div>
        ) : filteredLoans.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={`material-symbols-rounded ${styles.emptyIcon}`}>handshake</span>
            <p>Aucun prêt trouvé pour ce filtre.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Emprunteur</th>
                <th>Caisse Source</th>
                <th>Montant Emprunté</th>
                <th>Intérêt</th>
                <th>Total à Rembourser</th>
                <th>Reste Dû</th>
                <th>Statut</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => {
                const borrowerName = loan.borrower?.profile
                  ? `${loan.borrower.profile.firstName} ${loan.borrower.profile.lastName || ''}`
                  : loan.borrower?.user?.email || 'Membre';

                return (
                  <tr key={loan.id}>
                    <td>
                      <div className={styles.memberName}>{borrowerName}</div>
                      <div className={styles.memberEmail}>{loan.borrower?.user?.email}</div>
                    </td>
                    <td>{loan.caisse?.name || 'Caisse'}</td>
                    <td>
                      <strong>{loan.amount.toLocaleString('fr-FR')} XAF</strong>
                    </td>
                    <td>{loan.interestRate}%</td>
                    <td>{loan.totalToRepay.toLocaleString('fr-FR')} XAF</td>
                    <td>
                      <strong>{loan.balanceRemaining.toLocaleString('fr-FR')} XAF</strong>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[`status_${loan.status}`] || styles.status_PENDING}`} style={loan.status === 'AWAITING_URGENT_DECISION' ? { background: '#fff0f0', color: '#ff3366', border: '1px solid #ff3366' } : {}}>
                        {loan.status === 'AWAITING_URGENT_DECISION' ? 'En Attente (URGENT)' : (STATUS_LABELS[loan.status] || loan.status)}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/${tenantSlug}/loans/${loan.id}`}
                        className={styles.actionLink}
                      >
                        Gérer →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal - Request Loan */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Nouvelle demande de prêt</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>

            {modalError && <div className={styles.alertError}>{modalError}</div>}

            <form onSubmit={handleRequestSubmit} className={styles.form}>
              {isBureau ? (
                <div className={styles.field}>
                  <label>Membre emprunteur</label>
                  <select
                    value={borrowerId}
                    onChange={(e) => setBorrowerId(e.target.value)}
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
              ) : (
                <div className={styles.field}>
                  <label>Demandeur du prêt</label>
                  <input
                    type="text"
                    readOnly
                    value="Votre compte personnel"
                    style={{ background: '#f5f5f5', color: '#666', cursor: 'not-allowed' }}
                  />
                  <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.2rem' }}>
                    Votre demande sera transmise automatiquement au bureau (Président / Trésorier) pour validation.
                  </p>
                </div>
              )}

              <div className={styles.field}>
                <label>Garant Solidaire (optionnel)</label>
                <select
                  value={guarantorMemberId}
                  onChange={(e) => setGuarantorMemberId(e.target.value)}
                >
                  <option value="">-- Aucun garant --</option>
                  {members
                    .filter((m) => m.id !== (isBureau ? borrowerId : currentMemberId))
                    .map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.profile?.firstName
                        ? `${m.profile.firstName} ${m.profile.lastName || ''}`
                        : m.userEmail || m.memberNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Caisse prêteuse (déduction du solde)</label>
                <select
                  value={caisseId}
                  onChange={(e) => setCaisseId(e.target.value)}
                  required
                >
                  <option value="">-- Sélectionner une caisse --</option>
                  {caisses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.balance.toLocaleString('fr-FR')} XAF disponibles)
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.field}>
                <label>Montant du prêt (XAF)</label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="ex: 50000"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value) || '')}
                />
              </div>

              <div className={styles.field}>
                <label>Taux d'intérêt (%)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="ex: 5 (pour 5%)"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
                />
              </div>

              <div className={styles.field}>
                <label>Motif de la demande</label>
                <input
                  type="text"
                  placeholder="ex: Projet personnel / Urgence santé"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label>Date limite de remboursement</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={isSubmitting || !(isBureau ? borrowerId : currentMemberId) || !caisseId || !amount}
              >
                {isSubmitting ? 'Enregistrement...' : 'Soumettre la demande'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
