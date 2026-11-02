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

