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
  date: '2025-01-01',
  meterCashPower: '1 420 kWh (Compteur prépayé SBEE individuel)',
  meterWater: '384 m³ (Index compteur divisionnaire SONEB)',
  keysDelivered: '3 clés de sûreté certifiées + 1 télécommande portail électrique',
  generalState: 'tres_bon',
  notes: 'Logement réceptionné en excellent état de propreté. Murs peints en blanc satiné, prises électriques et disjoncteurs testés fonctionnels. Aucune fuite d’eau constatée aux robinetteries.',
  landlordSignedBy: 'Mamadou Diallo',
  landlordSignedAt: '01/01/2025 à 11:00',
  photos: [
    {
      id: 'photo-default-1',
      url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80',
      label: 'Salon / Séjour : Vue générale, carrelage blanc poli et peinture neuve',
      room: 'Salon / Séjour',
      timestamp: '01/01/2025 à 10:15',
    },
    {
      id: 'photo-default-2',
      url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=1200&auto=format&fit=crop&q=80',
      label: 'Cuisine : Plan de travail granit, évier inox et robinetterie vérifiée',
      room: 'Cuisine',
      timestamp: '01/01/2025 à 10:22',
    },
    {
      id: 'photo-default-3',
      url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&auto=format&fit=crop&q=80',
      label: 'Chambre principale : Placards intégrés coulissants et fenêtre baie vitrée',
      room: 'Chambre principale',
      timestamp: '01/01/2025 à 10:30',
    },
    {
      id: 'photo-default-4',
      url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=1200&auto=format&fit=crop&q=80',
      label: 'Salle d’eau : Cabine de douche, lavabo moderne, étanchéité parfaite',
      room: 'Salle d’eau / WC',
      timestamp: '01/01/2025 à 10:38',
    },
    {
      id: 'photo-default-5',
      url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
      label: 'Tableau & Compteur Cash Power SBEE - Index relevé contradictoirement : 1 420 kWh',
      room: 'Compteurs & Tableaux',
      timestamp: '01/01/2025 à 10:45',
    },
    {
      id: 'photo-default-6',
      url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=1200&auto=format&fit=crop&q=80',
      label: 'Trousseau remis : 3 clés cylindre européen + 1 télécommande d’accès sécurisé',
      room: 'Entrée / Couloir',
      timestamp: '01/01/2025 à 10:50',
    },
  ],
};

export const InspectionService = {
  getAllInspections(): Record<string, InspectionData> {
    if (typeof window === 'undefined') {
      return { 'BAIL-2025-089': DEFAULT_INSPECTION_KOFFI };
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Erreur lecture inspections:', e);
    }
    // Initialisation avec le bail par défaut de Koffi
    const initial = { 'BAIL-2025-089': DEFAULT_INSPECTION_KOFFI };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch (e) {}
    return initial;
  },

  getInspectionByLeaseId(leaseId: string): InspectionData {
    const all = this.getAllInspections();
    if (all[leaseId]) {
      return all[leaseId];
    }
    // Si aucune inspection spécifique, renvoyer les données par défaut adaptées
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

