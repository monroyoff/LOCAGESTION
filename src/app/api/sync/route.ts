import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import {
  readJsonFile,
  writeJsonFile,
  readJsonObject,
  writeJsonObject,
} from '@/lib/server/server-store';

const LEASES_FILE = 'leases.json';
const NOTIFS_FILE = 'notifications.json';
const LANDLORD_NOTIFS_FILE = 'landlord_notifications.json';
const NOTICES_FILE = 'notices.json';
const INCIDENTS_FILE = 'incidents.json';
const USERS_FILE = 'users.json';
const LISTINGS_FILE = 'listings.json';
const TRASH_LISTINGS_FILE = 'trash_listings.json';
const REMOVED_LISTING_IDS_FILE = 'removed_listing_ids.json';
const PROPERTIES_FILE = 'properties.json';
const CONVERSATIONS_FILE = 'conversations.json';
const PAYMENTS_FILE = 'payments.json';
const VERIFIED_PAYMENTS_FILE = 'verified_payments.json';
const INSPECTIONS_FILE = 'inspections.json';
const REGISTERED_TENANTS_FILE = 'registered_tenants.json';
const SECURITY_ALERTS_FILE = 'security_alerts.json';

function isFakeServerLease(l: any): boolean {
  if (!l || !l.id) return true;
  if (l.id === 'BAIL-2026-MAG-102' || l.id === 'BAIL-2026-COM-205') {
    return true;
  }
  const lName = (l.landlordName || '').trim().toLowerCase();
  const lEmail = (l.landlordEmail || '').trim().toLowerCase();
  if (
    lName === 'mamadou diallo' ||
    lName === 'aïcha touré' ||
    lName === 'aicha toure' ||
    lName === 'koffi mensah' ||
    lEmail.includes('mamadou.diallo') ||
    lEmail.includes('aicha.toure') ||
    lEmail.includes('diallo-patrimoine') ||
    lEmail.includes('diallo')
  ) {
    return true;
  }
  return false;
}

function isFakeServerUser(u: any): boolean {
  if (!u) return true;
  const id = String(u.id || '').trim();
  if (
    id === 'usr-bailleur-01' ||
    id === 'usr-locataire-01' ||
    id === 'usr-demarcheur-01' ||
    id === 'usr-tenant-koffi' ||
    id === 'usr-tenant-aicha' ||
    id === 'usr-agence-atlantique' ||
    id === 'usr-demarcheur-cotonou' ||
    id === 'usr-demarcheur-abidjan' ||
    id === 'usr-demarcheur-dakar' ||
    id === 'usr-demarcheur-lome' ||
    id === 'usr-vivi-immo'
  )
    return true;
  const name = (u.name || '').trim().toLowerCase();
  if (
    name === 'mamadou diallo' ||
    name === 'koffi mensah' ||
    name === 'ibrahim traoré' ||
    name === 'ibrahim traore' ||
    name === 'aïcha touré' ||
    name === 'aicha toure' ||
    name === 'clarisse bakayoko' ||
    name === 'amina diop' ||
    name === 'fatoumata traoré' ||
    name === 'fatoumata traore' ||
    name === 'cabinet immobilier atlantique' ||
    name === 'agence immobilière bénin littoral' ||
    name === 'agence immobiliere benin littoral' ||
    name === 'agence ivoire logement' ||
    name === 'agence teranga immobilier' ||
    name === 'cabinet immobilier lomé express' ||
    name === 'cabinet immobilier lome express'
  )
    return true;
  const email = (u.email || '').trim().toLowerCase();
  if (
    email.includes('koffi.mensah') ||
    email.includes('aicha.toure') ||
    email.includes('mamadou.diallo') ||
    email.includes('diallo-patrimoine') ||
    email.includes('fintech-africa') ||
    email.includes('atlantiqueprestige.bj') ||
    email.includes('littoralimmo.bj') ||
    email.includes('ivoirelogis.ci') ||
    email.includes('terangaimmo.sn') ||
    email.includes('lome-immo.tg') ||
    email === 'viviimmo.bj@gmail.com'
  )
    return true;
  return false;
}

