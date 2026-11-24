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

  const navLinks = [
    { label: 'Accueil', path: 'accueil', href: '#accueil' },
    { label: 'Espaces', path: 'espaces-gestion', href: '#espaces-gestion' },
    { label: 'Annonces & Recherche', path: 'annonces-et-recherche', href: '#annonces-et-recherche' },
    { label: 'Vérification Quittance', path: 'verification-quittance', href: '#guichet-verification' },
    { label: 'Tarifs', path: 'tarifs', href: '#tarifs' },
    { label: 'Sécurité & OHADA', path: 'securite-et-lois-ohada', href: '#securite-et-lois-ohada' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-surface/95 backdrop-blur-2xl shadow-[0_4px_24px_rgba(0,0,0,0.45)] border-b border-surface-container-high/60'
          : 'bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]'
      }`}
    >
      <div className="h-16 sm:h-20 w-full px-3 sm:px-gutter md:px-margin-tablet lg:px-margin-desktop flex items-center justify-between gap-2 sm:gap-space-md max-w-7xl mx-auto">
        {/* Brand Logo with micro-hover bounce & luminous halo */}
        <div className="flex items-center gap-space-sm sm:gap-space-md shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-space-sm group focus:outline-none"
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

        {/* Desktop Navigation Pill */}
        <nav
          className="hidden xl:flex items-center gap-space-xs p-1 rounded-full bg-surface-container-low border border-surface-container-high/40 shadow-inner"
          data-active-classes="bg-surface-container-high text-on-surface font-label-lg rounded-full"
        >
          {navLinks.map((link) => {
            const isActive = activePath === link.path;
            return (
              <a
                key={link.path}
                href={link.href}
                className={`px-space-md py-space-sm rounded-full font-label-lg text-label-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-surface-container-high text-on-surface shadow-sm font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/60'
                }`}
                data-path={link.path}
              >
                {link.label}
              </a>
            );
          })}
        </nav>

        {/* Action Controls & Account Button */}
        <div className="flex items-center gap-1.5 sm:gap-space-sm shrink-0">
          {/* Quick Verify Quittance Button (Desktop/Tablet) */}
          <a
            href="#guichet-verification"
            className="hidden sm:inline-flex items-center gap-space-xs px-3.5 py-2 sm:px-space-md sm:py-space-sm rounded-full bg-surface-container font-label-lg text-xs sm:text-label-lg text-tertiary hover:bg-surface-container-high hover:text-on-surface border border-tertiary/20 hover:border-tertiary/40 transition-all shadow-sm active:scale-95 whitespace-nowrap"
            data-path="verification-quittance"
          >
            <span className="material-symbols-outlined text-[16px] sm:text-[18px]">verified</span>
            Vérifier Quittance
          </a>

          {/* Account Login / Dashboard Button (Mobile-First Compact) */}
          <Link
            href={accountUrl}
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-space-lg sm:py-space-sm rounded-full bg-primary-container text-on-primary-container font-semibold text-xs sm:text-label-lg shadow-[0_4px_16px_rgba(255,81,106,0.35)] hover:brightness-110 active:scale-95 transition-all whitespace-nowrap group shrink-0"
            data-path="authentification"
          >
            <span className="hidden sm:inline">{accountLabel}</span>
            <span className="sm:hidden font-bold tracking-tight">{accountMobileLabel}</span>
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-on-primary-container/20 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-on-primary-container text-[13px] sm:text-[15px]">person</span>
            </div>
          </Link>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-1.5 sm:p-2 rounded-full bg-surface-container-high text-on-surface hover:bg-surface-variant focus:outline-none transition-colors shrink-0"
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
        <div className="xl:hidden border-t border-surface-container-high/80 bg-surface/98 backdrop-blur-2xl px-gutter py-space-lg shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col gap-space-sm">
            {navLinks.map((link) => (
              <a
                key={link.path}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between px-space-md py-3 rounded-xl bg-surface-container-low text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors"
              >
                <span>{link.label}</span>
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                  chevron_right
                </span>
              </a>
            ))}

            <div className="pt-space-sm flex flex-col gap-2">
              <a
                href="#guichet-verification"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-surface-container text-tertiary font-label-lg text-label-lg border border-tertiary/20"
              >
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Vérifier une Quittance
              </a>
              <Link
                href={accountUrl}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-primary-container text-on-primary font-label-lg text-label-lg shadow-md"
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
