'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './notifications.module.css';

export default function NotificationsPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = (params?.tenant as string) || '';

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [triggering, setTriggering] = useState<boolean>(false);
  const [triggerMessage, setTriggerMessage] = useState<string>('');
  const [filter, setFilter] = useState<string>('ALL');

  useEffect(() => {
    if (tenantSlug) {
      loadNotifications();
    }
  }, [tenantSlug]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/backend/notifications/mine?associationId=${tenantSlug}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (e) {
      console.error('Error loading notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, linkUrl?: string) => {
    try {
      await fetch(`/api/backend/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'READ' } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
      if (linkUrl) {
        router.push(linkUrl);
      }
    } catch (e) {
      console.error('Error marking read:', e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`/api/backend/notifications/read-all?associationId=${tenantSlug}`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, status: 'READ' })));
      setUnreadCount(0);
    } catch (e) {
      console.error('Error marking all as read:', e);
    }
  };

  const handleTriggerReminders = async () => {
    setTriggering(true);
    setTriggerMessage('');
    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/notifications/trigger-reminders`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setTriggerMessage(
          `✓ Relances automatiques multi-canaux exécutées : ${data.tontineRemindersCount} rappels tontine, ${data.loanRemindersCount} relances de prêt et ${data.meetingRemindersCount} convocations envoyés via Email, SMS & WhatsApp.`
        );
        loadNotifications();
      }
    } catch (e) {
      console.error('Error triggering reminders:', e);
    } finally {
      setTriggering(false);
    }
  };

  const filteredNotifs = notifications.filter(n => {
    if (filter === 'UNREAD') return n.status === 'UNREAD';
    if (filter === 'TONTINE') return n.type === 'TONTINE_REMINDER';
    if (filter === 'LOAN') return n.type === 'LOAN_REPAYMENT_DUE';
    if (filter === 'MEETING') return n.type === 'MEETING_CONVOCATION';
    return true;
  });

  const getTagClass = (type: string) => {
    switch (type) {
      case 'TONTINE_REMINDER': return `${styles.tag} ${styles.tagTontine}`;
      case 'LOAN_REPAYMENT_DUE': return `${styles.tag} ${styles.tagLoan}`;
      case 'MEETING_CONVOCATION': return `${styles.tag} ${styles.tagMeeting}`;
      default: return `${styles.tag} ${styles.tagGov}`;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'TONTINE_REMINDER': return 'currency_exchange';
      case 'LOAN_REPAYMENT_DUE': return 'handshake';
      case 'MEETING_CONVOCATION': return 'event';
      default: return 'notifications';
    }
  };

  return (
    <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.titleGroup}>
            <h1>
              <span className="material-symbols-rounded">notifications</span>
              Centre de Notifications & Relances Automatiques
            </h1>
            <p className={styles.subtitle}>
              Suivi des alertes en temps réel et déclenchement des relances multi-canaux (Email, SMS & WhatsApp)
            </p>
          </div>

          <div className={styles.actionGroup}>
            {unreadCount > 0 && (
              <button className={styles.secondaryBtn} onClick={markAllAsRead}>
                <span className="material-symbols-rounded">done_all</span>
                Tout marquer comme lu
              </button>
            )}
            <button
              className={styles.primaryBtn}
              onClick={handleTriggerReminders}
              disabled={triggering}
            >
              <span className="material-symbols-rounded">send</span>
              {triggering ? 'Lancement des relances...' : 'Lancer les Relances Multi-Canaux'}
            </button>
          </div>
        </header>

        {triggerMessage && (
          <div className={styles.successAlert}>
            <span className="material-symbols-rounded">check_circle</span>
            {triggerMessage}
          </div>
        )}

        {/* Stats Grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div>
              <p className={styles.statLabel}>Non lues</p>
              <p className={styles.statValue} style={{ color: '#2563eb' }}>{unreadCount}</p>
            </div>
            <span className="material-symbols-rounded" style={{ fontSize: '2rem', opacity: 0.3 }}>mark_email_unread</span>
          </div>

          <div className={styles.statCard}>
            <div>
              <p className={styles.statLabel}>Total Notifications</p>
              <p className={styles.statValue}>{notifications.length}</p>
            </div>
            <span className="material-symbols-rounded" style={{ fontSize: '2rem', opacity: 0.3 }}>notifications_active</span>
          </div>

          <div className={styles.statCard}>
            <div>
              <p className={styles.statLabel}>Canaux Actifs</p>
              <p className={styles.statValue} style={{ fontSize: '1.1rem', color: '#166534' }}>In-App • SMS • WhatsApp</p>
            </div>
            <span className="material-symbols-rounded" style={{ fontSize: '2rem', opacity: 0.3 }}>hub</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilter('ALL')}
            className={styles.secondaryBtn}
            style={{ background: filter === 'ALL' ? '#000' : '#fff', color: filter === 'ALL' ? '#fff' : '#000' }}
          >
            Toutes ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('UNREAD')}
            className={styles.secondaryBtn}
            style={{ background: filter === 'UNREAD' ? '#000' : '#fff', color: filter === 'UNREAD' ? '#fff' : '#000' }}
          >
            Non lues ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('TONTINE')}
            className={styles.secondaryBtn}
            style={{ background: filter === 'TONTINE' ? '#000' : '#fff', color: filter === 'TONTINE' ? '#fff' : '#000' }}
          >
            Tontines
          </button>
          <button
            onClick={() => setFilter('LOAN')}
            className={styles.secondaryBtn}
            style={{ background: filter === 'LOAN' ? '#000' : '#fff', color: filter === 'LOAN' ? '#fff' : '#000' }}
          >
            Prêts
          </button>
          <button
            onClick={() => setFilter('MEETING')}
            className={styles.secondaryBtn}
            style={{ background: filter === 'MEETING' ? '#000' : '#fff', color: filter === 'MEETING' ? '#fff' : '#000' }}
          >
            Convocations Réunion
          </button>
        </div>

        {/* Notifications List */}
        {loading ? (
          <p style={{ fontStyle: 'italic', color: '#666' }}>Chargement des notifications...</p>
        ) : filteredNotifs.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '3rem', textAlign: 'center', color: '#64748b' }}>
            <span className="material-symbols-rounded" style={{ fontSize: '3rem', opacity: 0.3, display: 'block', marginBottom: '0.5rem' }}>notifications_off</span>
            <p style={{ margin: 0, fontWeight: 600 }}>Aucune notification pour ce filtre.</p>
          </div>
        ) : (
          <div className={styles.notifList}>
            {filteredNotifs.map(n => (
              <div
                key={n.id}
                className={`${styles.notifCard} ${n.status === 'UNREAD' ? styles.unreadCard : ''}`}
                onClick={() => markAsRead(n.id, n.linkUrl)}
                style={{ cursor: 'pointer' }}
              >
                <div className={styles.notifContent}>
                  <div className={styles.notifTitle}>
                    <span className="material-symbols-rounded" style={{ fontSize: '1.25rem' }}>{getIcon(n.type)}</span>
                    {n.title}
                  </div>
                  <p className={styles.notifMessage}>{n.message}</p>
                  <div className={styles.notifMeta}>
                    <span className={getTagClass(n.type)}>{n.type.replace('_', ' ')}</span>
                    <span>• {new Date(n.sentAt).toLocaleString('fr-FR')}</span>
                    {n.channel && <span>• Canal : {n.channel}</span>}
                  </div>
                </div>

                {n.status === 'UNREAD' && (
                  <span style={{ background: '#2563eb', color: '#fff', fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: 999 }}>
                    NOUVEAU
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
  );
}
