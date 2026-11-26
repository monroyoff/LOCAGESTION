'use client';

import React from 'react';
import { ThemeProvider, useTheme } from '@/lib/context/theme-context';
import { LandingHeader } from './LandingHeader';
import { LandingHero } from './LandingHero';
import { LandingSearchSection } from './LandingSearchSection';
import { LandingPainPoints } from './LandingPainPoints';
import { LandingSpaces } from './LandingSpaces';
import { LandingVerifyWidget } from './LandingVerifyWidget';
import { LandingMobileAppSection } from './LandingMobileAppSection';
import { LandingPillars } from './LandingPillars';
import { LandingPricing } from './LandingPricing';
import { LandingCTA } from './LandingCTA';
import { LandingFooter } from './LandingFooter';
import { LandingScrollToTop } from './LandingScrollToTop';

function LandingPageContent() {
  const { isDark } = useTheme();

  return (
    <div
      className={`${
        isDark ? 'dark' : 'light'
      } bg-background font-body-md text-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary min-h-screen flex flex-col w-full overflow-x-hidden transition-colors duration-300`}
    >
      {/* 1. Header avec menu déroulant à gauche sur mobile & bascule jour/nuit */}
      <LandingHeader activePath="accueil" />

      {/* 2. Conteneur principal avec ancrage Accueil pour le retour en haut */}
      <main id="accueil" className="w-full pt-16 sm:pt-20 bg-background flex-1 flex flex-col scroll-mt-24 transition-colors duration-300">
        <div className="flex flex-col w-full">
          {/* Hero Section */}
          <LandingHero />

          {/* Moteur de Recherche Afrique-First & Annonces */}
          <LandingSearchSection />

          {/* Résolution des 5 Problématiques Réelles (Bento Grid) */}
          <LandingPainPoints />

          {/* Les 3 Espaces Dédiés Cloisonnés */}
          <LandingSpaces />

          {/* Widget en direct : Guichet Public de Vérification */}
          <LandingVerifyWidget />

          {/* Section Dédiée : Application Mobile Android sur Google Play Store */}
          <LandingMobileAppSection />

          {/* Les 5 Piliers Différenciateurs LOCAGESTION */}
          <LandingPillars />

          {/* Grille Tarifaire & Modèle Split Payment */}
          <LandingPricing />

          {/* Appel à l'Action Final Premium */}
          <LandingCTA />
        </div>
      </main>

      {/* 3. Pied de page complet couvrant les 14 pays */}
      <LandingFooter />

      {/* 4. Bouton flottant flèche pour remonter rapidement en haut de page */}
      <LandingScrollToTop />
    </div>
  );
}

export function LandingPage() {
  return (
    <ThemeProvider>
      <LandingPageContent />
    </ThemeProvider>
  );
}
