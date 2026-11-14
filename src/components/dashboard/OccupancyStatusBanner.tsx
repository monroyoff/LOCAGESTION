'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  Wrench,
  ChevronRight,
  Building,
} from 'lucide-react';
import { DashboardKPIs } from '@/lib/types';

interface OccupancyStatusBannerProps {
  occupancy: DashboardKPIs['occupancyRate'];
  onFilterStatus?: (status: string) => void;
}

export function OccupancyStatusBanner({
  occupancy,
  onFilterStatus,
}: OccupancyStatusBannerProps) {
  const total = occupancy.totalUnits || 0;
  const items = [
    {
      id: 'occupe',
      label: 'Lots Occupés',
      count: occupancy.occupiedUnits,
      pct: total > 0 ? Math.round((occupancy.occupiedUnits / total) * 100) : 0,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      icon: CheckCircle2,
    },
    {
      id: 'vacant',
      label: 'Lots Vacants',
      count: occupancy.vacantUnits,
      pct: total > 0 ? Math.round((occupancy.vacantUnits / total) * 100) : 0,
      color: 'bg-amber-500',
      textColor: 'text-amber-700',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: AlertCircle,
    },
    {
      id: 'reserve',
      label: 'Réservés / Baux signés',
      count: occupancy.reservedUnits,
      pct: total > 0 ? Math.round((occupancy.reservedUnits / total) * 100) : 0,
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      icon: Clock,
    },
    {
      id: 'travaux',
      label: 'En Rénovation / Travaux',
      count: occupancy.inMaintenanceUnits,
      pct: total > 0 ? Math.round((occupancy.inMaintenanceUnits / total) * 100) : 0,
      color: 'bg-slate-400',
      textColor: 'text-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      icon: Wrench,
    },
  ];

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-soft">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Building className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Statut du Parc Immobilier ({occupancy.totalUnits} Lots au Total)
            </h4>
            <p className="text-xs text-slate-500">
              Taux global d’occupation :{' '}
              <strong className="text-emerald-600 font-extrabold">
                {occupancy.percentage}%
              </strong>{' '}
              sur l’ensemble du parc
            </p>
          </div>
        </div>

        {/* Global Segmented Progress Bar */}
        <div className="sm:w-64">
          <div className="w-full h-3 rounded-full bg-slate-100 overflow-hidden flex">
            <div
              style={{ width: `${total > 0 ? (occupancy.occupiedUnits / total) * 100 : 0}%` }}
              className="bg-emerald-500 h-full"
              title="Occupés"
            />
            <div
              style={{ width: `${total > 0 ? (occupancy.vacantUnits / total) * 100 : 0}%` }}
              className="bg-amber-500 h-full"
              title="Vacants"
            />
            <div
              style={{ width: `${total > 0 ? (occupancy.reservedUnits / total) * 100 : 0}%` }}
              className="bg-blue-500 h-full"
              title="Réservés"
            />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold mt-1">
            <span>0</span>
            <span>{occupancy.totalUnits} lots</span>
          </div>
        </div>
      </div>

      {/* 4 Interactive Segment Pills */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onFilterStatus?.(item.id)}
              className={`p-3.5 rounded-2xl border transition-all text-left flex items-center justify-between group cursor-pointer hover:shadow-sm ${item.bgColor} ${item.borderColor}`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl ${item.color} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block leading-tight">
                    {item.label}
                  </span>
                  <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className="text-lg font-black text-slate-900">
                      {item.count}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      ({item.pct}%)
                    </span>
                  </div>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

