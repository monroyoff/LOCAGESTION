'use client';

import { AuthUser, SubscriptionPlan } from '../types';
import { Lease, LeaseService, isLeaseMatchingLandlord } from './lease-service';

export interface PlanConfig {
  id: SubscriptionPlan;
  name: string;
  tagline: string;
  price: string;
  priceDetail: string;
  maxActiveLeases: number; // 2 pour découverte, Infinity pour sérénité/pro
  features: string[];
  isPopular?: boolean;
}

export const PLANS_CONFIG: Record<SubscriptionPlan, PlanConfig> = {
  decouverte: {
    id: 'decouverte',
    name: 'Formule Découverte',
    tagline: 'Pour débuter en toute autonomie',
    price: '0 FCFA',
    priceDetail: '/ mois à vie',
    maxActiveLeases: 2,
    features: [
      'Jusqu’à 2 baux signés actifs à votre actif',
      'Baux électroniques certifiés OHADA',
      'États des lieux contradictoires avec photos',
      'Émission de quittances numériques scellées',
      'Encaissements manuels gratuits (espèces / virement)',
    ],
  },
  serenite: {
    id: 'serenite',
    name: 'Formule Sérénité',
    tagline: 'Encaissement automatisé Mobile Money',
    price: '1,5%',
    priceDetail: '/ loyer Mobile Money',
    maxActiveLeases: Infinity,
    isPopular: true,
    features: [
      'Baux signés illimités (aucun plafond)',
      'Split Payment automatique (Wave, MTN, Moov, Orange, Celtiis)',
      'Reversement instantané du loyer net sur votre compte',
      'Génération & scellement automatique de la quittance',
      'Relances automatiques par WhatsApp & SMS',
      'Passeport Solvabilité locataire en direct',
      '0 FCFA d’abonnement fixe par mois',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Formule Entreprise & Pro',
    tagline: 'Pour agences, cabinets & parcs locatifs',
    price: '15 000 FCFA',
    priceDetail: '/ mois (ou 500 F/lot)',
    maxActiveLeases: Infinity,
    features: [
      'Baux & lots illimités',
      'Gestion multi-utilisateurs & collaborateurs délégués',
      'Console Démarcheur & Mandats certifiés',
      'Commission dégressive négociée sur volume',
      'Exports comptables & DGI / IFU automatisés',
      'Chargé de compte dédié & support prioritaire 7j/7',
    ],
  },
};

const PLAN_STORAGE_KEY_PREFIX = 'locagestion:user_plan:';
const DEFAULT_FALLBACK_USER_ID = 'usr-bailleur-voglossou';

export const PlanService = {
  /**
   * Récupère le plan actuel d'un bailleur
   */
  getUserPlan(userId?: string): SubscriptionPlan {
    if (typeof window === 'undefined') return 'decouverte';
    try {
      const key = `${PLAN_STORAGE_KEY_PREFIX}${userId || DEFAULT_FALLBACK_USER_ID}`;
      const stored = localStorage.getItem(key);
      if (stored === 'serenite' || stored === 'pro' || stored === 'decouverte') {
        return stored as SubscriptionPlan;
      }
    } catch (e) {
      console.warn('Erreur lecture plan:', e);
    }
    return 'decouverte';
  },

  /**
   * Modifie et persiste le plan d'un bailleur
   */
  setUserPlan(userId: string | undefined, plan: SubscriptionPlan): void {
    if (typeof window === 'undefined') return;
    try {
      const targetId = userId || DEFAULT_FALLBACK_USER_ID;
      const key = `${PLAN_STORAGE_KEY_PREFIX}${targetId}`;
      localStorage.setItem(key, plan);

      // Déclencher un événement de notification pour la réactivité de l'UI
      window.dispatchEvent(
        new CustomEvent('locagestion:plan_changed', {
          detail: { userId: targetId, plan },
        })
      );
    } catch (e) {
      console.error('Erreur sauvegarde plan:', e);
    }
  },

  /**
   * Compte les baux signés actifs à l'actif du bailleur
   */
  getActiveSignedLeases(user?: AuthUser | null): Lease[] {
    const all = LeaseService.getLeasesForLandlord(user);
    return all.filter(
      (l) =>
        l.status === 'actif' ||
        (Boolean(l.signedByLandlord) && Boolean(l.signedByTenant)) ||
        Boolean(l.tenantSignedAt)
    );
  },

  /**
   * Vérifie si le bailleur a le droit de rédiger ou signer un nouveau bail
   */
  canLandlordSignNewLease(user?: AuthUser | null): {
    allowed: boolean;
    currentPlan: SubscriptionPlan;
    activeCount: number;
    maxAllowed: number;
    reason?: 'limit_reached' | 'ok';
  } {
    const currentPlan = this.getUserPlan(user?.id);
    const activeLeases = this.getActiveSignedLeases(user);
    const activeCount = activeLeases.length;

    // Administrateurs exemptés
    if (user?.role === 'admin' || user?.email === 'admin@locagestion.site') {
      return { allowed: true, currentPlan, activeCount, maxAllowed: Infinity };
    }

    // Formules Sérénité ou Pro : baux illimités
    if (currentPlan === 'serenite' || currentPlan === 'pro') {
      return { allowed: true, currentPlan, activeCount, maxAllowed: Infinity };
    }

    // Formule Découverte : plafonnée à 2 baux signés actifs
    const maxAllowed = PLANS_CONFIG.decouverte.maxActiveLeases;
    if (activeCount >= maxAllowed) {
      return {
        allowed: false,
        currentPlan: 'decouverte',
        activeCount,
        maxAllowed,
        reason: 'limit_reached',
      };
    }

    return { allowed: true, currentPlan: 'decouverte', activeCount, maxAllowed };
  },

  /**
   * Active la Formule Sérénité pour le bailleur
   */
  activateSerenitePlan(userId?: string): { success: boolean; message: string } {
    this.setUserPlan(userId, 'serenite');
    return {
      success: true,
      message: 'Félicitations ! La Formule Sérénité a été activée. Vous bénéficiez désormais de baux illimités.',
    };
  },

  /**
   * Active la Formule Entreprise & Pro
   */
  activateProPlan(userId?: string): { success: boolean; message: string } {
    this.setUserPlan(userId, 'pro');
    return {
      success: true,
      message: 'Félicitations ! La Formule Pro a été activée pour votre organisation.',
    };
  },
};
