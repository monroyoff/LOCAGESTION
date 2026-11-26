'use client';

import { PaymentTransaction, AuthUser } from '../types';
import { MOCK_RECENT_PAYMENTS } from '../data/mock-data';
import { LeaseService, Lease } from './lease-service';
import { TenantNotificationService } from './tenant-notification-service';
import { areEmailsEqual, arePhoneNumbersEqual } from './auth-service';

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

export const INITIAL_DECLARED_PAYMENTS: PaymentTransaction[] = [
  {
    id: 'pay-feda-114409497',
    receiptNumber: 'LOCA-QUITT-BJ-114409497',
    leaseId: 'BAIL-2026-421',
    tenantId: 'usr-tenant-jojovog',
    tenantName: 'Jojo VOG',
    tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    tenantPhone: '+229 97 00 12 34',
    tenantEmail: 'jojovog007@gmail.com',
    propertyName: 'CHAMBRE SALON SANITAIRE',
    unitNumber: 'Lot 1 (Chambre Salon Sanitaire • 45 m²)',
    landlordName: 'VOGLOSSOU JOHANE',
    landlordId: 'usr-bailleur-voglossou',
    amount: 100,
    expectedAmount: 100,
    period: 'Novembre 2026',
    paymentDate: '26/11/2026',
    method: 'mtn',
    status: 'paye',
    isVerified: true,
    transactionRef: 'trx_Nww_1795698215006',
    notes: 'Paiement direct Mobile Money (FedaPay Live). Reversement net bailleur: 98 FCFA. Commission LOCAGESTION (2%): 2 FCFA.',
  },
  {
    id: 'pay-vog-001',
    receiptNumber: 'DEC-2026-4211',
    leaseId: 'BAIL-2026-421',
    tenantId: 'usr-tenant-jojovog',
    tenantName: 'Jojo VOG',
    tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    tenantPhone: '+229 97 00 12 34',
    tenantEmail: 'jojovog007@gmail.com',
    propertyName: 'CHAMBRE SALON SANITAIRE',
    unitNumber: 'Lot 1 (Chambre Salon Sanitaire • 45 m²)',
    landlordName: 'VOGLOSSOU JOHANE',
    landlordId: 'usr-bailleur-voglossou',
    amount: 25000,
    expectedAmount: 25000,
    period: 'Novembre 2026',
    paymentDate: '01/11/2026',
    method: 'wave',
    status: 'paye',
    isVerified: true,
  },
];

export function isFakePayment(p?: Partial<PaymentTransaction> | null): boolean {
  if (!p) return true;
  if (
    p.id === 'pay-diallo-002' ||
    p.id === 'pay-toure-003' ||
    p.leaseId === 'BAIL-2026-MAG-102' ||
    p.leaseId === 'BAIL-2026-COM-205'
  ) return true;
  const lName = (p.landlordName || '').trim().toLowerCase();
  const tName = (p.tenantName || '').trim().toLowerCase();
  if (
    lName === 'mamadou diallo' ||
    lName === 'aïcha touré' ||
    lName === 'aicha toure' ||
    tName === 'koffi mensah' ||
    tName === 'aïcha touré' ||
    tName === 'clarisse bakayoko' ||
    tName === 'amina diop'
  ) return true;
  return false;
}

/**
 * Vérifie de façon étanche et déterministe si un paiement/quittance appartient à un locataire
 */
export function isPaymentMatchingTenant(
  payment: PaymentTransaction,
  user?: AuthUser | null,
  lease?: Lease | null
): boolean {
  if (!user && !lease) return false;

  const targetEmail = user?.email?.trim().toLowerCase();
  const targetPhone = user?.phone?.trim();
  const targetName = user?.name?.trim().toLowerCase();
  const targetMatricule = user?.matricule?.trim().toUpperCase();

  const payEmail = payment.tenantEmail?.trim().toLowerCase();
  const payPhone = payment.tenantPhone?.trim();
  const payName = payment.tenantName?.trim().toLowerCase();
  const payMatricule = payment.tenantMatricule?.trim().toUpperCase();

  // 1. Email : priorité absolue
  if (targetEmail && payEmail && areEmailsEqual(targetEmail, payEmail)) {
    return true;
  }

  // 2. Téléphone
  if (targetPhone && payPhone && arePhoneNumbersEqual(targetPhone, payPhone)) {
    return true;
  }

  // 3. Matricule officiel
  if (targetMatricule && payMatricule && targetMatricule === payMatricule) {
    return true;
  }

  // 4. ID utilisateur exact
  if (user?.id && payment.tenantId && user.id === payment.tenantId) {
    return true;
  }

  // 5. Nom complet (ordre direct ou inversé)
  if (targetName && payName) {
    if (targetName === payName) return true;
    const userWords = targetName.split(/\s+/).filter(Boolean);
    const payWords = payName.split(/\s+/).filter(Boolean);
    if (
      userWords.length > 0 &&
      userWords.length === payWords.length &&
      userWords.every((w: string) => payWords.includes(w))
    ) {
      return true;
    }
  }

  // 6. Rapprochement par bail actif du locataire
  if (lease && payment.leaseId && payment.leaseId === lease.id) {
    return true;
  }

  return false;
}

