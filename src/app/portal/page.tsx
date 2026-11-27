'use client';

import React, { useState, useEffect, useRef, useMemo, Suspense } from 'react';
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
  Layers,
  ArrowUpDown,
  BellRing,
  FileWarning,
  ArrowLeft,
  Copy,
  Bell,
  CalendarDays,
  Compass,
  Plus,
  Award,
  TrendingUp,
  XCircle,
  AlertTriangle,
  Package,
  ShoppingBag,
  Store,
  Briefcase,
  MessageSquare,
  DoorOpen,
} from 'lucide-react';
import { formatFCFA, formatNotificationTime, getPaymentMethodLabel } from '@/lib/money/format';
import { ReceiptModal } from '@/components/dashboard/ReceiptModal';
import { PaymentTransaction } from '@/lib/types';
import { generateLeasePDF, generateInspectionPDF, generateNoticePDF } from '@/lib/export/pdf-download';
import { LeaseService, Lease } from '@/lib/services/lease-service';
import { NoticeService, Notice } from '@/lib/services/notice-service';
import { TenantNotificationService, TenantNotification } from '@/lib/services/tenant-notification-service';
import { ConversationService, Conversation, Message } from '@/lib/services/conversation-service';
import { TenantSignLeaseModal } from '@/components/leases/TenantSignLeaseModal';
import { TenantDepartureModal } from '@/components/portal/TenantDepartureModal';
import { FedaPayCheckoutModal } from '@/components/payments/FedaPayCheckoutModal';
import { InspectionModal } from '@/components/leases/InspectionModal';
import { InspectionService, InspectionData, InspectionPhoto } from '@/lib/services/inspection-service';
import { IncidentService, ReportedIncident } from '@/lib/services/incident-service';
import { MONTHS_OF_YEAR, PaymentService } from '@/lib/services/payment-service';
import { notifyAction, notifySave } from '@/lib/notifications/action-notifier';
import { Footer } from '@/components/layout/Footer';
import { SkeletonPortalDashboard } from '@/components/ui/SkeletonLoader';
import { AuthService, areEmailsEqual, arePhoneNumbersEqual, isCanonicalJojoVog } from '@/lib/services/auth-service';
import { SyncService } from '@/lib/services/sync-service';
import { TenantScoringService, SCORING_TIERS, TenantScoreBreakdown } from '@/lib/services/tenant-scoring-service';

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

  // Primary Tab state: 'accueil' (Mon Logement), 'quittances' (Mes Quittances & Reçus), 'bail' (Mon Bail & Contrat), 'edl' (États des Lieux), 'solvabilite' (Passeport), 'preavis' (Relances & Préavis)
  const [activeTab, setActiveTab] = useState<'accueil' | 'quittances' | 'bail' | 'edl' | 'solvabilite' | 'preavis'>('accueil');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  // Sub-tab inside "Mon Bail & Contrat" to switch between Bail, État des Lieux et Mon Bailleur
  const [bailSubTab, setBailSubTab] = useState<'tout' | 'bail_etat' | 'edl' | 'bailleur'>('tout');

  // Multi-Baux & Pluralité des États des Lieux
  const [selectedEdlLeaseId, setSelectedEdlLeaseId] = useState<string>('all');
  const [selectedInspectionLease, setSelectedInspectionLease] = useState<Lease | null>(null);
  const [edlRefreshTick, setEdlRefreshTick] = useState(0);

  const [declarationModalOpen, setDeclarationModalOpen] = useState(false);
  const [fedaPayModalOpen, setFedaPayModalOpen] = useState(false);
  const [fedaPayLease, setFedaPayLease] = useState<Lease | null>(null);
  const [reportIssueModalOpen, setReportIssueModalOpen] = useState(false);
  const [departureModalOpen, setDepartureModalOpen] = useState(false);

  // Préavis reçus ou émis pour le locataire
  const [tenantNotices, setTenantNotices] = useState<Notice[]>([]);

  useEffect(() => {
    const loadNotices = () => {
      setTenantNotices(NoticeService.getTenantNotices(user));
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
      setReportedIncidents(IncidentService.getIncidentsForTenant(user));
    };
    loadIncidents();
    window.addEventListener('locagestion:incidents_updated', loadIncidents);
    window.addEventListener('storage', loadIncidents);
    return () => {
      window.removeEventListener('locagestion:incidents_updated', loadIncidents);
      window.removeEventListener('storage', loadIncidents);
    };
  }, [user]);

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
    const targetIncidentLease = myLeases.find((l) => l.id === incidentLeaseId) || currentLease;

    IncidentService.addIncident({
      category: issueCategory,
      urgency: issueUrgency,
      description: issueDesc,
      photos: issuePhotos,
      tenantName: user?.name || 'Locataire',
      tenantPhone: user?.phone || '',
      tenantEmail: user?.email || '',
      property: targetIncidentLease?.property || tenant.property,
      unit: targetIncidentLease?.unit || tenant.unit,
      status: 'en_attente',
    });

    setReportedIncidents(IncidentService.getIncidents());
    setReportIssueModalOpen(false);
    setIssuePhotos([]);
    setIssueDesc('');
    const issueMsg = `Incident (${issueCategory})${photoCount > 0 ? ` avec ${photoCount} photo(s)` : ''} pour le logement ${targetIncidentLease?.unit || tenant.unit} transmis instantanément au bailleur ! Prise en charge sous 24h.`;
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
        queryTab === 'edl' ||
        queryTab === 'solvabilite' ||
        queryTab === 'preavis' ||
        queryTab === 'accueil'
      ) {
        setActiveTab(queryTab as any);
      } else if (!queryTab && typeof window !== 'undefined' && !window.location.hash) {
        setActiveTab('accueil');
      }

      // Détection automatique du retour après paiement direct FedaPay sur mobile
      const fedapayRef = searchParams.get('fedapay_ref') || searchParams.get('payment_status');
      if (fedapayRef === 'success') {
        setActiveTab('quittances');
        setToastMessage('🎉 Paiement Mobile Money validé ! Votre quittance officielle scellée est prête ci-dessous.');
        setTimeout(() => setToastMessage(null), 8000);
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
          target === 'edl' ||
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

  useEffect(() => {
    try {
      const notifs = TenantNotificationService.getNotifications(user);
      if (activeTab === 'quittances') {
        let changed = false;
        notifs.forEach((n) => {
          if (!n.read && (n.type === 'receipt_issued' || n.type === 'advance_payment_declared')) {
            TenantNotificationService.markAsRead(n.id);
            changed = true;
          }
        });
        if (changed) setPortalNotifs(TenantNotificationService.getNotifications(user));
      } else if (activeTab === 'bail') {
        let changed = false;
        notifs.forEach((n) => {
          if (!n.read && (n.type === 'lease_available' || n.type === 'lease_reactivated' || n.type === 'lease_resiliated')) {
            TenantNotificationService.markAsRead(n.id);
            changed = true;
          }
        });
        if (changed) setPortalNotifs(TenantNotificationService.getNotifications(user));
      } else if (activeTab === 'preavis') {
        let changed = false;
        notifs.forEach((n) => {
          if (!n.read && (n.type === 'notice_issued' || n.type === 'reminder_received')) {
            TenantNotificationService.markAsRead(n.id);
            changed = true;
          }
        });
        if (changed) setPortalNotifs(TenantNotificationService.getNotifications(user));
      }
    } catch {}
  }, [activeTab, user]);

  const handleTabChange = (tab: 'accueil' | 'quittances' | 'bail' | 'edl' | 'solvabilite' | 'preavis') => {
    setActiveTab(tab);
    try {
      const notifs = TenantNotificationService.getNotifications(user);
      if (tab === 'quittances') {
        notifs.forEach((n) => {
          if (!n.read && (n.type === 'receipt_issued' || n.type === 'advance_payment_declared')) {
            TenantNotificationService.markAsRead(n.id);
          }
        });
      } else if (tab === 'bail') {
        notifs.forEach((n) => {
          if (!n.read && (n.type === 'lease_available' || n.type === 'lease_reactivated' || n.type === 'lease_resiliated')) {
            TenantNotificationService.markAsRead(n.id);
          }
        });
      } else if (tab === 'preavis') {
        notifs.forEach((n) => {
          if (!n.read && (n.type === 'notice_issued' || n.type === 'reminder_received')) {
            TenantNotificationService.markAsRead(n.id);
          }
        });
      }
    } catch {}
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

  // Multi-Baux & Multi-Bailleurs state (Compte Locataire Unique)
  const [myLeases, setMyLeases] = useState<Lease[]>([]);
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>('all');
  const [declarationLeaseId, setDeclarationLeaseId] = useState<string>('');
  const [incidentLeaseId, setIncidentLeaseId] = useState<string>('');
  const [receiptSelectedLeaseId, setReceiptSelectedLeaseId] = useState<string>('all');

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
      if (user.role === 'admin' || user.email === 'admin@locagestion.site') return true;
      const leaseMat = l.tenantMatricule || (l as any).matricule;
      // 1. Profil canonique scellé Jojo VOG
      if (
        isCanonicalJojoVog(user.email || user.id || user.phone, user.matricule, user.name) &&
        isCanonicalJojoVog(l.tenantEmail || l.tenantId || l.tenantPhone, leaseMat, l.tenant)
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
      if (user.matricule && leaseMat && user.matricule === leaseMat) {
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

    // Sélection intelligente et prioritaire du bail du locataire connecté
    const matchingLeases = allLeases.filter((l) => (user && isLeaseMatchingUser(l)));

    matchingLeases.sort((a, b) => {
      // 1. Demande explicite par ID dans l'URL
      if (queryLeaseId && a.id === queryLeaseId) return -1;
      if (queryLeaseId && b.id === queryLeaseId) return 1;

      // 2. Si un bail en attente correspond
      if (pl && a.id === pl.id) return -1;
      if (pl && b.id === pl.id) return 1;

      // 3. Priorité absolue aux baux d'habitation (résidence principale / logement réel du locataire)
      const aIsHabitation = a.propertyUsage === 'habitation' || !a.propertyUsage;
      const bIsHabitation = b.propertyUsage === 'habitation' || !b.propertyUsage;
      if (aIsHabitation && !bIsHabitation) return -1;
      if (bIsHabitation && !aIsHabitation) return 1;

      // 4. Priorité aux baux actifs
      if (a.status === 'actif' && b.status !== 'actif') return -1;
      if (b.status === 'actif' && a.status !== 'actif') return 1;

      // 5. Priorité aux baux contresignés par le locataire
      if (a.signedByTenant && !b.signedByTenant) return -1;
      if (b.signedByTenant && !a.signedByTenant) return 1;

      // 6. Éliminer / reléguer tout ancien mock obsolète
      if (a.id === 'BAIL-2026-BJ-17635') return 1;
      if (b.id === 'BAIL-2026-BJ-17635') return -1;

      // 7. Privilégier le bail le plus récent par date réelle (timestamps)
      const parseDateNum = (s?: string) => {
        if (!s) return 0;
        const p = s.split('/');
        return p.length === 3 ? new Date(Number(p[2]), Number(p[1]) - 1, Number(p[0])).getTime() : 0;
      };
      const timeA = parseDateNum(a.tenantSignedAt || a.startDate);
      const timeB = parseDateNum(b.tenantSignedAt || b.startDate);
      return timeB - timeA;
    });

    setMyLeases(matchingLeases);

    if (matchingLeases.length > 0) {
      setDeclarationLeaseId((prev) => prev || matchingLeases[0].id);
      setIncidentLeaseId((prev) => prev || matchingLeases[0].id);
    }

    let targetLease: Lease | null = null;
    if (selectedLeaseId && selectedLeaseId !== 'all') {
      targetLease = matchingLeases.find((l) => l.id === selectedLeaseId) || null;
    }
    if (!targetLease) {
      targetLease = matchingLeases[0] || (queryLeaseId ? allLeases.find((l) => l.id === queryLeaseId) : null);
    }
    setCurrentLease(targetLease || null);
  };

  const getUsageInfo = (usage?: string) => {
    switch (usage) {
      case 'magasin':
        return { label: 'Magasin stockage', icon: Package, badgeColor: 'bg-amber-100 text-amber-800 border-amber-300' };
      case 'boutique':
        return { label: 'Boutique commerciale', icon: Store, badgeColor: 'bg-purple-100 text-purple-800 border-purple-300' };
      case 'commercial':
        return { label: 'Local commercial', icon: ShoppingBag, badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
      case 'bureau':
        return { label: 'Bureau professionnel', icon: Briefcase, badgeColor: 'bg-blue-100 text-blue-800 border-blue-300' };
      default:
        return { label: "Bail d'Habitation", icon: Home, badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    }
  };

  const totalCumulativeRent = useMemo(() => {
    return myLeases.reduce((acc, l) => acc + (l.rent || 0), 0);
  }, [myLeases]);

  const totalCumulativeCharges = useMemo(() => {
    return myLeases.reduce((acc, l) => acc + (l.charges || 0), 0);
  }, [myLeases]);

  const totalCumulativeDeposit = useMemo(() => {
    return myLeases.reduce((acc, l) => acc + (l.deposit || 0), 0);
  }, [myLeases]);

  const distinctLandlordsCount = useMemo(() => {
    const names = new Set(myLeases.map((l) => l.landlordSignature?.signedBy || l.landlordName || 'Bailleur'));
    return names.size;
  }, [myLeases]);

  const handleSelectLease = (leaseId: string) => {
    setSelectedLeaseId(leaseId);
    if (leaseId === 'all') {
      if (myLeases.length > 0) {
        setCurrentLease(myLeases[0]);
      }
    } else {
      const found = myLeases.find((l) => l.id === leaseId);
      if (found) {
        setCurrentLease(found);
        setDeclarationLeaseId(found.id);
        setIncidentLeaseId(found.id);
      }
    }
  };

  const openDeclarationModalForLease = (leaseId?: string) => {
    const targetL = leaseId ? myLeases.find((l) => l.id === leaseId) : (currentLease || myLeases[0]);
    if (targetL) {
      setDeclarationLeaseId(targetL.id);
      const months = paymentType === 'current' ? 1 : paymentType === 'advance' ? selectedAdvanceMonths.length || 1 : 1 + selectedAdvanceMonths.length;
      setDeclaredAmount(String(months * (targetL.rent || 0)));
    }
    setDeclarationModalOpen(true);
  };

  const openFedaPayModalForLease = (leaseId?: string) => {
    const targetL = leaseId ? myLeases.find((l) => l.id === leaseId) : (currentLease || myLeases[0]);
    setFedaPayLease(targetL || null);
    setFedaPayModalOpen(true);
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
      setEdlRefreshTick((t) => t + 1);
    };
    window.addEventListener('locagestion:inspections_updated', handleInspectionUpdate);
    window.addEventListener('storage', handleInspectionUpdate);
    return () => {
      window.removeEventListener('locagestion:inspections_updated', handleInspectionUpdate);
      window.removeEventListener('storage', handleInspectionUpdate);
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
      setPortalNotifs(TenantNotificationService.getNotifications(user));
    };
    loadNotifs();
    window.addEventListener('locagestion:tenant_notifs_updated', loadNotifs);
    window.addEventListener('locagestion:tenant_notifications_updated', loadNotifs);
    window.addEventListener('locagestion:auth_changed', loadNotifs);
    window.addEventListener('storage', loadNotifs);
    return () => {
      window.removeEventListener('locagestion:tenant_notifs_updated', loadNotifs);
      window.removeEventListener('locagestion:tenant_notifications_updated', loadNotifs);
      window.removeEventListener('locagestion:auth_changed', loadNotifs);
      window.removeEventListener('storage', loadNotifs);
    };
  }, [user]);

  // Relances de loyer et mises en demeure filtrées strictement (excluant chats et baux)
  const receivedReminders = useMemo(() => {
    return TenantNotificationService.getReminders(user);
  }, [portalNotifs, user]);

  // État de réponse directe du locataire à une relance de loyer
  const [reminderToReply, setReminderToReply] = useState<TenantNotification | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  const handleSendReminderReply = () => {
    if (!reminderToReply || !replyText.trim()) return;
    setIsSendingReply(true);
    try {
      const allConvs = ConversationService.getAllConversations();
      const myName = user?.name || tenant.name || 'Locataire';
      const landlordName = reminderToReply.actor || tenant.landlord.name || 'Bailleur';
      const landlordPhone = tenant.landlord.phone || '+229 01 95 44 44 30';
      const landlordEmail = tenant.landlord.email || 'jobovog@gmail.com';

      let targetConv = allConvs.find(
        (c) =>
          (c.visitorName?.toLowerCase() === myName.toLowerCase() ||
            c.tenantName?.toLowerCase() === myName.toLowerCase() ||
            (user?.email && c.visitorEmail && areEmailsEqual(user.email, c.visitorEmail)))
      );

      const now = new Date();
      const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const userAvatar = (user as any)?.avatar || (tenant as any)?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80';
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        sender: 'me',
        senderRole: 'locataire',
        senderName: myName,
        senderAvatar: userAvatar,
        text: `[Réponse à votre relance : « ${reminderToReply.title} »]\n\n${replyText.trim()}`,
        time: nowTime,
        status: 'sent',
      };

      if (targetConv) {
        targetConv.messages.push(newMsg);
        targetConv.lastMessage = `[Réponse relance] : ${replyText.trim().slice(0, 50)}...`;
        targetConv.lastMessageTime = nowTime;
        targetConv.hasUnread = true;
        targetConv.unreadBy = 'bailleur';
        targetConv.unreadCount = (targetConv.unreadCount || 0) + 1;
        ConversationService.saveConversations(
          allConvs.map((c) => (c.id === targetConv!.id ? targetConv! : c))
        );
      } else {
        const newConv: Conversation = {
          id: `conv-reply-${Date.now()}`,
          tenantName: myName,
          tenantAvatar: userAvatar,
          visitorName: myName,
          visitorEmail: user?.email,
          visitorPhone: user?.phone,
          visitorAvatar: userAvatar,
          publisherName: landlordName,
          authorName: landlordName,
          authorEmail: landlordEmail,
          authorPhone: landlordPhone,
          authorRole: 'bailleur',
          isOnline: true,
          propertyTitle: currentLease?.property || tenant.property,
          propertyUnit: currentLease?.unit || tenant.unit,
          propertySurface: '45 m²',
          propertyPrice: currentLease?.rent || tenant.monthlyRent,
          propertyThumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
          lastMessage: `[Réponse relance] : ${replyText.trim().slice(0, 50)}...`,
          lastMessageTime: nowTime,
          unreadCount: 1,
          hasUnread: true,
          unreadBy: 'bailleur',
          messages: [newMsg],
        };
        ConversationService.saveConversations([newConv, ...allConvs]);
      }

      LeaseService.addLandlordNotification({
        id: `notif-reply-${Date.now()}`,
        title: `💬 Réponse du locataire à votre relance`,
        message: `${myName} a répondu à votre relance pour ${currentLease?.unit || tenant.unit} : « ${replyText.trim().slice(0, 60)}... »`,
        type: 'message_received',
        time: nowTime,
        createdAt: now.toISOString(),
        read: false,
        tenantName: myName,
        property: currentLease?.property || tenant.property,
        unit: currentLease?.unit || tenant.unit,
      });

      TenantNotificationService.markAsRead(reminderToReply.id);
      setPortalNotifs(TenantNotificationService.getNotifications(user));

      showToast('Votre réponse a été transmise à votre bailleur avec succès !');
      setReminderToReply(null);
      setReplyText('');
    } catch (e) {
      console.error(e);
      showToast('Erreur lors de la transmission de votre réponse.');
    } finally {
      setIsSendingReply(false);
    }
  };

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



  const [copiedLandlordField, setCopiedLandlordField] = useState<string | null>(null);

  const handleCopyLandlordData = (fieldKey: string, value: string, label: string) => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopiedLandlordField(fieldKey);
    showToast(`${label} copié : ${value}`);
    setTimeout(() => setCopiedLandlordField(null), 2500);
  };

  // Résolution intelligente et certifiée des coordonnées officielles du Bailleur
  const resolvedLandlord = useMemo(() => {
    const l = currentLease;
    const signedByName = l?.landlordSignature?.signedBy || l?.landlordName || 'VOGLOSSOU JOHANE';

    let phone = l?.landlordPhone || '';
    let email = l?.landlordEmail || '';
    let ifu = l?.landlordIfu || '';
    let address = l?.landlordAddress || '';
    let wave = l?.landlordPaymentMethods?.wave || '';
    let mtn = l?.landlordPaymentMethods?.mtn || '';
    let moov = l?.landlordPaymentMethods?.moov || '';
    let bank = l?.landlordPaymentMethods?.bank || '';

    if (typeof window !== 'undefined') {
      try {
        const users = AuthService.getRegisteredUsers();
        const landlordUser = users.find(
          (u) =>
            (l?.landlordEmail && areEmailsEqual(u.email, l.landlordEmail)) ||
            (l?.landlordId && u.id === l.landlordId) ||
            (u.name && signedByName && u.name.trim().toLowerCase() === signedByName.trim().toLowerCase()) ||
            (u.role === 'bailleur')
        );

        if (landlordUser) {
          if (!phone) phone = landlordUser.phone || '';
          if (!email) email = landlordUser.email || '';
          if (!ifu) ifu = landlordUser.ifuNumber || '';
          if (!address) {
            address = landlordUser.residenceDistrict
              ? `${landlordUser.residenceDistrict}, ${landlordUser.residenceCity || 'Cotonou'}`
              : (landlordUser.residenceCity || 'Cotonou, Bénin');
          }
        }
      } catch (e) {}
    }

    if (!phone) phone = '+229 01 95 44 44 30';
    if (!email) email = 'jobovog@gmail.com';
    if (!ifu) ifu = '3201984210987';
    if (!address) address = 'Haie Vive, Cotonou, Bénin';
    if (!wave) wave = phone;
    if (!mtn) mtn = phone;
    if (!moov) moov = phone;
    if (!bank) bank = 'BJ061 01001 001234567890 45 (BOA Bénin)';

    return {
      name: signedByName,
      contactPerson: signedByName,
      role: 'Propriétaire',
      phone,
      whatsapp: phone,
      email,
      address,
      ifu,
      paymentMethods: {
        wave,
        mtn,
        moov,
        bank,
      },
    };
  }, [currentLease]);

  const [receiptsList, setReceiptsList] = useState<PaymentTransaction[]>([]);

  // Calcul dynamique et fonctionnel du score de solvabilité (100/100 en vert au départ)
  const tenantScoring = useMemo(() => {
    return TenantScoringService.calculateScore(
      user?.email || currentLease?.tenantEmail,
      user?.phone || currentLease?.tenantPhone
    );
  }, [user, receiptsList, currentLease]);

  const tenant = {
    name: user?.name || currentLease?.tenant || 'Locataire',
    phone: user?.phone || currentLease?.tenantPhone || '',
    email: user?.email || currentLease?.tenantEmail || '',
    property: currentLease?.property || 'Aucun logement lié',
    unit: currentLease?.unit || 'Non assigné',
    address: currentLease?.propertyLocation || currentLease?.propertyAddress || currentLease?.tenantAddress || 'Haie Vive, Cotonou, Bénin',
    propertyLocation: currentLease?.propertyLocation || 'Haie Vive, Cotonou, Bénin',
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
    landlord: resolvedLandlord,
    scoring: {
      score: tenantScoring.currentScore,
      badge: tenantScoring.tier.badge,
      onTimeRate: tenantScoring.isNewTenant
        ? 100
        : Math.round(
            100 *
              (tenantScoring.onTimePaymentsCount /
                Math.max(1, tenantScoring.onTimePaymentsCount + tenantScoring.delayedPaymentsCount))
          ),
      totalMonthsPaid: tenantScoring.onTimePaymentsCount,
    },
  };

  useEffect(() => {
    const syncReceipts = () => {
      try {
        const tenantPayments = PaymentService.getPaymentsForTenant(user, currentLease);
        setReceiptsList(tenantPayments);
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

  // Actions & Rendu des États des Lieux Multi-Baux
  const handleOpenInspectionModal = (targetLease: Lease) => {
    setSelectedInspectionLease(targetLease);
    setIsInspectionModalOpen(true);
  };

  const handleDownloadInspectionPDF = (targetLease: Lease) => {
    const data = InspectionService.getInspectionByLeaseId(targetLease.id);
    generateInspectionPDF({
      id: targetLease.id,
      tenantName: targetLease.tenant || tenant.name,
      propertyName: targetLease.property,
      unit: targetLease.unit,
      date: data.date,
      meterCashPower: data.meterCashPower,
      meterWater: data.meterWater,
      keysDelivered: data.keysDelivered,
      generalState:
        data.generalState === 'neuf'
          ? 'Neuf / Rénovation complète'
          : data.generalState === 'tres_bon'
          ? 'Très bon état d’usage'
          : data.generalState === 'bon'
          ? 'Bon état général'
          : 'À rafraîchir',
    });
    showToast(`Procès-verbal officiel d'état des lieux (${targetLease.id}) téléchargé en PDF !`);
  };

  const renderLeaseInspectionCard = (targetLease: Lease, showContractBadge = true) => {
    const leaseInspection = InspectionService.getInspectionByLeaseId(targetLease.id);
    const photosCount = leaseInspection.photos?.length || 0;
    const hasPhotos = photosCount > 0;
    const landlordName = targetLease.landlordSignature?.signedBy || targetLease.landlordName || 'Bailleur';
    const usage = getUsageInfo(targetLease.propertyUsage);
    const UsageIcon = usage.icon;

    return (
      <div
        key={`edl-card-${targetLease.id}`}
        className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-5 animate-in fade-in duration-200"
      >
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
                {showContractBadge && (
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 shrink-0 ${usage.badgeColor}`}>
                    <UsageIcon className="w-3 h-3" />
                    <span>{usage.label}</span>
                  </span>
                )}
                {hasPhotos ? (
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1 shrink-0">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Certifié Contradictoire</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1 shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>En attente de relevé</span>
                  </span>
                )}
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 shrink-0">
                  <Lock className="w-3 h-3 text-amber-600" />
                  <span>Consultation Locataire (Non modifiable)</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Dossier contradictoire et documents établis par votre bailleur (<strong>{landlordName}</strong>) pour le logement <strong>{targetLease.unit}</strong> ({targetLease.property}) • Réf Bail : <span className="font-mono font-bold text-slate-800">{targetLease.id}</span>.
              </p>
            </div>
          </div>

          {/* Actions Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => handleOpenInspectionModal(targetLease)}
              className="py-2.5 px-4 sm:px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 text-center"
            >
              <Eye className="w-4 h-4 shrink-0" />
              <span>Consulter l'état des lieux & photos ({photosCount})</span>
            </button>

            <button
              type="button"
              onClick={() => handleDownloadInspectionPDF(targetLease)}
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
              <span className="text-xs font-black text-slate-900 block mt-0.5 truncate">{leaseInspection.meterCashPower || 'Relevé contradictoire'}</span>
              <span className="text-[10px] text-slate-500 block">Relevé contradictoire</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700 shrink-0">
              <Droplet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Compteur d'Eau</span>
              <span className="text-xs font-black text-slate-900 block mt-0.5 truncate">{leaseInspection.meterWater || 'Index initial'}</span>
              <span className="text-[10px] text-slate-500 block">Index initial</span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
              <Key className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Clés & Accès</span>
              <span className="text-xs font-black text-slate-900 block mt-0.5 truncate">{leaseInspection.keysDelivered || 'Inventaire remis'}</span>
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
                {leaseInspection.generalState === 'neuf'
                  ? 'Neuf / Rénové'
                  : leaseInspection.generalState === 'tres_bon'
                  ? 'Très bon état'
                  : leaseInspection.generalState === 'bon'
                  ? 'Bon état général'
                  : 'À rafraîchir'}
              </span>
              <span className="text-[10px] text-emerald-600 font-bold block">Conforme au bail</span>
            </div>
          </div>
        </div>

        {/* Galerie des Photos Horodatées de l'État des Lieux */}
        {hasPhotos ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  Photos de l'État des Lieux du Bailleur ({photosCount} clichés horodatés)
                </span>
                <span className="text-[10px] text-slate-400 hidden sm:inline">• Cliquez pour agrandir en HD</span>
              </div>
              <button
                type="button"
                onClick={() => handleOpenInspectionModal(targetLease)}
                className="text-xs font-black text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Ouvrir l'inspection complète</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              {leaseInspection.photos.slice(0, 6).map((photo) => (
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
        ) : (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-slate-600">
              <Clock className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Les photos et relevés détaillés pour le contrat <strong>{targetLease.id}</strong> ({targetLease.unit}) sont en attente de dépôt par votre bailleur (<strong>{landlordName}</strong>).
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleOpenInspectionModal(targetLease)}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold shrink-0 cursor-pointer self-start sm:self-auto"
            >
              Consulter la fiche
            </button>
          </div>
        )}
      </div>
    );
  };

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

      // 4. Filtre par bail / lot sélectionné dans l'onglet quittances
      if (receiptSelectedLeaseId !== 'all') {
        const targetL = myLeases.find((l) => l.id === receiptSelectedLeaseId);
        if (targetL) {
          if (rec.leaseId && rec.leaseId !== targetL.id) return false;
          if (!rec.leaseId && !(rec.unitNumber === targetL.unit && rec.propertyName === targetL.property)) return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const timeA = parseFrDate(a.paymentDate);
      const timeB = parseFrDate(b.paymentDate);
      return receiptSortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  const handleDeclarePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const isAdvance = paymentType === 'advance' || paymentType === 'both';
    const targetPaymentLease = myLeases.find((l) => l.id === declarationLeaseId) || currentLease;
    const monthlyRent = targetPaymentLease?.rent || tenant.monthlyRent;
    const numAmount = parseInt(declaredAmount) || resolvedMonthsCount * monthlyRent;
    const dateStr = new Date().toLocaleDateString('fr-FR');
    const landlordName = targetPaymentLease?.landlordSignature?.signedBy || targetPaymentLease?.landlordName || 'VOGLOSSOU JOHANE';
    const newTx: PaymentTransaction = {
      id: `decl-${Date.now()}`,
      receiptNumber: `DEC-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      tenantId: user?.id || (targetPaymentLease as any)?.tenantId || 'usr-tenant',
      tenantName: user?.name || tenant.name,
      tenantAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
      tenantPhone: user?.phone || tenant.phone,
      tenantEmail: user?.email || tenant.email,
      tenantMatricule: user?.matricule || (targetPaymentLease as any)?.tenantMatricule,
      propertyName: targetPaymentLease?.property || tenant.property,
      unitNumber: targetPaymentLease?.unit || tenant.unit,
      leaseId: targetPaymentLease?.id,
      landlordId: targetPaymentLease?.landlordId,
      landlordName: landlordName,
      amount: numAmount,
      expectedAmount: monthlyRent,
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
      message: `Déclaration de loyer de ${formatFCFA(numAmount)} pour le lot ${targetPaymentLease?.unit || tenant.unit} (${resolvedPeriodLabel}) via ${declaredMethod.toUpperCase()} (Réf: ${declaredRef || 'Non spécifiée'}).`,
      type: 'payment_declared',
      read: false,
      createdAt: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      tenantName: tenant.name,
      unit: targetPaymentLease?.unit || tenant.unit,
      property: targetPaymentLease?.property || tenant.property,
      paymentId: newTx.id,
    });

    // Enregistrer instantanément dans les notifications du locataire
    if (isAdvance) {
      TenantNotificationService.notifyAdvancePaymentDeclared({
        amount: numAmount,
        period: resolvedPeriodLabel,
        advanceMonthsCount: resolvedMonthsCount,
        tenantName: tenant.name,
        tenantEmail: user?.email || tenant.email,
        tenantPhone: user?.phone || tenant.phone,
      });
    } else {
      TenantNotificationService.addNotification({
        title: 'Paiement de Loyer Déclaré',
        message: `Votre déclaration de ${formatFCFA(numAmount)} pour ${targetPaymentLease?.unit || tenant.unit} (${resolvedPeriodLabel}) auprès de ${landlordName} est enregistrée. Quittance certifiée dès validation.`,
        type: 'receipt_issued',
        link: '/portal?tab=quittances',
        tenantName: tenant.name,
        tenantEmail: user?.email || tenant.email,
        tenantPhone: user?.phone || tenant.phone,
        actor: 'Système LOCAGESTION',
      });
    }

    setDeclarationModalOpen(false);
    setProofFile(null);
    const payMsg = isAdvance
      ? `Déclaration de ${resolvedMonthsCount} mois d'avance (${formatFCFA(numAmount)}) transmise avec succès au bailleur ${landlordName} !`
      : `Déclaration de ${formatFCFA(numAmount)} (${resolvedPeriodLabel}) transmise avec succès au bailleur ${landlordName} ! Quittance émise dès validation.`;
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
              {/* Top Segmented Navigation Tabs (Parfaitement accessible et défilable sur Web & Mobile) */}
              <div className="resident-subbar flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200/80 shadow-soft overflow-x-auto scrollbar-none touch-pan-x">
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
              {activeTab !== 'quittances' && portalNotifs.filter((n) => !n.read && (n.type === 'receipt_issued' || n.type === 'advance_payment_declared')).length > 0 ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500 text-white animate-pulse">
                  {portalNotifs.filter((n) => !n.read && (n.type === 'receipt_issued' || n.type === 'advance_payment_declared')).length}
                </span>
              ) : (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'quittances' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {receiptsList.length}
                </span>
              )}
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
              {activeTab !== 'bail' && (() => {
                const unreadLeaseNotifs = portalNotifs.filter((n) => !n.read && (n.type === 'lease_available' || n.type === 'lease_reactivated' || n.type === 'lease_resiliated')).length;
                return unreadLeaseNotifs > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500 text-white animate-pulse">
                    {unreadLeaseNotifs}
                  </span>
                ) : null;
              })()}
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('edl')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'edl'
                  ? 'bg-black text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>États des Lieux</span>
              {myLeases.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    activeTab === 'edl' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {myLeases.length}
                </span>
              )}
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
                className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight ${
                  activeTab === 'solvabilite'
                    ? 'bg-white/25 text-white'
                    : tenantScoring.currentScore >= 85
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : tenantScoring.currentScore >= 70
                    ? 'bg-teal-100 text-teal-800 border border-teal-300'
                    : tenantScoring.currentScore >= 50
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}
              >
                {tenantScoring.currentScore}/100
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('preavis')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'preavis'
                  ? 'bg-black text-white shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BellRing className="w-4 h-4" />
              <span>Relances & Préavis</span>
              {activeTab !== 'preavis' && (() => {
                const unreadRems = receivedReminders.filter((n) => !n.read).length;
                const unreadNotifIssued = portalNotifs.filter((n) => !n.read && n.type === 'notice_issued').length;
                const count = unreadRems + unreadNotifIssued;
                return count > 0 ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {count}
                  </span>
                ) : null;
              })()}
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

              {/* Hero Banner: Rent Due & Quick Payment (Placé en tête au tout début à l'ouverture, compact et pro sur mobile) */}
              <div className="bg-gradient-to-br from-slate-900 via-[#141824] to-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-7 text-white shadow-lg sm:shadow-xl relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-6">
                  <div>
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2 flex-wrap">
                      <span className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold shadow-xs flex items-center gap-1 ${
                        currentLease
                          ? (receiptsList.length > 0 && receiptsList[0]?.isVerified ? 'bg-emerald-500 text-white' : 'bg-brand-500 text-white')
                          : 'bg-slate-700 text-slate-200'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {selectedLeaseId === 'all' && myLeases.length > 1
                          ? `${myLeases.length} Baux Actifs • Multi-Bailleurs`
                          : currentLease
                          ? (receiptsList.length > 0 ? (receiptsList[0]?.isVerified ? 'Loyer à jour' : 'Règlement en attente') : 'Bail actif • En attente 1er loyer')
                          : 'En attente d’assignation'}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-slate-300 font-medium flex items-center flex-wrap gap-1 sm:gap-1.5">
                        {user?.matricule && (
                          <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-black text-indigo-300 bg-indigo-500/20 px-1.5 sm:px-2 py-0.5 rounded-md border border-indigo-500/30 shadow-xs">
                            <span>Matricule : {user.matricule}</span>
                          </span>
                        )}
                        {selectedLeaseId === 'all' && myLeases.length > 1 ? (
                          <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-purple-300 bg-purple-500/20 px-1.5 sm:px-2 py-0.5 rounded-md border border-purple-500/30">
                            <Store className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                            <span>Habitation, Magasins & Boutiques</span>
                          </span>
                        ) : currentLease ? (
                          <>
                            <span>{tenant.property} • {tenant.unit}</span>
                            <span className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 sm:px-2 py-0.5 rounded-md border border-emerald-500/30">
                              <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                              <span>{tenant.propertyLocation}</span>
                            </span>
                          </>
                        ) : (
                          'Aucun logement lié'
                        )}
                      </span>
                    </div>

                    <h1 className="text-sm sm:text-lg lg:text-xl font-black tracking-tight text-white leading-snug">
                      Bonjour {user?.firstName || (user?.name ? user.name.split(' ')[0] : 'Locataire')} 👋{currentLease ? ', votre espace est parfaitement à jour' : ', bienvenue dans votre espace résident'}
                    </h1>
                    <p className="text-[11px] sm:text-xs text-slate-300 sm:text-slate-400 mt-1 sm:mt-1.5 max-w-lg leading-snug sm:leading-relaxed">
                      {selectedLeaseId === 'all' && myLeases.length > 1 ? (
                        <>Total loyers mensuels cumulés : <strong className="text-slate-100 font-bold">{formatFCFA(totalCumulativeRent)}</strong> sur vos {myLeases.length} baux ({distinctLandlordsCount} bailleurs). Chaque loyer se déclare directement auprès du bailleur concerné.</>
                      ) : currentLease ? (
                        <>Prochaine exigibilité de loyer : <strong className="text-slate-200">{tenant.dueDate}</strong> ({formatFCFA(tenant.monthlyRent)} charges comprises).</>
                      ) : (
                        <>Bienvenue dans votre Espace Résident. Vos quittances certifiées et informations contractuelles apparaîtront ici dès que votre bailleur vous aura assigné votre logement.</>
                      )}
                    </p>
                  </div>

                  {/* Actions Principales du Locataire : 2 colonnes ultra-ergonomiques sur mobile, flex sur desktop */}
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3 shrink-0 pt-0.5 sm:pt-0 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => openDeclarationModalForLease()}
                      className="w-full sm:w-auto py-2.5 sm:py-3.5 px-2.5 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-[11px] sm:text-sm font-black shadow-pink-glow active:scale-95 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer text-center"
                    >
                      <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                      <span className="truncate">Déclarer un loyer</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setReportIssueModalOpen(true)}
                      className="w-full sm:w-auto py-2.5 sm:py-3.5 px-2.5 sm:px-5 rounded-xl sm:rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white text-[11px] sm:text-sm font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer text-center"
                    >
                      <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-brand-300 shrink-0" />
                      <span className="truncate">Signaler une panne</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* SÉLECTEUR MULTI-BAUX & MULTI-BAILLEURS (Compte Locataire Unique) */}
              {myLeases.length > 1 && (
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-soft space-y-3 animate-in fade-in duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-xl bg-brand-50 text-brand-600">
                        <Store className="w-4 h-4" />
                      </span>
                      <div>
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                          Mes Baux & Bailleurs Rattachés ({myLeases.length} contrats • {distinctLandlordsCount} bailleur{distinctLandlordsCount > 1 ? 's' : ''})
                        </h3>
                        <p className="text-[11px] text-slate-500">
                          Pilotez vos locations d'habitation, magasins et boutiques depuis votre compte unique.
                        </p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Loyers Mensuels</span>
                      <strong className="text-xs sm:text-sm font-black text-emerald-700">{formatFCFA(totalCumulativeRent)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                    {/* Bouton Vue d'ensemble */}
                    <button
                      type="button"
                      onClick={() => handleSelectLease('all')}
                      className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                        selectedLeaseId === 'all'
                          ? 'bg-slate-900 text-white shadow-md font-black'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 text-brand-400" />
                      <span>Vue d'ensemble (Tous mes baux)</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 font-mono font-bold">
                        {myLeases.length}
                      </span>
                    </button>

                    {/* Un bouton par bail */}
                    {myLeases.map((l) => {
                      const usage = getUsageInfo(l.propertyUsage);
                      const UsageIcon = usage.icon;
                      const isSelected = selectedLeaseId === l.id;
                      const landlord = l.landlordSignature?.signedBy || l.landlordName || 'Bailleur';
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => handleSelectLease(l.id)}
                          className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                            isSelected
                              ? 'bg-brand-500 text-white border-brand-600 shadow-md shadow-brand-500/25 font-black'
                              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-2xs'
                          }`}
                        >
                          <UsageIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-600'}`} />
                          <span className="truncate max-w-[150px] sm:max-w-[200px]">
                            {l.unit} ({usage.label.split(' ')[0]})
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                            isSelected ? 'bg-white/25 text-white' : 'bg-slate-100 text-slate-800'
                          }`}>
                            {formatFCFA(l.rent)}
                          </span>
                          <span className={`text-[10px] hidden md:inline ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                            • {landlord}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* GRILLE VOS BAUX & BAILLEURS RATTACHÉS (Affichée en vue d'ensemble multi-baux) */}
              {selectedLeaseId === 'all' && myLeases.length > 1 && (
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
                      <Store className="w-4 h-4 text-brand-600" />
                      <span>Vos Baux Actifs & Bailleurs ({myLeases.length})</span>
                    </h3>
                    <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                      Gestion indépendante bailleur par bailleur
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {myLeases.map((l) => {
                      const usage = getUsageInfo(l.propertyUsage);
                      const UsageIcon = usage.icon;
                      const landlordName = l.landlordSignature?.signedBy || l.landlordName || 'Bailleur';
                      const landlordPhone = l.landlordPhone || '+229 01 95 44 44 30';
                      return (
                        <div
                          key={l.id}
                          className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-soft flex flex-col justify-between space-y-4 hover:border-brand-300 transition-all"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${usage.badgeColor}`}>
                                <UsageIcon className="w-3 h-3" />
                                <span>{usage.label}</span>
                              </span>
                              <span className="text-[10px] font-mono font-bold text-slate-400">{l.id}</span>
                            </div>
                            <div>
                              <h4 className="font-black text-sm text-slate-900 leading-tight">{l.unit}</h4>
                              <p className="text-xs text-slate-500 mt-0.5">{l.property} • {l.propertyLocation || 'Cotonou'}</p>
                            </div>
                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Bailleur :</span>
                                <strong className="text-slate-900 truncate max-w-[130px]">{landlordName}</strong>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Loyer mensuel :</span>
                                <strong className="text-emerald-700 font-black">{formatFCFA(l.rent)}</strong>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Échéance :</span>
                                <span className="text-slate-700 font-bold">Le 5 du mois</span>
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => openFedaPayModalForLease(l.id)}
                              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Payer par Mobile Money (FedaPay)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeclarationModalForLease(l.id)}
                              className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                              <span>Déclarer un paiement espèces / virement</span>
                            </button>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  handleSelectLease(l.id);
                                  handleTabChange('bail');
                                }}
                                className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold text-center transition-colors cursor-pointer"
                              >
                                Voir contrat
                              </button>
                              <a
                                href={`https://wa.me/${landlordPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                                  `Bonjour ${landlordName}, je suis ${tenant.name} pour le bail ${l.id} (${l.unit}). Je vous contacte depuis mon espace locataire LOCAGESTION.`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold text-center border border-emerald-200 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                              >
                                <MessageCircle className="w-3 h-3 text-emerald-600" />
                                <span>WhatsApp</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

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
                          <span className="text-slate-700 font-medium">{getPaymentMethodLabel(receiptsList[0]?.method)}</span>
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

                {/* Mon Bailleur & Contact Rapide (Affiché sur grand écran desktop, masqué sur mobile pour une interface épurée) */}
                <div className="hidden lg:flex bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex-col justify-between space-y-4">
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
                        {tenant.landlord.contactPerson && tenant.landlord.contactPerson !== tenant.landlord.name && (
                          <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            {tenant.landlord.contactPerson}
                          </span>
                        )}
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

                  {currentLease && (
                    <button
                      type="button"
                      onClick={() => {
                        handleTabChange('bail');
                        setBailSubTab('bailleur');
                      }}
                      className="w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200/60 cursor-pointer"
                    >
                      <span>Comptes Wave, MTN & RIB Bancaire →</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Fiche Logement Détaillée & Synthèse Multi-Baux */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-5 h-5 text-slate-700 shrink-0" />
                    <h3 className="font-black text-base text-slate-900">
                      {selectedLeaseId === 'all' && myLeases.length > 1
                        ? `Synthèse Financière & Caractéristiques Cumulées (${myLeases.length} Baux en Cours)`
                        : currentLease?.propertyUsage === 'magasin'
                        ? `Caractéristiques du Local — ${currentLease?.unit || 'Magasin'}`
                        : currentLease?.propertyUsage === 'boutique'
                        ? `Caractéristiques du Local — ${currentLease?.unit || 'Boutique'}`
                        : `Caractéristiques de Votre Logement Actuel`}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {currentLease && (
                      <button
                        type="button"
                        onClick={() => handleOpenInspectionModal(currentLease)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                        title="Consulter l'état des lieux contradictoire de ce bail"
                      >
                        <Camera className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          État des lieux
                          {InspectionService.getInspectionByLeaseId(currentLease.id).photos.length > 0
                            ? ` (${InspectionService.getInspectionByLeaseId(currentLease.id).photos.length} photos)`
                            : ''}
                        </span>
                      </button>
                    )}
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border self-start sm:self-auto shrink-0 ${
                      currentLease || myLeases.length > 0
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                        : 'text-slate-600 bg-slate-100 border-slate-200'
                    }`}>
                      {selectedLeaseId === 'all' && myLeases.length > 1
                        ? `${myLeases.length} Baux en cours d'exécution`
                        : currentLease
                        ? "Bail en cours d'exécution"
                        : 'En attente de bail'}
                    </span>
                  </div>
                </div>

                {myLeases.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {selectedLeaseId === 'all' && myLeases.length > 1 ? 'Loyer Mensuel Net Cumulé' : 'Loyer Mensuel Net'}
                        </span>
                        <span className="text-base font-black text-slate-900 mt-0.5 block">
                          {formatFCFA(selectedLeaseId === 'all' && myLeases.length > 1 ? totalCumulativeRent : (currentLease?.rent || tenant.monthlyRent))}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {selectedLeaseId === 'all' && myLeases.length > 1 ? `Cumul de vos ${myLeases.length} baux` : 'Hors charges'}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {selectedLeaseId === 'all' && myLeases.length > 1 ? 'Charges Locatives Totales' : 'Charges Locatives'}
                        </span>
                        <span className="text-base font-black text-slate-900 mt-0.5 block">
                          {formatFCFA(selectedLeaseId === 'all' && myLeases.length > 1 ? totalCumulativeCharges : (currentLease?.charges !== undefined ? currentLease.charges : tenant.charges))}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {selectedLeaseId === 'all' && myLeases.length > 1 ? 'Cumul charges mensuelles' : 'Gardiennage & entretien'}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          {selectedLeaseId === 'all' && myLeases.length > 1 ? 'Dépôt de Garantie Total' : 'Dépôt de Garantie'}
                        </span>
                        <span className="text-base font-black text-slate-900 mt-0.5 block">
                          {formatFCFA(selectedLeaseId === 'all' && myLeases.length > 1 ? totalCumulativeDeposit : (currentLease?.deposit !== undefined ? currentLease.deposit : tenant.deposit))}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {selectedLeaseId === 'all' && myLeases.length > 1 ? 'Total cautions consignées' : 'Caution consignée'}
                        </span>
                      </div>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Échéance Mensuelle</span>
                        <span className="text-base font-black text-emerald-700 mt-0.5 block">{tenant.dueDate}</span>
                        <span className="text-[10px] text-slate-500">Au plus tard</span>
                      </div>
                    </div>

                    {/* En vue d'ensemble : Détail clair de chaque contrat (affiché sur desktop, masqué sur mobile) */}
                    {selectedLeaseId === 'all' && myLeases.length > 1 && (
                      <div className="hidden md:block pt-3 border-t border-slate-100 space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                            Ventilation par contrat de location ({myLeases.length} baux actifs) :
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Sélectionnez un bail pour voir ses spécificités isolées
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {myLeases.map((l) => {
                            const usage = getUsageInfo(l.propertyUsage);
                            const landlord = l.landlordSignature?.signedBy || l.landlordName || 'Bailleur';
                            return (
                              <div
                                key={l.id}
                                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-brand-400 hover:shadow-xs transition-all space-y-2"
                              >
                                <div className="flex items-center justify-between gap-1.5">
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${usage.badgeColor}`}>
                                    {usage.label}
                                  </span>
                                  <span className="text-[10px] font-mono font-bold text-slate-400">{l.id}</span>
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-slate-900 truncate">{l.unit}</h4>
                                  <p className="text-[11px] text-slate-500 truncate">{l.property}</p>
                                </div>
                                <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-xs">
                                  <div>
                                    <span className="text-[10px] text-slate-400 block">Loyer net</span>
                                    <strong className="text-slate-900 font-black">{formatFCFA(l.rent)}</strong>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] text-slate-400 block">Charges</span>
                                    <span className="font-bold text-slate-700 text-[11px]">{formatFCFA(l.charges || 0)}</span>
                                  </div>
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  Bailleur : <strong className="text-slate-700">{landlord}</strong>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSelectLease(l.id)}
                                  className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-brand-50 hover:text-brand-600 border border-slate-200 text-[11px] font-bold text-slate-700 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <span>Afficher ce bail →</span>
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* En vue isolée d'un bail spécifique : Lien de retour vers la vue d'ensemble */}
                    {selectedLeaseId !== 'all' && myLeases.length > 1 && (
                      <div className="pt-2 flex items-center justify-between text-xs">
                        <span className="text-slate-500 text-[11px]">
                          Bailleur : <strong className="text-slate-800">{currentLease?.landlordSignature?.signedBy || currentLease?.landlordName || 'Bailleur'}</strong> • Réf : <span className="font-mono">{currentLease?.id}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleSelectLease('all')}
                          className="text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer flex items-center gap-1"
                        >
                          <span>← Revenir à la synthèse cumulée</span>
                        </button>
                      </div>
                    )}
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
              {/* SECTION : ÉTATS DES LIEUX & CONSTATS PHOTOS (Multi-Baux Compatible)  */}
              {/* ==================================================================== */}
              {myLeases.length > 0 && (
                <div className="space-y-4">
                  {/* Sélecteur de contrats si pluralité de baux signés */}
                  {myLeases.length > 1 && (
                    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-soft space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
                        <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-emerald-600" />
                          <span>États des lieux par contrat ({myLeases.length} baux souscrits) :</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleTabChange('edl')}
                          className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                        >
                          <span>Ouvrir l'Espace États des Lieux complet →</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                        <button
                          type="button"
                          onClick={() => setSelectedEdlLeaseId('all')}
                          className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                            selectedEdlLeaseId === 'all'
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md font-black'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Tous les états des lieux ({myLeases.length})</span>
                        </button>
                        {myLeases.map((l) => {
                          const isSel = selectedEdlLeaseId === l.id;
                          const usage = getUsageInfo(l.propertyUsage);
                          const UsageIcon = usage.icon;
                          const lPhotos = InspectionService.getInspectionByLeaseId(l.id).photos.length;
                          return (
                            <button
                              key={`edl-btn-${l.id}`}
                              type="button"
                              onClick={() => setSelectedEdlLeaseId(l.id)}
                              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                                isSel
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-black'
                                  : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-2xs'
                              }`}
                            >
                              <UsageIcon className={`w-3.5 h-3.5 ${isSel ? 'text-white' : 'text-slate-500'}`} />
                              <span>{l.unit}</span>
                              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${isSel ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                {l.id}
                              </span>
                              {lPhotos > 0 && (
                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isSel ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                                  {lPhotos} ph.
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Cartes d'États des Lieux */}
                  {selectedEdlLeaseId === 'all'
                    ? myLeases.map((l) => renderLeaseInspectionCard(l, myLeases.length > 1))
                    : (() => {
                        const targetL = myLeases.find((l) => l.id === selectedEdlLeaseId) || myLeases[0];
                        return renderLeaseInspectionCard(targetL, myLeases.length > 1);
                      })()}
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

              {/* Filtre par Bail / Bailleur pour Locataire Multi-Baux */}
              {myLeases.length > 1 && (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-brand-500" />
                      <span>Filtrer par bail / bailleur :</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {receiptSelectedLeaseId === 'all'
                        ? 'Affichage consolidé de tous vos baux'
                        : `Bail sélectionné : ${receiptSelectedLeaseId}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                    <button
                      type="button"
                      onClick={() => setReceiptSelectedLeaseId('all')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                        receiptSelectedLeaseId === 'all'
                          ? 'bg-slate-900 text-white shadow-xs font-black'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      Toutes les quittances ({receiptsList.length})
                    </button>
                    {myLeases.map((l) => {
                      const count = receiptsList.filter(
                        (r) => r.leaseId === l.id || (r.unitNumber === l.unit && r.propertyName === l.property)
                      ).length;
                      const landlord = l.landlordSignature?.signedBy || l.landlordName || 'Bailleur';
                      const isSel = receiptSelectedLeaseId === l.id;
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setReceiptSelectedLeaseId(l.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                            isSel
                              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs font-black'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <span>{l.unit}</span>
                          <span className={`text-[10px] ml-1.5 px-1.5 py-0.2 rounded-full font-mono ${
                            isSel ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {count}
                          </span>
                          <span className={`text-[10px] ml-1 hidden sm:inline ${isSel ? 'text-white/80' : 'text-slate-400'}`}>
                            ({landlord})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
                          <span className="font-bold text-slate-800">{rec.propertyName} ({rec.unitNumber})</span>
                          {rec.landlordName && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.2 rounded">
                                Bailleur : {rec.landlordName}
                              </span>
                            </>
                          )}
                          <span>•</span>
                          <span>Payé le {rec.paymentDate} via {getPaymentMethodLabel(rec.method)}</span>
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
                  <div className="grid grid-cols-2 sm:flex items-center gap-1 p-1 bg-slate-100 rounded-2xl border border-slate-200/60 w-full sm:w-auto shrink-0">
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
                      onClick={() => setBailSubTab('edl')}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer text-center ${
                        bailSubTab === 'edl'
                          ? 'bg-emerald-600 text-white shadow-sm font-black'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      État des Lieux ({myLeases.length})
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

              {/* SÉLECTEUR DE BAIL ACTIF (Locataire Multi-Baux) */}
              {myLeases.length > 1 && (
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-soft space-y-2.5">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-brand-500" />
                      <span>Sélectionnez le contrat à consulter ({myLeases.length} baux actifs) :</span>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Bail affiché : <strong className="text-slate-800">{currentLease?.id || 'N/A'}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                    {myLeases.map((l) => {
                      const usage = getUsageInfo(l.propertyUsage);
                      const UsageIcon = usage.icon;
                      const isSel = currentLease?.id === l.id;
                      const landlord = l.landlordSignature?.signedBy || l.landlordName || 'Bailleur';
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => {
                            setCurrentLease(l);
                            setSelectedLeaseId(l.id);
                          }}
                          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                            isSel
                              ? 'bg-slate-900 text-white border-slate-900 shadow-md font-black'
                              : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-2xs'
                          }`}
                        >
                          <UsageIcon className={`w-3.5 h-3.5 ${isSel ? 'text-brand-400' : 'text-slate-500'}`} />
                          <span>{l.unit} ({usage.label})</span>
                          <span className={`text-[10px] font-mono font-black ${isSel ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            {formatFCFA(l.rent)}
                          </span>
                          <span className={`text-[10px] hidden sm:inline ${isSel ? 'text-white/70' : 'text-slate-400'}`}>
                            • {landlord}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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

              {/* SOUS-SECTION ÉTAT DES LIEUX ASSOCIÉ AU CONTRAT */}
              {(bailSubTab === 'tout' || bailSubTab === 'edl') && (
                currentLease ? (
                  <div className="space-y-4">
                    {renderLeaseInspectionCard(currentLease, myLeases.length > 1)}
                  </div>
                ) : null
              )}

              {/* SOUS-SECTION 2 : MON BAILLEUR & GESTIONNAIRE */}
              {(bailSubTab === 'tout' || bailSubTab === 'bailleur') && (
                currentLease ? (
                  <div id="landlord-info-card" className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-6 scroll-mt-24">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black shadow-md shadow-slate-900/10">
                          <Building2 className="w-6 h-6 text-brand-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-black text-lg text-slate-900">
                              {tenant.landlord.name || 'VOGLOSSOU JOHANE'}
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>Bailleur Officiel</span>
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Représenté par <strong>{tenant.landlord.contactPerson || 'VOGLOSSOU JOHANE'}</strong> ({tenant.landlord.role})
                          </p>
                        </div>
                      </div>

                      {/* Direct WhatsApp CTA Button */}
                      {(tenant.landlord.whatsapp || tenant.landlord.phone) && (
                        <a
                          href={`https://wa.me/${(tenant.landlord.whatsapp || tenant.landlord.phone).replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Bonjour, je suis ${tenant.name} (${tenant.unit}). Je vous contacte depuis mon espace locataire LOCAGESTION concernant le bail ${tenant.leaseRef}.`
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

                    {/* Coordonnées & IFU avec boutons de copie instantanée */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Téléphone Direct */}
                      <div className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/70 transition-all flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Téléphone Direct
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyLandlordData('phone', tenant.landlord.phone, 'Téléphone')}
                            className="p-1 rounded-md text-slate-400 hover:text-brand-600 hover:bg-white transition-colors cursor-pointer"
                            title="Copier le numéro"
                          >
                            {copiedLandlordField === 'phone' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <a
                          href={`tel:${tenant.landlord.phone}`}
                          className="text-xs font-black text-slate-900 hover:text-brand-600 flex items-center gap-1.5"
                        >
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tenant.landlord.phone}</span>
                        </a>
                      </div>

                      {/* Email Professionnel */}
                      <div className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/70 transition-all flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Email Professionnel
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyLandlordData('email', tenant.landlord.email, 'Email')}
                            className="p-1 rounded-md text-slate-400 hover:text-brand-600 hover:bg-white transition-colors cursor-pointer"
                            title="Copier l'email"
                          >
                            {copiedLandlordField === 'email' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <a
                          href={`mailto:${tenant.landlord.email}`}
                          className="text-xs font-black text-slate-900 hover:text-brand-600 flex items-center gap-1.5 truncate"
                        >
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{tenant.landlord.email}</span>
                        </a>
                      </div>

                      {/* Numéro IFU Fiscal */}
                      <div className="p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/70 border border-slate-200/70 transition-all flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Numéro IFU Fiscal
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyLandlordData('ifu', tenant.landlord.ifu, 'Numéro IFU')}
                            className="p-1 rounded-md text-slate-400 hover:text-brand-600 hover:bg-white transition-colors cursor-pointer"
                            title="Copier l'IFU"
                          >
                            {copiedLandlordField === 'ifu' ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-xs font-mono font-black text-slate-900 flex items-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{tenant.landlord.ifu}</span>
                        </span>
                      </div>
                    </div>

                    {/* Payment Accounts Guide */}
                    <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-brand-500" />
                          <span>Comptes Officiels pour le Règlement du Loyer</span>
                        </h4>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Sécurisé & Certifié
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        {/* Wave */}
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-blue-600 block">Wave Mobile Money</span>
                            <button
                              type="button"
                              onClick={() => handleCopyLandlordData('wave', tenant.landlord.paymentMethods.wave, 'Compte Wave')}
                              className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Copier le numéro Wave"
                            >
                              {copiedLandlordField === 'wave' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <strong className="text-slate-900 block font-mono text-xs">{tenant.landlord.paymentMethods.wave}</strong>
                          <span className="text-[9px] text-slate-400 mt-1 block">Transfert direct sans frais</span>
                        </div>

                        {/* MTN */}
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-amber-600 block">MTN Mobile Money</span>
                            <button
                              type="button"
                              onClick={() => handleCopyLandlordData('mtn', tenant.landlord.paymentMethods.mtn, 'Compte MTN')}
                              className="p-1 rounded-md text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
                              title="Copier le numéro MTN"
                            >
                              {copiedLandlordField === 'mtn' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <strong className="text-slate-900 block font-mono text-xs">{tenant.landlord.paymentMethods.mtn}</strong>
                          <span className="text-[9px] text-slate-400 mt-1 block">Paiement Mobile Money Bénin</span>
                        </div>

                        {/* Bank Transfer */}
                        <div className="p-3.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-black text-emerald-600 block">Virement Bancaire (BOA)</span>
                            <button
                              type="button"
                              onClick={() => handleCopyLandlordData('bank', tenant.landlord.paymentMethods.bank, 'RIB Virement')}
                              className="p-1 rounded-md text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                              title="Copier le RIB"
                            >
                              {copiedLandlordField === 'bank' ? (
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                          <strong className="text-slate-900 block font-mono text-[11px] truncate" title={tenant.landlord.paymentMethods.bank}>
                            {tenant.landlord.paymentMethods.bank}
                          </strong>
                          <span className="text-[9px] text-slate-400 mt-1 block">Bank of Africa Bénin</span>
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
          {/* ONGLET 3 BIS : ÉTATS DES LIEUX CONTRADICTOIRES (Multi-Baux)          */}
          {/* ==================================================================== */}
          {activeTab === 'edl' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Header Box */}
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-soft space-y-4">
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
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 shadow-xs">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                          États des Lieux Contradictoires
                        </h2>
                        <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {myLeases.length} {myLeases.length > 1 ? 'Contrats Actifs' : 'Contrat Actif'}
                        </span>
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                          Scellé Numérique UEMOA / CEMAC
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Procès-verbaux d'entrée, relevés de compteurs (Cash Power, eau), inventaire des clés et photographies horodatées certifiées pour chacun de vos logements et locaux loués.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sélecteur de contrats si pluralité */}
                {myLeases.length > 1 && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                      Filtrer par contrat de location ({myLeases.length} baux en cours) :
                    </span>
                    <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
                      <button
                        type="button"
                        onClick={() => setSelectedEdlLeaseId('all')}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                          selectedEdlLeaseId === 'all'
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md font-black'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Tous les contrats ({myLeases.length})</span>
                      </button>
                      {myLeases.map((l) => {
                        const isSel = selectedEdlLeaseId === l.id;
                        const usage = getUsageInfo(l.propertyUsage);
                        const UsageIcon = usage.icon;
                        const lPhotos = InspectionService.getInspectionByLeaseId(l.id).photos.length;
                        return (
                          <button
                            key={`tab-edl-btn-${l.id}`}
                            type="button"
                            onClick={() => setSelectedEdlLeaseId(l.id)}
                            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer border ${
                              isSel
                                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md font-black'
                                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 shadow-2xs'
                            }`}
                          >
                            <UsageIcon className={`w-3.5 h-3.5 ${isSel ? 'text-white' : 'text-slate-500'}`} />
                            <span>{l.unit}</span>
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${isSel ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'}`}>
                              {l.id}
                            </span>
                            {lPhotos > 0 && (
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isSel ? 'bg-emerald-800 text-white' : 'bg-emerald-100 text-emerald-800'}`}>
                                {lPhotos} ph.
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Liste des Cartes d'États des Lieux */}
              {myLeases.length > 0 ? (
                <div className="space-y-6">
                  {selectedEdlLeaseId === 'all'
                    ? myLeases.map((l) => renderLeaseInspectionCard(l, myLeases.length > 1))
                    : (() => {
                        const targetL = myLeases.find((l) => l.id === selectedEdlLeaseId) || myLeases[0];
                        return renderLeaseInspectionCard(targetL, myLeases.length > 1);
                      })()}
                </div>
              ) : (
                <div className="rounded-3xl p-8 sm:p-12 border border-slate-200/80 bg-white shadow-soft text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-slate-800">Aucun état des lieux pour le moment</h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Les procès-verbaux contradictoires, relevés de compteurs et photos apparaîtront ici dès que vos contrats de bail seront transmis et signés.
                  </p>
                </div>
              )}
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
              <div
                className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-r ${tenantScoring.tier.bgGradient} text-white flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl relative overflow-hidden`}
              >
                <div className="absolute right-0 top-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                <div className="relative z-10 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black uppercase tracking-wider text-white/90">
                      Score de Solvabilité & Ponctualité
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/20 border border-white/30 text-white">
                      Certifié LOCAGESTION
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl sm:text-6xl font-black tracking-tight">{tenantScoring.currentScore}</span>
                    <span className="text-xl sm:text-2xl text-white/80 font-bold">/ 100</span>
                  </div>

                  <p className="text-xs text-white/90 max-w-xl leading-relaxed">
                    {tenantScoring.isNewTenant
                      ? '✓ Nouveau Résident : Votre score démarre à 100/100 (Palier Vert). Il reste au maximum tant que vous respectez l’échéance du 5 de chaque mois.'
                      : tenantScoring.tier.description}
                  </p>
                </div>

                <div className="relative z-10 flex flex-col sm:items-end gap-2 shrink-0">
                  <div className="px-4 py-2 rounded-2xl bg-white/20 backdrop-blur-md text-white text-xs font-black border border-white/30 shadow-sm self-start sm:self-auto">
                    {tenantScoring.tier.badge}
                  </div>
                  <span className="text-[11px] text-white/80 font-medium">
                    Palier : <strong className="text-white uppercase">{tenantScoring.tier.label}</strong>
                  </span>
                </div>
              </div>

              {/* Barre de Progression Visuelle */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-black text-slate-700">Indice de ponctualité locative</span>
                  <span className={`font-black ${tenantScoring.tier.textColor}`}>{tenantScoring.currentScore} %</span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      tenantScoring.currentScore >= 85
                        ? 'bg-emerald-500'
                        : tenantScoring.currentScore >= 70
                        ? 'bg-teal-500'
                        : tenantScoring.currentScore >= 50
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${tenantScoring.currentScore}%` }}
                  />
                </div>
              </div>

              {/* Grille des 4 Paliers Professionnels de Solvabilité */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <Award className="w-4 h-4 text-brand-600" />
                    <span>Barème Officiel des Paliers de Solvabilité</span>
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">Standard PropTech UEMOA / CEMAC</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Palier Vert */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      tenantScoring.tier.tier === 'excellent'
                        ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-emerald-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        <span>Vert (85 à 100)</span>
                      </span>
                      {tenantScoring.tier.tier === 'excellent' && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 border border-emerald-300">
                          Votre Palier
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 block">Solvabilité Maximale</span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Nouveau compte ou règlements à l'heure. Dossier prioritaire sans caution supplémentaire.
                    </p>
                  </div>

                  {/* Palier Bleu */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      tenantScoring.tier.tier === 'bon'
                        ? 'bg-teal-50/80 border-teal-300 ring-2 ring-teal-500/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-teal-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                        <span>Bleu (70 à 84)</span>
                      </span>
                      {tenantScoring.tier.tier === 'bon' && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-teal-200 text-teal-800 border border-teal-300">
                          Votre Palier
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 block">Locataire Fiable</span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Retards très légers (&lt; 5 j.) résolus rapidement. Profil validé par 95% des bailleurs.
                    </p>
                  </div>

                  {/* Palier Orange */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      tenantScoring.tier.tier === 'vigilance'
                        ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-amber-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        <span>Orange (50 à 69)</span>
                      </span>
                      {tenantScoring.tier.tier === 'vigilance' && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 border border-amber-300">
                          Votre Palier
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 block">Vigilance Requise</span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Retards répétés (6 à 15 j.) ou relance active. Garant ou justificatifs demandés.
                    </p>
                  </div>

                  {/* Palier Rouge */}
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      tenantScoring.tier.tier === 'critique'
                        ? 'bg-rose-50/80 border-rose-300 ring-2 ring-rose-500/20 shadow-xs'
                        : 'bg-slate-50 border-slate-200 opacity-75'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-black text-rose-800 flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                        <span>Rouge (0 à 49)</span>
                      </span>
                      {tenantScoring.tier.tier === 'critique' && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 border border-rose-300">
                          Votre Palier
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-bold text-slate-900 block">Risque Élevé d'Impayé</span>
                    <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                      Retard &gt; 15 jours, mise en demeure ou impayé. Risque de résiliation de bail.
                    </p>
                  </div>
                </div>
              </div>

              {/* Facteurs Objectifs d'Évolution du Score */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span>Détail Objectif du Calcul de Votre Score</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">Moteur déterministe certifié</span>
                </div>

                <div className="space-y-2">
                  {tenantScoring.factors.map((f, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-xl bg-white border border-slate-200/80 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {f.type === 'positive' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : f.type === 'negative' ? (
                          <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                        )}
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 block truncate">{f.title}</span>
                          <span className="text-[10px] text-slate-500 block truncate">{f.description}</span>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-black shrink-0 px-2 py-0.5 rounded-md ${
                          f.impact > 0
                            ? 'bg-emerald-100 text-emerald-800'
                            : f.impact < 0
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {f.impact > 0 ? `+${f.impact} pts` : f.impact < 0 ? `${f.impact} pts` : 'Initial'}
                      </span>
                    </div>
                  ))}
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

              {/* ==================================================================== */}
              {/* SECTION 1 : RELANCES DE LOYER & MISES EN DEMEURE REÇUES              */}
              {/* ==================================================================== */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BellRing className="w-4 h-4 text-rose-600" />
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      Relances de Loyer & Mises en Demeure Reçues ({receivedReminders.length})
                    </h3>
                  </div>
                  {receivedReminders.some((n) => !n.read) && (
                    <button
                      type="button"
                      onClick={() => {
                        receivedReminders.forEach((r) => TenantNotificationService.markAsRead(r.id));
                        setPortalNotifs(TenantNotificationService.getNotifications(user));
                      }}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
                    >
                      Tout marquer lu
                    </button>
                  )}
                </div>

                {receivedReminders.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white border border-slate-200/80 shadow-soft text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-slate-900">
                        Aucune relance de loyer en attente
                      </h4>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        Tous vos règlements de loyer sont à jour auprès de votre bailleur. Aucun impayé ni rappel de paiement n’a été émis à votre encontre.
                      </p>
                    </div>
                    <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleTabChange('quittances')}
                        className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                      >
                        Consulter mes quittances ({receiptsList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeclarationModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                      >
                        + Déclarer un paiement
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {receivedReminders.map((reminder) => {
                      const isUnread = !reminder.read;
                      const titleLower = (reminder.title || '').toLowerCase();
                      const isMiseEnDemeure = titleLower.includes('mise en demeure') || titleLower.includes('sommation');
                      const isFerme = titleLower.includes('ferme') || titleLower.includes('retard') || titleLower.includes('impayé');

                      return (
                        <div
                          key={reminder.id}
                          className={`rounded-3xl p-5 sm:p-6 bg-white border shadow-soft space-y-4 transition-all ${
                            isMiseEnDemeure
                              ? 'border-rose-300 ring-2 ring-rose-500/10'
                              : isFerme
                              ? 'border-amber-300 ring-2 ring-amber-500/10'
                              : isUnread
                              ? 'border-blue-300 ring-2 ring-blue-500/10'
                              : 'border-slate-200/80'
                          }`}
                        >
                          {/* Header Relance */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              {isMiseEnDemeure ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>Mise en Demeure Formelle (J+15)</span>
                                </span>
                              ) : isFerme ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 text-amber-600" />
                                  <span>Notification de Retard de Loyer</span>
                                </span>
                              ) : (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                  <BellRing className="w-3 h-3 text-blue-600" />
                                  <span>Rappel d’Échéance de Loyer</span>
                                </span>
                              )}

                              {isUnread && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-slate-950">
                                  Nouveau
                                </span>
                              )}

                              <h4 className="text-xs sm:text-sm font-black text-slate-900">
                                {reminder.title}
                              </h4>
                            </div>

                            <span className="text-[11px] text-slate-400 font-mono">
                              {formatNotificationTime(reminder)}
                            </span>
                          </div>

                          {/* Message et Contexte */}
                          <div className="space-y-2">
                            <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/70">
                              {reminder.message}
                            </p>
                            <div className="flex items-center justify-between text-[11px] text-slate-400">
                              <span>Émetteur : <strong className="text-slate-700">{reminder.actor || tenant.landlord.name || 'Bailleur'}</strong></span>
                              <span>Logement : <strong className="text-slate-700">{currentLease ? `${currentLease.property} (${currentLease.unit})` : tenant.unit}</strong></span>
                            </div>
                          </div>

                          {/* Zone d'action : Répondre à la Relance */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                TenantNotificationService.markAsRead(reminder.id);
                                setPortalNotifs(TenantNotificationService.getNotifications(user));
                                openFedaPayModalForLease(currentLease?.id);
                              }}
                              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-sm flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Payer par Mobile Money (FedaPay)</span>
                            </button>

                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                type="button"
                                onClick={() => {
                                  setReminderToReply(reminder);
                                  setReplyText('');
                                }}
                                className="py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-brand-300" />
                                <span>Répondre au Bailleur</span>
                              </button>

                              <a
                                href={`https://wa.me/${(tenant.landlord.whatsapp || tenant.landlord.phone || '2290197000000').replace(/\D/g, '')}?text=${encodeURIComponent(
                                  `Bonjour ${tenant.landlord.name || 'Bailleur'},\nJe fais suite à votre relance concernant le loyer de ${currentLease?.unit || tenant.unit}.\nJe vous contacte pour convenir de la régularisation.\nCordialement,\n${tenant.name}`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-2.5 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Échanger sur WhatsApp</span>
                              </a>

                              {tenant.landlord.phone && (
                                <a
                                  href={`tel:${tenant.landlord.phone.replace(/\s+/g, '')}`}
                                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold border border-slate-200 flex items-center justify-center gap-1 transition-all cursor-pointer"
                                  title="Appeler directement le bailleur"
                                >
                                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Appeler</span>
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ==================================================================== */}
              {/* SECTION 2 : PRÉAVIS DE CONGÉ OFFICIELS                               */}
              {/* ==================================================================== */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileWarning className="w-4 h-4 text-rose-600" />
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      Préavis de Congé Officiels ({tenantNotices.length})
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Notifications juridiquement opposables (UEMOA / CEMAC)
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

                              <Link
                                href="/messages"
                                className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-brand-300" />
                                <span>Messagerie</span>
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ==================================================================== */}
              {/* SECTION 3 : TRANSMETTRE UN PRÉAVIS DE DÉPART VOLONTAIRE (LOCATAIRE)  */}
              {/* ==================================================================== */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DoorOpen className="w-4 h-4 text-brand-600" />
                    <h3 className="text-sm font-black text-slate-900 tracking-tight">
                      Démarche : Notifier un Départ Volontaire
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Délai légal de 1 à 3 mois selon le bail
                  </span>
                </div>

                <div className="p-5 sm:p-6 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1 max-w-2xl">
                      <h4 className="text-xs font-black text-slate-900">
                        Vous prévoyez de déménager ou de libérer votre logement ?
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Conformément au Code Foncier et Domanial et aux dispositions contractuelles de votre bail, transmettez officiellement votre notification de congé avec calcul automatique de la date d'effet, du calendrier d'état des lieux contradictoire de sortie et du délai légal de restitution de votre dépôt de garantie (30 jours).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setDepartureModalOpen(true)}
                      className="py-2.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black shadow-pink-glow flex items-center gap-2 cursor-pointer active:scale-95 transition-all shrink-0 self-start sm:self-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Transmettre mon Préavis</span>
                    </button>
                  </div>
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
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setDeclarationModalOpen(false)}
        >
          <div
            className="relative w-full max-w-xl max-h-[92vh] sm:max-h-[88vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Fixe / Toujours visible */}
            <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center border border-brand-500/30">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">
                    Déclarer un Paiement de Loyer
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Règlement direct ou transmission de justificatif
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeclarationModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps du Formulaire Défilant */}
            <form id="declare-payment-form" onSubmit={handleDeclarePayment} className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
              {/* Option Recommandée : Paiement Direct Sécurisé FedaPay */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-extrabold text-xs">
                    <Zap className="w-4 h-4 text-emerald-600" />
                    <span>Paiement Direct Instantané (Mobile Money)</span>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Réglez par MTN, Moov, Wave ou Orange Money : quittance officielle scellée délivrée immédiatement sans attente de validation bailleur.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDeclarationModalOpen(false);
                    openFedaPayModalForLease(declarationLeaseId || currentLease?.id);
                  }}
                  className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shrink-0 shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Payer via FedaPay</span>
                </button>
              </div>

              {/* Sélecteur de Bailleur / Bail si compte multi-baux */}
              {myLeases.length > 1 && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-800 flex items-center gap-1.5 text-xs">
                      <Store className="w-4 h-4 text-brand-500 shrink-0" />
                      <span>Quel loyer / bailleur réglez-vous ? *</span>
                    </label>
                    <span className="text-[10px] text-brand-600 font-bold bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                      Multi-Baux Actif
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {myLeases.map((l) => {
                      const usage = getUsageInfo(l.propertyUsage);
                      const isSel = declarationLeaseId === l.id;
                      const landlord = l.landlordSignature?.signedBy || l.landlordName || 'Bailleur';
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => {
                            setDeclarationLeaseId(l.id);
                            const months = paymentType === 'current' ? 1 : paymentType === 'advance' ? selectedAdvanceMonths.length || 1 : 1 + selectedAdvanceMonths.length;
                            setDeclaredAmount(String(months * (l.rent || 0)));
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                            isSel
                              ? 'bg-brand-50/80 border-brand-500 ring-2 ring-brand-500/20 text-brand-950 font-bold shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-black text-xs text-slate-900 truncate">
                              {l.unit || l.property || 'Lot'}
                            </span>
                            <span className="text-xs font-mono text-emerald-700 font-black bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 shrink-0 whitespace-nowrap">
                              {formatFCFA(l.rent)}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block truncate mt-1">
                            Bailleur : <strong className="text-slate-700">{landlord}</strong>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1.5 text-xs">
                  Moyen de paiement utilisé *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeclaredMethod('wave')}
                    className={`py-2.5 px-2 rounded-xl border font-extrabold text-xs text-center cursor-pointer transition-all active:scale-95 ${
                      declaredMethod === 'wave'
                        ? 'border-brand-500 bg-brand-50 text-brand-600 ring-2 ring-brand-500/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Wave Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeclaredMethod('mtn')}
                    className={`py-2.5 px-2 rounded-xl border font-extrabold text-xs text-center cursor-pointer transition-all active:scale-95 ${
                      declaredMethod === 'mtn'
                        ? 'border-brand-500 bg-brand-50 text-brand-600 ring-2 ring-brand-500/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    MTN Mobile
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeclaredMethod('moov')}
                    className={`py-2.5 px-2 rounded-xl border font-extrabold text-xs text-center cursor-pointer transition-all active:scale-95 ${
                      declaredMethod === 'moov'
                        ? 'border-brand-500 bg-brand-50 text-brand-600 ring-2 ring-brand-500/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Moov Money
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeclaredMethod('virement')}
                    className={`py-2.5 px-2 rounded-xl border font-extrabold text-xs text-center cursor-pointer transition-all active:scale-95 ${
                      declaredMethod === 'virement'
                        ? 'border-brand-500 bg-brand-50 text-brand-600 ring-2 ring-brand-500/20 shadow-xs'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Virement
                  </button>
                </div>
              </div>

              {/* Coordonnées de paiement officielles du Bailleur sélectionné */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/90 text-xs space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="font-extrabold text-amber-950 flex items-center gap-1.5 text-xs">
                    <CreditCard className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>
                      Compte {declaredMethod.toUpperCase()} du bailleur (
                      {(() => {
                        const l = myLeases.find((item) => item.id === declarationLeaseId) || currentLease;
                        return l?.landlordSignature?.signedBy || l?.landlordName || 'VOGLOSSOU JOHANE';
                      })()}
                      ) :
                    </span>
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-800 uppercase bg-amber-200/60 px-2 py-0.5 rounded-full border border-amber-300">
                    {declaredMethod}
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-amber-200 shadow-2xs gap-2">
                  <span className="font-mono font-black text-slate-900 select-all truncate text-xs sm:text-sm">
                    {(() => {
                      const l = myLeases.find((item) => item.id === declarationLeaseId) || currentLease;
                      if (declaredMethod === 'wave') return l?.landlordPaymentMethods?.wave || l?.landlordPhone || '+229 01 95 44 44 30';
                      if (declaredMethod === 'mtn') return l?.landlordPaymentMethods?.mtn || l?.landlordPhone || '+229 01 95 44 44 30';
                      if (declaredMethod === 'moov') return l?.landlordPaymentMethods?.moov || l?.landlordPhone || '+229 01 95 44 44 30';
                      return l?.landlordPaymentMethods?.bank || 'BJ061 01001 001234567890 45 (BOA Bénin)';
                    })()}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const l = myLeases.find((item) => item.id === declarationLeaseId) || currentLease;
                      let val = '';
                      if (declaredMethod === 'wave') val = l?.landlordPaymentMethods?.wave || l?.landlordPhone || '+229 01 95 44 44 30';
                      else if (declaredMethod === 'mtn') val = l?.landlordPaymentMethods?.mtn || l?.landlordPhone || '+229 01 95 44 44 30';
                      else if (declaredMethod === 'moov') val = l?.landlordPaymentMethods?.moov || l?.landlordPhone || '+229 01 95 44 44 30';
                      else val = l?.landlordPaymentMethods?.bank || 'BJ061 01001 001234567890 45 (BOA Bénin)';
                      navigator.clipboard?.writeText(val);
                      showToast(`Numéro/Compte ${declaredMethod.toUpperCase()} copié : ${val}`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs transition-colors cursor-pointer shrink-0 flex items-center gap-1 active:scale-95"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copier</span>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-3.5 text-center hover:border-brand-500 hover:bg-brand-50/20 transition-all cursor-pointer bg-slate-50"
                  >
                    <UploadCloud className="w-7 h-7 text-brand-500 mx-auto mb-1" />
                    <span className="font-bold text-slate-700 block text-xs">
                      Cliquer pour joindre une photo ou capture
                    </span>
                    <span className="text-[10px] text-slate-400">
                      PNG, JPG ou PDF (max 5 Mo)
                    </span>
                  </div>
                )}
              </div>
            </form>

            {/* Footer Fixe / Toujours visible en bas */}
            <div className="px-5 sm:px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setDeclarationModalOpen(false)}
                className="py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition-colors cursor-pointer text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                form="declare-payment-form"
                className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black shadow-pink-glow active:scale-95 transition-all cursor-pointer flex items-center gap-2 text-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Envoyer la déclaration</span>
              </button>
            </div>
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
              {myLeases.length > 1 && (
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Dans quel logement / local se situe la panne ? *
                  </label>
                  <select
                    value={incidentLeaseId}
                    onChange={(e) => setIncidentLeaseId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    {myLeases.map((l) => {
                      const usage = getUsageInfo(l.propertyUsage);
                      const landlord = l.landlordSignature?.signedBy || l.landlordName || 'Bailleur';
                      return (
                        <option key={l.id} value={l.id}>
                          {l.unit} ({usage.label}) — {l.property} (Bailleur : {landlord})
                        </option>
                      );
                    })}
                  </select>
                </div>
              )}
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
            setActiveTab('bail');
            setBailSubTab('tout');
            checkLeases();
            if (typeof window !== 'undefined') {
              setTimeout(() => {
                const card = document.getElementById('landlord-info-card');
                if (card) {
                  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 300);
            }
          }}
          onSignedSuccess={(updatedLease) => {
            const signMsg = `Bail ${updatedLease.id} contresigné avec succès ! Coordonnées et comptes officiels du bailleur déverrouillés.`;
            showToast(signMsg);
            notifySave(signMsg, 'Bail contresigné avec succès !');
            handleDismissPendingBanner(updatedLease.id);
            setPendingLease(null);
            setCurrentLease(updatedLease);
            setActiveTab('bail');
            setBailSubTab('tout');
            if (typeof window !== 'undefined') {
              try {
                const url = new URL(window.location.href);
                url.searchParams.set('tab', 'bail');
                url.searchParams.delete('leaseId');
                url.searchParams.delete('code');
                url.searchParams.delete('tenant');
                window.history.replaceState({}, '', url.toString());
              } catch (e) {}
              setTimeout(() => {
                const card = document.getElementById('landlord-info-card');
                if (card) {
                  card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }, 300);
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
          setTenantNotices(NoticeService.getTenantNotices(user));
          showToast('Préavis de départ volontaire transmis au bailleur.');
        }}
        tenantName={tenant.name}
        tenantPhone={tenant.phone}
        tenantEmail={tenant.email}
        propertyName={tenant.property}
        unitNumber={tenant.unit}
        monthlyRent={tenant.monthlyRent}
        landlordName={tenant.landlord?.name || 'VOGLOSSOU JOHANE'}
        landlordEmail={tenant.landlord?.email || 'jobovog@gmail.com'}
        landlordPhone={tenant.landlord?.phone || tenant.landlord?.whatsapp || '+229 01 95 44 44 30'}
      />

      {/* Modal d'État des Lieux en Lecture Seule pour le Locataire (Multi-Baux Compatible) */}
      <InspectionModal
        isOpen={isInspectionModalOpen}
        onClose={() => {
          setIsInspectionModalOpen(false);
          setSelectedInspectionLease(null);
        }}
        leaseId={selectedInspectionLease?.id || currentLease?.id || pendingLease?.id || ''}
        propertyName={selectedInspectionLease?.property || currentLease?.property || tenant.property}
        unitNumber={selectedInspectionLease?.unit || currentLease?.unit || tenant.unit}
        tenantName={selectedInspectionLease?.tenant || currentLease?.tenant || tenant.name}
        inspectionData={InspectionService.getInspectionByLeaseId(
          selectedInspectionLease?.id || currentLease?.id || pendingLease?.id || ''
        )}
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

      {/* Modal : Répondre à la Relance du Bailleur */}
      {reminderToReply && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setReminderToReply(null)}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    Répondre à la Relance
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Destinataire : {reminderToReply.actor || tenant.landlord.name || 'Bailleur Propriétaire'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReminderToReply(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Rappel du contexte */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Relance concernée
                </span>
                <h4 className="font-bold text-slate-900">{reminderToReply.title}</h4>
                <p className="text-[11px] text-slate-600 line-clamp-2">{reminderToReply.message}</p>
              </div>

              {/* Suggestions rapides */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1.5">
                  Réponses rapides prêtes à l’envoi :
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "J'effectue le règlement ce jour par Wave / Mobile Money.",
                    "Je sollicite un court délai de 48 heures pour régulariser.",
                    "Le paiement a déjà été effectué, quittance en attente.",
                    "Je vous transmets la preuve de virement dès ce soir.",
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setReplyText(chip)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-700 text-[11px] transition-colors text-left cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Zone de texte libre */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Votre message au bailleur *
                </label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Ex : Bonjour, je vous confirme que le paiement est en cours de traitement..."
                  rows={4}
                  className="w-full p-3 rounded-2xl border border-slate-200 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
                />
              </div>

              {/* Actions directes */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
                <a
                  href={`https://wa.me/${(tenant.landlord.whatsapp || tenant.landlord.phone || '2290197000000').replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Bonjour ${tenant.landlord.name || 'Bailleur'},\nJe fais suite à votre relance : « ${reminderToReply.title} ».\n\n${replyText || 'Je vous contacte pour convenir de la régularisation de mon loyer.'}\n\nCordialement,\n${tenant.name}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Préférer WhatsApp</span>
                </a>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setReminderToReply(null)}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    disabled={!replyText.trim() || isSendingReply}
                    onClick={handleSendReminderReply}
                    className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-black shadow-pink-glow flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingReply ? 'Envoi...' : 'Envoyer la Réponse'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal FedaPay Checkout Direct avec Quittance Instantanée */}
      <FedaPayCheckoutModal
        isOpen={fedaPayModalOpen}
        onClose={() => setFedaPayModalOpen(false)}
        lease={fedaPayLease || currentLease || myLeases[0] || null}
        tenantUser={
          user
            ? {
                id: user.id,
                name: user.name,
                phone: user.phone,
                email: user.email,
                matricule: user.matricule,
              }
            : undefined
        }
        onPaymentSuccess={() => {
          checkLeases();
          if (user) {
            setPortalNotifs(TenantNotificationService.getNotifications(user));
          }
          setToastMessage('Paiement Mobile Money validé ! Votre quittance officielle a été émise.');
          setTimeout(() => setToastMessage(null), 5000);
        }}
      />

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
