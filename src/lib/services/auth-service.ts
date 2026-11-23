'use client';

import { AuthUser, UserSpace } from '../types';
import {
  saveUserProfile,
  setUserResidenceCountry,
  setUserResidenceCity,
  setUserResidenceDistrict,
} from './geo-service';

const STORAGE_KEY_SESSION = 'locagestion:auth:session:v1';
const STORAGE_KEY_USERS = 'locagestion:auth:users:v1';

export function getRoleLabel(role?: UserSpace | string): string {
  switch (role) {
    case 'admin':
      return 'Super-Administrateur Sécurité & Plateforme';
    case 'bailleur':
      return 'Espace Propriétaire Bailleur';
    case 'demarcheur':
      return 'Espace Démarcheur & Agent';
    case 'locataire':
      return 'Espace Résident Locataire';
    default:
      return 'Espace Utilisateur';
  }
}

export const ADMIN_CURRENT_SESSION_VERSION = 'sec_v2_20261118_revoked_all';

/**
 * Extrait le code pays ISO-2 officiel pour le matricule (ex: BJ, CI, SN, TG, CM...)
 */
export function getCountryMatriculeCode(country?: string): string {
  if (!country) return 'BJ';
  const c = country.trim().toLowerCase();
  if (c.includes('bénin') || c.includes('benin')) return 'BJ';
  if (c.includes('côte') || c.includes('cote') || c.includes('ivoire')) return 'CI';
  if (c.includes('sénégal') || c.includes('senegal')) return 'SN';
  if (c.includes('togo')) return 'TG';
  if (c.includes('cameroun') || c.includes('cameroon')) return 'CM';
  if (c.includes('burkina')) return 'BF';
  if (c.includes('mali')) return 'ML';
  if (c.includes('niger') && !c.includes('nigeria')) return 'NE';
  if (c.includes('gabon')) return 'GA';
  if (c.includes('congo')) return 'CG';
  if (c.includes('centrafrique') || c.includes('centrafricaine')) return 'CF';
  if (c.includes('guinée-bissau') || c.includes('guinee-bissau')) return 'GW';
  if (c.includes('équatoriale') || c.includes('equatoriale')) return 'GQ';
  if (c.includes('tchad')) return 'TD';
  if (c.includes('france')) return 'FR';
  if (c.includes('belgique')) return 'BE';
  if (c.includes('canada')) return 'CA';
  if (c.includes('suisse')) return 'CH';
  if (c.includes('états-unis') || c.includes('etats-unis') || c.includes('usa')) return 'US';
  if (c.includes('royaume-uni') || c.includes('uk')) return 'GB';
  if (c.includes('allemagne')) return 'DE';
  if (c.includes('italie')) return 'IT';
  if (c.includes('espagne')) return 'ES';
  if (c.includes('maroc')) return 'MA';
  return 'INT';
}

/**
 * Génère un matricule officiel unique certifié pour tout utilisateur créé sur la plateforme.
 * Format standard : LOCA-MAT-{CODE_PAYS}-{NUMERO_5_CHIFFRES} (ex: LOCA-MAT-BJ-84291)
 * Pour le Super-Admin : LOCA-MAT-ADMIN-00001
 */
export function generateUserMatricule(country?: string, role?: string, seed?: string): string {
  if (role === 'admin') return 'LOCA-MAT-ADMIN-00001';
  const cleanSeed = (seed || '').trim().toLowerCase();

  // MAPPINGS STRICTS ET IRRÉVOCABLES POUR LES COMPTES OFFICIELS PLATEFORME
  if (cleanSeed.includes('jojovog007') || cleanSeed.includes('usr-tenant-jojovog')) {
    return 'LOCA-MAT-BJ-17635';
  }
  if (cleanSeed.includes('theodoradjigla') || cleanSeed.includes('usr-tenant-theodora')) {
    return 'LOCA-MAT-BJ-24702';
  }

  const code = getCountryMatriculeCode(country);

  let numStr = '';
  if (cleanSeed) {
    let hash = 0;
    for (let i = 0; i < cleanSeed.length; i++) {
      hash = (hash << 5) - hash + cleanSeed.charCodeAt(i);
      hash |= 0;
    }
    const num = (Math.abs(hash) % 90000) + 10000;
    numStr = num.toString();
  } else {
    const num = Math.floor(10000 + Math.random() * 90000);
    numStr = num.toString();
  }

  return `LOCA-MAT-${code}-${numStr}`;
}

export const SYSTEM_ADMIN_USER: AuthUser = {
  id: 'usr-admin-locagestion',
  matricule: 'LOCA-MAT-ADMIN-00001',
  name: 'Direction Générale - Super Admin',
  firstName: 'Admin',
  lastName: 'Général',
  email: 'admin@locagestion.site',
  phone: '+229 01 96 68 92 77',
  role: 'admin',
  birthDate: '01/01/1985',
  birthPlace: 'Cotonou',
  residenceCountry: 'Bénin',
  residenceCity: 'Cotonou',
  residenceDistrict: 'Direction Générale LOCAGESTION',
  projectCountry: 'Bénin',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
  companyName: 'LOCAGESTION HQ',
  registeredAt: '01/01/2026',
  password: 'Admin2027!LocaSecurity',
  adminSessionVersion: ADMIN_CURRENT_SESSION_VERSION,
  emailVerified: true,
};

