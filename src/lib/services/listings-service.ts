'use client';

import { RentalListing, UserSpace, AuthUser } from '../types';
import { MOCK_RENTAL_LISTINGS } from '../data/mock-data';

const STORAGE_KEY = 'locagestion:custom_listings';

// Annonces pré-enregistrées pour chaque profil démo afin d'offrir une expérience immédiate
const SEED_CUSTOM_LISTINGS: RentalListing[] = [
  // 1. Publications Bailleur (Mamadou Diallo)
  {
    id: 'pub-bailleur-01',
    title: 'Appartement 3 Pièces Standing avec Balcon à Haie Vive',
    propertyType: 'Appartement',
    country: 'Bénin',
    countryCode: 'BJ',
    flag: '🇧🇯',
    city: 'Cotonou',
    district: 'Haie Vive',
    landmark: 'Rue des Ambassades, à 50m de la Pharmacie Haie Vive',
    latitude: 6.357,
    longitude: 2.412,
    monthlyRent: 350000,
    charges: 25000,
    depositMonths: 3,
    advanceMonths: 1,
    agencyFees: 175000,
    surface: 110,
    bedrooms: 2,
    bathrooms: 2,
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&auto=format&fit=crop&q=80',
    ],
    amenities: [
      'Groupe électrogène automatique',
      'Compteur Cash Power SBEE individuel',
      'Forage et adoucisseur d’eau SONEB',
      'Sécurité gardiennage 24/7',
      'Climatisation split dans toutes les pièces',
    ],
    description: 'Magnifique appartement moderne au 2ème étage d’une résidence calme et ultra-sécurisée. Grand séjour lumineux, cuisine équipée et finitions européennes.',
    isVerified: true,
    status: 'disponible',
    authorId: 'usr-bailleur-01',
    authorName: 'Mamadou Diallo',
    authorRole: 'bailleur',
    createdAt: '10/01/2026',
    viewsCount: 428,
    inquiriesCount: 19,
  },
  {
    id: 'pub-bailleur-02',
    title: 'Villa Moderne 4 Pièces avec Cour & Garage à Cadjèhoun',
    propertyType: 'Villa',
    country: 'Bénin',
    countryCode: 'BJ',
    flag: '🇧🇯',
    city: 'Cotonou',
    district: 'Cadjèhoun',
    landmark: 'Proche Église Saint-Michel et Supermarché Erevan',
    latitude: 6.365,
    longitude: 2.408,
    monthlyRent: 650000,
    charges: 30000,
    depositMonths: 3,
    advanceMonths: 1,
    agencyFees: 325000,
    surface: 220,
    bedrooms: 3,
    bathrooms: 3,
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop&q=80',
    ],
    amenities: [
      'Garage fermé pour 2 véhicules',
      'Cour privative clôturée et pavée',
      'Chambre de service autonome',
      'Réserve d’eau avec surpresseur',
    ],
    description: 'Belle villa indépendante rénovée, quartier résidentiel paisible, idéale pour cadre dirigeant ou mission diplomatique.',
    isVerified: true,
    status: 'disponible',
    authorId: 'usr-bailleur-01',
    authorName: 'Mamadou Diallo',
    authorRole: 'bailleur',
    createdAt: '25/01/2026',
    viewsCount: 612,
    inquiriesCount: 27,
  },

  // 2. Publications Démarcheur (Ibrahim Traoré)
  {
    id: 'pub-demarcheur-01',
    title: 'Appartement F3 Neuf et Sécurisé Proche Goudron à Akpakpa',
    propertyType: 'Appartement',
    country: 'Bénin',
    countryCode: 'BJ',
    flag: '🇧🇯',
    city: 'Cotonou',
    district: 'Akpakpa (Dodji)',
    landmark: 'À 50m du nouveau carrefour Dodji et de la pharmacie',
    latitude: 6.369,
    longitude: 2.448,
    monthlyRent: 220000,
    charges: 15000,
    depositMonths: 3,
    advanceMonths: 1,
    agencyFees: 110000,
    surface: 90,
    bedrooms: 2,
    bathrooms: 2,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80',
    ],
    amenities: [
      'Accès direct voie goudronnée',
      'Compteurs individuels SBEE et SONEB',
      'Balcon aéré sans vis-à-vis',
      'Cuisine avec placards intégrés',
    ],
    description: 'Exclusivité Démarcheur : appartement tout neuf au 1er étage d’un petit immeuble de 4 logements. Très accessible et quartier commerçant.',
    isVerified: true,
    status: 'disponible',
    authorId: 'usr-demarcheur-01',
    authorName: 'Ibrahim Traoré',
    authorRole: 'demarcheur',
    createdAt: '03/02/2026',
    viewsCount: 389,
    inquiriesCount: 22,
  },
  {
    id: 'pub-demarcheur-02',
    title: 'Studio Meublé Tout Confort pour Séjour Pro à Fidjrossè',
    propertyType: 'Studio',
    country: 'Bénin',
    countryCode: 'BJ',
    flag: '🇧🇯',
    city: 'Cotonou',
    district: 'Fidjrossè Calvaire',
    landmark: 'À 300m de la Plage et du Boulevard de la Marina',
    latitude: 6.36,
    longitude: 2.378,
    monthlyRent: 180000,
    charges: 20000,
    depositMonths: 2,
    advanceMonths: 1,
    agencyFees: 90000,
    surface: 45,
    bedrooms: 1,
    bathrooms: 1,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
    ],
    amenities: [
      'Entièrement meublé et équipé',
      'Wifi fibre optique illimité',
      'Chauffe-eau solaire',
      'Canal+ et Smart TV',
    ],
    description: 'Superbe studio meublé disponible immédiatement. Idéal consultant en mission ou court/moyen séjour.',
    isVerified: true,
    status: 'en_pause',
    authorId: 'usr-demarcheur-01',
    authorName: 'Ibrahim Traoré',
    authorRole: 'demarcheur',
    createdAt: '15/02/2026',
    viewsCount: 512,
    inquiriesCount: 31,
  },

  // 3. Publications Locataire (Koffi Mensah)
  {
    id: 'pub-locataire-01',
    title: 'Reprise de Bail / Colocation : Grande Chambre dans F4 à Haie Vive',
    propertyType: 'Colocation',
    country: 'Bénin',
    countryCode: 'BJ',
    flag: '🇧🇯',
    city: 'Cotonou',
    district: 'Haie Vive',
    landmark: 'Derrière Restaurant Le Sorrento',
    latitude: 6.358,
    longitude: 2.414,
    monthlyRent: 95000,
    charges: 10000,
    depositMonths: 2,
    advanceMonths: 1,
    agencyFees: 0,
    surface: 28,
    bedrooms: 1,
    bathrooms: 1,
    images: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=800&auto=format&fit=crop&q=80',
    ],
    amenities: [
      'Salle d’eau privative dans la chambre',
      'Cuisine partagée toute équipée',
      'Wifi très haut débit inclus',
      'Femme de ménage 2x par semaine',
    ],
    description: 'Je libère ma chambre dans un bel appartement F4 partagé avec deux jeunes cadres sympathiques et calmes. Disponible dès la fin du mois.',
    isVerified: true,
    status: 'disponible',
    authorId: 'usr-locataire-01',
    authorName: 'Koffi Mensah',
    authorRole: 'locataire',
    createdAt: '20/02/2026',
    viewsCount: 274,
    inquiriesCount: 14,
  },
];

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
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CUSTOM_LISTINGS));
      return SEED_CUSTOM_LISTINGS;
    } catch (e) {
      console.error('Erreur lecture annonces:', e);
      return SEED_CUSTOM_LISTINGS;
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

