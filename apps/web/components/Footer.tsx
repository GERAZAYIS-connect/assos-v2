'use client';

import React from 'react';
import Link from 'next/link';

export default function Footer() {
  return (
    <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
      {/* Background Gradient for the whole footer area */}
      <div style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0, 
        background: 'linear-gradient(to bottom, #ffffff, #f8fafc)', 
        zIndex: -1 
      }} />

      {/* CTA Section */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1.25rem 0' }}>
        <div style={{ 
          background: 'url("/cta/vl-cta-thumb-1.1.png") no-repeat center center/cover',
          borderRadius: 24,
          padding: '4rem 2rem',
          textAlign: 'center',
          color: '#ffffff',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '2rem', lineHeight: 1.2 }}>
            Transformez la gestion de votre<br />association dès aujourd'hui
          </h2>
          <div style={{ display: 'flex', maxWidth: 450, margin: '0 auto', background: '#ffffff', padding: '0.4rem', borderRadius: 999, alignItems: 'center' }}>
            <input type="email" placeholder="Entrez votre adresse email" style={{ flex: 1, border: 'none', background: 'transparent', padding: '0 1rem', fontSize: '0.95rem', color: '#000', outline: 'none' }} />
            <button style={{ background: '#000000', color: '#ffffff', border: 'none', padding: '0.85rem 1.5rem', borderRadius: 999, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Démarrer gratuitement
              <span className="material-symbols-rounded" style={{ fontSize: '1.2rem' }}>arrow_forward</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer Content */}
      <footer style={{ maxWidth: 1200, margin: '4rem auto 2rem', padding: '0 1.25rem', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1.2fr', gap: '2rem' }}>
        
        {/* Brand Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div style={{ width: 40, height: 40, background: '#000000', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-rounded" style={{ color: '#ffffff', fontWeight: 800 }}>diversity_3</span>
            </div>
            <strong style={{ fontSize: '1.2rem', color: '#000000', letterSpacing: '1px' }}>Assos 2.0</strong>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem', maxWidth: 280 }}>
            Gérez vos tontines, mutuelles et réunions en toute simplicité avec Assos 2.0.
          </p>
          <div style={{ display: 'flex', background: '#ffffff', padding: '0.3rem', borderRadius: 999, alignItems: 'center', border: '1px solid #e2e8f0' }}>
            <input type="email" placeholder="Adresse email" style={{ flex: 1, border: 'none', background: 'transparent', padding: '0 1rem', fontSize: '0.9rem', color: '#000', outline: 'none', minWidth: 0 }} />
            <button style={{ background: '#000000', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 999, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              S'abonner
              <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Product Column */}
        <div>
          <h4 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.05rem' }}>Produit</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li><Link href="/#tarifs" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Tarifs</Link></li>
            <li><Link href="/#features" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Fonctionnalités</Link></li>
            <li><Link href="/#integrations" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Intégrations</Link></li>
            <li><Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Nouveautés</Link></li>
          </ul>
        </div>

        {/* Company Column */}
        <div>
          <h4 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.05rem' }}>Entreprise</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li><Link href="/about" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>À propos</Link></li>
            <li><Link href="/contact" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Nous contacter</Link></li>
            <li><Link href="/blog" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Blog</Link></li>
          </ul>
        </div>

        {/* Resources Column */}
        <div>
          <h4 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.05rem' }}>Ressources</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li><Link href="/help" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Centre d'aide</Link></li>
            <li><Link href="/privacy" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Confidentialité</Link></li>
            <li><Link href="/terms" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Conditions d'utilisation</Link></li>
          </ul>
        </div>

        {/* Download App Column */}
        <div>
          <h4 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.05rem' }}>Télécharger l'App</h4>
          <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Bientôt disponible sur :
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', opacity: 0.7 }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="Apple" style={{ width: 24, height: 24, opacity: 0.5 }} />
              <div>
                <div style={{ fontSize: '0.65rem' }}>Bientôt sur</div>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>App Store</div>
              </div>
            </div>
            <div style={{ background: '#f8fafc', color: '#94a3b8', border: '1px solid #e2e8f0', borderRadius: 8, padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', textAlign: 'left', opacity: 0.7 }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" style={{ width: 24, height: 24, filter: 'grayscale(100%)', opacity: 0.5 }} />
              <div>
                <div style={{ fontSize: '0.65rem' }}>Bientôt sur</div>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>Microsoft</div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <div style={{ padding: '2rem 1.25rem', borderTop: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem' }}>
        &copy; {new Date().getFullYear()} Assos 2.0. Tous droits réservés.
      </div>

      <div style={{ position: 'absolute', bottom: '2rem', right: '2rem' }}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ width: 48, height: 48, borderRadius: '50%', background: '#ffffff', border: '2px solid #000000', color: '#000000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <span className="material-symbols-rounded">arrow_upward</span>
        </button>
      </div>
    </div>
  );
}
