'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

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
}

interface Completeness {
  isComplete: boolean;
  completedCount: number;
  totalRequired: number;
  percentage: number;
  missingFields: string[];
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
  plan: 'DISCOVERY' | 'ESSENTIAL' | 'PRO' | 'ENTERPRISE';
  subscriptionStatus: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED';
  isActive: boolean;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  createdAt: string;
  completeness: Completeness;
  stats: {
    membersCount: number;
    caissesCount: number;
    tontinesCount: number;
    loansCount: number;
  };
}

interface AuditLog {
  id: string;
  action: string;
  details: string;
  createdAt: string;
  association?: {
    name: string;
    slug: string;
  };
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
  const [activeTab, setActiveTab] = useState<'associations' | 'co-admins' | 'audit' | 'settings'>('associations');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PlatformStats | null>(null);
  const [associations, setAssociations] = useState<HostedAssociation[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [filterCompliance, setFilterCompliance] = useState<'ALL' | 'COMPLETE' | 'INCOMPLETE'>('ALL');

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
  const [subStatus, setSubStatus] = useState<'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED'>('ACTIVE');
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [paymentReference, setPaymentReference] = useState('');
  const [updating, setUpdating] = useState(false);

  const SUPER_ADMIN_EMAIL = 'gerazayisti@gmail.com';

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    try {
      const resStats = await fetch('/api/backend/admin/stats');

      if (resStats.status === 401 || resStats.status === 403) {
        // Not authenticated -> redirect to login page
        window.location.href = '/login?redirect=/admin';
        return;
      }

      // Check if user is authenticated via mine endpoint
      const resMine = await fetch('/api/backend/associations/mine');
      if (resMine.status === 401 || resMine.status === 403) {
        window.location.href = '/login?redirect=/admin';
        return;
      }

      // Read session user email if present
      let currentUserEmail = '';
      try {
        const storedUser = localStorage.getItem('user_session') || sessionStorage.getItem('user_session');
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          currentUserEmail = parsed.email || '';
        }
      } catch {}

      // ENFORCE STRICT CHECK
      if (!currentUserEmail) {
        alert("Accès Refusé : Vous devez être connecté pour accéder à cette page.");
        window.location.href = '/login?redirect=/admin';
        return;
      }

      const allowed = [SUPER_ADMIN_EMAIL.toLowerCase(), ...coAdmins.map(c => c.email.toLowerCase())];
      if (!allowed.includes(currentUserEmail.toLowerCase())) {
        alert(`Accès Refusé : Le compte ${currentUserEmail} n'est pas autorisé à accéder au backoffice Super-Admin.`);
        window.location.href = '/login';
        return;
      }

      fetchAdminData();
    } catch {
      window.location.href = '/login?redirect=/admin';
    }
  };

  const fetchAdminData = async () => {
    try {
      const [resStats, resAssocs, resMine, resAudit] = await Promise.all([
        fetch('/api/backend/admin/stats'),
        fetch('/api/backend/admin/associations'),
        fetch('/api/backend/associations/mine'),
        fetch('/api/backend/admin/audit-logs'),
      ]);

      if (resStats.ok) {
        const statsData = await resStats.json();
        setData(statsData);
      }

      let allAssocs: any[] = [];

      if (resAssocs.ok) {
        const assocsData = await resAssocs.json();
        allAssocs = [...allAssocs, ...assocsData];
      }

      if (resMine.ok) {
        const mineData = await resMine.json();
        allAssocs = [...allAssocs, ...mineData];
      }

      // Read local cache as safety fallback
      try {
        const stored = JSON.parse(localStorage.getItem('created_associations') || '[]');
        if (Array.isArray(stored)) {
          allAssocs = [...allAssocs, ...stored];
        }
      } catch {}

      // Deduplicate by slug
      const uniqueMap = new Map<string, any>();
      allAssocs.forEach((item) => {
        const key = item.slug || item.id;
        if (!key) return;

        if (!uniqueMap.has(key)) {
          const hasName = Boolean(item.name && item.name.trim().length > 0);
          const hasMotto = Boolean(item.motto && item.motto.trim().length > 0);
          const hasLegalStatus = Boolean(item.legalStatus && item.legalStatus.trim().length > 0);
          const hasRegistrationRef = Boolean(item.registrationRef && item.registrationRef.trim().length > 0);

          const missingFields: string[] = [];
          if (!hasName) missingFields.push("Nom de l'association");
          if (!hasMotto) missingFields.push("Devise (Motto)");
          if (!hasLegalStatus) missingFields.push("Statut Légal");
          if (!hasRegistrationRef) missingFields.push("N° Récépissé / Enregistrement");

          const completedCount = 4 - missingFields.length;
          const completenessPercentage = Math.round((completedCount / 4) * 100);

          uniqueMap.set(key, {
            id: item.id || key,
            name: item.name || 'Association Sans Nom',
            slug: item.slug || 'slug-temp',
            motto: item.motto || null,
            legalStatus: item.legalStatus || null,
            registrationRef: item.registrationRef || null,
            country: item.country || 'CM',
            currency: item.currency || 'XAF',
            plan: item.plan || 'DISCOVERY',
            subscriptionStatus: item.subscriptionStatus || 'ACTIVE',
            isActive: item.isActive !== undefined ? item.isActive : true,
            trialEndsAt: item.trialEndsAt || null,
            subscriptionEndsAt: item.subscriptionEndsAt || null,
            createdAt: item.createdAt || new Date().toISOString(),
            completeness: item.completeness || {
              isComplete: missingFields.length === 0,
              completedCount,
              totalRequired: 4,
              percentage: completenessPercentage,
              missingFields,
            },
            stats: item.stats || {
              membersCount: 1,
              caissesCount: 1,
              tontinesCount: 0,
              loansCount: 0,
            },
          });
        }
      });

      setAssociations(Array.from(uniqueMap.values()));

      if (resAudit.ok) {
        const auditData = await resAudit.json();
        setAuditLogs(auditData);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (assoc: HostedAssociation) => {
    const newStatus = !assoc.isActive;
    const confirmMsg = newStatus
      ? `Voulez-vous réactiver l'association ${assoc.name} ?`
      : `ATTENTION : Voulez-vous suspendre l'association ${assoc.name} ?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/backend/admin/associations/${assoc.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus, reason: `Action SuperAdmin (gerazayisti@gmail.com)` }),
      });

      if (res.ok) {
        alert(`Association ${newStatus ? 'réactivée' : 'suspendue'} avec succès.`);
        fetchAdminData();
      }
    } catch {
      alert("Erreur lors du changement de statut.");
    }
  };

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssoc) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/backend/admin/associations/${selectedAssoc.id}/subscription`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: newPlan,
          subscriptionStatus: subStatus,
          durationMonths: Number(durationMonths) || 0,
          paymentReference,
        }),
      });

      if (res.ok) {
        alert(`Abonnement et durée mis à jour pour l'association ${selectedAssoc.name}.`);
        setSelectedAssoc(null);
        fetchAdminData();
      }
    } catch {
      alert("Erreur lors de la mise à jour de l'abonnement.");
    } finally {
      setUpdating(false);
    }
  };

  const handleAddCoAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!coAdminEmail) return;

    const newAdmin: CoAdmin = {
      id: Date.now().toString(),
      name: coAdminName || 'Co-Administrateur',
      email: coAdminEmail,
      phone: coAdminPhone,
      role: 'CO_ADMIN',
      addedAt: new Date().toISOString(),
    };

    setCoAdmins([...coAdmins, newAdmin]);
    setShowAddCoAdmin(false);
    setCoAdminName('');
    setCoAdminEmail('');
    setCoAdminPhone('');
    alert(`L'invitation Co-Administrateur a été émise pour ${coAdminEmail}.`);
  };

  const filteredAssocs = associations.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.slug.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterCompliance === 'COMPLETE') return a.completeness.isComplete;
    if (filterCompliance === 'INCOMPLETE') return !a.completeness.isComplete;
    return true;
  });

  const planBadges: Record<string, { label: string; bg: string; color: string }> = {
    DISCOVERY: { label: 'Découverte', bg: '#f1f5f9', color: '#475569' },
    ESSENTIAL: { label: 'Essentiel (9,9k)', bg: '#eff6ff', color: '#1d4ed8' },
    PRO: { label: 'Pro (24,9k)', bg: '#f3e8ff', color: '#7e22ce' },
    ENTERPRISE: { label: 'Enterprise', bg: '#ecfdf5', color: '#047857' },
  };

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: '#64748b', fontFamily: 'system-ui, sans-serif' }}>
        Chargement de l'Espace Super-Administration Assos 2.0...
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div style={{ padding: '2rem 3rem', maxWidth: 1550, margin: '0 auto', fontFamily: 'system-ui, sans-serif', color: '#0f172a' }}>
      
      {/* Super Admin Top Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#fff', padding: '2rem 2.5rem', borderRadius: 24, marginBottom: '2rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <span className="material-symbols-rounded" style={{ color: '#38bdf8', fontSize: '2.2rem' }}>admin_panel_settings</span>
              <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
                Plateforme Assos 2.0 — Espace Super-Admin & Co-Administration
              </h1>
            </div>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
              Supervision centrale des associations hébergées, contrôle de conformité des paramètres & abonnements SaaS.
            </p>
          </div>

          {/* Admin Identity Card */}
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', padding: '0.85rem 1.25rem', borderRadius: 16, backdropFilter: 'blur(8px)' }}>
            <div style={{ fontSize: '0.8rem', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Super-Administrateur Principal
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginTop: '0.2rem' }}>
              gerazayisti@gmail.com
            </div>
            <div style={{ fontSize: '0.85rem', color: '#cbd5e1', marginTop: '0.1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '1rem' }}>call</span>
              +237 695 18 37 68
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Associations Hébergées</span>
            <span className="material-symbols-rounded" style={{ color: '#2563eb' }}>domain</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0 0 0' }}>
            {stats?.totalAssociations || 0}
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
            {stats?.activeAssociations} Actives • {stats?.suspendedAssociations} Suspendues
          </span>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Conformité des Paramètres</span>
            <span className="material-symbols-rounded" style={{ color: '#059669' }}>rule</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#059669', margin: '0.5rem 0 0 0' }}>
            {associations.filter(a => a.completeness.isComplete).length} / {associations.length}
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: 600 }}>
            {associations.filter(a => !a.completeness.isComplete).length} Profils Incomplets
          </span>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Revenu Mensuel (MRR)</span>
            <span className="material-symbols-rounded" style={{ color: '#166534' }}>payments</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#166534', margin: '0.5rem 0 0 0' }}>
            {(stats?.mrrXaf || 0).toLocaleString('fr-FR')} FCFA
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            ARR Estimé : {(stats?.arrXaf || 0).toLocaleString('fr-FR')} FCFA / an
          </span>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 18, padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#64748b' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Co-Administrateurs</span>
            <span className="material-symbols-rounded" style={{ color: '#7c3aed' }}>manage_accounts</span>
          </div>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#7c3aed', margin: '0.5rem 0 0 0' }}>
            {coAdmins.length}
          </h2>
          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            Habilités sur le panel SuperAdmin
          </span>
        </div>

      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0', marginBottom: '1.5rem', gap: '1.5rem' }}>
        <button
          onClick={() => setActiveTab('associations')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'associations' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'associations' ? '#2563eb' : '#64748b',
            fontWeight: 700,
            padding: '0.75rem 0.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span className="material-symbols-rounded">domain</span>
          Registre des Associations ({associations.length})
        </button>

        <button
          onClick={() => setActiveTab('co-admins')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'co-admins' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'co-admins' ? '#2563eb' : '#64748b',
            fontWeight: 700,
            padding: '0.75rem 0.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span className="material-symbols-rounded">group_add</span>
          Co-Administrateurs ({coAdmins.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'audit' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'audit' ? '#2563eb' : '#64748b',
            fontWeight: 700,
            padding: '0.75rem 0.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span className="material-symbols-rounded">history</span>
          Journaux d'Audit Globaux ({auditLogs.length})
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          style={{
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'settings' ? '3px solid #2563eb' : '3px solid transparent',
            color: activeTab === 'settings' ? '#2563eb' : '#64748b',
            fontWeight: 700,
            padding: '0.75rem 0.5rem',
            fontSize: '1rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span className="material-symbols-rounded">settings</span>
          Configuration Plateforme
        </button>
      </div>

      {/* Tab 1: Associations List */}
      {activeTab === 'associations' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '1.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={() => setFilterCompliance('ALL')}
                style={{
                  background: filterCompliance === 'ALL' ? '#0f172a' : '#f1f5f9',
                  color: filterCompliance === 'ALL' ? '#fff' : '#475569',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: 999,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Toutes ({associations.length})
              </button>

              <button
                onClick={() => setFilterCompliance('COMPLETE')}
                style={{
                  background: filterCompliance === 'COMPLETE' ? '#166534' : '#f0fdf4',
                  color: filterCompliance === 'COMPLETE' ? '#fff' : '#166534',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: 999,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Profils Complets 100% ({associations.filter(a => a.completeness.isComplete).length})
              </button>

              <button
                onClick={() => setFilterCompliance('INCOMPLETE')}
                style={{
                  background: filterCompliance === 'INCOMPLETE' ? '#dc2626' : '#fef2f2',
                  color: filterCompliance === 'INCOMPLETE' ? '#fff' : '#dc2626',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: 999,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Informations Incomplètes ({associations.filter(a => !a.completeness.isComplete).length})
              </button>
            </div>

            <input
              type="text"
              placeholder="Rechercher par nom ou par slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 320, padding: '0.6rem 1rem', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
            />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                <th style={{ padding: '0.85rem 1rem' }}>Association</th>
                <th style={{ padding: '0.85rem 1rem' }}>Conformité Paramètres</th>
                <th style={{ padding: '0.85rem 1rem' }}>Formule SaaS</th>
                <th style={{ padding: '0.85rem 1rem' }}>Statut & Échéance</th>
                <th style={{ padding: '0.85rem 1rem' }}>Membres</th>
                <th style={{ padding: '0.85rem 1rem' }}>Actions SuperAdmin</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssocs.map((a) => (
                <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '1rem' }}>
                    <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a' }}>{a.name}</strong>
                    <span style={{ fontSize: '0.78rem', color: '#2563eb', fontWeight: 600 }}>{a.slug}.asso-in.online</span>
                  </td>

                  {/* Completeness Badge */}
                  <td style={{ padding: '1rem' }}>
                    {a.completeness.isComplete ? (
                      <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.3rem 0.65rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                        <span className="material-symbols-rounded" style={{ fontSize: '1rem' }}>check_circle</span>
                        Complet (4/4)
                      </span>
                    ) : (
                      <div>
                        <span style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '0.3rem 0.65rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span className="material-symbols-rounded" style={{ fontSize: '1rem' }}>warning</span>
                          Incomplet ({a.completeness.completedCount}/4)
                        </span>
                        <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.25rem', fontWeight: 600 }}>
                          Manque : {a.completeness.missingFields.join(', ')}
                        </div>
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '1rem' }}>
                    <span style={{ background: planBadges[a.plan]?.bg || '#f1f5f9', color: planBadges[a.plan]?.color || '#334155', padding: '0.3rem 0.65rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700 }}>
                      {planBadges[a.plan]?.label || a.plan}
                    </span>
                  </td>

                  <td style={{ padding: '1rem' }}>
                    {a.isActive ? (
                      <span style={{ background: '#f0fdf4', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                        ACTIF
                      </span>
                    ) : (
                      <span style={{ background: '#fef2f2', color: '#991b1b', padding: '0.2rem 0.5rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                        SUSPENDU
                      </span>
                    )}
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.2rem' }}>
                      {a.subscriptionEndsAt ? `Fin sub: ${new Date(a.subscriptionEndsAt).toLocaleDateString('fr-FR')}` : 'Essai actif'}
                    </div>
                  </td>

                  <td style={{ padding: '1rem', fontWeight: 600 }}>
                    {a.stats.membersCount} membres
                  </td>

                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => {
                          setSelectedAssoc(a);
                          setNewPlan(a.plan);
                          setSubStatus(a.subscriptionStatus);
                        }}
                        style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.45rem 0.85rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
                      >
                        Abonnement & Durée
                      </button>

                      <button
                        onClick={() => handleToggleStatus(a)}
                        style={{
                          background: a.isActive ? '#fef2f2' : '#f0fdf4',
                          border: `1px solid ${a.isActive ? '#fecaca' : '#bbf7d0'}`,
                          color: a.isActive ? '#991b1b' : '#166534',
                          padding: '0.45rem 0.75rem',
                          borderRadius: 8,
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        {a.isActive ? 'Suspendre' : 'Activer'}
                      </button>

                      <Link
                        href={`/${a.slug}/dashboard`}
                        style={{ background: '#0f172a', color: '#fff', textDecoration: 'none', padding: '0.45rem 0.75rem', borderRadius: 8, fontSize: '0.8rem', fontWeight: 600 }}
                      >
                        Voir →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 2: Co-Admins Management */}
      {activeTab === 'co-admins' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '1.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.25rem 0' }}>
                Co-Administrateurs de la Plateforme
              </h3>
              <p style={{ color: '#64748b', fontSize: '0.88rem', margin: 0 }}>
                Habilitations d'accès déléguées au backoffice de supervision.
              </p>
            </div>

            <button
              onClick={() => setShowAddCoAdmin(true)}
              style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem 1.25rem', borderRadius: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <span className="material-symbols-rounded">person_add</span>
              Inviter un Co-Administrateur
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {coAdmins.map((admin) => (
              <div key={admin.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1.1rem 1.5rem', borderRadius: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{admin.name}</strong>
                  <div style={{ fontSize: '0.85rem', color: '#2563eb', fontWeight: 600, marginTop: '0.15rem' }}>{admin.email}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.15rem' }}>
                    Téléphone : {admin.phone || 'Non renseigné'}
                  </div>
                </div>

                <div>
                  <span style={{ background: admin.role === 'SUPER_ADMIN' ? '#0f172a' : '#eff6ff', color: admin.role === 'SUPER_ADMIN' ? '#fff' : '#1d4ed8', padding: '0.4rem 0.8rem', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700 }}>
                    {admin.role === 'SUPER_ADMIN' ? 'SUPER ADMINISTRATEUR PRINCIPAL' : 'CO-ADMINISTRATEUR'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'audit' && (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '1.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1.25rem 0' }}>Journaux d'Audit Globaux</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {auditLogs.map((log) => (
              <div key={log.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem 1.25rem', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{log.action}</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.2rem' }}>
                    Association: <strong>{log.association?.name || 'Plateforme'}</strong> • {log.details}
                  </div>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
                  {new Date(log.createdAt).toLocaleString('fr-FR')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: System Settings */}
      {activeTab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-rounded" style={{ color: '#2563eb' }}>cell_tower</span>
              Passerelles Mobile Money (MTN & Orange)
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>
              Agrégateurs locaux intégrés : <strong>MeSomb, Campay, CinetPay, TouchPay</strong> pour la collecte Push USSD et le retrait vers les portefeuilles virtuels.
            </p>
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, color: '#166534', fontSize: '0.85rem', fontWeight: 700 }}>
              Webhooks HMAC-SHA256 Signés : ACTIF
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="material-symbols-rounded" style={{ color: '#d97706' }}>sms</span>
              SMS & Notifications Critiques (Termii)
            </h3>
            <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.6 }}>
              Crédits SMS mutualisés pour l'envoi des rappels de cotisations de deuil (priorité 48h-72h) et des alertes de prêts.
            </p>
            <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, color: '#b45309', fontSize: '0.85rem', fontWeight: 700 }}>
              Solde SMS Plateforme : 45 800 SMS disponibles
            </div>
          </div>
        </div>
      )}

      {/* Modal: Invite Co-Admin */}
      {showAddCoAdmin && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: 20, maxWidth: 480, width: '100%' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontWeight: 800, fontSize: '1.2rem' }}>Inviter un Co-Administrateur</h3>
            <form onSubmit={handleAddCoAdmin}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>Nom & Prénom</label>
                <input
                  type="text"
                  required
                  placeholder="Nom complet"
                  value={coAdminName}
                  onChange={(e) => setCoAdminName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: '0.3rem' }}
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>Adresse Email (Obligatoire)</label>
                <input
                  type="email"
                  required
                  placeholder="coadmin@domaine.com"
                  value={coAdminEmail}
                  onChange={(e) => setCoAdminEmail(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: '0.3rem' }}
                />
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>Numéro de téléphone</label>
                <input
                  type="text"
                  placeholder="Ex: 695000000"
                  value={coAdminPhone}
                  onChange={(e) => setCoAdminPhone(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: '0.3rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddCoAdmin(false)} style={{ padding: '0.6rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: 8, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" style={{ padding: '0.6rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  Émettre l'invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Advanced Subscription & Duration Editor */}
      {selectedAssoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: 20, maxWidth: 520, width: '100%', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 1rem 0', fontWeight: 800, fontSize: '1.25rem' }}>
              Gestion de l'Abonnement — {selectedAssoc.name}
            </h3>

            <form onSubmit={handleUpdateSubscription}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.3rem' }}>Formule SaaS</label>
                <select
                  value={newPlan}
                  onChange={(e) => setNewPlan(e.target.value as any)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  <option value="DISCOVERY">Formule Découverte (Gratuit)</option>
                  <option value="ESSENTIAL">Formule Essentiel (9 900 XAF/mois)</option>
                  <option value="PRO">Formule Pro (24 900 XAF/mois)</option>
                  <option value="ENTERPRISE">Formule Enterprise (Sur Devis)</option>
                </select>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.3rem' }}>Durée de la prolongation</label>
                <select
                  value={durationMonths}
                  onChange={(e) => setDurationMonths(parseInt(e.target.value) || 0)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                >
                  <option value={1}>+ 1 mois</option>
                  <option value={3}>+ 3 mois (Trimestre)</option>
                  <option value={6}>+ 6 mois (Semestre)</option>
                  <option value={12}>+ 12 mois (1 An - Réduction 2 mois)</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.3rem' }}>Référence du règlement (Optionnel)</label>
                <input
                  type="text"
                  placeholder="Ex: Payé par Mobile Money 695183768 / Virement"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  style={{ width: '100%', padding: '0.65rem', borderRadius: 10, border: '1px solid #cbd5e1', fontSize: '0.9rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setSelectedAssoc(null)}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer', fontWeight: 600 }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  style={{ padding: '0.65rem 1.25rem', borderRadius: 10, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  {updating ? 'Mise à jour...' : 'Valider l\'Abonnement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
