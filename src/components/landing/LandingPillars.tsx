'use client';

import React from 'react';

export function LandingPillars() {
  return (
    <section
      id="securite-et-lois-ohada"
      className="w-full px-gutter md:px-margin-tablet lg:px-margin-desktop py-space-xl bg-surface-container-lowest dark:border-none border-y border-surface-container-high/30"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-space-xl">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto">
          <span className="font-label-md text-label-md text-primary font-bold uppercase tracking-widest block mb-1">
            Supériorité Technologique &amp; Territoriale
          </span>
          <h2 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface font-extrabold tracking-tight">
            Pourquoi LOCAGESTION Redéfinit les Standards du Continent
          </h2>
        </div>

        {/* Feature Matrix / Pillars Grid (5 Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-md">
          {/* Pillar 1 */}
          <div className="p-space-md rounded-2xl bg-surface-container shadow-md flex flex-col gap-space-sm border border-surface-container-high/40 hover:bg-surface-container-high hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[22px]">gavel</span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary font-bold uppercase">
              Pilier 01
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Moteur Juridique 14 Pays
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Intégration native des codes nationaux des 14 États OHADA (plafonnement de caution, clauses résolutoires de plein droit).
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-space-md rounded-2xl bg-surface-container shadow-md flex flex-col gap-space-sm border border-surface-container-high/40 hover:bg-surface-container-high hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-full bg-tertiary-container/20 text-tertiary flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <span className="font-label-sm text-label-sm text-tertiary font-bold uppercase">
              Pilier 02
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Guichet Public Instantané
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              API publique et lien de vérification /verify/code pour banques, ambassades et administrations sans création de compte requise.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-space-md rounded-2xl bg-surface-container shadow-md flex flex-col gap-space-sm border border-surface-container-high/40 hover:bg-surface-container-high hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-full bg-primary-container/20 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[22px]">currency_exchange</span>
            </div>
            <span className="font-label-sm text-label-sm text-primary font-bold uppercase">
              Pilier 03
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              100% Monnaie Locale FCFA
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Fin des conversions en devises étrangères. Flux bancaires et Mobile Money conçus pour les circuits UEMOA (XOF) et CEMAC (XAF).
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-space-md rounded-2xl bg-surface-container shadow-md flex flex-col gap-space-sm border border-surface-container-high/40 hover:bg-surface-container-high hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-full bg-secondary-container/20 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[22px]">public</span>
            </div>
            <span className="font-label-sm text-label-sm text-secondary font-bold uppercase">
              Pilier 04
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Inclusion Native Diaspora
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Paiement par carte bancaire internationale Visa/Mastercard converti directement en FCFA au propriétaire sans perte de change.
            </p>
          </div>

          {/* Pillar 5 */}
          <div className="p-space-md rounded-2xl bg-surface-container shadow-md flex flex-col gap-space-sm border border-surface-container-high/40 hover:bg-surface-container-high hover:-translate-y-1 transition-all duration-300 group">
            <div className="w-10 h-10 rounded-full bg-tertiary-container/20 text-tertiary flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-[22px]">devices</span>
            </div>
            <span className="font-label-sm text-label-sm text-tertiary font-bold uppercase">
              Pilier 05
            </span>
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
              Universalité &amp; Mode Hors-Ligne
            </h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
              Web, PWA ultra-légère et application Android conçue pour fonctionner avec un réseau 3G/4G intermittent sur le terrain africain.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
