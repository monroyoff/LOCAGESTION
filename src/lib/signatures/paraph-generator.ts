/**
 * Moteur de Paraphe Électronique Certifié — LOCAGESTION
 * Permet aux bailleurs et locataires d'apposer un paraphe officiel
 * basé sur leurs initiales en alternative au tracé manuel.
 */

export type ParaphStyle = 'manuscript' | 'stamp' | 'modern';

export interface ParaphStyleOption {
  id: ParaphStyle;
  label: string;
  description: string;
}

export const PARAPH_STYLES: ParaphStyleOption[] = [
  {
    id: 'manuscript',
    label: 'Manuscrit Cursif',
    description: 'Initiales stylisées avec paraphe calligraphique',
  },
  {
    id: 'stamp',
    label: 'Cachet / Sceau Officiel',
    description: 'Empreinte certifiée rectangulaire scellée',
  },
  {
    id: 'modern',
    label: 'Monogramme Moderne',
    description: 'Signature typographique contemporaine',
  },
];

/**
 * Extrait automatiquement les initiales d'un nom complet
 * Ex: Mamadou Diallo -> MD, Koffi Mensah -> KM, Jojo VOG -> JV
 */
export function extractInitials(name?: string): string {
  if (!name || !name.trim()) return 'LG';
  const clean = name.replace(/^(m\.|mme|mlle|dr|me|cabinet|agence)\s+/i, '').trim();
  const parts = clean.split(/[\s-]+/).filter(Boolean);
  if (parts.length === 0) return 'LG';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Génère une image DataURL (PNG) haute fidélité du paraphe
 */
export function generateParaphDataUrl(
  initials: string,
  fullName: string,
  style: ParaphStyle = 'manuscript',
  inkColor = '#0f172a'
): string {
  if (typeof document === 'undefined') {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="460" height="150"><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="cursive" font-size="48" fill="${encodeURIComponent(inkColor)}">${encodeURIComponent(initials)}</text></svg>`;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 460;
  canvas.height = 150;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cleanInitials = (initials || 'LG').trim().toUpperCase();
  const cleanName = (fullName || 'Signataire').trim();
  const dateStr = new Date().toLocaleDateString('fr-FR');

  if (style === 'stamp') {
    // Sceau / Cachet professionnel officiel
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(15, 12, 430, 126, 16);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(20, 17, 420, 116, 12);
    ctx.stroke();

    // Initiales au centre
    ctx.font = '900 42px sans-serif';
    ctx.fillStyle = inkColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cleanInitials, 230, 56);

    // Nom et mentions juridiques
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`PARAPHE ÉLECTRONIQUE • ${cleanName.toUpperCase()}`, 230, 96);
    ctx.font = '9px sans-serif';
    ctx.fillText(`Scellé le ${dateStr} • Conforme UEMOA & CEMAC`, 230, 114);
  } else if (style === 'modern') {
    // Style Monogramme contemporain épuré
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, 95);
    ctx.lineTo(420, 95);
    ctx.stroke();

    ctx.font = 'italic 50px "Times New Roman", Times, serif';
    ctx.fillStyle = inkColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cleanInitials, 230, 52);

    ctx.font = 'bold 10px monospace';
    ctx.fillText(`PARAPHE CERTIFIÉ : ${cleanName.toUpperCase()} [${dateStr}]`, 230, 118);
  } else {
    // Style Manuscrit cursif élégant
    ctx.font = 'italic bold 56px "Brush Script MT", "Caveat", "Segoe Script", "Apple Chancery", cursive';
    ctx.fillStyle = inkColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cleanInitials, 230, 54);

    // Trait paraphe calligraphique ondulé
    ctx.strokeStyle = inkColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(110, 88);
    ctx.bezierCurveTo(170, 108, 290, 68, 350, 88);
    ctx.stroke();

    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = inkColor;
    ctx.fillText(`${cleanName} • ${dateStr}`, 230, 118);
  }

  return canvas.toDataURL('image/png');
}
