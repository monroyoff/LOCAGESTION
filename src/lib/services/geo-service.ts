'use client';

import { RentalListing, UserProfile, UserSpace } from '../types';

export interface UserGeoLocation {
  country: string;
  city: string;
  district?: string;
  latitude: number;
  longitude: number;
  source: 'gps' | 'profile' | 'timezone' | 'manual';
  accuracy?: number;
  label: string;
}

const STORAGE_KEY_COUNTRY = 'locagestion:user_residence_country';
const STORAGE_KEY_CITY = 'locagestion:user_residence_city';
const STORAGE_KEY_DISTRICT = 'locagestion:user_residence_district';
const STORAGE_KEY_PROFILE = 'locagestion:user_profile';
const STORAGE_KEY_GPS = 'locagestion:user_gps_coords';

export const DEFAULT_RESIDENCE_COUNTRY = 'Bénin';
export const DEFAULT_RESIDENCE_CITY = 'Cotonou';
export const DEFAULT_RESIDENCE_DISTRICT = 'Haie Vive';


/**
 * Coordonnées GPS des principales communes, villes et quartiers
 * de la zone UEMOA (avec focus haute précision sur le Bénin).
 */
export const KNOWN_ZONE_COORDINATES: Record<
  string,
  { lat: number; lng: number; country: string; city: string; district?: string }
