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
        background: 'linear-gradient(to bottom, #ffffff, #eef2ff)', 
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
            Transform The Way Your<br />Team Works Starting Now
          </h2>
          <div style={{ display: 'flex', maxWidth: 450, margin: '0 auto', background: '#ffffff', padding: '0.4rem', borderRadius: 999, alignItems: 'center' }}>
            <input type="email" placeholder="Enter Email Address" style={{ flex: 1, border: 'none', background: 'transparent', padding: '0 1rem', fontSize: '0.95rem', color: '#000', outline: 'none' }} />
            <button style={{ background: '#bdf25b', color: '#000000', border: 'none', padding: '0.85rem 1.5rem', borderRadius: 999, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Get Started Free
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
            <div style={{ width: 40, height: 40, background: '#bdf25b', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-rounded" style={{ color: '#000000', fontWeight: 800 }}>widgets</span>
            </div>
            <strong style={{ fontSize: '1.2rem', color: '#000000', letterSpacing: '1px' }}>SAASI</strong>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem', maxWidth: 280 }}>
            Empower your teams, streamlined your processes, and achieve your goals with.
          </p>
          <div style={{ display: 'flex', background: '#ffffff', padding: '0.3rem', borderRadius: 999, alignItems: 'center', border: '1px solid #e2e8f0' }}>
            <input type="email" placeholder="Email Address" style={{ flex: 1, border: 'none', background: 'transparent', padding: '0 1rem', fontSize: '0.9rem', color: '#000', outline: 'none', minWidth: 0 }} />
            <button style={{ background: '#bdf25b', color: '#000000', border: 'none', padding: '0.6rem 1.2rem', borderRadius: 999, fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              Subscribe
              <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Product Column */}
        <div>
          <h4 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.05rem' }}>Product</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li><Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Pricing</Link></li>
            <li><Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Integration</Link></li>
            <li><Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Features</Link></li>
            <li><Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Templates</Link></li>
            <li><Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Changelog</Link></li>
          </ul>
        </div>

        {/* Company Column */}
        <div>
          <h4 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.05rem' }}>Company</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li><Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>About Us</Link></li>
            <li><Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Our Blog</Link></li>
            <li><Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>In The Pass</Link></li>
            <li><Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Our Blog</Link></li>
            <li><Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Community</Link></li>
          </ul>
        </div>

        {/* Resources Column */}
        <div>
          <h4 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.05rem' }}>Resources</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <li><Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>On-Boarding</Link></li>
            <li><Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Help Center</Link></li>
            <li><Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Perks Benefits</Link></li>
            <li><Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Partnerships</Link></li>
            <li><Link href="#" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.95rem' }}>Work With Us</Link></li>
          </ul>
        </div>

        {/* Download App Column */}
        <div>
          <h4 style={{ color: '#0f172a', fontWeight: 700, marginBottom: '1.5rem', fontSize: '1.05rem' }}>Download App</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button style={{ background: '#1e293b', color: '#ffffff', border: 'none', borderRadius: 8, padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', textAlign: 'left' }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/31/Apple_logo_white.svg" alt="Apple" style={{ width: 24, height: 24 }} />
              <div>
                <div style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>Download on the</div>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>App Store</div>
              </div>
            </button>
            <button style={{ background: '#1e293b', color: '#ffffff', border: 'none', borderRadius: 8, padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', textAlign: 'left' }}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" alt="Microsoft" style={{ width: 24, height: 24 }} />
              <div>
                <div style={{ fontSize: '0.65rem', color: '#cbd5e1' }}>Get it from</div>
                <div style={{ fontSize: '1rem', fontWeight: 600 }}>Microsoft</div>
              </div>
            </button>
          </div>
        </div>
      </footer>

      <div style={{ position: 'absolute', bottom: '2rem', right: '2rem' }}>
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ width: 48, height: 48, borderRadius: '50%', background: 'transparent', border: '2px solid #6366f1', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
          <span className="material-symbols-rounded">arrow_upward</span>
        </button>
      </div>
    </div>
  );
}
