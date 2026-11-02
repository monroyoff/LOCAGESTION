'use client';

export type NoticeReasonType =
  | 'reprise_personnelle'
  | 'vente'
  | 'impayes_manquements'
  | 'travaux_majeurs'
  | 'terme_bail'
  | 'depart_locataire';

export type NoticeDeliveryMethod =
  | 'huissier'
  | 'main_propre'
  | 'courrier_recommande'
  | 'whatsapp_email';

export type NoticeStatus = 'en_cours' | 'notifie' | 'cloture' | 'annule';

export interface Notice {
  id: string; // Ex: 'PREAV-2026-001'
  tenantName: string;
  tenantPhone: string;
  tenantEmail?: string;
  propertyName: string;
  unitNumber: string;
  monthlyRent: number;
  reasonType: NoticeReasonType;
  reasonTitle: string;
  reasonDetails: string;
  noticeMonths: number; // 1, 2, 3, 6
  noticeDate: string; // JJ/MM/AAAA
  effectiveDate: string; // JJ/MM/AAAA (date de libération des lieux)
  deliveryMethod: NoticeDeliveryMethod;
  status: NoticeStatus;
  beneficiaryName?: string; // En cas de reprise personnelle (ex: M. Koffi Diallo, propriétaire)
  salePrice?: number; // En cas de vente (prix proposé en FCFA avec droit de préemption)
  legalBasis: string; // Référence légale UEMOA / OHADA
  departureInspectionDate?: string;
  notes?: string;
  createdAt: string;
}

export const NOTICE_REASONS_CATALOG: {
  type: NoticeReasonType;
  title: string;
  recommendedMonths: number;
  badgeColor: string;
  legalBasis: string;
  description: string;
  iconName: string;
}[] = [
  {
    type: 'reprise_personnelle',
    title: 'Reprise pour Habitation Personnelle',
    recommendedMonths: 3,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    legalBasis: 'Code Foncier & Domanial UEMOA - Droit de reprise du bailleur ou de ses ascendants/descendants',
    description: 'Le propriétaire bailleur reprend possession du logement pour y habiter personnellement ou y loger un ascendant ou descendant direct.',
    iconName: 'Home',
  },
  {
    type: 'vente',
    title: 'Congé pour Vente du Bien Immobilier',
    recommendedMonths: 3,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    legalBasis: 'Régime des Baux d’Habitation UEMOA - Droit de préemption légal du locataire en place',
    description: 'Mise en vente du bien immobilier libre de toute occupation, avec formulation préalable de l’offre d’acquisition au locataire titulaire du droit de préemption.',
    iconName: 'Tag',
  },
  {
    type: 'impayes_manquements',
    title: 'Motif Légitime & Sérieux (Impayés / Fautes Graves)',
    recommendedMonths: 1,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    legalBasis: 'Code Civil & Droit OHADA des Contrats - Résiliation pour inexécution fautive après mise en demeure',
    description: 'Défaut récurrent de paiement des loyers, dégradations volontaires des locaux, sous-location illicite ou troubles anormaux de voisinage avérés.',
    iconName: 'AlertTriangle',
  },
  {
    type: 'travaux_majeurs',
    title: 'Travaux Substantiels & Rénovation Lourde',
    recommendedMonths: 3,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    legalBasis: 'Réglementation Urbanistique & Salubrité UEMOA - Réhabilitation et mise en conformité structurelle',
    description: 'Réfection lourde de toiture, restructuration ou travaux de consolidation incompatibles avec le maintien des occupants pour des impératifs stricts de sécurité.',
    iconName: 'Hammer',
  },
  {
    type: 'terme_bail',
    title: 'Arrivée à Terme du Bail & Non-Renouvellement',
    recommendedMonths: 3,
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    legalBasis: 'Droit Commun des Baux à Durée Déterminée - Congé signifié avant échéance contractuelle',
    description: 'Notification du non-renouvellement du contrat de location arrivé à son terme contractuel normal.',
    iconName: 'CalendarCheck',
  },
  {
    type: 'depart_locataire',
    title: 'Départ Volontaire Notifié par le Locataire',
    recommendedMonths: 1,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    legalBasis: 'Résiliation unilatérale à l’initiative du preneur avec respect du préavis contractuel',
    description: 'Prise d’acte officielle du congé signifié par le locataire pour convenance personnelle ou mutation professionnelle.',
    iconName: 'DoorOpen',
  },
];

