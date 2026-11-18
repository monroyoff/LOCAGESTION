'use client';

import { RentalListing, UserSpace, AuthUser } from '../types';
import { MOCK_RENTAL_LISTINGS } from '../data/mock-data';

const STORAGE_KEY = 'locagestion:custom_listings';

// Annonces enregistrées par les utilisateurs — STRICTEMENT VIDE AU DÉPART
const SEED_CUSTOM_LISTINGS: RentalListing[] = [];

/**
 * Détecte si une annonce est une fausse annonce de démo/mock héritée
 */
export function isFakeListing(l?: Partial<RentalListing> | null): boolean {
  if (!l) return true;
  const id = (l.id || '').trim();
  if (
    id.startsWith('pub-bailleur-') ||
    id.startsWith('pub-demarcheur-') ||
    id.startsWith('pub-locataire-') ||
    id === 'pub-1' ||
    id === 'pub-2' ||
    id === 'pub-3' ||
    id === 'pub-4' ||
    id.startsWith('demo-')
  ) {
    return true;
  }
  if (
    l.authorId === 'usr-bailleur-01' ||
    l.authorId === 'usr-demarcheur-01' ||
    l.authorId === 'usr-locataire-01'
  ) {
    return true;
  }
  const authorName = (l.authorName || '').trim().toLowerCase();
  if (
    authorName === 'mamadou diallo' ||
    authorName === 'ibrahim traoré' ||
    authorName === 'ibrahim traore' ||
    authorName === 'koffi mensah' ||
    authorName === 'aïcha touré' ||
    authorName === 'aicha toure'
  ) {
    return true;
  }
  const title = (l.title || '').trim().toLowerCase();
  if (
    title.includes('appartement 3 pièces standing avec balcon à haie vive') ||
    title.includes('villa moderne 4 pièces avec cour & garage à cadjèhoun') ||
    title.includes('appartement f3 neuf et sécurisé proche goudron à akpakpa') ||
    title.includes('chambre meublée dans colocation cadre calme à haie vive')
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

export const ListingsService = {
  getCustomListings(): RentalListing[] {
    if (typeof window === 'undefined') return SEED_CUSTOM_LISTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          let hasUpdated = false;
          const sanitized = parsed.filter((l) => !isFakeListing(l)).map((l) => {
            if (!l.authorCompany || !l.authorCompany.trim()) {
              const resolved = resolveListingAuthorCompany(l);
              if (resolved) {
                hasUpdated = true;
                return { ...l, authorCompany: resolved };
              }
            }
            return l;
          });
          if (hasUpdated || sanitized.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
          }
          return sanitized;
        }
      }
      return [];
    } catch (e) {
      console.error('Erreur lecture annonces:', e);
      return [];
    }
  },

  getAllListings(): RentalListing[] {
    const custom = this.getCustomListings().filter((l) => !isFakeListing(l));
    const customIds = new Set(custom.map((l) => l.id));
    const nonDuplicatedMock = MOCK_RENTAL_LISTINGS.filter(
      (m) => !isFakeListing(m) && !customIds.has(m.id)
    );
    return [...custom, ...nonDuplicatedMock];
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
    const current = this.getCustomListings().filter((l) => !isFakeListing(l));
    const updated = [newListing, ...current.filter((l) => l.id !== newListing.id)];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        notifyListingsChange();
      } catch (e) {
        console.error('Erreur sauvegarde nouvelle annonce:', e);
      }
    }
    return newListing;
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

  deleteListing(id: string): boolean {
    const current = this.getCustomListings().filter((l) => !isFakeListing(l));
    const filtered = current.filter((l) => l.id !== id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        notifyListingsChange();
        return true;
      } catch (e) {
        console.error('Erreur suppression annonce:', e);
      }
    }
    return false;
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
