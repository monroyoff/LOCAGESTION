'use client';

import { Lease, isFakeLease } from './lease-service';
import { TenantNotification } from './tenant-notification-service';
import { AuthUser, RentalListing } from '@/lib/types';
import { isFakeDemoUser } from './auth-service';
import { isFakeListing } from './listings-service';

const LEASES_STORAGE_KEY = 'locagestion:leases:v1';
const TENANT_NOTIFS_KEY = 'locagestion:tenant_notifications:v1';
const LANDLORD_NOTIFS_KEY = 'locagestion:landlord_notifications:v1';
const USERS_STORAGE_KEY = 'locagestion:users:v1';
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

      let leasesUpdated = false;
      let notifsUpdated = false;

      // 1. Synchronisation des BAUX
      if (Array.isArray(data.leases)) {
        let localLeases: Lease[] = [];
        try {
          const stored = localStorage.getItem(LEASES_STORAGE_KEY);
          if (stored) localLeases = JSON.parse(stored);
        } catch (e) {}

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
        } catch (e) {}

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
          const stored = localStorage.getItem(USERS_STORAGE_KEY);
          if (stored) localUsers = JSON.parse(stored);
        } catch (e) {}

        let usersUpdated = false;
        // Purger les comptes démo locaux
        const sanitizedUsers = localUsers.filter((u) => !isFakeDemoUser(u));
        if (sanitizedUsers.length !== localUsers.length) {
          localUsers = sanitizedUsers;
          usersUpdated = true;
        }

        const userMap = new Map<string, AuthUser>();
        localUsers.forEach((u) => {
          if (u.email) userMap.set(u.email.toLowerCase(), u);
        });

        data.users.forEach((serverUser: AuthUser) => {
          if (!serverUser || !serverUser.email || isFakeDemoUser(serverUser)) return;
          const key = serverUser.email.toLowerCase();
          const local = userMap.get(key);
          if (!local) {
            userMap.set(key, serverUser);
            usersUpdated = true;
          } else if (local.matricule !== serverUser.matricule) {
            // Toujours aligner sur le matricule officiel serveur
            userMap.set(key, { ...local, matricule: serverUser.matricule });
            usersUpdated = true;
          }
        });

        if (usersUpdated) {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(Array.from(userMap.values())));
          window.dispatchEvent(new Event('locagestion:auth_changed'));
        }
      }

      // 4. Synchronisation des ANNONCES (Catalogues & Publications Web & Mobile)
      if (Array.isArray(data.listings)) {
        let localListings: RentalListing[] = [];
        try {
          const stored = localStorage.getItem(LISTINGS_STORAGE_KEY);
          if (stored) localListings = JSON.parse(stored);
        } catch (e) {}

        let listingsUpdated = false;
        // Purger les annonces démo locales
        const sanitizedListings = localListings.filter((l) => !isFakeListing(l));
        if (sanitizedListings.length !== localListings.length) {
          localListings = sanitizedListings;
          listingsUpdated = true;
        }

        const listingMap = new Map<string, RentalListing>();
        localListings.forEach((l) => {
          if (l && l.id && !isFakeListing(l)) listingMap.set(l.id, l);
        });

        data.listings.forEach((serverListing: RentalListing) => {
          if (!serverListing || !serverListing.id || isFakeListing(serverListing)) return;
          if (!listingMap.has(serverListing.id)) {
            listingMap.set(serverListing.id, serverListing);
            listingsUpdated = true;
          }
        });

        if (listingsUpdated) {
          const mergedListings = Array.from(listingMap.values());
          localStorage.setItem(LISTINGS_STORAGE_KEY, JSON.stringify(mergedListings));
          window.dispatchEvent(new CustomEvent('locagestion:listings_updated'));
          window.dispatchEvent(new Event('storage'));
        }
      }

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
   * (nouveau bail, contresignature, notification, inscription) vers le serveur central.
   */
  async push(payload: {
    leases?: Lease[];
    notifications?: any[];
    user?: AuthUser;
    removedListingId?: string;
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