export const INITIAL_NOTICES: Notice[] = [
  {
    id: 'PREAV-2026-001',
    tenantName: 'Jean-Marc Kouassi',
    tenantPhone: '+225 07 45 12 34',
    tenantEmail: 'jm.kouassi@groupe-sifca.ci',
    propertyName: 'Immeuble Palmier Royal',
    unitNumber: 'Lot 101 (Chambre Salon • 45 m²)',
    monthlyRent: 120000,
    reasonType: 'reprise_personnelle',
    reasonTitle: 'Reprise pour Habitation Personnelle',
    reasonDetails: 'Le propriétaire reprend possession des lieux pour y loger son fils étudiant revenant à Abidjan pour la rentrée académique.',
    noticeMonths: 3,
    noticeDate: '15/09/2026',
    effectiveDate: '15/12/2026',
    deliveryMethod: 'huissier',
    status: 'en_cours',
    beneficiaryName: 'M. Rodrigue Diallo (Fils du propriétaire)',
    legalBasis: 'Code Foncier & Domanial UEMOA - Droit de reprise du bailleur pour descendant direct',
    departureInspectionDate: '14/12/2026',
    notes: 'Acte d’huissier signifié par Me Bamba, Commissaire de Justice. Locataire coopératif.',
    createdAt: '2026-09-15T08:30:00Z',
  },
  {
    id: 'PREAV-2026-002',
    tenantName: 'Ibrahim Touré',
    tenantPhone: '+225 05 67 89 01',
    tenantEmail: 'ibrahim.toure@afdb.org',
    propertyName: 'Immeuble Palmier Royal',
    unitNumber: 'Lot 201 (3 Pièces • 85 m²)',
    monthlyRent: 280000,
    reasonType: 'vente',
    reasonTitle: 'Congé pour Vente du Bien Immobilier',
    reasonDetails: 'Cession de l’immeuble libre de toute occupation. Offre de vente formulée en priorité au locataire avec droit de préemption légal.',
    noticeMonths: 3,
    noticeDate: '01/10/2026',
    effectiveDate: '31/12/2026',
    deliveryMethod: 'main_propre',
    salePrice: 48000000,
    status: 'en_cours',
    legalBasis: 'Droit des Baux UEMOA - Droit de préemption légal d’achat ouvert pour 30 jours',
    departureInspectionDate: '30/12/2026',
    notes: 'Courrier remis en main propre contre décharge manuscrite signée le 01/10/2026.',
    createdAt: '2026-10-01T09:15:00Z',
  },
  {
    id: 'PREAV-2026-003',
    tenantName: 'Fatoumata Traoré',
    tenantPhone: '+225 07 89 01 23',
    tenantEmail: 'fatou.traore@ecobank.ci',
    propertyName: 'Résidence Les Cocotiers',
    unitNumber: 'Appt B1 (2 pièces • 55 m²)',
    monthlyRent: 180000,
    reasonType: 'impayes_manquements',
    reasonTitle: 'Motif Légitime & Sérieux (Impayés)',
    reasonDetails: 'Retards cumulés excédant 26 jours sur l’échéance d’octobre et relances restées sans régularisation intégrale.',
    noticeMonths: 1,
    noticeDate: '28/10/2026',
    effectiveDate: '28/11/2026',
    deliveryMethod: 'huissier',
    status: 'notifie',
    legalBasis: 'Résiliation du bail pour manquements répétés aux obligations contractuelles de paiement',
    departureInspectionDate: '27/11/2026',
    notes: 'Notification formelle de mise en demeure avec préavis d’un mois pour libération des locaux.',
    createdAt: '2026-10-28T11:00:00Z',
  },
  {
    id: 'PREAV-2026-004',
    tenantName: 'Amina Diop',
    tenantPhone: '+221 77 123 45 67',
    tenantEmail: 'amina.diop@orange-sonatel.sn',
    propertyName: 'Villa Émeraude',
    unitNumber: 'Villa R+1 Ouest',
    monthlyRent: 350000,
    reasonType: 'travaux_majeurs',
    reasonTitle: 'Travaux Substantiels & Rénovation',
    reasonDetails: 'Réfection de la charpente et réhabilitation complète du système d’assainissement et étanchéité.',
    noticeMonths: 3,
    noticeDate: '01/09/2026',
    effectiveDate: '01/12/2026',
    deliveryMethod: 'courrier_recommande',
    status: 'en_cours',
    legalBasis: 'Arrêté d’autorisation de travaux municipaux et code de l’urbanisme',
    departureInspectionDate: '30/11/2026',
    notes: 'Devis de l’artisan BTP validé. Chantier planifié pour démarrage le 05/12/2026.',
    createdAt: '2026-09-01T14:20:00Z',
  },
];

const NOTICES_STORAGE_KEY = 'locagestion:notices:v1';

export class NoticeService {
  static getNotices(): Notice[] {
    if (typeof window === 'undefined') return INITIAL_NOTICES;
    try {
      const stored = localStorage.getItem(NOTICES_STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(INITIAL_NOTICES));
        return INITIAL_NOTICES;
      }
      return JSON.parse(stored);
    } catch {
      return INITIAL_NOTICES;
    }
  }

  static saveNotices(notices: Notice[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(notices));
    } catch (e) {
      console.error('Erreur sauvegarde notices:', e);
    }
  }

  static addNotice(notice: Omit<Notice, 'id' | 'createdAt'>): Notice {
    const notices = this.getNotices();
    const count = notices.length + 1;
    const year = new Date().getFullYear();
    const id = `PREAV-${year}-${String(count).padStart(3, '0')}`;
    const newNotice: Notice = {
      ...notice,
      id,
      createdAt: new Date().toISOString(),
    };
    const updated = [newNotice, ...notices];
    this.saveNotices(updated);
    return newNotice;
  }

  static updateNoticeStatus(id: string, status: NoticeStatus): void {
    const notices = this.getNotices();
    const updated = notices.map((n) => (n.id === id ? { ...n, status } : n));
    this.saveNotices(updated);
  }

  static deleteNotice(id: string): void {
    const notices = this.getNotices();
    const updated = notices.filter((n) => n.id !== id);
    this.saveNotices(updated);
  }
}
