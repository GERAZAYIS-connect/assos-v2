'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────────────

interface PlatformStats {
  primaryAdmin: { email: string; phone: string; role: string };
  stats: {
    totalAssociations: number; activeAssociations: number; trialingAssociations: number;
    suspendedAssociations: number; totalMembers: number; totalTransactions: number;
    mrrXaf: number; arrXaf: number; totalVolume: number; loansActive: number;
    tontinesActive: number; sanctionsPending: number; anomaliesCount: number;
    trialsExpiringSoon: number; contactMessagesUnread: number; uptime: string; auditLogsCount: number;
  };
  planDistribution: { plan: string; count: number }[];
  countryDistribution: { country: string; count: number }[];
  registrationHistory: { name: string; total: number }[];
  recentAnomalies: { id: string; amount: number; createdAt: string; association: { name: string; slug: string } | null }[];
}

interface Association {
  id: string; name: string; slug: string; country: string; plan: string;
  subscriptionStatus: string; isActive: boolean; trialEndsAt: string | null;
  subscriptionEndsAt: string | null; createdAt: string; lastActivity: string | null;
  stats: { membersCount: number; caissesCount: number; tontinesCount: number; loansCount: number; totalVolumeXaf: number };
}

interface PlatformUser {
  id: string; email: string | null; phone: string | null; platformRole: string | null;
  isEmailVerified: boolean; isPhoneVerified: boolean; twoFactorEnabled: boolean;
  preferredLanguage: string; createdAt: string; activeSessions: number; associationsCount: number;
  memberships: { associationName: string; associationSlug: string; role: string; status: string }[];
}

interface AuditLog {
  id: string; category: string; action: string; targetType: string | null;
  targetId: string | null; ipAddress: string | null; createdAt: string;
  association: { name: string; slug: string } | null;
  actor: { email: string | null; phone: string | null } | null;
}

interface Anomaly {
  associationId: string; associationName: string; associationSlug: string;
  count: number; totalAmountXaf: number; lastOccurredAt: string; resolved: boolean;
}

interface SaasMetrics {
  mrrXaf: number; arrXaf: number; totalAssocs: number; activeAssocs: number;
  trialAssocs: number; canceledAssocs: number; churnRate: number; trialConversionRate: number;
  mrrByPlan: { plan: string; count: number; revenueXaf: number }[];
  countryDistribution: { country: string; count: number }[];
}

interface ContactMessage {
  id: string; firstName: string; lastName: string; email: string;
  phone: string; subject: string; message: string; isRead: boolean; createdAt: string;
}

type TabId = 'overview' | 'associations' | 'users' | 'subscriptions' | 'saas' | 'anomalies' | 'audit' | 'support' | 'settings' | 'co-admins';

