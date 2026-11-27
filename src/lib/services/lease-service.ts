'use client';

import { TenantNotificationService } from './tenant-notification-service';
import { AuthUser } from '../types';
import { areEmailsEqual, arePhoneNumbersEqual } from './auth-service';
import { resolveNotificationDate, compareNotificationsDesc } from '../money/format';
import { isUserConversationAuthor } from './conversation-service';
import { SoundService } from './sound-service';

export type LeaseStatus =
  | 'actif'
  | 'en_attente_signature'
  | 'resilie'
  | 'expire'
  | 'supprime'
  | 'brouillon';

export interface Lease {
  id: string; // Ex: 'BAIL-2026-N09'
  tenantId?: string;
  tenant: string;
  tenantEmail?: string;
  tenantPhone?: string;
  tenantMatricule?: string;
  tenantAddress?: string;
  tenantIdType?: string;
  tenantIdNumber?: string;
  tenantIfu?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  property: string;
  unit: string;
  propertyAddress?: string;
  propertyCity?: string;
  propertyDistrict?: string;
  propertyLandmark?: string;
  propertyLocation?: string; // Ex: "Haie Vive, Cotonou, Bénin"
  propertyUsage?: 'habitation' | 'magasin' | 'boutique' | 'commercial' | 'bureau';
  country?: string;
  governingLaw?: string;
  specialConditions?: string;
  rent: number;
  charges?: number;
  deposit?: number;
  utilitiesDeposit?: number;
  includeFirstRent?: boolean;
  advanceMonths?: number;
  totalDueAtEntry?: number;
  isNewTenant?: boolean;
  invitationCode?: string;
  invitationSentBySms?: boolean;
  invitationSentByEmail?: boolean;
  appDownloadLink?: string;
  portalAccessLink?: string;
  listingId?: string;
  listingReference?: string;
  startDate: string;
  endDate?: string;
  durationMonths?: number;
  status: LeaseStatus;
  signedByLandlord?: boolean;
  signedByTenant?: boolean;
  landlordSignedAt?: string;
  tenantSignedAt?: string;
  sentForSignatureAt?: string;
  transmittedAt?: string;
  hashSha256?: string;
  landlordSignature?: {
    signedBy: string;
    date: string;
    signatureDataUrl?: string;
  };
  landlordId?: string;
  landlordName?: string;
  landlordPhone?: string;
  landlordEmail?: string;
  landlordWhatsapp?: string;
  landlordIfu?: string;
  landlordAddress?: string;
  landlordPaymentMethods?: {
    wave?: string;
    mtn?: string;
    moov?: string;
    orange?: string;
    airtel?: string;
    bank?: string;
  };
  tenantSignature?: {
    signedBy: string;
    date: string;
    signatureDataUrl?: string;
  };
  resiliatedAt?: string;
  reactivatedAt?: string;
  resiliationReason?: string;
  deletedAt?: string;
  deleteReason?: string;
  isArchived?: boolean;
}

export interface RegisteredTenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  property?: string;
  unit?: string;
  rent?: number;
  leaseId?: string;
  matricule?: string;
  status?: LeaseStatus;
  address?: string;
  idType?: string;
  idNumber?: string;
  ifu?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  isNewAccount?: boolean;
  invitedAt?: string;
  invitationCode?: string;
}

export const REGISTERED_TENANTS: RegisteredTenant[] = [];

export interface LandlordNotification {
  id: string;
  title: string;
  message: string;
  time?: string;
  timestamp?: string;
  createdAt?: string;
  type:
  | 'lease_signed'
  | 'lease_transmitted'
  | 'payment_declared'
  | 'incident_reported'
  | 'lease_terminated'
  | 'lease_reactivated'
  | 'notice_received'
  | 'listing_approved'
  | 'listing_rejected'
  | 'visit_requested'
  | 'message_received'
  | 'subscription_alert'
  | 'subscription_expired'
  | 'subscription_activated'
  | 'payout_disbursed';
  read: boolean;
  leaseId?: string;
  incidentId?: string;
  listingId?: string;
  convId?: string;
  paymentId?: string;
  noticeId?: string;
  tenantName?: string;
  unit?: string;
  property?: string;
  urgency?: string;
  category?: string;
  photos?: string[];
  visitDate?: string;
  visitTimeSlot?: string;
  visitorName?: string;
  visitorPhone?: string;
  visitorEmail?: string;
  authorId?: string;
  authorName?: string;
  authorCompany?: string;
  authorEmail?: string;
  authorPhone?: string;
  authorRole?: string;
  emailSentTo?: string;
  landlordId?: string;
  landlordEmail?: string;
  landlordPhone?: string;
  landlordName?: string;
  emailDelivered?: {
    to: string;
    from: string;
    subject: string;
    date: string;
    preview: string;
  };
}

