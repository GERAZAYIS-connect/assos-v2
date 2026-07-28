'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './member-detail.module.css';

type TabId = 'PROFILE' | 'PROXY' | 'CERTIFICATES' | 'HISTORY';

interface MemberDetail {
  member: {
    id: string;
    associationId: string;
    userId: string;
    role: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'EXPELLED';
    memberNumber?: string;
    joiningFeePaidAt?: string | null;
    userEmail?: string;
    userPhone?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
      photoUrl?: string;
      idCardType?: string;
      idCardNumber?: string;
      address?: string;
      profession?: string;
      emergencyContactName?: string;
      emergencyContactPhone?: string;
      proxyName?: string;
      proxyPhone?: string;
      proxyNotes?: string;
      proxyIsActive?: boolean;
      proxyExpiresAt?: string;
    };
    createdAt: string;
  };
  history: {
    financialSummary: {
      totalContributions: number;
      totalLoans: number;
      activeLoansCount: number;
      totalSanctionsFines: number;
    };
    auditLogs: Array<{
      id: string;
      category: string;
      action: string;
      createdAt: string;
      metadata?: any;
    }>;
  };
}

interface Certificate {
  id: string;
  token: string;
  associationName?: string;
  issuedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  revokedReason?: string;
}

export default function MemberDetailPage() {
  const routeParams = useParams();
  const router = useRouter();
  const tenantSlug = (routeParams?.tenant as string) || '';
  const memberId = (routeParams?.id as string) || '';

  const [activeTab, setActiveTab] = useState<TabId>('PROFILE');
  const [data, setData] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [phone, setPhone] = useState('');
  const [profession, setProfession] = useState('');
  const [address, setAddress] = useState('');
  const [idCardNumber, setIdCardNumber] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');

  // Proxy form state
  const [proxyName, setProxyName] = useState('');
  const [proxyPhone, setProxyPhone] = useState('');
  const [proxyNotes, setProxyNotes] = useState('');
  const [proxyExpiresAt, setProxyExpiresAt] = useState('');
  const [proxySaving, setProxySaving] = useState(false);
  const [proxySuccess, setProxySuccess] = useState('');
  const [proxyError, setProxyError] = useState('');
  const [revokeConfirm, setRevokeConfirm] = useState(false);

  // Certificates state
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [certsLoading, setCertsLoading] = useState(false);
  const [generatingCert, setGeneratingCert] = useState(false);
  const [certError, setCertError] = useState('');
  const [certModal, setCertModal] = useState<{
    token: string;
    verificationUrl: string;
    issuedAt: string;
    expiresAt?: string;
  } | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const [validatingFee, setValidatingFee] = useState(false);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  useEffect(() => {
    if (tenantSlug && memberId) {
      fetchMemberDetails();
      fetchCurrentUserRole();
    }
  }, [tenantSlug, memberId]);

  useEffect(() => {
    if (activeTab === 'CERTIFICATES' && tenantSlug && memberId) {
      fetchCertificates();
    }
  }, [activeTab]);

  useEffect(() => {
    if (certModal && qrCanvasRef.current) {
      generateQrCode(certModal.verificationUrl);
    }
  }, [certModal]);

  const fetchMemberDetails = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/members/${memberId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        populateForm(json.member);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.message || "Impossible d'accéder aux détails de ce membre.");
      }
    } catch {
      setErrorMsg('Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUserRole = async () => {
    try {
      const res = await fetch('/api/backend/associations/mine');
      if (res.ok) {
        const associations = await res.json();
        const currentAssoc = associations.find((a: any) => a.slug === tenantSlug);
        if (currentAssoc) {
          setCurrentUserRole(currentAssoc.role);
        }
      }
    } catch {
      console.error("Impossible de récupérer le rôle de l'utilisateur actuel");
    }
  };

  const populateForm = (member: any) => {
    const p = member.profile || {};
    setFirstName(p.firstName || '');
    setLastName(p.lastName || '');
    setPhotoUrl(p.photoUrl || '');
    setPhone(member.userPhone || '');
    setProfession(p.profession || '');
    setAddress(p.address || '');
    setIdCardNumber(p.idCardNumber || '');
    setEmergencyContactName(p.emergencyContactName || '');
    setEmergencyContactPhone(p.emergencyContactPhone || '');
    setProxyName(p.proxyName || '');
    setProxyPhone(p.proxyPhone || '');
    setProxyNotes(p.proxyNotes || '');
    if (p.proxyExpiresAt) {
      setProxyExpiresAt(new Date(p.proxyExpiresAt).toISOString().split('T')[0]);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const { convertToWebP } = await import('@/lib/utils/image-utils');
      const webpBase64 = await convertToWebP(file, { maxWidth: 512, maxHeight: 512, quality: 0.82 });
      setPhotoUrl(webpBase64);
    } catch (err) {
      console.error('Image compression error', err);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const generateQrCode = async (url: string) => {
    try {
      const QRCode = (await import('qrcode')).default;
      if (qrCanvasRef.current) {
        await QRCode.toCanvas(qrCanvasRef.current, url, {
          width: 200,
          margin: 2,
          color: { dark: '#000000', light: '#ffffff' },
        });
      }
    } catch (e) {
      console.error('QR code generation error', e);
    }
  };

  const fetchCertificates = async () => {
    setCertsLoading(true);
    try {
      const res = await fetch(
        `/api/backend/associations/${tenantSlug}/members/${memberId}/certificates`,
      );
      if (res.ok) {
        const json = await res.json();
        setCertificates(Array.isArray(json) ? json : []);
      }
    } catch {
      /* silent */
    } finally {
      setCertsLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch(
        `/api/backend/associations/${tenantSlug}/members/${memberId}/profile`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName, lastName, photoUrl, profession, address,
            idCardNumber, emergencyContactName, emergencyContactPhone,
          }),
        },
      );
      if (res.ok) {
        setSuccessMsg('Profil mis à jour avec succès !');
        fetchMemberDetails();
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMsg(err.message || "Échec de la mise à jour.");
      }
    } catch {
      setErrorMsg('Erreur de connexion.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProxy = async (e: React.FormEvent) => {
    e.preventDefault();
    setProxySaving(true);
    setProxySuccess('');
    setProxyError('');
    try {
      const res = await fetch(
        `/api/backend/associations/${tenantSlug}/members/${memberId}/proxy`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            proxyName,
            proxyPhone,
            proxyNotes,
            expiresAt: proxyExpiresAt || undefined,
          }),
        },
      );
      if (res.ok) {
        setProxySuccess('Procuration enregistrée avec succès !');
        fetchMemberDetails();
      } else {
        const err = await res.json().catch(() => ({}));
        setProxyError(err.message || "Échec de l'enregistrement.");
      }
    } catch {
      setProxyError('Erreur de connexion.');
    } finally {
      setProxySaving(false);
    }
  };

  const handleRevokeProxy = async () => {
    setProxySaving(true);
    setProxyError('');
    try {
      const res = await fetch(
        `/api/backend/associations/${tenantSlug}/members/${memberId}/proxy`,
        { method: 'DELETE' },
      );
      if (res.ok) {
        setProxySuccess('Procuration révoquée.');
        setRevokeConfirm(false);
        setProxyName('');
        setProxyPhone('');
        setProxyNotes('');
        setProxyExpiresAt('');
        fetchMemberDetails();
      } else {
        const err = await res.json().catch(() => ({}));
        setProxyError(err.message || 'Échec de la révocation.');
      }
    } catch {
      setProxyError('Erreur de connexion.');
    } finally {
      setProxySaving(false);
    }
  };

  const handleGenerateCertificate = async () => {
    setGeneratingCert(true);
    setCertError('');
    try {
      const res = await fetch(
        `/api/backend/associations/${tenantSlug}/members/${memberId}/certificate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: '{}',
        },
      );
      if (res.ok) {
        const json = await res.json();
        setCertModal({
          token: json.token,
          verificationUrl: json.verificationUrl,
          issuedAt: json.issuedAt,
          expiresAt: json.expiresAt,
        });
        fetchCertificates();
      } else {
        const err = await res.json().catch(() => ({}));
        setCertError(err.message || 'Échec de la génération.');
      }
    } catch {
      setCertError('Erreur de connexion.');
    } finally {
      setGeneratingCert(false);
    }
  };

  const handleRevokeCertificate = async (certId: string) => {
    const reason = window.prompt("Motif de l'invalidation de cette attestation (optionnel) :");
    if (reason === null) return;
    try {
      const res = await fetch(
        `/api/backend/associations/${tenantSlug}/certificates/${certId}/revoke`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        },
      );
      if (res.ok) {
        fetchCertificates();
      } else {
        const err = await res.json().catch(() => ({}));
        setCertError(err.message || "Échec de l'invalidation.");
      }
    } catch {
      setCertError('Erreur de connexion.');
    }
  };

  const handleValidateJoiningFee = async () => {
    if (!window.confirm("Voulez-vous valider le paiement du droit d'adhésion pour ce membre ?")) return;
    setValidatingFee(true);
    try {
      const res = await fetch(
        `/api/backend/associations/${tenantSlug}/members/${memberId}/joining-fee`,
        {
          method: 'POST',
        }
      );
      if (res.ok) {
        setSuccessMsg("Droit d'adhésion validé !");
        fetchMemberDetails();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || 'Échec de la validation du droit d\'adhésion.');
      }
    } catch {
      alert('Erreur de connexion.');
    } finally {
      setValidatingFee(false);
    }
  };

  const getProxyStatus = () => {
    const p = data?.member?.profile;
    if (!p?.proxyName && !p?.proxyPhone) return 'NONE';
    if (!p?.proxyIsActive) return 'REVOKED';
    if (p?.proxyExpiresAt && new Date(p.proxyExpiresAt) < new Date()) return 'EXPIRED';
    return 'ACTIVE';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Chargement de la fiche du membre...</div>
      </div>
    );
  }

  if (errorMsg && !data) {
    return (
      <div className={styles.container}>
        <div className={styles.errorCard}>
          <span className="material-symbols-rounded">shield_lock</span>
          <h2>Accès restreint</h2>
          <p>{errorMsg}</p>
          <Link href={`/${tenantSlug}/members`} className={styles.backBtn}>
            Retour à l'Annuaire
          </Link>
        </div>
      </div>
    );
  }

  const m = data?.member;
  const proxyStatus = getProxyStatus();

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <Link href={`/${tenantSlug}/members`} className={styles.backLink}>
          <span className="material-symbols-rounded">arrow_back</span>
          Retour à l'Annuaire
        </Link>
      </div>

      {/* Member Header Card */}
      <div className={styles.headerCard}>
        <div className={styles.avatarLarge}>
          {m?.profile?.photoUrl ? (
            <img src={m.profile.photoUrl} alt="Photo" className={styles.avatarImg} />
          ) : (
            m?.profile?.firstName?.[0] || m?.userEmail?.[0] || 'M'
          )}
        </div>
        <div className={styles.headerDetails}>
          <div className={styles.titleRow}>
            <h1>{m?.profile?.firstName ? `${m.profile.firstName} ${m.profile.lastName || ''}` : m?.userEmail}</h1>
            <span className={styles.roleBadge}>{m?.role}</span>
            <span className={`${styles.statusPill} ${styles[`status_${m?.status.toLowerCase()}`]}`}>
              {m?.status}
            </span>
          </div>
          <p className={styles.matriculeText}>
            Matricule : <strong>{m?.memberNumber}</strong> | Inscription :{' '}
            {new Date(m?.createdAt || '').toLocaleDateString('fr-FR')}
          </p>
          <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {m?.joiningFeePaidAt ? (
              <span className={styles.statusPill} style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0' }}>
                <span className="material-symbols-rounded" style={{ fontSize: '14px', marginRight: '4px' }}>check_circle</span>
                Droit d'adhésion payé
              </span>
            ) : (
              <>
                <span className={styles.statusPill} style={{ background: '#fffbeb', color: '#b45309', border: '1px solid #fde68a' }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '14px', marginRight: '4px' }}>pending_actions</span>
                  Droit d'adhésion en attente
                </span>
                {(currentUserRole === 'PRESIDENT' || currentUserRole === 'TREASURER') && (
                  <button
                    onClick={handleValidateJoiningFee}
                    disabled={validatingFee}
                    className={styles.saveBtn}
                    style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem', width: 'auto' }}
                  >
                    {validatingFee ? '...' : 'Valider le paiement'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabsNav}>
        <button
          className={`${styles.tabBtn} ${activeTab === 'PROFILE' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('PROFILE')}
        >
          <span className="material-symbols-rounded">person</span>
          Profil & Identité
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'PROXY' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('PROXY')}
        >
          <span className="material-symbols-rounded">manage_accounts</span>
          Procuration
          {proxyStatus === 'ACTIVE' && <span className={styles.tabBadgeGreen}>ACTIVE</span>}
          {proxyStatus === 'EXPIRED' && <span className={styles.tabBadgeOrange}>EXPIRÉE</span>}
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'CERTIFICATES' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('CERTIFICATES')}
        >
          <span className="material-symbols-rounded">verified</span>
          Attestations
        </button>
        <button
          className={`${styles.tabBtn} ${activeTab === 'HISTORY' ? styles.tabActive : ''}`}
          onClick={() => setActiveTab('HISTORY')}
        >
          <span className="material-symbols-rounded">history</span>
          Historique
        </button>
      </div>

      {/* ─── TAB 1 : PROFILE ─── */}
      {activeTab === 'PROFILE' && (
        <div className={styles.tabContent}>
          {successMsg && (
            <div className={styles.successAlert}>
              <span className="material-symbols-rounded">check_circle</span>
              <span>{successMsg}</span>
            </div>
          )}
          <form onSubmit={handleSaveProfile} className={styles.profileForm}>
            <div className={styles.sectionHeader}>
              <h2>Informations Personnelles</h2>
              <p>Mettez à jour vos coordonnées et votre identité officielle.</p>
            </div>
            <div className={styles.avatarUploadSection}>
              <div className={styles.avatarUploadPreview}>
                {photoUrl ? (
                  <img src={photoUrl} alt="Avatar" className={styles.avatarImg} />
                ) : (
                  <span>{firstName?.[0] || m?.userEmail?.[0] || 'M'}</span>
                )}
              </div>
              <div className={styles.avatarUploadInfo}>
                <label className={styles.uploadPhotoBtn}>
                  <span className="material-symbols-rounded">photo_camera</span>
                  {uploadingPhoto ? 'Conversion WebP...' : 'Changer la photo de profil'}
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                </label>
                <p>Format WebP optimisé automatiquement (max 512x512)</p>
              </div>
            </div>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Prénom</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Nom de famille</label>
                <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Email (Compte)</label>
                <input type="email" value={m?.userEmail || ''} disabled readOnly className={styles.readOnlyInput} />
              </div>
              <div className={styles.field}>
                <label>Numéro de Téléphone</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Profession</label>
                <input type="text" value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="ex: Ingénieur, Commerçant" />
              </div>
              <div className={styles.field}>
                <label>Numéro CNI / Passeport</label>
                <input type="text" value={idCardNumber} onChange={(e) => setIdCardNumber(e.target.value)} />
              </div>
              <div className={styles.fieldFull}>
                <label>Adresse de résidence</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Yaoundé, Quartier Bastos" />
              </div>
              <div className={styles.field}>
                <label>Contact d'urgence (Nom)</label>
                <input type="text" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
              </div>
              <div className={styles.field}>
                <label>Contact d'urgence (Téléphone)</label>
                <input type="text" value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} />
              </div>
            </div>
            <div className={styles.formFooter}>
              <button type="submit" className={styles.saveBtn} disabled={saving}>
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── TAB 2 : PROCURATION ─── */}
      {activeTab === 'PROXY' && (
        <div className={styles.tabContent}>
          {/* Status Banner */}
          <div className={`${styles.proxyStatusBanner} ${styles[`proxyBanner_${proxyStatus.toLowerCase()}`]}`}>
            <span className="material-symbols-rounded">
              {proxyStatus === 'ACTIVE' ? 'verified_user' : proxyStatus === 'EXPIRED' ? 'warning' : 'person_off'}
            </span>
            <div>
              <strong>
                {proxyStatus === 'ACTIVE' && 'Procuration Active'}
                {proxyStatus === 'EXPIRED' && 'Procuration Expirée'}
                {proxyStatus === 'REVOKED' && 'Procuration Révoquée'}
                {proxyStatus === 'NONE' && 'Aucune Procuration Enregistrée'}
              </strong>
              {proxyStatus === 'ACTIVE' && m?.profile?.proxyExpiresAt && (
                <p>Expire le {new Date(m.profile.proxyExpiresAt).toLocaleDateString('fr-FR')}</p>
              )}
              {proxyStatus === 'EXPIRED' && (
                <p>Expirée le {new Date(m?.profile?.proxyExpiresAt || '').toLocaleDateString('fr-FR')}</p>
              )}
            </div>
          </div>

          {proxySuccess && (
            <div className={styles.successAlert}>
              <span className="material-symbols-rounded">check_circle</span>
              <span>{proxySuccess}</span>
            </div>
          )}
          {proxyError && (
            <div className={styles.errorAlert}>
              <span className="material-symbols-rounded">error</span>
              <span>{proxyError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProxy} className={styles.profileForm}>
            <div className={styles.sectionHeader}>
              <h2>Mandataire Local (Diaspora)</h2>
              <p>
                Désignez un représentant physique autorisé à agir au nom de ce membre lors des
                séances et à percevoir les reversements.
              </p>
            </div>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Nom du Mandataire</label>
                <input
                  type="text"
                  value={proxyName}
                  onChange={(e) => setProxyName(e.target.value)}
                  placeholder="Nom complet du représentant"
                />
              </div>
              <div className={styles.field}>
                <label>Téléphone du Mandataire</label>
                <input
                  type="tel"
                  value={proxyPhone}
                  onChange={(e) => setProxyPhone(e.target.value)}
                  placeholder="+237 6XX XXX XXX"
                />
              </div>
              <div className={styles.fieldFull}>
                <label>Notes & Autorisations Spécifiques</label>
                <textarea
                  value={proxyNotes}
                  onChange={(e) => setProxyNotes(e.target.value)}
                  rows={3}
                  placeholder="Ex: Autorisé à percevoir la tontine et à voter lors des AG..."
                  className={styles.textarea}
                />
              </div>
              <div className={styles.field}>
                <label>Date d'expiration de la procuration</label>
                <input
                  type="date"
                  value={proxyExpiresAt}
                  onChange={(e) => setProxyExpiresAt(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            <div className={styles.formFooter}>
              <button type="submit" className={styles.saveBtn} disabled={proxySaving}>
                {proxySaving ? 'Enregistrement...' : 'Enregistrer la Procuration'}
              </button>
              {(proxyStatus === 'ACTIVE' || proxyStatus === 'EXPIRED') && (
                <>
                  {!revokeConfirm ? (
                    <button
                      type="button"
                      className={styles.revokeBtn}
                      onClick={() => setRevokeConfirm(true)}
                    >
                      <span className="material-symbols-rounded">block</span>
                      Révoquer la Procuration
                    </button>
                  ) : (
                    <div className={styles.revokeConfirm}>
                      <p>Confirmer la révocation ?</p>
                      <button type="button" className={styles.revokeBtnConfirm} onClick={handleRevokeProxy} disabled={proxySaving}>
                        Oui, Révoquer
                      </button>
                      <button type="button" className={styles.cancelBtn} onClick={() => setRevokeConfirm(false)}>
                        Annuler
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ─── TAB 3 : ATTESTATIONS ─── */}
      {activeTab === 'CERTIFICATES' && (
        <div className={styles.tabContent}>
          <div className={styles.sectionHeader}>
            <div>
              <h2>Attestations de Membre en Règle</h2>
              <p>Générez une attestation officielle avec QR Code de vérification (valable 1 an).</p>
            </div>
            <button
              className={styles.generateCertBtn}
              onClick={handleGenerateCertificate}
              disabled={generatingCert || m?.status !== 'ACTIVE'}
              title={m?.status !== 'ACTIVE' ? 'Seuls les membres actifs peuvent obtenir une attestation' : ''}
            >
              <span className="material-symbols-rounded">
                {generatingCert ? 'hourglass_top' : 'workspace_premium'}
              </span>
              {generatingCert ? 'Génération...' : 'Nouvelle Attestation'}
            </button>
          </div>

          {certError && (
            <div className={styles.errorAlert}>
              <span className="material-symbols-rounded">error</span>
              <span>{certError}</span>
            </div>
          )}

          {certsLoading ? (
            <div className={styles.loading}>Chargement des attestations...</div>
          ) : certificates.length === 0 ? (
            <div className={styles.noCertificates}>
              <span className="material-symbols-rounded">workspace_premium</span>
              <p>Aucune attestation générée pour l'instant.</p>
              <span>Cliquez sur "Nouvelle Attestation" pour en créer une.</span>
            </div>
          ) : (
            <div className={styles.certificatesList}>
              {certificates.map((cert) => {
                const isRevoked = !!cert.revokedAt;
                const isExpired = !isRevoked && cert.expiresAt ? new Date(cert.expiresAt) < new Date() : false;
                return (
                  <div key={cert.id} className={`${styles.certCard} ${isRevoked || isExpired ? styles.certExpired : styles.certValid}`}>
                    <div className={styles.certIcon}>
                      <span className="material-symbols-rounded">{isRevoked ? 'block' : isExpired ? 'schedule' : 'verified'}</span>
                    </div>
                    <div className={styles.certInfo}>
                      <div className={styles.certToken}>#{cert.token.substring(0, 12).toUpperCase()}</div>
                      <div className={styles.certDates}>
                        Émise le {new Date(cert.issuedAt).toLocaleDateString('fr-FR')}
                        {isRevoked ? (
                          <> · Invalidée le {new Date(cert.revokedAt!).toLocaleDateString('fr-FR')}</>
                        ) : cert.expiresAt ? (
                          <> · {isExpired ? "Expirée" : "Valide jusqu'au"} le {new Date(cert.expiresAt).toLocaleDateString('fr-FR')}</>
                        ) : null}
                      </div>
                    </div>
                    <div className={styles.certBadge}>
                      {isRevoked ? (
                        <span className={styles.badgeRevoked}>INVALIDÉE</span>
                      ) : isExpired ? (
                        <span className={styles.badgeExpired}>EXPIRÉE</span>
                      ) : (
                        <span className={styles.badgeValid}>VALIDE</span>
                      )}
                    </div>
                    {!isRevoked && (
                      <button
                        type="button"
                        className={styles.certRevokeBtn}
                        onClick={() => handleRevokeCertificate(cert.id)}
                        title="Invalider l'attestation (Président / SG)"
                      >
                        <span className="material-symbols-rounded">block</span>
                      </button>
                    )}
                    <a
                      href={
                        typeof window !== 'undefined'
                          ? `${window.location.protocol}//${tenantSlug}.${window.location.host.includes('localhost') || window.location.host.includes('lvh.me') ? 'lvh.me:3000' : (process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'asso-in.online')}/verify/certificate/${cert.token}`
                          : `/verify/certificate/${cert.token}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.certVerifyLink}
                    >
                      <span className="material-symbols-rounded">open_in_new</span>
                    </a>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal QR Code */}
          {certModal && (
            <div className={styles.modalOverlay} onClick={() => setCertModal(null)}>
              <div className={styles.certModalCard} onClick={(e) => e.stopPropagation()}>
                <button className={styles.modalClose} onClick={() => setCertModal(null)}>
                  <span className="material-symbols-rounded">close</span>
                </button>
                <div className={styles.modalHeader}>
                  <span className="material-symbols-rounded">workspace_premium</span>
                  <h3>Attestation Générée !</h3>
                </div>
                <div className={styles.qrCodeWrapper}>
                  <canvas ref={qrCanvasRef} className={styles.qrCanvas} />
                </div>
                <div className={styles.certModalInfo}>
                  <p className={styles.certModalToken}>
                    Code : <strong>{certModal.token.substring(0, 16).toUpperCase()}</strong>
                  </p>
                  <p className={styles.certModalDate}>
                    Émise le {new Date(certModal.issuedAt).toLocaleDateString('fr-FR')}
                    {certModal.expiresAt && (
                      <> — Valide jusqu'au {new Date(certModal.expiresAt).toLocaleDateString('fr-FR')}</>
                    )}
                  </p>
                  <div className={styles.certModalLink}>
                    <input
                      type="text"
                      readOnly
                      value={certModal.verificationUrl}
                      className={styles.linkInput}
                    />
                    <button
                      type="button"
                      className={styles.copyBtn}
                      onClick={() => navigator.clipboard.writeText(certModal.verificationUrl)}
                    >
                      <span className="material-symbols-rounded">content_copy</span>
                    </button>
                  </div>
                  <a
                    href={certModal.verificationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.openCertBtn}
                  >
                    <span className="material-symbols-rounded">open_in_new</span>
                    Ouvrir l'Attestation Officielle
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4 : HISTORY ─── */}
      {activeTab === 'HISTORY' && (
        <div className={styles.tabContent}>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryCard}>
              <span className="material-symbols-rounded">payments</span>
              <div>
                <h3>Cotisations / Épargne</h3>
                <p>{(data?.history.financialSummary.totalContributions || 0).toLocaleString('fr-FR')} XAF</p>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <span className="material-symbols-rounded">account_balance_wallet</span>
              <div>
                <h3>Prêts en cours</h3>
                <p>{(data?.history.financialSummary.totalLoans || 0).toLocaleString('fr-FR')} XAF</p>
              </div>
            </div>
            <div className={styles.summaryCard}>
              <span className="material-symbols-rounded">gavel</span>
              <div>
                <h3>Sanctions & Amendes</h3>
                <p>{(data?.history.financialSummary.totalSanctionsFines || 0).toLocaleString('fr-FR')} XAF</p>
              </div>
            </div>
          </div>
          <div className={styles.timelineSection}>
            <h2>Journal d'Interactions & Activités</h2>
            {data?.history.auditLogs.length === 0 ? (
              <div className={styles.noHistory}>
                <span className="material-symbols-rounded">event_note</span>
                <p>Aucun événement ou transaction enregistré pour le moment.</p>
              </div>
            ) : (
              <div className={styles.timeline}>
                {data?.history.auditLogs.map((log) => (
                  <div key={log.id} className={styles.timelineItem}>
                    <div className={styles.timelineDot}></div>
                    <div className={styles.timelineBody}>
                      <span className={styles.logCategory}>{log.category}</span>
                      <h4 className={styles.logAction}>{log.action}</h4>
                      <span className={styles.logDate}>{new Date(log.createdAt).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
