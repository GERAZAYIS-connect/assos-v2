import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '../../components/Footer';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: "Politique de confidentialité de la plateforme Assos 2.0 — gestion associative, tontines et mutuelles.",
};

export default function PrivacyPage() {
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
          Politique de Confidentialité
        </h1>
        <p style={{ color: '#64748b', marginBottom: '3rem', fontSize: '1rem', fontWeight: 500 }}>
          Dernière mise à jour : Juillet 2026
        </p>

        <div style={{ lineHeight: 1.7, color: '#334155', fontSize: '1.05rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <p>
            La présente politique de confidentialité décrit comment Assos 2.0 ("nous", "notre" ou "nos") recueille, stocke, utilise et/or partage ("traite") vos informations lorsque vous utilisez nos services ("Services"), par exemple lorsque vous :
          </p>
          <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }}>
            <li>Visitez notre site Web à l'adresse <strong>assos-v2.vercel.app</strong> (ou tout autre site Web associé)</li>
            <li>Téléchargez et utilisez notre application mobile (bientôt disponible)</li>
            <li>Interagissez avec nous d'une autre manière (ventes, marketing, événements)</li>
          </ul>
          <p>
            Des questions ou des préoccupations ? La lecture de cet avis de confidentialité vous aidera à comprendre vos droits. Si vous n'êtes pas d'accord avec nos politiques, veuillez ne pas utiliser nos Services. Pour toute question, contactez-nous à <strong>gerazayisti@gmail.com</strong>.
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '2rem 0' }} />

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#000000', marginTop: '1rem' }}>1. QUELLES INFORMATIONS COLLECTONS-NOUS ?</h2>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginTop: '1rem' }}>Informations personnelles que vous nous divulguez</h3>
          <p>
            <strong>En bref :</strong> Nous collectons les informations personnelles que vous nous fournissez.
          </p>
          <p>
            Les informations personnelles que nous collectons dépendent du contexte de vos interactions avec nous et les Services, des choix que vous faites, et des produits et fonctionnalités que vous utilisez. Cela inclut :
          </p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>Noms et prénoms</li>
            <li>Numéros de téléphone</li>
            <li>Adresses e-mail</li>
            <li>Mots de passe et données d'authentification</li>
            <li>Préférences de contact</li>
          </ul>
          <p>
            <strong>Informations sensibles :</strong> Nous ne traitons pas d'informations sensibles (origine raciale, opinions politiques, croyances religieuses, etc.).
          </p>
          
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginTop: '1rem' }}>Informations collectées automatiquement</h3>
          <p>
            <strong>En bref :</strong> Certaines informations, telles que votre adresse IP et/ou les caractéristiques de votre navigateur et de votre appareil, sont collectées automatiquement.
          </p>
          <p>
            Ces informations ne révèlent pas votre identité spécifique mais peuvent inclure des informations sur l'appareil et l'utilisation (adresse IP, navigateur, système d'exploitation, préférences de langue, localisation, etc.). Ces informations sont principalement nécessaires pour maintenir la sécurité de nos Services.
          </p>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#000000', marginTop: '2rem' }}>2. COMMENT TRAITONS-NOUS VOS INFORMATIONS ?</h2>
          <p>
            <strong>En bref :</strong> Nous traitons vos informations pour fournir, améliorer et administrer nos Services, communiquer avec vous, pour la sécurité et la prévention des fraudes.
          </p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li><strong>Pour faciliter la création et l'authentification de compte :</strong> Vous permettre de créer un compte et de vous y connecter.</li>
            <li><strong>Pour fournir nos services :</strong> Gérer vos associations, tontines, mutuelles et membres.</li>
            <li><strong>Pour répondre aux demandes :</strong> Offrir un support technique et administratif.</li>
            <li><strong>Pour protéger nos Services :</strong> Surveiller et prévenir la fraude.</li>
          </ul>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#000000', marginTop: '2rem' }}>3. QUAND ET AVEC QUI PARTAGEONS-NOUS VOS INFORMATIONS ?</h2>
          <p>
            Nous ne partageons vos données personnelles que dans les situations suivantes :
          </p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li><strong>Transferts d'entreprise :</strong> En cas de fusion ou rachat.</li>
            <li><strong>Autres utilisateurs :</strong> Au sein de votre association, les autres membres (et en particulier les administrateurs) peuvent voir votre nom, profil et vos contributions financières (cotisations).</li>
            <li><strong>Avec votre consentement :</strong> Pour toute autre finalité si vous y consentez expressément.</li>
          </ul>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#000000', marginTop: '2rem' }}>4. COMBIEN DE TEMPS CONSERVONS-NOUS VOS INFORMATIONS ?</h2>
          <p>
            Nous conservons vos informations aussi longtemps que nécessaire pour atteindre les objectifs décrits dans cet avis, à moins qu'une période de conservation plus longue ne soit requise par la loi. Lorsque nous n'avons plus de besoin commercial légitime de traiter vos données, nous les supprimons ou les anonymisons.
          </p>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#000000', marginTop: '2rem' }}>5. COMMENT ASSURONS-NOUS LA SÉCURITÉ DE VOS INFORMATIONS ?</h2>
          <p>
            Nous avons mis en place des mesures de sécurité techniques et organisationnelles appropriées (chiffrement, accès restreint). Toutefois, aucune transmission sur Internet n'étant sûre à 100%, nous ne pouvons garantir une sécurité absolue. Vous utilisez les Services à vos propres risques.
          </p>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#000000', marginTop: '2rem' }}>6. VOS DROITS EN MATIÈRE DE CONFIDENTIALITÉ</h2>
          <p>
            Selon votre zone géographique (notamment dans l'Espace économique européen), vous disposez de droits vous permettant :
          </p>
          <ul style={{ paddingLeft: '1.5rem' }}>
            <li>De demander l'accès à vos données personnelles</li>
            <li>De demander leur rectification ou leur effacement</li>
            <li>De restreindre le traitement de vos informations</li>
            <li>De retirer votre consentement à tout moment</li>
          </ul>
          <p>
            Pour exercer ces droits, vous pouvez modifier les paramètres de votre compte ou nous contacter directement à <strong>gerazayisti@gmail.com</strong>.
          </p>
        </div>

        <div style={{ marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '1.5rem' }}>
          <Link href="/terms" style={{ color: '#000000', textDecoration: 'underline', fontWeight: 600, fontSize: '1rem' }}>
            Consulter les Conditions d'utilisation
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
