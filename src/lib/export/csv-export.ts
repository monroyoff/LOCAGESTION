/**
 * Utilitaire d'export CSV universel et incorruptible
 * Conforme RFC 4180 avec BOM UTF-8 (\uFEFF) et séparateur point-virgule (;)
 * Compatible avec Microsoft Excel, Apple Numbers, Google Sheets et LibreOffice.
 */

export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  if (typeof window === 'undefined') return;

  const escapeCell = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const csvContent = [
    headers.map(escapeCell).join(';'),
    ...rows.map((row) => row.map(escapeCell).join(';')),
  ].join('\r\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
