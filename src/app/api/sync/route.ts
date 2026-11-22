import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const TMP_DATA_DIR = path.join('/tmp', 'locagestion_data');

const LEASES_FILE = 'leases.json';
const NOTIFS_FILE = 'notifications.json';
const USERS_FILE = 'users.json';
const LISTINGS_FILE = 'listings.json';
const PROPERTIES_FILE = 'properties.json';

// In-memory global store to guarantee cross-request persistence in serverless instances
const memoryStore: Record<string, any[]> =
  (globalThis as any)._locagestion_store ||
  ((globalThis as any)._locagestion_store = {});

function readJsonFile<T>(filename: string, fallback: T): T {
  const storeKey = filename.replace('.json', '');

  // 1. In-memory cache
  if (memoryStore[storeKey] && Array.isArray(memoryStore[storeKey]) && memoryStore[storeKey].length > 0) {
    return memoryStore[storeKey] as T;
  }

  // 2. /tmp directory (writable in serverless / Vercel lambdas)
  try {
    const tmpPath = path.join(TMP_DATA_DIR, filename);
    if (fs.existsSync(tmpPath)) {
      const raw = fs.readFileSync(tmpPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryStore[storeKey] = parsed;
        return parsed as T;
      }
    }
  } catch (e) {}

  // 3. process.cwd()/data (static data bundled at build time)
  try {
    const dataPath = path.join(DATA_DIR, filename);
    if (fs.existsSync(dataPath)) {
      const raw = fs.readFileSync(dataPath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryStore[storeKey] = parsed;
        return parsed as T;
      }
    }
  } catch (e) {}

  memoryStore[storeKey] = fallback as any;
  return fallback;
}

