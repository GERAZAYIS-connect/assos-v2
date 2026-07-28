'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import styles from './dashboard-shell.module.css';

interface DashboardShellProps {
  children: React.ReactNode;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || '';

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentNotifs, setRecentNotifs] = useState<any[]>([]);

  const navItems = [
    { icon: 'dashboard', label: 'Tableau de bord', href: `/${tenantSlug}/dashboard` },
    { icon: 'groups', label: 'Membres', href: `/${tenantSlug}/members` },
    { icon: 'account_balance', label: 'Trésorerie', href: `/${tenantSlug}/treasury` },
    { icon: 'currency_exchange', label: 'Tontines', href: `/${tenantSlug}/tontines` },
    { icon: 'handshake', label: 'Prêts', href: `/${tenantSlug}/loans` },
    { icon: 'gavel', label: 'Sanctions', href: `/${tenantSlug}/sanctions` },
    { icon: 'event', label: 'Réunions', href: `/${tenantSlug}/meetings` },
    { icon: 'how_to_vote', label: 'Votes & AG', href: `/${tenantSlug}/governance` },
    { icon: 'notifications', label: 'Notifications', href: `/${tenantSlug}/notifications` },
    { icon: 'pie_chart', label: 'Budget & Bilan', href: `/${tenantSlug}/budget` },
    { icon: 'inventory_2', label: 'Patrimoine Matériel', href: `/${tenantSlug}/equipment` },
    { icon: 'folder_open', label: 'Documents', href: `/${tenantSlug}/documents` },
  ];

  React.useEffect(() => {
    if (tenantSlug) {
      fetchNotifications();
    }
  }, [tenantSlug]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/backend/notifications/mine?associationId=${tenantSlug}`);
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount || 0);
        setRecentNotifs(data.notifications || []);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`/api/backend/notifications/read-all?associationId=${tenantSlug}`, { method: 'PATCH' });
      setUnreadCount(0);
      setRecentNotifs(recentNotifs.map(n => ({ ...n, status: 'READ' })));
    } catch (e) {
      console.error('Error marking all read:', e);
    }
  };

  const isLinkActive = (href: string) => {
    if (href.endsWith('/dashboard')) {
      return pathname === href || pathname === `/${tenantSlug}`;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={styles.shell}>
      {/* Mobile Top Header */}
      <header className={styles.mobileHeader}>
        <button
          type="button"
          className={styles.menuToggleBtn}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Menu"
        >
          <span className="material-symbols-rounded">{mobileMenuOpen ? 'close' : 'menu'}</span>
        </button>

        <div className={styles.mobileLogo}>
          <span className="material-symbols-rounded">diversity_3</span>
          <span className={styles.assocTitle}>{tenantSlug.toUpperCase()}</span>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label="Notifications"
            onClick={() => setNotifOpen(!notifOpen)}
            style={{ position: 'relative' }}
          >
            <span className="material-symbols-rounded">notifications</span>
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: -2,
                right: -2,
                background: '#dc2626',
                color: '#fff',
                borderRadius: '9999px',
                fontSize: '0.65rem',
                fontWeight: 700,
                width: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown Drawer */}
          {notifOpen && (
            <div style={{
              position: 'absolute',
              top: '2.5rem',
              right: 0,
              width: 320,
              maxHeight: 400,
              background: '#fff',
              borderRadius: 12,
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              border: '1px solid #e2e8f0',
              zIndex: 100,
              overflowY: 'auto',
              padding: '0.75rem',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>Notifications ({unreadCount} non-lues)</strong>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ border: 'none', background: 'none', color: '#2563eb', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                    Tout marquer lu
                  </button>
                )}
              </div>

              {recentNotifs.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: '#64748b', textAlign: 'center', margin: '1rem 0' }}>Aucune notification</p>
              ) : (
                recentNotifs.slice(0, 5).map(n => (
                  <div key={n.id} style={{ padding: '0.5rem', borderRadius: 8, background: n.status === 'UNREAD' ? '#f0f9ff' : 'transparent', marginBottom: '0.25rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.82rem', color: '#1e293b' }}>{n.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: 2 }}>{n.message}</div>
                  </div>
                ))
              )}

              <Link href={`/${tenantSlug}/notifications`} onClick={() => setNotifOpen(false)} style={{ display: 'block', textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#000', textDecoration: 'none' }}>
                Voir toutes les relances →
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className={styles.mobileOverlay} onClick={() => setMobileMenuOpen(false)}>
          <aside className={styles.mobileDrawer} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <span className="material-symbols-rounded">diversity_3</span>
              <h3>{tenantSlug.toUpperCase()}</h3>
            </div>

            <nav className={styles.drawerNav}>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${styles.navItem} ${isLinkActive(item.href) ? styles.navItemActive : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="material-symbols-rounded">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Desktop Persistent Sidebar */}
      <aside className={styles.desktopSidebar}>
        <div className={styles.sidebarLogo}>
          <span className="material-symbols-rounded">diversity_3</span>
          <span className={styles.assocName}>{tenantSlug.toUpperCase()}</span>
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${isLinkActive(item.href) ? styles.navItemActive : ''}`}
            >
              <span className="material-symbols-rounded">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <Link href={`/${tenantSlug}/settings`} className={styles.navItem}>
            <span className="material-symbols-rounded">settings</span>
            <span>Paramètres</span>
          </Link>
        </div>
      </aside>

      {/* Main Content View */}
      <div className={styles.mainContainer}>
        <main className={styles.mainContent}>{children}</main>

        {/* Mobile Bottom Navigation Bar */}
        <nav className={styles.mobileBottomNav}>
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.bottomNavItem} ${isLinkActive(item.href) ? styles.bottomNavItemActive : ''}`}
            >
              <span className="material-symbols-rounded">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
