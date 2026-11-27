'use client';

import { AuthUser } from '../types';
import { AuthService, areEmailsEqual, arePhoneNumbersEqual } from './auth-service';
import { resolveNotificationDate, compareNotificationsDesc } from '../money/format';
import { SoundService } from './sound-service';

export type TenantNotificationType =
  | 'receipt_issued'
  | 'lease_available'
  | 'lease_resiliated'
  | 'lease_reactivated'
  | 'passport_ready'
  | 'incident_update'
  | 'notice_issued'
  | 'reminder_received'
  | 'advance_payment_declared'
  | 'chat_message';

export interface TenantNotification {
  id: string;
  title: string;
  message: string;
  time?: string;
  timestamp?: string;
  createdAt?: string;
  type: TenantNotificationType;
  read: boolean;
  link: string;
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  recipientName?: string;
  tenantMatricule?: string;
  recipientMatricule?: string;
  actor?: string; // Nom du bailleur ou expéditeur
  actionLabel?: string;
  metadata?: Record<string, any>;
  isGlobal?: boolean;
}

export const STORAGE_KEY_TENANT_NOTIFS = 'locagestion:tenant_notifications:v1';

export const INITIAL_TENANT_NOTIFICATIONS: TenantNotification[] = [];

function dispatchUpdateEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('locagestion:tenant_notifications_updated'));
    window.dispatchEvent(new Event('locagestion:tenant_notifs_updated'));
    window.dispatchEvent(new Event('storage'));
  }
}

/**
 * Vérifie de façon étanche et déterministe si une notification est adressée à l'utilisateur ciblé
 */
export function isNotificationForUser(
  notif: TenantNotification | Record<string, any>,
  targetUser?: AuthUser | null,
  filterText?: string | null
): boolean {
  if (!notif) return false;

  // Notification globale pour tous les locataires (annonces système officielles)
  if (notif.isGlobal) return true;

  // Filtrage libre par recherche textuelle (si renseigné)
  if (filterText && filterText.trim()) {
    const q = filterText.toLowerCase().trim();
    const matchesEmail =
      (notif.tenantEmail && notif.tenantEmail.toLowerCase().includes(q)) ||
      (notif.recipientEmail && notif.recipientEmail.toLowerCase().includes(q));
    const matchesPhone =
      (notif.tenantPhone && notif.tenantPhone.includes(q)) ||
      (notif.recipientPhone && notif.recipientPhone.includes(q));
    const matchesName =
      (notif.tenantName && notif.tenantName.toLowerCase().includes(q)) ||
      (notif.recipientName && notif.recipientName.toLowerCase().includes(q));
    const matchesMatricule =
      (notif.tenantMatricule && notif.tenantMatricule.toLowerCase().includes(q)) ||
      (notif.recipientMatricule && notif.recipientMatricule.toLowerCase().includes(q));
    return Boolean(matchesEmail || matchesPhone || matchesName || matchesMatricule);
  }

  // Filtrage strict par compte utilisateur authentifié
  if (!targetUser) return false;

  const userEmail = targetUser.email?.trim().toLowerCase();
  const userPhone = targetUser.phone?.trim();
  const userName = targetUser.name?.trim().toLowerCase();
  const userMatricule = targetUser.matricule?.trim().toUpperCase();

  const notifEmail = (notif.tenantEmail || notif.recipientEmail)?.trim().toLowerCase();
  const notifPhone = notif.tenantPhone || notif.recipientPhone;
  const notifName = (notif.tenantName || notif.recipientName)?.trim().toLowerCase();
  const notifMatricule = (notif.tenantMatricule || notif.recipientMatricule)?.trim().toUpperCase();

  // 1. Email : correspondance stricte
  if (userEmail && notifEmail && areEmailsEqual(userEmail, notifEmail)) {
    return true;
  }

  // 2. Numéro de téléphone : correspondance avec ou sans indicatif
  if (userPhone && notifPhone && arePhoneNumbersEqual(userPhone, notifPhone)) {
    return true;
  }

  // 3. Matricule officiel
  if (userMatricule && notifMatricule && userMatricule === notifMatricule) {
    return true;
  }

  // 4. Nom complet (ordre direct ou inversé)
  if (userName && notifName) {
    if (userName === notifName) return true;
    const userWords = userName.split(/\s+/).filter(Boolean);
    const notifWords = notifName.split(/\s+/).filter(Boolean);
    if (
      userWords.length > 0 &&
      userWords.length === notifWords.length &&
      userWords.every((w: string) => notifWords.includes(w))
    ) {
      return true;
    }
  }

  return false;
}