function isFakeServerProperty(p: any): boolean {
  if (!p || !p.id) return true;
  if (p.id === 'prop-diallo-cotonou-01') return true;
  const authorName = (p.authorName || '').trim().toLowerCase();
  const authorEmail = (p.authorEmail || '').trim().toLowerCase();
  if (authorName === 'mamadou diallo' || authorName === 'koffi mensah') return true;
  if (authorEmail.includes('mamadou.diallo') || authorEmail.includes('diallo')) return true;
  return false;
}

function isFakeServerListing(l: any): boolean {
  if (!l || !l.id) return true;
  const authorEmail = (l.authorEmail || '').trim().toLowerCase();
  const authorId = (l.authorId || '').trim();
  if (
    authorEmail === 'jobovog@gmail.com' ||
    authorEmail === 'jojovog007@gmail.com' ||
    authorEmail === 'theodoradjigla@gmail.com' ||
    authorEmail === 'vividpari@gmail.com' ||
    authorEmail === 'viviimmo.bj@gmail.com' ||
    authorId === 'usr-bailleur-voglossou' ||
    authorId === 'usr-tenant-jojovog' ||
    authorId === 'usr-tenant-theodora' ||
    authorId === 'usr-demarcheur-mwr2q8mb' ||
    authorId === 'usr-vivi-immo'
  ) {
    return false;
  }

  const id = String(l.id).trim();
  if (
    id === 'list-bj-uac-calavi' ||
    id === 'list-bj-haie-vive' ||
    id === 'list-bj-fidjrosse' ||
    id === 'list-bj-akpakpa' ||
    id === 'list-ci-cocody' ||
    id === 'list-sn-almadies' ||
    id === 'list-tg-lome' ||
    id.startsWith('pub-bailleur-') ||
    id.startsWith('pub-demarcheur-') ||
    id.startsWith('pub-locataire-') ||
    id === 'pub-1' ||
    id === 'pub-2' ||
    id === 'pub-3' ||
    id === 'pub-4' ||
    id.startsWith('demo-') ||
    id.startsWith('test-') ||
    id.startsWith('fictif-')
  ) {
    return true;
  }

  if (
    l.authorId === 'usr-bailleur-01' ||
    l.authorId === 'usr-demarcheur-01' ||
    l.authorId === 'usr-locataire-01' ||
    l.authorId === 'usr-agence-atlantique' ||
    l.authorId === 'usr-demarcheur-cotonou' ||
    l.authorId === 'usr-demarcheur-abidjan' ||
    l.authorId === 'usr-demarcheur-dakar' ||
    l.authorId === 'usr-demarcheur-lome'
  ) {
    return true;
  }

  const authorName = (l.authorName || '').trim().toLowerCase();
  if (
    authorName === 'ibrahim traoré' ||
    authorName === 'ibrahim traore' ||
    authorName === 'cabinet immobilier atlantique' ||
    authorName === 'agence immobilière bénin littoral' ||
    authorName === 'agence immobiliere benin littoral' ||
    authorName === 'agence ivoire logement' ||
    authorName === 'agence teranga immobilier' ||
    authorName === 'cabinet immobilier lomé express' ||
    authorName === 'cabinet immobilier lome express' ||
    authorName === 'mamadou diallo' ||
    authorName === 'koffi mensah' ||
    authorName === 'aïcha touré' ||
    authorName === 'aicha toure'
  ) {
    return true;
  }

  if (
    authorEmail.includes('atlantiqueprestige.bj') ||
    authorEmail.includes('littoralimmo.bj') ||
    authorEmail.includes('ivoirelogis.ci') ||
    authorEmail.includes('terangaimmo.sn') ||
    authorEmail.includes('lome-immo.tg') ||
    authorEmail.includes('mamadou.diallo') ||
    authorEmail.includes('koffi.mensah') ||
    authorEmail.includes('aicha.toure') ||
    authorEmail.includes('diallo-patrimoine')
  ) {
    return true;
  }

  return false;
}

