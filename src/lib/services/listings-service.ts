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

export const ListingsService = {
  getCustomListings(): RentalListing[] {
    if (typeof window === 'undefined') return SEED_CUSTOM_LISTINGS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.filter((l) => !isFakeListing(l));
          if (sanitized.length !== parsed.length) {
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
    return this.getAllListings().filter((l) => l.status !== 'en_pause');
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
};
