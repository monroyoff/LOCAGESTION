'use client';

import { LeaseService, Lease } from './lease-service';
import { PaymentService } from './payment-service';
import { Notice } from './notice-service';

export interface ScoreTierInfo {
  tier: 'excellent' | 'bon' | 'vigilance' | 'critique';
  label: string;
  badge: string;
  minScore: number;
  maxScore: number;
  colorName: 'emerald' | 'teal' | 'amber' | 'rose';
  bgGradient: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  textColor: string;
  ringColor: string;
  description: string;
  advice: string;
}

export interface TenantScoreBreakdown {
  baseScore: number; // Toujours 100 au départ
  currentScore: number; // Score final délimité entre 0 et 100
  tier: ScoreTierInfo;
  isNewTenant: boolean; // true si premier compte / aucun incident
  onTimePaymentsCount: number;
  delayedPaymentsCount: number;
  currentMonthDelayedDays: number;
  hasActiveNotice: boolean;
  activeNoticePenalty: number;
  delayPenalty: number;
  regularityBonus: number;
  lastUpdated: string;
  factors: {
    title: string;
    impact: number; // Ex: -15 ou +5 ou 0
    type: 'positive' | 'negative' | 'neutral';
    description: string;
  }[];
}

const STORAGE_KEY_SCORE_PREFIX = 'locagestion:tenant_scoring:';

export const SCORING_TIERS: Record<string, ScoreTierInfo> = {
  excellent: {
    tier: 'excellent',
    label: 'Solvabilité Maximale',
    badge: 'EXCELLENT PAYEUR',
    minScore: 85,
    maxScore: 100,
    colorName: 'emerald',
    bgGradient: 'from-emerald-600 via-teal-600 to-emerald-700',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-100',
    badgeBorder: 'border-emerald-300/40',
    textColor: 'text-emerald-600',
    ringColor: 'ring-emerald-500',
    description: 'Règlements exemplaires sans aucun retard critique. Dossier prioritaire auprès des bailleurs.',
    advice: 'Continuez à régler vos loyers avant le 5 du mois pour maintenir votre note maximale de 100/100.',
  },
  bon: {
    tier: 'bon',
    label: 'Solvabilité Bonne & Fiable',
    badge: 'LOCATAIRE FIABLE',
    minScore: 70,
    maxScore: 84,
    colorName: 'teal',
    bgGradient: 'from-teal-600 via-cyan-700 to-teal-800',
    badgeBg: 'bg-teal-500/20',
    badgeText: 'text-teal-100',
    badgeBorder: 'border-teal-300/40',
    textColor: 'text-teal-600',
    ringColor: 'ring-teal-500',
    description: 'Profil solide et fiable. Retards très légers et occasionnels rapidement régularisés.',
    advice: 'Régularisez vos paiements dès réception de l’avis d’échéance pour remonter au palier Vert (85–100).',
  },
  vigilance: {
    tier: 'vigilance',
    label: 'Vigilance Requise',
    badge: 'VIGILANCE REQUISE',
    minScore: 50,
    maxScore: 69,
    colorName: 'amber',
    bgGradient: 'from-amber-600 via-orange-600 to-amber-700',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-100',
    badgeBorder: 'border-amber-300/40',
    textColor: 'text-amber-600',
    ringColor: 'ring-amber-500',
    description: 'Retards récurrents (entre 6 et 15 jours) ou relance en attente. Risque de garanties supplémentaires requises.',
    advice: 'Payez votre solde en cours pour stopper la dégradation de votre score et regagner des points.',
  },
  critique: {
    tier: 'critique',
    label: 'Solvabilité Critique',
    badge: 'RISQUE ÉLEVÉ D’IMPAYÉ',
    minScore: 0,
    maxScore: 49,
    colorName: 'rose',
    bgGradient: 'from-rose-700 via-red-800 to-rose-900',
    badgeBg: 'bg-rose-500/20',
    badgeText: 'text-rose-100',
    badgeBorder: 'border-rose-300/40',
    textColor: 'text-rose-600',
    ringColor: 'ring-rose-500',
    description: 'Retard critique dépassant 15 jours, mise en demeure formelle émise ou défaut de paiement constaté.',
    advice: 'Contactez immédiatement votre bailleur et apurez vos arriérés pour éviter la résiliation du bail.',
  },
};

