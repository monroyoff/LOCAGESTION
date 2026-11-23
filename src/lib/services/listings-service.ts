'use client';

import { RentalListing, UserSpace, AuthUser, TrashListing } from '../types';
import { MOCK_RENTAL_LISTINGS } from '../data/mock-data';
import { LeaseService } from './lease-service';

const STORAGE_KEY = 'locagestion:custom_listings';
const TRASH_STORAGE_KEY = 'locagestion:trash_listings';

const SEED_CUSTOM_LISTINGS: RentalListing[] = [
  {
    id: 'list-bj-allada-01',
    referenceCode: 'A-BJ-84291',
    title: 'Chambre Salon Sanitaire Moderne à Dogoudo',
    propertyType: 'Chambre salon sanitaire',
    country: 'Bénin',
    countryCode: 'BJ',
    flag: '🇧🇯',
    city: 'Allada',
    district: 'Dogoudo',
    landmark: 'Zone résidentielle Dogoudo, Allada',
    monthlyRent: 25000,
    charges: 0,
    depositMonths: 3,
    advanceMonths: 3,
    agencyFees: 0,
    includeFirstRent: true,
    includeAgencyFees: false,
    hasUtilitiesDeposit: true,
    utilitiesDeposit: 25000,
    surface: 45,
    bedrooms: 1,
    bathrooms: 1,
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
    ],
    amenities: [
      'Compteur électricité personnel',
      'Chambre spacieuse',
      'Sanitaire moderne privatif',
      'Accès sécurisé',
    ],
    description: "Chambre spacieuse avec salon sanitaire autonome à Dogoudo, Allada. Compteur d'électricité personnel Cash Power, accès bitumé et sécurisé.",
    latitude: 6.6494,
    longitude: 2.1528,
    isVerified: true,
    status: 'disponible',
    moderationStatus: 'valide',
    authorId: 'usr-bailleur-voglossou',
    authorName: 'VOGLOSSOU JOHANE',
    authorCompany: 'MONROY AGENCY',
    authorEmail: 'jobovog@gmail.com',
    authorPhone: '+229 01 95 44 44 30',
    authorRole: 'bailleur',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    createdAt: '01/11/2026',
    viewsCount: 142,
    inquiriesCount: 14,
  },
  {
    id: 'list-bj-calavi-17635',
    referenceCode: 'A-BJ-17635',
    title: 'Studio Meublé Moderne — Résidence UAC Calavi',
    propertyType: 'Studio',
    country: 'Bénin',
    countryCode: 'BJ',
    flag: '🇧🇯',
    city: 'Abomey-Calavi',
    district: 'Zogbadjè',
    landmark: 'Zogbadjè (Campus UAC), Abomey-Calavi',
    monthlyRent: 35000,
    charges: 3000,
    depositMonths: 3,
    advanceMonths: 3,
    agencyFees: 0,
    includeFirstRent: true,
    includeAgencyFees: false,
    hasUtilitiesDeposit: true,
    utilitiesDeposit: 15000,
    surface: 25,
    bedrooms: 1,
    bathrooms: 1,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80',
    ],
    amenities: [
      'Wifi Haut Débit',
      'Compteur Cash Power',
      'Forage d\'eau',
      'Sécurité 24/7',
      'Meublé',
    ],
    description: "Studio climatisé et meublé tout confort à 200m du campus UAC Calavi. Compteur Cash Power autonome, forage d'eau avec surpresseur, wifi haut débit.",
    latitude: 6.4485,
    longitude: 2.3556,
    isVerified: true,
    status: 'disponible',
    moderationStatus: 'valide',
    authorId: 'usr-bailleur-voglossou',
    authorName: 'VOGLOSSOU JOHANE',
    authorCompany: 'MONROY AGENCY',
    authorEmail: 'jobovog@gmail.com',
    authorPhone: '+229 01 95 44 44 30',
    authorRole: 'bailleur',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    createdAt: '15/11/2026',
    viewsCount: 98,
    inquiriesCount: 9,
  },
  {
    id: 'list-bj-boutique-01',
    referenceCode: 'A-BJ-96011',
    title: 'BOUTIQUE AVEC STAFF',
    propertyType: 'Boutique',
    country: 'Bénin',
    countryCode: 'BJ',
    flag: '🇧🇯',
    city: 'Cotonou',
    district: 'Akpakpa',
    landmark: 'Carrefour PK3, Akpakpa, Cotonou',
    monthlyRent: 45000,
    charges: 0,
    depositMonths: 3,
    advanceMonths: 3,
    agencyFees: 0,
    includeFirstRent: true,
    includeAgencyFees: false,
    hasUtilitiesDeposit: true,
    utilitiesDeposit: 25000,
    surface: 35,
    bedrooms: 0,
    bathrooms: 1,
    images: [
      'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=800&auto=format&fit=crop&q=80',
    ],
    amenities: [
      'Plafond staff moderne',
      'Compteur Cash Power autonome',
      'Sanitaire interne privatif',
      'Accès direct voie principale',
    ],
    description: 'Boutique commerciale de standing avec staff moderne, rideau métallique motorisé et sanitaires internes autonomes à Akpakpa PK3.',
    latitude: 6.3685,
    longitude: 2.4556,
    isVerified: true,
    status: 'disponible',
    moderationStatus: 'valide',
    authorId: 'usr-vivi-immo',
    authorName: 'PARI VIVID',
    authorCompany: 'VIVI IMMO',
    authorEmail: 'viviimmo.bj@gmail.com',
    authorPhone: '+229 96 00 11 22',
    authorRole: 'demarcheur',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    createdAt: '20/11/2026',
    viewsCount: 76,
    inquiriesCount: 8,
  },
];

