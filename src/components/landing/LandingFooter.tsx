'use client';

import React from 'react';
import Link from 'next/link';

export function LandingFooter() {
  const uemoaCountries = [
    { name: "Côte d'Ivoire (CI)", zone: 'secondary' },
    { name: 'Sénégal (SN)', zone: 'secondary' },
    { name: 'Cameroun (CM)', zone: 'secondary' },
    { name: 'Bénin (BJ)', zone: 'secondary' },
    { name: 'Togo (TG)', zone: 'secondary' },
    { name: 'Mali (ML)', zone: 'secondary' },
    { name: 'Burkina Faso (BF)', zone: 'secondary' },
    { name: 'Gabon (GA)', zone: 'tertiary' },
    { name: 'Congo-Brazza (CG)', zone: 'tertiary' },
    { name: 'Rép. Centrafricaine (CF)', zone: 'tertiary' },
    { name: 'Tchad (TD)', zone: 'tertiary' },
    { name: 'Guinée Équatoriale (GQ)', zone: 'tertiary' },
    { name: 'Niger (NE)', zone: 'secondary' },
    { name: 'Guinée-Bissau (GW)', zone: 'secondary' },
  ];

  return (
    <footer className="w-full bg-surface-container-lowest mt-space-xl border-t border-surface-container-high/40">
      <div className="w-full px-gutter md:px-margin-tablet lg:px-margin-desktop py-space-xl max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-space-lg mb-space-xl">
          {/* Brand & Purpose Column (2 cols on lg) */}
          <div className="lg:col-span-2 flex flex-col gap-space-md">
            <div className="flex items-center gap-space-sm">
              <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary border border-primary/20">
                <span className="material-symbols-outlined text-[24px]">real_estate_agent</span>
              </div>
              <span className="font-headline-sm text-headline-sm text-on-surface font-extrabold">
                LOCA<span className="text-primary-container">GESTION</span>
              </span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md leading-relaxed">
              Infrastructure PropTech de référence pour l'Afrique francophone. Standardisation des baux d'habitation, certification instantanée des quittances et gestion locative automatisée en devises FCFA.
            </p>
            <div className="flex flex-wrap items-center gap-space-sm mt-space-xs">
              <span className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-low font-label-sm text-label-sm text-secondary border border-surface-container-high">
                <span className="material-symbols-outlined text-[16px]">gavel</span>
                100% Conforme OHADA
              </span>
              <span className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-low font-label-sm text-label-sm text-tertiary border border-surface-container-high">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                Paiements Sécurisés
              </span>
            </div>
          </div>

          {/* Solutions Column */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider font-bold mb-space-xs">
              Solutions
            </span>
            <a
              className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="#espaces-gestion"
              data-path="espaces-gestion"
            >
              Espace Propriétaire Bailleur
            </a>
            <a
              className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="#espaces-gestion"
              data-path="espaces-gestion"
            >
              Espace Résident &amp; Locataire
            </a>
            <a
              className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="#espaces-gestion"
              data-path="espaces-gestion"
            >
              Espace Démarcheur &amp; Agence
            </a>
            <Link
              className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="/listings"
              data-path="annonces-et-recherche"
            >
              Parc Immobilier Vérifié
            </Link>
            <a
              className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="#tarifs"
              data-path="tarifs"
            >
              Grille Tarifaire UEMOA/CEMAC
            </a>
          </div>

          {/* Légal & Conformité Column */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider font-bold mb-space-xs">
              Légal &amp; Conformité
            </span>
            <a
              className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="#securite-et-lois-ohada"
              data-path="securite-et-lois-ohada"
            >
              Cadre Juridique OHADA
            </a>
            <a
              className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="#guichet-verification"
              data-path="verification-quittance"
            >
              Authentification QR Quittance
            </a>
            <a
              className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="#securite-et-lois-ohada"
              data-path="securite-et-lois-ohada"
            >
              Sécurité &amp; Séquestre Mobile
            </a>
            <Link
              className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="/terms"
              data-path="conditions-utilisation"
            >
              Conditions Générales de Bail
            </Link>
            <Link
              className="font-body-md text-body-md text-on-surface-variant hover:text-on-surface transition-colors"
              href="/privacy"
              data-path="politique-confidentialite"
            >
              Protection des Données (RGPD/OHADA)
            </Link>
          </div>

          {/* Direct Support Column */}
          <div className="flex flex-col gap-space-sm">
            <span className="font-label-lg text-label-lg text-on-surface uppercase tracking-wider font-bold mb-space-xs">
              Support Direct
            </span>
            <a
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-secondary-container text-on-secondary font-semibold text-xs hover:opacity-90 active:scale-95 transition-all shadow-sm w-fit whitespace-nowrap"
              href="https://wa.me/22500000000"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className="material-symbols-outlined text-[17px]">chat</span>
              Assistance WhatsApp
            </a>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs leading-relaxed">
              Disponible du Lundi au Samedi 8h-20h GMT pour la résolution des litiges et vérifications expresses.
            </p>
          </div>
        </div>

        {/* 14 Countries Grid Bar */}
        <div className="p-space-lg rounded-2xl bg-surface-container-low mb-space-xl border border-surface-container-high/60">
          <span className="font-label-md text-label-md text-secondary uppercase tracking-widest font-bold block mb-space-sm">
            Couverture Territoriale Intégrale (14 Pays UEMOA &amp; CEMAC)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-space-sm">
            {uemoaCountries.map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-space-xs font-body-sm text-body-sm text-on-surface-variant"
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    c.zone === 'secondary' ? 'bg-secondary' : 'bg-tertiary'
                  } shrink-0`}
                />
                <span className="truncate">{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Copyright & Security Signatures */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-space-md pt-space-md border-t border-surface-container-high/50 text-on-surface-variant font-body-sm text-body-sm">
          <p>© 2025 LOCAGESTION SAS. Tous droits réservés. Conforme aux Actes Uniformes OHADA &amp; Normes Bancaires BCEAO/BEAC.</p>
          <div className="flex items-center gap-space-md shrink-0">
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-secondary">shield</span>
              Cryptage SSL 256-Bit
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px] text-primary">
                currency_exchange
              </span>
              Multi-Devises XOF / XAF
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
