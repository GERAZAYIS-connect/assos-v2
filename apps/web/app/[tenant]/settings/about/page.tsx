'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../settings.module.css';

export default function AboutPage() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || '';

  const modules = [
    { icon: 'groups', name: 'Gestion des Membres', desc: 'Fiches membres, statuts, cartes d’adhérents et droits du bureau.' },
    { icon: 'account_balance', name: 'Multi-Caisses & Trésorerie', desc: 'Gestion multi-caisses, reçus de paiement et comptabilité en temps réel.' },
    { icon: 'currency_exchange', name: 'Tontines & Séances', desc: 'Attributions, enchères tontinières, émargements et cotisations périodiques.' },
    { icon: 'handshake', name: 'Prêts & Crédits', desc: 'Demandes de prêt, échéanciers automatisés, calcul des intérêts et garanties.' },
    { icon: 'gavel', name: 'Amendes & Sanctions', desc: 'Règlement intérieur, pénalités de retard et recouvrement des impayés.' },
    { icon: 'event', name: 'Réunions & Émargement', desc: 'Convocations, présence numérique, ordre du jour et suivi des assemblées.' },
    { icon: 'how_to_vote', name: 'Votes & Gouvernance AG', desc: 'Scrutins secrets/publics, résolutions, quorums et comptes rendus d’AG.' },
    { icon: 'pie_chart', name: 'Budget & Cassation ACID', desc: 'Prévisions budgétaires, bilan financier et redistribution automatique des bénéfices sur intérêts.' },
    { icon: 'folder_open', name: 'GED & Archiving', desc: 'Stockage sécurisé des statuts, règlements intérieurs et Procès-Verbaux.' },
    { icon: 'notifications', name: 'Centre de Notifications & Relances', desc: 'Alertes en temps réel et relances multi-canaux (Email, SMS et WhatsApp).' },
    { icon: 'dashboard', name: 'Tableau de Bord Exécutif', desc: 'Supervision globale en temps réel avec indicateurs clés de performance.' },
  ];

  return (
    <div className={styles.container} style={{ maxWidth: '100%', margin: 0, padding: '1.5rem 2rem' }}>
      <div className={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <Link
            href={`/${tenantSlug}/settings`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#f1f5f9',
              color: '#0f172a',
              textDecoration: 'none',
            }}
          >
            <span className="material-symbols-rounded">arrow_back</span>
          </Link>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>À Propos de Assos 2.0</h1>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Solution complète d'administration et de gestion financière pour associations, tontines et mutuelles.
        </p>
      </div>

      {/* Version Card */}
      <div className={styles.card} style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', borderRadius: 16, padding: '2rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '2rem', color: '#fbbf24' }}>verified</span>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>Assos 2.0 Enterprise</h2>
              <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>Version 2.0.4 — Build Stable 2026</span>
            </div>
          </div>
          <span style={{ background: '#22c55e20', border: '1px solid #22c55e40', color: '#4ade80', padding: '0.4rem 0.8rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 700 }}>
            SYSTÈME OPÉRATIONNEL
          </span>
        </div>
      </div>

      {/* Integrated Modules List */}
      <div className={styles.card} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '2rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-rounded" style={{ color: '#2563eb' }}>apps</span>
          Les 11 Modules Unifiés de la Plateforme
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {modules.map((m) => (
            <div key={m.name} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1rem', display: 'flex', gap: '0.85rem' }}>
              <span className="material-symbols-rounded" style={{ color: '#2563eb', fontSize: '1.5rem', marginTop: '0.1rem' }}>{m.icon}</span>
              <div>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'block' }}>{m.name}</strong>
                <span style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4, display: 'block', marginTop: '0.25rem' }}>{m.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Support & Credits */}
      <div className={styles.card} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span className="material-symbols-rounded" style={{ color: '#166534' }}>support_agent</span>
          Assistance Technique & Support
        </h2>
        <p style={{ color: '#334155', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1rem' }}>
          Assos 2.0 est conçu pour offrir une fiabilité maximale aux associations et tontines. Notre équipe assure la maintenance continue, la sécurité des sauvegardes et la mise en conformité des calculs financiers.
        </p>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link
            href={`/${tenantSlug}/settings`}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              padding: '0.65rem 1.25rem',
              borderRadius: 10,
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span className="material-symbols-rounded">arrow_back</span>
            Retour aux Paramètres
          </Link>
        </div>
      </div>
    </div>
  );
}
