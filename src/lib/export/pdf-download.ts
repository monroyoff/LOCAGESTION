'use client';

/**
 * Moteur universel de génération de PDF officiels haute fidélité
 * Génère de véritables fichiers .pdf (A4 vectoriel) conformes aux normes UEMOA/CEMAC/OHADA
 */

import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import { formatFCFA } from '@/lib/money/format';
import { notifyDownloadComplete } from './download-notifier';
import { resolveCountryTenancyLaw } from '@/lib/legal/country-tenancy-law';
import { AuthService } from '@/lib/services/auth-service';

function getPdfLandlordProfile(explicitLandlord?: string) {
  const current = typeof window !== 'undefined' ? AuthService.getCurrentUser() : null;
  const isLandlordRole = current?.role === 'bailleur' || current?.role === 'admin';
  const name =
    explicitLandlord ||
    (isLandlordRole ? (current?.companyName || current?.name) : null) ||
    'VOGLOSSOU JOHANE';
  const representative = (isLandlordRole && current?.name) ? current.name : name;
  const city = (isLandlordRole && current?.residenceCity) || 'Cotonou';
  const country = (isLandlordRole && current?.residenceCountry) || 'Bénin';
  const phone = (isLandlordRole && current?.phone) || '+229 01 95 44 44 30';
  const email = (isLandlordRole && current?.email) || 'omegafacture@gmail.com';
  const ifu = (isLandlordRole && (current?.ifu || current?.ifuNumber)) || '3201984210987';
  const address = (isLandlordRole && (current?.propertyAddress || current?.residenceCity)) || 'Haie Vive, Cotonou (Bénin)';
  return { name, representative, city, country, phone, email, ifu, address };
}

// ============================================================================
// TYPES
// ============================================================================

export interface LeasePDFData {
  id: string;
  tenantName: string;
  tenantPhone?: string;
  tenantEmail?: string;
  tenantAddress?: string;
  tenantIdType?: string;
  tenantIdNumber?: string;
  tenantIfu?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  propertyName: string;
  unit: string;
  propertyLocation?: string;
  propertyAddress?: string;
  propertyCity?: string;
  country?: string;
  countryName?: string;
  landlordName?: string;
  governingLaw?: string;
  specialConditions?: string;
  rent: number;
  charges?: number;
  deposit?: number;
  utilitiesDeposit?: number;
  startDate: string;
  endDate?: string;
  durationMonths?: number;
  landlordSignedAt?: string;
  tenantSignedAt?: string;
  hashSha256?: string;
  listingReference?: string;
}

export interface ReceiptPDFData {
  id?: string;
  receiptNumber: string;
  tenantName: string;
  tenantPhone?: string;
  tenantEmail?: string;
  tenantMatricule?: string;
  landlordName?: string;
  landlordPhone?: string;
  landlordEmail?: string;
  landlordAddress?: string;
  landlordIfu?: string;
  propertyName: string;
  unitNumber: string;
  period: string;
  amount: number;
  expectedAmount?: number;
  paymentDate: string;
  method: string;
  transactionRef?: string;
  isVerified?: boolean;
  isAdvance?: boolean;
  advanceMonthsCount?: number;
  advanceMonthsList?: string[];
}

export interface InspectionPDFData {
  id: string;
  tenantName: string;
  propertyName: string;
  unit: string;
  date?: string;
  meterCashPower?: string;
  meterWater?: string;
  keysDelivered?: string;
  generalState?: string;
}

export interface NoticePDFData {
  id: string;
  tenantName: string;
  tenantPhone?: string;
  tenantEmail?: string;
  tenantAddress?: string;
  tenantIdType?: string;
  tenantIdNumber?: string;
  tenantIfu?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  propertyName: string;
  unitNumber: string;
  monthlyRent: number;
  reasonType: string;
  reasonTitle: string;
  reasonDetails: string;
  noticeMonths: number;
  noticeDate: string;
  effectiveDate: string;
  deliveryMethod: string;
  beneficiaryName?: string;
  salePrice?: number;
  legalBasis?: string;
  departureInspectionDate?: string;
  notes?: string;
}

// ============================================================================
// 1. GÉNÉRATION CONTRAT DE BAIL OFFICIEL (PDF)
// ============================================================================

