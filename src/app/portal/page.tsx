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
  BellRing,
  FileWarning,
  ArrowLeft,
  Copy,
  Bell,
  CalendarDays,
  Compass,
  Plus,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { ReceiptModal } from '@/components/dashboard/ReceiptModal';
import { PaymentTransaction } from '@/lib/types';
import { generateLeasePDF, generateInspectionPDF, generateNoticePDF } from '@/lib/export/pdf-download';
import { LeaseService, Lease } from '@/lib/services/lease-service';
import { NoticeService, Notice } from '@/lib/services/notice-service';
import { TenantNotificationService, TenantNotification } from '@/lib/services/tenant-notification-service';
import { TenantSignLeaseModal } from '@/components/leases/TenantSignLeaseModal';
import { TenantDepartureModal } from '@/components/portal/TenantDepartureModal';
import { InspectionModal } from '@/components/leases/InspectionModal';
import { InspectionService, InspectionData, InspectionPhoto } from '@/lib/services/inspection-service';
import { IncidentService, ReportedIncident } from '@/lib/services/incident-service';
import { MONTHS_OF_YEAR, PaymentService } from '@/lib/services/payment-service';
import { notifyAction, notifySave } from '@/lib/notifications/action-notifier';
import { Footer } from '@/components/layout/Footer';
import { SkeletonPortalDashboard } from '@/components/ui/SkeletonLoader';
import { areEmailsEqual, arePhoneNumbersEqual, isCanonicalJojoVog } from '@/lib/services/auth-service';
import { SyncService } from '@/lib/services/sync-service';

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
  const { user, switchSpace } = useSpace();

  // Primary Tab state: 'accueil' (Mon Logement), 'quittances' (Mes Quittances & Reçus), 'bail' (Mon Bail & Contrat), 'solvabilite' (Passeport), 'preavis' (Relances & Préavis)
  const [activeTab, setActiveTab] = useState<'accueil' | 'quittances' | 'bail' | 'solvabilite' | 'preavis'>('accueil');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Sub-tab inside "Mon Bail & Contrat" to switch between Bail & État des Lieux et Mon Bailleur
  const [bailSubTab, setBailSubTab] = useState<'tout' | 'bail_etat' | 'bailleur'>('tout');

  const [declarationModalOpen, setDeclarationModalOpen] = useState(false);
  const [reportIssueModalOpen, setReportIssueModalOpen] = useState(false);
  const [departureModalOpen, setDepartureModalOpen] = useState(false);

  // Préavis reçus ou émis pour le locataire
  const [tenantNotices, setTenantNotices] = useState<Notice[]>([]);

  useEffect(() => {
    const loadNotices = () => {
      setTenantNotices(NoticeService.getTenantNotices(user?.name || ''));
    };
    loadNotices();
    window.addEventListener('locagestion:notices_updated', loadNotices);
    window.addEventListener('storage', loadNotices);
    return () => {
      window.removeEventListener('locagestion:notices_updated', loadNotices);
      window.removeEventListener('storage', loadNotices);
    };
  }, [user]);
  const [issueCategory, setIssueCategory] = useState('Plomberie / Fuite d’eau');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueUrgency, setIssueUrgency] = useState<'normale' | 'urgente' | 'critique'>('normale');

  // Photos de la panne / incident (vide par défaut)
  const [issuePhotos, setIssuePhotos] = useState<string[]>([]);
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
      tenantName: user?.name || 'Locataire',
      tenantPhone: user?.phone || '',
      tenantEmail: user?.email || '',
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
      if (
        queryTab === 'quittances' ||
        queryTab === 'bail' ||
        queryTab === 'solvabilite' ||
        queryTab === 'preavis' ||
        queryTab === 'accueil'
      ) {
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
        if (
          target === 'quittances' ||
          target === 'bail' ||
          target === 'solvabilite' ||
          target === 'preavis' ||
          target === 'accueil'
        ) {
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

  const handleTabChange = (tab: 'accueil' | 'quittances' | 'bail' | 'solvabilite' | 'preavis') => {
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
  const [signingLease, setSigningLease] = useState<Lease | null>(null);
  const [currentLease, setCurrentLease] = useState<Lease | null>(null);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);

  // État des lieux & Photos (Lecture seule depuis l'espace bailleur)
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [selectedInspectionPhoto, setSelectedInspectionPhoto] = useState<InspectionPhoto | null>(null);
  const [inspectionData, setInspectionData] = useState<InspectionData>(() =>
    InspectionService.getInspectionByLeaseId('')
  );

  const [dismissedLeaseIds, setDismissedLeaseIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('locagestion:dismissed_pending_leases');
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  const handleDismissPendingBanner = (leaseId: string) => {
    setDismissedLeaseIds((prev) => {
      const updated = Array.from(new Set([...prev, leaseId]));
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('locagestion:dismissed_pending_leases', JSON.stringify(updated));
        } catch (e) {}
      }
      return updated;
    });
    setPendingLease(null);
  };

  const checkLeases = () => {
    const allLeases = LeaseService.getLeases();

    let dismissed: string[] = [];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('locagestion:dismissed_pending_leases');
        if (stored) dismissed = JSON.parse(stored);
      } catch (e) {}
    }

    // Recherche dynamique par paramètre d'URL (leaseId, tenant, code)
    let queryLeaseId: string | null = null;
    let queryTenant: string | null = null;
    let queryCode: string | null = null;
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      queryLeaseId = p.get('leaseId');
      queryTenant = p.get('tenant');
      queryCode = p.get('code');
    }

    let pl: Lease | undefined = undefined;
    if (queryLeaseId) {
      pl = allLeases.find((l) => l.id === queryLeaseId && l.status === 'en_attente_signature' && !l.signedByTenant && !dismissed.includes(l.id));
    }
    if (!pl && queryCode) {
      pl = allLeases.find((l) => l.invitationCode === queryCode && l.status === 'en_attente_signature' && !l.signedByTenant && !dismissed.includes(l.id));
    }
    if (!pl && queryTenant) {
      const tenantMatch = LeaseService.getPendingLeaseForTenant(queryTenant);
      if (tenantMatch && !tenantMatch.signedByTenant && !dismissed.includes(tenantMatch.id)) {
        pl = tenantMatch;
      }
    }
    const isLeaseMatchingUser = (l: Lease) => {
      if (!user || !l) return false;
      // 1. Profil canonique scellé Jojo VOG
      if (
        isCanonicalJojoVog(user.email || user.id || user.phone, user.matricule, user.name) &&
        isCanonicalJojoVog(l.tenantEmail || l.tenantId || l.tenantPhone, (l as any).matricule, l.tenant)
      ) {
        return true;
      }
      // 2. Email exact / normalisé
      if (user.email && l.tenantEmail && areEmailsEqual(user.email, l.tenantEmail)) {
        return true;
      }
      // 3. User ID exact
      if (user.id && l.tenantId && user.id === l.tenantId) {
        return true;
      }
      // 4. Matricule unique
      if (user.matricule && (l as any).matricule && user.matricule === (l as any).matricule) {
        return true;
      }
      // 5. Téléphone normalisé
      if (user.phone && l.tenantPhone && arePhoneNumbersEqual(user.phone, l.tenantPhone)) {
        return true;
      }
      // 6. Nom exact
      if (user.name && l.tenant && user.name.trim().toLowerCase() === l.tenant.trim().toLowerCase()) {
        return true;
      }
      return false;
    };

    // Recherche stricte liée au locataire connecté (jamais de fuite sur le bail d'un tiers)
    if (!pl && user) {
      pl = allLeases.find(
        (l) =>
          l.status === 'en_attente_signature' &&
          !l.signedByTenant &&
          !dismissed.includes(l.id) &&
          isLeaseMatchingUser(l)
      );
    }

    setPendingLease(pl || null);

    const myLease = allLeases.find(
      (l) =>
        (pl && l.id === pl.id) ||
        (queryLeaseId && l.id === queryLeaseId) ||
        (user && isLeaseMatchingUser(l))
    );
    setCurrentLease(myLease || null);
  };

  useEffect(() => {
    checkLeases();

    // Déclencher une synchronisation immédiate Web <-> Mobile pour charger instantanément les baux du serveur
    SyncService.sync().then(() => {
      checkLeases();
    });

    const handleUpdate = () => checkLeases();
    window.addEventListener('locagestion:leases_updated', handleUpdate);
    window.addEventListener('locagestion:auth_changed', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('locagestion:leases_updated', handleUpdate);
      window.removeEventListener('locagestion:auth_changed', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [user]);

  useEffect(() => {
    const leaseId = currentLease?.id || pendingLease?.id || '';
    setInspectionData(InspectionService.getInspectionByLeaseId(leaseId));
  }, [currentLease, pendingLease]);

  useEffect(() => {
    const handleInspectionUpdate = () => {
      const leaseId = currentLease?.id || pendingLease?.id || '';
      setInspectionData(InspectionService.getInspectionByLeaseId(leaseId));
    };
    window.addEventListener('locagestion:inspections_updated', handleInspectionUpdate);
    return () => {
      window.removeEventListener('locagestion:inspections_updated', handleInspectionUpdate);
    };
  }, [currentLease, pendingLease]);

  const [consentGranted, setConsentGranted] = useState(true);

  // Configuration des mois futurs éligibles au paiement de loyers d'avance
  const AVAILABLE_FUTURE_MONTHS = [
    'Décembre 2026',
    'Janvier 2027',
    'Février 2027',
    'Mars 2027',
    'Avril 2027',
    'Mai 2027',
    'Juin 2027',
    'Juillet 2027',
    'Août 2027',
    'Septembre 2027',
    'Octobre 2027',
    'Novembre 2027',
    'Décembre 2027',
  ];

  // Mode de déclaration de loyer (Mois en cours, Loyers d'avance seuls, ou Groupé en cours + avance)
  const [paymentType, setPaymentType] = useState<'current' | 'advance' | 'both'>('current');
  const [selectedAdvanceMonths, setSelectedAdvanceMonths] = useState<string[]>([]);
  const [declaredPeriod, setDeclaredPeriod] = useState('Novembre 2026');
  const [declaredAmount, setDeclaredAmount] = useState('');
  const [declaredMethod, setDeclaredMethod] = useState('wave');
  const [declaredRef, setDeclaredRef] = useState('');

  useEffect(() => {
    if (currentLease && currentLease.rent) {
      setDeclaredAmount(String(currentLease.rent));
    }
  }, [currentLease]);

  // Notifications en temps réel dans l'espace locataire
  const [portalNotifs, setPortalNotifs] = useState<TenantNotification[]>([]);
  const [isNotifBannerDismissed, setIsNotifBannerDismissed] = useState(false);

  useEffect(() => {
    const loadNotifs = () => {
      setPortalNotifs(TenantNotificationService.getNotifications());
    };
    loadNotifs();
    window.addEventListener('locagestion:tenant_notifs_updated', loadNotifs);
    window.addEventListener('storage', loadNotifs);
    return () => {
      window.removeEventListener('locagestion:tenant_notifs_updated', loadNotifs);
      window.removeEventListener('storage', loadNotifs);
    };
  }, []);

  // Calcul dynamique des mois et libellé de période
  const resolvedMonthsCount =
    paymentType === 'current'
      ? 1
      : paymentType === 'advance'
      ? selectedAdvanceMonths.length || 1
      : 1 + selectedAdvanceMonths.length;

  const resolvedPeriodLabel =
    paymentType === 'current'
      ? declaredPeriod || 'Novembre 2026 (Mois en cours)'
      : paymentType === 'advance'
      ? selectedAdvanceMonths.length === 1
        ? `Loyer d'avance : ${selectedAdvanceMonths[0]}`
        : `${selectedAdvanceMonths.length} mois d'avance (${selectedAdvanceMonths.join(', ')})`
      : `Novembre 2026 + ${selectedAdvanceMonths.length} mois d'avance (${selectedAdvanceMonths.join(', ')})`;

  const handleSelectPaymentType = (type: 'current' | 'advance' | 'both') => {
    setPaymentType(type);
    const months =
      type === 'current' ? 1 : type === 'advance' ? selectedAdvanceMonths.length || 1 : 1 + selectedAdvanceMonths.length;
    setDeclaredAmount(String(months * tenant.monthlyRent));
  };

  const handleToggleAdvanceMonth = (month: string) => {
    let next: string[];
    if (selectedAdvanceMonths.includes(month)) {
      if (selectedAdvanceMonths.length === 1 && paymentType === 'advance') {
        return; // Conserver au moins un mois en mode avance
      }
      next = selectedAdvanceMonths.filter((m) => m !== month);
    } else {
      next = [...selectedAdvanceMonths, month];
    }
    setSelectedAdvanceMonths(next);
    const months = paymentType === 'current' ? 1 : paymentType === 'advance' ? next.length : 1 + next.length;
    setDeclaredAmount(String(months * tenant.monthlyRent));
  };

  const handleApplyAdvancePreset = (count: number) => {
    const presetMonths = AVAILABLE_FUTURE_MONTHS.slice(0, count);
    setSelectedAdvanceMonths(presetMonths);
    const months = paymentType === 'both' ? 1 + presetMonths.length : presetMonths.length;
    setDeclaredAmount(String(months * tenant.monthlyRent));
  };

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
    name: user?.name || currentLease?.tenant || 'Locataire',
    phone: user?.phone || currentLease?.tenantPhone || '',
    email: user?.email || currentLease?.tenantEmail || '',
    property: currentLease?.property || 'Aucun logement lié',
    unit: currentLease?.unit || 'Non assigné',
    address: currentLease?.tenantAddress || '',
    monthlyRent: currentLease?.rent || 0,
    charges: currentLease?.charges || 0,
    deposit: currentLease?.deposit || 0,
    dueDate: '05 du mois',
    paymentStatus: 'a_jour',
    leaseRef: currentLease?.id || 'N/A',
    leaseStartDate: currentLease?.startDate || 'N/A',
    leaseDuration: currentLease?.durationMonths ? `${currentLease.durationMonths} mois` : '1 an renouvelable',
    inventoryDate: currentLease?.startDate || 'N/A',
    meterCashPower: 'Compteur individuel',
    meterWater: 'Compteur d’eau',
    keysDelivered: 'Clés de sécurité remises',
    landlord: {
      name: currentLease?.landlordSignature?.signedBy || 'Bailleur',
      contactPerson: currentLease?.landlordSignature?.signedBy || 'Bailleur',
      role: 'Propriétaire',
      phone: '',
      whatsapp: '',
      email: '',
      address: '',
      ifu: '',
      paymentMethods: {
        wave: '',
        mtn: '',
        moov: '',
        bank: '',
      },
    },
    scoring: {
      score: 100,
      badge: 'Nouveau Locataire',
      onTimeRate: 100,
      totalMonthsPaid: 0,
    },
  };

  const [receiptsList, setReceiptsList] = useState<PaymentTransaction[]>([]);

  useEffect(() => {
    const syncReceipts = () => {
      try {
        const declared = PaymentService.getDeclaredPayments();
        const tenantDeclared = declared.filter((p) => {
          if (!user && !currentLease) return false;
          if (user?.email && p.tenantEmail && p.tenantEmail.trim().toLowerCase() === user.email.trim().toLowerCase()) return true;
          if (user?.phone && p.tenantPhone && p.tenantPhone.replace(/\D/g, '') === user.phone.replace(/\D/g, '')) return true;
          if (user?.name && p.tenantName && p.tenantName.trim().toLowerCase() === user.name.trim().toLowerCase()) return true;
          if (currentLease && ((p.propertyName === currentLease.property && p.unitNumber === currentLease.unit) || (p.tenantName && p.tenantName.trim().toLowerCase() === currentLease.tenant.trim().toLowerCase()))) return true;
          return false;
        });
        setReceiptsList(tenantDeclared);
      } catch (err) {
        console.error('Erreur synchronisation quittances:', err);
      }
    };

    syncReceipts();
    window.addEventListener('locagestion:payments_updated', syncReceipts);
    window.addEventListener('storage', syncReceipts);
    return () => {
      window.removeEventListener('locagestion:payments_updated', syncReceipts);
      window.removeEventListener('storage', syncReceipts);
    };
  }, [user, currentLease]);

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
    const isAdvance = paymentType === 'advance' || paymentType === 'both';
    const numAmount = parseInt(declaredAmount) || resolvedMonthsCount * tenant.monthlyRent;
    const dateStr = new Date().toLocaleDateString('fr-FR');
    const newTx: PaymentTransaction = {
      id: `decl-${Date.now()}`,
      receiptNumber: `DEC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      tenantId: 'ten-01',
      tenantName: tenant.name,
      tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
      tenantPhone: tenant.phone,
      tenantEmail: tenant.email,
      propertyName: tenant.property,
      unitNumber: tenant.unit,
      amount: numAmount,
      expectedAmount: tenant.monthlyRent,
      period: resolvedPeriodLabel,
      paymentDate: dateStr,
      method: declaredMethod as any,
      status: 'paye',
      isVerified: false,
      isAdvance,
      advanceMonthsCount: resolvedMonthsCount,
      advanceMonthsList: isAdvance
        ? paymentType === 'both'
          ? ['Novembre 2026', ...selectedAdvanceMonths]
          : selectedAdvanceMonths
        : undefined,
    };

    const declared = PaymentService.getDeclaredPayments();
    const updated = [newTx, ...declared.filter((p) => p.id !== newTx.id)];
    PaymentService.saveDeclaredPayments(updated);
    setReceiptsList([newTx, ...receiptsList.filter((p) => p.id !== newTx.id)]);

    // Alerter le bailleur via le service partagé
    LeaseService.addLandlordNotification({
      id: `notif-pay-${Date.now()}`,
      title: isAdvance
        ? `Loyer d'avance déclaré par ${tenant.name} (${resolvedMonthsCount} mois)`
        : `Paiement déclaré par ${tenant.name}`,
      message: `Déclaration de loyer de ${formatFCFA(numAmount)} pour la période ${resolvedPeriodLabel} via ${declaredMethod.toUpperCase()} (Réf: ${declaredRef || 'Non spécifiée'}).`,
      type: 'payment_declared',
      read: false,
      timestamp: `À l'instant`,
      tenantName: tenant.name,
      unit: tenant.unit,
      property: tenant.property,
      paymentId: newTx.id,
    });

    // Enregistrer instantanément dans les notifications du locataire
    if (isAdvance) {
      TenantNotificationService.notifyAdvancePaymentDeclared({
        amount: numAmount,
        period: resolvedPeriodLabel,
        advanceMonthsCount: resolvedMonthsCount,
        tenantName: tenant.name,
      });
    } else {
      TenantNotificationService.addNotification({
        title: 'Paiement de Loyer Déclaré',
        message: `Votre déclaration de ${formatFCFA(numAmount)} pour ${resolvedPeriodLabel} est enregistrée. Quittance certifiée dès validation du bailleur.`,
        type: 'receipt_issued',
        link: '/portal?tab=quittances',
        tenantName: tenant.name,
        actor: 'Système LOCAGESTION',
      });
    }

    setDeclarationModalOpen(false);
    setProofFile(null);
    const payMsg = isAdvance
      ? `Déclaration de ${resolvedMonthsCount} mois d'avance (${formatFCFA(numAmount)}) transmise avec succès au bailleur !`
      : `Déclaration de ${formatFCFA(numAmount)} (${resolvedPeriodLabel}) transmise avec succès au bailleur ! Quittance émise dès validation.`;
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
        activePortalTab={activeTab}
        onPortalTabChange={handleTabChange}
      />

      {/* 2. Main Tenant Space Layout */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
          activePortalTab={activeTab}
          onPortalTabChange={handleTabChange}
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
          {isLoading ? (
            <SkeletonPortalDashboard />
          ) : (
            <>
              {/* Top Segmented Navigation Tabs */}
              <div className="resident-subbar flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-x-auto scrollbar-none">
            <button
              type="button"
              onClick={() => handleTabChange('accueil')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'accueil'
                  ? 'bg-black text-white shadow-sm font-black'
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
                  ? 'bg-black text-white shadow-sm font-black'
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
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'bail'
                  ? 'bg-black text-white shadow-sm font-black'
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
                  ? 'bg-black text-white shadow-sm font-black'
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
              {pendingLease && !dismissedLeaseIds.includes(pendingLease.id) && pendingLease.status === 'en_attente_signature' && !pendingLease.signedByTenant && (
                <div className="relative p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 border border-amber-300 ring-4 ring-amber-500/20 animate-in slide-in-from-top-4">
                  {/* Bouton de fermeture / masquage de la bannière */}
                  <button
                    type="button"
                    onClick={() => handleDismissPendingBanner(pendingLease.id)}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/20 hover:bg-black/40 text-white transition-colors cursor-pointer"
                    title="Masquer cette notification"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  <div className="flex items-start gap-4 pr-6 sm:pr-0">
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
                        Votre bailleur ({pendingLease.landlordSignature?.signedBy || 'Le Bailleur'})
                        a signé et vous a transmis le contrat de bail <strong>{pendingLease.id}</strong>{' '}
                        pour le lot <strong>{pendingLease.unit}</strong> ({formatFCFA(pendingLease.rent)}/mois).
                        Veuillez apposer votre signature électronique pour activer le bail.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSigningLease(pendingLease);
                      setIsSignModalOpen(true);
                    }}
                    className="py-3 px-6 rounded-2xl bg-white hover:bg-amber-50 text-amber-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition-all shrink-0 cursor-pointer active:scale-95 w-full sm:w-auto"
                  >
                    <PenTool className="w-4 h-4 text-amber-600" />
                    <span>Examiner & Contresigner</span>
                  </button>
                </div>
              )}

              {/* Bouton Accueil sur Mobile (juste en haut de la hero section - uniquement sur mobile < 640px) */}
              <div className="sm:hidden flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleTabChange('accueil')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-black text-white text-xs font-black shadow-md active:scale-95 transition-all cursor-pointer"
                >
                  <Home className="w-4 h-4 text-white" />
                  <span>Accueil</span>
                </button>
              </div>

              {/* Hero Banner: Rent Due & Quick Payment */}
              <div className="bg-gradient-to-br from-slate-900 via-[#141824] to-slate-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-xs flex items-center gap-1 ${
                        currentLease
                          ? (receiptsList.length > 0 && receiptsList[0]?.isVerified ? 'bg-emerald-500 text-white' : 'bg-brand-500 text-white')
                          : 'bg-slate-700 text-slate-200'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {currentLease
                          ? (receiptsList.length > 0 ? (receiptsList[0]?.isVerified ? 'Loyer à jour' : 'Règlement en attente') : 'Bail actif • En attente 1er loyer')
                          : 'En attente d’assignation'}
                      </span>
                      <span className="text-[11px] text-slate-300 font-medium">
                        {currentLease ? `${tenant.property} • ${tenant.unit}` : 'Aucun logement lié'}
                      </span>
                    </div>

                    <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white leading-snug">
                      Bonjour {user?.firstName || (user?.name ? user.name.split(' ')[0] : 'Locataire')} 👋{currentLease ? ', votre espace est parfaitement à jour' : ', bienvenue dans votre espace résident'}
                    </h1>
                    <p className="text-xs text-slate-400 mt-1.5 max-w-lg leading-relaxed">
                      {currentLease ? (
                        <>Prochaine exigibilité de loyer : <strong className="text-slate-200">{tenant.dueDate}</strong> ({formatFCFA(tenant.monthlyRent)} charges comprises).</>
                      ) : (
                        <>Bienvenue dans votre Espace Résident. Vos quittances certifiées et informations contractuelles apparaîtront ici dès que votre bailleur vous aura assigné votre logement.</>
                      )}
                    </p>
                  </div>

                  {/* Actions Principales du Locataire */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
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
                  {receiptsList.length > 0 ? (
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                            <Receipt className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-xs font-black text-slate-900">Dernière Quittance Émise</h4>
                              {receiptsList[0]?.isAdvance && (
                                <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                                  Loyer d'avance ({receiptsList[0]?.advanceMonthsCount || 1} m)
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">Réf : {receiptsList[0]?.receiptNumber}</span>
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
                          <strong className="text-slate-900">{receiptsList[0]?.period}</strong>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Montant réglé :</span>
                          <strong className="text-emerald-700 font-black">{formatFCFA(receiptsList[0]?.amount)}</strong>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">Moyen de paiement :</span>
                          <span className="text-slate-700 font-medium">{receiptsList[0]?.method ? receiptsList[0].method.toUpperCase() : 'Mobile Money'}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-5 text-center space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-black text-slate-800">Aucune quittance émise</h4>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Vos quittances officielles avec QR Code scellé apparaîtront ici dès l'enregistrement et la validation de vos règlements.
                      </p>
                    </div>
                  )}

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
                  {currentLease ? (
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                            <Building2 className="w-5 h-5 text-brand-400" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-900">{tenant.landlord.name || 'Bailleur Propriétaire'}</h4>
                            <span className="text-[10px] text-slate-400">Bailleur & Gestionnaire Dédié</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                          {tenant.landlord.contactPerson || 'Gestion'}
                        </span>
                      </div>

                      <div className="pt-3 space-y-1.5 text-xs">
                        {tenant.landlord.phone && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Téléphone :</span>
                            <a href={`tel:${tenant.landlord.phone}`} className="font-bold text-slate-800 hover:text-brand-600">
                              {tenant.landlord.phone}
                            </a>
                          </div>
                        )}
                        {tenant.landlord.email && (
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">Email :</span>
                            <span className="text-slate-700 font-medium truncate max-w-[180px]">{tenant.landlord.email}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Contrat :</span>
                          <span className="text-slate-800 font-mono font-bold">{tenant.leaseRef}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-5 text-center space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <h4 className="text-xs font-black text-slate-800">Aucun bailleur assigné</h4>
                      <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                        Les coordonnées et le contact WhatsApp de votre bailleur apparaîtront dès que votre contrat de bail sera actif.
                      </p>
                    </div>
                  )}

                  {currentLease && (tenant.landlord.whatsapp || tenant.landlord.phone) ? (
                    <a
                      href={`https://wa.me/${(tenant.landlord.whatsapp || tenant.landlord.phone).replace(/\D/g, '')}?text=${encodeURIComponent(
                        `Bonjour, je suis ${tenant.name} (${tenant.unit}). Je vous contacte depuis mon espace locataire LOCAGESTION.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Écrire sur WhatsApp au Bailleur</span>
                    </a>
                  ) : (
                    <div className="w-full py-2.5 px-4 rounded-xl bg-slate-100 text-slate-400 text-xs font-bold text-center">
                      Contact bailleur disponible après assignation
                    </div>
                  )}
                </div>
              </div>

              {/* Fiche Logement Détaillée */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-5 h-5 text-slate-700 shrink-0" />
                    <h3 className="font-black text-base text-slate-900">
                      Caractéristiques de Votre Logement Actuel
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentLease && inspectionData.photos.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setIsInspectionModalOpen(true)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        <span>État des lieux ({inspectionData.photos.length} photos)</span>
                      </button>
                    )}
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto shrink-0 ${
                      currentLease
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-slate-600 bg-slate-100 border-slate-200'
                    }`}>
                      {currentLease ? "Bail en cours d'exécution" : 'En attente de bail'}
                    </span>
                  </div>
                </div>

                {currentLease ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Loyer Mensuel Net</span>
                      <span className="text-base font-black text-slate-900 mt-0.5 block">{formatFCFA(tenant.monthlyRent)}</span>
                      <span className="text-[10px] text-slate-500">Hors charges</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Charges Locatives</span>
                      <span className="text-base font-black text-slate-900 mt-0.5 block">{formatFCFA(tenant.charges)}</span>
                      <span className="text-[10px] text-slate-500">Gardiennage & entretien</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Dépôt de Garantie</span>
                      <span className="text-base font-black text-slate-900 mt-0.5 block">{formatFCFA(tenant.deposit)}</span>
                      <span className="text-[10px] text-slate-500">Caution consignée</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Échéance Mensuelle</span>
                      <span className="text-base font-black text-emerald-700 mt-0.5 block">{tenant.dueDate}</span>
                      <span className="text-[10px] text-slate-500">Au plus tard</span>
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center space-y-2">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <Home className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-black text-slate-800">Aucun logement assigné pour le moment</h4>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Les caractéristiques, compteurs et états des lieux apparaîtront ici automatiquement dès qu'un bail vous sera transmis.
                    </p>
                  </div>
                )}
              </div>

              {/* ==================================================================== */}
              {/* SECTION : ÉTAT DES LIEUX & CONSTAT PHOTOS DU LOGEMENT (Lecture Seule) */}
              {/* ==================================================================== */}
              {currentLease && inspectionData.photos.length > 0 && (
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-5 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-xs">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-base sm:text-lg text-slate-900 leading-tight">
                          État des Lieux & Constat Photos
                        </h3>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Certifié Contradictoire</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0">
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>Consultation Locataire (Non modifiable)</span>
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Dossier contradictoire et documents établis par votre bailleur (<strong>{tenant.landlord.name}</strong>) pour le logement <strong>{tenant.unit}</strong> ({tenant.property}).
                      </p>
                    </div>
                  </div>

                  {/* Actions Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsInspectionModalOpen(true)}
                      className="py-2.5 px-4 sm:px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-center"
                    >
                      <Eye className="w-4 h-4 shrink-0" />
                      <span>Consulter l'état des lieux & photos ({inspectionData.photos.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        generateInspectionPDF({
                          id: currentLease?.id || tenant.leaseRef,
                          tenantName: tenant.name,
                          propertyName: tenant.property,
                          unit: tenant.unit,
                          date: inspectionData.date,
                          meterCashPower: inspectionData.meterCashPower,
                          meterWater: inspectionData.meterWater,
                          keysDelivered: inspectionData.keysDelivered,
                          generalState:
                            inspectionData.generalState === 'neuf'
                              ? 'Neuf / Rénovation complète'
                              : inspectionData.generalState === 'tres_bon'
                              ? 'Très bon état d’usage'
                              : inspectionData.generalState === 'bon'
                              ? 'Bon état général'
                              : 'À rafraîchir',
                        });
                        showToast(`Procès-verbal officiel d'état des lieux téléchargé en PDF !`);
                      }}
                      className="py-2.5 px-4 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs text-center"
                      title="Télécharger le PV officiel"
                    >
                      <Download className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Télécharger PV (PDF)</span>
                    </button>
                  </div>
                </div>

                {/* Récapitulatif technique : Compteurs, Clés & État */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-amber-100 text-amber-700 shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Compteur Électricité</span>
                      <span className="text-xs font-black text-slate-900 block mt-0.5 truncate">{inspectionData.meterCashPower}</span>
                      <span className="text-[10px] text-slate-500 block">Relevé contradictoire</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
                      <Droplet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Compteur d'Eau</span>
                      <span className="text-xs font-black text-slate-900 block mt-0.5 truncate">{inspectionData.meterWater}</span>
                      <span className="text-[10px] text-slate-500 block">Index initial</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                      <Key className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clés & Accès</span>
                      <span className="text-xs font-black text-slate-900 block mt-0.5 truncate">{inspectionData.keysDelivered}</span>
                      <span className="text-[10px] text-slate-500 block">Inventaire remis</span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                    <div className="p-2 rounded-xl bg-purple-100 text-purple-700 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">État Général</span>
                      <span className="text-xs font-black text-slate-900 block mt-0.5 capitalize">
                        {inspectionData.generalState === 'neuf'
                          ? 'Neuf / Rénové'
                          : inspectionData.generalState === 'tres_bon'
                          ? 'Très bon état'
                          : inspectionData.generalState === 'bon'
                          ? 'Bon état général'
                          : 'À rafraîchir'}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-bold block">Conforme au bail</span>
                    </div>
                  </div>
                </div>

                {/* Galerie des Photos Horodatées de l'État des Lieux */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                        Photos de l'État des Lieux du Bailleur ({inspectionData.photos.length} clichés horodatés)
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline">• Cliquez pour agrandir en HD</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsInspectionModalOpen(true)}
                      className="text-xs font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Ouvrir l'inspection complète</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {inspectionData.photos.slice(0, 6).map((photo) => (
                      <div
                        key={photo.id}
                        onClick={() => setSelectedInspectionPhoto(photo)}
                        className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 aspect-square cursor-pointer shadow-xs hover:shadow-md transition-all"
                        title={`${photo.label} (${photo.room})`}
                      >
                        <img
                          src={photo.url}
                          alt={photo.label}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/30 opacity-80 group-hover:opacity-90 transition-opacity" />
                        <div className="absolute top-1.5 left-1.5">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-md text-white border border-white/20">
                            {photo.room}
                          </span>
                        </div>
                        <div className="absolute bottom-1.5 left-1.5 right-1.5">
                          <p className="text-[10px] font-bold text-white line-clamp-1 leading-tight">
                            {photo.label}
                          </p>
                          <span className="text-[9px] text-slate-300 font-mono block">
                            {photo.timestamp.split(' à ')[0]}
                          </span>
                        </div>
                        <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 p-1 rounded text-white">
                          <ZoomIn className="w-3 h-3" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
            <div className="bg-white rounded-3xl p-4 sm:p-8 border border-slate-200/80 shadow-soft space-y-6 animate-in fade-in duration-200">
              {/* Bouton Retour Accueil (visible sur mobile et desktop) */}
              <div className="flex items-center gap-2 pb-2">
                <button
                  type="button"
                  onClick={() => handleTabChange('accueil')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                >
                  <Home className="w-4 h-4 text-slate-600" />
                  <span>← Retour à l’Accueil</span>
                </button>
              </div>

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
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all w-full sm:w-auto cursor-pointer"
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

                  {/* Sélecteur de mois spécifique & Tri chronologique (Adapté Mobile & Desktop) */}
                  <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-auto">
                      <select
                        value={receiptSelectedMonth}
                        onChange={(e) => setReceiptSelectedMonth(e.target.value)}
                        className="w-full sm:w-auto py-2 pl-3 pr-8 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs cursor-pointer truncate"
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
                      className="w-full sm:w-auto justify-center px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer truncate"
                      title="Changer l'ordre de tri"
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="truncate">{receiptSortOrder === 'desc' ? 'Plus récent ↓' : 'Plus ancien ↑'}</span>
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
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 hover:bg-slate-50 px-3.5 rounded-2xl transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black group-hover:scale-105 transition-transform shrink-0">
                        <Receipt className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors truncate">
                            Quittance de Loyer — {rec.period}
                          </h4>
                          {rec.isAdvance && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                              Loyer d'avance ({rec.advanceMonthsCount || 1} mois)
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-400 mt-0.5 font-medium">
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

                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
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
                        className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shrink-0"
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
              <div className="bg-white rounded-3xl p-4 sm:p-7 border border-slate-200/80 shadow-soft">
                {/* Bouton Retour Accueil en haut de la carte (visible sur mobile et desktop) */}
                <div className="flex items-center gap-2 pb-3 mb-2 border-b border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleTabChange('accueil')}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                  >
                    <Home className="w-4 h-4 text-slate-600" />
                    <span>← Retour à l’Accueil</span>
                  </button>
                </div>

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
                      Votre contrat d'habitation certifié conforme, conditions juridiques et coordonnées directes de votre bailleur.
                    </p>
                  </div>

                  {/* Sub-Tabs Selector */}
                  <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/60 w-full sm:w-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => setBailSubTab('tout')}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
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
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                        bailSubTab === 'bail_etat'
                          ? 'bg-brand-500 text-white shadow-sm font-black'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Mon Contrat
                    </button>
                    <button
                      type="button"
                      onClick={() => setBailSubTab('bailleur')}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
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
                  {pendingLease && !dismissedLeaseIds.includes(pendingLease.id) && pendingLease.status === 'en_attente_signature' && !pendingLease.signedByTenant && (
                    <div className="relative bg-gradient-to-br from-amber-50 to-amber-100/60 rounded-3xl p-6 sm:p-7 border-2 border-amber-300 shadow-md space-y-4 ring-2 ring-amber-400/30">
                      <button
                        type="button"
                        onClick={() => handleDismissPendingBanner(pendingLease.id)}
                        className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                        title="Masquer cette notification"
                      >
                        <X className="w-4 h-4" />
                      </button>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-amber-200 pr-8 sm:pr-0">
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
                          onClick={() => {
                            setSigningLease(pendingLease);
                            setIsSignModalOpen(true);
                          }}
                          className="w-full sm:w-auto py-2.5 px-5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
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
                  {!currentLease ? (
                    <div className="rounded-3xl p-8 sm:p-12 border border-slate-200/80 bg-white shadow-soft text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <FileText className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-black text-slate-800">Aucun contrat de bail actif</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Vous n'avez pas encore de contrat de bail assigné. Dès que votre bailleur aura généré et signé votre contrat officiel, vous serez notifié pour le contresigner ici.
                      </p>
                    </div>
                  ) : (
                    <div className={`rounded-3xl p-6 sm:p-7 border shadow-soft space-y-5 ${
                      currentLease?.status === 'resilie'
                        ? 'bg-rose-50/30 border-rose-200'
                        : 'bg-white border-slate-200/80'
                    }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                      <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                        <FileText className={`w-5 h-5 mt-0.5 sm:mt-0 shrink-0 ${currentLease?.status === 'resilie' ? 'text-rose-600' : 'text-brand-600'}`} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-black text-base text-slate-900 leading-tight">
                              Contrat de Bail d’Habitation Certifié
                            </h3>
                            {currentLease?.status === 'resilie' ? (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 shrink-0">
                                <Ban className="w-3 h-3 text-rose-600" />
                                <span>Bail Résilié • Dissocié</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Actif & Conforme</span>
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono block mt-1 break-words">
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
                        className="w-full sm:w-auto py-2.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-pink-glow transition-all cursor-pointer shrink-0"
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
                          Scellé numérique conforme aux lois sur les transactions électroniques UEMOA & CEMAC.
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold hidden sm:inline">
                        HASH: SHA256-CERT-98421
                      </span>
                    </div>
                  </div>
                )}
                </div>
              )}

              {/* SOUS-SECTION 2 : MON BAILLEUR & GESTIONNAIRE */}
              {(bailSubTab === 'tout' || bailSubTab === 'bailleur') && (
                currentLease ? (
                  <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black">
                          <Building2 className="w-6 h-6 text-brand-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-black text-lg text-slate-900">
                              {tenant.landlord.name || 'Bailleur Propriétaire'}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Bailleur Officiel
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Représenté par <strong>{tenant.landlord.contactPerson || 'Gestion'}</strong> ({tenant.landlord.role})
                          </p>
                        </div>
                      </div>

                      {/* Direct WhatsApp CTA Button */}
                      {(tenant.landlord.whatsapp || tenant.landlord.phone) && (
                        <a
                          href={`https://wa.me/${(tenant.landlord.whatsapp || tenant.landlord.phone).replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Bonjour, je suis ${tenant.name} (${tenant.unit}). Je vous contacte depuis mon espace locataire LOCAGESTION.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-md shadow-emerald-500/25 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Contacter sur WhatsApp</span>
                        </a>
                      )}
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
                          <span>{tenant.landlord.phone || 'Non renseigné'}</span>
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
                          <span className="truncate">{tenant.landlord.email || 'Non renseigné'}</span>
                        </a>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Numéro IFU Fiscal
                        </span>
                        <span className="text-xs font-mono font-black text-slate-900 mt-1 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{tenant.landlord.ifu || 'Non communiqué'}</span>
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
              ) : (
                <div className="rounded-3xl p-8 sm:p-12 border border-slate-200/80 bg-white shadow-soft text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800">Aucun bailleur assigné</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Les coordonnées, contacts et informations fiscales de votre bailleur apparaîtront automatiquement dès la validation de votre bail.
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* ==================================================================== */}
          {/* ONGLET 4 : PASSEPORT SOLVABILITÉ                                    */}
          {/* ==================================================================== */}
          {activeTab === 'solvabilite' && (
            <div className="bg-white rounded-3xl p-4 sm:p-8 border border-slate-200/80 shadow-soft space-y-6 animate-in fade-in duration-200">
              {/* Bouton Retour Accueil (visible sur mobile et desktop) */}
              <div className="flex items-center gap-2 pb-2">
                <button
                  type="button"
                  onClick={() => handleTabChange('accueil')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold active:scale-95 transition-all cursor-pointer"
                >
                  <Home className="w-4 h-4 text-slate-600" />
                  <span>← Retour à l’Accueil</span>
                </button>
              </div>

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
                    {receiptsList.length === 0 ? 100 : Math.round(100 * (receiptsList.filter((r) => r.isVerified).length / receiptsList.length))} <span className="text-base text-emerald-100 font-bold">/ 100</span>
                  </div>
                  <p className="text-xs text-emerald-100 mt-1.5">
                    {receiptsList.length === 0
                      ? 'Nouveau Résident : Votre historique débutera dès la validation de votre premier loyer.'
                      : `${receiptsList.filter((r) => r.isVerified).length} quittance(s) validée(s) sur ${receiptsList.length} règlement(s) enregistré(s).`}
                  </p>
                </div>

                <div className="px-5 py-2.5 rounded-2xl bg-white/20 backdrop-blur-md text-white text-xs font-black border border-white/20 self-start sm:self-auto">
                  Badge Officiel : {receiptsList.length === 0 ? 'NOUVEAU LOCATAIRE' : receiptsList.length >= 6 ? 'EXCELLENT PAYEUR' : 'RÉSIDENT ACTIF'}
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

                <div className="text-xs text-slate-500 pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    Statut actuel :{' '}
                    <strong className={consentGranted ? 'text-emerald-600 font-bold' : 'text-slate-600'}>
                      {consentGranted ? 'Partage actif (Valable jusqu’au 31/12/2026)' : 'Partage révoqué'}
                    </strong>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Conforme aux réglementations régionales de protection des données UEMOA & CEMAC
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* ONGLET 5 : RELANCES & PRÉAVIS                                       */}
          {/* ==================================================================== */}
          {activeTab === 'preavis' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Barre Supérieure d'Actions : Retour Accueil & Notifier un départ */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => handleTabChange('accueil')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95 self-start"
                >
                  <ArrowLeft className="w-4 h-4 text-slate-600" />
                  <span>Retour à l’Accueil</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDepartureModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/25 transition-all cursor-pointer active:scale-95 self-start sm:self-auto"
                >
                  <FileWarning className="w-4 h-4" />
                  <span>+ Notifier un Départ Volontaire</span>
                </button>
              </div>

              {/* Bannière de Présentation */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 text-white border border-rose-900/40 shadow-xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="space-y-2 max-w-2xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-sm flex items-center gap-1">
                        <BellRing className="w-3 h-3" />
                        <span>Centre de Relances & Préavis</span>
                      </span>
                      <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-white/10 text-rose-200 border border-white/15">
                        Conforme Code Foncier UEMOA & CEMAC
                      </span>
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Mes Relances & Préavis Reçus
                    </h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Consultez en direct les notifications officielles émises par votre bailleur (préavis de congé, échéanciers, rappels de paiement) ou transmettez votre notification de départ volontaire avec calcul automatique des délais légaux.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1.5 shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider block">
                      Logement Titulaire
                    </span>
                    <span className="text-xs font-black text-white block">
                      {currentLease
                        ? `${currentLease.property} (${currentLease.unit})`
                        : 'Aucun logement rattaché'}
                    </span>
                    <div className="flex items-center gap-2 pt-1 text-[11px] text-emerald-300 font-bold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{currentLease ? `Bail ${currentLease.id} en vigueur` : 'Aucun bail actif'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 0 : FIL DE TOUTES LES NOTIFICATIONS & COMMUNICATIONS DU BAILLEUR */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-brand-600" />
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      Communications & Actions Émises par le Bailleur ({portalNotifs.length})
                    </h3>
                  </div>
                  {portalNotifs.some((n) => !n.read) && (
                    <button
                      type="button"
                      onClick={() => {
                        TenantNotificationService.markAllAsRead();
                        setPortalNotifs(TenantNotificationService.getNotifications());
                      }}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
                    >
                      Tout marquer lu
                    </button>
                  )}
                </div>

                {portalNotifs.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-soft text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <h4 className="text-sm font-black text-slate-900">Aucune notification pour le moment</h4>
                    <p className="text-xs text-slate-500">Toutes les actions du bailleur apparaîtront automatiquement ici en temps réel.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {portalNotifs.map((n) => {
                      const isUnread = !n.read;
                      return (
                        <div
                          key={n.id}
                          className={`p-4 rounded-3xl bg-white border shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                            isUnread ? 'border-amber-400 bg-amber-50/20 ring-2 ring-amber-400/20' : 'border-slate-200/80'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {isUnread && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950">
                                  Nouveau
                                </span>
                              )}
                              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                                {n.title}
                              </h4>
                              <span className="text-[10px] text-slate-400 font-mono">• {n.time || n.timestamp}</span>
                            </div>
                            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-slate-400 block">Émetteur : {n.actor || 'Bailleur'}</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              TenantNotificationService.markAsRead(n.id);
                              setPortalNotifs(TenantNotificationService.getNotifications());
                              if (n.link.includes('tab=quittances')) handleTabChange('quittances');
                              else if (n.link.includes('tab=bail')) handleTabChange('bail');
                              else if (n.link.includes('tab=preavis')) handleTabChange('preavis');
                              else if (n.link.includes('tab=solvabilite')) handleTabChange('solvabilite');
                              else if (n.link.includes('action=declare_payment')) setDeclarationModalOpen(true);
                              else if (n.link.includes('action=incident')) setReportIssueModalOpen(true);
                            }}
                            className="py-2 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0 cursor-pointer self-start sm:self-auto"
                          >
                            <span>{n.actionLabel || 'Consulter'}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 1 : PRÉAVIS DE CONGÉ OFFICIELS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileWarning className="w-4 h-4 text-rose-600" />
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      Préavis de Congé Officiels ({tenantNotices.length})
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Notifications juridiquement opposables
                  </span>
                </div>

                {tenantNotices.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-soft text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900">
                        Aucun préavis de congé en cours
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Votre bail d’habitation est pleinement actif et aucun congé n’a été notifié par votre bailleur. Vous pouvez continuer à occuper les lieux en toute sérénité.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tenantNotices.map((notice) => {
                      const isTenantInitiated = notice.reasonType === 'depart_locataire';
                      // Calcul des jours restants
                      const parts = notice.effectiveDate.split('/');
                      let daysRemaining = 0;
                      if (parts.length === 3) {
                        const targetDate = new Date(
                          parseInt(parts[2]),
                          parseInt(parts[1]) - 1,
                          parseInt(parts[0])
                        );
                        const diff = targetDate.getTime() - new Date().getTime();
                        daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
                      }

                      return (
                        <div
                          key={notice.id}
                          className={`rounded-3xl p-5 sm:p-6 bg-white border shadow-soft space-y-4 transition-all ${
                            isTenantInitiated
                              ? 'border-indigo-200/90 ring-1 ring-indigo-500/10'
                              : 'border-rose-200/90 ring-1 ring-rose-500/10'
                          }`}
                        >
                          {/* Header Carte Préavis */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-slate-900 text-white">
                                {notice.id}
                              </span>
                              <span
                                className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border ${
                                  isTenantInitiated
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                }`}
                              >
                                {isTenantInitiated
                                  ? 'Départ Notifié par le Locataire'
                                  : 'Préavis Émis par le Bailleur'}
                              </span>
                              <span className="text-xs font-black text-slate-900">
                                {notice.reasonTitle}
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 text-xs font-black border border-rose-200 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>J-{daysRemaining} avant libération</span>
                              </span>
                            </div>
                          </div>

                          {/* Grille de Détails */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Logement
                              </span>
                              <span className="font-bold text-slate-900 block truncate">
                                {notice.propertyName}
                              </span>
                              <span className="text-slate-500 text-[11px]">{notice.unitNumber}</span>
                            </div>

                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Date d’effet / Remise clés
                              </span>
                              <span className="font-black text-rose-600 block text-sm font-mono">
                                {notice.effectiveDate}
                              </span>
                              <span className="text-slate-500 text-[11px]">
                                Délai appliqué : {notice.noticeMonths} mois
                              </span>
                            </div>

                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Mode de Notification
                              </span>
                              <span className="font-bold text-slate-900 block capitalize">
                                {notice.deliveryMethod === 'email_officiel'
                                  ? 'Email Officiel Certifié'
                                  : notice.deliveryMethod === 'huissier'
                                  ? 'Commissaire de Justice'
                                  : 'Courrier avec accusé'}
                              </span>
                              <span className="text-slate-500 text-[11px]">
                                Émis le {notice.noticeDate}
                              </span>
                            </div>

                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-0.5">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Loyer en vigueur
                              </span>
                              <span className="font-black text-slate-900 block font-mono">
                                {formatFCFA(notice.monthlyRent)}
                              </span>
                              <span className="text-emerald-600 font-bold text-[11px]">
                                Exigible jusqu’au terme
                              </span>
                            </div>
                          </div>

                          {/* Exposé des Motifs */}
                          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/70 space-y-1.5 text-xs">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                              Exposé des motifs & Fondement légal
                            </span>
                            <p className="text-slate-700 leading-relaxed">
                              {notice.reasonDetails}
                            </p>
                            {notice.beneficiaryName && (
                              <div className="pt-1.5 text-[11px] text-slate-600 font-semibold flex items-center gap-1.5">
                                <span className="text-slate-400">Bénéficiaire désigné :</span>
                                <span className="font-bold text-slate-900">{notice.beneficiaryName}</span>
                              </div>
                            )}
                            <div className="pt-1 text-[10px] text-slate-400 italic">
                              Fondement légal : {notice.legalBasis}
                            </div>
                          </div>

                          {/* Actions du Document */}
                          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
                            <button
                              type="button"
                              onClick={() => {
                                generateNoticePDF(notice as any);
                                showToast(`Avis officiel ${notice.id} téléchargé en PDF.`);
                              }}
                              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Télécharger l’Avis Officiel (PDF)</span>
                            </button>

                            <div className="flex items-center gap-2 flex-wrap">
                              <a
                                href={`https://wa.me/${(tenant.landlord.whatsapp || tenant.landlord.phone || '2290197000000').replace(/\D/g, '')}?text=${encodeURIComponent(
                                  `Bonjour,\nJ'accuse réception du préavis ${notice.id} pour le logement ${notice.propertyName} (${notice.unitNumber}). Je vous contacte pour convenir de l'état des lieux de sortie prévu vers le ${notice.effectiveDate}.\nCordialement,\n${notice.tenantName}`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Échanger sur WhatsApp</span>
                              </a>

                              <a
                                href={`mailto:${tenant.landlord.email || 'contact@locagestion.site'}?subject=${encodeURIComponent(
                                  `Accusé de réception - Préavis ${notice.id} - ${notice.tenantName}`
                                )}&body=${encodeURIComponent(
                                  `Bonjour,\n\nJe fais suite à la notification du préavis ${notice.id} concernant le logement ${notice.propertyName} (${notice.unitNumber}).\n\nDate de libération : ${notice.effectiveDate}.\n\nBien cordialement,\n${notice.tenantName}`
                                )}`}
                                className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200/90 flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                              >
                                <Mail className="w-3.5 h-3.5 text-slate-500" />
                                <span>Envoyer un Email</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* SECTION 2 : RAPPELS & RELANCES D’ÉCHÉANCES DE LOYER */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      Rappels d’Échéances & Relances de Loyer
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {currentLease ? `Échéance mensuelle au ${tenant.dueDate || '05'}` : 'Aucune échéance'}
                  </span>
                </div>

                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">
                          {currentLease ? `Échéance Courante : ${declaredPeriod}` : 'Aucune échéance active'}
                        </span>
                        {currentLease && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Rappel automatique
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        {currentLease ? (
                          <>Loyer mensuel contractuel de <strong>{formatFCFA(tenant.monthlyRent)}</strong>. Règlement direct via Wave ou Mobile Money.</>
                        ) : (
                          <>Aucune échéance de loyer à régler pour le moment. Vos rappels et échéances s'afficheront ici automatiquement dès qu'un bail vous sera attribué.</>
                        )}
                      </p>
                    </div>

                    {currentLease && (
                      <button
                        type="button"
                        onClick={() => setDeclarationModalOpen(true)}
                        className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 flex items-center gap-2 cursor-pointer active:scale-95 transition-all shrink-0 self-start sm:self-auto"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Déclarer un Règlement</span>
                      </button>
                    )}
                  </div>

                  {/* Message de relance reçu */}
                  {tenantNotices.length > 0 && (
                    <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                        <span className="flex items-center gap-1.5">
                          <BellRing className="w-3.5 h-3.5 text-amber-600" />
                          <span>Dernier avis ou rappel de paiement reçu</span>
                        </span>
                        <span className="text-[10px] text-amber-600 font-medium">Reçu le {tenantNotices[0].noticeDate || tenantNotices[0].createdAt}</span>
                      </div>
                      <p className="text-xs text-amber-950 font-mono leading-relaxed bg-white/70 p-3 rounded-xl border border-amber-200/60">
                        « {tenantNotices[0].reasonTitle || tenantNotices[0].reasonDetails || 'Rappel d’échéance de loyer'}. Montant exigible : {formatFCFA(tenantNotices[0].monthlyRent)}. Merci de déclarer votre règlement une fois le versement effectué. »
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer en fin de page : Créée au Bénin (en bas à gauche) */}
          <Footer />
        </>
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

              {/* Sélecteur de Mode : Mois en cours ou Loyers d'Avance */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5 flex items-center justify-between">
                  <span>Nature du règlement de loyer *</span>
                  <span className="text-[10px] text-purple-700 bg-purple-50 font-extrabold px-2 py-0.5 rounded-full border border-purple-200">
                    {paymentType === 'current' ? '1 mois standard' : `${resolvedMonthsCount} mois au total`}
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectPaymentType('current')}
                    className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      paymentType === 'current'
                        ? 'border-brand-500 bg-brand-50 text-brand-900 ring-2 ring-brand-500/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="font-extrabold text-xs block">Mois en cours</span>
                    <span className="text-[10px] text-slate-500 block">Novembre 2026 (1 mois)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPaymentType('advance')}
                    className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      paymentType === 'advance'
                        ? 'border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-500/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-xs block text-purple-950">Loyers d'avance 🚀</span>
                      <span className="text-[9px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">Nouveau</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block">Mois futurs à l'avance</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPaymentType('both')}
                    className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      paymentType === 'both'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <span className="font-extrabold text-xs block text-emerald-950">En cours + Avance</span>
                    <span className="text-[10px] text-slate-500 block">Règlement groupé combiné</span>
                  </button>
                </div>
              </div>

              {/* Cas 1 : Mois en cours seul */}
              {paymentType === 'current' && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1 flex items-center justify-between">
                    <span>Mois d'échéance concerné *</span>
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
                    </optgroup>
                    <optgroup label="Exercice 2025 (Arriérés éventuels)">
                      <option value="Décembre 2025">Décembre 2025</option>
                      <option value="Novembre 2025">Novembre 2025</option>
                      <option value="Octobre 2025">Octobre 2025</option>
                    </optgroup>
                  </select>
                </div>
              )}

              {/* Cas 2 & 3 : Sélection des mois d'avance */}
              {(paymentType === 'advance' || paymentType === 'both') && (
                <div className="p-3.5 rounded-2xl bg-purple-50/70 border border-purple-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-purple-950 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      <span>Sélectionnez les mois futurs payés d'avance :</span>
                    </span>
                    <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                      {selectedAdvanceMonths.length} mois d'avance sélectionné{selectedAdvanceMonths.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Raccourcis rapides */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Raccourcis :</span>
                    {[
                      { label: '+1 mois', count: 1 },
                      { label: '+2 mois', count: 2 },
                      { label: '+3 mois (Trimestre)', count: 3 },
                      { label: '+6 mois (Semestre)', count: 6 },
                      { label: '+12 mois (1 an)', count: 12 },
                    ].map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleApplyAdvancePreset(p.count)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-extrabold cursor-pointer transition-all ${
                          selectedAdvanceMonths.length === p.count
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white hover:bg-purple-100 text-purple-900 border border-purple-200'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Grille de sélection des mois futurs */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-40 overflow-y-auto p-1.5 bg-white/70 rounded-xl border border-purple-100">
                    {AVAILABLE_FUTURE_MONTHS.map((m) => {
                      const isSelected = selectedAdvanceMonths.includes(m);
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => handleToggleAdvanceMonth(m)}
                          className={`p-2 rounded-xl text-left font-bold text-[11px] flex items-center justify-between transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'bg-white text-slate-700 hover:bg-purple-50 border border-slate-200/80'
                          }`}
                        >
                          <span className="truncate">{m}</span>
                          {isSelected ? <Check className="w-3.5 h-3.5 shrink-0" /> : null}
                        </button>
                      );
                    })}
                  </div>

                  {/* Synthèse du calcul du loyer */}
                  <div className="p-2.5 rounded-xl bg-purple-100/70 border border-purple-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-purple-900 font-medium">
                      {paymentType === 'both' ? 'Novembre 2026 + ' : ''}
                      <strong>{selectedAdvanceMonths.length} mois d'avance</strong> :
                    </span>
                    <span className="font-mono font-black text-purple-950 text-right">
                      {formatFCFA(tenant.monthlyRent)} × {resolvedMonthsCount} mois = {formatFCFA(resolvedMonthsCount * tenant.monthlyRent)}
                    </span>
                  </div>
                </div>
              )}

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

                {/* Exemples rapides de panne UEMOA & CEMAC */}
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
      {(signingLease || pendingLease) && (
        <TenantSignLeaseModal
          lease={signingLease || pendingLease!}
          tenantName={tenant.name}
          isOpen={isSignModalOpen}
          onClose={() => {
            setIsSignModalOpen(false);
            setSigningLease(null);
            checkLeases();
          }}
          onSignedSuccess={(updatedLease) => {
            const signMsg = `Bail ${updatedLease.id} contresigné avec succès ! Notification et email transmis au bailleur.`;
            showToast(signMsg);
            notifySave(signMsg, 'Bail contresigné avec succès !');
            handleDismissPendingBanner(updatedLease.id);
            setPendingLease(null);
            setCurrentLease(updatedLease);
            if (typeof window !== 'undefined') {
              try {
                const url = new URL(window.location.href);
                url.searchParams.delete('leaseId');
                url.searchParams.delete('code');
                url.searchParams.delete('tenant');
                window.history.replaceState({}, '', url.toString());
              } catch (e) {}
            }
            checkLeases();
          }}
        />
      )}

      {/* Modal de Préavis de Départ Volontaire */}
      <TenantDepartureModal
        isOpen={departureModalOpen}
        onClose={() => setDepartureModalOpen(false)}
        onSuccess={() => {
          setTenantNotices(NoticeService.getTenantNotices(user?.name || ''));
          showToast('Préavis de départ volontaire transmis au bailleur.');
        }}
        tenantName={tenant.name}
        tenantPhone={tenant.phone}
        tenantEmail={tenant.email}
        propertyName={tenant.property}
        unitNumber={tenant.unit}
        monthlyRent={tenant.monthlyRent}
      />

      {/* Modal d'État des Lieux en Lecture Seule pour le Locataire */}
      <InspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => setIsInspectionModalOpen(false)}
        leaseId={currentLease?.id || pendingLease?.id || ''}
        propertyName={tenant.property}
        unitNumber={tenant.unit}
        tenantName={tenant.name}
        inspectionData={inspectionData}
        readOnly={true}
      />

      {/* Lightbox Aperçu Photo Plein Écran */}
      {selectedInspectionPhoto && (
        <div
          onClick={() => setSelectedInspectionPhoto(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full max-h-[88vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col"
          >
            <div className="p-4 bg-slate-900/95 text-white flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedInspectionPhoto.label}</h4>
                  <p className="text-[11px] text-slate-400">
                    {selectedInspectionPhoto.room} • Prise le {selectedInspectionPhoto.timestamp}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedInspectionPhoto(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-3 overflow-hidden bg-black/60">
              <img
                src={selectedInspectionPhoto.url}
                alt={selectedInspectionPhoto.label}
                className="max-w-full max-h-[70vh] object-contain rounded-2xl shadow-2xl"
              />
            </div>
            <div className="p-3 bg-slate-900/90 border-t border-white/10 text-center">
              <span className="text-[11px] text-slate-400 font-medium">
                Photo contradictoire certifiée de l'état des lieux • Sceau d'inviolabilité numérique
              </span>
            </div>
          </div>
        </div>
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
