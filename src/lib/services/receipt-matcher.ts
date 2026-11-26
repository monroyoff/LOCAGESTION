import { PaymentTransaction } from '@/lib/types';

/**
 * Moteur universel de correspondance souple et intelligente pour les quittances
 * Reconnaît : LOCA-QUITT-BJ-114409497, QUITT-FEDA-114409497, FEDA-114409497, pay-feda-114409497, 114409497, etc.
 */
export function matchPaymentByCode(p: PaymentTransaction, search: string): boolean {
  if (!search || !p) return false;
  const s = search.toLowerCase().replace(/[^a-z0-9]/g, '');
  const id = (p.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const rec = (p.receiptNumber || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const txRef = (p.transactionRef || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (id === s || rec === s || txRef === s) return true;
  if (id.includes(s) || rec.includes(s) || s.includes(id) || s.includes(rec)) return true;

  // Extraction d'éventuels suffixes numériques (ex: 114409497)
  const numbersInSearch = search.match(/\d{6,}/)?.[0];
  if (numbersInSearch) {
    if (id.includes(numbersInSearch) || rec.includes(numbersInSearch) || txRef.includes(numbersInSearch)) {
      return true;
    }
  }
  return false;
}
