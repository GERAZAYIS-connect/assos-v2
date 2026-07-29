'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/backend/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        alert('Votre message a été envoyé avec succès !');
        setFormData({ firstName: '', lastName: '', email: '', phone: '', subject: '', message: '' });
      } else {
        alert("Erreur lors de l'envoi. Veuillez réessayer.");
      }
    } catch (err) {
      alert('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div style={{ background: '#ffffff', color: '#0f172a', fontFamily: 'system-ui, -apple-system, sans-serif', minHeight: '100vh' }}>
      
      {/* 1. Header */}
      <header style={{ padding: '1.25rem 2.5rem', background: '#000000', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 900, fontSize: '1.35rem' }}>
          <span className="material-symbols-rounded" style={{ color: '#ffffff', fontSize: '2rem' }}>diversity_3</span>
          <span style={{ color: '#ffffff', letterSpacing: '-0.02em' }}>Assos 2.0</span>
        </Link>
        <Link href="/" style={{ color: '#ffffff', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }}>Retour à l'accueil</Link>
      </header>

      {/* 2. Hero Section */}
      <section style={{ background: '#000000', padding: '6rem 1.25rem', textAlign: 'center', color: '#ffffff' }}>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 900, margin: '0 0 1rem 0', letterSpacing: '-0.03em' }}>Nous Contacter</h1>
        <div style={{ fontSize: '1rem', color: '#a1a1aa' }}>
          <Link href="/" style={{ color: '#ffffff', textDecoration: 'none' }}>Accueil</Link>
          <span style={{ margin: '0 0.5rem' }}>&gt;</span>
          <span>Nous Contacter</span>
        </div>
      </section>

      {/* 3. Connect & Collaborate Section */}
      <section style={{ padding: '5rem 1.25rem', maxWidth: 1200, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ background: '#f4f4f5', color: '#000000', fontSize: '0.75rem', fontWeight: 800, padding: '0.4rem 1rem', borderRadius: 999, display: 'inline-block', marginBottom: '1rem', textTransform: 'uppercase' }}>
          Restons en contact
        </div>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#000000', margin: '0 0 4rem 0', letterSpacing: '-0.03em' }}>
          Connectons-nous et collaborons ensemble
        </h2>

        {/* Info Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          {/* Card 1 */}
          <div style={{ border: '1px solid #e4e4e7', borderRadius: 16, padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', textAlign: 'left', background: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-rounded">location_on</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Notre Adresse</strong>
              <span style={{ color: '#52525b', fontSize: '0.9rem' }}>8708 Technology Forest Pl Suite 125, The Woodland TX 77381</span>
            </div>
          </div>
          {/* Card 2 */}
          <div style={{ border: '1px solid #e4e4e7', borderRadius: 16, padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', textAlign: 'left', background: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-rounded">call</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Appelez-nous</strong>
              <span style={{ color: '#52525b', fontSize: '0.9rem' }}>(+123) 342-456-7890</span>
            </div>
          </div>
          {/* Card 3 */}
          <div style={{ border: '1px solid #e4e4e7', borderRadius: 16, padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', textAlign: 'left', background: '#ffffff', boxShadow: '0 10px 30px rgba(0,0,0,0.02)' }}>
            <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#000000', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span className="material-symbols-rounded">mail</span>
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '0.25rem' }}>Envoyez un email</strong>
              <span style={{ color: '#52525b', fontSize: '0.9rem' }}>info@assos2.com</span>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div style={{ border: '1px solid #e4e4e7', borderRadius: 24, padding: '3rem', background: '#ffffff', boxShadow: '0 20px 40px rgba(0,0,0,0.04)', textAlign: 'left' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Prénom*</label>
                <input required type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Entrez votre prénom" style={{ width: '100%', padding: '1rem', borderRadius: 8, border: '1px solid #e4e4e7', background: '#f8fafc', fontSize: '0.95rem', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Nom*</label>
                <input required type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Entrez votre nom" style={{ width: '100%', padding: '1rem', borderRadius: 8, border: '1px solid #e4e4e7', background: '#f8fafc', fontSize: '0.95rem', outline: 'none' }} />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Adresse Email*</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Entrez votre adresse email" style={{ width: '100%', padding: '1rem', borderRadius: 8, border: '1px solid #e4e4e7', background: '#f8fafc', fontSize: '0.95rem', outline: 'none' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Numéro de téléphone*</label>
                <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Entrez votre numéro" style={{ width: '100%', padding: '1rem', borderRadius: 8, border: '1px solid #e4e4e7', background: '#f8fafc', fontSize: '0.95rem', outline: 'none' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Sujet*</label>
              <input required type="text" name="subject" value={formData.subject} onChange={handleChange} placeholder="Sujet de votre demande" style={{ width: '100%', padding: '1rem', borderRadius: 8, border: '1px solid #e4e4e7', background: '#f8fafc', fontSize: '0.95rem', outline: 'none' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Votre Message*</label>
              <textarea required name="message" value={formData.message} onChange={handleChange} placeholder="Écrivez votre message ici..." rows={6} style={{ width: '100%', padding: '1rem', borderRadius: 8, border: '1px solid #e4e4e7', background: '#f8fafc', fontSize: '0.95rem', outline: 'none', resize: 'vertical' }}></textarea>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button disabled={isSubmitting} type="submit" style={{ background: '#000000', color: '#ffffff', border: 'none', padding: '1rem 2rem', borderRadius: 999, fontWeight: 700, fontSize: '0.95rem', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? 'Envoi en cours...' : 'Envoyer le message'}
                {!isSubmitting && <span className="material-symbols-rounded" style={{ fontSize: '1.2rem' }}>arrow_forward</span>}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 4. FAQ Section */}
      <section style={{ padding: '5rem 1.25rem', background: '#f8fafc' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '4rem', alignItems: 'flex-start' }}>
          <div>
            <div style={{ background: '#e4e4e7', color: '#000000', fontSize: '0.75rem', fontWeight: 800, padding: '0.4rem 1rem', borderRadius: 999, display: 'inline-block', marginBottom: '1.25rem' }}>
              Foire Aux Questions
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#000000', margin: '0 0 1.5rem 0', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Des questions ? Nous avons des réponses.
            </h2>
            <button style={{ background: '#000000', color: '#ffffff', border: 'none', padding: '0.85rem 1.5rem', borderRadius: 999, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Plus de questions ?
              <span className="material-symbols-rounded" style={{ fontSize: '1.1rem' }}>arrow_forward</span>
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#000000', color: '#ffffff', padding: '1.5rem', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: 'pointer' }}>
              <strong style={{ fontSize: '1rem' }}>Quelles intégrations supporte Assos 2.0 ?</strong>
              <span className="material-symbols-rounded">expand_less</span>
            </div>
            <div style={{ background: '#ffffff', color: '#000000', border: '1px solid #e4e4e7', padding: '1.5rem', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <strong style={{ fontSize: '1rem' }}>Assos 2.0 est-il adapté aux petites associations ?</strong>
              <span className="material-symbols-rounded">expand_more</span>
            </div>
            <div style={{ background: '#ffffff', color: '#000000', border: '1px solid #e4e4e7', padding: '1.5rem', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <strong style={{ fontSize: '1rem' }}>Comment l'application aide-t-elle le bureau exécutif ?</strong>
              <span className="material-symbols-rounded">expand_more</span>
            </div>
            <div style={{ background: '#ffffff', color: '#000000', border: '1px solid #e4e4e7', padding: '1.5rem', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <strong style={{ fontSize: '1rem' }}>Les membres peuvent-ils payer via Mobile Money ?</strong>
              <span className="material-symbols-rounded">expand_more</span>
            </div>
            <div style={{ background: '#ffffff', color: '#000000', border: '1px solid #e4e4e7', padding: '1.5rem', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <strong style={{ fontSize: '1rem' }}>Fournissez-vous des rapports certifiés ?</strong>
              <span className="material-symbols-rounded">expand_more</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CTA Section */}
      <section style={{ padding: '5rem 1.25rem', background: '#000000', color: '#ffffff', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '4rem 2rem', background: 'rgba(255,255,255,0.05)', borderRadius: 32, border: '1px solid rgba(255,255,255,0.1)' }}>
          <h2 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '2rem', letterSpacing: '-0.02em' }}>
            Transformez la gestion de votre association dès aujourd'hui
          </h2>
          <div style={{ display: 'flex', maxWidth: 450, margin: '0 auto', background: '#ffffff', padding: '0.4rem', borderRadius: 999 }}>
            <input type="email" placeholder="Entrez votre adresse email" style={{ flex: 1, border: 'none', background: 'transparent', padding: '0 1rem', fontSize: '0.95rem', color: '#000', outline: 'none' }} />
            <button style={{ background: '#000000', color: '#ffffff', border: 'none', padding: '0.85rem 1.5rem', borderRadius: 999, fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
              Démarrer
            </button>
          </div>
        </div>
      </section>

      {/* 6. Footer (Simplified) */}
      <footer style={{ background: '#ffffff', color: '#52525b', padding: '3rem 1.25rem', borderTop: '1px solid #e4e4e7' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#000000', fontWeight: 900, fontSize: '1.25rem' }}>
            <span className="material-symbols-rounded">diversity_3</span>
            Assos 2.0
          </div>
          <div style={{ fontSize: '0.9rem' }}>
            &copy; 2026 Assos 2.0. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
