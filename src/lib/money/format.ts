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