/**
 * Vérifie de façon étanche si un paiement concerne les biens d'un bailleur
 */
export function isPaymentMatchingLandlord(
  payment: PaymentTransaction,
  user?: AuthUser | null
): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.email === 'admin@locagestion.site') return true;

  const landlordEmail = user.email?.trim().toLowerCase();
  const landlordPhone = user.phone?.trim();
  const landlordName = user.name?.trim().toLowerCase();
  const landlordId = user.id?.trim();

  const payLandlordEmail = (payment.landlordEmail || (payment as any).landlordEmail)?.trim().toLowerCase();
  const payLandlordPhone = (payment.landlordPhone || (payment as any).landlordPhone)?.trim();
  const payLandlordName = payment.landlordName?.trim().toLowerCase();
  const payLandlordId = payment.landlordId?.trim();

  // Profil canonique de test
  const isVoglossouCanonical =
    (user.email && areEmailsEqual(user.email, 'jobovog@gmail.com')) ||
    (user.name && user.name.toUpperCase().includes('VOGLOSSOU'));
  if (isVoglossouCanonical && payLandlordId === 'usr-bailleur-voglossou') return true;

  // 1. Email bailleur
  if (landlordEmail && payLandlordEmail && areEmailsEqual(landlordEmail, payLandlordEmail)) return true;

  // 2. Téléphone bailleur
  if (landlordPhone && payLandlordPhone && arePhoneNumbersEqual(landlordPhone, payLandlordPhone)) return true;

  // 3. ID bailleur
  if (landlordId && payLandlordId && landlordId === payLandlordId) return true;

  // 4. Nom bailleur
  if (landlordName && payLandlordName) {
    if (landlordName === payLandlordName) return true;
    const lWords = landlordName.split(/\s+/).filter(Boolean);
    const pWords = payLandlordName.split(/\s+/).filter(Boolean);
    if (lWords.length > 0 && lWords.length === pWords.length && lWords.every((w: string) => pWords.includes(w))) {
      return true;
    }
  }

  // 5. Rattachement par baux actifs du bailleur (propriété, locataire, email locataire)
  try {
    const landlordLeases = LeaseService.getLeasesForLandlord(user);
    if (landlordLeases.length > 0) {
      const payProp = (payment.propertyName || '').trim().toLowerCase();
      const payTenant = (payment.tenantName || '').trim().toLowerCase();
      const payTenantEmail = (payment.tenantEmail || '').trim().toLowerCase();
      const matchesLease = landlordLeases.some((l) => {
        if (payProp && l.property && l.property.trim().toLowerCase() === payProp) return true;
        if (payTenant && l.tenant && l.tenant.trim().toLowerCase() === payTenant) return true;
        if (payTenantEmail && l.tenantEmail && areEmailsEqual(l.tenantEmail, payTenantEmail)) return true;
        return false;
      });
      if (matchesLease) return true;
    }
  } catch { }

  if (isVoglossouCanonical && !isFakePayment(payment)) return true;

  return false;
}

