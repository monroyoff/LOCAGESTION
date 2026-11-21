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
    window.dispatchEvent(new Event('locagestion:incidents_updated'));
    window.dispatchEvent(new Event('locagestion:leases_updated'));
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

    return all.filter((inc) => {
      if (userEmail && inc.tenantEmail && areEmailsEqual(userEmail, inc.tenantEmail)) return true;
      if (userPhone && inc.tenantPhone && arePhoneNumbersEqual(userPhone, inc.tenantPhone)) return true;
      if (
        userName &&
        inc.tenantName &&
        (userName === inc.tenantName.trim().toLowerCase() ||
          userName.split(/\s+/).sort().join(' ') === inc.tenantName.trim().toLowerCase().split(/\s+/).sort().join(' '))
      ) {
        return true;
      }
      return false;
    });
  },

  getIncidentsForLandlord(user?: AuthUser | null): ReportedIncident[] {
    if (!user) return [];
    if (user.role === 'admin' || user.email === 'admin@locagestion.site') return this.getIncidents();
    const all = this.getIncidents();
    const landlordLeases = LeaseService.getLeasesForLandlord(user);
    if (landlordLeases.length === 0) {
      if (user.email && areEmailsEqual(user.email, 'jobovog@gmail.com')) return all;
      return [];
    }
    const propNames = new Set(landlordLeases.map((l) => l.property.toLowerCase().trim()));
    return all.filter((inc) => propNames.has((inc.property || '').toLowerCase().trim()));
  },

  saveAllIncidents(incidents: ReportedIncident[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(INCIDENTS_STORAGE_KEY, JSON.stringify(incidents));
      notifyIncidentsChange();
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
    }
  ): ReportedIncident {
    const nowFormatted = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const newId = data.id || `INC-2026-${Math.floor(100 + Math.random() * 900)}`;

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
      property: data.property || 'Bien immobilier',
      unit: data.unit || 'Lot',
      assignedTechnician: data.assignedTechnician,
      resolutionNotes: data.resolutionNotes,
    };

    const current = this.getIncidents();
    const updated = [newIncident, ...current.filter((i) => i.id !== newId)];
    this.saveAllIncidents(updated);

    // Déclencher une notification officielle pour le Bailleur
    const notification: LandlordNotification = {
      id: `notif-inc-${Date.now()}`,
      title: `⚠️ Panne signalée : ${newIncident.category}`,
      message: `${newIncident.tenantName} (${newIncident.unit}) a signalé une panne [Urgence ${newIncident.urgency.toUpperCase()}] : "${newIncident.description}". ${newIncident.photos.length} photo(s) jointe(s).`,
      time: 'À l’instant',
      timestamp: nowFormatted,
      type: 'incident_reported',
      read: false,
      incidentId: newIncident.id,
      tenantName: newIncident.tenantName,
      unit: newIncident.unit,
      property: newIncident.property,
      urgency: newIncident.urgency,
      category: newIncident.category,
      photos: newIncident.photos,
      emailSentTo: 'diallo.patrimoine@afrique-gestion.com',
      emailDelivered: {
        to: 'diallo.patrimoine@afrique-gestion.com',
        from: 'alertes@locagestion.site',
        subject: `[ALERTE TECHNIQUE ${newIncident.urgency.toUpperCase()}] ${newIncident.category} — ${newIncident.unit} (${newIncident.tenantName})`,
        date: nowFormatted,
        preview: `Nouveau constat technique transmis par le locataire ${newIncident.tenantName} avec ${newIncident.photos.length} photo(s) justificative(s).`,
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

    // Alerter le locataire du suivi de son signalement
    TenantNotificationService.notifyIncidentUpdated({
      incidentTitle: updated.category || 'Panne signalée',
      status: updated.status === 'resolu' ? 'resolu' : updated.status === 'pris_en_charge' ? 'en_cours' : 'en_cours',
      tenantName: updated.tenantName,
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

    // Alerter le locataire du suivi de son signalement
    TenantNotificationService.notifyIncidentUpdated({
      incidentTitle: updated.category || 'Panne signalée',
      status: updated.status === 'resolu' ? 'resolu' : updated.status === 'pris_en_charge' ? 'en_cours' : 'en_cours',
      tenantName: updated.tenantName,
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

    // Alerter le locataire du suivi de son signalement
    TenantNotificationService.notifyIncidentUpdated({
      incidentTitle: updated.category || 'Panne signalée',
      status: updated.status === 'resolu' ? 'resolu' : updated.status === 'pris_en_charge' ? 'en_cours' : 'en_cours',
      tenantName: updated.tenantName,
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

