'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { StatCards } from '@/components/dashboard/StatCards';
import { HeroPropertyCard } from '@/components/dashboard/HeroPropertyCard';
import { OccupancyStatusBanner } from '@/components/dashboard/OccupancyStatusBanner';
import { RentCollectionBreakdown } from '@/components/dashboard/RentCollectionBreakdown';
import { RecentPaymentsTable } from '@/components/dashboard/RecentPaymentsTable';
import { ReceiptModal } from '@/components/dashboard/ReceiptModal';
import { WhatsAppReminderModal } from '@/components/dashboard/WhatsAppReminderModal';
import { QuickActionModal } from '@/components/dashboard/QuickActionModal';
import {
  MOCK_KPIS,
  MOCK_FEATURED_PROPERTY,
  MOCK_RECENT_PAYMENTS,
} from '@/lib/data/mock-data';
import { UserSpace, PaymentTransaction } from '@/lib/types';
import { useSpace } from '@/lib/context/space-context';
import { Sparkles, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeSpace, switchSpace, isLandlord, isTenant } = useSpace();

  // Modals state
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);
  const [reminderPayment, setReminderPayment] = useState<PaymentTransaction | null>(null);
  const [quickAction, setQuickAction] = useState<'new_lease' | 'new_payment' | 'new_property' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex">
      {/* 1. Sidebar Navigation (StayWise / Rentable Obsidian Dark Style) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSpace={activeSpace}
        onSpaceChange={switchSpace}
      />

      {/* 2. Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Sticky Header */}
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenQuickAction={(action) => setQuickAction(action)}
        />

        {/* Dashboard Body */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Welcome & Context Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-[#131722] to-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
            {/* Background glowing sphere */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black bg-brand-500 text-white shadow-md shadow-brand-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  Cabinet Diallo Patrimoine
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  • 4 Résidences • 32 Lots gérés
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                Bonjour Mamadou 👋, voici le point de gestion locative
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                23 loyers ont été perçus ce mois-ci sur les 28 lots occupés. 2 relances d’impayés nécessitent votre attention.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-3 self-start sm:self-auto">
              <button
                onClick={() => setQuickAction('new_payment')}
                className="py-2.5 px-4 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-black shadow-md transition-all active:scale-95"
              >
                + Encaisser
              </button>
              <button
                onClick={() => router.push('/leases/new')}
                className="py-2.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black shadow-pink-glow transition-all active:scale-95 cursor-pointer"
              >
                + Nouveau bail
              </button>
            </div>
          </div>

          {/* 3. 4 Cartes KPI (Encaissé, Dépenses, Loyer moyen, Résultat net) */}
          <section aria-label="Indicateurs clés">
            <StatCards kpis={MOCK_KPIS} />
          </section>

          {/* 4. Visuel Héro Bien Phare & Bandeau d'Occupation */}
          <section className="space-y-5" aria-label="Parc et occupation">
            <HeroPropertyCard
              property={MOCK_FEATURED_PROPERTY}
              onViewDetails={() => router.push('/properties')}
            />

            <OccupancyStatusBanner
              occupancy={MOCK_KPIS.occupancyRate}
              onFilterStatus={() => router.push('/properties')}
            />
          </section>

          {/* 5. Donut Recouvrement & Encaissements Mensuels */}
          <section aria-label="Finances et encaissements">
            <RentCollectionBreakdown breakdown={MOCK_KPIS.rentBreakdown} />
          </section>

          {/* 6. Tableau Opérations Récentes & Suivi des Loyers */}
          <section aria-label="Opérations récentes">
            <RecentPaymentsTable
              payments={MOCK_RECENT_PAYMENTS}
              onSelectPayment={(p) => setSelectedPayment(p)}
              onSendReminder={(p) => setReminderPayment(p)}
            />
          </section>
        </main>
      </div>

      {/* 7. Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 8. Modals */}
      {selectedPayment && (
        <ReceiptModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
        />
      )}

      {reminderPayment && (
        <WhatsAppReminderModal
          payment={reminderPayment}
          onClose={() => setReminderPayment(null)}
        />
      )}

      {quickAction && (
        <QuickActionModal
          actionType={quickAction}
          onClose={() => setQuickAction(null)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}
    </div>
  );
}

