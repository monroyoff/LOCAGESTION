'use client';

import { RentalListing, SecurityAlert, AuthUser } from '../types';
import { generateListingReference } from './listings-service';

const STORAGE_KEY_ALERTS = 'locagestion:security_alerts:v1';

export interface ModerationViolation {
  type: 'photos_insuffisantes' | 'nudite' | 'propos_sexuel' | 'extorsion_rancon';
  message: string;
  triggerSnippet?: string;
  severity: 'high' | 'critical' | 'medium';
}

export interface ModerationResult {
  isValid: boolean;
  status: 'valide' | 'rejete';
  violations: ModerationViolation[];
  summary: string;
  severity: 'none' | 'medium' | 'high' | 'critical';
  checkedAt: string;
}

// Dictionnaires de détection heuristique et regex
const SEXUAL_PATTERNS: { regex: RegExp; label: string }[] = [
  { regex: /\b(sexe|sexuel|sexuelle|sexuels|sexuelles)\b/i, label: 'Termes explicites sexuels' },
  { regex: /\b(porno|pornographie|pornographique|xxx|nsfw)\b/i, label: 'Contenu pornographique' },
  { regex: /\b(escort|escorte|escorting|prostitu[eé]e?|prostitution)\b/i, label: 'Racolage ou escorte' },
  { regex: /\b(plan\s*cul|chambre\s*de\s*passe|baisodrome)\b/i, label: 'Lieu de débauche ou passe' },
  { regex: /\b(massage\s*(sensuel|érotique|erotique|naturiste|corps\s*à\s*corps|corps\s*a\s*corps))\b/i, label: 'Massage érotique' },
  { regex: /\b(libertin|libertine|échangiste|echangiste|sugar\s*daddy|sugar\s*baby)\b/i, label: 'Propositions libertines ou rémunérées' },
  { regex: /\b(fellation|pénétration|penetration|masturbation|orgasme)\b/i, label: 'Actes sexuels' },
  { regex: /\b(adulte\s*uniquement|rencontre\s*coquine|fille\s*facile)\b/i, label: 'Solicitation adulte' },
  { regex: /\b(nudit[eé]|tout\s*nu|toute\s*nue|sans\s*v[eê]tement)\b/i, label: 'Nudité explicite' },
];

