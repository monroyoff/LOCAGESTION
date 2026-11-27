'use client';

import { PaymentTransaction } from '../types';
import { PaymentService } from './payment-service';
import { LeaseService, Lease } from './lease-service';

export interface LandlordPayoutRecord {
  id: string; // Ex: 'payout-pay-feda-114409497'
  paymentId: string;
  receiptNumber: string;
  leaseId?: string;
  unitNumber: string;
  propertyName: string;
  tenantName: string;
  tenantPhone: string;
  landlordName: string;
  landlordId?: string;
  landlordPhone: string;
  landlordPaymentInfo: {
    wave?: string;
    mtn?: string;
    moov?: string;
    bank?: string;
  };
  totalCollected: number; // Montant brut encaissé sur FedaPay (ex: 25 000 FCFA)
  platformCommission: number; // Commission 2% conservée par LOCAGESTION (ex: 500 FCFA)
  netPayoutAmount: number; // 98% net dû au bailleur (ex: 24 500 FCFA)
  paymentDate: string; // Date encaissement locataire
  period: string; // ex: "Novembre 2026"
  status: 'en_attente' | 'reverse';
  disbursedAt?: string; // Date et heure de reversement (ex: "27/11/2026 17:30")
  disbursementMethod?: 'wave' | 'mtn' | 'moov' | 'virement' | 'autre';
  disbursementRef?: string; // Réf transfert opérateur (ex: "TRX-WAVE-89214")
  disbursedBy?: string; // Auteur de la validation (ex: "Super-Admin")
  notes?: string;
}

export interface PayoutStats {
  totalCollected: number;
  totalCommissions: number;
  totalDisbursed: number;
  totalPending: number;
  pendingCount: number;
  completedCount: number;
}

const STORAGE_KEY_PAYOUTS = 'locagestion:landlord_payout_records';