> = {
  // === BÉNIN : COTONOU & ENVIRONS ===
  'cotonou': { lat: 6.3703, lng: 2.4222, country: 'Bénin', city: 'Cotonou' },
  'haie vive': { lat: 6.3575, lng: 2.408, country: 'Bénin', city: 'Cotonou', district: 'Haie Vive' },
  'cadjèhoun': { lat: 6.368, lng: 2.402, country: 'Bénin', city: 'Cotonou', district: 'Cadjèhoun' },
  'fidjrossè': { lat: 6.362, lng: 2.378, country: 'Bénin', city: 'Cotonou', district: 'Fidjrossè' },
  'fidjrosse': { lat: 6.362, lng: 2.378, country: 'Bénin', city: 'Cotonou', district: 'Fidjrossè' },
  'akpakpa': { lat: 6.375, lng: 2.455, country: 'Bénin', city: 'Cotonou', district: 'Akpakpa' },
  'agla': { lat: 6.381, lng: 2.372, country: 'Bénin', city: 'Cotonou', district: 'Agla' },
  'menontin': { lat: 6.378, lng: 2.385, country: 'Bénin', city: 'Cotonou', district: 'Menontin' },
  'mènontin': { lat: 6.378, lng: 2.385, country: 'Bénin', city: 'Cotonou', district: 'Menontin' },
  'zogbo': { lat: 6.385, lng: 2.398, country: 'Bénin', city: 'Cotonou', district: 'Zogbo' },
  'kouhounou': { lat: 6.382, lng: 2.389, country: 'Bénin', city: 'Cotonou', district: 'Kouhounou' },
  'maro-militaire': { lat: 6.365, lng: 2.415, country: 'Bénin', city: 'Cotonou' },

  // === BÉNIN : ABOMEY-CALAVI & AGGLOMÉRATION ===
  'abomey-calavi': { lat: 6.452, lng: 2.355, country: 'Bénin', city: 'Abomey-Calavi' },
  'godomey': { lat: 6.395, lng: 2.338, country: 'Bénin', city: 'Abomey-Calavi', district: 'Godomey' },
  'cocotomey': { lat: 6.405, lng: 2.298, country: 'Bénin', city: 'Abomey-Calavi', district: 'Cocotomey' },
  'cococodji': { lat: 6.412, lng: 2.274, country: 'Bénin', city: 'Abomey-Calavi', district: 'Cococodji' },
  'arconville': { lat: 6.448, lng: 2.352, country: 'Bénin', city: 'Abomey-Calavi', district: 'Arconville' },
  'tankpè': { lat: 6.462, lng: 2.342, country: 'Bénin', city: 'Abomey-Calavi', district: 'Tankpè' },
  'ouedo': { lat: 6.485, lng: 2.285, country: 'Bénin', city: 'Abomey-Calavi', district: 'Ouèdo' },

  // === BÉNIN : AUTRES VILLES ===
  'porto-novo': { lat: 6.4969, lng: 2.6289, country: 'Bénin', city: 'Porto-Novo' },
  'ouidah': { lat: 6.3631, lng: 2.0851, country: 'Bénin', city: 'Ouidah' },
  'sèmè-kpodji': { lat: 6.375, lng: 2.585, country: 'Bénin', city: 'Sèmè-Kpodji' },
  'allada': { lat: 6.6653, lng: 2.1514, country: 'Bénin', city: 'Allada' },
  'bohicon': { lat: 7.1783, lng: 2.0667, country: 'Bénin', city: 'Bohicon' },
  'abomey': { lat: 7.1828, lng: 1.9912, country: 'Bénin', city: 'Abomey' },
  'parakou': { lat: 9.3372, lng: 2.6303, country: 'Bénin', city: 'Parakou' },
  'natitingou': { lat: 10.3042, lng: 1.3796, country: 'Bénin', city: 'Natitingou' },
  'djougou': { lat: 9.7085, lng: 1.666, country: 'Bénin', city: 'Djougou' },

  // === CÔTE D'IVOIRE ===
  'abidjan': { lat: 5.36, lng: -4.0083, country: 'Côte d’Ivoire', city: 'Abidjan' },
  'cocody': { lat: 5.354, lng: -3.985, country: 'Côte d’Ivoire', city: 'Abidjan', district: 'Cocody' },
  'plateau': { lat: 5.325, lng: -4.02, country: 'Côte d’Ivoire', city: 'Abidjan', district: 'Plateau' },
  'yopougon': { lat: 5.34, lng: -4.08, country: 'Côte d’Ivoire', city: 'Abidjan', district: 'Yopougon' },
  'marcory': { lat: 5.3, lng: -3.98, country: 'Côte d’Ivoire', city: 'Abidjan', district: 'Marcory' },
  'bouaké': { lat: 7.69, lng: -5.03, country: 'Côte d’Ivoire', city: 'Bouaké' },
  'yamoussoukro': { lat: 6.82, lng: -5.27, country: 'Côte d’Ivoire', city: 'Yamoussoukro' },

  // === SÉNÉGAL ===
  'dakar': { lat: 14.7167, lng: -17.4677, country: 'Sénégal', city: 'Dakar' },
  'almadies': { lat: 14.745, lng: -17.525, country: 'Sénégal', city: 'Dakar', district: 'Almadies' },
  'plateau dakar': { lat: 14.67, lng: -17.43, country: 'Sénégal', city: 'Dakar', district: 'Plateau' },
  'mermoz': { lat: 14.71, lng: -17.47, country: 'Sénégal', city: 'Dakar', district: 'Mermoz' },
  'thiès': { lat: 14.79, lng: -16.92, country: 'Sénégal', city: 'Thiès' },

  // === TOGO ===
  'lomé': { lat: 6.1375, lng: 1.2123, country: 'Togo', city: 'Lomé' },
  'lome': { lat: 6.1375, lng: 1.2123, country: 'Togo', city: 'Lomé' },

  // === BURKINA FASO ===
  'ouagadougou': { lat: 12.3714, lng: -1.5197, country: 'Burkina Faso', city: 'Ouagadougou' },

  // === MALI ===
  'bamako': { lat: 12.6392, lng: -8.0029, country: 'Mali', city: 'Bamako' },

  // === NIGER ===
  'niamey': { lat: 13.5116, lng: 2.1254, country: 'Niger', city: 'Niamey' },

  // === CAMEROUN ===
  'douala': { lat: 4.0511, lng: 9.7679, country: 'Cameroun', city: 'Douala' },
  'yaoundé': { lat: 3.848, lng: 11.5021, country: 'Cameroun', city: 'Yaoundé' },
};

/**
 * Calcule la distance orthodromique (Haversine) en kilomètres entre deux coordonnées GPS.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Récupère le pays de résidence de l'utilisateur (défini à l'inscription ou dans le profil).
 * Par défaut : Bénin.
 */
export function getUserResidenceCountry(): string {
  if (typeof window === 'undefined') return DEFAULT_RESIDENCE_COUNTRY;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_COUNTRY);
    if (saved && saved.trim() !== '') {
      return saved;
    }
  } catch (e) {
    console.error('Erreur lecture pays de résidence:', e);
  }
  return DEFAULT_RESIDENCE_COUNTRY;
}

/**
 * Met à jour le pays de résidence de l'utilisateur et synchronise toute la plateforme.
 */
export function setUserResidenceCountry(country: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_COUNTRY, country);
    window.dispatchEvent(new CustomEvent('locagestion:residence_updated', { detail: { country } }));
  } catch (e) {
    console.error('Erreur sauvegarde pays de résidence:', e);
  }
}

