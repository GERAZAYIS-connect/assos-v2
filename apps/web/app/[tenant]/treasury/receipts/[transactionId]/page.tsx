'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import styles from './receipt.module.css';

interface TransactionData {
  id: string;
  reference: string;
  type: string;
  amount: number;
  description: string | null;
  status: string;
  createdAt: string;
  caisse: { id: string; name: string; type: string };
  destinationCaisse: { id: string; name: string; type: string } | null;
  member: {
    memberNumber: string;
    user: { email: string; phone: string | null };
    profile: { firstName: string; lastName: string } | null;
  } | null;
  createdBy: { email: string } | null;
  association: { id: string; name: string; slug: string; logoUrl: string | null };
}

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Dépôt / Versement',
  WITHDRAWAL: 'Retrait / Décaissement',
  TRANSFER: 'Transfert entre caisses',
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: 'Confirmée',
  PENDING: 'En attente',
  FAILED: 'Échouée',
  CANCELLED: 'Annulée',
};

export default function ReceiptPage() {
  const params = useParams();
  const tenant = (params?.tenant as string) || '';
  const transactionId = (params?.transactionId as string) || '';

  const [tx, setTx] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tenant || !transactionId) return;
    fetch(`/api/backend/associations/${tenant}/treasury/transactions/${transactionId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Transaction introuvable');
        return res.json();
      })
      .then(setTx)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tenant, transactionId]);

  const handleDownloadPdf = async () => {
    if (!receiptRef.current || !tx) return;
    setDownloading(true);

    try {
      // Dynamically import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2, // High DPI for crisp PDF
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

      // Calculate image dimensions to fit in the PDF
      const imgWidth = pageWidth - 20; // 10mm margin each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const yOffset = Math.max(10, (pageHeight - imgHeight) / 2); // Center vertically if fits

      pdf.addImage(imgData, 'PNG', 10, yOffset, imgWidth, Math.min(imgHeight, pageHeight - 20));

      // Filename from reference
      const filename = `recu-${tx.reference}-${tx.association.slug}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF generation failed:', err);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className={styles.centered}>Chargement du reçu...</div>;
  if (error || !tx) return <div className={styles.centered}>{error || 'Transaction introuvable.'}</div>;

  const memberName = tx.member?.profile
    ? `${tx.member.profile.firstName} ${tx.member.profile.lastName}`.trim()
    : tx.member?.user?.email ?? null;

  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(tx.createdAt));

  return (
    <div className={styles.page}>
      {/* Actions toolbar */}
      <div className={styles.toolbar}>
        <Link href={`/${tenant}/treasury`} className={styles.backBtn}>
          ← Retour aux caisses
        </Link>
        <button className={styles.printBtn} onClick={handleDownloadPdf} disabled={downloading}>
          <span className="material-symbols-rounded">download</span>
          {downloading ? 'Génération...' : 'Télécharger le reçu (PDF)'}
        </button>
      </div>

      {/* Receipt document — this is what gets captured as PDF */}
      <div className={styles.receipt} ref={receiptRef} id="receipt-document">
        {/* Header */}
        <div className={styles.receiptHeader}>
          {tx.association.logoUrl ? (
            <img src={tx.association.logoUrl} alt="Logo" className={styles.logo} crossOrigin="anonymous" />
          ) : (
            <div className={styles.logoPlaceholder}>
              <span style={{ fontSize: 28 }}>🏦</span>
            </div>
          )}
          <div className={styles.assocInfo}>
            <h1 className={styles.assocName}>{tx.association.name}</h1>
            <p className={styles.receiptTitle}>REÇU DE TRANSACTION</p>
          </div>
        </div>

        <hr className={styles.divider} />

        {/* Reference & Status */}
        <div className={styles.refRow}>
          <div>
            <span className={styles.label}>Référence</span>
            <span className={styles.refCode}>{tx.reference}</span>
          </div>
          <div className={`${styles.statusBadge} ${styles[`status_${tx.status}`]}`}>
            {STATUS_LABELS[tx.status] ?? tx.status}
          </div>
        </div>

        <hr className={styles.divider} />

        {/* Transaction Details */}
        <table className={styles.detailsTable}>
          <tbody>
            <tr>
              <td className={styles.tdLabel}>Type d'opération</td>
              <td className={styles.tdValue}>{TYPE_LABELS[tx.type] ?? tx.type}</td>
            </tr>
            <tr>
              <td className={styles.tdLabel}>Caisse source</td>
              <td className={styles.tdValue}>
                {tx.caisse.name}{' '}
                <span className={styles.caisseType}>({tx.caisse.type.replace('_', ' ')})</span>
              </td>
            </tr>
            {tx.destinationCaisse && (
              <tr>
                <td className={styles.tdLabel}>Caisse destination</td>
                <td className={styles.tdValue}>
                  {tx.destinationCaisse.name}{' '}
                  <span className={styles.caisseType}>({tx.destinationCaisse.type.replace('_', ' ')})</span>
                </td>
              </tr>
            )}
            {memberName && (
              <tr>
                <td className={styles.tdLabel}>Membre concerné</td>
                <td className={styles.tdValue}>
                  {memberName}
                  {tx.member?.memberNumber ? ` — ${tx.member.memberNumber}` : ''}
                </td>
              </tr>
            )}
            {tx.description && (
              <tr>
                <td className={styles.tdLabel}>Motif / Description</td>
                <td className={styles.tdValue}>{tx.description}</td>
              </tr>
            )}
            <tr>
              <td className={styles.tdLabel}>Date & Heure</td>
              <td className={styles.tdValue}>{formattedDate}</td>
            </tr>
            {tx.createdBy && (
              <tr>
                <td className={styles.tdLabel}>Enregistré par</td>
                <td className={styles.tdValue}>{tx.createdBy.email}</td>
              </tr>
            )}
          </tbody>
        </table>

        <hr className={styles.divider} />

        {/* Amount */}
        <div className={styles.amountSection}>
          <span className={styles.amountLabel}>Montant</span>
          <span className={`${styles.amountValue} ${tx.type === 'WITHDRAWAL' ? styles.amountOut : styles.amountIn}`}>
            {tx.type === 'WITHDRAWAL' ? '−' : '+'}{tx.amount.toLocaleString('fr-FR')} XAF
          </span>
        </div>

        <hr className={styles.divider} />

        {/* Footer */}
        <div className={styles.receiptFooter}>
          <p>Ce reçu est généré automatiquement et fait foi de la transaction enregistrée.</p>
          <p className={styles.txId}>ID: {tx.id}</p>
        </div>
      </div>
    </div>
  );
}