/**
 * Détecte si une annonce est une fausse annonce de démo/mock héritée
 */
export function isFakeListing(l?: Partial<RentalListing> | null): boolean {
  if (!l) return true;

  // RÈGLE D'OR : Les annonces créées par les comptes officiels authentiques sont toujours protégées
  const authorEmail = (l.authorEmail || '').trim().toLowerCase();
  const authorId = (l.authorId || '').trim();
  if (
    authorEmail === 'jobovog@gmail.com' ||
    authorEmail === 'jojovog007@gmail.com' ||
    authorEmail === 'theodoradjigla@gmail.com' ||
    authorEmail === 'viviimmo.bj@gmail.com' ||
    authorId === 'usr-bailleur-voglossou' ||
    authorId === 'usr-tenant-jojovog' ||
    authorId === 'usr-tenant-theodora' ||
    authorId === 'usr-vivi-immo'
  ) {
    return false;
  }

  const id = (l.id || '').trim();

  // Toutes les annonces de démo / mock canoniques ou de test sont des annonces fictives à bannir
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

// Auto-nettoyage immédiat côté client pour purger les résidus de localStorage
if (typeof window !== 'undefined') {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const sanitized = parsed.filter((l) => !isFakeListing(l));
        if (sanitized.length !== parsed.length) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
        }
      }
    }
  } catch {}
}

function notifyListingsChange() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('locagestion:listings_updated'));
  }
}

/**
 * Résout le nom d'entreprise ou d'agence d'une annonce :
 * 1. Sur l'annonce directement (listing.authorCompany)
 * 2. Via l'utilisateur connecté s'il est l'auteur (AuthUser)
 * 3. Via la base des utilisateurs inscrits (locagestion:auth:users:v1)
 * 4. Via les profils utilisateurs sauvegardés (locagestion:user_profile:v1)
 */
