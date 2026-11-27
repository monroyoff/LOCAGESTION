'use client';

import { Lease, isFakeLease } from './lease-service';
import { TenantNotification } from './tenant-notification-service';
import { AuthUser, RentalListing, Property } from '@/lib/types';
import { isFakeDemoUser, enforceUserIdentityIntegrity, areEmailsEqual } from './auth-service';
import { isFakeListing } from './listings-service';
import { isFakeConversation, INITIAL_CONVERSATIONS } from './conversation-service';
import { isFakeProperty } from './property-service';
import { isFakePayment } from './payment-service';
import { isFakeNotice } from './notice-service';

const LEASES_STORAGE_KEY = 'locagestion:leases:v1';
const TENANT_NOTIFS_KEY = 'locagestion:tenant_notifications:v1';
const LANDLORD_NOTIFS_KEY = 'locagestion:landlord_notifications:v1';
const USERS_STORAGE_KEY = 'locagestion:auth:users:v1';
const SESSION_STORAGE_KEY = 'locagestion:auth:session:v1';
const LISTINGS_STORAGE_KEY = 'locagestion:custom_listings';
const TRASH_LISTINGS_KEY = 'locagestion:trash_listings';
const REMOVED_LISTINGS_KEY = 'locagestion:removed_listing_ids';

let syncIntervalId: NodeJS.Timeout | null = null;
let isSyncing = false;
let isInitialized = false;
let lastSyncCompletedAt = 0;
let lastPushedPayloadStr = '';

