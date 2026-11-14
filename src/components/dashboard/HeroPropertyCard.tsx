'use client';

import React from 'react';
import {
  MapPin,
  Building2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Property } from '@/lib/types';
import { formatFCFA } from '@/lib/money/format';

interface HeroPropertyCardProps {
  property?: Property | null;
  onViewDetails?: () => void;
}

export function HeroPropertyCard({ property, onViewDetails }: HeroPropertyCardProps) {
  if (!property) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft p-8 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Building2 className="w-7 h-7" />
        </div>
        <h3 className="font-extrabold text-base text-slate-800">
          Aucun bien immobilier enregistré
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Ajoutez votre première résidence, villa ou immeuble pour visualiser ici son taux de remplissage et ses performances locatives.
        </p>
        <button
          type="button"
          onClick={onViewDetails}
          className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black shadow-pink-glow transition-all cursor-pointer"
        >
          <span>Gérer le patrimoine</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const occupancyPercentage = property.totalUnits > 0
    ? Math.round((property.occupiedUnits / property.totalUnits) * 100)
    : 0;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden flex flex-col lg:flex-row relative group">
      {/* Left: Image with Overlays */}
      <div className="lg:w-1/2 relative min-h-[240px] sm:min-h-[280px] overflow-hidden">
        <img
          src={property.imageUrl}
          alt={property.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Gradient overlays for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* Top Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500 text-white text-[11px] font-black shadow-md shadow-brand-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            Bien Phare du Mois
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-bold border border-white/10">
            {property.totalUnits} Lots R+3
          </span>
        </div>

        {/* Bottom Image Info */}
        <div className="absolute bottom-4 left-4 right-4 text-white">
          <div className="flex items-center gap-1.5 text-xs text-slate-200 mb-1">
            <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
            <span>
              {property.address}, {property.city} ({property.country})
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
            {property.name}
          </h3>
        </div>
      </div>

      {/* Right: Performance & Stats */}
      <div className="lg:w-1/2 p-6 sm:p-7 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Rendement & Occupation
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              100% Loué
            </span>
          </div>

          {/* Revenue */}
          <div className="mb-6">
            <span className="text-xs text-slate-500 block mb-1">
              Revenu locatif mensuel généré :
            </span>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatFCFA(property.monthlyRevenue)}
            </div>
          </div>

          {/* Mini progress breakdown */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600">Taux de remplissage :</span>
              <span className="text-brand-600">
                {property.occupiedUnits} / {property.totalUnits} lots occupés ({occupancyPercentage}%)
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-tealAccent-500"
                style={{ width: `${occupancyPercentage}%` }}
              />
            </div>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">Loyer min / max</span>
              <span className="text-xs font-bold text-slate-800">180k – 450k FCFA</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-400 block font-medium">Retards constatés</span>
              <span className="text-xs font-bold text-emerald-600">0 impayé</span>
            </div>
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onViewDetails}
          className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm group-hover:bg-brand-500 group-hover:shadow-pink-glow"
        >
          <span>Gérer les 12 lots de la résidence</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
}

