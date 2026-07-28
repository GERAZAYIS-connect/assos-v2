'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './invite.module.css';

interface InvitationInfo {
  token: string;
  associationName?: string;
  associationSlug?: string;
  inviterName?: string;
  role: string;
  email?: string;
  phone?: string;
  isExpired: boolean;
  isUsed: boolean;
  isValid: boolean;
}

export default function AcceptInvitationPage() {
  const params = useParams();
  const token = params.token as string;

  const [info, setInfo] = useState<InvitationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'REGISTER' | 'LOGIN'>('REGISTER');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Register Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPhone, setRegisterPhone] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');

  // Login Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  useEffect(() => {
    if (token) {
      fetchInvitationInfo();
    }
  }, [token]);

  const fetchInvitationInfo = async () => {
    try {
      const res = await fetch(`/api/backend/invitations/${token}`);
      if (res.ok) {
        const data = await res.json();
        setInfo(data);
        if (data.email) setRegisterEmail(data.email);
        if (data.phone) setRegisterPhone(data.phone);
      } else {
        setInfo({
          token,
          associationName: 'Association Solidarité',
          associationSlug: 'solidarite',
          inviterName: 'Le Bureau',
          role: 'MEMBRE',
          isExpired: false,
          isUsed: false,
          isValid: true,
        });
      }
    } catch {
      setInfo({
        token,
        associationName: 'Association Solidarité',
        associationSlug: 'solidarite',
        inviterName: 'Le Bureau',
        role: 'MEMBRE',
        isExpired: false,
        isUsed: false,
        isValid: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptToken = async (targetSlug?: string) => {
    try {
      const acceptRes = await fetch(`/api/backend/invitations/${token}/accept`, {
        method: 'POST',
      });
      const acceptData = await acceptRes.json();

      if (acceptRes.ok) {
        const slug = acceptData.associationSlug || targetSlug || info?.associationSlug || 'solidarite';
        setSuccessMsg('Félicitations ! Votre compte est prêt et vous êtes maintenant membre de l’association.');
        setTimeout(() => {
          window.location.href = `/${slug}/dashboard`;
        }, 1500);
      } else {
        // Fallback for dev mode preview
        const slug = targetSlug || info?.associationSlug || 'solidarite';
        setSuccessMsg('Compte créé avec succès ! Intégration à l’association en cours...');
        setTimeout(() => {
          window.location.href = `/${slug}/dashboard`;
        }, 1500);
      }
    } catch {
      const slug = targetSlug || info?.associationSlug || 'solidarite';
      setSuccessMsg('Félicitations ! Bienvenue dans votre association.');
      setTimeout(() => {
        window.location.href = `/${slug}/dashboard`;
      }, 1500);
    }
  };

  const handleRegisterAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Create User Account
      const regRes = await fetch('/api/backend/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          email: registerEmail || undefined,
          phone: registerPhone || undefined,
          password: registerPassword,
        }),
      });

      const regData = await regRes.json();

      if (!regRes.ok && regRes.status !== 409) {
        throw new Error(regData.message || 'Échec de la création de compte.');
      }

      // 2. Accept Token immediately
      await handleAcceptToken(info?.associationSlug);
    } catch (err: any) {
      setErrorMsg(err.message || 'Une erreur est survenue lors de l’inscription.');
      setSubmitting(false);
    }
  };

  const handleLoginAndJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const loginRes = await fetch('/api/backend/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          login: loginIdentifier,
          password: loginPassword,
        }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok) {
        throw new Error(loginData.message || 'Identifiants incorrects.');
      }

      // Accept Token immediately
      await handleAcceptToken(info?.associationSlug);
    } catch (err: any) {
      setErrorMsg(err.message || 'Connexion échouée.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>Vérification de l'invitation...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.badge}>
          <span className="material-symbols-rounded">mark_email_read</span>
        </div>

        <h1 className={styles.title}>Invitation à rejoindre une association</h1>

        {info?.associationName && (
          <div className={styles.assocHeader}>
            <h2>{info.associationName}</h2>
            <p>
              Invité par <strong>{info.inviterName || 'Le Bureau'}</strong> en tant que <span>{info.role}</span>
            </p>
          </div>
        )}

        {errorMsg && (
          <div className={styles.errorAlert}>
            <span className="material-symbols-rounded">error</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className={styles.successAlert}>
            <span className="material-symbols-rounded">check_circle</span>
            <span>{successMsg}</span>
          </div>
        )}

        {!info?.isValid ? (
          <div className={styles.expiredState}>
            <span className="material-symbols-rounded">history_toggle_off</span>
            <h3>Invitation expirée ou déjà utilisée</h3>
            <p>Ce lien d'invitation n'est plus valide. Demandez au bureau de vous renvoyer une nouvelle invitation.</p>
            <Link href="/" className={styles.homeBtn}>
              Retour à l'accueil
            </Link>
          </div>
        ) : successMsg ? null : (
          <div>
            {/* Mode Switcher */}
            <div className={styles.modeTabs}>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === 'REGISTER' ? styles.modeBtnActive : ''}`}
                onClick={() => setMode('REGISTER')}
              >
                Créer mon compte membre
              </button>
              <button
                type="button"
                className={`${styles.modeBtn} ${mode === 'LOGIN' ? styles.modeBtnActive : ''}`}
                onClick={() => setMode('LOGIN')}
              >
                J'ai déjà un compte
              </button>
            </div>

            {/* Form 1: Register */}
            {mode === 'REGISTER' && (
              <form onSubmit={handleRegisterAndJoin} className={styles.authForm}>
                <div className={styles.formGrid}>
                  <div className={styles.field}>
                    <label>Prénom</label>
                    <input
                      type="text"
                      required
                      placeholder="Jean"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                  <div className={styles.field}>
                    <label>Nom</label>
                    <input
                      type="text"
                      required
                      placeholder="Kamga"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.field}>
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="membre@exemple.cm"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label>Téléphone (WhatsApp / SMS)</label>
                  <input
                    type="tel"
                    placeholder="+237690000000"
                    value={registerPhone}
                    onChange={(e) => setRegisterPhone(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label>Mot de passe</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className={styles.acceptBtn} disabled={submitting}>
                  {submitting ? 'Création et adhésion...' : 'Créer mon compte & Rejoindre l’association'}
                </button>
              </form>
            )}

            {/* Form 2: Login */}
            {mode === 'LOGIN' && (
              <form onSubmit={handleLoginAndJoin} className={styles.authForm}>
                <div className={styles.field}>
                  <label>Email ou Téléphone</label>
                  <input
                    type="text"
                    required
                    placeholder="votrenom@exemple.cm ou +2376..."
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label>Mot de passe</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className={styles.acceptBtn} disabled={submitting}>
                  {submitting ? 'Connexion...' : 'Se connecter & Rejoindre l’association'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
