'use client';

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
  property: string;
  unit: string;
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
  isNewAccount?: boolean;
  invitedAt?: string;
  invitationCode?: string;
}

export const REGISTERED_TENANTS: RegisteredTenant[] = [
  {
    id: 'ten-01',
    name: 'Koffi Mensah',
    email: 'koffi.mensah@fintech-africa.com',
    phone: '+229 97 00 11 22',
    property: 'Résidence Les Cocotiers',
    unit: 'Appt A3 (3 pièces • 75 m²)',
  },
  {
    id: 'ten-02',
    name: 'Amina Diop',
    email: 'amina.diop@orange-sonatel.sn',
    phone: '+221 77 123 45 67',
    property: 'Villa Émeraude',
    unit: 'Villa R+1 Ouest',
  },
  {
    id: 'ten-03',
    name: 'Fatoumata Traoré',
    email: 'fatou.traore@ecobank.ci',
    phone: '+225 07 89 01 23',
    property: 'Résidence Les Cocotiers',
    unit: 'Appt B1 (2 pièces)',
  },
  {
    id: 'ten-04',
    name: 'Jean-Yves Kouassi',
    email: 'jy.kouassi@abidjan-tech.ci',
    phone: '+225 05 44 33 22',
    property: 'Immeuble Palmier Royal',
    unit: 'Studio B12',
  },
];

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
    | 'notice_received';
  read: boolean;
  leaseId?: string;
  incidentId?: string;
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
    id: 'BAIL-2025-089',
    tenant: 'Koffi Mensah',
    tenantId: 'ten-01',
    tenantEmail: 'koffi.mensah@fintech-africa.com',
    tenantPhone: '+229 97 00 11 22',
    property: 'Résidence Les Cocotiers',
    unit: 'Appt A3 (3 pièces)',
    rent: 220000,
    charges: 30000,
    deposit: 660000,
    startDate: '01/01/2025',
    endDate: '31/12/2025',
    status: 'actif',
    signedByLandlord: true,
    signedByTenant: true,
    landlordSignedAt: '01/01/2025 à 10:00',
    tenantSignedAt: '01/01/2025 à 14:15',
    hashSha256: '9f83a84f3e8b0129cd8a77f2409849204820194820183029482019482019a84f',
  },
  {
    id: 'BAIL-2025-112',
    tenant: 'Amina Diop',
    tenantId: 'ten-02',
    tenantEmail: 'amina.diop@orange-sonatel.sn',
    tenantPhone: '+221 77 123 45 67',
    property: 'Villa Émeraude',
    unit: 'Villa R+1 Ouest',
    rent: 350000,
    charges: 50000,
    deposit: 1050000,
    startDate: '15/03/2025',
    endDate: '14/03/2026',
    status: 'actif',
    signedByLandlord: true,
    signedByTenant: true,
    landlordSignedAt: '15/03/2025 à 09:30',
    tenantSignedAt: '15/03/2025 à 11:20',
    hashSha256: '7b22108492048201948204928104820492810482019482018302948201948201',
  },
  {
    id: 'BAIL-2025-045',
    tenant: 'Fatoumata Traoré',
    tenantId: 'ten-03',
    tenantEmail: 'fatou.traore@ecobank.ci',
    tenantPhone: '+225 07 89 01 23',
    property: 'Résidence Les Cocotiers',
    unit: 'Appt B1 (2 pièces)',
    rent: 180000,
    charges: 25000,
    deposit: 540000,
    startDate: '01/06/2025',
    endDate: '31/05/2026',
    status: 'actif',
    signedByLandlord: true,
    signedByTenant: true,
    landlordSignedAt: '01/06/2025 à 11:00',
    tenantSignedAt: '01/06/2025 à 16:45',
    hashSha256: '3f04820194820183029482019482019a84f3e8b0129cd8a77f24098492048f',
  },
  {
    id: 'BAIL-2025-072',
    tenant: 'Jean-Yves Kouassi',
    tenantId: 'ten-04',
    tenantEmail: 'jy.kouassi@abidjan-tech.ci',
    tenantPhone: '+225 05 44 33 22',
    property: 'Immeuble Palmier Royal',
    unit: 'Studio B12',
    rent: 140000,
    charges: 20000,
    deposit: 420000,
    startDate: '01/02/2025',
    endDate: '31/01/2026',
    status: 'actif',
    signedByLandlord: true,
    signedByTenant: true,
    landlordSignedAt: '01/02/2025 à 14:00',
    tenantSignedAt: '01/02/2025 à 15:30',
    hashSha256: '5d820194820183029482019482019a84f3e8b0129cd8a77f24098492048f0293',
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
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Erreur lecture baux:', e);
    }
    return INITIAL_LEASES;
  },

  getLeaseById(id: string): Lease | undefined {
    const leases = this.getLeases();
    return leases.find((l) => l.id === id);
  },

  // Récupérer le bail en attente de signature pour un locataire spécifique (ex: Koffi Mensah)
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
    } catch (e) {
      console.error('Erreur sauvegarde bail:', e);
    }
  },

  saveAllLeases(leases: Lease[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(LEASES_STORAGE_KEY, JSON.stringify(leases));
      notifyStorageChange();
    } catch (e) {
      console.error('Erreur sauvegarde baux:', e);
    }
  },

  // Récupérer la liste des locataires certifiés (avec persistance)
  getRegisteredTenants(): RegisteredTenant[] {
    if (typeof window === 'undefined') return REGISTERED_TENANTS;
    try {
      const stored = localStorage.getItem('locagestion:registered_tenants');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Erreur lecture locataires enregistrés:', e);
    }
    return REGISTERED_TENANTS;
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
        property: 'Résidence Les Cocotiers',
        unit: 'Appt A3',
        rent: 220000,
        startDate: '01/11/2026',
        status: 'actif',
        signedByLandlord: true,
        signedByTenant: true,
        tenantSignedAt: nowFormatted,
      };
      this.saveLease(updatedLease);
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
        from: 'baux-notification@locagestion.app',
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

    // Notification de résiliation
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
