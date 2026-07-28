'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import styles from './equipment.module.css';

interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  availableQty: number;
  condition: 'NEW' | 'GOOD' | 'REPAIR_NEEDED' | 'OUT_OF_SERVICE';
  purchaseValue: number;
  rentalRateDay: number;
  notes?: string;
}

interface EquipmentRental {
  id: string;
  renterName: string;
  renterPhone?: string;
  quantity: number;
  startDate: string;
  endDate: string;
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  equipment?: EquipmentItem;
}

export default function EquipmentPage() {
  const params = useParams();
  const tenantSlug = (params?.tenant as string) || '';

  const [assocId, setAssocId] = useState<string>('');
  const [equipments, setEquipments] = useState<EquipmentItem[]>([]);
  const [rentals, setRentals] = useState<EquipmentRental[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddEquipment, setShowAddEquipment] = useState(false);
  const [showAddRental, setShowAddRental] = useState(false);

  // Form: Equipment
  const [eqName, setEqName] = useState('');
  const [eqCategory, setEqCategory] = useState('RÉCEPTION');
  const [eqQuantity, setEqQuantity] = useState(10);
  const [eqCondition, setEqCondition] = useState<'NEW' | 'GOOD' | 'REPAIR_NEEDED' | 'OUT_OF_SERVICE'>('GOOD');
  const [eqPurchaseValue, setEqPurchaseValue] = useState(0);
  const [eqRentalRateDay, setEqRentalRateDay] = useState(1000);

  // Form: Rental
  const [rentalEqId, setRentalEqId] = useState('');
  const [renterName, setRenterName] = useState('');
  const [renterPhone, setRenterPhone] = useState('');
  const [rentalQty, setRentalQty] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [advancePaid, setAdvancePaid] = useState(0);

  useEffect(() => {
    if (tenantSlug) {
      fetchAssociation();
    }
  }, [tenantSlug]);

  const fetchAssociation = async () => {
    try {
      const res = await fetch('/api/backend/associations/mine');
      if (res.ok) {
        const list = await res.json();
        const curr = list.find((a: any) => a.slug === tenantSlug);
        if (curr) {
          setAssocId(curr.id);
          fetchData(curr.id);
        }
      }
    } catch {
      setLoading(false);
    }
  };

  const fetchData = async (id: string) => {
    try {
      const [resEq, resRent] = await Promise.all([
        fetch(`/api/backend/associations/${id}/equipment`),
        fetch(`/api/backend/associations/${id}/equipment/rentals`),
      ]);

      if (resEq.ok) {
        const dataEq = await resEq.json();
        setEquipments(dataEq);
      }
      if (resRent.ok) {
        const dataRent = await resRent.json();
        setRentals(dataRent);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAssocId = assocId || tenantSlug;
    if (!targetAssocId || !eqName) {
      alert("Veuillez saisir la désignation de l'équipement.");
      return;
    }

    try {
      const res = await fetch(`/api/backend/associations/${targetAssocId}/equipment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: eqName,
          category: eqCategory,
          quantity: Number(eqQuantity) || 1,
          condition: eqCondition,
          purchaseValue: Number(eqPurchaseValue) || 0,
          rentalRateDay: Number(eqRentalRateDay) || 0,
        }),
      });

      if (res.ok) {
        setShowAddEquipment(false);
        setEqName('');
        fetchData(targetAssocId);
        alert("Bien enregistré avec succès dans le patrimoine.");
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Erreur lors de l'enregistrement du bien.");
      }
    } catch {
      alert("Erreur de connexion lors de la création de l'équipement.");
    }
  };

  const handleCreateRental = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAssocId = assocId || tenantSlug;
    if (!targetAssocId || !rentalEqId || !renterName) {
      alert("Veuillez sélectionner un équipement et indiquer le nom du loueur.");
      return;
    }

    try {
      const res = await fetch(`/api/backend/associations/${targetAssocId}/equipment/rentals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          equipmentId: rentalEqId,
          renterName,
          renterPhone,
          quantity: Number(rentalQty) || 1,
          startDate,
          endDate,
          totalAmount: Number(totalAmount) || 0,
          advancePaid: Number(advancePaid) || 0,
        }),
      });

      if (res.ok) {
        setShowAddRental(false);
        setRenterName('');
        fetchData(targetAssocId);
        alert("Réservation/Location enregistrée avec succès. L'acompte a été crédité en Caisse Principale.");
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.message || "Erreur lors de l'enregistrement de la location.");
      }
    } catch {
      alert("Erreur lors de l'enregistrement de la location.");
    }
  };

  const conditionLabels: Record<string, { label: string; color: string }> = {
    NEW: { label: 'Neuf', color: '#166534' },
    GOOD: { label: 'Bon État', color: '#2563eb' },
    REPAIR_NEEDED: { label: 'À Réparer', color: '#d97706' },
    OUT_OF_SERVICE: { label: 'Hors Service', color: '#dc2626' },
  };

  const totalValue = equipments.reduce((acc, item) => acc + (item.purchaseValue * item.quantity), 0);
  const totalRevenue = rentals.reduce((acc, item) => acc + item.advancePaid, 0);

  if (loading) {
    return <div style={{ padding: '3rem', textAlign: 'center', color: '#64748b' }}>Chargement du patrimoine matériel...</div>;
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1400, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem 0' }}>
            Patrimoine Matériel & Locations d'Équipements
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.95rem', margin: 0 }}>
            Inventaire des biens communs (tentes, bâches, chaises, groupe électrogène) et gestion des locations rémunératrices.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowAddEquipment(true)}
            style={{ background: '#0f172a', color: '#fff', border: 'none', padding: '0.75rem 1.25rem', borderRadius: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span className="material-symbols-rounded">add_box</span>
            Ajouter un bien
          </button>

          <button
            onClick={() => setShowAddRental(true)}
            style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '0.75rem 1.25rem', borderRadius: 10, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <span className="material-symbols-rounded">event_seat</span>
            Nouvelle Location
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Équipements en Inventaire</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0.5rem 0 0 0' }}>
            {equipments.reduce((acc, item) => acc + item.quantity, 0)} articles
          </h3>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Valeur Totale du Patrimoine</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#166534', margin: '0.5rem 0 0 0' }}>
            {totalValue.toLocaleString('fr-FR')} FCFA
          </h3>
        </div>

        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem' }}>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>Recettes Locatives Perçues</span>
          <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#2563eb', margin: '0.5rem 0 0 0' }}>
            {totalRevenue.toLocaleString('fr-FR')} FCFA
          </h3>
        </div>
      </div>

      {/* Grid: Inventory & Rentals */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem' }}>
        
        {/* Inventory Section */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-rounded" style={{ color: '#2563eb' }}>inventory_2</span>
            Inventaire des Équipements ({equipments.length})
          </h2>

          {equipments.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Aucun matériel enregistré. Cliquez sur "Ajouter un bien".</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {equipments.map((item) => (
                <div key={item.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem 0', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>{item.name}</h4>
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                      Catégorie : {item.category} • Quantité: {item.quantity} (Dispo: {item.availableQty})
                    </span>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', marginTop: '0.2rem' }}>
                      Tarif location : {item.rentalRateDay.toLocaleString('fr-FR')} FCFA / jour
                    </div>
                  </div>

                  <div>
                    <span style={{ background: '#fff', border: `1px solid ${conditionLabels[item.condition]?.color}`, color: conditionLabels[item.condition]?.color, padding: '0.25rem 0.6rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 700 }}>
                      {conditionLabels[item.condition]?.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rentals Section */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="material-symbols-rounded" style={{ color: '#166534' }}>receipt_long</span>
            Historique des Locations ({rentals.length})
          </h2>

          {rentals.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Aucune location enregistrée.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {rentals.map((r) => (
                <div key={r.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', padding: '1rem', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{r.renterName}</strong>
                    <span style={{ color: '#166534', fontWeight: 700, fontSize: '0.9rem' }}>
                      {r.totalAmount.toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.4rem' }}>
                    Équipement: {r.equipment?.name || 'Matériel'} • Téléphone: {r.renterPhone || 'N/A'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#334155', background: '#fff', padding: '0.4rem 0.6rem', borderRadius: 6, border: '1px solid #cbd5e1' }}>
                    <span>Acompte Versé : <strong>{r.advancePaid.toLocaleString('fr-FR')} FCFA</strong></span>
                    <span>Solde Dû : <strong>{r.balanceDue.toLocaleString('fr-FR')} FCFA</strong></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Modal Add Equipment */}
      {showAddEquipment && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: 16, maxWidth: 500, width: '100%' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontWeight: 800 }}>Ajouter un équipement au patrimoine</h3>
            <form onSubmit={handleCreateEquipment}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>Désignation du bien</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tente 100 places, Groupe Électrogène 5kVA"
                  value={eqName}
                  onChange={(e) => setEqName(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: '0.3rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>Catégorie</label>
                  <select value={eqCategory} onChange={(e) => setEqCategory(e.target.value)} style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: '0.3rem' }}>
                    <option value="RÉCEPTION">Réception (Tentes, Chaises)</option>
                    <option value="SONORISATION">Sonorisation / Musique</option>
                    <option value="ÉNERGIE">Énergie (Groupe)</option>
                    <option value="LOGISTIQUE">Logistique / Vaisselle</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>Quantité</label>
                  <input
                    type="number"
                    min="1"
                    value={eqQuantity}
                    onChange={(e) => setEqQuantity(parseInt(e.target.value) || 1)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: '0.3rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>Valeur d'achat (FCFA)</label>
                  <input
                    type="number"
                    value={eqPurchaseValue}
                    onChange={(e) => setEqPurchaseValue(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: '0.3rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>Tarif location / jour</label>
                  <input
                    type="number"
                    value={eqRentalRateDay}
                    onChange={(e) => setEqRentalRateDay(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: '0.3rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddEquipment(false)} style={{ padding: '0.6rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: 8, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" style={{ padding: '0.6rem 1rem', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  Enregistrer le bien
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Rental */}
      {showAddRental && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', padding: '2rem', borderRadius: 16, maxWidth: 520, width: '100%' }}>
            <h3 style={{ margin: '0 0 1.25rem 0', fontWeight: 800 }}>Enregistrer une location de matériel</h3>
            <form onSubmit={handleCreateRental}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>Sélectionner l'équipement</label>
                <select
                  required
                  value={rentalEqId}
                  onChange={(e) => setRentalEqId(e.target.value)}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: '0.3rem' }}
                >
                  <option value="">-- Choisir un matériel --</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.name} ({eq.rentalRateDay.toLocaleString('fr-FR')} FCFA/j)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>Nom du loueur / Membre</label>
                  <input
                    type="text"
                    required
                    placeholder="Nom complet"
                    value={renterName}
                    onChange={(e) => setRenterName(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: '0.3rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>Téléphone</label>
                  <input
                    type="text"
                    placeholder="Ex: 699000000"
                    value={renterPhone}
                    onChange={(e) => setRenterPhone(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: '0.3rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>Date Début</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: '0.3rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>Date Fin</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: '0.3rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>Montant Total (FCFA)</label>
                  <input
                    type="number"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: '0.3rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem' }}>Acompte versé (Caisse)</label>
                  <input
                    type="number"
                    value={advancePaid}
                    onChange={(e) => setAdvancePaid(parseFloat(e.target.value) || 0)}
                    style={{ width: '100%', padding: '0.6rem', borderRadius: 8, border: '1px solid #cbd5e1', marginTop: '0.3rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button type="button" onClick={() => setShowAddRental(false)} style={{ padding: '0.6rem 1rem', border: '1px solid #cbd5e1', background: '#fff', borderRadius: 8, cursor: 'pointer' }}>
                  Annuler
                </button>
                <button type="submit" style={{ padding: '0.6rem 1rem', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  Valider la location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
