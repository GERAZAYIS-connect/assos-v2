import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: "Politique de confidentialité de la plateforme Assos 2.0 — gestion associative, tontines et mutuelles.",
};

export default function PrivacyPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      color: '#e2e8f0',
      fontFamily: "'Outfit', 'Inter', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '1.25rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          textDecoration: 'none',
          color: '#f8fafc',
          fontWeight: 700,
          fontSize: '1.2rem',
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '1rem',
          }}>A</span>
          Assos 2.0
        </Link>
        <Link href="/login" style={{
          color: '#a5b4fc',
          textDecoration: 'none',
          fontSize: '0.9rem',
        }}>
          Se connecter →
        </Link>
      </header>

      {/* Content */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
          background: 'linear-gradient(135deg, #a5b4fc, #818cf8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>
          Politique de confidentialité
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
          Dernière mise à jour : juillet 2025
        </p>

        {[
          {
            title: '1. Données collectées',
            content: `Nous collectons les informations suivantes lors de votre inscription et utilisation de la plateforme : nom, prénom, adresse e-mail, numéro de téléphone, et les données liées à vos associations (membres, cotisations, transactions). Ces données sont strictement nécessaires au fonctionnement du service.`,
          },
          {
            title: '2. Utilisation des données',
            content: `Vos données sont utilisées exclusivement pour : la gestion de votre compte, le fonctionnement des fonctionnalités de gestion associative (tontines, mutuelles, prêts), l'envoi de notifications importantes liées à vos associations, et l'amélioration du service.`,
          },
          {
            title: '3. Partage des données',
            content: `Nous ne vendons, ne louons et ne partageons pas vos données personnelles avec des tiers à des fins commerciales. Les données peuvent être partagées uniquement avec des prestataires techniques nécessaires au fonctionnement du service (hébergement, envoi d'e-mails), sous contrat de confidentialité.`,
          },
          {
            title: '4. Sécurité',
            content: `Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour protéger vos données : chiffrement des communications (HTTPS), hachage des mots de passe, accès restreint aux données sensibles, et sauvegardes régulières.`,
          },
          {
            title: '5. Conservation des données',
            content: `Vos données sont conservées tant que votre compte est actif. En cas de suppression de compte, vos données personnelles sont supprimées dans un délai de 30 jours, à l'exception des données requises par la loi.`,
          },
          {
            title: '6. Vos droits',
            content: `Vous disposez d'un droit d'accès, de rectification, d'effacement et de portabilité de vos données. Pour exercer ces droits, contactez-nous à : privacy@asso-in.online`,
          },
          {
            title: '7. Contact',
            content: `Pour toute question relative à cette politique, contactez notre délégué à la protection des données : privacy@asso-in.online`,
          },
        ].map((section) => (
          <section key={section.title} style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.75rem', color: '#c7d2fe' }}>
              {section.title}
            </h2>
            <p style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '0.95rem' }}>
              {section.content}
            </p>
          </section>
        ))}

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', gap: '1rem' }}>
          <Link href="/terms" style={{ color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9rem' }}>
            Conditions d'utilisation
          </Link>
          <Link href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Retour à l'accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
