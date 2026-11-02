'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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
  Wrench,
  PenTool,
  Send,
  Trash2,
  Image as ImageIcon,
  ZoomIn,
  Ban,
  RotateCcw,
  Search,
  Filter,
  ArrowUpDown,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { ReceiptModal } from '@/components/dashboard/ReceiptModal';
import { PaymentTransaction } from '@/lib/types';
import { generateLeasePDF, generateInspectionPDF } from '@/lib/export/pdf-download';
import { LeaseService, Lease } from '@/lib/services/lease-service';
import { TenantSignLeaseModal } from '@/components/leases/TenantSignLeaseModal';
import { IncidentService, ReportedIncident } from '@/lib/services/incident-service';
import { MONTHS_OF_YEAR } from '@/lib/services/payment-service';
import { notifyAction, notifySave } from '@/lib/notifications/action-notifier';

const ISSUE_SAMPLE_PHOTOS = [
  {
    label: 'Fuite robinet / lavabo',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Climatiseur / Split',
    url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Disjoncteur / Électricité',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Serrure / Poignée',
    url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop&q=80',
  },
];

function TenantPortalContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { switchSpace } = useSpace();

  // Primary Tab state: 'accueil' (Mon Logement), 'quittances' (Mes Quittances & Reçus), 'bail' (Mon Bail & Contrat), 'solvabilite' (Passeport)
  const [activeTab, setActiveTab] = useState<'accueil' | 'quittances' | 'bail' | 'solvabilite'>('accueil');

  // Sub-tab inside "Mon Bail & Contrat" to switch between Bail & État des Lieux et Mon Bailleur
  const [bailSubTab, setBailSubTab] = useState<'tout' | 'bail_etat' | 'bailleur'>('tout');

  const [declarationModalOpen, setDeclarationModalOpen] = useState(false);
  const [reportIssueModalOpen, setReportIssueModalOpen] = useState(false);
  const [issueCategory, setIssueCategory] = useState('Plomberie / Fuite d’eau');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueUrgency, setIssueUrgency] = useState<'normale' | 'urgente' | 'critique'>('normale');

  // Photos de la panne / incident
  const [issuePhotos, setIssuePhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
  ]);
  const [issueUrlInput, setIssueUrlInput] = useState('');
  const [showIssueUrlInput, setShowIssueUrlInput] = useState(false);
  const issueFileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewIncidentPhoto, setPreviewIncidentPhoto] = useState<string | null>(null);

  // Historique des incidents déclarés synchronisé avec le service partagé
  const [reportedIncidents, setReportedIncidents] = useState<ReportedIncident[]>([]);

  useEffect(() => {
    const loadIncidents = () => {
      setReportedIncidents(IncidentService.getIncidents());
    };
    loadIncidents();
    window.addEventListener('locagestion:incidents_updated', loadIncidents);
    window.addEventListener('storage', loadIncidents);
    return () => {
      window.removeEventListener('locagestion:incidents_updated', loadIncidents);
      window.removeEventListener('storage', loadIncidents);
    };
  }, []);

  const [selectedReceipt, setSelectedReceipt] = useState<PaymentTransaction | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleIssueFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setIssuePhotos((prev) => [...prev, uploadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const handleSubmitIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const photoCount = issuePhotos.length;

    IncidentService.addIncident({
      category: issueCategory,
      urgency: issueUrgency,
      description: issueDesc,
      photos: issuePhotos,
      tenantName: 'Koffi Mensah',
      tenantPhone: '+229 97 00 11 22',
      tenantEmail: 'koffi.mensah@fintech-africa.com',
      property: tenant.property,
      unit: tenant.unit,
      status: 'en_attente',
    });

    setReportedIncidents(IncidentService.getIncidents());
    setReportIssueModalOpen(false);
    setIssuePhotos([]);
    setIssueDesc('');
    const issueMsg = `Incident (${issueCategory})${photoCount > 0 ? ` avec ${photoCount} photo(s)` : ''} transmis instantanément au bailleur ! Prise en charge sous 24h.`;
    showToast(issueMsg);
    notifySave(issueMsg, 'Panne signalée avec succès !');
  };

  const searchParams = useSearchParams();

  // Sync search param & hash with active tab & actions
  useEffect(() => {
    if (searchParams) {
      const queryTab = searchParams.get('tab');
      const action = searchParams.get('action');
      if (queryTab === 'quittances' || queryTab === 'bail' || queryTab === 'solvabilite' || queryTab === 'accueil') {
        setActiveTab(queryTab as any);
      } else if (!queryTab && typeof window !== 'undefined' && !window.location.hash) {
        setActiveTab('accueil');
      }
      if (action === 'declare_payment' || action === 'declare') {
        setDeclarationModalOpen(true);
      } else if (action === 'report_issue' || action === 'incident') {
        setReportIssueModalOpen(true);
      }
    }
  }, [searchParams]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const updateFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        const queryTab = params.get('tab');
        const action = params.get('action');
        const hash = window.location.hash.replace('#', '');
        const target = queryTab || hash;
        if (target === 'quittances' || target === 'bail' || target === 'solvabilite' || target === 'accueil') {
          setActiveTab(target as any);
        }
        if (action === 'declare_payment' || action === 'declare') {
          setDeclarationModalOpen(true);
        } else if (action === 'report_issue' || action === 'incident') {
          setReportIssueModalOpen(true);
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
  const [pendingLease, setPendingLease] = useState<Lease | null>(null);
  const [currentLease, setCurrentLease] = useState<Lease | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  const checkLeases = () => {
    const pl = LeaseService.getPendingLeaseForTenant('Koffi Mensah');
    setPendingLease(pl || null);

    const allLeases = LeaseService.getLeases();
    const myLease = allLeases.find(
      (l) =>
        l.id === 'BAIL-2025-089' ||
        l.tenant.toLowerCase().includes('koffi') ||
        (pl && l.id === pl.id)
    );
    setCurrentLease(myLease || null);
  };

  useEffect(() => {
    checkLeases();
    const handleUpdate = () => checkLeases();
    window.addEventListener('locagestion:leases_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('locagestion:leases_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const [consentGranted, setConsentGranted] = useState(true);
  const [declaredPeriod, setDeclaredPeriod] = useState('Novembre 2026');
  const [declaredAmount, setDeclaredAmount] = useState('220000');
  const [declaredMethod, setDeclaredMethod] = useState('wave');
  const [declaredRef, setDeclaredRef] = useState('WAVE-TX-984210');

  const [proofFile, setProofFile] = useState<{ name: string; size: string; preview?: string } | null>(null);
  const proofFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const sizeKB = Math.round(file.size / 1024);
    const sizeStr = sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} Mo` : `${sizeKB} Ko`;
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProofFile({
          name: file.name,
          size: sizeStr,
          preview: event.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    } else {
      setProofFile({
        name: file.name,
        size: sizeStr,
      });
    }
    e.target.value = '';
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
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

  const DEFAULT_TENANT_RECEIPTS: PaymentTransaction[] = [
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

  const [receiptsList, setReceiptsList] = useState<PaymentTransaction[]>(DEFAULT_TENANT_RECEIPTS);

  // Filtres de date & tri pour "Mes Quittances & Reçus de Loyer"
  const [receiptDatePreset, setReceiptDatePreset] = useState<'all' | '2026' | 'this_month' | 'last_month' | 'last_3_months'>('all');
  const [receiptSelectedMonth, setReceiptSelectedMonth] = useState<string>('all');
  const [receiptSortOrder, setReceiptSortOrder] = useState<'desc' | 'asc'>('desc');
  const [receiptSearchTerm, setReceiptSearchTerm] = useState<string>('');

  const parseFrDate = (dateStr?: string) => {
    if (!dateStr) return 0;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
    }
    const d = new Date(dateStr).getTime();
    return isNaN(d) ? 0 : d;
  };

  const filteredReceipts = receiptsList
    .filter((rec) => {
      // 1. Recherche textuelle
      if (receiptSearchTerm.trim()) {
        const q = receiptSearchTerm.toLowerCase();
        const matchesQuery =
          rec.receiptNumber.toLowerCase().includes(q) ||
          rec.period.toLowerCase().includes(q) ||
          rec.paymentDate.toLowerCase().includes(q) ||
          (rec.method && rec.method.toLowerCase().includes(q)) ||
          rec.amount.toString().includes(q);
        if (!matchesQuery) return false;
      }

      // 2. Mois spécifique sélectionné
      if (receiptSelectedMonth !== 'all') {
        if (rec.period !== receiptSelectedMonth) return false;
      }

      // 3. Preset de date
      if (receiptDatePreset === '2026') {
        return rec.period.includes('2026') || rec.paymentDate.includes('2026');
      }
      if (receiptDatePreset === 'this_month') {
        return rec.period.toLowerCase().includes('novembre') || rec.paymentDate.includes('/11/');
      }
      if (receiptDatePreset === 'last_month') {
        return rec.period.toLowerCase().includes('octobre') || rec.paymentDate.includes('/10/');
      }
      if (receiptDatePreset === 'last_3_months') {
        const m = rec.period.toLowerCase();
        return m.includes('novembre') || m.includes('octobre') || m.includes('septembre');
      }

      return true;
    })
    .sort((a, b) => {
      const timeA = parseFrDate(a.paymentDate);
      const timeB = parseFrDate(b.paymentDate);
      return receiptSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  useEffect(() => {
    const loadReceipts = () => {
      if (typeof window !== 'undefined') {
        try {
          const saved = localStorage.getItem('locagestion:declared_payments');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setReceiptsList(parsed);
            }
          }
        } catch (err) {
          console.error('Erreur lecture paiements déclarés:', err);
        }
      }
    };
    loadReceipts();
    window.addEventListener('locagestion:payments_updated', loadReceipts);
    window.addEventListener('storage', loadReceipts);
    return () => {
      window.removeEventListener('locagestion:payments_updated', loadReceipts);
      window.removeEventListener('storage', loadReceipts);
    };
  }, []);

  const handleDeclarePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseInt(declaredAmount) || tenant.monthlyRent;
    const dateStr = new Date().toLocaleDateString('fr-FR');
    const newTx: PaymentTransaction = {
      id: `decl-${Date.now()}`,
      receiptNumber: `DEC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      tenantId: 'ten-01',
      tenantName: tenant.name,
      tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
      tenantPhone: tenant.phone,
      propertyName: tenant.property,
      unitNumber: tenant.unit,
      amount: numAmount,
      expectedAmount: tenant.monthlyRent,
      period: declaredPeriod,
      paymentDate: dateStr,
      method: declaredMethod as any,
      status: 'paye',
      isVerified: false,
    };

    const updated = [newTx, ...receiptsList];
    setReceiptsList(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('locagestion:declared_payments', JSON.stringify(updated));
      } catch (err) {
        console.error('Erreur sauvegarde paiement:', err);
      }
    }

    // Alerter le bailleur via le service partagé
    LeaseService.addLandlordNotification({
      id: `notif-pay-${Date.now()}`,
      title: `Paiement déclaré par ${tenant.name}`,
      message: `Déclaration de loyer de ${formatFCFA(numAmount)} pour la période ${declaredPeriod} via ${declaredMethod.toUpperCase()} (Réf: ${declaredRef || 'Non spécifiée'}).`,
      type: 'payment_declared',
      read: false,
      timestamp: `À l'instant`,
      tenantName: tenant.name,
      unit: tenant.unit,
      property: tenant.property,
      paymentId: newTx.id,
    });

    setDeclarationModalOpen(false);
    setProofFile(null);
    const payMsg = `Déclaration de ${formatFCFA(numAmount)} (${declaredPeriod}) transmise avec succès au bailleur ! Quittance émise dès validation.`;
    showToast(payMsg);
    notifySave(payMsg, 'Paiement déclaré avec succès !');

    handleTabChange('quittances');
  };

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
              setReportIssueModalOpen(true);
            }
          }}
        />

        {/* Main Tenant Container */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-5xl mx-auto w-full">
          {/* Top Segmented Navigation Tabs */}
          {/* Sur Desktop (lg+) : affichage des 4 onglets complets */}
          {/* Sur Mobile (<lg) : les 3 onglets "Mes Quittances & Reçus", "Mon Bail & Contrat" et "Passeport Solvabilité" sont déplacés dans le Menu Résident (Sidebar) */}
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
              className={`hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'quittances'
                  ? 'bg-slate-900 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Mes Quittances & Reçus</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'quittances' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {receiptsList.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('bail')}
              className={`hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'bail'
                  ? 'bg-slate-900 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Mon Bail & Contrat</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('solvabilite')}
              className={`hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'solvabilite'
                  ? 'bg-slate-900 text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Passeport Solvabilité</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                  activeTab === 'solvabilite' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                96/100
              </span>
            </button>
          </div>

          {/* Bandeau d'indication sur Mobile lorsque l'une des rubriques du Menu Résident est affichée */}
          {activeTab !== 'accueil' && (
            <div className="lg:hidden flex items-center justify-between p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-sm animate-in fade-in duration-150">
              <div className="flex items-center gap-3 min-w-0">
                <span className="p-2 rounded-xl text-white shrink-0 shadow-sm bg-slate-900">
                  {activeTab === 'quittances' && <Receipt className="w-4 h-4" />}
                  {activeTab === 'bail' && <FileText className="w-4 h-4" />}
                  {activeTab === 'solvabilite' && <ShieldCheck className="w-4 h-4" />}
                </span>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Menu Résident • Section Active
                  </span>
                  <span className="text-xs font-black text-slate-900 block truncate">
                    {activeTab === 'quittances' && 'Mes Quittances & Reçus'}
                    {activeTab === 'bail' && 'Mon Bail & Contrat'}
                    {activeTab === 'solvabilite' && 'Passeport Solvabilité'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTabChange('accueil')}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Mon Logement</span>
              </button>
            </div>
          )}

          {/* ==================================================================== */}
          {/* ONGLET 1 : ACCUEIL / MON LOGEMENT & LOYER                             */}
          {/* ==================================================================== */}
          {activeTab === 'accueil' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Bannière Bail Résilié / Logement dissocié */}
              {currentLease?.status === 'resilie' && (
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-rose-600 via-rose-700 to-rose-800 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 border border-rose-400 ring-4 ring-rose-500/20 animate-in slide-in-from-top-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                      <Ban className="w-6 h-6 text-white" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-black text-white">
                          Bail résilié • Logement actuellement dissocié
                        </h2>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white text-rose-900 shadow-xs font-bold">
                          Résiliation effective
                        </span>
                      </div>
                      <p className="text-xs text-rose-100 leading-relaxed max-w-2xl">
                        Le contrat de bail <strong>{currentLease.id}</strong> ({currentLease.unit}) a été résilié par votre bailleur{currentLease.resiliatedAt ? ` le ${currentLease.resiliatedAt}` : ''}.
                        Si votre bailleur a commis une fausse manœuvre, il dispose d'un bouton <strong>« Réactiver le bail »</strong> dans son espace pour rétablir votre contrat instantanément sans aucune démarche supplémentaire.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Bannière Bail en Attente de Signature Électronique */}
              {pendingLease && (
                <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 border border-amber-300 ring-4 ring-amber-500/20 animate-in slide-in-from-top-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 text-white flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                      <PenTool className="w-6 h-6 animate-bounce" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-black text-white">
                          Nouveau contrat de bail officiel reçu !
                        </h2>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-white text-amber-900 shadow-xs">
                          En attente de votre contresignature
                        </span>
                      </div>
                      <p className="text-xs text-amber-50 leading-relaxed max-w-xl">
                        Votre bailleur ({pendingLease.landlordSignature?.signedBy || 'Mamadou Diallo'})
                        a signé et vous a transmis le contrat de bail <strong>{pendingLease.id}</strong>{' '}
                        pour le lot <strong>{pendingLease.unit}</strong> ({formatFCFA(pendingLease.rent)}/mois).
                        Veuillez apposer votre signature électronique pour activer le bail.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSignModalOpen(true)}
                    className="py-3 px-6 rounded-2xl bg-white hover:bg-amber-50 text-amber-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer active:scale-95"
                  >
                    <PenTool className="w-4 h-4 text-amber-600" />
                    <span>Examiner & Contresigner</span>
                  </button>
                </div>
              )}

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
                      type="button"
                      onClick={() => setDeclarationModalOpen(true)}
                      className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs sm:text-sm font-black shadow-pink-glow active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>Déclarer un paiement de loyer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportIssueModalOpen(true)}
                      className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs sm:text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Wrench className="w-4 h-4 text-brand-300" />
                      <span>Signaler une panne</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Aperçu Rapide des Règlements & Bailleur */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Dernier Règlement Récent */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                          <Receipt className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">Dernière Quittance Émise</h4>
                          <span className="text-[10px] text-slate-400">Réf : {receiptsList[0]?.receiptNumber || 'QUITT-2026-1048'}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        receiptsList[0]?.isVerified
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : 'text-amber-700 bg-amber-50 border-amber-200'
                      }`}>
                        {receiptsList[0]?.isVerified ? 'Soldé ✓' : 'En validation ⏳'}
                      </span>
                    </div>

                    <div className="pt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Période concernée :</span>
                        <strong className="text-slate-900">{receiptsList[0]?.period || 'Octobre 2026'}</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Montant réglé :</span>
                        <strong className="text-emerald-700 font-black">{formatFCFA(receiptsList[0]?.amount || 220000)}</strong>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">Moyen de paiement :</span>
                        <span className="text-slate-700 font-medium">{receiptsList[0]?.method ? receiptsList[0].method.toUpperCase() : 'WAVE'} Mobile Money</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTabChange('quittances')}
                    className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200/60"
                  >
                    <span>Voir toutes les quittances ({receiptsList.length})</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Mon Bailleur & Contact Rapide */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                          <Building2 className="w-5 h-5 text-brand-400" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">{tenant.landlord.name}</h4>
                          <span className="text-[10px] text-slate-400">Bailleur & Gestionnaire Dédié</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                        {tenant.landlord.contactPerson}
                      </span>
                    </div>

                    <div className="pt-3 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Téléphone :</span>
                        <a href={`tel:${tenant.landlord.phone}`} className="font-bold text-slate-800 hover:text-brand-600">
                          {tenant.landlord.phone}
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Email :</span>
                        <span className="text-slate-700 font-medium truncate max-w-[180px]">{tenant.landlord.email}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Contrat :</span>
                        <span className="text-slate-800 font-mono font-bold">{tenant.leaseRef}</span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/${tenant.landlord.whatsapp}?text=Bonjour%20M.%20Diallo,%20je%20suis%20Koffi%20Mensah%20(Appt%20A3).`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Écrire sur WhatsApp au Bailleur</span>
                  </a>
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

              {/* Module Pannes & Interventions (Transféré dans l'espace dédié /incidents) */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center shrink-0 border border-brand-500/30">
                    <Wrench className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-white">
                        Pannes & Interventions Techniques
                      </h3>
                      {reportedIncidents.filter((i) => i.status !== 'resolu').length > 0 && (
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                          {reportedIncidents.filter((i) => i.status !== 'resolu').length} en cours
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Un problème de plomberie, climatiseur ou électricité ? Déclarez la panne avec photos ou suivez vos interventions dans l’espace dédié.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                  <Link
                    href="/incidents?action=new"
                    className="py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-pink-glow flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Signaler une panne</span>
                  </Link>
                  <Link
                    href="/incidents"
                    className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <span>Voir l’historique</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Artisans mandatés actifs pour le locataire */}
              {reportedIncidents.filter((i) => i.status !== 'resolu' && i.assignedTechnician).length > 0 && (
                <div className="space-y-3">
                  {reportedIncidents
                    .filter((i) => i.status !== 'resolu' && i.assignedTechnician)
                    .map((inc) => (
                      <div
                        key={inc.id}
                        className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 border border-blue-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                            <Wrench className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
                                Artisan Mandaté par le bailleur
                              </span>
                              <span className="text-xs font-bold text-slate-600">
                                {inc.assignedTechnician?.trade || 'Artisan Qualifié'}
                              </span>
                            </div>
                            <h4 className="font-black text-slate-900 text-sm sm:text-base mt-1">
                              {inc.assignedTechnician?.name}
                            </h4>
                            <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3.5 h-3.5 text-blue-600" />
                              <span>{inc.assignedTechnician?.phone}</span>
                              <span className="text-slate-400 font-normal">
                                • Dossier #{inc.id} ({inc.category})
                              </span>
                            </p>
                            {inc.resolutionNotes && (
                              <p className="text-[11px] text-slate-600 font-medium mt-1 bg-white/70 px-2.5 py-1 rounded-lg border border-blue-100 inline-block">
                                💬 Note : {inc.resolutionNotes}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                          <a
                            href={`tel:${inc.assignedTechnician?.phone.replace(/[^0-9+]/g, '')}`}
                            className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Appeler</span>
                          </a>
                          <a
                            href={`https://wa.me/${inc.assignedTechnician?.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Bonjour ${inc.assignedTechnician?.name},\n\nJe suis le locataire pour l'intervention #${inc.id} (${inc.category}) concernant le logement ${inc.unit}.\nQuand seriez-vous disponible pour intervenir ?\n\nMerci.`
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                            className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </a>
                        </div>
                      </div>
                    ))}
                </div>
              )}
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
                  <span>Déclarer un paiement</span>
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

              {/* Barre de Recherche, Filtres de Date & Tri Facile */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  {/* Recherche */}
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={receiptSearchTerm}
                      onChange={(e) => setReceiptSearchTerm(e.target.value)}
                      placeholder="Rechercher par référence, mois, montant..."
                      className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                    />
                    {receiptSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setReceiptSearchTerm('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Sélecteur de mois spécifique */}
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <select
                        value={receiptSelectedMonth}
                        onChange={(e) => setReceiptSelectedMonth(e.target.value)}
                        className="py-2 pl-3 pr-8 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs cursor-pointer"
                      >
                        <option value="all">Tous les mois</option>
                        {MONTHS_OF_YEAR.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Bouton de Tri Chronologique */}
                    <button
                      type="button"
                      onClick={() => setReceiptSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                      className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
                      title="Changer l'ordre de tri"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{receiptSortOrder === 'desc' ? 'Plus récent ↓' : 'Plus ancien ↑'}</span>
                    </button>
                  </div>
                </div>

                {/* Filtres Rapides (Presets de date) */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                    <Filter className="w-3 h-3 text-emerald-600" />
                    <span>Filtre date :</span>
                  </span>

                  {[
                    { key: 'all', label: 'Toutes les dates' },
                    { key: 'this_month', label: 'Ce mois-ci (Novembre)' },
                    { key: 'last_month', label: 'Mois dernier (Octobre)' },
                    { key: 'last_3_months', label: '3 derniers mois' },
                    { key: '2026', label: 'Année 2026' },
                  ].map((preset) => (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => {
                        setReceiptDatePreset(preset.key as any);
                        setReceiptSelectedMonth('all');
                      }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        receiptDatePreset === preset.key && receiptSelectedMonth === 'all'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}

                  {(receiptSearchTerm || receiptDatePreset !== 'all' || receiptSelectedMonth !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptSearchTerm('');
                        setReceiptDatePreset('all');
                        setReceiptSelectedMonth('all');
                      }}
                      className="ml-auto text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Réinitialiser</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Receipts Table */}
              <div className="divide-y divide-slate-100">
                {filteredReceipts.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-700">Aucune quittance trouvée pour cette période</h4>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Modifiez votre filtre de date ou réinitialisez les critères pour afficher toutes vos quittances.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setReceiptSearchTerm('');
                        setReceiptDatePreset('all');
                        setReceiptSelectedMonth('all');
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Afficher toutes les quittances
                    </button>
                  </div>
                ) : (
                  filteredReceipts.map((rec) => (
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
                          <span>Payé le {rec.paymentDate} via {rec.method ? rec.method.toUpperCase() : 'WAVE'}</span>
                          <span>•</span>
                          <span className="text-emerald-600 font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" />
                            {rec.isVerified ? 'Certifié QR Code' : 'Enregistré'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 block">
                          {formatFCFA(rec.amount)}
                        </span>
                        {rec.isVerified ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Soldé ✓
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                            En validation ⏳
                          </span>
                        )}
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
                )))}
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
                  {/* Contrat en Attente de Signature si présent */}
                  {pendingLease && (
                    <div className="bg-gradient-to-br from-amber-50 to-amber-100/60 rounded-3xl p-6 sm:p-7 border-2 border-amber-300 shadow-md space-y-4 ring-2 ring-amber-400/30">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-amber-200">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                            <PenTool className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-black text-base text-slate-900">
                                Nouveau Contrat de Bail à Contresigner
                              </h3>
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                                Requis
                              </span>
                            </div>
                            <span className="text-[11px] text-amber-900 font-medium">
                              Transmis par votre bailleur le {pendingLease.transmittedAt || '01/11/2026'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsSignModalOpen(true)}
                          className="py-2.5 px-5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                        >
                          <PenTool className="w-4 h-4" />
                          <span>Contresigner ce Bail</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Réf. & Logement
                          </span>
                          <span className="text-xs font-black text-slate-900 block mt-1">
                            {pendingLease.id}
                          </span>
                          <span className="text-[11px] text-slate-600 block">
                            {pendingLease.unit} ({pendingLease.property})
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Loyer & Caution
                          </span>
                          <span className="text-xs font-black text-brand-600 block mt-1">
                            {formatFCFA(pendingLease.rent)} / mois
                          </span>
                          <span className="text-[11px] text-slate-600 block">
                            Caution : {formatFCFA(pendingLease.deposit || pendingLease.rent * 2)}
                          </span>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white/90 border border-amber-200">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            État des signatures
                          </span>
                          <span className="text-xs font-bold text-emerald-700 block mt-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Bailleur : Signé</span>
                          </span>
                          <span className="text-[11px] text-amber-700 font-bold block flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Locataire : En attente</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Contrat de Bail Card */}
                  <div className={`rounded-3xl p-6 sm:p-7 border shadow-soft space-y-5 ${
                    currentLease?.status === 'resilie'
                      ? 'bg-rose-50/30 border-rose-200'
                      : 'bg-white border-slate-200/80'
                  }`}>
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2.5">
                        <FileText className={`w-5 h-5 ${currentLease?.status === 'resilie' ? 'text-rose-600' : 'text-brand-600'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-base text-slate-900">
                              Contrat de Bail d’Habitation Certifié
                            </h3>
                            {currentLease?.status === 'resilie' ? (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                <Ban className="w-3 h-3 text-rose-600" />
                                <span>Bail Résilié • Dissocié</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Actif & Conforme</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            Réf : {currentLease?.id || tenant.leaseRef} • Signé électroniquement le {currentLease?.startDate || tenant.leaseStartDate}
                            {currentLease?.resiliatedAt && ` • Résilié le ${currentLease.resiliatedAt}`}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          generateLeasePDF({
                            id: currentLease?.id || tenant.leaseRef,
                            tenantName: tenant.name,
                            tenantPhone: tenant.phone,
                            tenantEmail: tenant.email,
                            propertyName: tenant.property,
                            unit: tenant.unit,
                            rent: tenant.monthlyRent,
                            deposit: tenant.deposit,
                            startDate: currentLease?.startDate || tenant.leaseStartDate,
                          });
                          showToast(`Contrat de bail officiel téléchargé en PDF !`);
                        }}
                        className="py-2.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center gap-2 shadow-pink-glow transition-all cursor-pointer"
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
                        onClick={() => {
                          generateInspectionPDF({
                            id: currentLease?.id || tenant.leaseRef,
                            tenantName: tenant.name,
                            propertyName: tenant.property,
                            unit: tenant.unit,
                            date: tenant.inventoryDate,
                            meterCashPower: tenant.meterCashPower,
                            meterWater: tenant.meterWater,
                            keysDelivered: tenant.keysDelivered,
                          });
                          showToast(`Procès-verbal d'état des lieux téléchargé en PDF officiel !`);
                        }}
                        className="py-2.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setDeclarationModalOpen(false)}
        >
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
                type="button"
                onClick={() => setDeclarationModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDeclarePayment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Moyen de paiement utilisé *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeclaredMethod('wave')}
                    className={`py-2 px-2.5 rounded-xl border font-bold text-center cursor-pointer transition-all ${
                      declaredMethod === 'wave'
                        ? 'border-brand-500 bg-brand-50 text-brand-600 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Wave Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeclaredMethod('mtn')}
                    className={`py-2 px-2.5 rounded-xl border font-bold text-center cursor-pointer transition-all ${
                      declaredMethod === 'mtn'
                        ? 'border-brand-500 bg-brand-50 text-brand-600 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    MTN Mobile
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeclaredMethod('moov')}
                    className={`py-2 px-2.5 rounded-xl border font-bold text-center cursor-pointer transition-all ${
                      declaredMethod === 'moov'
                        ? 'border-brand-500 bg-brand-50 text-brand-600 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Moov Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeclaredMethod('virement')}
                    className={`py-2 px-2.5 rounded-xl border font-bold text-center cursor-pointer transition-all ${
                      declaredMethod === 'virement'
                        ? 'border-brand-500 bg-brand-50 text-brand-600 ring-2 ring-brand-500/20'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Virement
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                  <span>Période concernée (Mois du loyer) *</span>
                  <span className="text-[10px] text-brand-600 font-bold bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                    {declaredPeriod}
                  </span>
                </label>
                <select
                  value={declaredPeriod}
                  onChange={(e) => setDeclaredPeriod(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                >
                  <optgroup label="Exercice 2026 (Année en cours)">
                    <option value="Novembre 2026">Novembre 2026 (Mois en cours)</option>
                    <option value="Octobre 2026">Octobre 2026</option>
                    <option value="Septembre 2026">Septembre 2026</option>
                    <option value="Août 2026">Août 2026</option>
                    <option value="Juillet 2026">Juillet 2026</option>
                    <option value="Juin 2026">Juin 2026</option>
                    <option value="Mai 2026">Mai 2026</option>
                    <option value="Avril 2026">Avril 2026</option>
                    <option value="Mars 2026">Mars 2026</option>
                    <option value="Février 2026">Février 2026</option>
                    <option value="Janvier 2026">Janvier 2026</option>
                    <option value="Décembre 2026">Décembre 2026</option>
                  </optgroup>
                  <optgroup label="Exercice 2025 (Arriérés)">
                    <option value="Décembre 2025">Décembre 2025</option>
                    <option value="Novembre 2025">Novembre 2025</option>
                    <option value="Octobre 2025">Octobre 2025</option>
                  </optgroup>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Montant versé (FCFA) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
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
                    required
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
                <input
                  type="file"
                  ref={proofFileInputRef}
                  onChange={handleProofUpload}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                {proofFile ? (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2.5">
                      {proofFile.preview ? (
                        <img
                          src={proofFile.preview}
                          alt="Reçu"
                          className="w-10 h-10 object-cover rounded-xl border border-emerald-300"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                          PDF
                        </div>
                      )}
                      <div>
                        <p className="text-xs font-bold text-emerald-950 truncate max-w-[200px]">
                          {proofFile.name}
                        </p>
                        <p className="text-[10px] text-emerald-700">
                          {proofFile.size} • Preuve jointe ✓
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProofFile(null)}
                      className="p-1.5 rounded-lg text-emerald-700 hover:text-emerald-900 hover:bg-emerald-100 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => proofFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer bg-slate-50"
                  >
                    <UploadCloud className="w-8 h-8 text-brand-500 mx-auto mb-1" />
                    <span className="font-bold text-slate-700 block">
                      Cliquer pour joindre une photo ou capture
                    </span>
                    <span className="text-[10px] text-slate-400">
                      PNG, JPG ou PDF (max 5 Mo)
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setDeclarationModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold shadow-pink-glow active:scale-95 transition-all cursor-pointer flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Envoyer la déclaration</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Signaler une Panne / Incident Technique */}
      {reportIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    Signaler un Incident / Panne
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Assistance technique & constat avec photos
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportIssueModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSubmitIssue}
              className="p-6 space-y-4 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Catégorie du problème *
                </label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="Plomberie / Fuite d’eau">🚰 Plomberie / Fuite d’eau</option>
                  <option value="Électricité / Compteur Cash Power">⚡ Électricité / Compteur Cash Power</option>
                  <option value="Climatisation / Split en panne">❄️ Climatisation / Split en panne</option>
                  <option value="Serrurerie / Porte bloquée">🔑 Serrurerie / Porte bloquée</option>
                  <option value="Infiltration d’eau / Toiture">🌧️ Infiltration d’eau / Toiture</option>
                  <option value="Autre demande technique">🛠️ Autre demande technique</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Degré d’urgence *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setIssueUrgency('normale')}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold text-center cursor-pointer transition-all ${
                      issueUrgency === 'normale'
                        ? 'border-brand-500 bg-brand-50 text-brand-700 font-extrabold ring-1 ring-brand-500'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Normale
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssueUrgency('urgente')}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold text-center cursor-pointer transition-all ${
                      issueUrgency === 'urgente'
                        ? 'border-amber-500 bg-amber-50 text-amber-700 font-extrabold ring-1 ring-amber-500'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Urgente
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssueUrgency('critique')}
                    className={`py-2 px-2 rounded-xl border text-[11px] font-bold text-center cursor-pointer transition-all ${
                      issueUrgency === 'critique'
                        ? 'border-rose-500 bg-rose-50 text-rose-700 font-extrabold ring-1 ring-rose-500'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Critique
                  </button>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Description détaillée du problème *
                </label>
                <textarea
                  rows={3}
                  required
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  placeholder="Ex: Le split du salon ne refroidit plus depuis hier soir, odeur d'humidité au démarrage..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {/* Photos de la Panne / Incident */}
              <div className="space-y-2.5 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-brand-500" />
                    <span>Photos constatées</span>
                    <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200">
                      {issuePhotos.length} photo{issuePhotos.length > 1 ? 's' : ''}
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Recommandé</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Ajoutez une ou plusieurs photos pour accélérer l’intervention du bailleur ou de l'artisan.
                </p>

                {/* Upload Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="file"
                    ref={issueFileInputRef}
                    onChange={handleIssueFileUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => issueFileInputRef.current?.click()}
                    className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95"
                  >
                    <Camera className="w-3.5 h-3.5 text-brand-400" />
                    <span>Prendre / Choisir des photos</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowIssueUrlInput(!showIssueUrlInput)}
                    className="py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                    <span>{showIssueUrlInput ? 'Masquer URL' : '+ Ajouter par lien URL'}</span>
                  </button>
                </div>

                {/* Champ URL optionnel */}
                {showIssueUrlInput && (
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200">
                    <input
                      type="url"
                      value={issueUrlInput}
                      onChange={(e) => setIssueUrlInput(e.target.value)}
                      placeholder="https://... (URL de l'image)"
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (issueUrlInput.trim()) {
                          setIssuePhotos((prev) => [...prev, issueUrlInput.trim()]);
                          setIssueUrlInput('');
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 transition-colors cursor-pointer shrink-0"
                    >
                      Ajouter
                    </button>
                  </div>
                )}

                {/* Exemples rapides de panne UEMOA */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wide">
                    Exemples rapides (1 clic) :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ISSUE_SAMPLE_PHOTOS.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (!issuePhotos.includes(sample.url)) {
                            setIssuePhotos((prev) => [...prev, sample.url]);
                          }
                        }}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 hover:border-brand-200 border border-slate-200 text-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Ajouter cette photo d'illustration"
                      >
                        <span>+ {sample.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Galerie des miniatures attachées */}
                {issuePhotos.length > 0 ? (
                  <div className="pt-2">
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                      {issuePhotos.map((photoUrl, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-200 group bg-slate-100 shadow-xs"
                        >
                          <img
                            src={photoUrl}
                            alt={`Photo panne ${idx + 1}`}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => setPreviewIncidentPhoto(photoUrl)}
                              className="p-1.5 rounded-lg bg-white/90 text-slate-900 hover:bg-white shadow-md transition-all cursor-pointer"
                              title="Agrandir la photo"
                            >
                              <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setIssuePhotos((prev) => prev.filter((_, i) => i !== idx))}
                              className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 shadow-md transition-all cursor-pointer"
                              title="Supprimer cette photo"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-slate-900/80 text-[9px] font-bold text-white group-hover:hidden">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 text-center">
                    <ImageIcon className="w-6 h-6 text-slate-300 mx-auto mb-1" />
                    <p className="text-[11px] text-slate-500 font-medium">
                      Aucune photo ajoutée pour l'instant (facultatif mais fortement recommandé)
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReportIssueModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 font-bold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold shadow-pink-glow flex items-center gap-1.5 cursor-pointer"
                >
                  <Wrench className="w-3.5 h-3.5" />
                  <span>Transmettre au bailleur ({issuePhotos.length} photo{issuePhotos.length > 1 ? 's' : ''})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox Modal de Prévisualisation Grand Format Photo Panne */}
      {previewIncidentPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setPreviewIncidentPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewIncidentPhoto(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Fermer la prévisualisation"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewIncidentPhoto}
              alt="Photo de la panne en grand format"
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/20 bg-black/40"
            />
            <p className="text-white/80 text-xs mt-3 font-medium text-center">
              Constat technique de l'incident • Photo transmise au bailleur
            </p>
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

      {/* Modal de Contresignature Électronique du Bail */}
      {pendingLease && (
        <TenantSignLeaseModal
          lease={pendingLease}
          tenantName={tenant.name}
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          onSignedSuccess={(updatedLease) => {
            const signMsg = `Bail ${updatedLease.id} contresigné avec succès ! Notification et email transmis au bailleur.`;
            showToast(signMsg);
            notifySave(signMsg, 'Bail contresigné avec succès !');
            checkLeases();
          }}
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

export default function TenantPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      }
    >
      <TenantPortalContent />
    </Suspense>
  );
}
