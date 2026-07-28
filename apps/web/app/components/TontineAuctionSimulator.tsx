'use client';

import React, { useState } from 'react';
import styles from '../[tenant]/tontines/[tontineId]/tontine-details.module.css';

interface Bid {
  memberId: string;
  amount: number;
}

interface TontineAuctionSimulatorProps {
  tontineId: string;
  tenantSlug: string;
  amountPerRound: number;
  members: any[];
  onClose: () => void;
  onSimulationComplete: (result: any) => void;
}

export default function TontineAuctionSimulator({
  tontineId,
  tenantSlug,
  amountPerRound,
  members,
  onClose,
  onSimulationComplete,
}: TontineAuctionSimulatorProps) {
  const [bids, setBids] = useState<Bid[]>([]);
  const [selectedMember, setSelectedMember] = useState('');
  const [bidAmount, setBidAmount] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalMembers = members.length;
  const totalPot = amountPerRound * totalMembers;

  const handleAddBid = () => {
    if (!selectedMember || !bidAmount || bidAmount <= 0) return;
    
    if (bids.find(b => b.memberId === selectedMember)) {
      setError("Ce membre a déjà placé une enchère.");
      return;
    }

    if (Number(bidAmount) >= totalPot) {
      setError("L'enchère doit être inférieure à la cagnotte totale.");
      return;
    }

    setBids([...bids, { memberId: selectedMember, amount: Number(bidAmount) }]);
    setSelectedMember('');
    setBidAmount('');
    setError('');
  };

  const handleRemoveBid = (mId: string) => {
    setBids(bids.filter(b => b.memberId !== mId));
  };

  const handleSimulate = async () => {
    if (bids.length === 0) {
      setError('Veuillez ajouter au moins une enchère.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/backend/associations/${tenantSlug}/tontines/${tontineId}/simulate-auction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountPerRound,
          totalMembers,
          bids,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        onSimulationComplete(data);
      } else {
        setError(data.message || 'Erreur lors de la simulation');
      }
    } catch (err) {
      setError('Erreur de connexion');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Simulateur d'Enchères</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div style={{ marginBottom: '1.5rem', background: '#f5f5f5', padding: '1rem', borderRadius: '0.5rem', fontSize: '0.9rem' }}>
          <strong>Cagnotte Totale Prévue :</strong> {totalPot.toLocaleString('fr-FR')} XAF
        </div>

        {error && <div className={styles.alertError}>{error}</div>}

        <div className={styles.form}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
            <div className={styles.field} style={{ flex: 1, marginBottom: 0 }}>
              <label>Membre</label>
              <select value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)}>
                <option value="">-- Sélectionner --</option>
                {members.map((m: any) => (
                  <option key={m.memberId} value={m.memberId}>
                    {m.member?.profile?.firstName || m.member?.user?.email || m.memberId}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field} style={{ flex: 1, marginBottom: 0 }}>
              <label>Montant (XAF)</label>
              <input
                type="number"
                min="1"
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value) || '')}
              />
            </div>
            <button
              type="button"
              className={styles.outlineBtn}
              onClick={handleAddBid}
              style={{ marginBottom: '0.1rem', height: '42px' }}
            >
              + Ajouter
            </button>
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '1.5rem' }}>
            {bids.length === 0 ? (
              <div style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>Aucune enchère enregistrée.</div>
            ) : (
              <table className={styles.contribTable}>
                <thead>
                  <tr>
                    <th>Membre</th>
                    <th>Montant de l'enchère</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bids.map((b, i) => {
                    const mName = members.find(m => m.memberId === b.memberId)?.member?.profile?.firstName || b.memberId;
                    return (
                      <tr key={i}>
                        <td>{mName}</td>
                        <td>{b.amount.toLocaleString('fr-FR')} XAF</td>
                        <td>
                          <button
                            type="button"
                            onClick={() => handleRemoveBid(b.memberId)}
                            style={{ background: 'none', border: 'none', color: 'red', cursor: 'pointer' }}
                          >
                            Retirer
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <button
            type="button"
            className={styles.submitBtn}
            onClick={handleSimulate}
            disabled={isSubmitting || bids.length === 0}
            style={{ width: '100%' }}
          >
            {isSubmitting ? 'Simulation...' : 'Lancer la Simulation'}
          </button>
        </div>
      </div>
    </div>
  );
}
