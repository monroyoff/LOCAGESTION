'use client';

import { LeaseService } from './lease-service';
import { TenantNotificationService } from './tenant-notification-service';
import { AuthUser } from '../types';
import { areEmailsEqual, arePhoneNumbersEqual } from './auth-service';

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
  beneficiaryName?: string; // En cas de reprise personnelle (ex: Propriétaire bénéficiaire)
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

export const INITIAL_NOTICES: Notice[] = [];

const NOTICES_STORAGE_KEY = 'locagestion:notices:v2';

/**
 * Détecte si un préavis est un faux dossier de démo / mock hérité
 */
export function isFakeNotice(n?: Partial<Notice> | null): boolean {
  if (!n) return true;
  const id = (n.id || '').trim();
  if (
    id === 'PREAV-2026-001' ||
    id === 'PREAV-2026-002' ||
    id === 'PREAV-2026-003' ||
    id === 'PREAV-2026-004' ||
    id.startsWith('mock-') ||
    id.startsWith('demo-')
  ) {
    return true;
  }
  const name = (n.tenantName || '').trim().toLowerCase();
  if (
    name === 'koffi mensah' ||
    name === 'ibrahim touré' ||
    name === 'ibrahim toure' ||
    name === 'fatoumata traoré' ||
    name === 'fatoumata traore' ||
    name === 'amina diop' ||
    name === 'mamadou diallo'
  ) {
    return true;
  }
  const prop = (n.propertyName || '').trim().toLowerCase();
  if (
    prop === 'résidence les cocotiers' ||
    prop === 'residence les cocotiers' ||
    prop === 'immeuble palmier royal' ||
    prop === 'villa émeraude' ||
    prop === 'villa emeraude'
  ) {
    return true;
  }
  return false;
}

// Nettoyage immédiat côté client pour purger les anciens dossiers démo
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('locagestion:notices:v1');
    const raw = localStorage.getItem(NOTICES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const sanitized = parsed.filter((n) => !isFakeNotice(n));
        if (sanitized.length !== parsed.length) {
          localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(sanitized));
        }
      }
    }
  } catch {}
}

export class NoticeService {
  static getNotices(): Notice[] {
    if (typeof window === 'undefined') return [];
    try {
      localStorage.removeItem('locagestion:notices:v1');
      const stored = localStorage.getItem(NOTICES_STORAGE_KEY);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        const sanitized = parsed.filter((n) => !isFakeNotice(n));
        if (sanitized.length !== parsed.length) {
          localStorage.setItem(NOTICES_STORAGE_KEY, JSON.stringify(sanitized));
        }
        return sanitized;
      }
      return [];
    } catch {
      return [];
    }
  }

  static getTenantNotices(userOrTenantName?: AuthUser | string | null): Notice[] {
    if (!userOrTenantName) return [];
    const notices = this.getNotices();

    if (typeof userOrTenantName === 'string') {
      const tenantName = userOrTenantName.trim().toLowerCase();
      if (!tenantName) return [];
      return notices.filter(
        (n) =>
          !isFakeNotice(n) &&
          (n.tenantName.toLowerCase().trim() === tenantName ||
            n.tenantName.toLowerCase().includes(tenantName) ||
            tenantName.includes(n.tenantName.toLowerCase()))
      );
    }

    const u = userOrTenantName as AuthUser;
    const uEmail = u.email?.trim().toLowerCase();
    const uPhone = u.phone?.trim();
    const uName = u.name?.trim().toLowerCase();

    return notices.filter((n) => {
      if (isFakeNotice(n)) return false;
      if (uEmail && n.tenantEmail && areEmailsEqual(uEmail, n.tenantEmail)) return true;
      if (uPhone && n.tenantPhone && arePhoneNumbersEqual(uPhone, n.tenantPhone)) return true;
      if (
        uName &&
        n.tenantName &&
        (uName === n.tenantName.trim().toLowerCase() ||
          uName.split(/\s+/).sort().join(' ') === n.tenantName.trim().toLowerCase().split(/\s+/).sort().join(' '))
      ) {
        return true;
      }
      return false;
    });
  }

  static getLandlordNotices(user?: AuthUser | null): Notice[] {
    if (!user) return [];
    if (user.role === 'admin' || user.email === 'admin@locagestion.site') return this.getNotices();
    const all = this.getNotices();
    const landlordLeases = LeaseService.getLeasesForLandlord(user);
    if (landlordLeases.length === 0) {
      if (user.email && areEmailsEqual(user.email, 'jobovog@gmail.com')) return all;
      return [];
    }
    const propNames = new Set(landlordLeases.map((l) => l.property.toLowerCase().trim()));
    return all.filter((n) => propNames.has((n.propertyName || '').toLowerCase().trim()));
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
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date().toISOString(),
        createdAt: new Date().toISOString(),
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