// ─── Colors ─────────────────────────────────────────────────────────────────
const PLAN_COLORS: Record<string, string> = {
  DISCOVERY: '#d1d5db', ESSENTIAL: '#374151', PRO: '#000', ENTERPRISE: '#111827',
};
const AUDIT_CATEGORY_COLORS: Record<string, string> = {
  AUTH: '#ef4444', TREASURY: '#22c55e', LOAN: '#f59e0b', TONTINE: '#3b82f6',
  MEMBER: '#8b5cf6', SANCTION: '#ec4899', ASSOCIATION: '#06b6d4', PLATFORM: '#000',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (n: number) => n.toLocaleString('fr-FR');
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDateTime = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'Actif', color: '#15803d', bg: '#f0fdf4' },
  TRIALING: { label: 'Essai', color: '#92400e', bg: '#fffbeb' },
  PAST_DUE: { label: 'Impayé', color: '#dc2626', bg: '#fef2f2' },
  CANCELED: { label: 'Annulé', color: '#52525b', bg: '#f4f4f5' },
  ARCHIVED: { label: 'Archivé', color: '#a1a1aa', bg: '#fafafa' },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, alert }: { icon: string; label: string; value: string | number; sub?: string; alert?: boolean }) {
  return (
    <div style={{
      background: alert ? '#000' : '#fff', border: `1px solid ${alert ? '#000' : '#eaeaea'}`,
      borderRadius: 12, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'transform 0.15s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: alert ? '#aaa' : '#888' }}>{label}</span>
        <span className="material-symbols-rounded" style={{ fontSize: '1.25rem', color: alert ? '#fff' : '#ccc' }}>{icon}</span>
      </div>
      <div style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em', color: alert ? '#fff' : '#000', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: '0.8rem', color: alert ? '#888' : '#999' }}>{sub}</div>}
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: '#888', bg: '#f4f4f5' };
  return (
    <span style={{ padding: '0.25rem 0.6rem', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em', color: cfg.color, background: cfg.bg }}>
      {cfg.label}
    </span>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
      {action}
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: 12, padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', ...style }}>
      {children}
    </div>
  );
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ overflowX: 'auto', border: '1px solid #eaeaea', borderRadius: 12, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        {children}
      </table>
    </div>
  );
}

const TH = ({ children, right }: { children: React.ReactNode; right?: boolean }) => (
  <th style={{ padding: '0.875rem 1.25rem', fontWeight: 600, color: '#888', textAlign: right ? 'right' : 'left', background: '#fafafa', borderBottom: '1px solid #eaeaea', whiteSpace: 'nowrap', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{children}</th>
);
const TD = ({ children, right, mono }: { children: React.ReactNode; right?: boolean; mono?: boolean }) => (
  <td style={{ padding: '0.875rem 1.25rem', textAlign: right ? 'right' : 'left', borderBottom: '1px solid #f4f4f4', fontFamily: mono ? 'monospace' : 'inherit', verticalAlign: 'middle' }}>{children}</td>
);

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [loading, setLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [saasMetrics, setSaasMetrics] = useState<SaasMetrics | null>(null);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [subscriptions, setSubscriptions] = useState<Association[]>([]);

  // Filters
  const [assocSearch, setAssocSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [auditCategory, setAuditCategory] = useState('');
  const [auditAssocId, setAuditAssocId] = useState('');

  // Modals
  const [selectedAssoc, setSelectedAssoc] = useState<Association | null>(null);
  const [newPlan, setNewPlan] = useState('ESSENTIAL');
  const [durationMonths, setDurationMonths] = useState(1);
  const [updating, setUpdating] = useState(false);

  // Maintenance toggle (local state — connects to a future API)
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('La plateforme est en maintenance. Merci de réessayer ultérieurement.');

  // Auth check
  const [authError, setAuthError] = useState('');

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [resStats, resAssocs, resAudit] = await Promise.all([
        fetch('/api/backend/admin/stats'),
        fetch('/api/backend/admin/associations'),
        fetch('/api/backend/admin/audit-logs'),
      ]);

      if (resStats.status === 401 || resStats.status === 403) {
        setAuthError('Accès refusé. Vous devez être Super-Admin pour accéder à cette console.');
        setLoading(false);
        return;
      }

      if (resStats.ok) setStats(await resStats.json());
      if (resAssocs.ok) setAssociations(await resAssocs.json());
      if (resAudit.ok) setAuditLogs(await resAudit.json());

      // Fetch remaining data in background
      const [resUsers, resAnomalies, resSaas, resMsgs, resSubs] = await Promise.all([
        fetch('/api/backend/admin/users'),
        fetch('/api/backend/admin/anomalies'),
        fetch('/api/backend/admin/saas-metrics'),
        fetch('/api/backend/admin/messages'),
        fetch('/api/backend/admin/subscriptions'),
      ]);
      if (resUsers.ok) setUsers(await resUsers.json());
      if (resAnomalies.ok) setAnomalies(await resAnomalies.json());
      if (resSaas.ok) setSaasMetrics(await resSaas.json());
      if (resMsgs.ok) setMessages(await resMsgs.json());
      if (resSubs.ok) setSubscriptions(await resSubs.json());
    } catch {
      setAuthError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const reloadAuditLogs = async () => {
    const params = new URLSearchParams();
    if (auditCategory) params.set('category', auditCategory);
    if (auditAssocId) params.set('associationId', auditAssocId);
    const res = await fetch(`/api/backend/admin/audit-logs?${params}`);
    if (res.ok) setAuditLogs(await res.json());
  };

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssoc) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/backend/admin/associations/${selectedAssoc.id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: newPlan, durationMonths }),
      });
      if (res.ok) { setSelectedAssoc(null); fetchAll(); }
    } finally { setUpdating(false); }
  };

  const toggleAssocStatus = async (assoc: Association) => {
    const action = assoc.isActive ? 'suspendre' : 'réactiver';
    if (!confirm(`Voulez-vous ${action} "${assoc.name}" ?`)) return;
    await fetch(`/api/backend/admin/associations/${assoc.id}/toggle-status`, { method: 'POST' });
    fetchAll();
  };

  const revokeUserSessions = async (userId: string) => {
    if (!confirm('Révoquer toutes les sessions de cet utilisateur ?')) return;
    await fetch(`/api/backend/admin/users/${userId}/revoke-sessions`, { method: 'POST' });
    fetchAll();
  };

  const markMessageRead = async (msgId: string) => {
    await fetch(`/api/backend/admin/messages/${msgId}/read`, { method: 'PATCH' });
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isRead: true } : m));
  };

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]);
    const csv = [headers.join(','), ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  };

  // ── Loading & Auth ─────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <span className="material-symbols-rounded" style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>autorenew</span>
        <span style={{ fontWeight: 600, color: '#666' }}>Chargement de la console d'administration...</span>
      </div>
    </div>
  );

  if (authError) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
      <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: 16, padding: '3rem', maxWidth: 480, textAlign: 'center' }}>
        <span className="material-symbols-rounded" style={{ fontSize: '3rem', color: '#ef4444' }}>block</span>
        <h2 style={{ fontWeight: 800, marginTop: '1rem' }}>Accès Refusé</h2>
        <p style={{ color: '#666' }}>{authError}</p>
      </div>
    </div>
  );

  const SIDEBAR_TABS: { id: TabId; icon: string; label: string; badge?: number }[] = [
    { id: 'overview', icon: 'dashboard', label: 'Vue d\'ensemble' },
    { id: 'associations', icon: 'corporate_fare', label: 'Associations' },
    { id: 'users', icon: 'group', label: 'Utilisateurs' },
    { id: 'subscriptions', icon: 'card_membership', label: 'Abonnements' },
    { id: 'saas', icon: 'trending_up', label: 'Métriques SaaS' },
    { id: 'anomalies', icon: 'warning', label: 'Anomalies', badge: stats?.stats.anomaliesCount },
    { id: 'audit', icon: 'manage_search', label: 'Journaux d\'Audit' },
    { id: 'support', icon: 'support_agent', label: 'Support', badge: stats?.stats.contactMessagesUnread },
    { id: 'settings', icon: 'tune', label: 'Paramètres' },
    { id: 'co-admins', icon: 'shield_person', label: 'Co-Administrateurs' },
  ];

  const filteredAssocs = associations.filter(a =>
    a.name.toLowerCase().includes(assocSearch.toLowerCase()) ||
    a.slug.toLowerCase().includes(assocSearch.toLowerCase()) ||
    a.country.toLowerCase().includes(assocSearch.toLowerCase())
  );

  const filteredUsers = users.filter(u =>
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.phone || '').includes(userSearch)
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fafafa', color: '#111', fontFamily: '"Inter", -apple-system, sans-serif' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } * { box-sizing: border-box; }`}</style>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────────── */}
      <aside style={{ width: 272, background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '1.75rem 1.5rem', borderBottom: '1px solid #1f1f1f' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <div style={{ width: 32, height: 32, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-rounded" style={{ color: '#000', fontSize: '1.1rem' }}>admin_panel_settings</span>
            </div>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em' }}>ASSOS HQ</span>
          </div>
          <span style={{ fontSize: '0.7rem', color: '#666', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Super-Admin Console</span>
        </div>

        <nav style={{ padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
          {SIDEBAR_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 0.875rem',
                borderRadius: 8, background: activeTab === tab.id ? '#fff' : 'transparent',
                color: activeTab === tab.id ? '#000' : '#666', border: 'none', cursor: 'pointer',
                fontWeight: 600, fontSize: '0.875rem', textAlign: 'left', transition: 'all 0.15s', position: 'relative',
              }}>
              <span className="material-symbols-rounded" style={{ fontSize: '1.15rem' }}>{tab.icon}</span>
              <span style={{ flex: 1 }}>{tab.label}</span>
              {tab.badge != null && tab.badge > 0 && (
                <span style={{ background: activeTab === tab.id ? '#000' : '#ef4444', color: activeTab === tab.id ? '#fff' : '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.15rem 0.45rem', borderRadius: 999, minWidth: 20, textAlign: 'center' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #1f1f1f' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 34, height: 34, background: '#222', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>
              {stats?.primaryAdmin.email?.substring(0, 1).toUpperCase() || 'A'}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{stats?.primaryAdmin.email}</div>
              <div style={{ fontSize: '0.7rem', color: '#666', fontWeight: 600 }}>SUPER_ADMIN</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '2rem' }}>

        {/* ═══════════════════════════════════════════════════════ OVERVIEW */}
        {activeTab === 'overview' && stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <SectionHeader title="Vue d'ensemble de la plateforme"
              action={<span style={{ fontSize: '0.8rem', color: '#888' }}>Mis à jour à l'instant</span>} />

            {/* KPI Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <KpiCard icon="corporate_fare" label="Associations" value={fmt(stats.stats.totalAssociations)} sub={`${stats.stats.activeAssociations} actives · ${stats.stats.trialingAssociations} en essai · ${stats.stats.suspendedAssociations} suspendues`} />
              <KpiCard icon="group" label="Membres Actifs" value={fmt(stats.stats.totalMembers)} sub="Tous statuts confondus" />
              <KpiCard icon="payments" label="Volume Total XAF" value={`${fmt(Math.round(stats.stats.totalVolume / 1000))} K`} sub="Transactions confirmées" />
              <KpiCard icon="trending_up" label="MRR" value={`${fmt(stats.stats.mrrXaf)} XAF`} sub={`ARR : ${fmt(stats.stats.arrXaf)} XAF`} />
              <KpiCard icon="warning" label="Anomalies Actives" value={stats.stats.anomaliesCount} sub={`${stats.stats.trialsExpiringSoon} essais expirant sous 7j`} alert={stats.stats.anomaliesCount > 0} />
              <KpiCard icon="account_balance" label="Prêts Actifs" value={fmt(stats.stats.loansActive)} sub={`${stats.stats.tontinesActive} tontines en cours`} />
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <Card>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.5rem 0' }}>Croissance des inscriptions (6 mois)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={stats.registrationHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#999' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#999' }} />
                    <Tooltip contentStyle={{ background: '#000', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                    <Line type="monotone" dataKey="total" stroke="#000" strokeWidth={2.5} dot={{ r: 3, fill: '#000' }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.5rem 0' }}>Répartition par Formule</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={stats.planDistribution} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#999' }} />
                    <YAxis dataKey="plan" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} width={80} />
                    <Tooltip contentStyle={{ background: '#000', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                      {stats.planDistribution.map((p) => (
                        <Cell key={p.plan} fill={PLAN_COLORS[p.plan] || '#000'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Alerts + Recent anomalies */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <Card>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Indicateurs Système</h3>
                {[
                  { icon: 'cloud', label: 'Disponibilité (Uptime)', value: stats.stats.uptime, ok: true },
                  { icon: 'receipt_long', label: 'Journaux d\'Audit', value: fmt(stats.stats.auditLogsCount), ok: true },
                  { icon: 'gavel', label: 'Sanctions Impayées', value: fmt(stats.stats.sanctionsPending), ok: stats.stats.sanctionsPending === 0 },
                  { icon: 'pending', label: 'Essais expirant ≤ 7j', value: stats.stats.trialsExpiringSoon, ok: stats.stats.trialsExpiringSoon === 0 },
                  { icon: 'mail', label: 'Messages non lus', value: stats.stats.contactMessagesUnread, ok: stats.stats.contactMessagesUnread === 0 },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid #f4f4f4' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: '1rem', color: '#999' }}>{row.icon}</span>
                      <span style={{ fontSize: '0.875rem', color: '#444' }}>{row.label}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: row.ok ? '#15803d' : '#dc2626' }}>{row.value}</span>
                  </div>
                ))}
              </Card>

              <Card>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Dernières Anomalies de Paiement</h3>
                {stats.recentAnomalies.length === 0 ? (
                  <div style={{ color: '#888', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>Aucune anomalie récente ✓</div>
                ) : stats.recentAnomalies.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: '1px solid #f4f4f4' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{a.association?.name || 'Association inconnue'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#999' }}>{fmtDateTime(a.createdAt)}</div>
                    </div>
                    <span style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.875rem' }}>{fmt(a.amount)} XAF</span>
                  </div>
                ))}
                <button onClick={() => setActiveTab('anomalies')} style={{ marginTop: '1rem', background: 'none', border: '1px solid #eaeaea', padding: '0.5rem 1rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: '#000', width: '100%' }}>
                  Voir toutes les anomalies →
                </button>
              </Card>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ ASSOCIATIONS */}
        {activeTab === 'associations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <SectionHeader title="Gestion des Associations"
              action={
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input type="text" placeholder="Rechercher (nom, slug, pays)..." value={assocSearch} onChange={e => setAssocSearch(e.target.value)}
                    style={{ padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #eaeaea', fontSize: '0.875rem', outline: 'none', width: 260 }} />
                  <button onClick={() => exportCSV(associations, 'associations.csv')}
                    style={{ background: '#000', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                    Export CSV
                  </button>
                </div>
              }
            />
            <TableWrapper>
              <thead>
                <tr>
                  <TH>Nom & Référence</TH>
                  <TH>Pays</TH>
                  <TH>Formule</TH>
                  <TH>Statut</TH>
                  <TH>Membres</TH>
                  <TH>Volume XAF</TH>
                  <TH>Dernière Activité</TH>
                  <TH right>Actions</TH>
                </tr>
              </thead>
              <tbody>
                {filteredAssocs.map((assoc, idx) => (
                  <tr key={assoc.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <TD>
                      <div style={{ fontWeight: 600 }}>{assoc.name} {!assoc.isActive && <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>• Suspendu</span>}</div>
                      <div style={{ fontSize: '0.75rem', color: '#999', fontFamily: 'monospace' }}>{assoc.slug}</div>
                    </TD>
                    <TD><span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{assoc.country}</span></TD>
                    <TD><span style={{ padding: '0.2rem 0.5rem', background: '#f4f4f5', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em' }}>{assoc.plan}</span></TD>
                    <TD><Badge status={assoc.subscriptionStatus} /></TD>
                    <TD><strong>{assoc.stats.membersCount}</strong></TD>
                    <TD><span style={{ fontWeight: 600 }}>{fmt(Math.round(assoc.stats.totalVolumeXaf / 1000))} K</span></TD>
                    <TD><span style={{ fontSize: '0.8rem', color: '#888' }}>{fmtDate(assoc.lastActivity)}</span></TD>
                    <TD right>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button onClick={() => { setSelectedAssoc(assoc); setNewPlan(assoc.plan); }}
                          title="Modifier abonnement"
                          style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #eaeaea', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: '1rem' }}>edit</span>
                        </button>
                        <button onClick={() => toggleAssocStatus(assoc)}
                          title={assoc.isActive ? 'Suspendre' : 'Réactiver'}
                          style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #eaeaea', background: assoc.isActive ? '#fff' : '#000', color: assoc.isActive ? '#ef4444' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: '1rem' }}>{assoc.isActive ? 'block' : 'play_arrow'}</span>
                        </button>
                      </div>
                    </TD>
                  </tr>
                ))}
                {filteredAssocs.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Aucune association trouvée.</td></tr>
                )}
              </tbody>
            </TableWrapper>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════ USERS */}
        {activeTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <SectionHeader title="Comptes Utilisateurs"
              action={
                <input type="text" placeholder="Rechercher (email, téléphone)..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
                  style={{ padding: '0.6rem 1rem', borderRadius: 8, border: '1px solid #eaeaea', fontSize: '0.875rem', outline: 'none', width: 280 }} />
              }
            />
            <TableWrapper>
              <thead>
                <tr>
                  <TH>Email / Téléphone</TH>
                  <TH>Rôle Plateforme</TH>
                  <TH>Vérifié</TH>
                  <TH>2FA</TH>
                  <TH>Sessions Actives</TH>
                  <TH>Associations</TH>
                  <TH>Inscrit le</TH>
                  <TH right>Actions</TH>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => (
                  <tr key={u.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <TD>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.email || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#999' }}>{u.phone || '—'}</div>
                    </TD>
                    <TD>
                      {u.platformRole ? (
                        <span style={{ padding: '0.2rem 0.5rem', background: '#000', color: '#fff', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700 }}>{u.platformRole}</span>
                      ) : <span style={{ color: '#ccc' }}>—</span>}
                    </TD>
                    <TD>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.75rem', color: u.isEmailVerified ? '#15803d' : '#dc2626', fontWeight: 600 }}>
                          {u.isEmailVerified ? '✓ Email' : '✗ Email'}
                        </span>
                      </div>
                    </TD>
                    <TD>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: u.twoFactorEnabled ? '#15803d' : '#aaa' }}>
                        {u.twoFactorEnabled ? '✓ ON' : '— OFF'}
                      </span>
                    </TD>
                    <TD>
                      <span style={{ fontWeight: 700, color: u.activeSessions > 0 ? '#000' : '#ccc' }}>
                        {u.activeSessions}
                      </span>
                    </TD>
                    <TD>
                      <span style={{ fontWeight: 600 }}>{u.associationsCount}</span>
                    </TD>
                    <TD><span style={{ fontSize: '0.8rem', color: '#888' }}>{fmtDate(u.createdAt)}</span></TD>
                    <TD right>
                      <button onClick={() => revokeUserSessions(u.id)}
                        disabled={u.activeSessions === 0}
                        title="Révoquer toutes les sessions"
                        style={{ width: 32, height: 32, borderRadius: 6, border: '1px solid #eaeaea', background: u.activeSessions > 0 ? '#fff' : '#fafafa', color: '#ef4444', cursor: u.activeSessions > 0 ? 'pointer' : 'default', opacity: u.activeSessions > 0 ? 1 : 0.4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '1rem' }}>logout</span>
                      </button>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ SUBSCRIPTIONS */}
        {activeTab === 'subscriptions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <SectionHeader title="Abonnements & Facturation"
              action={
                <button onClick={() => exportCSV(subscriptions, 'subscriptions.csv')}
                  style={{ background: '#000', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                  Export CSV
                </button>
              }
            />

            {/* Status pills summary */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {(['ACTIVE', 'TRIALING', 'PAST_DUE', 'CANCELED', 'ARCHIVED'] as string[]).map(s => {
                const count = subscriptions.filter(a => a.subscriptionStatus === s).length;
                const cfg = STATUS_CONFIG[s];
                return (
                  <div key={s} style={{ background: cfg.bg, color: cfg.color, padding: '0.5rem 1rem', borderRadius: 8, fontWeight: 700, fontSize: '0.875rem' }}>
                    {cfg.label} — {count}
                  </div>
                );
              })}
            </div>

            <TableWrapper>
              <thead>
                <tr>
                  <TH>Association</TH>
                  <TH>Pays</TH>
                  <TH>Formule</TH>
                  <TH>Statut</TH>
                  <TH>Membres</TH>
                  <TH>Tarif/mois</TH>
                  <TH>Fin d'essai</TH>
                  <TH>Fin d'abonnement</TH>
                  <TH right>Actions</TH>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((a: any, idx: number) => (
                  <tr key={a.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <TD>
                      <div style={{ fontWeight: 600 }}>{a.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#999', fontFamily: 'monospace' }}>{a.slug}</div>
                    </TD>
                    <TD>{a.country}</TD>
                    <TD><span style={{ padding: '0.2rem 0.5rem', background: '#f4f4f5', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700 }}>{a.plan}</span></TD>
                    <TD><Badge status={a.subscriptionStatus} /></TD>
                    <TD>{a.membersCount}</TD>
                    <TD mono><span style={{ fontWeight: 600 }}>{fmt(a.priceXaf)} XAF</span></TD>
                    <TD>
                      {a.trialEndsAt ? (
                        <span style={{ color: a.expiresIn7Days ? '#dc2626' : '#888', fontWeight: a.expiresIn7Days ? 700 : 400, fontSize: '0.8rem' }}>
                          {fmtDate(a.trialEndsAt)} {a.expiresIn7Days && '⚠️'}
                        </span>
                      ) : <span style={{ color: '#ccc' }}>—</span>}
                    </TD>
                    <TD><span style={{ fontSize: '0.8rem', color: '#888' }}>{fmtDate(a.subscriptionEndsAt)}</span></TD>
                    <TD right>
                      <button onClick={() => { setSelectedAssoc(a); setNewPlan(a.plan); }}
                        style={{ padding: '0.35rem 0.75rem', borderRadius: 6, border: '1px solid #eaeaea', background: '#fff', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                        Modifier
                      </button>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </TableWrapper>
          </div>
        )}

        {/* ═══════════════════════════════════════════════ SAAS METRICS */}
        {activeTab === 'saas' && saasMetrics && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <SectionHeader title="Métriques SaaS" />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <KpiCard icon="payments" label="MRR" value={`${fmt(saasMetrics.mrrXaf)} XAF`} sub={`ARR : ${fmt(saasMetrics.arrXaf)} XAF`} />
              <KpiCard icon="trending_down" label="Taux de Churn" value={`${saasMetrics.churnRate}%`} sub="Associations annulées / Total" alert={saasMetrics.churnRate > 10} />
              <KpiCard icon="conversion_path" label="Conversion Trial→Payant" value={`${saasMetrics.trialConversionRate}%`} sub={`${saasMetrics.activeAssocs} associations actives`} />
              <KpiCard icon="cancel" label="Annulées / Archivées" value={saasMetrics.canceledAssocs} sub="Total historique" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <Card>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.5rem 0' }}>Revenus par Formule</h3>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={saasMetrics.mrrByPlan}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="plan" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#999' }} tickFormatter={v => `${Math.round(v / 1000)}K`} />
                    <Tooltip contentStyle={{ background: '#000', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} formatter={(v) => [`${fmt(Number(v ?? 0))} XAF`, 'Revenue']} />
                    <Bar dataKey="revenueXaf" radius={[4, 4, 0, 0]}>
                      {saasMetrics.mrrByPlan.map((p) => <Cell key={p.plan} fill={PLAN_COLORS[p.plan] || '#000'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.5rem 0' }}>Répartition Géographique</h3>
                {saasMetrics.countryDistribution.length === 0 ? (
                  <div style={{ color: '#888', textAlign: 'center', padding: '3rem 0' }}>Aucune donnée.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie data={saasMetrics.countryDistribution} dataKey="count" nameKey="country" cx="50%" cy="50%" outerRadius={100} label={(props: any) => `${props.name || props.country || ''} ${((props.percent || 0) * 100).toFixed(0)}%`} labelLine={false}>
                        {saasMetrics.countryDistribution.map((_, i) => (
                          <Cell key={i} fill={`hsl(${i * 45}, 20%, ${20 + i * 8}%)`} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: '#000', border: 'none', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>

            <Card>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Détail par Formule</h3>
              <TableWrapper>
                <thead><tr><TH>Formule</TH><TH>Associations</TH><TH right>Revenus Mensuels</TH></tr></thead>
                <tbody>
                  {saasMetrics.mrrByPlan.map((p, i) => (
                    <tr key={p.plan} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <TD><span style={{ fontWeight: 700 }}>{p.plan}</span></TD>
                      <TD>{p.count}</TD>
                      <TD right><strong>{fmt(p.revenueXaf)} XAF</strong></TD>
                    </tr>
                  ))}
                </tbody>
              </TableWrapper>
            </Card>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ ANOMALIES */}
        {activeTab === 'anomalies' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <SectionHeader title="Anomalies de Paiement"
              action={<span style={{ fontSize: '0.8rem', background: '#fef2f2', color: '#dc2626', padding: '0.4rem 0.75rem', borderRadius: 6, fontWeight: 600 }}>{anomalies.length} association(s) concernée(s)</span>}
            />
            {anomalies.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '3rem' }}>
                <span className="material-symbols-rounded" style={{ fontSize: '3rem', color: '#22c55e' }}>check_circle</span>
                <div style={{ fontWeight: 700, marginTop: '0.75rem', color: '#15803d' }}>Aucune anomalie détectée !</div>
              </Card>
            ) : (
              <TableWrapper>
                <thead>
                  <tr>
                    <TH>Association</TH>
                    <TH>Transactions en Anomalie</TH>
                    <TH right>Montant Total Impacté</TH>
                    <TH>Dernière Occurrence</TH>
                    <TH>Statut</TH>
                  </tr>
                </thead>
                <tbody>
                  {anomalies.map((a, idx) => (
                    <tr key={a.associationId} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <TD>
                        <div style={{ fontWeight: 600 }}>{a.associationName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#999', fontFamily: 'monospace' }}>{a.associationSlug}</div>
                      </TD>
                      <TD><span style={{ fontWeight: 700, color: '#dc2626' }}>{a.count}</span></TD>
                      <TD right><strong style={{ color: '#dc2626' }}>{fmt(a.totalAmountXaf)} XAF</strong></TD>
                      <TD><span style={{ fontSize: '0.8rem', color: '#888' }}>{fmtDateTime(a.lastOccurredAt)}</span></TD>
                      <TD>
                        <span style={{ padding: '0.25rem 0.6rem', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, background: '#fef2f2', color: '#dc2626' }}>
                          En attente
                        </span>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </TableWrapper>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ AUDIT */}
        {activeTab === 'audit' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <SectionHeader title="Journaux d'Audit" action={
              <button onClick={() => exportCSV(auditLogs, 'audit-logs.csv')}
                style={{ background: '#000', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                Export CSV
              </button>
            } />

            {/* Filters */}
            <Card style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', display: 'block', marginBottom: '0.35rem' }}>Catégorie</label>
                  <select value={auditCategory} onChange={e => setAuditCategory(e.target.value)}
                    style={{ padding: '0.5rem 0.875rem', borderRadius: 7, border: '1px solid #eaeaea', fontSize: '0.875rem', outline: 'none', minWidth: 160 }}>
                    <option value="">Toutes</option>
                    {['AUTH', 'ASSOCIATION', 'MEMBER', 'TREASURY', 'LOAN', 'TONTINE', 'SANCTION', 'SUBSCRIPTION', 'PLATFORM'].map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#666', display: 'block', marginBottom: '0.35rem' }}>ID Association</label>
                  <input value={auditAssocId} onChange={e => setAuditAssocId(e.target.value)}
                    placeholder="ID ou slug..."
                    style={{ padding: '0.5rem 0.875rem', borderRadius: 7, border: '1px solid #eaeaea', fontSize: '0.875rem', outline: 'none', width: 200 }} />
                </div>
                <div style={{ alignSelf: 'flex-end' }}>
                  <button onClick={reloadAuditLogs}
                    style={{ background: '#000', color: '#fff', border: 'none', padding: '0.55rem 1.25rem', borderRadius: 7, fontWeight: 600, cursor: 'pointer', fontSize: '0.875rem' }}>
                    Filtrer
                  </button>
                </div>
              </div>
            </Card>

            <TableWrapper>
              <thead>
                <tr>
                  <TH>Date & Heure</TH>
                  <TH>Catégorie</TH>
                  <TH>Action</TH>
                  <TH>Acteur</TH>
                  <TH>Association</TH>
                  <TH>Cible</TH>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, idx) => (
                  <tr key={log.id} style={{ background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <TD><span style={{ fontSize: '0.78rem', color: '#888', fontFamily: 'monospace' }}>{fmtDateTime(log.createdAt)}</span></TD>
                    <TD>
                      <span style={{
                        padding: '0.2rem 0.5rem', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700,
                        background: `${AUDIT_CATEGORY_COLORS[log.category] || '#888'}15`,
                        color: AUDIT_CATEGORY_COLORS[log.category] || '#888',
                      }}>
                        {log.category}
                      </span>
                    </TD>
                    <TD><span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{log.action}</span></TD>
                    <TD><span style={{ fontSize: '0.78rem', color: '#555' }}>{log.actor?.email || log.actor?.phone || 'Système'}</span></TD>
                    <TD><span style={{ fontSize: '0.78rem' }}>{log.association?.name || '—'}</span></TD>
                    <TD><span style={{ fontSize: '0.75rem', color: '#888', fontFamily: 'monospace' }}>{log.targetType ? `${log.targetType}` : '—'}</span></TD>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>Aucun journal trouvé.</td></tr>
                )}
              </tbody>
            </TableWrapper>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ SUPPORT */}
        {activeTab === 'support' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <SectionHeader title="Support — Messages de Contact"
              action={<span style={{ fontSize: '0.8rem', background: messages.filter(m => !m.isRead).length > 0 ? '#fffbeb' : '#f0fdf4', color: messages.filter(m => !m.isRead).length > 0 ? '#92400e' : '#15803d', padding: '0.4rem 0.75rem', borderRadius: 6, fontWeight: 600 }}>{messages.filter(m => !m.isRead).length} non lu(s)</span>}
            />
            {messages.length === 0 ? (
              <Card style={{ textAlign: 'center', padding: '3rem' }}>
                <span className="material-symbols-rounded" style={{ fontSize: '3rem', color: '#22c55e' }}>mark_email_read</span>
                <div style={{ fontWeight: 700, marginTop: '0.75rem' }}>Aucun message de contact.</div>
              </Card>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {messages.map(msg => (
                  <Card key={msg.id} style={{ opacity: msg.isRead ? 0.65 : 1, padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{msg.firstName} {msg.lastName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888' }}>{msg.email} · {msg.phone}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', color: '#999' }}>{fmtDate(msg.createdAt)}</span>
                        {!msg.isRead && (
                          <button onClick={() => markMessageRead(msg.id)}
                            style={{ background: '#000', color: '#fff', border: 'none', padding: '0.35rem 0.75rem', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                            Marquer comme lu
                          </button>
                        )}
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: '0.35rem', color: '#333' }}>{msg.subject}</div>
                    <div style={{ fontSize: '0.85rem', color: '#555', lineHeight: 1.6 }}>{msg.message}</div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <SectionHeader title="Paramètres Système" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <Card>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.25rem 0' }}>Mode Maintenance</h3>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontWeight: 600 }}>Activer la maintenance</span>
                  <button onClick={() => setMaintenance(!maintenance)}
                    style={{ width: 52, height: 28, borderRadius: 14, background: maintenance ? '#000' : '#e5e7eb', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: 3, left: maintenance ? 27 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                  </button>
                </div>
                {maintenance && (
                  <textarea value={maintenanceMsg} onChange={e => setMaintenanceMsg(e.target.value)} rows={3}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #eaeaea', fontSize: '0.875rem', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }} />
                )}
                <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: maintenance ? '#fef2f2' : '#f0fdf4', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, color: maintenance ? '#dc2626' : '#15803d' }}>
                  {maintenance ? '⚠️ Maintenance ACTIVE — la plateforme est inaccessible' : '✓ Plateforme opérationnelle'}
                </div>
              </Card>

              <Card>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1.25rem 0' }}>Statut des Passerelles de Paiement</h3>
                {[
                  { name: 'Mesomb (MTN MoMo)', status: 'UP', region: 'CM, CI, SN' },
                  { name: 'Campay (Orange Money)', status: 'UP', region: 'CM' },
                  { name: 'CinetPay', status: 'UP', region: 'CI, SN, ML' },
                  { name: 'TouchPay / FedaPay', status: 'UP', region: 'BJ, TG' },
                ].map(gw => (
                  <div key={gw.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f4f4f4' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{gw.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#999' }}>{gw.region}</div>
                    </div>
                    <span style={{ padding: '0.25rem 0.6rem', borderRadius: 4, fontSize: '0.72rem', fontWeight: 700, background: gw.status === 'UP' ? '#f0fdf4' : '#fef2f2', color: gw.status === 'UP' ? '#15803d' : '#dc2626' }}>
                      {gw.status}
                    </span>
                  </div>
                ))}
              </Card>

              <Card style={{ gridColumn: '1 / -1' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 1rem 0' }}>Seuils & Limites par Défaut</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                  {[
                    { label: 'Limite Mobile Money / transaction', value: '300 000 XAF', icon: 'phone_android' },
                    { label: 'Taux de pénalité prêt (défaut)', value: '0.1% / jour', icon: 'percent' },
                    { label: 'Durée trial par défaut', value: '30 jours', icon: 'schedule' },
                    { label: 'Rétractation paiement', value: '14 jours', icon: 'undo' },
                    { label: 'Transition lecture seule (impayé)', value: 'J+7', icon: 'lock' },
                    { label: 'Suppression compte (archivage)', value: 'J+120', icon: 'delete_forever' },
                  ].map(item => (
                    <div key={item.label} style={{ background: '#fafafa', border: '1px solid #eaeaea', borderRadius: 8, padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <span className="material-symbols-rounded" style={{ fontSize: '1.25rem', color: '#888' }}>{item.icon}</span>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>{item.label}</div>
                        <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ CO-ADMINS */}
        {activeTab === 'co-admins' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <SectionHeader title="Co-Administrateurs Plateforme" />
            <Card>
              <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '1.5rem', lineHeight: 1.6 }}>
                Les Co-Administrateurs sont des utilisateurs ayant le rôle <strong>CO_ADMIN</strong> sur la plateforme. Ce rôle est attribué manuellement via la base de données. Ils ont accès à la console d'administration mais ne peuvent pas modifier les paramètres système critiques.
              </p>
              {users.filter(u => u.platformRole === 'CO_ADMIN' || u.platformRole === 'SUPER_ADMIN').length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Aucun administrateur plateforme trouvé.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {users.filter(u => u.platformRole != null).map(u => (
                    <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #eaeaea', padding: '1rem 1.25rem', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700 }}>{u.email || u.phone}</div>
                        <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.2rem' }}>
                          {u.activeSessions} session(s) active(s) · {u.associationsCount} association(s)
                        </div>
                      </div>
                      <span style={{ padding: '0.4rem 0.8rem', background: u.platformRole === 'SUPER_ADMIN' ? '#000' : '#f0f0f0', color: u.platformRole === 'SUPER_ADMIN' ? '#fff' : '#000', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                        {u.platformRole}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#fafafa', borderRadius: 8, fontSize: '0.8rem', color: '#888', lineHeight: 1.6 }}>
                💡 Pour attribuer le rôle CO_ADMIN à un utilisateur, modifiez directement la colonne <code>platformRole</code> dans la table <code>users</code> de la base de données Turso.
              </div>
            </Card>
          </div>
        )}

      </main>

      {/* ── SUBSCRIPTION MODAL ───────────────────────────────────────────────── */}
      {selectedAssoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', padding: '2.5rem', borderRadius: 16, maxWidth: 480, width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)', margin: '0 1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>Abonnement — {selectedAssoc.name}</h3>
              <button onClick={() => setSelectedAssoc(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem', color: '#888' }}>✕</button>
            </div>
            <form onSubmit={handleUpdateSubscription}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Formule SaaS</label>
                <select value={newPlan} onChange={e => setNewPlan(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #eaeaea', fontSize: '0.95rem', outline: 'none' }}>
                  <option value="DISCOVERY">Découverte (Gratuit)</option>
                  <option value="ESSENTIAL">Essentiel (9 900 XAF/mois)</option>
                  <option value="PRO">Pro (24 900 XAF/mois)</option>
                  <option value="ENTERPRISE">Enterprise (100 000 XAF/mois)</option>
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.5rem' }}>Prolonger de :</label>
                <select value={durationMonths} onChange={e => setDurationMonths(parseInt(e.target.value))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: 8, border: '1px solid #eaeaea', fontSize: '0.95rem', outline: 'none' }}>
                  <option value={1}>+ 1 mois</option>
                  <option value={3}>+ 3 mois (Trimestre)</option>
                  <option value={6}>+ 6 mois (Semestre)</option>
                  <option value={12}>+ 12 mois (1 An)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setSelectedAssoc(null)}
                  style={{ padding: '0.75rem 1.25rem', borderRadius: 8, border: '1px solid #eaeaea', background: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                  Annuler
                </button>
                <button type="submit" disabled={updating}
                  style={{ padding: '0.75rem 1.5rem', borderRadius: 8, background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                  {updating ? 'Validation...' : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
