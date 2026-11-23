import { NextRequest, NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile, writeJsonObject } from '@/lib/server/server-store';

const USERS_FILE = 'users.json';

function getUsersFromStore(): any[] {
  const users = readJsonFile<any[]>(USERS_FILE, [], 'email');
  return Array.isArray(users) ? users : [];
}

function saveUsersToStore(users: any[]) {
  writeJsonFile(USERS_FILE, users);
}

export async function GET() {
  const users = getUsersFromStore();
  return NextResponse.json({ success: true, users });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.email) {
      return NextResponse.json({ success: false, error: 'Email obligatoire' }, { status: 400 });
    }

    const users = [...getUsersFromStore()];
    const cleanEmail = body.email.trim().toLowerCase();

    // RÈGLE D'OR : Le compte jojovog007@gmail.com est irrévocablement lié à LOCA-MAT-BJ-17635 et scellé, mot de passe unique Lolo1000$
    if (cleanEmail === 'jojovog007@gmail.com') {
      body.matricule = 'LOCA-MAT-BJ-17635';
      body.firstName = 'Jojo';
      body.lastName = 'VOG';
      body.name = 'Jojo VOG';
      body.phone = body.phone || '+229 97 00 12 34';
      body.password = body.password || 'Lolo1000$';
      body.emailVerified = true;
      body.isIdentitySealed = true;
    }

    // RÈGLE D'OR : Le compte bailleur jobovog@gmail.com est irrévocablement lié à son numéro réel +229 01 95 44 44 30, mot de passe unique Forever1122$
    if (cleanEmail === 'jobovog@gmail.com') {
      body.matricule = 'LOCA-MAT-BJ-84291';
      body.firstName = 'Johane';
      body.lastName = 'Voglossou';
      body.name = 'VOGLOSSOU JOHANE';
      body.phone = '+229 01 95 44 44 30';
      body.password = body.password || 'Forever1122$';
      body.emailVerified = true;
      body.isIdentitySealed = true;
    }

    // RÈGLE D'OR : Le compte locataire theodoradjigla@gmail.com est irrévocablement lié à LOCA-MAT-BJ-24702 et scellé
    if (cleanEmail === 'theodoradjigla@gmail.com') {
      body.matricule = 'LOCA-MAT-BJ-24702';
      body.firstName = 'Théodora';
      body.lastName = 'DJIGLA';
      body.name = 'Théodora DJIGLA';
      body.phone = body.phone || '+229 01 97 30 73 74';
      body.password = body.password || 'Jesusmonroi@2026';
      body.emailVerified = true;
      body.isIdentitySealed = true;
    }

    // RÈGLE D'OR : Le compte démarcheur vividpari@gmail.com (PARI VIVID / VIVI IMMO) est scellé
    if (cleanEmail === 'vividpari@gmail.com') {
      body.id = body.id || 'usr-demarcheur-mwr2q8mb';
      body.matricule = 'LOCA-MAT-BJ-50341';
      body.firstName = 'PARI';
      body.lastName = 'VIVID';
      body.name = 'PARI VIVID';
      body.companyName = body.companyName || 'VIVI IMMO';
      body.phone = body.phone || '+229 0132789056';
      body.password = body.password || 'Zamour007';
      body.emailVerified = true;
      body.isIdentitySealed = true;
    }

    // RÈGLE SPÉCIALE SUPER-ADMIN : Sauvegarde persistante du mot de passe admin
    if (cleanEmail === 'admin@locagestion.site') {
      writeJsonObject('admin.json', {
        password: body.password || 'Omega#Admin2027!LocaSecurity',
        updatedAt: new Date().toISOString(),
      });
    }

    const idx = users.findIndex((u: any) => u.email && u.email.trim().toLowerCase() === cleanEmail);

    if (idx !== -1) {
      // Conservation stricte du matricule existant et protection de l'identité scellée
      const existing = users[idx];
      const immutableMatricule = existing.matricule || body.matricule;
      const isSealed = Boolean(existing.isIdentitySealed || body.isIdentitySealed);
      const isEmailVerified = Boolean(existing.emailVerified || body.emailVerified);

      users[idx] = {
        ...existing,
        ...body,
        companyName: body.companyName !== undefined ? body.companyName : existing.companyName,
        avatarUrl: body.avatarUrl || existing.avatarUrl,
        password: body.password || existing.password,
        matricule: immutableMatricule,
        firstName: isSealed ? (existing.firstName || body.firstName) : (body.firstName || existing.firstName),
        lastName: isSealed ? (existing.lastName || body.lastName) : (body.lastName || existing.lastName),
        name: isSealed ? (existing.name || body.name) : (body.name || existing.name),
        phone: cleanEmail === 'jobovog@gmail.com' ? '+229 01 95 44 44 30' : (body.phone || existing.phone),
        isIdentitySealed: isSealed,
        emailVerified: isEmailVerified,
      };
    } else {
      if (body.firstName && body.lastName && body.phone) {
        body.isIdentitySealed = true;
      }
      users.unshift(body);
    }

    saveUsersToStore(users);
    return NextResponse.json({ success: true, user: body, users });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
