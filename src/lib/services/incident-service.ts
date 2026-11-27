'use client';

import { LeaseService, LandlordNotification } from './lease-service';
import { TenantNotificationService } from './tenant-notification-service';
import { AuthUser } from '../types';
import { areEmailsEqual, arePhoneNumbersEqual } from './auth-service';

export type IncidentUrgency = 'normale' | 'urgente' | 'critique';
export type IncidentStatus = 'en_attente' | 'pris_en_charge' | 'en_cours_reparation' | 'resolu';

export interface ReportedIncident {
  id: string; // Ex: 'INC-2026-042'
  category: string; // Ex: 'Plomberie / Fuite d’eau'
  urgency: IncidentUrgency;
  description: string;
  photos: string[];
  createdAt: string;
  status: IncidentStatus;
  tenantName: string;
  tenantPhone: string;
  tenantEmail: string;
  property: string;
  unit: string;
  leaseId?: string;
  landlordId?: string;
  landlordEmail?: string;
  landlordPhone?: string;
  landlordName?: string;
  assignedTechnician?: {
    name: string;
    phone: string;
    trade: string;
  };
  resolutionNotes?: string;
  resolvedAt?: string;
  artisanFee?: number; // Montant facturé/payé à l'artisan en FCFA
  artisanPaymentStatus?: 'paye' | 'en_attente' | 'non_applicable';
  artisanInvoiceRef?: string; // N° de facture ou reçu d'intervention
}

export const INITIAL_INCIDENTS: ReportedIncident[] = [];

const INCIDENTS_STORAGE_KEY = 'locagestion:incidents:v1';

function notifyIncidentsChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('locagestion:incidents_updated'));
    window.dispatchEvent(new CustomEvent('locagestion:notifications_updated'));
    window.dispatchEvent(new CustomEvent('locagestion:leases_updated'));
    window.dispatchEvent(new Event('storage'));
    try {
      if ('BroadcastChannel' in window) {
        const bc = new BroadcastChannel('locagestion_realtime');
        bc.postMessage({ type: 'locagestion:incidents_updated' });
        bc.close();
      }
    } catch {}
  }
}

