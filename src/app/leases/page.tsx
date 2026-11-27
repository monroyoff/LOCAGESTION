'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  FileText,
  Plus,
  CheckCircle2,
  Clock,
  Calendar,
  Building,
  User,
  ShieldCheck,
  Download,
  Eye,
  Sparkles,
  ArrowRight,
  PenTool,
  Send,
  MessageCircle,
  ExternalLink,
  AlertCircle,
  Ban,
  RotateCcw,
  Search,
  Filter,
  ArrowUpDown,
  Home,
  Camera,
  MapPin,
  History,
  ArrowLeft,
  Trash2,
  Archive,
} from 'lucide-react';
import { InspectionModal, InspectionData } from '@/components/leases/InspectionModal';
import { InspectionService } from '@/lib/services/inspection-service';
import { formatFCFA } from '@/lib/money/format';
import { UserSpace } from '@/lib/types';
import { QuickActionModal } from '@/components/dashboard/QuickActionModal';
import { ConfirmTerminateLeaseModal } from '@/components/leases/ConfirmTerminateLeaseModal';
import { generateLeasePDF } from '@/lib/export/pdf-download';
import { Lease, LeaseService, canReactivateLease, getDaysSinceResiliation } from '@/lib/services/lease-service';
import { useSpace } from '@/lib/context/space-context';
import { notifyAction, notifySave, notifyDelete } from '@/lib/notifications/action-notifier';
import { Footer } from '@/components/layout/Footer';
import { SkeletonLeaseCard } from '@/components/ui/SkeletonLoader';
import { PlanService } from '@/lib/services/plan-service';
import { UpgradePlanModal } from '@/components/plans/UpgradePlanModal';

