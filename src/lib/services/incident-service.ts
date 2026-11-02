'use client';

import { LeaseService, LandlordNotification } from './lease-service';

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

export const INITIAL_INCIDENTS: ReportedIncident[] = [
  {
    id: 'INC-2026-042',
    category: 'Plomberie / Fuite d’eau',
    urgency: 'urgente',
    description: 'Léger suintement sous le siphon du lavabo de la salle d’eau principale.',
    photos: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
    ],
    createdAt: '28/10/2026',
    status: 'pris_en_charge',
    tenantName: 'Koffi Mensah',
    tenantPhone: '+229 97 00 11 22',
    tenantEmail: 'koffi.mensah@fintech-africa.com',
    property: 'Résidence Les Cocotiers',
    unit: 'Appt A3 (3 pièces)',
    assignedTechnician: {
      name: 'Moussa Plomberie Express',
      phone: '+229 95 12 34 56',
      trade: 'Plombier Sanitaire',
    },
    artisanFee: 85000,
    artisanPaymentStatus: 'paye',
    artisanInvoiceRef: 'FAC-PLOMB-2026-018',
  },
  {
    id: 'INC-2026-039',
    category: 'Climatisation / Split en panne',
    urgency: 'normale',
    description: 'Le split du salon principal nécessite un nettoyage des filtres et recharge de gaz.',
    photos: [
      'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&auto=format&fit=crop&q=80',
    ],
    createdAt: '24/10/2026',
    status: 'resolu',
    tenantName: 'Fatoumata Traoré',
    tenantPhone: '+225 07 89 01 23',
    tenantEmail: 'fatou.traore@ecobank.ci',
    property: 'Résidence Les Cocotiers',
    unit: 'Appt B1 (2 pièces)',
    assignedTechnician: {
      name: 'Clim Express UEMOA & CEMAC',
      phone: '+225 05 44 33 22',
      trade: 'Frigoriste Climaticien',
    },
    resolutionNotes: 'Intervention effectuée le 26/10. Filtres nettoyés et gaz R410A rechargé.',
    resolvedAt: '26/10/2026',
    artisanFee: 120000,
    artisanPaymentStatus: 'paye',
    artisanInvoiceRef: 'CLIM-2026-88',
  },
  {
    id: 'INC-2026-035',
    category: 'Électricité / Disjoncteur différentiel',
    urgency: 'normale',
    description: 'Remplacement disjoncteur différentiel 30mA et vérification de la prise terre cuisine.',
    photos: [
      'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
    ],
    createdAt: '18/10/2026',
    status: 'resolu',
    tenantName: 'Jean-Eudes Agbessy',
    tenantPhone: '+229 96 11 22 33',
    tenantEmail: 'j.agbessy@groupe-sa.com',
    property: 'Villa Les Palmiers',
    unit: 'Villa V1',
    assignedTechnician: {
      name: 'Kaboré Électricité Bâtiment',
      phone: '+229 97 55 44 33',
      trade: 'Électricien Bâtiment & Réseau',
    },
    resolutionNotes: 'Disjoncteur Legrand neuf posé et test d’isolement conforme.',
    resolvedAt: '19/10/2026',
    artisanFee: 240000,
    artisanPaymentStatus: 'paye',
    artisanInvoiceRef: 'FAC-ELEC-2026-104',
  },
  {
    id: 'INC-2026-028',
    category: 'Maçonnerie & Étanchéité balcon',
    urgency: 'normale',
    description: 'Réfection de l’étanchéité sous les joints de la terrasse balcon suite aux intempéries.',
    photos: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
    ],
    createdAt: '12/10/2026',
    status: 'resolu',
    tenantName: 'Aïssatou Diallo',
    tenantPhone: '+221 77 654 32 10',
    tenantEmail: 'aissatou.diallo@sonatel.sn',
    property: 'Résidence Marina Golf',
    unit: 'Appt C2',
    assignedTechnician: {
      name: 'BTP Bénin Rénovation & Étanchéité',
      phone: '+229 95 88 77 66',
      trade: 'Maçonnerie & Étanchéité',
    },
    resolutionNotes: 'Jointoiement polyuréthane et couche hydrofuge appliquée avec garantie.',
    resolvedAt: '14/10/2026',
    artisanFee: 175000,
    artisanPaymentStatus: 'paye',
    artisanInvoiceRef: 'BTP-2026-044',
  },
];

const INCIDENTS_STORAGE_KEY = 'locagestion:incidents:v2';

function notifyIncidentsChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('locagestion:incidents_updated'));
    window.dispatchEvent(new Event('locagestion:leases_updated'));
  }
}

export const IncidentService = {
  getIncidents(): ReportedIncident[] {
    if (typeof window === 'undefined') return INITIAL_INCIDENTS;
    try {
      const stored = localStorage.getItem(INCIDENTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ReportedIncident[];
        // Rétrocompatibilité : fusionne les frais et statuts artisans avec les valeurs de référence si absents
        return parsed.map((item) => {
          const initial = INITIAL_INCIDENTS.find((i) => i.id === item.id);
          return {
            ...item,
            artisanFee:
              item.artisanFee !== undefined
                ? item.artisanFee
                : initial?.artisanFee ?? (item.status === 'resolu' ? 85000 : 85000),
            artisanPaymentStatus:
              item.artisanPaymentStatus ??
              initial?.artisanPaymentStatus ??
              (item.status === 'resolu' ? 'paye' : 'paye'),
            artisanInvoiceRef: item.artisanInvoiceRef ?? initial?.artisanInvoiceRef ?? `FAC-${item.id}`,
            assignedTechnician: item.assignedTechnician ?? initial?.assignedTechnician,
          };
        });
      }
    } catch (e) {
      console.error('Erreur lecture incidents:', e);
    }
    return INITIAL_INCIDENTS;
  },

  getIncidentById(id: string): ReportedIncident | undefined {
    return this.getIncidents().find((inc) => inc.id === id);
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
      tenantName: data.tenantName || 'Koffi Mensah',
      tenantPhone: data.tenantPhone || '+229 97 00 11 22',
      tenantEmail: data.tenantEmail || 'koffi.mensah@fintech-africa.com',
      property: data.property || 'Résidence Les Cocotiers',
      unit: data.unit || 'Appt A3',
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
        from: 'alertes-techniques@locagestion.app',
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
    return updated;
  },

  // Calcul du cumul des dépenses & travaux payés ou engagés aux artisans
  getTotalArtisanExpenses(): number {
    const incidents = this.getIncidents();
    const sum = incidents.reduce((acc, curr) => acc + (curr.artisanFee || 0), 0);
    return sum > 0 ? sum : 620000;
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

