'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function LandingPricing() {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const faqs = [
    {
      q: 'Y a-t-il des frais fixes ou d\'engagement caché ?',
      a: 'Absolument aucun. Vous pouvez créer votre compte et gérer vos biens à 0 FCFA/mois. Vous ne réglez la commission Split Payment (1,5%) que si un locataire règle son loyer directement via la passerelle Mobile Money.',
    },
    {
      q: 'Comment fonctionne le reversement sur mon compte bailleur ?',
      a: 'Dès que le locataire valide son paiement (Wave, MTN Mobile Money, Moov Money, Orange Money ou Celtiis Cash), la transaction est divisée : 98,5% sont automatiquement crédités sur votre compte Mobile Money ou bancaire, et la commission de 1,5% est prélevée pour la plateforme.',
    },
    {
      q: 'Puis-je continuer à encaisser des loyers en espèces ou par virement ?',
      a: 'Oui, sans aucune restriction ni commission. Si un locataire vous paie en espèces ou par virement bancaire classique, vous enregistrez simplement l\'encaissement à 0 FCFA et la quittance certifiée avec QR Code est générée immédiatement.',
    },
    {
      q: 'Quels sont les pays et devises couverts ?',
      a: 'LOCAGESTION est opérationnelle dans les 14 pays membres de l\'UEMOA (Franc CFA XOF) et de la CEMAC (Franc CFA XAF) : Bénin, Côte d\'Ivoire, Sénégal, Togo, Cameroun, Gabon, Burkina Faso, Mali, etc.',
    },
  ];

  return (
    <section
      id="tarifs"
      className="w-full px-gutter md:px-margin-tablet lg:px-margin-desktop py-space-xl bg-surface scroll-mt-20 border-t border-surface-container-high/40 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-space-xl">
        {/* En-tête de section */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center">
          <span className="px-space-md py-1 rounded-full bg-secondary-container/20 text-secondary font-label-sm text-label-sm font-bold uppercase mb-space-sm border border-secondary/25 shadow-2xs">
            Tarification Transparente &amp; Modèle Split Payment
          </span>
          <h2 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface font-extrabold tracking-tight mb-space-sm">
            Payez Uniquement aux Résultats, Sans Frais Cachés
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
            Démarrez 100% gratuitement. Bénéficiez de l'encaissement automatisé par Mobile Money avec prélèvement instantané de commission, ou gérez vos encaissements manuels en toute liberté.
          </p>
        </div>

        {/* Bannière Pédagogique : Le Split Payment Mobile Money en 3 Étapes */}
        <div className="p-space-lg sm:p-space-xl rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-lg">
          <div className="text-center max-w-2xl mx-auto mb-space-lg">
            <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Automatisation Financière Intelligente
            </span>
            <h3 className="text-lg sm:text-xl font-extrabold text-on-surface mt-1">
              Comment fonctionne le Split Payment Mobile Money ?
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-space-md relative">
            {/* Étape 1 */}
            <div className="flex flex-col items-center text-center p-space-md rounded-2xl bg-surface-container/60 border border-surface-container-high/50 hover:bg-surface-container transition-all">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg mb-space-sm shadow-inner">
                <span className="material-symbols-outlined text-[26px]">smartphone</span>
              </div>
              <span className="text-[10px] font-bold uppercase text-primary tracking-wide">
                Étape 1 • Règlement
              </span>
              <h4 className="font-bold text-on-surface text-sm sm:text-base mt-1 mb-1.5">
                Paiement Mobile Money
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Le locataire clique sur « Payer mon loyer » depuis son portail et valide le transfert via son opérateur préféré (Wave, MTN, Moov, Orange, Celtiis).
              </p>
            </div>

            {/* Étape 2 */}
            <div className="flex flex-col items-center text-center p-space-md rounded-2xl bg-surface-container/60 border border-surface-container-high/50 hover:bg-surface-container transition-all">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-lg mb-space-sm shadow-inner">
                <span className="material-symbols-outlined text-[26px]">call_split</span>
              </div>
              <span className="text-[10px] font-bold uppercase text-secondary tracking-wide">
                Étape 2 • Split Instantané
              </span>
              <h4 className="font-bold text-on-surface text-sm sm:text-base mt-1 mb-1.5">
                Séparation Automatique
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                La passerelle sécurisée divise la somme en temps réel : 98,5% pour le bailleur et 1,5% de commission de service pour LOCAGESTION.
              </p>
            </div>

            {/* Étape 3 */}
            <div className="flex flex-col items-center text-center p-space-md rounded-2xl bg-surface-container/60 border border-surface-container-high/50 hover:bg-surface-container transition-all">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg mb-space-sm shadow-inner">
                <span className="material-symbols-outlined text-[26px]">verified_user</span>
              </div>
              <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400 tracking-wide">
                Étape 3 • Reversement
              </span>
              <h4 className="font-bold text-on-surface text-sm sm:text-base mt-1 mb-1.5">
                Reversement &amp; Quittance Scellée
              </h4>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Les fonds nets arrivent immédiatement sur le compte du propriétaire. La quittance officielle PDF avec QR code certifié est scellée automatiquement.
              </p>
            </div>
          </div>
        </div>

        {/* Grille des 3 Formules Tarifaires */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-space-lg items-stretch">
          {/* Formule 1 : Découverte (0 FCFA) */}
          <div className="p-space-lg rounded-3xl bg-surface-container-lowest border border-surface-container-high flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 mb-space-sm">
                <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-bold text-[10px] uppercase">
                  Pour Débuter
                </span>
                <span className="text-xs font-semibold text-on-surface-variant">
                  Particuliers (1 à 2 lots)
                </span>
              </div>

              <h3 className="text-xl font-bold text-on-surface">Formule Découverte</h3>
              <p className="text-xs text-on-surface-variant mt-1 mb-space-md">
                Idéale pour les propriétaires souhaitant digitaliser leurs premiers logements sans aucun coût.
              </p>

              <div className="flex items-baseline gap-1 my-space-md pb-space-md border-b border-surface-container-high/60">
                <span className="text-3xl sm:text-4xl font-extrabold text-on-surface">0 FCFA</span>
                <span className="text-xs text-on-surface-variant font-medium">/ mois à vie</span>
              </div>

              <ul className="space-y-2.5 text-xs text-on-surface-variant mb-space-lg">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-500 shrink-0">check_circle</span>
                  <span>Jusqu’à <strong>2 baux actifs</strong> simultanés</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-500 shrink-0">check_circle</span>
                  <span>Baux électroniques conformes OHADA</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-500 shrink-0">check_circle</span>
                  <span>États des lieux contradictoires avec photos</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-500 shrink-0">check_circle</span>
                  <span>Émission de quittances certifiées avec QR Code</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-500 shrink-0">check_circle</span>
                  <span>Encaissements manuels (espèces/virement) à 0 FCFA</span>
                </li>
              </ul>
            </div>

            <Link
              href="/auth/register"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs border border-surface-container-high/80 transition-all text-center"
            >
              <span>Créer un Compte Gratuit</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>

          {/* Formule 2 : Sérénité (Split Payment) — MISE EN AVANT POPULAIRE */}
          <div className="p-space-lg rounded-3xl bg-gradient-to-b from-surface-container-high via-surface-container to-surface-container-lowest border-2 border-primary/50 flex flex-col justify-between shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 bg-primary text-on-primary text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm">
              Recommandé • Le Plus Choisi
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-space-sm pt-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary font-bold text-[10px] uppercase">
                  Sans Abonnement Fixe
                </span>
              </div>

              <h3 className="text-xl font-bold text-on-surface">Formule Sérénité</h3>
              <p className="text-xs text-on-surface-variant mt-1 mb-space-md">
                Encaissement 100% automatisé par Mobile Money avec reversement instantané sur votre compte.
              </p>

              <div className="flex items-baseline gap-1 my-space-md pb-space-md border-b border-surface-container-high/60">
                <span className="text-3xl sm:text-4xl font-extrabold text-primary">1,5%</span>
                <span className="text-xs text-on-surface-variant font-medium">/ loyer Mobile Money</span>
              </div>

              <ul className="space-y-2.5 text-xs text-on-surface mb-space-lg">
                <li className="flex items-center gap-2 font-medium">
                  <span className="material-symbols-outlined text-[16px] text-primary shrink-0">check_circle</span>
                  <span><strong>Nombre de lots illimité</strong></span>
                </li>
                <li className="flex items-center gap-2 font-medium">
                  <span className="material-symbols-outlined text-[16px] text-primary shrink-0">check_circle</span>
                  <span><strong>Split Payment automatique</strong> (Wave, MTN, Moov, Orange, Celtiis)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary shrink-0">check_circle</span>
                  <span>Reversement instantané sur votre Mobile Wallet</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary shrink-0">check_circle</span>
                  <span>Émission &amp; scellement automatique de la quittance</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary shrink-0">check_circle</span>
                  <span>Relances automatiques par WhatsApp &amp; SMS</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-primary shrink-0">check_circle</span>
                  <span>Passeport Solvabilité locataire en direct</span>
                </li>
              </ul>
            </div>

            <Link
              href="/auth/register"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm shadow-md hover:brightness-105 active:scale-95 transition-all text-center"
            >
              <span>Activer l'Encaissement Automatique</span>
              <span className="material-symbols-outlined text-[18px]">bolt</span>
            </Link>
          </div>

          {/* Formule 3 : Agences & Syndics */}
          <div className="p-space-lg rounded-3xl bg-surface-container-lowest border border-surface-container-high flex flex-col justify-between shadow-sm hover:shadow-md transition-all">
            <div>
              <div className="flex items-center justify-between gap-2 mb-space-sm">
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/25 text-secondary font-bold text-[10px] uppercase">
                  Pour Professionnels
                </span>
                <span className="text-xs font-semibold text-on-surface-variant">
                  Agences &amp; Syndics
                </span>
              </div>

              <h3 className="text-xl font-bold text-on-surface">Formule Entreprise &amp; Pro</h3>
              <p className="text-xs text-on-surface-variant mt-1 mb-space-md">
                Pour les administrateurs de biens, démarcheurs certifiés et cabinets immobiliers.
              </p>

              <div className="flex items-baseline gap-1 my-space-md pb-space-md border-b border-surface-container-high/60">
                <span className="text-3xl sm:text-4xl font-extrabold text-on-surface">15 000 FCFA</span>
                <span className="text-xs text-on-surface-variant font-medium">/ mois (validité 30 jours)</span>
              </div>

              <ul className="space-y-2.5 text-xs text-on-surface-variant mb-space-lg">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-500 shrink-0">check_circle</span>
                  <span>Accès complet garanti 30 jours avec baux illimités</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-500 shrink-0">check_circle</span>
                  <span>Alertes automatiques avant échéance (J-2, J-1 et Jour J)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-500 shrink-0">check_circle</span>
                  <span>Gestion multi-utilisateurs &amp; rôles délégués</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-500 shrink-0">check_circle</span>
                  <span>Console Démarcheur &amp; Mandats certifiés</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-500 shrink-0">check_circle</span>
                  <span>Exports comptables &amp; DGI / IFU automatisés</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-emerald-500 shrink-0">check_circle</span>
                  <span>Chargé de compte dédié &amp; Support prioritaire 7j/7</span>
                </li>
              </ul>
            </div>

            <Link
              href="/auth/register"
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs border border-surface-container-high/80 hover:border-primary/50 transition-all text-center"
            >
              <span>Activer la Formule Pro</span>
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        </div>

        {/* Foire Aux Questions (FAQ) Tarifs & Split Payment */}
        <div className="max-w-3xl mx-auto w-full pt-space-lg">
          <h3 className="text-center font-bold text-on-surface text-base sm:text-lg mb-space-md">
            Questions Fréquentes sur les Tarifs &amp; le Split Payment
          </h3>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-surface-container-high bg-surface-container-lowest overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(idx)}
                    className="w-full p-4 text-left flex items-center justify-between gap-4 font-semibold text-xs sm:text-sm text-on-surface hover:text-primary transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <span
                      className={`material-symbols-outlined text-[18px] transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-primary' : 'text-on-surface-variant'
                      }`}
                    >
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 pt-1 text-xs text-on-surface-variant leading-relaxed border-t border-surface-container-high/40 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
