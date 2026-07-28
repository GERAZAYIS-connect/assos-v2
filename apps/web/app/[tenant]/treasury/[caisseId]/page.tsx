'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './caisse-details.module.css';
import ReceiptModal from '../../../components/ReceiptModal';

interface Caisse {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface Member {
  id: string;
  profile?: { firstName?: string; lastName?: string };
  userEmail?: string;
  memberNumber?: string;
}

type TabType = 'SAVINGS' | 'TRANSACTION' | 'TRANSFER' | 'HISTORY';

interface CaisseTransaction {
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

export default function CaisseDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = (params?.tenant as string) || '';
  const caisseId = (params?.caisseId as string) || '';

  const [caisse, setCaisse] = useState<Caisse | null>(null);
  const [allCaisses, setAllCaisses] = useState<Caisse[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [caisseTransactions, setCaisseTransactions] = useState<CaisseTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>('SAVINGS');

  // Form states - Savings
  const [selectedMemberId, setSelectedMemberId] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [operationType, setOperationType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [memberBalance, setMemberBalance] = useState<number | null>(null);

  // Form states - Transaction (General)
  const [transDesc, setTransDesc] = useState('');
  const [transType, setTransType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [transAmount, setTransAmount] = useState<number | ''>('');

  // Form states - Transfer
  const [destCaisseId, setDestCaisseId] = useState('');
  const [transferAmount, setTransferAmount] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);
  const [activeReceiptTxId, setActiveReceiptTxId] = useState<string | null>(null);
  const [transferDesc, setTransferDesc] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tenantSlug && caisseId) {
      fetchCaisses();
      fetchMembers();
      fetchCaisseTransactions();
    }
  }, [tenantSlug, caisseId]);

