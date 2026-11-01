'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  TrendingUp,
  FileText,
  Camera,
  Receipt,
  UserCheck,
  Lock,
  Share2,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Eye,
  X,
  Copy,
  Send,
  Download,
  Ban,
  RotateCcw,
} from 'lucide-react';
import { formatFCFA, formatDateFR } from '@/lib/money/format';
import { UserSpace } from '@/lib/types';
import { ReceiptModal } from '@/components/dashboard/ReceiptModal';
import { WhatsAppReminderModal } from '@/components/dashboard/WhatsAppReminderModal';
import { QuickActionModal } from '@/components/dashboard/QuickActionModal';
import { ConfirmTerminateLeaseModal } from '@/components/leases/ConfirmTerminateLeaseModal';
import { generateLeasePDF } from '@/lib/export/pdf-download';
import { LeaseService, Lease } from '@/lib/services/lease-service';
import { notifyAction, notifySave, notifyDelete } from '@/lib/notifications/action-notifier';

interface TenantDetail {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string;
  email: string;
  phone: string;
  profession: string;
  employer: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  property: {
    name: string;
    unit: string;
    address: string;
    city: string;
  };
  financials: {
    monthlyRent: number;
    charges: number;
    deposit: number; // Caution en FCFA
    advanceMonths: number;
    paymentDay: number;
  };
  lease: {
    id: string;
    startDate: string;
    durationMonths: number;
    status: 'actif' | 'en_renouvellement' | 'resilie';
  };
  scoring: {
    score: number; // 0 à 100
    badge: 'Excellent' | 'Fiable' | 'À surveiller' | 'À risque';
    onTimeRate: number; // %
    averageDelayDays: number;
    maxDelayDays: number;
    criticalDelaysCount: number; // Retards > 15j
    finalArrears: number; // FCFA
    historyConsentGranted: boolean;
    consentExpiresAt?: string;
  };
  recentReceipts: {
    id: string;
    receiptNumber: string;
    period: string;
    date: string;
    amount: number;
    method: 'wave' | 'mtn_momo' | 'orange_money' | 'virement' | 'especes';
  }[];
  inspection: {
    date: string;
    generalState: string;
    photosCount: number;
    signedByBoth: boolean;
  };
}

