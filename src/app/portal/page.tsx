'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSpace } from '@/lib/context/space-context';
import {
  Home,
  Receipt,
  FileText,
  ShieldCheck,
  CreditCard,
  UploadCloud,
  CheckCircle2,
  Clock,
  ArrowRight,
  Phone,
  Building2,
  Smartphone,
  Lock,
  MessageCircle,
  Sparkles,
  Download,
  AlertCircle,
  Repeat,
  Camera,
  X,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { ReceiptModal } from '@/components/dashboard/ReceiptModal';
import { PaymentTransaction } from '@/lib/types';

export default function TenantPortalPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { switchSpace } = useSpace();
  const [activeTab, setActiveTab] = useState<'accueil' | 'quittances' | 'bail' | 'solvabilite'>('accueil');
  const [declarationModalOpen, setDeclarationModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync hash with active tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleHash = () => {
        const hash = window.location.hash.replace('#', '');
        if (hash === 'quittances' || hash === 'bail' || hash === 'solvabilite' || hash === 'accueil') {
          setActiveTab(hash as any);
        }
      };
      handleHash();
      window.addEventListener('hashchange', handleHash);
      return () => window.removeEventListener('hashchange', handleHash);
    }
  }, []);

  // Tenant state
  const [consentGranted, setConsentGranted] = useState(true);
  const [declaredAmount, setDeclaredAmount] = useState('220000');
  const [declaredMethod, setDeclaredMethod] = useState('wave');
  const [declaredRef, setDeclaredRef] = useState('WAVE-TX-984210');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleDeclarePayment = (e: React.FormEvent) => {
    e.preventDefault();
    setDeclarationModalOpen(false);
    showToast(`Déclaration de ${formatFCFA(declaredAmount)} envoyée au bailleur ! Quittance émise dès validation.`);
  };

  const tenant = {
    name: 'Koffi Mensah',
    phone: '+229 97 12 34 56',
    email: 'koffi.mensah@fintech-africa.com',
    property: 'Résidence Les Cocotiers',
    unit: 'Appt A3 (3 pièces • 75 m²)',
    address: 'Rue 340, Haie Vive, Cotonou (Bénin)',
    monthlyRent: 220000,
    charges: 30000,
    dueDate: '05/11/2026',
    paymentStatus: 'a_jour', // À jour
    landlord: {
      name: 'Diallo Patrimoine SARL',
      contactPerson: 'Mamadou Diallo',
      phone: '+229 01 95 44 44 30',
      email: 'contact@diallo-patrimoine.bj',
    },
    scoring: {
      score: 96,
      badge: 'Excellent',
      onTimeRate: 100,
      totalMonthsPaid: 22,
    },
  };

  const receiptsList: PaymentTransaction[] = [
    {
      id: 'rec-01',
      receiptNumber: 'QUITT-2026-1048',
      tenantId: 'ten-01',
      tenantName: 'Koffi Mensah',
      tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
      tenantPhone: '+229 97 12 34 56',
      propertyName: 'Résidence Les Cocotiers',
      unitNumber: 'Appt A3 (3 pièces)',
      amount: 220000,
      expectedAmount: 220000,
      period: 'Octobre 2026',
      paymentDate: '30/10/2026',
      method: 'wave',
      status: 'paye',
      isVerified: true,
    },
    {
      id: 'rec-02',
      receiptNumber: 'QUITT-2026-0940',
      tenantId: 'ten-01',
      tenantName: 'Koffi Mensah',
      tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
      tenantPhone: '+229 97 12 34 56',
      propertyName: 'Résidence Les Cocotiers',
      unitNumber: 'Appt A3 (3 pièces)',
      amount: 220000,
      expectedAmount: 220000,
      period: 'Septembre 2026',
      paymentDate: '02/09/2026',
      method: 'wave',
      status: 'paye',
      isVerified: true,
    },
    {
      id: 'rec-03',
      receiptNumber: 'QUITT-2026-0830',
      tenantId: 'ten-01',
      tenantName: 'Koffi Mensah',
      tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
      tenantPhone: '+229 97 12 34 56',
      propertyName: 'Résidence Les Cocotiers',
      unitNumber: 'Appt A3 (3 pièces)',
      amount: 220000,
      expectedAmount: 220000,
      period: 'Août 2026',
      paymentDate: '01/08/2026',
      method: 'virement',
      status: 'paye',
      isVerified: true,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex">
      {/* 1. Sidebar configured for Locataire */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSpace="locataire"
        onSpaceChange={switchSpace}
      />

      {/* 2. Main Tenant Space Layout */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenTenantAction={(action) => {
            if (action === 'declare_payment') {
              setDeclarationModalOpen(true);
            } else if (action === 'report_issue') {
              showToast('Signalement de panne transmis avec succès au bailleur.');
            }
          }}
        />

        {/* Main Tenant Container */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-5xl mx-auto w-full">
        {/* Hero Banner: Rent Due & Quick Payment */}
        <div className="bg-gradient-to-br from-slate-900 via-[#141824] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-0.5 rounded-full text-[11px] font-black bg-emerald-500 text-white shadow-sm flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Loyer d’Octobre Soldé
                </span>
                <span className="text-xs text-slate-300">
                  {tenant.property} • {tenant.unit}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Bonjour Koffi 👋, votre espace est parfaitement à jour
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-lg">
                Prochaine exigibilité de loyer : <strong>{tenant.dueDate}</strong> ({formatFCFA(tenant.monthlyRent)} charges comprises).
              </p>
            </div>

            {/* Big Action Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
              <button
                onClick={() => setDeclarationModalOpen(true)}
                className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs sm:text-sm font-black shadow-pink-glow active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Déclarer un paiement de loyer</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Interactive Category Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            onClick={() => setActiveTab('quittances')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer group hover:shadow-card-hover ${
              activeTab === 'quittances'
                ? 'bg-white border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                : 'bg-white border-slate-200/80 shadow-soft'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-brand-600 transition-colors">
              Mes Quittances
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {receiptsList.length} reçus certifiés avec QR code
            </p>
          </div>

          <div
            onClick={() => setActiveTab('bail')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer group hover:shadow-card-hover ${
              activeTab === 'bail'
                ? 'bg-white border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                : 'bg-white border-slate-200/80 shadow-soft'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-brand-600 transition-colors">
              Bail & État des Lieux
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Contrat signé et photos horodatées
            </p>
          </div>

          <div
            onClick={() => setActiveTab('solvabilite')}
            className={`p-5 rounded-3xl border transition-all cursor-pointer group hover:shadow-card-hover ${
              activeTab === 'solvabilite'
                ? 'bg-white border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                : 'bg-white border-slate-200/80 shadow-soft'
            }`}
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-brand-600 transition-colors">
              Passeport Solvabilité
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Score : <strong className="text-emerald-600">96/100 (Excellent)</strong>
            </p>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-3">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Mon Bailleur
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {tenant.landlord.name}
            </p>
            <a
              href={`https://wa.me/${tenant.landlord.phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 mt-2 hover:underline"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Contacter sur WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Tab 1: Quittances & Reçus Dématérialisés */}
        {activeTab === 'quittances' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  Historique de Mes Quittances de Loyer
                </h3>
                <p className="text-xs text-slate-500">
                  Reçus conformes à l'OHADA avec sceau de certification numérique et QR Code.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {receiptsList.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => setSelectedReceipt(rec)}
                  className="py-4 flex items-center justify-between gap-4 hover:bg-slate-50 px-3 rounded-2xl transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-900">
                        {rec.period}
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono block">
                        Réf: {rec.receiptNumber} • Payé le {rec.paymentDate} via Wave
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 block">
                        {formatFCFA(rec.amount)}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Soldé ✓
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedReceipt(rec);
                      }}
                      className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Mon Passeport de Solvabilité & Vie Privée */}
        {activeTab === 'solvabilite' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-6 animate-in fade-in duration-200">
            <div>
              <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block mb-1">
                Mon Profil Locatif Certifié
              </span>
              <h3 className="font-black text-xl text-slate-900">
                Passeport de Solvabilité & Antécédents
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Vos règlements à l’heure génèrent un historique valorisable qui vous permet de trouver votre prochain logement sans caution exorbitante.
              </p>
            </div>

            {/* Score Showcase */}
            <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 to-tealAccent-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-100 block">
                  Score de Ponctualité Global
                </span>
                <div className="text-4xl font-black mt-1">
                  96 <span className="text-base text-emerald-100">/ 100</span>
                </div>
                <p className="text-xs text-emerald-100 mt-1">
                  100% de vos loyers ont été réglés dans les délais sur 22 mois consécutifs.
                </p>
              </div>

              <div className="px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-md text-white text-xs font-black border border-white/20 self-start sm:self-auto">
                Badge : EXCELLENT PAYEUR
              </div>
            </div>

            {/* Privacy & Consent Toggle (Core Architectural Requirement) */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black text-slate-900">
                      Consentement de Partage Inter-Bailleurs
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5 max-w-xl">
                      En activant cette option, vous autorisez les futurs bailleurs vérifiés à consulter votre score de ponctualité et vos antécédents objectifs (sans jamais voir vos quittances détaillées ni vos documents privés). Vous pouvez révoquer cet accès à tout moment.
                    </p>
                  </div>
                </div>

                {/* Toggle switch */}
                <button
                  type="button"
                  onClick={() => {
                    setConsentGranted(!consentGranted);
                    showToast(
                      !consentGranted
                        ? 'Consentement de partage accordé.'
                        : 'Consentement de partage révoqué avec succès.'
                    );
                  }}
                  className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                    consentGranted ? 'bg-brand-500' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      consentGranted ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                Statut actuel :{' '}
                <strong className={consentGranted ? 'text-emerald-600' : 'text-slate-600'}>
                  {consentGranted ? 'Partage actif (Valable jusqu’au 31/12/2026)' : 'Partage révoqué'}
                </strong>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Mon Bail & Contrat */}
        {activeTab === 'bail' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-4 animate-in fade-in duration-200">
            <h3 className="font-black text-base text-slate-900">
              Contrat de Bail d’Habitation
            </h3>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Bail d’Habitation — Résidence Les Cocotiers (Appt A3)
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Signé électroniquement avec horodatage certifié • Réf : BAIL-2025-089
                </p>
              </div>
              <button
                type="button"
                onClick={() => showToast('Téléchargement de votre contrat de bail')}
                className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Télécharger le Contrat</span>
              </button>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* Modal: Déclaration de Paiement avec Preuve */}
      {declarationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Déclarer un Règlement de Loyer</h3>
                  <p className="text-[10px] text-slate-400">
                    Transmettre la preuve à votre bailleur
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDeclarationModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeclarePayment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Moyen de paiement utilisé
                </label>
                <select
                  value={declaredMethod}
                  onChange={(e) => setDeclaredMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold"
                >
                  <option value="wave">Wave Mobile Money (+229 01 95 44 44 30)</option>
                  <option value="mtn_momo">MTN Mobile Money (+229 01 95 44 44 30)</option>
                  <option value="orange_money">Orange Money</option>
                  <option value="moov_money">Moov Money</option>
                  <option value="virement">Virement bancaire</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Montant Transféré (FCFA)
                  </label>
                  <input
                    type="number"
                    value={declaredAmount}
                    onChange={(e) => setDeclaredAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-black text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Référence de transaction
                  </label>
                  <input
                    type="text"
                    value={declaredRef}
                    onChange={(e) => setDeclaredRef(e.target.value)}
                    placeholder="Ex: WAVE-109283"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-mono"
                  />
                </div>
              </div>

              {/* Upload screenshot */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Capture d'écran du reçu Mobile Money / Virement
                </label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-brand-500 transition-colors cursor-pointer bg-slate-50">
                  <UploadCloud className="w-8 h-8 text-brand-500 mx-auto mb-1" />
                  <span className="font-bold text-slate-700 block">
                    Cliquer pour joindre une photo
                  </span>
                  <span className="text-[10px] text-slate-400">
                    PNG, JPG ou PDF (max 5 Mo)
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeclarationModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold shadow-pink-glow"
                >
                  Envoyer la déclaration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quittance Modal Inspection */}
      {selectedReceipt && (
        <ReceiptModal
          payment={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
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

