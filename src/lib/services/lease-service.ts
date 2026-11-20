'use client';

import { TenantNotificationService } from './tenant-notification-service';

export type LeaseStatus =
  | 'actif'
  | 'en_attente_signature'
  | 'resilie'
  | 'brouillon';

export interface Lease {
  id: string; // Ex: 'BAIL-2026-N09'
  tenantId?: string;
  tenant: string;
  tenantEmail?: string;
  tenantPhone?: string;
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
}

export interface RegisteredTenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  property?: string;
  unit?: string;
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
  type:
    | 'lease_signed'
    | 'lease_transmitted'
    | 'payment_declared'
    | 'incident_reported'
    | 'lease_terminated'
    | 'lease_reactivated'
    | 'notice_received'
    | 'listing_approved'
    | 'listing_rejected';
  read: boolean;
  leaseId?: string;
  incidentId?: string;
  listingId?: string;
  paymentId?: string;
  tenantName?: string;
  unit?: string;
  property?: string;
  urgency?: string;
  category?: string;
  photos?: string[];
  emailSentTo?: string;
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
    tenantAddress: 'Haie Vive, Cotonou',
    property: 'CHAMBRE SALON SANITAIRE',
    unit: 'Lot 1 (Chambre Salon Sanitaire • 45 m²)',
    propertyAddress: 'Haie Vive, Cotonou',
    propertyDistrict: 'Haie Vive',
    propertyCity: 'Cotonou',
    propertyLocation: 'Haie Vive, Cotonou, Bénin',
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
];

const LEASES_STORAGE_KEY = 'locagestion:leases:v1';
const NOTIFICATIONS_STORAGE_KEY = 'locagestion:landlord_notifications:v1';

function notifyStorageChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('locagestion:leases_updated'));
  }
}

