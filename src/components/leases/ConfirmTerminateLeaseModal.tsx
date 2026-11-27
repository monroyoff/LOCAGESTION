'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Ban,
  X,
  FileText,
  User,
  Building,
  RotateCcw,
  Check,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';

export interface ConfirmTerminateLeaseModalProps {
  isOpen: boolean;
  lease: {
    id: string;
    tenant: string;
    property?: string;
    unit?: string;
    rent?: number;
  } | null;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

const REASON_PRESETS = [
  'Résiliation à la demande du bailleur',
  'Accord amiable avec le locataire',
  'Congé pour reprise personnelle ou vente',
  'Fin de bail / Non renouvellement',
  'Impayés ou manquement aux clauses',
];

export function ConfirmTerminateLeaseModal({
  isOpen,
  lease,
  onClose,
  onConfirm,
}: ConfirmTerminateLeaseModalProps) {
  const [selectedReason, setSelectedReason] = useState(REASON_PRESETS[0]);
  const [customReason, setCustomReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !lease) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const finalReason = customReason.trim() ? customReason.trim() : selectedReason;
    onConfirm(finalReason);
    setIsSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="p-6 bg-gradient-to-r from-rose-50 via-white to-rose-50/40 border-b border-rose-100 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 border border-rose-200 flex items-center justify-center shrink-0 shadow-inner">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                Êtes-vous sûr de vouloir résilier ce bail ?
              </h3>
              <p className="text-xs text-rose-700 font-bold mt-0.5">
                Clôture officielle et déplacement dans l'Historique de bail
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer shrink-0"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Corps */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Récapitulatif du contrat */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Contrat sélectionné
              </span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-800 shadow-xs">
                {lease.id}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <div className="flex items-center gap-2 text-xs">
                <User className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">Locataire :</span>
                <span className="font-extrabold text-slate-900 truncate">
                  {lease.tenant}
                </span>
              </div>

              {lease.rent !== undefined && (
                <div className="flex items-center gap-2 text-xs">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500">Loyer :</span>
                  <span className="font-extrabold text-brand-600">
                    {formatFCFA(lease.rent)}
                  </span>
                </div>
              )}

              <div className="sm:col-span-2 flex items-center gap-2 text-xs">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-slate-500">Logement :</span>
                <span className="font-bold text-slate-800 truncate">
                  {lease.property ? `${lease.property} • ` : ''}
                  {lease.unit || 'Lot d’habitation'}
                </span>
              </div>
            </div>
          </div>

          {/* Motif de la résiliation */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Motif de la résiliation (facultatif) :
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full text-xs font-bold px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              {REASON_PRESETS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Note de rassurance anti-fausse manœuvre et archivage */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
            <RotateCcw className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-black block">
                Déplacement dans l'Historique de bail & réactivation en 1 clic :
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Ce contrat sera déplacé vers votre onglet <strong>📜 Historique de bail</strong> où il restera conservé avec ses quittances, photos et signatures certifiées. Vous pourrez le réactiver à tout moment en <strong>1 seul clic</strong> pour le restaurer parmi vos baux en cours.
              </p>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Ban className="w-4 h-4" />
              <span>{isSubmitting ? 'Résiliation en cours...' : 'Oui, résilier ce bail'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