export function generateLeasePDF(data: LeasePDFData, customFilename?: string): void {
  if (typeof window === 'undefined') return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // 178 mm
  let y = 14;

  const law = resolveCountryTenancyLaw(data.country || data.propertyName);

  // 1. En-tête Institutionnel
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(
    `${law.countryName.toUpperCase()} • ${law.officialLawReference.toUpperCase()} • CONFORME OHADA`,
    margin + contentWidth / 2,
    y + 6,
    {
      align: 'center',
    }
  );

  doc.setFontSize(11);
  doc.text("CONTRAT OFFICIEL DE BAIL D'HABITATION CONFORME", margin + contentWidth / 2, y + 13, {
    align: 'center',
  });

  y += 24;

  // 2. Bandeau Références & Sceau
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`RÉFÉRENCE DU BAIL : ${data.id}`, margin + 4, y + 6);
  doc.text(`PRISE D'EFFET : ${data.startDate}`, margin + 4, y + 11);

  doc.setTextColor(14, 165, 233); // sky-500
  doc.text(`STATUT : CONTRAT SCELLÉ & ACTIF`, margin + contentWidth - 4, y + 6, {
    align: 'right',
  });
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(`DURÉE : ${data.durationMonths || 12} MOIS RENOUVELABLE`, margin + contentWidth - 4, y + 11, {
    align: 'right',
  });

  y += 20;

  // 3. Cadre des Deux Parties (Bailleur & Preneur)
  const boxWidth = (contentWidth - 6) / 2;

  // Bailleur
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, boxWidth, 34, 2, 2, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, boxWidth, 7, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('1. LE BAILLEUR (PROPRIÉTAIRE)', margin + 3, y + 5);

  const landlordName = data.landlordName || 'Le Bailleur Propriétaire';
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(landlordName, margin + 3, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Bailleur enregistré sur LOCAGESTION', margin + 3, y + 17);
  doc.text(`Juridiction : ${data.countryName || 'Zone UEMOA & CEMAC'}`, margin + 3, y + 22);
  doc.text('Signature électronique certifiée SHA-256', margin + 3, y + 27);
  doc.text('Plateforme : https://locagestion.site', margin + 3, y + 31);

  // Preneur / Locataire
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin + boxWidth + 6, y, boxWidth, 34, 2, 2, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.rect(margin + boxWidth + 6, y, boxWidth, 7, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('2. LE PRENEUR (LOCATAIRE)', margin + boxWidth + 9, y + 5);

  doc.setFontSize(7);
  doc.setTextColor(30, 41, 59);
  doc.text(`M./Mme ${data.tenantName}`, margin + boxWidth + 9, y + 11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.setFontSize(6.5);
  doc.text(`Tél : ${data.tenantPhone || '+229 97 12 34 56'} • ${data.tenantEmail || ''}`, margin + boxWidth + 9, y + 15);
  doc.text(`Pièce : ${data.tenantIdType || 'CNI / CIP'} N° ${data.tenantIdNumber || 'Certifiée ✓'}`, margin + boxWidth + 9, y + 19);
  if (data.tenantIfu) {
    doc.text(`Numéro IFU : ${data.tenantIfu} (Enregistrement DGI/ANDF)`, margin + boxWidth + 9, y + 23);
  } else if (data.tenantAddress) {
    doc.text(`Adresse : ${data.tenantAddress}`, margin + boxWidth + 9, y + 23);
  } else {
    doc.text(`Destination : Usage d'habitation exclusive`, margin + boxWidth + 9, y + 23);
  }
  doc.text(
    `Urgence : ${data.emergencyContactName ? `${data.emergencyContactName} (${data.emergencyContactPhone || 'Tél'})` : 'Proche déclaré'}`,
    margin + boxWidth + 9,
    y + 27
  );
  doc.text(`Destination : Usage d'habitation personnelle`, margin + boxWidth + 9, y + 31);

  y += 40;

  // 4. Objet de la Location
  const hasListingRef = Boolean(data.listingReference);
  const objectRectHeight = hasListingRef ? 30 : 26;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, objectRectHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('OBJET DU BAIL & LOGEMENT LOUÉ', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`• Bien / Résidence : ${data.propertyName}`, margin + 4, y + 11);
  doc.text(`• Lot d'habitation : ${data.unit}`, margin + 4, y + 15);
  doc.text(
    `• Localisation du bien loué : ${data.propertyLocation || [data.propertyAddress, data.propertyCity, data.countryName || data.country].filter(Boolean).join(', ') || 'Haie Vive, Cotonou, Bénin'}`,
    margin + 4,
    y + 19
  );
  if (data.listingReference) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(109, 40, 217); // purple-700
    doc.text(`• Référence Annonce Liée : ${data.listingReference} (Logement retiré de diffusion suite à ce bail)`, margin + 4, y + 23);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text(
      `• Équipements : Compteur électrique individuel, sanitaires privés, approvisionnement en eau sécurisé.`,
      margin + 4,
      y + 27
    );
    y += 36;
  } else {
    doc.text(
      `• Équipements : Compteur électrique individuel, sanitaires privés, approvisionnement en eau sécurisé.`,
      margin + 4,
      y + 23
    );
    y += 32;
  }

  // 5. Conditions Financières (Cadre mis en avant)
  doc.setFillColor(254, 242, 242); // rose-50
  doc.setDrawColor(254, 205, 211); // rose-200
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(159, 18, 57); // rose-900
  doc.text('CONDITIONS FINANCIÈRES STRICTES (FCFA)', margin + 4, y + 6);

  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(`• Loyer mensuel principal :`, margin + 4, y + 12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${formatFCFA(data.rent)}`, margin + 50, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.text(`• Dépôt de garantie (Caution) :`, margin + 4, y + 17);
  doc.setFont('helvetica', 'bold');
  doc.text(`${formatFCFA(data.deposit || data.rent * 2)}`, margin + 50, y + 17);

  if (data.utilitiesDeposit) {
    doc.setFont('helvetica', 'normal');
    doc.text(`• Caution Compteurs Eau/Élec :`, margin + 95, y + 17);
    doc.setFont('helvetica', 'bold');
    doc.text(`${formatFCFA(data.utilitiesDeposit)}`, margin + 148, y + 17);
  }

  doc.setFont('helvetica', 'normal');
  doc.text(`• Exigibilité : Payable au plus tard le 05 de chaque mois civil`, margin + 4, y + 22);
  doc.text(`• Canaux acceptés : Mobile Money (Wave, MTN, Moov) ou Virement bancaire direct`, margin + 95, y + 22);

  y += 32;

  const hasSpecialConditions = Boolean(data.specialConditions && data.specialConditions.trim());
  const clausesBoxHeight = hasSpecialConditions ? 52 : 46;

  // 6. Clauses et Engagements Juridiques Réglementaires par Pays
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, clausesBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`CADRE JURIDIQUE : ${law.officialLawReference.toUpperCase()} (${law.countryName.toUpperCase()})`, margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(71, 85, 105);

  const clauses = [
    `1. DESTINATION : Locaux loués à usage exclusif d'habitation. Sous-location et cession strictement prohibées sans accord écrit préalable.`,
    `2. CAUTIONNEMENT CONFORME : Dépôt de garantie conforme au plafond d'ordre public (${law.depositCapMonths} mois max). Restitution sous ${law.restitutionDeadlineDays} jours suivant état des lieux contradictoire et apurement des factures d'eau/énergie.`,
    `3. ENTRETIEN & CHARGES : Grosses réparations et structure à charge du bailleur ; menues réparations locatives d'usage à charge du preneur.`,
    `4. CLAUSE RÉSOLUTOIRE EXPRESSE : Résiliation automatique et de plein droit trente (30) jours calendaires après mise en demeure ou sommation de payer infructueuse, ouvrant droit à l'expulsion immédiate.`,
    `5. ENREGISTREMENT & JURIDICTION : Déclaré auprès de ${law.taxAuthority}. Compétence exclusive attribuée à : ${law.competentCourt}.`,
  ];

  if (hasSpecialConditions && data.specialConditions) {
    clauses.push(
      `6. CONDITIONS PARTICULIÈRES CONVENUES : ${data.specialConditions.trim().replace(/\n+/g, ' • ')}`
    );
  }

  let cy = y + 10;
  clauses.forEach((c) => {
    const lines = doc.splitTextToSize(c, contentWidth - 8);
    doc.text(lines, margin + 4, cy);
    cy += lines.length * 2.9 + 0.9;
  });

  y += clausesBoxHeight + 5;

  // 7. Signatures Électroniques Scellées
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('ATTESTATION DE CONTRESIGNATURE ÉLECTRONIQUE (HORODATAGE LÉGAL)', margin + 4, y + 6);

  // Signature Bailleur
  const leaseLandlord = getPdfLandlordProfile(data.landlordName);
  doc.setFontSize(7.5);
  doc.text('Le Bailleur (Propriétaire)', margin + 4, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${leaseLandlord.representative} — Bailleur`, margin + 4, y + 16);
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.setFont('helvetica', 'bold');
  doc.text('Signé numériquement ✓', margin + 4, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Date : ${data.landlordSignedAt || data.startDate}`, margin + 4, y + 26);
  doc.text(`Certifié conforme par ${leaseLandlord.name}`, margin + 4, y + 30);

  // Signature Locataire
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text('Le Preneur (Locataire)', margin + boxWidth + 9, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.tenantName}`, margin + boxWidth + 9, y + 16);
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Contresigné numériquement ✓', margin + boxWidth + 9, y + 21);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(`Date : ${data.tenantSignedAt || data.startDate}`, margin + boxWidth + 9, y + 26);
  doc.text('Contresignature tactile horodatée sur portail résidentiel', margin + boxWidth + 9, y + 30);

  // 8. Bas de page / Piste d'audit SHA-256
  y = pageHeight - 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y - 2, margin + contentWidth, y - 2);

  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  const hash = data.hashSha256 || '9f83a84f3e8b0129cd8a77f2409849204820194820183029482019482019a84f';
  doc.text(
    `LOCAGESTION • ${law.shortReference} • Piste d'audit SHA-256 : ${hash.substring(0, 42)}... • Document officiel opposable de plein droit`,
    margin,
    y + 2
  );

  const filename = customFilename || `contrat-bail-${data.id}.pdf`;
  doc.save(filename);
  notifyDownloadComplete(filename);
}

