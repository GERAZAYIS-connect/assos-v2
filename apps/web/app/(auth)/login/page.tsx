'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Identifiants incorrects. Veuillez réessayer.');
      } else {
        try {
          const assocRes = await fetch('/api/backend/associations/mine');
          if (assocRes.ok) {
            if (Array.isArray(list) && list.length === 1) {
              window.location.href = `/${list[0].slug}/dashboard`;
              return;
            } else if (Array.isArray(list) && list.length > 1) {
              router.push('/select-association');
              return;
            }
          }
        } catch {}
        router.push('/create-association');
      }
    } catch (err) {
      console.error(err);
      setError('Une erreur est survenue lors de la connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Logo */}
        <Link href="/" className={styles.logo}>
          <span className="material-symbols-rounded">diversity_3</span>
          <span>Assos 2.0</span>
        </Link>

        <div className={styles.header}>
          <h1>Bon retour 👋</h1>
          <p>Connectez-vous à votre compte</p>
        </div>

        {error && (
          <div className="badge badge-error" style={{ width: '100%', padding: 'var(--space-3)', justifyContent: 'center' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '18px' }}>error</span>
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email ou téléphone</label>
            <div className="form-input-wrapper">
              <span className="material-symbols-rounded input-icon">person</span>
              <input
                id="login-email"
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="form-input"
                placeholder="marie@gmail.com ou +237690..."
                required
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <div className={styles.labelRow}>
              <label htmlFor="login-password" className="form-label">Mot de passe</label>
              <Link href="/forgot-password" className={styles.forgotLink}>Mot de passe oublié ?</Link>
            </div>
            <div className="form-input-wrapper">
              <span className="material-symbols-rounded input-icon">lock</span>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
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
                Connexion...
              </>
            ) : (
              <>
                <span className="material-symbols-rounded">login</span>
                Se connecter
              </>
            )}
          </button>
        </form>

        <div className={styles.divider}><span>ou</span></div>

        <p className={styles.switchLink}>
          Pas encore de compte ?{' '}
          <Link href="/register">Créer un compte</Link>
        </p>
      </div>

      <div className={styles.bg} aria-hidden="true" />
    </div>
  );
}
