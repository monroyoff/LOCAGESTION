'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  Zap,
  ArrowRight,
  X,
  Sparkles,
  Building2,
  Smartphone,
  Lock,
} from 'lucide-react';
import { PlanService, PLANS_CONFIG } from '@/lib/services/plan-service';
import { useAuth } from '@/lib/context/space-context';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  actionContext?: 'new_lease' | 'sign_lease' | 'manage';
}

export function UpgradePlanModal({
  isOpen,
  onClose,
  onSuccess,
  actionContext = 'new_lease',
}: UpgradePlanModalProps) {
  const { user } = useAuth();
  const [isActivating, setIsActivating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleActivateSerenite = () => {
    setIsActivating(true);
    setTimeout(() => {
      PlanService.activateSerenitePlan(user?.id);
      setIsActivating(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    }, 600);
  };

  const handleActivatePro = () => {
    setIsActivating(true);
    setTimeout(() => {
      PlanService.activateProPlan(user?.id);
      setIsActivating(false);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }, 1500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-500/10 via-primary/10 to-transparent border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-inner">
              <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                  Quota Formule Découverte : 2/2 Baux Actifs
                </span>
                <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                  • Plafond Légal Atteint
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                Activez la Formule Sérénité pour signer votre 3ᵉ bail
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
          {isSuccess ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Formule Sérénité Activée avec Succès !
              </h3>
              <p className="text-xs text-slate-500 max-w-md">
                Votre compte bénéficie désormais des <strong>baux illimités</strong> et de l'encaissement automatisé par Split Payment Mobile Money. Vous pouvez immédiatement poursuivre votre rédaction.
              </p>
            </div>
          ) : (
            <>
              {/* Context Alert Message */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px] shrink-0 mt-0.5">
                  info
                </span>
                <div>
                  <strong>Bailleur Particulier en Formule Découverte (0 FCFA) :</strong>
                  <p className="mt-0.5">
                    Vous avez déjà fait signer <strong>2 baux à votre actif</strong>. Pour rédiger, sceller et faire signer un <strong>3ᵉ contrat de bail</strong> (et les suivants), le passage à la <strong>Formule Sérénité</strong> est requis afin d'activer la sécurisation automatisée.
                  </p>
                </div>
              </div>

              {/* Plans Comparison Highlight */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Formule Découverte (Actuelle) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between opacity-80">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-slate-500">
                      Votre Plan Actuel
                    </span>
                    <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">
                      Formule Découverte
                    </h4>
                    <div className="text-lg font-extrabold text-slate-900 dark:text-white my-1">
                      0 FCFA <span className="text-xs font-normal text-slate-500">/ mois</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400 mt-2">
                      <li className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-semibold">
                        <span>⚠️ Plafonnée à 2 baux signés (2/2 atteints)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Baux conformes OHADA</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Encaissements manuels sans assistance</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Formule Sérénité (Recommandée) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-surface-container-high border-2 border-primary rounded-2xl relative shadow-md flex flex-col justify-between">
                  <div className="absolute top-0 right-0 bg-primary text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider">
                    Recommandé
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-primary">
                      Formule Requise
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 flex items-center gap-1.5">
                      <span>Formule Sérénité</span>
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </h4>
                    <div className="text-lg font-extrabold text-primary my-1">
                      1,5% <span className="text-xs font-normal text-slate-600 dark:text-slate-400">/ loyer Mobile Money</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium -mt-0.5 mb-2">
                      0 FCFA d'abonnement fixe • Facturé uniquement si loyer perçu
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-800 dark:text-slate-200">
                      <li className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Baux &amp; Contrats signés ILLIMITÉS</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Split Payment Mobile Money (Wave, MTN, Moov, Orange)</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Reversement instantané sur votre wallet/compte</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Relances WhatsApp automatiques d'échéance</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Guarantees bar */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 flex items-center justify-around text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" /> Sans engagement
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-primary" /> 100% Mobile Money
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-secondary" /> Conforme OHADA
                </span>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        {!isSuccess && (
          <div className="p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Fermer
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleActivatePro}
                disabled={isActivating}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
              >
                Formule Pro (15 000 F)
              </button>

              <button
                type="button"
                onClick={handleActivateSerenite}
                disabled={isActivating}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-extrabold text-xs shadow-pink-glow active:scale-95 transition-all cursor-pointer"
              >
                {isActivating ? (
                  <span>Activation en cours...</span>
                ) : (
                  <>
                    <Zap className="w-4 h-4 fill-white" />
                    <span>Activer la Formule Sérénité</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