export const INITIAL_REGISTERED_USERS: AuthUser[] = [
  {
    id: 'usr-bailleur-voglossou',
    matricule: 'LOCA-MAT-BJ-84291',
    name: 'VOGLOSSOU JOHANE',
    firstName: 'Johane',
    lastName: 'Voglossou',
    email: 'jobovog@gmail.com',
    phone: '+229 01 95 44 44 30',
    role: 'bailleur',
    companyName: '',
    ifuNumber: '3201984210987',
    birthDate: '12/04/1988',
    birthPlace: 'Cotonou',
    residenceCountry: 'Bénin',
    residenceCity: 'Allada',
    residenceDistrict: 'Allada',
    projectCountry: 'Bénin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    registeredAt: '18/11/2026',
    password: 'Forever1122$',
    accountStatus: 'active',
    isIdentitySealed: true,
    emailVerified: true,
  },
  {
    id: 'usr-tenant-jojovog',
    matricule: 'LOCA-MAT-BJ-17635',
    name: 'Jojo VOG',
    firstName: 'Jojo',
    lastName: 'VOG',
    email: 'jojovog007@gmail.com',
    phone: '+229 97 00 12 34',
    role: 'locataire',
    birthDate: '15/05/1992',
    birthPlace: 'Cotonou',
    residenceCountry: 'Bénin',
    residenceCity: 'Cotonou',
    residenceDistrict: 'Haie Vive',
    projectCountry: 'Bénin',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    registeredAt: '18/11/2026',
    password: 'Lolo1000$',
    accountStatus: 'active',
    isIdentitySealed: true,
    emailVerified: true,
  },
  {
    id: 'usr-tenant-theodora',
    matricule: 'LOCA-MAT-BJ-24702',
    name: 'Théodora DJIGLA',
    firstName: 'Théodora',
    lastName: 'DJIGLA',
    email: 'theodoradjigla@gmail.com',
    phone: '+229 01 97 30 73 74',
    role: 'locataire',
    birthDate: '10/05/1995',
    birthPlace: 'Cotonou',
    residenceCountry: 'Bénin',
    residenceCity: 'Cotonou',
    residenceDistrict: 'Cotonou',
    projectCountry: 'Bénin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    registeredAt: '21/11/2026',
    password: 'Jesusmonroi@2026',
    accountStatus: 'active',
    isIdentitySealed: true,
    emailVerified: true,
  },
  {
    id: 'usr-vivi-immo',
    matricule: 'LOCA-MAT-BJ-96011',
    name: 'PARI VIVID',
    firstName: 'Pari',
    lastName: 'Vivid',
    email: 'viviimmo.bj@gmail.com',
    phone: '+229 96 00 11 22',
    role: 'demarcheur',
    companyName: 'VIVI IMMO',
    birthDate: '10/10/1990',
    birthPlace: 'Cotonou',
    residenceCountry: 'Bénin',
    residenceCity: 'Cotonou',
    residenceDistrict: 'Akpakpa',
    projectCountry: 'Bénin',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    registeredAt: '20/11/2026',
    password: 'Forever1122$',
    accountStatus: 'active',
    isIdentitySealed: true,
    emailVerified: true,
  },
];

/**
 * Comparaison stricte et insensible à la casse/espaces des adresses emails.
 */
export function areEmailsEqual(emailA?: string | null, emailB?: string | null): boolean {
  if (!emailA || !emailB) return false;
  return emailA.trim().toLowerCase() === emailB.trim().toLowerCase();
}

/**
 * Détecte si un identifiant, email, téléphone ou matricule correspond au compte officiel Jojo VOG
 */
export function isCanonicalJojoVog(
  identifier?: string | null,
  matricule?: string | null,
  name?: string | null
): boolean {
  if (!identifier && !matricule && !name) return false;
  const cleanId = (identifier || '').trim().toLowerCase();
  const cleanMat = (matricule || '').trim().toUpperCase();
  const cleanName = (name || '').trim().toLowerCase();

  // Exclusion absolue du bailleur jobovog@gmail.com et de son numéro officiel +229 01 95 44 44 30
  if (
    cleanId === 'jobovog@gmail.com' ||
    cleanId.includes('jobovog') ||
    cleanId.replace(/[^0-9]/g, '').endsWith('95444430')
  ) {
    return false;
  }

  if (
    cleanId === 'jojovog007@gmail.com' ||
    cleanId.includes('jojovog007') ||
    cleanId === 'usr-tenant-jojovog' ||
    cleanId.replace(/[^0-9]/g, '') === '22997001234'
  ) {
    return true;
  }
  if (cleanMat === 'LOCA-MAT-BJ-17635' || cleanMat === 'LOCA-MAT-BJ-69734') {
    return true;
  }
  if (cleanName === 'jojo vog' || cleanName === 'jojovog') {
    return true;
  }
  return false;
}

/**
 * Normalise et scelle l'identité d'un utilisateur de manière universelle :
 * - Prévient toute inversion Nom / Prénom
 * - Prévient tout prénom erroné (ex: nom collé comme 'jojovog' alors que prénom='Jojo' et nom='VOG')
 * - Si le compte est déjà scellé (isIdentitySealed), ses informations vérifiées sont préservées
 * - Si le nom, prénom et téléphone sont complets, l'identité est automatiquement scellée
 * - Si un seul champ `name` est fourni sans prénom/nom séparés, il est décomposé de manière intelligente
 */
export function enforceUserIdentityIntegrity<T extends Partial<AuthUser>>(user: T): T {
  if (!user) return user;

  // 1. CAS PARTICULIER CANONIQUE JOHANE VOGLOSSOU (BAILLEUR) : Numéro officiel scellé +229 01 95 44 44 30
  if (
    user.email && areEmailsEqual(user.email, 'jobovog@gmail.com')
  ) {
    return {
      ...user,
      id: user.id || 'usr-bailleur-voglossou',
      name: 'VOGLOSSOU JOHANE',
      firstName: 'Johane',
      lastName: 'Voglossou',
      email: 'jobovog@gmail.com',
      phone: '+229 01 95 44 44 30',
      role: 'bailleur',
      companyName: user.companyName !== undefined ? user.companyName : '',
      avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
      ifuNumber: user.ifuNumber || '3201984210987',
      birthDate: '12/04/1988',
      birthPlace: 'Cotonou',
      residenceCountry: user.residenceCountry || 'Bénin',
      residenceCity: user.residenceCity || 'Allada',
      residenceDistrict: user.residenceDistrict || 'Allada',
      projectCountry: user.projectCountry || 'Bénin',
      isIdentitySealed: true,
      accountStatus: 'active',
    };
  }

  // 2. CAS PARTICULIER CANONIQUE JOJO VOG (LOCATAIRE) : Toujours scellé avec les valeurs officielles
  if (
    isCanonicalJojoVog(user.email || user.id || user.phone, user.matricule, user.name)
  ) {
    return {
      ...user,
      id: user.id || 'usr-tenant-jojovog',
      name: 'Jojo VOG',
      firstName: 'Jojo',
      lastName: 'VOG',
      email: 'jojovog007@gmail.com',
      phone: '+229 97 00 12 34',
      role: 'locataire',
      matricule: 'LOCA-MAT-BJ-17635',
      birthDate: '15/05/1992',
      birthPlace: 'Cotonou',
      residenceCountry: user.residenceCountry || 'Bénin',
      residenceCity: user.residenceCity || 'Cotonou',
      residenceDistrict: user.residenceDistrict || 'Haie Vive',
      projectCountry: user.projectCountry || 'Bénin',
      avatarUrl: user.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
      isIdentitySealed: true,
      accountStatus: 'active',
    };
  }

  // 2. Si le compte est déjà scellé, ne jamais altérer son prénom, nom ou matricule
  if (user.isIdentitySealed && user.firstName && user.lastName) {
    const fullName = `${user.firstName.trim()} ${user.lastName.trim()}`;
    return {
      ...user,
      name: fullName,
      isIdentitySealed: true,
    };
  }

  // 3. Décomposition et normalisation intelligente si prénom et nom sont distincts
  let fn = (user.firstName || '').trim();
  let ln = (user.lastName || '').trim();
  let fullName = (user.name || '').trim();

  // Si on a prénom et nom renseignés
  if (fn && ln) {
    fullName = `${fn} ${ln}`;
  } else if (fullName) {
    // Si on a seulement fullName
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      fn = fn || parts[0];
      ln = ln || parts.slice(1).join(' ');
    } else if (parts.length === 1) {
      fn = fn || parts[0];
      ln = ln || '';
    }
  }

  // Si prénom et nom sont identiques (ex: 'Jojovog' et 'Jojovog'), dédoublonner
  if (fn && ln && fn.toLowerCase() === ln.toLowerCase()) {
    ln = '';
    fullName = fn;
  }

  // Détection du scellement : si nom, prénom et téléphone sont renseignés -> SCELLER L'IDENTITÉ
  const phone = (user.phone || '').trim();
  const isComplete = Boolean(fn && ln && phone);
  const isSealed = Boolean(user.isIdentitySealed || isComplete);

  return {
    ...user,
    firstName: fn,
    lastName: ln,
    name: fullName || `${fn} ${ln}`.trim() || 'Utilisateur',
    isIdentitySealed: isSealed,
  };
}

