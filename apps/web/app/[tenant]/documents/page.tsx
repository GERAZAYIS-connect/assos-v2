'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './documents.module.css';

export default function DocumentsPage() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || '';

  const [activeCategory, setActiveCategory] = useState<'ALL' | 'MEETINGS' | 'RECEIPTS' | 'FINANCIAL'>('ALL');
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);

  useEffect(() => {
    if (tenantSlug) {
      initPage();
    }
  }, [tenantSlug]);

  const initPage = async () => {
    setLoading(true);
    try {
      // 1. Fetch Meetings (with PVs)
      const meetRes = await fetch(`/api/backend/associations/${tenantSlug}/meetings`);
      if (meetRes.ok) setMeetings(await meetRes.json());

      // 2. Fetch Budgets
      const budRes = await fetch(`/api/backend/associations/${tenantSlug}/budgets`);
      if (budRes.ok) setBudgets(await budRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPV = (meetingId: string, title: string) => {
    const windowUrl = `/api/backend/associations/${tenantSlug}/meetings/${meetingId}/pv/pdf`;
    window.open(windowUrl, '_blank');
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Gestionnaire de Documents Officiels</h1>
        <p className={styles.subtitle}>
          Consultez et téléchargez les Procès-Verbaux de réunions, reçus de trésorerie, attestations et bilans comptables.
        </p>
      </header>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeCategory === 'ALL' ? styles.activeTab : ''}`}
          onClick={() => setActiveCategory('ALL')}
        >
          Tous les Documents
        </button>
        <button
          className={`${styles.tab} ${activeCategory === 'MEETINGS' ? styles.activeTab : ''}`}
          onClick={() => setActiveCategory('MEETINGS')}
        >
          Procès-Verbaux de Réunions (PV)
        </button>
        <button
          className={`${styles.tab} ${activeCategory === 'FINANCIAL' ? styles.activeTab : ''}`}
          onClick={() => setActiveCategory('FINANCIAL')}
        >
          Bilans Comptables & Budget
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>Chargement des documents...</div>
      ) : (
        <div className={styles.grid}>
          {/* Document Statuts & Règlement Intérieur */}
          {(activeCategory === 'ALL' || activeCategory === 'FINANCIAL') && (
            <div className={styles.docCard}>
              <div className={styles.docHeader}>
                <div className={styles.iconBox}>
                  <span className="material-symbols-rounded">gavel</span>
                </div>
                <div>
                  <h3 className={styles.docTitle}>Statuts & Règlement Intérieur</h3>
                  <p className={styles.docMeta}>Document Officiel • Format PDF</p>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#555', margin: '0 0 1rem 0' }}>
                Texte fondateur et règlement disciplinaire régissant l'association.
              </p>
              <button className={styles.downloadBtn} onClick={() => alert('Document disponible auprès du Bureau.')}>
                <span className="material-symbols-rounded">download</span>
                Télécharger
              </button>
            </div>
          )}

          {/* PV de Réunions */}
          {(activeCategory === 'ALL' || activeCategory === 'MEETINGS') &&
            meetings.map((m: any) => (
              <div key={m.id} className={styles.docCard}>
                <div className={styles.docHeader}>
                  <div className={styles.iconBox}>
                    <span className="material-symbols-rounded">description</span>
                  </div>
                  <div>
                    <h3 className={styles.docTitle}>PV - {m.title}</h3>
                    <p className={styles.docMeta}>
                      Du {new Date(m.date).toLocaleDateString('fr-FR')} • Meeting #{m.meetingNumber || m.id.slice(-4)}
                    </p>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#555', margin: '0 0 1rem 0' }}>
                  Procès-Verbal officiel de séance, ordre du jour et émargement des présences.
                </p>
                <button
                  className={styles.downloadBtn}
                  onClick={() => handleDownloadPV(m.id, m.title)}
                >
                  <span className="material-symbols-rounded">picture_as_pdf</span>
                  Télécharger le PV (PDF)
                </button>
              </div>
            ))}

          {/* Bilans Comptables Annuels */}
          {(activeCategory === 'ALL' || activeCategory === 'FINANCIAL') &&
            budgets.map((b: any) => (
              <div key={b.id} className={styles.docCard}>
                <div className={styles.docHeader}>
                  <div className={styles.iconBox}>
                    <span className="material-symbols-rounded">analytics</span>
                  </div>
                  <div>
                    <h3 className={styles.docTitle}>{b.title || `Bilan ${b.year}`}</h3>
                    <p className={styles.docMeta}>Rapport Comptable • Exercice {b.year}</p>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#555', margin: '0 0 1rem 0' }}>
                  Bilan prévisionnel et rapport financier d'exécution consolidé.
                </p>
                <Link
                  href={`/${tenantSlug}/budget`}
                  className={styles.downloadBtn}
                >
                  <span className="material-symbols-rounded">visibility</span>
                  Consulter le Bilan
                </Link>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
