'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './select-association.module.css';

interface AssociationItem {
  id: string;
  name: string;
  slug: string;
  currency: string;
  role: string;
}

export default function SelectAssociationPage() {
  const [associations, setAssociations] = useState<AssociationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyAssociations();
  }, []);

  const fetchMyAssociations = async () => {
    try {
      const res = await fetch('/api/backend/associations/mine');
      if (res.ok) {
        const data = await res.json();
        setAssociations(data);
      } else {
        // Fallback for dev if empty
        setAssociations([]);
      }
    } catch {
      setAssociations([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <div className={styles.header}>
          <h1>Vos Espaces Associatifs</h1>
          <p>Sélectionnez l'association à laquelle vous souhaitez accéder ou créez-en une nouvelle.</p>
        </div>

        {loading ? (
          <div className={styles.loading}>Chargement de vos associations...</div>
        ) : (
          <div className={styles.grid}>
            {associations.map((assoc) => {
              const url = window.location.host.includes('lvh.me')
                ? `http://${assoc.slug}.lvh.me:3000/dashboard`
                : `/${assoc.slug}/dashboard`;

              return (
                <a key={assoc.id} href={url} className={styles.assocCard}>
                  <div className={styles.assocAvatar}>
                    <span className="material-symbols-rounded">diversity_3</span>
                  </div>
                  <div className={styles.assocDetails}>
                    <h3>{assoc.name}</h3>
                    <span className={styles.slugBadge}>{assoc.slug}.assos.cm</span>
                  </div>
                  <span className="material-symbols-rounded styles.arrow">chevron_right</span>
                </a>
              );
            })}

            <Link href="/create-association" className={`${styles.assocCard} ${styles.newAssocCard}`}>
              <div className={styles.newAvatar}>
                <span className="material-symbols-rounded">add</span>
              </div>
              <div className={styles.assocDetails}>
                <h3>Créer une nouvelle association</h3>
                <span className={styles.slugBadge}>Nouveau projet ou tontine</span>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
