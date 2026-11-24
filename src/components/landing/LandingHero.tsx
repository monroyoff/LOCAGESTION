'use client';

import React from 'react';
import Link from 'next/link';

export function LandingHero() {
  return (
    <section className="relative w-full overflow-hidden px-gutter md:px-margin-tablet lg:px-margin-desktop pt-space-lg pb-space-xl">
      {/* Ambient Luminous Halos (contained) */}
      <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-primary-container/20 blur-[130px] pointer-events-none animate-pulse-halo" />
      <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-secondary-container/25 blur-[120px] pointer-events-none animate-pulse-halo" style={{ animationDelay: '2.5s' }} />
      <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-tertiary-container/20 blur-[140px] pointer-events-none animate-pulse-halo" style={{ animationDelay: '5s' }} />

      <div className="relative max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Regulatory Trust Badge with Floating & Pulse Micro-interactions */}
        <div className="inline-flex items-center gap-1.5 sm:gap-space-xs px-3 py-1.5 sm:px-space-md sm:py-space-xs rounded-full bg-surface-container-high/90 text-on-surface shadow-md backdrop-blur-xl mb-space-md sm:mb-space-lg border border-surface-variant/40 animate-float-slow max-w-full">
          <span className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-secondary animate-pulse animate-pulse-badge shrink-0" />
          <span className="font-label-sm text-[10px] sm:text-label-sm tracking-wider uppercase text-on-surface font-semibold truncate">
            1ère PropTech SaaS des 14 pays UEMOA &amp; CEMAC
          </span>
          <span className="text-outline mx-0.5 sm:mx-1 shrink-0">•</span>
          <span className="font-label-sm text-[10px] sm:text-label-sm text-secondary font-bold inline-flex items-center gap-1 shrink-0">
            <span className="material-symbols-outlined text-[12px] sm:text-[14px]">gavel</span> Conforme OHADA
          </span>
        </div>

        {/* Main Catchphrase */}
        <h1 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface max-w-5xl tracking-tight leading-tight font-extrabold">
          La Révolution Immobilière en Afrique :
          <span className="block mt-1 bg-gradient-to-r from-primary-container via-primary-fixed to-secondary bg-clip-text text-transparent drop-shadow-sm">
            Baux Sécurisés, Annonces &amp; Loyers Protégés
          </span>
        </h1>

        {/* Value Subtitle */}
        <p className="font-body-lg text-body-md sm:text-body-lg text-on-surface-variant max-w-3xl mt-space-md mb-space-xl leading-relaxed">
          Fin définitive des feuilles volantes, des cautions abusives et des litiges d’expulsion. LOCAGESTION numérise le bail OHADA, automatise les encaissements Mobile Money et certifie vos quittances infalsifiables avec validité bancaire et consulaire.
        </p>

        {/* Action Cluster - Mobile-First & Pro Responsive */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-space-md w-full max-w-sm sm:max-w-none mx-auto sm:mx-0">
          <Link
            href="/auth/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl sm:rounded-full bg-primary-container text-on-primary font-bold text-sm sm:text-base shadow-[0_8px_25px_rgba(255,81,106,0.45)] hover:brightness-110 active:scale-98 transition-all whitespace-nowrap group"
            data-path="authentification"
          >
            <span>Créer un Compte Gratuit</span>
            <span className="material-symbols-outlined text-[18px] sm:text-[20px] group-hover:translate-x-1 transition-transform shrink-0">
              arrow_forward
            </span>
          </Link>
          <a
            href="#guichet-verification"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 sm:px-6 sm:py-4 rounded-xl sm:rounded-full bg-surface-container-high/90 text-on-surface hover:bg-surface-variant font-semibold text-xs sm:text-sm shadow-md border border-surface-container-highest transition-all active:scale-98 whitespace-nowrap group"
          >
            <span
              className="material-symbols-outlined text-secondary text-[20px] sm:text-[22px] group-hover:rotate-12 transition-transform shrink-0"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              qr_code_scanner
            </span>
            <span>Vérifier une Quittance en Direct</span>
          </a>
        </div>

        {/* Micro Metrics Pill */}
        <div className="flex flex-wrap items-center justify-center gap-space-md mt-space-lg font-label-sm text-label-sm text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[16px]">verified</span>
            Commission 2% sur chaque Loyer encaissé
          </span>
          <span className="text-outline">•</span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[16px]">bolt</span>
            3% pour chaque bail signé
          </span>
          <span className="text-outline">•</span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary text-[16px]">verified_user</span>
            Rapide &amp; Sécurisé
          </span>
        </div>

        {/* Payment Rails & Social Proof Bar */}
        <div className="mt-space-xl pt-space-md w-full max-w-4xl">
          <p className="font-label-sm text-label-sm uppercase tracking-widest text-outline text-center mb-space-md font-bold">
            Interconnexion Directe aux Opérateurs Financiers Locaux &amp; Régionaux
          </p>
          <div className="grid grid-cols-2 gap-space-md items-center lg:grid-cols-5">
            {/* Wave */}
            <div className="flex items-center justify-center gap-space-xs p-space-md rounded-2xl bg-surface-container shadow-sm hover:bg-surface-container-high hover:-translate-y-1 transition-all border border-surface-container-high/40">
              <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary font-bold text-xs shrink-0 shadow-inner">
                W
              </div>
              <div className="text-left leading-none">
                <span className="font-label-md text-label-md text-on-surface block font-bold">Wave CI/SN</span>
                <span className="font-label-sm text-label-sm text-secondary">0% Frais cachés</span>
              </div>
            </div>

            {/* MTN MoMo */}
            <div className="flex items-center justify-center gap-space-xs p-space-md rounded-2xl bg-surface-container shadow-sm hover:bg-surface-container-high hover:-translate-y-1 transition-all border border-surface-container-high/40">
              <div className="w-8 h-8 rounded-full bg-[#ffcc00] flex items-center justify-center text-black font-extrabold text-xs shrink-0 shadow-inner">
                MoMo
              </div>
              <div className="text-left leading-none">
                <span className="font-label-md text-label-md text-on-surface block font-bold">MTN MoMo</span>
                <span className="font-label-sm text-label-sm text-tertiary">Bénin, CI, Cameroun</span>
              </div>
            </div>

            {/* Orange Money */}
            <div className="flex items-center justify-center gap-space-xs p-space-md rounded-2xl bg-surface-container shadow-sm hover:bg-surface-container-high hover:-translate-y-1 transition-all border border-surface-container-high/40">
              <div className="w-8 h-8 rounded-full bg-[#ff7900] flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-inner">
                OM
              </div>
              <div className="text-left leading-none">
                <span className="font-label-md text-label-md text-on-surface block font-bold">Orange Money</span>
                <span className="font-label-sm text-label-sm text-secondary">UEMOA &amp; CEMAC</span>
              </div>
            </div>

            {/* Moov Money */}
            <div className="flex items-center justify-center gap-space-xs p-space-md rounded-2xl bg-surface-container shadow-sm hover:bg-surface-container-high hover:-translate-y-1 transition-all border border-surface-container-high/40">
              <div className="w-8 h-8 rounded-full bg-[#005ca9] flex items-center justify-center text-white font-extrabold text-xs shrink-0 shadow-inner">
                Moov
              </div>
              <div className="text-left leading-none">
                <span className="font-label-md text-label-md text-on-surface block font-bold">Moov Money</span>
                <span className="font-label-sm text-label-sm text-tertiary">Push &amp; Pull Auto</span>
              </div>
            </div>

            {/* Celtiis Cash */}
            <div className="flex items-center justify-center gap-space-xs p-space-md rounded-2xl bg-surface-container shadow-sm hover:bg-surface-container-high hover:-translate-y-1 transition-all border border-surface-container-high/40 col-span-2 lg:col-span-1">
              <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-extrabold text-xs shrink-0 shadow-inner">
                CC
              </div>
              <div className="text-left leading-none">
                <span className="font-label-md text-label-md text-on-surface block font-bold">Celtiis Cash</span>
                <span className="font-label-sm text-label-sm text-secondary">Bénin • Direct</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