/**
 * Récupère la ville de résidence de l'utilisateur.
 * Par défaut : Cotonou.
 */
export function getUserResidenceCity(): string {
  if (typeof window === 'undefined') return DEFAULT_RESIDENCE_CITY;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CITY);
    if (saved && saved.trim() !== '') {
      return saved;
    }
  } catch (e) {
    console.error('Erreur lecture ville de résidence:', e);
  }
  return DEFAULT_RESIDENCE_CITY;
}

/**
 * Met à jour la ville de résidence de l'utilisateur.
 */
export function setUserResidenceCity(city: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CITY, city);
    window.dispatchEvent(new CustomEvent('locagestion:residence_updated', { detail: { city } }));
  } catch (e) {
    console.error('Erreur sauvegarde ville de résidence:', e);
  }
}

/**
 * Récupère le quartier de résidence de l'utilisateur (défini à l'inscription ou dans le profil).
 * Par défaut : Haie Vive.
 */
export function getUserResidenceDistrict(): string {
  if (typeof window === 'undefined') return DEFAULT_RESIDENCE_DISTRICT;
  try {
    const saved = localStorage.getItem(STORAGE_KEY_DISTRICT);
    if (saved && saved.trim() !== '') {
      return saved;
    }
  } catch (e) {
    console.error('Erreur lecture quartier de résidence:', e);
  }
  return DEFAULT_RESIDENCE_DISTRICT;
}

/**
 * Met à jour le quartier de résidence de l'utilisateur.
 */
export function setUserResidenceDistrict(district: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_DISTRICT, district);
    window.dispatchEvent(new CustomEvent('locagestion:residence_updated', { detail: { district } }));
  } catch (e) {
    console.error('Erreur sauvegarde quartier de résidence:', e);
  }
}

/**
 * Récupère le profil complet de l'utilisateur actif (locataire ou bailleur).
 */
export function getUserProfile(role: UserSpace = 'locataire'): UserProfile {
  const country = getUserResidenceCountry();
  const city = getUserResidenceCity();
  const district = getUserResidenceDistrict();

  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY_PROFILE}:${role}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          residenceCountry: parsed.residenceCountry || country,
          residenceCity: parsed.residenceCity || city,
          residenceDistrict: parsed.residenceDistrict || district,
        };
      }
    } catch (e) {}
  }

  if (role === 'bailleur') {
    return {
      id: 'usr-bailleur-01',
      name: 'Mamadou Diallo',
      email: 'contact@diallo-patrimoine.bj',
      phone: '+229 01 95 44 44 30',
      role: 'bailleur',
      residenceCountry: country,
      residenceCity: city,
      residenceDistrict: district,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
      registrationDate: '15/01/2025',
    };
  }

  return {
    id: 'usr-locataire-01',
    name: 'Koffi Mensah',
    email: 'koffi.mensah@fintech-africa.com',
    phone: '+229 97 12 34 56',
    role: 'locataire',
    residenceCountry: country,
    residenceCity: city,
    residenceDistrict: district,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    registrationDate: '01/11/2025',
  };
}

/**
 * Sauvegarde le profil utilisateur complet et synchronise les paramètres de résidence.
 */
