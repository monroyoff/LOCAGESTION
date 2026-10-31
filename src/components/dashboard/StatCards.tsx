'use client';

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet,
  Wrench,
  Building,
  DollarSign,
  PiggyBank,
} from 'lucide-react';
import { DashboardKPIs } from '@/lib/types';
import { formatFCFA } from '@/lib/money/format';

interface StatCardsProps {
  kpis: DashboardKPIs;
}

export function StatCards({ kpis }: StatCardsProps) {
  const cards = [
    {
      id: 'collected',
      title: 'Loyers Encaissés',
      amount: kpis.collectedRent.amount,
      variation: kpis.collectedRent.variationPct,
      periodLabel: kpis.collectedRent.periodLabel,
      icon: ArrowDownLeft,
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-200/60',
      badgeBg: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
      accentColor: 'text-emerald-600',
      description: 'Encaissements validés (Mois en cours)',
    },
    {
      id: 'expenses',
      title: 'Dépenses & Travaux',
      amount: kpis.totalExpenses.amount,
      variation: kpis.totalExpenses.variationPct,
      periodLabel: kpis.totalExpenses.periodLabel,
      icon: Wrench,
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-200/60',
      badgeBg: 'bg-amber-500/10 text-amber-700 border-amber-200',
      accentColor: 'text-amber-600',
      description: 'Charges, réparations & conciergerie',
    },
    {
      id: 'average',
      title: 'Loyer Moyen / Lot',
      amount: kpis.averageRent.amount,
      variation: kpis.averageRent.variationPct,
      periodLabel: kpis.averageRent.periodLabel,
      icon: Building,
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-200/60',
      badgeBg: 'bg-blue-500/10 text-blue-700 border-blue-200',
      accentColor: 'text-blue-600',
      description: 'Calculé sur 28 lots loués',
    },
    {
      id: 'net_income',
      title: 'Résultat Net d’Exploitation',
      amount: kpis.netIncome.amount,
      variation: kpis.netIncome.variationPct,
      periodLabel: kpis.netIncome.periodLabel,
      icon: PiggyBank,
      iconBg: 'bg-brand-50 text-brand-600 border border-brand-200/60',
      badgeBg: 'bg-brand-500/10 text-brand-700 border-brand-200',
      accentColor: 'text-brand-600',
      description: 'Cashflow net avant impôt',
      featured: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const isPositive = card.variation >= 0;

        return (
          <div
            key={card.id}
            className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all relative overflow-hidden group hover:shadow-card-hover ${
              card.featured
                ? 'border-brand-500/30 shadow-card ring-1 ring-brand-500/10'
                : 'border-slate-200/80 shadow-soft'
            }`}
          >
            {/* Top decorative gradient glow for featured card */}
            {card.featured && (
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
            )}

            {/* Header: Title + Icon */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block truncate">
                  {card.title}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
                  {card.description}
                </span>
              </div>
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${card.iconBg}`}>
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>

            {/* Amount in FCFA */}
            <div className="mb-4">
              <div className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-tight">
                {formatFCFA(card.amount)}
              </div>
            </div>

            {/* Footer: Variation badge + comparison label */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
                  isPositive
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {isPositive ? '+' : ''}
                  {card.variation}%
                </span>
              </span>

              <span className="text-[11px] font-medium text-slate-400 truncate">
                {card.periodLabel}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

