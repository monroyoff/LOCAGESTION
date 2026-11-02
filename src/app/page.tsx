'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
import { UserSpace, PaymentTransaction, DashboardKPIs } from '@/lib/types';
import { useSpace } from '@/lib/context/space-context';
import { Sparkles, CheckCircle2, AlertCircle, ArrowUpRight, Wrench, ArrowRight } from 'lucide-react';
import { IncidentService } from '@/lib/services/incident-service';
import { notifyAction } from '@/lib/notifications/action-notifier';
import { Footer } from '@/components/layout/Footer';

export default function DashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeSpace, switchSpace, isLandlord, isTenant } = useSpace();

  // Modals state
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);
  const [reminderPayment, setReminderPayment] = useState<PaymentTransaction | null>(null);
  const [quickAction, setQuickAction] = useState<'new_lease' | 'new_payment' | 'new_property' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingIncidents, setPendingIncidents] = useState(0);
  const [dashboardKPIs, setDashboardKPIs] = useState<DashboardKPIs>(MOCK_KPIS);

  useEffect(() => {
    const updateIncidentData = () => {
      const active = IncidentService.getIncidents().filter((i) => i.status !== 'resolu').length;
      setPendingIncidents(active);
      const totalExpenses = IncidentService.getTotalArtisanExpenses();
      setDashboardKPIs((prev) => ({
        ...prev,
        totalExpenses: {
          ...prev.totalExpenses,
          amount: totalExpenses,
        },
        netIncome: {
          ...prev.netIncome,
          amount: prev.collectedRent.amount - totalExpenses,
        },
      }));
    };
    updateIncidentData();
    window.addEventListener('locagestion:incidents_updated', updateIncidentData);
    window.addEventListener('storage', updateIncidentData);
    return () => {
      window.removeEventListener('locagestion:incidents_updated', updateIncidentData);
      window.removeEventListener('storage', updateIncidentData);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    notifyAction(msg, 'Enregistrement validé !', 'success');
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

          {/* 3. Visuel Héro Bien Phare & Bandeau d'Occupation */}
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

          {/* 6. Alerte Pannes & Interventions Signalées (Transférées vers /incidents) */}
          {pendingIncidents > 0 && (
            <section aria-label="Alerte pannes en attente">
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center shrink-0">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-black text-slate-900">
                        {pendingIncidents} panne{pendingIncidents > 1 ? 's' : ''} signalée{pendingIncidents > 1 ? 's' : ''} par vos locataires
                      </h3>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                        À traiter
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Des dysfonctionnements avec photos nécessitent l’intervention d’un artisan. Retrouvez l’ensemble des dossiers dans le module Pannes & Interventions.
                    </p>
                  </div>
                </div>
                <Link
                  href="/incidents"
                  className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                >
                  <span>Gérer les interventions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </section>
          )}

          {/* 6. Tableau Opérations Récentes & Suivi des Loyers */}
          <section aria-label="Opérations récentes" id="operations-suivi-loyers">
            <RecentPaymentsTable
              payments={MOCK_RECENT_PAYMENTS}
              onSelectPayment={(p) => setSelectedPayment(p)}
              onSendReminder={(p) => setReminderPayment(p)}
            />
          </section>

          {/* 7. Indicateurs Clés & Raccourcis d'Opérations (Placés en bas après Opérations & Suivi des Loyers) */}
          <section aria-label="Indicateurs clés et opérations">
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Synthèse Financière & Indicateurs Clés</span>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                    Interactif • Cliquez pour ouvrir les opérations
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Cliquez sur chaque carte pour accéder directement au module et aux opérations correspondantes.
                </p>
              </div>
            </div>
            <StatCards kpis={dashboardKPIs} />
          </section>

          {/* Footer en fin de page : Créée au Bénin (en bas à gauche) */}
          <Footer />
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

