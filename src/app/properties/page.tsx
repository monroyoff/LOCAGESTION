'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Home,
  ChevronRight,
  TrendingUp,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MOCK_PROPERTIES } from '@/lib/data/mock-data';
import { formatFCFA } from '@/lib/money/format';
import { Property, UserSpace } from '@/lib/types';
import { QuickActionModal } from '@/components/dashboard/QuickActionModal';

export default function PropertiesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState<UserSpace>('bailleur');
  const [selectedProperty, setSelectedProperty] = useState<Property>(MOCK_PROPERTIES[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickAction, setQuickAction] = useState<'new_lease' | 'new_payment' | 'new_property' | null>(null);

  const filteredProperties = MOCK_PROPERTIES.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSpace={activeSpace}
        onSpaceChange={setActiveSpace}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenQuickAction={(action) => setQuickAction(action)}
        />

        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Patrimoine Immobilier & Lots
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-brand-50 text-brand-600 border border-brand-200">
                  {MOCK_PROPERTIES.length} Résidences
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Gestion des immeubles, villas, appartements et états d'occupation par lot.
              </p>
            </div>

            <button
              onClick={() => setQuickAction('new_property')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-extrabold shadow-pink-glow active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Ajouter un bien</span>
            </button>
          </div>

          {/* Properties Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredProperties.map((prop) => {
              const occupancy = Math.round((prop.occupiedUnits / prop.totalUnits) * 100);
              const isSelected = selectedProperty.id === prop.id;

              return (
                <div
                  key={prop.id}
                  onClick={() => setSelectedProperty(prop)}
                  className={`bg-white rounded-3xl border overflow-hidden transition-all cursor-pointer group hover:shadow-card-hover ${
                    isSelected
                      ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                      : 'border-slate-200/80 shadow-soft'
                  }`}
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={prop.imageUrl}
                      alt={prop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                        {prop.totalUnits} Lots
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-black text-sm truncate">{prop.name}</h3>
                      <p className="text-[11px] text-slate-200 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-brand-400 shrink-0" />
                        <span className="truncate">{prop.district}, {prop.city}</span>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Occupation</span>
                      <span className="font-extrabold text-slate-800">
                        {prop.occupiedUnits} / {prop.totalUnits} ({occupancy}%)
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        style={{ width: `${occupancy}%` }}
                        className="h-full rounded-full bg-emerald-500"
                      />
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">Revenu mensuel</span>
                      <span className="text-xs font-black text-slate-900">
                        {formatFCFA(prop.monthlyRevenue)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Property Detail Card & Lots Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block mb-1">
                  Détail de la Résidence Sélectionnée
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  {selectedProperty.name} ({selectedProperty.city})
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedProperty.address} • Total de {selectedProperty.totalUnits} lots
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-right">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold block">
                    Revenu Mensuel
                  </span>
                  <span className="text-base font-black text-emerald-700">
                    {formatFCFA(selectedProperty.monthlyRevenue)}
                  </span>
                </div>
              </div>
            </div>

            {/* Lots Grid List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Lots & Unités Disponibles
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { unit: 'Appt A1', type: '3 Pièces • 75 m²', rent: 220000, tenant: 'Koffi Mensah', status: 'occupe' },
                  { unit: 'Appt A2', type: '2 Pièces • 55 m²', rent: 180000, tenant: 'Amina Diop', status: 'occupe' },
                  { unit: 'Appt A3', type: '3 Pièces • 75 m²', rent: 220000, tenant: 'Koffi Mensah', status: 'occupe' },
                  { unit: 'Appt B1', type: '2 Pièces • 55 m²', rent: 180000, tenant: 'Fatoumata Traoré', status: 'occupe' },
                  { unit: 'Appt B2', type: '3 Pièces • 80 m²', rent: 250000, tenant: 'Disponible', status: 'vacant' },
                  { unit: 'Penthouse C', type: '4 Pièces • 160 m²', rent: 450000, tenant: 'Rodrigue Agbodjan', status: 'occupe' },
                ].map((l, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-slate-900">{l.unit}</span>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            l.status === 'occupe'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {l.status === 'occupe' ? 'Occupé' : 'Vacant'}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-0.5">{l.type}</span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Locataire : {l.tenant}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 block">
                        {formatFCFA(l.rent)}
                      </span>
                      <span className="text-[10px] text-slate-400 block">par mois</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>

      {quickAction && (
        <QuickActionModal
          actionType={quickAction}
          onClose={() => setQuickAction(null)}
          onSuccess={() => {}}
        />
      )}
    </div>
  );
}
