'use client';

import { Lease, isFakeLease } from './lease-service';
import { TenantNotification } from './tenant-notification-service';
import { AuthUser, RentalListing, Property } from '@/lib/types';
import { isFakeDemoUser } from './auth-service';
import { isFakeListing } from './listings-service';
import { isFakeConversation, INITIAL_CONVERSATIONS } from './conversation-service';
import { isFakeProperty } from './property-service';
import { isFakePayment } from './payment-service';

const LEASES_STORAGE_KEY = 'locagestion:leases:v1';
const TENANT_NOTIFS_KEY = 'locagestion:tenant_notifications:v1';
const LANDLORD_NOTIFS_KEY = 'locagestion:landlord_notifications:v1';
const USERS_STORAGE_KEY = 'locagestion:auth:users:v1';
const LISTINGS_STORAGE_KEY = 'locagestion:custom_listings';

let syncIntervalId: NodeJS.Timeout | null = null;
let isSyncing = false;
let isInitialized = false;

export const SyncService = {
  /**
   * Synchronisation descendante : récupère les baux, notifications et utilisateurs du serveur
   * et les fusionne instantanément avec le stockage local (Web & Mobile).
   */
  async sync(): Promise<{ success: boolean; leasesCount: number; notifsCount: number }> {
    if (typeof window === 'undefined' || isSyncing) {
      return { success: false, leasesCount: 0, notifsCount: 0 };
    }

    isSyncing = true;
    try {
      const res = await fetch('/api/sync', {
        method: 'GET',
        headers: { credentials: 'same-origin' },
        cache: 'no-store',
      });

      if (!res.ok) {
        isSyncing = false;
        return { success: false, leasesCount: 0, notifsCount: 0 };
      }

      const data = await res.json();
      if (!data || !data.success) {
        isSyncing = false;
        return { success: false, leasesCount: 0, notifsCount: 0 };
      }

      if (data.adminPassword && typeof data.adminPassword === 'string') {
        try {
          localStorage.setItem('locagestion:admin_custom_password:v1', data.adminPassword.trim());
        } catch {}
      }

      let leasesUpdated = false;
      let notifsUpdated = false;

      // 1. Synchronisation des BAUX
      if (Array.isArray(data.leases)) {
        let localLeases: Lease[] = [];
        try {
          const stored = localStorage.getItem(LEASES_STORAGE_KEY);
          if (stored) localLeases = JSON.parse(stored);
        } catch (e) { }

        // Purger immédiatement et définitivement les faux baux de démo (BAIL-2026-MAG-102, BAIL-2026-COM-205, etc.)
        const sanitizedLocal = localLeases.filter((l) => !isFakeLease(l));
        if (sanitizedLocal.length !== localLeases.length) {
          localLeases = sanitizedLocal;
          leasesUpdated = true;
        }

        const leaseMap = new Map<string, Lease>();
        // Déposer les baux locaux
        localLeases.forEach((l) => leaseMap.set(l.id, l));
        // Fusionner avec les baux serveur (le serveur a priorité sur les signatures et transmissions)
        data.leases.forEach((serverLease: Lease) => {
          if (!serverLease || !serverLease.id || isFakeLease(serverLease)) return;
          const local = leaseMap.get(serverLease.id);
          if (!local) {
            leaseMap.set(serverLease.id, serverLease);
            leasesUpdated = true;
          } else {
            // Si le statut ou la signature est plus avancée sur le serveur
            if (
              serverLease.status !== local.status ||
              serverLease.signedByTenant !== local.signedByTenant ||
              serverLease.signedByLandlord !== local.signedByLandlord ||
              serverLease.transmittedAt !== local.transmittedAt
            ) {
              leaseMap.set(serverLease.id, { ...local, ...serverLease });
              leasesUpdated = true;
            }
          }
        });

        if (leasesUpdated) {
          const mergedLeases = Array.from(leaseMap.values());
          localStorage.setItem(LEASES_STORAGE_KEY, JSON.stringify(mergedLeases));
          window.dispatchEvent(new Event('locagestion:leases_updated'));
          window.dispatchEvent(new Event('storage'));
        }
      }

      // 2. Synchronisation des NOTIFICATIONS
      if (Array.isArray(data.notifications)) {
        let localTenantNotifs: TenantNotification[] = [];
        try {
          const stored = localStorage.getItem(TENANT_NOTIFS_KEY);
          if (stored) localTenantNotifs = JSON.parse(stored);
        } catch (e) { }

        const notifMap = new Map<string, TenantNotification>();
        localTenantNotifs.forEach((n) => notifMap.set(n.id, n));

        data.notifications.forEach((serverNotif: TenantNotification) => {
          if (!serverNotif || !serverNotif.id) return;
          if (!notifMap.has(serverNotif.id)) {
            notifMap.set(serverNotif.id, serverNotif);
            notifsUpdated = true;
          }
        });

        if (notifsUpdated) {
          const mergedNotifs = Array.from(notifMap.values());
          localStorage.setItem(TENANT_NOTIFS_KEY, JSON.stringify(mergedNotifs));
          window.dispatchEvent(new Event('locagestion:tenant_notifications_updated'));
          window.dispatchEvent(new Event('locagestion:tenant_notifs_updated'));
          window.dispatchEvent(new Event('locagestion:notifications_updated'));
          window.dispatchEvent(new Event('storage'));
        }
      }

      // 3. Synchronisation des UTILISATEURS (Garantie Unicité Matricule & Purge des faux comptes)
      if (Array.isArray(data.users)) {
        let localUsers: AuthUser[] = [];
        try {
          const stored = localStorage.getItem(USERS_STORAGE_KEY) || localStorage.getItem('locagestion:users:v1');
          if (stored) localUsers = JSON.parse(stored);
        } catch (e) { }

        // Purger immédiatement et définitivement tous les comptes démo locaux
        const sanitizedUsers = localUsers.filter((u) => !isFakeDemoUser(u));
        const serverUsers = data.users.filter((u: any) => !isFakeDemoUser(u));

        const userMap = new Map<string, AuthUser>();
        serverUsers.forEach((u: any) => {
          if (u.email) userMap.set(u.email.toLowerCase(), u);
        });
        sanitizedUsers.forEach((u) => {
          if (u.email && !userMap.has(u.email.toLowerCase())) {
            userMap.set(u.email.toLowerCase(), u);
          }
        });

        const finalUsers = Array.from(userMap.values());
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(finalUsers));
        localStorage.removeItem('locagestion:users:v1');
        window.dispatchEvent(new Event('locagestion:auth_changed'));

        // Vérifier et purger la session active si elle appartient à un compte fictif
        try {
          const sessionRaw = localStorage.getItem('locagestion:auth:session:v1');
          if (sessionRaw) {
            const parsedSession = JSON.parse(sessionRaw);
            if (parsedSession && isFakeDemoUser(parsedSession)) {
              localStorage.removeItem('locagestion:auth:session:v1');
              localStorage.removeItem('locagestion:active_space');
              window.dispatchEvent(new Event('locagestion:auth_changed'));
            }
          }
        } catch (e) {}
      }

      // 4. Synchronisation des ANNONCES (Purge complète des annonces fictives Web & Mobile)
      if (Array.isArray(data.listings)) {
        let localListings: RentalListing[] = [];
        try {
          const stored = localStorage.getItem(LISTINGS_STORAGE_KEY);
          if (stored) localListings = JSON.parse(stored);
        } catch (e) { }

        // Purger immédiatement et définitivement toutes les annonces démo locales et serveur
        const sanitizedLocal = localListings.filter((l) => !isFakeListing(l));
        const sanitizedServer = (data.listings || []).filter((l: any) => !isFakeListing(l));

        const listingMap = new Map<string, RentalListing>();
        sanitizedLocal.forEach((l) => {
          if (l && l.id) listingMap.set(l.id, l);
        });
        sanitizedServer.forEach((l: any) => {
          if (l && l.id) listingMap.set(l.id, l);
        });

        // Remontée bidirectionnelle instantanée uniquement pour les annonces authentiques créées localement
        const unpushed = sanitizedLocal.filter((loc) => !sanitizedServer.some((sl: any) => sl.id === loc.id));
        if (unpushed.length > 0) {
          fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ listings: Array.from(listingMap.values()) }),
          }).catch(() => {});
        }

        const mergedListings = Array.from(listingMap.values());
        localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(mergedListings));
        window.dispatchEvent(new CustomEvent('locagestion:listings_updated'));
        window.dispatchEvent(new Event('storage'));
      }

      // 5. Synchronisation des PROPRIÉTÉS (Patrimoine Bailleur Web & Mobile)
      if (Array.isArray(data.properties)) {
        let localProps: Property[] = [];
        try {
          const stored = localStorage.getItem('locagestion:properties:v1');
          if (stored) localProps = JSON.parse(stored);
        } catch (e) {}

        const propMap = new Map<string, any>();
        localProps.forEach((p) => {
          if (p && p.id && !isFakeProperty(p)) propMap.set(p.id, p);
        });
        (data.properties || []).forEach((p: any) => {
          if (p && p.id && !isFakeProperty(p)) propMap.set(p.id, p);
        });

        const mergedProps = Array.from(propMap.values());
        localStorage.setItem('locagestion:properties:v1', JSON.stringify(mergedProps));
        window.dispatchEvent(new CustomEvent('locagestion:properties_updated'));
        window.dispatchEvent(new Event('storage'));
      }

      // 6. Synchronisation des CONVERSATIONS (Messagerie Web & Mobile)
      if (Array.isArray(data.conversations)) {
        let localConvs: any[] = [];
        try {
          const stored = localStorage.getItem('locagestion:conversations:v1');
          if (stored) localConvs = JSON.parse(stored);
        } catch (e) {}

        const convMap = new Map<string, any>();
        if (INITIAL_CONVERSATIONS && Array.isArray(INITIAL_CONVERSATIONS)) {
          INITIAL_CONVERSATIONS.forEach((ic) => convMap.set(ic.id, ic));
        }
        localConvs.forEach((c) => {
          if (c && c.id && !isFakeConversation(c)) convMap.set(c.id, c);
        });
        (data.conversations || []).forEach((sc: any) => {
          if (sc && sc.id && !isFakeConversation(sc)) {
            const local = convMap.get(sc.id);
            if (!local) {
              convMap.set(sc.id, sc);
            } else {
              const msgMap = new Map<string, any>();
              (local.messages || []).forEach((m: any) => msgMap.set(m.id || m.timestamp, m));
              (sc.messages || []).forEach((m: any) => msgMap.set(m.id || m.timestamp, m));
              const allMessages = Array.from(msgMap.values());
              const lastMsg = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;
              convMap.set(sc.id, {
                ...local,
                ...sc,
                messages: allMessages,
                lastMessage: lastMsg ? lastMsg.text : (sc.lastMessage || local.lastMessage),
                lastMessageTime: lastMsg ? (lastMsg.time || sc.lastMessageTime) : (sc.lastMessageTime || local.lastMessageTime),
              });
            }
          }
        });

        const mergedConvs = Array.from(convMap.values());
        localStorage.setItem('locagestion:conversations:v1', JSON.stringify(mergedConvs));
        window.dispatchEvent(new CustomEvent('locagestion:conversations_updated'));

        // RECONCILIATION BIDIRECTIONNELLE INSTANTANÉE (PUSH WEB <-> MOBILE)
        // Si le client local possède des conversations ou messages non encore présents sur le serveur central,
        // les pousser immédiatement vers /api/sync pour que l'application Android et le Web
        // soient en miroir parfait temps réel !
        const serverIds = new Set((data.conversations || []).map((sc: any) => sc.id));
        const serverMsgCount = new Map<string, number>();
        (data.conversations || []).forEach((sc: any) => {
          serverMsgCount.set(sc.id, Array.isArray(sc.messages) ? sc.messages.length : 0);
        });

        const hasNewConvsForServer = mergedConvs.some((mc: any) => !serverIds.has(mc.id));
        const hasNewMsgsForServer = mergedConvs.some((mc: any) => {
          const sCount = serverMsgCount.get(mc.id) || 0;
          return (mc.messages?.length || 0) > sCount;
        });

        if (hasNewConvsForServer || hasNewMsgsForServer) {
          fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversations: mergedConvs }),
          }).catch(() => {});
        }
      }

      // 7. Synchronisation des PAIEMENTS & QUITTANCES (Web & Mobile)
      if (Array.isArray(data.payments)) {
        let localPayments: any[] = [];
        try {
          const stored = localStorage.getItem('locagestion:declared_payments');
          if (stored) localPayments = JSON.parse(stored);
        } catch (e) {}

        const payMap = new Map<string, any>();
        localPayments.forEach((p) => {
          if (p && p.id && !isFakePayment(p)) payMap.set(p.id, p);
        });
        (data.payments || []).forEach((sp: any) => {
          if (sp && sp.id && !isFakePayment(sp)) {
            const local = payMap.get(sp.id);
            payMap.set(sp.id, { ...local, ...sp });
          }
        });

        const mergedPayments = Array.from(payMap.values());
        localStorage.setItem('locagestion:declared_payments', JSON.stringify(mergedPayments));
        window.dispatchEvent(new CustomEvent('locagestion:payments_updated'));
      }

      // 8. Purge immédiate des conversations fictives dans le stockage client
      try {
        const convStr = localStorage.getItem('locagestion:conversations:v1');
        if (convStr) {
          const convs = JSON.parse(convStr);
          if (Array.isArray(convs)) {
            const sanitizedConvs = convs.filter((c: any) => !isFakeConversation(c));
            if (sanitizedConvs.length !== convs.length) {
              localStorage.setItem('locagestion:conversations:v1', JSON.stringify(sanitizedConvs));
              window.dispatchEvent(new CustomEvent('locagestion:conversations_updated'));
            }
          }
        }
      } catch (e) {}

      // 9. Purge immédiate des faux locataires de test
      try {
        const tenStr = localStorage.getItem('locagestion:registered_tenants');
        if (tenStr) {
          const tenants = JSON.parse(tenStr);
          if (Array.isArray(tenants)) {
            const sanitizedTenants = tenants.filter((t: any) => {
              if (!t) return false;
              const name = (t.name || '').trim().toLowerCase();
              return !(
                name === 'koffi mensah' ||
                name === 'mamadou diallo' ||
                name === 'ibrahim traoré' ||
                name === 'ibrahim traore' ||
                name === 'aïcha touré' ||
                name === 'aicha toure' ||
                name === 'fatoumata traoré' ||
                name === 'fatoumata traore' ||
                name === 'amina diop'
              );
            });
            if (sanitizedTenants.length !== tenants.length) {
              localStorage.setItem('locagestion:registered_tenants', JSON.stringify(sanitizedTenants));
            }
          }
        }
      } catch (e) {}

      isSyncing = false;
      return {
        success: true,
        leasesCount: data.leases?.length || 0,
        notifsCount: data.notifications?.length || 0,
      };
    } catch (e) {
      console.error('Erreur SyncService.sync():', e);
      isSyncing = false;
      return { success: false, leasesCount: 0, notifsCount: 0 };
    }
  },

  /**
   * Synchronisation montante : pousse immédiatement toute modification
   * (nouveau bail, contresignature, notification, inscription, annonce, propriété, message, paiement) vers le serveur central.
   */
  async push(payload: {
    leases?: Lease[];
    notifications?: any[];
    user?: AuthUser;
    removedListingId?: string;
    listings?: RentalListing[];
    properties?: any[];
    conversations?: any[];
    payments?: any[];
    incidents?: any[];
  }): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return false;
      const data = await res.json();
      return Boolean(data?.success);
    } catch (e) {
      console.error('Erreur SyncService.push():', e);
      return false;
    }
  },

  /**
   * Initialise le moteur de synchronisation en tâche de fond (toutes les 4 secondes,
   * ainsi qu'au focus ou retour sur l'application mobile).
   */
  init() {
    if (typeof window === 'undefined' || isInitialized) return;
    isInitialized = true;

    // Premier sync immédiat
    this.sync();

    // Boucle de pulsation temps réel (4 secondes) pour une synchronisation instantanée Web <-> Mobile
    syncIntervalId = setInterval(() => {
      this.sync();
    }, 4000);

    // Sync immédiat dès que l'utilisateur revient sur l'application mobile ou change d'onglet
    const handleFocus = () => {
      this.sync();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        this.sync();
      }
    });
  },
};