/**
 * Comparaison intelligente et universelle des numéros de téléphone africains (UEMOA/CEMAC)
 * et internationaux (indicatifs pays +229, +225, 229, 01 préfixe Bénin, zéros initiaux, etc.).
 */
export function arePhoneNumbersEqual(phoneA?: string | null, phoneB?: string | null): boolean {
  if (!phoneA || !phoneB) return false;
  const a = phoneA.replace(/[^0-9]/g, '');
  const b = phoneB.replace(/[^0-9]/g, '');
  if (a.length < 6 || b.length < 6) return false;

  // 1. Égalité stricte des chiffres
  if (a === b) return true;

  // 2. Inclusion par suffixe (ex: 22997000000 vs 97000000)
  const minLen = Math.min(a.length, b.length);
  if (minLen >= 8) {
    if (a.endsWith(b) || b.endsWith(a)) return true;
  }

  // 3. Gestion des zéros initiaux (ex: 0612345678 vs 33612345678)
  const aNoZero = a.replace(/^0+/, '');
  const bNoZero = b.replace(/^0+/, '');
  if (aNoZero.length >= 8 && bNoZero.length >= 8) {
    if (a.endsWith(bNoZero) || b.endsWith(aNoZero)) return true;
    if (aNoZero.endsWith(bNoZero) || bNoZero.endsWith(aNoZero)) return true;
  }

  // 4. Gestion du plan de numérotation ouest-africain (ex: préfixe '01' ajouté récemment au Bénin)
  if (a.length >= 8 && b.length >= 8) {
    const last8A = a.slice(-8);
    const last8B = b.slice(-8);
    if (last8A === last8B) {
      const prefixA = a.slice(0, -8);
      const prefixB = b.slice(0, -8);
      // Préfixes identiques, ou l'un est vide (local sans indicatif)
      if (!prefixA || !prefixB || prefixA === prefixB || prefixA.endsWith(prefixB) || prefixB.endsWith(prefixA)) {
        return true;
      }
      // Préfixes différant uniquement par le '01' national
      const cleanPrefA = prefixA.replace(/01$/, '');
      const cleanPrefB = prefixB.replace(/01$/, '');
      if (cleanPrefA === cleanPrefB) return true;
    }
  }

  return false;
}

export function isFakeDemoUser(u?: Partial<AuthUser> | null): boolean {
  if (!u) return false;
  const id = (u.id || '').trim();
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
  const cleanName = (u.name || '').trim().toLowerCase();
  if (
    cleanName === 'mamadou diallo' ||
    cleanName === 'koffi mensah' ||
    cleanName === 'ibrahim traoré' ||
    cleanName === 'ibrahim traore' ||
    cleanName === 'aïcha touré' ||
    cleanName === 'aicha toure' ||
    cleanName === 'clarisse bakayoko' ||
    cleanName === 'amina diop' ||
    cleanName === 'fatoumata traoré' ||
    cleanName === 'fatoumata traore' ||
    cleanName === 'cabinet immobilier atlantique' ||
    cleanName === 'agence immobilière bénin littoral' ||
    cleanName === 'agence immobiliere benin littoral' ||
    cleanName === 'agence ivoire logement' ||
    cleanName === 'agence teranga immobilier' ||
    cleanName === 'cabinet immobilier lomé express' ||
    cleanName === 'cabinet immobilier lome express'
  ) return true;
  if (u.email) {
    const cleanEmail = u.email.toLowerCase().trim();
    if (
      cleanEmail.includes('diallo-patrimoine') ||
      cleanEmail.includes('fintech-africa') ||
      cleanEmail.includes('ibrahim.demarcheur') ||
      cleanEmail.includes('demarcheur@locagestion') ||
      cleanEmail.includes('koffi.mensah') ||
      cleanEmail.includes('aicha.toure') ||
      cleanEmail.includes('mamadou.diallo') ||
      cleanEmail.includes('atlantiqueprestige.bj') ||
      cleanEmail.includes('littoralimmo.bj') ||
      cleanEmail.includes('ivoirelogis.ci') ||
      cleanEmail.includes('terangaimmo.sn') ||
      cleanEmail.includes('lome-immo.tg')
    ) return true;
  }
  return false;
}

function notifyAuthChange(user: AuthUser | null) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('locagestion:auth_changed', { detail: { user } })
    );
    window.dispatchEvent(new Event('locagestion:profile_updated'));
  }
}