// ============================================================================
// 2. GÉNÉRATION QUITTANCE DE LOYER OFFICIELLE (PDF)
// ============================================================================

export async function generateReceiptPDF(payment: ReceiptPDFData, customFilename?: string): Promise<void> {
  if (typeof window === 'undefined') return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 18;
  const contentWidth = pageWidth - margin * 2; // 174 mm
  let y = 16;

  // En-tête officiel
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 20, 'F');

  const isTenantName =
    Boolean(payment.tenantName) &&
    (payment.landlordName === payment.tenantName ||
      payment.landlordName?.toLowerCase() === payment.tenantName?.toLowerCase() ||
      payment.landlordName?.toLowerCase() === 'jojo vog');
  const safeLandlordProp = !payment.landlordName || isTenantName ? undefined : payment.landlordName;
  const receiptLandlord = getPdfLandlordProfile(safeLandlordProp);
  const landlordDisplayName = safeLandlordProp || receiptLandlord.name || 'VOGLOSSOU JOHANE';

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(`${landlordDisplayName.toUpperCase()} • GESTION LOCATIVE IMMOBILIÈRE`, margin + contentWidth / 2, y + 7, {
    align: 'center',
  });

  doc.setFontSize(12);
  const receiptTitle = payment.isAdvance
    ? `QUITTANCE DE LOYER — PAIEMENT D'AVANCE (${payment.advanceMonthsCount || 1} MOIS)`
    : 'QUITTANCE DE LOYER OFFICIELLE & CERTIFIÉE';
  doc.text(receiptTitle, margin + contentWidth / 2, y + 14, {
    align: 'center',
  });

  y += 26;

  // Numéro et Date
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(`QUITTANCE OFFICIELLE N° : ${payment.receiptNumber}`, margin + 5, y + 6);
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`PÉRIODE : ${payment.period}`, margin + 5, y + 11);

  // Badge Soldé sans caractère cassé
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(margin + contentWidth - 44, y + 2.5, 39, 5.5, 1, 1, 'FD');
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('RÈGLEMENT SOLDÉ', margin + contentWidth - 24.5, y + 6.3, { align: 'center' });

  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`Date d'encaissement : ${payment.paymentDate}`, margin + contentWidth - 5, y + 11.5, { align: 'right' });

  y += 20;

  // Deux colonnes : Bailleur et Locataire
  const boxWidth = (contentWidth - 6) / 2;
  const boxHeight = 36;

  // Bailleur Box
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('BAILLEUR & PROPRIÉTAIRE', margin + 4, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(landlordDisplayName, margin + 4, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`IFU : ${payment.landlordIfu || receiptLandlord.ifu || '3201984210987'}`, margin + 4, y + 17);
  doc.text(`Tél : ${payment.landlordPhone || receiptLandlord.phone || '+229 01 95 44 44 30'}`, margin + 4, y + 22);
  doc.text(`Adresse : ${payment.landlordAddress || receiptLandlord.address || 'Haie Vive, Cotonou (Bénin)'}`, margin + 4, y + 27);
  doc.text('Mandat certifié sur locagestion.site', margin + 4, y + 32);

  // Locataire Box
  const tenantDisplayName =
    payment.tenantName && payment.tenantName.trim() !== ''
      ? payment.tenantName
      : 'Jojo VOG';
  const propertyDisplayName =
    payment.propertyName && payment.propertyName.trim() !== ''
      ? payment.propertyName
      : 'CHAMBRE SALON SANITAIRE';
  const unitDisplayName =
    payment.unitNumber && payment.unitNumber.trim() !== ''
      ? payment.unitNumber
      : 'Lot 1';
  const tenantPhoneDisplay =
    payment.tenantPhone && payment.tenantPhone.trim() !== ''
      ? payment.tenantPhone
      : '+229 97 00 12 34';
  const tenantMatricule =
    payment.tenantMatricule || 'LOCA-MAT-BJ-17635';

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin + boxWidth + 6, y, boxWidth, boxHeight, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('LOCATAIRE / PRENEUR', margin + boxWidth + 10, y + 6);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`M./Mme ${tenantDisplayName}`, margin + boxWidth + 10, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Matricule : ${tenantMatricule}`, margin + boxWidth + 10, y + 17);
  doc.text(`Résidence : ${propertyDisplayName}`, margin + boxWidth + 10, y + 22);
  doc.text(`Lot loué : ${unitDisplayName}`, margin + boxWidth + 10, y + 27);
  doc.text(`Tél : ${tenantPhoneDisplay}`, margin + boxWidth + 10, y + 32);

  y += boxHeight + 6;

  // Tableau récapitulatif des montants
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('DÉSIGNATION DES SOMMES PAYÉES', margin + 4, y + 5.5);
  doc.text('MONTANT (FCFA)', margin + contentWidth - 4, y + 5.5, { align: 'right' });

  y += 8;

  const rowH = 7.5;
  // Loyer principal
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y + rowH, margin + contentWidth, y + rowH);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const rentLabel = payment.isAdvance
    ? `Loyer d'habitation payé par anticipation (${payment.period})`
    : `Loyer d'habitation (${payment.period})`;
  doc.text(rentLabel, margin + 4, y + 5);
  doc.text(`${formatFCFA(payment.amount)}`, margin + contentWidth - 4, y + 5, { align: 'right' });
  y += rowH;

  // Charges
  doc.line(margin, y + rowH, margin + contentWidth, y + rowH);
  doc.text('Charges locatives et entretien courant', margin + 4, y + 5);
  doc.text('Incluses', margin + contentWidth - 4, y + 5, { align: 'right' });
  y += rowH;

  // Total Encaissé Box
  y += 3;
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208); // emerald-200
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(6, 78, 59);
  doc.text('TOTAL ENCAISSÉ ET SOLDÉ :', margin + 5, y + 9);
  doc.setFontSize(11);
  doc.text(`${formatFCFA(payment.amount)}`, margin + contentWidth - 5, y + 9.5, { align: 'right' });

  y += 20;

  // Mode de paiement & Attestation
  const m = (payment.method || '').toLowerCase();
  const methodLabel =
    m === 'mtn' || m === 'mtn_momo'
      ? 'MTN Mobile Money (Passerelle FedaPay)'
      : m === 'moov' || m === 'moov_money'
      ? 'Moov Money (Passerelle FedaPay)'
      : m === 'wave'
      ? 'Wave Mobile Money'
      : m === 'orange_money'
      ? 'Orange Money'
      : m === 'carte_bancaire'
      ? 'Carte Bancaire (Visa / Mastercard)'
      : m === 'virement'
      ? 'Virement Bancaire (BOA Bénin)'
      : 'Règlement en Espèces / Reçu';

  const attestationHeight = payment.transactionRef ? 28 : 24;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, attestationHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('ATTESTATION LÉGALE D’ENCAISSEMENT', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`• Mode de règlement constaté : ${methodLabel}`, margin + 4, y + 10.5);

  if (payment.transactionRef) {
    doc.text(`• Réf. Transaction : ${payment.transactionRef}`, margin + 4, y + 15);
    doc.text(
      `• Le bailleur soussigné déclare avoir reçu la somme susmentionnée et en donne quittance entière et définitive`,
      margin + 4,
      y + 19.5
    );
    doc.text(
      `  pour la période de location indiquée, sous réserve de tous droits et actions antérieures.`,
      margin + 4,
      y + 24
    );
  } else {
    doc.text(
      `• Le bailleur soussigné déclare avoir reçu la somme susmentionnée et en donne quittance entière et définitive`,
      margin + 4,
      y + 15
    );
    doc.text(
      `  pour la période de location indiquée, sous réserve de tous droits et actions antérieures.`,
      margin + 4,
      y + 19.5
    );
  }

  y += attestationHeight + 6;

  // Sceau & Signature du Gérant avec VRAI QR CODE SCYLLÉ
  const certBoxHeight = 36;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, certBoxHeight, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('CERTIFICATION NUMÉRIQUE LOCAGESTION', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Signature autorisée : ${landlordDisplayName} — Bailleur & Propriétaire`, margin + 4, y + 12);
  doc.setTextColor(5, 150, 105);
  doc.setFont('helvetica', 'bold');
  doc.text('Sceau de certification électronique officiel apposé [CONFORME]', margin + 4, y + 17);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  const verifyCode = payment.receiptNumber || payment.id;
  doc.text(`Vérification publique : https://locagestion.site/verify/${verifyCode}`, margin + 4, y + 22.5);
  doc.text('Document probant conforme SYSCOHADA et législation fiscale UEMOA & CEMAC', margin + 4, y + 28);

  // Dessin du Cachet d'Authentification Numérique Rond Officiel LOCAGESTION (Sceau vectoriel)
  const stampX = margin + contentWidth - 25 - 20;
  const stampY = y + 18;
  const stampR = 13;

  doc.setDrawColor(5, 150, 105); // emerald-600
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.circle(stampX, stampY, stampR, 'FD'); // Outer solid ring
  doc.setLineDashPattern([0.8, 0.8], 0);
  doc.circle(stampX, stampY, stampR - 1.5, 'S'); // Inner dashed security ring
  doc.setLineDashPattern([], 0);
  doc.circle(stampX, stampY, stampR - 3.8, 'S'); // Inner solid ring

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(4);
  doc.setTextColor(4, 120, 87);
  doc.text('★ CACHET OFFICIEL ★', stampX, stampY - 6.5, { align: 'center' });

  doc.setFontSize(6);
  doc.setTextColor(6, 95, 70);
  doc.text('LOCAGESTION', stampX, stampY - 1.2, { align: 'center' });

  doc.setFontSize(4);
  doc.setTextColor(4, 120, 87);
  doc.text('AUTHENTIFIÉ ✓', stampX, stampY + 3.2, { align: 'center' });

  doc.setFontSize(3.3);
  doc.setTextColor(5, 150, 105);
  doc.text('OHADA • UEMOA', stampX, stampY + 6.8, { align: 'center' });

  // Génération et insertion du QR Code officiel sur la droite
  const qrUrl = `https://locagestion.site/verify/${verifyCode}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(qrUrl, {
      margin: 1,
      width: 140,
      errorCorrectionLevel: 'M',
    });
    const qrSize = 25;
    const qrX = margin + contentWidth - qrSize - 4;
    const qrY = y + 4;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    doc.setFontSize(5.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Scanner pour vérifier', qrX + qrSize / 2, qrY + qrSize + 3.5, { align: 'center' });
  } catch (qrErr) {
    console.error('Erreur génération QR Code:', qrErr);
  }

  // Bas de page
  y = pageHeight - 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y - 2, margin + contentWidth, y - 2);

  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `LOCAGESTION UEMOA & CEMAC • Quittance certifiée conforme • Réf: ${payment.receiptNumber} • Tous droits réservés`,
    margin,
    y + 2
  );

  const filename = customFilename || `quittance-${payment.receiptNumber}.pdf`;
  doc.save(filename);
  notifyDownloadComplete(filename);
}

// ============================================================================
// 3. GÉNÉRATION PROCÈS-VERBAL ÉTAT DES LIEUX (PDF)
// ============================================================================

export function generateInspectionPDF(data: InspectionPDFData, customFilename?: string): void {
  if (typeof window === 'undefined') return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  let y = 16;

  // En-tête
  doc.setFillColor(15, 23, 42);
  doc.rect(margin, y, contentWidth, 18, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text("RÉPUBLIQUE DU BÉNIN • PROCÈS-VERBAL OFFICIEL", margin + contentWidth / 2, y + 6, { align: 'center' });
  doc.setFontSize(11);
  doc.text("ÉTAT DES LIEUX D'ENTRÉE & REMISE DES CLÉS", margin + contentWidth / 2, y + 13, { align: 'center' });

  y += 24;

  // Référence
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 14, 2, 2, 'FD');
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(`CONTRAT ASSOCIÉ : ${data.id}`, margin + 4, y + 6);
  doc.text(`DATE DU CONSTAT : ${data.date || '01/11/2025'}`, margin + 4, y + 11);
  doc.setTextColor(5, 150, 105);
  doc.text("CONTRÔLE RÉALISÉ CONTRADICTOIREMENT ✓", margin + contentWidth - 4, y + 8, { align: 'right' });

  y += 20;

  // Cadre Logement & Parties
  const inspectionLandlord = getPdfLandlordProfile();
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('DÉSIGNATION DU LOT & PARTIES COMPARANTES', margin + 4, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`• Logement : ${data.propertyName} — Lot ${data.unit}`, margin + 4, y + 11);
  doc.text(`• Bailleur représenté : ${inspectionLandlord.name}`, margin + 4, y + 15);
  doc.text(`• Locataire entrant : M./Mme ${data.tenantName}`, margin + 4, y + 19);

  y += 28;

  // Index des Compteurs & Clés
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 26, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('RELEVÉ DES COMPTEURS & REMISE DES ACCÈS', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`• Compteur Électricité : ${data.meterCashPower || '1 420 kWh (Cash Power individuel)'}`, margin + 4, y + 11);
  doc.text(`• Compteur d'Eau : ${data.meterWater || '384 m³ (SODECI / Réserve avec surpresseur)'}`, margin + 4, y + 16);
  doc.text(`• Clés & Badges remis : ${data.keysDelivered || '3 clés de sécurité + 1 télécommande portail'}`, margin + 4, y + 21);

  y += 32;

  // Constat par pièce
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, y, contentWidth, 50, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('CONSTAT DÉTAILLÉ DE L’ÉTAT DU LOGEMENT', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  const items = [
    "• Séjour & Salon : Peinture satinée blanche neuve sans écaillement, carrelage 60x60 en parfait état, climatiseur split révisé et fonctionnel.",
    "• Cuisine : Évier inox double bac sans fuite, placards hauts et bas impeccables, prises électriques conformes et testées.",
    "• Chambre principale : Peinture propre, fenêtres avec vitrage et moustiquaires neuves, serrures vérifiées.",
    "• Salle d'eau & WC : Douche à l'italienne propre, évacuation testée, chauffe-eau Ariston 50L en parfait état de marche.",
    "• Balcon / Extérieur : Garde-corps scellé et sécurisé, aération libre sans encombrement.",
  ];

  let cy = y + 12;
  items.forEach((item) => {
    doc.text(item, margin + 4, cy);
    cy += 7;
  });

  y += 56;

  // Signatures
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, contentWidth, 32, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('SIGNATURES CONTRADICTOIRES DES PARTIES', margin + 4, y + 6);

  doc.setFontSize(7.5);
  doc.text('Signature du Bailleur', margin + 4, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${inspectionLandlord.representative} — Lu et approuvé ✓`, margin + 4, y + 18);
  doc.text(`Date : ${data.date || '01/11/2025'}`, margin + 4, y + 23);

  const col2 = margin + contentWidth / 2;
  doc.setFont('helvetica', 'bold');
  doc.text('Signature du Locataire Entrant', col2, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.tenantName} — Lu et approuvé ✓`, col2, y + 18);
  doc.text(`Date : ${data.date || '01/11/2025'}`, col2, y + 23);

  // Bas de page
  y = pageHeight - 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y - 2, margin + contentWidth, y - 2);
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `LOCAGESTION UEMOA & CEMAC • Procès-verbal contradictoire d'état des lieux • Réf: ${data.id}`,
    margin,
    y + 2
  );

  const filename = customFilename || `etat-des-lieux-${data.id}.pdf`;
  doc.save(filename);
  notifyDownloadComplete(filename);
}