function mergeUserIntoList(currentUsers: any[], incomingUser: any) {
  if (!incomingUser || !incomingUser.email || isFakeServerUser(incomingUser)) return;
  const cleanEmail = incomingUser.email.trim().toLowerCase();
  const idx = currentUsers.findIndex(
    (u) => u.email && u.email.trim().toLowerCase() === cleanEmail
  );

  // Règles d'intégrité canoniques
  if (cleanEmail === 'jojovog007@gmail.com') {
    incomingUser.matricule = 'LOCA-MAT-BJ-17635';
    incomingUser.firstName = 'Jojo';
    incomingUser.lastName = 'VOG';
    incomingUser.name = 'Jojo VOG';
    incomingUser.phone = incomingUser.phone || '+229 97 00 12 34';
    incomingUser.password = incomingUser.password || 'Lolo1000$';
    incomingUser.emailVerified = true;
    incomingUser.isIdentitySealed = true;
  } else if (cleanEmail === 'jobovog@gmail.com') {
    incomingUser.matricule = 'LOCA-MAT-BJ-84291';
    incomingUser.firstName = 'Johane';
    incomingUser.lastName = 'Voglossou';
    incomingUser.name = 'VOGLOSSOU JOHANE';
    incomingUser.phone = '+229 01 95 44 44 30';
    incomingUser.password = incomingUser.password || 'Forever1122$';
    incomingUser.emailVerified = true;
    incomingUser.isIdentitySealed = true;
  } else if (cleanEmail === 'theodoradjigla@gmail.com') {
    incomingUser.matricule = 'LOCA-MAT-BJ-24702';
    incomingUser.firstName = 'Théodora';
    incomingUser.lastName = 'DJIGLA';
    incomingUser.name = 'Théodora DJIGLA';
    incomingUser.phone = incomingUser.phone || '+229 01 97 30 73 74';
    incomingUser.password = incomingUser.password || 'Jesusmonroi@2026';
    incomingUser.emailVerified = true;
    incomingUser.isIdentitySealed = true;
  } else if (cleanEmail === 'vividpari@gmail.com') {
    incomingUser.id = incomingUser.id || 'usr-demarcheur-mwr2q8mb';
    incomingUser.matricule = 'LOCA-MAT-BJ-50341';
    incomingUser.firstName = 'PARI';
    incomingUser.lastName = 'VIVID';
    incomingUser.name = 'PARI VIVID';
    incomingUser.companyName = incomingUser.companyName || 'VIVI IMMO';
    incomingUser.phone = incomingUser.phone || '+229 0132789056';
    incomingUser.password = incomingUser.password || 'Zamour007';
    incomingUser.emailVerified = true;
    incomingUser.isIdentitySealed = true;
  }

  if (idx !== -1) {
    const existing = currentUsers[idx];
    const immutableMatricule = existing.matricule || incomingUser.matricule;
    const isSealed = Boolean(existing.isIdentitySealed || incomingUser.isIdentitySealed);
    const isEmailVerified = Boolean(existing.emailVerified || incomingUser.emailVerified);

    currentUsers[idx] = {
      ...existing,
      ...incomingUser,
      companyName: incomingUser.companyName !== undefined ? incomingUser.companyName : existing.companyName,
      avatarUrl: incomingUser.avatarUrl || existing.avatarUrl,
      password: incomingUser.password || existing.password,
      matricule: immutableMatricule,
      firstName: isSealed ? (existing.firstName || incomingUser.firstName) : (incomingUser.firstName || existing.firstName),
      lastName: isSealed ? (existing.lastName || incomingUser.lastName) : (incomingUser.lastName || existing.lastName),
      name: isSealed ? (existing.name || incomingUser.name) : (incomingUser.name || existing.name),
      phone: cleanEmail === 'jobovog@gmail.com' ? '+229 01 95 44 44 30' : (incomingUser.phone || existing.phone),
      isIdentitySealed: isSealed,
      emailVerified: isEmailVerified,
    };
  } else {
    if (incomingUser.firstName && incomingUser.lastName && incomingUser.phone) {
      incomingUser.isIdentitySealed = true;
    }
    currentUsers.unshift(incomingUser);
  }
}

