'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../settings.module.css';

export default function PrivacyPolicyPage() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || '';

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
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>Politique de Confidentialité</h1>
        </div>
        <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
          Protection de vos données financières et personnelles au sein de la plateforme Assos 2.0.
        </p>
      </div>

      <div className={styles.card} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '2rem' }}>
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-rounded" style={{ color: '#2563eb' }}>shield</span>
            1. Engagement Général de Confidentialité
          </h2>
          <p style={{ color: '#334155', lineHeight: 1.7, fontSize: '0.95rem' }}>
            La sécurité et la confidentialité des données financières et nominatives de votre association sont au cœur de l'architecture d'Assos 2.0. 
            Toutes les informations enregistrées (cotisations, tontines, crédits, délibérations, émargements) sont strictement réservées à l'usage interne des membres et des administrateurs habilités de l'association <strong>{tenantSlug.toUpperCase()}</strong>.
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-rounded" style={{ color: '#166534' }}>lock</span>
            2. Données Collectées & Traitement
          </h2>
          <ul style={{ color: '#334155', lineHeight: 1.8, fontSize: '0.95rem', paddingLeft: '1.5rem' }}>
            <li><strong>Profils Membres</strong> : Noms, prénoms, numéros de téléphone, emails et rôles au bureau.</li>
            <li><strong>Opérations Financières</strong> : Historique des dépôts, décaissements, versements tontiniers, remboursements de prêts et ristournes de cassation.</li>
            <li><strong>Relances Multi-Canaux</strong> : Historique d'envoi des convocations et rappels par Email, SMS et WhatsApp.</li>
            <li><strong>Gouvernance & Procès-Verbaux</strong> : Décomptes de votes des assemblées et documents stockés dans la GED.</li>
          </ul>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-rounded" style={{ color: '#d97706' }}>database</span>
            3. Garanties Transactionnelles ACID & Intégrité
          </h2>
          <p style={{ color: '#334155', lineHeight: 1.7, fontSize: '0.95rem' }}>
            Afin de prévenir tout litige ou fraude, chaque mouvement de trésorerie est inscrit dans un journal de transactions immuable avec horodatage strict et référence unique. Aucune opération financière ne peut être altérée en mémoire sans laisser une trace auditable (Audit Log).
          </p>
        </section>

        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-rounded" style={{ color: '#7c3aed' }}>download</span>
            4. Portabilité & Droits des Membres
          </h2>
          <p style={{ color: '#334155', lineHeight: 1.7, fontSize: '0.95rem' }}>
            Conformément aux principes de portabilité des données (RGPD / Réglementations locales) :
          </p>
          <ul style={{ color: '#334155', lineHeight: 1.8, fontSize: '0.95rem', paddingLeft: '1.5rem' }}>
            <li>L'administrateur peut à tout moment effectuer un <strong>Export Intégral (JSON/Excel)</strong> des archives de l'association.</li>
            <li>Chaque membre peut consulter à tout moment son reçu officiel de paiement certifié.</li>
          </ul>
        </section>

        <div style={{ paddingTop: '1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Dernière mise à jour : Juillet 2026 — Assos 2.0 Enterprise</span>
          <Link
            href={`/${tenantSlug}/settings`}
            style={{
              background: '#0f172a',
              color: '#ffffff',
              padding: '0.6rem 1.2rem',
              borderRadius: 10,
              fontSize: '0.9rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Retour aux paramètres
          </Link>
        </div>
      </div>
    </div>
  );
}
