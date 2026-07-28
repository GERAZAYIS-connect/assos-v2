'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import styles from './certificate.module.css';

interface CertificateResult {
  isValid: boolean;
  isExpired: boolean;
  isRevoked?: boolean;
  issuedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  revokedReason?: string;
  associationName?: string;
  associationLogoUrl?: string;
  member: {
    id: string;
    role: string;
    status: string;
    memberNumber: string;
    userEmail?: string;
    userPhone?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      photoUrl?: string;
      profession?: string;
      address?: string;
    };
    createdAt: string;
  };
}

export default function VerifyCertificatePage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<CertificateResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (token) verifyToken();
  }, [token]);

  useEffect(() => {
    if (data && qrCanvasRef.current) {
      generateQr();
    }
  }, [data]);

  const verifyToken = async () => {
    try {
      const res = await fetch(`/api/backend/certificates/verify/${token}`);
      if (res.ok) {
        setData(await res.json());
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.message || 'Attestation invalide ou introuvable.');
      }
    } catch {
      setErrorMsg('Erreur de connexion lors de la vérification.');
    } finally {
      setLoading(false);
    }
  };

  const generateQr = async () => {
    try {
      const verificationUrl = `${window.location.origin}/verify/certificate/${token}`;
      const QRCode = (await import('qrcode')).default;
      if (qrCanvasRef.current) {
        await QRCode.toCanvas(qrCanvasRef.current, verificationUrl, {
          width: 120,
          margin: 1,
          color: { dark: '#000000', light: '#ffffff' },
        });
      }
    } catch (e) {
      console.error('QR generation error', e);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.loading}>Vérification du certificat officiel...</div>
        </div>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <span className="material-symbols-rounded">cancel</span>
          <h2>Certificat Invalide</h2>
          <p>{errorMsg || "Ce document n'est pas authentifié par le registre officiel assos 2.0."}</p>
        </div>
      </div>
    );
  }

  const m = data.member;
  const memberName = m.profile?.firstName
    ? `${m.profile.firstName} ${m.profile.lastName || ''}`.trim()
    : m.userEmail || 'Membre';

  return (
    <div className={styles.container}>
      <div className={styles.printHeader}>
        <button type="button" onClick={() => window.print()} className={styles.printBtn}>
          <span className="material-symbols-rounded">print</span>
          Imprimer l'Attestation Officielle (PDF)
        </button>
      </div>

      <div className={styles.certificateDocument}>
        <div className={styles.watermark}>REGISTRE OFFICIEL</div>

        <div className={styles.docHeader}>
          <div className={styles.badgeOfficial}>
            {data.associationLogoUrl ? (
              <img src={data.associationLogoUrl} alt="Logo" className={styles.assocLogoImg} />
            ) : (
              <span className="material-symbols-rounded">verified</span>
            )}
          </div>
          {data.associationName && (
            <div className={styles.assocName}>{data.associationName}</div>
          )}
          <h1>ATTESTATION DE MEMBRE EN RÈGLE</h1>
          <p className={styles.docSub}>Délivrée sous le sceau numérique du Registre Associatif</p>
        </div>

        <div className={`${styles.statusBox} ${!data.isValid ? styles.statusBoxInvalid : ''}`}>
          {m.profile?.photoUrl && (
            <div className={styles.statusPhotoLeftWrapper}>
              <img
                src={m.profile.photoUrl}
                alt="Photo d'identité du membre"
                className={styles.memberIdPhotoSquare}
              />
            </div>
          )}
          <div className={styles.statusMainGroup}>
            <span className="material-symbols-rounded">
              {data.isValid ? 'check_circle' : data.isRevoked ? 'cancel' : data.isExpired ? 'schedule' : 'cancel'}
            </span>
            <div>
              <h3>
                {data.isValid
                  ? 'DOCUMENT AUTHENTIFIÉ ET VALIDE'
                  : data.isRevoked
                  ? 'DOCUMENT INVALIDÉ PAR LE BUREAU'
                  : data.isExpired
                  ? 'DOCUMENT EXPIRÉ'
                  : 'DOCUMENT INVALIDE'}
              </h3>
              <p>
                Délivré le {new Date(data.issuedAt).toLocaleDateString('fr-FR')} | Code Unique :{' '}
                {token.substring(0, 12).toUpperCase()}
                {data.isRevoked ? (
                  <> | Invalidé le {new Date(data.revokedAt!).toLocaleDateString('fr-FR')}{data.revokedReason ? ` (${data.revokedReason})` : ''}</>
                ) : data.expiresAt ? (
                  <> | Valide jusqu'au {new Date(data.expiresAt).toLocaleDateString('fr-FR')}</>
                ) : null}
              </p>
            </div>
          </div>
        </div>

        <div className={styles.docBody}>
          <p className={styles.legalText}>
            Le Bureau Exécutif certifie par la présente que le membre désigné ci-dessous est
            régulièrement inscrit au registre officiel, s'est acquitté de l'ensemble de ses
            cotisations et obligations statutaires, et jouit du statut de{' '}
            <strong>MEMBRE EN RÈGLE (ACTIF)</strong>.
          </p>

          <div className={styles.identityGrid}>
            <div className={styles.row}>
              <span className={styles.label}>Nom & Prénom :</span>
              <span className={styles.val}>{memberName}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Matricule Officiel :</span>
              <span className={styles.val}>{m.memberNumber}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Rôle au Bureau :</span>
              <span className={styles.val}>{m.role}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Date d'Adhésion :</span>
              <span className={styles.val}>{new Date(m.createdAt).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Profession :</span>
              <span className={styles.val}>{m.profile?.profession || 'Non spécifié'}</span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>Adresse :</span>
              <span className={styles.val}>{m.profile?.address || 'Non spécifié'}</span>
            </div>
          </div>
        </div>

        <div className={styles.docFooter}>
          <div className={styles.qrBlock}>
            <canvas ref={qrCanvasRef} className={styles.qrCanvas} />
            <span className={styles.qrText}>Vérification numérique en direct</span>
          </div>

          <div className={styles.signBlock}>
            <p>Pour faire valoir ce que de droit,</p>
            <div className={styles.signatureLine}>
              <strong>Sceau du Président & Secrétaire Général</strong>
              <span>Signé numériquement — assos 2.0</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
