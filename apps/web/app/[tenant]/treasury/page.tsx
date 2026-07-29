'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './treasury.module.css';
import ReceiptModal from '../../components/ReceiptModal';

interface Caisse {
  id: string;
  name: string;
  type: 'MAIN' | 'EMERGENCY' | 'INDIVIDUAL_SAVINGS' | 'COLLECTIVE_SAVINGS' | 'BANK_ACCOUNT' | 'MOBILE_MONEY';
  balance: number;
  isLoanable: boolean;
  createdAt: string;
}

interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  reference: string;
  description?: string | null;
  createdAt: string;
  caisse: { id: string; name: string };
  destinationCaisse?: { id: string; name: string } | null;
  member?: { profile?: { firstName?: string; lastName?: string }; user?: { email: string } } | null;
}

export default function TreasuryPage() {
  const routeParams = useParams();
  const tenantSlug = (routeParams?.tenant as string) || '';

  const [caisses, setCaisses] = useState<Caisse[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [activeTypeFilter, setActiveTypeFilter] = useState<string>('ALL');
  const [activeReceiptTxId, setActiveReceiptTxId] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newCaisseName, setNewCaisseName] = useState<string>('');
  const [newCaisseType, setNewCaisseType] = useState<string>('MAIN');
  const [isLoanable, setIsLoanable] = useState<boolean>(false);
  const [creating, setCreating] = useState<boolean>(false);

  useEffect(() => {
    if (tenantSlug) {
      fetchCaisses();
      fetchTransactions();
    }
  }, [tenantSlug]);

  const fetchCaisses = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/treasury/caisses`);
      if (res.ok) {
        const data = await res.json();
        setCaisses(data || []);
      } else {
        const errData = await res.json().catch(() => ({}));
        setError(errData.message || 'Erreur lors de la récupération des caisses.');
      }
    } catch (e: any) {
      console.error(e);
      setError('Erreur réseau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/treasury/transactions`);
      if (res.ok) {
        setTransactions(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCaisse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/treasury/caisses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCaisseName,
          type: newCaisseType,
          isLoanable,
        }),
      });

      if (res.ok) {
        setShowCreateModal(false);
        setNewCaisseName('');
        setNewCaisseType('MAIN');
        setIsLoanable(false);
        fetchCaisses();
      } else {
        const errData = await res.json();
        alert(errData.message || 'Erreur lors de la création de la caisse.');
      }
    } catch (err: any) {
      alert('Erreur réseau.');
    } finally {
      setCreating(false);
    }
  };

  const totalBalance = caisses.reduce((sum, c) => sum + (c.balance || 0), 0);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Trésorerie & Caisses</h1>
          <p className={styles.subtitle}>Gérez les fonds, épargnes et la caisse de secours de {tenantSlug}</p>
        </div>
        <button type="button" className={styles.createBtn} onClick={() => setShowCreateModal(true)}>
          <span className="material-symbols-rounded">account_balance_wallet</span>
          Nouvelle Caisse
        </button>
      </header>

      {error && (
        <div className={styles.errorAlert}>
          <span className="material-symbols-rounded">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Global stats */}
      <div className={styles.statsCard}>
        <div className={styles.statInfo}>
          <h2>Solde Global</h2>
          <p className={styles.statValue}>{totalBalance.toLocaleString('fr-FR')} XAF</p>
        </div>
        <span className="material-symbols-rounded" style={{ fontSize: '3rem', color: 'rgba(255,255,255,0.2)' }}>
          savings
        </span>
      </div>

      {loading ? (
        <div className={styles.loading}>Chargement des caisses...</div>
      ) : caisses.length === 0 ? (
        <div className={styles.emptyState}>
          <span className="material-symbols-rounded">account_balance</span>
          <h3>Aucune caisse trouvée</h3>
          <p>Créez votre première caisse pour commencer à gérer l'argent de l'association.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {caisses.map((caisse) => (
            <Link key={caisse.id} href={`/${tenantSlug}/treasury/${caisse.id}`} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.caisseName}>{caisse.name}</h3>
                <span className={styles.caisseTypeBadge}>{caisse.type.replace('_', ' ')}</span>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.caisseBalance}>
                  {(caisse.balance || 0).toLocaleString('fr-FR')} <small>XAF</small>
                </p>
                {caisse.isLoanable && (
                  <div className={styles.loanableBadge}>
                    <span className="material-symbols-rounded">verified</span>
                    Fonds prêtables
                  </div>
                )}
              </div>
              <div className={styles.cardFooter}>
                <span>Gérer cette caisse</span>
                <span className="material-symbols-rounded">arrow_forward</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Journal des Transactions Générales */}
      <div className={styles.historySection}>
        <div className={styles.historyHeader}>
          <h2 className={styles.historyTitle}>Journal Général des Transactions</h2>
          <div className={styles.historyFilters}>
            {['ALL', 'DEPOSIT', 'WITHDRAWAL', 'TRANSFER'].map((t) => (
              <button
                key={t}
                className={`${styles.filterBtn} ${activeTypeFilter === t ? styles.activeFilterBtn : ''}`}
                onClick={() => setActiveTypeFilter(t)}
              >
                {t === 'ALL' ? 'Toutes' : t === 'DEPOSIT' ? 'Dépôts' : t === 'WITHDRAWAL' ? 'Retraits' : 'Transferts'}
              </button>
            ))}
          </div>
        </div>

        {transactions.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '1.5rem' }}>
            Aucune transaction enregistrée pour le moment.
          </p>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className={styles.historyTable}>
              <thead>
              <tr>
                <th>Date & Réf.</th>
                <th>Caisse</th>
                <th>Opération</th>
                <th>Montant</th>
                <th>Membre / Motif</th>
                <th>Reçu</th>
              </tr>
            </thead>
            <tbody>
              {transactions
                .filter((tx) => activeTypeFilter === 'ALL' || tx.type === activeTypeFilter)
                .map((tx) => {
                  const mName = tx.member?.profile?.firstName
                    ? `${tx.member.profile.firstName} ${tx.member.profile.lastName || ''}`
                    : tx.member?.user?.email || '-';

                  return (
                    <tr key={tx.id}>
                      <td>
                        <div><strong>{tx.reference}</strong></div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          {new Date(tx.createdAt).toLocaleDateString('fr-FR')} {new Date(tx.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td>
                        <strong>{tx.caisse?.name || 'Caisse'}</strong>
                        {tx.destinationCaisse && (
                          <div style={{ fontSize: '0.75rem', color: '#666' }}>
                            &rarr; {tx.destinationCaisse.name}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={styles[`type${tx.type}`]}>
                          {tx.type === 'DEPOSIT' ? 'Entrée (+)' : tx.type === 'WITHDRAWAL' ? 'Sortie (-)' : 'Transfert (&harr;)'}
                        </span>
                      </td>
                      <td>
                        <strong>{tx.amount.toLocaleString('fr-FR')} XAF</strong>
                      </td>
                      <td>
                        <div>{mName}</div>
                        {tx.description && <div style={{ fontSize: '0.75rem', color: '#666' }}>{tx.description}</div>}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setActiveReceiptTxId(tx.id)}
                          className={styles.receiptLink}
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <span className="material-symbols-rounded" style={{ fontSize: '1rem' }}>receipt_long</span>
                          Reçu PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setShowCreateModal(false); }}>
          <div className={styles.modal}>
            <h2>Créer une nouvelle caisse</h2>
            <form onSubmit={handleCreateCaisse}>
              <div className={styles.field}>
                <label>Nom de la caisse</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Caisse de Secours 2026"
                  value={newCaisseName}
                  onChange={(e) => setNewCaisseName(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label>Type de caisse</label>
                <select value={newCaisseType} onChange={(e) => setNewCaisseType(e.target.value)}>
                  <option value="MAIN">Caisse Principale (Générale)</option>
                  <option value="EMERGENCY">Caisse de Secours (Sanctions / Aides)</option>
                  <option value="INDIVIDUAL_SAVINGS">Épargne Individuelle</option>
                  <option value="COLLECTIVE_SAVINGS">Épargne Collective</option>
                  <option value="BANK_ACCOUNT">Compte Bancaire</option>
                  <option value="MOBILE_MONEY">Mobile Money</option>
                </select>
              </div>

              <div className={styles.fieldRow}>
                <input
                  type="checkbox"
                  id="isLoanable"
                  checked={isLoanable}
                  onChange={(e) => setIsLoanable(e.target.checked)}
                />
                <label htmlFor="isLoanable">L'argent de cette caisse peut-il être utilisé pour accorder des prêts ?</label>
              </div>

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowCreateModal(false)}>Annuler</button>
                <button type="submit" className={styles.submitBtn} disabled={creating}>
                  {creating ? 'Création...' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
