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
} from 'lucide-react';
import { useSpace } from '@/lib/context/space-context';
import { ModerationService } from '@/lib/services/moderation-service';
import { ListingsService, getListingAgeInDays } from '@/lib/services/listings-service';
import { AuthService, SYSTEM_ADMIN_USER, getRoleLabel, areEmailsEqual } from '@/lib/services/auth-service';
import { SecurityAlert, RentalListing, AuthUser, UserSpace } from '@/lib/types';
import { formatFCFA } from '@/lib/money/format';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, logout } = useSpace();

  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [listings, setListings] = useState<RentalListing[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [activeTab, setActiveTab] = useState<'alerts' | 'listings' | 'users' | 'rules'>('alerts');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchAlertQuery, setSearchAlertQuery] = useState<string>('');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  // Filtres et recherche Annonces
  const [searchListingRef, setSearchListingRef] = useState<string>('');
  const [filterListingStatus, setFilterListingStatus] = useState<string>('all');
  const [selectedListingForDetail, setSelectedListingForDetail] = useState<RentalListing | null>(null);

  // Filtres et recherche Utilisateurs
  const [searchUserName, setSearchUserName] = useState<string>('');
  const [filterUserRole, setFilterUserRole] = useState<string>('all');
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<AuthUser | null>(null);

  // Charger les données de sécurité, annonces et utilisateurs
  const refreshData = () => {
    setAlerts(ModerationService.getSecurityAlerts());
    setListings(ListingsService.getAllListings());
    setUsers(AuthService.getAllKnownUsers());
  };

  useEffect(() => {
    // RLS Applicatif : Seul le compte vérifié Super-Admin a le droit d'accéder à la console
    if (!user || user.role !== 'admin' || user.email !== 'admin@locagestion.site') {
      router.replace('/auth/login');
      return;
    }
    refreshData();
    const handleAlertsUpdate = () => refreshData();
    window.addEventListener('locagestion:security_alerts_updated', handleAlertsUpdate);
    window.addEventListener('locagestion:listings_updated', handleAlertsUpdate);
    window.addEventListener('locagestion:auth_changed', handleAlertsUpdate);
    return () => {
      window.removeEventListener('locagestion:security_alerts_updated', handleAlertsUpdate);
      window.removeEventListener('locagestion:listings_updated', handleAlertsUpdate);
      window.removeEventListener('locagestion:auth_changed', handleAlertsUpdate);
    };
  }, [user, router]);

  if (!user || user.role !== 'admin' || user.email !== 'admin@locagestion.site') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <p className="text-sm font-bold text-slate-400">Accès restreint au Super-Administrateur...</p>
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
    if (confirm('Voulez-vous supprimer définitivement cette annonce de la plateforme ?')) {
      ListingsService.deleteListing(id);
      refreshData();
      if (selectedListingForDetail?.id === id) {
        setSelectedListingForDetail(null);
      }
      setActionSuccessMsg('Annonce supprimée définitivement.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
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
        referenceCode: alert.listingReference || alert.listingId || 'LOCA-ALERT-REF',
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
      const refCode = (l.referenceCode || '').toLowerCase();
      const idMatch = l.id.toLowerCase().includes(q);
      const refMatch = refCode.includes(q);
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

  // Filtrage des utilisateurs par nom, email, téléphone, entreprise et rôle
  const filteredUsers = users.filter((u) => {
    if (filterUserRole !== 'all' && u.role !== filterUserRole) return false;

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

                    {/* Liste des violations constatées */}
                    <div className="p-3.5 rounded-2xl bg-rose-950/20 border border-rose-900/30 space-y-2">
                      <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider block">
                        Motifs de Rejet Automatique Constatés par l'IA :
                      </span>
                      {alert.violations.map((v, idx) => (
                        <div key={idx} className="text-xs text-rose-200 space-y-1">
                          <div className="flex items-start gap-1.5 font-bold">
                            <span className="text-rose-400 shrink-0">⚠️</span>
                            <span>{v.message}</span>
                          </div>
                          {v.triggerSnippet && (
                            <div className="pl-5 text-[11px] text-rose-300/80 font-mono italic">
                              {v.triggerSnippet}
                            </div>
                          )}
                        </div>
                      ))}
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

        {/* TAB 2: GESTION & SUPERVISION DES ANNONCES (AVEC RECHERCHE PAR RÉFÉRENCE & PURGE 30J) */}
        {activeTab === 'listings' && (
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
                            <span className="text-slate-500"> • Rôle : {l.authorRole}</span>
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
                          title="Supprimer définitivement l'annonce"
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

        {/* TAB 3: GESTION & MODÉRATION DES COMPTES UTILISATEURS */}
        {activeTab === 'users' && (
          <div className="space-y-4">
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

              {/* Filtre par rôle */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[11px] font-bold text-slate-400">Filtrer par rôle :</span>
                {[
                  { id: 'all', label: `Tous les comptes (${users.length})` },
                  { id: 'bailleur', label: `Bailleurs (${users.filter(u => u.role === 'bailleur').length})` },
                  { id: 'demarcheur', label: `Démarcheurs (${users.filter(u => u.role === 'demarcheur').length})` },
                  { id: 'locataire', label: `Locataires (${users.filter(u => u.role === 'locataire').length})` },
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
                        </div>
                      </div>

                      {/* Actions Admin sur l'utilisateur */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0 flex-wrap">
                        {/* Bouton fiche complète */}
                        <button
                          type="button"
                          onClick={() => setSelectedUserForDetail(u)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Fiche</span>
                        </button>

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
                  <div className="text-slate-400 text-xs">Rôle : {selectedListingForDetail.authorRole}</div>
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 space-y-5">
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
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedUserForDetail.companyName || 'Compte Particulier'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUserForDetail(null)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fiche d'identité complète */}
            <div className="space-y-3">
              <span className="text-[11px] font-black uppercase text-indigo-400 tracking-wider block">
                Données d'Identité & État Civil :
              </span>
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
            </div>

            {/* Annonces publiées par cet utilisateur */}
            <div className="space-y-2">
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
    </div>
  );
}
