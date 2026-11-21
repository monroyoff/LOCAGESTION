'use client';

import { Property, AuthUser } from '../types';
import { areEmailsEqual, arePhoneNumbersEqual, AuthService } from './auth-service';

export const PROPERTIES_STORAGE_KEY = 'locagestion:properties:v1';

export const DEFAULT_PROPERTIES: Property[] = [
  {
    id: 'prop-voglossou-allada-01',
    name: 'Chambre Salon Sanitaire Allada',
    type: 'Chambre salon sanitaire',
    address: 'Zone résidentielle Dogoudo, Allada',
    city: 'Allada',
    district: 'Dogoudo',
    country: 'Bénin',
    totalUnits: 1,
    occupiedUnits: 1,
    monthlyRevenue: 25000,
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
    ],
    description: 'Chambre spacieuse avec salon sanitaire autonome à Dogoudo, Allada. Compteur d’électricité personnel Cash Power, accès bitumé et sécurisé.',
    amenities: [
      'Compteur électricité personnel Cash Power',
      'Chambre spacieuse et aérée',
      'Sanitaire moderne privatif',
      'Accès bitumé et sécurisé',
    ],
    unitsList: [
      {
        unit: 'Lot 1 (Chambre Salon Sanitaire • 45 m²)',
        type: 'Chambre Salon Sanitaire • 45 m²',
        surface: 45,
        rent: 25000,
        tenant: 'Jojo VOG',
        status: 'occupe',
      },
    ],
    authorId: 'usr-bailleur-voglossou',
    authorName: 'VOGLOSSOU JOHANE',
    authorEmail: 'jobovog@gmail.com',
    authorPhone: '+229 01 95 44 44 30',
    authorCompany: 'MONROY AGENCY',
    authorMatricule: 'LOCA-MAT-BJ-84291',
    authorRole: 'bailleur',
    createdAt: '01/11/2026',
  },
  {
    id: 'prop-diallo-cotonou-01',
    name: 'Résidence Palmier Royal',
    type: 'Immeuble',
    address: 'Boulevard Saint-Michel, Haie Vive',
    city: 'Cotonou',
    district: 'Haie Vive',
    country: 'Bénin',
    totalUnits: 3,
    occupiedUnits: 2,
    monthlyRevenue: 450000,
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
    ],
    description: 'Immeuble de haut standing à Haie Vive.',
    amenities: [
      'Compteurs prépayés individuels',
      'Réserve d’eau et surpresseur',
      'Gardien permanent 24/7',
    ],
    unitsList: [
      { unit: 'Lot 101', type: '2 Pièces', surface: 50, rent: 150000, tenant: 'Clarisse Bakayoko', status: 'occupe' },
      { unit: 'Lot 102', type: '3 Pièces', surface: 75, rent: 300000, tenant: 'Ibrahim Touré', status: 'occupe' },
      { unit: 'Lot 103', type: 'Studio', surface: 30, rent: 100000, tenant: 'Disponible', status: 'vacant' },
    ],
    authorId: 'usr-bailleur-1',
    authorName: 'Mamadou Diallo',
    authorEmail: 'mamadou.diallo@locagestion.site',
    authorPhone: '+229 97 00 00 00',
    authorCompany: 'LOCA IMMO',
    authorMatricule: 'LOCA-MAT-BJ-00001',
    authorRole: 'bailleur',
    createdAt: '15/01/2026',
  },
];

let inMemoryProperties: Property[] = [...DEFAULT_PROPERTIES];

