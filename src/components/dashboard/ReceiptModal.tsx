'use client';

import React from 'react';
import {
  X,
  Printer,
  Download,
  Share2,
  ShieldCheck,
  QrCode,
  Building2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { PaymentTransaction } from '@/lib/types';
import { formatFCFA } from '@/lib/money/format';
import { downloadDocument } from '@/lib/export/pdf-download';

interface ReceiptModalProps {
  payment: PaymentTransaction | null;
  onClose: () => void;
}

export function ReceiptModal({ payment, onClose }: ReceiptModalProps) {
  if (!payment) return null;

  const handleDownloadQuittance = () => {
    const quittanceContent = `================================================================================
                    RÉPUBLIQUE DU BÉNIN / ZONE UEMOA & OHADA
              QUITTANCE DE LOYER OFFICIELLE CERTIFIÉE
================================================================================
RÉFÉRENCE QUITTANCE : ${payment.receiptNumber}
DATE D'ÉMISSION     : ${payment.paymentDate}
STATUT DU PAIEMENT  : LOYER INTÉGRALEMENT SOLDÉ (Conforme UEMOA & OHADA)

1. BAILLEUR ÉMETTEUR :
   DIALLO PATRIMOINE SARL
   Rue 340 Haie Vive • Cotonou, République du Bénin
   IFU : 0202110485960 • RCCM : RB/COT/21 B 1042
   Tél : +229 01 95 44 44 30 • contact@diallo-patrimoine.bj

2. LOCATAIRE TITULAIRE :
   ${payment.tenantName}
   Résidant : ${payment.propertyName} - Lot ${payment.unitNumber}

3. DÉTAIL DES MONTANTS :
   - Période : ${payment.period}
   - Mode de règlement : ${payment.method}
   - Total quittancé et encaissé : ${payment.amount.toLocaleString('fr-FR')} FCFA

ATTESTATION LÉGALE :
Je soussigné, représentant légal de DIALLO PATRIMOINE SARL, reconnais avoir reçu de M./Mme
${payment.tenantName} la somme de ${payment.amount.toLocaleString('fr-FR')} FCFA au titre du règlement
du loyer pour la période susmentionnée.

Signé numériquement par Mamadou Diallo • Gérant
Empreinte SHA-256 certifiée • Code vérification : /verify/${payment.id}
================================================================================`;

    downloadDocument(`quittance-${payment.receiptNumber}.txt`, quittanceContent);
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white font-black text-sm">
              Ω
            </div>
            <div>
              <span className="text-xs font-bold text-white block">
                Quittance de Loyer Officielle Certifiée
              </span>
              <span className="text-[10px] text-slate-400 block">
                Réf : {payment.receiptNumber} • Conforme UEMOA & OHADA
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
              title="Imprimer"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Receipt Body (Printable Paper Style) */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-800 bg-[#FAFBFD]">
          {/* Paper Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-widest block mb-1">
                Bailleur Émetteur
              </span>
              <h2 className="text-xl font-black text-slate-900">
                DIALLO PATRIMOINE SARL
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Rue 340 Haie Vive • Cotonou, République du Bénin<br />
                IFU: 0202110485960 • RCCM: RB/COT/21 B 1042<br />
                Tél : +229 01 95 44 44 30 • contact@diallo-patrimoine.bj
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                LOYER INTÉGRALEMENT SOLDÉ
              </span>
              <div className="mt-2 text-xs text-slate-500">
                Date d’émission : <strong>{payment.paymentDate}</strong>
              </div>
            </div>
          </div>

          {/* Tenant & Unit Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Locataire Titulaire
              </span>
              <h4 className="font-extrabold text-sm text-slate-900">
                {payment.tenantName}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">{payment.tenantPhone}</p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Logement Loué
              </span>
              <h4 className="font-extrabold text-sm text-slate-900">
                {payment.propertyName}
              </h4>
              <p className="text-xs text-brand-600 font-bold mt-0.5">
                {payment.unitNumber}
              </p>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold">
                <tr>
                  <th className="py-2.5 px-4">Désignation</th>
                  <th className="py-2.5 px-4">Période</th>
                  <th className="py-2.5 px-4 text-right">Montant</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    Loyer principal d’habitation
                  </td>
                  <td className="py-3 px-4 text-slate-500">{payment.period}</td>
                  <td className="py-3 px-4 text-right font-bold text-slate-900">
                    {formatFCFA(payment.amount)}
                  </td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-800">
                    Charges locatives & gardiennage
                  </td>
                  <td className="py-3 px-4 text-slate-500">{payment.period}</td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600">
                    Inclus (0 FCFA)
                  </td>
                </tr>
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200 font-extrabold">
                <tr>
                  <td colSpan={2} className="py-3 px-4 text-slate-900 text-sm">
                    Total Quittancé et Encaissé
                  </td>
                  <td className="py-3 px-4 text-right text-base text-brand-600">
                    {formatFCFA(payment.amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Legal statement & Seal */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 text-xs text-slate-700 leading-relaxed flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Je soussigné, représentant légal de <strong>DIALLO PATRIMOINE SARL</strong>,
              reconnais avoir reçu de M./Mme <strong>{payment.tenantName}</strong> la somme
              de <strong>{formatFCFA(payment.amount)}</strong> au titre du règlement du loyer
              pour la période de <strong>{payment.period}</strong>, pour le logement situé à{' '}
              <strong>{payment.propertyName} ({payment.unitNumber})</strong>.
            </p>
          </div>

          {/* Digital Signature & Verification QR */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
            {/* Stamp & Signature */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl border-2 border-brand-500/40 border-dashed flex flex-col items-center justify-center p-2 text-center text-brand-600">
                <span className="text-[8px] font-black uppercase">Cachet Électronique</span>
                <span className="text-[9px] font-bold">LOCAGESTION</span>
                <span className="text-[7px]">Certifié UEMOA</span>
              </div>
              <div className="text-xs text-slate-500">
                <span className="font-bold text-slate-800 block">Signé numériquement</span>
                <span>Mamadou Diallo • Gérant</span>
              </div>
            </div>

            {/* QR Code */}
            <div className="flex items-center gap-3 text-right">
              <div className="text-xs text-slate-500 hidden sm:block">
                <span className="font-bold text-slate-800 block">Vérification en ligne</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  code: /verify/{payment.id}
                </span>
              </div>
              <div className="w-14 h-14 bg-white p-1 rounded-xl border border-slate-300 shadow-sm flex items-center justify-center">
                <QrCode className="w-12 h-12 text-slate-800" />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">
            Format officiel A4 conforme OHADA
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              Fermer
            </button>
            <button
              onClick={handleDownloadQuittance}
              className="py-2 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-pink-glow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger Quittance (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

