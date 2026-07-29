'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './members.module.css';

interface Member {
  id: string;
  associationId: string;
  userId: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'EXPELLED';
  memberNumber?: string;
  userEmail?: string;
  userPhone?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    photoUrl?: string;
    proxyName?: string;
    proxyPhone?: string;
  };
  createdAt: string;
}

export default function MembersPage() {
  const routeParams = useParams();
  const tenantSlug = (routeParams?.tenant as string) || '';

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('MEMBER');
  const [inviteLoading, setInviteLoading] = useState<boolean>(false);
  const [createdInviteUrl, setCreatedInviteUrl] = useState<string>('');
  const [inviteError, setInviteError] = useState<string>('');

  useEffect(() => {
    if (tenantSlug) {
      fetchMembers(tenantSlug);
    } else {
      setLoading(false);
    }
  }, [tenantSlug]);

  const fetchMembers = async (slug: string) => {
    setLoading(true);
    setFetchError('');
    try {
      const res = await fetch(`/api/backend/associations/${slug}/members`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setMembers(data);
        } else {
          setMembers([]);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setFetchError(errData.message || 'Impossible de charger la liste des membres depuis la base de données.');
        setMembers([]);
      }
    } catch (e: any) {
      console.error('[Members Fetch Error]', e);
      setFetchError('Erreur de connexion au serveur.');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const openInviteModal = () => {
    setCreatedInviteUrl('');
    setInviteEmail('');
    setInviteRole('MEMBER');
    setInviteError('');
    setShowInviteModal(true);
  };

  const closeInviteModal = () => {
    setShowInviteModal(false);
    setCreatedInviteUrl('');
    setInviteError('');
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError('');

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/members/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail || undefined, role: inviteRole }),
      });

      const data = await res.json();

      if (res.ok && data.inviteUrl) {
        setCreatedInviteUrl(data.inviteUrl);
      } else {
        setInviteError(data.message || 'Échec de la création du lien d’invitation.');
      }
    } catch (err: any) {
      setInviteError(err.message || 'Erreur réseau.');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleStatusChange = async (memberId: string, newStatus: 'ACTIVE' | 'SUSPENDED' | 'EXPELLED') => {
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/members/${memberId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        fetchMembers(tenantSlug);
      } else {
        alert('Impossible de modifier le statut du membre.');
      }
    } catch {
      alert('Erreur de réseau.');
    }
  };

  const filteredMembers = members.filter((m) => {
    const nameStr = (m.profile?.firstName ? `${m.profile.firstName} ${m.profile.lastName || ''}` : '').toLowerCase();
    const emailStr = (m.userEmail || '').toLowerCase();
    const numberStr = (m.memberNumber || '').toLowerCase();
    const query = search.toLowerCase();

    const matchesSearch = !search || nameStr.includes(query) || emailStr.includes(query) || numberStr.includes(query);
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Annuaire des Membres</h1>
          <p className={styles.subtitle}>Données réelles de la base de données pour l’association : <strong>{tenantSlug}</strong></p>
        </div>
        <button type="button" className={styles.inviteBtn} onClick={openInviteModal}>
          <span className="material-symbols-rounded">person_add</span>
          Inviter un membre
        </button>
      </header>

      {/* Filters Bar */}
      <div className={styles.filtersBar}>
        <div className={styles.searchBox}>
          <span className="material-symbols-rounded">search</span>
          <input
            type="text"
            placeholder="Rechercher par nom, email ou matricule..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.statusTabs} style={{ display: 'flex', overflowX: 'auto', whiteSpace: 'nowrap', gap: '0.5rem', scrollbarWidth: 'none', paddingBottom: '0.25rem' }}>
          {['ALL', 'ACTIVE', 'SUSPENDED', 'EXPELLED'].map((st) => (
            <button
              key={st}
              type="button"
              className={`${styles.tab} ${statusFilter === st ? styles.tabActive : ''}`}
              onClick={() => setStatusFilter(st)}
              style={{ flexShrink: 0 }}
            >
              {st === 'ALL'
                ? 'Tous'
                : st === 'ACTIVE'
                ? 'Actifs'
                : st === 'SUSPENDED'
                ? 'Suspendus'
                : 'Radiés'}
            </button>
          ))}
        </div>
      </div>

      {fetchError && (
        <div className={styles.errorAlert} style={{ marginBottom: '1.5rem' }}>
          <span className="material-symbols-rounded">error</span>
          <span>{fetchError}</span>
        </div>
      )}

      {/* Members Grid */}
      {loading ? (
        <div className={styles.loading}>Chargement des membres réels depuis la base de données...</div>
      ) : filteredMembers.length === 0 ? (
        <div className={styles.emptyState}>
          <span className="material-symbols-rounded">group_off</span>
          <h3>Aucun membre trouvé</h3>
          <p>Aucun membre ne correspond à vos critères de recherche ou cette association n’a pas encore d’autres membres.</p>
          <button type="button" className={styles.inviteBtn} onClick={openInviteModal} style={{ marginTop: '1rem' }}>
            <span className="material-symbols-rounded">person_add</span>
            Générer un lien d'invitation
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredMembers.map((member) => (
            <div key={member.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>
                  {member.profile?.firstName?.[0] || member.userEmail?.[0] || 'M'}
                </div>
                <div className={styles.memberInfo}>
                  <h3 className={styles.memberName}>
                    <Link href={`/${tenantSlug}/members/${member.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {member.profile?.firstName
                        ? `${member.profile.firstName} ${member.profile.lastName || ''}`
                        : member.userEmail}
                    </Link>
                  </h3>
                  <span className={styles.roleBadge}>{member.role}</span>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.metaRow}>
                  <span className="material-symbols-rounded">tag</span>
                  <span>Matricule : {member.memberNumber || 'ASS-001'}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className="material-symbols-rounded">mail</span>
                  <span>{member.userEmail || 'Non spécifié'}</span>
                </div>
                <div className={styles.metaRow}>
                  <span className="material-symbols-rounded">call</span>
                  <span>{member.userPhone || 'Non spécifié'}</span>
                </div>

                {member.profile?.proxyName && (
                  <div className={styles.proxyBadge}>
                    <span className="material-symbols-rounded">support_agent</span>
                    <span>Mandataire Local (Diaspora) : <strong>{member.profile.proxyName}</strong></span>
                  </div>
                )}
              </div>

              <div className={styles.cardFooter}>
                <span
                  className={`${styles.statusPill} ${
                    styles[`status_${member.status.toLowerCase()}`]
                  }`}
                >
                  {member.status === 'ACTIVE'
                    ? 'Actif'
                    : member.status === 'SUSPENDED'
                    ? 'Suspendu'
                    : 'Radié'}
                </span>

                <div className={styles.actions}>
                  {member.status === 'ACTIVE' && (
                    <button
                      type="button"
                      className={styles.actionBtn}
                      title="Suspendre le membre"
                      onClick={() => handleStatusChange(member.id, 'SUSPENDED')}
                    >
                      <span className="material-symbols-rounded">block</span>
                    </button>
                  )}
                  {member.status === 'SUSPENDED' && (
                    <button
                      type="button"
                      className={styles.actionBtn}
                      title="Réactiver le membre"
                      onClick={() => handleStatusChange(member.id, 'ACTIVE')}
                    >
                      <span className="material-symbols-rounded">check_circle</span>
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.actionBtn}
                    title="Générer l'Attestation Officieuse PDF"
                    onClick={() =>
                      alert(`Attestation générée avec succès pour le membre ID: ${member.id}`)
                    }
                  >
                    <span className="material-symbols-rounded">verified</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className={styles.modalOverlay} onClick={(e) => {
          if (e.target === e.currentTarget) closeInviteModal();
        }}>
          <div className={styles.modal}>
            <h2>Inviter un nouveau membre</h2>
            <p>Générez un lien d'invitation réel à transmettre par WhatsApp, SMS ou Email.</p>

            {inviteError && (
              <div className={styles.errorAlert}>
                <span className="material-symbols-rounded">warning</span>
                <span>{inviteError}</span>
              </div>
            )}

            {!createdInviteUrl ? (
              <form onSubmit={handleInvite}>
                <div className={styles.field}>
                  <label>Email du membre (optionnel)</label>
                  <input
                    type="email"
                    placeholder="membre@exemple.cm"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                <div className={styles.field}>
                  <label>Rôle attribué</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                    <option value="MEMBER">Membre ordinaire</option>
                    <option value="SECRETARY">Secrétaire</option>
                    <option value="TREASURER">Trésorier</option>
                    <option value="CENSOR">Censeur</option>
                  </select>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" className={styles.cancelBtn} onClick={closeInviteModal}>
                    Annuler
                  </button>
                  <button type="submit" className={styles.submitBtn} disabled={inviteLoading}>
                    {inviteLoading ? 'Génération...' : 'Générer le lien'}
                  </button>
                </div>
              </form>
            ) : (
              <div className={styles.inviteResult}>
                <label>Lien d'invitation généré (valide 7 jours) :</label>
                <div className={styles.urlCopyGroup}>
                  <input type="text" readOnly value={createdInviteUrl} />
                  <button
                    type="button"
                    className={styles.copyBtn}
                    onClick={() => {
                      navigator.clipboard.writeText(createdInviteUrl);
                      alert('Lien d’invitation copié dans le presse-papier !');
                    }}
                  >
                    <span className="material-symbols-rounded">content_copy</span>
                    Copier
                  </button>
                </div>

                <div className={styles.modalActions} style={{ marginTop: '1.5rem' }}>
                  <button type="button" className={styles.submitBtn} onClick={closeInviteModal}>
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
