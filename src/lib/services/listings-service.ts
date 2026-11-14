'use client';

import { RentalListing, UserSpace, AuthUser } from '../types';
import { MOCK_RENTAL_LISTINGS } from '../data/mock-data';

const STORAGE_KEY = 'locagestion:custom_listings';

// Annonces enregistrées par les utilisateurs
const SEED_CUSTOM_LISTINGS: RentalListing[] = [];

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
          return parsed;
        }
      }
      return [];
    } catch (e) {
      console.error('Erreur lecture annonces:', e);
      return [];
    }
  },

  getAllListings(): RentalListing[] {
    const custom = this.getCustomListings();
    const customIds = new Set(custom.map((l) => l.id));
    const nonDuplicatedMock = MOCK_RENTAL_LISTINGS.filter((m) => !customIds.has(m.id));
    return [...custom, ...nonDuplicatedMock];
  },

  getPublicListings(): RentalListing[] {
    return this.getAllListings().filter((l) => l.status !== 'en_pause');
  },

  getUserListings(user?: AuthUser | null, activeSpace?: UserSpace): RentalListing[] {
    const custom = this.getCustomListings();
    if (!user && !activeSpace) return custom;

    return custom.filter((l) => {
      if (user && l.authorId && l.authorId === user.id) return true;
      if (user && l.authorName && l.authorName.toLowerCase() === user.name.toLowerCase()) return true;
      if (activeSpace && l.authorRole === activeSpace) return true;
      return false;
    });
  },

  createListing(newListing: RentalListing): RentalListing {
    const current = this.getCustomListings();
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
    const current = this.getCustomListings();
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
    const current = this.getCustomListings();
    let target = current.find((l) => l.id === id);
    if (!target) return null;

    const nextStatus = target.status === 'en_pause' ? 'disponible' : 'en_pause';
    return this.updateListing(id, { status: nextStatus });
  },

  deleteListing(id: string): boolean {
    const current = this.getCustomListings();
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

