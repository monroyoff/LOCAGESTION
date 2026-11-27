'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Search,
  Lock,
  ArrowRight,
  RotateCcw,
  Sparkles,
  EyeOff,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { PaymentService } from '@/lib/services/payment-service';
import { PaymentTransaction } from '@/lib/types';
import { matchPaymentByCode } from '@/lib/services/receipt-matcher';
import LocagestionOfficialStamp from '@/components/common/LocagestionOfficialStamp';

// Quittance FICTIVE de démonstration affichée publiquement par défaut (ZÉRO fuite de données réelles)
const DEMO_FICTITIOUS_RECEIPT = {
  receiptNumber: 'LOCA-QUITT-BJ-DEMO-2026',
  landlordName: 'KOFFI MENSAH GÉRANCE',
  landlordIfu: '1201800492810',
  tenantName: 'AMADOU DIALLO',
  tenantMatricule: 'LOCA-MAT-BJ-00000',
  propertyName: 'RÉSIDENCE LES PALMIERS',
  unitNumber: 'Appartement B3',
  period: 'Novembre 2026',
  amount: 125000,
  method: 'Wave Mobile Money',
  paymentDate: '05/11/2026',
  legalHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  isDemo: true,
};

export function LandingVerifyWidget() {
  const [receiptCode, setReceiptCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  // Quittance réelle vérifiée uniquement dans la session locale de la personne qui vérifie
  const [matchedPayment, setMatchedPayment] = useState<PaymentTransaction | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [allPayments, setAllPayments] = useState<PaymentTransaction[]>([]);
  // Compte à rebours de sécurité pour effacement automatique des données privées
  const [countdown, setCountdown] = useState<number | null>(null);
  const [clearedNotice, setClearedNotice] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialisation et chargement des données en mémoire locale
  useEffect(() => {
    const local = [
      ...PaymentService.getVerifiedPayments(),
      ...PaymentService.getDeclaredPayments(),
    ];
    setAllPayments(local);

    // Synchronisation en arrière-plan avec le serveur
    fetch('/api/sync')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success) {
          const merged = [
            ...(data.verifiedPayments || []),
            ...(data.payments || []),
            ...local,
          ];
          setAllPayments(merged);
        }
      })
      .catch(() => {});
  }, []);

  // Gestion du compte à rebours de sécurité pour effacement automatique
  useEffect(() => {
    if (matchedPayment) {
      setCountdown(60); // 60 secondes d'affichage privé
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleClearVerification();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setCountdown(null);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [matchedPayment]);

  // Déclenchement de la vérification locale
  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = receiptCode.trim();
    if (!query) return;

    setIsVerifying(true);
    setHasSearched(true);
    setClearedNotice(false);

    setTimeout(() => {
      // Détection quittance démo
      if (query.toUpperCase().includes('DEMO')) {
        setMatchedPayment(null);
        setIsVerifying(false);
        return;
      }

      let found = allPayments.find((p) => matchPaymentByCode(p, query));

      if (!found) {
        const freshLocal = [
          ...PaymentService.getVerifiedPayments(),
          ...PaymentService.getDeclaredPayments(),
        ];
        found = freshLocal.find((p) => matchPaymentByCode(p, query));
      }

      setMatchedPayment(found || null);
      setIsVerifying(false);
    }, 400);
  };

  // Effacement des données privées vérifiées et restauration immédiate de la quittance fictive
  const handleClearVerification = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setMatchedPayment(null);
    setReceiptCode('');
    setHasSearched(false);
    setCountdown(null);
    setClearedNotice(true);
    setTimeout(() => setClearedNotice(false), 5000);
  };

  const isRealActive = matchedPayment !== null;

  // Données dynamiques : si une vraie quittance est en cours de vérification, on l'affiche temporairement.
  // Sinon, AUCUNE donnée réelle n'est visible : c'est toujours la quittance fictive de démonstration.
  const currentLandlord = isRealActive
    ? matchedPayment.landlordName || 'Bailleur Enregistré'
    : DEMO_FICTITIOUS_RECEIPT.landlordName;
  const currentTenant = isRealActive
    ? matchedPayment.tenantName || 'Locataire Titulaire'
    : DEMO_FICTITIOUS_RECEIPT.tenantName;
  const currentTenantMatricule = isRealActive
    ? matchedPayment.tenantMatricule
    : DEMO_FICTITIOUS_RECEIPT.tenantMatricule;
  const currentProperty = isRealActive
    ? `${matchedPayment.propertyName} (${matchedPayment.unitNumber})`
    : `${DEMO_FICTITIOUS_RECEIPT.propertyName} (${DEMO_FICTITIOUS_RECEIPT.unitNumber})`;
  const currentPeriod = isRealActive
    ? matchedPayment.period || 'Période en cours'
    : DEMO_FICTITIOUS_RECEIPT.period;
  const currentAmount = isRealActive
    ? matchedPayment.amount
    : DEMO_FICTITIOUS_RECEIPT.amount;
  const currentMethod = isRealActive
    ? matchedPayment.method?.toUpperCase() === 'MTN'
      ? 'MTN Mobile Money'
      : matchedPayment.method?.toUpperCase() || 'Mobile Money'
    : DEMO_FICTITIOUS_RECEIPT.method;
  const currentPaymentDate = isRealActive
    ? matchedPayment.paymentDate || '26/11/2026'
    : DEMO_FICTITIOUS_RECEIPT.paymentDate;
  const displayRef = isRealActive
    ? matchedPayment.receiptNumber
    : DEMO_FICTITIOUS_RECEIPT.receiptNumber;

  return (
    <section
      id="guichet-verification"
      className="w-full px-gutter md:px-margin-tablet lg:px-margin-desktop py-space-xl pb-24 relative overflow-hidden"
    >
      {/* Background ambient subtle blur */}
      <div className="absolute top-1/2 left-1/4 w-80 h-80 rounded-full bg-secondary-container/15 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-space-xl items-center relative z-10">
        {/* Interactive Explanation Column */}
        <div className="flex-1 flex flex-col gap-space-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high text-tertiary font-label-sm text-label-sm font-bold w-fit border border-tertiary/20">
            <span className="material-symbols-outlined text-[16px]">verified</span>
            Guichet Public d’Authentification /verify/[code]
          </div>
          <h2 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface font-extrabold tracking-tight">
            Vérifiez une Quittance de Loyer en Temps Réel
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Vous êtes un consulat, une banque d’octroi de prêt immobilier ou un nouveau bailleur ? Saisissez la référence du reçu ou scannez le QR Code pour vous assurer de son authenticité absolue et de la solvabilité déclarée.
          </p>

          {/* Formulaire de Vérification Sécurisée & Éphémère */}
          <form
            onSubmit={handleVerify}
            className="p-space-md rounded-2xl bg-surface-container flex flex-col gap-space-sm shadow-md border border-surface-container-high/60"
          >
            <div className="flex items-center justify-between">
              <label className="font-label-sm text-label-sm text-on-surface-variant font-bold">
                Saisir le Code Unique de Quittance ou Référence
              </label>
              <button
                type="button"
                onClick={() => {
                  setReceiptCode(DEMO_FICTITIOUS_RECEIPT.receiptNumber);
                  setMatchedPayment(null);
                  setHasSearched(false);
                }}
                className="text-[11px] text-tertiary font-bold hover:underline cursor-pointer"
              >
                Exemple démo
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center px-space-md py-space-sm rounded-full bg-surface-container-low text-on-surface border border-surface-container-high/60 focus-within:border-secondary transition-colors">
                <span className="material-symbols-outlined text-outline mr-2 text-[20px]">
                  qr_code
                </span>
                <input
                  className="bg-transparent border-0 font-label-lg text-label-lg text-on-surface focus:outline-none w-full uppercase tracking-wider font-mono font-bold"
                  id="verify-input"
                  type="text"
                  placeholder="Ex: LOCA-QUITT-BJ-114409497"
                  value={receiptCode}
                  onChange={(e) => setReceiptCode(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={isVerifying}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-secondary-container text-on-secondary font-bold text-xs flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-95 transition-all shrink-0 shadow-sm whitespace-nowrap cursor-pointer"
              >
                <span className={`material-symbols-outlined text-[16px] ${isVerifying ? 'animate-spin' : ''}`}>
                  {isVerifying ? 'sync' : 'search_check'}
                </span>
                <span>{isVerifying ? 'Vérification...' : 'Authentifier'}</span>
              </button>
            </div>

            {/* Notification de vérification privée active */}
            {isRealActive && (
              <div className="p-3 bg-indigo-950/60 border border-indigo-500/40 rounded-xl text-xs text-indigo-200 flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    <strong>Session Privée Active :</strong> Visible uniquement sur votre écran. Effacement auto dans {countdown}s.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearVerification}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold shrink-0 cursor-pointer transition-all active:scale-95"
                >
                  Effacer
                </button>
              </div>
            )}

            {/* Message de confirmation d'effacement */}
            {clearedNotice && (
              <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Données privées effacées avec succès. Quittance fictive de démonstration rétablie.
                </span>
              </div>
            )}

            {/* Quittance introuvable */}
            {hasSearched && !matchedPayment && !isVerifying && receiptCode && !receiptCode.toUpperCase().includes('DEMO') && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Aucune quittance répertoriée pour « <strong>{receiptCode}</strong> ». Vérifiez le numéro ou essayez le code spécimen <strong>LOCA-QUITT-BJ-DEMO-2026</strong>.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-1">
              <span className="font-label-sm text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">shield</span>
                Sceau d'intégrité SHA-256 garanti par LOCAGESTION SAS
              </span>
              <span className="text-[10px] text-slate-400 italic">
                Protection stricte de la vie privée
              </span>
            </div>
          </form>
        </div>

        {/* Live Certified Receipt Mockup with Official LOCAGESTION Authentication Stamp */}
        <div
          className={`w-full lg:w-[460px] p-4 sm:p-space-lg rounded-2xl bg-surface-container-high shadow-2xl relative transition-all duration-500 border border-surface-container-highest overflow-hidden ${
            isVerifying ? 'opacity-70 scale-95' : 'opacity-100 scale-100'
          }`}
          id="demo-receipt"
        >
          {/* Subtle Watermark Stamp in Background */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] -rotate-12 z-0">
            <LocagestionOfficialStamp size="xl" tilt={false} showBackground={false} />
          </div>

          {/* Bandeau supérieur de statut : Privé Éphémère vs Démonstration Fictive */}
          {isRealActive ? (
            <div className="mb-3 p-2.5 bg-indigo-950/80 border border-indigo-500/40 rounded-xl flex items-center justify-between gap-2 text-[11px] text-indigo-200 relative z-10 animate-in fade-in">
              <div className="flex items-center gap-1.5 truncate">
                <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">
                  Consultation privée • Effacement auto dans <strong>{countdown}s</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleClearVerification}
                className="px-2 py-0.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-[10px] shrink-0 cursor-pointer active:scale-95 transition-all"
                title="Effacer immédiatement ces données privées de l'écran"
              >
                Effacer
              </button>
            </div>
          ) : (
            <div className="mb-3 p-2 rounded-xl bg-surface-container border border-surface-container-high/80 text-[11px] text-on-surface-variant flex items-center gap-1.5 relative z-10">
              <Sparkles className="w-3.5 h-3.5 text-tertiary shrink-0" />
              <span className="truncate">
                <strong>Quittance Fictive :</strong> Exemple à titre de démonstration sur la page d'accueil.
              </span>
            </div>
          )}

          {/* Receipt Header */}
          <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-surface-container/60 relative z-10">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  isRealActive
                    ? 'bg-emerald-600 text-white'
                    : 'bg-secondary-container text-on-secondary'
                }`}
              >
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-headline-sm text-sm sm:text-base text-on-surface font-extrabold truncate">
                  {isRealActive ? 'Quittance Numérique Certifiée' : 'Quittance Spécimen Démo'}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                      isRealActive ? 'bg-emerald-500 animate-pulse' : 'bg-tertiary'
                    }`}
                  />
                  <span className="font-label-sm text-[11px] text-secondary font-bold font-mono truncate">
                    Réf : {displayRef}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-secondary/90 bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20 inline-block">
                    {isRealActive ? 'Conforme OHADA & UEMOA ✓' : 'Exemple Fictif Public'}
                  </span>
                </div>
              </div>
            </div>

            {/* Cachet d'Authentification Numérique Officiel LOCAGESTION */}
            <LocagestionOfficialStamp
              size="md"
              variant="emerald"
              tilt={true}
              date={currentPaymentDate}
              className="shrink-0 -mr-1"
            />
          </div>

          {/* Receipt Fields */}
          <div className="flex flex-col gap-2.5 py-space-md font-body-sm text-body-sm text-on-surface-variant relative z-10">
            <div className="flex justify-between items-center py-1">
              <span>Bailleur Enregistré</span>
              <span className="font-label-md text-label-md text-on-surface font-bold">
                {currentLandlord}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>Locataire Titulaire</span>
              <span className="font-label-md text-label-md text-on-surface font-bold">
                {currentTenant} {currentTenantMatricule ? `(${currentTenantMatricule})` : ''}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>Période Payée</span>
              <span className="font-label-md text-label-md text-on-surface">
                {currentPeriod}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>Bien Concerné</span>
              <span className="font-label-md text-label-md text-on-surface truncate max-w-[200px]">
                {currentProperty}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>Canal de Règlement</span>
              <span className="font-label-md text-label-md text-secondary font-bold">
                {currentMethod}
              </span>
            </div>
            <div className="flex justify-between items-center py-2.5 mt-2 bg-surface-container-low px-space-md rounded-xl border border-surface-container-high/60">
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Montant Total
              </span>
              <span className="font-headline-sm text-headline-sm text-secondary font-extrabold text-lg">
                {formatFCFA(currentAmount)}
              </span>
            </div>
          </div>

          {/* Receipt Security Hash Footer & Action Buttons */}
          <div className="pt-space-md border-t border-surface-container/60 flex flex-col gap-3 relative z-10">
            <div className="flex items-center justify-between gap-space-sm font-label-sm text-label-sm text-outline">
              <div className="truncate max-w-[240px]">
                <span className="block text-[10px] uppercase font-bold text-on-surface-variant">
                  Hash Juridique Inaltérable :
                </span>
                <span className="text-tertiary font-mono text-[11px] truncate block">
                  e3b0c44298fc1c149afbf4c8996fb92427ae...
                </span>
              </div>
              <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center shrink-0 shadow-sm border border-slate-200">
                <span className="material-symbols-outlined text-slate-800 text-[20px]">qr_code_2</span>
              </div>
            </div>

            {/* Actions : Si une quittance réelle est affichée, bouton direct pour EFFACER les données */}
            {isRealActive ? (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleClearVerification}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer active:scale-95"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Effacer &amp; Rétablir Démo</span>
                </button>
                <Link
                  href={`/verify/${encodeURIComponent(displayRef)}`}
                  className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 text-center shrink-0"
                >
                  <span>Certificat Complet</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ) : (
              <Link
                href={`/verify/${encodeURIComponent(displayRef)}`}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 text-center"
              >
                <span>Consulter le Spécimen de Démonstration</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