const EXTORTION_PATTERNS: { regex: RegExp; label: string }[] = [
  { regex: /\b(ran[çc]on|ran[çc]onnement|blackmail)\b/i, label: 'Rançonnement formel' },
  { regex: /\b(payer\s*sinon|paye\s*sinon|je\s*vais\s*divulguer|menace\s*de\s*mort|piratage|pirat[eé])\b/i, label: 'Chantage et menaces' },
  { regex: /\b(payer\s*(avant|d['’]avance)\s*(de\s*)?visiter|transfert\s*avant\s*visite|avance\s*avant\s*(de\s*)?voir)\b/i, label: 'Exigence de paiement avant visite' },
  { regex: /\b(mandat\s*(cash|express)\s*avant|frais\s*de\s*visite\s*(non\s*remboursables|obligatoires)\s*avant)\b/i, label: 'Faux frais obligatoires avant visite' },
  { regex: /\b(envoyer\s*(l['’]argent|les\s*sous|le\s*loyer)\s*(par\s*(wave|tmoney|momo|orange))?\s*avant\s*(de\s*)?(venir|visiter|la\s*cle|les\s*cl[eé]s))\b/i, label: 'Tentative d’escroquerie au paiement préalable' },
  { regex: /\b(virement\s*urgent\s*sans\s*visite|bloquer\s*l['’]appartement\s*à\s*distance\s*par\s*d[eé]p[oô]t)\b/i, label: 'Arnaque de réservation à distance' },
];

// Regex stricte de détection des noms de fichiers ou chemins suspects
export const BANNED_IMAGE_NAME_REGEX =
  /(?:^|[\/_\-.])(nude|naked|nsfw|erotic|porn|porno|xxx|boobs|escort|sexe)(?:$|[\/_\-.])/i;

/**
 * Vérifie si le nom d'un fichier sélectionné (ex: "salon.jpg", "nude_photo.png") est suspect.
 */
export function isSuspiciousImageFileName(fileName: string): boolean {
  if (!fileName) return false;
  return BANNED_IMAGE_NAME_REGEX.test(fileName);
}

/**
 * Vérifie si une source d'image (URL web, chemin relatif ou data URI) est suspecte.
 * 
 * RÈGLE FONDAMENTALE DE SÉCURITÉ IA :
 * Ne JAMAIS exécuter de regex textuelles sur le contenu binaire brut Base64 (data:image/...;base64,...),
 * car un flux Base64 de plusieurs centaines de milliers de caractères contient mathématiquement
 * des séquences de caractères aléatoires fortuites ('sex', 'xxx', 'nsfw') qui déclenchent
 * des faux positifs à 100% sur des photos légitimes de salons, chambres ou cuisines.
 */
export function isSuspiciousImageSource(img: string): boolean {
  if (!img) return false;

  // 1. Pour les Data URIs Base64 : on ne scanne pas le corps binaire
  if (img.startsWith('data:')) {
    const commaIdx = img.indexOf(',');
    const header = commaIdx !== -1 ? img.substring(0, commaIdx) : '';
    const nameMatch = header.match(/name=([^;]+)/i);
    if (nameMatch && nameMatch[1]) {
      return BANNED_IMAGE_NAME_REGEX.test(nameMatch[1]);
    }
    return false;
  }

  // 2. Pour les URLs HTTP/HTTPS : inspecter uniquement le chemin (pathname) du fichier
  try {
    let pathToCheck = img;
    if (img.startsWith('http://') || img.startsWith('https://')) {
      pathToCheck = new URL(img).pathname;
    }
    return BANNED_IMAGE_NAME_REGEX.test(pathToCheck);
  } catch {
    return BANNED_IMAGE_NAME_REGEX.test(img);
  }
}

/**
 * Normalisation de chaîne pour neutraliser les contournements courants
 * (leetspeak, accents, ponctuation intercalée).
 */
function normalizeContent(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Retire les accents
    .replace(/[0@]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[$]/g, 's')
    .replace(/[5]/g, 's')
    .replace(/[_.*\-+~#^]/g, ' ')
    .toLowerCase();
}

export const ModerationService = {
  isSuspiciousFileName: isSuspiciousImageFileName,
  isSuspiciousImageSource,

  /**
   * Analyse exhaustive et instantanée d'une annonce par l'IA de sécurité.
   */
  validateListing(listing: {
    title?: string;
    propertyType?: string;
    description?: string;
    landmark?: string;
    images?: string[];
    city?: string;
    district?: string;
  }): ModerationResult {
    const violations: ModerationViolation[] = [];
    const images = listing.images || [];

    // =========================================================================
    // RÈGLE 1 : MINIMUM DEUX (2) PHOTOS OU VIDÉOS OBLIGATOIRES
    // =========================================================================
    if (images.length < 2) {
      violations.push({
        type: 'photos_insuffisantes',
        severity: 'high',
        message: `Chaque annonce doit impérativement comporter au moins deux (2) photos ou vidéos représentatives du bien (actuellement : ${images.length}/2). Une annonce sans visuels certifiés est formellement interdite.`,
      });
    }

    // Préparation du texte intégral pour détection sémantique
    const fullText = [
      listing.title || '',
      listing.propertyType || '',
      listing.description || '',
      listing.landmark || '',
      listing.city || '',
      listing.district || '',
    ].join(' ');

    const normalized = normalizeContent(fullText);

    // =========================================================================
    // RÈGLE 2 : DÉTECTION DE PROPOS À CARACTÈRE SEXUEL & NUDITÉ
    // =========================================================================
    for (const pat of SEXUAL_PATTERNS) {
      if (pat.regex.test(fullText) || pat.regex.test(normalized)) {
        const match = fullText.match(pat.regex) || normalized.match(pat.regex);
        violations.push({
          type: 'propos_sexuel',
          severity: 'critical',
          message: `Violation stricte : Propos à caractère sexuel, nudité ou offre suggestive détectée (${pat.label}).`,
          triggerSnippet: match ? `Extrait : « ...${match[0]}... »` : undefined,
        });
        break; // Une violation critique suffit
      }
    }

    // Analyse des métadonnées, URLs et noms des photos (exclut le binaire base64 pour éviter tout faux positif)
    for (const img of images) {
      if (isSuspiciousImageSource(img)) {
        violations.push({
          type: 'nudite',
          severity: 'critical',
          message: `Fichier visuel suspect bloqué : L'analyseur d'images de l'IA a détecté un nom de fichier ou descripteur de contenu non conforme.`,
        });
        break;
      }
    }

    // =========================================================================
    // RÈGLE 3 : DÉTECTION DE RANÇONNEMENT, EXTORSION & ARNAQUES FINANCIÈRES
    // =========================================================================
    for (const pat of EXTORTION_PATTERNS) {
      if (pat.regex.test(fullText) || pat.regex.test(normalized)) {
        const match = fullText.match(pat.regex) || normalized.match(pat.regex);
        violations.push({
          type: 'extorsion_rancon',
          severity: 'critical',
          message: `Violation de sécurité majeure : Tentative d'extorsion, rançonnement d'argent ou demande de paiement illégal avant visite physique (${pat.label}).`,
          triggerSnippet: match ? `Extrait : « ...${match[0]}... »` : undefined,
        });
        break;
      }
    }

    const isValid = violations.length === 0;
    const maxSeverity: ModerationResult['severity'] = violations.some((v) => v.severity === 'critical')
      ? 'critical'
      : violations.some((v) => v.severity === 'high')
        ? 'high'
        : violations.length > 0
          ? 'medium'
          : 'none';

    let summary = 'Annonce entièrement conforme aux normes de sécurité LOCAGESTION.';
    if (!isValid) {
      summary = `Annonce bloquée par l'IA : ${violations.map((v) => v.message).join(' | ')}`;
    }

    return {
      isValid,
      status: isValid ? 'valide' : 'rejete',
      violations,
      summary,
      severity: maxSeverity,
      checkedAt: new Date().toISOString(),
    };
  },

  // ===========================================================================
  // GESTION DU JOURNAL D'ALERTES DE SÉCURITÉ ADMIN
  // ===========================================================================

  getSecurityAlerts(): SecurityAlert[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ALERTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Nettoyage automatique des faux positifs historiques liés au bug du scan Base64
          const cleaned = parsed.filter((alert: SecurityAlert) => {
            const hasLegacyFalsePositive = alert.violations.some(
              (v) =>
                v.message.includes('descripteurs de nudité/contenu non conforme') &&
                !v.triggerSnippet
            );
            return !hasLegacyFalsePositive;
          });
          let hasMutated = false;
          cleaned.forEach((alert: SecurityAlert) => {
            const isProperRef = alert.listingReference && /^A-[A-Z]{2}-\d+$/i.test(alert.listingReference.trim());
            if (!isProperRef) {
              alert.listingReference = generateListingReference(alert.listingReference || alert.listingId || alert.id, alert.country);
              hasMutated = true;
            }
          });
          if (hasMutated || cleaned.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(cleaned));
          }
          return cleaned;
        }
      }
    } catch (e) {
      console.error('Erreur lecture alertes sécurité:', e);
    }
    return [];
  },

  saveSecurityAlerts(alerts: SecurityAlert[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_ALERTS, JSON.stringify(alerts));
      window.dispatchEvent(new Event('locagestion:security_alerts_updated'));
    } catch (e) {
      console.error('Erreur sauvegarde alertes sécurité:', e);
    }
  },

  getUnreadAlertsCount(): number {
    const alerts = this.getSecurityAlerts();
    return alerts.filter((a) => a.status === 'non_traite').length;
  },

  /**
   * Crée et transmet instantanément une alerte de sécurité haute priorité à l'administrateur.
   */
  recordSecurityAlert(params: {
    listingId?: string;
    listingReference?: string;
    listingTitle: string;
    author: Partial<AuthUser> | null;
    country?: string;
    city?: string;
    violations: ModerationViolation[];
  }): SecurityAlert {
    const existing = this.getSecurityAlerts();
    const reference =
      params.listingReference ||
      generateListingReference(params.listingId, params.country);

    const newAlert: SecurityAlert = {
      id: `alert-sec-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      listingId: params.listingId,
      listingReference: reference,
      listingTitle: params.listingTitle || 'Annonce sans titre',
      authorName: params.author?.name || 'Auteur inconnu',
      authorEmail: params.author?.email || 'Non renseigné',
      authorPhone: params.author?.phone || 'Non renseigné',
      authorRole: params.author?.role || 'bailleur',
      country: params.country || 'Bénin',
      city: params.city || 'Cotonou',
      violations: params.violations,
      detectedAt: new Date().toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'non_traite',
    };

    const updated = [newAlert, ...existing];
    this.saveSecurityAlerts(updated);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('locagestion:security_alert', { detail: { alert: newAlert } })
      );
    }

    return newAlert;
  },

  /**
   * Action du Super Administrateur sur une alerte signalée
   */
  resolveAlert(
    alertId: string,
    action: 'bloque' | 'autorise_par_admin' | 'supprime',
    adminNotes?: string
  ): void {
    const alerts = this.getSecurityAlerts();
    if (action === 'supprime') {
      const filtered = alerts.filter((a) => a.id !== alertId);
      this.saveSecurityAlerts(filtered);
      return;
    }

    const updated = alerts.map((a) => {
      if (a.id === alertId) {
        return {
          ...a,
          status: action,
          adminNotes: adminNotes || a.adminNotes,
        };
      }
      return a;
    });

    this.saveSecurityAlerts(updated);
  },
};

