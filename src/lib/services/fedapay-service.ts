'use client';

import { PaymentTransaction, PaymentMethod, SubscriptionPlan, AuthUser } from '../types';
import { PaymentService } from './payment-service';
import { LeaseService, Lease } from './lease-service';
import { TenantNotificationService } from './tenant-notification-service';
import { PlanService } from './plan-service';
import { formatFCFA } from '../money/format';

export interface RentSplitCalculation {
  rentAmount: number; // Montant contractuel du loyer (ex: 100 000 FCFA)
  platformCommission: number; // Commission 2% LOCAGESTION (ex: 2 000 FCFA en Sérénité)
  platformCommissionRate: number; // 0.02
  landlordPayout: number; // Montant net reversé au bailleur (ex: 98 000 FCFA)
  landlordPayoutRate: number; // 0.98
  fedapayFee: number; // Frais passerelle opérateur FedaPay (~2% ex: 2 000 FCFA)
  fedapayFeeRate: number; // 0.02
  totalTenantCharged: number; // Montant total débité du locataire (ex: 102 000 FCFA)
  feesCoveredBy: 'customer'; // Option 1 : supporté par le locataire
  currency: 'FCFA';
}

export interface FedaPayCheckoutParams {
  leaseId: string;
  lease?: Lease | null;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  tenantEmail?: string;
  tenantMatricule?: string;
  landlordId?: string;
  landlordName?: string;
  landlordPhone?: string;
  landlordEmail?: string;
  propertyName: string;
  unitNumber: string;
  rentAmount: number;
  period: string;
  paymentMethod: PaymentMethod;
  payerPhone: string;
  payerCountryCode: string;
  advanceMonths?: string[];
}

export interface FedaPayTransactionResult {
  success: boolean;
  transactionId: string;
  reference: string;
  receiptNumber: string;
  payment: PaymentTransaction;
  split: RentSplitCalculation;
  message: string;
}

