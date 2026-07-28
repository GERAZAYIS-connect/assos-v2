'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './meetings.module.css';

interface Meeting {
  id: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  location?: string;
  scheduledAt: string;
  agenda?: string;
  minutes?: string;
  autoSanctionAbsence: boolean;
  absenceFineAmount: number;
  attendances?: any[];
}

const TYPE_LABELS: Record<string, string> = {
  ORDINARY: 'Réunion Ordinaire',
  EXTRAORDINARY: 'Assemblée Extraordinaire',
  BUREAU: 'Réunion du Bureau',
  TONTINE_SESSION: 'Séance de Tontine',
};

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: 'Programmée',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée (PV disponible)',
  CANCELLED: 'Annulée',
};

export default function MeetingsPage() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || '';

  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'UPCOMING' | 'HISTORY'>('UPCOMING');

  // RBAC State
  const [userRole, setUserRole] = useState<string>('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('ORDINARY');
  const [location, setLocation] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [agenda, setAgenda] = useState('');
  const [autoSanctionAbsence, setAutoSanctionAbsence] = useState(false);
  const [absenceFineAmount, setAbsenceFineAmount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  useEffect(() => {
    if (tenantSlug) {
      initPage();
    }
  }, [tenantSlug]);

  const initPage = async () => {
    setLoading(true);
    try {
      // Fetch User Role
      const mineRes = await fetch('/api/backend/associations/mine');
      if (mineRes.ok) {
        const myAssocs = await mineRes.json();
        const current = myAssocs.find((a: any) => a.slug === tenantSlug);
        if (current) setUserRole(current.role);
      }

      // Fetch Meetings
      const res = await fetch(`/api/backend/associations/${tenantSlug}/meetings`);
      if (res.ok) setMeetings(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isBureau = userRole === 'PRESIDENT' || userRole === 'TREASURER' || userRole === 'SECRETARY';

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !scheduledAt) return;
    setIsSubmitting(true);
    setModalError('');

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          type,
          location,
          scheduledAt,
          agenda,
          autoSanctionAbsence,
          absenceFineAmount: Number(absenceFineAmount) || 0,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setTitle('');
        setDescription('');
        setLocation('');
        setScheduledAt('');
        setAgenda('');
        setAutoSanctionAbsence(false);
        setAbsenceFineAmount('');
        initPage();
      } else {
        const data = await res.json().catch(() => ({}));
        setModalError(data.message || 'Erreur lors de la création de la réunion.');
      }
    } catch (err) {
      setModalError('Erreur de connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const upcomingMeetings = meetings.filter((m) => m.status === 'SCHEDULED' || m.status === 'IN_PROGRESS');
  const pastMeetings = meetings.filter((m) => m.status === 'COMPLETED' || m.status === 'CANCELLED');
  const displayedMeetings = activeTab === 'UPCOMING' ? upcomingMeetings : pastMeetings;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Réunions & Procès-Verbaux (PV)</h1>
          <p className={styles.subtitle}>
            Convoquez les membres, effectuez l'appel de présence et rédigez les procès-verbaux officiels.
          </p>
        </div>
        {isBureau && (
          <button className={styles.createBtn} onClick={() => setShowModal(true)}>
            <span className="material-symbols-rounded">add</span>
            Programmer une Réunion
          </button>
        )}
      </header>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <h3>Prochaine Réunion</h3>
            <p className={styles.statValue}>
              {upcomingMeetings.length > 0
                ? new Date(upcomingMeetings[0].scheduledAt).toLocaleDateString('fr-FR')
                : 'Aucune'}
            </p>
          </div>
          <span className="material-symbols-rounded" style={{ fontSize: '2.5rem', opacity: 0.3 }}>
            event
          </span>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statInfo}>
            <h3>Procès-Verbaux Archivés</h3>
            <p className={styles.statValue}>{pastMeetings.filter((m) => m.minutes).length}</p>
          </div>
          <span className="material-symbols-rounded" style={{ fontSize: '2.5rem', opacity: 0.3 }}>
            description
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'UPCOMING' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('UPCOMING')}
        >
          Prochaines Réunions ({upcomingMeetings.length})
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'HISTORY' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('HISTORY')}
        >
          Historique & Procès-Verbaux ({pastMeetings.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Chargement des réunions...</div>
      ) : displayedMeetings.length === 0 ? (
        <div className={styles.emptyState}>
          <span className="material-symbols-rounded">event_busy</span>
          <h3>Aucune réunion trouvée</h3>
          <p>
            {activeTab === 'UPCOMING'
              ? 'Aucune réunion n\'est actuellement programmée.'
              : 'Aucun procès-verbal archivé.'}
          </p>
        </div>
      ) : (
        <div className={styles.grid}>
          {displayedMeetings.map((m) => {
            return (
              <Link key={m.id} href={`/${tenantSlug}/meetings/${m.id}`} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.meetingTitle}>{m.title}</h3>
                  <span className={styles.typeBadge}>{TYPE_LABELS[m.type] || m.type}</span>
                </div>
                <div className={styles.cardBody}>
                  <div className={styles.dateRow}>
                    <span className="material-symbols-rounded">calendar_today</span>
                    <span>{new Date(m.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  {m.location && (
                    <p className={styles.detail}>
                      <strong>Lieu / Lien :</strong> {m.location}
                    </p>
                  )}
                  {m.autoSanctionAbsence && (
                    <p className={styles.detail}>
                      <strong>Amende absence :</strong> {m.absenceFineAmount.toLocaleString('fr-FR')} XAF
                    </p>
                  )}
                  <p className={styles.detail}>
                    <strong>Statut :</strong> {STATUS_LABELS[m.status] || m.status}
                  </p>
                </div>
                <div className={styles.cardFooter}>
                  <span>{m.status === 'COMPLETED' ? 'Consulter le PV' : 'Fiche Réunion & Appel'}</span>
                  <span className="material-symbols-rounded">arrow_forward</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Modal - Create Meeting */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Convoquer une Réunion</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                &times;
              </button>
            </div>

            {modalError && <div className={styles.alertError}>{modalError}</div>}

            <form onSubmit={handleCreateSubmit} className={styles.form}>
              <div className={styles.field}>
                <label>Titre de la réunion</label>
                <input
                  type="text"
                  required
                  placeholder="ex: Séance Ordinaire du Mois de Février"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label>Type de réunion</label>
                <select value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="ORDINARY">Réunion Ordinaire</option>
                  <option value="EXTRAORDINARY">Assemblée Extraordinaire</option>
                  <option value="BUREAU">Réunion du Bureau Executif</option>
                  <option value="TONTINE_SESSION">Séance de Tontine</option>
                </select>
              </div>

              <div className={styles.field}>
                <label>Date et Heure prévues</label>
                <input
                  type="datetime-local"
                  required
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label>Lieu ou Lien visio (Optionnel)</label>
                <input
                  type="text"
                  placeholder="ex: Foyer Communautaire ou Google Meet"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className={styles.field}>
                <label>Ordre du Jour (Agenda)</label>
                <textarea
                  rows={3}
                  placeholder="1. Mots d'ouverture&#10;2. État de la trésorerie&#10;3. Cotisations & Tontines"
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                />
              </div>

              <div className={styles.fieldRow}>
                <input
                  type="checkbox"
                  id="autoSanctionAbsence"
                  checked={autoSanctionAbsence}
                  onChange={(e) => setAutoSanctionAbsence(e.target.checked)}
                />
                <label htmlFor="autoSanctionAbsence">Appliquer une amende automatique en cas d'absence non excusée</label>
              </div>

              {autoSanctionAbsence && (
                <div className={styles.field}>
                  <label>Montant forfaitaire de l'amende d'absence (XAF)</label>
                  <input
                    type="number"
                    min="1"
                    required={autoSanctionAbsence}
                    placeholder="ex: 1000"
                    value={absenceFineAmount}
                    onChange={(e) => setAbsenceFineAmount(Number(e.target.value) || '')}
                  />
                </div>
              )}

              <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? 'Convocation en cours...' : 'Programmer et publier la convocation'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
