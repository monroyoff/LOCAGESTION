'use client';

import React from 'react';
import {
  Menu,
  Search,
  Plus,
  Calendar,
  Sparkles,
  Receipt,
  Smartphone,
  Wrench,
  ShieldCheck,
} from 'lucide-react';
import { formatDateFR } from '@/lib/money/format';
import { useSpace } from '@/lib/context/space-context';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenQuickAction?: (action: 'new_lease' | 'new_payment' | 'new_property') => void;
  onOpenTenantAction?: (action: 'declare_payment' | 'report_issue') => void;
}

export function Header({
  onToggleSidebar,
  onOpenQuickAction,
  onOpenTenantAction,
}: HeaderProps) {
  const todayFormatted = formatDateFR(new Date());
  const { isLandlord, isTenant } = useSpace();

  return (
    <header className="sticky top-0 z-30 bg-[#F4F6F9]/90 backdrop-blur-md px-4 sm:px-8 py-4 border-b border-slate-200/80 flex items-center justify-between gap-4">
      {/* Left: Mobile Menu & Space Badge / Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isLandlord ? 'Tableau de bord' : 'Mon Espace Locataire'}
            </h1>
            <span
              className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                isLandlord
                  ? 'bg-brand-50 text-brand-600 border-brand-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              {isLandlord ? <Sparkles className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
              {isLandlord ? 'Espace Bailleur • UEMOA' : 'Locataire Titulaire'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Aujourd’hui : {todayFormatted}</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-semibold">Zone FCFA</span>
          </div>
        </div>
      </div>

      {/* Middle: Search Bar (Desktop) */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={
              isLandlord
                ? 'Rechercher un locataire, bien, lot, quittance... (⌘K)'
                : 'Rechercher une quittance, document, bail... (⌘K)'
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200/90 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-sm transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 rounded-md">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right: Space-Specific Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Currency Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200 text-slate-700 text-xs font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>FCFA (XOF)</span>
        </div>

        {/* ============================================================== */}
        {/* ACTIONS STRICTEMENT RÉSERVÉES AU BAILLEUR                      */}
        {/* ============================================================== */}
        {isLandlord && (
          <>
            <button
              onClick={() => onOpenQuickAction?.('new_payment')}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>Encaisser loyer</span>
            </button>

            <button
              onClick={() => onOpenQuickAction?.('new_lease')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs font-extrabold shadow-pink-glow active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nouveau bail</span>
            </button>
          </>
        )}

        {/* ============================================================== */}
        {/* ACTIONS STRICTEMENT RÉSERVÉES AU LOCATAIRE                     */}
        {/* ============================================================== */}
        {isTenant && (
          <>
            <button
              onClick={() => onOpenTenantAction?.('declare_payment')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
            >
              <Smartphone className="w-4 h-4" />
              <span>Déclarer un loyer</span>
            </button>

            <button
              onClick={() => onOpenTenantAction?.('report_issue')}
              className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <Wrench className="w-4 h-4 text-brand-400" />
              <span>Signaler une panne</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
