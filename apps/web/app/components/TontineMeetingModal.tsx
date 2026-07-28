'use client';

import React, { useState } from 'react';
import styles from '../[tenant]/tontines/[tontineId]/tontine-details.module.css';
import { useRouter } from 'next/navigation';

interface TontineMeetingModalProps {
  tontineId: string;
  tenantSlug: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TontineMeetingModal({
  tontineId,
  tenantSlug,
  onClose,
  onSuccess,
}: TontineMeetingModalProps) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const router = useRouter();

  const handleStartMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/tontines/${tontineId}/start-meeting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || undefined,
          location: location || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess();
        // Optionnel : Rediriger vers la page des réunions si elle existait, 
        // sinon on reste sur la page courante avec un message de succès
        alert(`La réunion "${data.title}" a été démarrée avec succès !`);
      } else {
        setError(data.message || 'Erreur lors du démarrage de la réunion');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Démarrer une Réunion (Session Tontine)</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        {error && <div className={styles.alertError}>{error}</div>}

        <form onSubmit={handleStartMeeting} className={styles.form}>
          <div className={styles.field}>
            <label>Titre de la réunion (optionnel)</label>
            <input
              type="text"
              placeholder="ex: Session Ordinaire de Mai"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label>Lieu (optionnel)</label>
            <input
              type="text"
              placeholder="ex: Domicile du Président"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting}
            style={{ width: '100%', background: '#ff3366', color: '#fff', border: 'none' }}
          >
            {isSubmitting ? 'Démarrage...' : '🎤 Lancer la Session en Direct'}
          </button>
        </form>
      </div>
    </div>
  );
}
