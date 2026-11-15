'use client';

import React, { useState } from 'react';
import {
  PieChart,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUpRight,
  Info,
} from 'lucide-react';
import { DashboardKPIs } from '@/lib/types';
import { formatFCFA } from '@/lib/money/format';
import { MOCK_MONTHLY_COLLECTIONS } from '@/lib/data/mock-data';

interface RentCollectionBreakdownProps {
  breakdown: DashboardKPIs['rentBreakdown'];
}

export function RentCollectionBreakdown({ breakdown }: RentCollectionBreakdownProps) {
  const collections = MOCK_MONTHLY_COLLECTIONS.length > 0 ? MOCK_MONTHLY_COLLECTIONS : [
    { month: 'Mai', amount: 0, expenses: 0 },
    { month: 'Juin', amount: 0, expenses: 0 },
    { month: 'Juil', amount: 0, expenses: 0 },
    { month: 'Août', amount: 0, expenses: 0 },
    { month: 'Sept', amount: 0, expenses: 0 },
    { month: 'Oct', amount: 0, expenses: 0, current: true },
  ];
  const [activeBar, setActiveBar] = useState<number>(collections.length - 1);

  const maxAmount = Math.max(...collections.map((m) => m.amount), 1);
  const selectedMonth = collections[activeBar] || collections[collections.length - 1];
  const totalBaux = breakdown.paidCount + breakdown.partialCount + breakdown.overdueCount;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Donut / Segment: Loyers du Mois (Payés / Partiels / Impayés) - 5 cols */}
      <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Loyers d’Octobre 2026</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {totalBaux > 0 ? `Sur ${totalBaux} baux actifs en cours` : 'Aucun bail actif pour le moment'}
              </p>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
              Total : {formatFCFA(breakdown.paidAmount + breakdown.partialAmount + breakdown.overdueAmount)}
            </span>
          </div>

          {/* Visual Donut / Progress Gauge */}
          <div className="relative py-4 flex items-center justify-center">
            {/* SVG Donut Ring */}
            <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
              {/* Background track */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#f1f5f9"
                strokeWidth="12"
                fill="transparent"
              />
              {/* Overdue segment (Rose) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#f43f5e"
                strokeWidth="12"
                strokeDasharray={`${breakdown.overduePct * 2.51} 251`}
                strokeDashoffset="0"
                fill="transparent"
                strokeLinecap="round"
                className="transition-all duration-700"
              />
              {/* Partial segment (Amber) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#f59e0b"
                strokeWidth="12"
                strokeDasharray={`${breakdown.partialPct * 2.51} 251`}
                strokeDashoffset={`${-breakdown.overduePct * 2.51}`}
                fill="transparent"
                strokeLinecap="round"
                className="transition-all duration-700"
              />
              {/* Paid segment (Emerald) */}
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="#10b981"
                strokeWidth="12"
                strokeDasharray={`${breakdown.paidPct * 2.51} 251`}
                strokeDashoffset={`${-(breakdown.overduePct + breakdown.partialPct) * 2.51}`}
                fill="transparent"
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>

            {/* Inner Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-black text-slate-900 tracking-tight">
                {breakdown.paidPct}%
              </span>
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                Recouvré
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5">
                {breakdown.paidCount} / {breakdown.paidCount + breakdown.partialCount + breakdown.overdueCount} locataires
              </span>
            </div>
          </div>

          {/* Breakdown Rows */}
          <div className="space-y-2.5 mt-2">
            {/* Payés */}
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Loyers Soldés ({breakdown.paidCount})
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    Quittances émises
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-slate-900 block">
                  {formatFCFA(breakdown.paidAmount)}
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {breakdown.paidPct}%
                </span>
              </div>
            </div>

            {/* Partiels */}
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Paiements Partiels ({breakdown.partialCount})
                  </span>
                  <span className="text-[10px] text-amber-700 font-semibold">
                    Acomptes reçus
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-slate-900 block">
                  {formatFCFA(breakdown.partialAmount)}
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  {breakdown.partialPct}%
                </span>
              </div>
            </div>

            {/* En Retard */}
            <div className="p-3 rounded-2xl bg-rose-50/70 border border-rose-200/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Impayés / En Retard ({breakdown.overdueCount})
                  </span>
                  <span className="text-[10px] text-rose-700 font-semibold">
                    Relances prêtes
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-rose-600 block">
                  {formatFCFA(breakdown.overdueAmount)}
                </span>
                <span className="text-[10px] font-bold text-rose-600">
                  {breakdown.overduePct}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart: Encaissements Mensuels (Mois en surbrillance) - 7 cols */}
      <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>Encaissements Mensuels</span>
                <span className="text-xs font-normal text-slate-400">(6 Derniers Mois)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Progression du chiffre d’affaires locatif brut
              </p>
            </div>

            {/* Metric pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-brand-50 border border-brand-200 text-brand-600 text-xs font-extrabold self-start sm:self-auto">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+18.3% sur le semestre</span>
            </div>
          </div>

          {/* Interactive Bar Chart Representation */}
          <div className="h-56 flex items-end justify-between gap-3 sm:gap-6 pt-6 pb-2 px-2 border-b border-slate-100">
            {collections.map((item, idx) => {
              const heightPct = Math.round((item.amount / maxAmount) * 100);
              const isSelected = activeBar === idx;

              return (
                <div
                  key={item.month}
                  onClick={() => setActiveBar(idx)}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
                >
                  {/* Tooltip on hover or selected */}
                  <div
                    className={`text-[10px] font-extrabold py-1 px-2 rounded-lg mb-2 transition-all ${
                      isSelected
                        ? 'bg-slate-900 text-white opacity-100 shadow-md scale-105'
                        : 'bg-slate-100 text-slate-600 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {Math.round(item.amount / 1000)}k
                  </div>

                  {/* Vertical Bar */}
                  <div className="w-full max-w-[42px] bg-slate-100 rounded-2xl p-1 flex flex-col justify-end h-44 overflow-hidden relative">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-xl transition-all duration-500 ${
                        item.current
                          ? 'bg-gradient-to-t from-brand-600 to-brand-400 shadow-pink-glow'
                          : isSelected
                          ? 'bg-slate-800'
                          : 'bg-slate-300 group-hover:bg-slate-400'
                      }`}
                    />
                  </div>

                  {/* Month Label */}
                  <span
                    className={`text-xs mt-3 font-bold transition-colors ${
                      item.current
                        ? 'text-brand-600 font-black'
                        : isSelected
                        ? 'text-slate-900'
                        : 'text-slate-400 group-hover:text-slate-700'
                    }`}
                  >
                    {item.month}
                    {item.current && ' •'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Selected month details banner */}
          <div className="mt-5 p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                Détail du mois sélectionné : {selectedMonth.month}
              </span>
              <div className="text-lg font-black text-slate-900 mt-0.5">
                {formatFCFA(selectedMonth.amount)} encaissés
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
              <div>
                <span className="text-[10px] text-slate-400 block font-normal">Dépenses associées</span>
                <span className="text-amber-600 font-bold">
                  {formatFCFA(selectedMonth.expenses)}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-normal">Marge d’exploitation</span>
                <span className="text-emerald-600 font-bold">
                  {formatFCFA(selectedMonth.amount - selectedMonth.expenses)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

