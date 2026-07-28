'use client';

import React, { useEffect, useState, useRef } from 'react';
import styles from './receipt-modal.module.css';

interface ReceiptModalProps {
  transactionId: string;
  tenantSlug: string;
  onClose: () => void;
  autoDownload?: boolean;
}

interface TransactionData {
  id: string;
  reference: string;
  type: string;
  amount: number;
  description: string | null;
  status: string;
  createdAt: string;
  caisse: { id: string; name: string; type: string };
  destinationCaisse?: { id: string; name: string; type: string } | null;
  member?: {
    memberNumber: string;
    user?: { email: string; phone?: string | null };
    profile?: { firstName: string; lastName: string } | null;
  } | null;
  createdBy?: { email: string } | null;
  association: { id: string; name: string; slug: string; logoUrl: string | null };
}

const TYPE_LABELS: Record<string, string> = {
  DEPOSIT: 'Dépôt / Versement',
  WITHDRAWAL: 'Retrait / Décaissement',
  TRANSFER: 'Transfert entre caisses',
};

export default function ReceiptModal({
  transactionId,
  tenantSlug,
  onClose,
  autoDownload = true,
}: ReceiptModalProps) {
  const [tx, setTx] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!tenantSlug || !transactionId) return;
    setLoading(true);
    fetch(`/api/backend/associations/${tenantSlug}/treasury/transactions/${transactionId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Transaction introuvable');
        return res.json();
      })
      .then((data) => {
        setTx(data);
        if (autoDownload) {
          setTimeout(() => {
            downloadPdf(data);
          }, 400);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [tenantSlug, transactionId]);

  const downloadPdf = async (data = tx) => {
    if (!receiptRef.current || !data) return;
    setDownloading(true);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#e0dbdbff',
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

      const filename = `recu-${data.reference}-${data.association.slug}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const memberName = tx?.member?.profile
    ? `${tx.member.profile.firstName} ${tx.member.profile.lastName}`.trim()
    : tx?.member?.user?.email ?? null;

  const formattedDate = tx
    ? new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'full',
        timeStyle: 'short',
      }).format(new Date(tx.createdAt))
    : '';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Reçu Officiel #{tx?.reference || '...'}</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            &times;
          </button>
        </div>

        <div className={styles.body}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>Chargement du reçu...</div>
          ) : error || !tx ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#ef4444' }}>{error || 'Reçu introuvable.'}</div>
          ) : (
            <div className={styles.receiptDoc} ref={receiptRef}>
              <div className={styles.receiptHeader}>
                {tx.association.logoUrl ? (
                  <img src={tx.association.logoUrl} alt="Logo" className={styles.logo} crossOrigin="anonymous" />
                ) : (
                  <div className={styles.logoPlaceholder}>
                    <span style={{ fontSize: 24 }}>🏦</span>
                  </div>
                )}
                <div>
                  <h3 className={styles.assocName}>{tx.association.name}</h3>
                  <p className={styles.receiptTitle}>REÇU D'OPÉRATION COMPTABLE</p>
                </div>
              </div>

              <hr className={styles.divider} />

              <div className={styles.refRow}>
                <div>
                  <span className={styles.refLabel}>Référence</span>
                  <span className={styles.refCode}>{tx.reference}</span>
                </div>
                <div className={styles.statusBadge}>CONFIRMÉE</div>
              </div>

              <hr className={styles.divider} />

              <table className={styles.detailsTable}>
                <tbody>
                  <tr>
                    <td className={styles.tdLabel}>Type d'opération</td>
                    <td className={styles.tdValue}>{TYPE_LABELS[tx.type] ?? tx.type}</td>
                  </tr>
                  <tr>
                    <td className={styles.tdLabel}>Caisse concernée</td>
                    <td className={styles.tdValue}>{tx.caisse.name}</td>
                  </tr>
                  {tx.destinationCaisse && (
                    <tr>
                      <td className={styles.tdLabel}>Caisse destination</td>
                      <td className={styles.tdValue}>{tx.destinationCaisse.name}</td>
                    </tr>
                  )}
                  {memberName && (
                    <tr>
                      <td className={styles.tdLabel}>Membre concerné</td>
                      <td className={styles.tdValue}>{memberName}</td>
                    </tr>
                  )}
                  {tx.description && (
                    <tr>
                      <td className={styles.tdLabel}>Motif / Libellé</td>
                      <td className={styles.tdValue}>{tx.description}</td>
                    </tr>
                  )}
                  <tr>
                    <td className={styles.tdLabel}>Date & Heure</td>
                    <td className={styles.tdValue}>{formattedDate}</td>
                  </tr>
                </tbody>
              </table>

              <hr className={styles.divider} />

              <div className={styles.amountSection}>
                <span className={styles.amountLabel}>Montant Net</span>
                <span className={styles.amountValue}>
                  {tx.type === 'WITHDRAWAL' ? '−' : '+'}{tx.amount.toLocaleString('fr-FR')} XAF
                </span>
              </div>

              <div className={styles.receiptFooter}>
                <p>Ce reçu généré automatiquement fait foi de l'écriture comptable enregistrée.</p>
              </div>
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.dismissBtn} onClick={onClose}>
            Fermer
          </button>
          {tx && (
            <button className={styles.downloadBtn} onClick={() => downloadPdf(tx)} disabled={downloading}>
              <span className="material-symbols-rounded">download</span>
              {downloading ? 'Téléchargement...' : 'Télécharger le Reçu PDF'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
