'use client';

import { LeaseService } from './lease-service';
import { TenantNotificationService } from './tenant-notification-service';

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
  | 'email_officiel'
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
  defaultExpose: string;
  iconName: string;
}[] = [
  {
    type: 'reprise_personnelle',
    title: 'Reprise pour Habitation Personnelle',
    recommendedMonths: 3,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    legalBasis: 'Code Foncier & Domanial UEMOA - Droit de reprise du bailleur ou de ses ascendants/descendants',
    description: 'Le propriétaire bailleur reprend possession du logement pour y habiter personnellement ou y loger un ascendant ou descendant direct.',
    defaultExpose: 'Le bailleur soussigné notifie par la présente son intention formelle de reprendre possession du logement loué pour son occupation personnelle ou celle de son proche bénéficiaire désigné, à titre de résidence principale effective, conformément au Code Foncier et Domanial et aux textes en vigueur.',
    iconName: 'Home',
  },
  {
    type: 'vente',
    title: 'Congé pour Vente du Bien Immobilier',
    recommendedMonths: 3,
    badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
    legalBasis: 'Régime des Baux d’Habitation UEMOA - Droit de préemption légal du locataire en place',
    description: 'Mise en vente du bien immobilier libre de toute occupation, avec formulation préalable de l’offre d’acquisition au locataire titulaire du droit de préemption.',
    defaultExpose: 'Le propriétaire bailleur notifie son intention de procéder à la vente du bien immobilier libre de toute occupation. En application des dispositions légales régissant les baux d’habitation, la présente notification vaut offre formelle d’acquisition préalable au profit du locataire, qui bénéficie d’un droit légal de préemption pour se porter acquéreur aux conditions financières stipulées.',
    iconName: 'Tag',
  },
  {
    type: 'impayes_manquements',
    title: 'Motif Légitime & Sérieux (Impayés / Fautes Graves)',
    recommendedMonths: 1,
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
    legalBasis: 'Code Civil & Droit OHADA des Contrats - Résiliation pour inexécution fautive après mise en demeure',
    description: 'Défaut récurrent de paiement des loyers, dégradations volontaires des locaux, sous-location illicite ou troubles anormaux de voisinage avérés.',
    defaultExpose: 'Le bailleur constate l’inexécution grave et répétée des obligations locatives contractuelles par le preneur, caractérisée notamment par des retards récurrents et des arriérés persistants de paiement des loyers et charges, malgré les relances et mises en demeure préalables restées infructueuses, justifiant la résiliation unilatérale du bail avec préavis légal.',
    iconName: 'AlertTriangle',
  },
  {
    type: 'travaux_majeurs',
    title: 'Travaux Substantiels & Rénovation Lourde',
    recommendedMonths: 3,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    legalBasis: 'Réglementation Urbanistique & Salubrité UEMOA - Réhabilitation et mise en conformité structurelle',
    description: 'Réfection lourde de toiture, restructuration ou travaux de consolidation incompatibles avec le maintien des occupants pour des impératifs stricts de sécurité.',
    defaultExpose: 'Le bailleur engage un programme de travaux majeurs de réhabilitation structurelle, de réfection lourde de toiture et de mise en conformité des réseaux d’assainissement nécessitant la libération intégrale et la vacance impérative des locaux pour des motifs stricts de sécurité des personnes, incompatibles avec le maintien du preneur dans les lieux.',
    iconName: 'Hammer',
  },
  {
    type: 'terme_bail',
    title: 'Arrivée à Terme du Bail & Non-Renouvellement',
    recommendedMonths: 3,
    badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
    legalBasis: 'Droit Commun des Baux à Durée Déterminée - Congé signifié avant échéance contractuelle',
    description: 'Notification du non-renouvellement du contrat de location arrivé à son terme contractuel normal.',
    defaultExpose: 'Le bailleur informe formellement le preneur de sa décision de ne pas renouveler le contrat de bail d’habitation arrivant à son échéance contractuelle convenue, signifiant ainsi congé de manière définitive dans le respect strict du préavis légal applicable avant le terme du bail.',
    iconName: 'CalendarCheck',
  },
  {
    type: 'depart_locataire',
    title: 'Départ Volontaire Notifié par le Locataire',
    recommendedMonths: 1,
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    legalBasis: 'Résiliation unilatérale à l’initiative du preneur avec respect du préavis contractuel',
    description: 'Prise d’acte officielle du congé signifié par le locataire pour convenance personnelle ou mutation professionnelle.',
    defaultExpose: 'Le bailleur prend acte officiellement de la notification de congé signifiée par le preneur pour convenance personnelle ou mutation, confirmant la prise en compte du délai de préavis contractuel et fixant le calendrier pour l’état des lieux de sortie contradictoire et la restitution intégrale des clés.',
    iconName: 'DoorOpen',
  },
];