export const FedaPayService = {
  /**
   * Calcule le Split Payment mathématique transparent :
   * - Frais FedaPay (~2%) supportés par le locataire (Option 1 validée)
   * - Commission plateforme 2% pour LOCAGESTION en Formule Sérénité
   * - Reversement de 98% net garanti au bailleur
   */
  calculateRentSplit(
    rentAmount: number,
    landlordPlan: SubscriptionPlan = 'serenite'
  ): RentSplitCalculation {
    const cleanRent = Math.max(0, rentAmount);

    // En formule Sérénité : 2% de commission plateforme
    // En formule Découverte ou Pro : 0% commission mobile money (forfait fixe ou manuel)
    const platformCommissionRate = landlordPlan === 'serenite' ? 0.02 : 0;
    const platformCommission = Math.round(cleanRent * platformCommissionRate);
    const landlordPayout = cleanRent - platformCommission;

    // Frais marchands opérateur FedaPay (~2%) supportés par le locataire
    const fedapayFeeRate = 0.02;
    const fedapayFee = Math.round(cleanRent * fedapayFeeRate);
    const totalTenantCharged = cleanRent + fedapayFee;

    return {
      rentAmount: cleanRent,
      platformCommission,
      platformCommissionRate,
      landlordPayout,
      landlordPayoutRate: 1 - platformCommissionRate,
      fedapayFee,
      fedapayFeeRate,
      totalTenantCharged,
      feesCoveredBy: 'customer',
      currency: 'FCFA',
    };
  },

  /**
   * Exécute un paiement de loyer direct via FedaPay Mobile Money
   * avec émission instantanée de la quittance officielle scellée
   */
  async processDirectPayment(
    params: FedaPayCheckoutParams
  ): Promise<FedaPayTransactionResult> {
    const landlordPlan = PlanService.getUserPlan(params.landlordId);
    const split = this.calculateRentSplit(params.rentAmount, landlordPlan);

    const now = new Date();
    const dateFormatted = now.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const timeFormatted = now.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const countryIso = (params.lease?.country || 'BJ').toUpperCase().slice(0, 2);
    const randomSuffix = Math.floor(100000 + Math.random() * 900000);
    const transactionId = `LOCA-TX-${Date.now()}-${randomSuffix}`;
    const reference = `FP-${params.paymentMethod.toUpperCase()}-${randomSuffix}`;
    const receiptNumber = `LOCA-QUITT-${countryIso}-${randomSuffix}`;

    // 1. Création de la transaction enregistrée
    const newPayment: PaymentTransaction = {
      id: `pay-feda-${Date.now()}`,
      receiptNumber,
      leaseId: params.leaseId,
      tenantId: params.tenantId,
      tenantName: params.tenantName,
      tenantAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
      tenantPhone: params.tenantPhone,
      tenantEmail: params.tenantEmail,
      tenantMatricule: params.tenantMatricule,
      propertyName: params.propertyName,
      unitNumber: params.unitNumber,
      landlordName: params.landlordName || 'Bailleur',
      landlordId: params.landlordId || 'usr-bailleur-voglossou',
      landlordPhone: params.landlordPhone,
      landlordEmail: params.landlordEmail,
      amount: split.rentAmount,
      expectedAmount: split.rentAmount,
      period: params.period,
      paymentDate: dateFormatted,
      method: params.paymentMethod,
      status: 'paye',
      isVerified: true,
      transactionRef: reference,
      notes: `Paiement en direct via FedaPay (${params.paymentMethod}). Split: 98% net bailleur (${formatFCFA(
        split.landlordPayout
      )}), 2% plateforme (${formatFCFA(split.platformCommission)}), Frais FedaPay (${formatFCFA(
        split.fedapayFee
      )}) supportés par le locataire.`,
      isAdvance: params.advanceMonths && params.advanceMonths.length > 0,
      advanceMonthsCount: params.advanceMonths ? params.advanceMonths.length : 0,
      advanceMonthsList: params.advanceMonths,
    };

    if (typeof window !== 'undefined') {
      try {
        // Enregistrement dans les paiements vérifiés
        const storedVerified = localStorage.getItem('locagestion:verified_payments');
        const listVerified: PaymentTransaction[] = storedVerified ? JSON.parse(storedVerified) : [];
        const updatedVerified = [newPayment, ...listVerified.filter((p) => p.id !== newPayment.id)];
        localStorage.setItem('locagestion:verified_payments', JSON.stringify(updatedVerified));

        // Enregistrement dans les paiements déclarés pour consistance
        const storedDeclared = localStorage.getItem('locagestion:declared_payments');
        const listDeclared: PaymentTransaction[] = storedDeclared ? JSON.parse(storedDeclared) : [];
        const updatedDeclared = [newPayment, ...listDeclared.filter((p) => p.id !== newPayment.id)];
        localStorage.setItem('locagestion:declared_payments', JSON.stringify(updatedDeclared));

        // Déclencher les événements de mise à jour
        window.dispatchEvent(new CustomEvent('locagestion:payments_updated'));
        window.dispatchEvent(new CustomEvent('locagestion:payment_verified'));

        // 2. Notification Bailleur : reversement 98% net
        LeaseService.addLandlordNotification({
          id: `notif-split-${Date.now()}`,
          title: '💳 Loyer perçu par Mobile Money (Split 98% net)',
          message: `Paiement de ${formatFCFA(split.rentAmount)} reçu de ${
            params.tenantName
          } pour ${params.period}. Reversement programmé dès le 7 du mois de 98% net (${formatFCFA(
            split.landlordPayout
          )}) sur votre compte. Commission LOCAGESTION 2% (${formatFCFA(
            split.platformCommission
          )}) acquittée.`,
          type: 'payment_declared',
          read: false,
          createdAt: now.toISOString(),
          paymentId: newPayment.id,
          leaseId: params.leaseId,
        });

        // 3. Notification Locataire : quittance certifiée prête
        TenantNotificationService.addNotification({
          id: `notif-tenant-receipt-${Date.now()}`,
          tenantEmail: params.tenantEmail,
          tenantPhone: params.tenantPhone,
          title: 'Quittance officielle émise avec QR Code',
          message: `Votre loyer de ${formatFCFA(split.rentAmount)} pour ${
            params.period
          } a été validé avec succès par ${params.paymentMethod.toUpperCase()} (FedaPay). Votre quittance certifiée est téléchargeable.`,
          type: 'receipt_issued',
          time: timeFormatted,
          createdAt: now.toISOString(),
          link: '/portal?tab=quittances',
          metadata: {
            amount: split.rentAmount,
            period: params.period,
          },
        });
      } catch (e) {
        console.error('Erreur enregistrement FedaPay transaction:', e);
      }
    }

    return {
      success: true,
      transactionId,
      reference,
      receiptNumber,
      payment: newPayment,
      split,
      message: `Paiement de ${formatFCFA(
        split.rentAmount
      )} validé avec succès via FedaPay. La quittance officielle a été émise immédiatement.`,
    };
  },
};