export const TenantNotificationService = {
  /**
   * Récupère toutes les notifications brutes du localStorage
   */
  getAllRawNotifications(): TenantNotification[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TENANT_NOTIFS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          let needsSave = false;
          const mapped = parsed.map((n) => {
            const isTimeInstant = n.time && n.time.toLowerCase().includes('instant');
            const isTimestampInstant = n.timestamp && n.timestamp.toLowerCase().includes('instant');
            let createdAt = n.createdAt;
            let time = n.time;
            let timestamp = n.timestamp;

            if (!createdAt || isTimeInstant || isTimestampInstant) {
              const resolved = resolveNotificationDate(n);
              needsSave = true;
              createdAt = createdAt || resolved.toISOString();
              const h = String(resolved.getHours()).padStart(2, '0');
              const m = String(resolved.getMinutes()).padStart(2, '0');
              time = !isTimeInstant && time ? time : `${h}:${m}`;
              timestamp = !isTimestampInstant && timestamp ? timestamp : resolved.toISOString();
            }

            let type = n.type;
            const link = n.link || '';
            const title = (n.title || '').toLowerCase();
            const actionLabel = (n.actionLabel || '').toLowerCase();

            // Reclassifier les réponses de messagerie en chat_message
            if (
              (type === 'reminder_received' || !type) &&
              (link.includes('/messages') ||
                n.title?.startsWith('💬') ||
                title.includes('réponse de votre bailleur') ||
                title.includes('nouveau message') ||
                actionLabel.includes('lire le message'))
            ) {
              type = 'chat_message';
              needsSave = true;
            }

            // Reclassifier les contrats de bail
            if (
              (type === 'reminder_received' || !type) &&
              (title.includes('contrat de bail') || title.includes('bail contresigné'))
            ) {
              type = 'lease_available';
              needsSave = true;
            }

            return {
              ...n,
              type,
              createdAt,
              time,
              timestamp,
              read: n.read !== undefined ? Boolean(n.read) : !Boolean(n.unread),
            };
          });

          mapped.sort(compareNotificationsDesc);

          if (needsSave && typeof window !== 'undefined') {
            try {
              localStorage.setItem(STORAGE_KEY_TENANT_NOTIFS, JSON.stringify(mapped));
            } catch (e) {}
          }
          return mapped;
        }
      }
    } catch (e) {
      console.error('Erreur lecture notifications brutes:', e);
    }
    return [];
  },

  /**
   * Récupère les notifications filtrées de façon strictement étanche pour le locataire,
   * triées chronologiquement en ordre décroissant (la plus récente "À l'instant" tout en haut).
   */
  getNotifications(userOrFilter?: AuthUser | string | null): TenantNotification[] {
    if (typeof window === 'undefined') return [];
    const all = this.getAllRawNotifications();

    let targetUser: AuthUser | null = null;
    let filterText: string | null = null;

    if (userOrFilter && typeof userOrFilter === 'object') {
      targetUser = userOrFilter as AuthUser;
    } else if (typeof userOrFilter === 'string' && userOrFilter.trim()) {
      filterText = userOrFilter.trim();
    } else {
      targetUser = AuthService.getCurrentUser();
    }

    let results: TenantNotification[] = [];
    if (filterText) {
      results = all.filter((n) => isNotificationForUser(n, null, filterText));
    } else if (targetUser) {
      results = all.filter((n) => isNotificationForUser(n, targetUser, null));
    }

    return results.sort(compareNotificationsDesc);
  },

  /**
   * Récupère exclusivement les relances de loyer et mises en demeure adressées au locataire
   * Exclut formellement les messages de discussion chat et les avis de baux
   */
  getReminders(userOrFilter?: AuthUser | string | null): TenantNotification[] {
    const notifs = this.getNotifications(userOrFilter);
    return notifs.filter((n) => {
      // Exclure les chats et discussions
      if (n.type === 'chat_message') return false;
      if (n.link?.includes('/messages')) return false;
      if (n.title?.startsWith('💬') || n.title?.toLowerCase().includes('réponse de votre bailleur') || n.title?.toLowerCase().includes('nouveau message')) return false;

      // Exclure les contrats de bail
      if (n.type === 'lease_available' || n.type === 'lease_reactivated' || n.type === 'lease_resiliated') return false;
      if (n.title?.toLowerCase().includes('contrat de bail') || n.title?.toLowerCase().includes('bail contresigné')) return false;

      // Exclure quittances, incidents, etc.
      if (
        n.type === 'receipt_issued' ||
        n.type === 'incident_update' ||
        n.type === 'advance_payment_declared' ||
        n.type === 'passport_ready'
      ) {
        return false;
      }

      // Vraie relance
      if (n.type === 'reminder_received') return true;
      const lower = (n.title || '').toLowerCase();
      return (
        lower.includes('rappel') ||
        lower.includes('relance') ||
        lower.includes('mise en demeure') ||
        lower.includes('retard de loyer') ||
        lower.includes('sommation')
      );
    });
  },

  /**
   * Compteur de notifications non lues pour l'utilisateur
   */
  getUnreadCount(userOrFilter?: AuthUser | string | null): number {
    return this.getNotifications(userOrFilter).filter((n) => !n.read).length;
  },

  /**
   * Marquer une notification comme lue
   */
  markAsRead(id: string): void {
    const all = this.getAllRawNotifications();
    const updated = all.map((n) => (n.id === id ? { ...n, read: true } : n));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_TENANT_NOTIFS, JSON.stringify(updated));
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notifications: updated }),
        }).catch(() => {});
      } catch (e) {}
    }
    dispatchUpdateEvent();
  },

  /**
   * Marquer toutes les notifications de l'utilisateur comme lues
   */
  markAllAsRead(userOrFilter?: AuthUser | string | null): void {
    let targetUser: AuthUser | null = null;
    if (userOrFilter && typeof userOrFilter === 'object') {
      targetUser = userOrFilter as AuthUser;
    } else {
      targetUser = AuthService.getCurrentUser();
    }

    const all = this.getAllRawNotifications();
    const updated = all.map((n) => {
      if (targetUser && isNotificationForUser(n, targetUser)) {
        return { ...n, read: true };
      }
      return n;
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_TENANT_NOTIFS, JSON.stringify(updated));
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notifications: updated }),
        }).catch(() => {});
      } catch (e) {}
    }
    dispatchUpdateEvent();
  },

  /**
   * Supprimer une notification
   */
  deleteNotification(id: string): void {
    const all = this.getAllRawNotifications();
    const updated = all.filter((n) => n.id !== id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_TENANT_NOTIFS, JSON.stringify(updated));
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notifications: updated }),
        }).catch(() => {});
      } catch (e) {}
    }
    dispatchUpdateEvent();
  },

  /**
   * Ajoute une nouvelle notification et informe instantanément l'espace locataire
   */
  addNotification(
    data: Omit<TenantNotification, 'id' | 'read' | 'timestamp'> & {
      id?: string;
      read?: boolean;
      timestamp?: string;
      createdAt?: string;
    }
  ): TenantNotification {
    const all = this.getAllRawNotifications();
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const nowIso = now.toISOString();

    const newNotif: TenantNotification = {
      id: data.id || `tnotif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      title: data.title,
      message: data.message,
      time: (data.time && !data.time.toLowerCase().includes('instant')) ? data.time : timeStr,
      timestamp: (data.timestamp && !data.timestamp.toLowerCase().includes('instant')) ? data.timestamp : nowIso,
      createdAt: data.createdAt || nowIso,
      type: data.type,
      read: data.read ?? false,
      link: data.link,
      tenantName: data.tenantName,
      tenantEmail: data.tenantEmail,
      tenantPhone: data.tenantPhone,
      recipientEmail: data.tenantEmail,
      recipientPhone: data.tenantPhone,
      actor: data.actor || 'Bailleur',
      actionLabel: data.actionLabel || 'Consulter',
      metadata: data.metadata,
      isGlobal: (data as any).isGlobal ?? false,
    };

    const updated = [newNotif, ...all.filter((n) => n.id !== newNotif.id)].sort(compareNotificationsDesc);

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_TENANT_NOTIFS, JSON.stringify(updated));
        // Signal sonore universel instantané
        try {
          SoundService.playNotificationSound();
        } catch {}
        // Poussée immédiate vers le serveur central pour synchronisation mobile instantanée
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notifications: [newNotif] }),
        }).catch(() => {});
      } catch (e) {
        console.error('Erreur sauvegarde notifications locataire:', e);
      }
    }

    dispatchUpdateEvent();
    return newNotif;
  },

  // =========================================================================
  // MÉTHODES DE DISPATCH RAPIDES POUR LES ACTIONS DU BAILLEUR
  // =========================================================================

  /**
   * Action Bailleur : Nouveau contrat de bail transmis au locataire
   */
  notifyLeaseTransmitted(params: {
    leaseId: string;
    propertyName: string;
    unitNumber: string;
    rent: number;
    tenantName: string;
    tenantEmail?: string;
    tenantPhone?: string;
    landlordName?: string;
  }) {
    return this.addNotification({
      title: 'Nouveau Contrat de Bail Prêt à Signer',
      message: `Votre bailleur ${params.landlordName || 'Le Bailleur'} vous a transmis le bail ${params.leaseId} pour le logement ${params.unitNumber} (${params.propertyName}) au loyer de ${new Intl.NumberFormat('fr-FR').format(params.rent)} FCFA/mois. Vous pouvez le visualiser et le contresigner dès maintenant.`,
      type: 'lease_available',
      link: `/portal?tab=bail&leaseId=${params.leaseId}&tenant=${encodeURIComponent(params.tenantName)}`,
      tenantName: params.tenantName,
      tenantEmail: params.tenantEmail,
      tenantPhone: params.tenantPhone,
      actor: params.landlordName || 'Le Bailleur',
      actionLabel: 'Visualiser & Signer',
    });
  },

  /**
   * Action Bailleur : Validation d'un paiement de loyer et émission de quittance
   */
  notifyPaymentApproved(params: {
    receiptNumber: string;
    amount: number;
    period: string;
    tenantName: string;
    tenantEmail?: string;
    isAdvance?: boolean;
    advanceMonthsCount?: number;
    landlordName?: string;
  }) {
    const title = params.isAdvance
      ? `Quittance de Loyer d'Avance Validée (${params.advanceMonthsCount || 1} mois) ✓`
      : 'Quittance Officielle Émise ✓';

    const message = params.isAdvance
      ? `Votre règlement de loyer d'avance (${params.period}) d'un montant de ${new Intl.NumberFormat('fr-FR').format(params.amount)} FCFA a été validé par votre bailleur. La quittance officielle N° ${params.receiptNumber} avec QR Code est disponible.`
      : `Votre règlement de loyer (${params.period}) d'un montant de ${new Intl.NumberFormat('fr-FR').format(params.amount)} FCFA a été validé par votre bailleur. Votre quittance officielle N° ${params.receiptNumber} est téléchargeable.`;

    return this.addNotification({
      title,
      message,
      type: 'receipt_issued',
      link: '/portal?tab=quittances',
      tenantName: params.tenantName,
      tenantEmail: params.tenantEmail,
      actor: params.landlordName || 'Bailleur',
      actionLabel: 'Télécharger Quittance',
    });
  },

  /**
   * Action Bailleur : Rejet ou demande de clarification sur paiement
   */
  notifyPaymentRejected(params: {
    amount: number;
    period: string;
    tenantName: string;
    reason?: string;
  }) {
    return this.addNotification({
      title: 'Paiement Non Validé — Clarification Requise',
      message: `Votre déclaration de paiement pour ${params.period} (${new Intl.NumberFormat('fr-FR').format(params.amount)} FCFA) nécessite une vérification : ${params.reason || 'Pièce justificative illisible ou référence introuvable'}.`,
      type: 'reminder_received',
      link: '/portal?tab=accueil&action=declare_payment',
      tenantName: params.tenantName,
      actor: 'Bailleur',
      actionLabel: 'Corriger déclaration',
    });
  },

  /**
   * Action Bailleur : Résiliation du contrat de bail
   */
  notifyLeaseResiliated(params: {
    leaseId: string;
    unitNumber: string;
    tenantName: string;
    tenantEmail?: string;
    reason?: string;
    landlordName?: string;
  }) {
    return this.addNotification({
      title: 'Notification de Résiliation de Bail',
      message: `Votre bailleur ${params.landlordName || 'Le Bailleur'} a prononcé la résiliation du contrat ${params.leaseId} concernant le logement ${params.unitNumber}.${params.reason ? ` Motif : ${params.reason}.` : ''}`,
      type: 'lease_resiliated',
      link: '/portal?tab=bail',
      tenantName: params.tenantName,
      tenantEmail: params.tenantEmail,
      actor: params.landlordName || 'Bailleur',
      actionLabel: 'Consulter mon dossier',
    });
  },

  /**
   * Action Bailleur : Réactivation du bail
   */
  notifyLeaseReactivated(params: {
    leaseId: string;
    unitNumber: string;
    tenantName: string;
    tenantEmail?: string;
    landlordName?: string;
  }) {
    return this.addNotification({
      title: 'Bail d’Habitation Réactivé ✓',
      message: `Votre contrat ${params.leaseId} pour le logement ${params.unitNumber} a été réactivé par votre bailleur. Vos droits locatifs et quittances sont pleinement opérationnels.`,
      type: 'lease_reactivated',
      link: '/portal?tab=bail',
      tenantName: params.tenantName,
      tenantEmail: params.tenantEmail,
      actor: params.landlordName || 'Bailleur',
      actionLabel: 'Accéder à mon bail',
    });
  },

  /**
   * Action Bailleur : Notification officielle de préavis de congé
   */
  notifyNoticeIssued(params: {
    noticeId: string;
    reasonTitle: string;
    effectiveDate: string;
    tenantName: string;
    tenantEmail?: string;
    propertyName: string;
    unitNumber: string;
  }) {
    return this.addNotification({
      title: 'Notification Officielle de Préavis de Congé',
      message: `Votre bailleur vous a notifié un congé officiel (${params.noticeId}) pour ${params.reasonTitle}. Date impérative de libération des lieux fixée au ${params.effectiveDate}.`,
      type: 'notice_issued',
      link: '/portal?tab=preavis',
      tenantName: params.tenantName,
      tenantEmail: params.tenantEmail,
      actor: 'Votre Bailleur',
      actionLabel: 'Voir le préavis légal',
    });
  },

  /**
   * Action Bailleur : Accusé de réception officiel d'un préavis de départ notifié par le locataire
   */
  notifyNoticeReceptionConfirmed(params: {
    noticeId: string;
    effectiveDate: string;
    tenantName: string;
    tenantEmail?: string;
    tenantPhone?: string;
    propertyName: string;
    landlordName?: string;
  }) {
    return this.addNotification({
      title: 'Accusé de Réception de Préavis Confirmé',
      message: `${params.landlordName || 'Votre bailleur'} a officiellement accusé réception et validé votre préavis de départ (${params.noticeId}) pour le ${params.effectiveDate} (${params.propertyName}).`,
      type: 'notice_issued',
      link: '/portal?tab=preavis',
      tenantName: params.tenantName,
      tenantEmail: params.tenantEmail,
      actor: params.landlordName || 'Votre Bailleur',
      actionLabel: 'Consulter mon préavis',
    });
  },

  /**
   * Action Bailleur : Réponse apportée par le bailleur au préavis du locataire
   */
  notifyNoticeReplied(params: {
    noticeId: string;
    tenantName: string;
    tenantEmail?: string;
    tenantPhone?: string;
    propertyName: string;
    landlordName?: string;
    message: string;
  }) {
    return this.addNotification({
      title: 'Réponse du Bailleur à votre Préavis',
      message: `${params.landlordName || 'Votre bailleur'} vous a répondu concernant le préavis ${params.noticeId} : « ${params.message} »`,
      type: 'notice_issued',
      link: '/portal?tab=preavis',
      tenantName: params.tenantName,
      tenantEmail: params.tenantEmail,
      actor: params.landlordName || 'Votre Bailleur',
      actionLabel: 'Lire la réponse',
    });
  },

  /**
   * Action Bailleur : Rappel de paiement de loyer
   */
  notifyReminderSent(params: {
    period: string;
    expectedAmount: number;
    tenantName: string;
    tenantPhone?: string;
    tenantEmail?: string;
    propertyName?: string;
    unitNumber?: string;
    urgencyLevel?: 'courtois' | 'ferme' | 'mise_en_demeure';
    senderName?: string;
  }) {
    const isMiseEnDemeure = params.urgencyLevel === 'mise_en_demeure';
    const isFerme = params.urgencyLevel === 'ferme';

    const title = isMiseEnDemeure
      ? 'Sommation & Mise en Demeure de Payer (J+15)'
      : isFerme
      ? 'Notification de Retard de Loyer (Relance Ferme)'
      : 'Rappel d’Échéance de Loyer';

    const message = isMiseEnDemeure
      ? `Mise en demeure formelle concernant l'impayé de loyer de ${params.period} (${new Intl.NumberFormat('fr-FR').format(params.expectedAmount)} FCFA) pour le logement ${params.propertyName || params.unitNumber || 'loué'}. Régularisation exigée sous 48h avant ouverture de procédure contentieuse.`
      : isFerme
      ? `Votre bailleur constate un retard sur le règlement du loyer de ${params.period} (${new Intl.NumberFormat('fr-FR').format(params.expectedAmount)} FCFA) pour ${params.propertyName || params.unitNumber || 'votre logement'}. Merci de régulariser sans délai.`
      : `Votre bailleur vous rappelle l'échéance de loyer de ${params.period} d'un montant de ${new Intl.NumberFormat('fr-FR').format(params.expectedAmount)} FCFA. Vous pouvez régler par Wave, MTN ou virement bancaire.`;

    return this.addNotification({
      title,
      message,
      type: 'reminder_received',
      link: '/portal?tab=preavis',
      tenantName: params.tenantName,
      tenantPhone: params.tenantPhone,
      tenantEmail: params.tenantEmail,
      actor: params.senderName || 'Bailleur',
      actionLabel: 'Régulariser / Payer',
      metadata: {
        urgencyLevel: params.urgencyLevel || 'courtois',
        period: params.period,
        expectedAmount: params.expectedAmount,
        propertyName: params.propertyName,
        unitNumber: params.unitNumber,
      },
    });
  },

  /**
   * Action Bailleur : Mise à jour du traitement d'une panne / incident
   */
  notifyIncidentUpdated(params: {
    incidentTitle: string;
    status: 'en_cours' | 'resolu' | 'rejetee';
    tenantName?: string;
  }) {
    const statusText =
      params.status === 'resolu'
        ? 'Réparation terminée et clôturée ✓'
        : params.status === 'en_cours'
        ? 'Pris en charge par un technicien mandaté'
        : 'Demande examinée par le bailleur';

    return this.addNotification({
      title: 'Mise à Jour Signalement Panne',
      message: `Votre signalement « ${params.incidentTitle} » a été actualisé : ${statusText}.`,
      type: 'incident_update',
      link: '/portal?action=incident',
      tenantName: params.tenantName,
      actor: 'Bailleur',
      actionLabel: 'Voir le ticket',
    });
  },

  /**
   * Action Locataire : Paiement de loyers d'avance déclaré
   */
  notifyAdvancePaymentDeclared(params: {
    amount: number;
    period: string;
    advanceMonthsCount: number;
    tenantName: string;
    tenantEmail?: string;
    tenantPhone?: string;
  }) {
    return this.addNotification({
      title: `Paiement d’Avance Transmis (${params.advanceMonthsCount} mois) 🚀`,
      message: `Votre déclaration de paiement pour ${params.period} (${new Intl.NumberFormat('fr-FR').format(params.amount)} FCFA) a bien été envoyée à votre bailleur pour vérification et validation des quittances.`,
      type: 'advance_payment_declared',
      link: '/portal?tab=quittances',
      tenantName: params.tenantName,
      tenantEmail: params.tenantEmail,
      tenantPhone: params.tenantPhone,
      actor: 'Système LOCAGESTION',
      actionLabel: 'Voir mes déclarations',
    });
  },
};
