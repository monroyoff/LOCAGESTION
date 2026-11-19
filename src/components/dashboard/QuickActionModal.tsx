'use client';

import React, { useState, useEffect } from 'react';
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
import { notifySave } from '@/lib/notifications/action-notifier';
import { LeaseService } from '@/lib/services/lease-service';

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
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('wave');
  const [periodChoice, setPeriodChoice] = useState('Novembre 2026');
  const [propertyChoice, setPropertyChoice] = useState('');
  const [unitChoice, setUnitChoice] = useState('');
  const [propertiesList, setPropertiesList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('locagestion:properties:v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPropertiesList(parsed.map((p: any) => ({ id: p.id, name: p.name })));
          setPropertyChoice(parsed[0].name);
        }
      }
    } catch {}
  }, []);

  if (!actionType) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (actionType === 'new_payment') {
      const msg = `Encaissement de ${formatFCFA(amount)} (${periodChoice}) enregistré avec succès pour ${tenantName || 'le locataire'}.`;
      onSuccess(msg);
      notifySave(msg, 'Encaissement enregistré !');
    } else if (actionType === 'new_lease') {
      const msg = `Contrat de bail généré pour ${tenantName || 'le locataire'} sur ${unitChoice}.`;
      onSuccess(msg);
      notifySave(msg, 'Bail généré avec succès !');
    } else {
      const msg = `Nouvelle résidence enregistrée dans le parc immobilier.`;
      onSuccess(msg);
      notifySave(msg, 'Résidence enregistrée !');
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
                  ? 'Encaisser / Déclarer un Paiement de Loyer'
                  : actionType === 'new_lease'
                  ? 'Création d’un Nouveau Bail'
                  : 'Ajouter un Bien / Immeuble'}
              </h3>
              <p className="text-[10px] text-slate-400">
                Opération rapide • Zone UEMOA & CEMAC
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
                {LeaseService.getLeases().length > 0 ? (
                  <select
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="">-- Sélectionner un locataire --</option>
                    {LeaseService.getLeases().map((l) => (
                      <option key={l.id} value={l.tenant}>
                        {l.tenant} ({l.property} - {l.unit})
                      </option>
                    ))}
                    <option value="Autre locataire">Autre locataire</option>
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="Nom complet du locataire"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                )}
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
                    placeholder="Ex: 50000"
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
                <label className="text-xs font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                  <span>Période concernée (Mois du loyer) *</span>
                  <span className="text-[10px] text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                    {periodChoice}
                  </span>
                </label>
                <select
                  value={periodChoice}
                  onChange={(e) => setPeriodChoice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                >
                  <optgroup label="Exercice 2026 (Année en cours)">
                    <option value="Novembre 2026">Novembre 2026 (Mois en cours)</option>
                    <option value="Octobre 2026">Octobre 2026</option>
                    <option value="Septembre 2026">Septembre 2026</option>
                    <option value="Août 2026">Août 2026</option>
                    <option value="Juillet 2026">Juillet 2026</option>
                    <option value="Juin 2026">Juin 2026</option>
                    <option value="Mai 2026">Mai 2026</option>
                    <option value="Avril 2026">Avril 2026</option>
                    <option value="Mars 2026">Mars 2026</option>
                    <option value="Février 2026">Février 2026</option>
                    <option value="Janvier 2026">Janvier 2026</option>
                    <option value="Décembre 2026">Décembre 2026</option>
                  </optgroup>
                  <optgroup label="Régularisations & Arriérés 2025">
                    <option value="Décembre 2025">Décembre 2025</option>
                    <option value="Novembre 2025">Novembre 2025</option>
                    <option value="Octobre 2025">Octobre 2025</option>
                    <option value="Septembre 2025">Septembre 2025</option>
                  </optgroup>
                  <optgroup label="Avances de Loyer 2027">
                    <option value="Janvier 2027">Janvier 2027</option>
                    <option value="Février 2027">Février 2027</option>
                  </optgroup>
                </select>
              </div>
            </>
          )}

          {actionType === 'new_lease' && (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Bien & Résidence
                </label>
                {propertiesList.length > 0 ? (
                  <select
                    value={propertyChoice}
                    onChange={(e) => setPropertyChoice(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                  >
                    {propertiesList.map((p) => (
                      <option key={p.id} value={p.name}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={propertyChoice}
                    onChange={(e) => setPropertyChoice(e.target.value)}
                    placeholder="Nom du bien immobilier"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Lot / N° de porte
                  </label>
                  <input
                    type="text"
                    value={unitChoice}
                    onChange={(e) => setUnitChoice(e.target.value)}
                    placeholder="Ex: Lot 1, Appt 2..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Loyer mensuel (FCFA)
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 50000"
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