function writeJsonFile<T>(filename: string, data: T) {
  const storeKey = filename.replace('.json', '');
  memoryStore[storeKey] = data as any;

  // Try writing to data/ directory (works on standard hosts and local environment)
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    // Read-only filesystem in serverless; falls back to /tmp below
  }

  // Also write to /tmp for persistent writes across warm serverless functions
  try {
    if (!fs.existsSync(TMP_DATA_DIR)) {
      fs.mkdirSync(TMP_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(path.join(TMP_DATA_DIR, filename), JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {}
}

function isFakeServerLease(l: any): boolean {
  if (!l || !l.id) return true;
  if (l.id === 'BAIL-2026-BJ-17635' || l.id === 'BAIL-2026-MAG-102' || l.id === 'BAIL-2026-COM-205') return true;
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
    id === 'usr-demarcheur-lome'
  ) return true;
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
  ) return true;
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
    email.includes('lome-immo.tg')
  ) return true;
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
  const id = String(l.id).trim();

  // Toutes les annonces de démo / mock ou de test sont des annonces fictives à bannir
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
  const authorEmail = (l.authorEmail || '').trim().toLowerCase();
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim().toLowerCase();
    const matricule = searchParams.get('matricule')?.trim();

    const leases = readJsonFile<any[]>(LEASES_FILE, []).filter((l) => !isFakeServerLease(l));
    const notifications = readJsonFile<any[]>(NOTIFS_FILE, []);
    const users = readJsonFile<any[]>(USERS_FILE, []).filter((u) => !isFakeServerUser(u));
    const listings = readJsonFile<any[]>(LISTINGS_FILE, []).filter((l) => !isFakeServerListing(l));
    const properties = readJsonFile<any[]>(PROPERTIES_FILE, []).filter((p) => !isFakeServerProperty(p));

    // Filtrage contextuel si locataire spécifique demandé, sinon envoi complet pour synchronisation globale
    return NextResponse.json({
      success: true,
      leases,
      notifications,
      users,
      listings,
      properties,
      timestamp: new Date().toISOString(),
    });
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
      user: incomingUser,
      removedListingId,
      properties: incomingProperties,
      listings: incomingListings,
    } = body;

    // 1. Synchronisation et fusion des baux (rejet strict des baux fictifs)
    if (Array.isArray(incomingLeases) && incomingLeases.length > 0) {
      const currentLeases = readJsonFile<any[]>(LEASES_FILE, []).filter((l) => !isFakeServerLease(l));
      const mergedMap = new Map<string, any>();
      // Déposer d'abord les baux serveur authentiques
      currentLeases.forEach((l) => {
        if (l && l.id && !isFakeServerLease(l)) {
          mergedMap.set(l.id, l);
        }
      });
      // Écraser ou ajouter avec les baux entrants récents authentiques
      incomingLeases.forEach((l) => {
        if (l && l.id && !isFakeServerLease(l)) {
          const existing = mergedMap.get(l.id);
          // Si le bail existe déjà, préserver ou fusionner les signatures
          if (existing) {
            mergedMap.set(l.id, { ...existing, ...l });
          } else {
            mergedMap.set(l.id, l);
          }
        }
      });
      const updatedLeases = Array.from(mergedMap.values());
      writeJsonFile(LEASES_FILE, updatedLeases);
    }

    // 2. Synchronisation et fusion des notifications
    if (Array.isArray(incomingNotifs) && incomingNotifs.length > 0) {
      const currentNotifs = readJsonFile<any[]>(NOTIFS_FILE, []);
      const notifsMap = new Map<string, any>();
      currentNotifs.forEach((n) => notifsMap.set(n.id, n));
      incomingNotifs.forEach((n) => {
        if (n && n.id) {
          notifsMap.set(n.id, n);
        }
      });
      const updatedNotifs = Array.from(notifsMap.values());
      writeJsonFile(NOTIFS_FILE, updatedNotifs);
    }

    // 3. Synchronisation de l'utilisateur avec garantie d'unicité absolue
    if (incomingUser && incomingUser.email && !isFakeServerUser(incomingUser)) {
      const currentUsers = readJsonFile<any[]>(USERS_FILE, []).filter((u) => !isFakeServerUser(u));
      const cleanEmail = incomingUser.email.trim().toLowerCase();
      const idx = currentUsers.findIndex(
        (u) => u.email && u.email.trim().toLowerCase() === cleanEmail
      );

      // CAS PARTICULIER STRICT JOJO VOG : matricule et identité scellés pour toujours, mot de passe unique distinct Lolo1000$
      if (cleanEmail === 'jojovog007@gmail.com') {
        incomingUser.matricule = 'LOCA-MAT-BJ-17635';
        incomingUser.firstName = 'Jojo';
        incomingUser.lastName = 'VOG';
        incomingUser.name = 'Jojo VOG';
        incomingUser.phone = incomingUser.phone || '+229 97 00 12 34';
        incomingUser.password = incomingUser.password || 'Lolo1000$';
        incomingUser.isIdentitySealed = true;
      }

      // CAS PARTICULIER STRICT JOHANE VOGLOSSOU (BAILLEUR) : numéro officiel unique +229 01 95 44 44 30, mot de passe unique distinct Forever1122$
      if (cleanEmail === 'jobovog@gmail.com') {
        incomingUser.matricule = 'LOCA-MAT-BJ-84291';
        incomingUser.firstName = 'Johane';
        incomingUser.lastName = 'Voglossou';
        incomingUser.name = 'VOGLOSSOU JOHANE';
        incomingUser.phone = '+229 01 95 44 44 30';
        incomingUser.password = incomingUser.password || 'Forever1122$';
        incomingUser.isIdentitySealed = true;
      }

      // CAS PARTICULIER STRICT THÉODORA DJIGLA (LOCATAIRE) : matricule LOCA-MAT-BJ-24702, mot de passe scellé Jesusmonroi@2026
      if (cleanEmail === 'theodoradjigla@gmail.com') {
        incomingUser.matricule = 'LOCA-MAT-BJ-24702';
        incomingUser.firstName = 'Théodora';
        incomingUser.lastName = 'DJIGLA';
        incomingUser.name = 'Théodora DJIGLA';
        incomingUser.phone = incomingUser.phone || '+229 01 97 30 73 74';
        incomingUser.password = incomingUser.password || 'Jesusmonroi@2026';
        incomingUser.emailVerified = true;
        incomingUser.isIdentitySealed = true;
      }

      if (idx !== -1) {
        // Préserver le matricule existant et l'identité scellée
        const existing = currentUsers[idx];
        const immutableMatricule = existing.matricule || incomingUser.matricule;
        const isSealed = Boolean(existing.isIdentitySealed || incomingUser.isIdentitySealed);

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
        };
      } else {
        if (incomingUser.firstName && incomingUser.lastName && incomingUser.phone) {
          incomingUser.isIdentitySealed = true;
        }
        currentUsers.unshift(incomingUser);
      }
      writeJsonFile(USERS_FILE, currentUsers);
    }

    // 4. Retrait d'annonce après contresignature si requis
    if (removedListingId) {
      const currentListings = readJsonFile<any[]>(LISTINGS_FILE, []).filter((l) => !isFakeServerListing(l));
      const filtered = currentListings.filter(
        (l) => l.id !== removedListingId && l.referenceCode !== removedListingId
      );
      writeJsonFile(LISTINGS_FILE, filtered);
    }

    // 5. Synchronisation et fusion des propriétés / patrimoine immobilier
    if (Array.isArray(incomingProperties) && incomingProperties.length > 0) {
      const currentProperties = readJsonFile<any[]>(PROPERTIES_FILE, []).filter((p) => !isFakeServerProperty(p));
      const propsMap = new Map<string, any>();
      currentProperties.forEach((p) => {
        if (p && p.id && !isFakeServerProperty(p)) propsMap.set(p.id, p);
      });
      incomingProperties.forEach((p) => {
        if (p && p.id && !isFakeServerProperty(p)) {
          const existing = propsMap.get(p.id);
          if (existing) {
            propsMap.set(p.id, { ...existing, ...p });
          } else {
            propsMap.set(p.id, p);
          }
        }
      });
      const updatedProperties = Array.from(propsMap.values());
      writeJsonFile(PROPERTIES_FILE, updatedProperties);
    }

    // 6. Synchronisation et fusion des annonces / publications
    if (Array.isArray(incomingListings) && incomingListings.length > 0) {
      const currentListings = readJsonFile<any[]>(LISTINGS_FILE, []).filter((l) => !isFakeServerListing(l));
      const listingsMap = new Map<string, any>();
      currentListings.forEach((l) => {
        if (l && l.id && !isFakeServerListing(l)) listingsMap.set(l.id, l);
      });
      incomingListings.forEach((l) => {
        if (l && l.id && !isFakeServerListing(l)) {
          const existing = listingsMap.get(l.id);
          if (existing) {
            listingsMap.set(l.id, { ...existing, ...l });
          } else {
            listingsMap.set(l.id, l);
          }
        }
      });
      const updatedListings = Array.from(listingsMap.values());
      writeJsonFile(LISTINGS_FILE, updatedListings);
    }

    // Retourner l'état unifié complet
    const finalLeases = readJsonFile<any[]>(LEASES_FILE, []).filter((l) => !isFakeServerLease(l));
    const finalNotifs = readJsonFile<any[]>(NOTIFS_FILE, []);
    const finalUsers = readJsonFile<any[]>(USERS_FILE, []).filter((u) => !isFakeServerUser(u));
    const finalListings = readJsonFile<any[]>(LISTINGS_FILE, []).filter((l) => !isFakeServerListing(l));
    const finalProperties = readJsonFile<any[]>(PROPERTIES_FILE, []).filter((p) => !isFakeServerProperty(p));

    return NextResponse.json({
      success: true,
      leases: finalLeases,
      notifications: finalNotifs,
      users: finalUsers,
      listings: finalListings,
      properties: finalProperties,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Erreur POST /api/sync:', e);
    return NextResponse.json({ success: false, error: 'Erreur mise à jour sync' }, { status: 500 });
  }
}
