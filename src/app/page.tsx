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
} from '@/lib/data/mock-data';
import { UserSpace, PaymentTransaction, DashboardKPIs } from '@/lib/types';
import { useSpace } from '@/lib/context/space-context';
import { Sparkles, CheckCircle2, AlertCircle, ArrowUpRight, Wrench, ArrowRight } from 'lucide-react';
import { IncidentService } from '@/lib/services/incident-service';
import { PaymentService } from '@/lib/services/payment-service';
import { notifyAction } from '@/lib/notifications/action-notifier';
import { Footer } from '@/components/layout/Footer';
import { SkeletonLandlordDashboard } from '@/components/ui/SkeletonLoader';

export default function DashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, activeSpace, switchSpace, isLandlord, isTenant, isDemarcheur } = useSpace();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 350);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const refreshPayments = () => {
      setPayments(PaymentService.getVerifiedPaymentsForLandlord(user));
    };
    refreshPayments();
    window.addEventListener('locagestion:payments_updated', refreshPayments);
    window.addEventListener('storage', refreshPayments);
    return () => {
      window.removeEventListener('locagestion:payments_updated', refreshPayments);
      window.removeEventListener('storage', refreshPayments);
    };
  }, [user]);

  useEffect(() => {
    if (isDemarcheur) {
      router.replace('/listings');
    }
  }, [isDemarcheur, router]);

  // Modals state
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);
  const [reminderPayment, setReminderPayment] = useState<PaymentTransaction | null>(null);
  const [quickAction, setQuickAction] = useState<'new_lease' | 'new_payment' | 'new_property' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [pendingIncidents, setPendingIncidents] = useState(0);
  const [dashboardKPIs, setDashboardKPIs] = useState<DashboardKPIs>(MOCK_KPIS);
  const [dashboardPaymentTab, setDashboardPaymentTab] = useState<'all' | 'paye' | 'en_retard' | 'partiel'>('all');

  const handleDashboardCardClick = (cardId: string) => {
    if (cardId === 'collected') {
      setDashboardPaymentTab('paye');
      if (typeof document !== 'undefined') {
        const el = document.getElementById('operations-suivi-loyers');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
      showToast('Filtre actif : Affichage immédiat des loyers soldés');
    } else if (cardId === 'expenses') {
      router.push('/incidents');
    } else if (cardId === 'average') {
      router.push('/properties');
    } else if (cardId === 'net_income') {
      router.push('/payments?status=paye');
    }
  };

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

  if (isDemarcheur) {
    return null;
  }

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
        <main className="flex-1 p-4 sm:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">
          {isLoading ? (
            <SkeletonLandlordDashboard />
          ) : (
            <>
              {/* 1. Welcome & Context Banner */}
              <div className="order-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-gradient-to-r from-slate-900 via-[#131722] to-slate-900 rounded-3xl text-white shadow-xl relative overflow-hidden">
            {/* Background glowing sphere */}
            <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black bg-brand-500 text-white shadow-md shadow-brand-500/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  {user?.companyName || user?.name || 'Mon Patrimoine'}
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  • {dashboardKPIs.occupancyRate.totalUnits} Lots gérés
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
                Bonjour {user?.firstName || (user?.name ? user.name.split(' ')[0] : 'Bailleur')} 👋, voici le point de gestion locative
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-xl">
                {dashboardKPIs.occupancyRate.occupiedUnits === 0
                  ? "Bienvenue sur votre espace de gestion locative. Enregistrez vos biens et baux pour activer le suivi en direct."
                  : `${dashboardKPIs.rentBreakdown.paidCount} loyer${dashboardKPIs.rentBreakdown.paidCount > 1 ? 's ont' : ' a'} été perçu${dashboardKPIs.rentBreakdown.paidCount > 1 ? 's' : ''} ce mois-ci sur les ${dashboardKPIs.occupancyRate.occupiedUnits} lots occupés.`}
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-3 self-start sm:self-auto">
              <button
                onClick={() => setQuickAction('new_payment')}
                className="py-2.5 px-4 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer"
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

          {/* 2. Tableau Opérations Récentes & Suivi des Loyers */}
          {/* SUR MOBILE : order-2 (déplacé en haut juste avant le Statut du Parc Immobilier) */}
          {/* SUR DESKTOP (lg+) : lg:order-5 (placé après le visuel héro et les graphiques) */}
          <section
            aria-label="Opérations récentes"
            id="operations-suivi-loyers"
            className="order-2 lg:order-5"
          >
            <RecentPaymentsTable
              payments={payments}
              initialTab={dashboardPaymentTab}
              onSelectPayment={(p) => setSelectedPayment(p)}
              onSendReminder={(p) => setReminderPayment(p)}
            />
          </section>

          {/* 3. Statut du Parc Immobilier & Visuel Héro Bien Phare */}
          {/* SUR MOBILE : order-3 (juste après Opérations & Suivi des Loyers) */}
          {/* SUR DESKTOP (lg+) : lg:order-2 */}
          <section
            className="flex flex-col gap-5 order-3 lg:order-2"
            aria-label="Parc et occupation"
            id="statut-du-parc-immobilier"
          >
            {/* Bandeau d'Occupation & Statut du Parc */}
            <div className="order-1 lg:order-2">
              <OccupancyStatusBanner
                occupancy={MOCK_KPIS.occupancyRate}
                onFilterStatus={() => router.push('/properties')}
              />
            </div>

            {/* Visuel Héro Bien Phare du Mois */}
            <div className="order-2 lg:order-1">
              <HeroPropertyCard
                property={MOCK_FEATURED_PROPERTY}
                onViewDetails={() => router.push('/properties')}
              />
            </div>
          </section>

          {/* 4. Donut Recouvrement & Encaissements Mensuels */}
          <section aria-label="Finances et encaissements" className="order-4 lg:order-3">
            <RentCollectionBreakdown breakdown={MOCK_KPIS.rentBreakdown} />
          </section>

          {/* 5. Alerte Pannes & Interventions Signalées */}
          {pendingIncidents > 0 && (
            <section aria-label="Alerte pannes en attente" className="order-5 lg:order-4">
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

          {/* 6. Indicateurs Clés & Raccourcis d'Opérations (Placés tout en bas après Opérations & Suivi des Loyers) */}
          <section aria-label="Indicateurs clés et opérations" className="order-6 lg:order-6">
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
            <StatCards kpis={dashboardKPIs} onCardClick={handleDashboardCardClick} />
          </section>

            {/* 7. Footer en fin de page : Créée au Bénin (en bas à gauche) */}
            <div className="order-7 lg:order-7">
              <Footer />
            </div>
          </>
        )}
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

