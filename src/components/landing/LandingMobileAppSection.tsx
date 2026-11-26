'use client';

import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { GooglePlayBadge, GooglePlayIcon, PLAYSTORE_URL } from './GooglePlayBadge';

export function LandingMobileAppSection() {
  const [playStoreQr, setPlayStoreQr] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(PLAYSTORE_URL, {
      margin: 1,
      width: 220,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then((url) => setPlayStoreQr(url))
      .catch((err) => console.warn('QR Code generation failed:', err));
  }, []);

  return (
    <section
      id="application-mobile"
      className="w-full px-gutter md:px-margin-tablet lg:px-margin-desktop py-space-xl scroll-mt-24 relative overflow-hidden bg-gradient-to-b from-surface via-surface-container-low to-surface transition-colors duration-300"
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-80 h-80 rounded-full bg-primary-container/15 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-space-xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-label-sm text-xs font-bold uppercase tracking-wider mb-space-sm shadow-md">
            <GooglePlayIcon className="w-4 h-4 shrink-0" />
            <span>Application Mobile Officielle • Google Play Store</span>
          </div>

          <h2 className="font-headline-xl text-headline-xl-mobile sm:text-headline-xl text-on-surface font-extrabold tracking-tight mb-space-sm [text-wrap:balance]">
            LOCAGESTION dans votre poche.
            <span className="block mt-1 bg-gradient-to-r from-emerald-600 via-teal-500 to-primary-container bg-clip-text text-transparent">
              Disponible Dès Maintenant sur Google Play
            </span>
          </h2>

          <p className="font-body-lg text-body-md sm:text-body-lg text-on-surface-variant leading-relaxed">
            Téléchargez l'application Android certifiée pour piloter vos biens, émettre vos quittances à QR Code et sécuriser vos règlements Mobile Money en direct, où que vous soyez.
          </p>
        </div>

        {/* Content & Smartphone Showcase Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Mobile Features & Download CTA (7 cols) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Feature 1 */}
              <div className="p-5 rounded-3xl bg-surface-container-high/70 dark:bg-surface-container-low/80 border border-surface-container-highest/60 backdrop-blur-md shadow-sm hover:border-emerald-500/40 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
                  <span className="material-symbols-outlined text-[22px]">smartphone</span>
                </div>
                <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface mb-1">
                  100% Plein Écran &amp; TWA
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  Architecture certifiée par Google Play : pas de barre d’adresse, démarrage instantané en &lt; 1s et navigation ultra-rapide.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-5 rounded-3xl bg-surface-container-high/70 dark:bg-surface-container-low/80 border border-surface-container-highest/60 backdrop-blur-md shadow-sm hover:border-emerald-500/40 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-primary/15 text-primary flex items-center justify-center mb-3 shadow-inner">
                  <span className="material-symbols-outlined text-[22px]">notifications_active</span>
                </div>
                <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface mb-1">
                  Alertes Échéances le 5
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  Rappels automatiques par notification push avant l'échéance et notification instantanée dès confirmation d'un paiement.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-5 rounded-3xl bg-surface-container-high/70 dark:bg-surface-container-low/80 border border-surface-container-highest/60 backdrop-blur-md shadow-sm hover:border-emerald-500/40 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-secondary/15 text-secondary flex items-center justify-center mb-3 shadow-inner">
                  <span className="material-symbols-outlined text-[22px]">qr_code_2</span>
                </div>
                <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface mb-1">
                  Quittances PDF Scellées
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  Téléchargement en 1 clic de quittances vectorielles officielles avec QR code scellé, vérifiables par les banques et ambassades.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="p-5 rounded-3xl bg-surface-container-high/70 dark:bg-surface-container-low/80 border border-surface-container-highest/60 backdrop-blur-md shadow-sm hover:border-emerald-500/40 transition-all">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center mb-3 shadow-inner">
                  <span className="material-symbols-outlined text-[22px]">credit_card</span>
                </div>
                <h3 className="font-headline-sm text-sm sm:text-base font-bold text-on-surface mb-1">
                  Mobile Money Direct
                </h3>
                <p className="font-body-sm text-xs text-on-surface-variant leading-relaxed">
                  Paiement direct Wave, MTN Mobile Money, Moov, Orange Money et Celtiis avec empreinte cryptographique inviolable.
                </p>
              </div>
            </div>

            {/* Download Cluster & Store Badges */}
            <div className="p-6 rounded-3xl bg-slate-900 dark:bg-[#0c1017] text-white border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="flex flex-col text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-1 text-amber-400 mb-1">
                  <span className="text-sm font-black">★★★★★</span>
                  <span className="text-xs font-bold text-slate-300 ml-1">4.9 / 5 sur Google Play</span>
                </div>
                <span className="text-base font-extrabold text-white">
                  Installez l'application Android
                </span>
                <span className="text-xs text-slate-400 mt-0.5">
                  Application officielle certifiée • Format léger (&lt; 5 Mo)
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <GooglePlayBadge size="lg" />
              </div>
            </div>
          </div>

          {/* Right Column: Visual Smartphone Mockup with Real Play Store QR Code (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center relative">
            {/* Phone Exterior Frame */}
            <div className="relative w-full max-w-[320px] rounded-[44px] bg-slate-950 p-3.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] border-4 border-slate-800/80 ring-1 ring-white/10">
              {/* Dynamic Island / Speaker */}
              <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-900 rounded-full flex items-center justify-center gap-2 z-20">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
                <div className="w-1.5 h-1.5 rounded-full bg-slate-700" />
              </div>

              {/* Smartphone Screen Container */}
              <div className="w-full rounded-[34px] overflow-hidden bg-[#0c1017] text-white pt-8 pb-5 px-4 flex flex-col items-center text-center border border-slate-800/60 shadow-inner">
                {/* Header in phone */}
                <div className="flex items-center justify-between w-full pb-3 border-b border-slate-800/80 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg overflow-hidden bg-primary-container p-0.5 shadow-sm">
                      <img src="/icon-192.png" alt="Logo" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-xs font-black tracking-tight text-white">
                      LOCA<span className="text-primary-container">GESTION</span>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                    ● En Ligne
                  </span>
                </div>

                {/* Quittance Demo Card inside phone */}
                <div className="w-full p-3 rounded-2xl bg-slate-900/90 border border-slate-800 text-left mb-3 shadow-md">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span>Quittance Officielle</span>
                    <span className="font-mono text-emerald-400 font-bold">RÈGLEMENT SOLDÉ</span>
                  </div>
                  <div className="text-sm font-extrabold text-white mb-0.5">
                    Loyer d'Habitation
                  </div>
                  <div className="text-[11px] text-slate-300">
                    Bénin • UEMOA • Réf: <span className="font-mono text-slate-400">LOCA-QUITT-BJ</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      100% Certifiée OHADA
                    </span>
                    <span className="text-[10px] text-white bg-brand-500 px-2 py-0.5 rounded-md font-bold">
                      PDF A4
                    </span>
                  </div>
                </div>

                {/* Scannable Play Store QR Code */}
                <div className="p-3 bg-white rounded-2xl shadow-xl border border-slate-200 flex flex-col items-center mb-3">
                  {playStoreQr ? (
                    <img
                      src={playStoreQr}
                      alt="Scannez pour télécharger sur Google Play"
                      className="w-36 h-36 object-contain"
                    />
                  ) : (
                    <div className="w-36 h-36 flex items-center justify-center bg-slate-100 text-slate-400 text-xs font-semibold">
                      Chargement QR...
                    </div>
                  )}
                  <span className="text-[9.5px] font-bold text-slate-700 tracking-tight mt-1 flex items-center gap-1">
                    <GooglePlayIcon className="w-3.5 h-3.5" />
                    <span>Scannez pour installer sur Android</span>
                  </span>
                </div>

                {/* Quick Link underneath phone */}
                <a
                  href={PLAYSTORE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <GooglePlayIcon className="w-4 h-4" />
                  <span>Ouvrir sur Google Play</span>
                </a>
              </div>
            </div>

            {/* Security badge below phone */}
            <div className="mt-4 flex items-center gap-2 text-xs text-on-surface-variant font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Package certifié : <code className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">com.locagestion.app</code></span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
