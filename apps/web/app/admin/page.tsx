'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface PlatformStats {
  primaryAdmin: {
    email: string;
    phone: string;
    role: string;
  };
  stats: {
    totalAssociations: number;
    activeAssociations: number;
    suspendedAssociations: number;
    totalMembers: number;
    totalTransactions: number;
    totalVolume: number;
    mrrXaf: number;
    arrXaf: number;
    smsConsumed: number;
    storageUsedGb: string;
    uptime: string;
    auditLogsCount: number;
  };
  registrationHistory: { name: string; total: number }[];
}

interface HostedAssociation {
  id: string;
  name: string;
  slug: string;
  motto: string | null;
  legalStatus: string | null;
  registrationRef: string | null;
  country: string;
  currency: string;
  plan: string;
  subscriptionStatus: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED';
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    members: number;
    caisses: number;
    tontines: number;
    loans: number;
  };
}

interface AuditLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  association: { name: string } | null;
}

interface CoAdmin {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  addedAt: string;
}

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'associations' | 'co-admins' | 'audit' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PlatformStats | null>(null);
  const [associations, setAssociations] = useState<HostedAssociation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');

  // Co-Admins list state
  const [coAdmins, setCoAdmins] = useState<CoAdmin[]>([
    { id: '1', name: 'Administrateur Principal', email: 'gerazayisti@gmail.com', phone: '695183768', role: 'SUPER_ADMIN', addedAt: new Date().toISOString() }
  ]);
  const [showAddCoAdmin, setShowAddCoAdmin] = useState(false);
  const [coAdminName, setCoAdminName] = useState('');
  const [coAdminEmail, setCoAdminEmail] = useState('');
  const [coAdminPhone, setCoAdminPhone] = useState('');

  // Modal: Advanced Subscription Management
  const [selectedAssoc, setSelectedAssoc] = useState<HostedAssociation | null>(null);
  const [newPlan, setNewPlan] = useState<'DISCOVERY' | 'ESSENTIAL' | 'PRO' | 'ENTERPRISE'>('ESSENTIAL');
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [resStats, resAssocs, resAudit] = await Promise.all([
        fetch('/api/backend/admin/stats'),
        fetch('/api/backend/admin/associations'),
        fetch('/api/backend/admin/audit-logs'),
      ]);

      if (resStats.status === 401 || resStats.status === 403 || resAssocs.status === 401 || resAssocs.status === 403) {
        window.location.href = '/login?redirect=/admin';
        return;
      }

      if (resStats.ok) {
        const stats = await resStats.json();
        setData(stats);
      }
      if (resAssocs.ok) {
        const assocs = await resAssocs.json();
        setAssociations(assocs);
      }
      if (resAudit.ok) {
        const audit = await resAudit.json();
        setAuditLogs(audit);
      }
    } catch (err) {
      console.error(err);
      window.location.href = '/login?redirect=/admin';
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssoc) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/backend/admin/associations/${selectedAssoc.id}/subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: newPlan,
          durationMonths,
          status: 'ACTIVE'
        }),
      });

      if (res.ok) {
        alert('Abonnement mis à jour avec succès.');
        setSelectedAssoc(null);
        fetchAdminData();
      } else {
        const err = await res.json();
        alert('Erreur: ' + (err.message || 'Impossible de mettre à jour'));
      }
    } catch (err) {
      console.error(err);
      alert('Erreur système lors de la mise à jour.');
    } finally {
      setUpdating(false);
    }
  };

  const toggleAssociationStatus = async (assoc: HostedAssociation) => {
    const action = assoc.isActive ? 'Suspendre' : 'Réactiver';
    if (!confirm(`Voulez-vous vraiment ${action.toLowerCase()} l'association ${assoc.name} ?`)) return;

    try {
      const res = await fetch(`/api/backend/admin/associations/${assoc.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !assoc.isActive }),
      });

      if (res.ok) {
        fetchAdminData();
      } else {
        alert("Erreur lors du changement de statut.");
      }
    } catch (e) {
      console.error(e);
      alert("Erreur réseau.");
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa', color: '#000' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <span className="material-symbols-rounded" style={{ fontSize: '3rem', animation: 'spin 1s linear infinite' }}>autorenew</span>
          <span style={{ fontWeight: 600 }}>Chargement sécurisé de la console d'administration...</span>
        </div>
      </div>
    );
  }

  const filteredAssociations = associations.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#fafafa', color: '#111', fontFamily: '"Inter", sans-serif' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '280px', background: '#000', color: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh', overflowY: 'auto' }}>
        <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid #333' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
            <div style={{ width: 32, height: 32, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-rounded" style={{ color: '#000', fontSize: '1.25rem' }}>admin_panel_settings</span>
            </div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0 }}>ASSOS HQ</h1>
          </div>
          <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Super-Admin Console</span>
        </div>

        <nav style={{ padding: '1.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1 }}>
          {[
            { id: 'overview', icon: 'dashboard', label: 'Vue d\'ensemble' },
            { id: 'associations', icon: 'corporate_fare', label: 'Associations' },
            { id: 'co-admins', icon: 'shield_person', label: 'Co-Administrateurs' },
            { id: 'audit', icon: 'list_alt', label: 'Journaux d\'Audit' },
            { id: 'settings', icon: 'tune', label: 'Paramètres Système' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.85rem 1rem', borderRadius: '8px',
                background: activeTab === tab.id ? '#fff' : 'transparent',
                color: activeTab === tab.id ? '#000' : '#888',
                border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', transition: 'all 0.2s', textAlign: 'left'
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: '1.2rem' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '1.5rem', borderTop: '1px solid #333' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: 36, height: 36, background: '#333', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
              {data?.primaryAdmin.email.substring(0, 1).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{data?.primaryAdmin.email}</div>
              <div style={{ fontSize: '0.7rem', color: '#888' }}>{data?.primaryAdmin.role}</div>
            </div>
          </div>
          <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ff4444', fontSize: '0.85rem', fontWeight: 600, marginTop: '1rem', textDecoration: 'none' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>logout</span>
            Déconnexion
          </Link>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '2.5rem', overflowY: 'auto' }}>
        
        {/* HEADER */}
        <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 0.5rem 0', letterSpacing: '-0.02em' }}>
              {activeTab === 'overview' && 'Vue d\'ensemble de la plateforme'}
              {activeTab === 'associations' && 'Gestion des Locataires'}
              {activeTab === 'co-admins' && 'Co-Administrateurs'}
              {activeTab === 'audit' && 'Sécurité & Traçabilité'}
              {activeTab === 'settings' && 'Paramètres Système'}
            </h2>
            <p style={{ color: '#666', margin: 0, fontSize: '0.95rem' }}>
              Tableau de bord de supervision sécurisé.
            </p>
          </div>
        </header>

        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* KPI Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
              {[
                { label: 'Associations Actives', value: data.stats.activeAssociations, icon: 'corporate_fare' },
                { label: 'Membres Globaux', value: data.stats.totalMembers, icon: 'group' },
                { label: 'Transactions Traitées', value: data.stats.totalTransactions, icon: 'receipt_long' },
                { label: 'Revenu Mensuel (MRR)', value: `${data.stats.mrrXaf.toLocaleString('fr-FR')} XAF`, icon: 'trending_up' },
              ].map((kpi, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '12px', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</span>
                    <span className="material-symbols-rounded" style={{ color: '#000' }}>{kpi.icon}</span>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#000', letterSpacing: '-0.03em' }}>
                    {kpi.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Chart Area */}
            <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.5rem' }}>Croissance des inscriptions (6 derniers mois)</h3>
              <div style={{ height: '300px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.registrationHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eaeaea" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ background: '#000', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 500 }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="total" stroke="#000" strokeWidth={3} dot={{ r: 4, fill: '#000', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>
        )}

        {/* TAB: ASSOCIATIONS (DATATABLE ZÉBRÉE) */}
        {activeTab === 'associations' && (
          <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            
            {/* Toolbar */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #eaeaea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '300px' }}>
                <span className="material-symbols-rounded" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontSize: '1.2rem' }}>search</span>
                <input 
                  type="text" 
                  placeholder="Rechercher une association..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.5rem', borderRadius: '8px', border: '1px solid #eaeaea', fontSize: '0.9rem', outline: 'none' }}
                />
              </div>
              <button style={{ background: '#000', color: '#fff', border: 'none', padding: '0.65rem 1rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                Exporter CSV
              </button>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #eaeaea' }}>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#666', width: '35%' }}>Nom & Réf.</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#666', width: '15%' }}>Membres</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#666', width: '20%' }}>Plan SaaS</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#666', width: '15%' }}>Statut</th>
                    <th style={{ padding: '1rem 1.5rem', fontWeight: 600, color: '#666', width: '15%', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssociations.map((assoc, idx) => (
                    <tr key={assoc.id} style={{ borderBottom: '1px solid #eaeaea', background: idx % 2 === 0 ? '#fff' : '#fafafa', transition: 'background 0.2s' }}>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <div style={{ fontWeight: 600, color: '#000', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {assoc.name}
                          {!assoc.isActive && (
                            <span className="material-symbols-rounded" style={{ fontSize: '1rem', color: '#ff4444' }}>block</span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.2rem' }}>{assoc.registrationRef || 'Réf. Inconnue'}</div>
                      </td>
                      <td style={{ padding: '1rem 1.5rem', fontWeight: 500 }}>{assoc._count.members}</td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        <span style={{ padding: '0.3rem 0.6rem', borderRadius: '4px', background: '#eee', color: '#333', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                          {assoc.plan}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.5rem' }}>
                        {assoc.subscriptionStatus === 'ACTIVE' && <span style={{ color: '#16a34a', fontWeight: 600, fontSize: '0.85rem' }}>• Actif</span>}
                        {assoc.subscriptionStatus === 'TRIAL' && <span style={{ color: '#ca8a04', fontWeight: 600, fontSize: '0.85rem' }}>• Essai</span>}
                        {assoc.subscriptionStatus === 'EXPIRED' && <span style={{ color: '#dc2626', fontWeight: 600, fontSize: '0.85rem' }}>• Expiré</span>}
                        {assoc.subscriptionStatus === 'CANCELLED' && <span style={{ color: '#52525b', fontWeight: 600, fontSize: '0.85rem' }}>• Annulé</span>}
                      </td>
                      <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button 
                            onClick={() => setSelectedAssoc(assoc)}
                            title="Modifier l'abonnement"
                            style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #eaeaea', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>payments</span>
                          </button>
                          <button 
                            onClick={() => toggleAssociationStatus(assoc)}
                            title={assoc.isActive ? "Suspendre l'association" : "Réactiver l'association"}
                            style={{ width: '32px', height: '32px', borderRadius: '6px', border: '1px solid #eaeaea', background: assoc.isActive ? '#fff' : '#000', color: assoc.isActive ? '#ff4444' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>{assoc.isActive ? 'block' : 'play_arrow'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredAssociations.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: '#888' }}>Aucune association trouvée.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: CO-ADMINS */}
        {activeTab === 'co-admins' && (
          <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
             <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1.5rem 0' }}>Liste des Co-Administrateurs</h3>
             {/* Simple List for now */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {coAdmins.map((admin) => (
                <div key={admin.id} style={{ border: '1px solid #eaeaea', padding: '1.25rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', color: '#000' }}>{admin.name}</div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>{admin.email}</div>
                  </div>
                  <span style={{ padding: '0.4rem 0.8rem', background: admin.role === 'SUPER_ADMIN' ? '#000' : '#f0f0f0', color: admin.role === 'SUPER_ADMIN' ? '#fff' : '#000', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                    {admin.role}
                  </span>
                </div>
              ))}
             </div>
             <button style={{ marginTop: '1.5rem', background: '#000', color: '#fff', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}>
                + Inviter un Co-Admin
             </button>
          </div>
        )}

        {/* TAB: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div style={{ background: '#fff', border: '1px solid #eaeaea', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 1.5rem 0' }}>Journaux d'Audit (Sécurité)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {auditLogs.length > 0 ? auditLogs.map(log => (
                <div key={log.id} style={{ borderBottom: '1px solid #eaeaea', paddingBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{log.action}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{new Date(log.createdAt).toLocaleString('fr-FR')}</span>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>{log.association?.name ? `[${log.association.name}] ` : ''}{log.details}</div>
                </div>
              )) : (
                <div style={{ color: '#888', fontSize: '0.9rem' }}>Aucun journal récent.</div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* SUBSCRIPTION MODAL */}
      {selectedAssoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
          <div style={{ background: '#fff', padding: '2.5rem', borderRadius: '16px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 1.5rem 0', fontWeight: 800, fontSize: '1.3rem', letterSpacing: '-0.02em' }}>
              Abonnement — {selectedAssoc.name}
            </h3>
            <form onSubmit={handleUpdateSubscription}>
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Formule SaaS</label>
                <select value={newPlan} onChange={(e) => setNewPlan(e.target.value as any)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eaeaea', fontSize: '0.95rem', outline: 'none' }}>
                  <option value="DISCOVERY">Découverte (Gratuit)</option>
                  <option value="ESSENTIAL">Essentiel (9 900 XAF/mois)</option>
                  <option value="PRO">Pro (24 900 XAF/mois)</option>
                  <option value="ENTERPRISE">Enterprise</option>
                </select>
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Prolonger de :</label>
                <select value={durationMonths} onChange={(e) => setDurationMonths(parseInt(e.target.value) || 0)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #eaeaea', fontSize: '0.95rem', outline: 'none' }}>
                  <option value={1}>+ 1 mois</option>
                  <option value={3}>+ 3 mois (Trimestre)</option>
                  <option value={6}>+ 6 mois (Semestre)</option>
                  <option value={12}>+ 12 mois (1 An)</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setSelectedAssoc(null)} style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', border: '1px solid #eaeaea', background: '#fff', cursor: 'pointer', fontWeight: 600, color: '#000' }}>
                  Annuler
                </button>
                <button type="submit" disabled={updating} style={{ padding: '0.75rem 1.25rem', borderRadius: '8px', background: '#000', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
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
