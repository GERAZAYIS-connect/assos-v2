import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '../../components/Footer';

export const metadata: Metadata = {
  title: "Conditions d'utilisation",
  description: "Conditions générales d'utilisation de la plateforme Assos 2.0 — gestion associative, tontines et mutuelles.",
};

export default function TermsPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#ffffff',
      color: '#0f172a',
      fontFamily: "'Outfit', 'Inter', sans-serif",
    }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid #e2e8f0',
        padding: '1.25rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#ffffff'
      }}>
        <Link href="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          textDecoration: 'none',
          color: '#000000',
          fontWeight: 900,
          fontSize: '1.25rem',
        }}>
          <span className="material-symbols-rounded" style={{ color: '#000000' }}>diversity_3</span>
          Assos 2.0
        </Link>
        <Link href="/login" style={{
          color: '#000000',
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: '0.95rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.3rem'
        }}>
          Se connecter <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>arrow_forward</span>
        </Link>
      </header>

      {/* Content */}
      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 1.25rem 6rem' }}>
        <h1 style={{
          fontSize: '2.5rem',
          fontWeight: 900,
          marginBottom: '0.5rem',
          color: '#000000',
          letterSpacing: '-0.02em'
        }}>
          Conditions Générales d'Utilisation
        </h1>
        <p style={{ color: '#64748b', marginBottom: '3rem', fontSize: '1rem', fontWeight: 500 }}>
          Dernière mise à jour : Juillet 2026
        </p>

        <div style={{ lineHeight: 1.7, color: '#334155', fontSize: '1.05rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p>
            Bienvenue sur Assos 2.0 ! En accédant et en utilisant notre plateforme, vous acceptez sans réserve les présentes conditions générales d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser le service.
          </p>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#000000', marginTop: '1rem' }}>1. Description du service</h2>
          <p>
            Assos 2.0 est une plateforme logicielle SaaS (Software as a Service) dédiée à la gestion numérique des associations, des tontines, et des mutuelles, principalement axée sur les usages en Afrique (notamment au Cameroun). La plateforme permet de :
          </p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>Gérer les membres et les cotisations</li>
            <li>Suivre les cycles de tontine (y compris les enchères)</li>
            <li>Gérer les prêts (mutuelle) et les remboursements</li>
            <li>Appliquer et suivre les sanctions financières</li>
          </ul>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#000000', marginTop: '1rem' }}>2. Inscription et sécurité du compte</h2>
          <p>
            Pour accéder à certaines fonctionnalités, vous devez créer un compte utilisateur. Vous êtes tenu de :
          </p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>Fournir des informations exactes et complètes.</li>
            <li>Maintenir la confidentialité de vos identifiants (mot de passe).</li>
            <li>Être entièrement responsable de toute activité sous votre compte.</li>
          </ul>
          <p>
            Nous nous réservons le droit de suspendre ou de supprimer tout compte fournissant des informations frauduleuses ou enfreignant ces conditions.
          </p>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#000000', marginTop: '1rem' }}>3. Responsabilités financières et limites</h2>
          <p>
            <strong>Important :</strong> Assos 2.0 est un <em>outil de gestion administrative et comptable</em>. Nous ne sommes <strong>pas</strong> une institution financière, une banque, ou un intermédiaire de crédit.
          </p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>Les utilisateurs (Présidents, Trésoriers, Membres) sont seuls responsables des flux financiers réels.</li>
            <li>Assos 2.0 ne garantit pas le paiement des cotisations par les membres ni le remboursement des prêts.</li>
            <li>La plateforme intègre des méthodes de paiement (ex. Mobile Money), qui sont fournies par des opérateurs tiers. Nous déclinons toute responsabilité en cas de panne de ces réseaux externes.</li>
          </ul>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#000000', marginTop: '1rem' }}>4. Propriété intellectuelle</h2>
          <p>
            Tous les éléments composant la plateforme Assos 2.0 (logos, textes, code source, design) sont notre propriété exclusive. Il est strictement interdit de copier, modifier, ou distribuer ces éléments sans notre autorisation écrite préalable. Vous conservez toutefois l'entière propriété des données de votre association que vous importez sur la plateforme.
          </p>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#000000', marginTop: '1rem' }}>5. Résiliation</h2>
          <p>
            Vous êtes libre de résilier votre compte à tout moment en nous contactant. Assos 2.0 se réserve le droit de suspendre ou clôturer l'accès à la plateforme en cas de non-paiement de l'abonnement (pour les plans payants) ou en cas d'utilisation abusive (spam, fraude, violation de la loi).
          </p>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#000000', marginTop: '1rem' }}>6. Contact</h2>
          <p>
            Pour toute question concernant ces Conditions d'Utilisation, vous pouvez nous contacter à : <strong>gerazayisti@gmail.com</strong>.
          </p>
        </div>

        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '1.5rem' }}>
          <Link href="/privacy" style={{ color: '#000000', textDecoration: 'underline', fontWeight: 600, fontSize: '1rem' }}>
            Consulter la Politique de confidentialité
          </Link>
          <Link href="/contact" style={{ color: '#64748b', textDecoration: 'none', fontWeight: 500, fontSize: '1rem' }}>
            Nous contacter
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