export function getTierForScore(score: number): ScoreTierInfo {
  if (score >= 85) return SCORING_TIERS.excellent;
  if (score >= 70) return SCORING_TIERS.bon;
  if (score >= 50) return SCORING_TIERS.vigilance;
  return SCORING_TIERS.critique;
}

export const TenantScoringService = {
  /**
   * Calcule le score de solvabilité en temps réel pour un locataire donné.
   * RÈGLE D'OR : Pour tout locataire qui crée son compte pour la première fois,
   * le score est STRICTEMENT de 100/100 en VERT (Palier Excellent).
   */
  calculateScore(tenantEmail?: string, tenantPhone?: string): TenantScoreBreakdown {
    const defaultBreakdown: TenantScoreBreakdown = {
      baseScore: 100,
      currentScore: 100,
      tier: SCORING_TIERS.excellent,
      isNewTenant: true,
      onTimePaymentsCount: 0,
      delayedPaymentsCount: 0,
      currentMonthDelayedDays: 0,
      hasActiveNotice: false,
      activeNoticePenalty: 0,
      delayPenalty: 0,
      regularityBonus: 0,
      lastUpdated: new Date().toLocaleDateString('fr-FR'),
      factors: [
        {
          title: 'Création de compte & Présomption d’Excellence',
          impact: 0,
          type: 'positive',
          description: 'Score initial fixé à 100/100 avec confiance totale de la plateforme LOCAGESTION.',
        },
      ],
    };

    if (typeof window === 'undefined') return defaultBreakdown;

    const cleanEmail = tenantEmail?.trim().toLowerCase();
    const cleanPhoneDigits = tenantPhone?.replace(/[^0-9]/g, '');

    // 1. Récupération des baux du locataire
    const allLeases: Lease[] = LeaseService.getLeases();
    const tenantLeases = allLeases.filter((l: Lease) => {
      if (cleanEmail && l.tenantEmail && l.tenantEmail.trim().toLowerCase() === cleanEmail) return true;
      if (cleanPhoneDigits && l.tenantPhone && l.tenantPhone.replace(/[^0-9]/g, '').endsWith(cleanPhoneDigits)) return true;
      return false;
    });

    const activeLease = tenantLeases.find((l: Lease) => l.status === 'actif');

    // Si aucun bail actif ou bail en cours sans incident : le locataire est à 100/100
    if (!activeLease) {
      return defaultBreakdown;
    }

    // 2. Récupération de l'historique des règlements
    const verifiedPayments = PaymentService.getVerifiedPayments();
    const declaredPayments = PaymentService.getDeclaredPayments();
    const allPayments = [...verifiedPayments, ...declaredPayments];

    const tenantPayments = allPayments.filter((p) => {
      if (cleanEmail && p.tenantEmail && p.tenantEmail.trim().toLowerCase() === cleanEmail) return true;
      if (cleanPhoneDigits && p.tenantPhone && p.tenantPhone.replace(/[^0-9]/g, '').endsWith(cleanPhoneDigits)) return true;
      return false;
    });

    // 3. Analyse du statut du mois en cours
    // Échéance standard en Afrique de l'Ouest / Centrale : le 5 de chaque mois
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonthName = now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    // Vérifier si le loyer du mois courant a été déclaré ou vérifié
    const currentMonthPaid = tenantPayments.some((p) => {
      const pPeriod = (p.period || p.paymentDate || '').toLowerCase();
      const currentMonthFr = now.toLocaleDateString('fr-FR', { month: 'long' }).toLowerCase();
      return pPeriod.includes(currentMonthFr) && (p.isVerified || p.status === 'paye' || p.status === 'en_attente');
    });

    let currentMonthDelayedDays = 0;
    // Si nous avons dépassé le 5 du mois et qu'aucun règlement n'a été enregistré pour le mois en cours
    if (currentDay > 5 && !currentMonthPaid) {
      currentMonthDelayedDays = currentDay - 5;
    }

    // 4. Calcul déterministe des pénalités
    let score = 100;
    const factors: TenantScoreBreakdown['factors'] = [];

    // Facteur initial
    factors.push({
      title: 'Score d’entrée officiel',
      impact: 0,
      type: 'positive',
      description: 'Capital confiance initial de 100 points certifié par LOCAGESTION.',
    });

    // A. Bonus pour les règlements réguliers
    const onTimePayments = tenantPayments.filter((p) => p.isVerified || p.status === 'paye').length;
    let regularityBonus = 0;
    if (onTimePayments > 0) {
      regularityBonus = Math.min(onTimePayments * 2, 10);
      factors.push({
        title: `${onTimePayments} quittance(s) réglée(s) et validée(s)`,
        impact: regularityBonus,
        type: 'positive',
        description: 'Paiements validés consolidant votre antériorité locative positive.',
      });
    }

    // B. Pénalité pour retard du mois en cours
    let delayPenalty = 0;
    if (currentMonthDelayedDays > 0) {
      if (currentMonthDelayedDays <= 5) {
        // Période de grâce (du 6 au 10) : avertissement léger
        delayPenalty = 5;
        factors.push({
          title: `Loyer en attente (${currentMonthDelayedDays} j. après l'échéance)`,
          impact: -5,
          type: 'neutral',
          description: 'Période de grâce : réglez avant le 10 du mois pour préserver vos 100 points.',
        });
      } else if (currentMonthDelayedDays <= 15) {
        // Retard modéré (du 11 au 20) : -15 points (fait passer en zone Orange)
        delayPenalty = 18;
        factors.push({
          title: `Retard constaté de ${currentMonthDelayedDays} jours`,
          impact: -18,
          type: 'negative',
          description: 'Loyer en retard de plus de 5 jours. Rétablissez votre situation pour remonter au vert.',
        });
      } else {
        // Retard critique (> 15 jours) : -35 points (fait passer en zone Rouge/Critique)
        delayPenalty = 35;
        factors.push({
          title: `Retard critique de ${currentMonthDelayedDays} jours`,
          impact: -35,
          type: 'negative',
          description: 'Retard majeur supérieur à 15 jours. Impact important sur votre indice de solvabilité.',
        });
      }
    }

    // C. Vérification des mises en demeure actives
    let activeNoticePenalty = 0;
    let hasActiveNotice = false;
    try {
      const rawNotices = localStorage.getItem('locagestion:notices:v2');
      if (rawNotices) {
        const notices: Notice[] = JSON.parse(rawNotices);
        const tenantNotice = notices.find(
          (n) =>
            n.status === 'en_cours' &&
            n.reasonType === 'impayes_manquements' &&
            ((cleanEmail && n.tenantEmail && n.tenantEmail.trim().toLowerCase() === cleanEmail) ||
              (cleanPhoneDigits && n.tenantPhone && n.tenantPhone.replace(/[^0-9]/g, '').endsWith(cleanPhoneDigits)))
        );

        if (tenantNotice) {
          hasActiveNotice = true;
          activeNoticePenalty = 25;
          factors.push({
            title: 'Mise en demeure formelle enregistrée',
            impact: -25,
            type: 'negative',
            description: `Procédure de rappel formelle émise (${tenantNotice.id}). Apurez la dette pour annuler cette pénalité.`,
          });
        }
      }
    } catch (e) {}

    // Calcul final bridé entre 0 et 100
    const calculated = score - delayPenalty - activeNoticePenalty + regularityBonus;
    const finalScore = Math.max(0, Math.min(100, calculated));
    const tier = getTierForScore(finalScore);

    const isNewTenant = tenantPayments.length === 0 && delayPenalty === 0 && !hasActiveNotice;

    return {
      baseScore: 100,
      currentScore: finalScore,
      tier,
      isNewTenant,
      onTimePaymentsCount: onTimePayments,
      delayedPaymentsCount: currentMonthDelayedDays > 5 ? 1 : 0,
      currentMonthDelayedDays,
      hasActiveNotice,
      activeNoticePenalty,
      delayPenalty,
      regularityBonus,
      lastUpdated: new Date().toLocaleDateString('fr-FR'),
      factors,
    };
  },
};
