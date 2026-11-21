'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Menu,
  Search,
  Plus,
  Calendar,
  Sparkles,
  Receipt,
  Smartphone,
  Wrench,
  ShieldCheck,
  Bell,
  Mail,
  CheckCircle2,
  Clock,
  FileText,
  X,
  ExternalLink,
  MessageSquare,
  ShieldAlert,
} from 'lucide-react';
import { formatDateFR } from '@/lib/money/format';
import { useSpace } from '@/lib/context/space-context';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';
import { ModerationService } from '@/lib/services/moderation-service';
import {
  LeaseService,
  LandlordNotification,
} from '@/lib/services/lease-service';
import {
  TenantNotificationService,
  TenantNotification,
  STORAGE_KEY_TENANT_NOTIFS,
} from '@/lib/services/tenant-notification-service';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenQuickAction?: (action: 'new_lease' | 'new_payment' | 'new_property') => void;
  onOpenTenantAction?: (action: 'declare_payment' | 'report_issue') => void;
  activePortalTab?: 'accueil' | 'quittances' | 'bail' | 'solvabilite' | 'preavis';
  onPortalTabChange?: (tab: 'accueil' | 'quittances' | 'bail' | 'solvabilite' | 'preavis') => void;
}

export function Header({
  onToggleSidebar,
  onOpenQuickAction,
  onOpenTenantAction,
  activePortalTab,
  onPortalTabChange,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [todayFormatted, setTodayFormatted] = useState('02/11/2026');

  useEffect(() => {
    setTodayFormatted(formatDateFR(new Date()));
  }, []);
  const { isLandlord, isTenant, isDemarcheur, isAdmin, activeSpace, user } = useSpace();
  const [searchVal, setSearchVal] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Notifications Bailleur
  const [notifications, setNotifications] = useState<LandlordNotification[]>([]);
  // Notifications Locataire
  const [tenantNotifs, setTenantNotifs] = useState<TenantNotification[]>([]);
  // Alertes Sécurité Super-Admin
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  const updateNotifications = () => {
    setNotifications(LeaseService.getLandlordNotifications(user));
    setTenantNotifs(TenantNotificationService.getNotifications(user));
    setUnreadAlertsCount(ModerationService.getUnreadAlertsCount());
  };

  useEffect(() => {
    updateNotifications();
    const handleStorage = () => updateNotifications();
    window.addEventListener('locagestion:leases_updated', handleStorage);
    window.addEventListener('locagestion:notices_updated', handleStorage);
    window.addEventListener('locagestion:tenant_notifs_updated', handleStorage);
    window.addEventListener('locagestion:tenant_notifications_updated', handleStorage);
    window.addEventListener('locagestion:notifications_updated', handleStorage);
    window.addEventListener('locagestion:security_alerts_updated', handleStorage);
    window.addEventListener('locagestion:auth_changed', handleStorage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('locagestion:leases_updated', handleStorage);
      window.removeEventListener('locagestion:notices_updated', handleStorage);
      window.removeEventListener('locagestion:tenant_notifs_updated', handleStorage);
      window.removeEventListener('locagestion:tenant_notifications_updated', handleStorage);
      window.removeEventListener('locagestion:notifications_updated', handleStorage);
      window.removeEventListener('locagestion:security_alerts_updated', handleStorage);
      window.removeEventListener('locagestion:auth_changed', handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, [user]);

  // Fermeture du menu de notifications au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    if (isNotifOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotifOpen]);

  const unreadCount = isDemarcheur
    ? 0
    : isLandlord
    ? notifications.filter((n) => !n.read).length
    : tenantNotifs.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    if (isLandlord) {
      LeaseService.markNotificationsAsRead();
      updateNotifications();
    } else {
      TenantNotificationService.markAllAsRead(user);
      setTenantNotifs(TenantNotificationService.getNotifications(user));
    }
  };

  // Redirection immédiate vers la section Annonces & Visites (/listings)
  const handleOpenSearch = () => {
    if (pathname === '/listings') {
      const searchInput = document.getElementById('listings-search-input') as HTMLInputElement | null;
      if (searchInput) {
        searchInput.focus();
        searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      router.push('/listings');
    }
  };

  // Global ⌘K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleOpenSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pathname]);

  const getPageTitle = () => {
    if (isTenant) {
      if (activePortalTab === 'quittances') return 'Mes Quittances & Reçus';
      if (activePortalTab === 'bail') return 'Mon Bail & Contrat';
      if (activePortalTab === 'solvabilite') return 'Mon Passeport Solvabilité';
      if (activePortalTab === 'preavis') return 'Relances & Préavis';
      return 'Mon Espace Locataire';
    }
    if (pathname === '/payments') return 'Paiements & Encaissements';
    if (pathname === '/incidents') return 'Pannes & Interventions';
    if (pathname === '/properties') return 'Parc Immobilier';
    if (pathname === '/tenants') return 'Gestion des Locataires';
    if (pathname === '/leases') return 'Contrats de Bail';
    if (pathname === '/leases/new') return 'Création de Bail';
    if (pathname === '/listings') return 'Annonces & Visites';
    if (pathname === '/reminders') return 'Relances & Préavis';
    if (pathname === '/messages') return 'Messagerie Directe';
    return isDemarcheur ? 'Annonces & Visites' : 'Tableau de bord';
  };

  // Navigation universelle vers l'accueil au clic sur le titre de l'en-tête (Web & Mobile)
  const handleGoHome = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isTenant) {
      if (pathname === '/portal') {
        if (onPortalTabChange) {
          onPortalTabChange('accueil');
        }
        if (typeof window !== 'undefined') {
          const url = new URL(window.location.href);
          url.searchParams.delete('tab');
          url.hash = '';
          window.history.pushState({}, '', url.toString());
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        router.push('/portal');
      }
    } else if (isDemarcheur) {
      if (pathname === '/listings') {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        router.push('/listings');
      }
    } else {
      if (pathname === '/') {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } else {
        router.push('/');
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#F4F6F9]/90 backdrop-blur-md px-3.5 sm:px-8 py-3 sm:py-4 border-b border-slate-200/80 flex items-center justify-between gap-2.5 sm:gap-4">
        {/* Left: Mobile Menu & Space Badge / Title (Emplacement cliquable pour retourner à l'accueil) */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 sm:p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm transition-colors cursor-pointer shrink-0"
            aria-label="Ouvrir le menu"
            title="Menu principal"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="min-w-0 flex flex-col justify-center">
            <button
              type="button"
              onClick={handleGoHome}
              className="flex items-center gap-1.5 sm:gap-2.5 text-left cursor-pointer group active:scale-95 transition-all py-0.5 focus:outline-hidden touch-manipulation select-none"
              title="Retourner à l'accueil"
              aria-label="Retourner à l'accueil"
            >
              <h1 className="text-sm sm:text-base lg:text-xl font-black text-slate-900 tracking-tight shrink-0 whitespace-nowrap group-hover:text-brand-600 transition-colors">
                {getPageTitle()}
              </h1>
              <span
                className={`hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${
                  isDemarcheur
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : isLandlord
                    ? 'bg-brand-50 text-brand-600 border-brand-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {isDemarcheur ? (
                  <Sparkles className="w-3 h-3 text-amber-600" />
                ) : isLandlord ? (
                  <Sparkles className="w-3 h-3 text-brand-600" />
                ) : (
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                )}
                {isDemarcheur
                  ? 'Espace Démarcheur • UEMOA & CEMAC'
                  : isLandlord
                  ? 'Espace Bailleur • UEMOA & CEMAC'
                  : 'Locataire Titulaire'}
              </span>

              {user?.matricule && (
                <span
                  className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-indigo-300 border border-slate-700 shrink-0 shadow-xs"
                  title="Votre Matricule Officiel Plateforme"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Matricule : {user.matricule}</span>
                </span>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="whitespace-nowrap" suppressHydrationWarning>
                Aujourd’hui : {todayFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Global Search Bar (Affichée sur grand écran xl+, bouton compact en dessous) */}
        <div className="hidden xl:flex items-center flex-1 max-w-xs mx-4">
          <button
            type="button"
            onClick={handleOpenSearch}
            className="w-full relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200/90 hover:border-brand-400 hover:shadow-sm text-xs text-slate-500 shadow-xs transition-all cursor-pointer group text-left"
            title="Aller à la section Annonces & Visites"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors flex-shrink-0" />
              <span className="truncate text-slate-400 group-hover:text-slate-600 font-medium">
                Rechercher une location...
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200/60 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                Annonces
              </span>
              <kbd className="px-1.5 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200/80 rounded-md group-hover:text-slate-600">
                ⌘K
              </kbd>
            </div>
          </button>
        </div>

        {/* Right: Space-Specific Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Bouton de recherche compact (Mobile, Tablettes et Laptops < xl) */}
          <button
            type="button"
            onClick={handleOpenSearch}
            className="xl:hidden p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-brand-600 shadow-sm transition-colors cursor-pointer shrink-0"
            aria-label="Aller à la section Annonces & Visites"
            title="Rechercher"
          >
            <Search className="w-4 h-4 text-slate-600" />
          </button>

          {/* Cloche de Notifications Universelle (Bailleur & Locataire) */}
          <div className="relative shrink-0" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-brand-600 hover:border-brand-300 shadow-sm transition-colors cursor-pointer relative"
              aria-label={isLandlord ? 'Notifications Bailleur/Démarcheur' : 'Mes Notifications Résident'}
              title={isLandlord ? 'Notifications Bailleur/Démarcheur' : 'Mes Notifications Résident'}
            >
              <Bell className="w-4 h-4 text-slate-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-amber-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse shadow-md border-2 border-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Popover des Notifications Universel */}
            {isNotifOpen && (
              <div className="fixed sm:absolute top-16 sm:top-full right-2 sm:right-0 mt-2 w-[calc(100vw-1rem)] sm:w-96 max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-black tracking-tight">
                      {isLandlord ? 'Notifications Bailleur/Démarcheur' : 'Mes Notifications Résident'}
                    </span>
                    {unreadCount > 0 && (
                      <span className="text-[10px] font-black px-2 py-0.2 rounded-full bg-amber-500 text-white">
                        {unreadCount} nouv.
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-slate-300 hover:text-white font-bold transition-colors cursor-pointer"
                    >
                      Tout marquer lu
                    </button>
                  )}
                </div>

                <div className="max-h-[30rem] overflow-y-auto divide-y divide-slate-100 p-1">
                  {(isLandlord || isDemarcheur) ? (
                    notifications.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                        <span>Aucune notification récente</span>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 rounded-2xl transition-colors space-y-1.5 ${
                            !n.read
                              ? n.type === 'incident_reported' || n.type === 'listing_rejected'
                                ? 'bg-rose-50/70 border border-rose-200/80'
                                : n.type === 'listing_approved'
                                ? 'bg-emerald-50/70 border border-emerald-200/80'
                                : 'bg-amber-50/70 border border-amber-200/60'
                              : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  n.type === 'incident_reported' || n.type === 'listing_rejected'
                                    ? 'bg-rose-500 animate-pulse'
                                    : n.type === 'listing_approved'
                                    ? 'bg-emerald-500'
                                    : 'bg-amber-500'
                                }`}
                              />
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">{n.timestamp}</span>
                          </div>

                          <p className="text-xs text-slate-600 leading-snug">{n.message}</p>

                          {/* Badge Photos si incident */}
                          {n.photos && n.photos.length > 0 && (
                            <div className="flex items-center gap-1.5 pt-0.5">
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                                <Wrench className="w-3 h-3 text-amber-600" />
                                <span>{n.photos.length} photo{n.photos.length > 1 ? 's' : ''} constatée{n.photos.length > 1 ? 's' : ''}</span>
                              </span>
                            </div>
                          )}

                          <div className="pt-1 flex items-center justify-between">
                            <span className="text-[10px] font-mono font-bold text-slate-400">
                              {n.incidentId || n.leaseId || n.listingId}
                            </span>
                            {n.type === 'incident_reported' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsNotifOpen(false);
                                  router.push('/incidents');
                                }}
                                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                              >
                                <span>Traiter la panne</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            ) : (n.type === 'listing_approved' || n.type === 'listing_rejected') ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsNotifOpen(false);
                                  router.push('/listings?view=my_listings');
                                }}
                                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
                              >
                                <span>Gérer mon annonce</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            ) : n.type === 'payment_declared' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsNotifOpen(false);
                                  const targetId = n.paymentId || 'decl-initial-01';
                                  router.push(`/payments?tab=pending&verify=${targetId}`);
                                }}
                                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
                              >
                                <span>Vérifier le paiement</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            ) : n.type === 'notice_received' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsNotifOpen(false);
                                  router.push('/reminders');
                                }}
                                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                              >
                                <span>Voir le préavis</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setIsNotifOpen(false);
                                  router.push('/leases');
                                }}
                                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1 cursor-pointer"
                              >
                                <span>Voir le bail</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )
                  ) : (
                    tenantNotifs.length === 0 ? (
                      <div className="p-6 text-center text-slate-400 text-xs">
                        <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                        <span>Aucune notification pour le moment</span>
                      </div>
                    ) : (
                      tenantNotifs.map((n) => {
                        const isNotice = n.type === 'notice_issued';
                        const isReminder = n.type === 'reminder_received';
                        const cardBg = !n.read
                          ? isNotice
                            ? 'bg-rose-50/80 border border-rose-200/90'
                            : isReminder
                            ? 'bg-amber-50/80 border border-amber-200/90'
                            : 'bg-emerald-50/70 border border-emerald-200/80'
                          : 'hover:bg-slate-50 border border-transparent';
                        const dotColor = !n.read
                          ? isNotice
                            ? 'bg-rose-500 animate-pulse ring-2 ring-rose-200'
                            : isReminder
                            ? 'bg-amber-500 animate-pulse ring-2 ring-amber-200'
                            : 'bg-emerald-500 animate-pulse ring-2 ring-emerald-200'
                          : 'bg-slate-300';
                        const linkColor = isNotice
                          ? 'text-rose-600 hover:text-rose-700'
                          : isReminder
                          ? 'text-amber-600 hover:text-amber-700'
                          : 'text-emerald-600 hover:text-emerald-700';

                        return (
                          <div
                            key={n.id}
                            className={`p-3.5 rounded-2xl transition-colors space-y-1.5 ${cardBg}`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 truncate">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                                {n.title}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium shrink-0">{n.time}</span>
                            </div>

                            <p className="text-xs text-slate-600 leading-snug">{n.message}</p>

                            <div className="pt-1 flex items-center justify-between text-[11px]">
                              <span className="text-[10px] text-slate-400 font-semibold italic">
                                De : {n.actor || 'Bailleur'}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    TenantNotificationService.deleteNotification(n.id);
                                    setTenantNotifs(TenantNotificationService.getNotifications(user));
                                  }}
                                  className="p-1 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                                  title="Supprimer la notification"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsNotifOpen(false);
                                    TenantNotificationService.markAsRead(n.id);
                                    setTenantNotifs(TenantNotificationService.getNotifications(user));
                                    if (n.link?.includes('tab=preavis') && onPortalTabChange) {
                                      onPortalTabChange('preavis');
                                    } else if (n.link?.includes('tab=quittances') && onPortalTabChange) {
                                      onPortalTabChange('quittances');
                                    } else if (n.link?.includes('tab=bail') && onPortalTabChange) {
                                      onPortalTabChange('bail');
                                    } else if (n.link?.includes('tab=solvabilite') && onPortalTabChange) {
                                      onPortalTabChange('solvabilite');
                                    } else if (n.link) {
                                      router.push(n.link);
                                    }
                                  }}
                                  className={`text-xs font-bold flex items-center gap-1 cursor-pointer ${linkColor}`}
                                >
                                  <span>{n.actionLabel || 'Consulter'}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ============================================================== */}
          {/* ACCÈS DIRECT CONSOLE SUPER-ADMIN (SÉCURITÉ & MODÉRATION)       */}
          {/* ============================================================== */}
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-900/20 active:scale-95 transition-all shrink-0 cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4" />
              <span className="hidden sm:inline">Console Sécurité</span>
              <span className="sm:hidden">Admin</span>
              {unreadAlertsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-700 text-[10px] font-black animate-pulse">
                  {unreadAlertsCount}
                </span>
              )}
            </Link>
          )}

          {/* ============================================================== */}
          {/* ACTIONS STRICTEMENT RÉSERVÉES AU BAILLEUR                      */}
          {/* ============================================================== */}
          {isLandlord && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onOpenQuickAction) {
                    onOpenQuickAction('new_payment');
                  } else {
                    router.push('/payments?action=new');
                  }
                }}
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <Receipt className="w-4 h-4" />
                <span>Encaisser loyer</span>
              </button>

              <button
                type="button"
                onClick={() => router.push('/leases/new')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs font-extrabold shadow-pink-glow active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Nouveau bail</span>
              </button>
            </>
          )}

          {/* ============================================================== */}
          {/* ACTIONS STRICTEMENT RÉSERVÉES AU LOCATAIRE                     */}
          {/* ============================================================== */}
          {isTenant && (
            <>
              <button
                type="button"
                onClick={() => {
                  if (onOpenTenantAction) {
                    onOpenTenantAction('declare_payment');
                  } else {
                    router.push('/portal?action=declare_payment');
                  }
                }}
                className="hidden sm:inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer shrink-0"
              >
                <Smartphone className="w-4 h-4" />
                <span>
                  Déclarer<span className="hidden sm:inline"> un paiement</span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onOpenTenantAction) {
                    onOpenTenantAction('report_issue');
                  } else {
                    router.push('/incidents?action=new');
                  }
                }}
                className="hidden xl:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-brand-400" />
                <span>Signaler une panne</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Global Search & Multi-Criteria Filters Modal */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        initialQuery={searchVal}
      />
    </>
  );
}
