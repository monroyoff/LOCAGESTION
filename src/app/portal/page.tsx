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
  ExternalLink,
  Mail,
  MapPin,
  Zap,
  Droplet,
  Key,
  Check,
  Calendar,
  ChevronRight,
  Info,
  Eye,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { ReceiptModal } from '@/components/dashboard/ReceiptModal';
import { PaymentTransaction } from '@/lib/types';

export default function TenantPortalPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { switchSpace } = useSpace();

  // Primary Tab state: 'accueil' (Mon Logement), 'quittances' (Mes Quittances & Reçus), 'bail' (Mon Bail & Contrat), 'solvabilite' (Passeport)
  const [activeTab, setActiveTab] = useState<'accueil' | 'quittances' | 'bail' | 'solvabilite'>('accueil');

  // Sub-tab inside "Mon Bail & Contrat" to switch between Bail & État des Lieux et Mon Bailleur
  const [bailSubTab, setBailSubTab] = useState<'tout' | 'bail_etat' | 'bailleur'>('tout');

  const [declarationModalOpen, setDeclarationModalOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync search param & hash with active tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        const queryTab = params.get('tab');
        const hash = window.location.hash.replace('#', '');
        const target = queryTab || hash;
        if (target === 'quittances' || target === 'bail' || target === 'solvabilite' || target === 'accueil') {
          setActiveTab(target as any);
        }
      };
      updateFromUrl();
      window.addEventListener('popstate', updateFromUrl);
      window.addEventListener('hashchange', updateFromUrl);
      return () => {
        window.removeEventListener('popstate', updateFromUrl);
        window.removeEventListener('hashchange', updateFromUrl);
      };
    }
  }, []);

  const handleTabChange = (tab: 'accueil' | 'quittances' | 'bail' | 'solvabilite') => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (tab === 'accueil') {
        url.searchParams.delete('tab');
        url.hash = '';
      } else {
        url.searchParams.set('tab', tab);
        url.hash = tab;
      }
      window.history.pushState({}, '', url.toString());
    }
  };

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
    deposit: 440000,
    dueDate: '05/11/2026',
    paymentStatus: 'a_jour', // À jour
    leaseRef: 'BAIL-2025-089',
    leaseStartDate: '01/11/2025',
    leaseDuration: '1 an renouvelable',
    inventoryDate: '01/11/2025',
    meterCashPower: '1 420 kWh (Compteur prépayé SBEE individuel)',
    meterWater: '384 m³ (SODECI / Surpresseur collectif)',
    keysDelivered: '3 clés blindées de sécurité + 1 télécommande portail parking',
    landlord: {
      name: 'Diallo Patrimoine SARL',
      contactPerson: 'Mamadou Diallo',
      role: 'Gérant & Propriétaire',
      phone: '+229 01 95 44 44 30',
      whatsapp: '2290195444430',
      email: 'contact@diallo-patrimoine.bj',
      address: 'Boulevard de la Marina, Immeuble Horizon 3e étage, Cotonou',
      ifu: '02024109482910',
      paymentMethods: {
        wave: '+229 01 95 44 44 30 (Diallo Patrimoine)',
        mtn: '+229 97 00 00 12',
        moov: '+229 95 88 77 66',
        bank: 'BOA Bénin — Compte N° BJ061 01001 00123456789 45',
      },
    },
    scoring: {
      score: 96,
      badge: 'Excellent Payeur',
      onTimeRate: 100,
      totalMonthsPaid: 22,
    },
  };

  const inventoryPhotos = [
    {
      title: 'Séjour & Climatiseur split',
      desc: 'Peinture satinée blanche sans éclat, climatiseur Haier 1.5 CV révisé, carrelage 60x60 nickel.',
      image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
      date: '01/11/2025 • 10:15',
    },
    {
      title: 'Cuisine équipée & Robinetterie',
      desc: 'Évier inox double bac, mitigeur sans fuite, placards hauts et bas impeccables, prises électriques conformes.',
      image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
      date: '01/11/2025 • 10:32',
    },
    {
      title: 'Salle d’eau & Chauffe-eau 50L',
      desc: 'Douche à l’italienne avec paroi vitrée, chauffe-eau Ariston 50L en service, évacuation testée.',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
      date: '01/11/2025 • 10:48',
    },
  ];

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
          {/* Top Segmented Navigation Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => handleTabChange('accueil')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'accueil'
                  ? 'bg-slate-900 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Mon Logement & Loyer</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('quittances')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'quittances'
                  ? 'bg-emerald-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Mes Quittances & Reçus</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'quittances' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {receiptsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('bail')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'bail'
                  ? 'bg-brand-500 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Mon Bail & Contrat</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('solvabilite')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'solvabilite'
                  ? 'bg-blue-600 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Passeport Solvabilité</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'solvabilite' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-800'
                }`}
              >
                96/100
              </span>
            </button>
          </div>

          {/* ==================================================================== */}
          {/* ONGLET 1 : ACCUEIL / MON LOGEMENT & LOYER                             */}
          {/* ==================================================================== */}
          {activeTab === 'accueil' && (
            <div className="space-y-6 animate-in fade-in duration-200">
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

              {/* 3 Cartes Principales Cliquables (Bail & Bailleur regroupés dans Mon Bail & Contrat) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Mes Quittances & Reçus */}
                <div
                  onClick={() => handleTabChange('quittances')}
                  className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft transition-all cursor-pointer group hover:shadow-card-hover hover:border-emerald-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Receipt className="w-6 h-6" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {receiptsList.length} Quittances Soldées
                      </span>
                    </div>
                    <h3 className="font-black text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Mes Quittances & Reçus
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Historique complet de vos règlements, reçus conformes OHADA téléchargeables en PDF avec QR code certifié.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-700">
                    <span>Consulter mes reçus</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 2. Mon Bail & Contrat (Contient Bail & État des Lieux ET Mon Bailleur) */}
                <div
                  onClick={() => handleTabChange('bail')}
                  className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft transition-all cursor-pointer group hover:shadow-card-hover hover:border-brand-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <FileText className="w-6 h-6" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-brand-50 text-brand-700 border border-brand-200">
                        Bail + État des Lieux + Bailleur
                      </span>
                    </div>
                    <h3 className="font-black text-base text-slate-900 group-hover:text-brand-600 transition-colors">
                      Mon Bail & Contrat
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Contrat signé Réf {tenant.leaseRef}, photos d'état des lieux d'entrée et coordonnées directes de votre bailleur.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-brand-600">
                    <span>Voir le contrat & mon bailleur</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 3. Passeport Solvabilité */}
                <div
                  onClick={() => handleTabChange('solvabilite')}
                  className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft transition-all cursor-pointer group hover:shadow-card-hover hover:border-blue-300 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 border border-blue-200">
                        Score : 96/100
                      </span>
                    </div>
                    <h3 className="font-black text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                      Passeport Solvabilité
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      Profil locatif certifié, 22 mois consécutifs sans retard. Valorisez votre ponctualité pour vos futurs baux.
                    </p>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600">
                    <span>Gérer mon profil & partage</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>

              {/* Fiche Logement Détaillée */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-5 h-5 text-slate-700" />
                    <h3 className="font-black text-base text-slate-900">
                      Caractéristiques de Votre Logement Actuel
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    Bail en cours d'exécution
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Loyer Mensuel Net</span>
                    <span className="text-base font-black text-slate-900 mt-0.5 block">{formatFCFA(tenant.monthlyRent)}</span>
                    <span className="text-[10px] text-slate-500">Hors charges</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Charges Locatives</span>
                    <span className="text-base font-black text-slate-900 mt-0.5 block">{formatFCFA(tenant.charges)}</span>
                    <span className="text-[10px] text-slate-500">Gardiennage & groupe</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Dépôt de Garantie</span>
                    <span className="text-base font-black text-slate-900 mt-0.5 block">{formatFCFA(tenant.deposit)}</span>
                    <span className="text-[10px] text-slate-500">2 mois consignés</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Échéance Mensuelle</span>
                    <span className="text-base font-black text-emerald-700 mt-0.5 block">5 du mois</span>
                    <span className="text-[10px] text-slate-500">Au plus tard</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* ONGLET 2 : MES QUITTANCES & REÇUS                                   */}
          {/* ==================================================================== */}
          {activeTab === 'quittances' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft space-y-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <Receipt className="w-5 h-5" />
                    </span>
                    <h2 className="font-black text-xl text-slate-900 tracking-tight">
                      Mes Quittances & Reçus de Loyer
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Reçus conformes à l'OHADA avec sceau de certification numérique, QR Code de vérification publique et téléchargement PDF instantané.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setDeclarationModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Déclarer un loyer</span>
                </button>
              </div>

              {/* Status Banner */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-black text-emerald-950">
                      Situation de loyer : 100% À jour
                    </h4>
                    <p className="text-[11px] text-emerald-800">
                      Aucune dette ni impayé constaté. Prochaine échéance fixée au <strong>{tenant.dueDate}</strong>.
                    </p>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-900 hidden sm:inline">
                  Exercice 2026
                </span>
              </div>

              {/* Receipts Table */}
              <div className="divide-y divide-slate-100">
                {receiptsList.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => setSelectedReceipt(rec)}
                    className="py-4.5 flex items-center justify-between gap-4 hover:bg-slate-50 px-3.5 rounded-2xl transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black group-hover:scale-105 transition-transform">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                          Quittance de Loyer — {rec.period}
                        </h4>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 font-medium">
                          <span className="font-mono text-slate-600 font-bold">{rec.receiptNumber}</span>
                          <span>•</span>
                          <span>Payé le {rec.paymentDate} via {rec.method.toUpperCase()}</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            Certifié QR Code
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 block">
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
                        className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
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

          {/* ==================================================================== */}
          {/* ONGLET 3 : MON BAIL & CONTRAT                                       */}
          {/* REGROUPE : 1) BAIL & ÉTAT DES LIEUX  2) MON BAILLEUR & CONTACTS     */}
          {/* ==================================================================== */}
          {activeTab === 'bail' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Box with Sub-Selector */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-brand-50 text-brand-600">
                        <FileText className="w-5 h-5" />
                      </span>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">
                        Mon Bail & Contrat
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      Votre contrat d'habitation certifié, l'état des lieux contradictoire avec photos horodatées et les coordonnées directes de votre bailleur.
                    </p>
                  </div>

                  {/* Sub-Tabs Selector */}
                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl self-start sm:self-auto border border-slate-200/60">
                    <button
                      type="button"
                      onClick={() => setBailSubTab('tout')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        bailSubTab === 'tout'
                          ? 'bg-white text-slate-900 shadow-sm font-black'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Tout afficher
                    </button>
                    <button
                      type="button"
                      onClick={() => setBailSubTab('bail_etat')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        bailSubTab === 'bail_etat'
                          ? 'bg-brand-500 text-white shadow-sm font-black'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Bail & État des Lieux
                    </button>
                    <button
                      type="button"
                      onClick={() => setBailSubTab('bailleur')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        bailSubTab === 'bailleur'
                          ? 'bg-slate-900 text-white shadow-sm font-black'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Mon Bailleur
                    </button>
                  </div>
                </div>
              </div>

              {/* SOUS-SECTION 1 : BAIL & ÉTAT DES LIEUX */}
              {(bailSubTab === 'tout' || bailSubTab === 'bail_etat') && (
                <div className="space-y-6">
                  {/* Contrat de Bail Card */}
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-5 h-5 text-brand-600" />
                        <div>
                          <h3 className="font-black text-base text-slate-900">
                            Contrat de Bail d’Habitation Certifié
                          </h3>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Réf : {tenant.leaseRef} • Signé électroniquement le {tenant.leaseStartDate}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => showToast('Téléchargement du contrat de bail officiel (PDF)...')}
                        className="py-2.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-2 shadow-pink-glow transition-all"
                      >
                        <Download className="w-4 h-4" />
                        <span>Télécharger le Bail (PDF)</span>
                      </button>
                    </div>

                    {/* Lease Specifications Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Logement Loué
                        </span>
                        <span className="text-xs font-black text-slate-900 block mt-1">
                          {tenant.property}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {tenant.unit} • {tenant.address}
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Durée & Échéance
                        </span>
                        <span className="text-xs font-black text-slate-900 block mt-1">
                          {tenant.leaseDuration}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Exigibilité le 5 de chaque mois
                        </span>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Loyer & Dépôt
                        </span>
                        <span className="text-xs font-black text-emerald-700 block mt-1">
                          {formatFCFA(tenant.monthlyRent)} / mois
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Caution consignée : {formatFCFA(tenant.deposit)}
                        </span>
                      </div>
                    </div>

                    {/* Legal Certification Badge */}
                    <div className="p-3.5 rounded-2xl bg-slate-900 text-white text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-[11px] text-slate-300">
                          Scellé numérique conforme aux lois sur les transactions électroniques UEMOA.
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold hidden sm:inline">
                        HASH: SHA256-CERT-98421
                      </span>
                    </div>
                  </div>

                  {/* État des Lieux d'Entrée Card */}
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <Camera className="w-5 h-5 text-emerald-600" />
                        <div>
                          <h3 className="font-black text-base text-slate-900">
                            Procès-Verbal d’État des Lieux d'Entrée
                          </h3>
                          <span className="text-[11px] text-slate-400">
                            Contradictoire et approuvé le {tenant.inventoryDate} avec relevé des compteurs
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => showToast('Téléchargement du procès-verbal d’état des lieux...')}
                        className="py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
                      >
                        <Download className="w-4 h-4" />
                        <span>Télécharger le PV (PDF)</span>
                      </button>
                    </div>

                    {/* African Meter Readings */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                        <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold mb-1">
                          <Zap className="w-4 h-4 text-emerald-600" />
                          <span>Compteur Cash Power (SBEE)</span>
                        </div>
                        <span className="text-sm font-black text-emerald-950 font-mono block">
                          Index : 1 420 kWh
                        </span>
                        <span className="text-[10px] text-emerald-700">Compteur prépayé individuel</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200">
                        <div className="flex items-center gap-2 text-blue-800 text-xs font-bold mb-1">
                          <Droplet className="w-4 h-4 text-blue-600" />
                          <span>Compteur d’Eau (SODECI)</span>
                        </div>
                        <span className="text-sm font-black text-blue-950 font-mono block">
                          Index : 384 m³
                        </span>
                        <span className="text-[10px] text-blue-700">Raccordé avec surpresseur</span>
                      </div>

                      <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200">
                        <div className="flex items-center gap-2 text-purple-800 text-xs font-bold mb-1">
                          <Key className="w-4 h-4 text-purple-600" />
                          <span>Clés & Télécommandes</span>
                        </div>
                        <span className="text-xs font-black text-purple-950 block">
                          {tenant.keysDelivered}
                        </span>
                        <span className="text-[10px] text-purple-700">Remises à l'entrée</span>
                      </div>
                    </div>

                    {/* Inventory Photos Gallery */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
                        Photos Horodatées de l’Inventaire d’Entrée
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {inventoryPhotos.map((photo, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden group hover:border-brand-500 transition-colors"
                          >
                            <div className="relative h-36 overflow-hidden">
                              <img
                                src={photo.image}
                                alt={photo.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-white text-[10px] font-mono font-bold backdrop-blur-sm">
                                {photo.date}
                              </span>
                            </div>
                            <div className="p-3.5 space-y-1">
                              <h5 className="font-bold text-xs text-slate-900">{photo.title}</h5>
                              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                                {photo.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SOUS-SECTION 2 : MON BAILLEUR & GESTIONNAIRE */}
              {(bailSubTab === 'tout' || bailSubTab === 'bailleur') && (
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black">
                        <Building2 className="w-6 h-6 text-brand-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-lg text-slate-900">
                            {tenant.landlord.name}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Bailleur Officiel
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Représenté par <strong>{tenant.landlord.contactPerson}</strong> ({tenant.landlord.role})
                        </p>
                      </div>
                    </div>

                    {/* Direct WhatsApp CTA Button */}
                    <a
                      href={`https://wa.me/${tenant.landlord.whatsapp}?text=Bonjour%20M.%20Diallo,%20je%20suis%20Koffi%20Mensah%20de%20la%20Résidence%20Les%20Cocotiers%20(Appt%20A3).`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-md shadow-emerald-500/25 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Contacter sur WhatsApp</span>
                    </a>
                  </div>

                  {/* Coordonnées & IFU */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Téléphone Direct
                      </span>
                      <a
                        href={`tel:${tenant.landlord.phone}`}
                        className="text-xs font-black text-slate-900 hover:text-brand-600 mt-1 flex items-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{tenant.landlord.phone}</span>
                      </a>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Email Professionnel
                      </span>
                      <a
                        href={`mailto:${tenant.landlord.email}`}
                        className="text-xs font-black text-slate-900 hover:text-brand-600 mt-1 flex items-center gap-1.5 truncate"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{tenant.landlord.email}</span>
                      </a>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Numéro IFU Fiscal
                      </span>
                      <span className="text-xs font-mono font-black text-slate-900 mt-1 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{tenant.landlord.ifu}</span>
                      </span>
                    </div>
                  </div>

                  {/* Payment Accounts Guide */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-brand-500" />
                      <span>Comptes Officiels pour le Règlement du Loyer</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-blue-600 block">Wave Mobile Money</span>
                        <strong className="text-slate-900 block mt-0.5">{tenant.landlord.paymentMethods.wave}</strong>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-amber-600 block">MTN Mobile Money</span>
                        <strong className="text-slate-900 block mt-0.5">{tenant.landlord.paymentMethods.mtn}</strong>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] font-bold text-emerald-600 block">Virement Bancaire (BOA)</span>
                        <strong className="text-slate-900 block mt-0.5 font-mono text-[11px] truncate">
                          {tenant.landlord.paymentMethods.bank}
                        </strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================================== */}
          {/* ONGLET 4 : PASSEPORT SOLVABILITÉ                                    */}
          {/* ==================================================================== */}
          {activeTab === 'solvabilite' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft space-y-6 animate-in fade-in duration-200">
              <div>
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block mb-1">
                  Mon Profil Locatif Certifié
                </span>
                <h3 className="font-black text-2xl text-slate-900">
                  Passeport de Solvabilité & Antécédents
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                  Vos règlements à l’heure génèrent un historique valorisable qui vous permet de trouver votre prochain logement sans caution exorbitante.
                </p>
              </div>

              {/* Score Showcase */}
              <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 to-tealAccent-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-100 block">
                    Score de Ponctualité Global
                  </span>
                  <div className="text-5xl font-black mt-1">
                    96 <span className="text-base text-emerald-100 font-bold">/ 100</span>
                  </div>
                  <p className="text-xs text-emerald-100 mt-1.5">
                    100% de vos loyers ont été réglés dans les délais sur 22 mois consécutifs.
                  </p>
                </div>

                <div className="px-5 py-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white text-xs font-black border border-white/20 self-start sm:self-auto">
                  Badge Officiel : EXCELLENT PAYEUR
                </div>
              </div>

              {/* Privacy & Consent Toggle (Core Architectural Requirement) */}
              <div className="p-6 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-slate-900">
                        Consentement de Partage Inter-Bailleurs
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed mt-1 max-w-xl">
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
                    className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                      consentGranted ? 'bg-brand-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white transition-transform ${
                        consentGranted ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div className="text-xs text-slate-500 pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span>
                    Statut actuel :{' '}
                    <strong className={consentGranted ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
                      {consentGranted ? 'Partage actif (Valable jusqu’au 31/12/2026)' : 'Partage révoqué'}
                    </strong>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Conforme aux réglementations régionales de protection des données UEMOA
                  </span>
                </div>
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
                <Smartphone className="w-5 h-5 text-brand-400" />
                <h3 className="font-extrabold text-sm">
                  Déclarer un Paiement de Loyer
                </h3>
              </div>
              <button
                onClick={() => setDeclarationModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeclarePayment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Moyen de paiement utilisé *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeclaredMethod('wave')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center ${
                      declaredMethod === 'wave'
                        ? 'border-brand-500 bg-brand-50 text-brand-600 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    Wave Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeclaredMethod('mtn')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center ${
                      declaredMethod === 'mtn'
                        ? 'border-brand-500 bg-brand-50 text-brand-600 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    MTN Mobile
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeclaredMethod('virement')}
                    className={`py-2 px-3 rounded-xl border font-bold text-center ${
                      declaredMethod === 'virement'
                        ? 'border-brand-500 bg-brand-50 text-brand-600 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    Virement BOA
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Montant versé (FCFA) *
                  </label>
                  <input
                    type="number"
                    value={declaredAmount}
                    onChange={(e) => setDeclaredAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Réf. Transaction / SMS *
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
