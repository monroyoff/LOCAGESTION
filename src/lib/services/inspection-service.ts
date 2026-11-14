'use client';

export interface InspectionPhoto {
  id: string;
  url: string;
  label: string;
  room: string;
  timestamp: string;
}

export interface InspectionData {
  type: 'entree' | 'sortie';
  date: string;
  meterCashPower: string;
  meterWater: string;
  keysDelivered: string;
  generalState: 'neuf' | 'tres_bon' | 'bon' | 'rafraichir';
  notes: string;
  photos: InspectionPhoto[];
  landlordSignedBy?: string;
  landlordSignedAt?: string;
  tenantSignedAt?: string;
}

const STORAGE_KEY = 'locagestion:inspections';

export const DEFAULT_INSPECTION_KOFFI: InspectionData = {
  type: 'entree',
  date: new Date().toISOString().split('T')[0],
  meterCashPower: 'Index prépayé individuel',
  meterWater: 'Index compteur divisionnaire',
  keysDelivered: 'Clés de sûreté remises',
  generalState: 'tres_bon',
  notes: 'Logement réceptionné en bon état.',
  landlordSignedBy: 'Le Bailleur',
  landlordSignedAt: new Date().toLocaleDateString('fr-FR'),
  photos: [],
};

export const InspectionService = {
  getAllInspections(): Record<string, InspectionData> {
    if (typeof window === 'undefined') {
      return {};
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Erreur lecture inspections:', e);
    }
    return {};
  },

  getInspectionByLeaseId(leaseId: string): InspectionData {
    const all = this.getAllInspections();
    if (all[leaseId]) {
      return all[leaseId];
    }
    return {
      ...DEFAULT_INSPECTION_KOFFI,
      date: new Date().toISOString().split('T')[0],
    };
  },

  saveInspection(leaseId: string, data: InspectionData): void {
    if (typeof window === 'undefined') return;
    try {
      const all = this.getAllInspections();
      all[leaseId] = data;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent('locagestion:inspections_updated', { detail: { leaseId } }));
    } catch (e) {
      console.error('Erreur sauvegarde inspection:', e);
    }
  },
};