export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PROFILE}:${profile.role}`, JSON.stringify(profile));
    if (profile.residenceCountry) {
      localStorage.setItem(STORAGE_KEY_COUNTRY, profile.residenceCountry);
    }
    if (profile.residenceCity) {
      localStorage.setItem(STORAGE_KEY_CITY, profile.residenceCity);
    }
    if (profile.residenceDistrict) {
      localStorage.setItem(STORAGE_KEY_DISTRICT, profile.residenceDistrict);
    }
    window.dispatchEvent(new CustomEvent('locagestion:profile_updated', { detail: profile }));
    window.dispatchEvent(
      new CustomEvent('locagestion:residence_updated', {
        detail: {
          country: profile.residenceCountry,
          city: profile.residenceCity,
          district: profile.residenceDistrict,
        },
      })
    );
  } catch (e) {
    console.error('Erreur sauvegarde profil:', e);
  }
}


/**
 * Recherche les coordonnées GPS pour une localité (quartier, ville, pays).
 */
export function resolveLocationCoordinates(
  country: string,
  city: string,
  district?: string
): { lat: number; lng: number } {
  // 1. Chercher par quartier d'abord
  if (district) {
    const cleanDist = district.toLowerCase().trim();
    for (const [key, val] of Object.entries(KNOWN_ZONE_COORDINATES)) {
      if (cleanDist.includes(key) || key.includes(cleanDist)) {
        return { lat: val.lat, lng: val.lng };
      }
    }
  }

  // 2. Chercher par ville
  const cleanCity = city.toLowerCase().trim();
  for (const [key, val] of Object.entries(KNOWN_ZONE_COORDINATES)) {
    if (cleanCity.includes(key) || key.includes(cleanCity)) {
      return { lat: val.lat, lng: val.lng };
    }
  }

  // 3. Fallback par pays
  if (country.toLowerCase().includes('bénin') || country.toLowerCase().includes('benin')) {
    return { lat: 6.3703, lng: 2.4222 }; // Cotonou
  }
  if (country.toLowerCase().includes('ivoire')) {
    return { lat: 5.36, lng: -4.0083 }; // Abidjan
  }
  if (country.toLowerCase().includes('sénégal') || country.toLowerCase().includes('senegal')) {
    return { lat: 14.7167, lng: -17.4677 }; // Dakar
  }
  if (country.toLowerCase().includes('togo')) {
    return { lat: 6.1375, lng: 1.2123 }; // Lomé
  }

  return { lat: 6.3703, lng: 2.4222 };
}

export interface GeoRequestResult {
  success: boolean;
  location: UserGeoLocation;
  message: string;
  errorType?: 'permission_denied' | 'timeout' | 'unavailable' | 'unknown';
}

/**
 * Détecte la position géographique actuelle de l'utilisateur via :
 * 1. L'API Géolocalisation native du navigateur (GPS / Wi-Fi réseau)
 * 2. Fallback IP géolocalisation
 * 3. Le profil de résidence enregistré (Inscription)
 */
export async function detectUserGeoLocation(): Promise<UserGeoLocation> {
  const res = await requestUserGeolocationWithFeedback();
  return res.location;
}

/**
 * Demande explicite d'activation de la géolocalisation avec retour d'état détaillé
 */
export async function requestUserGeolocationWithFeedback(): Promise<GeoRequestResult> {
  // Profil de base de l'utilisateur (renseigné lors de l'inscription)
  const profileCountry = getUserResidenceCountry();
  const profileCity = getUserResidenceCity();
  const profileDistrict = getUserResidenceDistrict();
  const defaultCoords = resolveLocationCoordinates(profileCountry, profileCity, profileDistrict);

  const fallbackLocation: UserGeoLocation = {
    country: profileCountry,
    city: profileCity,
    district: profileDistrict,
    latitude: defaultCoords.lat,
    longitude: defaultCoords.lng,
    source: 'profile',
    label: `${profileDistrict ? `${profileDistrict}, ` : ''}${profileCity} (${profileCountry})`,
  };

  if (typeof window === 'undefined') {
    return {
      success: false,
      location: fallbackLocation,
      message: 'Environnement serveur, utilisation du profil d’inscription.',
    };
  }

  // 1. Essai de l'API de Géolocalisation native du navigateur (GPS / Wi-Fi / Cellulaire)
  if ('geolocation' in navigator) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (err) => {
            // Si timeout ou highAccuracy échoue, on tente une deuxième fois sans highAccuracy
            if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: false,
                timeout: 6000,
                maximumAge: 15 * 60 * 1000,
              });
            } else {
              reject(err);
            }
          },
          {
            enableHighAccuracy: false, // Résolution instantanée sur Mac/PC/Wifi
            timeout: 9000, // 9 secondes pour laisser le temps à l'utilisateur de cliquer "Autoriser"
            maximumAge: 10 * 60 * 1000, // Cache 10 minutes
          }
        );
      });

      const { latitude, longitude, accuracy } = position.coords;

      // Sauvegarde des coordonnées GPS réelles
      try {
        localStorage.setItem(
          STORAGE_KEY_GPS,
          JSON.stringify({ lat: latitude, lng: longitude, time: Date.now() })
        );
      } catch (e) {}

      // Trouver la zone connue la plus proche
      let closestZone: { name: string; distance: number; data: (typeof KNOWN_ZONE_COORDINATES)[string] } | null = null;
      for (const [key, val] of Object.entries(KNOWN_ZONE_COORDINATES)) {
        const d = calculateDistanceKm(latitude, longitude, val.lat, val.lng);
        if (!closestZone || d < closestZone.distance) {
          closestZone = { name: key, distance: d, data: val };
        }
      }

      let detectedLocation: UserGeoLocation;

      // Si le GPS correspond à une zone connue dans un rayon de 150 km
      if (closestZone && closestZone.distance < 150) {
        detectedLocation = {
          country: closestZone.data.country,
          city: closestZone.data.city,
          district: closestZone.data.district || closestZone.name,
          latitude,
          longitude,
          source: 'gps',
          accuracy: Math.round(accuracy),
          label: `${closestZone.data.district ? `${closestZone.data.district}, ` : ''}${closestZone.data.city} (${closestZone.data.country})`,
        };
      } else {
        // Position GPS valide (même en dehors de la zone pré-enregistrée)
        detectedLocation = {
          country: closestZone ? closestZone.data.country : profileCountry,
          city: closestZone ? closestZone.data.city : profileCity,
          district: closestZone?.data.district || 'Position GPS active',
          latitude,
          longitude,
          source: 'gps',
          accuracy: Math.round(accuracy),
          label: `GPS (${latitude.toFixed(3)}, ${longitude.toFixed(3)}) • ${profileCountry}`,
        };
      }

      // Notifier l'ensemble de l'application
      window.dispatchEvent(
        new CustomEvent('locagestion:location_updated', {
          detail: detectedLocation,
        })
      );

      return {
        success: true,
        location: detectedLocation,
        message: `Position GPS détectée avec succès : ${detectedLocation.label}`,
      };
    } catch (err: any) {
      if (err && err.code === 1) {
        // PERMISSION_DENIED
        return {
          success: false,
          location: fallbackLocation,
          errorType: 'permission_denied',
          message:
            'Accès GPS refusé par le navigateur. Veuillez autoriser la localisation dans la barre d’adresse ou choisir votre quartier ci-dessous.',
        };
      } else if (err && err.code === 3) {
        // TIMEOUT
        // Tenter le fallback IP avant de renoncer
      }
    }
  }

  // 2. Fallback rapide via géolocalisation IP si GPS non disponible
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const ipRes = await fetch('https://ipapi.co/json/', {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (ipRes.ok) {
      const data = await ipRes.json();
      if (data && data.latitude && data.longitude) {
        const ipLocation: UserGeoLocation = {
          country: data.country_name || profileCountry,
          city: data.city || profileCity,
          district: profileDistrict,
          latitude: data.latitude,
          longitude: data.longitude,
          source: 'gps',
          label: `${data.city || profileCity} (${data.country_name || profileCountry}) [IP]`,
        };

        window.dispatchEvent(
          new CustomEvent('locagestion:location_updated', {
            detail: ipLocation,
          })
        );

        return {
          success: true,
          location: ipLocation,
          message: `Position estimée via réseau : ${ipLocation.label}`,
        };
      }
    }
  } catch (e) {
    // Ignorer si échec réseau
  }

  // 3. Fallback standard sur le profil d'inscription
  return {
    success: true,
    location: fallbackLocation,
    message: `Position basée sur votre pays de résidence d'inscription : ${fallbackLocation.label}`,
  };
}