export const LeaseService = {
  getLeases(): Lease[] {
    if (typeof window === 'undefined') return INITIAL_LEASES;
    try {
      const stored = localStorage.getItem(LEASES_STORAGE_KEY);
      if (stored) {
        let parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Élimination absolue et définitive du faux mock obsolète BAIL-2026-BJ-17635 (75 000 FCFA)
          const hadOldMock = parsed.some((l: Lease) => l.id === 'BAIL-2026-BJ-17635');
          if (hadOldMock) {
            parsed = parsed.filter((l: Lease) => l.id !== 'BAIL-2026-BJ-17635');
          }

          // Si le vrai bail actif de Jojo VOG (BAIL-2026-421) n'est pas encore présent, le fusionner
          const hasRealLease = parsed.some((l: Lease) => l.id === 'BAIL-2026-421');
          if (!hasRealLease && INITIAL_LEASES.length > 0) {
            const merged = [...INITIAL_LEASES, ...parsed];
            try {
              localStorage.setItem(LEASES_STORAGE_KEY, JSON.stringify(merged));
            } catch (e) {}
            return merged;
          }

          if (hadOldMock) {
            try {
              localStorage.setItem(LEASES_STORAGE_KEY, JSON.stringify(parsed));
            } catch (e) {}
          }

          // Si le bail canonique est présent mais sans les coordonnées complètes du bailleur, les enrichir
          const jojoLease = parsed.find((l: Lease) => l.id === 'BAIL-2026-421');
          if (
            jojoLease &&
            (!jojoLease.landlordPhone ||
              !jojoLease.landlordPaymentMethods ||
              !jojoLease.propertyLocation ||
              !jojoLease.advanceMonths ||
              jojoLease.landlordPhone.includes('97 00 11 22'))
          ) {
            Object.assign(jojoLease, {
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
            try {
              localStorage.setItem(LEASES_STORAGE_KEY, JSON.stringify(parsed));
            } catch (e) {}
          }
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
      } catch (e) {}
    }
    return INITIAL_LEASES;
  },

  getLeaseById(id: string): Lease | undefined {
    const leases = this.getLeases();
    return leases.find((l) => l.id === id);
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

      // Synchronisation temps réel immédiate Web <-> Mobile
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leases: updated }),
      }).catch(() => {});
    } catch (e) {
      console.error('Erreur sauvegarde bail:', e);
    }
  },

  saveAllLeases(leases: Lease[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LEASES_STORAGE_KEY, JSON.stringify(leases));
      notifyStorageChange();

      // Synchronisation temps réel immédiate Web <-> Mobile
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leases }),
      }).catch(() => {});
    } catch (e) {
      console.error('Erreur sauvegarde baux:', e);
    }
  },

  // Récupérer la liste des locataires certifiés (avec persistance)
  getRegisteredTenants(): RegisteredTenant[] {
    if (typeof window === 'undefined') return [];
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
          return sanitized;
        }
      }
    } catch (e) {
      console.error('Erreur lecture locataires enregistrés:', e);
    }
    return [];
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
          updatedLease.listingId || updatedLease.listingReference!,
          updatedLease.id
        );
      } catch (err) {
        console.error('Erreur retrait automatique annonce après contresignature:', err);
      }
    }

    // Créer la notification pour informer le bailleur dans l'app et par mail
    const notification: LandlordNotification = {
      id: `notif-${Date.now()}`,
      title: 'Bail contresigné par le locataire !',
      message: `${tenantName} a apposé sa signature électronique sur le contrat ${leaseId} (${updatedLease.unit}). Le bail est désormais actif et opposable.`,
      time: 'À l’instant',
      timestamp: nowFormatted,
      type: 'lease_signed',
      read: false,
      leaseId: leaseId,
      tenantName: tenantName,
      unit: updatedLease.unit,
      property: updatedLease.property,
      emailSentTo: 'diallo.patrimoine@afrique-gestion.com',
      emailDelivered: {
        to: 'diallo.patrimoine@afrique-gestion.com',
        from: 'baux@locagestion.site',
        subject: `[Bail Contresigné] ${leaseId} — ${tenantName} (${updatedLease.unit})`,
        date: nowFormatted,
        preview: `Le contrat de bail ${leaseId} a été contresigné électroniquement par ${tenantName} avec horodatage légal conforme UEMOA & CEMAC.`,
      },
    };

    this.addLandlordNotification(notification);

    return { lease: updatedLease, notification };
  },

  // Action : Résilier définitivement le bail
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
      resiliatedAt: nowFormatted,
      resiliationReason: reason || 'Résiliation à la demande du bailleur',
    };

    leases[leaseIndex] = updatedLease;
    this.saveAllLeases(leases);

    // Notification de résiliation pour le bailleur
    this.addLandlordNotification({
      id: `notif-${Date.now()}`,
      title: 'Bail résilié',
      message: `Le contrat ${leaseId} (${updatedLease.unit} - ${updatedLease.tenant}) a été résilié. Le logement est désormais dissocié.`,
      time: 'À l’instant',
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

  // Action : Réactiver le bail sans autres démarches
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
      reactivatedAt: nowFormatted,
      resiliationReason: undefined,
    };

    leases[leaseIndex] = updatedLease;
    this.saveAllLeases(leases);

    // Notification de réactivation
    this.addLandlordNotification({
      id: `notif-${Date.now()}`,
      title: 'Bail réactivé',
      message: `Le contrat ${leaseId} (${updatedLease.unit} - ${updatedLease.tenant}) a été réactivé avec succès. La liaison locataire est rétablie sans autres démarches.`,
      time: 'À l’instant',
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

  // Notifications Bailleur
  getLandlordNotifications(): LandlordNotification[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Erreur lecture notifications:', e);
    }
    return [];
  },

  addLandlordNotification(notif: LandlordNotification): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getLandlordNotifications();
      const updated = [notif, ...current];
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      notifyStorageChange();
    } catch (e) {
      console.error('Erreur ajout notification:', e);
    }
  },

  markNotificationsAsRead(): void {
    if (typeof window === 'undefined') return;
    try {
      const current = this.getLandlordNotifications();
      const updated = current.map((n) => ({ ...n, read: true }));
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(updated));
      notifyStorageChange();
    } catch (e) {
      console.error('Erreur mise à jour notifications:', e);
    }
  },
};