export const IncidentService = {
  getIncidents(): ReportedIncident[] {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(INCIDENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ReportedIncident[];
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error("Erreur lecture incidents:", e);
    }
    return [];
  },

  getIncidentById(id: string): ReportedIncident | undefined {
    return this.getIncidents().find((inc) => inc.id === id);
  },

  getIncidentsForTenant(user?: AuthUser | null): ReportedIncident[] {
    if (!user) return [];
    const all = this.getIncidents();
    const userEmail = user.email?.trim().toLowerCase();
    const userPhone = user.phone?.trim();
    const userName = user.name?.trim().toLowerCase();

    // Rapprochement par les baux du locataire (bailId ou unit)
    const tenantLeases = LeaseService.getLeasesForTenant(user);
    const tenantLeaseIds = new Set(tenantLeases.map((l) => l.id));
    const tenantUnits = new Set(tenantLeases.map((l) => (l.unit || '').toLowerCase().trim()));

    return all.filter((inc) => {
      // 1. Email direct
      if (userEmail && inc.tenantEmail && areEmailsEqual(userEmail, inc.tenantEmail)) return true;
      // 2. Téléphone direct
      if (userPhone && inc.tenantPhone && arePhoneNumbersEqual(userPhone, inc.tenantPhone)) return true;
      // 3. Liaison par bail actif ou lot d'habitation
      if (inc.leaseId && tenantLeaseIds.has(inc.leaseId)) return true;
      if (inc.unit && tenantUnits.has(inc.unit.toLowerCase().trim())) return true;
      // 4. Nom (ordre direct, inversé ou inclusion partielle de nom de famille ex: DJIGLA)
      if (userName && inc.tenantName) {
        const incName = inc.tenantName.trim().toLowerCase();
        if (userName === incName) return true;
        if (userName.includes(incName) || incName.includes(userName)) return true;
        const userWords = userName.split(/\s+/).filter((w) => w.length > 2);
        const incWords = incName.split(/\s+/).filter((w) => w.length > 2);
        if (userWords.some((w) => incWords.includes(w))) return true;
      }
      // 5. Compte officiel locataire Théodora DJIGLA
      if (userEmail && areEmailsEqual(userEmail, 'theodoradjigla@gmail.com')) {
        if (inc.tenantName && inc.tenantName.toLowerCase().includes('djigla')) return true;
      }
      return false;
    });
  },

  getIncidentsForLandlord(user?: AuthUser | null): ReportedIncident[] {
    if (!user) return [];
    if (user.role === 'admin' || user.email === 'admin@locagestion.site') return this.getIncidents();
    const all = this.getIncidents();
    const landlordLeases = LeaseService.getLeasesForLandlord(user);
    const propNames = new Set(landlordLeases.map((l) => (l.property || '').toLowerCase().trim()));
    const tenantNames = new Set(landlordLeases.map((l) => (l.tenant || '').toLowerCase().trim()));
    const tenantEmails = new Set(landlordLeases.map((l) => (l.tenantEmail || '').toLowerCase().trim()));
    const leaseIds = new Set(landlordLeases.map((l) => l.id));

    return all.filter((inc) => {
      // 1. Rapprochement direct par identifiants bailleur
      if (inc.landlordEmail && user.email && areEmailsEqual(inc.landlordEmail, user.email)) return true;
      if (inc.landlordId && user.id && inc.landlordId.toLowerCase() === user.id.toLowerCase()) return true;
      if (inc.landlordPhone && user.phone && arePhoneNumbersEqual(inc.landlordPhone, user.phone)) return true;
      // 2. Rapprochement par bail rattaché
      if (inc.leaseId && leaseIds.has(inc.leaseId)) return true;
      // 3. Rapprochement par bien immobilier du bailleur
      if (inc.property && propNames.has(inc.property.toLowerCase().trim())) return true;
      // 4. Rapprochement par locataire du bailleur
      if (inc.tenantName && tenantNames.has(inc.tenantName.toLowerCase().trim())) return true;
      if (inc.tenantEmail && tenantEmails.has(inc.tenantEmail.toLowerCase().trim())) return true;
      // 5. Administrateur ou bailleur principal canonique
      if (user.email && (areEmailsEqual(user.email, 'jobovog@gmail.com') || areEmailsEqual(user.email, 'admin@locagestion.site'))) return true;
      // 6. Si le bailleur n'a aucun bail explicite et que l'incident n'a pas de bailleur tiers exclusif
      if (landlordLeases.length === 0 && (!inc.landlordEmail || areEmailsEqual(inc.landlordEmail, 'jobovog@gmail.com') || areEmailsEqual(inc.landlordEmail, user.email))) return true;
      return false;
    });
  },

  saveAllIncidents(incidents: ReportedIncident[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(incidents));
      notifyIncidentsChange();
      window.dispatchEvent(new Event('storage'));

      // Diffusion multi-onglets / multi-fenêtres immédiate via BroadcastChannel
      try {
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('locagestion_realtime');
          bc.postMessage({ type: 'locagestion:incidents_updated', count: incidents.length });
          bc.close();
        }
      } catch {}

      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidents }),
      }).catch(() => {});
    } catch (e) {
      console.error('Erreur sauvegarde incidents:', e);
    }
  },

  // Création d'un incident par le locataire avec notification instantanée au bailleur
  addIncident(
    data: Omit<ReportedIncident, 'id' | 'createdAt' | 'status'> & {
      id?: string;
      createdAt?: string;
      status?: IncidentStatus;
      leaseId?: string;
      landlordId?: string;
      landlordEmail?: string;
      landlordPhone?: string;
      landlordName?: string;
    }
  ): ReportedIncident {
    const nowFormatted = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const newId = data.id || `INC-2026-${Math.floor(100 + Math.random() * 900)}`;

    // Résolution intelligente et automatique du bailleur et du contrat si non fournis
    let leaseId = data.leaseId;
    let landlordId = data.landlordId;
    let landlordEmail = data.landlordEmail;
    let landlordPhone = data.landlordPhone;
    let landlordName = data.landlordName;
    let property = data.property;
    let unit = data.unit;

    if (!landlordEmail || !leaseId) {
      const allLeases = LeaseService.getLeases();
      const tEmail = (data.tenantEmail || '').trim().toLowerCase();
      const tPhone = (data.tenantPhone || '').trim();
      const tName = (data.tenantName || '').trim().toLowerCase();
      const matched = allLeases.find((l) => {
        if (tEmail && l.tenantEmail && areEmailsEqual(tEmail, l.tenantEmail)) return true;
        if (tPhone && l.tenantPhone && arePhoneNumbersEqual(tPhone, l.tenantPhone)) return true;
        if (tName && l.tenant && tName === l.tenant.trim().toLowerCase()) return true;
        if (property && property !== 'Logement principal' && l.property && l.property.trim().toLowerCase() === property.trim().toLowerCase()) return true;
        return false;
      });

      if (matched) {
        leaseId = leaseId || matched.id;
        landlordId = landlordId || matched.landlordId;
        landlordEmail = landlordEmail || matched.landlordEmail;
        landlordPhone = landlordPhone || matched.landlordPhone;
        landlordName = landlordName || matched.landlordName;
        if (!property || property === 'Logement principal') property = matched.property;
        if (!unit || unit === 'Lot') unit = matched.unit;
      }
    }

    const newIncident: ReportedIncident = {
      id: newId,
      category: data.category,
      urgency: data.urgency,
      description: data.description,
      photos: data.photos || [],
      createdAt: data.createdAt || nowFormatted,
      status: data.status || 'en_attente',
      tenantName: data.tenantName || 'Locataire',
      tenantPhone: data.tenantPhone || '',
      tenantEmail: data.tenantEmail || '',
      property: property || 'Bien immobilier',
      unit: unit || 'Lot',
      leaseId,
      landlordId,
      landlordEmail,
      landlordPhone,
      landlordName,
      assignedTechnician: data.assignedTechnician,
      resolutionNotes: data.resolutionNotes,
    };

    const current = this.getIncidents();
    const updated = [newIncident, ...current.filter((i) => i.id !== newId)];
    this.saveAllIncidents(updated);

    // Déclencher une notification officielle et enrichie pour le Bailleur
    const notification: LandlordNotification = {
      id: `notif-inc-${Date.now()}`,
      title: `⚠️ Panne signalée : ${newIncident.category}`,
      message: `${newIncident.tenantName} (${newIncident.unit} • ${newIncident.property}) a signalé une panne [Urgence ${newIncident.urgency.toUpperCase()}] : "${newIncident.description}". ${newIncident.photos.length} photo(s) jointe(s).`,
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      timestamp: nowFormatted,
      type: 'incident_reported',
      read: false,
      incidentId: newIncident.id,
      leaseId: newIncident.leaseId,
      tenantName: newIncident.tenantName,
      unit: newIncident.unit,
      property: newIncident.property,
      urgency: newIncident.urgency,
      category: newIncident.category,
      photos: newIncident.photos,
      landlordId: newIncident.landlordId,
      landlordEmail: newIncident.landlordEmail,
      landlordPhone: newIncident.landlordPhone,
      landlordName: newIncident.landlordName,
      emailSentTo: newIncident.landlordEmail || 'jobovog@gmail.com',
      emailDelivered: {
        to: newIncident.landlordEmail || 'jobovog@gmail.com',
        from: 'alertes@locagestion.site',
        subject: `[ALERTE TECHNIQUE ${newIncident.urgency.toUpperCase()}] ${newIncident.category} — ${newIncident.unit} (${newIncident.tenantName})`,
        date: nowFormatted,
        preview: `Nouveau constat technique transmis par le locataire ${newIncident.tenantName} pour le lot ${newIncident.unit} (${newIncident.property}) avec ${newIncident.photos.length} photo(s) justificative(s).`,
      },
    };

    LeaseService.addLandlordNotification(notification);

    return newIncident;
  },

  // Mise à jour du statut d'intervention par le bailleur
  updateIncidentStatus(
    id: string,
    status: IncidentStatus,
    resolutionNotes?: string
  ): ReportedIncident | null {
    const current = this.getIncidents();
    const index = current.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const incident = current[index];
    const nowFormatted = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const updated: ReportedIncident = {
      ...incident,
      status,
      resolutionNotes: resolutionNotes ?? incident.resolutionNotes,
      resolvedAt: status === 'resolu' ? nowFormatted : incident.resolvedAt,
    };

    current[index] = updated;
    this.saveAllIncidents(current);

    if (updated.status === 'resolu') {
      try {
        const lNotifs = LeaseService.getLandlordNotifications();
        lNotifs.forEach((n) => {
          if (n.incidentId === id || (n.type === 'incident_reported' && n.unit === updated.unit)) {
            LeaseService.markNotificationAsRead(n.id);
          }
        });
      } catch {}
    }

    // Alerter le locataire du suivi de son signalement
    TenantNotificationService.notifyIncidentUpdated({
      incidentId: updated.id,
      incidentTitle: updated.category || 'Panne signalée',
      status: updated.status === 'resolu' ? 'resolu' : updated.status === 'pris_en_charge' ? 'en_cours' : 'en_cours',
      tenantName: updated.tenantName,
      tenantEmail: updated.tenantEmail,
      tenantPhone: updated.tenantPhone,
      artisanName: updated.assignedTechnician?.name,
      artisanPhone: updated.assignedTechnician?.phone,
      artisanTrade: updated.assignedTechnician?.trade,
      link: '/incidents',
    });

    return updated;
  },

  // Mise à jour complète de la fiche et de la mission artisan (frais artisan inclus)
  updateIncidentFull(
    id: string,
    updates: {
      status?: IncidentStatus;
      resolutionNotes?: string;
      assignedTechnician?: {
        name: string;
        phone: string;
        trade: string;
      };
      artisanFee?: number;
      artisanPaymentStatus?: 'paye' | 'en_attente' | 'non_applicable';
      artisanInvoiceRef?: string;
    }
  ): ReportedIncident | null {
    const current = this.getIncidents();
    const index = current.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const incident = current[index];
    const nowFormatted = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const updated: ReportedIncident = {
      ...incident,
      status: updates.status ?? incident.status,
      resolutionNotes: updates.resolutionNotes !== undefined ? updates.resolutionNotes : incident.resolutionNotes,
      assignedTechnician: updates.assignedTechnician !== undefined ? updates.assignedTechnician : incident.assignedTechnician,
      artisanFee: updates.artisanFee !== undefined ? updates.artisanFee : incident.artisanFee,
      artisanPaymentStatus: updates.artisanPaymentStatus !== undefined ? updates.artisanPaymentStatus : incident.artisanPaymentStatus,
      artisanInvoiceRef: updates.artisanInvoiceRef !== undefined ? updates.artisanInvoiceRef : incident.artisanInvoiceRef,
      resolvedAt: updates.status === 'resolu' ? nowFormatted : incident.resolvedAt,
    };

    current[index] = updated;
    this.saveAllIncidents(current);

    if (updated.status === 'resolu') {
      try {
        const lNotifs = LeaseService.getLandlordNotifications();
        lNotifs.forEach((n) => {
          if (n.incidentId === id || (n.type === 'incident_reported' && n.unit === updated.unit)) {
            LeaseService.markNotificationAsRead(n.id);
          }
        });
      } catch {}
    }

    // Alerter le locataire du suivi de son signalement
    TenantNotificationService.notifyIncidentUpdated({
      incidentId: updated.id,
      incidentTitle: updated.category || 'Panne signalée',
      status: updated.status === 'resolu' ? 'resolu' : updated.status === 'pris_en_charge' ? 'en_cours' : 'en_cours',
      tenantName: updated.tenantName,
      tenantEmail: updated.tenantEmail,
      tenantPhone: updated.tenantPhone,
      artisanName: updated.assignedTechnician?.name,
      artisanPhone: updated.assignedTechnician?.phone,
      artisanTrade: updated.assignedTechnician?.trade,
      link: '/incidents',
    });

    return updated;
  },

  // Calcul du cumul des dépenses & travaux payés ou engagés aux artisans
  getTotalArtisanExpenses(): number {
    const incidents = this.getIncidents();
    const sum = incidents.reduce((acc, curr) => acc + (curr.artisanFee || 0), 0);
    return sum;
  },

  // Attribution d'un artisan ou technicien
  assignTechnician(
    id: string,
    technician: { name: string; phone: string; trade: string }
  ): ReportedIncident | null {
    const current = this.getIncidents();
    const index = current.findIndex((i) => i.id === id);
    if (index === -1) return null;

    const updated: ReportedIncident = {
      ...current[index],
      assignedTechnician: technician,
      status: 'pris_en_charge',
    };

    current[index] = updated;
    this.saveAllIncidents(current);

    if (updated.status === 'resolu') {
      try {
        const lNotifs = LeaseService.getLandlordNotifications();
        lNotifs.forEach((n) => {
          if (n.incidentId === id || (n.type === 'incident_reported' && n.unit === updated.unit)) {
            LeaseService.markNotificationAsRead(n.id);
          }
        });
      } catch {}
    }

    // Alerter le locataire du suivi de son signalement
    TenantNotificationService.notifyIncidentUpdated({
      incidentId: updated.id,
      incidentTitle: updated.category || 'Panne signalée',
      status: updated.status === 'resolu' ? 'resolu' : updated.status === 'pris_en_charge' ? 'en_cours' : 'en_cours',
      tenantName: updated.tenantName,
      tenantEmail: updated.tenantEmail,
      tenantPhone: updated.tenantPhone,
      artisanName: updated.assignedTechnician?.name,
      artisanPhone: updated.assignedTechnician?.phone,
      artisanTrade: updated.assignedTechnician?.trade,
      link: '/incidents',
    });

    return updated;
  },

  // Suppression d'un incident
  deleteIncident(id: string): boolean {
    const current = this.getIncidents();
    const filtered = current.filter((i) => i.id !== id);
    if (filtered.length !== current.length) {
      this.saveAllIncidents(filtered);
      return true;
    }
    return false;
  },
};