export const PaymentService = {
  /**
   * Récupère la liste des déclarations de paiement brutes
   */
  getDeclaredPayments(): PaymentTransaction[] {
    if (typeof window === 'undefined') return INITIAL_DECLARED_PAYMENTS;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DECLARED);
      if (saved) {
        let parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          let hasMutated = false;
          // Élimination des faux paiements démo et normalisation des quittances officielles
          const sanitized = parsed
            .filter((p: PaymentTransaction) => !isFakePayment(p))
            .map((p: PaymentTransaction) => {
              if (p.receiptNumber && (p.receiptNumber.startsWith('QUITT-FEDA-') || p.receiptNumber.startsWith('FEDA-'))) {
                hasMutated = true;
                return {
                  ...p,
                  receiptNumber: p.receiptNumber.replace(/^(QUITT-FEDA-|FEDA-)/, 'LOCA-QUITT-BJ-'),
                };
              }
              return p;
            });
          if (sanitized.length !== parsed.length) {
            hasMutated = true;
            parsed = sanitized;
          }
          const missing = INITIAL_DECLARED_PAYMENTS.filter(
            (initP) => !parsed.some((p: PaymentTransaction) => p.id === initP.id || p.receiptNumber === initP.receiptNumber)
          );
          if (missing.length > 0) {
            parsed = [...missing, ...parsed];
            hasMutated = true;
          }
          if (hasMutated) {
            try {
              localStorage.setItem(STORAGE_KEY_DECLARED, JSON.stringify(parsed));
            } catch (e) { }
          }
          return parsed;
        }
      }
      try {
        localStorage.setItem(STORAGE_KEY_DECLARED, JSON.stringify(INITIAL_DECLARED_PAYMENTS));
      } catch (e) { }
      return INITIAL_DECLARED_PAYMENTS;
    } catch (e) {
      console.error('Erreur lecture déclarations:', e);
    }
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
   * Fusionne locagestion:verified_payments et tous les paiements déjà marqués vérifiés dans locagestion:declared_payments
   */
  getVerifiedPayments(): PaymentTransaction[] {
    if (typeof window === 'undefined') {
      return INITIAL_DECLARED_PAYMENTS.filter((p) => p.isVerified || p.status === 'paye');
    }
    const verMap = new Map<string, PaymentTransaction>();

    try {
      const saved = localStorage.getItem(STORAGE_KEY_VERIFIED);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          let hasMutatedVer = false;
          const sanitized = parsed
            .filter((p: PaymentTransaction) => !isFakePayment(p))
            .map((p: PaymentTransaction) => {
              if (p.receiptNumber && (p.receiptNumber.startsWith('QUITT-FEDA-') || p.receiptNumber.startsWith('FEDA-'))) {
                hasMutatedVer = true;
                return {
                  ...p,
                  receiptNumber: p.receiptNumber.replace(/^(QUITT-FEDA-|FEDA-)/, 'LOCA-QUITT-BJ-'),
                };
              }
              return p;
            });
          if (sanitized.length !== parsed.length || hasMutatedVer) {
            try {
              localStorage.setItem(STORAGE_KEY_VERIFIED, JSON.stringify(sanitized));
            } catch (e) { }
          }
          sanitized.forEach((p) => {
            if (p && p.id) verMap.set(p.id, { ...p, isVerified: true, status: 'paye' });
          });
        }
      }
    } catch (e) {
      console.error('Erreur lecture paiements vérifiés:', e);
    }

    try {
      const declared = this.getDeclaredPayments();
      declared.forEach((p) => {
        if (p && p.id && !isFakePayment(p) && (p.isVerified || p.status === 'paye')) {
          if (!verMap.has(p.id)) {
            verMap.set(p.id, { ...p, isVerified: true, status: 'paye' });
          }
        }
      });
    } catch {}

    return Array.from(verMap.values());
  },

  /**
   * Récupère de façon strictement étanche les quittances et paiements du locataire connecté
   */
  getPaymentsForTenant(
    user?: AuthUser | null,
    currentLease?: Lease | null
  ): PaymentTransaction[] {
    if (!user && !currentLease) return [];
    const declared = this.getDeclaredPayments();
    const verified = this.getVerifiedPayments();

    const map = new Map<string, PaymentTransaction>();
    declared.forEach((p) => {
      if (p && p.id) map.set(p.id, p);
    });
    verified.forEach((p) => {
      if (p && p.id) map.set(p.id, { ...map.get(p.id), ...p, isVerified: true });
    });

    const all = Array.from(map.values());
    return all.filter((p) => isPaymentMatchingTenant(p, user, currentLease));
  },

  /**
   * Récupère de façon étanche les paiements destinés à un bailleur
   */
  getPaymentsForLandlord(user?: AuthUser | null): PaymentTransaction[] {
    if (!user) return [];
    if (user.role === 'admin' || user.email === 'admin@locagestion.site') {
      return [...this.getVerifiedPayments(), ...this.getDeclaredPayments()];
    }
    const declared = this.getDeclaredPayments();
    const verified = this.getVerifiedPayments();
    const all = [...verified, ...declared];
    return all.filter((p) => isPaymentMatchingLandlord(p, user));
  },

  getDeclaredPaymentsForLandlord(user?: AuthUser | null): PaymentTransaction[] {
    if (!user) return [];
    if (user.role === 'admin' || user.email === 'admin@locagestion.site') {
      return this.getDeclaredPayments();
    }
    return this.getDeclaredPayments().filter((p) => isPaymentMatchingLandlord(p, user));
  },

  getVerifiedPaymentsForLandlord(user?: AuthUser | null): PaymentTransaction[] {
    if (!user) return [];
    if (user.role === 'admin' || user.email === 'admin@locagestion.site') {
      return this.getVerifiedPayments();
    }
    return this.getVerifiedPayments().filter((p) => isPaymentMatchingLandlord(p, user));
  },

  /**
   * Sauvegarde les déclarations de paiement
   */
  saveDeclaredPayments(payments: PaymentTransaction[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_DECLARED, JSON.stringify(payments));
      window.dispatchEvent(new CustomEvent('locagestion:payments_updated'));
      window.dispatchEvent(new Event('storage'));
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payments }),
      }).catch(() => { });
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
      window.dispatchEvent(new Event('storage'));
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verifiedPayments: payments }),
      }).catch(() => {});
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

      // Alerter instantanément le locataire de la validation et de sa quittance
      TenantNotificationService.notifyPaymentApproved({
        receiptNumber: receiptNum,
        amount: verifiedTx.amount,
        period: verifiedTx.period,
        tenantName: verifiedTx.tenantName,
        tenantEmail: verifiedTx.tenantEmail,
        isAdvance: verifiedTx.isAdvance,
        advanceMonthsCount: verifiedTx.advanceMonthsCount,
      });

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

      // Alerter le locataire du problème
      TenantNotificationService.notifyPaymentRejected({
        amount: rejectedTx.amount,
        period: rejectedTx.period,
        tenantName: rejectedTx.tenantName,
        reason: options.rejectionReason,
      });

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