export function resolveListingAuthorCompany(listing?: Partial<RentalListing> | null): string | undefined {
  if (!listing) return undefined;

  // 1. Déjà présent et non vide sur l'annonce
  if (listing.authorCompany && listing.authorCompany.trim()) {
    return listing.authorCompany.trim();
  }

  if (typeof window === 'undefined') return undefined;

  try {
    const cleanAuthorName = (listing.authorName || '').trim().toLowerCase();
    const cleanAuthorEmail = (listing.authorEmail || '').trim().toLowerCase();
    const cleanAuthorPhone = (listing.authorPhone || '').replace(/\s+/g, '');
    const authorId = listing.authorId;

    // 2. Vérifier l'utilisateur actuellement connecté
    const sessionStr = localStorage.getItem('locagestion:auth:session:v1');
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      if (session && session.companyName && session.companyName.trim()) {
        const isSessionAuthor =
          (authorId && session.id === authorId) ||
          (cleanAuthorEmail && session.email && session.email.trim().toLowerCase() === cleanAuthorEmail) ||
          (cleanAuthorPhone && session.phone && session.phone.replace(/\s+/g, '') === cleanAuthorPhone) ||
          (cleanAuthorName && session.name && session.name.trim().toLowerCase() === cleanAuthorName);
        if (isSessionAuthor) {
          return session.companyName.trim();
        }
      }
    }

    // 3. Vérifier dans la liste de tous les utilisateurs enregistrés
    const usersStr = localStorage.getItem('locagestion:auth:users:v1');
    if (usersStr) {
      const users = JSON.parse(usersStr);
      if (Array.isArray(users)) {
        const matched = users.find((u: any) => {
          if (authorId && u.id === authorId) return true;
          if (cleanAuthorEmail && u.email && u.email.trim().toLowerCase() === cleanAuthorEmail) return true;
          if (cleanAuthorPhone && u.phone && u.phone.replace(/\s+/g, '') === cleanAuthorPhone) return true;
          if (cleanAuthorName && u.name && u.name.trim().toLowerCase() === cleanAuthorName) return true;
          return false;
        });
        if (matched && matched.companyName && matched.companyName.trim()) {
          return matched.companyName.trim();
        }
      }
    }

    // 4. Vérifier dans les profils locaux (bailleur, démarcheur, locataire)
    const roleKeys = ['bailleur', 'demarcheur', 'locataire'];
    for (const roleKey of roleKeys) {
      const profileStr = localStorage.getItem(`locagestion:user_profile:v1:${roleKey}`);
      if (profileStr) {
        const prof = JSON.parse(profileStr);
        if (prof && prof.companyName && prof.companyName.trim()) {
          const isProfileAuthor =
            (authorId && prof.id === authorId) ||
            (cleanAuthorName && prof.name && prof.name.trim().toLowerCase() === cleanAuthorName) ||
            (cleanAuthorEmail && prof.email && prof.email.trim().toLowerCase() === cleanAuthorEmail);
          if (isProfileAuthor) {
            return prof.companyName.trim();
          }
        }
      }
    }
  } catch (err) {
    console.error('Erreur résolution entreprise annonceur:', err);
  }

  return undefined;
}

/**
 * Résout le rôle / statut de l'auteur d'une annonce :
 * - 'Locataire' si le compte est locataire
 * - 'Démarcheur' si le compte est démarcheur
 * - 'Bailleur' si le compte est bailleur (propriétaire)
 * - 'Admin' si le compte est administrateur
 */
export function resolveListingAuthorRole(listing?: Partial<RentalListing> | null): 'Bailleur' | 'Démarcheur' | 'Locataire' | 'Admin' {
  if (!listing) return 'Bailleur';

  const role = (listing.authorRole || '').toLowerCase().trim();
  if (role === 'locataire') return 'Locataire';
  if (role === 'demarcheur') return 'Démarcheur';
  if (role === 'admin') return 'Admin';
  if (role === 'bailleur') return 'Bailleur';

  // Si non défini ou ambigu sur l'annonce, résoudre via la base des utilisateurs
  if (typeof window !== 'undefined') {
    try {
      const cleanAuthorName = (listing.authorName || '').trim().toLowerCase();
      const cleanAuthorEmail = (listing.authorEmail || '').trim().toLowerCase();
      const cleanAuthorPhone = (listing.authorPhone || '').replace(/\D/g, '');
      const authorId = listing.authorId;

      // 1. Session active
      const sessionStr = localStorage.getItem('locagestion:auth:session:v1');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        if (session) {
          const isSession =
            (authorId && session.id === authorId) ||
            (cleanAuthorEmail && session.email && session.email.trim().toLowerCase() === cleanAuthorEmail) ||
            (cleanAuthorPhone && session.phone && session.phone.replace(/\D/g, '') === cleanAuthorPhone) ||
            (cleanAuthorName && session.name && session.name.trim().toLowerCase() === cleanAuthorName);
          if (isSession && session.role) {
            const sRole = session.role.toLowerCase().trim();
            if (sRole === 'locataire') return 'Locataire';
            if (sRole === 'demarcheur') return 'Démarcheur';
            if (sRole === 'admin') return 'Admin';
            if (sRole === 'bailleur') return 'Bailleur';
          }
        }
      }

      // 2. Base complète des utilisateurs inscrits
      const usersStr = localStorage.getItem('locagestion:auth:users:v1');
      if (usersStr) {
        const users = JSON.parse(usersStr);
        if (Array.isArray(users)) {
          const matched = users.find((u: any) => {
            if (authorId && u.id === authorId) return true;
            if (cleanAuthorEmail && u.email && u.email.trim().toLowerCase() === cleanAuthorEmail) return true;
            if (cleanAuthorPhone && u.phone && u.phone.replace(/\D/g, '') === cleanAuthorPhone) return true;
            if (cleanAuthorName && u.name && u.name.trim().toLowerCase() === cleanAuthorName) return true;
            return false;
          });
          if (matched && matched.role) {
            const mRole = matched.role.toLowerCase().trim();
            if (mRole === 'locataire') return 'Locataire';
            if (mRole === 'demarcheur') return 'Démarcheur';
            if (mRole === 'admin') return 'Admin';
            if (mRole === 'bailleur') return 'Bailleur';
          }
        }
      }
    } catch {}
  }

  return 'Bailleur';
}

