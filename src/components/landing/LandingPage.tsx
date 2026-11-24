'use client';

import React from 'react';
import { LandingHeader } from './LandingHeader';
import { LandingHero } from './LandingHero';
import { LandingSearchSection } from './LandingSearchSection';
import { LandingPainPoints } from './LandingPainPoints';
import { LandingSpaces } from './LandingSpaces';
import { LandingVerifyWidget } from './LandingVerifyWidget';
import { LandingPillars } from './LandingPillars';
import { LandingCTA } from './LandingCTA';
import { LandingFooter } from './LandingFooter';

export function LandingPage() {
  return (
    <div className="dark bg-background font-body-md text-body-md text-on-surface antialiased selection:bg-primary-container selection:text-on-primary min-h-screen flex flex-col w-full overflow-x-hidden">
      {/* 1. Header with glassmorphism & mobile drawer */}
      <LandingHeader activePath="accueil" />

      {/* 2. Main content container */}
      <main className="w-full pt-20 bg-background flex-1 flex flex-col">
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

          {/* Les 5 Piliers Différenciateurs LOCAGESTION */}
          <LandingPillars />

          {/* Appel à l'Action Final Premium */}
          <LandingCTA />
        </div>
      </main>

      {/* 3. Comprehensive Footer with 14 countries */}
      <LandingFooter />
    </div>
  );
}
