'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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
  onCardClick?: (cardId: string) => void;
}

export function StatCards({ kpis, onCardClick }: StatCardsProps) {
  const router = useRouter();

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
      hoverRing: 'hover:border-emerald-400/80 hover:ring-2 hover:ring-emerald-500/15',
      description: 'Encaissements validés (Mois en cours)',
      href: '/payments?status=paye',
      actionLabel: 'Voir les loyers soldés',
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
      hoverRing: 'hover:border-amber-400/80 hover:ring-2 hover:ring-amber-500/15',
      description: 'Charges, réparations & conciergerie',
      href: '/incidents',
      actionLabel: 'Gérer les interventions',
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
      hoverRing: 'hover:border-blue-400/80 hover:ring-2 hover:ring-blue-500/15',
      description:
        kpis.occupancyRate.occupiedUnits > 0
          ? `Calculé sur ${kpis.occupancyRate.occupiedUnits} lot${
              kpis.occupancyRate.occupiedUnits > 1 ? 's' : ''
            } loué${kpis.occupancyRate.occupiedUnits > 1 ? 's' : ''}`
          : 'Calculé sur les lots loués',
      href: '/properties',
      actionLabel: 'Voir le parc & lots',
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
      hoverRing: 'hover:border-brand-500/80 hover:ring-2 hover:ring-brand-500/20',
      description: 'Cashflow net avant impôt',
      featured: true,
      href: '/payments',
      actionLabel: 'Suivi trésorerie',
    },
  ];

  const handleCardClick = (card: (typeof cards)[0]) => {
    if (onCardClick) {
      onCardClick(card.id);
    } else {
      router.push(card.href);
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      {cards.map((card) => {
        const Icon = card.icon;
        const isPositive = card.variation >= 0;

        return (
          <div
            key={card.id}
            role="button"
            tabIndex={0}
            onClick={() => handleCardClick(card)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(card);
              }
            }}
            className={`bg-white rounded-3xl p-5 sm:p-6 border transition-all duration-200 relative overflow-hidden group hover:shadow-xl hover:-translate-y-1 cursor-pointer select-none active:scale-[0.98] touch-manipulation ${
              card.featured
                ? `border-brand-500/30 shadow-card ring-1 ring-brand-500/10 ${card.hoverRing}`
                : `border-slate-200/80 shadow-soft ${card.hoverRing}`
            }`}
            title={`Cliquer pour accéder aux opérations : ${card.title} (${card.actionLabel})`}
          >
            {/* Top decorative gradient glow for featured card */}
            {card.featured && (
              <div className="absolute -top-16 -right-16 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
            )}

            {/* Header: Title + Icon + Action hint */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block truncate group-hover:text-slate-800 transition-colors">
                  {card.title}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5 block truncate">
                  {card.description}
                </span>
              </div>
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${card.iconBg} group-hover:scale-105 transition-transform shadow-xs`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
            </div>

            {/* Amount in FCFA */}
            <div className="mb-4">
              <div className="text-2xl sm:text-[26px] font-black text-slate-900 tracking-tight leading-tight group-hover:text-brand-600 transition-colors">
                {formatFCFA(card.amount)}
              </div>
            </div>

            {/* Footer: Variation badge + Action link */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border shrink-0 ${
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

                <span className="text-[11px] font-medium text-slate-400 truncate hidden xl:inline">
                  {card.periodLabel}
                </span>
              </div>

              {/* Renvoyer directement aux opérations concernées */}
              <div className="flex items-center gap-1 text-[11px] font-bold text-slate-400 group-hover:text-slate-900 transition-colors shrink-0">
                <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-900">
                  {card.actionLabel}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

