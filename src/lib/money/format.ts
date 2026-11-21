/**
 * Formatage monétaire strict pour les zones UEMOA & CEMAC / FCFA (XOF / XAF)
 * Le FCFA n'a pas de centimes et utilise l'espace insécable comme séparateur de milliers.
 * Ex: 250000 -> "250 000 FCFA"
 */
export function formatFCFA(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '0 FCFA';
  }
  const rounded = Math.round(Number(amount));
  const parts = Math.abs(rounded).toString().split('');
  let formatted = '';

  for (let i = parts.length - 1, count = 0; i >= 0; i--, count++) {
    if (count > 0 && count % 3 === 0) {
      formatted = ' ' + formatted;
    }
    formatted = parts[i] + formatted;
  }

  const sign = rounded < 0 ? '-' : '';
  return `${sign}${formatted} FCFA`;
}

/**
 * Formatage de date au format jour/mois/année (ex: "31/10/2026")
 */
export function formatDateFR(dateInput: Date | string | number | undefined | null): string {
  if (!dateInput) return '--/--/----';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Résout une Date JavaScript valide à partir de données de notification
 */
export function resolveNotificationDate(notif?: {
  createdAt?: string | number;
  timestamp?: string;
  time?: string;
  id?: string;
} | null): Date {
  if (!notif) return new Date();

  // 1. Si createdAt est présent et valide
  if (notif.createdAt) {
    const d = new Date(notif.createdAt);
    if (!isNaN(d.getTime())) return d;
  }

  // 2. Si timestamp contient une date lisible
  if (notif.timestamp && !notif.timestamp.toLowerCase().includes('instant')) {
    const frenchDateMatch = notif.timestamp.match(
      /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(?:à\s+)?(\d{1,2}):(\d{2}))?/
    );
    if (frenchDateMatch) {
      const day = parseInt(frenchDateMatch[1], 10);
      const month = parseInt(frenchDateMatch[2], 10) - 1;
      const year = parseInt(frenchDateMatch[3], 10);
      const hour = frenchDateMatch[4] ? parseInt(frenchDateMatch[4], 10) : 12;
      const minute = frenchDateMatch[5] ? parseInt(frenchDateMatch[5], 10) : 0;
      return new Date(year, month, day, hour, minute);
    }
    const d = new Date(notif.timestamp);
    if (!isNaN(d.getTime())) return d;
  }

  // 3. Extraction du timestamp numérique dans l'ID (ex: notif-1732... ou tnotif-1732...)
  if (notif.id) {
    const match = notif.id.match(/\b(17\d{10,11})\b/);
    if (match) {
      const ts = parseInt(match[1], 10);
      const d = new Date(ts);
      if (!isNaN(d.getTime()) && d.getFullYear() >= 2024 && d.getFullYear() <= 2030) {
        return d;
      }
    }
  }

  // 4. Si notif.time contient une heure précise (ex: "14:32")
  if (notif.time && /^\d{1,2}:\d{2}$/.test(notif.time.trim())) {
    const [h, m] = notif.time.trim().split(':').map((x) => parseInt(x, 10));
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
  }

  return new Date();
}

/**
 * Formate de façon intelligente et précise l'heure et la date de réception d'une notification
 * (ex: "À l’instant (14:32)", "Il y a 15 min (14:17)", "Aujourd’hui à 11:20", "Hier à 16:45", "20/11 à 09:10")
 */
export function formatNotificationTime(notif?: {
  createdAt?: string | number;
  timestamp?: string;
  time?: string;
  id?: string;
} | null): string {
  if (!notif) return 'À l’instant';

  const d = resolveNotificationDate(notif);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);

  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  // Moins de 2 minutes
  if (diffMinutes >= 0 && diffMinutes < 2) {
    return `À l’instant (${timeStr})`;
  }

  // Moins de 60 minutes aujourd'hui
  if (diffMinutes >= 2 && diffMinutes < 60 && d.toDateString() === now.toDateString()) {
    return `Il y a ${diffMinutes} min (${timeStr})`;
  }

  // Reçu aujourd'hui plus tôt
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return `Aujourd’hui à ${timeStr}`;
  }

  // Reçu hier
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  if (isYesterday) {
    return `Hier à ${timeStr}`;
  }

  // Reçu cette année
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  if (d.getFullYear() === now.getFullYear()) {
    return `${day}/${month} à ${timeStr}`;
  }

  // Année précédente
  return `${day}/${month}/${d.getFullYear()} à ${timeStr}`;
}

/**
 * Libellé lisible pour les méthodes de paiement
 */
export function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case 'wave':
      return 'Wave';
    case 'mtn_momo':
      return 'MTN Mobile Money';
    case 'moov_money':
      return 'Moov Money';
    case 'orange_money':
      return 'Orange Money';
    case 'virement':
      return 'Virement bancaire';
    case 'especes':
      return 'Espèces (Reçu direct)';
    case 'cheque':
      return 'Chèque';
    default:
      return method;
  }
}

/**
 * Calcul détaillé du coût total à l'entrée pour une publication immobilière (Afrique UEMOA & CEMAC)
 */
export interface EntryCostBreakdown {
  total: number;
  firstRentAmount: number;
  depositAmount: number;
  advanceAmount: number;
  utilitiesAmount: number;
  agencyAmount: number;
  formulaLabel: string;
}

export function computeEntryCost(listing: {
  monthlyRent: number | string;
  charges?: number | string;
  depositMonths?: number;
  advanceMonths?: number;
  agencyFees?: number;
  includeFirstRent?: boolean;
  includeAgencyFees?: boolean;
  hasUtilitiesDeposit?: boolean;
  utilitiesDeposit?: number;
}): EntryCostBreakdown {
  const rent = Math.max(0, parseInt(String(listing.monthlyRent || 0), 10) || 0);
  const charges = Math.max(0, parseInt(String(listing.charges || 0), 10) || 0);
  const includeFirstRent = listing.includeFirstRent !== false;
  const firstRentAmount = includeFirstRent ? rent + charges : 0;

  const depositMonths = listing.depositMonths !== undefined ? Number(listing.depositMonths) : 3;
  const depositAmount = depositMonths * rent;

  const advanceMonths = listing.advanceMonths !== undefined ? Number(listing.advanceMonths) : 0;
  const advanceAmount = advanceMonths * rent;

  const hasUtilities = !!listing.hasUtilitiesDeposit;
  const utilitiesAmount = hasUtilities ? Math.max(0, Number(listing.utilitiesDeposit) || 0) : 0;

  const includeAgency = listing.includeAgencyFees !== false;
  const agencyAmount = includeAgency
    ? (listing.agencyFees !== undefined ? Number(listing.agencyFees) : Math.round(rent * 0.5))
    : 0;

  const total = firstRentAmount + depositAmount + advanceAmount + utilitiesAmount + agencyAmount;

  const parts: string[] = [];
  if (includeFirstRent) parts.push('1er loyer');
  if (depositMonths > 0) parts.push(`${depositMonths}m caution`);
  if (advanceMonths > 0) parts.push(`${advanceMonths}m avance`);
  if (hasUtilities && utilitiesAmount > 0) parts.push(`caution eau/élec`);
  if (includeAgency && agencyAmount > 0) parts.push('agence');

  const formulaLabel = parts.length > 0 ? `(${parts.join(' + ')})` : '(Aucun frais exigé à l’entrée)';

  return {
    total,
    firstRentAmount,
    depositAmount,
    advanceAmount,
    utilitiesAmount,
    agencyAmount,
    formulaLabel,
  };
}