  const fetchCaisseTransactions = async () => {
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/treasury/transactions?caisseId=${caisseId}`);
      if (res.ok) {
        setCaisseTransactions(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (selectedMemberId && caisseId && activeTab === 'SAVINGS') {
      fetchMemberBalance(selectedMemberId);
    } else {
      setMemberBalance(null);
    }
  }, [selectedMemberId, activeTab]);

  const fetchCaisses = async () => {
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/treasury/caisses`);
      if (res.ok) {
        const data = await res.json();
        setAllCaisses(data);
        const found = data.find((c: any) => c.id === caisseId);
        if (found) setCaisse(found);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/members`);
      if (res.ok) {
        setMembers(await res.json());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchMemberBalance = async (memberId: string) => {
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/caisses/${caisseId}/members/${memberId}/savings`);
      if (res.ok) {
        const data = await res.json();
        setMemberBalance(data.balance);
      } else {
        setMemberBalance(0);
      }
    } catch {
      setMemberBalance(0);
    }
  };

  const handleSavingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId || !amount || amount <= 0) return;
    setIsSubmitting(true);
    setMessage(null);

    const endpoint = operationType === 'DEPOSIT' 
      ? `/api/backend/associations/${tenantSlug}/caisses/${caisseId}/savings/deposit`
      : `/api/backend/associations/${tenantSlug}/caisses/${caisseId}/savings/withdraw`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          memberId: selectedMemberId,
          amount: Number(amount),
          description: operationType === 'DEPOSIT' ? 'Dépôt sur épargne' : 'Retrait sur épargne',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastTransactionId(data.id ?? null);
        setMessage({ type: 'success', text: `Opération réussie. Transaction: ${data.reference || 'OK'}` });
        setAmount('');
        fetchCaisses();
        fetchMemberBalance(selectedMemberId);
      } else {
        setMessage({ type: 'error', text: data.message || 'Erreur lors de l’opération.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur de connexion au serveur.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transAmount || transAmount <= 0) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/treasury/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caisseId,
          type: transType,
          amount: Number(transAmount),
          description: transDesc,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastTransactionId(data.id ?? null);
        setMessage({ type: 'success', text: 'Transaction enregistrée avec succès.' });
        setTransAmount('');
        setTransDesc('');
        fetchCaisses();
      } else {
        setMessage({ type: 'error', text: data.message || 'Erreur lors de la transaction.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur de connexion.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferAmount || transferAmount <= 0 || !destCaisseId) return;
    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/treasury/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceCaisseId: caisseId,
          destinationCaisseId: destCaisseId,
          amount: Number(transferAmount),
          description: transferDesc || 'Transfert de fonds',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setLastTransactionId(data.id ?? null);
        setMessage({ type: 'success', text: 'Transfert effectué avec succès.' });
        setTransferAmount('');
        setTransferDesc('');
        setDestCaisseId('');
        fetchCaisses();
      } else {
        setMessage({ type: 'error', text: data.message || 'Erreur lors du transfert.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Erreur de connexion.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Chargement...</div>;
  if (!caisse) return <div className={styles.errorAlert}>Caisse introuvable.</div>;

  return (
    <div className={styles.container}>
      <Link href={`/${tenantSlug}/treasury`} className={styles.backBtn}>
        <span className="material-symbols-rounded">arrow_back</span>
        Retour aux caisses
      </Link>

      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{caisse.name}</h1>
          <p className={styles.subtitle}>Type: {caisse.type.replace('_', ' ')}</p>
        </div>
        <div className={styles.caisseBalance}>
          Solde Total: <strong>{(caisse.balance || 0).toLocaleString('fr-FR')} XAF</strong>
        </div>
      </header>

      {message && (
        <div className={message.type === 'success' ? styles.successAlert : styles.errorAlert}>
          <span className="material-symbols-rounded">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{message.text}</span>
          {message.type === 'success' && lastTransactionId && (
            <button
              type="button"
              onClick={() => setActiveReceiptTxId(lastTransactionId)}
              className={styles.receiptLink}
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <span className="material-symbols-rounded">receipt_long</span>
              Voir le reçu
            </button>
          )}
        </div>
      )}

      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'SAVINGS' ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('SAVINGS'); setMessage(null); }}
        >
          <span className="material-symbols-rounded">savings</span>
          Épargne Membre
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'TRANSACTION' ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('TRANSACTION'); setMessage(null); }}
        >
          <span className="material-symbols-rounded">receipt_long</span>
          Opération Générale
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'TRANSFER' ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('TRANSFER'); setMessage(null); }}
        >
          <span className="material-symbols-rounded">sync_alt</span>
          Transfert
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'HISTORY' ? styles.activeTab : ''}`}
          onClick={() => { setActiveTab('HISTORY'); setMessage(null); }}
        >
          <span className="material-symbols-rounded">history</span>
          Historique ({caisseTransactions.length})
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.mainPanel}>
          <div className={styles.operationCard}>

            {/* SAVINGS TAB */}
            {activeTab === 'SAVINGS' && (
              <>
                <h2>Épargne / Cotisation d'un membre</h2>
                <p className={styles.cardDesc}>Enregistrez un dépôt ou un retrait pour un membre spécifique.</p>
                <form onSubmit={handleSavingsSubmit} className={styles.form}>
                  <div className={styles.field}>
                    <label>Membre de l'association</label>
                    <select 
                      value={selectedMemberId} 
                      onChange={(e) => setSelectedMemberId(e.target.value)}
                      required
                    >
                      <option value="">-- Sélectionner un membre --</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.profile?.firstName ? `${m.profile.firstName} ${m.profile.lastName || ''}` : (m.userEmail || m.memberNumber)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedMemberId && memberBalance !== null && (
                    <div className={styles.memberBalanceInfo}>
                      Solde actuel du membre : <strong>{memberBalance.toLocaleString('fr-FR')} XAF</strong>
                    </div>
                  )}

                  <div className={styles.row}>
                    <div className={styles.field} style={{ flex: 1 }}>
                      <label>Type d'opération</label>
                      <div className={styles.radioGroup}>
                        <label className={`${styles.radioBtn} ${operationType === 'DEPOSIT' ? styles.radioDeposit : ''}`}>
                          <input type="radio" name="opType" value="DEPOSIT" checked={operationType === 'DEPOSIT'} onChange={() => setOperationType('DEPOSIT')} />
                          <span className="material-symbols-rounded">arrow_downward</span> Dépôt
                        </label>
                        <label className={`${styles.radioBtn} ${operationType === 'WITHDRAWAL' ? styles.radioWithdraw : ''}`}>
                          <input type="radio" name="opType" value="WITHDRAWAL" checked={operationType === 'WITHDRAWAL'} onChange={() => setOperationType('WITHDRAWAL')} />
                          <span className="material-symbols-rounded">arrow_upward</span> Retrait
                        </label>
                      </div>
                    </div>
                    <div className={styles.field} style={{ flex: 1 }}>
                      <label>Montant (XAF)</label>
                      <input type="number" min="1" required placeholder="ex: 10000" value={amount} onChange={(e) => setAmount(Number(e.target.value) || '')} />
                    </div>
                  </div>

                  <button type="submit" className={styles.submitBtn} disabled={isSubmitting || !selectedMemberId || !amount}>
                    {isSubmitting ? 'Traitement...' : 'Valider'}
                  </button>
                </form>
              </>
            )}

            {/* GENERAL TRANSACTION TAB */}
            {activeTab === 'TRANSACTION' && (
              <>
                <h2>Opération Générale (Dépense / Recette)</h2>
                <p className={styles.cardDesc}>Enregistrez un achat, un don, ou une dépense pour l'association globale.</p>
                <form onSubmit={handleTransactionSubmit} className={styles.form}>
                  <div className={styles.field}>
                    <label>Description (Motif)</label>
                    <input type="text" required placeholder="ex: Achat de chaises" value={transDesc} onChange={(e) => setTransDesc(e.target.value)} />
                  </div>
                  
                  <div className={styles.row}>
                    <div className={styles.field} style={{ flex: 1 }}>
                      <label>Flux financier</label>
                      <div className={styles.radioGroup}>
                        <label className={`${styles.radioBtn} ${transType === 'DEPOSIT' ? styles.radioDeposit : ''}`}>
                          <input type="radio" name="gType" value="DEPOSIT" checked={transType === 'DEPOSIT'} onChange={() => setTransType('DEPOSIT')} />
                          <span className="material-symbols-rounded">arrow_downward</span> Recette
                        </label>
                        <label className={`${styles.radioBtn} ${transType === 'WITHDRAWAL' ? styles.radioWithdraw : ''}`}>
                          <input type="radio" name="gType" value="WITHDRAWAL" checked={transType === 'WITHDRAWAL'} onChange={() => setTransType('WITHDRAWAL')} />
                          <span className="material-symbols-rounded">arrow_upward</span> Dépense
                        </label>
                      </div>
                    </div>
                    <div className={styles.field} style={{ flex: 1 }}>
                      <label>Montant (XAF)</label>
                      <input type="number" min="1" required placeholder="ex: 5000" value={transAmount} onChange={(e) => setTransAmount(Number(e.target.value) || '')} />
                    </div>
                  </div>

                  <button type="submit" className={styles.submitBtn} disabled={isSubmitting || !transAmount}>
                    {isSubmitting ? 'Traitement...' : 'Valider l\'opération'}
                  </button>
                </form>
              </>
            )}

            {/* TRANSFER TAB */}
            {activeTab === 'TRANSFER' && (
              <>
                <h2>Transfert de fonds</h2>
                <p className={styles.cardDesc}>Déplacez de l'argent de cette caisse vers une autre caisse de l'association.</p>
                <form onSubmit={handleTransferSubmit} className={styles.form}>
                  <div className={styles.field}>
                    <label>Caisse de destination</label>
                    <select value={destCaisseId} onChange={(e) => setDestCaisseId(e.target.value)} required>
                      <option value="">-- Sélectionner une caisse --</option>
                      {allCaisses.filter(c => c.id !== caisseId).map(c => (
                        <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.row}>
                    <div className={styles.field} style={{ flex: 1 }}>
                      <label>Montant à transférer (XAF)</label>
                      <input type="number" min="1" required placeholder="ex: 20000" value={transferAmount} onChange={(e) => setTransferAmount(Number(e.target.value) || '')} />
                    </div>
                    <div className={styles.field} style={{ flex: 2 }}>
                      <label>Motif (Optionnel)</label>
                      <input type="text" placeholder="ex: Alimentation compte bancaire" value={transferDesc} onChange={(e) => setTransferDesc(e.target.value)} />
                    </div>
                  </div>

                  <button type="submit" className={styles.submitBtn} disabled={isSubmitting || !destCaisseId || !transferAmount}>
                    {isSubmitting ? 'Traitement...' : 'Effectuer le transfert'}
                  </button>
                </form>
              </>
            )}

            {/* HISTORY TAB */}
            {activeTab === 'HISTORY' && (
              <>
                <h2>Historique des transactions de cette caisse</h2>
                <p className={styles.cardDesc}>Toutes les entrées, sorties et transferts enregistrés sur {caisse.name}.</p>
                {caisseTransactions.length === 0 ? (
                  <p style={{ padding: '1.5rem', textAlign: 'center', color: '#666' }}>Aucune transaction sur cette caisse.</p>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                      <tr style={{ background: '#f5f5f5', borderBottom: '1px solid #ddd', textAlign: 'left', fontSize: '0.8rem' }}>
                        <th style={{ padding: '0.75rem' }}>Date & Réf.</th>
                        <th style={{ padding: '0.75rem' }}>Type</th>
                        <th style={{ padding: '0.75rem' }}>Montant</th>
                        <th style={{ padding: '0.75rem' }}>Membre / Motif</th>
                        <th style={{ padding: '0.75rem' }}>Reçu</th>
                      </tr>
                    </thead>
                    <tbody>
                      {caisseTransactions.map((tx) => {
                        const mName = tx.member?.profile?.firstName
                          ? `${tx.member.profile.firstName} ${tx.member.profile.lastName || ''}`
                          : tx.member?.user?.email || '-';

                        return (
                          <tr key={tx.id} style={{ borderBottom: '1px solid #eee', fontSize: '0.85rem' }}>
                            <td style={{ padding: '0.75rem' }}>
                              <div><strong>{tx.reference}</strong></div>
                              <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                {new Date(tx.createdAt).toLocaleDateString('fr-FR')} {new Date(tx.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>
                            <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                              {tx.type === 'DEPOSIT' ? 'Entrée (+)' : tx.type === 'WITHDRAWAL' ? 'Sortie (-)' : 'Transfert (&harr;)'}
                            </td>
                            <td style={{ padding: '0.75rem', fontWeight: 700 }}>
                              {tx.amount.toLocaleString('fr-FR')} XAF
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <div>{mName}</div>
                              {tx.description && <div style={{ fontSize: '0.75rem', color: '#666' }}>{tx.description}</div>}
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                              <button
                                type="button"
                                onClick={() => setActiveReceiptTxId(tx.id)}
                                style={{ color: '#000', fontWeight: 600, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                              >
                                PDF
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </>
            )}

          </div>
        </div>

        <div className={styles.sidePanel}>
          <div className={styles.infoCard}>
            <span className="material-symbols-rounded">
              {activeTab === 'SAVINGS' ? 'savings' : activeTab === 'TRANSACTION' ? 'receipt_long' : 'sync_alt'}
            </span>
            <h3>{activeTab === 'SAVINGS' ? 'Épargne Membre' : activeTab === 'TRANSACTION' ? 'Opération Générale' : 'Transfert'}</h3>
            {activeTab === 'SAVINGS' && <p>Permet d'affecter des fonds directement au compte d'épargne d'un membre.</p>}
            {activeTab === 'TRANSACTION' && <p>Impacte uniquement le solde global de la caisse, sans lien avec un membre. Idéal pour les achats ou subventions.</p>}
            {activeTab === 'TRANSFER' && <p>Déduit le montant de la caisse courante et l'ajoute instantanément à la caisse de destination choisie.</p>}
          </div>
        </div>
      </div>

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
