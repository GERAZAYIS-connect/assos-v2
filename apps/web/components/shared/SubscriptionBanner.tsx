'use client';

import React from 'react';
import Link from 'next/link';

interface SubscriptionBannerProps {
  tenantSlug: string;
  isExpired: boolean;
  isTrial: boolean;
}

export default function SubscriptionBanner({ tenantSlug, isExpired, isTrial }: SubscriptionBannerProps) {
  if (!isExpired) return null;

  return (
    <div style={{
      width: '100%',
      backgroundColor: '#ef4444',
      color: '#fff',
      padding: '0.75rem 1rem',
      textAlign: 'center',
      fontSize: '0.875rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    }}>
      <div>
        <span className="material-symbols-rounded" style={{ verticalAlign: 'middle', marginRight: '0.5rem', fontSize: '1.25rem' }}>
          warning
        </span>
        <strong>Attention :</strong> {isTrial ? 'Votre période d\'essai a expiré.' : 'L\'abonnement de votre association est inactif.'} 
        {' '}Vous êtes en mode lecture seule. Aucune action n'est possible.
      </div>
      <Link
        href={`/${tenantSlug}/settings/billing`}
        style={{
          backgroundColor: '#fff',
          color: '#ef4444',
          padding: '0.25rem 0.75rem',
          borderRadius: '9999px',
          fontWeight: 600,
          textDecoration: 'none',
          fontSize: '0.8rem',
          display: 'inline-block',
          border: '1px solid #fff',
        }}
      >
        Renouveler avec Freemo Pay
      </Link>
    </div>
  );
}
