'use client';

import React from 'react';

export function LandingPainPoints() {
  return (
    <section className="w-full px-gutter md:px-margin-tablet lg:px-margin-desktop py-space-xl">
      <div className="max-w-7xl mx-auto flex flex-col gap-space-xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-space-xs">
          <span className="px-space-md py-1 rounded-full bg-primary-container/20 text-primary-fixed-dim font-label-sm text-label-sm font-bold uppercase tracking-wider border border-primary-container/30">
            Réalités du Terrain Résolues
          </span>
          <h2 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface font-extrabold tracking-tight">
            5 Fléaux Immobiliers en Afrique Francophone Définitivement Éradiqués
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-2xl">
            De l'absence de contrat formel aux détournements de fonds en passant par les expulsions arbitraires, LOCAGESTION verrouille juridiquement et technologiquement chaque étape.
          </p>
        </div>

        {/* Bento Grid 5 Pain Points */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md">
          {/* Fléau 1 */}
          <div className="p-space-lg rounded-2xl bg-surface-container shadow-md flex flex-col justify-between group hover:bg-surface-container-high transition-all duration-300 border border-surface-container-high/40 hover:-translate-y-1">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-primary-container/20 text-primary-container flex items-center justify-center mb-space-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">contract_delete</span>
              </div>
              <div className="font-label-sm text-label-sm text-outline font-bold uppercase mb-1">
                Problème #1
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-sm">
                Zéro Feuille Volante &amp; Baux Papiers Perdus
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Les accords oraux ou écrits au stylo sur cahier d'écolier n'ont aucune valeur devant le tribunal. LOCAGESTION génère des baux numériques cryptographiques scellés en{' '}
                <span className="text-on-surface font-semibold">SHA-256</span>, inaltérables et téléchargeables à vie par les deux parties.
              </p>
            </div>
            <div className="mt-space-md pt-space-sm border-t border-surface-container-high/50 flex items-center gap-2 text-secondary font-label-sm text-label-sm font-bold">
              <span className="material-symbols-outlined text-[18px]">verified</span> Bail Numérique OHADA Certifié
            </div>
          </div>

          {/* Fléau 2 */}
          <div className="p-space-lg rounded-2xl bg-surface-container shadow-md flex flex-col justify-between group hover:bg-surface-container-high transition-all duration-300 border border-surface-container-high/40 hover:-translate-y-1">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-secondary-container/20 text-secondary flex items-center justify-center mb-space-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">qr_code_2</span>
              </div>
              <div className="font-label-sm text-label-sm text-outline font-bold uppercase mb-1">
                Problème #2
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-sm">
                Quittances Falsifiées &amp; Rejetées en Visa
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Les consulats européens et les banques locales refusent systématiquement les carnets de reçus achetés en papeterie. Chaque quittance émise sur LOCAGESTION est dotée d’un{' '}
                <span className="text-on-surface font-semibold">QR Code dynamique infalsifiable</span> scannable par les officiers de visas et analystes crédits.
              </p>
            </div>
            <div className="mt-space-md pt-space-sm border-t border-surface-container-high/50 flex items-center gap-2 text-secondary font-label-sm text-label-sm font-bold">
              <span className="material-symbols-outlined text-[18px]">account_balance</span> 100% Recevable Consulat &amp; Banques
            </div>
          </div>

          {/* Fléau 3 */}
          <div className="p-space-lg rounded-2xl bg-surface-container shadow-md flex flex-col justify-between group hover:bg-surface-container-high transition-all duration-300 border border-surface-container-high/40 hover:-translate-y-1">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-tertiary-container/20 text-tertiary flex items-center justify-center mb-space-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">balance</span>
              </div>
              <div className="font-label-sm text-label-sm text-outline font-bold uppercase mb-1">
                Problème #3
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-sm">
                Cautions et Avances Illégales et Abusives
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Exiger 6 à 10 mois de loyer d'avance viole la loi. LOCAGESTION applique un bridage algorithmique conforme aux codes nationaux :{' '}
                <span className="text-on-surface font-semibold">Max 3 mois au Bénin (Loi 2018-12)</span> et{' '}
                <span className="text-on-surface font-semibold">2m caution + 2m avance en Côte d'Ivoire (Loi 2019-576)</span>.
              </p>
            </div>
            <div className="mt-space-md pt-space-sm border-t border-surface-container-high/50 flex items-center gap-2 text-tertiary font-label-sm text-label-sm font-bold">
              <span className="material-symbols-outlined text-[18px]">gavel</span> Garde-Fou Juridique Automatique
            </div>
          </div>

          {/* Fléau 4 (Double Column on lg) */}
          <div className="p-space-lg rounded-2xl bg-surface-container shadow-md flex flex-col justify-between group hover:bg-surface-container-high transition-all duration-300 border border-surface-container-high/40 lg:col-span-2 hover:-translate-y-1">
            <div className="flex flex-col md:flex-row gap-space-lg items-start">
              <div className="flex-1">
                <div className="w-12 h-12 rounded-2xl bg-primary-container/20 text-primary flex items-center justify-center mb-space-md group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">point_of_sale</span>
                </div>
                <div className="font-label-sm text-label-sm text-outline font-bold uppercase mb-1">
                  Problème #4
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-sm">
                  Tracasseries d'Espèces, Fausses Monnaies &amp; Déplacements Inutiles
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-space-md">
                  Fini les rendez-vous manqués au carrefour, les faux billets de 10 000 FCFA et les retards de paiement chroniques. Les résidents s'acquittent du loyer en 15 secondes via Wave, MTN, Orange ou Moov sans se déplacer. Le bailleur encaisse instantanément sur son compte bancaire ou son portefeuille mobile sans intermédiaire suspect.
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface border border-surface-container-highest">
                    Paiement Mobile 24/7
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface border border-surface-container-highest">
                    Rapprochement Automatique
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-container-high font-label-sm text-label-sm text-on-surface border border-surface-container-highest">
                    Zéro Risque de Vol Physique
                  </span>
                </div>
              </div>

              {/* Inline Metric Card Component */}
              <div className="w-full md:w-64 p-space-md rounded-2xl bg-surface-container-lowest shrink-0 shadow-inner border border-surface-container-high">
                <span className="font-label-sm text-label-sm text-outline uppercase font-bold block mb-1">
                  Impact Constaté
                </span>
                <div className="font-headline-xl text-headline-xl text-secondary font-extrabold tracking-tight">
                  -92%
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 leading-relaxed">
                  D'impayés et de retards après le 5 du mois grâce au prélèvement push et aux alertes WhatsApp.
                </p>
                <div className="w-full h-1.5 rounded-full bg-surface-container-high mt-space-md overflow-hidden">
                  <div className="w-11/12 h-full bg-secondary rounded-full shadow-[0_0_8px_rgba(78,222,163,0.8)]" />
                </div>
              </div>
            </div>
            <div className="mt-space-md pt-space-sm border-t border-surface-container-high/50 flex items-center gap-2 text-secondary font-label-sm text-label-sm font-bold">
              <span className="material-symbols-outlined text-[18px]">currency_exchange</span> Encaissement Direct Wave, MoMo &amp; Orange
            </div>
          </div>

          {/* Fléau 5 */}
          <div className="p-space-lg rounded-2xl bg-surface-container shadow-md flex flex-col justify-between group hover:bg-surface-container-high transition-all duration-300 border border-surface-container-high/40 hover:-translate-y-1">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-secondary-container/20 text-secondary flex items-center justify-center mb-space-md group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[28px]">flight_takeoff</span>
              </div>
              <div className="font-label-sm text-label-sm text-outline font-bold uppercase mb-1">
                Problème #5
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-space-sm">
                Bailleurs de la Diaspora Trahis par des Proches
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Ne confiez plus la gestion de vos cours communes et immeubles à un cousin ou un démarcheur opaque. Suivez vos encaissements et quittances en direct depuis Paris, Montréal ou New York avec rapatriement bancaire certifié.
              </p>
            </div>
            <div className="mt-space-md pt-space-sm border-t border-surface-container-high/50 flex items-center gap-2 text-tertiary font-label-sm text-label-sm font-bold">
              <span className="material-symbols-outlined text-[18px]">public</span> Pilotage Diaspora Intégral
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
