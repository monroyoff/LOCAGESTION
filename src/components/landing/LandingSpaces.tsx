'use client';

import React from 'react';
import Link from 'next/link';

export function LandingSpaces() {
  return (
    <section
      id="espaces-gestion"
      className="w-full px-gutter md:px-margin-tablet lg:px-margin-desktop py-space-xl bg-surface-container-lowest dark:border-none border-y border-surface-container-high/30"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-space-xl">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div>
            <span className="font-label-md text-label-md text-secondary font-bold uppercase tracking-widest block mb-1">
              Architecture Métier Spécialisée
            </span>
            <h2 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface font-extrabold tracking-tight">
              Trois Espaces Dédiés. Un Seul Écosystème Unifié.
            </h2>
          </div>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
            Chaque acteur dispose d'une interface ergonomique taillée sur mesure pour ses impératifs juridiques, opérationnels et financiers.
          </p>
        </div>

        {/* 3 Columns Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg">
          {/* Space 1: Bailleur */}
          <div className="p-space-lg rounded-2xl bg-surface-container shadow-lg flex flex-col justify-between relative overflow-hidden group border border-surface-container-high/50 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-primary-container/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div>
              <div className="flex items-center justify-between mb-space-md">
                <div className="w-12 h-12 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">domain</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-surface-container-high text-primary font-label-sm text-label-sm font-bold uppercase border border-primary/20">
                  Propriétaires &amp; SCI
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold mb-space-xs">
                Espace Propriétaire Bailleur
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                Gérez votre parc locatif de 1 à 250 lots en toute sérénité. Protection maximale des revenus fonciers.
              </p>
              <ul className="flex flex-col gap-space-sm font-body-sm text-body-sm text-on-surface mb-space-lg">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Génération de baux OHADA</strong> conformes au pays choisi (Bénin, CI, Sénégal...)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>États des lieux contradictoires</strong> avec photos horodatées &amp; relevé index Cash Power/Sodeci
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Tableau de bord de rentabilité</strong> nette, alertes impayés &amp; relances WhatsApp en 1 clic
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Export comptable certifié</strong> pour déclaration fiscale DGI et bilans patrimoniaux
                  </span>
                </li>
              </ul>
            </div>
            <Link
              href="/auth/register"
              className="w-full py-2.5 px-4 rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border border-surface-container-highest group-hover:border-primary/40 whitespace-nowrap active:scale-95 shadow-sm"
              data-path="espaces-gestion"
            >
              <span>Accéder à l'Espace Bailleur</span>
              <span className="material-symbols-outlined text-[15px] group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>

          {/* Space 2: Résident */}
          <div className="p-space-lg rounded-2xl bg-surface-container shadow-lg flex flex-col justify-between relative overflow-hidden group border border-surface-container-high/50 hover:border-secondary/40 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-secondary-container/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div>
              <div className="flex items-center justify-between mb-space-md">
                <div className="w-12 h-12 rounded-2xl bg-secondary-container/20 text-secondary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">home</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-surface-container-high text-secondary font-label-sm text-label-sm font-bold uppercase border border-secondary/20">
                  Locataires &amp; Ménages
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold mb-space-xs">
                Espace Résident &amp; Locataire
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                Transparence absolue, paiements facilités et valorisation de votre historique de bon payeur.
              </p>
              <ul className="flex flex-col gap-space-sm font-body-sm text-body-sm text-on-surface mb-space-lg">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Quittances instantanées</strong> téléchargeables en PDF certifié à chaque règlement
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Paiement Mobile Money direct</strong> (Wave, MoMo, OM) sans frais dissimulés
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Passeport de Solvabilité</strong> : score sur 100 récompensant vos paiements avant le 5
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Gestionnaire d'incidents</strong> : signalement des pannes avec répartition légale des charges
                  </span>
                </li>
              </ul>
            </div>
            <Link
              href="/auth/register"
              className="w-full py-2.5 px-4 rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border border-surface-container-highest group-hover:border-secondary/40 whitespace-nowrap active:scale-95 shadow-sm"
              data-path="espaces-gestion"
            >
              <span>Découvrir l'Espace Résident</span>
              <span className="material-symbols-outlined text-[15px] group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>

          {/* Space 3: Démarcheur & Agent */}
          <div className="p-space-lg rounded-2xl bg-surface-container shadow-lg flex flex-col justify-between relative overflow-hidden group border border-surface-container-high/50 hover:border-tertiary/40 transition-all duration-300 hover:-translate-y-1">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-tertiary-container/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
            <div>
              <div className="flex items-center justify-between mb-space-md">
                <div className="w-12 h-12 rounded-2xl bg-tertiary-container/20 text-tertiary flex items-center justify-center group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">handshake</span>
                </div>
                <span className="px-3 py-1 rounded-full bg-surface-container-high text-tertiary font-label-sm text-label-sm font-bold uppercase border border-tertiary/20">
                  Intermédiaires &amp; Pros
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface font-bold mb-space-xs">
                Espace Démarcheur &amp; Agence
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                Professionnalisez votre activité sur le terrain. 0 bureau requis, vos mandats dans votre poche.
              </p>
              <ul className="flex flex-col gap-space-sm font-body-sm text-body-sm text-on-surface mb-space-lg">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Numéro IFU exigé</strong> : vérification et conformité légale des démarcheurs et agents
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Publication mobile ultra-rapide</strong> avec repères visuels locaux et photos smartphone
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Protection des commissions</strong> : baux tripartites intégrant formellement vos honoraires
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-secondary text-[18px] shrink-0 mt-0.5">
                    check_circle
                  </span>
                  <span>
                    <strong>Dépublication automatique</strong> : adieu les appels incessants pour un bien déjà loué
                  </span>
                </li>
              </ul>
            </div>
            <Link
              href="/auth/register"
              className="w-full py-2.5 px-4 rounded-full bg-surface-container-high hover:bg-surface-variant text-on-surface font-semibold text-xs flex items-center justify-center gap-1.5 transition-all border border-surface-container-highest group-hover:border-tertiary/40 whitespace-nowrap active:scale-95 shadow-sm"
              data-path="espaces-gestion"
            >
              <span>Rejoindre le Réseau Démarcheurs</span>
              <span className="material-symbols-outlined text-[15px] group-hover:translate-x-0.5 transition-transform">
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