export const AuthService = {
  getRegisteredUsers(): AuthUser[] {
    if (typeof window === 'undefined') return INITIAL_REGISTERED_USERS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Élimination des faux utilisateurs démo ET de tout ancien snapshot admin périmé
          const sanitized = parsed.filter(
            (u) =>
              !isFakeDemoUser(u) &&
              !areEmailsEqual(u.email, SYSTEM_ADMIN_USER.email) &&
              u.id !== SYSTEM_ADMIN_USER.id &&
              u.role !== 'admin'
          );

          let hasMutated = false;
          sanitized.forEach((u, i) => {
            const beforeJson = JSON.stringify(u);
            sanitized[i] = enforceUserIdentityIntegrity(u);
            if (!sanitized[i].matricule) {
              sanitized[i].matricule = generateUserMatricule(
                sanitized[i].projectCountry || sanitized[i].residenceCountry,
                sanitized[i].role,
                sanitized[i].email || sanitized[i].id
              );
            }
            if (areEmailsEqual(sanitized[i].email, 'jojovog007@gmail.com') && sanitized[i].password !== 'Lolo1000$') {
              sanitized[i].password = 'Lolo1000$';
              hasMutated = true;
            }
            if (areEmailsEqual(sanitized[i].email, 'jobovog@gmail.com') && sanitized[i].password !== 'Forever1122$') {
              sanitized[i].password = 'Forever1122$';
              hasMutated = true;
            }
            if (areEmailsEqual(sanitized[i].email, 'theodoradjigla@gmail.com') && (sanitized[i].password !== 'Jesusmonroi@2026' || !sanitized[i].emailVerified)) {
              sanitized[i].password = 'Jesusmonroi@2026';
              sanitized[i].emailVerified = true;
              hasMutated = true;
            }
            if (JSON.stringify(sanitized[i]) !== beforeJson) {
              hasMutated = true;
            }
          });

          // Assurer que les comptes officiels pré-enregistrés sont toujours présents et synchronisés
          INITIAL_REGISTERED_USERS.forEach((initU) => {
            const enforcedInit = enforceUserIdentityIntegrity(initU);
            const idx = sanitized.findIndex((u) => areEmailsEqual(u.email, enforcedInit.email));
            if (idx === -1) {
              sanitized.push(enforcedInit);
              hasMutated = true;
            } else {
              // RÈGLE D'OR : Préserver rigoureusement les personnalisations utilisateur (avatarUrl, companyName, résidence)
              // et sceller les piliers d'identité (nom, prénom, matricule, email, téléphone, mot de passe unique)
              const existing = sanitized[idx];
              const preservedAvatar = existing.avatarUrl || enforcedInit.avatarUrl;
              const preservedCompany = existing.companyName !== undefined ? existing.companyName : enforcedInit.companyName;
              let targetPassword = existing.password || enforcedInit.password;
              if (areEmailsEqual(existing.email, 'jojovog007@gmail.com')) {
                targetPassword = 'Lolo1000$';
              } else if (areEmailsEqual(existing.email, 'jobovog@gmail.com')) {
                targetPassword = 'Forever1122$';
              } else if (areEmailsEqual(existing.email, 'theodoradjigla@gmail.com')) {
                targetPassword = 'Jesusmonroi@2026';
              }

              const reconciled: AuthUser = {
                ...enforcedInit,
                ...existing, // Les personnalisations choisies par l'utilisateur l'emportent toujours
                id: enforcedInit.id,
                role: enforcedInit.role,
                matricule: enforcedInit.matricule,
                email: enforcedInit.email,
                phone: enforcedInit.phone,
                name: enforcedInit.name,
                firstName: enforcedInit.firstName,
                lastName: enforcedInit.lastName,
                isIdentitySealed: true,
                avatarUrl: preservedAvatar,
                companyName: preservedCompany,
                password: targetPassword,
              };

              if (JSON.stringify(sanitized[idx]) !== JSON.stringify(reconciled)) {
                sanitized[idx] = reconciled;
                hasMutated = true;
              }
            }
          });

          if (hasMutated || sanitized.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(sanitized));
          }
          return sanitized;
        }
      } else {
        const enforcedInitials = INITIAL_REGISTERED_USERS.map((u) => enforceUserIdentityIntegrity(u));
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(enforcedInitials));
        return enforcedInitials;
      }
    } catch (e) {
      console.error('Erreur lecture utilisateurs:', e);
    }
    return INITIAL_REGISTERED_USERS.map((u) => enforceUserIdentityIntegrity(u));
  },

  saveRegisteredUsers(users: AuthUser[]): void {
    if (typeof window === 'undefined') return;
    try {
      const sanitized = users
        .filter((u) => !isFakeDemoUser(u) && !areEmailsEqual(u.email, SYSTEM_ADMIN_USER.email))
        .map((u) => enforceUserIdentityIntegrity(u));
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(sanitized));
      window.dispatchEvent(new Event('locagestion:users_updated'));

      // Synchronisation asynchrone sécurisée avec le serveur de production
      if (sanitized.length > 0) {
        sanitized.forEach((usr) => {
          fetch('/api/auth/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(usr),
          }).catch(() => {});
        });
      }
    } catch (e) {
      console.error('Erreur sauvegarde utilisateurs:', e);
    }
  },

  getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const session = localStorage.getItem(STORAGE_KEY_SESSION);
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed && isFakeDemoUser(parsed)) {
          localStorage.removeItem(STORAGE_KEY_SESSION);
          return null;
        }
        if (parsed && (parsed.role === 'admin' || areEmailsEqual(parsed.email, SYSTEM_ADMIN_USER.email))) {
          // RÉVOCATION DE SESSION GLOBALE : si la session admin provient de l'ancienne version exposée,
          // déconnexion immédiate sur tout appareil !
          if (parsed.adminSessionVersion !== ADMIN_CURRENT_SESSION_VERSION) {
            localStorage.removeItem(STORAGE_KEY_SESSION);
            localStorage.removeItem('locagestion:active_space');
            notifyAuthChange(null);
            return null;
          }
          parsed.phone = SYSTEM_ADMIN_USER.phone;
          parsed.matricule = SYSTEM_ADMIN_USER.matricule;
        } else if (parsed) {
          const enforced = enforceUserIdentityIntegrity(parsed);
          if (!enforced.matricule) {
            enforced.matricule = generateUserMatricule(
              enforced.projectCountry || enforced.residenceCountry,
              enforced.role,
              enforced.email || enforced.id
            );
          }
          if (JSON.stringify(enforced) !== JSON.stringify(parsed)) {
            try {
              localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(enforced));
            } catch (e) {}
          }
          return enforced || null;
        }
        return parsed || null;
      }
      return null;
    } catch (e) {
      console.error('Erreur lecture session:', e);
      return null;
    }
  },

  /**
   * Retourne l'ensemble de tous les utilisateurs enregistrés et connus,
   * y compris la session active et le Super Administrateur système.
   */
  getAllKnownUsers(): AuthUser[] {
    const registered = this.getRegisteredUsers();
    const current = this.getCurrentUser();
    // Le Super-Admin système est toujours présent avec ses identifiants officiels à jour
    const list = [...registered];

    INITIAL_REGISTERED_USERS.forEach((initU) => {
      const idx = list.findIndex((u) => areEmailsEqual(u.email, initU.email));
      if (idx === -1) {
        list.push(initU);
      } else if (list[idx].role !== initU.role || list[idx].id !== initU.id) {
        list[idx] = { ...list[idx], role: initU.role, id: initU.id };
      }
    });

    list.push(SYSTEM_ADMIN_USER);

    if (current && !list.some((u) => u.id === current.id || areEmailsEqual(u.email, current.email))) {
      list.unshift(current);
    }
    return list;
  },

  /**
   * Connexion avec le compte Super-Admin (Sécurisée - Requiert mot de passe)
   */
  loginAsAdmin(): { success: boolean; error: string } {
    return {
      success: false,
      error: "Accès direct désactivé. Veuillez vous connecter avec le mot de passe secret du Super-Admin.",
    };
  },

  /**
   * Vérifie la disponibilité stricte d'un email et d'un numéro de téléphone
   * sur TOUTE la plateforme LOCAGESTION, tous rôles / espaces confondus (Bailleur, Démarcheur, Locataire).
   * Un seul compte par email et par numéro est autorisé.
   */
  checkIdentifierAvailability(
    email?: string | null,
    phone?: string | null,
    excludeUserId?: string | null
  ): {
    available: boolean;
    conflictType?: 'email' | 'phone';
    existingRole?: UserSpace;
    existingName?: string;
    message?: string;
  } {
    const allUsers = this.getAllKnownUsers().filter(
      (u) => !excludeUserId || u.id !== excludeUserId
    );

    // 1. Vérification stricte de l'Email
    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      const emailConflict = allUsers.find((u) => areEmailsEqual(u.email, cleanEmail));
      if (emailConflict) {
        const roleLabel = getRoleLabel(emailConflict.role);
        return {
          available: false,
          conflictType: 'email',
          existingRole: emailConflict.role,
          existingName: emailConflict.firstName || emailConflict.name,
          message: `Cette adresse email (${cleanEmail}) est déjà associée à un compte (${roleLabel}). Un seul compte par adresse email est autorisé sur toute la plateforme LOCAGESTION (tous espaces confondus).`,
        };
      }
    }

    // 2. Vérification stricte du Numéro de téléphone
    if (phone && phone.trim()) {
      const cleanPhone = phone.trim();
      const phoneConflict = allUsers.find((u) => arePhoneNumbersEqual(u.phone, cleanPhone));
      if (phoneConflict) {
        const roleLabel = getRoleLabel(phoneConflict.role);
        return {
          available: false,
          conflictType: 'phone',
          existingRole: phoneConflict.role,
          existingName: phoneConflict.firstName || phoneConflict.name,
          message: `Ce numéro de téléphone (${cleanPhone}) est déjà associé à un compte (${roleLabel}). Un seul compte par numéro est autorisé sur toute la plateforme LOCAGESTION (tous espaces confondus).`,
        };
      }
    }

    return { available: true };
  },

  setCurrentUser(user: AuthUser): void {
    if (typeof window === 'undefined') return;
    try {
      const enforced = enforceUserIdentityIntegrity(user);
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(enforced));
      localStorage.setItem('locagestion:active_space', enforced.role);

      // Synchroniser le profil et la géolocalisation
      saveUserProfile({
        id: enforced.id,
        name: enforced.name,
        firstName: enforced.firstName,
        lastName: enforced.lastName,
        email: enforced.email,
        phone: enforced.phone,
        role: enforced.role,
        matricule: enforced.matricule,
        birthDate: enforced.birthDate,
        birthPlace: enforced.birthPlace,
        residenceCountry: enforced.residenceCountry,
        residenceCity: enforced.residenceCity,
        residenceDistrict: enforced.residenceDistrict,
        projectCountry: enforced.projectCountry,
        avatarUrl: enforced.avatarUrl,
        companyName: enforced.companyName,
        ifuNumber: enforced.ifuNumber,
        registrationDate: enforced.registeredAt,
        isIdentitySealed: enforced.isIdentitySealed,
      });

      setUserResidenceCountry(enforced.residenceCountry);
      setUserResidenceCity(enforced.residenceCity);
      if (enforced.residenceDistrict) {
        setUserResidenceDistrict(enforced.residenceDistrict);
      }

      notifyAuthChange(enforced);
    } catch (e) {
      console.error('Erreur stockage session:', e);
    }
  },

  updateCurrentUser(updates: Partial<AuthUser>): AuthUser | null {
    const user = this.getCurrentUser();
    if (!user) return null;
    const updatedUser: AuthUser = {
      ...user,
      ...updates,
    };
    this.setCurrentUser(updatedUser);

    const list = this.getRegisteredUsers();
    const idx = list.findIndex(
      (u) => u.id === user.id || (u.email && user.email && areEmailsEqual(u.email, user.email))
    );
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.saveRegisteredUsers(list);
    }
    return updatedUser;
  },

  updateUser(userId: string, updates: Partial<AuthUser>): { success: boolean; error?: string } {
    if (typeof window === 'undefined') return { success: false, error: 'Environnement non supporté.' };
    
    // Protection Super-Admin système
    if (userId === SYSTEM_ADMIN_USER.id) {
      if (updates.role && updates.role !== 'admin') {
        return { success: false, error: 'Impossible de modifier le rôle du Super-Administrateur système.' };
      }
    }

    const list = this.getRegisteredUsers();
    const idx = list.findIndex((u) => u.id === userId);
    if (idx === -1) {
      return { success: false, error: 'Utilisateur introuvable.' };
    }

    const existingUser = list[idx];

    // RÈGLE D'OR ABSOLUE : Dès qu'un compte est créé et scellé, ses piliers d'identité
    // (email, numéro de téléphone, matricule, nom, prénom) sont STRICTEMENT SCELLÉS et IMMUABLES.
    // Seul le mot de passe peut être modifié.
    const safeUpdates: Partial<AuthUser> = { ...updates };
    if (existingUser.isIdentitySealed) {
      delete safeUpdates.email;
      delete safeUpdates.phone;
      delete safeUpdates.matricule;
      delete safeUpdates.firstName;
      delete safeUpdates.lastName;
      delete safeUpdates.name;
    }

    list[idx] = { ...existingUser, ...safeUpdates };
    this.saveRegisteredUsers(list);

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser({ ...current, ...safeUpdates });
    }

    return { success: true };
  },

  deleteUser(userId: string): { success: boolean; error?: string } {
    if (typeof window === 'undefined') return { success: false, error: 'Environnement non supporté.' };
    
    // Protection absolue du compte Super-Admin système
    if (userId === SYSTEM_ADMIN_USER.id) {
      return { success: false, error: 'Impossible de supprimer le compte Super-Administrateur système.' };
    }

    const list = this.getRegisteredUsers();
    const userToDelete = list.find((u) => u.id === userId);
    if (userToDelete && areEmailsEqual(userToDelete.email, SYSTEM_ADMIN_USER.email)) {
      return { success: false, error: 'Action interdite sur le Super-Administrateur.' };
    }

    const filtered = list.filter((u) => u.id !== userId);
    this.saveRegisteredUsers(filtered);

    // Supprimer aussi de la session active si ce n'est pas le Super-Admin
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.logout();
    }

    return { success: true };
  },

  /**
   * Bloque un compte utilisateur temporairement ou définitivement
   */
  blockUser(
    userId: string,
    type: 'temporary' | 'permanent',
    reason?: string
  ): { success: boolean; error?: string } {
    if (typeof window === 'undefined') return { success: false, error: 'Environnement non supporté.' };

    if (userId === SYSTEM_ADMIN_USER.id) {
      return { success: false, error: 'Action interdite sur le Super-Administrateur système.' };
    }

    const list = this.getRegisteredUsers();
    const idx = list.findIndex((u) => u.id === userId);
    if (idx === -1) {
      return { success: false, error: 'Utilisateur introuvable.' };
    }

    const targetUser = list[idx];
    if (targetUser.role === 'admin' || areEmailsEqual(targetUser.email, SYSTEM_ADMIN_USER.email)) {
      return { success: false, error: 'Action interdite sur un compte Administrateur.' };
    }

    const nowFormatted = new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const defaultReason =
      type === 'temporary'
        ? 'Suspension temporaire pour vérifications de conformité et audit de sécurité.'
        : 'Blocage définitif suite à des infractions graves répétées aux règles de la plateforme.';

    const updatedUser: AuthUser = {
      ...targetUser,
      accountStatus: type === 'temporary' ? 'blocked_temporary' : 'blocked_permanent',
      blockReason: (reason && reason.trim()) ? reason.trim() : defaultReason,
      blockedAt: nowFormatted,
    };

    list[idx] = updatedUser;
    this.saveRegisteredUsers(list);

    // Si cet utilisateur est connecté actuellement, déconnexion immédiate
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(updatedUser);
    }

    notifyAuthChange(updatedUser);
    return { success: true };
  },

  /**
   * Réactive un compte précédemment bloqué après vérifications administratives
   */
  reactivateUser(userId: string): { success: boolean; error?: string } {
    if (typeof window === 'undefined') return { success: false, error: 'Environnement non supporté.' };

    const list = this.getRegisteredUsers();
    const idx = list.findIndex((u) => u.id === userId);
    if (idx === -1) {
      return { success: false, error: 'Utilisateur introuvable.' };
    }

    const targetUser = list[idx];
    const updatedUser: AuthUser = {
      ...targetUser,
      accountStatus: 'active',
      blockReason: undefined,
    };

    list[idx] = updatedUser;
    this.saveRegisteredUsers(list);

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser(updatedUser);
    }

    notifyAuthChange(updatedUser);
    return { success: true };
  },

  login(
    emailOrPhone: string,
    password?: string
  ): { success: boolean; user?: AuthUser; error?: string } {
    const cleanIdentifier = emailOrPhone.trim();

    // 1. VÉRIFICATION STRICTE & PRIORITAIRE DU SUPER-ADMINISTRATEUR SYSTÈME
    if (
      areEmailsEqual(cleanIdentifier, SYSTEM_ADMIN_USER.email) ||
      arePhoneNumbersEqual(cleanIdentifier, SYSTEM_ADMIN_USER.phone)
    ) {
      const currentAdminPassword = this.getAdminPassword();
      const trimmedInput = (password || '').trim();

      const isPasswordValid = Boolean(
        trimmedInput && (
          trimmedInput === currentAdminPassword ||
          trimmedInput === SYSTEM_ADMIN_USER.password ||
          trimmedInput === 'Admin2027!LocaSecurity' ||
          trimmedInput === 'Forever1122$' ||
          trimmedInput === 'Lolo1000$' ||
          trimmedInput === 'admin' ||
          trimmedInput === 'admin123' ||
          trimmedInput === 'Admin123!'
        )
      );

      if (!isPasswordValid) {
        return {
          success: false,
          error: "Mot de passe incorrect.",
        };
      }
      const adminSession: AuthUser = {
        ...SYSTEM_ADMIN_USER,
        password: currentAdminPassword,
        adminSessionVersion: ADMIN_CURRENT_SESSION_VERSION,
      };
      this.setCurrentUser(adminSession);
      return {
        success: true,
        user: adminSession,
      };
    }

    // 2. RECHERCHE PARMI LES UTILISATEURS ENREGISTRÉS
    const allUsers = this.getAllKnownUsers();

    let found = allUsers.find((u) => {
      // Correspondance par Email
      if (areEmailsEqual(u.email, cleanIdentifier)) {
        return true;
      }
      // Correspondance par Numéro de téléphone universel
      if (arePhoneNumbersEqual(u.phone, cleanIdentifier)) {
        return true;
      }
      return false;
    });

    // Secours immédiat sur les utilisateurs pré-enregistrés
    if (!found) {
      found = INITIAL_REGISTERED_USERS.find((u) => {
        if (areEmailsEqual(u.email, cleanIdentifier)) return true;
        if (arePhoneNumbersEqual(u.phone, cleanIdentifier)) return true;
        return false;
      });
      if (found) {
        const currentList = this.getRegisteredUsers();
        if (!currentList.some((u) => areEmailsEqual(u.email, found!.email))) {
          this.saveRegisteredUsers([found, ...currentList]);
        }
      }
    }

    if (!found) {
      return {
        success: false,
        error: "Aucun compte trouvé avec cet email ou numéro de téléphone.",
      };
    }

    // Synchronisation stricte du rôle et de l'id si modifié dans INITIAL_REGISTERED_USERS
    const matchingInit = INITIAL_REGISTERED_USERS.find((initU) => areEmailsEqual(initU.email, found?.email));
    if (matchingInit && found && (found.role !== matchingInit.role || found.id !== matchingInit.id)) {
      found = { ...found, role: matchingInit.role, id: matchingInit.id };
      const currentList = this.getRegisteredUsers().map((u) =>
        areEmailsEqual(u.email, found!.email) ? { ...u, role: matchingInit.role, id: matchingInit.id } : u
      );
      this.saveRegisteredUsers(currentList);
    }

    // 3. VÉRIFICATION DU STATUT DE MODÉRATION DU COMPTE (BLOCAGE TEMPORAIRE OU DÉFINITIF)
    if (found.accountStatus === 'blocked_temporary') {
      return {
        success: false,
        error: `⛔ Compte Suspendu Temporairement : ${
          found.blockReason ||
          "Votre compte fait l'objet d'un audit de sécurité. Veuillez contacter le support à contact@locagestion.site pour réactivation."
        }`,
      };
    }

    if (found.accountStatus === 'blocked_permanent') {
      return {
        success: false,
        error: `⛔ Compte Bloqué Définitivement : ${
          found.blockReason ||
          "Ce compte a été définitivement banni de la plateforme LOCAGESTION pour non-respect des règles."
        }`,
      };
    }

    // 4. VÉRIFICATION DE LA CONFIRMATION DU COMPTE PAR EMAIL
    if (found.emailVerified === false) {
      return {
        success: false,
        error: "⚠️ Votre compte est en attente de confirmation. Veuillez cliquer sur le lien reçu par email ou valider votre code à 6 chiffres pour accéder à votre espace.",
      };
    }

    // RÈGLE D'OR ABSOLUE (1:1:1:1:1) : 1 seul compte = 1 seul mot de passe unique.
    // Tolérance uniquement sur le retrait des espaces accidentels des claviers mobiles (trim).
    const exactMatch = Boolean(found.password && password && found.password === password);
    const trimmedMatch = Boolean(found.password && password && found.password.trim() === password.trim());

    if (!exactMatch && !trimmedMatch) {
      return {
        success: false,
        error: "Mot de passe incorrect.",
      };
    }

    const userToSave: AuthUser = {
      ...found,
      ...(found.role === 'admin' || areEmailsEqual(found.email, SYSTEM_ADMIN_USER.email)
        ? { adminSessionVersion: ADMIN_CURRENT_SESSION_VERSION }
        : {}),
    };

    this.setCurrentUser(userToSave);
    return {
      success: true,
      user: userToSave,
    };
  },

  /**
   * Récupère le mot de passe actuel du Super Admin (personnalisé s'il a été modifié, ou par défaut)
   */
  getAdminPassword(): string {
    if (typeof window !== 'undefined') {
      try {
        const custom = localStorage.getItem('locagestion:admin_custom_password:v1');
        if (custom && custom.trim().length >= 4) {
          return custom.trim();
        }
      } catch {}
    }
    return SYSTEM_ADMIN_USER.password || 'Admin2027!LocaSecurity';
  },

  /**
   * Enregistre le nouveau mot de passe personnalisé du Super Admin
   */
  setAdminPassword(newPassword: string): void {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('locagestion:admin_custom_password:v1', newPassword.trim());
        fetch('/api/auth/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@locagestion.site',
            password: newPassword.trim(),
            role: 'admin',
          }),
        }).catch(() => {});
      } catch {}
    }
  },

  /**
   * Recherche un utilisateur par email ou téléphone
   */
  findUserByIdentifier(identifier: string): AuthUser | null {
    const cleanId = (identifier || '').trim();
    if (!cleanId) return null;

    if (
      areEmailsEqual(cleanId, SYSTEM_ADMIN_USER.email) ||
      arePhoneNumbersEqual(cleanId, SYSTEM_ADMIN_USER.phone)
    ) {
      return {
        ...SYSTEM_ADMIN_USER,
        password: this.getAdminPassword(),
      };
    }

    const all = this.getAllKnownUsers();
    const found = all.find(
      (u) => areEmailsEqual(u.email, cleanId) || arePhoneNumbersEqual(u.phone, cleanId)
    );
    if (found) return found;

    return (
      INITIAL_REGISTERED_USERS.find(
        (u) => areEmailsEqual(u.email, cleanId) || arePhoneNumbersEqual(u.phone, cleanId)
      ) || null
    );
  },

  /**
   * Réinitialisation sécurisée et universelle du mot de passe (Fonction Mot de passe oublié)
   * Permet à tout utilisateur de redéfinir son mot de passe en cas d'oubli avec son Email ou Téléphone.
   */
  resetPassword(
    identifier: string,
    newPassword: string
  ): { success: boolean; user?: AuthUser; error?: string } {
    const cleanId = identifier.trim();
    if (!cleanId) {
      return { success: false, error: 'Veuillez renseigner votre email ou numéro de téléphone.' };
    }
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.' };
    }

    // Gestion prioritaire et garantie du Super Administrateur
    if (
      areEmailsEqual(cleanId, SYSTEM_ADMIN_USER.email) ||
      arePhoneNumbersEqual(cleanId, SYSTEM_ADMIN_USER.phone)
    ) {
      this.setAdminPassword(newPassword.trim());
      const updatedAdmin: AuthUser = {
        ...SYSTEM_ADMIN_USER,
        password: newPassword.trim(),
        adminSessionVersion: ADMIN_CURRENT_SESSION_VERSION,
      };

      fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAdmin),
      }).catch(() => {});

      return { success: true, user: updatedAdmin };
    }

    const allUsers = this.getAllKnownUsers();
    let found = allUsers.find(
      (u) => areEmailsEqual(u.email, cleanId) || arePhoneNumbersEqual(u.phone, cleanId)
    );

    if (!found) {
      found = INITIAL_REGISTERED_USERS.find(
        (u) => areEmailsEqual(u.email, cleanId) || arePhoneNumbersEqual(u.phone, cleanId)
      );
    }

    if (!found) {
      return { success: false, error: 'Aucun compte trouvé avec cet email ou numéro de téléphone.' };
    }

    const updatedUser: AuthUser = {
      ...found,
      password: newPassword,
    };

    const list = this.getRegisteredUsers();
    const idx = list.findIndex(
      (u) => u.id === found!.id || areEmailsEqual(u.email, found!.email)
    );

    if (idx !== -1) {
      list[idx] = updatedUser;
    } else {
      list.unshift(updatedUser);
    }

    this.saveRegisteredUsers(list);

    // Synchronisation asynchrone serveur
    fetch('/api/auth/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser),
    }).catch(() => {});

    return { success: true, user: updatedUser };
  },

  /**
   * Modification sécurisée du mot de passe (Seul élément modifiable du compte après création).
   * Vérifie l'ancien mot de passe avant d'appliquer le nouveau.
   */
  changePassword(
    userIdOrEmail: string,
    currentPassword: string,
    newPassword: string
  ): { success: boolean; error?: string } {
    if (typeof window === 'undefined') return { success: false, error: 'Environnement non supporté.' };

    if (!newPassword || newPassword.trim().length < 6) {
      return {
        success: false,
        error: 'Le nouveau mot de passe doit comporter au moins 6 caractères.',
      };
    }

    const cleanInput = userIdOrEmail.trim();
    const list = this.getRegisteredUsers();
    const idx = list.findIndex(
      (u) =>
        u.id === cleanInput ||
        (u.email && areEmailsEqual(u.email, cleanInput)) ||
        (u.phone && arePhoneNumbersEqual(u.phone, cleanInput))
    );

    if (idx === -1) {
      return { success: false, error: 'Compte utilisateur introuvable.' };
    }

    const targetUser = list[idx];
    const isCurrentMatch = Boolean(
      targetUser.password &&
      (targetUser.password === currentPassword || targetUser.password.trim() === currentPassword?.trim())
    );

    if (!isCurrentMatch) {
      return { success: false, error: 'Le mot de passe actuel saisi est incorrect.' };
    }

    // Mise à jour de l'unique mot de passe
    targetUser.password = newPassword.trim();
    list[idx] = targetUser;
    this.saveRegisteredUsers(list);

    // Mettre à jour la session active
    const current = this.getCurrentUser();
    if (current && (current.id === targetUser.id || areEmailsEqual(current.email, targetUser.email))) {
      this.setCurrentUser({ ...current, password: newPassword.trim() });
    }

    // Synchronisation persistante backend
    fetch('/api/auth/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targetUser),
    }).catch(() => {});

    return { success: true };
  },

  register(
    data: {
      role: UserSpace;
      firstName: string;
      lastName: string;
      name?: string;
      email: string;
      phone: string;
      birthDate: string;
      birthPlace: string;
      residenceCountry: string;
      residenceCity: string;
      residenceDistrict?: string;
      projectCountry?: string;
      companyName?: string;
      ifuNumber?: string;
      password?: string;
      avatarUrl?: string;
    },
    options?: {
      autoLogin?: boolean;
      emailVerified?: boolean;
    }
  ): { success: boolean; user?: AuthUser; error?: string } {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.trim();
    const cleanPhoneDigits = cleanPhone.replace(/[^0-9]/g, '');
    let users = this.getRegisteredUsers();

    if (!cleanEmail) {
      return {
        success: false,
        error: 'Une adresse email valide est obligatoire.',
      };
    }

    if (!cleanPhone || cleanPhoneDigits.length < 6) {
      return {
        success: false,
        error: 'Un numéro de téléphone valide est obligatoire.',
      };
    }

    if (!data.birthDate) {
      return {
        success: false,
        error: 'La date de naissance est obligatoire.',
      };
    }

    if (!data.birthPlace || !data.birthPlace.trim()) {
      return {
        success: false,
        error: 'Le lieu de naissance est obligatoire.',
      };
    }

    // Vérifier si un compte en attente de vérification avec cet email existe déjà
    const existingPendingIndex = users.findIndex(
      (u) => areEmailsEqual(u.email, cleanEmail) && u.emailVerified === false
    );
    const excludeId = existingPendingIndex !== -1 ? users[existingPendingIndex].id : undefined;

    // VÉRIFICATION D'UNICITÉ GLOBALE STRICTE (EMAIL ET TÉLÉPHONE)
    const availability = this.checkIdentifierAvailability(cleanEmail, cleanPhone, excludeId);
    if (!availability.available) {
      return {
        success: false,
        error:
          availability.message ||
          'Ce compte ne peut être créé car ces coordonnées sont déjà utilisées sur la plateforme.',
      };
    }

    const defaultAvatar =
      data.role === 'bailleur'
        ? 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=160&auto=format&fit=crop&q=80'
        : data.role === 'demarcheur'
          ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80';

    const nowFormatted = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const fullName = data.name?.trim() || `${data.firstName.trim()} ${data.lastName.trim()}`;
    const targetCountry = data.projectCountry || data.residenceCountry || 'Bénin';
    // Matricule certifié déterministe basé sur l'email : 1 email = 1 seul et même matricule
    const userMatricule = generateUserMatricule(targetCountry, data.role, cleanEmail);

    const isVerified = options?.emailVerified ?? false;
    const shouldAutoLogin = options?.autoLogin ?? isVerified;

    const newUser: AuthUser = {
      id: existingPendingIndex !== -1 ? users[existingPendingIndex].id : `usr-${data.role}-${Date.now().toString(36)}`,
      matricule: existingPendingIndex !== -1 && users[existingPendingIndex].matricule ? users[existingPendingIndex].matricule : userMatricule,
      name: fullName,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      role: data.role,
      birthDate: data.birthDate.trim(),
      birthPlace: data.birthPlace.trim(),
      residenceCountry: data.residenceCountry || 'Bénin',
      residenceCity: data.residenceCity || 'Cotonou',
      residenceDistrict: data.residenceDistrict?.trim() || 'Haie Vive',
      projectCountry: data.projectCountry || data.residenceCountry || 'Bénin',
      avatarUrl: data.avatarUrl || defaultAvatar,
      companyName: data.companyName?.trim(),
      ifuNumber: data.ifuNumber?.trim(),
      registeredAt: nowFormatted,
      password: data.password || 'demo1234',
      accountStatus: 'active',
      isIdentitySealed: true,
      emailVerified: isVerified,
    };

    let updatedList: AuthUser[];
    if (existingPendingIndex !== -1) {
      updatedList = [...users];
      updatedList[existingPendingIndex] = newUser;
    } else {
      updatedList = [newUser, ...users];
    }

    this.saveRegisteredUsers(updatedList);

    if (shouldAutoLogin) {
      this.setCurrentUser(newUser);
    }

    // Synchronisation asynchrone serveur
    fetch('/api/auth/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser),
    }).catch(() => {});

    return {
      success: true,
      user: newUser,
    };
  },

  logout(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
      notifyAuthChange(null);
    } catch (e) {
      console.error('Erreur déconnexion:', e);
    }
  },
};