export class PropertyService {
  /**
   * Retourne tous les biens sans exception avec garantie de persistance et fallback
   */
  static getAllProperties(): Property[] {
    if (typeof window === 'undefined') {
      return inMemoryProperties;
    }

    try {
      const stored = localStorage.getItem(PROPERTIES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Vérification que les biens immuables de Voglossou et Diallo ne sont jamais perdus
          let modified = false;
          const merged = [...parsed];

          for (const def of DEFAULT_PROPERTIES) {
            const exists = merged.some(
              (p) =>
                p.id === def.id ||
                (def.authorMatricule && p.authorMatricule === def.authorMatricule && p.name === def.name) ||
                (def.authorEmail && areEmailsEqual(p.authorEmail, def.authorEmail) && p.name === def.name)
            );
            if (!exists) {
              merged.push(def);
              modified = true;
            }
          }

          // Auto-synthèse depuis les baux existants pour ne jamais perdre un bien sous bail
          try {
            const { LeaseService } = require('./lease-service');
            const leases = LeaseService.getLeases();
            for (const lease of leases) {
              if (lease && lease.property) {
                const pName = lease.property.trim();
                const alreadyExists = merged.some(
                  (p) => p.name.toLowerCase() === pName.toLowerCase() || p.id === `prop-lease-${lease.id}`
                );
                if (!alreadyExists) {
                  const synthProp: Property = {
                    id: `prop-lease-${lease.id}`,
                    name: pName,
                    type: 'Chambre salon sanitaire',
                    address: lease.landlordAddress || 'Zone résidentielle Dogoudo, Allada',
                    city: lease.tenantAddress?.includes('Allada') || lease.landlordAddress?.includes('Allada') ? 'Allada' : 'Cotonou',
                    district: 'Dogoudo',
                    country: lease.country || 'Bénin',
                    totalUnits: 1,
                    occupiedUnits: lease.status === 'actif' ? 1 : 0,
                    monthlyRevenue: lease.rent || 25000,
                    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
                    images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80'],
                    description: `Propriété associée au contrat ${lease.id}`,
                    amenities: ['Compteur individuel', 'Sanitaire privatif'],
                    unitsList: [
                      {
                        unit: lease.unit || 'Lot 1',
                        type: 'Chambre Salon Sanitaire',
                        surface: 45,
                        rent: lease.rent || 25000,
                        tenant: lease.tenant || 'Disponible',
                        status: lease.status === 'actif' ? 'occupe' : 'vacant',
                      },
                    ],
                    authorId: lease.landlordId,
                    authorName: lease.landlordName,
                    authorEmail: lease.landlordEmail,
                    authorPhone: lease.landlordPhone,
                    authorMatricule:
                      lease.landlordId === 'usr-bailleur-voglossou' || lease.landlordEmail === 'jobovog@gmail.com'
                        ? 'LOCA-MAT-BJ-84291'
                        : undefined,
                    authorRole: 'bailleur',
                    createdAt: lease.startDate || '01/11/2026',
                  };
                  merged.push(synthProp);
                  modified = true;
                }
              }
            }
          } catch (e) {}

          if (modified) {
            localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(merged));
          }

          inMemoryProperties = merged;
          return merged;
        }
      }

