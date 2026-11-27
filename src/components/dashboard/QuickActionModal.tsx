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
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { notifySave } from '@/lib/notifications/action-notifier';
import { LeaseService } from '@/lib/services/lease-service';
import { PropertyService } from '@/lib/services/property-service';
import { AuthService } from '@/lib/services/auth-service';
import { PlanService } from '@/lib/services/plan-service';
import { UpgradePlanModal } from '@/components/plans/UpgradePlanModal';
import { Property } from '@/lib/types';

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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const currentUser = AuthService.getCurrentUser();
  const currentPlan = PlanService.getUserPlan(currentUser?.id);
  const isMethodRestricted =
    actionType === 'new_payment' &&
    (method === 'especes' || method === 'virement') &&
    currentPlan === 'serenite';

  useEffect(() => {
    try {
      const allProps = PropertyService.getPropertiesForUser(currentUser, false);
      if (allProps.length > 0) {
        setPropertiesList(allProps.map((p) => ({ id: p.id, name: p.name })));
        setPropertyChoice(allProps[0].name);
      } else {
        setPropertiesList([]);
        setPropertyChoice('');
      }
    } catch {}
  }, []);

  if (!actionType) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (actionType === 'new_payment') {
      const check = PlanService.canRecordPaymentMethod(currentUser?.id, method);
      if (!check.allowed) {
        notifySave(
          check.reason || 'Mode de paiement non autorisé sous votre formule actuelle.',
          'Formule Sérénité • Espèces non autorisées'
        );
        setShowUpgradeModal(true);
        return;
      }
      const msg = `Encaissement de ${formatFCFA(amount)} (${periodChoice}) enregistré avec succès pour ${tenantName || 'le locataire'}.`;
      onSuccess(msg);
      notifySave(msg, 'Encaissement enregistré !');
    } else if (actionType === 'new_lease') {
      const msg = `Contrat de bail généré pour ${tenantName || 'le locataire'} sur ${unitChoice}.`;
      onSuccess(msg);
      notifySave(msg, 'Bail généré avec succès !');
    } else {
      const propName = propertyChoice.trim() || 'Nouvelle Résidence';
      const rentVal = parseInt(amount, 10) || 0;
      const currentUser = AuthService.getCurrentUser();

      const newProp: Property = {
        id: `prop-${Date.now()}`,
        name: propName,
        type: 'Résidence',
        address: 'Centre-ville',
        city: currentUser?.residenceCity || 'Cotonou',
        district: currentUser?.residenceDistrict || 'Centre',
        country: currentUser?.projectCountry || currentUser?.residenceCountry || 'Bénin',
        totalUnits: 1,
        occupiedUnits: tenantName.trim() ? 1 : 0,
        monthlyRevenue: rentVal,
        imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
        images: ['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80'],
        description: `Propriété ${propName} enregistrée via action rapide.`,
        amenities: ['Compteurs individuels', 'Sécurisé'],
        unitsList: [
          {
            unit: unitChoice.trim() || 'Lot 1',
            type: 'Chambre Salon Sanitaire',
            surface: 45,
            rent: rentVal,
            tenant: tenantName.trim() || 'Disponible',
            status: tenantName.trim() ? 'occupe' : 'vacant',
          },
        ],
        authorId: currentUser?.id,
        authorName: currentUser?.name || 'Bailleur Propriétaire',
        authorEmail: currentUser?.email,
        authorPhone: currentUser?.phone,
        authorCompany: currentUser?.companyName,
        authorMatricule: currentUser?.matricule,
        authorRole: 'bailleur',
        createdAt: new Date().toLocaleDateString('fr-FR'),
      };

      PropertyService.saveProperty(newProp, currentUser);
      const msg = `La résidence « ${propName} » a été enregistrée dans votre patrimoine avec succès.`;
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

        {/* Modal Content */}
        {actionType === 'new_payment' && currentPlan === 'serenite' ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/30 text-amber-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-8 h-8 stroke-[2.2]" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                Formule Sérénité • Encaissement Bloqué
              </span>
              <h4 className="text-base font-extrabold text-slate-900 mt-2.5">
                Encaissement Manuel Non Autorisé
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed mt-2 max-w-sm mx-auto">
                La <strong>Formule Sérénité (0 FCFA fixe)</strong> repose exclusivement sur l’encaissement automatisé par Mobile Money (Wave, MTN MoMo, Moov Money, Orange Money, Celtiis Cash) avec 2% de commission.
              </p>
              <p className="text-xs text-slate-600 leading-relaxed mt-1.5 max-w-sm mx-auto">
                Pour enregistrer manuellement des encaissements en espèces ou virements bancaires hors-plateforme sur vos baux illimités, activez la <strong>Formule Entreprise &amp; Pro (5 000 FCFA / 30 jours)</strong> à 0% de commission.
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUpgradeModal(true);
                }}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Flame className="w-4 h-4 text-orange-400" />
                <span>Passer à la Formule Pro (5 000 FCFA)</span>
              </button>
            </div>
          </div>
        ) : (
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

              {/* Alerte Anti-Contournement Formule Sérénité */}
              {isMethodRestricted && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-950 dark:text-amber-100 text-xs space-y-2.5 animate-in fade-in duration-200">
                  <div className="flex items-start gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <strong className="block font-bold text-slate-900 dark:text-white text-xs">
                        Formule Sérénité : Règlements par Mobile Money uniquement
                      </strong>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                        La Formule Sérénité (0 FCFA fixe) repose sur l&apos;encaissement automatisé par Mobile Money (Wave, MoMo, Moov, Orange, Celtiis) avec prélèvement de la commission de 2%. L&apos;enregistrement manuel de règlements en espèces ou virements hors-plateforme sur vos baux illimités est réservé à la <strong>Formule Entreprise &amp; Pro (5 000 FCFA / 30 jours, 0% commission)</strong>.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setShowUpgradeModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1.5 cursor-pointer"
                    >
                      <Flame className="w-3.5 h-3.5 text-orange-400" />
                      <span>Passer à la Formule Pro (5 000 FCFA)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setMethod('wave')}
                      className="px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-[11px] cursor-pointer"
                    >
                      Basculer sur Mobile Money (Wave)
                    </button>
                  </div>
                </div>
              )}

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
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <div className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
              {isMethodRestricted && (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Espèces réservées à la Formule Pro</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isMethodRestricted}
                className={`py-2.5 px-5 rounded-xl text-white text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isMethodRestricted
                    ? 'bg-slate-400 cursor-not-allowed opacity-60'
                    : 'bg-brand-500 hover:bg-brand-600 shadow-pink-glow cursor-pointer'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isMethodRestricted ? 'Passez en Pro ou Mobile Money' : 'Valider & Générer'}</span>
              </button>
            </div>
          </div>
        </form>
        )}
      </div>

      {/* Modal d'upgrade vers la Formule Pro */}
      <UpgradePlanModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        initialPlanTab="pro"
      />
    </div>
  );
}

