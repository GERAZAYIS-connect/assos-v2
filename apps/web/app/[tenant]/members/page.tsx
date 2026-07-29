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

  // View and Pagination states
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 10;

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState<boolean>(false);
  const [inviteMode, setInviteMode] = useState<'link' | 'manual'>('link');
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<string>('MEMBER');
  
  // Manual Add states
  const [manualFirstName, setManualFirstName] = useState<string>('');
  const [manualLastName, setManualLastName] = useState<string>('');
  const [manualPhone, setManualPhone] = useState<string>('');
  const [manualResult, setManualResult] = useState<{ emailOrPhone: string; password?: string } | null>(null);

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
    setInviteEmail('');
    setCreatedInviteUrl('');
    setInviteError('');
    setManualFirstName('');
    setManualLastName('');
    setManualPhone('');
    setManualResult(null);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteMode === 'link') {
      setInviteError('');
      setInviteLoading(true);

      try {
        const res = await fetch(`/api/backend/associations/${tenantSlug}/members/invite`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        });

        if (res.ok) {
          const data = await res.json();
          setCreatedInviteUrl(data.inviteUrl);
        } else {
          const err = await res.json().catch(() => ({}));
          setInviteError(err.message || "Erreur lors de la création de l'invitation.");
        }
      } catch (err) {
        setInviteError("Impossible de joindre le serveur.");
      } finally {
        setInviteLoading(false);
      }
    } else {
      // Manual Add
      if (!manualFirstName || !manualLastName || (!inviteEmail && !manualPhone)) {
        setInviteError('Le nom, prénom et (email ou téléphone) sont requis.');
        return;
      }
      setInviteError('');
      setInviteLoading(true);

      try {
        const res = await fetch(`/api/backend/associations/${tenantSlug}/members/manual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firstName: manualFirstName,
            lastName: manualLastName,
            email: inviteEmail,
            phone: manualPhone,
            role: inviteRole
          }),
        });

        if (res.ok) {
          const data = await res.json();
          setManualResult({
            emailOrPhone: inviteEmail || manualPhone,
            password: data.defaultPassword
          });
          fetchMembers(tenantSlug); // Refresh list
        } else {
          const err = await res.json().catch(() => ({}));
          setInviteError(err.message || "Erreur lors de l'ajout manuel.");
        }
      } catch (err) {
        setInviteError("Impossible de joindre le serveur.");
      } finally {
        setInviteLoading(false);
      }
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

  const handleGenerateCertificate = async (memberId: string) => {
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/members/${memberId}/certificate`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        // Redirect or open the print view
        if (data.token) {
          window.open(`/verify/certificate/${data.token}`, '_blank');
        } else {
          alert('Attestation générée avec succès mais aucun lien fourni.');
        }
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || "Erreur lors de la génération de l'attestation");
      }
    } catch {
      alert("Erreur de réseau lors de la génération.");
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

  const totalPages = Math.ceil(filteredMembers.length / ITEMS_PER_PAGE);
  const paginatedMembers = filteredMembers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, viewMode]);

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
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button 
            type="button" 
            onClick={() => setViewMode('grid')} 
            style={{ 
              background: viewMode === 'grid' ? '#000' : 'transparent', 
              color: viewMode === 'grid' ? '#fff' : '#666',
              border: '1px solid #ccc',
              padding: '0.4rem',
              borderRadius: '0.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Vue en grille"
          >
            <span className="material-symbols-rounded" style={{ fontSize: '1.2rem' }}>grid_view</span>
          </button>
          <button 
            type="button" 
            onClick={() => setViewMode('table')} 
            style={{ 
              background: viewMode === 'table' ? '#000' : 'transparent', 
              color: viewMode === 'table' ? '#fff' : '#666',
              border: '1px solid #ccc',
              padding: '0.4rem',
              borderRadius: '0.4rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Vue en tableau"
          >
            <span className="material-symbols-rounded" style={{ fontSize: '1.2rem' }}>table_rows</span>
          </button>
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
        <>
          {viewMode === 'grid' ? (
            <div className={styles.grid}>
              {paginatedMembers.map((member) => (
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
                        title="Radier le membre (Exclusion définitive)"
                        onClick={() => {
                          if (confirm('Êtes-vous sûr de vouloir radier définitivement ce membre ?')) {
                            handleStatusChange(member.id, 'EXPELLED');
                          }
                        }}
                      >
                        <span className="material-symbols-rounded">person_remove</span>
                      </button>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        title="Générer l'Attestation Officieuse PDF"
                        onClick={() => handleGenerateCertificate(member.id)}
                      >
                        <span className="material-symbols-rounded">verified</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch', background: '#fff', border: '1px solid #e0e0e0', borderRadius: '0.75rem', marginBottom: '1.5rem' }}>
              <table className={styles.table} style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#fafafa', borderBottom: '1px solid #e0e0e0' }}>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', color: '#444' }}>Membre</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', color: '#444' }}>Contact</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', color: '#444' }}>Statut</th>
                    <th style={{ padding: '1rem', fontSize: '0.8rem', textTransform: 'uppercase', color: '#444' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMembers.map((member) => (
                    <tr key={member.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div className={styles.avatar} style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
                            {member.profile?.firstName?.[0] || member.userEmail?.[0] || 'M'}
                          </div>
                          <div>
                            <Link href={`/${tenantSlug}/members/${member.id}`} style={{ textDecoration: 'none', color: '#000', fontWeight: 600 }}>
                              {member.profile?.firstName ? `${member.profile.firstName} ${member.profile.lastName || ''}` : member.userEmail}
                            </Link>
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>{member.role} • {member.memberNumber || 'ASS-001'}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.85rem' }}>
                        <div>{member.userEmail || '-'}</div>
                        <div style={{ color: '#666' }}>{member.userPhone || '-'}</div>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span
                          className={`${styles.statusPill} ${
                            styles[`status_${member.status.toLowerCase()}`]
                          }`}
                        >
                          {member.status === 'ACTIVE' ? 'Actif' : member.status === 'SUSPENDED' ? 'Suspendu' : 'Radié'}
                        </span>
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <div style={{ display: 'flex', gap: '0.25rem' }}>
                          {member.status === 'ACTIVE' && (
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#666', padding: '0.25rem' }}
                              title="Suspendre"
                              onClick={() => handleStatusChange(member.id, 'SUSPENDED')}
                            >
                              <span className="material-symbols-rounded">block</span>
                            </button>
                          )}
                          {member.status === 'SUSPENDED' && (
                            <button
                              type="button"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#15803d', padding: '0.25rem' }}
                              title="Réactiver"
                              onClick={() => handleStatusChange(member.id, 'ACTIVE')}
                            >
                              <span className="material-symbols-rounded">check_circle</span>
                            </button>
                          )}
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991b1b', padding: '0.25rem' }}
                            title="Radier (Exclusion définitive)"
                            onClick={() => {
                              if (confirm('Êtes-vous sûr de vouloir radier définitivement ce membre ?')) {
                                handleStatusChange(member.id, 'EXPELLED');
                              }
                            }}
                          >
                            <span className="material-symbols-rounded">person_remove</span>
                          </button>
                          <button
                            type="button"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#000', padding: '0.25rem' }}
                            title="Générer Attestation"
                            onClick={() => handleGenerateCertificate(member.id)}
                          >
                            <span className="material-symbols-rounded">verified</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1rem' }}>
              <button 
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                Précédent
              </button>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Page {currentPage} sur {totalPages}</span>
              <button 
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                style={{ background: '#fff', border: '1px solid #ccc', borderRadius: '0.5rem', padding: '0.5rem 1rem', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}

      {/* Invite / Add Modal */}
      {showInviteModal && (
        <div className={styles.modalOverlay} onClick={(e) => {
          if (e.target === e.currentTarget) closeInviteModal();
        }}>
          <div className={styles.modal}>
            <h2>{inviteMode === 'link' ? 'Inviter un membre' : 'Ajouter manuellement'}</h2>
            <p style={{ marginBottom: '1rem', color: '#666', fontSize: '0.9rem' }}>
              {inviteMode === 'link' 
                ? "Générez un lien d'invitation à transmettre." 
                : "Créez le compte pour le membre et transmettez-lui ses accès."}
            </p>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              <button
                type="button"
                onClick={() => setInviteMode('link')}
                style={{
                  flex: 1, padding: '0.5rem', border: '1px solid #ccc',
                  background: inviteMode === 'link' ? '#000' : '#f9f9f9',
                  color: inviteMode === 'link' ? '#fff' : '#333',
                  borderRadius: '0.4rem', cursor: 'pointer', fontWeight: 600
                }}
              >
                Par Lien
              </button>
              <button
                type="button"
                onClick={() => setInviteMode('manual')}
                style={{
                  flex: 1, padding: '0.5rem', border: '1px solid #ccc',
                  background: inviteMode === 'manual' ? '#000' : '#f9f9f9',
                  color: inviteMode === 'manual' ? '#fff' : '#333',
                  borderRadius: '0.4rem', cursor: 'pointer', fontWeight: 600
                }}
              >
                Manuellement
              </button>
            </div>

            {inviteError && (
              <div className={styles.errorAlert}>
                <span className="material-symbols-rounded">warning</span>
                <span>{inviteError}</span>
              </div>
            )}

            {!createdInviteUrl && !manualResult ? (
              <form onSubmit={handleInvite}>
                {inviteMode === 'manual' && (
                  <>
                    <div className={styles.field}>
                      <label>Prénom *</label>
                      <input
                        type="text"
                        required
                        placeholder="Prénom"
                        value={manualFirstName}
                        onChange={(e) => setManualFirstName(e.target.value)}
                      />
                    </div>
                    <div className={styles.field}>
                      <label>Nom *</label>
                      <input
                        type="text"
                        required
                        placeholder="Nom de famille"
                        value={manualLastName}
                        onChange={(e) => setManualLastName(e.target.value)}
                      />
                    </div>
                  </>
                )}

                <div className={styles.field}>
                  <label>{inviteMode === 'link' ? 'Email (optionnel)' : 'Email'}</label>
                  <input
                    type="email"
                    placeholder="membre@exemple.cm"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                </div>

                {inviteMode === 'manual' && (
                  <div className={styles.field}>
                    <label>Téléphone (si pas d'email)</label>
                    <input
                      type="text"
                      placeholder="+237..."
                      value={manualPhone}
                      onChange={(e) => setManualPhone(e.target.value)}
                    />
                  </div>
                )}

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
                    {inviteLoading ? 'Génération...' : (inviteMode === 'link' ? 'Générer le lien' : 'Créer le membre')}
                  </button>
                </div>
              </form>
            ) : createdInviteUrl ? (
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
            ) : (
              <div className={styles.inviteResult}>
                <div style={{ padding: '1rem', background: '#ecfdf5', border: '1px solid #10b981', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                  <h3 style={{ color: '#047857', marginTop: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="material-symbols-rounded">check_circle</span>
                    Membre ajouté avec succès !
                  </h3>
                  <p style={{ margin: '0.5rem 0', color: '#065f46' }}>Transmettez ces accès au membre :</p>
                  <div style={{ background: '#fff', padding: '0.75rem', borderRadius: '0.25rem', border: '1px solid #a7f3d0', fontFamily: 'monospace', fontSize: '0.95rem' }}>
                    <strong>Identifiant :</strong> {manualResult?.emailOrPhone}<br/>
                    {manualResult?.password ? (
                      <><strong>Mot de passe :</strong> {manualResult.password}</>
                    ) : (
                      <span style={{ color: '#666' }}>Le compte existait déjà, le membre peut utiliser son mot de passe actuel.</span>
                    )}
                  </div>
                </div>

                <div className={styles.modalActions} style={{ marginTop: '1.5rem' }}>
                  <button type="button" className={styles.submitBtn} onClick={closeInviteModal}>
                    Terminer
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
