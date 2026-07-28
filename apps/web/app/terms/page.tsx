import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Conditions générales d'utilisation de la plateforme Assos 2.0 — gestion associative, tontines et mutuelles.",
};

export default function TermsPage() {
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
          {"Conditions d'utilisation"}
        </h1>
        <p style={{ color: '#94a3b8', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
          Dernière mise à jour : juillet 2025
        </p>

        {[
          {
            title: '1. Acceptation des conditions',
            content: `En utilisant la plateforme Assos 2.0, vous acceptez sans réserve les présentes conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, vous ne devez pas utiliser le service.`,
          },
          {
            title: '2. Description du service',
            content: `Assos 2.0 est une plateforme SaaS de gestion associative dédiée aux associations, tontines et mutuelles, principalement en Afrique subsaharienne. Le service permet la gestion des membres, des cotisations, des cycles de tontine, des prêts et des sanctions.`,
          },
          {
            title: '3. Inscription et compte',
            content: `Pour accéder au service, vous devez créer un compte avec des informations exactes et à jour. Vous êtes responsable de la confidentialité de vos identifiants et de toute activité effectuée via votre compte. Vous devez nous notifier immédiatement de toute utilisation non autorisée.`,
          },
          {
            title: '4. Rôles et responsabilités',
            content: `La plateforme distingue plusieurs rôles : Président, Trésorier et Membre. Le Président et le Trésorier disposent de droits d'administration étendus sur leur association. Chaque utilisateur est responsable des actions effectuées dans le cadre de son rôle.`,
          },
          {
            title: '5. Données financières',
            content: `Assos 2.0 facilite la gestion des flux financiers associatifs (cotisations, prêts, tontines). Nous ne sommes pas un établissement de crédit ni un prestataire de services de paiement. Les utilisateurs sont seuls responsables des transactions financières réelles effectuées hors de la plateforme.`,
          },
          {
            title: '6. Utilisation acceptable',
            content: `Il est interdit d'utiliser la plateforme à des fins illégales, frauduleuses, ou contraires aux lois en vigueur dans votre pays. Toute tentative de contournement des mesures de sécurité, d'accès non autorisé aux données d'autres utilisateurs, ou d'utilisation abusive du service entraîne la résiliation immédiate du compte.`,
          },
          {
            title: '7. Propriété intellectuelle',
            content: `Tous les droits de propriété intellectuelle relatifs à la plateforme Assos 2.0 (code, design, marques) appartiennent à leurs propriétaires respectifs. Les utilisateurs conservent la propriété de leurs données.`,
          },
          {
            title: '8. Limitation de responsabilité',
            content: `Le service est fourni "tel quel". Nous ne garantissons pas une disponibilité continue sans interruption. Notre responsabilité est limitée aux dommages directs et ne peut excéder le montant des abonnements payés au cours des 12 derniers mois.`,
          },
          {
            title: '9. Résiliation',
            content: `Vous pouvez résilier votre compte à tout moment. Nous nous réservons le droit de suspendre ou résilier tout compte en cas de violation des présentes conditions, sans préavis.`,
          },
          {
            title: '10. Droit applicable',
            content: `Les présentes conditions sont régies par le droit camerounais. Tout litige sera soumis aux tribunaux compétents de Yaoundé, Cameroun.`,
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
          <Link href="/privacy" style={{ color: '#a5b4fc', textDecoration: 'none', fontSize: '0.9rem' }}>
            Politique de confidentialité
          </Link>
          <Link href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
            ← Retour à l'accueil
          </Link>
        </div>
      </main>
    </div>
  );
}