export const INITIAL_NOTICES: Notice[] = [
  {
    id: 'PREAV-2026-001',
    tenantName: 'Koffi Mensah',
    tenantPhone: '+229 97 00 11 22',
    tenantEmail: 'koffi.mensah@fintech-africa.com',
    propertyName: 'Résidence Les Cocotiers',
    unitNumber: 'Appt A3 (3 pièces)',
    monthlyRent: 220000,
    reasonType: 'reprise_personnelle',
    reasonTitle: 'Reprise pour Habitation Personnelle',
    reasonDetails: 'Le propriétaire bailleur reprend possession du logement pour y loger son fils étudiant revenant à Cotonou à compter du terme du préavis légal.',
    noticeMonths: 3,
    noticeDate: '01/10/2026',
    effectiveDate: '31/12/2026',
    deliveryMethod: 'email_officiel',
    status: 'en_cours',
    beneficiaryName: 'M. Rodrigue Diallo (Fils du propriétaire)',
    legalBasis: 'Code Foncier & Domanial UEMOA - Droit de reprise du bailleur pour descendant direct',
    departureInspectionDate: '30/12/2026',
    notes: 'Notification formelle transmise par email officiel certifié et acte de Commissaire de Justice.',
    createdAt: '2026-10-01T08:30:00Z',
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

const NOTICES_STORAGE_KEY = 'locagestion:notices:v2';

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

  static getTenantNotices(tenantName: string = 'Koffi Mensah'): Notice[] {
    const notices = this.getNotices();
    return notices.filter(
      (n) =>
        n.tenantName.toLowerCase().includes(tenantName.toLowerCase()) ||
        tenantName.toLowerCase().includes(n.tenantName.toLowerCase())
    );
  }

  static saveNotices(notices: Notice[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(notices));
      window.dispatchEvent(new CustomEvent('locagestion:notices_updated'));
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

    // Alerter instantanément l'espace locataire
    TenantNotificationService.notifyNoticeIssued({
      noticeId: id,
      reasonTitle: newNotice.reasonTitle,
      effectiveDate: newNotice.effectiveDate,
      tenantName: newNotice.tenantName,
      tenantEmail: newNotice.tenantEmail,
      propertyName: newNotice.propertyName,
      unitNumber: newNotice.unitNumber,
    });

    return newNotice;
  }

  static addTenantDepartureNotice(data: {
    tenantName: string;
    tenantPhone: string;
    tenantEmail?: string;
    propertyName: string;
    unitNumber: string;
    monthlyRent: number;
    noticeMonths: number;
    effectiveDate: string;
    reasonDetails: string;
  }): Notice {
    const today = new Date();
    const formattedToday = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    const newNotice = this.addNotice({
      ...data,
      reasonType: 'depart_locataire',
      reasonTitle: 'Départ Volontaire Notifié par le Locataire',
      noticeDate: formattedToday,
      deliveryMethod: 'email_officiel',
      status: 'notifie',
      legalBasis: 'Résiliation unilatérale à l’initiative du preneur avec respect du préavis contractuel',
    });

    // Notification instantanée pour le Bailleur dans sa cloche
    try {
      LeaseService.addLandlordNotification({
        id: `notif-dep-${newNotice.id}`,
        title: `Préavis de départ reçu (${newNotice.id})`,
        message: `${data.tenantName} (${data.propertyName} - ${data.unitNumber}) vous a notifié son préavis de départ pour le ${data.effectiveDate}.`,
        time: 'À l’instant',
        timestamp: 'À l’instant',
        type: 'notice_received',
        read: false,
        tenantName: data.tenantName,
        property: data.propertyName,
        unit: data.unitNumber,
      });
    } catch (e) {
      console.error('Erreur notif départ bailleur:', e);
    }

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

