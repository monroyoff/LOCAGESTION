'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Search,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { PaymentService } from '@/lib/services/payment-service';
import { PaymentTransaction } from '@/lib/types';
import { matchPaymentByCode } from '@/lib/services/receipt-matcher';
import LocagestionOfficialStamp from '@/components/common/LocagestionOfficialStamp';

export function LandingVerifyWidget() {
  const [receiptCode, setReceiptCode] = useState('LOCA-QUITT-BJ-114409497');
  const [isVerifying, setIsVerifying] = useState(false);
  const [matchedPayment, setMatchedPayment] = useState<PaymentTransaction | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [allPayments, setAllPayments] = useState<PaymentTransaction[]>([]);

  // Initialisation et chargement des quittances réelles
  useEffect(() => {
    const local = [
      ...PaymentService.getVerifiedPayments(),
      ...PaymentService.getDeclaredPayments(),
    ];
    setAllPayments(local);

    // Initial search avec le code par défaut
    const defaultFound = local.find((p) => matchPaymentByCode(p, 'LOCA-QUITT-BJ-114409497'));
    if (defaultFound) {
      setMatchedPayment(defaultFound);
    }

    // Récupération distante depuis le serveur pour mise à jour complète
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
          const found = merged.find((p) => matchPaymentByCode(p, receiptCode));
          if (found) setMatchedPayment(found);
        }
      })
      .catch(() => {});
  }, []);

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsVerifying(true);
    setHasSearched(true);

    const query = receiptCode.trim();
    setTimeout(() => {
      let found = allPayments.find((p) => matchPaymentByCode(p, query));

      if (!found) {
        // Tentative immédiate avec les données locales
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

  const currentLandlord = matchedPayment?.landlordName || 'VOGLOSSOU JOHANE';
  const currentTenant = matchedPayment?.tenantName || 'Jojo VOG';
  const currentProperty = matchedPayment
    ? `${matchedPayment.propertyName} (${matchedPayment.unitNumber})`
    : 'CHAMBRE SALON SANITAIRE (Lot 1)';
  const currentPeriod = matchedPayment?.period || 'Novembre 2026';
  const currentAmount = matchedPayment?.amount || 100;
  const currentMethod =
    matchedPayment?.method?.toUpperCase() === 'MTN'
      ? 'MTN Mobile Money (FedaPay Live)'
      : matchedPayment?.method?.toUpperCase() || 'Mobile Money';
  const currentRef = matchedPayment?.receiptNumber || receiptCode.toUpperCase() || 'LOCA-QUITT-BJ-114409497';

  const formatOfficialReceiptNumber = (ref?: string): string => {
    if (!ref) return 'LOCA-QUITT-BJ-114409497';
    let formatted = ref.trim().toUpperCase();
    if (formatted.startsWith('QUITT-FEDA-')) {
      formatted = formatted.replace('QUITT-FEDA-', 'LOCA-QUITT-BJ-');
    } else if (formatted.startsWith('FEDA-')) {
      formatted = formatted.replace('FEDA-', 'LOCA-QUITT-BJ-');
    } else if (!formatted.startsWith('LOCA-') && formatted.includes('114409497')) {
      formatted = 'LOCA-QUITT-BJ-114409497';
    }
    return formatted;
  };

  const displayRef = formatOfficialReceiptNumber(currentRef);

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

          {/* Live Interactive Input Simulator */}
          <form
            onSubmit={handleVerify}
            className="p-space-md rounded-2xl bg-surface-container flex flex-col gap-space-sm shadow-md border border-surface-container-high/60"
          >
            <label className="font-label-sm text-label-sm text-on-surface-variant font-bold">
              Saisir le Code Unique de Quittance ou Référence
            </label>
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

            {hasSearched && !matchedPayment && !isVerifying && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Aucune quittance répertoriée pour « <strong>{receiptCode}</strong> ». Vérifiez le numéro ou essayez <strong>LOCA-QUITT-BJ-114409497</strong>.
                </span>
              </div>
            )}

            <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              Sceau d'intégrité SHA-256 garanti par l'Infrastructure LOCAGESTION SAS
            </span>
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

          {/* Receipt Header (Clean, Zero Overlap, Mobile Optimized with Official LOCAGESTION Stamp) */}
          <div className="flex items-center justify-between gap-2.5 pb-3 border-b border-surface-container/60 relative z-10">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-2xl bg-secondary-container flex items-center justify-center text-on-secondary shrink-0 shadow-sm">
                <CheckCircle2 className="w-6 h-6 text-on-secondary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-headline-sm text-sm sm:text-base text-on-surface font-extrabold truncate">
                  Quittance Numérique Certifiée
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span className="font-label-sm text-[11px] text-secondary font-bold font-mono truncate">
                    Réf : {displayRef}
                  </span>
                </div>
                <div className="mt-1">
                  <span className="text-[9px] font-black uppercase tracking-wider text-secondary/90 bg-secondary/10 px-2 py-0.5 rounded-full border border-secondary/20 inline-block">
                    Conforme OHADA &amp; UEMOA ✓
                  </span>
                </div>
              </div>
            </div>

            {/* Cachet d'Authentification Numérique Officiel LOCAGESTION */}
            <LocagestionOfficialStamp
              size="md"
              variant="emerald"
              tilt={true}
              date={matchedPayment?.paymentDate || '26/11/2026'}
              className="shrink-0 -mr-1"
            />
          </div>

          {/* Receipt Fields */}
          <div className="flex flex-col gap-2.5 py-space-md font-body-sm text-body-sm text-on-surface-variant">
            <div className="flex justify-between items-center py-1">
              <span>Bailleur Enregistré</span>
              <span className="font-label-md text-label-md text-on-surface font-bold">
                {currentLandlord}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>Locataire Titulaire</span>
              <span className="font-label-md text-label-md text-on-surface font-bold">
                {currentTenant} {matchedPayment?.tenantMatricule ? `(${matchedPayment.tenantMatricule})` : ''}
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

          {/* Receipt Security Hash Footer & Direct Verify Button */}
          <div className="pt-space-md border-t border-surface-container/60 flex flex-col gap-3">
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

            <Link
              href={`/verify/${encodeURIComponent(displayRef)}`}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 text-center relative z-10"
            >
              <span>Consulter le Certificat Officiel Complet</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
