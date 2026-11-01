'use client';

import { PaymentTransaction } from '../types';
import { MOCK_RECENT_PAYMENTS } from '../data/mock-data';
import { LeaseService } from './lease-service';

const STORAGE_KEY_DECLARED = 'locagestion:declared_payments';
const STORAGE_KEY_VERIFIED = 'locagestion:verified_payments';

export const MONTHS_OF_YEAR = [
  'Janvier 2026',
  'Février 2026',
  'Mars 2026',
  'Avril 2026',
  'Mai 2026',
  'Juin 2026',
  'Juillet 2026',
  'Août 2026',
  'Septembre 2026',
  'Octobre 2026',
  'Novembre 2026',
  'Décembre 2026',
  'Janvier 2027',
  'Février 2027',
];

const INITIAL_DECLARED_PAYMENTS: PaymentTransaction[] = [
  {
    id: 'decl-initial-01',
    receiptNumber: 'DEC-2026-9842',
    tenantId: 'ten-01',
    tenantName: 'Koffi Mensah',
    tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    tenantPhone: '+229 97 12 34 56',
    propertyName: 'Résidence Les Cocotiers',
    unitNumber: 'Appt A3 (3 pièces)',
    amount: 220000,
    expectedAmount: 220000,
    period: 'Novembre 2026',
    paymentDate: '01/11/2026',
    method: 'wave',
    status: 'en_attente',
    isVerified: false,
    transactionRef: 'WAVE-BJ-984210',
    proofUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&auto=format&fit=crop&q=80',
    notes: 'Règlement du loyer de Novembre 2026 effectué via Wave Money',
  },
];

export const PaymentService = {
  /**
   * Récupère la liste des déclarations de paiement en attente ou traitées
   */
  getDeclaredPayments(): PaymentTransaction[] {
    if (typeof window === 'undefined') return INITIAL_DECLARED_PAYMENTS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DECLARED);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erreur lecture déclarations:', e);
    }
    // Initialiser le stockage avec la déclaration par défaut
    this.saveDeclaredPayments(INITIAL_DECLARED_PAYMENTS);
    return INITIAL_DECLARED_PAYMENTS;
  },

  /**
   * Récupère uniquement les paiements en attente de vérification
   */
  getPendingPayments(): PaymentTransaction[] {
    return this.getDeclaredPayments().filter((p) => !p.isVerified && p.status !== 'en_retard');
  },

  /**
   * Récupère la liste des paiements vérifiés et validés
   */
  getVerifiedPayments(): PaymentTransaction[] {
    if (typeof window === 'undefined') return MOCK_RECENT_PAYMENTS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VERIFIED);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Erreur lecture paiements vérifiés:', e);
    }
    return MOCK_RECENT_PAYMENTS;
  },

  /**
   * Sauvegarde les déclarations de paiement
   */
  saveDeclaredPayments(payments: PaymentTransaction[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_DECLARED, JSON.stringify(payments));
      window.dispatchEvent(new CustomEvent('locagestion:payments_updated'));
    } catch (e) {
      console.error('Erreur sauvegarde déclarations:', e);
    }
  },

  /**
   * Sauvegarde les paiements vérifiés
   */
  saveVerifiedPayments(payments: PaymentTransaction[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_VERIFIED, JSON.stringify(payments));
      window.dispatchEvent(new CustomEvent('locagestion:payments_updated'));
    } catch (e) {
      console.error('Erreur sauvegarde paiements vérifiés:', e);
    }
  },

  /**
   * Action : Le bailleur vérifie et valide (ou rejette) un paiement
   */
  verifyPayment(
    paymentId: string,
    options: {
      period: string; // Mois sélectionné par le bailleur
      approved: boolean;
      rejectionReason?: string;
    }
  ): {
    success: boolean;
    payment?: PaymentTransaction;
    receiptNumber?: string;
  } {
    const declared = this.getDeclaredPayments();
    const index = declared.findIndex((p) => p.id === paymentId);

    if (index === -1) {
      return { success: false };
    }

    const current = declared[index];
    const receiptNum = `QUITT-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    if (options.approved) {
      const verifiedTx: PaymentTransaction = {
        ...current,
        isVerified: true,
        status: 'paye',
        period: options.period, // Mois concerné sélectionné
        receiptNumber: receiptNum,
        paymentDate: new Date().toLocaleDateString('fr-FR'),
        notes: `Validé par le bailleur pour le mois de ${options.period}`,
      };

      // Mettre à jour dans les déclarations
      declared[index] = verifiedTx;
      this.saveDeclaredPayments(declared);

      // Ajouter en tête des paiements vérifiés officiels
      const verified = this.getVerifiedPayments();
      const updatedVerified = [verifiedTx, ...verified.filter((p) => p.id !== paymentId)];
      this.saveVerifiedPayments(updatedVerified);

      // Marquer la notification du bailleur comme lue
      LeaseService.markNotificationsAsRead();

      return {
        success: true,
        payment: verifiedTx,
        receiptNumber: receiptNum,
      };
    } else {
      // Paiement rejeté
      const rejectedTx: PaymentTransaction = {
        ...current,
        isVerified: false,
        status: 'en_retard',
        notes: options.rejectionReason || 'Paiement non reçu ou rejeté par le bailleur',
      };

      declared[index] = rejectedTx;
      this.saveDeclaredPayments(declared);

      return {
        success: false,
        payment: rejectedTx,
      };
    }
  },

  /**
   * Ajoute une nouvelle déclaration de paiement faite par le locataire
   */
  addDeclaredPayment(payment: PaymentTransaction): void {
    const current = this.getDeclaredPayments();
    const updated = [payment, ...current.filter((p) => p.id !== payment.id)];
    this.saveDeclaredPayments(updated);
  },
};

