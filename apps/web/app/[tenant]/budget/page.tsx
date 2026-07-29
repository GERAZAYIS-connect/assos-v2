'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './budget.module.css';

export default function BudgetDashboardPage() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || '';

  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [stats, setStats] = useState<any>(null);
  const [distribution, setDistribution] = useState<any>(null);
  const [historyDistributions, setHistoryDistributions] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showProfitModal, setShowProfitModal] = useState(false);
  const [modalError, setModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states for Annual Budget creation
  const [budgetTitle, setBudgetTitle] = useState(`Budget Prévisionnel ${new Date().getFullYear()}`);
  const [items, setItems] = useState<any[]>([
    { type: 'INCOME', category: '', estimatedAmount: 0, description: '' },
  ]);

  // Form states for Profit Distribution (Cassation) Simulation
  const [baseUnitAmount, setBaseUnitAmount] = useState(5000);
  const [partyExpenses, setPartyExpenses] = useState(0);
  const [retainedReserve, setRetainedReserve] = useState(0);

  useEffect(() => {
    if (tenantSlug) {
      initPage();
    }
  }, [tenantSlug, currentYear]);

  const initPage = async () => {
    setLoading(true);
    try {
      // 1. Fetch User Role
      const mineRes = await fetch('/api/backend/associations/mine');
      if (mineRes.ok) {
        const myAssocs = await mineRes.json();
        const current = myAssocs.find((a: any) => a.slug === tenantSlug || a.id === tenantSlug);
        if (current) setUserRole(current.role);
      }

      // 2. Fetch Budget Execution Stats
      const statsRes = await fetch(`/api/backend/associations/${tenantSlug}/budgets/${currentYear}`);
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      } else {
        setStats(null);
      }

      // 3. Fetch Profit Distribution for current year
      const distRes = await fetch(`/api/backend/associations/${tenantSlug}/budgets/${currentYear}/profit-distribution`);
      if (distRes.ok) {
        const distData = await distRes.json();
        setDistribution(distData);
      } else {
        setDistribution(null);
      }

      // 4. Fetch Historical Distributions
      const histRes = await fetch(`/api/backend/associations/${tenantSlug}/profit-distributions`);
      if (histRes.ok) {
        setHistoryDistributions(await histRes.json());
      }
    } catch (e) {
      console.error('Error loading budget dashboard:', e);
    } finally {
      setLoading(false);
    }
  };

  const isBureau = !userRole || userRole === 'PRESIDENT' || userRole === 'SECRETARY' || userRole === 'TREASURER' || userRole === 'ADMIN';

  const handleCreateBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          year: currentYear,
          title: budgetTitle,
          items,
        }),
      });

      if (res.ok) {
        setShowBudgetModal(false);
        initPage();
      } else {
        const data = await res.json().catch(() => ({}));
        setModalError(data.message || 'Erreur lors de la création du budget.');
      }
    } catch (e) {
      setModalError('Erreur de connexion.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSimulateProfit = async () => {
    setSubmitting(true);
    setModalError('');

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/budgets/${currentYear}/simulate-profit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          baseUnitAmount,
          partyExpenses,
          retainedReserve,
        }),
      });

      if (res.ok) {
        setShowProfitModal(false);
        initPage();
      } else {
        const data = await res.json().catch(() => ({}));
        setModalError(data.message || 'Erreur lors de la simulation de cassation.');
      }
    } catch (e) {
      setModalError('Erreur de connexion.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExecuteProfit = async () => {
    if (!confirm('Voulez-vous vraiment valider et exécuter la redistribution des bénéfices (Cassation) pour cet exercice ? Cette action est définitive.')) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/budgets/${currentYear}/execute-profit`, {
        method: 'POST',
      });

      if (res.ok) {
        initPage();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Erreur lors de la validation.');
      }
    } catch (e) {
      alert('Erreur de connexion.');
    } finally {
      setSubmitting(false);
    }
  };

  const openBudgetModal = () => {
    if (stats?.items && stats.items.length > 0) {
      setItems(
        stats.items.map((it: any) => ({
          caisseId: it.caisseId || undefined,
          type: it.type,
          category: it.category,
          estimatedAmount: it.estimatedAmount,
          description: it.description || '',
        }))
      );
    } else {
      setItems([{ type: 'INCOME', category: '', estimatedAmount: 0, description: '' }]);
    }
    setShowBudgetModal(true);
  };

  const addItemRow = () => {
    setItems([...items, { type: 'EXPENSE', category: '', estimatedAmount: 0, description: '' }]);
  };

  const updateItemRow = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const removeItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Budget Prévisionnel & Rapports Financiers</h1>
          <p className={styles.subtitle}>
            Suivi d'exécution budgétaire, bilans comptables et redistribution des bénéfices (Cassation).
          </p>
        </div>

        <div className={styles.actionBox}>
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value, 10))}
            style={{ padding: '0.6rem 1rem', borderRadius: '0.5rem', fontWeight: 700, border: '1px solid #ccc' }}
          >
            <option value={2026}>Exercice 2026</option>
            <option value={2025}>Exercice 2025</option>
            <option value={2024}>Exercice 2024</option>
          </select>

          {isBureau && (
            <>
              <button className={styles.secondaryBtn} onClick={() => setShowProfitModal(true)}>
                <span className="material-symbols-rounded">payments</span>
                Redistribution des Bénéfices (Cassation)
              </button>
              <button className={styles.primaryBtn} onClick={openBudgetModal}>
                <span className="material-symbols-rounded">add</span>
                Créer / Modifier le Budget {currentYear}
              </button>
            </>
          )}
        </div>
      </header>

      {/* KPI Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div>
            <p className={styles.statLabel}>Épargne Globale Cumulée</p>
            <p className={styles.statValue}>
              {stats?.totalGlobalSavings?.toLocaleString('fr-FR') || 0} FCFA
            </p>
            <span className={styles.statSub} style={{ color: '#15803d', fontWeight: 700 }}>
              Total fonds épargnés par les membres
            </span>
          </div>
          <span className="material-symbols-rounded" style={{ fontSize: '2rem', opacity: 0.3 }}>
            savings
          </span>
        </div>

        <div className={styles.statCard}>
          <div>
            <p className={styles.statLabel}>Bénéfices Intérêts de Prêts</p>
            <p className={styles.statValue} style={{ color: '#15803d' }}>
              {stats?.totalLoanInterestProfit?.toLocaleString('fr-FR') || 0} FCFA
            </p>
            <span className={styles.statSub} style={{ color: '#666' }}>
              Gains d'intérêts perçus sur remboursements
            </span>
          </div>
          <span className="material-symbols-rounded" style={{ fontSize: '2rem', opacity: 0.3 }}>
            percent
          </span>
        </div>

        <div className={styles.statCard}>
          <div>
            <p className={styles.statLabel}>Recettes Réelles / Prévision</p>
            <p className={styles.statValue}>
              {stats?.totalRealIncome?.toLocaleString('fr-FR') || 0} FCFA
            </p>
            <span className={styles.statSub} style={{ color: (stats?.executionIncomePercentage || 0) >= 100 ? '#15803d' : '#666' }}>
              Prévisionnel : {stats?.totalEstimatedIncome?.toLocaleString('fr-FR') || 0} FCFA ({stats?.executionIncomePercentage || 0}%)
            </span>
          </div>
          <span className="material-symbols-rounded" style={{ fontSize: '2rem', opacity: 0.3 }}>
            trending_up
          </span>
        </div>

        <div className={styles.statCard}>
          <div>
            <p className={styles.statLabel}>Excédent Net (Bénéfice Réel Total)</p>
            <p className={styles.statValue} style={{ color: (stats?.netRealProfit || 0) >= 0 ? '#15803d' : '#991b1b' }}>
              {stats?.netRealProfit?.toLocaleString('fr-FR') || 0} FCFA
            </p>
            <span className={styles.statSub} style={{ color: '#555' }}>
              Disponible pour Cassation / Réserve
            </span>
          </div>
          <span className="material-symbols-rounded" style={{ fontSize: '2rem', opacity: 0.3 }}>
            account_balance_wallet
          </span>
        </div>
      </div>

      {/* Rapprochement & Suivi d'Exécution Budgétaire */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="material-symbols-rounded">assessment</span> Tableau de Suivi d'Exécution Budgétaire ({currentYear})
          </span>
          <button className={styles.secondaryBtn} onClick={() => window.print()}>
            <span className="material-symbols-rounded">print</span>
            Imprimer Bilan
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Chargement du budget...</div>
        ) : !stats || !stats.items || stats.items.length === 0 ? (
          <div className={styles.emptyState}>
            <span className="material-symbols-rounded" style={{ fontSize: '3rem' }}>assessment</span>
            <h3>Aucun budget prévisionnel défini pour l'année {currentYear}</h3>
            <p>Cliquez sur "Créer / Modifier le Budget {currentYear}" pour définir les recettes et dépenses estimées.</p>
          </div>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className={styles.table}>
              <thead>
              <tr>
                <th>Type</th>
                <th>Poste / Catégorie</th>
                <th>Montant Prévisionnel</th>
                <th>Réalisé (Réel)</th>
                <th>Taux d'Exécution (%)</th>
              </tr>
            </thead>
            <tbody>
              {stats.items.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td>
                    <span style={{ fontWeight: 700, color: item.type === 'INCOME' ? '#15803d' : '#991b1b' }}>
                      {item.type === 'INCOME' ? 'RECETTE' : 'DÉPENSE'}
                    </span>
                  </td>
                  <td><strong>{item.category}</strong> {item.description && <span style={{ color: '#666', fontSize: '0.8rem' }}>({item.description})</span>}</td>
                  <td>{item.estimatedAmount?.toLocaleString('fr-FR')} FCFA</td>
                  <td><strong>{item.realAmount?.toLocaleString('fr-FR')} FCFA</strong></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div className={styles.progressBarContainer} style={{ flex: 1 }}>
                        <div
                          className={styles.progressBarFill}
                          style={{
                            width: `${Math.min(item.executionPercentage, 100)}%`,
                            background: item.type === 'INCOME' ? '#15803d' : item.executionPercentage > 100 ? '#991b1b' : '#000',
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.executionPercentage}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Redistribution des Bénéfices / Cassation (Section 5.8) */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="material-symbols-rounded">payments</span> Redistribution des Bénéfices & Procès de "Cassation" (Fin d'Exercice)
          </span>
          {distribution && distribution.status === 'SIMULATED' && isBureau && (
            <button className={styles.primaryBtn} onClick={handleExecuteProfit} disabled={submitting}>
              <span className="material-symbols-rounded">check_circle</span>
              Valider & Exécuter la Redistribution
            </button>
          )}
        </div>

        {!distribution ? (
          <div className={styles.emptyState}>
            <span className="material-symbols-rounded" style={{ fontSize: '3rem' }}>savings</span>
            <h3>Aucune redistribution configurée pour {currentYear}</h3>
            <p>Le bureau peut calculer et redistribuer les bénéfices (intérêts des prêts + amendes) au prorata des <strong>Mois-Épargne</strong> par membre.</p>
            {isBureau && (
              <button className={styles.secondaryBtn} onClick={() => setShowProfitModal(true)} style={{ marginTop: '1rem' }}>
                Lancer la Simulation de Cassation
              </button>
            )}
          </div>
        ) : (
          <div>
            <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '1.25rem', borderRadius: '0.75rem', marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Statut</span>
                <p style={{ margin: 0, fontWeight: 800, color: distribution.status === 'EXECUTED' ? '#15803d' : '#d97706' }}>
                  {distribution.status === 'EXECUTED' ? '✓ EXÉCUTÉ ET PAYÉ' : '⏳ SIMULÉ (En attente de validation)'}
                </p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Unité de Base (B)</span>
                <p style={{ margin: 0, fontWeight: 800 }}>{distribution.baseUnitAmount?.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Bénéfice Net Redistribuable</span>
                <p style={{ margin: 0, fontWeight: 800, color: '#15803d' }}>{distribution.distributableProfit?.toLocaleString('fr-FR')} FCFA</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Gain par Mois-Épargne (C)</span>
                <p style={{ margin: 0, fontWeight: 800 }}>{Math.round(distribution.monthlyGainCoeff * 100) / 100} FCFA / mois-unité</p>
              </div>
            </div>

            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.75rem' }}>Bordereau Individuel de Cassation par Membre</h3>
            <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className={styles.table}>
                <thead>
                <tr>
                  <th>Membre</th>
                  <th>Épargne Accumulée</th>
                  <th>Mois-Épargne ($ME$)</th>
                  <th>Ristourne / Bénéfice ($P$)</th>
                  <th>Total Reversé</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {distribution.items?.map((item: any) => {
                  const name = item.member?.profile?.firstName
                    ? `${item.member.profile.firstName} ${item.member.profile.lastName || ''}`
                    : item.member?.user?.email || 'Membre';

                  return (
                    <tr key={item.id}>
                      <td><strong>{name}</strong></td>
                      <td>{item.totalSavings?.toLocaleString('fr-FR')} FCFA</td>
                      <td>{item.monthSavings} M-E</td>
                      <td><strong style={{ color: '#15803d' }}>+{item.dividendAmount?.toLocaleString('fr-FR')} FCFA</strong></td>
                      <td><strong style={{ fontSize: '1rem' }}>{item.totalPayout?.toLocaleString('fr-FR')} FCFA</strong></td>
                      <td>
                        <span style={{ fontWeight: 700, color: item.status === 'PAID' ? '#15803d' : '#d97706' }}>
                          {item.status === 'PAID' ? '✓ Payé' : 'En attente'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Historique des Cassations & Clôtures d'Exercice (ACID) */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <span className="material-symbols-rounded">history</span> Historique des Cassations & Clôtures (Garantie Transactionnelle ACID)
          </span>
        </div>

        {historyDistributions.length === 0 ? (
          <p style={{ color: '#666', fontStyle: 'italic' }}>Aucun historique d'exercice clôturé pour le moment.</p>
        ) : (
          <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className={styles.table}>
              <thead>
                <tr>
                <th>Exercice</th>
                <th>Bénéfice Net</th>
                <th>Montant Distribuable</th>
                <th>Mois-Épargne Total</th>
                <th>Coefficient (C)</th>
                <th>Statut</th>
                <th>Date d'Exécution</th>
              </tr>
            </thead>
            <tbody>
              {historyDistributions.map((h: any) => (
                <tr key={h.id}>
                  <td><strong>Exercice {h.year}</strong></td>
                  <td>{h.netProfit?.toLocaleString('fr-FR')} FCFA</td>
                  <td><strong style={{ color: '#15803d' }}>{h.distributableProfit?.toLocaleString('fr-FR')} FCFA</strong></td>
                  <td>{h.totalMonthSavings} M-E</td>
                  <td>{Math.round(h.monthlyGainCoeff * 100) / 100} FCFA</td>
                  <td>
                    <span style={{ fontWeight: 700, color: h.status === 'EXECUTED' ? '#15803d' : '#d97706' }}>
                      {h.status === 'EXECUTED' ? '✓ EXÉCUTÉ (ACID)' : 'SIMULATION'}
                    </span>
                  </td>
                  <td>{h.executedAt ? new Date(h.executedAt).toLocaleDateString('fr-FR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Modal Créer Budget */}
      {showBudgetModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Créer / Éditer le Budget Prévisionnel {currentYear}</h2>
              <button className={styles.closeBtn} onClick={() => setShowBudgetModal(false)}>&times;</button>
            </div>

            {modalError && <div className={styles.alertError}>{modalError}</div>}

            <form onSubmit={handleCreateBudgetSubmit}>
              <div className={styles.field}>
                <label>Titre du Budget</label>
                <input type="text" value={budgetTitle} onChange={(e) => setBudgetTitle(e.target.value)} required />
              </div>

              <h4 style={{ margin: '1rem 0 0.5rem 0' }}>Postes Prévisionnels (Recettes & Dépenses)</h4>
              {items.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                  <select
                    value={it.type}
                    onChange={(e) => updateItemRow(idx, 'type', e.target.value)}
                    style={{ width: '130px', padding: '0.5rem' }}
                  >
                    <option value="INCOME">Recette (+)</option>
                    <option value="EXPENSE">Dépense (-)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Catégorie / Intitulé"
                    value={it.category}
                    onChange={(e) => updateItemRow(idx, 'category', e.target.value)}
                    style={{ flex: 1, padding: '0.5rem' }}
                    required
                  />
                  <input
                    type="number"
                    placeholder="Montant FCFA"
                    value={it.estimatedAmount}
                    onChange={(e) => updateItemRow(idx, 'estimatedAmount', parseFloat(e.target.value) || 0)}
                    style={{ width: '130px', padding: '0.5rem' }}
                    required
                  />
                  <button type="button" onClick={() => removeItemRow(idx)} style={{ background: 'none', border: 'none', color: '#991b1b', cursor: 'pointer', fontWeight: 700 }}>&times;</button>
                </div>
              ))}

              <button type="button" className={styles.secondaryBtn} onClick={addItemRow} style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                + Ajouter une ligne budgétaire
              </button>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button type="button" className={styles.secondaryBtn} onClick={() => setShowBudgetModal(false)}>Annuler</button>
                <button type="submit" className={styles.primaryBtn} disabled={submitting}>
                  {submitting ? 'Enregistrement...' : 'Enregistrer le Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Simulation Profit Cassation */}
      {showProfitModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Simulation de Redistribution ("Cassation" - Sec. 5.8)</h2>
              <button className={styles.closeBtn} onClick={() => setShowProfitModal(false)}>&times;</button>
            </div>

            {modalError && <div className={styles.alertError}>{modalError}</div>}

            <div className={styles.field}>
              <label>Unité de Base B (Tranche d'Épargne FCFA)</label>
              <input
                type="number"
                value={baseUnitAmount}
                onChange={(e) => setBaseUnitAmount(parseFloat(e.target.value) || 5000)}
              />
              <span style={{ fontSize: '0.8rem', color: '#666' }}>Par défaut : 5 000 FCFA pour l'épargne ordinaire.</span>
            </div>

            <div className={styles.field}>
              <label>Dépenses de Réception / Frais de Fête de Cassation (FCFA)</label>
              <input
                type="number"
                value={partyExpenses}
                onChange={(e) => setPartyExpenses(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className={styles.field}>
              <label>Part conservée en Report à Nouveau / Réserve (FCFA)</label>
              <input
                type="number"
                value={retainedReserve}
                onChange={(e) => setRetainedReserve(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className={styles.secondaryBtn} onClick={() => setShowProfitModal(false)}>Annuler</button>
              <button type="button" className={styles.primaryBtn} onClick={handleSimulateProfit} disabled={submitting}>
                {submitting ? 'Calcul en cours...' : 'Calculer les Ristournes par Membre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
