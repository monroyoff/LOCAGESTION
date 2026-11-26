'use client';

import React, { useState, useEffect } from 'react';
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
  Clock,
  RefreshCw,
  AlertTriangle,
  Calendar,
  Flame,
} from 'lucide-react';
import { PlanService, PLANS_CONFIG } from '@/lib/services/plan-service';
import { useAuth } from '@/lib/context/space-context';
import { UserSubscriptionDetails } from '@/lib/types';
import { notifySave } from '@/lib/notifications/action-notifier';

interface UpgradePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  actionContext?: 'new_lease' | 'sign_lease' | 'manage' | 'renew';
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
  const [successMessage, setSuccessMessage] = useState('');
  const [showSimulateTools, setShowSimulateTools] = useState(false);
  const [currentSub, setCurrentSub] = useState<UserSubscriptionDetails>(() =>
    PlanService.getUserSubscription(user?.id)
  );

  useEffect(() => {
    if (isOpen) {
      setCurrentSub(PlanService.getUserSubscription(user?.id));
    }
  }, [isOpen, user?.id]);

  if (!isOpen) return null;

  const isPro = currentSub.plan === 'pro';
  const isExpired = currentSub.isExpired;
  const daysLeft = currentSub.daysRemaining ?? 30;
  const formattedExpiresAt = currentSub.expiresAt
    ? new Date(currentSub.expiresAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : '';

  const handleActivateSerenite = () => {
    setIsActivating(true);
    setTimeout(() => {
      const res = PlanService.activateSerenitePlan(user?.id);
      setIsActivating(false);
      setSuccessMessage(res.message);
      setIsSuccess(true);

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    }, 500);
  };

  const handleActivateOrRenewPro = () => {
    setIsActivating(true);
    setTimeout(() => {
      let res;
      if (isPro && !isExpired) {
        res = PlanService.renewProPlan(user?.id, 30);
      } else {
        res = PlanService.activateProPlan(user?.id, 30);
      }
      setCurrentSub(PlanService.getUserSubscription(user?.id));
      setIsActivating(false);
      setSuccessMessage(res.message);
      setIsSuccess(true);
      notifySave(res.message, 'Formule Pro confirmée');

      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1600);
    }, 600);
  };

  const handleSimulateDays = (days: number) => {
    PlanService.simulateProDaysRemaining(user?.id, days);
    setCurrentSub(PlanService.getUserSubscription(user?.id));
    notifySave(
      days >= 0
        ? `Simulation configurée à J-${days} (${days} jour${days > 1 ? 's' : ''} restant${days > 1 ? 's' : ''})`
        : 'Simulation configurée : Forfait Expiré',
      'Test Alertes Échéance'
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div
          className={`p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 ${
            isExpired || (isPro && daysLeft === 0)
              ? 'bg-gradient-to-r from-rose-500/15 via-rose-500/5 to-transparent'
              : isPro && daysLeft <= 2
              ? 'bg-gradient-to-r from-amber-500/15 via-orange-500/5 to-transparent'
              : 'bg-gradient-to-r from-amber-500/10 via-primary/10 to-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
                isExpired || (isPro && daysLeft === 0)
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  : isPro && daysLeft <= 2
                  ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}
            >
              {isExpired ? (
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              ) : isPro ? (
                <Sparkles className="w-6 h-6 stroke-[2.2]" />
              ) : (
                <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {isPro ? (
                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${
                      isExpired
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                        : daysLeft === 0
                        ? 'bg-rose-100 text-rose-800 animate-pulse'
                        : daysLeft <= 2
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-indigo-100 text-indigo-800'
                    }`}
                  >
                    {isExpired
                      ? '🔴 Forfait Pro Expiré'
                      : daysLeft === 0
                      ? '🚨 Expire aujourd’hui (Jour J)'
                      : daysLeft === 1
                      ? '⚠️ Expire demain (J-1)'
                      : daysLeft === 2
                      ? '⏳ Expire dans 2 jours (J-2)'
                      : `👑 Formule Pro • ${daysLeft} jours restants`}
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wider">
                    Formule Découverte • 2 Baux Atteints
                  </span>
                )}
                {isPro && formattedExpiresAt && (
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    • Échéance : {formattedExpiresAt}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                {isExpired
                  ? 'Réactivez votre Formule Pro (15 000 FCFA / 30 jours)'
                  : isPro && daysLeft <= 2
                  ? `Renouvelez votre Formule Pro avant expiration (${daysLeft === 0 ? 'Aujourd’hui' : `dans ${daysLeft}j`})`
                  : isPro
                  ? 'Gérer votre abonnement Formule Entreprise & Pro'
                  : 'Activez la Formule Sérénité ou Pro pour vos baux illimités'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
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
                Abonnement Confirmé avec Succès !
              </h3>
              <p className="text-xs text-slate-500 max-w-md">{successMessage}</p>
            </div>
          ) : (
            <>
              {/* Alerte Expiration ou Approche d'échéance J-2, J-1, J */}
              {isPro && (daysLeft <= 2 || isExpired) && (
                <div
                  className={`p-4 rounded-2xl border text-xs leading-relaxed flex items-start gap-3 shadow-xs ${
                    isExpired || daysLeft === 0
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900/60 text-rose-900 dark:text-rose-200'
                      : daysLeft === 1
                      ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-900/60 text-orange-900 dark:text-orange-200'
                      : 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
                  }`}
                >
                  <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="block text-sm font-bold">
                      {isExpired
                        ? 'Votre forfait 30 jours a expiré'
                        : daysLeft === 0
                        ? 'Alerte J : Votre abonnement expire aujourd’hui à 23h59 !'
                        : daysLeft === 1
                        ? 'Alerte J-1 : Votre abonnement expire demain !'
                        : 'Alerte J-2 : Votre abonnement expire dans 2 jours'}
                    </strong>
                    <p className="mt-0.5">
                      {isExpired
                        ? `Votre période de 30 jours s’est achevée le ${formattedExpiresAt}. Renouvelez maintenant pour 15 000 FCFA pour débloquer à nouveau toutes les fonctionnalités professionnelles.`
                        : `Date d'échéance prévue : ${formattedExpiresAt}. En renouvelant dès maintenant, 30 jours supplémentaires sont immédiatement cumulés sans aucune coupure.`}
                    </p>
                  </div>
                </div>
              )}

              {/* Contexte si non-pro */}
              {!isPro && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-3">
                  <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 text-[20px] shrink-0 mt-0.5">
                    info
                  </span>
                  <div>
                    <strong>Bailleur Particulier en Formule Découverte (0 FCFA) :</strong>
                    <p className="mt-0.5">
                      Vous avez déjà fait signer <strong>2 baux à votre actif</strong>. Pour rédiger et sceller un <strong>3ᵉ contrat de bail</strong> (et les suivants), activez la <strong>Formule Sérénité</strong> (0 F fixe) ou la <strong>Formule Pro</strong> (30 jours).
                    </p>
                  </div>
                </div>
              )}

              {/* Plans Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Formule 1 : Sérénité (0 FCFA fixe, 1.5% split payment) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-primary">
                        Sans Abonnement Fixe
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 flex items-center gap-1.5">
                      <span>Formule Sérénité</span>
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </h4>
                    <div className="text-lg font-extrabold text-primary my-1">
                      1,5% <span className="text-xs font-normal text-slate-500">/ loyer Mobile Money</span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium mb-2">
                      0 FCFA fixe • Facturé uniquement si loyer perçu
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      <li className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Baux &amp; Contrats signés ILLIMITÉS</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Split Payment Mobile Money automatique</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Reversement instantané sur Mobile Wallet</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>Relances WhatsApp automatiques</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={handleActivateSerenite}
                    disabled={isActivating}
                    className="mt-4 w-full py-2 px-3 rounded-xl border border-primary/40 text-primary font-bold text-xs hover:bg-primary/10 transition-colors text-center cursor-pointer"
                  >
                    Activer la Sérénité (0 F fixe)
                  </button>
                </div>

                {/* Formule 2 : Entreprise & Pro (15 000 FCFA / 30 jours) */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-brand-500/5 to-surface-container-high border-2 border-indigo-500/80 rounded-2xl relative shadow-md flex flex-col justify-between">
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9px] font-extrabold px-2.5 py-0.5 rounded-bl-xl uppercase tracking-wider">
                    {isPro ? 'Votre Formule' : 'Pack Pro 30 Jours'}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-indigo-700 dark:text-indigo-400">
                      Agences, Cabinets &amp; Démarcheurs
                    </span>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm mt-0.5 flex items-center gap-1.5">
                      <span>Formule Entreprise &amp; Pro</span>
                      <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
                    </h4>
                    <div className="text-lg font-extrabold text-slate-900 dark:text-white my-1">
                      15 000 FCFA <span className="text-xs font-normal text-slate-500">/ 30 jours</span>
                    </div>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium mb-2">
                      Accès complet garanti 30 jours • Alertes d'échéance à J-2, J-1 et J
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-800 dark:text-slate-200">
                      <li className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>Baux, lots &amp; résidences illimités</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Gestion multi-utilisateurs &amp; rôles délégués</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Console Démarcheur &amp; Mandats certifiés</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Exports fiscaux &amp; DGI / IFU automatisés</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Support prioritaire 7j/7 &amp; chargé dédié</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={handleActivateOrRenewPro}
                    disabled={isActivating}
                    className="mt-4 w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isActivating ? 'animate-spin' : ''}`} />
                    <span>
                      {isPro && !isExpired
                        ? 'Renouveler pour 30 jours (15 000 F)'
                        : 'Payer 15 000 F & Activer 30 jours'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Guarantees bar */}
              <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800/40 flex items-center justify-around text-[11px] text-slate-500 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500" /> Validité 30 jours
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-primary" /> Wave / MoMo / OM / CB
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-secondary" /> Conforme OHADA
                </span>
              </div>

              {/* Outil de Simulation / Diagnostic des Alertes J-2, J-1, J */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSimulateTools(!showSimulateTools)}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>🛠️ Tester les alertes de fin d’abonnement (J-2, J-1, Jour J)</span>
                  <span>{showSimulateTools ? '▲' : '▼'}</span>
                </button>

                {showSimulateTools && (
                  <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl space-y-2 border border-slate-200 dark:border-slate-700 text-xs">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Permet de tester instantanément le déclenchement des alertes automatiques avant la fin de l’abonnement de 30 jours :
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleSimulateDays(2)}
                        className="px-2.5 py-1 rounded-lg bg-amber-200 text-amber-900 font-bold text-[10px] hover:bg-amber-300 transition-colors cursor-pointer"
                      >
                        Simuler J-2 (2j restants)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateDays(1)}
                        className="px-2.5 py-1 rounded-lg bg-orange-200 text-orange-900 font-bold text-[10px] hover:bg-orange-300 transition-colors cursor-pointer"
                      >
                        Simuler J-1 (Expire demain)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateDays(0)}
                        className="px-2.5 py-1 rounded-lg bg-rose-200 text-rose-900 font-bold text-[10px] hover:bg-rose-300 transition-colors cursor-pointer"
                      >
                        Simuler Jour J (Aujourd’hui)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateDays(-1)}
                        className="px-2.5 py-1 rounded-lg bg-red-800 text-white font-bold text-[10px] hover:bg-red-900 transition-colors cursor-pointer"
                      >
                        Simuler Expiré
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSimulateDays(30)}
                        className="px-2.5 py-1 rounded-lg bg-emerald-200 text-emerald-900 font-bold text-[10px] hover:bg-emerald-300 transition-colors cursor-pointer"
                      >
                        Rétablir 30 jours
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer Actions */}
        {!isSuccess && (
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Fermer
            </button>

            <button
              type="button"
              onClick={handleActivateOrRenewPro}
              disabled={isActivating}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>
                {isPro && !isExpired
                  ? 'Prolonger 30 jours (15 000 FCFA)'
                  : 'Activer 30 jours (15 000 FCFA)'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
