'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSpace } from '@/lib/context/space-context';
import { useTheme } from '@/lib/context/theme-context';

interface LandingHeaderProps {
  activePath?: string;
}

export function LandingHeader({ activePath = 'accueil' }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isTenant, isDemarcheur } = useSpace();
  const { isDark, toggleTheme } = useTheme();

  // Détermination dynamique de la destination de l'Espace Compte selon l'état de connexion
  let accountUrl = '/auth/login';
  let accountLabel = 'Espace Compte';
  let accountMobileLabel = 'Connexion';
  if (user) {
    if (isTenant || user.role === 'locataire') {
      accountUrl = '/portal';
      accountLabel = 'Mon Espace Résident';
      accountMobileLabel = 'Résident';
    } else if (isDemarcheur || user.role === 'demarcheur') {
      accountUrl = '/listings';
      accountLabel = 'Mon Espace Annonces';
      accountMobileLabel = 'Annonces';
    } else {
      accountUrl = '/dashboard';
      accountLabel = 'Mon Tableau de Bord';
      accountMobileLabel = 'Dashboard';
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Défilement fluide vers le haut pour le bouton Accueil et le logo
  const handleScrollToTop = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (mobileMenuOpen) setMobileMenuOpen(false);
  };

  // Liens pour la navigation (concis sur desktop pour zéro retour à la ligne)
  const navLinks = [
    { label: 'Accueil', shortLabel: 'Accueil', path: 'accueil', href: '#accueil' },
    { label: 'Espaces Métiers', shortLabel: 'Espaces', path: 'espaces-gestion', href: '#espaces-gestion' },
    { label: 'Annonces & Logements', shortLabel: 'Annonces', path: 'annonces-et-recherche', href: '#annonces-et-recherche' },
    { label: 'Tarifs & Offres', shortLabel: 'Tarifs', path: 'tarifs', href: '#tarifs' },
    { label: 'Sécurité Juridique & OHADA', shortLabel: 'Sécurité', path: 'securite-et-lois-ohada', href: '#securite-et-lois-ohada' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-surface/95 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.35)] dark:border-transparent border-b border-surface-container-high/60'
          : 'bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]'
      }`}
    >
      <div className="h-16 sm:h-20 w-full px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-3 max-w-7xl mx-auto relative">
        {/* Brand Logo & Menu Déroulant Mobile à gauche, en bas du nom LOCAGESTION */}
        <div className="flex flex-col items-start justify-center shrink-0">
          <Link
            href="/"
            onClick={handleScrollToTop}
            className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none"
            data-path="accueil"
            title="Retour à l'accueil"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(255,178,183,0.5)] transition-all duration-300 shrink-0">
              <span className="material-symbols-outlined text-[19px] sm:text-[24px]">real_estate_agent</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm sm:text-headline-sm tracking-tight text-on-surface font-extrabold whitespace-nowrap">
                LOCA<span className="text-primary-container">GESTION</span>
              </span>
              <span className="text-[9px] sm:text-label-sm text-secondary tracking-wider uppercase font-semibold">
                PropTech OHADA
              </span>
            </div>
          </Link>

          {/* Trigger Menu Déroulant Mobile — Placé à gauche, en bas du nom LOCAGESTION */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden mt-0.5 flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high/90 hover:bg-surface-variant text-on-surface text-[10px] font-bold border border-surface-container-highest/60 shadow-sm active:scale-95 transition-all"
            aria-label="Menu déroulant navigation"
          >
            <span className="material-symbols-outlined text-[13px] text-primary">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
            <span>Menu déroulant</span>
            <span
              className="material-symbols-outlined text-[12px] text-on-surface-variant transition-transform duration-200"
              style={{ transform: mobileMenuOpen ? 'rotate(180deg)' : 'none' }}
            >
              expand_more
            </span>
          </button>
        </div>

        {/* Desktop Navigation Pill - STRICTEMENT MONO-LIGNE & COMPACT */}
        <nav
          className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-surface-container-low/90 backdrop-blur-md border border-surface-container-high/50 shadow-inner shrink-0 whitespace-nowrap"
          data-active-classes="bg-surface-container-high text-on-surface font-semibold rounded-full"
        >
          {navLinks.map((link) => {
            const isActive = activePath === link.path;
            return (
              <a
                key={link.path}
                href={link.href}
                onClick={(e) => {
                  if (link.path === 'accueil') {
                    handleScrollToTop(e);
                  }
                }}
                className={`px-3 py-1.5 xl:px-4 xl:py-2 rounded-full text-xs xl:text-sm font-semibold whitespace-nowrap shrink-0 transition-all duration-200 ${
                  isActive
                    ? 'bg-surface-container-high text-on-surface shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
                }`}
                data-path={link.path}
              >
                {link.shortLabel}
              </a>
            );
          })}
        </nav>

        {/* Action Controls, Theme Toggle & Account Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Day / Night Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-full bg-surface-container-high/90 hover:bg-surface-variant text-on-surface border border-surface-container-highest/50 transition-all active:scale-90 shadow-sm flex items-center justify-center shrink-0"
            title={isDark ? 'Passer en mode jour (Clair)' : 'Passer en mode nuit (Sombre)'}
            aria-label="Basculer le mode jour/nuit"
          >
            <span className="material-symbols-outlined text-[17px] sm:text-[20px] text-secondary transition-transform duration-300">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* Quick Verify Quittance Button (Desktop/Tablet) */}
          <a
            href="#guichet-verification"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 xl:px-3.5 xl:py-2 rounded-full bg-surface-container text-tertiary hover:bg-surface-container-high hover:text-on-surface border border-tertiary/25 hover:border-tertiary/50 font-semibold text-xs xl:text-sm transition-all shadow-sm active:scale-95 whitespace-nowrap shrink-0"
            data-path="verification-quittance"
          >
            <span className="material-symbols-outlined text-[16px] xl:text-[18px]">verified</span>
            <span>Vérifier Quittance</span>
          </a>

          {/* Account Login / Dashboard Button (Mobile-First Compact) */}
          <Link
            href={accountUrl}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-[13px] shadow-[0_4px_16px_rgba(244,63,110,0.35)] hover:brightness-110 active:scale-95 transition-all whitespace-nowrap group shrink-0"
            data-path="authentification"
          >
            <span className="hidden sm:inline">{accountLabel}</span>
            <span className="sm:hidden tracking-tight">{accountMobileLabel}</span>
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-white text-[12px] sm:text-[13px]">person</span>
            </div>
          </Link>
        </div>
      </div>

      {/* Menu Déroulant Mobile — STRICTEMENT ancré à gauche en bas du nom LOCAGESTION */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop pour fermer en touchant l'arrière-plan */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Menu déroulant à gauche en bas du logo */}
          <div className="absolute left-3 top-[calc(100%-4px)] w-[280px] max-w-[calc(100vw-24px)] rounded-2xl glass-dropdown border border-surface-container-high p-3 shadow-2xl z-50 animate-in slide-in-from-top-2 duration-200 lg:hidden">
            <div className="flex flex-col gap-1.5">
              <div className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider px-2 py-0.5 flex items-center justify-between">
                <span>Menu Navigation</span>
                <span className="text-[10px] text-secondary font-semibold">
                  {isDark ? '🌙 Mode Nuit' : '☀️ Mode Jour'}
                </span>
              </div>
              {navLinks.map((link) => (
                <a
                  key={link.path}
                  href={link.href}
                  onClick={(e) => {
                    if (link.path === 'accueil') {
                      handleScrollToTop(e);
                    } else {
                      setMobileMenuOpen(false);
                    }
                  }}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                    activePath === link.path
                      ? 'bg-surface-container-high text-on-surface font-bold'
                      : 'bg-surface-container-low text-on-surface hover:bg-surface-container-high'
                  }`}
                  data-path={link.path}
                >
                  <span>{link.label}</span>
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                    chevron_right
                  </span>
                </a>
              ))}

              <div className="pt-2 border-t border-surface-container-high/60 flex flex-col gap-2">
                <a
                  href="#guichet-verification"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-full bg-surface-container text-tertiary font-bold text-xs border border-tertiary/25"
                  data-path="verification-quittance"
                >
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Vérifier une Quittance
                </a>
                <Link
                  href={accountUrl}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md active:scale-95 transition-all"
                  data-path="authentification"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {user ? 'dashboard' : 'login'}
                  </span>
                  {accountLabel}
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
