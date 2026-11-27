'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Ban,
  Trash2,
  CheckCircle2,
  Eye,
  Camera,
  Flame,
  UserX,
  Phone,
  Mail,
  RefreshCw,
  Building2,
  ExternalLink,
  Lock,
  LogOut,
  ChevronRight,
  Filter,
  Search,
  Users,
  UserCheck,
  Clock,
  MapPin,
  Calendar,
  X,
  Info,
  Tag,
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Check,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  FileText,
  Copy,
  Fingerprint,
  RotateCcw,
  ArchiveRestore,
  ShieldX,
  Zap,
  History,
  LogIn,
  CreditCard,
  Home,
  MessageCircle,
  Wallet,
  Send,
  Smartphone,
  CheckCheck,
} from 'lucide-react';
import { useSpace } from '@/lib/context/space-context';
import { ModerationService } from '@/lib/services/moderation-service';
import { ListingsService, getListingAgeInDays, resolveListingAuthorRole } from '@/lib/services/listings-service';
import { AuthService, SYSTEM_ADMIN_USER, getRoleLabel, areEmailsEqual } from '@/lib/services/auth-service';
import { SecurityAlert, RentalListing, AuthUser, UserSpace, TrashListing } from '@/lib/types';
import { formatFCFA } from '@/lib/money/format';
import { SkeletonAdminDashboard } from '@/components/ui/SkeletonLoader';
import { PlanService, PLANS_CONFIG, SubscriptionHistoryItem } from '@/lib/services/plan-service';
import { LeaseService, Lease } from '@/lib/services/lease-service';
import { PaymentService } from '@/lib/services/payment-service';
import { PayoutService, LandlordPayoutRecord, PayoutStats } from '@/lib/services/payout-service';
import { UserSubscriptionDetails, PaymentTransaction } from '@/lib/types';
import { notifySave } from '@/lib/notifications/action-notifier';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, logout } = useSpace();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 250);
    return () => clearTimeout(timer);
  }, []);

  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [listings, setListings] = useState<RentalListing[]>([]);
  const [trashListings, setTrashListings] = useState<TrashListing[]>([]);
  const [listingSubView, setListingSubView] = useState<'active' | 'trash'>('active');
  const [searchTrashQuery, setSearchTrashQuery] = useState<string>('');

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [activeTab, setActiveTab] = useState<'alerts' | 'listings' | 'users' | 'rules' | 'payouts'>('alerts');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchAlertQuery, setSearchAlertQuery] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // État Console de Reversements Bailleurs (FedaPay Payouts & Formule Sérénité)
  const [payouts, setPayouts] = useState<LandlordPayoutRecord[]>([]);
  const [payoutStats, setPayoutStats] = useState<PayoutStats>({
    totalCollected: 0,
    totalCommissions: 0,
    totalDisbursed: 0,
    totalPending: 0,
    pendingCount: 0,
    completedCount: 0,
  });
  const [payoutSearchQuery, setPayoutSearchQuery] = useState<string>('');
  const [payoutStatusFilter, setPayoutStatusFilter] = useState<'all' | 'en_attente' | 'reverse'>('all');
  const [selectedPayoutToDisburse, setSelectedPayoutToDisburse] = useState<LandlordPayoutRecord | null>(null);
  const [disburseMethod, setDisburseMethod] = useState<'wave' | 'mtn' | 'moov' | 'virement' | 'autre'>('wave');
  const [disburseReference, setDisburseReference] = useState<string>('');
  const [disburseNotes, setDisburseNotes] = useState<string>('');

  // État Modale de blocage utilisateur
  const [blockingUser, setBlockingUser] = useState<AuthUser | null>(null);
  const [blockType, setBlockType] = useState<'temporary' | 'permanent'>('temporary');
  const [blockReasonInput, setBlockReasonInput] = useState<string>('');

  // Filtres et recherche Annonces
  const [searchListingRef, setSearchListingRef] = useState<string>('');
  const [filterListingStatus, setFilterListingStatus] = useState<string>('all');
  const [selectedListingForDetail, setSelectedListingForDetail] = useState<RentalListing | null>(null);

  // Filtres et recherche Utilisateurs
  const [searchUserName, setSearchUserName] = useState<string>('');
  const [filterUserRole, setFilterUserRole] = useState<string>('all');
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<AuthUser | null>(null);

  // État Gestion Formules & Historique Super-Admin
  const [matriculeSearchInput, setMatriculeSearchInput] = useState<string>('');
  const [matriculeSearchError, setMatriculeSearchError] = useState<string | null>(null);
  const [userSubDetails, setUserSubDetails] = useState<UserSubscriptionDetails | null>(null);
  const [userSubHistory, setUserSubHistory] = useState<SubscriptionHistoryItem[]>([]);
  const [userLeases, setUserLeases] = useState<Lease[]>([]);
  const [userPayments, setUserPayments] = useState<PaymentTransaction[]>([]);
  const [customProDuration, setCustomProDuration] = useState<number>(30);
  const [userModalTab, setUserModalTab] = useState<'formule' | 'history' | 'identity'>('formule');

  const loadUserDetailsData = (u: AuthUser) => {
    setUserSubDetails(PlanService.getUserSubscription(u.id));
    setUserSubHistory(PlanService.getSubscriptionHistory(u.id));
    const allLeases = LeaseService.getLeases();
    const matchingLeases = allLeases.filter(
      (l) =>
        l.landlordId === u.id ||
        areEmailsEqual(l.landlordEmail, u.email) ||
        l.tenantId === u.id ||
        areEmailsEqual(l.tenantEmail, u.email) ||
        (u.name && l.tenant && l.tenant.toLowerCase().includes(u.name.toLowerCase()))
    );
    setUserLeases(matchingLeases);
    const allPayments = PaymentService.getPaymentsForLandlord(u);
    setUserPayments(allPayments);
  };

  useEffect(() => {
    if (selectedUserForDetail) {
      loadUserDetailsData(selectedUserForDetail);
      setUserModalTab('formule');
    }
  }, [selectedUserForDetail]);

  const handleSearchByMatricule = (e: React.FormEvent) => {
    e.preventDefault();
    setMatriculeSearchError(null);
    if (!matriculeSearchInput.trim()) {
      setMatriculeSearchError('Veuillez saisir un matricule officiel (ex: LOCA-MAT-BJ-17635 ou 17635).');
      return;
    }
    const found = AuthService.findUserByMatriculeOrQuery(matriculeSearchInput.trim());
    if (found) {
      setSelectedUserForDetail(found);
      setMatriculeSearchError(null);
      setActionSuccessMsg(`Compte trouvé : ${found.name} (${found.matricule || 'Sans matricule'}).`);
      setTimeout(() => setActionSuccessMsg(null), 3500);
    } else {
      setMatriculeSearchError(`Aucun compte utilisateur trouvé pour « ${matriculeSearchInput} »`);
    }
  };

  const handleAdminActivateSerenite = (targetUser: AuthUser) => {
    PlanService.adminActivateSerenite(targetUser.id, effectiveUser?.name || 'Super-Administrateur');
    loadUserDetailsData(targetUser);
    setActionSuccessMsg(`Formule Sérénité activée avec succès pour ${targetUser.name}.`);
    notifySave(`Formule Sérénité accordée à ${targetUser.name}`, 'Super-Admin • Formule mise à jour');
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleAdminActivatePro = (targetUser: AuthUser, days: number) => {
    PlanService.adminActivatePro(targetUser.id, days, effectiveUser?.name || 'Super-Administrateur');
    loadUserDetailsData(targetUser);
    setActionSuccessMsg(`Formule Entreprise & Pro activée (${days} jours) pour ${targetUser.name}.`);
    notifySave(`Formule Pro (${days}j) accordée à ${targetUser.name}`, 'Super-Admin • Formule mise à jour');
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleAdminCancelPlan = (targetUser: AuthUser) => {
    PlanService.adminCancelPlan(targetUser.id, effectiveUser?.name || 'Super-Administrateur');
    loadUserDetailsData(targetUser);
    setActionSuccessMsg(`Abonnement résilié. ${targetUser.name} est désormais sur la Formule Découverte (0 FCFA).`);
    notifySave(`Formule rétrogradée en Découverte pour ${targetUser.name}`, 'Super-Admin • Formule annulée');
    setTimeout(() => setActionSuccessMsg(null), 3500);
  };

  const handleImpersonateUser = (targetUser: AuthUser) => {
    AuthService.impersonateUser(targetUser, effectiveUser || SYSTEM_ADMIN_USER);
    const destination =
      targetUser.role === 'locataire'
        ? '/portal'
        : targetUser.role === 'demarcheur'
        ? '/listings'
        : '/';
    router.push(destination);
  };

  // Charger les données de sécurité, annonces, utilisateurs et reversements bailleurs
  const refreshData = () => {
    setAlerts(ModerationService.getSecurityAlerts());
    setListings(ListingsService.getAllListings());
    setTrashListings(ListingsService.getTrashListings());
    setUsers(AuthService.getAllKnownUsers());
    setPayouts(PayoutService.getPayouts());
    setPayoutStats(PayoutService.getPayoutStats());
  };

  const handleConfirmDisbursement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayoutToDisburse) return;
    if (!disburseReference.trim()) {
      alert('Veuillez renseigner la référence officielle du transfert / virement.');
      return;
    }
    const res = PayoutService.markPayoutAsDisbursed(selectedPayoutToDisburse.id, {
      method: disburseMethod,
      reference: disburseReference.trim(),
      notes: disburseNotes.trim(),
      disbursedBy: effectiveUser?.name || 'Super-Admin MONROY AG',
    });
    if (res) {
      refreshData();
      setSelectedPayoutToDisburse(null);
      setDisburseReference('');
      setDisburseNotes('');
      setActionSuccessMsg(`Reversement scellé ! Le bailleur ${res.landlordName} a été notifié du virement net de ${formatFCFA(res.netPayoutAmount)}.`);
      setTimeout(() => setActionSuccessMsg(null), 4500);
    }
  };

  const handleRevertPayout = (payoutId: string) => {
    if (confirm('Voulez-vous repasser ce reversement en attente ?')) {
      PayoutService.revertPayout(payoutId);
      refreshData();
      setActionSuccessMsg('Le reversement a été repassé au statut « En attente ».');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    }
  };

  const effectiveUser = user || (typeof window !== 'undefined' ? AuthService.getCurrentUser() : null);

  useEffect(() => {
    const currentAdmin = user || AuthService.getCurrentUser();
    // RLS Applicatif : Seul le compte vérifié Super-Admin a le droit d'accéder à la console
    if (!currentAdmin || currentAdmin.role !== 'admin' || !areEmailsEqual(currentAdmin.email, 'admin@locagestion.site')) {
      router.replace('/auth/login');
      return;
    }
    refreshData();
    const handleAlertsUpdate = () => refreshData();
    window.addEventListener('locagestion:security_alerts_updated', handleAlertsUpdate);
    window.addEventListener('locagestion:listings_updated', handleAlertsUpdate);
    window.addEventListener('locagestion:auth_changed', handleAlertsUpdate);
    window.addEventListener('locagestion:payouts_updated', handleAlertsUpdate);
    return () => {
      window.removeEventListener('locagestion:security_alerts_updated', handleAlertsUpdate);
      window.removeEventListener('locagestion:listings_updated', handleAlertsUpdate);
      window.removeEventListener('locagestion:auth_changed', handleAlertsUpdate);
      window.removeEventListener('locagestion:payouts_updated', handleAlertsUpdate);
    };
  }, [user, router]);

  if (!effectiveUser || effectiveUser.role !== 'admin' || !areEmailsEqual(effectiveUser.email, 'admin@locagestion.site')) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <p className="text-sm font-bold text-slate-400">Accès restreint au Super-Administrateur...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9]">
        <SkeletonAdminDashboard />
      </div>
    );
  }

  // --- Actions Modération ---
  const handleResolveAlert = (
    alertId: string,
    action: 'bloque' | 'autorise_par_admin' | 'supprime'
  ) => {
    ModerationService.resolveAlert(alertId, action);
    refreshData();
    setActionSuccessMsg(
      action === 'bloque'
        ? 'Blocage de sécurité confirmé. L’annonce reste proscrite.'
        : action === 'autorise_par_admin'
          ? 'Autorisation administrative exceptionnelle accordée.'
          : 'Signalement supprimé du journal.'
    );
    setTimeout(() => setActionSuccessMsg(null), 4000);
  };

  // --- Actions Annonces ---
  const handleDeleteListing = (id: string) => {
    if (confirm('Voulez-vous supprimer cette annonce et la placer dans la corbeille ? Elle pourra être restaurée à tout moment.')) {
      ListingsService.deleteListing(id, 'Super Admin', 'Supprimée depuis la console Super-Admin');
      refreshData();
      if (selectedListingForDetail?.id === id) {
        setSelectedListingForDetail(null);
      }
      setActionSuccessMsg('Annonce déplacée dans la corbeille. Vous pouvez la restaurer à tout moment.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleRestoreListing = (id: string, title?: string, authorName?: string) => {
    const res = ListingsService.restoreListing(id);
    if (res.success) {
      refreshData();
      setActionSuccessMsg(`L'annonce « ${title || id} » a été restaurée avec succès pour ${authorName || "l'utilisateur"}. Elle est de nouveau active.`);
      setTimeout(() => setActionSuccessMsg(null), 4500);
    } else {
      alert(res.error || 'Erreur lors de la restauration de l\'annonce.');
    }
  };

  const handlePermanentDeleteFromTrash = (id: string) => {
    if (confirm('Voulez-vous purger DÉFINITIVEMENT cette annonce du stockage ? Cette action est irréversible.')) {
      ListingsService.permanentDeleteTrashListing(id);
      refreshData();
      setActionSuccessMsg('Annonce définitivement purgée du stockage.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    }
  };

  const handleEmptyTrash = () => {
    if (confirm('Êtes-vous sûr de vouloir vider complètement la corbeille ? Toutes les annonces supprimées seront définitivement détruites pour libérer le stockage.')) {
      ListingsService.emptyTrash();
      refreshData();
      setActionSuccessMsg('La corbeille d\'annonces a été vidée avec succès.');
      setTimeout(() => setActionSuccessMsg(null), 3500);
    }
  };

  const handleTogglePauseListing = (id: string) => {
    ListingsService.togglePause(id);
    refreshData();
    if (selectedListingForDetail?.id === id) {
      setSelectedListingForDetail((prev) => (prev ? { ...prev, status: prev.status === 'en_pause' ? 'disponible' : 'en_pause' } : null));
    }
  };

  // Purge manuelle des annonces de plus de 30 jours
  const handleManualPurgeExpired = () => {
    const result = ListingsService.purgeExpiredListings();
    refreshData();
    if (result.purgedCount > 0) {
      setActionSuccessMsg(
        `Purge réussie : ${result.purgedCount} annonce(s) expirée(s) (+30 jours) purgée(s) pour libérer l'espace de stockage.`
      );
    } else {
      setActionSuccessMsg(
        'Toutes les annonces sont récentes (aucune publication de plus de 30 jours).'
      );
    }
    setTimeout(() => setActionSuccessMsg(null), 4500);
  };

  // --- Actions Utilisateurs ---
  const handleChangeUserRole = (targetUser: AuthUser, newRole: UserSpace) => {
    if (targetUser.id === SYSTEM_ADMIN_USER.id || targetUser.email === SYSTEM_ADMIN_USER.email) {
      alert('Action proscrite : Le rôle du Super-Administrateur système ne peut être modifié.');
      return;
    }
    const res = AuthService.updateUser(targetUser.id, { role: newRole });
    if (res.success) {
      refreshData();
      if (selectedUserForDetail?.id === targetUser.id) {
        setSelectedUserForDetail((prev) => (prev ? { ...prev, role: newRole } : null));
      }
      setActionSuccessMsg(`Rôle de "${targetUser.name}" mis à jour : "${getRoleLabel(newRole)}".`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } else {
      alert(res.error || 'Erreur lors de la modification du rôle.');
    }
  };

  const handleDeleteUser = (targetUser: AuthUser) => {
    if (
      targetUser.id === SYSTEM_ADMIN_USER.id ||
      targetUser.email === SYSTEM_ADMIN_USER.email ||
      targetUser.role === 'admin'
    ) {
      alert('Action proscrite : Le compte Super-Administrateur système ne peut être supprimé.');
      return;
    }
    if (
      confirm(
        `Êtes-vous sûr de vouloir supprimer définitivement le compte de ${targetUser.name} (${targetUser.email}) ?\nCette opération est irréversible.`
      )
    ) {
      const res = AuthService.deleteUser(targetUser.id);
      if (res.success) {
        refreshData();
        if (selectedUserForDetail?.id === targetUser.id) {
          setSelectedUserForDetail(null);
        }
        setActionSuccessMsg(`Le compte utilisateur de "${targetUser.name}" a été définitivement supprimé.`);
        setTimeout(() => setActionSuccessMsg(null), 4000);
      } else {
        alert(res.error || 'Erreur lors de la suppression.');
      }
    }
  };

  const handleOpenBlockModal = (targetUser: AuthUser, defaultType: 'temporary' | 'permanent' = 'temporary') => {
    if (targetUser.id === SYSTEM_ADMIN_USER.id || targetUser.email === SYSTEM_ADMIN_USER.email || targetUser.role === 'admin') {
      alert('Action proscrite : Le compte Super-Administrateur système ne peut pas être bloqué.');
      return;
    }
    setBlockingUser(targetUser);
    setBlockType(defaultType);
    setBlockReasonInput(
      defaultType === 'temporary'
        ? "Suspension temporaire pour vérifications de conformité et audit des pièces justificatives."
        : "Blocage définitif suite à des infractions graves aux règles et conditions de la plateforme."
    );
  };

  const handleConfirmBlockUser = () => {
    if (!blockingUser) return;
    const res = AuthService.blockUser(blockingUser.id, blockType, blockReasonInput);
    if (res.success) {
      refreshData();
      if (selectedUserForDetail?.id === blockingUser.id) {
        setSelectedUserForDetail((prev) =>
          prev
            ? {
                ...prev,
                accountStatus: blockType === 'temporary' ? 'blocked_temporary' : 'blocked_permanent',
                blockReason: blockReasonInput,
              }
            : null
        );
      }
      setActionSuccessMsg(
        blockType === 'temporary'
          ? `Le compte de « ${blockingUser.name} » a été suspendu temporairement.`
          : `Le compte de « ${blockingUser.name} » a été bloqué définitivement.`
      );
      setBlockingUser(null);
      setTimeout(() => setActionSuccessMsg(null), 4500);
    } else {
      alert(res.error || 'Erreur lors du blocage du compte.');
    }
  };

  const handleReactivateUser = (targetUser: AuthUser) => {
    const res = AuthService.reactivateUser(targetUser.id);
    if (res.success) {
      refreshData();
      if (selectedUserForDetail?.id === targetUser.id) {
        setSelectedUserForDetail((prev) =>
          prev
            ? {
                ...prev,
                accountStatus: 'active',
                blockReason: undefined,
              }
            : null
        );
      }
      setActionSuccessMsg(
        `Le compte de « ${targetUser.name} » a été réactivé avec succès. L'utilisateur peut à nouveau se connecter.`
      );
      setTimeout(() => setActionSuccessMsg(null), 4500);
    } else {
      alert(res.error || 'Erreur lors de la réactivation du compte.');
    }
  };

  /**
   * Accès direct en 1 clic à la fiche détaillée de l'annonce signalée
   */
  const handleDirectAccessListing = (alert: SecurityAlert) => {
    const found = listings.find(
      (l) =>
        (alert.listingId && l.id === alert.listingId) ||
        (alert.listingReference && l.referenceCode === alert.listingReference) ||
        (l.title && alert.listingTitle && l.title.trim().toLowerCase() === alert.listingTitle.trim().toLowerCase())
    );

    if (found) {
      setSelectedListingForDetail(found);
    } else {
      // Annonce bloquée avant persistance publique : création d'une fiche synthétique d'audit
      const syntheticListing: RentalListing = {
        id: alert.listingId || alert.id,
        referenceCode: alert.listingReference || alert.listingId || 'A-BJ-ALERT',
        title: alert.listingTitle,
        propertyType: 'Appartement',
        country: alert.country || 'Bénin',
        countryCode: 'BJ',
        flag: '🇧🇯',
        city: alert.city || 'Cotonou',
        district: 'Quartier signalé',
        landmark: 'Signalement de sécurité IA',
        monthlyRent: 0,
        charges: 0,
        depositMonths: 0,
        advanceMonths: 0,
        agencyFees: 0,
        surface: 0,
        bedrooms: 1,
        bathrooms: 1,
        images: [],
        amenities: [],
        isVerified: false,
        status: 'rejete',
        moderationStatus: 'rejete',
        moderationReason: alert.violations.map((v) => v.message).join(' | '),
        authorName: alert.authorName,
        authorEmail: alert.authorEmail,
        authorPhone: alert.authorPhone,
        authorRole: alert.authorRole as UserSpace,
        createdAt: alert.detectedAt,
      };
      setSelectedListingForDetail(syntheticListing);
    }
  };

  /**
   * Bascule vers l'onglet des annonces avec pré-remplissage de la référence
   */
  const handleFilterInListingsTab = (referenceOrId: string) => {
    setActiveTab('listings');
    setSearchListingRef(referenceOrId);
  };

  // KPIs de sécurité calculés
  const unreadAlerts = alerts.filter((a) => a.status === 'non_traite');
  const sexualViolationsCount = alerts.filter((a) =>
    a.violations.some((v) => v.type === 'nudite' || v.type === 'propos_sexuel')
  ).length;
  const extortionViolationsCount = alerts.filter((a) =>
    a.violations.some((v) => v.type === 'extorsion_rancon')
  ).length;
  const insufficientPhotosCount = alerts.filter((a) =>
    a.violations.some((v) => v.type === 'photos_insuffisantes')
  ).length;

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'non_traite' && a.status !== 'non_traite') return false;
    if (filterSeverity === 'sexual' && !a.violations.some((v) => v.type === 'nudite' || v.type === 'propos_sexuel')) return false;
    if (filterSeverity === 'extortion' && !a.violations.some((v) => v.type === 'extorsion_rancon')) return false;
    if (filterSeverity === 'photos' && !a.violations.some((v) => v.type === 'photos_insuffisantes')) return false;

    if (searchAlertQuery.trim()) {
      const q = searchAlertQuery.trim().toLowerCase();
      const refMatch = (a.listingReference || '').toLowerCase().includes(q);
      const idMatch = (a.listingId || '').toLowerCase().includes(q) || a.id.toLowerCase().includes(q);
      const titleMatch = (a.listingTitle || '').toLowerCase().includes(q);
      const authorMatch =
        (a.authorName || '').toLowerCase().includes(q) ||
        (a.authorEmail || '').toLowerCase().includes(q) ||
        (a.authorPhone || '').toLowerCase().includes(q);
      const cityMatch = (a.city || '').toLowerCase().includes(q) || (a.country || '').toLowerCase().includes(q);
      return refMatch || idMatch || titleMatch || authorMatch || cityMatch;
    }

    return true;
  });

  // Filtrage des annonces par référence, titre, auteur, ville et statut
  const filteredListings = listings.filter((l) => {
    if (filterListingStatus === 'disponible') {
      if (l.status === 'en_pause' || l.status === 'rejete' || l.moderationStatus === 'rejete') return false;
    } else if (filterListingStatus === 'en_pause') {
      if (l.status !== 'en_pause') return false;
    } else if (filterListingStatus === 'rejete') {
      if (l.status !== 'rejete' && l.moderationStatus !== 'rejete') return false;
    }

    if (searchListingRef.trim()) {
      const q = searchListingRef.trim().toLowerCase();
      const cleanQ = q.replace(/[^a-z0-9]/gi, '');
      const refCode = (l.referenceCode || '').toLowerCase();
      const cleanRef = refCode.replace(/[^a-z0-9]/gi, '');
      const idMatch = l.id.toLowerCase().includes(q);
      const refMatch = refCode.includes(q) || (cleanQ.length >= 3 && cleanRef.includes(cleanQ));
      const titleMatch = l.title.toLowerCase().includes(q);
      const cityMatch = l.city.toLowerCase().includes(q);
      const districtMatch = (l.district || '').toLowerCase().includes(q);
      const authorMatch =
        (l.authorName || '').toLowerCase().includes(q) ||
        (l.authorCompany || '').toLowerCase().includes(q);
      return refMatch || idMatch || titleMatch || cityMatch || districtMatch || authorMatch;
    }
    return true;
  });

  // Filtrage des annonces de la corbeille
  const filteredTrashListings = trashListings.filter((l) => {
    if (!searchTrashQuery.trim()) return true;
    const q = searchTrashQuery.trim().toLowerCase();
    const cleanQ = q.replace(/[^a-z0-9]/gi, '');
    const refCode = (l.referenceCode || '').toLowerCase();
    const cleanRef = refCode.replace(/[^a-z0-9]/gi, '');
    const idMatch = l.id.toLowerCase().includes(q);
    const refMatch = refCode.includes(q) || (cleanQ.length >= 3 && cleanRef.includes(cleanQ));
    const titleMatch = l.title.toLowerCase().includes(q);
    const cityMatch = l.city.toLowerCase().includes(q);
    const authorMatch =
      (l.authorName || '').toLowerCase().includes(q) ||
      (l.authorCompany || '').toLowerCase().includes(q) ||
      (l.deletedBy || '').toLowerCase().includes(q);
    return refMatch || idMatch || titleMatch || cityMatch || authorMatch;
  });

  // Filtrage des utilisateurs par nom, email, téléphone, entreprise et rôle/statut
  const filteredUsers = users.filter((u) => {
    if (filterUserRole === 'blocked_temporary') {
      if (u.accountStatus !== 'blocked_temporary') return false;
    } else if (filterUserRole === 'blocked_permanent') {
      if (u.accountStatus !== 'blocked_permanent') return false;
    } else if (filterUserRole !== 'all' && u.role !== filterUserRole) {
      return false;
    }

    if (searchUserName.trim()) {
      const q = searchUserName.trim().toLowerCase();
      const nameMatch =
        (u.name || '').toLowerCase().includes(q) ||
        (u.firstName || '').toLowerCase().includes(q) ||
        (u.lastName || '').toLowerCase().includes(q);
      const emailMatch = (u.email || '').toLowerCase().includes(q);
      const phoneMatch = (u.phone || '').toLowerCase().includes(q);
      const companyMatch = (u.companyName || '').toLowerCase().includes(q);
      const cityMatch = (u.residenceCity || '').toLowerCase().includes(q);
      const matriculeMatch = (u.matricule || '').toLowerCase().includes(q);
      return nameMatch || emailMatch || phoneMatch || companyMatch || cityMatch || matriculeMatch;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Banner Administration */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-black shadow-lg shadow-rose-900/20">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-base font-black tracking-tight text-white">
                LOCAGESTION <span className="text-rose-400">SUPER ADMIN</span>
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Console Centrale Sécurité, Annonces & Utilisateurs
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Supervision temps réel • 14 pays UEMOA & CEMAC • Protection des données & RLS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">IA de Sécurité & Purge 30j Active</span>
          </div>

          <Link
            href="/accueil"
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Consulter la Landing Page (Page d'accueil publique)"
          >
            <Home className="w-3.5 h-3.5 text-indigo-400" />
            <span>Landing Page</span>
          </Link>

          <Link
            href="/listings"
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Voir Place de Marché</span>
          </Link>

          <button
            type="button"
            onClick={logout}
            className="px-3.5 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto space-y-6">
        {actionSuccessMsg && (
          <div className="p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* 1. KPI Cards Sécurité & Modération */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Alertes Sécurité */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Alertes Sécurité IA
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-400">{unreadAlerts.length}</span>
              <span className="text-xs text-slate-400">à traiter sur {alerts.length}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Infractions bloquées avant diffusion publique</span>
            </p>
          </div>

          {/* Card 2: Annonces Actives & Réf */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Annonces & Références
              </span>
              <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-brand-400">{listings.length}</span>
              <span className="text-xs text-slate-400">total répertorié</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
              <Clock className="w-3 h-3 text-brand-400" />
              <span>Rétention 30 jours max • Auto-purge active</span>
            </p>
          </div>

          {/* Card 3: Utilisateurs Inscrits */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Comptes Utilisateurs
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-indigo-300">{users.length}</span>
              <span className="text-xs text-slate-400">inscrits sur la plateforme</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Bailleurs, Démarcheurs et Locataires gérables
            </p>
          </div>

          {/* Card 4: Annonces Conformes En Ligne */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Annonces Conformes
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-emerald-400">
                {listings.filter((l) => l.status !== 'rejete' && l.moderationStatus !== 'rejete').length}
              </span>
              <span className="text-xs text-slate-400">vérifiées par l'IA</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Chaque annonce comprend 2 à 8 photos certifiées
            </p>
          </div>
        </div>

        {/* 2. Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('alerts')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'alerts'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Alertes de Sécurité IA ({alerts.length})</span>
              {unreadAlerts.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-white text-rose-700 text-[10px] font-black">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('listings')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'listings'
                  ? 'bg-brand-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Gestion des Annonces ({listings.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Gestion des Comptes Utilisateurs ({users.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('payouts')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'payouts'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Reversements Bailleurs ({payoutStats.pendingCount > 0 ? `${payoutStats.pendingCount} en attente` : payouts.length})</span>
              {payoutStats.pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black animate-pulse">
                  {payoutStats.pendingCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rules')}
              className={`py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'rules'
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Règles d'Or & Protocole IA</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={refreshData}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
              title="Rafraîchir les données"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 3. Tab Contents */}

        {/* TAB 1: JOURNAL DES ALERTES DE SÉCURITÉ */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {/* Barre de recherche d'alertes & Filtres de sévérité */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>Journal des Alertes & Signalements IA ({alerts.length})</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Recherchez par référence d'annonce (ex: LOCA-BJ-...), titre, auteur ou ville. Accédez directement à l'annonce en 1 clic.
                  </p>
                </div>

                {/* Champ de recherche alerte par référence */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchAlertQuery}
                    onChange={(e) => setSearchAlertQuery(e.target.value)}
                    placeholder="Rechercher par référence (LOCA-...), titre, auteur..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  {searchAlertQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchAlertQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Filtre d'alertes */}
              <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-800/80">
                <span className="text-xs text-slate-400 font-bold flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filtrer :</span>
                </span>
                {[
                  { id: 'all', label: `Toutes (${alerts.length})` },
                  { id: 'non_traite', label: `Non traitées (${unreadAlerts.length})` },
                  { id: 'sexual', label: `Nudité / Propos Sexuels (${sexualViolationsCount})` },
                  { id: 'extortion', label: `Rançonnement / Extorsion (${extortionViolationsCount})` },
                  { id: 'photos', label: `Moins de 2 Photos (${insufficientPhotosCount})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilterSeverity(f.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filterSeverity === f.id
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredAlerts.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 space-y-3">
                <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-bold text-slate-200">
                  Aucune alerte de sécurité dans cette vue
                </h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Toutes les annonces soumises respectent les règles strictes de la plateforme : au
                  moins 2 visuels, aucune nudité ni propos sexuels, aucune tentative d'extorsion ou de
                  rançonnement.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3.5"
                  >
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="space-y-2 flex-1 min-w-[280px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Statut Badge */}
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              alert.status === 'non_traite'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : alert.status === 'bloque'
                                  ? 'bg-red-950 text-red-400 border border-red-800'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {alert.status === 'non_traite'
                              ? '🚨 BLOQUÉ PAR L\'IA — À TRAITER'
                              : alert.status === 'bloque'
                                ? '🔒 BLOCAGE CONFIRMÉ PAR L\'ADMIN'
                                : 'DÉROGATION ACCORDÉE'}
                          </span>

                          {/* Référence Officielle de l'Annonce avec Copie 1-clic */}
                          <div className="flex items-center gap-1.5 bg-slate-950 border border-brand-500/40 px-2.5 py-0.5 rounded-xl shadow-xs">
                            <Tag className="w-3 h-3 text-brand-400 shrink-0" />
                            <span className="text-xs font-mono font-black text-brand-300">
                              Réf: {alert.listingReference || alert.listingId || 'LOCA-ANN-REF'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const ref = alert.listingReference || alert.listingId || '';
                                if (ref) {
                                  navigator.clipboard?.writeText(ref);
                                  setCopiedItem(ref);
                                  setTimeout(() => setCopiedItem(null), 1500);
                                }
                              }}
                              className="text-slate-400 hover:text-white p-0.5 ml-0.5 transition-colors cursor-pointer"
                              title="Copier la référence de l'annonce"
                            >
                              {copiedItem === (alert.listingReference || alert.listingId) ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>

                          <span className="text-xs text-slate-400">{alert.detectedAt}</span>
                          <span className="text-xs text-slate-500">• {alert.country} ({alert.city})</span>
                        </div>

                        {/* Titre et Boutons d'Accès Direct */}
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="text-sm font-black text-white">{alert.listingTitle}</h4>

                          {/* Bouton Accès Direct 1-Clic à l'Annonce */}
                          <button
                            type="button"
                            onClick={() => handleDirectAccessListing(alert)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 text-xs font-black transition-all cursor-pointer shadow-xs active:scale-95"
                            title="Ouvrir immédiatement la fiche détaillée de l'annonce en 1 clic"
                          >
                            <Eye className="w-3.5 h-3.5 text-brand-400" />
                            <span>Accéder à l'annonce (1 clic)</span>
                          </button>

                          {/* Bouton Rechercher dans Gestion des Annonces */}
                          <button
                            type="button"
                            onClick={() => handleFilterInListingsTab(alert.listingReference || alert.listingId || '')}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                            title="Filtrer cette annonce dans l'onglet Gestion des Annonces"
                          >
                            <ExternalLink className="w-3 h-3 text-slate-400" />
                            <span>Voir dans annonces</span>
                          </button>
                        </div>
                      </div>

                      {/* Coordonnées de l'auteur */}
                      <div className="px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">
                          Auteur ({alert.authorRole}) :
                        </span>
                        <div className="font-bold text-slate-200">{alert.authorName}</div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{alert.authorPhone}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-500" />
                            <span>{alert.authorEmail}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bloc Explicatif : Motif Détaillé du Blocage IA */}
                    <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/40 via-red-950/20 to-rose-950/40 border border-rose-900/50 space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[11px] font-black uppercase text-rose-400 tracking-wider flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                          <span>Motif du Blocage par l'IA :</span>
                        </span>
                        <span className="text-[10px] font-bold text-rose-300 bg-rose-950 px-2 py-0.5 rounded-full border border-rose-800">
                          {alert.violations.length} violation{alert.violations.length > 1 ? 's' : ''} constatée{alert.violations.length > 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        {alert.violations.map((v, idx) => {
                          const categoryLabel =
                            v.type === 'photos_insuffisantes'
                              ? 'Visuels insuffisants (< 2 médias requis)'
                              : v.type === 'nudite' || v.type === 'propos_sexuel'
                              ? 'Nudité ou contenu explicite / sexuel'
                              : 'Tentative d’extorsion ou paiement avant visite';

                          const categoryBadgeColor =
                            v.type === 'photos_insuffisantes'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/30';

                          return (
                            <div
                              key={idx}
                              className="p-3 rounded-xl bg-slate-950/70 border border-rose-900/40 space-y-2 text-xs"
                            >
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${categoryBadgeColor}`}
                                >
                                  {categoryLabel}
                                </span>
                                {v.severity && (
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Sévérité : <strong className="text-rose-400 uppercase">{v.severity}</strong>
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-rose-200 font-semibold leading-relaxed">
                                <strong>Règle enfreinte :</strong> {v.message}
                              </p>

                              {v.triggerSnippet && (
                                <div className="p-2 rounded-lg bg-black/60 border border-rose-950 text-[11px] font-mono text-rose-300 flex items-start gap-1.5">
                                  <span className="text-rose-500 font-bold shrink-0">Élément intercepté :</span>
                                  <span className="break-all italic">« {v.triggerSnippet} »</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Actions de l'administrateur */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 flex-wrap gap-2">
                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        <span className="text-[11px] text-slate-500 font-mono">ID Alerte: {alert.id}</span>
                        {alert.listingReference && (
                          <span className="font-mono text-brand-400/90 font-bold">
                            Réf Annonce: {alert.listingReference}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={() => handleDirectAccessListing(alert)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                          title="Inspecter la fiche de l'annonce"
                        >
                          <Eye className="w-3.5 h-3.5 text-brand-400" />
                          <span>Inspecter l'annonce</span>
                        </button>
                        {alert.status === 'non_traite' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleResolveAlert(alert.id, 'bloque')}
                              className="px-3 py-1.5 rounded-xl bg-red-900/80 hover:bg-red-800 text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                              Confirmer le Blocage
                            </button>
                            <button
                              type="button"
                              onClick={() => handleResolveAlert(alert.id, 'autorise_par_admin')}
                              className="px-3 py-1.5 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Autoriser par Dérogation
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleResolveAlert(alert.id, 'supprime')}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                          title="Supprimer ce rapport d'alerte"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GESTION & SUPERVISION DES ANNONCES (AVEC RECHERCHE PAR RÉFÉRENCE, PURGE 30J & CORBEILLE DE RESTAURATION) */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            {/* Sous-onglets : Annonces Actives VS Corbeille */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3 flex-wrap">
              <button
                type="button"
                onClick={() => setListingSubView('active')}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  listingSubView === 'active'
                    ? 'bg-brand-500 text-white shadow-pink-glow'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Annonces Actives ({listings.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setListingSubView('trash')}
                className={`px-4 py-2 rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                  listingSubView === 'trash'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-rose-300" />
                <span>Corbeille & Annonces Supprimées ({trashListings.length})</span>
              </button>
            </div>

            {/* VUE 1 : ANNONCES ACTIVES */}
            {listingSubView === 'active' && (
              <div className="space-y-4">
                {/* Barre d'outils et recherche par référence */}
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-brand-400" />
                        <span>Recherche d'Annonce par Référence Unique</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Trouvez instantanément n'importe quelle annonce grâce à sa référence certifiée (ex: <code className="text-brand-300 font-mono">LOCA-BJ-2026-XXXXX</code>)
                      </p>
                    </div>

                    {/* Bouton de Purge manuelle 30 jours */}
                    <button
                      type="button"
                      onClick={handleManualPurgeExpired}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Purger les annonces expirées (+30 jours)</span>
                    </button>
                  </div>

                  {/* Champ de recherche */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={searchListingRef}
                      onChange={(e) => setSearchListingRef(e.target.value)}
                      placeholder="Saisissez la référence (ex: LOCA-BJ-2026-...), le titre, la ville, le quartier ou l'auteur..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                    {searchListingRef && (
                      <button
                        type="button"
                        onClick={() => setSearchListingRef('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filtres de statut */}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[11px] font-bold text-slate-400">Filtrer par statut :</span>
                    {[
                      { id: 'all', label: `Toutes (${listings.length})` },
                      { id: 'disponible', label: `Disponibles (${listings.filter(l => l.status !== 'en_pause' && l.status !== 'rejete' && l.moderationStatus !== 'rejete').length})` },
                      { id: 'en_pause', label: `En pause (${listings.filter(l => l.status === 'en_pause').length})` },
                      { id: 'rejete', label: `Rejetées IA (${listings.filter(l => l.status === 'rejete' || l.moderationStatus === 'rejete').length})` },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setFilterListingStatus(st.id)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          filterListingStatus === st.id
                            ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                            : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Liste des annonces filtrées */}
                {filteredListings.length === 0 ? (
                  <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 space-y-2">
                    <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-200">Aucune annonce trouvée</h4>
                    <p className="text-xs text-slate-400">
                      Aucune publication ne correspond à votre référence ou critère de recherche.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredListings.map((l) => {
                      const age = getListingAgeInDays(l);
                      const daysRemaining = Math.max(0, 30 - age);
                      const isExpiringSoon = daysRemaining <= 5;

                      return (
                        <div
                          key={l.id}
                          className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-4 flex-1">
                            <img
                              src={l.images[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200'}
                              alt={l.title}
                              className="w-20 h-20 rounded-2xl object-cover border border-slate-800 shrink-0 bg-slate-950"
                            />
                            <div className="space-y-1.5 flex-1 min-w-0">
                              {/* En-tête : Référence + Statut + Rétention 30j */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-[11px] font-mono font-black px-2.5 py-0.5 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30">
                                  Réf: {l.referenceCode || l.id}
                                </span>

                                {l.status === 'rejete' || l.moderationStatus === 'rejete' ? (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                    Rejeté IA
                                  </span>
                                ) : l.status === 'en_pause' ? (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                                    En pause
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                    <span>Conforme</span>
                                  </span>
                                )}

                                {/* Badge d'âge et règle de rétention 30 jours */}
                                <span
                                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1 ${
                                    isExpiringSoon
                                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                      : 'bg-slate-800 text-slate-300'
                                  }`}
                                  title="Règle d'auto-suppression après 30 jours pour économiser l'espace"
                                >
                                  <Clock className="w-3 h-3" />
                                  <span>
                                    Jour {age}/30 • {daysRemaining === 0 ? 'Expirée' : `Expire dans ${daysRemaining}j`}
                                  </span>
                                </span>
                              </div>

                              {/* Titre & Localisation */}
                              <h4 className="text-sm font-black text-white truncate">{l.title}</h4>
                              <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3 text-slate-500" />
                                  <span>{l.city}{l.district ? `, ${l.district}` : ''} ({l.country})</span>
                                </span>
                                <span>•</span>
                                <span className="text-slate-200 font-bold">
                                  Loyer : {formatFCFA(l.monthlyRent)}/mois
                                </span>
                                <span>•</span>
                                <span>{l.images.length} / 8 photo{l.images.length > 1 ? 's' : ''}</span>
                              </div>

                              {/* Auteur & Entreprise */}
                              <div className="text-[11px] text-slate-400 pt-0.5">
                                <span className="text-slate-500 font-bold">Auteur : </span>
                                <span className="text-slate-200 font-semibold">
                                  {l.authorCompany ? `${l.authorCompany} (${l.authorName})` : l.authorName}
                                </span>
                                <span className="text-slate-500"> • Statut : {resolveListingAuthorRole(l)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions Admin */}
                          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedListingForDetail(l)}
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Fiche</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTogglePauseListing(l.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                l.status === 'en_pause'
                                  ? 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800'
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              {l.status === 'en_pause' ? 'Activer' : 'Mettre en pause'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteListing(l.id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                              title="Déplacer dans la corbeille"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* VUE 2 : CORBEILLE & RESTAURATION D'ANNONCES SUPPRIMÉES */}
            {listingSubView === 'trash' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <h3 className="text-sm font-black text-white flex items-center gap-2">
                        <RotateCcw className="w-4 h-4 text-rose-400" />
                        <span>Corbeille & Restauration des Annonces ({trashListings.length})</span>
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Toutes les annonces supprimées par erreur par les utilisateurs ou l'administration sont conservées ici et restaurables en 1 clic.
                      </p>
                    </div>

                    {trashListings.length > 0 && (
                      <button
                        type="button"
                        onClick={handleEmptyTrash}
                        className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Vider la corbeille ({trashListings.length})</span>
                      </button>
                    )}
                  </div>

                  {/* Champ de recherche dans la corbeille */}
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      value={searchTrashQuery}
                      onChange={(e) => setSearchTrashQuery(e.target.value)}
                      placeholder="Rechercher dans la corbeille par référence (ex: LOCA-BJ-...), titre, ville ou auteur..."
                      className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    {searchTrashQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchTrashQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {filteredTrashListings.length === 0 ? (
                  <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 space-y-2">
                    <ArchiveRestore className="w-10 h-10 text-slate-600 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-200">La corbeille d'annonces est vide</h4>
                    <p className="text-xs text-slate-400">
                      Aucune annonce supprimée n'est en attente de restauration.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTrashListings.map((l) => (
                      <div
                        key={l.id}
                        className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-rose-950/60 hover:border-rose-900/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <img
                            src={l.images[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200'}
                            alt={l.title}
                            className="w-20 h-20 rounded-2xl object-cover border border-slate-800 shrink-0 bg-slate-950 opacity-80"
                          />
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-mono font-black px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                                Réf: {l.referenceCode || l.id}
                              </span>

                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                                <Trash2 className="w-3 h-3 text-rose-400" />
                                <span>Supprimée le {l.deletedAt || 'Récemment'} par {l.deletedBy || 'Utilisateur'}</span>
                              </span>
                            </div>

                            <h4 className="text-sm font-black text-white truncate">{l.title}</h4>
                            <div className="text-xs text-slate-400 flex items-center gap-2 flex-wrap">
                              <span>{l.city}{l.district ? `, ${l.district}` : ''} ({l.country})</span>
                              <span>•</span>
                              <span className="text-slate-200 font-bold">Loyer : {formatFCFA(l.monthlyRent)}/mois</span>
                              <span>•</span>
                              <span>Auteur : {l.authorCompany ? `${l.authorCompany} (${l.authorName})` : l.authorName}</span>
                            </div>

                            {l.deletedReason && (
                              <p className="text-[11px] text-rose-300/80 italic">
                                Motif : {l.deletedReason}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Boutons d'action Corbeille */}
                        <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleRestoreListing(l.id, l.title, l.authorName)}
                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-950/40 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
                            title="Restaurer cette annonce pour l'utilisateur"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restaurer l'annonce</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePermanentDeleteFromTrash(l.id)}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Purger définitivement cette annonce"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: GESTION & MODÉRATION DES COMPTES UTILISATEURS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Widget Dédié : Accès Immédiat par Matricule Officiel */}
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-900 border-2 border-indigo-500/40 shadow-xl space-y-3.5">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-inner">
                    <Fingerprint className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white flex items-center gap-2">
                      <span>Accès Direct par Matricule Officiel</span>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/25 text-indigo-300 border border-indigo-500/40">
                        Super-Admin
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Entrez le matricule officiel pour inspecter la formule, l&apos;historique complet et activer ou annuler des abonnements.
                    </p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSearchByMatricule} className="flex items-center gap-2 flex-wrap sm:flex-nowrap pt-1">
                <div className="relative flex-1 min-w-[260px]">
                  <Fingerprint className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-400" />
                  <input
                    type="text"
                    value={matriculeSearchInput}
                    onChange={(e) => {
                      setMatriculeSearchInput(e.target.value);
                      if (matriculeSearchError) setMatriculeSearchError(null);
                    }}
                    placeholder="Saisir un matricule (ex: LOCA-MAT-BJ-17635 ou 17635)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-indigo-500/30 text-xs font-mono font-bold text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-inner"
                  />
                  {matriculeSearchInput && (
                    <button
                      type="button"
                      onClick={() => setMatriculeSearchInput('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2 shrink-0 cursor-pointer active:scale-95"
                >
                  <Search className="w-4 h-4" />
                  <span>Accéder au Compte</span>
                </button>
              </form>

              {matriculeSearchError && (
                <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300 font-bold flex items-center gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{matriculeSearchError}</span>
                </div>
              )}
            </div>

            {/* Outils de recherche et de gestion des comptes */}
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5">
              <div>
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Recherche & Modération des Comptes Utilisateurs ({users.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recherchez par matricule officiel, nom, prénom, email, téléphone ou raison sociale. Modifiez les rôles ou supprimez des comptes non conformes.
                </p>
              </div>

              {/* Champ de recherche utilisateur */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchUserName}
                  onChange={(e) => setSearchUserName(e.target.value)}
                  placeholder="Rechercher par matricule (ex: LOCA-MAT-BJ-...), nom, prénom, email, téléphone, entreprise ou ville..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {searchUserName && (
                  <button
                    type="button"
                    onClick={() => setSearchUserName('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtre par rôle et statut */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[11px] font-bold text-slate-400">Filtrer les comptes :</span>
                {[
                  { id: 'all', label: `Tous (${users.length})` },
                  { id: 'bailleur', label: `Bailleurs (${users.filter(u => u.role === 'bailleur').length})` },
                  { id: 'demarcheur', label: `Démarcheurs (${users.filter(u => u.role === 'demarcheur').length})` },
                  { id: 'locataire', label: `Locataires (${users.filter(u => u.role === 'locataire').length})` },
                  { id: 'blocked_temporary', label: `🟡 Suspendus Temp. (${users.filter(u => u.accountStatus === 'blocked_temporary').length})` },
                  { id: 'blocked_permanent', label: `🔴 Bloqués Définitif (${users.filter(u => u.accountStatus === 'blocked_permanent').length})` },
                  { id: 'admin', label: `Super Admin (${users.filter(u => u.role === 'admin').length})` },
                ].map((rf) => (
                  <button
                    key={rf.id}
                    type="button"
                    onClick={() => setFilterUserRole(rf.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      filterUserRole === rf.id
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:bg-slate-800'
                    }`}
                  >
                    {rf.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grille / Liste des utilisateurs */}
            {filteredUsers.length === 0 ? (
              <div className="p-12 text-center bg-slate-900 rounded-3xl border border-slate-800 space-y-2">
                <UserX className="w-10 h-10 text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-200">Aucun utilisateur trouvé</h4>
                <p className="text-xs text-slate-400">
                  Aucun compte ne correspond à votre recherche par nom ou rôle.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((u) => {
                  const isSuperAdminAccount =
                    u.id === SYSTEM_ADMIN_USER.id ||
                    areEmailsEqual(u.email, SYSTEM_ADMIN_USER.email) ||
                    u.role === 'admin';

                  // Nombre d'annonces publiées par cet utilisateur
                  const userListingsCount = listings.filter(
                    (l) => l.authorId === u.id || areEmailsEqual(l.authorEmail, u.email)
                  ).length;

                  return (
                    <div
                      key={u.id}
                      className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-4 flex-1">
                        <img
                          src={u.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160'}
                          alt={u.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-800 shrink-0 bg-slate-950"
                        />
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-sm font-black text-white">{u.name}</h4>

                            {/* Badge Matricule officiel avec copie 1-clic */}
                            {u.matricule && (
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1.5 shadow-xs">
                                <Fingerprint className="w-3 h-3 text-indigo-400" />
                                <span>{u.matricule}</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard?.writeText(u.matricule!);
                                    setCopiedItem(u.matricule!);
                                    setTimeout(() => setCopiedItem(null), 1500);
                                  }}
                                  className="text-slate-400 hover:text-white transition-colors cursor-pointer ml-0.5 p-0.5"
                                  title="Copier le matricule"
                                >
                                  {copiedItem === u.matricule ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </span>
                            )}

                            {/* Badge Entreprise si renseignée */}
                            {u.companyName && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                <span>{u.companyName}</span>
                              </span>
                            )}

                            {/* Badge Rôle */}
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                u.role === 'admin'
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                  : u.role === 'bailleur'
                                    ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                                    : u.role === 'demarcheur'
                                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {u.role}
                            </span>

                            {/* Badge Formule */}
                            {(() => {
                              const plan = PlanService.getUserPlan(u.id);
                              if (plan === 'pro') {
                                const sub = PlanService.getUserSubscription(u.id);
                                return (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 shadow-xs">
                                    <Flame className="w-2.5 h-2.5 text-orange-400 fill-orange-400" />
                                    <span>Formule Pro ({sub.daysRemaining ?? 30}j)</span>
                                  </span>
                                );
                              }
                              if (plan === 'serenite') {
                                return (
                                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-xs">
                                    <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                                    <span>Formule Sérénité</span>
                                  </span>
                                );
                              }
                              return (
                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
                                  <Zap className="w-2.5 h-2.5 text-amber-500" />
                                  <span>Formule Découverte</span>
                                </span>
                              );
                            })()}

                            {/* Badge Statut du Compte (Actif / Suspendu / Bloqué) */}
                            {u.accountStatus === 'blocked_temporary' ? (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/25 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-xs">
                                <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />
                                <span>Suspendu Temporaire</span>
                              </span>
                            ) : u.accountStatus === 'blocked_permanent' ? (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-600/30 text-rose-300 border border-rose-500/50 flex items-center gap-1 shadow-xs">
                                <Ban className="w-2.5 h-2.5 text-rose-400" />
                                <span>Bloqué Définitif</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                <span>Actif</span>
                              </span>
                            )}

                            {isSuperAdminAccount && (
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800 flex items-center gap-1">
                                <Shield className="w-2.5 h-2.5" />
                                <span>Compte Protégé</span>
                              </span>
                            )}
                          </div>

                          {/* Coordonnées Email & Téléphone */}
                          <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3 text-slate-500" />
                              <span>{u.email}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-500" />
                              <span>{u.phone}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-500" />
                              <span>{u.residenceCity || 'Cotonou'} ({u.residenceCountry || 'Bénin'})</span>
                            </span>
                          </div>

                          {/* Statut annonces & Inscription */}
                          <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                            <span>Inscrit le : {u.registeredAt || '01/01/2026'}</span>
                            <span>•</span>
                            <span className="text-slate-300 font-bold">
                              {userListingsCount} annonce{userListingsCount > 1 ? 's' : ''} publiée{userListingsCount > 1 ? 's' : ''}
                            </span>
                            {u.ifuNumber && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-400">IFU: {u.ifuNumber}</span>
                              </>
                            )}
                          </div>

                          {/* Bandeau d'information si le compte est bloqué */}
                          {(u.accountStatus === 'blocked_temporary' || u.accountStatus === 'blocked_permanent') && (
                            <div className="p-2.5 rounded-xl bg-slate-950 border border-amber-900/40 text-[11px] text-amber-200/90 flex items-start gap-2 mt-1">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <div className="leading-tight">
                                <span className="font-bold text-amber-300">
                                  {u.accountStatus === 'blocked_temporary' ? 'Suspension temporaire :' : 'Blocage définitif :'}
                                </span>{' '}
                                <span>{u.blockReason || 'Vérifications de sécurité administratives en cours.'}</span>
                                {u.blockedAt && (
                                  <span className="text-slate-400 text-[10px] block mt-0.5">Appliqué le {u.blockedAt}</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions Admin sur l'utilisateur */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
                        {/* Bouton Formule & Compte Super-Admin */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForDetail(u);
                            setUserModalTab('formule');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/25 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                          title="Gérer la formule, l'historique et inspecter ce compte"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Formule &amp; Compte</span>
                        </button>

                        {/* Bouton fiche complète */}
                        <button
                          type="button"
                          onClick={() => setSelectedUserForDetail(u)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Fiche</span>
                        </button>

                        {/* Boutons Blocage / Réactivation (Hors Super-Admin) */}
                        {!isSuperAdminAccount && (
                          u.accountStatus === 'blocked_temporary' || u.accountStatus === 'blocked_permanent' ? (
                            <button
                              type="button"
                              onClick={() => handleReactivateUser(u)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md shadow-emerald-950/40 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                              title="Réactiver ce compte utilisateur après vérifications"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Réactiver</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleOpenBlockModal(u, 'temporary')}
                                className="px-2.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Suspendre temporairement ce compte pour audit"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                <span>Suspendre</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenBlockModal(u, 'permanent')}
                                className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                title="Bloquer définitivement ce compte"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                <span>Bloquer</span>
                              </button>
                            </div>
                          )
                        )}

                        {/* Sélecteur de rôle (Désactivé pour le Super Admin système) */}
                        {!isSuperAdminAccount ? (
                          <div className="flex items-center">
                            <select
                              value={u.role}
                              onChange={(e) => handleChangeUserRole(u, e.target.value as UserSpace)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                              title="Changer le rôle du compte"
                            >
                              <option value="bailleur">Bailleur</option>
                              <option value="demarcheur">Démarcheur</option>
                              <option value="locataire">Locataire</option>
                            </select>
                          </div>
                        ) : null}

                        {/* Bouton de suppression du compte */}
                        {!isSuperAdminAccount ? (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u)}
                            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                            title="Supprimer définitivement ce compte utilisateur"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-500 italic px-2">Non supprimable</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: RÈGLES D'OR & PROTOCOLE DE SÉCURITÉ IA */}
        {activeTab === 'rules' && (
          <div className="space-y-5">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Protocole de Sécurité & Règles d'Or de l'IA (LOCAGESTION Shield)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Règles strictes et immuables appliquées sur tous les espaces (Bailleurs, Locataires, Démarcheurs)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
                {/* Règle 1 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black text-xs">
                    1
                  </div>
                  <h4 className="text-xs font-black text-white">
                    Interdiction Nudité & Propos Sexuels
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Aucune photo dénudée, suggestive ou propos relatif au racolage, à l'escorte,
                    aux massages érotiques ou aux chambres de passe n'est toléré. L'IA analyse le
                    titre, la description et les fichiers visuels.
                  </p>
                </div>

                {/* Règle 2 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                    2
                  </div>
                  <h4 className="text-xs font-black text-white">
                    Rançonnement & Paiement Avant Visite
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Toute tentative d'extorsion, de chantage ou d'exigence de paiement préalable
                    (par Mobile Money ou virement) avant une visite physique contradictoire est
                    immédiatement bloquée et signalée au compte Admin.
                  </p>
                </div>

                {/* Règle 3 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black text-xs">
                    3
                  </div>
                  <h4 className="text-xs font-black text-white">
                    Photos : 2 Minimum, 8 Maximum
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Toute annonce comportant 0 ou 1 seule photo est strictement rejetée.
                    L'obligation de 2 médias minimum garantit la transparence visuelle et protège
                    les locataires. La limite est fixée à 8 visuels par logement.
                  </p>
                </div>

                {/* Règle 4 */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-black text-xs">
                    4
                  </div>
                  <h4 className="text-xs font-black text-white">
                    Auto-Purge après 30 Jours
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Toute annonce en ligne depuis plus de 30 jours est automatiquement purgée de la plateforme
                    avec notification envoyée à son auteur. Ceci optimise le stockage et assure que toutes
                    les offres sont d'actualité.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: CONSOLE DE REVERSEMENTS BAILLEURS (FEDAPAY PAYOUTS & FORMULE SÉRÉNITÉ) */}
        {activeTab === 'payouts' && (
          <div className="space-y-6">
            {/* Bannière d'information & Contexte FedaPay */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-2 border-emerald-500/40 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-black text-white">
                        Console de Reversements Bailleurs (98 % Net)
                      </h2>
                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Formule Sérénité & FedaPay
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Pilotage comptable, suivi des déboursements et scellement des virements de loyers nets aux bailleurs partenaires.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[10px] font-mono px-3 py-1 rounded-xl bg-slate-950 text-slate-300 border border-slate-800">
                    Marchand : <strong>acc_3137475447</strong> (MONROY AG)
                  </span>
                </div>
              </div>

              {/* Notice FedaPay Support */}
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-3 text-xs text-slate-300">
                <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-slate-200">
                    <strong>Processus de déboursement actuel :</strong> L'API automatisée de Payouts étant momentanément suspendue chez FedaPay, tous les encaissements locataires (100 %) sont conservés en toute sécurité sur votre solde marchand FedaPay.
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Conformément aux directives de FedaPay, effectuez un retrait classique de vos fonds, transférez directement les 98 % nets aux bailleurs via leurs numéros Wave, MTN, Moov ou comptes bancaires indiqués ci-dessous, puis cliquez sur <strong>« Confirmer le reversement »</strong> pour leur délivrer instantanément une notification officielle dans leur espace.
                  </p>
                </div>
              </div>
            </div>

            {/* 4 Cartes KPI Financières */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Collecté Brut */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Total Encaissé (FedaPay)
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-white font-mono">
                    {formatFCFA(payoutStats.totalCollected)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  100 % des loyers perçus sur le compte marchand
                </p>
              </div>

              {/* Commission Plateforme 2% */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Commissions LOCAGESTION (2 %)
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-2xl font-black text-purple-400 font-mono">
                    {formatFCFA(payoutStats.totalCommissions)}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Revenu net acquis par la plateforme
                </p>
              </div>

              {/* En Attente de Virement (98%) */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-amber-500/40 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">
                    En Attente de Virement (98 %)
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                    <Clock className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-400 font-mono">
                    {formatFCFA(payoutStats.totalPending)}
                  </span>
                  <span className="text-xs text-amber-300/80 font-bold">
                    ({payoutStats.pendingCount})
                  </span>
                </div>
                <p className="text-[10px] text-amber-200/70 mt-2">
                  À débourser aux bailleurs par virement / Mobile Money
                </p>
              </div>

              {/* Déjà Reversé (98%) */}
              <div className="p-4 rounded-3xl bg-slate-900 border border-emerald-500/30 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                    Déjà Reversé (98 %)
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                    <CheckCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {formatFCFA(payoutStats.totalDisbursed)}
                  </span>
                  <span className="text-xs text-emerald-300/80 font-bold">
                    ({payoutStats.completedCount})
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">
                  Fonds scellés et confirmés aux bailleurs
                </p>
              </div>
            </div>

            {/* Barre de Recherche et Filtres */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par bailleur, téléphone, quittance, logement..."
                  value={payoutSearchQuery}
                  onChange={(e) => setPayoutSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPayoutStatusFilter('all')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    payoutStatusFilter === 'all'
                      ? 'bg-emerald-600 text-white font-black'
                      : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Tous ({payouts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutStatusFilter('en_attente')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    payoutStatusFilter === 'en_attente'
                      ? 'bg-amber-600 text-white font-black'
                      : 'bg-slate-950 text-amber-400/80 hover:text-amber-300 border border-slate-800'
                  }`}
                >
                  <Clock className="w-3 h-3" />
                  <span>En attente ({payoutStats.pendingCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayoutStatusFilter('reverse')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    payoutStatusFilter === 'reverse'
                      ? 'bg-emerald-700 text-white font-black'
                      : 'bg-slate-950 text-emerald-400/80 hover:text-emerald-300 border border-slate-800'
                  }`}
                >
                  <Check className="w-3 h-3" />
                  <span>Reversés ({payoutStats.completedCount})</span>
                </button>
              </div>
            </div>

            {/* Liste des Lignes de Reversements */}
            {(() => {
              const filtered = payouts.filter((p) => {
                if (payoutStatusFilter !== 'all' && p.status !== payoutStatusFilter) return false;
                if (payoutSearchQuery.trim()) {
                  const q = payoutSearchQuery.toLowerCase().trim();
                  const matchLandlord = p.landlordName.toLowerCase().includes(q) || p.landlordPhone.includes(q);
                  const matchUnit = p.unitNumber.toLowerCase().includes(q) || p.propertyName.toLowerCase().includes(q);
                  const matchTenant = p.tenantName.toLowerCase().includes(q) || p.tenantPhone.includes(q);
                  const matchRef = p.receiptNumber.toLowerCase().includes(q) || (p.disbursementRef && p.disbursementRef.toLowerCase().includes(q));
                  if (!matchLandlord && !matchUnit && !matchTenant && !matchRef) return false;
                }
                return true;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-12 text-center rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <h3 className="text-sm font-black text-white">Aucun reversement trouvé</h3>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Aucune transaction ne correspond à vos filtres actuels. Dès qu'un locataire règle via Mobile Money, la ligne de reversement apparaîtra ici.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {filtered.map((p) => {
                    const isPending = p.status === 'en_attente';
                    const landlordPhoneClean = (p.landlordPaymentInfo?.wave || p.landlordPhone || '').replace(/\D/g, '');
                    return (
                      <div
                        key={p.id}
                        className={`p-5 sm:p-6 rounded-3xl border transition-all space-y-4 ${
                          isPending
                            ? 'bg-slate-900/95 border-amber-500/50 shadow-lg shadow-amber-950/20'
                            : 'bg-slate-900/60 border-slate-800'
                        }`}
                      >
                        {/* En-tête de carte */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span
                              className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 border ${
                                isPending
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              }`}
                            >
                              {isPending ? (
                                <>
                                  <Clock className="w-3 h-3" />
                                  <span>Reversement 98 % en attente</span>
                                </>
                              ) : (
                                <>
                                  <CheckCheck className="w-3 h-3" />
                                  <span>98 % Reversé au Bailleur</span>
                                </>
                              )}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-400">
                              Quittance : <strong className="text-slate-200">{p.receiptNumber}</strong>
                            </span>
                            <span className="text-xs text-slate-500">•</span>
                            <span className="text-xs text-slate-400">
                              Période : <strong className="text-slate-300">{p.period}</strong>
                            </span>
                          </div>

                          <div className="text-xs text-slate-400">
                            Encaissé le : <strong className="text-slate-200">{p.paymentDate}</strong>
                          </div>
                        </div>

                        {/* Corps en 3 colonnes */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Col 1 : Logement & Locataire */}
                          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">
                              Logement & Locataire
                            </span>
                            <h4 className="font-black text-white text-sm">
                              {p.unitNumber}
                            </h4>
                            <p className="text-slate-400">
                              {p.propertyName}
                            </p>
                            <div className="pt-2 border-t border-slate-800/60 text-slate-400 flex items-center justify-between">
                              <span>Payé par :</span>
                              <strong className="text-slate-200 font-bold">{p.tenantName}</strong>
                            </div>
                            <div className="text-slate-400 flex items-center justify-between">
                              <span>Bail lié :</span>
                              <span className="font-mono text-slate-300">{p.leaseId || 'BAIL-2026-421'}</span>
                            </div>
                          </div>

                          {/* Col 2 : Décomposition Financière (Formule Sérénité) */}
                          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">
                              Ventilation Financière (Split 2 % / 98 %)
                            </span>
                            <div className="flex items-center justify-between text-slate-400">
                              <span>Loyer brut encaissé (100 %) :</span>
                              <strong className="text-slate-200 font-mono font-bold">
                                {formatFCFA(p.totalCollected)}
                              </strong>
                            </div>
                            <div className="flex items-center justify-between text-purple-400">
                              <span>Commission LOCAGESTION (2 %) :</span>
                              <span className="font-mono font-bold">
                                - {formatFCFA(p.platformCommission)}
                              </span>
                            </div>
                            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                              <span className="text-xs font-black text-white">Net Garanti Bailleur (98 %) :</span>
                              <span className="text-base font-black text-emerald-400 font-mono">
                                {formatFCFA(p.netPayoutAmount)}
                              </span>
                            </div>
                          </div>

                          {/* Col 3 : Coordonnées du Bailleur & Canaux de Virement */}
                          <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2 text-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-500 block">
                              Coordonnées de Versement du Bailleur
                            </span>
                            <div className="flex items-center justify-between">
                              <strong className="text-white text-sm">{p.landlordName}</strong>
                            </div>
                            <div className="space-y-1.5 pt-1">
                              {p.landlordPaymentInfo?.wave && (
                                <div className="flex items-center justify-between p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px]">
                                  <span className="text-amber-300 font-bold">WAVE :</span>
                                  <span className="font-mono text-white font-bold">{p.landlordPaymentInfo.wave}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(p.landlordPaymentInfo.wave || '');
                                      setCopiedItem(`wave-${p.id}`);
                                      setTimeout(() => setCopiedItem(null), 2000);
                                    }}
                                    className="p-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 cursor-pointer"
                                    title="Copier le numéro Wave"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              {p.landlordPaymentInfo?.mtn && (
                                <div className="flex items-center justify-between p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-[11px]">
                                  <span className="text-yellow-300 font-bold">MTN :</span>
                                  <span className="font-mono text-white font-bold">{p.landlordPaymentInfo.mtn}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(p.landlordPaymentInfo.mtn || '');
                                      setCopiedItem(`mtn-${p.id}`);
                                      setTimeout(() => setCopiedItem(null), 2000);
                                    }}
                                    className="p-1 rounded bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 cursor-pointer"
                                    title="Copier le numéro MTN"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              )}

                              {p.landlordPaymentInfo?.bank && (
                                <div className="flex items-center justify-between p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[10px]">
                                  <span className="text-blue-300 font-bold">RIB :</span>
                                  <span className="font-mono text-slate-300 truncate max-w-[140px]">{p.landlordPaymentInfo.bank}</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(p.landlordPaymentInfo.bank || '');
                                      setCopiedItem(`bank-${p.id}`);
                                      setTimeout(() => setCopiedItem(null), 2000);
                                    }}
                                    className="p-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 cursor-pointer"
                                    title="Copier le RIB bancaire"
                                  >
                                    <Copy className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Bas de carte : Actions et Traçabilité */}
                        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
                          {isPending ? (
                            <div className="flex items-center gap-2 text-xs text-amber-300/80">
                              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                              <span>Ce montant est en attente de virement sur le compte Mobile Money du bailleur.</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-xs text-emerald-400">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>
                                Reversé le <strong>{p.disbursedAt}</strong> via <strong>{p.disbursementMethod?.toUpperCase()}</strong> • Réf: <strong className="font-mono text-white">{p.disbursementRef}</strong> ({p.disbursedBy})
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-2 flex-wrap">
                            {isPending ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPayoutToDisburse(p);
                                    setDisburseReference('');
                                    setDisburseNotes('');
                                    setDisburseMethod('wave');
                                  }}
                                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>Confirmer le reversement ({formatFCFA(p.netPayoutAmount)})</span>
                                </button>

                                <a
                                  href={`https://wa.me/${landlordPhoneClean}?text=${encodeURIComponent(
                                    `Bonjour ${p.landlordName}, la plateforme LOCAGESTION vous informe que le loyer de ${p.tenantName} pour ${p.unitNumber} (${p.period}) a été encaissé avec succès. Votre reversement net de ${formatFCFA(p.netPayoutAmount)} (98 %) est en cours d'exécution vers votre compte.`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-slate-700 transition-colors cursor-pointer"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>WhatsApp</span>
                                </a>
                              </>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleRevertPayout(p.id)}
                                  className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white font-medium text-[11px] border border-slate-700 transition-colors cursor-pointer"
                                >
                                  Repasser en attente
                                </button>
                                <a
                                  href={`https://wa.me/${landlordPhoneClean}?text=${encodeURIComponent(
                                    `Bonjour ${p.landlordName}, LOCAGESTION vous confirme que le virement de vos 98 % nets (${formatFCFA(p.netPayoutAmount)}) pour ${p.unitNumber} (${p.period}) a été effectué avec succès via ${p.disbursementMethod?.toUpperCase()} (Réf : ${p.disbursementRef}).`
                                  )}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="py-1.5 px-3 rounded-xl bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-bold text-xs flex items-center gap-1.5 border border-emerald-800/60 transition-colors cursor-pointer"
                                >
                                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Avis WhatsApp</span>
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}
      </main>

      {/* --- MODAL 1 : INSPECTION DÉTAILLÉE D'UNE ANNONCE PAR L'ADMIN --- */}
      {selectedListingForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-mono font-black px-2.5 py-0.5 rounded-lg bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    Réf: {selectedListingForDetail.referenceCode || selectedListingForDetail.id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                    {selectedListingForDetail.propertyType}
                  </span>
                  {selectedListingForDetail.status === 'en_pause' ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                      En pause
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                      En ligne
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black text-white mt-1.5">
                  {selectedListingForDetail.title}
                </h3>
                <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {selectedListingForDetail.city}
                    {selectedListingForDetail.district ? `, ${selectedListingForDetail.district}` : ''}{' '}
                    ({selectedListingForDetail.country})
                  </span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedListingForDetail(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Galerie des photos (jusqu'à 8 photos) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold">Photos ({selectedListingForDetail.images?.length || 0} / 8) :</span>
                <span>Visuels certifiés par l'IA</span>
              </div>
              {selectedListingForDetail.images && selectedListingForDetail.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {selectedListingForDetail.images.map((img, idx) => (
                    <div key={idx} className="aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                      <img
                        src={img}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-500 italic text-center">
                  Aucun visuel média disponible pour cette annonce (bloquée ou soumise sans photos conformes).
                </div>
              )}
            </div>

            {/* Détails financiers & Rétention */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Loyer Mensuel</span>
                <span className="text-base font-black text-brand-400">
                  {formatFCFA(selectedListingForDetail.monthlyRent)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Coût total à l'entrée</span>
                <span className="text-base font-black text-emerald-400">
                  {formatFCFA(
                    (selectedListingForDetail.depositMonths + selectedListingForDetail.advanceMonths) * selectedListingForDetail.monthlyRent +
                    (selectedListingForDetail.agencyFees || 0) +
                    (selectedListingForDetail.utilitiesDeposit || 0)
                  )}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Règle des 30 jours</span>
                <span className="text-xs font-bold text-slate-300">
                  Âge: {getListingAgeInDays(selectedListingForDetail)}j • Reste: {Math.max(0, 30 - getListingAgeInDays(selectedListingForDetail))}j
                </span>
              </div>
            </div>

            {/* Description du bien */}
            <div className="space-y-1.5 text-xs text-slate-300">
              <span className="text-[11px] uppercase font-bold text-slate-400 block">Description :</span>
              <p className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 leading-relaxed whitespace-pre-line">
                {selectedListingForDetail.description || 'Aucune description textuelle fournie.'}
              </p>
            </div>

            {/* Auteur de l'annonce */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Coordonnées du Dépositaire :</span>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <div className="font-bold text-white text-sm">
                    {selectedListingForDetail.authorCompany ? `${selectedListingForDetail.authorCompany} (${selectedListingForDetail.authorName})` : selectedListingForDetail.authorName}
                  </div>
                  <div className="text-slate-400 text-xs">Statut : {resolveListingAuthorRole(selectedListingForDetail)}</div>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-300">
                  <span className="flex items-center gap-1 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedListingForDetail.authorPhone}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span>{selectedListingForDetail.authorEmail}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Actions du modal */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleTogglePauseListing(selectedListingForDetail.id)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
              >
                {selectedListingForDetail.status === 'en_pause' ? 'Activer l\'annonce' : 'Mettre en pause'}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDeleteListing(selectedListingForDetail.id)}
                  className="px-4 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Supprimer définitivement</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedListingForDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2 : INSPECTION COMPLÈTE D'UN COMPTE UTILISATEUR PAR L'ADMIN --- */}
      {selectedUserForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3.5">
                <img
                  src={selectedUserForDetail.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160'}
                  alt={selectedUserForDetail.name}
                  className="w-14 h-14 rounded-2xl object-cover border border-slate-800 bg-slate-950"
                />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-white">{selectedUserForDetail.name}</h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {selectedUserForDetail.role}
                    </span>
                    {selectedUserForDetail.matricule && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-700/50">
                        {selectedUserForDetail.matricule}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedUserForDetail.companyName || 'Compte Particulier'} • {selectedUserForDetail.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {selectedUserForDetail.id !== SYSTEM_ADMIN_USER.id && !areEmailsEqual(selectedUserForDetail.email, SYSTEM_ADMIN_USER.email) && (
                  <button
                    type="button"
                    onClick={() => handleImpersonateUser(selectedUserForDetail)}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
                    title="Se connecter directement sous ce compte utilisateur et accéder à son espace"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Prendre la main</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedUserForDetail(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Statut de Modération du Compte */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 flex-wrap ${
                selectedUserForDetail.accountStatus === 'blocked_temporary'
                  ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                  : selectedUserForDetail.accountStatus === 'blocked_permanent'
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                  : 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedUserForDetail.accountStatus === 'blocked_temporary'
                      ? 'bg-amber-500/20 text-amber-400'
                      : selectedUserForDetail.accountStatus === 'blocked_permanent'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {selectedUserForDetail.accountStatus === 'blocked_temporary' ? (
                    <AlertTriangle className="w-5 h-5" />
                  ) : selectedUserForDetail.accountStatus === 'blocked_permanent' ? (
                    <Ban className="w-5 h-5" />
                  ) : (
                    <CheckCircle2 className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider block">
                    Statut Actuel du Compte
                  </span>
                  <h4 className="text-sm font-black text-white">
                    {selectedUserForDetail.accountStatus === 'blocked_temporary'
                      ? 'Compte Suspendu Temporairement'
                      : selectedUserForDetail.accountStatus === 'blocked_permanent'
                      ? 'Compte Bloqué Définitivement (Banni)'
                      : 'Compte Actif & Autorisé'}
                  </h4>
                  {selectedUserForDetail.blockReason && (
                    <p className="text-xs text-slate-300 mt-0.5">
                      <strong>Motif :</strong> {selectedUserForDetail.blockReason}{' '}
                      {selectedUserForDetail.blockedAt ? `(${selectedUserForDetail.blockedAt})` : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Bouton direct réactiver ou bloquer */}
              {selectedUserForDetail.id !== SYSTEM_ADMIN_USER.id && !areEmailsEqual(selectedUserForDetail.email, SYSTEM_ADMIN_USER.email) && (
                selectedUserForDetail.accountStatus === 'blocked_temporary' || selectedUserForDetail.accountStatus === 'blocked_permanent' ? (
                  <button
                    type="button"
                    onClick={() => handleReactivateUser(selectedUserForDetail)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Réactiver le compte</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenBlockModal(selectedUserForDetail, 'temporary')}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Suspendre (Temp.)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenBlockModal(selectedUserForDetail, 'permanent')}
                      className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Bloquer (Déf.)</span>
                    </button>
                  </div>
                )
              )}
            </div>

            {/* Navigation par Onglets */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setUserModalTab('formule')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  userModalTab === 'formule'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Formule & Droits</span>
              </button>
              <button
                type="button"
                onClick={() => setUserModalTab('history')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  userModalTab === 'history'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Historique ({userSubHistory.length + userLeases.length + userPayments.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setUserModalTab('identity')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  userModalTab === 'identity'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Fingerprint className="w-3.5 h-3.5" />
                <span>Identité & Publications</span>
              </button>
            </div>

            {/* ONGLET 1 : GESTION FORMULE & DROITS */}
            {userModalTab === 'formule' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Carte Statut Actuel */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider block">
                        Formule Active sur le Compte
                      </span>
                      <h4 className="text-base font-black text-white flex items-center gap-2 mt-0.5">
                        {userSubDetails?.plan === 'pro' && (
                          <>
                            <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
                            <span>Formule Entreprise & Pro</span>
                          </>
                        )}
                        {userSubDetails?.plan === 'serenite' && (
                          <>
                            <Sparkles className="w-4 h-4 text-emerald-400" />
                            <span>Formule Sérénité</span>
                          </>
                        )}
                        {(!userSubDetails || userSubDetails.plan === 'decouverte') && (
                          <>
                            <Zap className="w-4 h-4 text-amber-400" />
                            <span>Formule Découverte (0 FCFA)</span>
                          </>
                        )}
                      </h4>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">Statut Validité</span>
                      {(() => {
                        const isExpired = userSubDetails?.plan === 'pro' && userSubDetails?.isExpired;
                        const isExpiringSoon =
                          userSubDetails?.plan === 'pro' &&
                          userSubDetails?.daysRemaining !== undefined &&
                          userSubDetails.daysRemaining <= 3 &&
                          !isExpired;
                        return (
                          <span
                            className={`text-xs font-black px-2.5 py-1 rounded-full inline-block mt-0.5 ${
                              isExpired
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : isExpiringSoon
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {isExpired
                              ? 'Expiré (À renouveler)'
                              : isExpiringSoon
                              ? `Expire bientôt (${userSubDetails?.daysRemaining}j)`
                              : 'En cours de validité'}
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Baux Actifs / Quota</span>
                      <span className="font-bold text-slate-200">
                        {userLeases.filter((l) => l.status === 'actif').length} /{' '}
                        {userSubDetails?.plan === 'decouverte' || !userSubDetails
                          ? `${PLANS_CONFIG.decouverte.maxActiveLeases} baux max`
                          : 'Illimité'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Date Activation</span>
                      <span className="font-bold text-slate-200">
                        {userSubDetails?.activatedAt
                          ? new Date(userSubDetails.activatedAt).toLocaleDateString('fr-FR')
                          : 'Compte initial'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">Date Expiration</span>
                      <span className="font-bold text-slate-200">
                        {userSubDetails?.plan === 'pro' && userSubDetails.expiresAt
                          ? `${new Date(userSubDetails.expiresAt).toLocaleDateString('fr-FR')} (${userSubDetails.daysRemaining ?? 30}j restants)`
                          : userSubDetails?.plan === 'serenite'
                          ? 'Permanent (100% Mobile Money)'
                          : 'Permanent (Sans expiration)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions Super-Admin sur la Formule */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-3.5">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <h5 className="text-xs font-black uppercase tracking-wider text-indigo-300">
                      Actions Super-Administrateur sur la Formule
                    </h5>
                  </div>

                  {/* 1. Formule Sérénité */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-emerald-400">Formule Sérénité</span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          (0 FCFA fixe • Baux illimités • 100% Mobile Money automatisé)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Idéal pour les bailleurs déléguant la collecte des loyers via Mobile Money.
                      </p>
                    </div>

                    {userSubDetails?.plan === 'serenite' ? (
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                        Active actuellement
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleAdminActivateSerenite(selectedUserForDetail)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        Activer Sérénité
                      </button>
                    )}
                  </div>

                  {/* 2. Formule Entreprise & Pro */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-indigo-400">Formule Entreprise &amp; Pro</span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          (Baux illimités • Espèces, chèques &amp; virements 100% libres • 0% commission)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Sélectionnez la durée accordée à ce compte (30 jours par défaut ou pack personnalisé) :
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <select
                        value={customProDuration}
                        onChange={(e) => setCustomProDuration(Number(e.target.value))}
                        className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none"
                      >
                        <option value={30}>30 jours (1 mois)</option>
                        <option value={60}>60 jours (2 mois)</option>
                        <option value={90}>90 jours (3 mois)</option>
                        <option value={180}>180 jours (6 mois)</option>
                        <option value={365}>365 jours (1 an)</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAdminActivatePro(selectedUserForDetail, customProDuration)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md transition-all cursor-pointer active:scale-95"
                      >
                        {userSubDetails?.plan === 'pro' ? `Prolonger (${customProDuration}j)` : `Activer Pro (${customProDuration}j)`}
                      </button>
                    </div>
                  </div>

                  {/* 3. Rétrogradation en Découverte */}
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <span className="text-xs font-black text-slate-300">Formule Découverte (Base)</span>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Résilie la formule active et remet le compte au palier gratuit de base (2 baux max).
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={userSubDetails?.plan === 'decouverte' || !userSubDetails}
                      onClick={() => handleAdminCancelPlan(selectedUserForDetail)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        userSubDetails?.plan === 'decouverte' || !userSubDetails
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                          : 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 cursor-pointer active:scale-95'
                      }`}
                    >
                      Rétrograder en Découverte
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ONGLET 2 : HISTORIQUE & AUDIT COMPLET */}
            {userModalTab === 'history' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* 1. Journal des formules & souscriptions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-indigo-400 tracking-wider block">
                      1. Journal d'Audit des Formules &amp; Souscriptions :
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      {userSubHistory.length} événement{userSubHistory.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  {userSubHistory.length === 0 ? (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-500 italic">
                      Aucun historique d'abonnement archivé pour cet utilisateur.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {userSubHistory.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white capitalize">{item.plan}</span>
                              <span
                                className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                  item.action === 'activated' || item.action === 'renewed' || item.action === 'admin_override'
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {item.action}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {item.notes || 'Opération enregistrée dans le journal.'} • Par : {item.actorName || 'Système'}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {new Date(item.performedAt).toLocaleString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Baux rattachés */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-indigo-400 tracking-wider block">
                      2. Contrats de Baux Rattachés ({userLeases.length}) :
                    </span>
                  </div>

                  {userLeases.length === 0 ? (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-500 italic">
                      Aucun contrat de bail enregistré pour ce compte.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {userLeases.map((l) => (
                        <div
                          key={l.id}
                          className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-brand-400">{l.id}</span>
                              <span className="font-bold text-white">{l.property || 'Bien immobilier'}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              Locataire : {l.tenant} • Loyer : {formatFCFA(l.rent)}/mois
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full shrink-0 ${
                              l.status === 'actif'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {l.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Paiements & Quittances */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-indigo-400 tracking-wider block">
                      3. Paiements &amp; Quittances Rattachés ({userPayments.length}) :
                    </span>
                  </div>

                  {userPayments.length === 0 ? (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-500 italic">
                      Aucun paiement de loyer enregistré pour ce compte.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                      {userPayments.slice(0, 15).map((p) => (
                        <div
                          key={p.id}
                          className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs flex items-center justify-between gap-3"
                        >
                          <div>
                            <span className="font-bold text-white">{formatFCFA(p.amount)}</span>
                            <span className="text-[11px] text-slate-400 ml-2">
                              Canal : {p.method} • Quittance : {p.receiptNumber || 'N/A'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 shrink-0">
                            {p.paymentDate}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ONGLET 3 : IDENTITÉ & PUBLICATIONS */}
            {userModalTab === 'identity' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Matricule Officiel */}
                  <div className="col-span-1 sm:col-span-2 p-3.5 rounded-2xl bg-slate-950 border border-indigo-500/40 flex items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center shrink-0">
                        <Fingerprint className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">
                          Matricule Officiel Unique Plateforme
                        </span>
                        <span className="font-mono font-black text-white text-sm block mt-0.5">
                          {selectedUserForDetail.matricule || 'Non attribué'}
                        </span>
                      </div>
                    </div>
                    {selectedUserForDetail.matricule && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard?.writeText(selectedUserForDetail.matricule!);
                          setCopiedItem(selectedUserForDetail.matricule!);
                          setTimeout(() => setCopiedItem(null), 1500);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 text-xs font-bold transition-all flex items-center gap-1.5 border border-indigo-500/30 cursor-pointer shrink-0"
                      >
                        {copiedItem === selectedUserForDetail.matricule ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Nom complet</span>
                    <span className="font-bold text-white">{selectedUserForDetail.name}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Entreprise / Agence</span>
                    <span className="font-bold text-white">{selectedUserForDetail.companyName || 'Non renseignée'}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Adresse Email</span>
                    <span className="font-bold text-slate-200">{selectedUserForDetail.email}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Numéro de Téléphone</span>
                    <span className="font-bold text-slate-200 font-mono">{selectedUserForDetail.phone}</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Date & Lieu de Naissance</span>
                    <span className="text-slate-300">
                      {selectedUserForDetail.birthDate || 'N/A'} à {selectedUserForDetail.birthPlace || 'N/A'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Résidence & Projet</span>
                    <span className="text-slate-300">
                      {selectedUserForDetail.residenceCity || 'Cotonou'} ({selectedUserForDetail.residenceCountry || 'Bénin'})
                      {selectedUserForDetail.projectCountry ? ` • Projet : ${selectedUserForDetail.projectCountry}` : ''}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Numéro IFU (Fiscal)</span>
                    <span className="font-mono text-slate-200 font-bold">
                      {selectedUserForDetail.ifuNumber || 'Non requis / non renseigné'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Date d'inscription</span>
                    <span className="text-slate-300">{selectedUserForDetail.registeredAt || '01/01/2026'}</span>
                  </div>
                </div>

                {/* Publications rattachées */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <span className="text-[11px] font-black uppercase text-indigo-400 tracking-wider block">
                    Publications rattachées :
                  </span>
                  {listings.filter((l) => l.authorId === selectedUserForDetail.id || areEmailsEqual(l.authorEmail, selectedUserForDetail.email)).length === 0 ? (
                    <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-500 italic">
                      Cet utilisateur n'a pas encore publié d'annonce.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {listings
                        .filter((l) => l.authorId === selectedUserForDetail.id || areEmailsEqual(l.authorEmail, selectedUserForDetail.email))
                        .map((l) => (
                          <div
                            key={l.id}
                            className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                          >
                            <div>
                              <span className="font-mono font-bold text-brand-400 mr-2">
                                {l.referenceCode || l.id}
                              </span>
                              <span className="text-white font-bold">{l.title}</span>
                              <div className="text-[11px] text-slate-400">
                                {l.city} • {formatFCFA(l.monthlyRent)}/mois
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedUserForDetail(null);
                                setSelectedListingForDetail(l);
                              }}
                              className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold"
                            >
                              Voir annonce
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions du modal */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-800 flex-wrap gap-2">
              {/* Changement de rôle */}
              {selectedUserForDetail.id !== SYSTEM_ADMIN_USER.id && !areEmailsEqual(selectedUserForDetail.email, SYSTEM_ADMIN_USER.email) ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-bold">Modifier rôle :</span>
                  <select
                    value={selectedUserForDetail.role}
                    onChange={(e) => handleChangeUserRole(selectedUserForDetail, e.target.value as UserSpace)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="bailleur">Bailleur</option>
                    <option value="demarcheur">Démarcheur</option>
                    <option value="locataire">Locataire</option>
                  </select>
                </div>
              ) : (
                <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Compte Super-Administrateur Système (Invariable)</span>
                </span>
              )}

              <div className="flex items-center gap-2">
                {selectedUserForDetail.id !== SYSTEM_ADMIN_USER.id && !areEmailsEqual(selectedUserForDetail.email, SYSTEM_ADMIN_USER.email) && (
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(selectedUserForDetail)}
                    className="px-3.5 py-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Supprimer ce compte</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedUserForDetail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 3 : DIALOGUE DE BLOCAGE UTILISATEUR (TEMPORAIRE OU DÉFINITIF) --- */}
      {blockingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold ${
                  blockType === 'temporary'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}
              >
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white">
                  {blockType === 'temporary' ? 'Suspension Temporaire' : 'Blocage Définitif'} de Compte
                </h3>
                <p className="text-xs text-slate-400">
                  Cible : <span className="text-white font-bold">{blockingUser.name}</span> ({blockingUser.matricule || blockingUser.email})
                </p>
              </div>
            </div>

            {/* Sélecteur de type */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setBlockType('temporary');
                  setBlockReasonInput("Suspension temporaire pour audit de sécurité et vérification des pièces justificatives.");
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  blockType === 'temporary'
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-200 ring-2 ring-amber-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-black block">⏳ Temporaire</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Audit, pièces à vérifier</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBlockType('permanent');
                  setBlockReasonInput("Blocage définitif suite à des infractions graves répétées aux règles de la plateforme.");
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  blockType === 'permanent'
                    ? 'bg-rose-500/20 border-rose-500/50 text-rose-200 ring-2 ring-rose-500/30'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span className="text-xs font-black block">🚫 Définitif</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Bannissement irréversible</span>
              </button>
            </div>

            {/* Saisie du motif */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Motif officiel du blocage (affiché lors de la tentative de connexion) :
              </label>
              <textarea
                rows={3}
                value={blockReasonInput}
                onChange={(e) => setBlockReasonInput(e.target.value)}
                placeholder="Indiquez la raison officielle de la décision..."
                className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Boutons d'action */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setBlockingUser(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmBlockUser}
                className={`flex-1 py-2.5 px-4 rounded-xl text-white text-xs font-black transition-all cursor-pointer shadow-md ${
                  blockType === 'temporary'
                    ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-900/30'
                    : 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/30'
                }`}
              >
                Confirmer le {blockType === 'temporary' ? 'gel' : 'bannissement'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* --- MODAL 4 : VALIDATION DE REVERSEMENT BAILLEUR (98 %) --- */}
      {selectedPayoutToDisburse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl p-6 sm:p-7 space-y-5 text-white">
            <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">
                    Confirmer le Reversement de Loyer (98 %)
                  </h3>
                  <p className="text-xs text-slate-400">
                    Bénéficiaire : <strong className="text-white">{selectedPayoutToDisburse.landlordName}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedPayoutToDisburse(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Récapitulatif Financier */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-400">
                <span>Logement concerné :</span>
                <strong className="text-white">{selectedPayoutToDisburse.unitNumber}</strong>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Locataire payeur :</span>
                <span className="text-slate-200">{selectedPayoutToDisburse.tenantName}</span>
              </div>
              <div className="flex items-center justify-between text-slate-400">
                <span>Loyer brut encaissé (100 %) :</span>
                <span className="font-mono text-slate-200">{formatFCFA(selectedPayoutToDisburse.totalCollected)}</span>
              </div>
              <div className="flex items-center justify-between text-purple-400">
                <span>Commission LOCAGESTION (2 %) :</span>
                <span className="font-mono font-bold">- {formatFCFA(selectedPayoutToDisburse.platformCommission)}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                <span className="font-black text-white text-xs">Montant net à verser (98 %) :</span>
                <span className="text-lg font-black text-emerald-400 font-mono">
                  {formatFCFA(selectedPayoutToDisburse.netPayoutAmount)}
                </span>
              </div>
            </div>

            {/* Coordonnées de Versement */}
            <div className="space-y-1.5 text-xs">
              <span className="font-bold text-slate-400 block">Coordonnées du bailleur :</span>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 block text-[10px]">Numéro direct / Wave :</span>
                  <span className="text-white font-mono font-bold text-xs">{selectedPayoutToDisburse.landlordPaymentInfo?.wave || selectedPayoutToDisburse.landlordPhone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedPayoutToDisburse.landlordPaymentInfo?.wave || selectedPayoutToDisburse.landlordPhone);
                    setActionSuccessMsg('Numéro copié !');
                    setTimeout(() => setActionSuccessMsg(null), 2000);
                  }}
                  className="py-1 px-2.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copier</span>
                </button>
              </div>
            </div>

            {/* Formulaire de confirmation */}
            <form onSubmit={handleConfirmDisbursement} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Moyen de paiement utilisé pour le virement : *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['wave', 'mtn', 'moov', 'virement', 'autre'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDisburseMethod(m)}
                      className={`py-2 px-2.5 rounded-xl text-xs font-bold capitalize transition-all border text-center cursor-pointer ${
                        disburseMethod === m
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-md font-black'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {m === 'virement' ? 'Virement Bancaire' : m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Référence de la transaction / SMS opérateur : *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : TRX-WAVE-89214 ou REF-BOA-202611"
                  value={disburseReference}
                  onChange={(e) => setDisburseReference(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Notes internes (facultatif) :
                </label>
                <input
                  type="text"
                  placeholder="Ex: Retrait classique FedaPay puis transfert Wave"
                  value={disburseNotes}
                  onChange={(e) => setDisburseNotes(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayoutToDisburse(null)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-700 text-slate-300 text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black transition-all cursor-pointer shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Sceller & Notifier le Bailleur</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
