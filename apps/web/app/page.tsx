'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [email, setEmail] = useState('');
  const [activeCard, setActiveCard] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'Assos 2.0',
    'applicationCategory': 'BusinessApplication',
    'operatingSystem': 'All',
    'description': 'Logiciel de gestion d’associations, tontines (njangi) et mutuelles de référence en Afrique.',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'XAF',
    },
  };

  interface PublicAssoc {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
    country: string;
    memberCount: number;
  }
  const [activeAssociations, setActiveAssociations] = useState<PublicAssoc[]>([]);

  // Country flag emoji helper
  const countryFlag = (code: string) => {
    const base = 0x1F1E6 - 0x41;
    return String.fromCodePoint(...code.toUpperCase().split('').map(c => base + c.charCodeAt(0)));
  };

  useEffect(() => {
    fetch('/api/backend/associations/public')
      .then(r => r.ok ? r.json() : [])
      .then((data: PublicAssoc[]) => {
        if (data && data.length > 0) {
          setActiveAssociations(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{ background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh', scrollBehavior: 'smooth' }}>
      
      {/* CSS Animations & Responsive Overrides */}
      <style jsx global>{`
        @keyframes scrollCarousel {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-carousel {
          animation: scrollCarousel 28s linear infinite;
        }
        .animate-carousel:hover {
          animation-play-state: paused;
        }
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
          .hero-title { font-size: 2.25rem !important; }
          .hero-subtitle { font-size: 1.05rem !important; }
          .floating-pill { display: none !important; }
          .header-container { padding: 1rem 1.25rem !important; }
        }
        @media (min-width: 769px) {
          .mobile-menu-btn { display: none !important; }
          .mobile-drawer { display: none !important; }
        }
      `}</style>

      {/* Schema.org SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1 & 2. Hero & Header Area with Premium Dark Background */}
      <div style={{
        position: 'relative',
        background: 'url("/banner/vl-banner-thumb1.1.png") no-repeat center center/cover fixed',
        color: '#ffffff',
        paddingBottom: '4rem',
        overflow: 'hidden'
      }}>
        
        {/* Header Navigation */}
        <header className="header-container" style={{
          padding: '1.25rem 2.5rem',
          maxWidth: 1400,
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          zIndex: 100
        }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 900, fontSize: '1.35rem' }}>
            <span className="material-symbols-rounded" style={{ color: '#e9e9e9', fontSize: '2rem' }}>diversity_3</span>
            <span style={{ color: '#fff', letterSpacing: '-0.02em' }}>Assos 2.0</span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="desktop-nav" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: 999,
            padding: '0.6rem 2.2rem',
            backdropFilter: 'blur(10px)',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}>
            <Link href="#solutions" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Solutions</Link>
            <Link href="#technologie" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Technologie</Link>
            <Link href="#fonctionnement" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Fonctionnement</Link>
            <Link href="#tarifs" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Tarifs</Link>
          </nav>

          {/* Desktop Right Action & Mobile Burger Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Link href="/login" style={{
              color: '#ffffff',
              textDecoration: 'none',
              fontSize: '0.9rem',
              fontWeight: 700,
              padding: '0.6rem 1.1rem',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.05)',
            }}>
              Connexion
            </Link>

            <Link href="/register" className="desktop-nav" style={{
              background: '#ffffff',
              color: '#0f172a',
              textDecoration: 'none',
              padding: '0.65rem 1.4rem',
              borderRadius: 999,
              fontWeight: 800,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: '0 4px 15px rgba(255,255,255,0.2)',
            }}>
              Essai Gratuit
              <span className="material-symbols-rounded" style={{ fontSize: '1.1rem', fontWeight: 800 }}>arrow_right_alt</span>
            </Link>

            {/* Mobile Toggle Button */}
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{
                display: 'none',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.2)',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '0.5rem',
                cursor: 'pointer',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: '1.6rem' }}>
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </header>

        {/* Mobile Nav Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-drawer" style={{
            position: 'relative',
            zIndex: 90,
            background: 'rgba(15, 23, 42, 0.96)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.5rem 1.5rem 2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}>
            <Link href="#solutions" onClick={() => setMobileMenuOpen(false)} style={{ color: '#f8fafc', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 600 }}>
              Solutions
            </Link>
            <Link href="#technologie" onClick={() => setMobileMenuOpen(false)} style={{ color: '#f8fafc', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 600 }}>
              Technologie
            </Link>
            <Link href="#fonctionnement" onClick={() => setMobileMenuOpen(false)} style={{ color: '#f8fafc', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 600 }}>
              Fonctionnement
            </Link>
            <Link href="#tarifs" onClick={() => setMobileMenuOpen(false)} style={{ color: '#f8fafc', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 600 }}>
              Tarifs
            </Link>
            <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.1)', margin: '0.5rem 0' }} />
            <Link href="/register" onClick={() => setMobileMenuOpen(false)} style={{
              background: '#ffffff',
              color: '#0f172a',
              textDecoration: 'none',
              padding: '0.85rem',
              borderRadius: 14,
              fontWeight: 800,
              textAlign: 'center',
              fontSize: '1rem',
            }}>
              Démarrer l'essai gratuit de 30 jours
            </Link>
          </div>
        )}

        {/* Hero Content Section */}
        <section style={{ position: 'relative', padding: '3.5rem 1.25rem 4rem 1.25rem', textAlign: 'center', zIndex: 5 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            
            {/* Customer Rating Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              <div style={{ display: 'flex', marginRight: '0.25rem' }}>
                {['/galerie/gallery-1.png', '/galerie/gallery-2.png', '/galerie/gallery-3.png'].map((img, idx) => (
                  <div key={idx} style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    border: '2px solid #1e293b',
                    overflow: 'hidden',
                    marginLeft: idx > 0 ? -10 : 0,
                    background: '#e2e8f0'
                  }}>
                    <img src={img} alt="User Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '2px', color: '#fbbf24', fontSize: '0.85rem' }}>★★★★★</div>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#e2e8f0' }}>150+ Associations actives</span>
            </div>

            {/* Title */}
            <h1 className="hero-title" style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.04em', color: '#ffffff', margin: '0 0 1.25rem 0', maxWidth: 850 }}>
              La meilleure plateforme associative conçue pour nos réalités
            </h1>

            {/* Subtitle */}
            <p className="hero-subtitle" style={{ fontSize: '1.2rem', color: '#e2e8f0', lineHeight: 1.6, margin: '0 0 2.5rem 0', maxWidth: 680 }}>
              Gérez en un seul endroit vos caisses d'entraide, tontines (njangi) à enchères, amendes et demandes de prêts.
            </p>

            {/* Floating Info Pills (Left & Right - hidden on mobile via CSS) */}
            <div className="floating-pill" style={{
              position: 'absolute',
              left: '-8%',
              top: '40%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '0.65rem 1.25rem',
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#fff',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              backdropFilter: 'blur(6px)'
            }}>
              <span className="material-symbols-rounded" style={{ color: '#a3e635', fontSize: '1.2rem' }}>volunteer_activism</span>
              Gestion de Secours / Deuil
            </div>

            <div className="floating-pill" style={{
              position: 'absolute',
              right: '-8%',
              top: '42%',
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '0.65rem 1.25rem',
              borderRadius: 999,
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.82rem',
              fontWeight: 700,
              color: '#fff',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              backdropFilter: 'blur(6px)'
            }}>
              <span className="material-symbols-rounded" style={{ color: '#a3e635', fontSize: '1.2rem' }}>payments</span>
              Comptabilité & Prêts
            </div>

            {/* Center Action Box / Input Pill */}
            <div style={{
              width: '100%',
              maxWidth: 580,
              background: '#ffffff',
              borderRadius: 999,
              padding: '0.4rem 0.5rem 0.4rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 15px 30px rgba(0, 0, 0, 0.2)',
              marginBottom: '3.5rem',
              gap: '0.5rem'
            }}>
              <input
                type="email"
                placeholder="Adresse email professionnelle"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  flex: 1,
                  fontSize: '0.9rem',
                  color: '#0f172a',
                  background: 'transparent',
                  minWidth: 0
                }}
              />
              <Link href={`/register?email=${encodeURIComponent(email)}`} style={{
                background: '#0f172a',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '0.8rem 1.4rem',
                borderRadius: 999,
                fontWeight: 800,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 10px rgba(15,23,42,0.3)'
              }}>
                Créer mon Asso
                <span className="material-symbols-rounded" style={{ fontSize: '1.1rem', fontWeight: 800 }}>arrow_right_alt</span>
              </Link>
            </div>

            {/* Mockup Dashboard Preview */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 850, borderRadius: 24, background: '#ffffff', border: '1px solid #1e293b', padding: '0.75rem', boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', paddingLeft: '0.5rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
              </div>

              <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <img
                  src="/banner/home-dashboard.png"
                  alt="Tableau de bord principal Assos 2.0"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            </div>

          </div>
        </section>

      </div>

      {/* 🌟 NOUVELLE SECTION : Carrousel Défilant d'Associations Actives */}
      <section style={{
        background: '#0f172a',
        padding: '2.5rem 0',
        overflow: 'hidden',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: '#64748b',
          }}>
            Progrès collectif — Déjà adopté par des centaines de communautés
          </span>
        </div>

        {/* Endless Marquee Track */}
        {activeAssociations.length > 0 && (
        <div style={{ display: 'flex', width: 'max-content' }} className="animate-carousel">
          {[...activeAssociations, ...activeAssociations].map((assoc, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '16px',
                padding: '1rem 1.5rem',
                margin: '0 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                minWidth: '280px',
                backdropFilter: 'blur(8px)',
              }}
            >
              {/* Logo or Initials Avatar */}
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '12px',
                background: assoc.logoUrl
                  ? 'transparent'
                  : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                flexShrink: 0,
                overflow: 'hidden',
              }}>
                {assoc.logoUrl ? (
                  <img src={assoc.logoUrl} alt={assoc.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>
                    {assoc.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>
                  {assoc.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>{countryFlag(assoc.country)} {assoc.country}</span>
                  <span>• {assoc.memberCount} membre{assoc.memberCount > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}

      </section>

      {/* 3. Simplify Tasks Boost Productivity Section */}
      <section id="solutions" style={{ padding: '5rem 1.25rem', background: '#ffffff', position: 'relative', zIndex: 30 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(0, 0, 0, 0.05)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              color: '#0f172a',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.5rem 1.25rem',
              borderRadius: 999,
              marginBottom: '1.25rem'
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>auto_awesome</span>
              Outils intelligents pour mutuelles
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
              Simplifiez vos tâches, boostez la productivité
            </h2>
          </div>

          {/* Two-Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3rem', alignItems: 'center' }}>
            
            {/* Left Column: Stacked Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              {/* Card 1 */}
              <div
                onMouseEnter={() => setActiveCard(0)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  background: activeCard === 0 ? '#090d16' : '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 20,
                  padding: '1.25rem 1.5rem',
                  boxShadow: activeCard === 0 ? '0 20px 25px -5px rgba(0,0,0,0.15)' : '0 10px 15px -3px rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  border: activeCard === 0 ? '1.5px solid rgba(255, 255, 255, 0.4)' : '1.5px solid #0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: activeCard === 0 ? 'rgba(255, 255, 255, 0.15)' : '#090d16',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '1.2rem' }}>security</span>
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: '1.05rem', color: activeCard === 0 ? '#ffffff' : '#0f172a', display: 'block', marginBottom: '0.2rem' }}>Plateforme Sécurisée & Fiable</strong>
                  <p style={{ color: activeCard === 0 ? '#cbd5e1' : '#475569', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                    Une traçabilité mathématique de chaque dépôt, retrait ou amende pour éliminer tout risque de fraude.
                  </p>
                </div>
              </div>

              {/* Card 2 */}
              <div
                onMouseEnter={() => setActiveCard(1)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  background: activeCard === 1 ? '#090d16' : '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 20,
                  padding: '1.25rem 1.5rem',
                  boxShadow: activeCard === 1 ? '0 20px 25px -5px rgba(0,0,0,0.15)' : '0 10px 15px -3px rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  border: activeCard === 1 ? '1.5px solid rgba(255, 255, 255, 0.4)' : '1.5px solid #0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: activeCard === 1 ? 'rgba(255, 255, 255, 0.15)' : '#090d16',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '1.2rem' }}>volunteer_activism</span>
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: '1.05rem', color: activeCard === 1 ? '#ffffff' : '#0f172a', display: 'block', marginBottom: '0.2rem' }}>Flux de Travail Simplifiés</strong>
                  <p style={{ color: activeCard === 1 ? '#cbd5e1' : '#475569', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                    Gérez vos cotisations de deuil (secours) et vos njangi d'un simple geste via MTN/Orange.
                  </p>
                </div>
              </div>

              {/* Card 3 */}
              <div
                onMouseEnter={() => setActiveCard(2)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem',
                  background: activeCard === 2 ? '#090d16' : '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: 20,
                  padding: '1.25rem 1.5rem',
                  boxShadow: activeCard === 2 ? '0 20px 25px -5px rgba(0,0,0,0.15)' : '0 10px 15px -3px rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                }}
              >
                <div style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  border: activeCard === 2 ? '1.5px solid rgba(255, 255, 255, 0.4)' : '1.5px solid #0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: activeCard === 2 ? 'rgba(255, 255, 255, 0.15)' : '#090d16',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '1.2rem' }}>monitoring</span>
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: '1.05rem', color: activeCard === 2 ? '#ffffff' : '#0f172a', display: 'block', marginBottom: '0.2rem' }}>Analyses & Bilans en Temps Réel</strong>
                  <p style={{ color: activeCard === 2 ? '#cbd5e1' : '#475569', fontSize: '0.88rem', margin: 0, lineHeight: 1.5 }}>
                    Générez des rapports PDF et suivez l'avancement des prêts, taux d'intérêts et garanties.
                  </p>
                </div>
              </div>

            </div>

            {/* Right Column: Floating Dashboard Mockup */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: 580,
                borderRadius: 24,
                overflow: 'hidden',
                border: '1.5px solid #e2e8f0',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)',
                background: '#ffffff'
              }}>
                <img
                  src="/banner/home-dashboard.png"
                  alt="Tableau de bord de supervision financière Assos 2.0"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. Innovative Technology Section */}
      <section id="technologie" style={{ padding: '6rem 1.25rem', background: '#fafbfc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ background: '#e0e7ff', color: '#4f46e5', fontSize: '0.8rem', fontWeight: 800, padding: '0.4rem 1rem', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <span className="material-symbols-rounded" style={{ fontSize: '1rem' }}>auto_awesome_mosaic</span>
              Smart Tools For Busy Teams
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#312e81', margin: 0, letterSpacing: '-0.02em', maxWidth: 600, marginInline: 'auto', lineHeight: 1.2 }}>
              Une technologie innovante qui propulse vos résultats
            </h2>
          </div>

          <div className="tech-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(12, 1fr)', 
            gap: '1.5rem'
          }}>
            
            {/* Top Left: Pie Chart */}
            <div style={{ gridColumn: 'span 4', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
              <div style={{ height: 220, background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/galerie/tech_pie_chart_1785315302706.png" alt="Automatisation" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <strong style={{ fontSize: '1.1rem', color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>Automatisation des Tâches</strong>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Automatisez vos tâches répétitives et optimisez vos flux de travail pour gagner du temps.</span>
              </div>
            </div>

            {/* Top Middle: Certificate Nodes */}
            <div style={{ gridColumn: 'span 4', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
              <div style={{ height: 220, background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/galerie/tech_certificate_nodes_1785315312267.png" alt="Certification" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <strong style={{ fontSize: '1.1rem', color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>Génération de Certificats</strong>
                <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Générez des attestations d'adhésion sécurisées et connectez vos membres en temps réel.</span>
              </div>
            </div>

            {/* Right Card (spans 2 rows): Mobile app */}
            <div style={{ gridColumn: 'span 4', gridRow: 'span 2', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
              <div style={{ flex: 1, minHeight: 300, background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/galerie/tech_mobile_app_1785315330468.png" alt="Fonctionnalités intelligentes" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
                <strong style={{ fontSize: '1.15rem', color: '#0f172a', display: 'block', marginBottom: '0.75rem' }}>Fonctionnalités Intelligentes</strong>
                <span style={{ fontSize: '0.9rem', color: '#64748b', display: 'block', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  Simplifiez la manière dont votre équipe travaille avec des outils intelligents conçus pour éliminer la complexité.
                </span>
                <Link href="/register" style={{ background: '#a3e635', color: '#0f172a', textDecoration: 'none', padding: '0.85rem 1.5rem', borderRadius: 999, fontWeight: 800, fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 10px rgba(163,230,53,0.3)' }}>
                  Commencer Maintenant
                  <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Bottom Left (spans 2 cols): Bar Chart */}
            <div className="bottom-card" style={{ gridColumn: 'span 8', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
              <div style={{ flex: '1', height: 260, background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/galerie/tech_bar_chart_1785315321768.png" alt="Collaboration Simplifiée" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div className="bottom-card-text" style={{ flex: '1', paddingRight: '1rem' }}>
                <strong style={{ fontSize: '1.2rem', color: '#0f172a', display: 'block', marginBottom: '0.75rem' }}>Collaboration Simplifiée</strong>
                <span style={{ fontSize: '0.9rem', color: '#64748b', display: 'block', marginBottom: '1.25rem', lineHeight: 1.5 }}>
                  Rassemblez votre équipe au même endroit. Partagez des mises à jour, assignez des tâches et échangez des retours instantanément sans effort.
                </span>
                <Link href="#solutions" style={{ background: '#a3e635', color: '#0f172a', textDecoration: 'none', padding: '0.75rem 1.5rem', borderRadius: 999, fontWeight: 800, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 10px rgba(163,230,53,0.3)' }}>
                  Explorer les outils
                  <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>arrow_forward</span>
                </Link>
              </div>
            </div>

          </div>
        </div>
        <style jsx>{`
          @media (max-width: 992px) {
            .tech-grid {
              display: flex !important;
              flex-direction: column;
            }
            .tech-grid > div {
              width: 100% !important;
            }
            .bottom-card {
              flex-direction: column !important;
              text-align: center;
            }
            .bottom-card-text {
              padding-right: 0 !important;
            }
          }
        `}</style>
      </section>

      {/* 5. How It Works Section */}
      <section id="fonctionnement" style={{ padding: '5rem 1.25rem', background: '#ffffff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
          
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 24, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ width: '100%', height: 240, borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
              <img src="/cta/vl-cta-thumb-1.1.png" alt="Créer un espace" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Ouverture de compte</h4>
              <p style={{ color: '#475569', fontSize: '0.88rem', margin: 0 }}>Configurez les membres de l'association, ajoutez leurs coordonnées de téléphone et assignez leurs rôles en 1 clic.</p>
            </div>
          </div>

          <div>
            <div style={{ background: '#f1f5f9', color: '#000', fontSize: '0.75rem', fontWeight: 800, padding: '0.35rem 0.85rem', borderRadius: 999, display: 'inline-block', marginBottom: '1rem' }}>
              COMMENT ÇA FONCTIONNE
            </div>
            
            <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1.75rem 0', letterSpacing: '-0.03em' }}>
              Comment fonctionne Assos 2.0
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ padding: '1.1rem 1.25rem', borderLeft: '3px solid #0f172a', background: '#f8fafc', borderRadius: '0 16px 16px 0' }}>
                <strong style={{ display: 'block', fontSize: '1rem', color: '#0f172a' }}>1. Inviter vos membres</strong>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>Chaque membre reçoit une invitation par SMS avec son lien d'accès.</span>
              </div>
              <div style={{ padding: '1.1rem 1.25rem', borderLeft: '3px solid #6366f1', background: '#f8fafc', borderRadius: '0 16px 16px 0' }}>
                <strong style={{ display: 'block', fontSize: '1rem', color: '#0f172a' }}>2. Intégrer les passerelles Mobile Money</strong>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>Liez vos numéros MTN MoMo et Orange Money pour la collecte.</span>
              </div>
              <div style={{ padding: '1.1rem 1.25rem', borderLeft: '3px solid #10b981', background: '#f8fafc', borderRadius: '0 16px 16px 0' }}>
                <strong style={{ display: 'block', fontSize: '1rem', color: '#0f172a' }}>3. Suivi & Rapports certifiés</strong>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>Générez vos procès-verbaux, fiches de présence et bilans de tontines.</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. Local Integrations Map */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '5rem 1.25rem', background: '#0f172a', color: '#ffffff' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#ffffff', marginBottom: '1.25rem' }}>
            Libérez la puissance avec nos intégrations locales
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '1.05rem', maxWidth: 680, margin: '0 auto 3.5rem auto', lineHeight: 1.6 }}>
            Assos 2.0 se connecte directement aux principaux réseaux de télécommunications du continent pour automatiser vos flux financiers.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.85rem 1.75rem', borderRadius: 999, fontWeight: 700, color: '#ffcc00' }}>MTN MoMo</span>
            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.85rem 1.75rem', borderRadius: 999, fontWeight: 700, color: '#ff6600' }}>Orange Money</span>
            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.85rem 1.75rem', borderRadius: 999, fontWeight: 700, color: '#38bdf8' }}>Termii SMS</span>
            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.85rem 1.75rem', borderRadius: 999, fontWeight: 700, color: '#34d399' }}>MeSomb API</span>
          </div>
        </div>
      </section>

      {/* 7. Flexible Pricing Plans */}
      <section id="tarifs" style={{ padding: '5rem 1.25rem', background: '#fafbfc' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '3rem' }}>
            <div>
              <h2 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Forfaits d'abonnement SaaS</h2>
              <p style={{ color: '#64748b', fontSize: '1rem', marginTop: '0.5rem' }}>Période d'essai gratuit de 30 jours pour tester toutes les fonctionnalités.</p>
            </div>

            <div style={{ display: 'flex', background: '#e2e8f0', padding: '0.25rem', borderRadius: 999 }}>
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                style={{
                  border: 'none',
                  background: !isAnnual ? '#0f172a' : 'none',
                  color: !isAnnual ? '#ffffff' : '#475569',
                  padding: '0.5rem 1.25rem',
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: '0.85rem',
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
                  background: isAnnual ? '#0f172a' : 'none',
                  color: isAnnual ? '#ffffff' : '#475569',
                  padding: '0.5rem 1.25rem',
                  borderRadius: 999,
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                Annuel (-17%)
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '2rem' }}>
            
            {/* Starter Plan Card */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 24, padding: '2rem 1.75rem', background: '#fff', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>STARTER</h3>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '1rem 0' }}>
                {isAnnual ? '55 000 XAF' : '5 000 XAF'}
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}> {isAnnual ? '/ an' : '/ mois'}</span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 1.5rem 0', flex: 1 }}>Pour les tontines et associations familiales.</p>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <li>✓ 1 association autorisée</li>
                <li>✓ Jusqu'à 50 membres</li>
                <li>✓ Tontine de base (fixe & tirage)</li>
                <li>✓ Gestion des prêts & cautions</li>
                <li>✓ 100 SMS de relance / mois</li>
              </ul>

              <Link href="/register" style={{ background: '#f1f5f9', color: '#0f172a', textDecoration: 'none', padding: '0.85rem', borderRadius: 14, fontWeight: 700, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                Essayer Starter
              </Link>
            </div>

            {/* Business Plan Card (Featured) */}
            <div style={{ border: '2.5px solid #0f172a', borderRadius: 24, padding: '2rem 1.75rem', background: '#fff', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}>
              <span style={{ position: 'absolute', top: '-0.85rem', left: '50%', transform: 'translateX(-50%)', background: '#0f172a', color: '#ffffff', fontSize: '0.7rem', fontWeight: 900, padding: '0.35rem 1rem', borderRadius: 999, letterSpacing: '0.05em' }}>
                RECOMMANDÉ
              </span>

              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>BUSINESS</h3>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '1rem 0' }}>
                {isAnnual ? '165 000 XAF' : '15 000 XAF'}
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}> {isAnnual ? '/ an' : '/ mois'}</span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 1.5rem 0', flex: 1 }}>Pour les tontines complexes avec enchères et prêts.</p>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <li>✓ Jusqu'à 3 associations</li>
                <li>✓ Jusqu'à 200 membres</li>
                <li>✓ Tontine à Enchères & Parts</li>
                <li>✓ Caution solidaire obligatoire</li>
                <li>✓ 500 SMS de relance / mois</li>
              </ul>

              <Link href="/register" style={{ background: '#0f172a', color: '#ffffff', textDecoration: 'none', padding: '0.85rem', borderRadius: 14, fontWeight: 700, textAlign: 'center', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}>
                Essayer Business
              </Link>
            </div>

            {/* Gold Plan Card */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 24, padding: '2rem 1.75rem', background: '#fff', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>GOLD</h3>
              <div style={{ fontSize: '2rem', fontWeight: 900, color: '#0f172a', margin: '1rem 0' }}>
                {isAnnual ? '385 000 XAF' : '35 000 XAF'}
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}> {isAnnual ? '/ an' : '/ mois'}</span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 1.5rem 0', flex: 1 }}>Pour les grandes mutuelles exigeantes.</p>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2rem 0', fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <li>✓ Associations & membres illimités</li>
                <li>✓ Module de vote & Assemblées Générales</li>
                <li>✓ Diagnostic financier par IA</li>
                <li>✓ SMS de secours deuil illimités</li>
                <li>✓ Support prioritaire 24/7</li>
              </ul>

              <Link href="/register" style={{ background: '#f1f5f9', color: '#0f172a', textDecoration: 'none', padding: '0.85rem', borderRadius: 14, fontWeight: 700, textAlign: 'center', border: '1px solid #e2e8f0' }}>
                Essayer Gold
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 8. Call-To-Action Banner */}
      <section style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', padding: '5rem 1.25rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 900, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>Prêt à moderniser votre association ?</h2>
          <p style={{ color: '#94a3b8', fontSize: '1.1rem', marginBottom: '2.25rem', lineHeight: 1.6 }}>
            Rejoignez plus de 150 associations qui font confiance à Assos 2.0 pour piloter leurs tontines et Mutuelles en Afrique.
          </p>
          <Link href="/register" style={{ background: '#ffffff', color: '#0f172a', textDecoration: 'none', padding: '0.95rem 2rem', borderRadius: 16, fontWeight: 800, fontSize: '0.98rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 10px 25px rgba(255,255,255,0.1)' }}>
            <span className="material-symbols-rounded">diversity_3</span>
            Créer mon association gratuitement
          </Link>
        </div>
      </section>

      {/* 9. Footer */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '3.5rem 1.25rem', borderTop: '1px solid #1e293b' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', fontWeight: 900, fontSize: '1.15rem' }}>
            <span className="material-symbols-rounded" style={{ color: '#6366f1' }}>diversity_3</span>
            <span>Assos 2.0</span>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.88rem' }}>
            <Link href="/privacy" style={{ color: '#94a3b8', textDecoration: 'none' }}>Confidentialité</Link>
            <Link href="/terms" style={{ color: '#94a3b8', textDecoration: 'none' }}>Conditions d'utilisation</Link>
          </div>

          <div style={{ fontSize: '0.88rem' }}>
            © {new Date().getFullYear()} Assos 2.0. Tous droits réservés.
          </div>

        </div>
      </footer>

    </div>
  );
}
