import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'users.json');

function getUsersFromFile(): any[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
      fs.writeFileSync(DATA_FILE, '[]', 'utf8');
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Erreur lecture users.json:', e);
    return [];
  }
}

function saveUsersToFile(users: any[]) {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('Erreur écriture users.json:', e);
  }
}

export async function GET() {
  const users = getUsersFromFile();
  return NextResponse.json({ success: true, users });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || !body.email) {
      return NextResponse.json({ success: false, error: 'Email obligatoire' }, { status: 400 });
    }

    const users = getUsersFromFile();
    const cleanEmail = body.email.trim().toLowerCase();

    // RÈGLE D'OR : Le compte jojovog007@gmail.com est irrévocablement lié à LOCA-MAT-BJ-17635 et scellé
    if (cleanEmail === 'jojovog007@gmail.com') {
      body.matricule = 'LOCA-MAT-BJ-17635';
      body.firstName = 'Jojo';
      body.lastName = 'VOG';
      body.name = 'Jojo VOG';
      body.phone = body.phone || '+229 97 00 12 34';
      body.isIdentitySealed = true;
    }

    const idx = users.findIndex((u: any) => u.email && u.email.trim().toLowerCase() === cleanEmail);

    if (idx !== -1) {
      // Conservation stricte du matricule existant et protection de l'identité scellée
      const existing = users[idx];
      const immutableMatricule = existing.matricule || body.matricule;
      const isSealed = Boolean(existing.isIdentitySealed || body.isIdentitySealed);

      users[idx] = {
        ...existing,
        ...body,
        password: body.password || existing.password,
        matricule: immutableMatricule,
        firstName: isSealed ? (existing.firstName || body.firstName) : (body.firstName || existing.firstName),
        lastName: isSealed ? (existing.lastName || body.lastName) : (body.lastName || existing.lastName),
        name: isSealed ? (existing.name || body.name) : (body.name || existing.name),
        phone: isSealed ? (existing.phone || body.phone) : (body.phone || existing.phone),
        isIdentitySealed: isSealed,
      };
    } else {
      if (body.firstName && body.lastName && body.phone) {
        body.isIdentitySealed = true;
      }
      users.unshift(body);
    }

    saveUsersToFile(users);
    return NextResponse.json({ success: true, user: body });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