const MOCK_TENANTS: TenantDetail[] = [
  {
    id: 'ten-01',
    firstName: 'Koffi',
    lastName: 'Mensah',
    fullName: 'Koffi Mensah',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    email: 'koffi.mensah@fintech-africa.com',
    phone: '+229 97 12 34 56',
    profession: 'Ingénieur DevOps Senior',
    employer: 'Fintech West Africa Hub',
    emergencyContact: {
      name: 'Dr. Mensah Paul',
      phone: '+229 95 11 22 33',
      relation: 'Frère aîné',
    },
    property: {
      name: 'Résidence Les Cocotiers',
      unit: 'Appt A3 (3 pièces)',
      address: 'Rue 340 Haie Vive',
      city: 'Cotonou, Bénin',
    },
    financials: {
      monthlyRent: 220000,
      charges: 30000,
      deposit: 660000,
      advanceMonths: 3,
      paymentDay: 5,
    },
    lease: {
      id: 'BAIL-2025-089',
      startDate: '01/01/2025',
      durationMonths: 12,
      status: 'actif',
    },
    scoring: {
      score: 96,
      badge: 'Excellent',
      onTimeRate: 100,
      averageDelayDays: 0,
      maxDelayDays: 2,
      criticalDelaysCount: 0,
      finalArrears: 0,
      historyConsentGranted: true,
      consentExpiresAt: '31/12/2026',
    },
    recentReceipts: [
      { id: 'pay-01', receiptNumber: 'QUITT-2026-1048', period: 'Octobre 2026', date: '30/10/2026', amount: 220000, method: 'wave' },
      { id: 'pay-01b', receiptNumber: 'QUITT-2026-0940', period: 'Septembre 2026', date: '02/09/2026', amount: 220000, method: 'wave' },
      { id: 'pay-01c', receiptNumber: 'QUITT-2026-0830', period: 'Août 2026', date: '01/08/2026', amount: 220000, method: 'virement' },
    ],
    inspection: {
      date: '01/01/2025',
      generalState: 'Excellent état neuf, climatisation révisée',
      photosCount: 8,
      signedByBoth: true,
    },
  },
  {
    id: 'ten-02',
    firstName: 'Amina',
    lastName: 'Diop',
    fullName: 'Amina Diop',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80',
    email: 'amina.diop@dakar-law.sn',
    phone: '+221 77 456 78 90',
    profession: 'Avocate au Barreau',
    employer: 'Cabinet Diop & Associés',
    emergencyContact: {
      name: 'Ousmane Diop',
      phone: '+221 78 999 88 77',
      relation: 'Père',
    },
    property: {
      name: 'Villa Émeraude',
      unit: 'Villa R+1 Ouest',
      address: 'Route des Almadies',
      city: 'Dakar, Sénégal',
    },
    financials: {
      monthlyRent: 350000,
      charges: 50000,
      deposit: 1050000,
      advanceMonths: 3,
      paymentDay: 1,
    },
    lease: {
      id: 'BAIL-2025-112',
      startDate: '15/03/2025',
      durationMonths: 24,
      status: 'actif',
    },
    scoring: {
      score: 94,
      badge: 'Excellent',
      onTimeRate: 98,
      averageDelayDays: 1,
      maxDelayDays: 3,
      criticalDelaysCount: 0,
      finalArrears: 0,
      historyConsentGranted: true,
      consentExpiresAt: '15/03/2027',
    },
    recentReceipts: [
      { id: 'pay-02', receiptNumber: 'QUITT-2026-1047', period: 'Octobre 2026', date: '29/10/2026', amount: 350000, method: 'orange_money' },
      { id: 'pay-02b', receiptNumber: 'QUITT-2026-0938', period: 'Septembre 2026', date: '28/09/2026', amount: 350000, method: 'orange_money' },
    ],
    inspection: {
      date: '15/03/2025',
      generalState: 'Très bon état général avec jardin entretenu',
      photosCount: 12,
      signedByBoth: true,
    },
  },
  {
    id: 'ten-04',
    firstName: 'Fatoumata',
    lastName: 'Traoré',
    fullName: 'Fatoumata Traoré',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80',
    email: 'fatou.traore@commerce-mali.com',
    phone: '+223 76 12 34 56',
    profession: 'Directrice Commerciale',
    employer: 'Import-Export Sahel',
    emergencyContact: {
      name: 'Moussa Traoré',
      phone: '+223 66 55 44 33',
      relation: 'Époux',
    },
    property: {
      name: 'Résidence Les Cocotiers',
      unit: 'Appt B1 (2 pièces)',
      address: 'Rue 340 Haie Vive',
      city: 'Cotonou, Bénin',
    },
    financials: {
      monthlyRent: 180000,
      charges: 20000,
      deposit: 540000,
      advanceMonths: 3,
      paymentDay: 5,
    },
    lease: {
      id: 'BAIL-2025-045',
      startDate: '01/06/2025',
      durationMonths: 12,
      status: 'actif',
    },
    scoring: {
      score: 62,
      badge: 'À surveiller',
      onTimeRate: 65,
      averageDelayDays: 14,
      maxDelayDays: 22,
      criticalDelaysCount: 2,
      finalArrears: 180000,
      historyConsentGranted: false,
    },
    recentReceipts: [
      { id: 'pay-04b', receiptNumber: 'QUITT-2026-0915', period: 'Septembre 2026', date: '22/09/2026', amount: 180000, method: 'wave' },
    ],
    inspection: {
      date: '01/06/2025',
      generalState: 'État d’usage conforme, 1 impact sur carrelage salon noté',
      photosCount: 6,
      signedByBoth: true,
    },
  },
  {
    id: 'ten-03',
    firstName: 'Jean-Yves',
    lastName: 'Kouassi',
    fullName: 'Jean-Yves Kouassi',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    email: 'jykouassi@abidjan-tech.ci',
    phone: '+225 07 89 12 34',
    profession: 'Designer UX Freelance',
    employer: 'Indépendant',
    emergencyContact: {
      name: 'Chantal Kouassi',
      phone: '+225 05 44 33 22',
      relation: 'Mère',
    },
    property: {
      name: 'Immeuble Palmier Royal',
      unit: 'Studio B12',
      address: 'Boulevard de France, Cocody',
      city: 'Abidjan, Côte d’Ivoire',
    },
    financials: {
      monthlyRent: 140000,
      charges: 15000,
      deposit: 420000,
      advanceMonths: 2,
      paymentDay: 5,
    },
    lease: {
      id: 'BAIL-2025-072',
      startDate: '01/02/2025',
      durationMonths: 12,
      status: 'actif',
    },
    scoring: {
      score: 82,
      badge: 'Fiable',
      onTimeRate: 85,
      averageDelayDays: 4,
      maxDelayDays: 8,
      criticalDelaysCount: 0,
      finalArrears: 50000,
      historyConsentGranted: true,
      consentExpiresAt: '01/02/2027',
    },
    recentReceipts: [
      { id: 'pay-03', receiptNumber: 'REC-2026-089', period: 'Octobre 2026', date: '28/10/2026', amount: 90000, method: 'mtn_momo' },
    ],
    inspection: {
      date: '01/02/2025',
      generalState: 'Studio repeint à neuf, chauffe-eau électrique fonctionnel',
      photosCount: 5,
      signedByBoth: true,
    },
  },
];