export const INITIAL_LEASES: Lease[] = [
  {
    id: 'BAIL-2026-421',
    tenant: 'Jojo VOG',
    tenantId: 'usr-tenant-jojovog',
    tenantEmail: 'jojovog007@gmail.com',
    tenantPhone: '+229 97 00 12 34',
    tenantMatricule: 'LOCA-MAT-BJ-17635',
    tenantAddress: 'Haie Vive, Cotonou',
    property: 'CHAMBRE SALON SANITAIRE',
    unit: 'Lot 1 (Chambre Salon Sanitaire • 45 m²)',
    propertyAddress: 'Haie Vive, Cotonou',
    propertyDistrict: 'Haie Vive',
    propertyCity: 'Cotonou',
    propertyLocation: 'Haie Vive, Cotonou, Bénin',
    propertyUsage: 'habitation',
    country: 'Bénin',
    governingLaw: 'Loi n° 2018-12 du 02 juillet 2018 (Bénin)',
    rent: 25000,
    deposit: 75000,
    advanceMonths: 3,
    charges: 0,
    utilitiesDeposit: 25000,
    totalDueAtEntry: 125000,
    startDate: '01/11/2026',
    endDate: '31/10/2027',
    durationMonths: 12,
    status: 'actif',
    signedByLandlord: true,
    signedByTenant: true,
    landlordId: 'usr-bailleur-voglossou',
    landlordName: 'VOGLOSSOU JOHANE',
    landlordPhone: '+229 01 95 44 44 30',
    landlordWhatsapp: '+229 01 95 44 44 30',
    landlordEmail: 'jobovog@gmail.com',
    landlordIfu: '3201984210987',
    landlordAddress: 'Haie Vive, Cotonou, Bénin',
    landlordPaymentMethods: {
      wave: '+229 01 95 44 44 30',
      mtn: '+229 01 95 44 44 30',
      moov: '+229 01 95 44 44 30',
      bank: 'BJ061 01001 001234567890 45 (BOA Bénin)',
    },
    landlordSignature: {
      signedBy: 'VOGLOSSOU JOHANE',
      date: '01/11/2026',
      signatureDataUrl: '',
    },
    tenantSignature: {
      signedBy: 'Jojo VOG',
      date: '01/11/2026',
      signatureDataUrl: '',
    },
    transmittedAt: '01/11/2026',
    tenantSignedAt: '01/11/2026',
    invitationCode: 'LOCA-INV-7842',
  },
  {
    id: 'BAIL-2026-422',
    tenant: 'Jojo VOG',
    tenantId: 'usr-tenant-jojovog',
    tenantEmail: 'jojovog007@gmail.com',
    tenantPhone: '+229 97 00 12 34',
    tenantMatricule: 'LOCA-MAT-BJ-17635',
    tenantAddress: 'Zogbadjè, Abomey-Calavi',
    property: 'Résidence UAC Calavi',
    unit: 'Studio Meublé N° 3 (25 m²)',
    propertyAddress: 'Zogbadjè (Campus UAC), Abomey-Calavi',
    propertyDistrict: 'Zogbadjè',
    propertyCity: 'Abomey-Calavi',
    propertyLocation: 'Zogbadjè, Abomey-Calavi, Bénin',
    propertyUsage: 'habitation',
    country: 'Bénin',
    governingLaw: 'Loi n° 2018-12 du 02 juillet 2018 (Bénin)',
    rent: 35000,
    deposit: 105000,
    advanceMonths: 3,
    charges: 3000,
    utilitiesDeposit: 15000,
    totalDueAtEntry: 158000,
    startDate: '15/11/2026',
    endDate: '14/11/2027',
    durationMonths: 12,
    status: 'resilie',
    resiliatedAt: '27/11/2026 10:36',
    resiliationReason: 'Résiliation à la demande du bailleur',
    signedByLandlord: true,
    signedByTenant: true,
    landlordId: 'usr-bailleur-voglossou',
    landlordName: 'VOGLOSSOU JOHANE',
    landlordPhone: '+229 01 95 44 44 30',
    landlordWhatsapp: '+229 01 95 44 44 30',
    landlordEmail: 'jobovog@gmail.com',
    landlordIfu: '3201984210987',
    landlordAddress: 'Haie Vive, Cotonou, Bénin',
    landlordPaymentMethods: {
      wave: '+229 01 95 44 44 30',
      mtn: '+229 01 95 44 44 30',
      moov: '+229 01 95 44 44 30',
      bank: 'BJ061 01001 001234567890 45 (BOA Bénin)',
    },
    landlordSignature: {
      signedBy: 'VOGLOSSOU JOHANE',
      date: '15/11/2026',
      signatureDataUrl: '',
    },
    tenantSignature: {
      signedBy: 'Jojo VOG',
      date: '15/11/2026',
      signatureDataUrl: '',
    },
    transmittedAt: '15/11/2026',
    tenantSignedAt: '15/11/2026',
    invitationCode: 'LOCA-INV-7843',
  },
];

const LEASES_STORAGE_KEY = 'locagestion:leases:v1';
const NOTIFICATIONS_STORAGE_KEY = 'locagestion:landlord_notifications:v1';

function notifyStorageChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('locagestion:leases_updated'));
  }
}

/**
 * Vérifie de façon étanche si un bail appartient au bailleur connecté
 */
export function isLeaseMatchingLandlord(
  lease: Lease,
  user?: AuthUser | null
): boolean {
  if (!user) return false;
  if (user.role === 'admin' || user.email === 'admin@locagestion.site') return true;

  const landlordEmail = user.email?.trim().toLowerCase();
  const landlordPhone = user.phone?.trim();
  const landlordName = user.name?.trim().toLowerCase();
  const landlordId = user.id?.trim();

  // Profil canonique de test
  const isVoglossouCanonical =
    (user.email && areEmailsEqual(user.email, 'jobovog@gmail.com')) ||
    (user.name && user.name.toUpperCase().includes('VOGLOSSOU'));
  if (isVoglossouCanonical && lease.landlordId === 'usr-bailleur-voglossou') return true;

  // 1. Email bailleur
  if (landlordEmail && lease.landlordEmail && areEmailsEqual(landlordEmail, lease.landlordEmail)) return true;

  // 2. Téléphone bailleur
  if (landlordPhone && lease.landlordPhone && arePhoneNumbersEqual(landlordPhone, lease.landlordPhone)) return true;

  // 3. ID bailleur
  if (landlordId && lease.landlordId && landlordId === lease.landlordId) return true;

  // 4. Nom bailleur
  if (landlordName && lease.landlordName) {
    if (landlordName === lease.landlordName.trim().toLowerCase()) return true;
    const lWords = landlordName.split(/\s+/).filter(Boolean);
    const leaseWords = lease.landlordName.trim().toLowerCase().split(/\s+/).filter(Boolean);
    if (lWords.length > 0 && lWords.length === leaseWords.length && lWords.every((w: string) => leaseWords.includes(w))) {
      return true;
    }
  }

  return false;
}

