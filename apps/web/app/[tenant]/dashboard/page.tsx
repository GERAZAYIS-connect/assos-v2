'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './dashboard.module.css';

export default function TenantDashboardPage() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || '';

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<{
    membersCount: number;
    totalTreasuryBalance: number;
    tontinesCount: number;
    loansCount: number;
    totalLoansAmount: number;
    unreadNotifications: number;
    budgetExecutionRate: number;
    upcomingMeetingTitle: string | null;
  }>({
    membersCount: 0,
    totalTreasuryBalance: 0,
    tontinesCount: 0,
    loansCount: 0,
    totalLoansAmount: 0,
    unreadNotifications: 0,
    budgetExecutionRate: 0,
    upcomingMeetingTitle: null,
  });

  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    if (tenantSlug) {
      loadDashboardData();
    }
  }, [tenantSlug]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Members
      const membersRes = await fetch(`/api/backend/associations/${tenantSlug}/members`);
      let membersCount = 0;
      if (membersRes.ok) {
        const membersData = await membersRes.json();
        membersCount = Array.isArray(membersData) ? membersData.length : 0;
      }

      // 2. Fetch Treasury Caisses
      const caissesRes = await fetch(`/api/backend/associations/${tenantSlug}/caisses`);
      let totalTreasuryBalance = 0;
      if (caissesRes.ok) {
        const caissesData = await caissesRes.json();
        if (Array.isArray(caissesData)) {
          totalTreasuryBalance = caissesData.reduce((sum: number, c: any) => sum + (c.balance || 0), 0);
        }
      }

      // 3. Fetch Tontines
      const tontinesRes = await fetch(`/api/backend/associations/${tenantSlug}/tontines`);
      let tontinesCount = 0;
      if (tontinesRes.ok) {
        const tontinesData = await tontinesRes.json();
        tontinesCount = Array.isArray(tontinesData) ? tontinesData.length : 0;
      }

      // 4. Fetch Loans
      const loansRes = await fetch(`/api/backend/associations/${tenantSlug}/loans`);
      let loansCount = 0;
      let totalLoansAmount = 0;
      if (loansRes.ok) {
        const loansData = await loansRes.json();
        if (Array.isArray(loansData)) {
          const activeLoans = loansData.filter((l: any) => l.status === 'APPROVED' || l.status === 'DISBURSED');
          loansCount = activeLoans.length;
          totalLoansAmount = activeLoans.reduce((sum: number, l: any) => sum + (l.balanceRemaining || l.amount || 0), 0);
        }
      }

      // 5. Fetch Notifications
      const notifRes = await fetch(`/api/backend/notifications/mine?associationId=${tenantSlug}`);
      let unreadNotifications = 0;
      let notifList: any[] = [];
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        unreadNotifications = notifData.unreadCount || 0;
        notifList = notifData.notifications || [];
      }

      // 6. Fetch Real Transactions for Activity Stream
      const txRes = await fetch(`/api/backend/associations/${tenantSlug}/treasury/transactions`);
      let txList: any[] = [];
      if (txRes.ok) {
        const txData = await txRes.json();
        if (Array.isArray(txData)) {
          txList = txData.map((tx: any) => ({
            id: tx.id,
            title: tx.type === 'DEPOSIT' ? `Dépôt / Encaissement (${tx.reference})` : `Décaissement / Sortie (${tx.reference})`,
            message: `${tx.amount?.toLocaleString('fr-FR')} FCFA — ${tx.description || 'Opération de trésorerie'}`,
            sentAt: tx.createdAt,
            type: 'TRANSACTION',
            isDeposit: tx.type === 'DEPOSIT',
          }));
        }
      }

      // 7. Fetch Budget
      const currentYear = new Date().getFullYear();
      const budgetRes = await fetch(`/api/backend/associations/${tenantSlug}/budgets/${currentYear}`);
      let budgetExecutionRate = 0;
      if (budgetRes.ok) {
        const budgetData = await budgetRes.json();
        budgetExecutionRate = budgetData.executionIncomePercentage || 0;
      }

      // 8. Fetch Meetings
      const meetingsRes = await fetch(`/api/backend/associations/${tenantSlug}/meetings`);
      let upcomingMeetingTitle: string | null = null;
      if (meetingsRes.ok) {
        const meetingsData = await meetingsRes.json();
        if (Array.isArray(meetingsData) && meetingsData.length > 0) {
          upcomingMeetingTitle = meetingsData[0].title;
        }
      }

      setMetrics({
        membersCount,
        totalTreasuryBalance,
        tontinesCount,
        loansCount,
        totalLoansAmount,
        unreadNotifications,
        budgetExecutionRate,
        upcomingMeetingTitle,
      });

      // Combine real transactions and notifications for live stream
      const combined = [...txList, ...notifList].sort((a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime());
      setRecentActivities(combined.slice(0, 10));
    } catch (e) {
      console.error('Error loading dashboard metrics:', e);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      icon: 'groups',
      label: 'Membres actifs',
      value: `${metrics.membersCount} membres`,
      sub: 'Gestion des adhésions',
      color: '#000000',
    },
    {
      icon: 'account_balance',
      label: 'Trésorerie globale',
      value: `${metrics.totalTreasuryBalance.toLocaleString('fr-FR')} FCFA`,
      sub: 'Solde total multi-caisses',
      color: '#000000',
    },
    {
      icon: 'currency_exchange',
      label: 'Tontines actives',
      value: `${metrics.tontinesCount} tontines`,
      sub: 'Séances & Enchères',
      color: '#000000',
    },
    {
      icon: 'handshake',
      label: 'Prêts en cours',
      value: `${metrics.loansCount} crédits`,
      sub: `${metrics.totalLoansAmount.toLocaleString('fr-FR')} FCFA restant`,
      color: '#000000',
    },
  ];

  const quickActions = [
    { icon: 'person_add', label: 'Membres & Cartes', href: `/${tenantSlug}/members` },
    { icon: 'account_balance_wallet', label: 'Encaissement Caisses', href: `/${tenantSlug}/treasury` },
    { icon: 'currency_exchange', label: 'Séances Tontine', href: `/${tenantSlug}/tontines` },
    { icon: 'add_card', label: 'Octroyer un Prêt', href: `/${tenantSlug}/loans` },
    { icon: 'gavel', label: 'Amendes & Sanctions', href: `/${tenantSlug}/sanctions` },
    { icon: 'event', label: 'Convoquer Réunion', href: `/${tenantSlug}/meetings` },
    { icon: 'how_to_vote', label: 'Votes & Résolutions', href: `/${tenantSlug}/governance` },
    { icon: 'pie_chart', label: 'Budget & Cassation', href: `/${tenantSlug}/budget` },
    { icon: 'folder_open', label: 'Documents & PV', href: `/${tenantSlug}/documents` },
    { icon: 'notifications', label: 'Relances Multi-Canaux', href: `/${tenantSlug}/notifications` },
  ];

  return (
    <div className={styles.dashboardContainer}>
        {/* Top Header */}
        <header className={styles.topHeader}>
          <div>
            <h1 className={styles.pageTitle}>Tableau de bord exécutif</h1>
            <p className={styles.subtitle}>Supervision en temps réel de l'ensemble des 11 modules de votre association</p>
          </div>
          <Link href={`/${tenantSlug}/members`} className={styles.actionBtn}>
            <span className="material-symbols-rounded">person_add</span>
            Inviter un membre
          </Link>
        </header>

        {/* Two-Column Desktop Grid Layout */}
        <div className={styles.twoColumnLayout}>
          {/* Main Left / Center Column */}
          <div className={styles.mainColumn}>
            {/* Welcome Banner */}
            <div className={styles.welcomeBanner}>
              <div>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '1.8rem', color: '#000000' }}>star</span>
                  Espace Exécutif — {tenantSlug.toUpperCase()}
                </h2>
                <p>
                  Plateforme unifiée opérationnelle. Multi-caisses, tontines, gouvernance ACID, budget et relances automatiques configurés.
                </p>
              </div>
            </div>

            {/* KPI Grid */}
            <div className={styles.kpiGrid}>
              {kpiCards.map((kpi) => (
                <div key={kpi.label} className={styles.kpiCard}>
                  <div className={styles.kpiIcon} style={{ color: kpi.color, background: `${kpi.color}15` }}>
                    <span className="material-symbols-rounded">{kpi.icon}</span>
                  </div>
                  <div className={styles.kpiContent}>
                    <span className={styles.kpiLabel}>{kpi.label}</span>
                    <span className={styles.kpiValue}>{kpi.value}</span>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>{kpi.sub}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Performance Metrics Cards */}
            <div className={styles.kpiGrid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon} style={{ color: '#000000', background: '#f8fafc' }}>
                  <span className="material-symbols-rounded">pie_chart</span>
                </div>
                <div className={styles.kpiContent}>
                  <span className={styles.kpiLabel}>Exécution Budgétaire</span>
                  <span className={styles.kpiValue}>{metrics.budgetExecutionRate}%</span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Recettes prévisionnelles</span>
                </div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon} style={{ color: metrics.unreadNotifications > 0 ? '#dc2626' : '#000000', background: metrics.unreadNotifications > 0 ? '#fef2f2' : '#f8fafc' }}>
                  <span className="material-symbols-rounded">mark_email_unread</span>
                </div>
                <div className={styles.kpiContent}>
                  <span className={styles.kpiLabel}>Relances & Alertes</span>
                  <span className={styles.kpiValue} style={{ color: metrics.unreadNotifications > 0 ? '#dc2626' : 'inherit' }}>{metrics.unreadNotifications} non-lues</span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>SMS, Email & WhatsApp</span>
                </div>
              </div>

              <div className={styles.kpiCard}>
                <div className={styles.kpiIcon} style={{ color: '#000000', background: '#f8fafc' }}>
                  <span className="material-symbols-rounded">event</span>
                </div>
                <div className={styles.kpiContent}>
                  <span className={styles.kpiLabel}>Prochaine Réunion</span>
                  <span className={styles.kpiValue} style={{ fontSize: '1.05rem' }}>
                    {metrics.upcomingMeetingTitle || 'Aucune réunion'}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Émargement & PV</span>
                </div>
              </div>
            </div>

            {/* Main Center Section: Recent Activity & Live Treasury Stream */}
            <div className={styles.section} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem' }}>
              <h2 className={styles.sectionTitle} style={{ fontSize: '1.2rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-rounded" style={{ color: '#000000' }}>history</span>
                Journal d'Activité Récente & Opérations de Trésorerie (Données Réelles)
              </h2>

              {loading ? (
                <p style={{ fontStyle: 'italic', color: '#666', fontSize: '0.9rem' }}>Chargement de l'activité...</p>
              ) : recentActivities.length === 0 ? (
                <div className={styles.emptyState} style={{ padding: '2.5rem 1rem' }}>
                  <span className="material-symbols-rounded">history</span>
                  <p style={{ fontSize: '0.9rem' }}>Aucune transaction récente enregistrée.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {recentActivities.map((act) => (
                    <div
                      key={act.id}
                      style={{
                        background: act.type === 'TRANSACTION' ? (act.isDeposit ? '#f0fdf4' : '#fef2f2') : '#ffffff',
                        border: '1px solid #e2e8f0',
                        borderLeft: `4px solid ${act.type === 'TRANSACTION' ? (act.isDeposit ? '#10b981' : '#dc2626') : '#000000'}`,
                        borderRadius: 10,
                        padding: '0.85rem 1.25rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '1rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span
                          className="material-symbols-rounded"
                          style={{
                            background: '#ffffff',
                            padding: '0.5rem',
                            borderRadius: 8,
                            color: act.type === 'TRANSACTION' ? (act.isDeposit ? '#10b981' : '#dc2626') : '#000000',
                            border: '1px solid #e2e8f0',
                          }}
                        >
                          {act.type === 'TRANSACTION' ? (act.isDeposit ? 'arrow_downward' : 'arrow_upward') : 'notifications'}
                        </span>
                        <div>
                          <strong style={{ fontSize: '0.92rem', color: '#0f172a', display: 'block' }}>{act.title}</strong>
                          <span style={{ fontSize: '0.82rem', color: '#475569' }}>{act.message}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {new Date(act.sentAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar Column (Column 2): Module Hub — Accès Rapides */}
          <div className={styles.rightColumn}>
            <div className={styles.section} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.25rem' }}>
              <h2 className={styles.sectionTitle} style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-rounded" style={{ color: '#0f172a' }}>apps</span>
                Module Hub — Accès Rapides
              </h2>
              <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '-0.5rem 0 1rem 0' }}>
                Accédez directement aux 11 modules de votre espace.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: 10,
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      textDecoration: 'none',
                      color: '#0f172a',
                      fontWeight: 600,
                      fontSize: '0.88rem',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#000000';
                      e.currentTarget.style.color = '#ffffff';
                      e.currentTarget.style.borderColor = '#000000';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#0f172a';
                      e.currentTarget.style.borderColor = '#e2e8f0';
                    }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: '1.25rem' }}>{action.icon}</span>
                    <span>{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
