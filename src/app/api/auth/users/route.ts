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

    // RÈGLE D'OR : Le compte jojovog007@gmail.com est irrévocablement lié à LOCA-MAT-BJ-17635
    if (cleanEmail === 'jojovog007@gmail.com') {
      body.matricule = 'LOCA-MAT-BJ-17635';
    }

    const idx = users.findIndex((u: any) => u.email && u.email.trim().toLowerCase() === cleanEmail);

    if (idx !== -1) {
      // Conservation stricte du matricule existant (immutabilité garantie)
      const existingMatricule = users[idx].matricule || body.matricule;
      users[idx] = { ...users[idx], ...body, matricule: existingMatricule };
    } else {
      users.unshift(body);
    }

    saveUsersToFile(users);
    return NextResponse.json({ success: true, user: body });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