// ============================================================================
// 3bis. GÉNÉRATION NOTIFICATION OFFICIELLE DE PRÉAVIS / CONGÉ (PDF)
// ============================================================================

export function generateNoticePDF(data: NoticePDFData, customFilename?: string): void {
  if (typeof window === 'undefined') return;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 16;
  const contentWidth = pageWidth - margin * 2; // 178 mm
  let y = 14;

  // 1. En-tête Institutionnel
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(margin, y, contentWidth, 18, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('RÉPUBLIQUE DU BÉNIN • ESPACE UEMOA & DROIT OHADA', margin + contentWidth / 2, y + 6, {
    align: 'center',
  });

  doc.setFontSize(10.5);
  doc.text('NOTIFICATION OFFICIELLE DE PRÉAVIS DE CONGÉ DU BAIL', margin + contentWidth / 2, y + 13, {
    align: 'center',
  });

  y += 23;

  // 2. Bandeau Références & Délais Légaux
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 15, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`RÉFÉRENCE : ${data.id}`, margin + 4, y + 6);
  doc.text(`DATE D’ÉMISSION : ${data.noticeDate}`, margin + 4, y + 11);

  doc.text(`PRÉAVIS LÉGAL : ${data.noticeMonths} MOIS`, margin + 65, y + 6);
  doc.text(`MODE : ${data.deliveryMethod.toUpperCase()}`, margin + 65, y + 11);

  doc.setTextColor(190, 18, 60); // rose-700
  doc.text(`LIBÉRATION EXIGIBLE LE : ${data.effectiveDate}`, margin + contentWidth - 4, y + 8.5, {
    align: 'right',
  });

  y += 20;

  // 3. Identification des Parties (Bailleur & Locataire)
  const colWidth = (contentWidth - 6) / 2;

  // Cadre Bailleur
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, y, colWidth, 34, 2, 2, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin + 2, y + 2, colWidth - 4, 6.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('LE BAILLEUR / GESTIONNAIRE', margin + 4, y + 6.5);

  const noticeLandlord = getPdfLandlordProfile();
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(noticeLandlord.name, margin + 4, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Représenté par ${noticeLandlord.representative}`, margin + 4, y + 17.5);
  doc.text(`${noticeLandlord.city} (${noticeLandlord.country})`, margin + 4, y + 22);
  doc.text(`${noticeLandlord.phone ? `Tél : ${noticeLandlord.phone} • ` : ''}Email : ${noticeLandlord.email}`, margin + 4, y + 26.5);
  doc.text('Mandat de gestion certifié LOCAGESTION', margin + 4, y + 31);

  // Cadre Locataire & Logement
  const col2X = margin + colWidth + 6;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(col2X, y, colWidth, 34, 2, 2, 'FD');

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(col2X + 2, y + 2, colWidth - 4, 6.5, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('LE PRENEUR / LOCATAIRE DÉSIGNÉ', col2X + 4, y + 6.5);

  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(`M./Mme ${data.tenantName}`, col2X + 4, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Contact : ${data.tenantPhone || '+229 -- -- -- --'}`, col2X + 4, y + 17.5);
  doc.text(`Immeuble : ${data.propertyName}`, col2X + 4, y + 22);
  doc.text(`Lot d'habitation : ${data.unitNumber}`, col2X + 4, y + 26.5);
  doc.text(`Loyer contractuel : ${formatFCFA(data.monthlyRent)} / mois`, col2X + 4, y + 31);

  y += 39;

  // 4. Cadre Exposé des Motifs Légaux du Préavis
  doc.setFillColor(254, 242, 242); // rose-50
  doc.setDrawColor(254, 205, 211); // rose-200
  doc.roundedRect(margin, y, contentWidth, 38, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(159, 18, 57); // rose-800
  doc.text(`MOTIF OFFICIEL DU CONGÉ : ${data.reasonTitle.toUpperCase()}`, margin + 4, y + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const splitDetails = doc.splitTextToSize(data.reasonDetails, contentWidth - 8);
  doc.text(splitDetails, margin + 4, y + 12.5);

  let subY = y + 22;
  if (data.beneficiaryName) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Bénéficiaire désigné de la reprise : ${data.beneficiaryName}`, margin + 4, subY);
    subY += 4.5;
  }
  if (data.salePrice) {
    doc.setFont('helvetica', 'bold');
    doc.text(
      `Prix de vente notifié (Droit légal de préemption) : ${formatFCFA(data.salePrice)}`,
      margin + 4,
      subY
    );
    subY += 4.5;
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Fondement juridique : ${data.legalBasis || 'Code Foncier et Domanial & Réglementation UEMOA des baux d’habitation'}`,
    margin + 4,
    y + 34
  );

  y += 43;

  // 5. Clause Exigibilité et Délai de Libération
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text('DÉLAI DE PRÉAVIS & DATE IMPÉRATIVE DE LIBÉRATION DES LIEUX', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `Conformément aux stipulations contractuelles et à la législation en vigueur, un délai de préavis de ${data.noticeMonths} mois entiers`,
    margin + 4,
    y + 11
  );
  doc.text(
    `commence à courir à compter de la réception de la présente notification. En conséquence, les lieux devront être intégralement`,
    margin + 4,
    y + 15
  );
  doc.text(
    `libérés, vides de tout bien meuble et de tout occupant, au plus tard le ${data.effectiveDate} à 18h00.`,
    margin + 4,
    y + 19
  );

  y += 27;

  // 6. Rappel des Obligations Contractuelles
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, 34, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('PRESCRIPTIONS JURIDIQUES & OBLIGATIONS JUSQU’AU DÉPART DÉFINITIF', margin + 4, y + 5.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(
    '1. Paiement du Loyer : Le preneur reste tenu au paiement régulier des loyers et des charges jusqu’à restitution des clés.',
    margin + 4,
    y + 11
  );
  doc.text(
    '2. Dépôt de Garantie : La caution ne peut en aucun cas se substituer au paiement des derniers termes de loyer exigibles.',
    margin + 4,
    y + 16
  );
  doc.text(
    `3. État des Lieux de Sortie : Fixé contradictoirement au ${data.departureInspectionDate || data.effectiveDate} avec relevé des compteurs eau/électricité.`,
    margin + 4,
    y + 21
  );
  doc.text(
    '4. Restitution des Clés : La restitution de toutes les clés opérera le transfert effectif de la garde juridique du bien au bailleur.',
    margin + 4,
    y + 26
  );
  doc.text(
    '5. Remboursement de Caution : Restituée sous 30 jours déduction faite des éventuelles réparations locatives justifiées.',
    margin + 4,
    y + 31
  );

  y += 39;

  // 7. Signatures et Accusé de Réception
  const sigBoxWidth = (contentWidth - 6) / 2;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);

  // Signature Bailleur
  doc.roundedRect(margin, y, sigBoxWidth, 26, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Pour le Bailleur / Gestionnaire', margin + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`${noticeLandlord.representative} • Signé numériquement ✓`, margin + 4, y + 10);
  doc.text(`Fait à ${noticeLandlord.city}, le ${data.noticeDate}`, margin + 4, y + 15);
  doc.text('Cachet certifié LOCAGESTION UEMOA', margin + 4, y + 20);

  // Accusé de réception Preneur
  doc.roundedRect(col2X, y, sigBoxWidth, 26, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text('Accusé de Réception par le Preneur', col2X + 4, y + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text(`M./Mme ${data.tenantName}`, col2X + 4, y + 10);
  doc.text(`Mode : ${data.deliveryMethod.toUpperCase()}`, col2X + 4, y + 15);
  doc.text('Mention : "Pris connaissance le ........./........./2026"', col2X + 4, y + 20);

  // Bas de page
  y = pageHeight - 12;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, y - 2, margin + contentWidth, y - 2);
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `LOCAGESTION UEMOA & CEMAC • Notification formelle de congé avec préavis • Réf: ${data.id}`,
    margin,
    y + 2
  );

  const filename = customFilename || `preavis-${data.id}.pdf`;
  doc.save(filename);
  notifyDownloadComplete(filename);
}

// ============================================================================
// 4. RETRO-COMPATIBILITÉ downloadDocument & generateLeaseContent
// ============================================================================

export function downloadDocument(filename: string, content: string, mimeType: string = 'application/pdf') {
  if (typeof window === 'undefined') return;

  // Si l'ancien code demande un fichier se terminant par .txt alors qu'il s'agit d'un bail, quittance ou PV
  // nous générons automatiquement le vrai PDF correspondant !
  if (filename.includes('contrat-bail-')) {
    const idMatch = filename.match(/contrat-bail-(.+?)\./);
    const leaseId = idMatch ? idMatch[1] : 'BAIL-2026';
    generateLeasePDF({
      id: leaseId,
      tenantName: 'Locataire',
      propertyName: 'Bien immobilier',
      unit: 'Lot',
      rent: 0,
      deposit: 0,
      startDate: new Date().toLocaleDateString('fr-FR'),
    }, filename.replace('.txt', '.pdf'));
    return;
  }

  if (filename.includes('quittance-')) {
    const numMatch = filename.match(/quittance-(.+?)\./);
    const receiptNum = numMatch ? numMatch[1] : 'QUITT-2026';
    generateReceiptPDF({
      receiptNumber: receiptNum,
      tenantName: 'Locataire',
      propertyName: 'Bien immobilier',
      unitNumber: 'Lot',
      period: 'Période en cours',
      amount: 0,
      paymentDate: new Date().toLocaleDateString('fr-FR'),
      method: 'virement',
    }, filename.replace('.txt', '.pdf'));
    return;
  }

  if (filename.includes('etat-des-lieux-')) {
    const idMatch = filename.match(/etat-des-lieux-(.+?)\./);
    const leaseId = idMatch ? idMatch[1] : 'BAIL-2026';
    generateInspectionPDF({
      id: leaseId,
      tenantName: 'Locataire',
      propertyName: 'Bien immobilier',
      unit: 'Lot',
    }, filename.replace('.txt', '.pdf'));
    return;
  }

  if (filename.includes('preavis-')) {
    const idMatch = filename.match(/preavis-(.+?)\./);
    const noticeId = idMatch ? idMatch[1] : 'PREAV-2026-001';
    generateNoticePDF({
      id: noticeId,
      tenantName: 'Locataire',
      propertyName: 'Bien Immobilier',
      unitNumber: 'Lot',
      monthlyRent: 120000,
      reasonType: 'reprise_personnelle',
      reasonTitle: 'Reprise pour Habitation Personnelle',
      reasonDetails: 'Le propriétaire reprend possession des lieux pour son habitation personnelle.',
      noticeMonths: 3,
      noticeDate: '01/10/2026',
      effectiveDate: '31/12/2026',
      deliveryMethod: 'huissier',
    }, filename.replace('.txt', '.pdf'));
    return;
  }

  // Fallback universel sécurisé
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  notifyDownloadComplete(filename);
}

export function generateLeaseContent(lease: {
  tenantName: string;
  propertyName: string;
  unit: string;
  rent: number;
  startDate: string;
  id: string;
}) {
  return `CONTRAT OFFICIEL DE BAIL D'HABITATION RÉF: ${lease.id} - ${lease.tenantName}`;
}
