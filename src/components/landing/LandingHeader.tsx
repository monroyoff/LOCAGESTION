'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSpace } from '@/lib/context/space-context';

interface LandingHeaderProps {
  activePath?: string;
}

export function LandingHeader({ activePath = 'accueil' }: LandingHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, isTenant, isDemarcheur } = useSpace();

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
          ? 'bg-surface/95 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.45)] border-b border-surface-container-high/60'
          : 'bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]'
      }`}
    >
      <div className="h-16 sm:h-20 w-full px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Brand Logo with micro-hover bounce & luminous halo */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-2.5 group focus:outline-none"
            data-path="accueil"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-surface-container-high flex items-center justify-center text-primary group-hover:scale-110 group-hover:shadow-[0_0_15px_rgba(255,178,183,0.5)] transition-all duration-300 shrink-0">
              <span className="material-symbols-outlined text-[20px] sm:text-[24px]">real_estate_agent</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-base sm:text-headline-sm tracking-tight text-on-surface font-extrabold whitespace-nowrap">
                LOCA<span className="text-primary-container">GESTION</span>
              </span>
              <span className="text-[9px] sm:text-label-sm text-secondary tracking-wider uppercase font-semibold">
                PropTech OHADA
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

        {/* Action Controls & Account Button */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
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
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-primary-container text-on-primary-container font-bold text-xs sm:text-[13px] shadow-[0_4px_16px_rgba(255,81,106,0.3)] hover:brightness-110 active:scale-95 transition-all whitespace-nowrap group shrink-0"
            data-path="authentification"
          >
            <span className="hidden sm:inline">{accountLabel}</span>
            <span className="sm:hidden tracking-tight">{accountMobileLabel}</span>
            <div className="w-5 h-5 rounded-full bg-on-primary-container/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-on-primary-container text-[13px]">person</span>
            </div>
          </Link>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 sm:p-2 rounded-full bg-surface-container-high text-on-surface hover:bg-surface-variant focus:outline-none transition-colors shrink-0"
            aria-label="Menu Mobile"
          >
            <span className="material-symbols-outlined text-[20px] sm:text-[24px]">
              {mobileMenuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu with Smooth Backdrop */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-surface-container-high/80 bg-surface/98 backdrop-blur-2xl px-4 py-5 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.path}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-container-low text-on-surface font-semibold text-sm hover:bg-surface-container-high transition-colors"
                data-path={link.path}
              >
                <span>{link.label}</span>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                  chevron_right
                </span>
              </a>
            ))}

            <div className="pt-3 flex flex-col gap-2.5">
              <a
                href="#guichet-verification"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-surface-container text-tertiary font-bold text-sm border border-tertiary/25 hover:border-tertiary/50"
                data-path="verification-quittance"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Vérifier une Quittance
              </a>
              <Link
                href={accountUrl}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-primary-container text-on-primary-container font-bold text-sm shadow-md"
                data-path="authentification"
              >
                <span className="material-symbols-outlined text-[18px]">
                  {user ? 'dashboard' : 'login'}
                </span>
                {accountLabel}
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
