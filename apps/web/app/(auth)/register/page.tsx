'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import styles from '../auth.module.css';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validation
    if (!email && !phone) {
      setError('Veuillez renseigner un email ou un numéro de téléphone.');
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      setIsLoading(false);
      return;
    }

    try {
      // 1. Call Register API
      const response = await fetch('/api/backend/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || undefined,
          phone: phone || undefined,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Une erreur est survenue lors de la création du compte.');
        setIsLoading(false);
        return;
      }

      // 2. Auto login via NextAuth
      const loginRes = await signIn('credentials', {
        email: email || phone,
        password,
        redirect: false,
      });

      if (loginRes?.error) {
        // Fallback: account created, redirect to login
        router.push('/login?registered=true');
      } else {
        router.push('/create-association');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError('Impossible de contacter le serveur. Veuillez vérifier que l’API est démarrée.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card} style={{ maxWidth: '480px' }}>
        <Link href="/" className={styles.logo}>
          <span className="material-symbols-rounded">diversity_3</span>
          <span>Assos 2.0</span>
        </Link>

        <div className={styles.header}>
          <h1>Créer un compte</h1>
          <p>Commencez gratuitement — 30 jours d'essai</p>
        </div>

        {error && (
          <div className="badge badge-error" style={{ width: '100%', padding: 'var(--space-3)', justifyContent: 'center' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>error</span>
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          {/* Contact */}
          <div className={styles.section}>
            <div className="form-group">
              <label htmlFor="reg-email" className="form-label">
                Email
              </label>
              <div className="form-input-wrapper">
                <span className="material-symbols-rounded input-icon">email</span>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="form-input"
                  placeholder="vous@example.com"
                  autoComplete="email"
                />
              </div>
              <span className="form-hint">Ou utilisez un numéro de téléphone ci-dessous</span>
            </div>

            <div className="form-group">
              <label htmlFor="reg-phone" className="form-label">
                Téléphone <span style={{ color: 'var(--color-on-surface-variant)', fontWeight: 400 }}>(optionnel si email)</span>
              </label>
              <div className="form-input-wrapper">
                <span className="material-symbols-rounded input-icon">phone</span>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="form-input"
                  placeholder="+237690123456"
                  autoComplete="tel"
                />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className={styles.section}>
            <div className="form-group">
              <label htmlFor="reg-password" className="form-label">Mot de passe</label>
              <div className="form-input-wrapper">
                <span className="material-symbols-rounded input-icon">lock</span>
                <input
                  id="reg-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="8 caractères minimum"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-confirm" className="form-label">Confirmer le mot de passe</label>
              <div className="form-input-wrapper">
                <span className="material-symbols-rounded input-icon">lock_reset</span>
                <input
                  id="reg-confirm"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {isLoading ? (
              <>
                <span className="material-symbols-rounded animate-spin">sync</span>
                Création du compte...
              </>
            ) : (
              <>
                <span className="material-symbols-rounded">person_add</span>
                Créer mon compte
              </>
            )}
          </button>

          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-on-surface-variant)', textAlign: 'center' }}>
            En créant un compte, vous acceptez nos{' '}
            <Link href="/terms" style={{ textDecoration: 'underline' }}>Conditions d'utilisation</Link>
            {' '}et notre{' '}
            <Link href="/privacy" style={{ textDecoration: 'underline' }}>Politique de confidentialité</Link>.
          </p>
        </form>

        <div className={styles.divider}><span>ou</span></div>

        <p className={styles.switchLink}>
          Déjà un compte ?{' '}
          <Link href="/login">Se connecter</Link>
        </p>
      </div>

      <div className={styles.bg} aria-hidden="true" />
    </div>
  );
}