/**
 * Calcule la distance de chaque annonce par rapport à la position de l'utilisateur
 * et trie en priorité les annonces les plus proches.
 */
export function enrichAndSortListingsByProximity(
  listings: RentalListing[],
  userLocation: UserGeoLocation | null
): (RentalListing & { distanceKm?: number })[] {
  if (!userLocation) {
    return listings;
  }

  // Calculer la distance pour chaque annonce
  const enriched = listings.map((l) => {
    let lat = l.latitude;
    let lng = l.longitude;

    if (lat === undefined || lng === undefined) {
      const resolved = resolveLocationCoordinates(l.country, l.city, l.district);
      lat = resolved.lat;
      lng = resolved.lng;
    }

    const distanceKm = calculateDistanceKm(userLocation.latitude, userLocation.longitude, lat, lng);
    return {
      ...l,
      latitude: lat,
      longitude: lng,
      distanceKm,
    };
  });

  // Tri : 
  // 1. Les annonces du même pays que l'utilisateur en priorité
  // 2. À l'intérieur, les plus proches géographiquement (distance croissante)
  return enriched.sort((a, b) => {
    const aSameCountry = a.country === userLocation.country;
    const bSameCountry = b.country === userLocation.country;

    if (aSameCountry && !bSameCountry) return -1;
    if (!aSameCountry && bSameCountry) return 1;

    // Si même pays, classer par distance GPS la plus proche
    return (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);
  });
}

