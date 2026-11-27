'use client';

import { AuthUser, SubscriptionPlan, UserSubscriptionDetails } from '../types';
import { Lease, LeaseService } from './lease-service';

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
      'Signalement des pannes & modèles de préavis',
      'Émission de quittances numériques scellées',
      'Tous modes de paiement autorisés (Espèces, Virement & Mobile Money)',
    ],
  },
  serenite: {
    id: 'serenite',
    name: 'Formule Sérénité',
    tagline: 'Encaissement 100% Mobile Money automatisé',
    price: '2%',
    priceDetail: '/ loyer Mobile Money',
    maxActiveLeases: Infinity,
    isPopular: true,
    features: [
      'Baux & Contrats signés ILLIMITÉS (aucun plafond)',
      'Encaissements 100% Mobile Money automatisés (Wave, MoMo, Moov, Orange, Celtiis)',
      '⚠️ Règlements en espèces & manuels non autorisés (réservés à la Formule Pro)',
      'Split Payment automatique (reversement instantané de 98% net sur votre compte)',
      'Quittances officielles scellées avec QR Code de certification pour chaque loyer Mobile Money',
      'Gestion complète des pannes & interventions d’urgence (photos, artisans)',
      'Gestion des préavis de départ & restitution caution sous 30 jours',
      'Relances automatiques par WhatsApp & SMS',
      '0 FCFA d’abonnement fixe par mois (2% prélevés uniquement sur loyer perçu)',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Formule Entreprise & Pro',
    tagline: 'Pour agences, cabinets & parcs locatifs',
    price: '15 000 FCFA',
    priceDetail: '/ mois (validité 30 jours)',
    maxActiveLeases: Infinity,
    features: [
      'Baux, lots & résidences illimités (validité 30 jours)',
      '👑 Encaissements en Espèces, Chèques & Virements 100% LIBRES & ILLIMITÉS (0% commission)',
      'Tous les canaux Mobile Money inclus sans commission plateforme',
      'Quittances scellées certifiées avec QR Code pour TOUS les modes (y compris Espèces)',
      'Maintenance multi-lots & carnet d’artisans centralisé',
      'Préavis de résiliation, mises en demeure & contentieux huissier (OHADA)',
      'Gestion multi-utilisateurs & collaborateurs délégués',
      'Console Démarcheur & Mandats certifiés',
      'Exports comptables & DGI / IFU automatisés',
      'Chargé de compte dédié & support prioritaire 7j/7',
      'Alertes automatiques avant fin d’abonnement (J-2, J-1, J)',
    ],
  },
};

const PLAN_STORAGE_KEY_PREFIX = 'locagestion:user_plan:';
const SUB_STORAGE_KEY_PREFIX = 'locagestion:subscription:';
const DEFAULT_FALLBACK_USER_ID = 'usr-bailleur-voglossou';

export interface SubscriptionAlertInfo {
  level: 'j-2' | 'j-1' | 'j-0' | 'expired';
  title: string;
  message: string;
  daysRemaining: number;
  expiresAtFormatted: string;
  actionText: string;
}

