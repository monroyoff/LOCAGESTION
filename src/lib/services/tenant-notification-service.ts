'use client';

export type TenantNotificationType =
  | 'receipt_issued'
  | 'lease_available'
  | 'lease_resiliated'
  | 'lease_reactivated'
  | 'passport_ready'
  | 'incident_update'
  | 'notice_issued'
  | 'reminder_received'
  | 'advance_payment_declared';

export interface TenantNotification {
  id: string;
  title: string;
  message: string;
  time?: string;
  timestamp?: string;
  type: TenantNotificationType;
  read: boolean;
  link: string;
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  actor?: string; // Nom du bailleur ou expéditeur
  actionLabel?: string;
  metadata?: Record<string, any>;
}

export const STORAGE_KEY_TENANT_NOTIFS = 'locagestion:tenant_notifications:v1';

export const INITIAL_TENANT_NOTIFICATIONS: TenantNotification[] = [];

function dispatchUpdateEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('locagestion:tenant_notifications_updated'));
    window.dispatchEvent(new Event('storage'));
  }
}

export const TenantNotificationService = {
  /**
   * Récupère toutes les notifications destinées au locataire
   */
  getNotifications(tenantFilter?: string): TenantNotification[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_TENANT_NOTIFS);
      if (stored) {
        const list: TenantNotification[] = JSON.parse(stored);
        if (tenantFilter && tenantFilter.trim()) {
          const filterLower = tenantFilter.toLowerCase().trim();
          return list.filter(
            (n) =>
              !n.tenantName ||
              n.tenantName.toLowerCase().includes(filterLower) ||
              (n.tenantEmail && n.tenantEmail.toLowerCase().includes(filterLower))
          );
        }
        return list;
      }
    } catch (e) {
      console.error('Erreur lecture notifications locataire:', e);
    }
    return [];
  },

  /**
   * Ajoute une nouvelle notification et informe instantanément l'espace locataire
   */
  addNotification(
    data: Omit<TenantNotification, 'id' | 'read' | 'timestamp'> & {
      id?: string;
      read?: boolean;
      timestamp?: string;
    }
  ): TenantNotification {
    const list = this.getNotifications();
    const nowStr = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const newNotif: TenantNotification = {
      id: data.id || `tnotif-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      title: data.title,
      message: data.message,
      time: 'À l’instant',
      timestamp: data.timestamp || nowStr,
      type: data.type,
      read: data.read ?? false,
      link: data.link,
      tenantName: data.tenantName,
      tenantEmail: data.tenantEmail,
      tenantPhone: data.tenantPhone,
      actor: data.actor || 'Bailleur',
      actionLabel: data.actionLabel || 'Consulter',
      metadata: data.metadata,
    };

    // Insérer en première position (ordre antichronologique)
    const updated = [newNotif, ...list.filter((n) => n.id !== newNotif.id)];

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_TENANT_NOTIFS, JSON.stringify(updated));
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

  /**
   * Marquer une notification comme lue
   */
  markAsRead(id: string): void {
    const list = this.getNotifications();
    const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_TENANT_NOTIFS, JSON.stringify(updated));
      } catch (e) {}
    }
    dispatchUpdateEvent();
  },

  /**
   * Marquer toutes les notifications comme lues
   */
  markAllAsRead(): void {
    const list = this.getNotifications();
    const updated = list.map((n) => ({ ...n, read: true }));
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_TENANT_NOTIFS, JSON.stringify(updated));
      } catch (e) {}
    }
    dispatchUpdateEvent();
  },

  /**
   * Supprimer une notification
   */
  deleteNotification(id: string): void {
    const list = this.getNotifications();
    const updated = list.filter((n) => n.id !== id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_TENANT_NOTIFS, JSON.stringify(updated));
      } catch (e) {}
    }
    dispatchUpdateEvent();
  },

  /**
   * Compteur de notifications non lues
   */
  getUnreadCount(tenantFilter?: string): number {
    return this.getNotifications(tenantFilter).filter((n) => !n.read).length;
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
   * Action Bailleur : Rappel de paiement de loyer
   */
  notifyReminderSent(params: {
    period: string;
    expectedAmount: number;
    tenantName: string;
    tenantPhone?: string;
    propertyName?: string;
    unitNumber?: string;
  }) {
    return this.addNotification({
      title: 'Rappel d’Échéance de Loyer Émis',
      message: `Votre bailleur vous rappelle l'échéance de loyer de ${params.period} d'un montant de ${new Intl.NumberFormat('fr-FR').format(params.expectedAmount)} FCFA. Vous pouvez régler par Wave, MTN ou virement bancaire.`,
      type: 'reminder_received',
      link: '/portal?tab=accueil&action=declare_payment',
      tenantName: params.tenantName,
      tenantPhone: params.tenantPhone,
      actor: 'Bailleur',
      actionLabel: 'Déclarer mon paiement',
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
  }) {
    return this.addNotification({
      title: `Paiement d’Avance Transmis (${params.advanceMonthsCount} mois) 🚀`,
      message: `Votre déclaration de paiement pour ${params.period} (${new Intl.NumberFormat('fr-FR').format(params.amount)} FCFA) a bien été envoyée à votre bailleur pour vérification et validation des quittances.`,
      type: 'advance_payment_declared',
      link: '/portal?tab=quittances',
      tenantName: params.tenantName,
      actor: 'Système LOCAGESTION',
      actionLabel: 'Voir mes déclarations',
    });
  },
};

