'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  FileText,
  Users,
  CreditCard,
  Compass,
  MessageSquare,
  Bell,
  BarChart3,
  Settings,
  HelpCircle,
  X,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  Receipt,
  Home,
  BellRing,
  Smartphone,
  Wrench,
  Lock,
  LogOut,
  Repeat,
} from 'lucide-react';
import { UserSpace } from '@/lib/types';
import { useSpace } from '@/lib/context/space-context';
import { IncidentService } from '@/lib/services/incident-service';
import { UserProfileModal } from '@/components/profile/UserProfileModal';
import { getUserProfile } from '@/lib/services/geo-service';
import { COUNTRIES_CITIES } from '@/lib/data/mock-data';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  active: boolean;
  count?: string;
  badge?: string;
  badgeCount?: number;
  badgeColor?: string;
  mobileOnly?: boolean;
  portalTab?: 'accueil' | 'quittances' | 'bail' | 'solvabilite';
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSpace?: UserSpace;
  onSpaceChange?: (space: UserSpace) => void;
  activePortalTab?: 'accueil' | 'quittances' | 'bail' | 'solvabilite';
  onPortalTabChange?: (tab: 'accueil' | 'quittances' | 'bail' | 'solvabilite') => void;
}

export function Sidebar({
  isOpen,
  onClose,
  activeSpace: propSpace,
  onSpaceChange: propOnSpaceChange,
  activePortalTab,
  onPortalTabChange,
}: SidebarProps) {
  const pathname = usePathname();
  const context = useSpace();

  // Prefer context space if available
  const activeSpace = context ? context.activeSpace : propSpace || 'bailleur';
  const isLandlord = activeSpace === 'bailleur';
  const isTenant = activeSpace === 'locataire';

  const handleSpaceChange = (target: UserSpace) => {
    if (context) {
      context.switchSpace(target);
    } else if (propOnSpaceChange) {
      propOnSpaceChange(target);
    }
  };

  const [pendingIncidents, setPendingIncidents] = useState(0);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  // Initialisation déterministe sans cache pour une concordance SSR/Client rigoureuse
  const [userProfile, setUserProfile] = useState(() => getUserProfile(activeSpace, false));

  useEffect(() => {
    setUserProfile(getUserProfile(activeSpace, true));
  }, [activeSpace]);

  useEffect(() => {
    const handleProfileUpdate = () => {
      setUserProfile(getUserProfile(activeSpace, true));
    };
    window.addEventListener('locagestion:profile_updated', handleProfileUpdate);
    window.addEventListener('locagestion:residence_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('locagestion:profile_updated', handleProfileUpdate);
      window.removeEventListener('locagestion:residence_updated', handleProfileUpdate);
    };
  }, [activeSpace]);

  useEffect(() => {
    const updateCount = () => {
      const active = IncidentService.getIncidents().filter((i) => i.status !== 'resolu').length;
      setPendingIncidents(active);
    };
    updateCount();
    window.addEventListener('locagestion:incidents_updated', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('locagestion:incidents_updated', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  // Détection de l'onglet actif du portail pour le menu résident
  const [currentPortalTab, setCurrentPortalTab] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const readTab = () => {
        const params = new URLSearchParams(window.location.search);
        const hash = window.location.hash.replace('#', '');
        const tab = params.get('tab') || hash || 'accueil';
        setCurrentPortalTab(tab);
      };
      readTab();
      window.addEventListener('popstate', readTab);
      window.addEventListener('hashchange', readTab);
      return () => {
        window.removeEventListener('popstate', readTab);
        window.removeEventListener('hashchange', readTab);
      };
    }
  }, [pathname]);

  const effectivePortalTab = activePortalTab || currentPortalTab || 'accueil';

  // ============================================================================
  // NAVIGATION BAILLEUR (Gestion du patrimoine, encaissements, locataires, baux)
  // ============================================================================
  const landlordItems: NavItem[] = [
    {
      name: 'Tableau de bord',
      href: '/',
      icon: LayoutDashboard,
      active: pathname === '/',
    },
    {
      name: 'Biens & Lots',
      href: '/properties',
      icon: Building2,
      active: pathname.startsWith('/properties'),
      count: '4',
    },
    {
      name: 'Baux & Contrats',
      href: '/leases',
      icon: FileText,
      active: pathname.startsWith('/leases'),
    },
    {
      name: 'Locataires',
      href: '/tenants',
      icon: Users,
      active: pathname.startsWith('/tenants'),
    },
    {
      name: 'Paiements & Reçus',
      href: '/payments',
      icon: CreditCard,
      active: pathname.startsWith('/payments'),
    },
    {
      name: 'Annonces & Visites',
      href: '/listings',
      icon: Compass,
      active: pathname.startsWith('/listings'),
      badge: 'Nouveau',
    },
    {
      name: 'Centre de relances',
      href: '/reminders',
      icon: BellRing,
      active: pathname.startsWith('/reminders'),
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: MessageSquare,
      active: pathname.startsWith('/messages'),
      badgeCount: 3,
      badgeColor: 'bg-brand-500',
    },
    {
      name: 'Pannes & Interventions',
      href: '/incidents',
      icon: Wrench,
      active: pathname.startsWith('/incidents'),
      badgeCount: pendingIncidents > 0 ? pendingIncidents : undefined,
      badgeColor: 'bg-amber-500',
    },
  ];

  // ============================================================================
  // NAVIGATION STRICTEMENT LOCATAIRE (Menu Résident Épuré)
  // ============================================================================
  const tenantItems: NavItem[] = [
    {
      name: 'Mon Logement & Loyer',
      href: '/portal',
      icon: Home,
      portalTab: 'accueil',
      active: pathname === '/portal' && effectivePortalTab === 'accueil',
    },
    // Déplacés dans le Menu Résident UNIQUEMENT SUR MOBILE :
    {
      name: 'Mes Quittances & Reçus',
      href: '/portal?tab=quittances',
      icon: Receipt,
      portalTab: 'quittances',
      active: pathname === '/portal' && effectivePortalTab === 'quittances',
      count: '6',
      mobileOnly: true,
    },
    {
      name: 'Mon Bail & Contrat',
      href: '/portal?tab=bail',
      icon: FileText,
      portalTab: 'bail',
      active: pathname === '/portal' && effectivePortalTab === 'bail',
      mobileOnly: true,
    },
    {
      name: 'Passeport Solvabilité',
      href: '/portal?tab=solvabilite',
      icon: ShieldCheck,
      portalTab: 'solvabilite',
      active: pathname === '/portal' && effectivePortalTab === 'solvabilite',
      badge: '96/100',
      mobileOnly: true,
    },
    {
      name: 'Messages avec le Bailleur',
      href: '/messages',
      icon: MessageSquare,
      active: pathname.startsWith('/messages'),
      badgeCount: 1,
      badgeColor: 'bg-emerald-500',
    },
    {
      name: 'Explorer les Logements',
      href: '/listings',
      icon: Compass,
      active: pathname.startsWith('/listings'),
    },
    {
      name: 'Pannes & Interventions',
      href: '/incidents',
      icon: Wrench,
      active: pathname.startsWith('/incidents'),
      badgeCount: pendingIncidents > 0 ? pendingIncidents : undefined,
      badgeColor: 'bg-amber-500',
    },
  ];

  const currentNavItems = isLandlord ? landlordItems : tenantItems;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-[#0e1117] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top: Logo & Space Switcher */}
        <div className="p-6 pb-2">
          {/* Brand Logo & Close Button */}
          <div className="flex items-center justify-between mb-6">
            <Link href={isLandlord ? '/' : '/portal'} className="flex items-center gap-3 group">
              {/* Pink/Rose House Logo Icon */}
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                >
                  <path
                    d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
                    fill="currentColor"
                  />
                  <path
                    d="M12 7.5L6 12.5V19H8V12H16V19H18V12.5L12 7.5Z"
                    fill="rgba(255,255,255,0.4)"
                  />
                </svg>
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-white block">
                  LOCA<span className="text-brand-400">GESTION</span>
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  {isLandlord ? 'Espace Gestion Bailleur' : 'Portail Résidentiel'}
                </span>
              </div>
            </Link>

            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* SÉLECTEUR D'ESPACE RAPIDE (Navigation Libre pour Tests) */}
          <div className="p-1.5 bg-[#171b24] rounded-2xl border border-white/5 flex items-center mb-4">
            <button
              type="button"
              onClick={() => handleSpaceChange('bailleur')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isLandlord
                  ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Bailleur</span>
            </button>
            <button
              type="button"
              onClick={() => handleSpaceChange('locataire')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isTenant
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-black'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Locataire</span>
            </button>
          </div>
        </div>

        {/* Middle: Space-Specific Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {isLandlord ? 'Pilotage Bailleur' : 'Menu Résident'}
          </div>

          {currentNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  if (item.portalTab) {
                    setCurrentPortalTab(item.portalTab);
                    if (pathname === '/portal' && onPortalTabChange) {
                      e.preventDefault();
                      onPortalTabChange(item.portalTab);
                    }
                  }
                  onClose();
                }}
                className={`${
                  item.mobileOnly ? 'lg:hidden ' : ''
                }flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all group ${
                  item.active
                    ? isLandlord
                      ? 'bg-white/[0.08] text-white shadow-sm font-bold'
                      : 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-xl transition-colors ${
                      item.active
                        ? isLandlord
                          ? 'text-brand-400 bg-brand-500/10'
                          : 'text-emerald-400 bg-emerald-500/20'
                        : 'text-slate-400 group-hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.name}</span>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5">
                  {item.count && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isTenant
                          ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/25'
                          : 'text-slate-400 bg-white/5'
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isTenant
                          ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/25'
                          : 'text-tealAccent-400 bg-tealAccent-500/10 border border-tealAccent-500/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.badgeCount !== undefined && (
                    <span
                      className={`w-5 h-5 rounded-full ${
                        isTenant ? 'bg-emerald-500' : item.badgeColor
                      } text-white font-black text-[10px] flex items-center justify-center shadow-md`}
                    >
                      {item.badgeCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom: User Profile Card (Adapts to Active Role & 100% Fonctionnelle) */}
        <div className="p-4 border-t border-white/5 bg-[#0a0d12]">
          <div
            onClick={() => setIsProfileModalOpen(true)}
            suppressHydrationWarning
            className="p-3 bg-[#131720] hover:bg-[#1a202c] rounded-2xl border border-white/10 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10 flex items-center justify-between group transition-all cursor-pointer ring-1 ring-transparent hover:ring-brand-500/30"
            title="Cliquer pour ouvrir votre profil utilisateur"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative shrink-0">
                <img
                  src={
                    userProfile.avatarUrl ||
                    (isLandlord
                      ? 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=160&auto=format&fit=crop&q=80'
                      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80')
                  }
                  alt={userProfile.name}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-brand-400 group-hover:scale-105 transition-all"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#131720]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-brand-300 transition-colors">
                    {userProfile.name}
                  </h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-tealAccent-400 shrink-0" />
                </div>
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                  <span>{COUNTRIES_CITIES[userProfile.residenceCountry]?.flag || '🇧🇯'}</span>
                  <span className="font-semibold text-slate-300">{userProfile.residenceCountry}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-brand-400 font-bold group-hover:underline">Modifier</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSpaceChange(isLandlord ? 'locataire' : 'bailleur');
                }}
                title={`Basculer vers l'espace ${isLandlord ? 'Locataire' : 'Bailleur'} (Mode Test)`}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Repeat className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (context && context.logout) {
                    context.logout();
                  }
                }}
                title="Se déconnecter de votre session"
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mention discrète Créée au Bénin pour l'Afrique (en bas à gauche) */}
          <div className="mt-1.5 px-1 flex items-center justify-between text-[8px] text-slate-500 font-normal">
            <span className="flex items-center gap-1 text-slate-400 truncate">
              <span className="text-[9px] leading-none">🇧🇯</span>
              <span>Créée au Bénin pour l'Afrique</span>
            </span>
            <span className="text-slate-600 shrink-0 ml-1">UEMOA & CEMAC</span>
          </div>
        </div>
      </aside>

      {/* User Profile & Inscription Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        activeSpace={isLandlord ? 'bailleur' : 'locataire'}
      />
    </>
  );
}