      // Si localStorage vide : initialisation immédiate avec DEFAULT_PROPERTIES
      localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(DEFAULT_PROPERTIES));
      inMemoryProperties = [...DEFAULT_PROPERTIES];
      return inMemoryProperties;
    } catch (e) {
      console.error('Erreur lecture PropertyService:', e);
      return inMemoryProperties;
    }
  }

  /**
   * Retourne les propriétés filtrées pour l'utilisateur connecté avec matching robuste
   */
  static getPropertiesForUser(user?: AuthUser | null, isAdmin?: boolean): Property[] {
    const all = this.getAllProperties();

    if (isAdmin) {
      return all;
    }

    if (!user) {
      return [];
    }

    const userMatricule = (user.matricule || '').trim().toUpperCase();
    const userEmail = (user.email || '').trim().toLowerCase();
    const userPhone = user.phone ? user.phone.replace(/\s+/g, '') : '';
    const isVoglossou =
      userMatricule === 'LOCA-MAT-BJ-84291' ||
      areEmailsEqual(userEmail, 'jobovog@gmail.com') ||
      arePhoneNumbersEqual(userPhone, '+229 01 95 44 44 30');

    return all.filter((p) => {
      // 1. Match par Author ID direct
      if (user.id && p.authorId && user.id === p.authorId) {
        return true;
      }

      // 2. Match par Matricule officiel certifié (insensible à la casse)
      if (userMatricule && p.authorMatricule) {
        if (userMatricule === p.authorMatricule.trim().toUpperCase()) {
          return true;
        }
      }

      // 3. Match par Email universel
      if (userEmail && p.authorEmail) {
        if (areEmailsEqual(userEmail, p.authorEmail)) {
          return true;
        }
      }

      // 4. Match par Numéro de téléphone normalisé
      if (userPhone && p.authorPhone) {
        if (arePhoneNumbersEqual(userPhone, p.authorPhone)) {
          return true;
        }
      }

      // 5. Règle d'or absolue pour VOGLOSSOU JOHANE (LOCA-MAT-BJ-84291)
      if (isVoglossou) {
        if (
          p.authorMatricule === 'LOCA-MAT-BJ-84291' ||
          areEmailsEqual(p.authorEmail, 'jobovog@gmail.com') ||
          p.name.toLowerCase().includes('allada') ||
          (p.city && p.city.toLowerCase() === 'allada')
        ) {
          return true;
        }
      }

      // 6. Règle pour MAMADOU DIALLO (Demo)
      if (areEmailsEqual(userEmail, 'mamadou.diallo@locagestion.site')) {
        if (
          areEmailsEqual(p.authorEmail, 'mamadou.diallo@locagestion.site') ||
          p.authorId === 'usr-bailleur-1' ||
          p.authorMatricule === 'LOCA-MAT-BJ-00001'
        ) {
          return true;
        }
      }

      return false;
    });
  }

  /**
   * Enregistre ou met à jour un bien avec scellement immuable de l'auteur et synchronisation
   */
  static saveProperty(prop: Property, user?: AuthUser | null): Property {
    const all = this.getAllProperties();

    // Attribution stricte de l'auteur si utilisateur connecté fourni
    const currentUser = user || (typeof window !== 'undefined' ? AuthService.getCurrentUser() : null);

    const enriched: Property = {
      ...prop,
      id: prop.id || `prop-${Date.now()}`,
      authorId: prop.authorId || currentUser?.id || 'usr-bailleur-custom',
      authorName: prop.authorName || currentUser?.name || 'Bailleur Propriétaire',
      authorEmail: prop.authorEmail || currentUser?.email || '',
      authorPhone: prop.authorPhone || currentUser?.phone || '',
      authorCompany: prop.authorCompany || currentUser?.companyName || '',
      authorMatricule: prop.authorMatricule || currentUser?.matricule || '',
      authorRole: prop.authorRole || (currentUser?.role as any) || 'bailleur',
      createdAt: prop.createdAt || new Date().toLocaleDateString('fr-FR'),
    };

    const existingIndex = all.findIndex((p) => p.id === enriched.id);
    let updated: Property[];

    if (existingIndex >= 0) {
      updated = [...all];
      updated[existingIndex] = enriched;
    } else {
      updated = [enriched, ...all];
    }

    inMemoryProperties = updated;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('locagestion:properties_updated', { detail: enriched }));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.error('Erreur écriture PropertyService:', e);
      }
    }

    // Synchronisation serveur en arrière-plan
    this.pushToServer(updated).catch(() => {});

    return enriched;
  }

  static addProperty(prop: Property, user?: AuthUser | null): Property {
    return this.saveProperty(prop, user);
  }

  /**
   * Mise à jour d'un lot (par exemple lorsqu'un bail est signé ou résilié)
   */
  static updateUnitStatus(
    propertyIdOrName: string,
    unitName: string,
    status: 'occupe' | 'vacant',
    tenantName?: string
  ): boolean {
    const all = this.getAllProperties();
    const prop = all.find((p) => p.id === propertyIdOrName || p.name.toLowerCase() === propertyIdOrName.toLowerCase());
    if (!prop) return false;

    const updatedUnits = (prop.unitsList || []).map((u) => {
      if (u.unit.toLowerCase().includes(unitName.toLowerCase()) || unitName.toLowerCase().includes(u.unit.toLowerCase())) {
        return {
          ...u,
          status,
          tenant: status === 'occupe' ? tenantName || u.tenant : 'Disponible',
        };
      }
      return u;
    });

    const occupiedCount = updatedUnits.filter((u) => u.status === 'occupe').length;
    const updatedProp: Property = {
      ...prop,
      occupiedUnits: occupiedCount,
      unitsList: updatedUnits,
    };

    this.saveProperty(updatedProp);
    return true;
  }

  /**
   * Suppression d'un bien du patrimoine
   */
  static deleteProperty(propertyId: string): boolean {
    const all = this.getAllProperties();
    const filtered = all.filter((p) => p.id !== propertyId);

    inMemoryProperties = filtered;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(filtered));
        window.dispatchEvent(new CustomEvent('locagestion:properties_updated'));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.error('Erreur suppression PropertyService:', e);
      }
    }

    this.pushToServer(filtered).catch(() => {});
    return true;
  }

  /**
   * Envoi des propriétés vers le serveur
   */
  static async pushToServer(properties: Property[]): Promise<boolean> {
    try {
      if (typeof window === 'undefined') return false;
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ properties }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Synchronise depuis le serveur (/api/sync) et met à jour le localStorage
   */
  static async syncWithServer(): Promise<Property[]> {
    try {
      if (typeof window === 'undefined') return inMemoryProperties;
      const res = await fetch('/api/sync');
      if (!res.ok) return this.getAllProperties();

      const data = await res.json();
      if (data && Array.isArray(data.properties) && data.properties.length > 0) {
        const local = this.getAllProperties();
        const map = new Map<string, Property>();

        // Intégrer les propriétés serveur
        data.properties.forEach((p: Property) => {
          if (p && p.id) map.set(p.id, p);
        });

        // Intégrer les propriétés locales
        local.forEach((p) => {
          if (p && p.id) {
            const existing = map.get(p.id);
            map.set(p.id, { ...(existing || {}), ...p });
          }
        });

        // Garantir les valeurs par défaut
        DEFAULT_PROPERTIES.forEach((def) => {
          if (!map.has(def.id)) {
            map.set(def.id, def);
          }
        });

        const merged = Array.from(map.values());
        localStorage.setItem(PROPERTIES_STORAGE_KEY, JSON.stringify(merged));
        inMemoryProperties = merged;
        window.dispatchEvent(new CustomEvent('locagestion:properties_updated'));
        return merged;
      }
      return this.getAllProperties();
    } catch {
      return this.getAllProperties();
    }
  }
}