export default function TenantsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState<UserSpace>('bailleur');
  const [selectedTenant, setSelectedTenant] = useState<TenantDetail>(MOCK_TENANTS[0]);
  const [activeTab, setActiveTab] = useState<'apercu' | 'solvabilite' | 'bail' | 'edl' | 'paiements'>('apercu');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBadge, setFilterBadge] = useState<string>('all');

  // Modals state
  const [quickAction, setQuickAction] = useState<'new_lease' | 'new_payment' | 'new_property' | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<any | null>(null);
  const [reminderPayment, setReminderPayment] = useState<any | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [lastResiliatedId, setLastResiliatedId] = useState<string | null>(null);
  const [leaseToTerminate, setLeaseToTerminate] = useState<{
    id: string;
    tenant: string;
    property?: string;
    unit?: string;
    rent?: number;
  } | null>(null);

  useEffect(() => {
    const refreshLeases = () => {
      setLeases(LeaseService.getLeases());
    };
    refreshLeases();
    window.addEventListener('locagestion:leases_updated', refreshLeases);
    window.addEventListener('storage', refreshLeases);
    return () => {
      window.removeEventListener('locagestion:leases_updated', refreshLeases);
      window.removeEventListener('storage', refreshLeases);
    };
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTerminateTenantLease = (leaseId: string, tenantName: string, reason?: string) => {
    LeaseService.terminateLease(leaseId, reason);
    setLastResiliatedId(leaseId);
    setLeases(LeaseService.getLeases());
    const msg = `Bail ${leaseId} (${tenantName}) résilié. Le logement est dissocié.`;
    showToast(`⚠️ ${msg}`);
    notifyDelete(msg, 'Bail résilié !');
  };

  const handleReactivateTenantLease = (leaseId: string, tenantName: string) => {
    LeaseService.reactivateLease(leaseId);
    setLastResiliatedId(null);
    setLeases(LeaseService.getLeases());
    const msg = `Bail ${leaseId} (${tenantName}) réactivé avec succès ! Liaison rétablie sans autres démarches.`;
    showToast(`✅ ${msg}`);
    notifySave(msg, 'Bail réactivé avec succès !');
  };

  const filteredTenants = MOCK_TENANTS.filter((t) => {
    const matchesSearch =
      t.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.property.unit.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.includes(searchQuery);
    const matchesFilter = filterBadge === 'all' || t.scoring.badge === filterBadge;
    return matchesSearch && matchesFilter;
  });

  const getScoringBadgeUI = (badge: string) => {
    switch (badge) {
      case 'Excellent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Excellent (Score 90+)</span>
          </span>
        );
      case 'Fiable':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Fiable (Score 80-89)</span>
          </span>
        );
      case 'À surveiller':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>À surveiller</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>À risque</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSpace={activeSpace}
        onSpaceChange={setActiveSpace}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenQuickAction={(action) => setQuickAction(action)}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Bar: Title & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Répertoire des Locataires & Dossiers
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-brand-50 text-brand-600 border border-brand-200">
                  {MOCK_TENANTS.length} Fiches
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Fiches d’identité, baux actifs, solvabilité vérifiée et quittances dématérialisées.
              </p>
            </div>

            {/* Top Action */}
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-brand-400" />
              <span>+ Inviter un locataire</span>
            </button>
          </div>

          {/* Master-Detail 2 Columns Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (5 cols): Tenants List */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft space-y-4">
              {/* Search & Filter */}
              <div className="space-y-2.5">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par nom, résidence, téléphone..."
                    className="w-full pl-10 pr-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
                  {['all', 'Excellent', 'Fiable', 'À surveiller'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFilterBadge(f)}
                      className={`px-3 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                        filterBadge === f
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f === 'all' ? 'Tous' : f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tenants Vertical Cards */}
              <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                {filteredTenants.map((t) => {
                  const isSelected = selectedTenant.id === t.id;

                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTenant(t)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-brand-50/40 border-brand-500/50 shadow-sm ring-1 ring-brand-500/20'
                          : 'bg-white hover:bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative">
                          <img
                            src={t.avatar}
                            alt={t.fullName}
                            className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200"
                          />
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-white ${
                              t.scoring.score >= 85
                                ? 'bg-emerald-500'
                                : t.scoring.score >= 70
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs font-black text-slate-900 truncate">
                              {t.fullName}
                            </h3>
                            <span className="text-[10px] font-extrabold text-slate-400">
                              {t.scoring.score}/100
                            </span>
                          </div>
                          <span className="text-[11px] text-brand-600 font-bold block truncate mt-0.5">
                            {t.property.unit} • {t.property.name}
                          </span>
                          <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                            Loyer : {formatFCFA(t.financials.monthlyRent)}/mois
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isSelected
                              ? 'text-brand-600 translate-x-1'
                              : 'text-slate-300'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column (7 cols): Full Tenant File & Tabs */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
              {/* Tenant Header Banner */}
              <div className="p-6 bg-gradient-to-r from-slate-900 via-[#161a25] to-slate-900 text-white relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <img
                      src={selectedTenant.avatar}
                      alt={selectedTenant.fullName}
                      className="w-16 h-16 rounded-3xl object-cover ring-2 ring-brand-500/50 shadow-md"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black tracking-tight">
                          {selectedTenant.fullName}
                        </h2>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-500 text-white shadow-sm">
                          Bail Actif
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        {selectedTenant.profession} chez{' '}
                        <strong className="text-white">{selectedTenant.employer}</strong>
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-brand-400" />
                          {selectedTenant.phone}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Building className="w-3.5 h-3.5 text-tealAccent-400" />
                          {selectedTenant.property.unit}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Solvability score circle preview */}
                  <div className="p-3 bg-white/10 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center self-start sm:self-auto">
                    <span className="text-[10px] uppercase font-bold text-slate-300">
                      Score Solvabilité
                    </span>
                    <span className="text-2xl font-black text-white mt-0.5">
                      {selectedTenant.scoring.score}
                      <span className="text-xs text-brand-400 font-bold">/100</span>
                    </span>
                    <span className="text-[10px] font-black text-emerald-400 uppercase mt-0.5">
                      {selectedTenant.scoring.badge}
                    </span>
                  </div>
                </div>
              </div>

              {/* Segmented Navigation Tabs */}
              <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto text-xs font-bold">
                {[
                  { id: 'apercu', label: 'Aperçu & Coordonnées', icon: UserCheck },
                  { id: 'solvabilite', label: 'Score & Antécédents', icon: ShieldCheck },
                  { id: 'bail', label: 'Bail & Documents', icon: FileText },
                  { id: 'edl', label: 'État des Lieux', icon: Camera },
                  { id: 'paiements', label: 'Quittances & Règlements', icon: Receipt },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;

                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-black'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents */}
              <div className="p-6">
                {/* 1. Onglet Aperçu */}
                {activeTab === 'apercu' && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Financial info */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Modalités Financières
                        </span>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Loyer mensuel :</span>
                            <span className="font-extrabold text-slate-900">
                              {formatFCFA(selectedTenant.financials.monthlyRent)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Charges incluses :</span>
                            <span className="font-bold text-slate-700">
                              {formatFCFA(selectedTenant.financials.charges)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Dépôt de caution :</span>
                            <span className="font-extrabold text-brand-600">
                              {formatFCFA(selectedTenant.financials.deposit)} ({selectedTenant.financials.advanceMonths} mois)
                            </span>
                          </div>
                          <div className="flex justify-between pt-1 border-t border-slate-200">
                            <span className="text-slate-500">Jour d’exigibilité :</span>
                            <span className="font-extrabold text-slate-900">
                              Le {selectedTenant.financials.paymentDay} de chaque mois
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Emergency Contact */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                          Contact d’Urgence / Garant
                        </span>
                        <div className="space-y-1.5 text-xs">
                          <div className="font-extrabold text-slate-900">
                            {selectedTenant.emergencyContact.name}
                          </div>
                          <div className="text-slate-500">
                            Lien : <strong>{selectedTenant.emergencyContact.relation}</strong>
                          </div>
                          <div className="flex items-center gap-1.5 text-brand-600 font-bold mt-2">
                            <Phone className="w-3.5 h-3.5" />
                            {selectedTenant.emergencyContact.phone}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick WhatsApp Action Button */}
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <MessageCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-emerald-950">
                            Canal WhatsApp Direct
                          </h4>
                          <p className="text-[11px] text-emerald-800">
                            Ouvrir une conversation directe avec le locataire sur {selectedTenant.phone}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`https://wa.me/${selectedTenant.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all shrink-0 flex items-center gap-1.5"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Contacter</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* 2. Onglet Solvabilité & Historique Inter-Bailleurs */}
                {activeTab === 'solvabilite' && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    {/* Consent Warning Box */}
                    <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                      <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-extrabold text-blue-950 mb-0.5">
                          Protection des Données & Consentement RGPD / UEMOA
                        </h4>
                        <p className="leading-relaxed text-[11px] text-blue-800">
                          {selectedTenant.scoring.historyConsentGranted ? (
                            <>
                              Le locataire a consenti au partage de son dossier locatif objectif (ponctualité, retards, fin de bail). Ce consentement est temporaire (valable jusqu'au {selectedTenant.scoring.consentExpiresAt}) et révocable.
                            </>
                          ) : (
                            <>
                              Le locataire n’a pas encore activé le consentement de partage avec les tiers. Seules ses statistiques au sein de votre organisation sont visibles.
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Score Breakdown Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Taux à l’Heure
                        </span>
                        <span className="text-lg font-black text-emerald-600 mt-0.5 block">
                          {selectedTenant.scoring.onTimeRate}%
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Retard Moyen
                        </span>
                        <span className="text-lg font-black text-slate-900 mt-0.5 block">
                          {selectedTenant.scoring.averageDelayDays} jours
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Retard Max
                        </span>
                        <span className="text-lg font-black text-slate-900 mt-0.5 block">
                          {selectedTenant.scoring.maxDelayDays} jours
                        </span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">
                          Arriérés Actuels
                        </span>
                        <span className={`text-lg font-black mt-0.5 block ${selectedTenant.scoring.finalArrears > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {formatFCFA(selectedTenant.scoring.finalArrears)}
                        </span>
                      </div>
                    </div>

                    {/* Formula Explanation */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                      <h4 className="font-extrabold text-slate-900">
                        Formule Objective de Ponctualité OMEGA LOCAGESTION :
                      </h4>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Le score (0-100) est calculé par un moteur déterministe pur en fonction de la régularité des règlements, de l’absence d’incidents critiques (&gt; 15 jours) et du solde de sortie. Aucune appréciation subjective n’est enregistrée afin de prévenir tout risque de diffamation.
                      </p>
                    </div>
                  </div>
                )}

                {/* 3. Onglet Bail & Documents */}
                {activeTab === 'bail' && (() => {
                  const currentLeaseObj = leases.find((l) => l.id === selectedTenant.lease.id);
                  const isLeaseResiliated = currentLeaseObj?.status === 'resilie';

                  return (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div
                        className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isLeaseResiliated
                            ? 'bg-rose-50/50 border-rose-200 shadow-soft'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isLeaseResiliated
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : 'bg-brand-50 text-brand-600'
                            }`}
                          >
                            {isLeaseResiliated ? (
                              <Ban className="w-5 h-5 text-rose-600" />
                            ) : (
                              <FileText className="w-5 h-5" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900">
                                Contrat de Bail d’Habitation Scellé
                              </h4>
                              {isLeaseResiliated ? (
                                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                  <Ban className="w-3 h-3 text-rose-600" />
                                  <span>Bail Résilié • Logement dissocié</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Bail Actif</span>
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">
                              Réf: {selectedTenant.lease.id} • Prise d'effet le {selectedTenant.lease.startDate}
                              {currentLeaseObj?.resiliatedAt && ` • Résilié le ${currentLeaseObj.resiliatedAt}`}
                              {currentLeaseObj?.reactivatedAt && ` • Réactivé le ${currentLeaseObj.reactivatedAt}`}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          {/* Bouton Réactiver le bail sans démarches */}
                          {isLeaseResiliated ? (
                            <button
                              type="button"
                              onClick={() =>
                                handleReactivateTenantLease(
                                  selectedTenant.lease.id,
                                  selectedTenant.fullName
                                )
                              }
                              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                              title="Réactiver le bail sans autres démarches"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Réactiver le bail</span>
                            </button>
                          ) : (
                            /* Bouton Résilier le bail */
                            <button
                              type="button"
                              onClick={() =>
                                setLeaseToTerminate({
                                  id: selectedTenant.lease.id,
                                  tenant: selectedTenant.fullName,
                                  property: selectedTenant.property.name,
                                  unit: selectedTenant.property.unit,
                                  rent: selectedTenant.financials.monthlyRent,
                                })
                              }
                              className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                              title="Résilier ce contrat de bail et dissocier le logement"
                            >
                              <Ban className="w-3.5 h-3.5 text-rose-600" />
                              <span>Résilier le bail</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              generateLeasePDF({
                                id: selectedTenant.lease.id,
                                tenantName: selectedTenant.fullName,
                                tenantPhone: selectedTenant.phone,
                                tenantEmail: selectedTenant.email,
                                propertyName: selectedTenant.property.name,
                                unit: selectedTenant.property.unit,
                                rent: selectedTenant.financials.monthlyRent,
                                deposit: selectedTenant.financials.deposit,
                                startDate: selectedTenant.lease.startDate,
                              });
                              showToast(`Contrat de bail ${selectedTenant.lease.id} téléchargé en PDF officiel !`);
                            }}
                            className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold shadow-sm transition-all cursor-pointer"
                          >
                            Consulter (PDF)
                          </button>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                            <UserCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-900">
                              Pièce d’Identité Certifiée & IFU
                            </h4>
                            <span className="text-[11px] text-slate-400">
                              Passeport / CNI vérifié par le bailleur
                            </span>
                          </div>
                        </div>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Vérifié ✓
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {/* 4. Onglet État des Lieux */}
                {activeTab === 'edl' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-black text-slate-900">
                          État des Lieux d’Entrée
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          Date : {selectedTenant.inspection.date}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mb-3 bg-white p-3 rounded-xl border border-slate-200">
                        « {selectedTenant.inspection.generalState} »
                      </p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{selectedTenant.inspection.photosCount} photos horodatées annexées</span>
                        <span className="text-emerald-600 font-bold">
                          Contresigné par le locataire ✓
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. Onglet Quittances & Règlements */}
                {activeTab === 'paiements' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Quittances Émises ({selectedTenant.recentReceipts.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuickAction('new_payment')}
                        className="text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
                      >
                        + Encaisser une mensualité
                      </button>
                    </div>

                    {selectedTenant.recentReceipts.map((rec) => (
                      <div
                        key={rec.id}
                        className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 hover:bg-white transition-all cursor-pointer"
                        onClick={() =>
                          setReceiptPayment({
                            receiptNumber: rec.receiptNumber,
                            tenantName: selectedTenant.fullName,
                            tenantPhone: selectedTenant.phone,
                            propertyName: selectedTenant.property.name,
                            unitNumber: selectedTenant.property.unit,
                            amount: rec.amount,
                            period: rec.period,
                            paymentDate: rec.date,
                            method: rec.method,
                            status: 'paye',
                            isVerified: true,
                          })
                        }
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-black text-slate-900 block">
                              {rec.period}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              {rec.receiptNumber} • {rec.date}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 block">
                            {formatFCFA(rec.amount)}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold block">
                            Soldé (Wave)
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Inviter un Locataire */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-brand-400" />
                <h3 className="font-extrabold text-sm">
                  Inviter un Nouveau Locataire
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setShowInviteModal(false);
                const msg = `Lien d’invitation généré et envoyé à ${inviteName || 'nouveau locataire'} !`;
                showToast(msg);
                notifySave(msg, 'Locataire invité avec succès !');
              }}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nom complet du locataire *
                </label>
                <input
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Ex: Ibrahim Traoré"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Numéro WhatsApp / Téléphone *
                </label>
                <input
                  type="tel"
                  required
                  value={invitePhone}
                  onChange={(e) => setInvitePhone(e.target.value)}
                  placeholder="Ex: +229 97 00 00 00"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  Lien d'invitation sécurisé à usage unique :
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="https://site.omegafacture.app/invite/tok_8942abc"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText('https://site.omegafacture.app/invite/tok_8942abc');
                      showToast('Lien d’invitation copié dans le presse-papier !');
                    }}
                    className="py-1.5 px-3 rounded-lg bg-slate-900 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copier</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 font-bold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold shadow-pink-glow flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Envoyer l'invitation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification avec option Annuler l'erreur */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4.5 py-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5 max-w-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1">{toastMessage}</span>
          {lastResiliatedId && (
            <button
              type="button"
              onClick={() => {
                handleReactivateTenantLease(lastResiliatedId, selectedTenant.fullName);
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-md active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Annuler l'erreur / Réactiver</span>
            </button>
          )}
        </div>
      )}

      {/* Receipts Inspection Modal */}
      {receiptPayment && (
        <ReceiptModal
          payment={receiptPayment}
          onClose={() => setReceiptPayment(null)}
        />
      )}

      {/* Quick Action Modal */}
      {quickAction && (
        <QuickActionModal
          actionType={quickAction}
          onClose={() => setQuickAction(null)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}

      {/* Modale de Confirmation de Résiliation */}
      <ConfirmTerminateLeaseModal
        isOpen={!!leaseToTerminate}
        lease={leaseToTerminate}
        onClose={() => setLeaseToTerminate(null)}
        onConfirm={(reason) => {
          if (leaseToTerminate) {
            handleTerminateTenantLease(
              leaseToTerminate.id,
              leaseToTerminate.tenant,
              reason
            );
          }
          setLeaseToTerminate(null);
        }}
      />
    </div>
  );
}

