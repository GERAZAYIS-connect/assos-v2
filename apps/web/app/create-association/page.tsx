'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './create-association.module.css';

export default function CreateAssociationPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [currency, setCurrency] = useState('XAF');
  const [country, setCountry] = useState('CM');
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-generate slug from association name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);

    const generatedSlug = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    setSlug(generatedSlug);
    if (generatedSlug.length >= 3) {
      checkSlugAvailability(generatedSlug);
    } else {
      setSlugStatus('idle');
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setSlug(val);
    if (val.length >= 3) {
      checkSlugAvailability(val);
    } else {
      setSlugStatus('idle');
    }
  };

  const checkSlugAvailability = async (testSlug: string) => {
    setSlugStatus('checking');
    try {
      const res = await fetch(`/api/backend/associations/check-slug/${testSlug}`);
      if (res.ok) {
        const data = await res.json();
        setSlugStatus(data.available ? 'available' : 'taken');
      } else {
        setSlugStatus('available');
      }
    } catch {
      setSlugStatus('available');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !slug.trim()) {
      setErrorMsg('Veuillez remplir le nom et le lien dédié de votre association.');
      return;
    }

    if (slugStatus === 'taken') {
      setErrorMsg('Ce nom de domaine est déjà réservé par une autre association.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/backend/associations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          currency,
          country,
          language: 'fr',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Échec de la création de l’association');
      }

      // Successful creation! Cache created association in local storage
      try {
        const stored = JSON.parse(localStorage.getItem('created_associations') || '[]');
        if (!stored.some((item: any) => item.slug === data.slug)) {
          stored.push(data);
          localStorage.setItem('created_associations', JSON.stringify(stored));
        }
      } catch {}

      // Redirect to the tenant subdomain dashboard
      const host = window.location.host;
      const isLocal = host.includes('localhost') || host.includes('lvh.me');
      const protocol = window.location.protocol;
      const rootDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'asso-in.online';

      const targetDomain = isLocal
        ? `${protocol}//${data.slug}.lvh.me:3000/dashboard`
        : `${protocol}//${data.slug}.${rootDomain}/dashboard`;

      window.location.href = targetDomain;
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoBadge}>
            <span className="material-symbols-rounded">diversity_3</span>
          </div>
          <h1>Créer votre espace Association</h1>
          <p>
            Donnez une identité numérique à votre association, tontine ou mutuelle avec un lien dédié sécurisé.
          </p>
        </div>

        {errorMsg && (
          <div className={styles.errorAlert}>
            <span className="material-symbols-rounded">warning</span>
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="name">Nom de l’association *</label>
            <input
              id="name"
              type="text"
              placeholder="Ex: Tontine Solidarité Douala"
              value={name}
              onChange={handleNameChange}
              required
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="slug">Adresse dédiée (Sous-domaine) *</label>
            <div className={styles.domainInputGroup}>
              <input
                id="slug"
                type="text"
                placeholder="nom-association"
                value={slug}
                onChange={handleSlugChange}
                required
              />
              <span className={styles.domainSuffix}>.asso-in.online</span>
            </div>
            {slugStatus === 'checking' && (
              <span className={styles.statusChecking}>Vérification de la disponibilité...</span>
            )}
            {slugStatus === 'available' && (
              <span className={styles.statusAvailable}>
                <span className="material-symbols-rounded">check_circle</span> Ce nom est disponible !
              </span>
            )}
            {slugStatus === 'taken' && (
              <span className={styles.statusTaken}>
                <span className="material-symbols-rounded">cancel</span> Ce nom est déjà utilisé
              </span>
            )}
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label htmlFor="currency">Devise principale</label>
              <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="XAF">FCFA (XAF - Afrique Centrale)</option>
                <option value="XOF">FCFA (XOF - Afrique de l'Ouest)</option>
                <option value="EUR">Euro (€)</option>
                <option value="USD">Dollar ($)</option>
              </select>
            </div>

            <div className={styles.field}>
              <label htmlFor="country">Pays d'implantation</label>
              <select id="country" value={country} onChange={(e) => setCountry(e.target.value)}>
                <option value="CM">Cameroun 🇨🇲</option>
                <option value="CI">Côte d'Ivoire 🇨🇮</option>
                <option value="SN">Sénégal 🇸🇳</option>
                <option value="GA">Gabon 🇬🇦</option>
                <option value="CG">Congo 🇨🇬</option>
                <option value="FR">France (Diaspora) 🇫🇷</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || slugStatus === 'taken' || !slug.trim()}
          >
            {loading ? 'Création de votre espace en cours...' : 'Créer l’association & Accéder au Tableau de Bord'}
          </button>
        </form>
      </div>
    </div>
  );
}
