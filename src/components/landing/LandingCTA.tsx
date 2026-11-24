'use client';

import React from 'react';
import Link from 'next/link';

export function LandingCTA() {
  return (
    <section className="w-full px-gutter md:px-margin-tablet lg:px-margin-desktop py-space-xl">
      <div className="max-w-6xl mx-auto rounded-3xl bg-gradient-to-br from-surface-container-high via-surface-container to-surface-container-lowest p-space-lg sm:p-space-xl relative overflow-hidden shadow-2xl border border-surface-container-high/60">
        {/* Luminous Halo accent with micro-animation */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-primary-container/25 blur-[100px] pointer-events-none animate-pulse-halo" />
        <div className="absolute -left-20 -top-20 w-64 h-64 rounded-full bg-secondary-container/15 blur-[90px] pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
          {/* Top Pill */}
          <span className="px-space-md py-1 rounded-full bg-surface-container text-secondary font-label-sm text-label-sm font-bold uppercase mb-space-md border border-secondary/20 shadow-sm animate-float-slow">
            Prêt à Sécuriser Vos Revenus Locatifs ?
          </span>

          {/* Headline */}
          <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface font-extrabold tracking-tight mb-space-md">
            Passez à la Gestion Locative Sans Papier Dès Aujourd'hui
          </h2>

          {/* Subtitle */}
          <p className="font-body-lg text-body-md sm:text-body-lg text-on-surface-variant mb-space-xl leading-relaxed">
            Rejoignez plus de 12 000 bailleurs, résidents et agences immobilières dans les 14 pays UEMOA &amp; CEMAC. Configuration gratuite en moins de 3 minutes.
          </p>

          {/* CTA Action Cluster - Refined Pro Compact */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3.5 w-full max-w-xs sm:max-w-none mx-auto">
            <Link
              href="/auth/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-full bg-primary-container text-on-primary font-semibold text-xs sm:text-sm shadow-sm hover:shadow-md hover:brightness-105 active:scale-95 transition-all whitespace-nowrap group"
              data-path="authentification"
            >
              <span>Créer mon Compte Gratuit</span>
              <span className="material-symbols-outlined text-[16px] sm:text-[18px] group-hover:translate-x-0.5 transition-transform shrink-0">
                chevron_right
              </span>
            </Link>
            <a
              href="https://wa.me/22500000000"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 sm:px-5 sm:py-3 rounded-full bg-secondary-container text-on-secondary font-medium text-xs sm:text-sm shadow-sm hover:opacity-90 active:scale-95 transition-all whitespace-nowrap group"
            >
              <span className="material-symbols-outlined text-[16px] sm:text-[18px] group-hover:scale-110 transition-transform shrink-0">
                chat
              </span>
              <span>Expert WhatsApp</span>
            </a>
          </div>

          {/* Institutional Reassurance Footnote */}
          <div className="mt-space-lg flex flex-wrap items-center justify-center gap-space-md text-on-surface-variant font-label-sm text-label-sm">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-secondary text-[16px]">verified</span>
              Conforme Règlement BCEAO/BEAC
            </span>
            <span className="text-outline">•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-secondary text-[16px]">lock</span>
              Hébergement Données Sécurisé
            </span>
            <span className="text-outline">•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-secondary text-[16px]">support_agent</span>
              Support Dédié 6j/7
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
