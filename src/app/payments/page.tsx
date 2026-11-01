'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  CreditCard,
  Plus,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Receipt,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { MOCK_RECENT_PAYMENTS, MOCK_KPIS } from '@/lib/data/mock-data';
import { formatFCFA } from '@/lib/money/format';
import { PaymentTransaction, UserSpace } from '@/lib/types';
import { RecentPaymentsTable } from '@/components/dashboard/RecentPaymentsTable';
import { ReceiptModal } from '@/components/dashboard/ReceiptModal';
import { WhatsAppReminderModal } from '@/components/dashboard/WhatsAppReminderModal';
import { QuickActionModal } from '@/components/dashboard/QuickActionModal';
import { downloadCSV } from '@/lib/export/csv-export';
import { notifySave } from '@/lib/notifications/action-notifier';

export default function PaymentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState<UserSpace>('bailleur');
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);
  const [reminderPayment, setReminderPayment] = useState<PaymentTransaction | null>(null);
  const [quickAction, setQuickAction] = useState<'new_lease' | 'new_payment' | 'new_property' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      if (action === 'new' || action === 'declare' || action === 'new_payment') {
        setQuickAction('new_payment');
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    notifySave(msg, 'Encaissement validé !');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleExportCSV = () => {
    const headers = [
      'N° Quittance',
      'Locataire',
      'Résidence',
      'Lot / Unité',
      'Période',
      'Date Règlement',
      'Moyen de paiement',
      'Montant Encaissé (FCFA)',
      'Montant Attendu (FCFA)',
      'Statut',
      'Certification',
    ];

    const rows = MOCK_RECENT_PAYMENTS.map((p) => [
      p.receiptNumber,
      p.tenantName,
      p.propertyName,
      p.unitNumber,
      p.period,
      p.paymentDate,
      p.method.toUpperCase(),
      p.amount,
      p.expectedAmount,
      p.status === 'paye' ? 'SOLDÉ' : p.status === 'en_retard' ? 'EN RETARD' : 'PARTIEL',
      p.isVerified ? 'CERTIFIÉ UEMOA' : 'EN ATTENTE',
    ]);

    downloadCSV('grand-livre-encaissements-locagestion-2026', headers, rows);
    showToast(`Grand livre des encaissements exporté avec succès (${MOCK_RECENT_PAYMENTS.length} écritures) !`);
  };

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
          {/* Top Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Paiements, Encaissements & Quittances
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {formatFCFA(MOCK_KPIS.collectedRent.amount)} Encaissés
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Suivi des versements Mobile Money (Wave, MTN, Orange, Moov), virements et émissions de quittances.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={handleExportCSV}
                className="py-2.5 px-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold shadow-sm hover:border-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Exporter CSV / Excel</span>
              </button>

              <button
                type="button"
                onClick={() => setQuickAction('new_payment')}
                className="py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Encaisser un loyer</span>
              </button>
            </div>
          </div>

          {/* Table */}
          <RecentPaymentsTable
            payments={MOCK_RECENT_PAYMENTS}
            onSelectPayment={(p) => setSelectedPayment(p)}
            onSendReminder={(p) => setReminderPayment(p)}
          />
        </main>
      </div>

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

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

