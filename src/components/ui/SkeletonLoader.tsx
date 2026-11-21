'use client';

import React from 'react';

export function Skeleton({
  className = '',
  style,
  dark = false,
}: {
  className?: string;
  style?: React.CSSProperties;
  dark?: boolean;
}) {
  return (
    <div
      className={`${dark ? 'skeleton-shimmer-dark' : 'skeleton-shimmer'} rounded-2xl ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton pour les 4 cartes KPI du Tableau de Bord (Bailleur & Admin)
 */
export function SkeletonKPIGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-in fade-in duration-200">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton className="w-24 h-4 rounded-lg" />
            <Skeleton className="w-10 h-10 rounded-2xl" />
          </div>
          <Skeleton className="w-32 h-8 rounded-xl" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="w-12 h-4 rounded-md" />
            <Skeleton className="w-20 h-3 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton pour le Tableau des derniers encaissements ou liste de transactions
 */
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="space-y-1.5">
          <Skeleton className="w-40 h-5 rounded-lg" />
          <Skeleton className="w-60 h-3 rounded-md" />
        </div>
        <Skeleton className="w-28 h-8 rounded-xl" />
      </div>

      <div className="space-y-3 pt-2">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-100"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-10 h-10 rounded-2xl shrink-0" />
              <div className="space-y-1.5">
                <Skeleton className="w-32 h-4 rounded-md" />
                <Skeleton className="w-48 h-3 rounded-md" />
              </div>
            </div>
            <div className="space-y-1 text-right">
              <Skeleton className="w-24 h-4 rounded-md ml-auto" />
              <Skeleton className="w-16 h-3 rounded-md ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton pour une Carte de Bail (Baux en attente, baux actifs)
 */
export function SkeletonLeaseCard() {
  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-9 h-9 rounded-2xl" />
          <div className="space-y-1">
            <Skeleton className="w-28 h-4 rounded-md" />
            <Skeleton className="w-36 h-3 rounded-md" />
          </div>
        </div>
        <Skeleton className="w-24 h-6 rounded-full" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2">
        {[1, 2, 3, 4].map((k) => (
          <div key={k} className="space-y-1">
            <Skeleton className="w-16 h-3 rounded-md" />
            <Skeleton className="w-24 h-5 rounded-lg" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
        <Skeleton className="w-32 h-4 rounded-md" />
        <div className="flex items-center gap-2">
          <Skeleton className="w-24 h-8 rounded-xl" />
          <Skeleton className="w-28 h-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton pour la grille des Annonces Immobilières
 */
export function SkeletonListingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-200">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs space-y-3 flex flex-col"
        >
          <Skeleton className="w-full h-48 rounded-b-none" />
          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="w-20 h-5 rounded-full" />
                <Skeleton className="w-28 h-5 rounded-lg" />
              </div>
              <Skeleton className="w-full h-5 rounded-lg" />
              <Skeleton className="w-40 h-3 rounded-md" />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <Skeleton className="w-24 h-4 rounded-md" />
              <Skeleton className="w-20 h-8 rounded-xl" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton complet pour le Tableau de Bord du Bailleur
 */
export function SkeletonLandlordDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <SkeletonKPIGrid />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonTable rows={4} />
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <Skeleton className="w-36 h-5 rounded-lg" />
            <Skeleton className="w-full h-44 rounded-2xl" />
            <div className="space-y-2 pt-2">
              <Skeleton className="w-full h-8 rounded-xl" />
              <Skeleton className="w-full h-8 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton complet pour l'Espace Résident (Portail Locataire)
 */
export function SkeletonPortalDashboard() {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Bannière de Bienvenue */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton dark className="w-12 h-12 rounded-2xl" />
          <div className="space-y-1.5 flex-1">
            <Skeleton dark className="w-48 h-5 rounded-lg" />
            <Skeleton dark className="w-64 h-3.5 rounded-md" />
          </div>
        </div>
      </div>

      {/* Carte du Bail en cours */}
      <SkeletonLeaseCard />

      {/* Historique des Quittances & Paiements */}
      <SkeletonTable rows={3} />
    </div>
  );
}

/**
 * Skeleton pour la liste des notifications dans la cloche
 */
export function SkeletonNotificationsList({ count = 3 }: { count?: number }) {
  return (
    <div className="p-3 space-y-2.5 animate-in fade-in duration-150">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3"
        >
          <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="w-36 h-3.5 rounded-md" />
            <Skeleton className="w-full h-3 rounded-md" />
            <Skeleton className="w-20 h-2.5 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton pour les formulaires étape par étape / Wizards (ex: Création de bail /leases/new)
 */
export function SkeletonStepperForm() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Stepper Header */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-xs flex items-center justify-between gap-2 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((s) => (
          <div key={s} className="flex items-center gap-2 shrink-0">
            <Skeleton className="w-9 h-9 rounded-full" />
            <Skeleton className="hidden sm:block w-20 h-4 rounded-md" />
          </div>
        ))}
      </div>

      {/* Main Form Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="space-y-2 pb-4 border-b border-slate-100">
          <Skeleton className="w-56 h-6 rounded-lg" />
          <Skeleton className="w-80 h-4 rounded-md" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="w-28 h-4 rounded-md" />
            <Skeleton className="w-full h-12 rounded-2xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="w-28 h-4 rounded-md" />
            <Skeleton className="w-full h-12 rounded-2xl" />
          </div>
        </div>

        <div className="space-y-2">
          <Skeleton className="w-32 h-4 rounded-md" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((k) => (
              <Skeleton key={k} className="h-20 rounded-2xl" />
            ))}
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between border-t border-slate-100">
          <Skeleton className="w-24 h-10 rounded-xl" />
          <Skeleton className="w-36 h-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton pour le guichet public de vérification (/verify/[code])
 */
export function SkeletonCertificate() {
  return (
    <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl space-y-6 animate-in fade-in duration-200">
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3.5">
        <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="w-36 h-3.5 rounded-md" />
          <Skeleton className="w-56 h-5 rounded-lg" />
          <Skeleton className="w-full h-3 rounded-md" />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex justify-between py-2 border-b border-slate-100">
            <Skeleton className="w-28 h-3.5 rounded-md" />
            <Skeleton className="w-36 h-3.5 rounded-md" />
          </div>
        ))}
      </div>

      <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
        <Skeleton className="w-32 h-3.5 rounded-md" />
        <Skeleton className="w-full h-3 rounded-md" />
      </div>
    </div>
  );
}

/**
 * Skeleton pour la Console Super-Admin (/admin)
 */
export function SkeletonAdminDashboard() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-8 animate-in fade-in duration-200">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="space-y-2">
          <Skeleton className="w-48 h-7 rounded-xl" />
          <Skeleton className="w-72 h-4 rounded-md" />
        </div>
        <Skeleton className="w-32 h-10 rounded-2xl" />
      </div>
      <SkeletonKPIGrid />
      <SkeletonTable rows={5} />
    </div>
  );
}
