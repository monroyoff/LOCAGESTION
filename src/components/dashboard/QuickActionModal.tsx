'use client';

import React, { useState } from 'react';
import {
  X,
  FileText,
  Receipt,
  Building,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';

interface QuickActionModalProps {
  actionType: 'new_lease' | 'new_payment' | 'new_property' | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function QuickActionModal({
  actionType,
  onClose,
  onSuccess,
}: QuickActionModalProps) {
  const [tenantName, setTenantName] = useState('');
  const [amount, setAmount] = useState('220000');
  const [method, setMethod] = useState('wave');
  const [propertyChoice, setPropertyChoice] = useState('Résidence Les Cocotiers');
  const [unitChoice, setUnitChoice] = useState('Appt B2 (3 pièces)');

  if (!actionType) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (actionType === 'new_payment') {
      onSuccess(`Encaissement de ${formatFCFA(amount)} enregistré avec succès pour ${tenantName || 'le locataire'}.`);
    } else if (actionType === 'new_lease') {
      onSuccess(`Contrat de bail généré pour ${tenantName || 'le locataire'} sur ${unitChoice}.`);
    } else {
      onSuccess(`Nouvelle résidence enregistrée dans le parc immobilier.`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white">
              {actionType === 'new_payment' ? (
                <Receipt className="w-4 h-4" />
              ) : actionType === 'new_lease' ? (
                <FileText className="w-4 h-4" />
              ) : (
                <Building className="w-4 h-4" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold">
                {actionType === 'new_payment'
                  ? 'Encaisser un Loyer / Émettre Reçu'
                  : actionType === 'new_lease'
                  ? 'Création d’un Nouveau Bail'
                  : 'Ajouter un Bien / Immeuble'}
              </h3>
              <p className="text-[10px] text-slate-400">
                Opération rapide • Zone UEMOA
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {actionType === 'new_payment' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Locataire
                </label>
                <select
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">-- Sélectionner un locataire --</option>
                  <option value="Fatoumata Traoré">Fatoumata Traoré (Appt B1 - Retard 180k FCFA)</option>
                  <option value="Sékou Camara">Sékou Camara (Appt 4B - Retard 240k FCFA)</option>
                  <option value="Jean-Yves Kouassi">Jean-Yves Kouassi (Studio B12 - Solde 50k FCFA)</option>
                  <option value="Autre locataire">Autre locataire</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Montant Perçu (FCFA)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    placeholder="220000"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Moyen de Paiement
                  </label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="wave">Wave (Mobile Money)</option>
                    <option value="mtn_momo">MTN Mobile Money</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="moov_money">Moov Money</option>
                    <option value="virement">Virement bancaire</option>
                    <option value="especes">Espèces (Reçu direct)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Période concernée
                </label>
                <input
                  type="text"
                  defaultValue="Octobre 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                />
              </div>
            </>
          )}

          {actionType === 'new_lease' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Bien & Résidence
                </label>
                <select
                  value={propertyChoice}
                  onChange={(e) => setPropertyChoice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                >
                  <option value="Résidence Les Cocotiers">Résidence Les Cocotiers (Haie Vive, Cotonou)</option>
                  <option value="Immeuble Palmier Royal">Immeuble Palmier Royal (Cocody, Abidjan)</option>
                  <option value="Villa Émeraude">Villa Émeraude (Almadies, Dakar)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Lot / N° de porte
                  </label>
                  <input
                    type="text"
                    defaultValue="Appt C4 (3 pièces)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Loyer mensuel (FCFA)
                  </label>
                  <input
                    type="number"
                    defaultValue="250000"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Nom du Locataire
                </label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="Ex: Babatundé Johnson"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                  required
                />
              </div>
            </>
          )}

          {/* Modal Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-pink-glow transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Valider & Générer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

