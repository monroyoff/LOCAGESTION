'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
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
  Home,
  MessageSquare,
} from 'lucide-react';
import { formatDateFR } from '@/lib/money/format';
import { useSpace } from '@/lib/context/space-context';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';
import {
  LeaseService,
  LandlordNotification,
} from '@/lib/services/lease-service';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenQuickAction?: (action: 'new_lease' | 'new_payment' | 'new_property') => void;
  onOpenTenantAction?: (action: 'declare_payment' | 'report_issue') => void;
  activePortalTab?: 'accueil' | 'quittances' | 'bail' | 'solvabilite';
  onPortalTabChange?: (tab: 'accueil' | 'quittances' | 'bail' | 'solvabilite') => void;
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
  const todayFormatted = formatDateFR(new Date());
  const { isLandlord, isTenant, activeSpace } = useSpace();
  const [searchVal, setSearchVal] = useState('');
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  // Notifications Bailleur
  const [notifications, setNotifications] = useState<LandlordNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement | null>(null);

  const updateNotifications = () => {
    setNotifications(LeaseService.getLandlordNotifications());
  };

  useEffect(() => {
    updateNotifications();
    const handleStorage = () => updateNotifications();
    window.addEventListener('locagestion:leases_updated', handleStorage);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('locagestion:leases_updated', handleStorage);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    LeaseService.markNotificationsAsRead();
    updateNotifications();
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

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#F4F6F9]/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        {/* Ligne Principale du Header */}
        <div className="px-4 sm:px-8 py-3.5 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
          {/* Left: Mobile Menu & Space Badge / Title */}
          <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 shadow-sm transition-colors cursor-pointer"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {isLandlord ? 'Tableau de bord' : 'Mon Espace Locataire'}
              </h1>
              <span
                className={`hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                  isLandlord
                    ? 'bg-brand-50 text-brand-600 border-brand-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                {isLandlord ? <Sparkles className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
                {isLandlord ? 'Espace Bailleur • UEMOA' : 'Locataire Titulaire'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Aujourd’hui : {todayFormatted}</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600 font-semibold">Zone FCFA</span>
            </div>
          </div>
        </div>

        {/* Middle: Global Search Bar - Clic renvoie directement vers Annonces & Visites */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-2 lg:mx-4">
          <button
            type="button"
            onClick={handleOpenSearch}
            className="w-full relative flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200/90 hover:border-brand-400 hover:shadow-sm text-xs text-slate-500 shadow-xs transition-all cursor-pointer group text-left"
            title="Aller à la section Annonces & Visites"
          >
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <Search className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors flex-shrink-0" />
              <span className="truncate text-slate-400 group-hover:text-slate-600 font-medium">
                Rechercher une location (Pays, Ville, Budget...)
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
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mobile Search Button */}
          <button
            type="button"
            onClick={handleOpenSearch}
            className="md:hidden p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-brand-600 shadow-sm transition-colors cursor-pointer"
            aria-label="Aller à la section Annonces & Visites"
          >
            <Search className="w-4 h-4 text-slate-600" />
          </button>

          {/* ============================================================== */}
          {/* ACTIONS STRICTEMENT RÉSERVÉES AU BAILLEUR                      */}
          {/* ============================================================== */}
          {isLandlord && (
            <>
              {/* Cloche de Notifications Bailleur (En direct + Email) */}
              <div className="relative" ref={notifRef}>
                <button
                  type="button"
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-brand-600 hover:border-brand-300 shadow-sm transition-colors cursor-pointer relative"
                  aria-label="Notifications du Bailleur"
                  title="Notifications & Alertes de signature"
                >
                  <Bell className="w-4 h-4 text-slate-600" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-amber-500 text-white rounded-full text-[10px] font-black flex items-center justify-center animate-pulse shadow-md border-2 border-white">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Popover des Notifications */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black tracking-tight">Notifications Bailleur</span>
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

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
                      {notifications.length === 0 ? (
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
                                ? n.type === 'incident_reported'
                                  ? 'bg-rose-50/70 border border-rose-200/80'
                                  : 'bg-amber-50/70 border border-amber-200/60'
                                : 'hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    n.type === 'incident_reported' ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'
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

                            {/* Badge Email Envoyé */}
                            {n.emailSentTo && (
                              <div className="flex items-center gap-1.5 pt-1 text-[10px] text-sky-700 bg-sky-50 px-2.5 py-1 rounded-xl border border-sky-100">
                                <Mail className="w-3 h-3 text-sky-600 shrink-0" />
                                <span>
                                  Alerte & copie envoyées par email à <strong>{n.emailSentTo}</strong>
                                </span>
                              </div>
                            )}

                            <div className="pt-1 flex items-center justify-between">
                              <span className="text-[10px] font-mono font-bold text-slate-400">
                                {n.incidentId || n.leaseId}
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
                      )}
                    </div>
                  </div>
                )}
              </div>

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
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs font-extrabold shadow-pink-glow active:scale-95 transition-all cursor-pointer"
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
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
              >
                <Smartphone className="w-4 h-4" />
                <span>Déclarer un paiement</span>
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
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
              >
                <Wrench className="w-4 h-4 text-brand-400" />
                <span>Signaler une panne</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ==================================================================== */}
      {/* BARRE DE NAVIGATION DU MENU RÉSIDENT SOUS LE HEADER (MOBILE ONLY)   */}
      {/* 100% RESPONSIVE, DÉFILEMENT DOUX TACTILE SANS DÉBORDEMENT            */}
      {/* BOUTON SÉLECTIONNÉ : NOIR INTENSE (bg-black text-white)            */}
      {/* ==================================================================== */}
      {isTenant && (
        <div className="lg:hidden border-t border-slate-200/80 bg-white/95 backdrop-blur-md px-3 py-2 overflow-x-auto scrollbar-none shadow-xs">
          <div className="flex items-center gap-2 px-1 min-w-max">
            {/* 1. Mon Logement & Loyer */}
            <button
              type="button"
              onClick={() => {
                if (pathname === '/portal' && onPortalTabChange) {
                  onPortalTabChange('accueil');
                } else {
                  router.push('/portal');
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                pathname === '/portal' && (!activePortalTab || activePortalTab === 'accueil')
                  ? 'bg-black text-white font-black shadow-md border border-black'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/90 font-bold'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Mon Logement & Loyer</span>
            </button>

            {/* 2. Mes Quittances & Reçus */}
            <button
              type="button"
              onClick={() => {
                if (pathname === '/portal' && onPortalTabChange) {
                  onPortalTabChange('quittances');
                } else {
                  router.push('/portal?tab=quittances');
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                pathname === '/portal' && activePortalTab === 'quittances'
                  ? 'bg-black text-white font-black shadow-md border border-black'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/90 font-bold'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Mes Quittances & Reçus</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  pathname === '/portal' && activePortalTab === 'quittances'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                6
              </span>
            </button>

            {/* 3. Mon Bail & Contrat */}
            <button
              type="button"
              onClick={() => {
                if (pathname === '/portal' && onPortalTabChange) {
                  onPortalTabChange('bail');
                } else {
                  router.push('/portal?tab=bail');
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                pathname === '/portal' && activePortalTab === 'bail'
                  ? 'bg-black text-white font-black shadow-md border border-black'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/90 font-bold'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Mon Bail & Contrat</span>
            </button>

            {/* 4. Passeport Solvabilité */}
            <button
              type="button"
              onClick={() => {
                if (pathname === '/portal' && onPortalTabChange) {
                  onPortalTabChange('solvabilite');
                } else {
                  router.push('/portal?tab=solvabilite');
                }
              }}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                pathname === '/portal' && activePortalTab === 'solvabilite'
                  ? 'bg-black text-white font-black shadow-md border border-black'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/90 font-bold'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Passeport Solvabilité</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  pathname === '/portal' && activePortalTab === 'solvabilite'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                96/100
              </span>
            </button>

            {/* 5. Messages avec le Bailleur */}
            <button
              type="button"
              onClick={() => router.push('/messages')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                pathname.startsWith('/messages')
                  ? 'bg-black text-white font-black shadow-md border border-black'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/90 font-bold'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Messages</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                  pathname.startsWith('/messages')
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                1
              </span>
            </button>

            {/* 6. Pannes & Interventions */}
            <button
              type="button"
              onClick={() => router.push('/incidents')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                pathname.startsWith('/incidents')
                  ? 'bg-black text-white font-black shadow-md border border-black'
                  : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200/90 font-bold'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Pannes</span>
            </button>
          </div>
        </div>
      )}
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
