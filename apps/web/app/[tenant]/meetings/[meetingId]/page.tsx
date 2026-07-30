'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './meeting-details.module.css';

export default function MeetingDetailPage() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || '';
  const meetingId = (params?.meetingId as string) || '';

  const [meeting, setMeeting] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // RBAC State
  const [userRole, setUserRole] = useState<string>('');

  // Attendance state
  const [attendances, setAttendances] = useState<Record<string, string>>({});
  const [savingAttendance, setSavingAttendance] = useState(false);
  const [attendanceMsg, setAttendanceMsg] = useState('');

  // Minutes state
  const [minutesText, setMinutesText] = useState('');
  const [isEditingMinutes, setIsEditingMinutes] = useState(false);
  const [savingMinutes, setSavingMinutes] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const pvRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tenantSlug && meetingId) {
      fetchMeeting();
      fetchUserRole();
    }
  }, [tenantSlug, meetingId]);

  const fetchUserRole = async () => {
    try {
      const res = await fetch('/api/backend/associations/mine');
      if (res.ok) {
        const myAssocs = await res.json();
        const current = myAssocs.find((a: any) => a.slug === tenantSlug);
        if (current) setUserRole(current.role);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isBureau = userRole === 'PRESIDENT' || userRole === 'TREASURER' || userRole === 'SECRETARY';

  const fetchMeeting = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/meetings/${meetingId}`);
      if (res.ok) {
        const data = await res.json();
        setMeeting(data);
        setMinutesText(data.minutes || '');

        // Map attendance statuses
        const map: Record<string, string> = {};
        data.attendances?.forEach((att: any) => {
          map[att.memberId] = att.status;
        });
        setAttendances(map);
      } else {
        setError('Réunion introuvable.');
      }
    } catch (e) {
      setError('Erreur de connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (memberId: string, status: string) => {
    setAttendances((prev) => ({
      ...prev,
      [memberId]: status,
    }));
  };

  const handleSaveAttendance = async () => {
    setSavingAttendance(true);
    setAttendanceMsg('');

    // Ensure all members from meeting attendances are included
    const payload = (meeting?.attendances || []).map((att: any) => ({
      memberId: att.memberId,
      status: attendances[att.memberId] || att.status || 'ABSENT',
    }));

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/meetings/${meetingId}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendances: payload }),
      });

      if (res.ok) {
        setAttendanceMsg('Feuille de présence enregistrée avec succès !');
        fetchMeeting();
      } else {
        const data = await res.json().catch(() => ({}));
        setAttendanceMsg(data.message || 'Erreur lors de l\'enregistrement.');
      }
    } catch (err) {
      setAttendanceMsg('Erreur de connexion.');
    } finally {
      setSavingAttendance(false);
    }
  };

  const handleSaveMinutes = async () => {
    if (!minutesText.trim()) return;
    setSavingMinutes(true);

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/meetings/${meetingId}/minutes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutes: minutesText }),
      });

      if (res.ok) {
        setIsEditingMinutes(false);
        fetchMeeting();
      } else {
        alert('Erreur lors de la sauvegarde du PV.');
      }
    } catch (err) {
      alert('Erreur de connexion.');
    } finally {
      setSavingMinutes(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!pvRef.current || !meeting) return;
    setDownloadingPdf(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(pvRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const yOffset = Math.max(10, (pageHeight - imgHeight) / 2);

      pdf.addImage(imgData, 'PNG', 10, yOffset, imgWidth, Math.min(imgHeight, pageHeight - 20));

      const filename = `PV-Reunion-${meeting.title.replace(/\s+/g, '_')}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('Erreur lors de la génération du PDF.');
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) return <div className={styles.container}>Chargement de la réunion...</div>;
  if (error || !meeting) return <div className={styles.container}>{error || 'Réunion introuvable.'}</div>;

  const presentCount = meeting.attendances?.filter((a: any) => a.status === 'PRESENT' || a.status === 'LATE').length || 0;
  const totalMembers = meeting.attendances?.length || 0;

  return (
    <div className={styles.container}>
      <Link href={`/${tenantSlug}/meetings`} className={styles.backBtn}>
        &larr; Retour aux réunions
      </Link>

      <div className={styles.headerCard}>
        <div>
          <h1 className={styles.title}>{meeting.title}</h1>
          <p className={styles.subtitle}>
            📅 {new Date(meeting.scheduledAt).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            {meeting.location ? ` | Lieu : ${meeting.location}` : ''}
          </p>
          {meeting.autoSanctionAbsence && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: '#ffffff', fontWeight: 500 }}>
              ⚠️ Amende automatique d'absence non excusée : <strong>{(meeting.absenceFineAmount || 0).toLocaleString('fr-FR')} XAF</strong>
            </div>
          )}
        </div>

        <div className={styles.statBadge}>
          <h4>Présence</h4>
          <p>{presentCount} / {totalMembers}</p>
        </div>
      </div>

      {/* Ordre du jour */}
      {meeting.agenda && (
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📋 Ordre du Jour</h2>
          <div className={styles.agendaText}>{meeting.agenda}</div>
        </div>
      )}

      {/* Feuille de présence */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span>👥 Feuille de Présence (Appel)</span>
          {isBureau && (
            <button className={styles.actionBtn} onClick={handleSaveAttendance} disabled={savingAttendance}>
              {savingAttendance ? 'Enregistrement...' : 'Enregistrer l\'appel'}
            </button>
          )}
        </div>

        {attendanceMsg && <div style={{ marginBottom: '1rem', fontWeight: 600, color: '#000' }}>{attendanceMsg}</div>}

        <table className={styles.attendanceTable}>
          <thead>
            <tr>
              <th>Membre</th>
              <th>Statut de présence</th>
              <th>Heure d'arrivée</th>
            </tr>
          </thead>
          <tbody>
            {meeting.attendances?.map((att: any) => {
              const mName = att.member?.profile?.firstName
                ? `${att.member.profile.firstName} ${att.member.profile.lastName || ''}`
                : att.member?.user?.email || 'Membre';

              const currentStatus = attendances[att.memberId] || att.status;

              return (
                <tr key={att.id}>
                  <td><strong>{mName}</strong></td>
                  <td>
                    {isBureau ? (
                      <select
                        className={`${styles.statusSelect} ${styles[`status${currentStatus}`]}`}
                        value={currentStatus}
                        onChange={(e) => handleAttendanceChange(att.memberId, e.target.value)}
                      >
                        <option value="PRESENT">PRÉSENT</option>
                        <option value="ABSENT">ABSENT</option>
                        <option value="EXCUSED">EXCUSÉ</option>
                        <option value="LATE">RETARD</option>
                      </select>
                    ) : (
                      <span className={`${styles.statusSelect} ${styles[`status${currentStatus}`]}`}>
                        {currentStatus}
                      </span>
                    )}
                  </td>
                  <td>
                    {att.arrivalTime ? new Date(att.arrivalTime).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Procès-Verbal (PV) de Réunion */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          <span>📝 Procès-Verbal (PV) de Réunion</span>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {meeting.minutes && !isEditingMinutes && (
              <button className={styles.printBtn} onClick={handleDownloadPdf} disabled={downloadingPdf}>
                <span className="material-symbols-rounded">download</span>
                {downloadingPdf ? 'Génération...' : 'Télécharger le PV (PDF)'}
              </button>
            )}
            {isBureau && !isEditingMinutes && (
              <button className={styles.actionBtn} onClick={() => setIsEditingMinutes(true)}>
                {meeting.minutes ? 'Modifier le PV' : 'Rédiger le PV'}
              </button>
            )}
          </div>
        </div>

        {isEditingMinutes ? (
          <div>
            <textarea
              className={styles.minutesEditor}
              placeholder="Saisissez ici le texte intégral du Procès-Verbal (Délibérations, décisions, votes)..."
              value={minutesText}
              onChange={(e) => setMinutesText(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <button className={styles.actionBtn} onClick={handleSaveMinutes} disabled={savingMinutes}>
                {savingMinutes ? 'Sauvegarde...' : 'Valider et Publier le PV'}
              </button>
              <button
                className={styles.actionBtn}
                style={{ background: '#fff', color: '#000', border: '1px solid #ccc' }}
                onClick={() => setIsEditingMinutes(false)}
              >
                Annuler
              </button>
            </div>
          </div>
        ) : meeting.minutes ? (
          <div className={styles.minutesDoc} ref={pvRef}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #000', paddingBottom: '1rem' }}>
              <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>PROCÈS-VERBAL DE RÉUNION</h2>
              <p style={{ margin: 0, fontWeight: 700 }}>{meeting.title}</p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
                Séance du {new Date(meeting.scheduledAt).toLocaleDateString('fr-FR')} | Présences : {presentCount} / {totalMembers}
              </p>
            </div>

            <div>{meeting.minutes}</div>

            <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between', paddingTop: '1.5rem', borderTop: '1px solid #eee', fontSize: '0.85rem', fontWeight: 700 }}>
              <div>Le Secrétaire de Séance</div>
              <div>Le Président de l'Association</div>
            </div>
          </div>
        ) : (
          <div style={{ color: '#666', fontStyle: 'italic' }}>
            Aucun procès-verbal n'a encore été rédigé pour cette réunion.
          </div>
        )}
      </div>
    </div>
  );
}