export const PlanService = {
  /**
   * Récupère les détails complets de souscription et validité (30 jours)
   */
  getUserSubscription(userId?: string): UserSubscriptionDetails {
    const targetId = userId || DEFAULT_FALLBACK_USER_ID;
    if (typeof window === 'undefined') {
      return { plan: 'decouverte', isExpired: false };
    }

    try {
      const subKey = `${SUB_STORAGE_KEY_PREFIX}${targetId}`;
      const storedSub = localStorage.getItem(subKey);

      if (storedSub) {
        const parsed: UserSubscriptionDetails = JSON.parse(storedSub);
        if (parsed.plan === 'pro' && parsed.expiresAt) {
          const diffMs = new Date(parsed.expiresAt).getTime() - Date.now();
          const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const isExpired = diffMs <= 0;
          return {
            ...parsed,
            daysRemaining,
            isExpired,
          };
        }
        return parsed;
      }

      // Rétrocompatibilité : si l'utilisateur avait juste 'locagestion:user_plan:ID' = 'pro'
      const legacyKey = `${PLAN_STORAGE_KEY_PREFIX}${targetId}`;
      const legacyPlan = localStorage.getItem(legacyKey);

      if (legacyPlan === 'pro') {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        const autoSub: UserSubscriptionDetails = {
          plan: 'pro',
          activatedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          isExpired: false,
          daysRemaining: 30,
          pricePaid: 15000,
          currency: 'FCFA',
          cycleCount: 1,
        };
        try {
          localStorage.setItem(subKey, JSON.stringify(autoSub));
        } catch { }
        return autoSub;
      }

      if (legacyPlan === 'serenite') {
        return { plan: 'serenite', isExpired: false, pricePaid: 0, currency: 'FCFA' };
      }
    } catch (e) {
      console.warn('Erreur lecture souscription:', e);
    }

    return { plan: 'decouverte', isExpired: false, pricePaid: 0, currency: 'FCFA' };
  },

  /**
   * Récupère le plan effectif actuel d'un bailleur.
   * Si la Formule Pro a dépassé ses 30 jours (expirée), le plan effectif retombe à 'decouverte'.
   */
  getUserPlan(userId?: string): SubscriptionPlan {
    const sub = this.getUserSubscription(userId);
    if (sub.plan === 'pro') {
      if (sub.isExpired) {
        return 'decouverte'; // Expiré : les avantages Pro sont suspendus jusqu'à réactivation
      }
      return 'pro';
    }
    if (sub.plan === 'serenite') {
      return 'serenite';
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
   * Compte les baux signés actifs à l'actif du bailleur.
   * Règle d'or : Tout bail résilié, terminé ou supprimé libère immédiatement le quota.
   */
  getActiveSignedLeases(user?: AuthUser | null): Lease[] {
    const all = LeaseService.getLeasesForLandlord(user);
    return all.filter((l) => {
      // Un bail résilié ou brouillon n'est JAMAIS un bail actif
      if (!l || l.status === 'resilie' || l.status === 'brouillon') {
        return false;
      }
      return (
        l.status === 'actif' ||
        (Boolean(l.signedByLandlord) && Boolean(l.signedByTenant)) ||
        Boolean(l.tenantSignedAt)
      );
    });
  },

  /**
   * Vérifie si le bailleur a le droit de rédiger ou signer un nouveau bail
   */
  canLandlordSignNewLease(user?: AuthUser | null): {
    allowed: boolean;
    currentPlan: SubscriptionPlan;
    activeCount: number;
    maxAllowed: number;
    reason?: 'limit_reached' | 'pro_expired' | 'ok';
    subscription?: UserSubscriptionDetails;
  } {
    const sub = this.getUserSubscription(user?.id);
    const currentPlan = this.getUserPlan(user?.id);
    const activeLeases = this.getActiveSignedLeases(user);
    const activeCount = activeLeases.length;

    // Administrateurs exemptés
    if (user?.role === 'admin' || user?.email === 'admin@locagestion.site') {
      return { allowed: true, currentPlan, activeCount, maxAllowed: Infinity, subscription: sub };
    }

    // Formule Pro expirée
    if (sub.plan === 'pro' && sub.isExpired) {
      return {
        allowed: false,
        currentPlan: 'decouverte',
        activeCount,
        maxAllowed: PLANS_CONFIG.decouverte.maxActiveLeases,
        reason: 'pro_expired',
        subscription: sub,
      };
    }

    // Formules Sérénité ou Pro active : baux illimités
    if (currentPlan === 'serenite' || currentPlan === 'pro') {
      return { allowed: true, currentPlan, activeCount, maxAllowed: Infinity, subscription: sub };
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
        subscription: sub,
      };
    }

    return { allowed: true, currentPlan: 'decouverte', activeCount, maxAllowed, subscription: sub };
  },

  /**
   * Vérifie si un mode de paiement peut être enregistré selon la formule du bailleur.
   * Règle d'or anti-contournement : La Formule Sérénité (0 FCFA fixe) tire sa viabilité
   * de la commission de 2% sur les encaissements automatisés par Mobile Money.
   * Pour éviter qu'un bailleur ne perçoive les loyers en espèces ou virements personnels
   * hors-plateforme tout en restant en Sérénité, les modes espèces et virements manuels
   * sont réservés à la Formule Entreprise & Pro (0% de commission sur tous les canaux).
   */
  canRecordPaymentMethod(userId: string | undefined, method: string): {
    allowed: boolean;
    reason?: string;
    isSereniteRestricted?: boolean;
  } {
    const plan = this.getUserPlan(userId);
    const isCashOrManual = method === 'especes' || method === 'virement';

    if (plan === 'serenite' && isCashOrManual) {
      return {
        allowed: false,
        isSereniteRestricted: true,
        reason:
          'La Formule Sérénité (0 FCFA fixe) est strictement réservée aux encaissements automatisés par Mobile Money (Wave, MoMo, Moov, Orange, Celtiis). Pour enregistrer manuellement des règlements en espèces ou virements bancaires hors-plateforme sur vos baux illimités, activez la Formule Entreprise & Pro (15 000 FCFA / 30 jours) à 0% de commission.',
      };
    }

    return { allowed: true };
  },

  /**
   * Active la Formule Sérénité pour le bailleur
   */
  activateSerenitePlan(userId?: string): { success: boolean; message: string } {
    const targetId = userId || DEFAULT_FALLBACK_USER_ID;
    this.setUserPlan(userId, 'serenite');

    if (typeof window !== 'undefined') {
      try {
        const sub: UserSubscriptionDetails = {
          plan: 'serenite',
          activatedAt: new Date().toISOString(),
          isExpired: false,
          pricePaid: 0,
          currency: 'FCFA',
        };
        const subStr = JSON.stringify(sub);
        localStorage.setItem(`${SUB_STORAGE_KEY_PREFIX}${targetId}`, subStr);
        localStorage.setItem(`${PLAN_STORAGE_KEY_PREFIX}${targetId}`, 'serenite');

        if (targetId !== DEFAULT_FALLBACK_USER_ID) {
          localStorage.setItem(`${SUB_STORAGE_KEY_PREFIX}${DEFAULT_FALLBACK_USER_ID}`, subStr);
          localStorage.setItem(`${PLAN_STORAGE_KEY_PREFIX}${DEFAULT_FALLBACK_USER_ID}`, 'serenite');
        }

        // Notification persistante dans la cloche du bailleur
        LeaseService.addLandlordNotification({
          id: `notif-serenite-welcome-${Date.now()}`,
          title: '⚡ Formule Sérénité activée avec succès',
          message: 'Félicitations ! Votre Formule Sérénité (0 FCFA fixe) est active. Vous bénéficiez désormais de la création et signature électronique de baux illimités.',
          type: 'subscription_activated',
          read: false,
          createdAt: new Date().toISOString(),
        });

        // Déclencher l'événement réactif pour tout le système
        window.dispatchEvent(
          new CustomEvent('locagestion:plan_changed', {
            detail: { userId: targetId, plan: 'serenite', subscription: sub },
          })
        );
      } catch (e) {
        console.error('Erreur activation Sérénité:', e);
      }
    }

    return {
      success: true,
      message: 'Félicitations ! La Formule Sérénité a été activée avec succès. Vous bénéficiez désormais de baux illimités.',
    };
  },

  /**
   * Rétablit la Formule Découverte pour le bailleur (0 FCFA, 2 baux)
   */
  activateDecouvertePlan(userId?: string): { success: boolean; message: string } {
    const targetId = userId || DEFAULT_FALLBACK_USER_ID;
    this.setUserPlan(userId, 'decouverte');

    if (typeof window !== 'undefined') {
      try {
        const sub: UserSubscriptionDetails = {
          plan: 'decouverte',
          activatedAt: new Date().toISOString(),
          isExpired: false,
          pricePaid: 0,
          currency: 'FCFA',
        };
        const subStr = JSON.stringify(sub);
        localStorage.setItem(`${SUB_STORAGE_KEY_PREFIX}${targetId}`, subStr);
        localStorage.setItem(`${PLAN_STORAGE_KEY_PREFIX}${targetId}`, 'decouverte');

        if (targetId !== DEFAULT_FALLBACK_USER_ID) {
          localStorage.setItem(`${SUB_STORAGE_KEY_PREFIX}${DEFAULT_FALLBACK_USER_ID}`, subStr);
          localStorage.setItem(`${PLAN_STORAGE_KEY_PREFIX}${DEFAULT_FALLBACK_USER_ID}`, 'decouverte');
        }

        LeaseService.addLandlordNotification({
          id: `notif-decouverte-${Date.now()}`,
          title: '🌱 Formule Découverte active',
          message: 'Votre compte est configuré sur la Formule Découverte (jusqu’à 2 baux signés inclus sans frais).',
          type: 'subscription_activated',
          read: false,
          createdAt: new Date().toISOString(),
        });

        window.dispatchEvent(
          new CustomEvent('locagestion:plan_changed', {
            detail: { userId: targetId, plan: 'decouverte', subscription: sub },
          })
        );
      } catch (e) {
        console.error('Erreur activation Découverte:', e);
      }
    }

    return {
      success: true,
      message: 'Votre compte a été basculé sur la Formule Découverte.',
    };
  },

  /**
   * Active la Formule Entreprise & Pro pour une durée de 30 jours (15 000 FCFA)
   */
  activateProPlan(userId?: string, durationDays = 30): {
    success: boolean;
    message: string;
    expiresAt: string;
  } {
    const targetId = userId || DEFAULT_FALLBACK_USER_ID;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    const expiresAtIso = expiresAt.toISOString();

    const sub: UserSubscriptionDetails = {
      plan: 'pro',
      activatedAt: now.toISOString(),
      expiresAt: expiresAtIso,
      isExpired: false,
      daysRemaining: durationDays,
      pricePaid: 15000,
      currency: 'FCFA',
      lastRenewalAt: now.toISOString(),
      cycleCount: 1,
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${SUB_STORAGE_KEY_PREFIX}${targetId}`, JSON.stringify(sub));
        localStorage.setItem(`${PLAN_STORAGE_KEY_PREFIX}${targetId}`, 'pro');

        // Nettoyer les alertes envoyées de l'ancien cycle
        this.clearAlertFlags(targetId);

        // Émettre une notification de bienvenue Pro
        const expiresDateStr = expiresAt.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        LeaseService.addLandlordNotification({
          id: `notif-pro-welcome-${Date.now()}`,
          title: '👑 Formule Entreprise & Pro activée (30 jours)',
          message: `Félicitations ! Votre forfait Pro (15 000 FCFA) est actif pendant 30 jours, jusqu'au ${expiresDateStr}. Vous bénéficiez des baux illimités, de la console démarcheur et du support prioritaire.`,
          type: 'subscription_activated',
          read: false,
          createdAt: now.toISOString(),
        });

        window.dispatchEvent(
          new CustomEvent('locagestion:plan_changed', {
            detail: { userId: targetId, plan: 'pro', subscription: sub },
          })
        );
      } catch (e) {
        console.error('Erreur activation Pro:', e);
      }
    }

    return {
      success: true,
      message: `Formule Entreprise & Pro activée avec succès pour 30 jours (valable jusqu'au ${expiresAt.toLocaleDateString('fr-FR')}).`,
      expiresAt: expiresAtIso,
    };
  },

  /**
   * Renouvelle la Formule Pro pour 30 jours supplémentaires
   */
  renewProPlan(userId?: string, durationDays = 30): {
    success: boolean;
    message: string;
    expiresAt: string;
  } {
    const targetId = userId || DEFAULT_FALLBACK_USER_ID;
    const currentSub = this.getUserSubscription(targetId);
    const now = new Date();

    let newExpiresDate: Date;
    // Si l'abonnement en cours n'a pas encore expiré, on ajoute 30 jours à la date d'échéance existante
    if (currentSub.expiresAt && new Date(currentSub.expiresAt).getTime() > now.getTime()) {
      newExpiresDate = new Date(new Date(currentSub.expiresAt).getTime() + durationDays * 24 * 60 * 60 * 1000);
    } else {
      newExpiresDate = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    }

    const expiresAtIso = newExpiresDate.toISOString();
    const cycleCount = (currentSub.cycleCount || 1) + 1;

    const updatedSub: UserSubscriptionDetails = {
      ...currentSub,
      plan: 'pro',
      expiresAt: expiresAtIso,
      isExpired: false,
      daysRemaining: Math.ceil((newExpiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      lastRenewalAt: now.toISOString(),
      cycleCount,
      pricePaid: 15000,
      currency: 'FCFA',
    };

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`${SUB_STORAGE_KEY_PREFIX}${targetId}`, JSON.stringify(updatedSub));
        localStorage.setItem(`${PLAN_STORAGE_KEY_PREFIX}${targetId}`, 'pro');

        this.clearAlertFlags(targetId);

        const expiresDateStr = newExpiresDate.toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });

        LeaseService.addLandlordNotification({
          id: `notif-pro-renewed-${Date.now()}`,
          title: '🔄 Formule Pro renouvelée pour 30 jours',
          message: `Votre abonnement a été prolongé avec succès de 30 jours. Nouvelle date d'échéance : ${expiresDateStr}. Merci pour votre fidélité !`,
          type: 'subscription_alert',
          read: false,
          createdAt: now.toISOString(),
        });

        window.dispatchEvent(
          new CustomEvent('locagestion:plan_changed', {
            detail: { userId: targetId, plan: 'pro', subscription: updatedSub },
          })
        );
      } catch (e) {
        console.error('Erreur renouvellement Pro:', e);
      }
    }

    return {
      success: true,
      message: `Formule Pro renouvelée pour 30 jours supplémentaires (échéance le ${newExpiresDate.toLocaleDateString('fr-FR')}).`,
      expiresAt: expiresAtIso,
    };
  },

  /**
   * Outil de test / simulation pour Johane VOGLOSSOU :
   * Modifie artificiellement les jours restants (2 pour J-2, 1 pour J-1, 0 pour J, -1 pour expiré)
   */
  simulateProDaysRemaining(userId: string | undefined, daysRemaining: number): void {
    if (typeof window === 'undefined') return;
    const targetId = userId || DEFAULT_FALLBACK_USER_ID;
    const now = new Date();
    // Ex: Si daysRemaining === 2, on met l'expiration dans exactement 2 jours
    const targetDate = new Date(now.getTime() + daysRemaining * 24 * 60 * 60 * 1000);
    const expiresAtIso = targetDate.toISOString();

    const sub: UserSubscriptionDetails = {
      plan: 'pro',
      activatedAt: new Date(now.getTime() - (30 - daysRemaining) * 24 * 60 * 60 * 1000).toISOString(),
      expiresAt: expiresAtIso,
      isExpired: daysRemaining < 0,
      daysRemaining,
      pricePaid: 15000,
      currency: 'FCFA',
      cycleCount: 1,
    };

    localStorage.setItem(`${SUB_STORAGE_KEY_PREFIX}${targetId}`, JSON.stringify(sub));
    localStorage.setItem(`${PLAN_STORAGE_KEY_PREFIX}${targetId}`, 'pro');

    // Déclencher les alertes correspondantes
    this.checkAndGenerateSubscriptionAlerts({ id: targetId } as AuthUser);

    window.dispatchEvent(
      new CustomEvent('locagestion:plan_changed', {
        detail: { userId: targetId, plan: 'pro', subscription: sub },
      })
    );
    window.dispatchEvent(new CustomEvent('locagestion:notifications_updated'));
  },

  /**
   * Vérifie et génère automatiquement les alertes J-2, J-1 et J (Jour d'échéance) pour les formules payantes.
   * Appelée lors de la consultation des notifications ou au chargement du Header.
   */
  checkAndGenerateSubscriptionAlerts(user?: AuthUser | null): void {
    if (typeof window === 'undefined') return;
    const targetId = user?.id || DEFAULT_FALLBACK_USER_ID;
    const sub = this.getUserSubscription(targetId);

    if (sub.plan !== 'pro' || !sub.expiresAt) return;

    const daysRemaining = sub.daysRemaining ?? 30;
    const cycleDateStr = sub.expiresAt.slice(0, 10);
    const formattedExpiresDate = new Date(sub.expiresAt).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // 1. Alerte J-2 (2 jours avant échéance)
    if (daysRemaining === 2) {
      const alertKey = `locagestion:alert_sent:${targetId}:${cycleDateStr}:j2`;
      if (!localStorage.getItem(alertKey)) {
        LeaseService.addLandlordNotification({
          id: `notif-pro-j2-${cycleDateStr}`,
          title: '⏳ Formule Pro : Expire dans 2 jours (J-2)',
          message: `Votre abonnement Formule Entreprise & Pro expire dans 2 jours (le ${formattedExpiresDate}). Pensez à réactiver votre forfait dès maintenant pour continuer à bénéficier de tous vos accès pro sans interruption.`,
          type: 'subscription_alert',
          read: false,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem(alertKey, '1');
      }
    }

    // 2. Alerte J-1 (1 jour avant échéance / Demain)
    if (daysRemaining === 1) {
      const alertKey = `locagestion:alert_sent:${targetId}:${cycleDateStr}:j1`;
      if (!localStorage.getItem(alertKey)) {
        LeaseService.addLandlordNotification({
          id: `notif-pro-j1-${cycleDateStr}`,
          title: '⚠️ Formule Pro : Expire demain (J-1) !',
          message: `Votre abonnement Formule Entreprise & Pro expire demain (le ${formattedExpiresDate}). Renouvelez dès maintenant pour 30 jours (15 000 FCFA) afin d'éviter la suspension de vos fonctionnalités professionnelles.`,
          type: 'subscription_alert',
          read: false,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem(alertKey, '1');
      }
    }

    // 3. Alerte J (Jour J d'échéance / Aujourd'hui)
    if (daysRemaining === 0) {
      const alertKey = `locagestion:alert_sent:${targetId}:${cycleDateStr}:j0`;
      if (!localStorage.getItem(alertKey)) {
        LeaseService.addLandlordNotification({
          id: `notif-pro-j0-${cycleDateStr}`,
          title: '🚨 Formule Pro : Expire aujourd’hui (Jour J) !',
          message: `Dernier jour : votre abonnement Formule Pro expire aujourd'hui le ${formattedExpiresDate} à 23h59. Réactivez immédiatement votre formule pour 30 jours (15 000 FCFA) afin de prolonger vos accès agence & démarcheur.`,
          type: 'subscription_alert',
          read: false,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem(alertKey, '1');
      }
    }

    // 4. Alerte Expiré
    if (daysRemaining < 0 || sub.isExpired) {
      const alertKey = `locagestion:alert_sent:${targetId}:${cycleDateStr}:expired`;
      if (!localStorage.getItem(alertKey)) {
        LeaseService.addLandlordNotification({
          id: `notif-pro-expired-${cycleDateStr}`,
          title: '🔴 Formule Pro : Abonnement Expiré',
          message: `Votre abonnement Formule Entreprise & Pro a expiré le ${formattedExpiresDate}. Réactivez votre forfait (15 000 FCFA) pour débloquer immédiatement vos fonctionnalités professionnelles.`,
          type: 'subscription_expired',
          read: false,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem(alertKey, '1');
      }
    }
  },

  /**
   * Retourne l'information de bannière d'alerte si l'abonnement approche de l'échéance (J-2, J-1, J ou expiré)
   */
  getSubscriptionAlertBanner(user?: AuthUser | null): SubscriptionAlertInfo | null {
    const sub = this.getUserSubscription(user?.id);
    if (sub.plan !== 'pro' || !sub.expiresAt) return null;

    const daysRemaining = sub.daysRemaining ?? 30;
    const formattedExpiresDate = new Date(sub.expiresAt).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    if (sub.isExpired || daysRemaining < 0) {
      return {
        level: 'expired',
        title: 'Formule Pro Expirée',
        message: `Votre abonnement Formule Pro a expiré le ${formattedExpiresDate}. Vos fonctionnalités agence et multi-utilisateurs sont suspendues.`,
        daysRemaining,
        expiresAtFormatted: formattedExpiresDate,
        actionText: 'Réactiver 30 jours (15 000 F)',
      };
    }

    if (daysRemaining === 0) {
      return {
        level: 'j-0',
        title: '🚨 Dernier jour d’abonnement : Expire aujourd’hui !',
        message: `Votre Formule Pro expire ce soir à 23h59. Réactivez dès maintenant pour 30 jours supplémentaires sans interruption.`,
        daysRemaining: 0,
        expiresAtFormatted: formattedExpiresDate,
        actionText: 'Renouveler immédiatement (15 000 F)',
      };
    }

    if (daysRemaining === 1) {
      return {
        level: 'j-1',
        title: '⚠️ Votre Formule Pro expire demain (J-1)',
        message: `Il vous reste 1 jour d'accès pro (échéance le ${formattedExpiresDate}). Anticipez votre renouvellement pour rester couvert.`,
        daysRemaining: 1,
        expiresAtFormatted: formattedExpiresDate,
        actionText: 'Renouveler 30 jours (15 000 F)',
      };
    }

    if (daysRemaining === 2) {
      return {
        level: 'j-2',
        title: '⏳ Votre Formule Pro expire dans 2 jours (J-2)',
        message: `Votre abonnement arrive à échéance le ${formattedExpiresDate}. Pensez à réactiver votre forfait pour 30 jours supplémentaires.`,
        daysRemaining: 2,
        expiresAtFormatted: formattedExpiresDate,
        actionText: 'Renouveler 30 jours (15 000 F)',
      };
    }

    return null;
  },

  /**
   * Nettoie les drapeaux d'alerte envoyés pour un utilisateur
   */
  clearAlertFlags(userId?: string): void {
    if (typeof window === 'undefined') return;
    const targetId = userId || DEFAULT_FALLBACK_USER_ID;
    try {
      const prefix = `locagestion:alert_sent:${targetId}:`;
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(prefix)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch { }
  },
};