export const PayoutService = {
  /**
   * Récupère tous les enregistrements de reversements bailleurs (calculés à partir des encaissements FedaPay)
   */
  getPayouts(): LandlordPayoutRecord[] {
    if (typeof window === 'undefined') return [];

    let storedOverrides: Record<string, Partial<LandlordPayoutRecord>> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PAYOUTS);
      if (raw) {
        storedOverrides = JSON.parse(raw);
      }
    } catch (e) {
      console.error('Erreur lecture overrides payouts:', e);
    }

    // Récupérer toutes les transactions réelles
    const verified = PaymentService.getVerifiedPayments();
    const declared = PaymentService.getDeclaredPayments();
    const allPayments = [...verified, ...declared];

    // Dédoublonnage
    const paymentsMap = new Map<string, PaymentTransaction>();
    allPayments.forEach((p) => {
      if (p && p.id && !paymentsMap.has(p.id)) {
        paymentsMap.set(p.id, p);
      }
    });

    const leases = LeaseService.getLeases();

    // Filtrer les paiements éligibles aux reversements (FedaPay / Paiements en ligne centralisés)
    // Tout paiement direct FedaPay (pay-feda-) ou transaction en ligne avec note FedaPay
    const fedaPayments = Array.from(paymentsMap.values()).filter((p) => {
      const isFeda =
        p.id.startsWith('pay-feda-') ||
        (p.notes && p.notes.toLowerCase().includes('fedapay')) ||
        (p.transactionRef && p.transactionRef.startsWith('trx_'));
      return isFeda && p.status === 'paye';
    });

    // Si aucun paiement FedaPay spécifique n'est trouvé, intégrer par défaut pour la démo / supervision
    // les paiements de référence afin que l'admin dispose immédiatement d'une vue active
    const candidatePayments = fedaPayments.length > 0 ? fedaPayments : Array.from(paymentsMap.values()).slice(0, 2);

    const records: LandlordPayoutRecord[] = candidatePayments.map((p) => {
      const targetLease = leases.find((l) => l.id === p.leaseId);
      const landlord = targetLease?.landlordName || p.landlordName || 'VOGLOSSOU JOHANE';
      const landlordPhone = targetLease?.landlordPhone || p.landlordPhone || '+229 01 95 44 44 30';
      const landlordPaymentMethods = targetLease?.landlordPaymentMethods || {
        wave: landlordPhone,
        mtn: landlordPhone,
        moov: landlordPhone,
        bank: 'BJ061 01001 001234567890 45 (BOA Bénin)',
      };

      const gross = Math.max(0, p.amount || 0);
      const commission = Math.round(gross * 0.02);
      const net = Math.max(0, gross - commission);

      const payoutId = `payout-${p.id}`;
      const override = storedOverrides[payoutId] || {};

      return {
        id: payoutId,
        paymentId: p.id,
        receiptNumber: p.receiptNumber || `QUITT-${p.id}`,
        leaseId: p.leaseId || targetLease?.id || 'BAIL-2026-421',
        unitNumber: p.unitNumber || targetLease?.unit || 'Logement',
        propertyName: p.propertyName || targetLease?.property || 'Résidence',
        tenantName: p.tenantName || 'Locataire',
        tenantPhone: p.tenantPhone || '',
        landlordName: landlord,
        landlordId: targetLease?.landlordId || p.landlordId || 'usr-bailleur-voglossou',
        landlordPhone,
        landlordPaymentInfo: landlordPaymentMethods,
        totalCollected: gross,
        platformCommission: commission,
        netPayoutAmount: net,
        paymentDate: p.paymentDate || '26/11/2026',
        period: p.period || 'Novembre 2026',
        status: (override.status as 'en_attente' | 'reverse') || 'en_attente',
        disbursedAt: override.disbursedAt,
        disbursementMethod: override.disbursementMethod,
        disbursementRef: override.disbursementRef,
        disbursedBy: override.disbursedBy,
        notes: override.notes,
      };
    });

    return records.sort((a, b) => {
      // Les reversements en attente en premier
      if (a.status === 'en_attente' && b.status === 'reverse') return -1;
      if (a.status === 'reverse' && b.status === 'en_attente') return 1;
      return b.id.localeCompare(a.id);
    });
  },

  /**
   * Marque un reversement comme exécuté par l'administrateur
   */
  markPayoutAsDisbursed(
    payoutId: string,
    details: {
      method: 'wave' | 'mtn' | 'moov' | 'virement' | 'autre';
      reference: string;
      notes?: string;
      disbursedBy?: string;
    }
  ): LandlordPayoutRecord | null {
    if (typeof window === 'undefined') return null;

    let storedOverrides: Record<string, Partial<LandlordPayoutRecord>> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PAYOUTS);
      if (raw) storedOverrides = JSON.parse(raw);
    } catch (e) {}

    const nowFormatted = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    storedOverrides[payoutId] = {
      status: 'reverse',
      disbursedAt: nowFormatted,
      disbursementMethod: details.method,
      disbursementRef: details.reference.trim(),
      disbursedBy: details.disbursedBy || 'Super-Admin MONROY AG',
      notes: details.notes?.trim() || '',
    };

    try {
      localStorage.setItem(STORAGE_KEY_PAYOUTS, JSON.stringify(storedOverrides));
    } catch (e) {
      console.error('Erreur sauvegarde payout:', e);
    }

    const all = this.getPayouts();
    const updated = all.find((p) => p.id === payoutId) || null;

    if (updated) {
      // Émettre une notification officielle au bailleur
      try {
        const nowIso = new Date().toISOString();
        const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        LeaseService.addLandlordNotification({
          id: `notif-payout-${Date.now()}`,
          title: '💸 Reversement de loyer effectué (98 %)',
          message: `Le reversement net de ${updated.netPayoutAmount.toLocaleString('fr-FR')} FCFA pour votre logement ${updated.unitNumber} (${updated.tenantName}) a été viré avec succès par l'administration LOCAGESTION via ${details.method.toUpperCase()} (Réf : ${details.reference}).`,
          createdAt: nowIso,
          time: timeStr,
          timestamp: nowFormatted,
          type: 'payout_disbursed',
          read: false,
          leaseId: updated.leaseId,
          tenantName: updated.tenantName,
          unit: updated.unitNumber,
          property: updated.propertyName,
        });
      } catch (err) {
        console.error('Erreur notification bailleur payout:', err);
      }
    }

    // Déclencher événement de synchronisation
    try {
      window.dispatchEvent(new CustomEvent('locagestion:payouts_updated'));
    } catch (e) {}

    return updated;
  },

  /**
   * Repasser un reversement en attente
   */
  revertPayout(payoutId: string): boolean {
    if (typeof window === 'undefined') return false;

    try {
      const raw = localStorage.getItem(STORAGE_KEY_PAYOUTS);
      if (raw) {
        const storedOverrides = JSON.parse(raw);
        delete storedOverrides[payoutId];
        localStorage.setItem(STORAGE_KEY_PAYOUTS, JSON.stringify(storedOverrides));
        window.dispatchEvent(new CustomEvent('locagestion:payouts_updated'));
        return true;
      }
    } catch (e) {}
    return false;
  },

  /**
   * Calcule les métriques globales de reversements
   */
  getPayoutStats(): PayoutStats {
    const payouts = this.getPayouts();
    let totalCollected = 0;
    let totalCommissions = 0;
    let totalDisbursed = 0;
    let totalPending = 0;
    let pendingCount = 0;
    let completedCount = 0;

    payouts.forEach((p) => {
      totalCollected += p.totalCollected;
      totalCommissions += p.platformCommission;
      if (p.status === 'reverse') {
        totalDisbursed += p.netPayoutAmount;
        completedCount++;
      } else {
        totalPending += p.netPayoutAmount;
        pendingCount++;
      }
    });

    return {
      totalCollected,
      totalCommissions,
      totalDisbursed,
      totalPending,
      pendingCount,
      completedCount,
    };
  },
};
