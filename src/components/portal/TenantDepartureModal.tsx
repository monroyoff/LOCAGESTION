'use client';

import React, { useState } from 'react';
import {
  X,
  FileWarning,
  Calendar,
  Clock,
  Send,
  Building2,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { NoticeService } from '@/lib/services/notice-service';
import { notifySave } from '@/lib/notifications/action-notifier';

interface TenantDepartureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  tenantName?: string;
  tenantPhone?: string;
  tenantEmail?: string;
  propertyName?: string;
  unitNumber?: string;
  monthlyRent?: number;
  landlordName?: string;
  landlordEmail?: string;
  landlordPhone?: string;
}

const DEPARTURE_REASONS = [
  'Mutation professionnelle / Changement de lieu de travail',
  'Acquisition d’un logement personnel / Déménagement propriétaire',
  'Logement devenu inadapté ou agrandissement du foyer',
  'Rapprochement familial ou fin d’études',
  'Autre motif personnel',
];

export function TenantDepartureModal({
  isOpen,
  onClose,
  onSuccess,
  tenantName = 'Locataire',
  tenantPhone = '',
  tenantEmail = '',
  propertyName = 'Logement',
  unitNumber = 'Lot',
  monthlyRent = 0,
  landlordName = '',
  landlordEmail = '',
  landlordPhone = '',
}: TenantDepartureModalProps) {
  const [noticeMonths, setNoticeMonths] = useState<number>(3);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [reasonDetails, setReasonDetails] = useState<string>('');

  // Date effective par défaut (Aujourd'hui + noticeMonths mois)
  const calculateDefaultEffectiveDate = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    // Dernier jour du mois visé
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    return `${String(lastDay.getDate()).padStart(2, '0')}/${String(lastDay.getMonth() + 1).padStart(2, '0')}/${lastDay.getFullYear()}`;
  };

  const [effectiveDate, setEffectiveDate] = useState<string>(calculateDefaultEffectiveDate(3));
  const [confirmInspection, setConfirmInspection] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectMonths = (m: number) => {
    setNoticeMonths(m);
    setEffectiveDate(calculateDefaultEffectiveDate(m));
  };

  const handleReasonClick = (reason: string) => {
    setSelectedReason(reason);
    if (reason.includes('Mutation')) {
      setReasonDetails(
        'Je vous notifie mon préavis de départ en raison d’une mutation professionnelle intervenant prochainement. Je sollicite l’organisation conjointe de l’état des lieux de sortie.'
      );
    } else if (reason.includes('Acquisition')) {
      setReasonDetails(
        'Je vous informe de la libération prochaine des lieux suite à l’acquisition de mon logement principal. Je me tiens à votre entière disposition pour fixer la date de remise des clés.'
      );
    } else if (reason.includes('inadapté')) {
      setReasonDetails(
        'Ce préavis est motivé par la nécessité d’emménager dans un logement plus adapté à ma situation familiale. Les locaux seront libérés propres et conformes à l’état d’entrée.'
      );
    } else {
      setReasonDetails(
        'Je vous donne congé par la présente conformément au délai légal et contractuel. Les loyers et charges continueront d’être honorés jusqu’à l’échéance convenue.'
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      NoticeService.addTenantDepartureNotice({
        tenantName,
        tenantPhone,
        tenantEmail,
        propertyName,
        unitNumber,
        monthlyRent,
        noticeMonths,
        effectiveDate,
        reasonDetails: `${selectedReason} — ${reasonDetails}`,
        landlordName,
        landlordEmail,
        landlordPhone,
      });

      notifySave(
        `Préavis de départ officiel transmis au bailleur pour le ${effectiveDate}.`,
        'Préavis notifié avec succès !'
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Erreur lors de l’émission du préavis:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200/90 flex flex-col">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <FileWarning className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Notifier un Préavis de Départ
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Résiliation légale du bail à l’initiative du locataire
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Récapitulatif du logement */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-slate-500" />
              <div>
                <span className="font-bold text-slate-900">{propertyName}</span>
                <span className="text-slate-500 ml-1.5 font-medium">• {unitNumber}</span>
              </div>
            </div>
            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {monthlyRent.toLocaleString()} FCFA/mois
            </span>
          </div>

          {/* Durée du préavis contractuel */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700 flex items-center justify-between">
              <span>Délai de préavis appliqué</span>
              <span className="text-[11px] font-semibold text-slate-400">
                Conforme au Code Foncier UEMOA
              </span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectMonths(m)}
                  className={`py-2.5 px-3 rounded-2xl text-xs font-bold border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    noticeMonths === m
                      ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-sm font-black">{m} {m > 1 ? 'Mois' : 'Mois'}</span>
                  <span className={`text-[10px] ${noticeMonths === m ? 'text-rose-100' : 'text-slate-400'}`}>
                    {m === 3 ? 'Standard UEMOA' : 'Dérogatoire'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Date d'effet / Date impérative de libération */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-rose-500" />
              <span>Date de libération définitive & remise des clés</span>
            </label>
            <input
              type="text"
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              placeholder="JJ/MM/AAAA (ex: 31/01/2027)"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-mono"
              required
            />
          </div>

          {/* Motifs suggérés */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-700">
              Motif du congé (Sélection rapide)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DEPARTURE_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleReasonClick(r)}
                  className={`text-[11px] px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-left ${
                    selectedReason === r
                      ? 'bg-rose-50 text-rose-700 border-rose-300 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Exposé détaillé des motifs & engagement */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Contenu de la notification transmise au bailleur</span>
            </label>
            <textarea
              rows={4}
              value={reasonDetails}
              onChange={(e) => setReasonDetails(e.target.value)}
              className="w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all leading-relaxed"
              required
            />
          </div>

          {/* Accord sur l'état des lieux de sortie */}
          <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmInspection}
              onChange={(e) => setConfirmInspection(e.target.checked)}
              className="w-4 h-4 mt-0.5 rounded text-rose-600 focus:ring-rose-500"
            />
            <div className="text-[11px] text-amber-900 leading-snug">
              <span className="font-bold block">Engagement sur les obligations locatives</span>
              Je m’engage à régler l’ensemble des loyers jusqu’au terme du préavis, à libérer les locaux vides de tout occupant et meuble, et à participer à l’état des lieux de sortie contradictoire.
            </div>
          </label>

          {/* Footer actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !confirmInspection}
              className="px-5 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-rose-600/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Transmission...' : 'Notifier le Préavis au Bailleur'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