const COUNTRY_INITIALS_MAP: Record<string, string> = {
  // Zone UEMOA
  'bénin': 'BJ',
  'benin': 'BJ',
  'bj': 'BJ',
  'burkina faso': 'BF',
  'burkina': 'BF',
  'bf': 'BF',
  'côte d’ivoire': 'CI',
  'côte d\'ivoire': 'CI',
  'cote d\'ivoire': 'CI',
  'cote d’ivoire': 'CI',
  'ci': 'CI',
  'guinée-bissau': 'GW',
  'guinee-bissau': 'GW',
  'gw': 'GW',
  'mali': 'ML',
  'ml': 'ML',
  'niger': 'NE',
  'ne': 'NE',
  'sénégal': 'SN',
  'senegal': 'SN',
  'sn': 'SN',
  'togo': 'TG',
  'tg': 'TG',
  // Zone CEMAC
  'cameroun': 'CM',
  'cameroon': 'CM',
  'cm': 'CM',
  'centrafrique': 'CF',
  'cf': 'CF',
  'congo': 'CG',
  'cg': 'CG',
  'gabon': 'GA',
  'ga': 'GA',
  'guinée équatoriale': 'GQ',
  'guinee equatoriale': 'GQ',
  'gq': 'GQ',
  'tchad': 'TD',
  'td': 'TD',
};

/**
 * Résout les initiales officielles ISO à 2 lettres du pays (ex: 'BJ', 'CI', 'SN')
 */
export function resolveCountryInitials(countryOrCode?: string): string {
  if (!countryOrCode) return 'BJ';
  const clean = countryOrCode.trim().toLowerCase();
  if (COUNTRY_INITIALS_MAP[clean]) {
    return COUNTRY_INITIALS_MAP[clean];
  }
  if (clean.length === 2 && /^[a-z]{2}$/i.test(clean)) {
    return clean.toUpperCase();
  }
  return 'BJ';
}

/**
 * Génère une référence officielle d'annonce unique, courte, simple et pro
 * Format: A-<INITIALE_PAYS>-XXXXX (ex: A-BJ-17635, A-CI-84291)
 * Strictement distinct des matricules de comptes utilisateurs (LOCA-MAT-*)
 */
export function generateListingReference(idOrRef?: string, countryOrCode?: string): string {
  let cc = resolveCountryInitials(countryOrCode);
  let numPart = '';

  if (idOrRef) {
    // Si l'ancien ref contient déjà un code pays à 2 lettres (ex: A-BJ-17635, REF-ANN-BJ-17635 ou LOCA-BJ-17635)
    const matchCountryInRef = idOrRef.match(/(?:LOCA|REF-ANN|A)-([A-Za-z]{2})-\d+/i);
    if (matchCountryInRef && matchCountryInRef[1]) {
      cc = matchCountryInRef[1].toUpperCase();
    }

    const digitsOnly = idOrRef.replace(/[^0-9]/g, '');
    if (digitsOnly.length >= 4) {
      numPart = digitsOnly.slice(-5);
    }
  }

  if (!numPart || numPart.length < 4) {
    numPart = Math.floor(10000 + Math.random() * 90000).toString();
  }

  return `A-${cc}-${numPart}`;
}

/**
 * Calcule l'âge d'une annonce en jours depuis sa date de publication
 */
export function getListingAgeInDays(listing: RentalListing): number {
  let createdTime: number | null = null;

  // 1. Essayer depuis l'ID si list-<timestamp>
  if (listing.id && listing.id.startsWith('list-')) {
    const rawTs = parseInt(listing.id.replace('list-', ''), 10);
    if (!isNaN(rawTs) && rawTs > 1600000000000 && rawTs < 2500000000000) {
      createdTime = rawTs;
    }
  }

  // 2. Essayer depuis listing.createdAt
  if (!createdTime && listing.createdAt) {
    if (listing.createdAt.includes('/')) {
      const parts = listing.createdAt.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        createdTime = new Date(y, m, d).getTime();
      }
    } else {
      const parsed = Date.parse(listing.createdAt);
      if (!isNaN(parsed)) {
        createdTime = parsed;
      }
    }
  }

  if (!createdTime) return 0;
  const diffMs = Date.now() - createdTime;
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

