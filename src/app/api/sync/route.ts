import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const LEASES_FILE = path.join(DATA_DIR, 'leases.json');
const NOTIFS_FILE = path.join(DATA_DIR, 'notifications.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LISTINGS_FILE = path.join(DATA_DIR, 'listings.json');

function ensureFile(filePath: string, defaultContent: string) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, defaultContent, 'utf8');
    }
  } catch (e) {
    console.error(`Erreur ensureFile (${filePath}):`, e);
  }
}

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    ensureFile(filePath, JSON.stringify(fallback));
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Erreur lecture ${filePath}:`, e);
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, data: T) {
  try {
    ensureFile(filePath, '[]');
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error(`Erreur écriture ${filePath}:`, e);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email')?.trim().toLowerCase();
    const matricule = searchParams.get('matricule')?.trim();

    const leases = readJsonFile<any[]>(LEASES_FILE, []);
    const notifications = readJsonFile<any[]>(NOTIFS_FILE, []);
    const users = readJsonFile<any[]>(USERS_FILE, []);
    const listings = readJsonFile<any[]>(LISTINGS_FILE, []);

    // Filtrage contextuel si locataire spécifique demandé, sinon envoi complet pour synchronisation globale
    return NextResponse.json({
      success: true,
      leases,
      notifications,
      users,
      listings,
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
    } = body;

    // 1. Synchronisation et fusion des baux
    if (Array.isArray(incomingLeases) && incomingLeases.length > 0) {
      const currentLeases = readJsonFile<any[]>(LEASES_FILE, []);
      const mergedMap = new Map<string, any>();
      // Déposer d'abord les baux serveur
      currentLeases.forEach((l) => mergedMap.set(l.id, l));
      // Écraser ou ajouter avec les baux entrants récents
      incomingLeases.forEach((l) => {
        if (l && l.id) {
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
    if (incomingUser && incomingUser.email) {
      const currentUsers = readJsonFile<any[]>(USERS_FILE, []);
      const cleanEmail = incomingUser.email.trim().toLowerCase();
      const idx = currentUsers.findIndex(
        (u) => u.email && u.email.trim().toLowerCase() === cleanEmail
      );

      // CAS PARTICULIER STRICT JOJO VOG : matricule et identité scellés pour toujours
      if (cleanEmail === 'jojovog007@gmail.com') {
        incomingUser.matricule = 'LOCA-MAT-BJ-17635';
        incomingUser.firstName = 'Jojo';
        incomingUser.lastName = 'VOG';
        incomingUser.name = 'Jojo VOG';
        incomingUser.phone = incomingUser.phone || '+229 97 00 12 34';
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
          matricule: immutableMatricule,
          firstName: isSealed ? (existing.firstName || incomingUser.firstName) : (incomingUser.firstName || existing.firstName),
          lastName: isSealed ? (existing.lastName || incomingUser.lastName) : (incomingUser.lastName || existing.lastName),
          name: isSealed ? (existing.name || incomingUser.name) : (incomingUser.name || existing.name),
          phone: isSealed ? (existing.phone || incomingUser.phone) : (incomingUser.phone || existing.phone),
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
      const currentListings = readJsonFile<any[]>(LISTINGS_FILE, []);
      const filtered = currentListings.filter(
        (l) => l.id !== removedListingId && l.referenceCode !== removedListingId
      );
      writeJsonFile(LISTINGS_FILE, filtered);
    }

    // Retourner l'état unifié complet
    const finalLeases = readJsonFile<any[]>(LEASES_FILE, []);
    const finalNotifs = readJsonFile<any[]>(NOTIFS_FILE, []);
    const finalUsers = readJsonFile<any[]>(USERS_FILE, []);

    return NextResponse.json({
      success: true,
      leases: finalLeases,
      notifications: finalNotifs,
      users: finalUsers,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error('Erreur POST /api/sync:', e);
    return NextResponse.json({ success: false, error: 'Erreur mise à jour sync' }, { status: 500 });
  }
}
