'use client';

import React, { useState } from 'react';

export function LandingVerifyWidget() {
  const [receiptCode, setReceiptCode] = useState('QTC-2025-BJ-90412');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(true);

  const handleVerify = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsVerified(true);
    }, 600);
  };

  return (
    <section
      id="guichet-verification"
      className="w-full px-gutter md:px-margin-tablet lg:px-margin-desktop py-space-xl relative overflow-hidden"
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
          <div className="p-space-md rounded-2xl bg-surface-container flex flex-col gap-space-sm shadow-md border border-surface-container-high/60">
            <label className="font-label-sm text-label-sm text-on-surface-variant">
              Saisir le Code Unique de Quittance
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 flex items-center px-space-md py-space-sm rounded-full bg-surface-container-low text-on-surface border border-surface-container-high/60 focus-within:border-secondary transition-colors">
                <span className="material-symbols-outlined text-outline mr-2 text-[20px]">
                  qr_code
                </span>
                <input
                  className="bg-transparent border-0 font-label-lg text-label-lg text-on-surface focus:outline-none w-full uppercase tracking-wider"
                  id="verify-input"
                  type="text"
                  value={receiptCode}
                  onChange={(e) => setReceiptCode(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={handleVerify}
                disabled={isVerifying}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-secondary-container text-on-secondary font-semibold text-xs flex items-center justify-center gap-1.5 hover:brightness-105 active:scale-95 transition-all shrink-0 shadow-sm whitespace-nowrap"
              >
                <span className={`material-symbols-outlined text-[16px] ${isVerifying ? 'animate-spin' : ''}`}>
                  {isVerifying ? 'sync' : 'search_check'}
                </span>
                <span>{isVerifying ? 'Vérification...' : 'Authentifier'}</span>
              </button>
            </div>
            <span className="font-label-sm text-label-sm text-secondary flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              Sceau d'intégrité SHA-256 garanti par l'Infrastructure LOCAGESTION SAS
            </span>
          </div>
        </div>

        {/* Live Certified Receipt Mockup with Micro-Animations */}
        <div
          className={`w-full lg:w-[460px] p-space-lg rounded-2xl bg-surface-container-high shadow-2xl relative transition-all duration-500 border border-surface-container-highest ${
            isVerifying ? 'opacity-70 scale-95' : 'opacity-100 scale-100'
          }`}
          id="demo-receipt"
        >
          {/* Official Watermark Stamp with Gentle Rotation Micro-Animation */}
          <div className="absolute right-6 top-6 w-24 h-24 rounded-full bg-secondary-container/10 flex items-center justify-center text-center pointer-events-none animate-rotate-stamp">
            <div className="w-20 h-20 rounded-full bg-secondary-container/20 border-2 border-dashed border-secondary/50 flex flex-col items-center justify-center text-[9px] uppercase font-extrabold text-secondary leading-tight shadow-sm">
              <span>CONFORME</span>
              <span className="text-[12px] tracking-widest text-on-surface">OHADA</span>
              <span>CERTIFIÉ</span>
            </div>
          </div>

          {/* Receipt Header */}
          <div className="flex items-center gap-3 pb-space-md border-b border-surface-container/60">
            <div className="w-10 h-10 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <div>
              <div className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                Quittance Numérique Certifiée
              </div>
              <span className="font-label-sm text-label-sm text-secondary font-bold flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-secondary animate-pulse" />
                Réf: {receiptCode.toUpperCase() || 'QTC-2025-BJ-90412'} • VALIDÉ
              </span>
            </div>
          </div>

          {/* Receipt Fields */}
          <div className="flex flex-col gap-2.5 py-space-md font-body-sm text-body-sm text-on-surface-variant">
            <div className="flex justify-between items-center py-1">
              <span>Bailleur Enregistré</span>
              <span className="font-label-md text-label-md text-on-surface font-bold">
                M. Sèna G. (Cotonou, Bénin)
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>Locataire Titulaire</span>
              <span className="font-label-md text-label-md text-on-surface font-bold">
                Dr. Aïssatou Traoré
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>Période Payée</span>
              <span className="font-label-md text-label-md text-on-surface">
                Février 2025 (Règlement le 02/02)
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>Bien Concerné</span>
              <span className="font-label-md text-label-md text-on-surface truncate max-w-[200px]">
                Haie Vive Villa F4 Lot 10
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span>Canal de Règlement</span>
              <span className="font-label-md text-label-md text-secondary font-bold">
                MTN Mobile Money Bénin
              </span>
            </div>
            <div className="flex justify-between items-center py-2.5 mt-2 bg-surface-container-low px-space-md rounded-xl border border-surface-container-high/60">
              <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Montant Total
              </span>
              <span className="font-headline-sm text-headline-sm text-secondary font-extrabold">
                250 000 FCFA
              </span>
            </div>
          </div>

          {/* Receipt Security Hash Footer */}
          <div className="pt-space-md border-t border-surface-container/60 flex items-center justify-between gap-space-sm font-label-sm text-label-sm text-outline">
            <div className="truncate max-w-[240px]">
              <span className="block text-[10px] uppercase font-bold text-on-surface-variant">
                Hash Juridique Inaltérable :
              </span>
              <span className="text-tertiary font-mono text-[11px] truncate block">
                e3b0c44298fc1c149afbf4c8996fb92427ae...
              </span>
            </div>
            <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center shrink-0 shadow-sm">
              {/* Simulated QR Visual */}
              <div className="w-full h-full bg-black rounded-sm flex items-center justify-center">
                <span className="material-symbols-outlined text-white text-[20px]">qr_code</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