/**
 * Retourne le timestamp précis de publication pour le tri chronologique
 */
export function getListingTimestamp(listing: RentalListing): number {
  if (listing.id && listing.id.startsWith('list-')) {
    const rawTs = parseInt(listing.id.replace('list-', ''), 10);
    if (!isNaN(rawTs) && rawTs > 1600000000000 && rawTs < 2500000000000) {
      return rawTs;
    }
  }
  if (listing.createdAt) {
    if (listing.createdAt.includes('/')) {
      const parts = listing.createdAt.split('/');
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2], 10);
        const t = new Date(y, m, d).getTime();
        if (!isNaN(t)) return t;
      }
    } else {
      const parsed = Date.parse(listing.createdAt);
      if (!isNaN(parsed)) return parsed;
    }
  }
  return 0;
}

/**
 * Indique si une annonce a été publiée lors des 7 derniers jours
 */
export function isListingFromLast7Days(listing: RentalListing): boolean {
  return getListingAgeInDays(listing) <= 7;
}

export const ListingsService = {
  /**
   * Purge automatique de toutes les annonces de plus de 30 jours
   * Alerte l'utilisateur et libère immédiatement l'espace de stockage
   */
  purgeExpiredListings(): { purgedCount: number; purgedListings: RentalListing[] } {
    if (typeof window === 'undefined') return { purgedCount: 0, purgedListings: [] };

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return { purgedCount: 0, purgedListings: [] };

      const parsed = JSON.parse(stored);
      if (!Array.isArray(parsed)) return { purgedCount: 0, purgedListings: [] };

      const activeListings: RentalListing[] = [];
      const expiredListings: RentalListing[] = [];

      parsed.forEach((l: RentalListing) => {
        if (isFakeListing(l)) return;
        // Les annonces officielles et de référence ne sont jamais purgées
        if ((l as any).isCanonical || (l.id && l.id.startsWith('list-')) || (l.referenceCode && l.referenceCode.startsWith('A-'))) {
          activeListings.push(l);
          return;
        }
        const age = getListingAgeInDays(l);
        if (age >= 30) {
          expiredListings.push(l);

          // Avertissement utilisateur dans son espace
          LeaseService.addLandlordNotification({
            id: `notif-exp-${l.id}-${Date.now()}`,
            title: '⚠️ Annonce Expirée & Archivée (+30 jours)',
            message: `Votre annonce « ${l.title} » (Réf: ${l.referenceCode || l.id}) a été automatiquement retirée après 30 jours de diffusion pour optimiser le stockage de la plateforme. Vous pouvez la republier à tout moment.`,
            type: 'listing_rejected',
            read: false,
            createdAt: new Date().toISOString(),
            timestamp: new Date().toISOString(),
            time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          });
        } else {
          activeListings.push(l);
        }
      });

      if (expiredListings.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(activeListings));
        notifyListingsChange();
      }

      return { purgedCount: expiredListings.length, purgedListings: expiredListings };
    } catch (e) {
      console.error('Erreur purge annonces expirées (+30j):', e);
      return { purgedCount: 0, purgedListings: [] };
    }
  },

  getCustomListings(): RentalListing[] {
    if (typeof window === 'undefined') return SEED_CUSTOM_LISTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          let hasUpdated = false;
          const activeListings: RentalListing[] = [];

          parsed.filter((l) => !isFakeListing(l)).forEach((l) => {
            // RÈGLE STRICTE : Purge automatique après 30 jours pour libérer le stockage
            // Les annonces officielles et de référence ne sont jamais purgées
            const isPlatformSeed = (l as any).isCanonical || (l.id && l.id.startsWith('list-')) || (l.referenceCode && l.referenceCode.startsWith('A-'));
            const age = getListingAgeInDays(l);
            if (!isPlatformSeed && age >= 30) {
              hasUpdated = true;
              LeaseService.addLandlordNotification({
                id: `notif-exp-${l.id}-${Date.now()}`,
                title: '⚠️ Annonce Expirée & Archivée (+30 jours)',
                message: `Votre annonce « ${l.title} » (Réf: ${l.referenceCode || l.id}) a été automatiquement retirée après 30 jours de diffusion pour économiser l'espace de stockage.`,
                type: 'listing_rejected',
                read: false,
                createdAt: new Date().toISOString(),
                timestamp: new Date().toISOString(),
                time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              });
              return; // Non conservé
            }

            let item = { ...l };

            // 1. Auto-résolution du nom d'entreprise
            if (!item.authorCompany || !item.authorCompany.trim()) {
              const resolved = resolveListingAuthorCompany(item);
              if (resolved) {
                hasUpdated = true;
                item.authorCompany = resolved;
              }
            }

            // 2. Attribution d'une référence unique plateforme au format officiel A-<PAYS>-XXXXX (court, simple et pro)
            // Migration automatique si absente ou si ancien format (LOCA-*, REF-ANN-*, etc.)
            const isProperRef = item.referenceCode && /^A-[A-Z]{2}-\d+$/i.test(item.referenceCode.trim());
            if (!isProperRef) {
              hasUpdated = true;
              item.referenceCode = generateListingReference(item.referenceCode || item.id, item.countryCode || item.country);
            }

            activeListings.push(item);
          });

          if (hasUpdated || activeListings.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(activeListings));
          }
          if (activeListings.length === 0 && SEED_CUSTOM_LISTINGS.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CUSTOM_LISTINGS));
            return SEED_CUSTOM_LISTINGS;
          }
          return activeListings;
        }
      }
      if (SEED_CUSTOM_LISTINGS.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CUSTOM_LISTINGS));
        } catch (e) {}
        return SEED_CUSTOM_LISTINGS;
      }
      return [];
    } catch (e) {
      console.error('Erreur lecture annonces:', e);
      return SEED_CUSTOM_LISTINGS;
    }
  },

  getAllListings(): RentalListing[] {
    const trash = this.getTrashListings();
    const trashIds = new Set(trash.map((t) => t.id));
    const custom = this.getCustomListings().filter((l) => !isFakeListing(l) && !trashIds.has(l.id));
    const customIds = new Set(custom.map((l) => l.id));
    const nonDuplicatedMock = MOCK_RENTAL_LISTINGS.filter(
      (m) => !isFakeListing(m) && !customIds.has(m.id) && !trashIds.has(m.id)
    );
    const combined = [...custom, ...nonDuplicatedMock];
    if (combined.length === 0 && SEED_CUSTOM_LISTINGS.length > 0) {
      return SEED_CUSTOM_LISTINGS;
    }
    return combined.map((item) => {
      const isProperRef = item.referenceCode && /^A-[A-Z]{2}-\d+$/i.test(item.referenceCode.trim());
      if (!isProperRef) {
        item.referenceCode = generateListingReference(item.referenceCode || item.id, item.countryCode || item.country);
      }
      return item;
    });
  },

  getPublicListings(): RentalListing[] {
    return this.getAllListings().filter(
      (l) => l.status !== 'en_pause' && l.status !== 'rejete' && l.moderationStatus !== 'rejete'
    );
  },

  getUserListings(user?: AuthUser | null, _activeSpace?: UserSpace): RentalListing[] {
    if (!user) return [];
    const custom = this.getCustomListings().filter((l) => !isFakeListing(l));

    return custom.filter((l) => {
      if (l.authorId && l.authorId === user.id) return true;
      if (
        user.email &&
        l.authorEmail &&
        l.authorEmail.toLowerCase().trim() === user.email.toLowerCase().trim()
      ) {
        return true;
      }
      if (
        user.phone &&
        l.authorPhone &&
        l.authorPhone.replace(/\s+/g, '') === user.phone.replace(/\s+/g, '')
      ) {
        return true;
      }
      if (
        l.authorName &&
        user.name &&
        l.authorName.trim().toLowerCase() === user.name.trim().toLowerCase()
      ) {
        return true;
      }
      return false;
    });
  },

  createListing(newListing: RentalListing): RentalListing {
    const itemWithRef: RentalListing = {
      ...newListing,
      referenceCode: newListing.referenceCode || generateListingReference(newListing.id, newListing.countryCode || newListing.country),
    };
    const current = this.getCustomListings().filter((l) => !isFakeListing(l));
    const updated = [itemWithRef, ...current.filter((l) => l.id !== itemWithRef.id)];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        notifyListingsChange();
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listings: updated }),
        }).catch(() => {});
      } catch (e) {
        console.error('Erreur sauvegarde nouvelle annonce:', e);
      }
    }
    return itemWithRef;
  },

  updateListing(id: string, updates: Partial<RentalListing>): RentalListing | null {
    const current = this.getCustomListings().filter((l) => !isFakeListing(l));
    let updatedItem: RentalListing | null = null;

    const updatedList = current.map((item) => {
      if (item.id === id) {
        updatedItem = {
          ...item,
          ...updates,
        };
        return updatedItem;
      }
      return item;
    });

    if (updatedItem && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
        notifyListingsChange();
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ listings: updatedList }),
        }).catch(() => {});
      } catch (e) {
        console.error('Erreur mise à jour annonce:', e);
      }
    }
    return updatedItem;
  },

  togglePause(id: string): RentalListing | null {
    const current = this.getCustomListings().filter((l) => !isFakeListing(l));
    let target = current.find((l) => l.id === id);
    if (!target) return null;

    const nextStatus = target.status === 'en_pause' ? 'disponible' : 'en_pause';
    return this.updateListing(id, { status: nextStatus });
  },

  /**
   * Récupère la liste de toutes les annonces supprimées (Corbeille système)
   */
  getTrashListings(): TrashListing[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(TRASH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed.filter((l) => !isFakeListing(l));
        }
      }
      return [];
    } catch (e) {
      console.error('Erreur lecture corbeille annonces:', e);
      return [];
    }
  },

  /**
   * Déplace une annonce vers la corbeille au lieu d'une suppression irréversible.
   * Permet au Super Admin de restaurer l'annonce à tout moment pour l'utilisateur.
   */
  deleteListing(id: string, deletedBy: 'Utilisateur' | 'Super Admin' = 'Utilisateur', reason?: string): boolean {
    const all = this.getAllListings();
    const target = all.find((l) => l.id === id);
    const current = this.getCustomListings().filter((l) => !isFakeListing(l));

    if (target && typeof window !== 'undefined') {
      try {
        const trashItem: TrashListing = {
          ...target,
          deletedAt: new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          deletedBy,
          deletedReason: reason || (deletedBy === 'Super Admin' ? 'Suppression administrative' : 'Supprimé par l’auteur'),
        };
        const existingTrash = this.getTrashListings();
        const updatedTrash = [trashItem, ...existingTrash.filter((t) => t.id !== id)];
        localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(updatedTrash));
      } catch (e) {
        console.error('Erreur mise en corbeille annonce:', e);
      }
    }

    const filtered = current.filter((l) => l.id !== id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        notifyListingsChange();
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ removedListingId: id, listings: filtered }),
        }).catch(() => {});
        return true;
      } catch (e) {
        console.error('Erreur suppression annonce:', e);
      }
    }
    return false;
  },

  /**
   * Retire automatiquement une annonce de la diffusion publique lorsqu'un bail la concernant est contresigné par le locataire
   */
  removeListingAfterLeaseSigned(listingIdOrRef: string, leaseId: string): boolean {
    if (!listingIdOrRef || typeof window === 'undefined') return false;
    const all = this.getAllListings();
    const cleanQuery = listingIdOrRef.trim().toLowerCase();
    const cleanDigits = cleanQuery.replace(/[^0-9]/g, '');
    const cleanAlpha = cleanQuery.replace(/[^a-z0-9]/gi, '');

    const target = all.find((l) => {
      if (l.id.toLowerCase() === cleanQuery) return true;
      const ref = (l.referenceCode || '').trim().toLowerCase();
      if (ref && ref === cleanQuery) return true;
      const cleanRefAlpha = ref.replace(/[^a-z0-9]/gi, '');
      if (cleanAlpha.length >= 3 && cleanRefAlpha === cleanAlpha) return true;
      if (cleanDigits.length >= 4 && (ref.includes(cleanDigits) || l.id.includes(cleanDigits))) return true;
      return false;
    });

    if (target) {
      // 1. Déplacer vers la corbeille avec motif d'attribution de bail
      this.deleteListing(
        target.id,
        'Utilisateur',
        `Logement loué : Bail ${leaseId} contresigné électroniquement par le locataire.`
      );

      // 2. Notification de dépublication automatique pour le bailleur et le démarcheur
      try {
        const notifMsg = `L'annonce « ${target.title} » (Réf: ${target.referenceCode || target.id}) a été automatiquement retirée d'Internet suite à la contresignature du contrat de bail ${leaseId}.`;
        const notifsKey = 'locagestion:landlord_notifications';
        const existingNotifsStr = localStorage.getItem(notifsKey);
        const existingNotifs = existingNotifsStr ? JSON.parse(existingNotifsStr) : [];
        const nowIso = new Date().toISOString();
        const timeStr = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const newNotif = {
          id: `notif-unpublish-${Date.now()}`,
          title: 'Annonce automatiquement retirée d’Internet ✓',
          message: notifMsg,
          createdAt: nowIso,
          time: timeStr,
          timestamp: new Date().toLocaleDateString('fr-FR') + ' à ' + timeStr,
          type: 'listing_unpublished',
          read: false,
          leaseId,
          listingId: target.id,
          listingReference: target.referenceCode || target.id,
        };
        localStorage.setItem(notifsKey, JSON.stringify([newNotif, ...existingNotifs]));
        window.dispatchEvent(new Event('locagestion:notifications_updated'));
      } catch (e) {
        console.error('Erreur notification dépublication:', e);
      }

      notifyListingsChange();
      return true;
    }
    return false;
  },

  /**
   * Restaure une annonce supprimée pour son utilisateur depuis le compte Super Admin
   */
  restoreListing(id: string): { success: boolean; listing?: RentalListing; error?: string } {
    if (typeof window === 'undefined') return { success: false, error: 'Environnement non supporté.' };

    const trash = this.getTrashListings();
    const target = trash.find((l) => l.id === id);

    if (!target) {
      return { success: false, error: 'Annonce introuvable dans la corbeille.' };
    }

    // 1. Retirer de la corbeille
    const updatedTrash = trash.filter((l) => l.id !== id);
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(updatedTrash));

    // 2. Réintégrer dans les annonces actives
    const restoredItem: RentalListing = {
      ...target,
      status: target.status === 'rejete' || target.moderationStatus === 'rejete' ? 'rejete' : 'disponible',
    };
    const current = this.getCustomListings().filter((l) => !isFakeListing(l));
    const updatedListings = [restoredItem, ...current.filter((l) => l.id !== id)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedListings));

    // 3. Notifier l'auteur dans son espace
    try {
      LeaseService.addLandlordNotification({
        id: `notif-restore-${target.id}-${Date.now()}`,
        title: '✅ Annonce Restaurée par l’Administration',
        message: `Votre annonce « ${target.title} » (Réf: ${target.referenceCode || target.id}) a été restaurée avec succès par le Super Admin. Elle est de nouveau visible et active sur la plateforme.`,
        type: 'listing_approved',
        read: false,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString(),
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      });
    } catch (e) {
      console.error('Erreur notification restauration:', e);
    }

    notifyListingsChange();
    return { success: true, listing: restoredItem };
  },

  /**
   * Suppression définitive et irréversible depuis la corbeille
   */
  permanentDeleteTrashListing(id: string): boolean {
    if (typeof window === 'undefined') return false;
    const trash = this.getTrashListings();
    const updated = trash.filter((l) => l.id !== id);
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(updated));
    notifyListingsChange();
    return true;
  },

  /**
   * Vider complètement la corbeille d'annonces
   */
  emptyTrash(): boolean {
    if (typeof window === 'undefined') return false;
    localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify([]));
    notifyListingsChange();
    return true;
  },

  /**
   * Synchronise le nom d'entreprise ou d'agence sur toutes les annonces publiées par cet auteur
   */
  syncAuthorCompany(identifier: string, companyName?: string): void {
    const current = this.getCustomListings().filter((l) => !isFakeListing(l));
    let changed = false;
    const target = (identifier || '').trim().toLowerCase();
    const cleanPhone = (identifier || '').replace(/\s+/g, '');
    const updated = current.map((item) => {
      const matchId = item.authorId && item.authorId.toLowerCase() === target;
      const matchName = item.authorName && item.authorName.trim().toLowerCase() === target;
      const matchEmail = item.authorEmail && item.authorEmail.trim().toLowerCase() === target;
      const matchPhone = item.authorPhone && item.authorPhone.replace(/\s+/g, '') === cleanPhone;
      if (matchId || matchName || matchEmail || matchPhone) {
        changed = true;
        return {
          ...item,
          authorCompany: companyName?.trim() ? companyName.trim() : undefined,
        };
      }
      return item;
    });

    if (changed && typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        notifyListingsChange();
      } catch (e) {
        console.error('Erreur synchronisation entreprise annonces:', e);
      }
    }
  },
};
