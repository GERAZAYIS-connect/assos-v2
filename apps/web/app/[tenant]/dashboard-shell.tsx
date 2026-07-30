'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import styles from './dashboard-shell.module.css';
import SubscriptionBanner from '../../components/shared/SubscriptionBanner';

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
  const [association, setAssociation] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>('MEMBER');
  const router = useRouter();

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

  const visibleNavItems = navItems.filter((item) => {
    if (item.href.endsWith('/members')) {
      return ['PRESIDENT', 'TREASURER', 'SECRETARY', 'CENSOR'].includes(userRole);
    }
    if (item.href.endsWith('/treasury')) {
      return ['PRESIDENT', 'TREASURER'].includes(userRole);
    }
    if (item.href.endsWith('/budget')) {
      return ['PRESIDENT', 'TREASURER'].includes(userRole);
    }
    return true;
  });

  React.useEffect(() => {
    if (tenantSlug) {
      fetchNotifications();
      fetchAssociationDetails();
      fetchUserRole();
    }
  }, [tenantSlug]);

  const fetchUserRole = async () => {
    try {
      const res = await fetch(`/api/backend/members?associationId=${tenantSlug}`);
      if (res.ok) {
        const data = await res.json();
        // Assume API returns { data: [...] } and we find the current user
        // Or if it just returns the current user's membership. 
        // Based on the grep search, they usually look for current member:
        const current = data.data?.find((m: any) => m.isCurrentUser) || data.find?.((m: any) => m.isCurrentUser);
        if (current) {
          setUserRole(current.role);
        } else if (data.role) {
          setUserRole(data.role); // alternative if API returns role directly
        }
      }
    } catch (e) {
      console.error('Error fetching user role:', e);
    }
  };

  const fetchAssociationDetails = async () => {
    try {
      // NOTE: We assume there is an endpoint to get basic association info by slug
      // If the API endpoint path is different, this might need adjustment.
      const res = await fetch(`/api/backend/associations/${tenantSlug}`);
      if (res.ok) {
        const data = await res.json();
        setAssociation(data);
      }
    } catch (e) {
      console.error('Error fetching association details:', e);
    }
  };

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
              {visibleNavItems.map((item) => (
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
          {visibleNavItems.map((item) => (
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

        {userRole === 'PRESIDENT' && (
          <div className={styles.sidebarFooter}>
            <Link href={`/${tenantSlug}/settings`} className={styles.navItem}>
              <span className="material-symbols-rounded">settings</span>
              <span>Paramètres</span>
            </Link>
          </div>
        )}
      </aside>

      {/* Main Content View */}
      <div className={styles.mainContainer}>
        {(() => {
          const isExpired = association && (association.subscriptionStatus === 'PAST_DUE' || association.subscriptionStatus === 'CANCELED');
          const isTrial = association && (association.plan === 'DISCOVERY' || association.subscriptionStatus === 'TRIALING');

          return (
            <>
              {association && !association.isActive ? (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 9999, backgroundColor: '#f8fafc',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', padding: '2rem'
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '4rem', color: '#ef4444', marginBottom: '1rem' }}>block</span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Association Suspendue</h2>
                  <p style={{ color: '#64748b', maxWidth: 400 }}>
                    Cette association a été suspendue par l'administration de la plateforme. Veuillez contacter le support.
                  </p>
                </div>
              ) : association && isExpired && userRole === 'MEMBER' ? (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 9999, backgroundColor: '#f8fafc',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  textAlign: 'center', padding: '2rem'
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: '4rem', color: '#ef4444', marginBottom: '1rem' }}>lock</span>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>L'abonnement de votre association est inactif</h2>
                  <p style={{ color: '#64748b', maxWidth: 400 }}>
                    Veuillez contacter l'administrateur ou le bureau exécutif de l'association pour régulariser la situation.
                  </p>
                </div>
              ) : (
                <>
                  {association && isExpired && userRole !== 'MEMBER' && (
                    <SubscriptionBanner
                      tenantSlug={tenantSlug}
                      isExpired={isExpired}
                      isTrial={isTrial}
                    />
                  )}
                  <main className={styles.mainContent}>{children}</main>
                </>
              )}
            </>
          );
        })()}

        {/* Mobile Bottom Navigation Bar */}
        <nav className={styles.mobileBottomNav}>
          {visibleNavItems.slice(0, 5).map((item) => (
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
