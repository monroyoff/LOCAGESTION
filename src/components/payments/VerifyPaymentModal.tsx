'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
  User,
  Phone,
  FileText,
  AlertCircle,
  Eye,
  Download,
  Ban,
  Sparkles,
} from 'lucide-react';
import { PaymentTransaction } from '@/lib/types';
import { formatFCFA } from '@/lib/money/format';
import { PaymentService, MONTHS_OF_YEAR } from '@/lib/services/payment-service';
import { notifySave } from '@/lib/notifications/action-notifier';

interface VerifyPaymentModalProps {
  isOpen: boolean;
  payment: PaymentTransaction | null;
  onClose: () => void;
  onVerified: (verifiedPayment: PaymentTransaction) => void;
}

export function VerifyPaymentModal({
  isOpen,
  payment,
  onClose,
  onVerified,
}: VerifyPaymentModalProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('Novembre 2026');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (payment) {
      setSelectedMonth(payment.period || 'Novembre 2026');
      setShowRejectForm(false);
      setRejectionReason('');
    }
  }, [payment]);

  if (!isOpen || !payment) return null;

  const handleApprove = () => {
    setIsSubmitting(true);
    const result = PaymentService.verifyPayment(payment.id, {
      period: selectedMonth,
      approved: true,
    });

    if (result.success && result.payment) {
      const msg = `Paiement de ${formatFCFA(payment.amount)} pour la période ${selectedMonth} validé ! Quittance officielle ${result.receiptNumber} émise automatiquement pour le bailleur et le locataire.`;
      notifySave(msg, 'Quittance & Reçu générés avec succès !');
      onVerified(result.payment);
    }
    setIsSubmitting(false);
  };

  const handleReject = () => {
    if (!showRejectForm) {
      setShowRejectForm(true);
      return;
    }
    setIsSubmitting(true);
    PaymentService.verifyPayment(payment.id, {
      period: selectedMonth,
      approved: false,
      rejectionReason: rejectionReason || 'Paiement non constaté sur le compte',
    });
    notifySave(
      `Le paiement de ${formatFCFA(payment.amount)} a été rejeté. Le locataire a été notifié.`,
      'Paiement rejeté'
    );
    setIsSubmitting(false);
    onClose();
  };

  const getMethodBadge = (m: string) => {
    switch (m) {
      case 'wave':
        return { label: 'Wave Money', color: 'bg-sky-50 text-sky-700 border-sky-200' };
      case 'mtn_momo':
        return { label: 'MTN Mobile Money', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      case 'moov_money':
        return { label: 'Moov Money', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'orange_money':
        return { label: 'Orange Money', color: 'bg-orange-50 text-orange-700 border-orange-200' };
      case 'virement':
        return { label: 'Virement bancaire', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      default:
        return { label: m.toUpperCase(), color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  const badge = getMethodBadge(payment.method);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black shadow-md shadow-emerald-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Vérifier le Paiement & Émettre la Quittance
                </h2>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Demande de validation de loyer déclarée par le locataire
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Fiche récapitulative du versement */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3.5">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <img
                  src={
                    payment.tenantAvatar ||
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80'
                  }
                  alt={payment.tenantName}
                  className="w-11 h-11 rounded-2xl object-cover ring-2 ring-slate-200"
                />
                <div>
                  <h4 className="text-sm font-black text-slate-900">{payment.tenantName}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {payment.propertyName} • {payment.unitNumber}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-base sm:text-lg font-black text-emerald-600 block">
                  {formatFCFA(payment.amount)}
                </span>
                <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-full border mt-1 ${badge.color}`}>
                  {badge.label}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-200/60 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">Date déclarée :</span>
                <span className="font-bold text-slate-800">{payment.paymentDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] font-semibold">Référence transaction :</span>
                <span className="font-mono font-bold text-slate-800 truncate block">
                  {payment.transactionRef || payment.receiptNumber || 'N/A'}
                </span>
              </div>
            </div>

            {/* Justificatif / Preuve */}
            {payment.proofUrl && (
              <div className="pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 block text-[11px] font-semibold mb-1.5">
                  Justificatif de versement :
                </span>
                <div className="relative rounded-xl overflow-hidden border border-slate-200 group max-h-36 bg-slate-900">
                  <img
                    src={payment.proofUrl}
                    alt="Preuve de versement"
                    className="w-full h-36 object-cover opacity-85 group-hover:opacity-100 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={payment.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white text-slate-900 text-xs font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Agrandir le justificatif</span>
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SÉLECTION DU MOIS CONCERNÉ (LISTE DÉROULANTE FACILE) */}
          <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200/80 space-y-2.5">
            <label className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>Mois concerné par ce règlement de loyer (Obligatoire)</span>
            </label>
            <div className="relative">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-white border border-brand-300 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer shadow-xs"
              >
                {MONTHS_OF_YEAR.map((month) => (
                  <option key={month} value={month}>
                    🗓️ Loyer de {month}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                ▼
              </div>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              Ce mois sera certifié sur la <strong>quittance officielle UEMOA & CEMAC</strong> et le <strong>reçu de caisse</strong> générés automatiquement pour vous et pour le locataire.
            </p>
          </div>

          {/* Formulaire de rejet si demandé */}
          {showRejectForm && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2 animate-in fade-in">
              <label className="text-xs font-black text-rose-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Motif du rejet (transmis au locataire)</span>
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="ex: Transaction non trouvée sur le compte Wave, montant incomplet..."
                className="w-full px-3.5 py-2 rounded-xl bg-white border border-rose-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </div>
          )}

          {/* Actions : Valider ou Rejeter */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReject}
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                showRejectForm
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20'
                  : 'bg-slate-100 hover:bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              <Ban className="w-4 h-4" />
              <span>{showRejectForm ? 'Confirmer le rejet' : 'Rejeter / Non reçu'}</span>
            </button>

            <button
              type="button"
              onClick={handleApprove}
              disabled={isSubmitting}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-lg shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[3]" />
              <span>Valider le paiement & Générer la Quittance</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

