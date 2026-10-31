'use client';

import React, { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  Building,
  User,
  ShieldCheck,
  Download,
  Eye,
  Sparkles,
  ArrowRight,
  PenTool,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { UserSpace } from '@/lib/types';
import { QuickActionModal } from '@/components/dashboard/QuickActionModal';

export default function LeasesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState<UserSpace>('bailleur');
  const [quickAction, setQuickAction] = useState<'new_lease' | 'new_payment' | 'new_property' | null>(null);

  const leases = [
    {
      id: 'BAIL-2025-089',
      tenant: 'Koffi Mensah',
      property: 'Résidence Les Cocotiers',
      unit: 'Appt A3 (3 pièces)',
      rent: 220000,
      deposit: 660000,
      startDate: '01/01/2025',
      endDate: '31/12/2025',
      status: 'actif',
      signedElectronically: true,
    },
    {
      id: 'BAIL-2025-112',
      tenant: 'Amina Diop',
      property: 'Villa Émeraude',
      unit: 'Villa R+1 Ouest',
      rent: 350000,
      deposit: 1050000,
      startDate: '15/03/2025',
      endDate: '14/03/2026',
      status: 'actif',
      signedElectronically: true,
    },
    {
      id: 'BAIL-2025-045',
      tenant: 'Fatoumata Traoré',
      property: 'Résidence Les Cocotiers',
      unit: 'Appt B1 (2 pièces)',
      rent: 180000,
      deposit: 540000,
      startDate: '01/06/2025',
      endDate: '31/05/2026',
      status: 'actif',
      signedElectronically: true,
    },
    {
      id: 'BAIL-2025-072',
      tenant: 'Jean-Yves Kouassi',
      property: 'Immeuble Palmier Royal',
      unit: 'Studio B12',
      rent: 140000,
      deposit: 420000,
      startDate: '01/02/2025',
      endDate: '31/01/2026',
      status: 'actif',
      signedElectronically: true,
    },
  ];

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
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Baux & Contrats de Location
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-brand-50 text-brand-600 border border-brand-200">
                  {leases.length} Baux Actifs
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Génération conforme OHADA/UEMOA, signature électronique tactile et échéancier automatique.
              </p>
            </div>

            <button
              onClick={() => setQuickAction('new_lease')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-extrabold shadow-pink-glow active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Rédiger un nouveau bail</span>
            </button>
          </div>

          {/* Assistant 5 Étapes Banner */}
          <div className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-soft">
            <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block mb-3">
              Assistant de Rédaction de Bail Conforme UEMOA
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[
                { step: '1', title: 'Sélection du Lot', desc: 'Résidence, type, loyer' },
                { step: '2', title: 'Identité Locataire', desc: 'Fiche ou invitation' },
                { step: '3', title: 'Conditions Financières', desc: 'Caution, avance, charges' },
                { step: '4', title: 'Modèle Juridique', desc: 'Clauses d’habitation' },
                { step: '5', title: 'Signature Tactile', desc: 'Horodatage & scellement' },
              ].map((s) => (
                <div key={s.step} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center">
                      {s.step}
                    </span>
                    <span className="font-extrabold text-xs text-slate-900">{s.title}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">{s.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leases Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900">
                Liste des Contrats Actifs
              </h3>
            </div>

            <div className="divide-y divide-slate-100">
              {leases.map((lease) => (
                <div
                  key={lease.id}
                  className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-slate-900">
                          {lease.tenant}
                        </h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold">
                          {lease.id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Signé électr.
                        </span>
                      </div>

                      <span className="text-xs text-slate-600 font-semibold block mt-0.5">
                        {lease.property} • {lease.unit}
                      </span>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                        <span>Début : {lease.startDate}</span>
                        <span>•</span>
                        <span>Fin : {lease.endDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block sm:text-right">Loyer mensuel</span>
                      <span className="text-sm font-black text-slate-900 block sm:text-right">
                        {formatFCFA(lease.rent)}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Télécharger (PDF)</span>
                    </button>
                  </div>
                </div>
              ))}
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

