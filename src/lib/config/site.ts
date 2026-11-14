/**
 * Configuration du Domaine et de l'Identité de Plateforme
 * LOCAGESTION — https://locagestion.site
 */

export const SITE_CONFIG = {
  name: 'LOCAGESTION',
  fullName: 'LOCAGESTION — Plateforme de Gestion Locative & Immobilière UEMOA & CEMAC',
  shortDescription: 'Gestion locative, baux certifiés OHADA, quittances numériques et encaissements FCFA.',
  description:
    'SaaS moderne de gestion locative, baux électroniques certifiés OHADA, encaissement de loyers Mobile Money & devises FCFA, et annonces immobilières en Afrique.',
  domain: 'locagestion.site',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://locagestion.site',
  themeColor: '#0e1117',
  brandColor: '#FF385C',
  links: {
    home: 'https://locagestion.site',
    portal: 'https://locagestion.site/portal',
    listings: 'https://locagestion.site/listings',
    leases: 'https://locagestion.site/leases',
    payments: 'https://locagestion.site/payments',
    download: 'https://locagestion.site/download',
    verify: (code: string) => `https://locagestion.site/verify/${code}`,
  },
  emails: {
    contact: 'contact@locagestion.site',
    support: 'support@locagestion.site',
    notifications: 'notifications@locagestion.site',
    baux: 'baux@locagestion.site',
    incidents: 'incidents@locagestion.site',
    gestion: 'gestion@locagestion.site',
  },
  phone: {
    display: '+229 01 95 44 44 30',
    clean: '2290195444430',
  },
};

/**
 * Retourne dynamiquement l'URL de base selon l'environnement (Client ou Serveur)
 */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'https://locagestion.site';
}

/**
 * Construit une URL absolue pour le site
 */
export function absoluteUrl(path: string): string {
  const base = getBaseUrl().replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
}

