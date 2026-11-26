'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSpace } from '@/lib/context/space-context';
import { useTheme } from '@/lib/context/theme-context';
import { GooglePlayIcon, PLAYSTORE_URL } from './GooglePlayBadge';

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

  // Défilement fluide fiable vers les sections
  const handleNavClick = (e: React.MouseEvent, path: string, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (path === 'accueil') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const targetId = href.replace('#', '');
    setTimeout(() => {
      const element = document.getElementById(targetId);
      if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }, 120);
  };

  // Liens pour la navigation avec métadonnées riches (icônes & descriptions pour menu mobile pro)
  const navLinks = [
    {
      label: 'Accueil',
      shortLabel: 'Accueil',
      path: 'accueil',
      href: '#accueil',
      icon: 'home',
      iconBg: 'bg-primary/15 text-primary',
      description: 'Haut de page, vision PropTech & chiffres clés',
    },
    {
      label: 'Espaces Métiers',
      shortLabel: 'Espaces',
      path: 'espaces-gestion',
      href: '#espaces-gestion',
      icon: 'domain',
      iconBg: 'bg-secondary/15 text-secondary',
      description: 'Bailleur Propriétaire, Résident & Démarcheur',
    },
    {
      label: 'Annonces & Recherche',
      shortLabel: 'Annonces',
      path: 'annonces-et-recherche',
      href: '#annonces-et-recherche',
      icon: 'travel_explore',
      iconBg: 'bg-tertiary/15 text-tertiary',
      description: 'Logements géolocalisés avec Cash Power & forage',
    },
    {
      label: 'Tarifs & Modèle',
      shortLabel: 'Tarifs',
      path: 'tarifs',
      href: '#tarifs',
      icon: 'payments',
      iconBg: 'bg-amber-500/15 text-amber-500',
      description: '100% transparent, sans frais cachés',
    },
    {
      label: 'Application Mobile',
      shortLabel: 'App Mobile',
      path: 'application-mobile',
      href: '#application-mobile',
      icon: 'smartphone',
      iconBg: 'bg-emerald-500/15 text-emerald-500',
      description: 'Disponible sur Google Play Store pour Android',
    },
    {
      label: 'Sécurité Juridique & OHADA',
      shortLabel: 'Sécurité',
      path: 'securite-et-lois-ohada',
      href: '#securite-et-lois-ohada',
      icon: 'gavel',
      iconBg: 'bg-indigo-500/15 text-indigo-400',
      description: 'Lois nationales 14 pays UEMOA/CEMAC & baux certifiés',
    },
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
        {/* Brand Logo & Bouton Menu Mobile (Alignés sur une seule ligne propre sans débordement) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Trigger Menu Mobile — Ergonomique, 36px, tactile, aligné à gauche */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-9 h-9 rounded-xl bg-surface-container-high hover:bg-surface-variant text-on-surface flex items-center justify-center border border-surface-container-highest shadow-sm active:scale-95 transition-all shrink-0"
            aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu navigation'}
            title="Menu de navigation"
          >
            <span className="material-symbols-outlined text-[20px] text-primary transition-transform duration-200">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>

          {/* Logo Brand */}
          <Link
            href="/"
            onClick={handleScrollToTop}
            className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none"
            data-path="accueil"
            title="Retour à l'accueil"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-105 transition-all duration-300 shrink-0 shadow-md">
              <img
                src="/icon-192.png"
                alt="LOCAGESTION Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[15px] sm:text-xl lg:text-[22px] tracking-tight text-on-surface font-extrabold whitespace-nowrap">
                LOCA<span className="text-primary-container">GESTION</span>
              </span>
              <span className="text-[7.5px] sm:text-[9px] text-secondary font-bold tracking-tight uppercase whitespace-nowrap block mt-0.5">
                PROTECH DE L'IMMOBILIER
              </span>
            </div>
          </Link>
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
                onClick={(e) => handleNavClick(e, link.path, link.href)}
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

      {/* Menu Déroulant Mobile — 100% OPAQUE, Spacieux, Pro & Navigation Active */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop sombre couvrant tout l'écran */}
          <div
            className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm lg:hidden transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu déroulant — FOND SOLIDE OPAQUE (Blanc pur en mode jour / Noir profond en nuit), zéro transparence indésirable */}
          <div className="fixed top-[70px] left-3 right-3 sm:left-6 sm:w-[380px] sm:right-auto max-h-[calc(100vh-84px)] overflow-y-auto rounded-3xl bg-white dark:bg-[#0c1017] text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 p-4 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] z-[70] animate-in fade-in zoom-in-95 duration-200 lg:hidden">
            {/* Header du menu mobile */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary shadow-sm border border-slate-200 dark:border-slate-700">
                  <span className="material-symbols-outlined text-[18px]">widgets</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">Navigation Plateforme</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                    {isDark ? '🌙 Mode Nuit Actif' : '☀️ Mode Jour Actif'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 active:scale-90 transition-all border border-slate-200 dark:border-slate-700"
                aria-label="Fermer le menu"
              >
                <span className="material-symbols-outlined text-[17px]">close</span>
              </button>
            </div>

            {/* Bannière Application Google Play Store Mobile */}
            <a
              href={PLAYSTORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 text-white border border-slate-700/80 shadow-md mb-2 group active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2.5">
                <GooglePlayIcon className="w-6 h-6 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">Application Android</span>
                  <span className="text-xs font-black text-white">Disponible sur Google Play</span>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-500 text-black">
                Installer
              </span>
            </a>

            {/* Rubriques avec grandes icônes thématiques et descriptifs clairs */}
            <div className="flex flex-col gap-1.5 py-1">
              {navLinks.map((link) => {
                const isActive = activePath === link.path;
                return (
                  <button
                    key={link.path}
                    type="button"
                    onClick={(e) => handleNavClick(e, link.path, link.href)}
                    className={`w-full flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl text-left transition-all ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm font-bold border border-slate-200 dark:border-slate-700'
                        : 'hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-900 dark:text-white active:bg-slate-200 dark:active:bg-slate-800'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl ${link.iconBg} flex items-center justify-center shrink-0 shadow-sm`}>
                      <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-[13.5px] font-bold truncate leading-tight text-slate-900 dark:text-white">{link.label}</span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate font-normal mt-0.5">{link.description}</span>
                    </div>
                    <span className="material-symbols-outlined text-[18px] text-slate-400 shrink-0">
                      chevron_right
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Actions : Vérification QR Code & Espace Connexion */}
            <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <button
                type="button"
                onClick={(e) => handleNavClick(e, 'verification-quittance', '#guichet-verification')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 active:scale-95 transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[17px] text-emerald-500">verified</span>
                Vérifier une Quittance (QR Code)
              </button>

              <Link
                href={accountUrl}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-[0_4px_16px_rgba(244,63,110,0.35)] active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-[17px]">
                  {user ? 'dashboard' : 'login'}
                </span>
                {accountLabel}
              </Link>

              {/* Raccourci Assistance Directe WhatsApp */}
              <a
                href="https://wa.me/2290195444430?text=Bonjour%20LOCAGESTION%2C%20j'ai%20besoin%20d'une%20assistance."
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                <span className="material-symbols-outlined text-[14px]">support_agent</span>
                Assistance WhatsApp : +229 01 95 44 44 30
              </a>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