export default function LeasesPage() {
  const router = useRouter();
  const spaceCtx = useSpace();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSpace, setActiveSpace] = useState<UserSpace>('bailleur');

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);
  const [quickAction, setQuickAction] = useState<
    'new_lease' | 'new_payment' | 'new_property' | null
  >(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [lastResiliatedId, setLastResiliatedId] = useState<string | null>(null);
  const [leaseToTerminate, setLeaseToTerminate] = useState<Lease | null>(null);
  const [selectedInspectionLease, setSelectedInspectionLease] = useState<Lease | null>(null);
  const [isInspectionModalOpen, setIsInspectionModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(() => PlanService.getUserPlan(spaceCtx.user?.id));
  const [userSub, setUserSub] = useState(() => PlanService.getUserSubscription(spaceCtx.user?.id));

  useEffect(() => {
    const handlePlanChange = () => {
      setCurrentPlan(PlanService.getUserPlan(spaceCtx.user?.id));
      setUserSub(PlanService.getUserSubscription(spaceCtx.user?.id));
    };
    window.addEventListener('locagestion:plan_changed', handlePlanChange);
    return () => window.removeEventListener('locagestion:plan_changed', handlePlanChange);
  }, [spaceCtx.user?.id]);

  // État des baux réactifs gérés par le LeaseService
  const [leases, setLeases] = useState<Lease[]>([]);
  const [filterTab, setFilterTab] = useState<'current' | 'pending' | 'active' | 'historique'>('current');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'historique' || tabParam === 'history' || tabParam === 'resiliated') {
        setFilterTab('historique');
      } else if (tabParam === 'pending') {
        setFilterTab('pending');
      } else if (tabParam === 'active') {
        setFilterTab('active');
      } else if (tabParam === 'current' || tabParam === 'all') {
        setFilterTab('current');
      }
    }
  }, []);

  const refreshLeases = () => {
    setLeases(LeaseService.getLeasesForLandlord(spaceCtx.user));
    try {
      const lNotifs = LeaseService.getLandlordNotifications(spaceCtx.user);
      lNotifs.forEach((n) => {
        if (
          !n.read &&
          (n.type === 'lease_signed' ||
            n.type === 'lease_transmitted' ||
            n.type === 'lease_terminated' ||
            n.type === 'lease_reactivated')
        ) {
          LeaseService.markNotificationAsRead(n.id);
        }
      });
    } catch { }
  };

  useEffect(() => {
    refreshLeases();

    const handleStorageUpdate = () => {
      refreshLeases();
    };

    window.addEventListener('locagestion:leases_updated', handleStorageUpdate);
    window.addEventListener('locagestion:notifications_updated', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);

    let bc: BroadcastChannel | null = null;
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        bc = new BroadcastChannel('locagestion_realtime');
        bc.onmessage = () => refreshLeases();
      }
    } catch { }

    return () => {
      window.removeEventListener('locagestion:leases_updated', handleStorageUpdate);
      window.removeEventListener('locagestion:notifications_updated', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
      try {
        bc?.close();
      } catch { }
    };
  }, [spaceCtx.user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Action Bailleur : Résilier définitivement le bail avec motif (déplacé dans l'Historique de bail)
  const handleTerminateLease = (lease: Lease, reason?: string) => {
    LeaseService.terminateLease(lease.id, reason);
    setLastResiliatedId(lease.id);
    refreshLeases();
    const msg = `Bail ${lease.id} (${lease.tenant}) résilié et déplacé dans l’Historique de bail.`;
    showToast(`⛔ ${msg}`);
    notifyDelete(msg, 'Bail déplacé dans l’historique');
  };

  // Action Bailleur : Supprimer / Archiver le bail dans l'historique
  const handleDeleteLease = (lease: Lease, reason?: string) => {
    LeaseService.deleteLease(lease.id, reason);
    setLastResiliatedId(lease.id);
    refreshLeases();
    const msg = `Bail ${lease.id} (${lease.tenant}) supprimé des baux en cours et conservé dans l’Historique de bail.`;
    showToast(`🗑️ ${msg}`);
    notifyDelete(msg, 'Bail archivé dans l’historique');
  };

  // Action Bailleur : Réactiver le bail sans autres démarches (replacé dans les baux en cours si <= 30 jours)
  const handleReactivateLease = (lease: Lease) => {
    if (!canReactivateLease(lease)) {
      showToast(`⛔ Un bail résilié de plus d'un mois (30 jours) ne peut plus être réactivé.`);
      return;
    }
    const result = LeaseService.reactivateLease(lease.id);
    if (!result) {
      showToast(`⛔ Délai de réactivation dépassé (plus de 30 jours).`);
      return;
    }
    setLastResiliatedId(null);
    refreshLeases();
    const msg = `Bail ${lease.id} (${lease.tenant}) réactivé avec succès ! Contrat replacé dans les baux en cours.`;
    showToast(`✅ ${msg}`);
    notifySave(msg, 'Bail réactivé avec succès !');
  };

  const handleSwitchToTenantToSign = (tenantName: string, leaseId?: string) => {
    spaceCtx.switchSpace('locataire');
    router.push(`/portal?tab=bail${leaseId ? `&leaseId=${leaseId}` : ''}&tenant=${encodeURIComponent(tenantName)}`);
  };

  const handleDownloadLeasePDF = (lease: Lease) => {
    generateLeasePDF({
      id: lease.id,
      tenantName: lease.tenant,
      tenantPhone: lease.tenantPhone,
      tenantEmail: lease.tenantEmail,
      propertyName: lease.property,
      unit: lease.unit,
      rent: lease.rent,
      deposit: lease.deposit,
      startDate: lease.startDate,
      endDate: lease.endDate,
      durationMonths: lease.durationMonths,
      landlordSignedAt: lease.landlordSignedAt,
      tenantSignedAt: lease.tenantSignedAt,
      hashSha256: lease.hashSha256,
      listingReference: lease.listingReference,
    });
    showToast(`Contrat ${lease.id} (${lease.tenant}) téléchargé en PDF officiel !`);
  };

  // Filtrage des baux étanche : séparation stricte entre Baux en cours et Historique de bail
  const pendingLeases = leases.filter((l) => l.status === 'en_attente_signature' && !l.isArchived);
  const activeLeases = leases.filter((l) => l.status === 'actif' && !l.isArchived);
  const resiliatedLeases = leases.filter(
    (l) => l.status === 'resilie' || l.status === 'supprime' || l.status === 'expire' || Boolean(l.isArchived)
  );
  const currentLeases = leases.filter(
    (l) => (l.status === 'actif' || l.status === 'en_attente_signature') && !l.isArchived
  );

  // Filtres de date & tri pour Baux & Contrats
  const [leaseSearchTerm, setLeaseSearchTerm] = useState<string>('');
  const [leaseDateFilter, setLeaseDateFilter] = useState<'all' | 'year_2026' | 'year_2025' | 'recent_3m' | 'expiring_soon'>('all');
  const [leaseSelectedYear, setLeaseSelectedYear] = useState<'all' | '2026' | '2025' | '2024'>('all');
  const [leaseSortOrder, setLeaseSortOrder] = useState<'startDate_desc' | 'startDate_asc' | 'rent_desc' | 'rent_asc' | 'tenant_asc'>('startDate_desc');

  const parseFrDate = (dateStr?: string) => {
    if (!dateStr) return 0;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
    }
    const d = new Date(dateStr).getTime();
    return isNaN(d) ? 0 : d;
  };

  /**
   * Extrait rigoureusement l'année de signature ou d'émission effective du bail
   * (Exclut la date de fin qui peut déborder sur les années suivantes)
   */
  const getLeaseSignedYear = (l: Lease): string => {
    // 1. Date de signature locataire ou bailleur
    if (l.tenantSignedAt) {
      const match = l.tenantSignedAt.match(/\b(202\d)\b/);
      if (match) return match[1];
    }
    if (l.landlordSignedAt) {
      const match = l.landlordSignedAt.match(/\b(202\d)\b/);
      if (match) return match[1];
    }
    if (l.transmittedAt) {
      const match = l.transmittedAt.match(/\b(202\d)\b/);
      if (match) return match[1];
    }
    if (l.sentForSignatureAt) {
      const match = l.sentForSignatureAt.match(/\b(202\d)\b/);
      if (match) return match[1];
    }
    // 2. Date de début de prise d'effet du bail
    if (l.startDate) {
      const match = l.startDate.match(/\b(202\d)\b/);
      if (match) return match[1];
    }
    // 3. Année dans la référence du bail (ex: BAIL-2026-N09, BAIL-2025-089)
    if (l.id) {
      const match = l.id.match(/\b(202\d)\b/);
      if (match) return match[1];
    }
    return '';
  };

  const filteredLeases = leases
    .filter((l) => {
      // 1. Onglet statut avec séparation étanche vers l'Historique de bail
      if (filterTab === 'current') {
        // Vue Baux en cours : seuls les baux actifs ou en attente sont affichés.
        // Les baux résiliés ou supprimés sont déplacés dans l'historique !
        if (l.status === 'resilie' || l.status === 'supprime' || l.status === 'expire' || Boolean(l.isArchived)) {
          return false;
        }
      } else if (filterTab === 'pending') {
        if (l.status !== 'en_attente_signature' || Boolean(l.isArchived)) return false;
      } else if (filterTab === 'active') {
        if (l.status !== 'actif' || Boolean(l.isArchived)) return false;
      } else if (filterTab === 'historique') {
        // Vue Historique de bail : Tous les contrats résiliés, supprimés, expirés ou archivés (anciens comme nouveaux)
        if (l.status !== 'resilie' && l.status !== 'supprime' && l.status !== 'expire' && !l.isArchived) {
          return false;
        }
      }

      // 2. Recherche textuelle
      if (leaseSearchTerm.trim()) {
        const q = leaseSearchTerm.toLowerCase();
        const match =
          l.tenant.toLowerCase().includes(q) ||
          l.property.toLowerCase().includes(q) ||
          l.unit.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q) ||
          l.rent.toString().includes(q);
        if (!match) return false;
      }

      const signedYear = getLeaseSignedYear(l);

      // 3. Année de signature spécifique (Filtre strict : affiche les baux signés cette année uniquement)
      if (leaseSelectedYear !== 'all') {
        if (signedYear !== leaseSelectedYear) {
          return false;
        }
      }

      // 4. Presets de date
      if (leaseDateFilter === 'year_2026') {
        return signedYear === '2026';
      }
      if (leaseDateFilter === 'year_2025') {
        return signedYear === '2025';
      }
      if (leaseDateFilter === 'recent_3m') {
        return signedYear === '2026' || l.startDate.includes('/11/2025') || l.startDate.includes('/10/2025');
      }
      if (leaseDateFilter === 'expiring_soon') {
        return l.endDate ? (l.endDate.includes('2026') || l.endDate.includes('2025')) : false;
      }

      return true;
    })
    .sort((a, b) => {
      if (leaseSortOrder === 'startDate_desc') {
        return parseFrDate(b.startDate) - parseFrDate(a.startDate);
      }
      if (leaseSortOrder === 'startDate_asc') {
        return parseFrDate(a.startDate) - parseFrDate(b.startDate);
      }
      if (leaseSortOrder === 'rent_desc') {
        return b.rent - a.rent;
      }
      if (leaseSortOrder === 'rent_asc') {
        return a.rent - b.rent;
      }
      if (leaseSortOrder === 'tenant_asc') {
        return a.tenant.localeCompare(b.tenant, 'fr');
      }
      return 0;
    });

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
          {/* Bouton Retour Accueil sur Mobile & Desktop */}
          <div className="flex items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer hover:bg-slate-50"
            >
              <Home className="w-4 h-4 text-slate-600" />
              <span>← Retour au Tableau de bord</span>
            </button>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Baux &amp; Contrats de Location
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-brand-50 text-brand-600 border border-brand-200">
                  {currentLeases.length} Baux en cours
                </span>
                {pendingLeases.length > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-50 text-amber-700 border border-amber-300 flex items-center gap-1 animate-pulse">
                    <Clock className="w-3 h-3" />
                    <span>{pendingLeases.length} En attente</span>
                  </span>
                )}
                {resiliatedLeases.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterTab('historique');
                      if (typeof window !== 'undefined') window.history.replaceState(null, '', '/leases?tab=historique');
                    }}
                    className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1 transition-all cursor-pointer"
                    title="Voir l'historique des contrats résiliés et supprimés"
                  >
                    <History className="w-3 h-3 text-slate-600" />
                    <span>{resiliatedLeases.length} dans l'Historique</span>
                  </button>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Génération conforme OHADA / UEMOA &amp; CEMAC, transmission directe aux comptes locataires et
                contresignature électronique tactile.
              </p>

              {/* Statut du Plan & Quota Baux Découverte / Sérénité */}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {currentPlan === 'decouverte' ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="font-semibold text-amber-800 dark:text-amber-300">
                      Formule Découverte : {PlanService.getActiveSignedLeases(spaceCtx.user).length}/2 baux signés
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsUpgradeModalOpen(true)}
                      className="ml-1 text-[11px] font-bold text-brand-600 dark:text-brand-400 hover:underline cursor-pointer"
                    >
                      Activer Sérénité (Illimité)
                    </button>
                  </div>
                ) : userSub?.plan === 'pro' ? (
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl text-xs border ${userSub.isExpired
                    ? 'bg-rose-50 border-rose-300 text-rose-800'
                    : (userSub.daysRemaining ?? 30) === 0
                      ? 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse'
                      : (userSub.daysRemaining ?? 30) <= 2
                        ? 'bg-amber-50 border-amber-300 text-amber-800'
                        : 'bg-indigo-50 border-indigo-200 text-indigo-800'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${userSub.isExpired || (userSub.daysRemaining ?? 30) === 0 ? 'bg-rose-600' : 'bg-indigo-600'}`} />
                    <span className="font-semibold">
                      {userSub.isExpired
                        ? 'Formule Pro Expirée (30j terminés)'
                        : (userSub.daysRemaining ?? 30) === 0
                          ? '🚨 Formule Pro : Expire aujourd’hui !'
                          : (userSub.daysRemaining ?? 30) === 1
                            ? '⚠️ Formule Pro : Expire demain (J-1)'
                            : (userSub.daysRemaining ?? 30) === 2
                              ? '⏳ Formule Pro : 2 jours restants (J-2)'
                              : `👑 Formule Entreprise & Pro : Baux illimités (${userSub.daysRemaining}j restants)`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsUpgradeModalOpen(true)}
                      className="ml-1 text-[11px] font-bold text-indigo-700 hover:underline cursor-pointer"
                    >
                      {userSub.isExpired || (userSub.daysRemaining ?? 30) <= 2 ? 'Renouveler' : 'Gérer'}
                    </button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                      ⚡ Formule Sérénité : Baux signés illimités (0 F fixe)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
              {/* Bouton Historique de bail */}
              <button
                type="button"
                onClick={() => {
                  const nextTab = filterTab === 'historique' ? 'current' : 'historique';
                  setFilterTab(nextTab);
                  if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', nextTab === 'historique' ? '/leases?tab=historique' : '/leases');
                  }
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer border active:scale-95 ${filterTab === 'historique'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
                  }`}
                title="Consulter l'historique des contrats résiliés et supprimés"
              >
                <History className={`w-4 h-4 ${filterTab === 'historique' ? 'text-amber-400' : 'text-slate-500'}`} />
                <span>Historique de bail</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${filterTab === 'historique'
                  ? 'bg-white/20 text-white'
                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}>
                  {resiliatedLeases.length}
                </span>
              </button>

              <button
                onClick={() => {
                  const planCheck = PlanService.canLandlordSignNewLease(spaceCtx.user);
                  if (!planCheck.allowed) {
                    setIsUpgradeModalOpen(true);
                    return;
                  }
                  router.push('/leases/new');
                }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs font-extrabold shadow-pink-glow active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Rédiger un nouveau bail</span>
              </button>
            </div>
          </div>

          {/* Bannière Registre Historique de bail si onglet historique actif */}
          {filterTab === 'historique' && (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border border-slate-700/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 border border-indigo-500/30">
                  <History className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-black text-white">
                      Registre d'Archives &amp; Historique de bail ({resiliatedLeases.length})
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-950/80 text-indigo-300 border border-indigo-500/40">
                      Déplacement Automatique &amp; Valeur Légale
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Tous les contrats résiliés ou supprimés (anciens comme nouveaux à venir) sont déplacés et conservés ici en valeur probante et opposable avec leurs empreintes légales SHA-256, quittances et états des lieux. Vous pouvez également réactiver un bail en 1 clic pour le replacer instantanément dans vos baux en cours.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFilterTab('current');
                  if (typeof window !== 'undefined') window.history.replaceState(null, '', '/leases');
                }}
                className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition-all shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Voir les baux en cours</span>
              </button>
            </div>
          )}

          {/* Bannière de notification si baux en attente (uniquement si dans la vue en cours) */}
          {filterTab !== 'historique' && pendingLeases.length > 0 && (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-amber-50 via-amber-50/80 to-amber-100/60 border border-amber-200/90 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-700 flex items-center justify-center shrink-0 border border-amber-500/30">
                  <Clock className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-amber-950">
                      {pendingLeases.length === 1
                        ? '1 contrat envoyé en attente de contresignature locataire'
                        : `${pendingLeases.length} contrats envoyés en attente de contresignature locataire`}
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                      Envoyé pour signature
                    </span>
                  </div>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Le bail a été scellé par vous ({spaceCtx.user?.name || 'Bailleur'}) et transmis au compte de{' '}
                    <strong>{pendingLeases[0].tenant}</strong>. Une fois contresigné, vous recevrez
                    une notification instantanée dans l'application et par email.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Assistant 5 Étapes Info Banner (uniquement si baux en cours) */}
          {filterTab !== 'historique' && (
            <div className="p-5 sm:p-6 bg-white rounded-3xl border border-slate-200/80 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-brand-600 uppercase tracking-wider block">
                  Workflow Sécurisé de Rédaction &amp; Signature UEMOA &amp; CEMAC
                </span>
                <span className="text-[11px] text-slate-400 font-medium hidden sm:inline">
                  Valeur légale certifiée conforme droit OHADA
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {[
                  { step: '1', title: 'Sélection du Lot', desc: 'Résidence, type, loyer' },
                  { step: '2', title: 'Compte Locataire', desc: 'Compte existant ou nouveau' },
                  { step: '3', title: 'Conditions FCFA', desc: 'Caution, avance, charges' },
                  { step: '4', title: 'Clauses UEMOA & CEMAC', desc: 'Clauses d’habitation' },
                  { step: '5', title: 'Transmission & Sceau', desc: 'Signature bailleur & locataire' },
                ].map((s) => (
                  <div key={s.step} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-full bg-slate-900 text-white font-black text-[10px] flex items-center justify-center">
                        {s.step}
                      </span>
                      <span className="font-extrabold text-xs text-slate-900">{s.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Onglets de filtrage */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setFilterTab('current');
                if (typeof window !== 'undefined') window.history.replaceState(null, '', '/leases');
              }}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${filterTab === 'current'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Baux en cours ({currentLeases.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterTab('pending');
                if (typeof window !== 'undefined') window.history.replaceState(null, '', '/leases?tab=pending');
              }}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${filterTab === 'pending'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>En attente de signature ({pendingLeases.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterTab('active');
                if (typeof window !== 'undefined') window.history.replaceState(null, '', '/leases?tab=active');
              }}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${filterTab === 'active'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Baux contresignés &amp; actifs ({activeLeases.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterTab('historique');
                if (typeof window !== 'undefined') window.history.replaceState(null, '', '/leases?tab=historique');
              }}
              className={`py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${filterTab === 'historique'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-800 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200'
                }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>📜 Historique de bail ({resiliatedLeases.length})</span>
            </button>
          </div>

          {/* Barre de Recherche, Filtres de Date & Tri Facile des Baux */}
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-3.5">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Recherche textuelle */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={leaseSearchTerm}
                  onChange={(e) => setLeaseSearchTerm(e.target.value)}
                  placeholder="Rechercher par locataire, résidence, lot, référence BAIL..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-xs"
                />
                {leaseSearchTerm && (
                  <button
                    type="button"
                    onClick={() => setLeaseSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filtre Année + Tri */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <select
                    value={leaseSelectedYear}
                    onChange={(e) => {
                      setLeaseSelectedYear(e.target.value as any);
                      setLeaseDateFilter('all');
                    }}
                    className="py-2 pl-3 pr-7 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                  >
                    <option value="all">Toutes années de signature</option>
                    <option value="2026">Signés en 2026 uniquement</option>
                    <option value="2025">Signés en 2025 uniquement</option>
                    <option value="2024">Signés en 2024 uniquement</option>
                  </select>
                </div>

                <div className="relative">
                  <select
                    value={leaseSortOrder}
                    onChange={(e) => setLeaseSortOrder(e.target.value as any)}
                    className="py-2 pl-3 pr-7 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
                  >
                    <option value="startDate_desc">📅 Date signature (Plus récent ↓)</option>
                    <option value="startDate_asc">📅 Date signature (Plus ancien ↑)</option>
                    <option value="rent_desc">💰 Loyer le plus élevé</option>
                    <option value="rent_asc">💰 Loyer le plus accessible</option>
                    <option value="tenant_asc">👤 Locataire (A à Z)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Presets rapides de date */}
            <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-brand-500" />
                <span>Signature :</span>
              </span>

              {[
                { key: 'all', label: 'Tous les baux' },
                { key: 'year_2026', label: 'Signés en 2026' },
                { key: 'year_2025', label: 'Signés en 2025' },
                { key: 'recent_3m', label: 'Signés récemment' },
                { key: 'expiring_soon', label: 'Échéance proche' },
              ].map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => {
                    setLeaseDateFilter(preset.key as any);
                    setLeaseSelectedYear('all');
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${leaseDateFilter === preset.key && leaseSelectedYear === 'all'
                    ? 'bg-brand-500 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                    }`}
                >
                  {preset.label}
                </button>
              ))}

              <span className="text-[11px] text-slate-400 font-medium ml-2">
                ({filteredLeases.length} affiché{filteredLeases.length > 1 ? 's' : ''})
              </span>

              {(leaseSearchTerm || leaseDateFilter !== 'all' || leaseSelectedYear !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setLeaseSearchTerm('');
                    setLeaseDateFilter('all');
                    setLeaseSelectedYear('all');
                  }}
                  className="ml-auto text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Réinitialiser</span>
                </button>
              )}
            </div>
          </div>

          {/* Liste des Baux */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4 animate-in fade-in duration-200">
                <SkeletonLeaseCard />
                <SkeletonLeaseCard />
                <SkeletonLeaseCard />
              </div>
            ) : filteredLeases.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-soft space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  {filterTab === 'historique' ? (
                    <History className="w-7 h-7 text-indigo-500" />
                  ) : (
                    <FileText className="w-7 h-7 text-slate-400" />
                  )}
                </div>
                <h3 className="text-base font-black text-slate-900">
                  {filterTab === 'historique'
                    ? "Aucun contrat dans l'Historique de bail"
                    : "Aucun contrat de bail trouvé"}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {filterTab === 'historique'
                    ? "Tous vos contrats résiliés, clôturés ou supprimés apparaîtront ici. Vos baux actifs et en attente s'affichent dans la vue Baux en cours."
                    : "Aucun bail ne correspond aux critères de date ou de recherche sélectionnés. Modifiez vos filtres ou réinitialisez la sélection."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFilterTab('current');
                    setLeaseDateFilter('all');
                    setLeaseSelectedYear('all');
                    setLeaseSearchTerm('');
                    if (typeof window !== 'undefined') window.history.replaceState(null, '', '/leases');
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Voir les baux en cours
                </button>
              </div>
            ) : (
              filteredLeases.map((lease) => {
                const isPending = lease.status === 'en_attente_signature';
                const isResiliated = lease.status === 'resilie';
                const isDeleted = lease.status === 'supprime' || Boolean(lease.isArchived && !isResiliated);
                const isHistorical = isResiliated || isDeleted;
                const isActive = lease.status === 'actif' && !isHistorical;

                return (
                  <div
                    key={lease.id}
                    className={`p-5 rounded-3xl border transition-all ${isPending
                      ? 'bg-gradient-to-r from-amber-50/70 via-white to-amber-50/40 border-amber-300 shadow-md ring-1 ring-amber-300/60'
                      : isHistorical
                        ? 'bg-gradient-to-r from-slate-50/60 via-white to-slate-100/40 border-slate-300/80 shadow-soft'
                        : 'bg-white border-slate-200/80 shadow-soft hover:border-slate-300'
                      }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Infos Principales */}
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${isPending
                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                            : isHistorical
                              ? 'bg-slate-200 text-slate-700 border border-slate-300'
                              : 'bg-brand-50 text-brand-600 border border-brand-100'
                            }`}
                        >
                          {isHistorical ? (
                            isDeleted ? (
                              <Trash2 className="w-6 h-6 text-slate-600" />
                            ) : (
                              <Ban className="w-6 h-6 text-rose-600" />
                            )
                          ) : (
                            <FileText className="w-6 h-6" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-black text-base text-slate-900">{lease.tenant}</h4>
                            {lease.tenantMatricule && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-black border border-indigo-200">
                                {lease.tenantMatricule}
                              </span>
                            )}
                            <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold border border-slate-200">
                              {lease.id}
                            </span>
                            {lease.listingReference && (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-200 flex items-center gap-1 shrink-0" title="Issu de l'annonce immobilière">
                                <span className="text-[9px] uppercase font-sans text-purple-400 font-bold">Annonce</span>
                                <span className="font-black">{lease.listingReference}</span>
                              </span>
                            )}

                            {/* Statut Badge */}
                            {isPending ? (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs flex items-center gap-1 animate-pulse">
                                <Clock className="w-3 h-3" />
                                <span>En attente de signature</span>
                              </span>
                            ) : isDeleted ? (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 border border-slate-700 flex items-center gap-1">
                                <Trash2 className="w-3 h-3 text-slate-400" />
                                <span>Bail Supprimé • Archivé</span>
                              </span>
                            ) : isResiliated ? (
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                <Ban className="w-3 h-3 text-rose-600" />
                                <span>Bail Résilié • Archivé</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Contresigné &amp; Actif</span>
                              </span>
                            )}

                            {isPending && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                                <Send className="w-3 h-3" />
                                <span>Envoyé pour signature</span>
                              </span>
                            )}
                          </div>

                          <span className="text-xs text-slate-700 font-bold flex items-center flex-wrap gap-1.5">
                            <span>{lease.property} • {lease.unit}</span>
                            {lease.propertyLocation && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>{lease.propertyLocation}</span>
                              </span>
                            )}
                          </span>

                          <div className="flex flex-wrap items-center gap-2.5 text-[11px] text-slate-400">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 font-black text-slate-800 border border-slate-200">
                              Signé en {getLeaseSignedYear(lease) || '2026'}
                            </span>
                            <span>•</span>
                            <span>Prise d'effet : {lease.startDate}</span>
                            <span>•</span>
                            <span>Durée : {lease.durationMonths || 36} mois</span>
                            {isPending && lease.transmittedAt && (
                              <>
                                <span>•</span>
                                <span className="text-amber-800 font-bold">
                                  Transmis au locataire le {lease.transmittedAt}
                                </span>
                              </>
                            )}
                            {isResiliated && lease.resiliatedAt && (
                              <>
                                <span>•</span>
                                <span className="text-rose-700 font-bold">
                                  Résilié le {lease.resiliatedAt}
                                </span>
                              </>
                            )}
                            {isDeleted && lease.deletedAt && (
                              <>
                                <span>•</span>
                                <span className="text-slate-600 font-bold">
                                  Supprimé le {lease.deletedAt}
                                </span>
                              </>
                            )}
                            {lease.reactivatedAt && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-700 font-bold">
                                  Réactivé le {lease.reactivatedAt}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Motif d'archivage ou résiliation */}
                          {(lease.resiliationReason || lease.deleteReason) && (
                            <div className="p-2 rounded-xl bg-rose-50/80 border border-rose-200/80 text-[11px] text-rose-900 flex items-center gap-2 mt-1">
                              <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>
                                <strong>Motif d'archivage :</strong> {lease.deleteReason || lease.resiliationReason}
                              </span>
                            </div>
                          )}

                          {/* Signatures status */}
                          <div className="pt-2 flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Signé par le bailleur ({lease.landlordSignature?.signedBy || spaceCtx.user?.name || 'Bailleur'})</span>
                            </span>

                            {isHistorical ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-300 flex items-center gap-1">
                                <Archive className="w-3 h-3 text-slate-600" />
                                <span>Contrat archivé — Conservé à valeur probante</span>
                              </span>
                            ) : isPending ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-amber-600" />
                                <span>En attente de signature de {lease.tenant}</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Contresigné par le locataire</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Conditions financières & Actions */}
                      <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center justify-between sm:justify-end gap-4 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                        <div className="text-left sm:text-right lg:text-right">
                          <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
                            Loyer mensuel
                          </span>
                          <span className="text-base font-black text-slate-900 block">
                            {formatFCFA(lease.rent)}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            Caution : {formatFCFA(lease.deposit || lease.rent * 2)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {isPending ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleSwitchToTenantToSign(lease.tenant, lease.id)}
                                className="py-2.5 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
                                title="Basculer sur l'Espace Locataire pour tester la contresignature"
                              >
                                <PenTool className="w-3.5 h-3.5" />
                                <span>Signer (Côté Locataire)</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  const waUrl = `https://wa.me/${(lease.tenantPhone || '22997001122').replace(/\+/g, '').replace(/\s+/g, '')}?text=${encodeURIComponent(
                                    `Bonjour ${lease.tenant}, votre contrat de bail officiel (${lease.id}) pour ${lease.unit} vous a été transmis sur votre Portail Résidentiel LOCAGESTION pour contresignature électronique. Rendez-vous sur https://locagestion.site/portal pour le contresigner.`
                                  )}`;
                                  window.open(waUrl, '_blank');
                                }}
                                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                title="Relancer le locataire via WhatsApp"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                <span>Relancer WhatsApp</span>
                              </button>
                            </>
                          ) : null}

                          {/* Bouton RÉACTIVER LE BAIL si dans l'historique (résilié ou supprimé) : disparaît au bout de 30 jours */}
                          {isHistorical && (
                            canReactivateLease(lease) ? (
                              <button
                                type="button"
                                onClick={() => handleReactivateLease(lease)}
                                className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                                title="Replacer ce contrat dans vos baux en cours sans autres démarches (disponible sous 30 jours)"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Réactiver le bail</span>
                              </button>
                            ) : (
                              <div
                                className="py-1.5 px-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 text-[11px] font-bold flex items-center gap-1.5"
                                title="Ce contrat est résilié depuis plus de 30 jours. La résiliation est définitive et le bail ne peut plus être réactivé."
                              >
                                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                <span>Résiliation définitive (&gt; 30 j)</span>
                              </div>
                            )
                          )}

                          {/* Bouton RÉSILIER LE BAIL si actif (déplace vers l'historique) */}
                          {isActive && (
                            <button
                              type="button"
                              onClick={() => setLeaseToTerminate(lease)}
                              className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                              title="Résilier ce contrat de bail et le déplacer dans l'Historique de bail"
                            >
                              <Ban className="w-3.5 h-3.5 text-rose-600" />
                              <span>Résilier le bail</span>
                            </button>
                          )}

                          {/* Bouton Résilier si en attente */}
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => setLeaseToTerminate(lease)}
                              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 text-xs font-bold border border-slate-200 hover:border-rose-200 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                              title="Annuler et déplacer dans l'Historique de bail"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Résilier</span>
                            </button>
                          )}

                          {/* Bouton État des lieux & Photos */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedInspectionLease(lease);
                              setIsInspectionModalOpen(true);
                            }}
                            className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                            title="Gérer l'état des lieux & photos pour ce bail"
                          >
                            <Camera className="w-3.5 h-3.5 text-emerald-600" />
                            <span>État des lieux &amp; photos</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadLeasePDF(lease)}
                            className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }))}
          </div>

          {/* Footer en fin de page : Créée au Bénin (en bas à gauche) */}
          <Footer />
        </main>
      </div>

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
            handleTerminateLease(leaseToTerminate, reason);
          }
          setLeaseToTerminate(null);
        }}
      />

      {/* Modal d'État des Lieux & Photos */}
      {selectedInspectionLease && (
        <InspectionModal
          isOpen={isInspectionModalOpen}
          onClose={() => {
            setIsInspectionModalOpen(false);
            setSelectedInspectionLease(null);
          }}
          leaseId={selectedInspectionLease.id}
          propertyName={selectedInspectionLease.property}
          unitNumber={selectedInspectionLease.unit}
          tenantName={selectedInspectionLease.tenant}
          inspectionData={InspectionService.getInspectionByLeaseId(selectedInspectionLease.id)}
          onSave={(updated) => {
            InspectionService.saveInspection(selectedInspectionLease.id, updated);
            notifySave(
              `État des lieux du bail ${selectedInspectionLease.id} mis à jour avec ${updated.photos.length} photos horodatées.`,
              'État des lieux enregistré !'
            );
          }}
        />
      )}

      {/* Toast Notification avec option Annuler l'erreur */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4.5 py-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5 max-w-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1">{toastMessage}</span>
          {lastResiliatedId && (() => {
            const target = leases.find((l) => l.id === lastResiliatedId);
            if (!target || !canReactivateLease(target)) return null;
            return (
              <button
                type="button"
                onClick={() => handleReactivateLease(target)}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-md active:scale-95"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Annuler l'erreur / Réactiver</span>
              </button>
            );
          })()}
        </div>
      )}

      {/* Modale d'Upgrade Formule Sérénité (Plafond 2 baux) */}
      <UpgradePlanModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        onSuccess={() => {
          setIsUpgradeModalOpen(false);
          router.push('/leases/new');
        }}
      />
    </div>
  );
}