export function isFakeLease(l?: Partial<Lease> | null): boolean {
  if (!l) return true;
  if (
    l.id === 'BAIL-2026-MAG-102' ||
    l.id === 'BAIL-2026-COM-205'
  ) {
    return true;
  }
  const lName = (l.landlordName || '').trim().toLowerCase();
  const lEmail = (l.landlordEmail || '').trim().toLowerCase();
  if (
    lName === 'mamadou diallo' ||
    lName === 'aïcha touré' ||
    lName === 'aicha toure' ||
    lName === 'koffi mensah' ||
    lEmail.includes('mamadou.diallo') ||
    lEmail.includes('aicha.toure') ||
    lEmail.includes('diallo-patrimoine') ||
    lEmail.includes('diallo')
  ) {
    return true;
  }
  return false;
}

export const LeaseService = {
  getLeases(): Lease[] {
    if (typeof window === 'undefined') return INITIAL_LEASES;
    try {
      const stored = localStorage.getItem(LEASES_STORAGE_KEY);
      if (stored) {
        let parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Élimination absolue et définitive de tout bail fictif / démo
          const sanitized = parsed.filter((l: Lease) => !isFakeLease(l));
          parsed = sanitized;

          // Dédoublonnage strict par ID : un ID de bail ne peut exister qu'une seule fois !
          // Si une version résiliée existe pour cet ID, la résiliation est scellée
          const leaseMap = new Map<string, Lease>();
          parsed.forEach((l: Lease) => {
            if (!l || !l.id) return;
            const existing = leaseMap.get(l.id);
            if (!existing) {
              leaseMap.set(l.id, l);
            } else {
              const isRes = l.status === 'resilie' || existing.status === 'resilie';
              const isReac = Boolean(
                (l.reactivatedAt || existing.reactivatedAt) &&
                (l.status === 'actif' || existing.status === 'actif') &&
                (!l.resiliatedAt && !existing.resiliatedAt ||
                  (l.reactivatedAt || '') >= (l.resiliatedAt || '') ||
                  (existing.reactivatedAt || '') >= (existing.resiliatedAt || ''))
              );
              const status: LeaseStatus = isRes ? (isReac ? 'actif' : 'resilie') : (existing.status || l.status);
              leaseMap.set(l.id, {
                ...existing,
                ...l,
                status,
                resiliatedAt: l.resiliatedAt || existing.resiliatedAt,
                resiliationReason: l.resiliationReason || existing.resiliationReason,
              });
            }
          });

          // Si des baux initiaux (ex: BAIL-2026-421) sont absents du cache local, les intégrer sans écraser ni dupliquer
          INITIAL_LEASES.forEach((initL) => {
            const existing = leaseMap.get(initL.id);
            if (!existing) {
              leaseMap.set(initL.id, initL);
            } else if (initL.status === 'resilie' && !existing.reactivatedAt) {
              existing.status = 'resilie';
              existing.resiliatedAt = existing.resiliatedAt || initL.resiliatedAt;
              existing.resiliationReason = existing.resiliationReason || initL.resiliationReason;
            }
          });

          parsed = Array.from(leaseMap.values());

          // Si le bail canonique est présent mais sans les coordonnées complètes du bailleur, les enrichir
          const jojoLease = parsed.find((l: Lease) => l.id === 'BAIL-2026-421');
          if (
            jojoLease &&
            (!jojoLease.landlordPhone ||
              !jojoLease.landlordPaymentMethods ||
              !jojoLease.propertyLocation ||
              !jojoLease.advanceMonths ||
              !jojoLease.tenantMatricule ||
              jojoLease.landlordPhone.includes('97 00 11 22'))
          ) {
            Object.assign(jojoLease, {
              tenantMatricule: jojoLease.tenantMatricule || 'LOCA-MAT-BJ-17635',
              propertyAddress: jojoLease.propertyAddress || 'Haie Vive, Cotonou',
              propertyDistrict: jojoLease.propertyDistrict || 'Haie Vive',
              propertyCity: jojoLease.propertyCity || 'Cotonou',
              propertyLocation: jojoLease.propertyLocation || 'Haie Vive, Cotonou, Bénin',
              advanceMonths: jojoLease.advanceMonths || 3,
              landlordId: 'usr-bailleur-voglossou',
              landlordName: 'VOGLOSSOU JOHANE',
              landlordPhone: '+229 01 95 44 44 30',
              landlordWhatsapp: '+229 01 95 44 44 30',
              landlordEmail: 'jobovog@gmail.com',
              landlordIfu: '3201984210987',
              landlordAddress: 'Haie Vive, Cotonou, Bénin',
              landlordPaymentMethods: {
                wave: '+229 01 95 44 44 30',
                mtn: '+229 01 95 44 44 30',
                moov: '+229 01 95 44 44 30',
                bank: 'BJ061 01001 001234567890 45 (BOA Bénin)',
              },
            });
            if (jojoLease.landlordSignature) {
              jojoLease.landlordSignature.signedBy = 'VOGLOSSOU JOHANE';
            }
          }

          try {
            localStorage.setItem(LEASES_STORAGE_KEY, JSON.stringify(parsed));
          } catch (e) { }

          if (parsed.length > 0) return parsed;
        }
      }
    } catch (e) {
      console.error('Erreur lecture baux:', e);
    }

    // Si stockage vide sur le nouvel appareil ou mobile, initialiser avec les baux par défaut
    if (INITIAL_LEASES.length > 0) {
      try {
        localStorage.setItem(LEASES_STORAGE_KEY, JSON.stringify(INITIAL_LEASES));
      } catch (e) { }
    }
    return INITIAL_LEASES;
  },

  getLeaseById(id: string): Lease | undefined {
    const leases = this.getLeases();
    return leases.find((l) => l.id === id);
  },

  getLeasesForLandlord(user?: AuthUser | null): Lease[] {
    if (!user) return [];
    if (user.role === 'admin' || user.email === 'admin@locagestion.site') {
      return this.getLeases();
    }
    const all = this.getLeases();
    return all.filter((l) => isLeaseMatchingLandlord(l, user));
  },

  // Récupérer le bail en attente de signature pour un locataire spécifique
  getPendingLeaseForTenant(tenantNameOrId: string): Lease | undefined {
    const leases = this.getLeases();
    return leases.find(
      (l) =>
        l.status === 'en_attente_signature' &&
        (l.tenant.toLowerCase().includes(tenantNameOrId.toLowerCase()) ||
          l.tenantId === tenantNameOrId)
    );
  },

  saveLease(lease: Lease): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getLeases();
      const existingIndex = current.findIndex((l) => l.id === lease.id);
      let updated: Lease[];
      if (existingIndex >= 0) {
        updated = [...current];
        updated[existingIndex] = lease;
      } else {
        updated = [lease, ...current];
      }
      localStorage.setItem(LEASES_STORAGE_KEY, JSON.stringify(updated));
      notifyStorageChange();
      window.dispatchEvent(new CustomEvent('locagestion:leases_updated'));

      // Synchronisation temps réel immédiate Web <-> Mobile
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leases: updated }),
      }).catch(() => { });
    } catch (e) {
      console.error('Erreur sauvegarde bail:', e);
    }
  },

  saveAllLeases(leases: Lease[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LEASES_STORAGE_KEY, JSON.stringify(leases));
      notifyStorageChange();
      window.dispatchEvent(new CustomEvent('locagestion:leases_updated'));

      // Synchronisation temps réel immédiate Web <-> Mobile
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leases }),
      }).catch(() => { });
    } catch (e) {
      console.error('Erreur sauvegarde baux:', e);
    }
  },

  // Récupérer la liste des locataires certifiés (avec persistance)
  getRegisteredTenants(user?: AuthUser | null): RegisteredTenant[] {
    if (typeof window === 'undefined') return [];
    const result: RegisteredTenant[] = [];
    const seenKeys = new Set<string>();

    // 1. Priorité absolue : Locataires avec lesquels le bailleur a signé un contrat de bail
    try {
      const leases = user ? this.getLeasesForLandlord(user) : this.getLeases();
      const validLeases = leases.filter((l) => !isFakeLease(l) && l.status !== 'resilie');
      validLeases.forEach((l) => {
        const key = `${l.id}`;
        if (!seenKeys.has(key)) {
          seenKeys.add(key);
          result.push({
            id: l.id,
            leaseId: l.id,
            name: l.tenant,
            email: l.tenantEmail || '',
            phone: l.tenantPhone || '',
            property: l.property,
            unit: l.unit,
            rent: l.rent,
            matricule: l.tenantMatricule,
            status: l.status,
            address: l.tenantAddress || l.propertyAddress,
          });
        }
      });
    } catch (e) {
      console.error('Erreur extraction locataires depuis les baux:', e);
    }

    // 2. Compléter avec les locataires enregistrés additionnels non fictifs
    try {
      const stored = localStorage.getItem('locagestion:registered_tenants');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.filter((t: RegisteredTenant) => {
            if (!t) return false;
            const name = (t.name || '').trim().toLowerCase();
            if (
              name === 'koffi mensah' ||
              name === 'mamadou diallo' ||
              name === 'ibrahim traoré' ||
              name === 'ibrahim traore' ||
              name === 'aïcha touré' ||
              name === 'aicha toure' ||
              name === 'fatoumata traoré' ||
              name === 'fatoumata traore' ||
              name === 'amina diop'
            ) {
              return false;
            }
            return true;
          });
          if (sanitized.length !== parsed.length) {
            localStorage.setItem('locagestion:registered_tenants', JSON.stringify(sanitized));
          }
          sanitized.forEach((t: RegisteredTenant) => {
            const alreadyInLeases = result.some(
              (r) =>
                r.id === t.id ||
                (r.name.toLowerCase().trim() === (t.name || '').toLowerCase().trim() &&
                  (!t.unit || r.unit === t.unit))
            );
            if (!alreadyInLeases) {
              result.push(t);
            }
          });
        }
      }
    } catch (e) {
      console.error('Erreur lecture locataires enregistrés:', e);
    }
    return result;
  },

  // Enregistrer dynamiquement un nouveau locataire et lui générer un code d'accès
  registerNewTenant(data: {
    name: string;
    email: string;
    phone: string;
    property?: string;
    unit?: string;
  }): RegisteredTenant {
    const list = this.getRegisteredTenants();
    const existing = list.find(
      (t) => t.email.toLowerCase() === data.email.toLowerCase()
    );
    if (existing) return existing;

    const newId = `ten-${String(list.length + 1).padStart(2, '0')}`;
    const invitationCode = `LOCA-INV-${Math.floor(1000 + Math.random() * 9000)}`;
    const newTenant: RegisteredTenant = {
      id: newId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      property: data.property,
      unit: data.unit,
      isNewAccount: true,
      invitedAt: new Date().toLocaleDateString('fr-FR'),
      invitationCode,
    };

    const updated = [newTenant, ...list];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(
          'locagestion:registered_tenants',
          JSON.stringify(updated)
        );
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registeredTenants: updated }),
        }).catch(() => {});
      } catch (e) {
        console.error('Erreur enregistrement locataire:', e);
      }
    }
    return newTenant;
  },

  // Action : Transmettre le bail au locataire pour signature
  transmitLeaseToTenant(lease: Lease): Lease {
    const nowFormatted = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const updated: Lease = {
      ...lease,
      status: 'en_attente_signature',
      signedByLandlord: true,
      transmittedAt: lease.transmittedAt || nowFormatted,
      sentForSignatureAt: nowFormatted,
    };

    // Si c'est un nouveau locataire sans compte existant, l'enregistrer automatiquement
    if (lease.isNewTenant && lease.tenant && lease.tenantEmail) {
      this.registerNewTenant({
        name: lease.tenant,
        email: lease.tenantEmail,
        phone: lease.tenantPhone || '',
        property: lease.property,
        unit: lease.unit,
      });
    }

    this.saveLease(updated);

    // Alerter instantanément l'espace du locataire
    TenantNotificationService.notifyLeaseTransmitted({
      leaseId: updated.id,
      propertyName: updated.property,
      unitNumber: updated.unit,
      rent: updated.rent,
      tenantName: updated.tenant,
      tenantEmail: updated.tenantEmail,
      tenantPhone: updated.tenantPhone,
      landlordName: updated.landlordSignature?.signedBy || 'Le Bailleur',
    });

    return updated;
  },

  // Action : Le locataire signe le bail
  signLeaseByTenant(
    leaseId: string,
    tenantName: string,
    signatureDataUrl?: string
  ): { lease: Lease | undefined; notification: LandlordNotification } {
    const leases = this.getLeases();
    const leaseIndex = leases.findIndex((l) => l.id === leaseId);
    const nowFormatted = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    let updatedLease: Lease;

    if (leaseIndex >= 0) {
      updatedLease = {
        ...leases[leaseIndex],
        status: 'actif',
        signedByTenant: true,
        tenantSignedAt: nowFormatted,
        tenantSignature: {
          signedBy: tenantName,
          date: nowFormatted,
          signatureDataUrl,
        },
      };
      leases[leaseIndex] = updatedLease;
      this.saveAllLeases(leases);
    } else {
      updatedLease = {
        id: leaseId,
        tenant: tenantName,
        property: 'Logement',
        unit: 'Lot principal',
        rent: 0,
        startDate: nowFormatted,
        status: 'actif',
        signedByLandlord: true,
        signedByTenant: true,
        tenantSignedAt: nowFormatted,
      };
      this.saveLease(updatedLease);
    }

    // Règle métier : Dès que le bail est contresigné par le locataire, retirer automatiquement l'annonce liée de la place de marché
    if (typeof window !== 'undefined' && (updatedLease.listingId || updatedLease.listingReference)) {
      try {
        const { ListingsService } = require('./listings-service');
        ListingsService.removeListingAfterLeaseSigned(
          updatedLease.listingReference || updatedLease.listingId!,
          updatedLease.id
        );
      } catch (err) {
        console.error('Erreur retrait automatique annonce après contresignature:', err);
      }
    }

    const nowIso = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Créer la notification pour informer le bailleur dans l'app et par mail
    const targetLandlordEmail = updatedLease.landlordEmail || 'jobovog@gmail.com';
    const notification: LandlordNotification = {
      id: `notif-${Date.now()}`,
      title: 'Bail contresigné par le locataire !',
      message: `${tenantName} a apposé sa signature électronique sur le contrat ${leaseId} (${updatedLease.unit}). Le bail est désormais actif et opposable.`,
      createdAt: nowIso,
      time: timeStr,
      timestamp: nowFormatted,
      type: 'lease_signed',
      read: false,
      leaseId: leaseId,
      landlordId: updatedLease.landlordId || (areEmailsEqual(targetLandlordEmail, 'jobovog@gmail.com') ? 'usr-bailleur-voglossou' : undefined),
      landlordEmail: targetLandlordEmail,
      landlordPhone: updatedLease.landlordPhone,
      landlordName: updatedLease.landlordName || 'Bailleur',
      tenantName: tenantName,
      unit: updatedLease.unit,
      property: updatedLease.property,
      emailSentTo: targetLandlordEmail,
      emailDelivered: {
        to: targetLandlordEmail,
        from: 'baux@locagestion.site',
        subject: `[Bail Contresigné] ${leaseId} — ${tenantName} (${updatedLease.unit})`,
        date: nowFormatted,
        preview: `Le contrat de bail ${leaseId} a été contresigné électroniquement par ${tenantName} avec horodatage légal conforme UEMOA & CEMAC.`,
      },
    };

    this.addLandlordNotification(notification);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('locagestion:leases_updated', { detail: { leaseId } }));
      window.dispatchEvent(new CustomEvent('locagestion:notifications_updated'));
      window.dispatchEvent(new Event('storage'));

      try {
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('locagestion_realtime');
          bc.postMessage({ type: 'locagestion:lease_signed', leaseId, notification });
          bc.postMessage({ type: 'locagestion:leases_updated', leaseId });
          bc.close();
        }
      } catch {}
    }

    return { lease: updatedLease, notification };
  },

  // Action : Résilier définitivement le bail (déplacé dans l'Historique de bail)
  terminateLease(leaseId: string, reason?: string): Lease | undefined {
    const leases = this.getLeases();
    const leaseIndex = leases.findIndex((l) => l.id === leaseId);
    if (leaseIndex < 0) return undefined;

    const nowFormatted = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const targetLease = leases[leaseIndex];
    const updatedLease: Lease = {
      ...targetLease,
      status: 'resilie',
      isArchived: true,
      resiliatedAt: nowFormatted,
      resiliationReason: reason || 'Résiliation à la demande du bailleur',
    };

    leases[leaseIndex] = updatedLease;
    this.saveAllLeases(leases);

    const nowIso = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Notification de résiliation pour le bailleur
    this.addLandlordNotification({
      id: `notif-${Date.now()}`,
      title: 'Bail résilié et archivé',
      message: `Le contrat ${leaseId} (${updatedLease.unit} - ${updatedLease.tenant}) a été résilié et déplacé dans votre Historique de bail. Le logement est désormais dissocié.`,
      createdAt: nowIso,
      time: timeStr,
      timestamp: nowFormatted,
      type: 'lease_terminated',
      read: false,
      leaseId: leaseId,
      tenantName: updatedLease.tenant,
      unit: updatedLease.unit,
      property: updatedLease.property,
    });

    // Alerter le locataire
    TenantNotificationService.notifyLeaseResiliated({
      leaseId,
      unitNumber: updatedLease.unit,
      tenantName: updatedLease.tenant,
      tenantEmail: updatedLease.tenantEmail,
      reason: reason || 'Résiliation à la demande du bailleur',
    });

    return updatedLease;
  },

  // Action : Supprimer / Déplacer un bail dans l'historique d'archives
  deleteLease(leaseId: string, reason?: string): Lease | undefined {
    const leases = this.getLeases();
    const leaseIndex = leases.findIndex((l) => l.id === leaseId);
    if (leaseIndex < 0) return undefined;

    const nowFormatted = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const targetLease = leases[leaseIndex];
    const updatedLease: Lease = {
      ...targetLease,
      status: 'supprime',
      isArchived: true,
      deletedAt: nowFormatted,
      deleteReason: reason || 'Supprimé par le bailleur et conservé dans l’historique',
    };

    leases[leaseIndex] = updatedLease;
    this.saveAllLeases(leases);

    const nowIso = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    this.addLandlordNotification({
      id: `notif-${Date.now()}`,
      title: 'Bail déplacé dans l’historique',
      message: `Le contrat ${leaseId} (${updatedLease.unit} - ${updatedLease.tenant}) a été supprimé des baux en cours et conservé dans votre Historique de bail.`,
      createdAt: nowIso,
      time: timeStr,
      timestamp: nowFormatted,
      type: 'lease_terminated',
      read: false,
      leaseId: leaseId,
      tenantName: updatedLease.tenant,
      unit: updatedLease.unit,
      property: updatedLease.property,
    });

    return updatedLease;
  },

  // Action : Réactiver le bail sans autres démarches (replacer dans les baux en cours)
  reactivateLease(leaseId: string): Lease | undefined {
    const leases = this.getLeases();
    const leaseIndex = leases.findIndex((l) => l.id === leaseId);
    if (leaseIndex < 0) return undefined;

    const nowFormatted = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const targetLease = leases[leaseIndex];
    const updatedLease: Lease = {
      ...targetLease,
      status: 'actif',
      isArchived: false,
      reactivatedAt: nowFormatted,
      resiliationReason: undefined,
      deleteReason: undefined,
      deletedAt: undefined,
    };

    leases[leaseIndex] = updatedLease;
    this.saveAllLeases(leases);

    const nowIso = new Date().toISOString();
    const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // Notification de réactivation
    this.addLandlordNotification({
      id: `notif-${Date.now()}`,
      title: 'Bail réactivé',
      message: `Le contrat ${leaseId} (${updatedLease.unit} - ${updatedLease.tenant}) a été réactivé avec succès. La liaison locataire est rétablie sans autres démarches.`,
      createdAt: nowIso,
      time: timeStr,
      timestamp: nowFormatted,
      type: 'lease_reactivated',
      read: false,
      leaseId: leaseId,
      tenantName: updatedLease.tenant,
      unit: updatedLease.unit,
      property: updatedLease.property,
    });

    // Alerter le locataire
    TenantNotificationService.notifyLeaseReactivated({
      leaseId,
      unitNumber: updatedLease.unit,
      tenantName: updatedLease.tenant,
      tenantEmail: updatedLease.tenantEmail,
    });

    return updatedLease;
  },

  // Notifications Bailleur & Démarcheur
  getLandlordNotifications(user?: AuthUser | null): LandlordNotification[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      let parsed: LandlordNotification[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(parsed)) parsed = [];

      let needsSave = false;

      // Purge des notifications de boost non scellées ou annulées (ex: A-BJ-93729)
      parsed = parsed.filter((n) => {
        if (
          n.message &&
          n.message.includes('93729') &&
          (n.title?.includes('mise en avant') || n.title?.includes('Boost') || n.id?.includes('notif-boost-'))
        ) {
          needsSave = true;
          return false;
        }
        return true;
      });

      // Migration automatique des anciennes notifications ayant "À l'instant"
      parsed = parsed.map((n) => {
        const isTimeInstant = n.time && n.time.toLowerCase().includes('instant');
        const isTimestampInstant = n.timestamp && n.timestamp.toLowerCase().includes('instant');
        let createdAt = n.createdAt;
        let time = n.time;
        let timestamp = n.timestamp;

        if (!createdAt || isTimeInstant || isTimestampInstant) {
          const resolved = resolveNotificationDate(n);
          needsSave = true;
          createdAt = createdAt || resolved.toISOString();
          const h = String(resolved.getHours()).padStart(2, '0');
          const m = String(resolved.getMinutes()).padStart(2, '0');
          time = !isTimeInstant && time ? time : `${h}:${m}`;
          timestamp = !isTimestampInstant && timestamp ? timestamp : resolved.toISOString();
        }

        return {
          ...n,
          createdAt,
          time,
          timestamp,
        };
      });
      if (needsSave && typeof window !== 'undefined') {
        try {
          localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(parsed));
        } catch (e) { }
      }

      // Synthèse des messages reçus non lus depuis les conversations
      try {
        const convsStored = localStorage.getItem('locagestion:conversations:v1');
        if (convsStored) {
          const convs = JSON.parse(convsStored);
          if (Array.isArray(convs)) {
            const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            const nowIso = new Date().toISOString();
            convs.forEach((c: any) => {
              // Vérifier si cette conversation appartient au bailleur/démarcheur connecté
              if (user && user.role !== 'admin' && !areEmailsEqual(user.email, 'admin@locagestion.site')) {
                if (!isUserConversationAuthor(c, user)) {
                  return;
                }
              }

              const isUnreadForLandlord =
                (c.unreadCount && c.unreadCount > 0 && c.unreadBy !== 'locataire') ||
                (c.hasUnread && c.unreadBy !== 'locataire');
              if (isUnreadForLandlord) {
                const existingNotifIdx = parsed.findIndex(
                  (n) => n.convId === c.id || n.id === `notif-conv-${c.id}`
                );
                const convTime = (c.lastMessageTime && !c.lastMessageTime.toLowerCase().includes('instant')) ? c.lastMessageTime : nowTime;
                if (existingNotifIdx >= 0) {
                  // S'assurer que le statut non lu est synchronisé
                  parsed[existingNotifIdx].read = false;
                  parsed[existingNotifIdx].message = `${c.visitorName || c.tenantName || 'Candidat'} : « ${c.lastMessage || 'Nouveau message reçu'} »`;
                  parsed[existingNotifIdx].time = convTime;
                } else {
                  parsed.unshift({
                    id: `notif-conv-${c.id}`,
                    title: `💬 Nouveau message : ${c.propertyTitle || 'Bien en location'}`,
                    message: `${c.visitorName || c.tenantName || 'Candidat'} : « ${c.lastMessage || 'Nouveau message reçu'} »`,
                    createdAt: nowIso,
                    time: convTime,
                    timestamp: new Date().toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }),
                    type: 'message_received',
                    read: false,
                    convId: c.id,
                    listingId: c.listingId,
                    tenantName: c.visitorName || c.tenantName,
                    property: c.propertyTitle,
                    unit: c.propertyUnit,
                    authorId: c.authorId,
                    authorEmail: c.authorEmail,
                    authorPhone: c.authorPhone,
                  });
                }
              }
            });
          }
        }
      } catch { }

      if (!user || user.role === 'admin' || user.email === 'admin@locagestion.site') {
        return parsed.sort(compareNotificationsDesc);
      }
      const landlordLeases = this.getLeasesForLandlord(user);
      const landlordProps = new Set(landlordLeases.map((l) => (l.property || '').toLowerCase().trim()));
      const landlordTenants = new Set(landlordLeases.map((l) => (l.tenant || '').toLowerCase().trim()));
      const landlordLeaseIds = new Set(landlordLeases.map((l) => l.id));

      return parsed.filter((n) => {
        // Notifications universelles de formule, reversement et alertes
        if (
          n.type === 'subscription_activated' ||
          n.type === 'subscription_alert' ||
          n.type === 'subscription_expired' ||
          n.type === 'payout_disbursed'
        ) {
          return true;
        }

        // Si la notification cible explicitement ce bailleur (par ID, matricule, email ou téléphone)
        if (n.landlordId && user.id && n.landlordId.toLowerCase() === user.id.toLowerCase()) return true;
        if (n.landlordId && user.matricule && n.landlordId.toLowerCase() === user.matricule.toLowerCase()) return true;
        if (n.landlordEmail && user.email && areEmailsEqual(n.landlordEmail, user.email)) return true;
        if (n.landlordPhone && user.phone && arePhoneNumbersEqual(n.landlordPhone, user.phone)) return true;
        if (n.emailSentTo && user.email && areEmailsEqual(n.emailSentTo, user.email)) return true;

        // Auteur direct (Annonces et Messagerie)
        if (n.authorId && user.id && n.authorId.toLowerCase() === user.id.toLowerCase()) return true;
        if (n.authorId && user.matricule && n.authorId.toLowerCase() === user.matricule.toLowerCase()) return true;
        if (n.authorEmail && user.email && areEmailsEqual(n.authorEmail, user.email)) return true;
        if (n.authorPhone && user.phone && arePhoneNumbersEqual(n.authorPhone, user.phone)) return true;
        if (n.authorCompany && user.companyName && n.authorCompany.trim().toLowerCase() === user.companyName.trim().toLowerCase()) return true;
        const userName = (user.name || user.firstName || '').trim().toLowerCase();
        if (n.authorName && userName && n.authorName.trim().toLowerCase() === userName) return true;

        // Compte officiel certifié Bailleur
        if (user.email && areEmailsEqual(user.email, 'jobovog@gmail.com')) return true;

        // Demandes de visite d'annonces et messages reçus
        if (n.type === 'visit_requested' || n.type === 'message_received') {
          return false;
        }

        // Approbation ou rejet d'annonce
        if (n.type === 'listing_approved' || n.type === 'listing_rejected') {
          return false;
        }

        // PANNES & INCIDENTS SIGNALÉS (Priorité et exhaustivité absolue pour le bailleur)
        if (n.type === 'incident_reported') {
          if (n.leaseId && landlordLeaseIds.has(n.leaseId)) return true;
          if (n.property && landlordProps.has(n.property.toLowerCase().trim())) return true;
          if (n.tenantName && landlordTenants.has(n.tenantName.toLowerCase().trim())) return true;
          if (landlordLeases.length === 0 && (!n.landlordEmail || areEmailsEqual(n.landlordEmail, user.email))) return true;
          return false;
        }

        // BAUX CONTRESIGNÉS, TRANSMIS, RÉSILIÉS OU RÉACTIVÉS (Alerte et visibilité immédiate pour le bailleur)
        if (n.type === 'lease_signed' || n.type === 'lease_transmitted' || n.type === 'lease_terminated' || n.type === 'lease_reactivated') {
          if (n.leaseId && landlordLeaseIds.has(n.leaseId)) return true;
          if (n.property && landlordProps.has(n.property.toLowerCase().trim())) return true;
          if (n.tenantName && landlordTenants.has(n.tenantName.toLowerCase().trim())) return true;
          if (landlordLeases.length === 0 && (!n.landlordEmail || areEmailsEqual(n.landlordEmail, user.email))) return true;
          return false;
        }

        // Gestion des baux, préavis, paiements et propriétés
        if (n.leaseId && landlordLeaseIds.has(n.leaseId)) return true;
        if (n.property && landlordProps.has(n.property.toLowerCase().trim())) return true;
        if (n.tenantName && landlordTenants.has(n.tenantName.toLowerCase().trim())) return true;
        if (landlordLeases.length === 0 && !n.landlordEmail && !n.authorEmail) return true;
        return false;
      }).sort(compareNotificationsDesc);
    } catch (e) {
      console.error('Erreur lecture notifications:', e);
    }
    return [];
  },

  markNotificationAsRead(id: string): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const current: LandlordNotification[] = JSON.parse(stored);
        const updated = current.map((n) => (n.id === id || n.convId === id || n.noticeId === id ? { ...n, read: true } : n));
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
        notifyStorageChange();
        window.dispatchEvent(new CustomEvent('locagestion:notifications_updated'));
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ landlordNotifications: updated }),
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Erreur mise à jour notification:', e);
    }
  },

  deleteNotification(id: string): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const current: LandlordNotification[] = JSON.parse(stored);
        const updated = current.filter((n) => n.id !== id && n.convId !== id);
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
        notifyStorageChange();
        window.dispatchEvent(new CustomEvent('locagestion:notifications_updated'));
      }
    } catch (e) {
      console.error('Erreur suppression notification:', e);
    }
  },

  addLandlordNotification(notif: LandlordNotification): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      const current: LandlordNotification[] = stored ? JSON.parse(stored) : [];
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const nowIso = now.toISOString();

      const enriched: LandlordNotification = {
        ...notif,
        createdAt: notif.createdAt || nowIso,
        time: (notif.time && !notif.time.toLowerCase().includes('instant')) ? notif.time : timeStr,
        timestamp: (notif.timestamp && !notif.timestamp.toLowerCase().includes('instant')) ? notif.timestamp : nowIso,
      };

      const updated = [enriched, ...current.filter((n) => n.id !== notif.id)].sort(compareNotificationsDesc);
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      notifyStorageChange();

      // Signal sonore universel instantané
      try {
        SoundService.playNotificationSound();
      } catch {}

      window.dispatchEvent(new CustomEvent('locagestion:notifications_updated'));
      window.dispatchEvent(new CustomEvent('locagestion:leases_updated', { detail: { leaseId: enriched.leaseId } }));
      window.dispatchEvent(new CustomEvent('locagestion:incidents_updated'));
      window.dispatchEvent(new Event('storage'));

      // Diffusion multi-onglets / multi-fenêtres immédiate via BroadcastChannel
      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('locagestion_realtime');
          bc.postMessage({ type: 'locagestion:notifications_updated', notification: enriched });
          bc.postMessage({ type: 'locagestion:leases_updated', leaseId: enriched.leaseId });
          bc.close();
        }
      } catch {}

      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landlordNotifications: updated }),
      }).catch(() => {});
    } catch (e) {
      console.error('Erreur ajout notification:', e);
    }
  },

  markNotificationsAsRead(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        const current: LandlordNotification[] = JSON.parse(stored);
        const updated = current.map((n) => ({ ...n, read: true }));
        localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
        notifyStorageChange();
        window.dispatchEvent(new CustomEvent('locagestion:notifications_updated'));
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ landlordNotifications: updated }),
        }).catch(() => {});
      }
    } catch (e) {
      console.error('Erreur mise à jour notifications:', e);
    }
  },
};
