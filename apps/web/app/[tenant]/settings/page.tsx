'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './settings.module.css';

interface Association {
  id: string;
  name: string;
  slug: string;
  motto: string | null;
  currency: string;
  country: string;
  legalStatus: string | null;
  registrationRef: string | null;
  plan: 'DISCOVERY' | 'ESSENTIAL' | 'PRO' | 'ENTERPRISE';
  subscriptionStatus: 'ACTIVE' | 'TRIAL' | 'EXPIRED' | 'CANCELLED';
  savingsInterestRate: number;
  joiningFee: number;
  role?: string;
  logoUrl?: string | null;
}

export default function SettingsPage() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || '';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [association, setAssociation] = useState<Association | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [motto, setMotto] = useState('');
  const [legalStatus, setLegalStatus] = useState('');
  const [registrationRef, setRegistrationRef] = useState('');
  const [currency, setCurrency] = useState('XAF');
  const [country, setCountry] = useState('CM');
  const [savingsInterestRate, setSavingsInterestRate] = useState<number>(0);
  const [joiningFee, setJoiningFee] = useState<number>(0);
  const [plan, setPlan] = useState<'DISCOVERY' | 'ESSENTIAL' | 'PRO' | 'ENTERPRISE'>('DISCOVERY');
  const [logoUrl, setLogoUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'FINANCE' | 'SUBSCRIPTION'>('GENERAL');

  // Billing Cycle Toggle (Monthly vs Annual)
  const [isAnnual, setIsAnnual] = useState(false);

  // iframe Popup Payment State
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const isPresident = association?.role === 'PRESIDENT';

  useEffect(() => {
    if (tenantSlug) {
      fetchMyAssociations();
    }
  }, [tenantSlug]);

  const fetchMyAssociations = async () => {
    try {
      const res = await fetch('/api/backend/associations/mine');
      if (res.ok) {
        const list: Association[] = await res.json();
        const current = list.find((a) => a.slug === tenantSlug);
        if (current) {
          setAssociation(current);
          setName(current.name || '');
          setMotto(current.motto || '');
          setLegalStatus(current.legalStatus || 'Association Loi 90/053');
          setRegistrationRef(current.registrationRef || '');
          setCurrency(current.currency || 'XAF');
          setCountry(current.country || 'CM');
          setSavingsInterestRate(current.savingsInterestRate || 0);
          setJoiningFee(current.joiningFee || 0);
          setPlan(current.plan || 'DISCOVERY');
          setLogoUrl(current.logoUrl || '');
        } else {
          setError("Association introuvable ou accès non autorisé.");
        }
      }
    } catch {
      setError("Erreur de connexion lors du chargement de l'association.");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!association) return;

    if (!isPresident) {
      setError("Seul le Président de l'association possède les droits d'édition des paramètres et de l'abonnement.");
      return;
    }

    setSaving(true);
    setSuccess('');
    setError('');

    try {
      const res = await fetch(`/api/backend/associations/${association.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          motto,
          legalStatus,
          registrationRef,
          currency,
          country,
          savingsInterestRate,
          joiningFee,
          plan,
          logoUrl,
        }),
      });

      if (res.ok) {
        setSuccess('Paramètres mis à jour avec succès.');
        fetchMyAssociations();
      } else {
        const err = await res.json().catch(() => ({}));
        setError(err.message || 'Erreur lors de la mise à jour.');
      }
    } catch {
      setError('Erreur de connexion.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file size (e.g. max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert("Le fichier est trop volumineux (max 5 Mo).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setLogoUrl(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleExport = async () => {
    if (!association) return;
    try {
      const res = await fetch(`/api/backend/associations/${association.id}/export`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `export-${association.slug}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Erreur lors de l'exportation des données.");
      }
    } catch {
      alert("Erreur de connexion lors de l'exportation.");
    }
  };

  const subscriptionPlans = [
    {
      id: 'ESSENTIAL',
      name: 'STARTER',
      priceMonthly: '5 000 XAF',
      priceAnnual: '55 000 XAF',
      monthlyLink: 'https://business.freemopay.com/pay-link/a22a9b45a71fd5068e6cd156d04fd8',
      annualLink: 'https://business.freemopay.com/pay-link/1688817f28228020749c2a41321e71',
      color: '#000000',
      features: [
        '1 association autorisée',
        'Jusqu’à 50 membres',
        'Tontine de base (fixe & tirage)',
        'Gestion des prêts & cautions',
        '100 SMS de relance / mois',
        'Export de données JSON',
      ]
    },
    {
      id: 'PRO',
      name: 'BUSINESS',
      priceMonthly: '15 000 XAF',
      priceAnnual: '165 000 XAF',
      monthlyLink: 'https://business.freemopay.com/pay-link/d43fb1dabda88266f9a8a4dd99acb6',
      annualLink: 'https://business.freemopay.com/pay-link/63c0fdd1b47df54316a8816d997a35',
      color: '#000000',
      features: [
        'Jusqu’à 3 associations',
        'Jusqu’à 200 membres',
        'Tontine avancée (enchère, parts)',
        'Gestion des prêts avancés',
        '500 SMS de relance / mois',
        'Génération de rapports PDF',
      ]
    },
    {
      id: 'ENTERPRISE',
      name: 'GOLD',
      priceMonthly: '35 000 XAF',
      priceAnnual: '385 000 XAF',
      monthlyLink: 'https://business.freemopay.com/pay-link/27b1282a2bbb6a3f1ab8a0f12c15e6',
      annualLink: 'https://business.freemopay.com/pay-link/bc3ec7763ea26e5f40fd0409a1b814',
      color: '#000000',
      features: [
        'Associations & membres illimités',
        'Module de Vote & AG complet',
        'Recommandations financières IA',
        'SMS critiques de deuil illimités',
        'Nom de domaine personnalisé',
        'Support prioritaire 4h dédié',
      ]
    }
  ];

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>Chargement des paramètres...</div>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ fontFamily: 'system-ui, sans-serif' }}>
      
      {/* Top Header & Role Indicator */}
      <div className={styles.header} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#0f172a' }}>
            Paramètres & Formules d'Abonnement — {tenantSlug.toUpperCase()}
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            Configurez les informations officielles de votre association et gérez votre abonnement SaaS.
          </p>
        </div>

        {/* Role Badge */}
        <div>
          {isPresident ? (
            <span style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '0.5rem 1rem', borderRadius: 999, fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>verified_user</span>
              Mode Édition (Président)
            </span>
          ) : (
            <span style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '0.5rem 1rem', borderRadius: 999, fontSize: '0.85rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>visibility</span>
              Mode Lecture Seule ({association?.role || 'Membre'})
            </span>
          )}
        </div>
      </div>

      {success && (
        <div className={styles.successAlert} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', padding: '1rem', borderRadius: 12, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-rounded">check_circle</span>
          <span>{success}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #e2e8f0', marginBottom: '2rem', overflowX: 'auto' }}>
        <button type="button" onClick={() => setActiveTab('GENERAL')} style={{ background: 'none', border: 'none', borderBottom: activeTab === 'GENERAL' ? '2px solid #000000' : '2px solid transparent', padding: '0.75rem 1rem', fontWeight: 600, color: activeTab === 'GENERAL' ? '#000000' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
          <span className="material-symbols-rounded">domain</span> Identité & Paramètres
        </button>
        <button type="button" onClick={() => setActiveTab('FINANCE')} style={{ background: 'none', border: 'none', borderBottom: activeTab === 'FINANCE' ? '2px solid #000000' : '2px solid transparent', padding: '0.75rem 1rem', fontWeight: 600, color: activeTab === 'FINANCE' ? '#000000' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
          <span className="material-symbols-rounded">payments</span> Règles Financières
        </button>
        <button type="button" onClick={() => setActiveTab('SUBSCRIPTION')} style={{ background: 'none', border: 'none', borderBottom: activeTab === 'SUBSCRIPTION' ? '2px solid #000000' : '2px solid transparent', padding: '0.75rem 1rem', fontWeight: 600, color: activeTab === 'SUBSCRIPTION' ? '#000000' : '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap' }}>
          <span className="material-symbols-rounded">stars</span> Abonnement SaaS
        </button>
      </div>

      {/* Grid: Settings & Billing */}
      <div style={{ display: 'block' }}>
        
        {/* Form Container */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
          
          {activeTab === 'GENERAL' && (
          <div className={styles.card} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1.25rem 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
              <span className="material-symbols-rounded" style={{ color: '#000000' }}>domain</span>
              Identité Officielle & Juridique
            </h2>

            {/* Avatar / Logo Section */}
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: 12, border: '1px dashed #cbd5e1' }}>
              <div style={{ width: 64, height: 64, borderRadius: 16, background: logoUrl ? '#fff' : '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.5rem', fontWeight: 800, overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{name ? name.charAt(0).toUpperCase() : 'A'}</span>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155', display: 'block', marginBottom: '0.5rem' }}>
                  Logo de l'Association
                </label>
                
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <button 
                    type="button"
                    disabled={!isPresident}
                    onClick={() => fileInputRef.current?.click()}
                    style={{ background: '#000000', color: '#fff', border: 'none', padding: '0.6rem 1rem', borderRadius: 8, fontWeight: 600, cursor: isPresident ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: '1.2rem' }}>upload</span>
                    Uploader une image
                  </button>
                  {logoUrl && isPresident && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl('')}
                      style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', padding: '0.6rem 1rem', borderRadius: 8, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: '1.2rem' }}>delete</span>
                      Supprimer
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/webp"
                  style={{ display: 'none' }}
                  onChange={handleLogoUpload}
                />
                
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.75rem', marginBottom: 0 }}>
                  Formats acceptés : PNG, JPG, WEBP. Taille max : 5 Mo.
                </p>
              </div>
            </div>

            <div className={styles.formGroup} style={{ marginBottom: '1.1rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155' }}>Nom de l'Association</label>
              <input
                type="text"
                className={styles.input}
                value={name}
                disabled={!isPresident}
                onChange={(e) => setName(e.target.value)}
                style={{ marginTop: '0.35rem' }}
              />
            </div>

            <div className={styles.formGroup} style={{ marginBottom: '1.1rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155' }}>Devise (Motto)</label>
              <input
                type="text"
                className={styles.input}
                value={motto}
                disabled={!isPresident}
                onChange={(e) => setMotto(e.target.value)}
                placeholder="Ex: Solidarité, Entraide et Progrès"
                style={{ marginTop: '0.35rem' }}
              />
            </div>

            <div className={styles.formGroup} style={{ marginBottom: '1.1rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155' }}>Statut Légal (Déclaration)</label>
              <input
                type="text"
                className={styles.input}
                value={legalStatus}
                disabled={!isPresident}
                onChange={(e) => setLegalStatus(e.target.value)}
                placeholder="Ex: Declaration Préfecture (Loi n° 90/053)"
                style={{ marginTop: '0.35rem' }}
              />
            </div>

            <div className={styles.formGroup} style={{ marginBottom: '1.1rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155' }}>N° d'Enregistrement / Récépissé</label>
              <input
                type="text"
                className={styles.input}
                value={registrationRef}
                disabled={!isPresident}
                onChange={(e) => setRegistrationRef(e.target.value)}
                placeholder="Ex: Ref. 124/RDA/J06/SAAJP"
                style={{ marginTop: '0.35rem' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155' }}>Monnaie</label>
                <select
                  className={styles.input}
                  value={currency}
                  disabled={!isPresident}
                  onChange={(e) => setCurrency(e.target.value)}
                  style={{ marginTop: '0.35rem' }}
                >
                  <option value="XAF">FCFA (XAF)</option>
                  <option value="XOF">FCFA (XOF)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="USD">Dollar ($)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155' }}>Pays</label>
                <select
                  className={styles.input}
                  value={country}
                  disabled={!isPresident}
                  onChange={(e) => setCountry(e.target.value)}
                  style={{ marginTop: '0.35rem' }}
                >
                  <option value="CM">Cameroun (CM)</option>
                  <option value="CI">Côte d'Ivoire (CI)</option>
                  <option value="SN">Sénégal (SN)</option>
                  <option value="GA">Gabon (GA)</option>
                  <option value="FR">France (FR)</option>
                </select>
              </div>
            </div>

            {isPresident && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                <button type="submit" className={styles.submitBtn} disabled={saving} style={{ background: '#0f172a', color: '#fff', borderRadius: 10, padding: '0.8rem 1.25rem', fontWeight: 600, width: '100%', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-rounded">save</span>
                  {saving ? 'Enregistrement...' : 'Enregistrer les informations générales'}
                </button>
              </div>
            )}
          </div>
          )}

          {/* Rules & Tariffs */}
          {activeTab === 'FINANCE' && (
          <div className={styles.card} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 1.25rem 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#0f172a' }}>
              <span className="material-symbols-rounded" style={{ color: '#000000' }}>payments</span>
              Règles Financières Assoc.
            </h2>

            <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155' }}>Droit d'adhésion ({currency})</label>
              <input
                type="number"
                step="100"
                min="0"
                className={styles.input}
                value={joiningFee}
                disabled={!isPresident}
                onChange={(e) => setJoiningFee(parseFloat(e.target.value) || 0)}
                style={{ marginTop: '0.35rem' }}
              />
            </div>

            <div className={styles.formGroup} style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontWeight: 600, fontSize: '0.88rem', color: '#334155' }}>Taux d'intérêt Épargne (%)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                className={styles.input}
                value={savingsInterestRate}
                disabled={!isPresident}
                onChange={(e) => setSavingsInterestRate(parseFloat(e.target.value) || 0)}
                style={{ marginTop: '0.35rem' }}
              />
            </div>

            {isPresident && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #f1f5f9' }}>
                <button type="submit" className={styles.submitBtn} disabled={saving} style={{ background: '#0f172a', color: '#fff', borderRadius: 10, padding: '0.8rem 1.25rem', fontWeight: 600, width: '100%', cursor: 'pointer', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                  <span className="material-symbols-rounded">save</span>
                  {saving ? 'Enregistrement...' : 'Enregistrer les règles financières'}
                </button>
              </div>
            )}
          </div>
          )}

          {/* Links & Portability */}
          {activeTab !== 'SUBSCRIPTION' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
            <button type="button" onClick={handleExport} style={{ background: '#1e293b', color: '#fff', border: 'none', padding: '0.85rem', borderRadius: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <span className="material-symbols-rounded">download</span>
              Export JSON
            </button>

            <Link href={`/${tenantSlug}/settings/privacy`} style={{ background: '#f8fafc', border: '1px solid #cbd5e1', color: '#0f172a', textDecoration: 'none', padding: '0.85rem', borderRadius: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <span className="material-symbols-rounded" style={{ color: '#000000' }}>shield</span>
              Vie Privée
            </Link>
          </div>
          )}

        </form>

        {/* Right Side: Subscription Pricing Table */}
        {activeTab === 'SUBSCRIPTION' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px' }}>
          
          <div className={styles.card} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.75rem' }}>
            
            {/* Toggle Annual/Monthly */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                Forfaits d'Abonnement SaaS
              </h2>

              <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: 999 }}>
                <button
                  type="button"
                  onClick={() => setIsAnnual(false)}
                  style={{
                    border: 'none',
                    background: !isAnnual ? '#ffffff' : 'none',
                    color: !isAnnual ? '#0f172a' : '#64748b',
                    padding: '0.4rem 0.85rem',
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Mensuel
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnnual(true)}
                  style={{
                    border: 'none',
                    background: isAnnual ? '#ffffff' : 'none',
                    color: isAnnual ? '#0f172a' : '#64748b',
                    padding: '0.4rem 0.85rem',
                    borderRadius: 999,
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Annuel (-17%)
                </button>
              </div>
            </div>

            {/* Trial expiration notice */}
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', color: '#b45309', padding: '0.85rem 1rem', borderRadius: 12, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '1.2rem' }}>info</span>
              <span>
                Votre période d'essai gratuit se termine dans <strong>14 jours</strong>.
              </span>
            </div>

            {/* Plan Cards Stack */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {subscriptionPlans.map((p) => {
                const isCurrent = plan === p.id;
                const price = isAnnual ? p.priceAnnual : p.priceMonthly;
                const link = isAnnual ? p.annualLink : p.monthlyLink;

                return (
                  <div
                    key={p.id}
                    style={{
                      border: isCurrent ? `2.5px solid ${p.color}` : '1px solid #e2e8f0',
                      borderRadius: 16,
                      padding: '1.25rem',
                      background: isCurrent ? `${p.color}05` : '#fff',
                      position: 'relative'
                    }}
                  >
                    {isCurrent && (
                      <span style={{ position: 'absolute', top: '1rem', right: '1rem', background: p.color, color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: 999 }}>
                        PLAN ACTUEL
                      </span>
                    )}

                    <h3 style={{ margin: '0 0 0.2rem 0', fontWeight: 800, color: p.color, fontSize: '1.15rem' }}>
                      {p.name}
                    </h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a' }}>
                      {price}
                    </div>

                    <ul style={{ paddingLeft: '1.25rem', margin: '0.75rem 0 1.25rem 0', fontSize: '0.8rem', color: '#475569', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.35rem' }}>
                      {p.features.map((f, idx) => (
                        <li key={idx} style={{ marginBottom: 0 }}>{f}</li>
                      ))}
                    </ul>

                    {isPresident ? (
                      <button
                        type="button"
                        onClick={() => setPaymentUrl(link)}
                        style={{
                          width: '100%',
                          background: isCurrent ? '#64748b' : p.color,
                          color: '#fff',
                          border: 'none',
                          padding: '0.65rem',
                          borderRadius: 10,
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                        }}
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>credit_card</span>
                        {isCurrent ? 'Renouveler le forfait' : 'S\'abonner / Surclasser'}
                      </button>
                    ) : (
                      <button
                        disabled
                        style={{
                          width: '100%',
                          background: '#e2e8f0',
                          color: '#94a3b8',
                          border: 'none',
                          padding: '0.65rem',
                          borderRadius: 10,
                          fontWeight: 700,
                          fontSize: '0.85rem',
                        }}
                      >
                        Action réservée au Président
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        )}

      </div>

      {/* Beautiful Iframe Popup Modal for payment links */}
      {paymentUrl && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '1.5rem' }}>
          <div style={{ background: '#fff', borderRadius: 24, width: '100%', maxWidth: 750, height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="material-symbols-rounded" style={{ color: '#000000' }}>lock</span>
                <strong style={{ fontSize: '1rem', color: '#0f172a' }}>Paiement Sécurisé Mobile Money / Carte</strong>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPaymentUrl(null);
                  fetchMyAssociations();
                }}
                style={{ background: '#f1f5f9', border: 'none', padding: '0.4rem', borderRadius: 999, cursor: 'pointer', display: 'flex' }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: '1.2rem', color: '#475569' }}>close</span>
              </button>
            </div>

            {/* Iframe content */}
            <div style={{ flex: 1, position: 'relative' }}>
              <iframe
                src={paymentUrl}
                title="Passerelle de Paiement Freemopay"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>

            {/* Modal Footer */}
            <div style={{ padding: '0.75rem 1.5rem', background: '#f8fafc', borderTop: '1px solid #f1f5f9', textAlign: 'center', fontSize: '0.78rem', color: '#64748b' }}>
              Ne fermez pas cette fenêtre avant d'avoir finalisé votre transaction Push USSD.
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
