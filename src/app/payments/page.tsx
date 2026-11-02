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
  ShieldCheck,
  Clock,
  Calendar,
  Building2,
  User,
  Eye,
  ExternalLink,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { PaymentTransaction, UserSpace } from '@/lib/types';
import { RecentPaymentsTable } from '@/components/dashboard/RecentPaymentsTable';
import { ReceiptModal } from '@/components/dashboard/ReceiptModal';
import { WhatsAppReminderModal } from '@/components/dashboard/WhatsAppReminderModal';
import { QuickActionModal } from '@/components/dashboard/QuickActionModal';
import { VerifyPaymentModal } from '@/components/payments/VerifyPaymentModal';
import { PaymentService } from '@/lib/services/payment-service';
import { downloadCSV } from '@/lib/export/csv-export';
import { notifySave } from '@/lib/notifications/action-notifier';
import { Footer } from '@/components/layout/Footer';

export default function PaymentsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState<UserSpace>('bailleur');

  // Onglet principal : 'all' (Tous les encaissements) ou 'pending' (Déclarations à vérifier)
  const [activeMainTab, setActiveMainTab] = useState<'all' | 'pending'>('all');

  // Paiements en direct depuis PaymentService
  const [verifiedPayments, setVerifiedPayments] = useState<PaymentTransaction[]>([]);
  const [declaredPayments, setDeclaredPayments] = useState<PaymentTransaction[]>([]);

  // Modales
  const [selectedPayment, setSelectedPayment] = useState<PaymentTransaction | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState<PaymentTransaction | null>(null);
  const [reminderPayment, setReminderPayment] = useState<PaymentTransaction | null>(null);
  const [quickAction, setQuickAction] = useState<'new_lease' | 'new_payment' | 'new_property' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadAllPayments = () => {
    setVerifiedPayments(PaymentService.getVerifiedPayments());
    setDeclaredPayments(PaymentService.getDeclaredPayments());
  };

  useEffect(() => {
    loadAllPayments();
    window.addEventListener('locagestion:payments_updated', loadAllPayments);
    window.addEventListener('storage', loadAllPayments);
    return () => {
      window.removeEventListener('locagestion:payments_updated', loadAllPayments);
      window.removeEventListener('storage', loadAllPayments);
    };
  }, []);

  // Détection des paramètres d'URL (ex: depuis la notification "Vérifier le paiement")
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      const verifyParam = params.get('verify');
      const actionParam = params.get('action');

      if (tabParam === 'pending' || verifyParam) {
        setActiveMainTab('pending');
      }

      if (verifyParam) {
        const declared = PaymentService.getDeclaredPayments();
        const found =
          declared.find((p) => p.id === verifyParam || p.receiptNumber === verifyParam) ||
          declared.find((p) => !p.isVerified) ||
          declared[0];
        if (found) {
          setVerifyingPayment(found);
        }
      }

      if (actionParam === 'new' || actionParam === 'declare' || actionParam === 'new_payment') {
        setQuickAction('new_payment');
      }
    }
  }, []);

  const pendingPayments = declaredPayments.filter((p) => !p.isVerified && p.status !== 'en_retard');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    notifySave(msg, 'Action validée !');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePaymentVerified = (verified: PaymentTransaction) => {
    setVerifyingPayment(null);
    loadAllPayments();
    // Ouverture automatique du reçu & de la quittance certifiée
    setSelectedPayment(verified);
    showToast(
      `Paiement validé avec succès pour le mois de ${verified.period} ! Quittance ${verified.receiptNumber} générée pour le bailleur et le locataire.`
    );
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

    const rows = verifiedPayments.map((p) => [
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
      p.isVerified ? 'CERTIFIÉ UEMOA & CEMAC' : 'EN ATTENTE',
    ]);

    downloadCSV('grand-livre-encaissements-locagestion-2026', headers, rows);
    showToast(`Grand livre des encaissements exporté avec succès (${verifiedPayments.length} écritures) !`);
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
                  Zone FCFA
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Suivi des versements Mobile Money (Wave, MTN, Moov, Orange), validation de loyer et émission de quittances certifiées.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
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

          {/* Onglets Principaux : Tous les Encaissements vs Paiements à vérifier */}
          <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
            <button
              type="button"
              onClick={() => setActiveMainTab('all')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeMainTab === 'all'
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Tous les encaissements & Quittances</span>
              <span
                className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  activeMainTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {verifiedPayments.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('pending')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer relative ${
                activeMainTab === 'pending'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Paiements à vérifier & valider</span>
              {pendingPayments.length > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse shadow-xs">
                  {pendingPayments.length} à traiter
                </span>
              )}
            </button>
          </div>

          {/* VUE 1 : TOUS LES ENCAISSEMENTS & QUITTANCES VALIDÉES */}
          {activeMainTab === 'all' && (
            <div className="space-y-4">
              <RecentPaymentsTable
                payments={verifiedPayments}
                onSelectPayment={(p) => setSelectedPayment(p)}
                onSendReminder={(p) => setReminderPayment(p)}
              />
            </div>
          )}

          {/* VUE 2 : PAIEMENTS À VÉRIFIER & VALIDER (OUVERTE SUR CLIC DE NOTIFICATION) */}
          {activeMainTab === 'pending' && (
            <div className="space-y-4">
              {/* Bannière explicative */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-brand-500/10 to-tealAccent-500/10 border border-emerald-200/80 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black shrink-0 shadow-md shadow-emerald-600/20">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      Vérification & Validation des Loyers Déclarés
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
                      Cliquez sur <strong>« Vérifier & Valider »</strong> pour confirmer la réception des fonds et sélectionner le mois concerné. La <strong>quittance officielle certifiée</strong> et le <strong>reçu</strong> seront générés automatiquement pour vous et pour le locataire.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-white text-xs font-black text-slate-800 border border-slate-200 shadow-xs">
                    {pendingPayments.length} déclaration{pendingPayments.length > 1 ? 's' : ''} en attente
                  </span>
                </div>
              </div>

              {pendingPayments.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-soft space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    Toutes les déclarations de loyer sont vérifiées !
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Aucun versement en attente de vérification. Toutes les quittances ont été générées et transmises aux locataires.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveMainTab('all')}
                    className="mt-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Voir l'historique des encaissements
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {pendingPayments.map((p) => (
                    <div
                      key={p.id}
                      className="p-5 rounded-3xl bg-white border border-slate-200/90 hover:border-emerald-300 hover:shadow-soft transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        {/* Infos Locataire */}
                        <div className="flex items-center gap-3.5">
                          <img
                            src={
                              p.tenantAvatar ||
                              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80'
                            }
                            alt={p.tenantName}
                            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-black text-slate-900">{p.tenantName}</h4>
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                                En attente de validation
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {p.propertyName} • {p.unitNumber}
                              </span>
                              <span className="text-slate-300">•</span>
                              <span>Tél : {p.tenantPhone}</span>
                            </div>
                          </div>
                        </div>

                        {/* Montant & Moyen */}
                        <div className="flex items-center sm:items-end flex-col gap-1 text-left sm:text-right">
                          <span className="text-lg font-black text-emerald-600">
                            {formatFCFA(p.amount)}
                          </span>
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                            <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                            <span>Via {p.method.toUpperCase()}</span>
                            <span className="text-slate-300">•</span>
                            <span className="font-mono text-[11px] text-slate-600">
                              Réf: {p.transactionRef || p.receiptNumber}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Détails supplémentaires & Justificatif */}
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-4 h-4 text-brand-500 shrink-0" />
                          <span>
                            Période déclarée : <strong>{p.period}</strong> (Déclaré le {p.paymentDate})
                          </span>
                        </div>

                        {p.proofUrl && (
                          <a
                            href={p.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Voir le justificatif de paiement</span>
                          </a>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                        <span className="text-[11px] text-slate-400 italic">
                          {p.notes || 'Déclaration directe locataire Mobile Money'}
                        </span>

                        <button
                          type="button"
                          onClick={() => setVerifyingPayment(p)}
                          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                          <span>Vérifier & Valider ce paiement</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Footer en fin de page : Créée au Bénin (en bas à gauche) */}
          <Footer />
        </main>
      </div>

      {/* Modale de vérification & sélection du mois concerné */}
      {verifyingPayment && (
        <VerifyPaymentModal
          isOpen={!!verifyingPayment}
          payment={verifyingPayment}
          onClose={() => setVerifyingPayment(null)}
          onVerified={handlePaymentVerified}
        />
      )}

      {/* Modale d'aperçu & téléchargement de la Quittance officielle */}
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