export async function GET(req: NextRequest) {
  try {
    const removedListingIds = readJsonFile<string[]>(REMOVED_LISTING_IDS_FILE, []);
    const trashListings = readJsonFile<any[]>(TRASH_LISTINGS_FILE, []).filter((l) => !isFakeServerListing(l));
    const removedSet = new Set<string>([
      ...removedListingIds.map((id) => String(id).trim()),
      ...trashListings.map((t) => String(t.id || '').trim()),
    ]);

    const leases = readJsonFile<any[]>(LEASES_FILE, []).filter((l) => !isFakeServerLease(l));
    const notifications = readJsonFile<any[]>(NOTIFS_FILE, []);
    const landlordNotifications = readJsonFile<any[]>(LANDLORD_NOTIFS_FILE, []);
    const notices = readJsonFile<any[]>(NOTICES_FILE, []);
    const incidents = readJsonFile<any[]>(INCIDENTS_FILE, []);
    const users = readJsonFile<any[]>(USERS_FILE, [], 'email').filter((u) => !isFakeServerUser(u));
    const listings = readJsonFile<any[]>(LISTINGS_FILE, []).filter(
      (l) => !isFakeServerListing(l) && !removedSet.has(String(l.id).trim())
    );
    const properties = readJsonFile<any[]>(PROPERTIES_FILE, []).filter((p) => !isFakeServerProperty(p));
    const conversations = readJsonFile<any[]>(CONVERSATIONS_FILE, []);
    const payments = readJsonFile<any[]>(PAYMENTS_FILE, []);
    const verifiedPayments = readJsonFile<any[]>(VERIFIED_PAYMENTS_FILE, []);
    const inspections = readJsonObject<Record<string, any>>(INSPECTIONS_FILE, {});
    const registeredTenants = readJsonFile<any[]>(REGISTERED_TENANTS_FILE, []);
    const securityAlerts = readJsonFile<any[]>(SECURITY_ALERTS_FILE, []);

    const adminObj = readJsonObject<{ password?: string }>('admin.json', {
      password: 'Omega#Admin2027!LocaSecurity',
    });
    const adminPassword = adminObj.password || 'Omega#Admin2027!LocaSecurity';

    const rawData = {
      leases,
      notifications,
      landlordNotifications,
      notices,
      incidents,
      users,
      listings,
      trashListings,
      removedListingIds: Array.from(removedSet).filter(Boolean),
      properties,
      conversations,
      payments,
      verifiedPayments,
      inspections,
      registeredTenants,
      securityAlerts,
      adminPassword,
    };

    // Calcul d'un ETag cryptographique rapide pour économie maximale de bande passante
    const serialized = JSON.stringify(rawData);
    const etag = `"${crypto.createHash('md5').update(serialized).digest('hex')}"`;

    const clientEtag = req.headers.get('if-none-match') || req.nextUrl.searchParams.get('etag');
    if (clientEtag && (clientEtag === etag || clientEtag.replace(/"/g, '') === etag.replace(/"/g, ''))) {
      if (req.headers.get('if-none-match')) {
        return new NextResponse(null, {
          status: 304,
          headers: {
            'ETag': etag,
            'Cache-Control': 'private, no-cache, must-revalidate',
          },
        });
      }
      return NextResponse.json(
        {
          success: true,
          notModified: true,
          etag,
        },
        {
          status: 200,
          headers: {
            'ETag': etag,
            'Cache-Control': 'private, no-cache, must-revalidate',
          },
        }
      );
    }

    return NextResponse.json(
      {
        success: true,
        notModified: false,
        etag,
        ...rawData,
        timestamp: new Date().toISOString(),
      },
      {
        headers: {
          'ETag': etag,
          'Cache-Control': 'private, no-cache, must-revalidate',
        },
      }
    );
  } catch (e) {
    console.error('Erreur GET /api/sync:', e);
    return NextResponse.json({ success: false, error: 'Erreur serveur sync' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body) {
      return NextResponse.json({ success: false, error: 'Payload vide' }, { status: 400 });
    }

    const {
      leases: incomingLeases,
      notifications: incomingNotifs,
      landlordNotifications: incomingLandlordNotifs,
      notices: incomingNotices,
      incidents: incomingIncidents,
      user: incomingUser,
      users: incomingUsers,
      removedListingId,
      removedListingIds: incomingRemovedIds,
      restoredListingId,
      trashListings: incomingTrashListings,
      properties: incomingProperties,
      listings: incomingListings,
      conversations: incomingConversations,
      payments: incomingPayments,
      verifiedPayments: incomingVerifiedPayments,
      inspections: incomingInspections,
      registeredTenants: incomingRegisteredTenants,
      securityAlerts: incomingSecurityAlerts,
      adminPassword: incomingAdminPassword,
    } = body;

    if (incomingAdminPassword && typeof incomingAdminPassword === 'string') {
      writeJsonObject('admin.json', {
        password: incomingAdminPassword.trim(),
        updatedAt: new Date().toISOString(),
      });
    }

    // 1. Synchronisation et fusion des baux
    if (Array.isArray(incomingLeases) && incomingLeases.length > 0) {
      const currentLeases = readJsonFile<any[]>(LEASES_FILE, []).filter((l) => !isFakeServerLease(l));
      const mergedMap = new Map<string, any>();
      currentLeases.forEach((l) => {
        if (l && l.id && !isFakeServerLease(l)) {
          mergedMap.set(l.id, l);
        }
      });
      incomingLeases.forEach((l) => {
        if (l && l.id && !isFakeServerLease(l)) {
          const existing = mergedMap.get(l.id);
          if (existing) {
            const signedByTenant = Boolean(existing.signedByTenant || l.signedByTenant);
            const signedByLandlord = Boolean(existing.signedByLandlord || l.signedByLandlord);
            const status =
              l.status === 'resilie' || existing.status === 'resilie'
                ? l.reactivatedAt && (!existing.resiliatedAt || l.reactivatedAt >= existing.resiliatedAt)
                  ? 'actif'
                  : 'resilie'
                : signedByTenant || l.status === 'actif' || existing.status === 'actif'
                ? 'actif'
                : l.status || existing.status;
            mergedMap.set(l.id, {
              ...existing,
              ...l,
              status,
              signedByTenant,
              signedByLandlord,
              tenantSignedAt: l.tenantSignedAt || existing.tenantSignedAt,
              tenantSignature: l.tenantSignature || existing.tenantSignature,
              landlordSignature: l.landlordSignature || existing.landlordSignature,
            });
          } else {
            mergedMap.set(l.id, l);
          }
        }
      });
      writeJsonFile(LEASES_FILE, Array.from(mergedMap.values()));
    }

    // 2. Synchronisation et fusion des notifications locataires
    if (Array.isArray(incomingNotifs) && incomingNotifs.length > 0) {
      const currentNotifs = readJsonFile<any[]>(NOTIFS_FILE, []);
      const notifsMap = new Map<string, any>();
      currentNotifs.forEach((n) => {
        if (n && n.id) notifsMap.set(n.id, n);
      });
      incomingNotifs.forEach((n) => {
        if (n && n.id) {
          const existing = notifsMap.get(n.id);
          notifsMap.set(n.id, existing ? { ...existing, ...n, read: Boolean(existing.read || n.read) } : n);
        }
      });
      writeJsonFile(NOTIFS_FILE, Array.from(notifsMap.values()));
    }

    // 3. Synchronisation des utilisateurs (unitaire ET liste complète)
    if ((incomingUser && incomingUser.email) || (Array.isArray(incomingUsers) && incomingUsers.length > 0)) {
      const currentUsers = [...readJsonFile<any[]>(USERS_FILE, [], 'email').filter((u) => !isFakeServerUser(u))];
      if (Array.isArray(incomingUsers)) {
        incomingUsers.forEach((u) => mergeUserIntoList(currentUsers, u));
      }
      if (incomingUser && incomingUser.email) {
        mergeUserIntoList(currentUsers, incomingUser);
      }
      writeJsonFile(USERS_FILE, currentUsers);
    }

    // 4. Gestion de la corbeille & des retraits d'annonces
    let removedIdsList = [...readJsonFile<string[]>(REMOVED_LISTING_IDS_FILE, [])];
    if (removedListingId) {
      if (!removedIdsList.includes(removedListingId)) {
        removedIdsList.push(removedListingId);
      }
    }
    if (Array.isArray(incomingRemovedIds)) {
      incomingRemovedIds.forEach((rid) => {
        if (rid && !removedIdsList.includes(rid)) removedIdsList.push(rid);
      });
    }
    if (restoredListingId) {
      removedIdsList = removedIdsList.filter((rid) => rid !== restoredListingId);
    }
    writeJsonFile(REMOVED_LISTING_IDS_FILE, removedIdsList);

    if (Array.isArray(incomingTrashListings)) {
      const currentTrash = readJsonFile<any[]>(TRASH_LISTINGS_FILE, []).filter((l) => !isFakeServerListing(l));
      const trashMap = new Map<string, any>();
      currentTrash.forEach((t) => {
        if (t && t.id && t.id !== restoredListingId) trashMap.set(t.id, t);
      });
      incomingTrashListings.forEach((t) => {
        if (t && t.id && !isFakeServerListing(t) && t.id !== restoredListingId) {
          trashMap.set(t.id, { ...(trashMap.get(t.id) || {}), ...t });
        }
      });
      writeJsonFile(TRASH_LISTINGS_FILE, Array.from(trashMap.values()));
    } else if (restoredListingId) {
      const currentTrash = readJsonFile<any[]>(TRASH_LISTINGS_FILE, []);
      writeJsonFile(
        TRASH_LISTINGS_FILE,
        currentTrash.filter((t) => t && t.id !== restoredListingId)
      );
    }

    if (removedListingId) {
      const currentListings = readJsonFile<any[]>(LISTINGS_FILE, []).filter((l) => !isFakeServerListing(l));
      const filtered = currentListings.filter(
        (l) => l.id !== removedListingId && l.referenceCode !== removedListingId
      );
      writeJsonFile(LISTINGS_FILE, filtered);
    }

    // 5. Synchronisation et fusion des propriétés
    if (Array.isArray(incomingProperties) && incomingProperties.length > 0) {
      const currentProperties = readJsonFile<any[]>(PROPERTIES_FILE, []).filter((p) => !isFakeServerProperty(p));
      const propsMap = new Map<string, any>();
      currentProperties.forEach((p) => {
        if (p && p.id && !isFakeServerProperty(p)) propsMap.set(p.id, p);
      });
      incomingProperties.forEach((p) => {
        if (p && p.id && !isFakeServerProperty(p)) {
          const existing = propsMap.get(p.id);
          propsMap.set(p.id, existing ? { ...existing, ...p } : p);
        }
      });
      writeJsonFile(PROPERTIES_FILE, Array.from(propsMap.values()));
    }

    // 6. Synchronisation et fusion des annonces / publications
    if (Array.isArray(incomingListings) && incomingListings.length > 0) {
      const removedSet = new Set(removedIdsList);
      const currentListings = readJsonFile<any[]>(LISTINGS_FILE, []).filter(
        (l) => !isFakeServerListing(l) && !removedSet.has(l.id)
      );
      const listingsMap = new Map<string, any>();
      currentListings.forEach((l) => {
        if (l && l.id && !isFakeServerListing(l) && !removedSet.has(l.id)) listingsMap.set(l.id, l);
      });
      incomingListings.forEach((l) => {
        if (l && l.id && !isFakeServerListing(l) && !removedSet.has(l.id)) {
          const existing = listingsMap.get(l.id);
          listingsMap.set(l.id, existing ? { ...existing, ...l } : l);
        }
      });
      writeJsonFile(LISTINGS_FILE, Array.from(listingsMap.values()));
    }

    // 7. Synchronisation et fusion des conversations
    if (Array.isArray(incomingConversations) && incomingConversations.length > 0) {
      const currentConvs = readJsonFile<any[]>(CONVERSATIONS_FILE, []);
      const convsMap = new Map<string, any>();
      currentConvs.forEach((c) => {
        if (c && c.id) convsMap.set(c.id, c);
      });
      incomingConversations.forEach((c) => {
        if (c && c.id) {
          const existing = convsMap.get(c.id);
          if (existing) {
            const msgMap = new Map<string, any>();
            (existing.messages || []).forEach((m: any) => msgMap.set(m.id || `${m.time}-${m.text}`, m));
            (c.messages || []).forEach((m: any) => msgMap.set(m.id || `${m.time}-${m.text}`, m));
            const allMessages = Array.from(msgMap.values());
            const lastMsg = allMessages.length > 0 ? allMessages[allMessages.length - 1] : null;
            const cIsNewer = (c.messages?.length || 0) > (existing.messages?.length || 0);
            const eIsNewer = (existing.messages?.length || 0) > (c.messages?.length || 0);
            const unreadSource = cIsNewer ? c : eIsNewer ? existing : c;
            convsMap.set(c.id, {
              ...existing,
              ...c,
              unreadCount: unreadSource.unreadCount ?? 0,
              hasUnread: Boolean(unreadSource.hasUnread),
              unreadBy: unreadSource.unreadBy,
              isRead: unreadSource.isRead ?? !unreadSource.hasUnread,
              messages: allMessages,
              lastMessage: lastMsg ? lastMsg.text : c.lastMessage || existing.lastMessage,
              lastMessageTime: lastMsg ? lastMsg.time || c.lastMessageTime : c.lastMessageTime || existing.lastMessageTime,
            });
          } else {
            convsMap.set(c.id, c);
          }
        }
      });
      writeJsonFile(CONVERSATIONS_FILE, Array.from(convsMap.values()));
    }

    // 8. Synchronisation et fusion des paiements déclarés et vérifiés
    if (Array.isArray(incomingPayments) && incomingPayments.length > 0) {
      const currentPayments = readJsonFile<any[]>(PAYMENTS_FILE, []);
      const payMap = new Map<string, any>();
      currentPayments.forEach((p) => {
        if (p && p.id) payMap.set(p.id, p);
      });
      incomingPayments.forEach((p) => {
        if (p && p.id) {
          const existing = payMap.get(p.id);
          if (existing) {
            const isVerified = Boolean(existing.isVerified || p.isVerified);
            payMap.set(p.id, {
              ...existing,
              ...p,
              isVerified,
              status: isVerified ? 'paye' : p.status || existing.status,
              receiptNumber: isVerified && existing.receiptNumber?.startsWith('QUITT-')
                ? existing.receiptNumber
                : p.receiptNumber || existing.receiptNumber,
            });
          } else {
            payMap.set(p.id, p);
          }
        }
      });
      writeJsonFile(PAYMENTS_FILE, Array.from(payMap.values()));
    }

    if (Array.isArray(incomingVerifiedPayments) && incomingVerifiedPayments.length > 0) {
      const currentVerified = readJsonFile<any[]>(VERIFIED_PAYMENTS_FILE, []);
      const verMap = new Map<string, any>();
      currentVerified.forEach((p) => {
        if (p && p.id) verMap.set(p.id, p);
      });
      incomingVerifiedPayments.forEach((p) => {
        if (p && p.id) {
          verMap.set(p.id, { ...(verMap.get(p.id) || {}), ...p, isVerified: true, status: 'paye' });
        }
      });
      writeJsonFile(VERIFIED_PAYMENTS_FILE, Array.from(verMap.values()));
    }

    // 9. Synchronisation et fusion des notifications bailleur
    if (Array.isArray(incomingLandlordNotifs) && incomingLandlordNotifs.length > 0) {
      const currentLNotifs = readJsonFile<any[]>(LANDLORD_NOTIFS_FILE, []);
      const lnMap = new Map<string, any>();
      currentLNotifs.forEach((n) => {
        if (n && n.id) lnMap.set(n.id, n);
      });
      incomingLandlordNotifs.forEach((n) => {
        if (n && n.id) {
          const existing = lnMap.get(n.id);
          lnMap.set(n.id, existing ? { ...existing, ...n, read: Boolean(existing.read || n.read) } : n);
        }
      });
      writeJsonFile(LANDLORD_NOTIFS_FILE, Array.from(lnMap.values()));
    }

    // 10. Synchronisation et fusion des préavis
    if (Array.isArray(incomingNotices) && incomingNotices.length > 0) {
      const currentNotices = readJsonFile<any[]>(NOTICES_FILE, []);
      const noticesMap = new Map<string, any>();
      currentNotices.forEach((n) => {
        if (n && n.id) noticesMap.set(n.id, n);
      });
      incomingNotices.forEach((n) => {
        if (n && n.id) {
          const existing = noticesMap.get(n.id);
          if (existing) {
            const isConfirmed = existing.status === 'confirme' || n.status === 'confirme' || Boolean(existing.landlordConfirmedAt || n.landlordConfirmedAt);
            noticesMap.set(n.id, {
              ...existing,
              ...n,
              status: isConfirmed ? 'confirme' : n.status || existing.status,
              landlordConfirmedAt: n.landlordConfirmedAt || existing.landlordConfirmedAt,
              landlordReplyMessage: n.landlordReplyMessage || existing.landlordReplyMessage,
              landlordReplyDate: n.landlordReplyDate || existing.landlordReplyDate,
            });
          } else {
            noticesMap.set(n.id, n);
          }
        }
      });
      writeJsonFile(NOTICES_FILE, Array.from(noticesMap.values()));
    }

    // 11. Synchronisation et fusion des pannes & interventions
    if (Array.isArray(incomingIncidents) && incomingIncidents.length > 0) {
      const currentIncidents = readJsonFile<any[]>(INCIDENTS_FILE, []);
      const incMap = new Map<string, any>();
      currentIncidents.forEach((i) => {
        if (i && i.id) incMap.set(i.id, i);
      });
      incomingIncidents.forEach((i) => {
        if (i && i.id) {
          const existing = incMap.get(i.id);
          incMap.set(i.id, existing ? { ...existing, ...i } : i);
        }
      });
      writeJsonFile(INCIDENTS_FILE, Array.from(incMap.values()));
    }

    // 12. Synchronisation et fusion des états des lieux (inspections)
    if (incomingInspections && typeof incomingInspections === 'object' && !Array.isArray(incomingInspections)) {
      const currentInspections = readJsonObject<Record<string, any>>(INSPECTIONS_FILE, {});
      const mergedInspections: Record<string, any> = { ...currentInspections };
      Object.entries(incomingInspections).forEach(([leaseId, data]) => {
        if (leaseId && data) {
          mergedInspections[leaseId] = {
            ...(mergedInspections[leaseId] || {}),
            ...(data as object),
          };
        }
      });
      writeJsonObject(INSPECTIONS_FILE, mergedInspections);
    }

    // 13. Synchronisation des locataires enregistrés / invités
    if (Array.isArray(incomingRegisteredTenants) && incomingRegisteredTenants.length > 0) {
      const currentTenants = readJsonFile<any[]>(REGISTERED_TENANTS_FILE, []);
      const tenMap = new Map<string, any>();
      currentTenants.forEach((t) => {
        if (t && (t.id || t.email)) tenMap.set(t.email ? t.email.toLowerCase() : t.id, t);
      });
      incomingRegisteredTenants.forEach((t) => {
        if (t && (t.id || t.email)) {
          const key = t.email ? t.email.toLowerCase() : t.id;
          tenMap.set(key, { ...(tenMap.get(key) || {}), ...t });
        }
      });
      writeJsonFile(REGISTERED_TENANTS_FILE, Array.from(tenMap.values()));
    }

    // 14. Synchronisation des alertes de sécurité Admin
    if (Array.isArray(incomingSecurityAlerts) && incomingSecurityAlerts.length > 0) {
      const currentAlerts = readJsonFile<any[]>(SECURITY_ALERTS_FILE, []);
      const alertMap = new Map<string, any>();
      currentAlerts.forEach((a) => {
        if (a && a.id) alertMap.set(a.id, a);
      });
      incomingSecurityAlerts.forEach((a) => {
        if (a && a.id) {
          alertMap.set(a.id, { ...(alertMap.get(a.id) || {}), ...a });
        }
      });
      writeJsonFile(SECURITY_ALERTS_FILE, Array.from(alertMap.values()));
    }

    // Retourner une confirmation ultra-légère (économie majeure de bande passante Vercel)
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Erreur POST /api/sync:', e);
    return NextResponse.json({ success: false, error: 'Erreur mise à jour sync' }, { status: 500 });
  }
}