export const SyncService = {
  /**
   * Synchronisation bidirectionnelle universelle (Pull + Push) :
   * Harmonise en temps réel les baux, utilisateurs (anciens & nouveaux), annonces, propriétés,
   * conversations, paiements, quittances, préavis, relances, pannes, états des lieux et notifications
   * sur Web, Ordinateurs, Mobile et Application Android.
   */
  async sync(force: boolean = false): Promise<{ success: boolean; leasesCount: number; notifsCount: number }> {
    if (typeof window === 'undefined' || isSyncing) {
      return { success: false, leasesCount: 0, notifsCount: 0 };
    }
    const now = Date.now();
    if (!force && now - lastSyncCompletedAt < 4000) {
      return { success: true, leasesCount: 0, notifsCount: 0 };
    }

    isSyncing = true;
    try {
      const clientEtag = localStorage.getItem('locagestion:sync_etag') || '';
      const url = clientEtag ? `/api/sync?etag=${encodeURIComponent(clientEtag)}` : '/api/sync';

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
          ...(clientEtag ? { 'If-None-Match': clientEtag } : {}),
        },
        cache: 'no-store',
      });

      // ⚡ OPTIMISATION HTTP 304 : 0 octet transféré si non modifié
      if (res.status === 304) {
        lastSyncCompletedAt = Date.now();
        isSyncing = false;
        return { success: true, leasesCount: 0, notifsCount: 0 };
      }

      if (!res.ok) {
        isSyncing = false;
        return { success: false, leasesCount: 0, notifsCount: 0 };
      }

      const data = await res.json();
      if (!data || !data.success) {
        isSyncing = false;
        return { success: false, leasesCount: 0, notifsCount: 0 };
      }

      // ⚡ OPTIMISATION MAJEURE VERCEL : Si les données n'ont pas changé (ETag / NotModified)
      if (data.notModified) {
        lastSyncCompletedAt = Date.now();
        isSyncing = false;
        return { success: true, leasesCount: 0, notifsCount: 0 };
      }

      if (data.etag) {
        localStorage.setItem('locagestion:sync_etag', data.etag);
      }

      const pushPayload: Record<string, any> = {};
      let needsServerPush = false;

      if (data.adminPassword && typeof data.adminPassword === 'string') {
        try {
          localStorage.setItem('locagestion:admin_custom_password:v1', data.adminPassword.trim());
        } catch {}
      }

      // =======================================================================
      // 1. SYNCHRONISATION DES BAUX & CONTRATS
      // =======================================================================
      if (Array.isArray(data.leases)) {
        let localLeases: Lease[] = [];
        try {
          const stored = localStorage.getItem(LEASES_STORAGE_KEY);
          if (stored) localLeases = JSON.parse(stored);
        } catch {}

        const sanitizedLocal = (Array.isArray(localLeases) ? localLeases : []).filter((l) => !isFakeLease(l));
        const serverLeases: Lease[] = (data.leases || []).filter((l: any) => !isFakeLease(l));

        const leaseMap = new Map<string, Lease>();
        sanitizedLocal.forEach((l) => {
          if (l && l.id) leaseMap.set(l.id, l);
        });

        let leasesChangedLocally = sanitizedLocal.length !== localLeases.length;
        let leasesNeedPush = false;

        serverLeases.forEach((serverLease: Lease) => {
          if (!serverLease || !serverLease.id) return;
          const local = leaseMap.get(serverLease.id);
          if (!local) {
            leaseMap.set(serverLease.id, serverLease);
            leasesChangedLocally = true;
          } else {
            const signedByTenant = Boolean(local.signedByTenant || serverLease.signedByTenant);
            const signedByLandlord = Boolean(local.signedByLandlord || serverLease.signedByLandlord);
            const status =
              serverLease.status === 'resilie' || local.status === 'resilie'
                ? (serverLease.reactivatedAt || local.reactivatedAt) &&
                  (serverLease.status === 'actif' || local.status === 'actif')
                  ? 'actif'
                  : 'resilie'
                : signedByTenant || serverLease.status === 'actif' || local.status === 'actif'
                ? 'actif'
                : serverLease.status || local.status;

            const mergedLease: Lease = {
              ...local,
              ...serverLease,
              status,
              signedByTenant,
              signedByLandlord,
              tenantSignedAt: serverLease.tenantSignedAt || local.tenantSignedAt,
              tenantSignature: serverLease.tenantSignature || local.tenantSignature,
              landlordSignature: serverLease.landlordSignature || local.landlordSignature,
            };

            if (JSON.stringify(mergedLease) !== JSON.stringify(local)) {
              leaseMap.set(serverLease.id, mergedLease);
              leasesChangedLocally = true;
            }
            if (
              mergedLease.status !== serverLease.status ||
              mergedLease.signedByTenant !== serverLease.signedByTenant
            ) {
              leasesNeedPush = true;
            }
          }
        });

        const serverLeaseIds = new Set(serverLeases.map((l) => l.id));
        const mergedLeases = Array.from(leaseMap.values());
        if (mergedLeases.some((ml) => !serverLeaseIds.has(ml.id)) || leasesNeedPush) {
          pushPayload.leases = mergedLeases;
          needsServerPush = true;
        }

        const prevLeasesStr = localStorage.getItem(LEASES_STORAGE_KEY);
        const nextLeasesStr = JSON.stringify(mergedLeases);
        if (leasesChangedLocally && prevLeasesStr !== nextLeasesStr) {
          localStorage.setItem(LEASES_STORAGE_KEY, nextLeasesStr);
          window.dispatchEvent(new Event('locagestion:leases_updated'));
        }
      }

      // =======================================================================
      // 2. SYNCHRONISATION DES NOTIFICATIONS LOCATAIRE
      // =======================================================================
      if (Array.isArray(data.notifications)) {
        let localTenantNotifs: TenantNotification[] = [];
        try {
          const stored = localStorage.getItem(TENANT_NOTIFS_KEY);
          if (stored) localTenantNotifs = JSON.parse(stored);
        } catch {}

        const notifMap = new Map<string, TenantNotification>();
        (Array.isArray(localTenantNotifs) ? localTenantNotifs : []).forEach((n) => {
          if (n && n.id) notifMap.set(n.id, n);
        });

        let notifsUpdated = false;
        let notifsNeedPush = false;

        data.notifications.forEach((serverNotif: TenantNotification) => {
          if (!serverNotif || !serverNotif.id) return;
          const local = notifMap.get(serverNotif.id);
          if (!local) {
            notifMap.set(serverNotif.id, serverNotif);
            notifsUpdated = true;
          } else {
            const isRead = Boolean(local.read || serverNotif.read);
            if (local.read !== isRead) {
              notifMap.set(serverNotif.id, { ...local, ...serverNotif, read: isRead });
              notifsUpdated = true;
            }
            if (isRead && !serverNotif.read) {
              notifsNeedPush = true;
            }
          }
        });

        const serverNotifIds = new Set(data.notifications.map((sn: any) => sn?.id));
        const mergedNotifs = Array.from(notifMap.values());
        if (mergedNotifs.some((mn) => !serverNotifIds.has(mn.id)) || notifsNeedPush) {
          pushPayload.notifications = mergedNotifs;
          needsServerPush = true;
        }

        const prevNotifsStr = localStorage.getItem(TENANT_NOTIFS_KEY);
        const nextNotifsStr = JSON.stringify(mergedNotifs);
        if (notifsUpdated && prevNotifsStr !== nextNotifsStr) {
          localStorage.setItem(TENANT_NOTIFS_KEY, nextNotifsStr);
          window.dispatchEvent(new Event('locagestion:tenant_notifications_updated'));
          window.dispatchEvent(new Event('locagestion:tenant_notifs_updated'));
          window.dispatchEvent(new Event('locagestion:notifications_updated'));
        }
      }

      // =======================================================================
      // 3. SYNCHRONISATION DES UTILISATEURS (NOUVEAUX & ANCIENS COMPTES)
      // =======================================================================
      if (Array.isArray(data.users)) {
        let localUsers: AuthUser[] = [];
        try {
          const stored = localStorage.getItem(USERS_STORAGE_KEY) || localStorage.getItem('locagestion:users:v1');
          if (stored) localUsers = JSON.parse(stored);
        } catch {}

        const isNonAdminAuthenticUser = (u: any) =>
          u &&
          u.email &&
          !isFakeDemoUser(u) &&
          u.role !== 'admin' &&
          u.id !== 'usr-admin-locagestion' &&
          !areEmailsEqual(u.email, 'admin@locagestion.site');

        const sanitizedLocalUsers = (Array.isArray(localUsers) ? localUsers : []).filter(isNonAdminAuthenticUser);
        const serverUsers: AuthUser[] = (data.users || []).filter(isNonAdminAuthenticUser);

        const userMap = new Map<string, AuthUser>();
        let usersNeedPush = false;

        // Déposer d'abord les utilisateurs locaux
        sanitizedLocalUsers.forEach((u) => {
          userMap.set(u.email.trim().toLowerCase(), enforceUserIdentityIntegrity(u));
        });

        // Fusionner avec les utilisateurs serveur
        serverUsers.forEach((su: AuthUser) => {
          const key = su.email.trim().toLowerCase();
          const local = userMap.get(key);
          if (!local) {
            userMap.set(key, enforceUserIdentityIntegrity(su));
          } else {
            const isVerified = Boolean(local.emailVerified || su.emailVerified);
            const mergedUser = enforceUserIdentityIntegrity({
              ...local,
              ...su,
              emailVerified: isVerified,
              companyName: su.companyName !== undefined ? su.companyName : local.companyName,
              avatarUrl: su.avatarUrl || local.avatarUrl,
              password: su.password || local.password,
              matricule: su.matricule || local.matricule,
              accountStatus: su.accountStatus || local.accountStatus,
              blockReason: su.blockReason !== undefined ? su.blockReason : local.blockReason,
            });
            userMap.set(key, mergedUser);
            if (isVerified && !su.emailVerified) {
              usersNeedPush = true;
            }
          }
        });

        const serverUserEmails = new Set(
          serverUsers.map((su) => (su?.email || '').trim().toLowerCase()).filter(Boolean)
        );
        const finalUsers = Array.from(userMap.values());

        if (
          finalUsers.some((fu) => fu.email && !serverUserEmails.has(fu.email.trim().toLowerCase())) ||
          usersNeedPush
        ) {
          pushPayload.users = finalUsers;
          needsServerPush = true;
        }

        const prevStored = localStorage.getItem(USERS_STORAGE_KEY);
        const nextStored = JSON.stringify(finalUsers);
        if (prevStored !== nextStored) {
          localStorage.setItem(USERS_STORAGE_KEY, nextStored);
          localStorage.removeItem('locagestion:users:v1');
          window.dispatchEvent(new Event('locagestion:users_updated'));
          window.dispatchEvent(new Event('locagestion:auth_changed'));
        }

        // Synchroniser également la session active uniquement si un attribut significatif a changé
        try {
          const sessionRaw = localStorage.getItem(SESSION_STORAGE_KEY);
          if (sessionRaw) {
            const parsedSession = JSON.parse(sessionRaw);
            if (parsedSession && isFakeDemoUser(parsedSession)) {
              localStorage.removeItem(SESSION_STORAGE_KEY);
              localStorage.removeItem('locagestion:active_space');
              window.dispatchEvent(new Event('locagestion:auth_changed'));
            } else if (parsedSession && parsedSession.email && parsedSession.role !== 'admin') {
              const matchedServerUser = userMap.get(parsedSession.email.trim().toLowerCase());
              if (matchedServerUser) {
                const nextVerified = Boolean(parsedSession.emailVerified || matchedServerUser.emailVerified);
                const nextStatus = matchedServerUser.accountStatus || parsedSession.accountStatus;
                const nextCompany =
                  matchedServerUser.companyName !== undefined
                    ? matchedServerUser.companyName
                    : parsedSession.companyName;
                const nextAvatar = matchedServerUser.avatarUrl || parsedSession.avatarUrl;
                const nextMatricule = matchedServerUser.matricule || parsedSession.matricule;

                const hasSessionMeaningfulChange =
                  parsedSession.emailVerified !== nextVerified ||
                  parsedSession.accountStatus !== nextStatus ||
                  parsedSession.companyName !== nextCompany ||
                  parsedSession.avatarUrl !== nextAvatar ||
                  parsedSession.matricule !== nextMatricule;

                if (hasSessionMeaningfulChange) {
                  const updatedSession = {
                    ...parsedSession,
                    emailVerified: nextVerified,
                    accountStatus: nextStatus,
                    blockReason: matchedServerUser.blockReason,
                    companyName: nextCompany,
                    avatarUrl: nextAvatar,
                    matricule: nextMatricule,
                  };
                  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updatedSession));
                  window.dispatchEvent(new Event('locagestion:auth_changed'));
                }
              }
            }
          }
        } catch {}
      }

      // =======================================================================
      // 4. SYNCHRONISATION DES ANNONCES & CORBEILLE
      // =======================================================================
      if (Array.isArray(data.listings)) {
        let localRemovedIds: string[] = [];
        try {
          const rawRem = localStorage.getItem(REMOVED_LISTINGS_KEY);
          if (rawRem) localRemovedIds = JSON.parse(rawRem);
        } catch {}

        let localTrash: any[] = [];
        try {
          const rawTrash = localStorage.getItem(TRASH_LISTINGS_KEY);
          if (rawTrash) localTrash = JSON.parse(rawTrash);
        } catch {}

        const serverRemovedIds: string[] = Array.isArray(data.removedListingIds) ? data.removedListingIds : [];
        const serverTrash: any[] = Array.isArray(data.trashListings) ? data.trashListings : [];

        const trashMap = new Map<string, any>();
        (Array.isArray(localTrash) ? localTrash : []).forEach((t) => {
          if (t && t.id && !isFakeListing(t)) trashMap.set(t.id, t);
        });
        serverTrash.forEach((t) => {
          if (t && t.id && !isFakeListing(t)) trashMap.set(t.id, { ...(trashMap.get(t.id) || {}), ...t });
        });
        const mergedTrash = Array.from(trashMap.values());
        localStorage.setItem(TRASH_LISTINGS_KEY, JSON.stringify(mergedTrash));

        const removedSet = new Set<string>([
          ...(Array.isArray(localRemovedIds) ? localRemovedIds : []),
          ...serverRemovedIds,
          ...mergedTrash.map((t) => String(t.id)),
        ]);
        const mergedRemovedIds = Array.from(removedSet).filter(Boolean);
        localStorage.setItem(REMOVED_LISTINGS_KEY, JSON.stringify(mergedRemovedIds));

        let localListings: RentalListing[] = [];
        try {
          const stored = localStorage.getItem(LISTINGS_STORAGE_KEY);
          if (stored) localListings = JSON.parse(stored);
        } catch {}

        const sanitizedLocal = (Array.isArray(localListings) ? localListings : []).filter(
          (l) => !isFakeListing(l) && !removedSet.has(l.id)
        );
        const sanitizedServer = (data.listings || []).filter(
          (l: any) => !isFakeListing(l) && !removedSet.has(l.id)
        );

        const listingMap = new Map<string, RentalListing>();
        sanitizedLocal.forEach((l) => {
          if (l && l.id) listingMap.set(l.id, l);
        });
        sanitizedServer.forEach((l: any) => {
          if (l && l.id) {
            const existing = listingMap.get(l.id);
            listingMap.set(l.id, existing ? { ...existing, ...l } : l);
          }
        });

        const mergedListings = Array.from(listingMap.values());
        const unpushed = sanitizedLocal.filter((loc) => !sanitizedServer.some((sl: any) => sl.id === loc.id));
        const unpushedTrash = mergedTrash.filter((mt) => !serverTrash.some((st: any) => st.id === mt.id));
        if (unpushed.length > 0 || unpushedTrash.length > 0) {
          pushPayload.listings = mergedListings;
          pushPayload.trashListings = mergedTrash;
          pushPayload.removedListingIds = mergedRemovedIds;
          needsServerPush = true;
        }

        const prevListingsStr = localStorage.getItem(LISTINGS_STORAGE_KEY);
        const nextListingsStr = JSON.stringify(mergedListings);
        if (prevListingsStr !== nextListingsStr) {
          localStorage.setItem(LISTINGS_STORAGE_KEY, nextListingsStr);
          window.dispatchEvent(new CustomEvent('locagestion:listings_updated'));
        }
      }

      // =======================================================================
      // 5. SYNCHRONISATION DES PROPRIÉTÉS & PATRIMOINE
      // =======================================================================
      if (Array.isArray(data.properties)) {
        let localProps: Property[] = [];
        try {
          const stored = localStorage.getItem('locagestion:properties:v1');
          if (stored) localProps = JSON.parse(stored);
        } catch {}

        const propMap = new Map<string, any>();
        (Array.isArray(localProps) ? localProps : []).forEach((p) => {
          if (p && p.id && !isFakeProperty(p)) propMap.set(p.id, p);
        });
        const serverProps = (data.properties || []).filter((p: any) => p && p.id && !isFakeProperty(p));
        serverProps.forEach((p: any) => {
          const existing = propMap.get(p.id);
          propMap.set(p.id, existing ? { ...existing, ...p } : p);
        });

        const mergedProps = Array.from(propMap.values());
        const serverPropIds = new Set(serverProps.map((sp: any) => sp.id));
        if (mergedProps.some((mp) => !serverPropIds.has(mp.id))) {
          pushPayload.properties = mergedProps;
          needsServerPush = true;
        }

        const prevPropsStr = localStorage.getItem('locagestion:properties:v1');
        const nextPropsStr = JSON.stringify(mergedProps);
        if (prevPropsStr !== nextPropsStr) {
          localStorage.setItem('locagestion:properties:v1', nextPropsStr);
          window.dispatchEvent(new CustomEvent('locagestion:properties_updated'));
        }
      }

      // =======================================================================
      // 6. SYNCHRONISATION DES CONVERSATIONS & MESSAGES
      // =======================================================================
      if (Array.isArray(data.conversations)) {
        let localConvs: any[] = [];
        try {
          const stored = localStorage.getItem('locagestion:conversations:v1');
          if (stored) localConvs = JSON.parse(stored);
        } catch {}

        const convMap = new Map<string, any>();
        if (INITIAL_CONVERSATIONS && Array.isArray(INITIAL_CONVERSATIONS)) {
          INITIAL_CONVERSATIONS.forEach((ic) => convMap.set(ic.id, ic));
        }
        (Array.isArray(localConvs) ? localConvs : []).forEach((c) => {
          if (c && c.id && !isFakeConversation(c)) convMap.set(c.id, c);
        });
        (data.conversations || []).forEach((sc: any) => {
          if (sc && sc.id && !isFakeConversation(sc)) {
            const local = convMap.get(sc.id);
            if (!local) {
              convMap.set(sc.id, sc);
            } else {
              const msgMap = new Map<string, any>();
              (local.messages || []).forEach((m: any) => msgMap.set(m.id || `${m.time}-${m.text}`, m));
              (sc.messages || []).forEach((m: any) => msgMap.set(m.id || `${m.time}-${m.text}`, m));
              const allMessages = Array.from(msgMap.values());
              const lastMsg = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;
              const scIsNewer = (sc.messages?.length || 0) > (local.messages?.length || 0);
              const locIsNewer = (local.messages?.length || 0) > (sc.messages?.length || 0);
              const unreadSource = scIsNewer ? sc : locIsNewer ? local : local;
              convMap.set(sc.id, {
                ...local,
                ...sc,
                unreadCount: unreadSource.unreadCount ?? 0,
                hasUnread: Boolean(unreadSource.hasUnread),
                unreadBy: unreadSource.unreadBy,
                isRead: unreadSource.isRead ?? !unreadSource.hasUnread,
                messages: allMessages,
                lastMessage: lastMsg ? lastMsg.text : sc.lastMessage || local.lastMessage,
                lastMessageTime: lastMsg ? lastMsg.time || sc.lastMessageTime : sc.lastMessageTime || local.lastMessageTime,
              });
            }
          }
        });

        const mergedConvs = Array.from(convMap.values()).filter((c) => !isFakeConversation(c));
        const prevConvsStr = localStorage.getItem('locagestion:conversations:v1');
        const nextConvsStr = JSON.stringify(mergedConvs);
        if (prevConvsStr !== nextConvsStr) {
          localStorage.setItem('locagestion:conversations:v1', nextConvsStr);
          window.dispatchEvent(new CustomEvent('locagestion:conversations_updated'));
        }

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
          pushPayload.conversations = mergedConvs;
          needsServerPush = true;
        }
      }

      // =======================================================================
      // 7. SYNCHRONISATION DES PAIEMENTS DÉCLARÉS & QUITTANCES VÉRIFIÉES
      // =======================================================================
      if (Array.isArray(data.payments) || Array.isArray(data.verifiedPayments)) {
        let localPayments: any[] = [];
        let localVerified: any[] = [];
        try {
          const storedDec = localStorage.getItem('locagestion:declared_payments');
          if (storedDec) localPayments = JSON.parse(storedDec);
          const storedVer = localStorage.getItem('locagestion:verified_payments');
          if (storedVer) localVerified = JSON.parse(storedVer);
        } catch {}

        const payMap = new Map<string, any>();
        const ingestPayment = (p: any) => {
          if (!p || !p.id || isFakePayment(p)) return;
          const existing = payMap.get(p.id);
          if (!existing) {
            payMap.set(p.id, p);
          } else {
            const isVerified = Boolean(existing.isVerified || p.isVerified);
            payMap.set(p.id, {
              ...existing,
              ...p,
              isVerified,
              status: isVerified ? 'paye' : p.status || existing.status,
              receiptNumber:
                isVerified && existing.receiptNumber?.startsWith('QUITT-')
                  ? existing.receiptNumber
                  : p.receiptNumber || existing.receiptNumber,
            });
          }
        };

        (Array.isArray(localPayments) ? localPayments : []).forEach(ingestPayment);
        (Array.isArray(localVerified) ? localVerified : []).forEach((p) =>
          ingestPayment({ ...p, isVerified: true, status: 'paye' })
        );
        (data.payments || []).forEach(ingestPayment);
        (data.verifiedPayments || []).forEach((p: any) =>
          ingestPayment({ ...p, isVerified: true, status: 'paye' })
        );

        const mergedPayments = Array.from(payMap.values());
        const mergedVerified = mergedPayments.filter((p) => p.isVerified || p.status === 'paye');

        const prevDecStr = localStorage.getItem('locagestion:declared_payments');
        const nextDecStr = JSON.stringify(mergedPayments);
        const prevVerStr = localStorage.getItem('locagestion:verified_payments');
        const nextVerStr = JSON.stringify(mergedVerified);

        if (prevDecStr !== nextDecStr || prevVerStr !== nextVerStr) {
          localStorage.setItem('locagestion:declared_payments', nextDecStr);
          localStorage.setItem('locagestion:verified_payments', nextVerStr);
          window.dispatchEvent(new CustomEvent('locagestion:payments_updated'));
        }

        const serverPayIds = new Set((data.payments || []).map((sp: any) => sp.id));
        const serverVerIds = new Set((data.verifiedPayments || []).map((sp: any) => sp.id));
        if (
          mergedPayments.some((mp: any) => !serverPayIds.has(mp.id)) ||
          mergedVerified.some((mv: any) => !serverVerIds.has(mv.id))
        ) {
          pushPayload.payments = mergedPayments;
          pushPayload.verifiedPayments = mergedVerified;
          needsServerPush = true;
        }
      }

      // =======================================================================
      // 8. SYNCHRONISATION DES NOTIFICATIONS BAILLEUR / DÉMARCHEUR
      // =======================================================================
      if (Array.isArray(data.landlordNotifications)) {
        let localLNotifs: any[] = [];
        try {
          const stored = localStorage.getItem(LANDLORD_NOTIFS_KEY);
          if (stored) localLNotifs = JSON.parse(stored);
        } catch {}

        const lnMap = new Map<string, any>();
        (Array.isArray(localLNotifs) ? localLNotifs : []).forEach((n) => {
          if (n && n.id) lnMap.set(n.id, n);
        });
        let lnNeedPush = false;
        (data.landlordNotifications || []).forEach((sn: any) => {
          if (sn && sn.id) {
            const local = lnMap.get(sn.id);
            const isRead = Boolean(local?.read || sn.read);
            lnMap.set(sn.id, local ? { ...local, ...sn, read: isRead } : sn);
            if (local?.read && !sn.read) {
              lnNeedPush = true;
            }
          }
        });

        const mergedLNotifs = Array.from(lnMap.values());
        const prevLnStr = localStorage.getItem(LANDLORD_NOTIFS_KEY);
        const nextLnStr = JSON.stringify(mergedLNotifs);
        if (prevLnStr !== nextLnStr) {
          localStorage.setItem(LANDLORD_NOTIFS_KEY, nextLnStr);
          window.dispatchEvent(new CustomEvent('locagestion:notifications_updated'));
        }

        const serverLnIds = new Set((data.landlordNotifications || []).map((sn: any) => sn.id));
        if (mergedLNotifs.some((mn: any) => !serverLnIds.has(mn.id)) || lnNeedPush) {
          pushPayload.landlordNotifications = mergedLNotifs;
          needsServerPush = true;
        }
      }

      // =======================================================================
      // 9. SYNCHRONISATION DES PRÉAVIS (DÉPARTS LOCATAIRES & CONGÉS BAILLEURS)
      // =======================================================================
      if (Array.isArray(data.notices)) {
        let localNotices: any[] = [];
        try {
          const stored = localStorage.getItem('locagestion:notices:v2');
          if (stored) localNotices = JSON.parse(stored);
        } catch {}

        const nMap = new Map<string, any>();
        (Array.isArray(localNotices) ? localNotices : []).forEach((n) => {
          if (n && n.id && !isFakeNotice(n)) nMap.set(n.id, n);
        });
        let noticesNeedPush = false;
        (data.notices || []).forEach((sn: any) => {
          if (sn && sn.id && !isFakeNotice(sn)) {
            const local = nMap.get(sn.id);
            if (!local) {
              nMap.set(sn.id, sn);
            } else {
              const isConfirmed =
                local.status === 'confirme' ||
                sn.status === 'confirme' ||
                Boolean(local.landlordConfirmedAt || sn.landlordConfirmedAt);
              const mergedN = {
                ...local,
                ...sn,
                status: isConfirmed ? 'confirme' : sn.status || local.status,
                landlordConfirmedAt: sn.landlordConfirmedAt || local.landlordConfirmedAt,
                landlordReplyMessage: sn.landlordReplyMessage || local.landlordReplyMessage,
                landlordReplyDate: sn.landlordReplyDate || local.landlordReplyDate,
              };
              nMap.set(sn.id, mergedN);
              if (
                mergedN.status !== sn.status ||
                mergedN.landlordConfirmedAt !== sn.landlordConfirmedAt ||
                mergedN.landlordReplyMessage !== sn.landlordReplyMessage
              ) {
                noticesNeedPush = true;
              }
            }
          }
        });

        const mergedNotices = Array.from(nMap.values());
        const prevNStr = localStorage.getItem('locagestion:notices:v2');
        const nextNStr = JSON.stringify(mergedNotices);
        if (prevNStr !== nextNStr) {
          localStorage.setItem('locagestion:notices:v2', nextNStr);
          window.dispatchEvent(new CustomEvent('locagestion:notices_updated'));
        }

        const serverNIds = new Set((data.notices || []).map((sn: any) => sn.id));
        if (mergedNotices.some((mn: any) => !serverNIds.has(mn.id)) || noticesNeedPush) {
          pushPayload.notices = mergedNotices;
          needsServerPush = true;
        }
      }

      // =======================================================================
      // 10. SYNCHRONISATION DES PANNES & INTERVENTIONS
      // =======================================================================
      if (Array.isArray(data.incidents)) {
        let localIncidents: any[] = [];
        try {
          const stored = localStorage.getItem('locagestion:incidents:v1');
          if (stored) localIncidents = JSON.parse(stored);
        } catch {}

        const incMap = new Map<string, any>();
        (Array.isArray(localIncidents) ? localIncidents : []).forEach((i) => {
          if (i && i.id) incMap.set(i.id, i);
        });
        let incNeedPush = false;
        (data.incidents || []).forEach((si: any) => {
          if (si && si.id) {
            const local = incMap.get(si.id);
            if (!local) {
              incMap.set(si.id, si);
            } else {
              const mergedInc = { ...local, ...si };
              incMap.set(si.id, mergedInc);
              if (local.status !== si.status || local.artisanFee !== si.artisanFee) {
                incNeedPush = true;
              }
            }
          }
        });

        const mergedIncidents = Array.from(incMap.values());
        const prevIncStr = localStorage.getItem('locagestion:incidents:v1');
        const nextIncStr = JSON.stringify(mergedIncidents);
        if (prevIncStr !== nextIncStr) {
          localStorage.setItem('locagestion:incidents:v1', nextIncStr);
          window.dispatchEvent(new CustomEvent('locagestion:incidents_updated'));
        }

        const serverIncIds = new Set((data.incidents || []).map((si: any) => si.id));
        if (mergedIncidents.some((mi: any) => !serverIncIds.has(mi.id)) || incNeedPush) {
          pushPayload.incidents = mergedIncidents;
          needsServerPush = true;
        }
      }

      // =======================================================================
      // 11. SYNCHRONISATION DES ÉTATS DES LIEUX (INSPECTIONS)
      // =======================================================================
      if (data.inspections && typeof data.inspections === 'object') {
        let localInspections: Record<string, any> = {};
        try {
          const stored = localStorage.getItem('locagestion:inspections');
          if (stored) localInspections = JSON.parse(stored);
        } catch {}

        const mergedInspections: Record<string, any> = {
          ...(localInspections || {}),
        };
        let inspectionsChanged = false;
        let inspectionsNeedPush = false;

        Object.entries(data.inspections).forEach(([leaseId, serverInsp]) => {
          if (!leaseId || !serverInsp) return;
          const localInsp = mergedInspections[leaseId];
          if (!localInsp) {
            mergedInspections[leaseId] = serverInsp;
            inspectionsChanged = true;
          } else {
            const combined = { ...localInsp, ...(serverInsp as object) };
            if (JSON.stringify(combined) !== JSON.stringify(localInsp)) {
              mergedInspections[leaseId] = combined;
              inspectionsChanged = true;
            }
          }
        });

        const serverLeaseKeys = new Set(Object.keys(data.inspections));
        if (Object.keys(mergedInspections).some((k) => !serverLeaseKeys.has(k))) {
          inspectionsNeedPush = true;
        }

        if (inspectionsChanged) {
          localStorage.setItem('locagestion:inspections', JSON.stringify(mergedInspections));
          window.dispatchEvent(new CustomEvent('locagestion:inspections_updated'));
        }
        if (inspectionsNeedPush) {
          pushPayload.inspections = mergedInspections;
          needsServerPush = true;
        }
      }

      // =======================================================================
      // 12. SYNCHRONISATION DES LOCATAIRES INVITÉS & ALERTES SÉCURITÉ
      // =======================================================================
      if (Array.isArray(data.registeredTenants)) {
        let localTenants: any[] = [];
        try {
          const tenStr = localStorage.getItem('locagestion:registered_tenants');
          if (tenStr) localTenants = JSON.parse(tenStr);
        } catch {}

        const isFakeTenant = (t: any) => {
          if (!t) return true;
          const name = (t.name || '').trim().toLowerCase();
          return (
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
        };

        const tenMap = new Map<string, any>();
        (Array.isArray(localTenants) ? localTenants : [])
          .filter((t) => !isFakeTenant(t))
          .forEach((t) => {
            const key = t.email ? t.email.toLowerCase() : t.id;
            if (key) tenMap.set(key, t);
          });
        (data.registeredTenants || [])
          .filter((t: any) => !isFakeTenant(t))
          .forEach((t: any) => {
            const key = t.email ? t.email.toLowerCase() : t.id;
            if (key) tenMap.set(key, { ...(tenMap.get(key) || {}), ...t });
          });

        const mergedTenants = Array.from(tenMap.values());
        localStorage.setItem('locagestion:registered_tenants', JSON.stringify(mergedTenants));

        const serverTenKeys = new Set(
          (data.registeredTenants || []).map((t: any) => (t?.email ? t.email.toLowerCase() : t?.id))
        );
        if (mergedTenants.some((mt) => !serverTenKeys.has(mt.email ? mt.email.toLowerCase() : mt.id))) {
          pushPayload.registeredTenants = mergedTenants;
          needsServerPush = true;
        }
      }

      if (Array.isArray(data.securityAlerts)) {
        let localAlerts: any[] = [];
        try {
          const alStr = localStorage.getItem('locagestion:security_alerts:v1');
          if (alStr) localAlerts = JSON.parse(alStr);
        } catch {}

        const alertMap = new Map<string, any>();
        (Array.isArray(localAlerts) ? localAlerts : []).forEach((a) => {
          if (a && a.id) alertMap.set(a.id, a);
        });
        (data.securityAlerts || []).forEach((sa: any) => {
          if (sa && sa.id) alertMap.set(sa.id, { ...(alertMap.get(sa.id) || {}), ...sa });
        });
        const mergedAlerts = Array.from(alertMap.values());
        const prevAlStr = localStorage.getItem('locagestion:security_alerts:v1');
        const nextAlStr = JSON.stringify(mergedAlerts);
        if (prevAlStr !== nextAlStr) {
          localStorage.setItem('locagestion:security_alerts:v1', nextAlStr);
          window.dispatchEvent(new Event('locagestion:security_alerts_updated'));
        }
        const serverAlertIds = new Set((data.securityAlerts || []).map((sa: any) => sa.id));
        if (mergedAlerts.some((ma) => !serverAlertIds.has(ma.id))) {
          pushPayload.securityAlerts = mergedAlerts;
          needsServerPush = true;
        }
      }

      // =======================================================================
      // 13. ENVOI CONSOLIDÉ DES DELTAS LOCAUX VERS LE SERVEUR CENTRAL
      // =======================================================================
      if (needsServerPush && Object.keys(pushPayload).length > 0) {
        const payloadStr = JSON.stringify(pushPayload);
        // Évite la boucle de push infinie si le payload local n'a pas bougé
        if (payloadStr !== lastPushedPayloadStr) {
          lastPushedPayloadStr = payloadStr;
          fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payloadStr,
          })
            .then(() => {
              // Invalider l'ETag local pour que la prochaine synchro prenne en compte le nouvel état
              try {
                localStorage.removeItem('locagestion:sync_etag');
              } catch {}
            })
            .catch(() => {});
        }
      }

      lastSyncCompletedAt = Date.now();
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
   * Synchronisation montante immédiate vers le serveur central.
   */
  async push(payload: {
    leases?: Lease[];
    notifications?: any[];
    landlordNotifications?: any[];
    notices?: any[];
    user?: AuthUser;
    users?: AuthUser[];
    removedListingId?: string;
    removedListingIds?: string[];
    restoredListingId?: string;
    listings?: RentalListing[];
    trashListings?: any[];
    properties?: any[];
    conversations?: any[];
    payments?: any[];
    verifiedPayments?: any[];
    incidents?: any[];
    inspections?: Record<string, any>;
    registeredTenants?: any[];
    securityAlerts?: any[];
    adminPassword?: string;
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
      if (data?.success) {
        try {
          localStorage.removeItem('locagestion:sync_etag');
        } catch {}
      }
      return Boolean(data?.success);
    } catch (e) {
      console.error('Erreur SyncService.push():', e);
      return false;
    }
  },

  /**
   * Initialise le moteur de synchronisation intelligent Web <-> Mobile <-> Android :
   * - 1 sync immédiat au montage
   * - Cycle régulier de 45 secondes uniquement quand l'onglet est visible
   * - Arrêt complet de la boucle en arrière-plan (économise 99% du quota Vercel)
   * - Réactivation et synchronisation instantanée au focus, retour réseau ou réouverture
   */
  init() {
    if (typeof window === 'undefined' || isInitialized) return;
    isInitialized = true;

    // Premier sync immédiat
    this.sync();

    const SYNC_INTERVAL_ACTIVE = 45000;

    const startInterval = () => {
      if (syncIntervalId) clearInterval(syncIntervalId);
      syncIntervalId = setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          this.sync();
        }
      }, SYNC_INTERVAL_ACTIVE);
    };

    const stopInterval = () => {
      if (syncIntervalId) {
        clearInterval(syncIntervalId);
        syncIntervalId = null;
      }
    };

    startInterval();

    const handleActiveSync = () => {
      this.sync();
      startInterval();
    };

    window.addEventListener('focus', handleActiveSync);
    window.addEventListener('online', handleActiveSync);
    window.addEventListener('pageshow', handleActiveSync);

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        handleActiveSync();
      } else {
        stopInterval();
      }
    });
  },
};
