'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [email, setEmail] = useState('');
  const [activeCard, setActiveCard] = useState<number>(0);

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

  return (
    <div style={{ background: '#f8fafc', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh', scrollBehavior: 'smooth' }}>
      
      {/* Schema.org SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* 1 & 2. Hero & Header Area with Premium Dark Background & Cloud Background Asset */}
      <div style={{
        position: 'relative',
        background: 'url("/banner/vl-banner-thumb1.1.png") no-repeat center center/cover fixed',
        color: '#ffffff',
        paddingBottom: '8rem',
        overflow: 'hidden'
      }}>
        
        {/* Header Navigation */}
        <header style={{ padding: '1.5rem 3rem', maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 900, fontSize: '1.35rem' }}>
            <span className="material-symbols-rounded" style={{ color: '#e9e9e9ff', fontSize: '2rem' }}>diversity_3</span>
            <span style={{ color: '#fff', letterSpacing: '-0.02em' }}>Assos 2.0</span>
          </div>

          {/* Floating Pill Menu */}
          <nav style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: 999,
            padding: '0.6rem 2.2rem',
            backdropFilter: 'blur(8px)',
            fontSize: '0.9rem',
            fontWeight: 600,
            position:'sticky'
          }}>
            <Link href="#solutions" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Solutions</Link>
            <Link href="#technologie" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Technologie</Link>
            <Link href="#fonctionnement" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Fonctionnement</Link>
            <Link href="#tarifs" style={{ color: '#cbd5e1', textDecoration: 'none' }}>Tarifs</Link>
          </nav>

          {/* Claim Free Trial Button */}
          <Link href="/register" style={{
            background: '#e9e9e9ff',
            color: '#090d16',
            textDecoration: 'none',
            padding: '0.75rem 1.6rem',
            borderRadius: 999,
            fontWeight: 700,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 15px rgba(163,230,53,0.3)',
            transition: 'transform 0.2s'
          }}>
            Démarrer l'essai gratuit
            <span className="material-symbols-rounded" style={{ fontSize: '1.1rem', fontWeight: 800 }}>arrow_right_alt</span>
          </Link>
        </header>

        {/* Hero Content Section */}
        <section style={{ position: 'relative', padding: '5rem 2rem 6rem 2rem', textAlign: 'center', zIndex: 5 }}>
          <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            
            {/* Customer Rating Badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
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
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#94a3b8' }}>150+ Associations actives</span>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: '3.75rem', fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.04em', color: '#ffffff', margin: '0 0 1.5rem 0', maxWidth: 850 }}>
              La meilleure plateforme associative conçue pour nos réalités
            </h1>

            {/* Subtitle */}
            <p style={{ fontSize: '1.25rem', color: '#1f1f1fff', lineHeight: 1.6, margin: '0 0 3rem 0', maxWidth: 680 }}>
              Gérez en un seul endroit vos caisses d'entraide, tontines (njangi) à enchères, amendes et demandes de prêts.
            </p>

            {/* Floating Info Pills (Left & Right) */}
            <div style={{
              position: 'absolute',
              left: '-8%',
              top: '40%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
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

            <div style={{
              position: 'absolute',
              right: '-8%',
              top: '42%',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
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
              padding: '0.4rem 0.5rem 0.4rem 1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 15px 30px rgba(0, 0, 0, 0.2)',
              marginBottom: '4rem'
            }}>
              <input
                type="email"
                placeholder="Votre adresse email professionnelle"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  width: '60%',
                  fontSize: '0.92rem',
                  color: '#0f172a',
                  background: 'transparent'
                }}
              />
              <Link href={`/register?email=${encodeURIComponent(email)}`} style={{
                background: '#e9e9e9ff',
                color: '#090d16',
                textDecoration: 'none',
                padding: '0.85rem 1.75rem',
                borderRadius: 999,
                fontWeight: 800,
                fontSize: '0.92rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: '0 4px 10px rgba(163,230,53,0.2)'
              }}>
                Créer mon Asso
                <span className="material-symbols-rounded" style={{ fontSize: '1.1rem', fontWeight: 800 }}>arrow_right_alt</span>
              </Link>
            </div>

            {/* Mockup Dashboard Preview Sitting on Clouds Background Image `/image.png` */}
            <div style={{ position: 'relative', width: '100%', maxWidth: 850, borderRadius: 24, background: '#ffffff', border: '1px solid #1f1f1fff', padding: '1rem', boxShadow: '0 30px 60px rgba(0,0,0,0.1)' }}>
              <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.85rem' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#eab308' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e' }} />
              </div>

              {/* Real Dashboard Image instead of simulated UI */}
              <div style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                <img
                  src="/banner/vl-banner-thumb1.1.png"
                  alt="Tableau de bord principal Assos 2.0"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
              
              {/* Cloud bottom layout mask */}
              <div style={{
                position: 'absolute',
                bottom: '-80px',
                left: 0,
                width: '100%',
                height: '160px',
                backgroundImage: 'url("/image.png")',
                backgroundSize: 'contain',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'bottom center',
                pointerEvents: 'none',
                zIndex: 20
              }} />
            </div>

          </div>
        </section>

      </div>

      {/* 3. Simplify Tasks Boost Productivity Section */}
      <section id="solutions" style={{ padding: '6rem 2rem', background: '#ffffff', position: 'relative', zIndex: 30 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          
          {/* Section Header */}
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
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
            <h2 style={{ fontSize: '2.75rem', fontWeight: 900, color: '#0f172a', margin: 0, letterSpacing: '-0.03em' }}>
              Simplifiez vos tâches, boostez la productivité
            </h2>
          </div>

          {/* Two-Column Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '3.5rem', alignItems: 'center' }}>
            
            {/* Left Column: Stacked Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              
              {/* Card 1 */}
              <div
                onMouseEnter={() => setActiveCard(0)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.5rem',
                  background: activeCard === 0 ? '#090d16' : '#ffffff',
                  border: '1px solid #1f1f1fff',
                  borderRadius: 24,
                  padding: '1.5rem 1.75rem',
                  boxShadow: activeCard === 0 ? '0 20px 25px -5px rgba(0,0,0,0.15)' : '0 10px 15px -3px rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  marginLeft: 0
                }}
              >
                <div style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  border: activeCard === 0 ? '1.5px solid rgba(255, 255, 255, 0.4)' : '1.5px solid #1f1f1fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: activeCard === 0 ? 'rgba(255, 255, 255, 0.15)' : '#090d16',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    transition: 'all 0.3s ease'
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '1.25rem' }}>security</span>
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: '1.1rem', color: activeCard === 0 ? '#ffffff' : '#0f172a', display: 'block', marginBottom: '0.25rem', transition: 'all 0.3s ease' }}>Plateforme Sécurisée & Fiable</strong>
                  <p style={{ color: activeCard === 0 ? '#1f1f1fff' : '#475569', fontSize: '0.88rem', margin: 0, lineHeight: 1.5, transition: 'all 0.3s ease' }}>
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
                  gap: '1.5rem',
                  background: activeCard === 1 ? '#090d16' : '#ffffff',
                  border: '1px solid #1f1f1fff',
                  borderRadius: 24,
                  padding: '1.5rem 1.75rem',
                  boxShadow: activeCard === 1 ? '0 20px 25px -5px rgba(0,0,0,0.15)' : '0 10px 15px -3px rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  marginLeft: '28px'
                }}
              >
                <div style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  border: activeCard === 1 ? '1.5px solid rgba(255, 255, 255, 0.4)' : '1.5px solid #1f1f1fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: activeCard === 1 ? 'rgba(255, 255, 255, 0.15)' : '#090d16',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    transition: 'all 0.3s ease'
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '1.25rem' }}>volunteer_activism</span>
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: '1.1rem', color: activeCard === 1 ? '#ffffff' : '#0f172a', display: 'block', marginBottom: '0.25rem', transition: 'all 0.3s ease' }}>Flux de Travail Simplifiés</strong>
                  <p style={{ color: activeCard === 1 ? '#1f1f1fff' : '#475569', fontSize: '0.88rem', margin: 0, lineHeight: 1.5, transition: 'all 0.3s ease' }}>
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
                  gap: '1.5rem',
                  background: activeCard === 2 ? '#090d16' : '#ffffff',
                  border: '1px solid #1f1f1fff',
                  borderRadius: 24,
                  padding: '1.5rem 1.75rem',
                  boxShadow: activeCard === 2 ? '0 20px 25px -5px rgba(0,0,0,0.15)' : '0 10px 15px -3px rgba(0,0,0,0.02)',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  marginLeft: '56px'
                }}
              >
                <div style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  border: activeCard === 2 ? '1.5px solid rgba(255, 255, 255, 0.4)' : '1.5px solid #1f1f1fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.3s ease'
                }}>
                  <div style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    background: activeCard === 2 ? 'rgba(255, 255, 255, 0.15)' : '#090d16',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    transition: 'all 0.3s ease'
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: '1.25rem' }}>monitoring</span>
                  </div>
                </div>
                <div>
                  <strong style={{ fontSize: '1.1rem', color: activeCard === 2 ? '#ffffff' : '#0f172a', display: 'block', marginBottom: '0.25rem', transition: 'all 0.3s ease' }}>Analyses & Bilans en Temps Réel</strong>
                  <p style={{ color: activeCard === 2 ? '#1f1f1fff' : '#475569', fontSize: '0.88rem', margin: 0, lineHeight: 1.5, transition: 'all 0.3s ease' }}>
                    Générez des rapports PDF et suivez l'avancement des prêts, taux d'intérêts et garanties.
                  </p>
                </div>
              </div>

            </div>

            {/* Right Column: Floating Dashboard Mockup */}
            <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
              
              {/* Radial glow background effect matching design */}
              <div style={{
                position: 'absolute',
                inset: '-10px',
                background: 'radial-gradient(circle, rgba(163,230,53,0.15) 0%, transparent 70%)',
                zIndex: 1,
                pointerEvents: 'none'
              }} />

              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: 580,
                borderRadius: 28,
                overflow: 'hidden',
                border: '1.5px solid #1f1f1fff',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.08)',
                zIndex: 2,
                background: '#ffffff'
              }}>
                <img
                  src="/banner/vl-banner-thumb1.1.png"
                  alt="Tableau de bord de supervision financière Assos 2.0"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 4. Innovative Technology Section */}
      <section id="technologie" style={{ padding: '6rem 2rem', background: '#fafbfc' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <div style={{ background: '#f1f5f9', color: '#000', fontSize: '0.75rem', fontWeight: 800, padding: '0.35rem 0.85rem', borderRadius: 999, display: 'inline-block', marginBottom: '1rem' }}>
              TECHNOLOGIE ET RÉSULTATS
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>
              Une technologie innovante qui propulse votre association
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            
            {/* Box 1 */}
            <div style={{ background: '#ffffff', border: '1px solid #1f1f1fff', borderRadius: 24, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ height: 160, background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/galerie/gallery-1.png" alt="Créer un compte association" style={{ width: '80%', height: 'auto', objectFit: 'contain' }} />
              </div>
              <div>
                <strong style={{ fontSize: '1.1rem', color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>Création de compte rapide</strong>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>Créez l'identité numérique de votre association en 2 minutes avec son lien dédié.</span>
              </div>
            </div>

            {/* Box 2 */}
            <div style={{ background: '#ffffff', border: '1px solid #1f1f1fff', borderRadius: 24, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ height: 160, background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/galerie/gallery-2.png" alt="Liaison tontines" style={{ width: '80%', height: 'auto', objectFit: 'contain' }} />
              </div>
              <div>
                <strong style={{ fontSize: '1.1rem', color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>Configuration de tontines</strong>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>Renseignez vos tontines de secours, njangi, à ordre fixe ou à enchères adaptables.</span>
              </div>
            </div>

            {/* Box 3 */}
            <div style={{ background: '#ffffff', border: '1px solid #1f1f1fff', borderRadius: 24, padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ height: 160, background: '#f8fafc', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/galerie/gallery-3.png" alt="Reçus de paiement" style={{ width: '80%', height: 'auto', objectFit: 'contain' }} />
              </div>
              <div>
                <strong style={{ fontSize: '1.1rem', color: '#0f172a', display: 'block', marginBottom: '0.5rem' }}>Suivi & relances automatiques</strong>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>Recevez des alertes SMS automatiques pour le paiement de vos parts ou le remboursement des prêts.</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 5. How It Works Section */}
      <section id="fonctionnement" style={{ padding: '6rem 2rem', background: '#ffffff' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '4rem', alignItems: 'center' }}>
          
          {/* Left card Box */}
          <div style={{ background: '#f8fafc', border: '1px solid #1f1f1fff', borderRadius: 24, padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ width: '100%', height: 260, borderRadius: 16, overflow: 'hidden', border: '1px solid #1f1f1fff' }}>
              <img src="/cta/vl-cta-thumb-1.1.png" alt="Créer un espace" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 0.5rem 0' }}>Ouverture de compte</h4>
              <p style={{ color: '#475569', fontSize: '0.88rem', margin: 0 }}>Configurez les membres de l'association, ajoutez leurs coordonnées de téléphone et assignez leurs rôles en 1 clic.</p>
            </div>
          </div>

          {/* Right side steps list */}
          <div>
            <div style={{ background: '#f1f5f9', color: '#000', fontSize: '0.75rem', fontWeight: 800, padding: '0.35rem 0.85rem', borderRadius: 999, display: 'inline-block', marginBottom: '1rem' }}>
              COMMENT ÇA FONCTIONNE
            </div>
            
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 2rem 0', letterSpacing: '-0.03em' }}>
              Comment fonctionne Assos 2.0
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{ padding: '1.25rem', borderLeft: '3px solid #000', background: '#f8fafc', borderRadius: '0 16px 16px 0' }}>
                <strong style={{ display: 'block', fontSize: '1.05rem', color: '#0f172a' }}>1. Inviter vos membres</strong>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>Chaque membre reçoit une invitation par SMS avec son lien d'accès.</span>
              </div>
              <div style={{ padding: '1.25rem', borderLeft: '3px solid #1f1f1fff', borderRadius: '0 16px 16px 0' }}>
                <strong style={{ display: 'block', fontSize: '1.05rem', color: '#0f172a' }}>2. Intégrer les passerelles Mobile Money</strong>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>Liez vos numéros MTN MoMo et Orange Money pour la collecte.</span>
              </div>
              <div style={{ padding: '1.25rem', borderLeft: '3px solid #1f1f1fff', borderRadius: '0 16px 16px 0' }}>
                <strong style={{ display: 'block', fontSize: '1.05rem', color: '#0f172a' }}>3. Suivi & Rapports certifiés</strong>
                <span style={{ fontSize: '0.85rem', color: '#475569' }}>Générez vos procès-verbaux, fiches de présence et bilans de tontines.</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 6. Local Integrations Map (MTN, Orange Money with cloud background `/image.png`) */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '6rem 2rem', background: '#0f172a', color: '#ffffff' }}>
        
        {/* Clouds overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url("/image.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'center center',
          opacity: 0.1,
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 10 }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', marginBottom: '1.25rem' }}>
            Libérez la puissance avec nos intégrations locales
          </h2>
          <p style={{ color: '#1f1f1fff', fontSize: '1.1rem', maxWidth: 680, margin: '0 auto 4rem auto', lineHeight: 1.6 }}>
            Assos 2.0 se connecte directement aux principaux réseaux de télécommunications et aux agrégateurs du continent pour automatiser vos flux financiers.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '1rem 2rem', borderRadius: 999, fontWeight: 700, color: '#ffcc00' }}>MTN MoMo</span>
            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '1rem 2rem', borderRadius: 999, fontWeight: 700, color: '#ff6600' }}>Orange Money</span>
            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '1rem 2rem', borderRadius: 999, fontWeight: 700, color: '#38bdf8' }}>Termii SMS</span>
            <span style={{ background: 'rgba(255,255,255,0.08)', padding: '1rem 2rem', borderRadius: 999, fontWeight: 700, color: '#34d399' }}>MeSomb API</span>
          </div>
        </div>
      </section>

      {/* 7. Flexible Pricing Plans (Mensuel/Annuel selector, Starter/Business/Gold) */}
      <section id="tarifs" style={{ padding: '6rem 2rem', background: '#fafbfc' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '3.5rem' }}>
            <div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: 0 }}>Forfaits d'abonnement SaaS</h2>
              <p style={{ color: '#64748b', fontSize: '1.05rem', marginTop: '0.5rem' }}>Période d'essai gratuit de 30 jours pour tester toutes les fonctionnalités.</p>
            </div>

            {/* Toggle switch */}
            <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: 999, border: '1px solid #1f1f1fff' }}>
              <button
                type="button"
                onClick={() => setIsAnnual(false)}
                style={{
                  border: 'none',
                  background: !isAnnual ? '#000000' : 'none',
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
                  background: isAnnual ? '#000000' : 'none',
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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
            
            {/* Starter Plan Card */}
            <div style={{ border: '1px solid #1f1f1fff', borderRadius: 24, padding: '2.5rem 2rem', background: '#fff', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>STARTER</h3>
              <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', margin: '1rem 0' }}>
                {isAnnual ? '55 000 XAF' : '5 000 XAF'}
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}> {isAnnual ? '/ an' : '/ mois'}</span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 1.5rem 0', flex: 1 }}>Pour les tontines et associations familiales.</p>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem 0', fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <li>✓ 1 association autorisée</li>
                <li>✓ Jusqu'à 50 membres</li>
                <li>✓ Tontine de base (fixe & tirage)</li>
                <li>✓ Gestion des prêts & cautions</li>
                <li>✓ 100 SMS de relance / mois</li>
              </ul>

              <Link href="/register" style={{ background: '#f1f5f9', color: '#0f172a', textDecoration: 'none', padding: '0.9rem', borderRadius: 14, fontWeight: 700, textAlign: 'center', border: '1px solid #1f1f1fff' }}>
                Essayer Starter
              </Link>
            </div>

            {/* Business Plan Card (Featured) */}
            <div style={{ border: '2.5px solid #000000', borderRadius: 24, padding: '2.5rem 2rem', background: '#fff', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}>
              <span style={{ position: 'absolute', top: '-0.9rem', left: '50%', transform: 'translateX(-50%)', background: '#000000', color: '#ffffff', fontSize: '0.72rem', fontWeight: 900, padding: '0.35rem 1rem', borderRadius: 999, letterSpacing: '0.05em' }}>
                RECOMMANDÉ
              </span>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>BUSINESS</h3>
              <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', margin: '1rem 0' }}>
                {isAnnual ? '165 000 XAF' : '15 000 XAF'}
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}> {isAnnual ? '/ an' : '/ mois'}</span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 1.5rem 0', flex: 1 }}>Pour les tontines complexes avec enchères et prêts.</p>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem 0', fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <li>✓ Jusqu'à 3 associations</li>
                <li>✓ Jusqu'à 200 membres</li>
                <li>✓ Tontine à Enchères & Parts</li>
                <li>✓ Caution solidaire obligatoire</li>
                <li>✓ 500 SMS de relance / mois</li>
              </ul>

              <Link href="/register" style={{ background: '#000000', color: '#ffffff', textDecoration: 'none', padding: '0.9rem', borderRadius: 14, fontWeight: 700, textAlign: 'center', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}>
                Essayer Business
              </Link>
            </div>

            {/* Gold Plan Card */}
            <div style={{ border: '1px solid #1f1f1fff', borderRadius: 24, padding: '2.5rem 2rem', background: '#fff', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>GOLD</h3>
              <div style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', margin: '1rem 0' }}>
                {isAnnual ? '385 000 XAF' : '35 000 XAF'}
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}> {isAnnual ? '/ an' : '/ mois'}</span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.88rem', margin: '0 0 1.5rem 0', flex: 1 }}>Pour les grandes mutuelles exigeantes.</p>
              
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 2.5rem 0', fontSize: '0.85rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                <li>✓ Associations & membres illimités</li>
                <li>✓ Module de vote & Assemblées Générales</li>
                <li>✓ Diagnostic financier par IA</li>
                <li>✓ SMS de secours deuil illimités</li>
                <li>✓ Nom de domaine personnalisé</li>
              </ul>

              <Link href="/register" style={{ background: '#f1f5f9', color: '#0f172a', textDecoration: 'none', padding: '0.9rem', borderRadius: 14, fontWeight: 700, textAlign: 'center', border: '1px solid #1f1f1fff' }}>
                Essayer Gold
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 8. Call-To-Action Banner (with cloud backgrounds `/image.png`) */}
      <section style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: '#ffffff', padding: '6rem 2rem', textAlign: 'center' }}>
        
        {/* Clouds Background layer */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'url("/image.png")',
          backgroundSize: 'cover',
          backgroundPosition: 'bottom center',
          opacity: 0.1,
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '1.25rem', letterSpacing: '-0.02em' }}>Prêt à moderniser votre association ?</h2>
          <p style={{ color: '#1f1f1fff', fontSize: '1.15rem', marginBottom: '2.5rem', lineHeight: 1.6 }}>
            Rejoignez plus de 150 associations qui font confiance à Assos 2.0 pour piloter leurs tontines et Mutuelles en Afrique.
          </p>
          <Link href="/register" style={{ background: '#ffffff', color: '#0f172a', textDecoration: 'none', padding: '1rem 2.25rem', borderRadius: 16, fontWeight: 800, fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 10px 25px rgba(255,255,255,0.1)' }}>
            <span className="material-symbols-rounded">diversity_3</span>
            Créer mon association gratuitement
          </Link>
        </div>
      </section>

      {/* 9. Footer */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '4rem 2rem', borderTop: '1px solid #1e293b' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ffffff', fontWeight: 900, fontSize: '1.15rem' }}>
            <span className="material-symbols-rounded" style={{ color: '#38bdf8' }}>diversity_3</span>
            <span>Assos 2.0</span>
          </div>

          <div style={{ fontSize: '0.88rem' }}>
            © {new Date().getFullYear()} Assos 2.0. Tous droits réservés.
          </div>

        </div>
      </footer>

    </div>
  );
}
