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
  Plus,
  Layers,
  Camera,
} from 'lucide-react';
import { UserSpace } from '@/lib/types';
import { useSpace } from '@/lib/context/space-context';
import { IncidentService } from '@/lib/services/incident-service';
import { UserProfileModal } from '@/components/profile/UserProfileModal';
import { getUserProfile } from '@/lib/services/geo-service';
import { NoticeService } from '@/lib/services/notice-service';
import { ListingsService } from '@/lib/services/listings-service';
import { ConversationService, getUnreadConversationsCount } from '@/lib/services/conversation-service';
import { LeaseService } from '@/lib/services/lease-service';
import { PaymentService } from '@/lib/services/payment-service';
import { TenantNotificationService } from '@/lib/services/tenant-notification-service';
import { areEmailsEqual, arePhoneNumbersEqual } from '@/lib/services/auth-service';
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
  portalTab?: 'accueil' | 'quittances' | 'bail' | 'edl' | 'solvabilite' | 'preavis';
  sectionKey?: 'messages' | 'notices' | 'leases' | 'payments' | 'incidents' | 'visits';
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeSpace?: UserSpace;
  onSpaceChange?: (space: UserSpace) => void;
  activePortalTab?: 'accueil' | 'quittances' | 'bail' | 'edl' | 'solvabilite' | 'preavis';
  onPortalTabChange?: (tab: 'accueil' | 'quittances' | 'bail' | 'edl' | 'solvabilite' | 'preavis') => void;
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
  const isDemarcheur = activeSpace === 'demarcheur';
  const landlordSubRole = context?.landlordSubRole || (isDemarcheur ? 'demarcheur' : 'bailleur');
  const setLandlordSubRole = (role: 'bailleur' | 'demarcheur') => {
    if (context?.switchSpace) {
      context.switchSpace(role);
    }
  };

  const handleSpaceChange = (target: UserSpace) => {
    if (context) {
      context.switchSpace(target);
    } else if (propOnSpaceChange) {
      propOnSpaceChange(target);
    }
  };

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
    window.addEventListener('locagestion:auth_changed', handleProfileUpdate);
    window.addEventListener('locagestion:residence_updated', handleProfileUpdate);
    return () => {
      window.removeEventListener('locagestion:profile_updated', handleProfileUpdate);
      window.removeEventListener('locagestion:auth_changed', handleProfileUpdate);
      window.removeEventListener('locagestion:residence_updated', handleProfileUpdate);
    };
  }, [activeSpace]);

  // Détection des onglets et états actifs
  const [currentPortalTab, setCurrentPortalTab] = useState<string | null>(null);

  // Synchronisation dynamique et réactive de tous les compteurs de badges universels
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const [pendingIncidents, setPendingIncidents] = useState(0);
  const [pendingNoticesCount, setPendingNoticesCount] = useState(0);
  const [pendingLeasesCount, setPendingLeasesCount] = useState(0);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [pendingVisitsCount, setPendingVisitsCount] = useState(0);
  const [myListingsCount, setMyListingsCount] = useState(0);

  const SEEN_MENU_STORAGE_KEY = 'locagestion:seen_menu_items:v1';

  const getSeenSetForSection = (section: string): Set<string> => {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(SEEN_MENU_STORAGE_KEY);
      if (!raw) return new Set();
      const parsed = JSON.parse(raw);
      const userKey = (context.user?.email || context.user?.id || 'anon').toLowerCase();
      const key = `${userKey}:${activeSpace}:${section}`;
      return new Set(Array.isArray(parsed?.[key]) ? parsed[key] : []);
    } catch {
      return new Set();
    }
  };

  const addSeenSignaturesForSection = (section: string, signatures: string[]) => {
    if (typeof window === 'undefined' || signatures.length === 0) return;
    try {
      const raw = localStorage.getItem(SEEN_MENU_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      const userKey = (context.user?.email || context.user?.id || 'anon').toLowerCase();
      const key = `${userKey}:${activeSpace}:${section}`;
      const existing = new Set<string>(Array.isArray(parsed[key]) ? parsed[key] : []);
      let changed = false;
      signatures.forEach((s) => {
        if (s && !existing.has(s)) {
          existing.add(s);
          changed = true;
        }
      });
      if (changed) {
        parsed[key] = Array.from(existing);
        localStorage.setItem(SEEN_MENU_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch {}
  };

  const getSectionSignatures = (section: 'messages' | 'notices' | 'leases' | 'payments' | 'incidents' | 'visits'): string[] => {
    if (typeof window === 'undefined') return [];
    try {
      if (section === 'messages') {
        const allConvs = ConversationService.getAllConversations();
        return allConvs.map((c) => `${c.id}:${c.messages?.length || 0}:${c.lastMessageTime || ''}`);
      }
      if (section === 'notices') {
        const list = isTenant
          ? NoticeService.getTenantNotices(context.user)
          : NoticeService.getLandlordNotices(context.user);
        return list.map((n) => `${n.id}:${n.status}:${n.landlordConfirmedAt || ''}:${n.landlordReplyDate || ''}`);
      }
      if (section === 'leases') {
        const list = isTenant
          ? LeaseService.getLeases()
          : LeaseService.getLeasesForLandlord(context.user);
        return list.map((l) => `${l.id}:${l.status}:${Boolean(l.signedByTenant)}:${l.transmittedAt || ''}`);
      }
      if (section === 'payments') {
        const list = isTenant
          ? PaymentService.getPaymentsForTenant(context.user, null)
          : PaymentService.getDeclaredPaymentsForLandlord(context.user);
        return list.map((p) => `${p.id}:${p.status}:${Boolean(p.isVerified)}`);
      }
      if (section === 'incidents') {
        const list = isTenant
          ? IncidentService.getIncidentsForTenant(context.user)
          : IncidentService.getIncidentsForLandlord(context.user);
        return list.map((i) => `${i.id}:${i.status}:${i.resolvedAt || ''}`);
      }
    } catch {}
    return [];
  };

  const markMenuSectionAsSeen = (section?: 'messages' | 'notices' | 'leases' | 'payments' | 'incidents' | 'visits') => {
    if (!section || typeof window === 'undefined') return;
    try {
      const sigs = getSectionSignatures(section);
      addSeenSignaturesForSection(section, sigs);

      if (isTenant) {
        const tNotifs = TenantNotificationService.getNotifications(context.user).filter((n) => !n.read);
        if (section === 'messages') {
          tNotifs.forEach((n) => {
            if (n.type === 'chat_message' || n.link?.includes('/messages')) {
              TenantNotificationService.markAsRead(n.id);
            }
          });
          const allConvs = ConversationService.getAllConversations();
          let convChanged = false;
          const updatedConvs = allConvs.map((c) => {
            if ((c.unreadCount || c.hasUnread) && c.unreadBy === 'locataire') {
              convChanged = true;
              return { ...c, unreadCount: 0, hasUnread: false, isRead: true };
            }
            return c;
          });
          if (convChanged) ConversationService.saveConversations(updatedConvs);
          setUnreadMessagesCount(0);
        } else if (section === 'notices') {
          tNotifs.forEach((n) => {
            if (n.type === 'notice_issued' || n.type === 'reminder_received') {
              TenantNotificationService.markAsRead(n.id);
            }
          });
          TenantNotificationService.getReminders(context.user).forEach((r) => {
            if (!r.read) TenantNotificationService.markAsRead(r.id);
          });
          setPendingNoticesCount(0);
        } else if (section === 'leases') {
          tNotifs.forEach((n) => {
            if (n.type === 'lease_available' || n.type === 'lease_reactivated' || n.type === 'lease_resiliated') {
              TenantNotificationService.markAsRead(n.id);
            }
          });
          setPendingLeasesCount(0);
        } else if (section === 'payments') {
          tNotifs.forEach((n) => {
            if (n.type === 'receipt_issued' || n.type === 'advance_payment_declared') {
              TenantNotificationService.markAsRead(n.id);
            }
          });
          setPendingPaymentsCount(0);
        } else if (section === 'incidents') {
          tNotifs.forEach((n) => {
            if (n.type === 'incident_update') {
              TenantNotificationService.markAsRead(n.id);
            }
          });
          setPendingIncidents(0);
        }
      } else {
        const lNotifs = LeaseService.getLandlordNotifications(context.user).filter((n) => !n.read);
        if (section === 'messages') {
          lNotifs.forEach((n) => {
            if (n.type === 'message_received') LeaseService.markNotificationAsRead(n.id);
          });
          const allConvs = ConversationService.getAllConversations();
          let convChanged = false;
          const updatedConvs = allConvs.map((c) => {
            if ((c.unreadCount || c.hasUnread) && c.unreadBy !== 'locataire') {
              convChanged = true;
              return { ...c, unreadCount: 0, hasUnread: false, isRead: true };
            }
            return c;
          });
          if (convChanged) ConversationService.saveConversations(updatedConvs);
          setUnreadMessagesCount(0);
        } else if (section === 'notices') {
          lNotifs.forEach((n) => {
            if (n.type === 'notice_received' || (n.title && n.title.toLowerCase().includes('préavis'))) {
              LeaseService.markNotificationAsRead(n.id);
            }
          });
          setPendingNoticesCount(0);
        } else if (section === 'leases') {
          lNotifs.forEach((n) => {
            if (
              n.type === 'lease_signed' ||
              n.type === 'lease_transmitted' ||
              n.type === 'lease_terminated' ||
              n.type === 'lease_reactivated'
            ) {
              LeaseService.markNotificationAsRead(n.id);
            }
          });
          setPendingLeasesCount(0);
        } else if (section === 'payments') {
          lNotifs.forEach((n) => {
            if (n.type === 'payment_declared') LeaseService.markNotificationAsRead(n.id);
          });
          setPendingPaymentsCount(0);
        } else if (section === 'incidents') {
          lNotifs.forEach((n) => {
            if (n.type === 'incident_reported') LeaseService.markNotificationAsRead(n.id);
          });
          setPendingIncidents(0);
        } else if (section === 'visits') {
          lNotifs.forEach((n) => {
            if (
              n.type === 'visit_requested' ||
              n.type === 'listing_approved' ||
              n.type === 'listing_rejected'
            ) {
              LeaseService.markNotificationAsRead(n.id);
            }
          });
          setPendingVisitsCount(0);
        }
      }
    } catch {}
  };

  useEffect(() => {
    const updateAllBadges = () => {
      if (typeof window === 'undefined') return;

      const params = new URLSearchParams(window.location.search);
      const hash = window.location.hash.replace('#', '');
      const livePortalTab = activePortalTab || params.get('tab') || hash || 'accueil';

      const isOnMessages = pathname.startsWith('/messages');
      const isOnIncidents = pathname.startsWith('/incidents');
      const isOnNotices =
        pathname.startsWith('/reminders') || (pathname === '/portal' && livePortalTab === 'preavis');
      const isOnLeases =
        pathname.startsWith('/leases') || (pathname === '/portal' && livePortalTab === 'bail');
      const isOnPayments =
        pathname.startsWith('/payments') || (pathname === '/portal' && livePortalTab === 'quittances');
      const isOnListings = pathname.startsWith('/listings');

      if (isOnMessages) markMenuSectionAsSeen('messages');
      if (isOnIncidents) markMenuSectionAsSeen('incidents');
      if (isOnNotices) markMenuSectionAsSeen('notices');
      if (isOnLeases) markMenuSectionAsSeen('leases');
      if (isOnPayments) markMenuSectionAsSeen('payments');
      if (isOnListings) markMenuSectionAsSeen('visits');

      const unreadLandlordNotifs =
        isLandlord || isDemarcheur || context.user?.role === 'admin'
          ? LeaseService.getLandlordNotifications(context.user).filter((n) => !n.read)
          : [];

      const unreadTenantNotifs = isTenant
        ? TenantNotificationService.getNotifications(context.user).filter((n) => !n.read)
        : [];

      // 1. Messages reçus non lus (0 si déjà sur la page Messages)
      try {
        if (isOnMessages) {
          setUnreadMessagesCount(0);
        } else {
          const allConvs = ConversationService.getAllConversations();
          const convUnread = getUnreadConversationsCount(allConvs, context.user, activeSpace);
          if (isTenant) {
            const msgNotifCount = unreadTenantNotifs.filter(
              (n) => n.type === 'chat_message' || n.link?.includes('/messages')
            ).length;
            setUnreadMessagesCount(Math.max(convUnread, msgNotifCount));
          } else {
            const msgNotifCount = unreadLandlordNotifs.filter(
              (n) => n.type === 'message_received'
            ).length;
            setUnreadMessagesCount(Math.max(convUnread, msgNotifCount));
          }
        }
      } catch {
        setUnreadMessagesCount(0);
      }

      // 2. Pannes & Interventions reçues non vues
      try {
        if (isOnIncidents) {
          setPendingIncidents(0);
        } else {
          const seenInc = getSeenSetForSection('incidents');
          if (isTenant) {
            const myInc = IncidentService.getIncidentsForTenant(context.user).filter(
              (i) => i.status !== 'resolu' && !seenInc.has(`${i.id}:${i.status}:${i.resolvedAt || ''}`)
            ).length;
            const incNotifs = unreadTenantNotifs.filter((n) => n.type === 'incident_update').length;
            setPendingIncidents(Math.max(myInc, incNotifs));
          } else {
            const lInc = IncidentService.getIncidentsForLandlord(context.user).filter(
              (i) => i.status !== 'resolu' && !seenInc.has(`${i.id}:${i.status}:${i.resolvedAt || ''}`)
            ).length;
            const incNotifs = unreadLandlordNotifs.filter(
              (n) => n.type === 'incident_reported'
            ).length;
            setPendingIncidents(Math.max(lInc, incNotifs));
          }
        }
      } catch {
        setPendingIncidents(0);
      }

      // 3. Relances & Préavis reçus non vus
      try {
        if (isOnNotices) {
          setPendingNoticesCount(0);
        } else {
          const seenNotices = getSeenSetForSection('notices');
          if (isLandlord || context.user?.role === 'admin') {
            const landlordNotices = NoticeService.getLandlordNotices(context.user);
            const unseenDep = landlordNotices.filter(
              (n) =>
                n.reasonType === 'depart_locataire' &&
                (n.status === 'notifie' || !n.landlordConfirmedAt) &&
                !seenNotices.has(`${n.id}:${n.status}:${n.landlordConfirmedAt || ''}:${n.landlordReplyDate || ''}`)
            ).length;
            const noticeNotifs = unreadLandlordNotifs.filter(
              (n) =>
                n.type === 'notice_received' ||
                (n.title && n.title.toLowerCase().includes('préavis'))
            ).length;
            setPendingNoticesCount(Math.max(unseenDep, noticeNotifs));
          } else if (isTenant) {
            const myNotices = NoticeService.getTenantNotices(context.user);
            const unseenConges = myNotices.filter(
              (n) =>
                n.reasonType !== 'depart_locataire' &&
                (n.status === 'en_cours' || n.status === 'notifie') &&
                !seenNotices.has(`${n.id}:${n.status}:${n.landlordConfirmedAt || ''}:${n.landlordReplyDate || ''}`)
            ).length;
            const unreadRem = TenantNotificationService.getReminders(context.user).filter(
              (n) => !n.read
            ).length;
            const unreadNotifIssued = unreadTenantNotifs.filter(
              (n) => n.type === 'notice_issued'
            ).length;
            setPendingNoticesCount(Math.max(unseenConges, unreadRem + unreadNotifIssued));
          } else {
            setPendingNoticesCount(0);
          }
        }
      } catch {
        setPendingNoticesCount(0);
      }

      // 4. Baux & Contrats reçus non vus
      try {
        if (isOnLeases) {
          setPendingLeasesCount(0);
        } else {
          const seenLeases = getSeenSetForSection('leases');
          if (isLandlord || context.user?.role === 'admin') {
            const landlordLeases = LeaseService.getLeasesForLandlord(context.user);
            const pendingL = landlordLeases.filter(
              (l) =>
                (l.status === 'en_attente_signature' || (!l.signedByTenant && !l.tenantSignature?.date)) &&
                !seenLeases.has(`${l.id}:${l.status}:${Boolean(l.signedByTenant)}:${l.transmittedAt || ''}`)
            ).length;
            const leaseNotifs = unreadLandlordNotifs.filter(
              (n) =>
                n.type === 'lease_signed' ||
                n.type === 'lease_transmitted' ||
                n.type === 'lease_terminated' ||
                n.type === 'lease_reactivated'
            ).length;
            setPendingLeasesCount(Math.max(pendingL, leaseNotifs));
          } else if (isTenant) {
            const allLeases = LeaseService.getLeases();
            const toSign = allLeases.filter(
              (l) =>
                (l.status === 'en_attente_signature' || (!l.signedByTenant && !l.tenantSignature?.date)) &&
                !seenLeases.has(`${l.id}:${l.status}:${Boolean(l.signedByTenant)}:${l.transmittedAt || ''}`) &&
                ((context.user?.email && areEmailsEqual(l.tenantEmail, context.user.email)) ||
                  (context.user?.phone && arePhoneNumbersEqual(l.tenantPhone, context.user.phone)) ||
                  (context.user?.name && l.tenant?.toLowerCase().includes(context.user.name.toLowerCase())))
            ).length;
            const leaseNotifs = unreadTenantNotifs.filter(
              (n) =>
                n.type === 'lease_available' ||
                n.type === 'lease_reactivated' ||
                n.type === 'lease_resiliated'
            ).length;
            setPendingLeasesCount(Math.max(toSign, leaseNotifs));
          } else {
            setPendingLeasesCount(0);
          }
        }
      } catch {
        setPendingLeasesCount(0);
      }

      // 5. Paiements & Reçus reçus non vus
      try {
        if (isOnPayments) {
          setPendingPaymentsCount(0);
        } else {
          const seenPay = getSeenSetForSection('payments');
          if (isLandlord || context.user?.role === 'admin') {
            const decl = PaymentService.getDeclaredPaymentsForLandlord(context.user);
            const unverified = decl.filter(
              (p) =>
                !p.isVerified &&
                p.status !== 'en_retard' &&
                !seenPay.has(`${p.id}:${p.status}:${Boolean(p.isVerified)}`)
            ).length;
            const payNotifs = unreadLandlordNotifs.filter(
              (n) => n.type === 'payment_declared'
            ).length;
            setPendingPaymentsCount(Math.max(unverified, payNotifs));
          } else if (isTenant) {
            const myPayments = PaymentService.getPaymentsForTenant(context.user, null);
            const unpaid = myPayments.filter(
              (p) =>
                (p.status === 'en_retard' || (!p.isVerified && p.status === 'en_attente')) &&
                !seenPay.has(`${p.id}:${p.status}:${Boolean(p.isVerified)}`)
            ).length;
            const receiptNotifs = unreadTenantNotifs.filter(
              (n) => n.type === 'receipt_issued' || n.type === 'advance_payment_declared'
            ).length;
            setPendingPaymentsCount(Math.max(unpaid, receiptNotifs));
          } else {
            setPendingPaymentsCount(0);
          }
        }
      } catch {
        setPendingPaymentsCount(0);
      }

      // 6. Annonces & Visites reçues non vues
      try {
        if (isOnListings) {
          setPendingVisitsCount(0);
        } else {
          const visitNotifs = unreadLandlordNotifs.filter(
            (n) =>
              n.type === 'visit_requested' ||
              n.type === 'listing_approved' ||
              n.type === 'listing_rejected'
          ).length;
          setPendingVisitsCount(visitNotifs);
        }
      } catch {
        setPendingVisitsCount(0);
      }

      // 7. Mes publications
      try {
        const userListings = ListingsService.getUserListings(context.user, activeSpace);
        setMyListingsCount(userListings.length);
      } catch {
        setMyListingsCount(0);
      }
    };

    updateAllBadges();

    const events = [
      'locagestion:conversations_updated',
      'locagestion:notifications_updated',
      'locagestion:tenant_notifications_updated',
      'locagestion:tenant_notifs_updated',
      'locagestion:incidents_updated',
      'locagestion:notices_updated',
      'locagestion:leases_updated',
      'locagestion:payments_updated',
      'locagestion:listings_updated',
      'storage',
    ];

    events.forEach((ev) => window.addEventListener(ev, updateAllBadges));
    const interval = setInterval(updateAllBadges, 3000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, updateAllBadges));
      clearInterval(interval);
    };
  }, [activeSpace, context.user, isLandlord, isTenant, isDemarcheur, pathname, activePortalTab, currentPortalTab]);

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

  // Détection de l'affichage actif des annonces (Toutes vs Mes publications)
  const [currentListingsView, setCurrentListingsView] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const readView = () => {
        const params = new URLSearchParams(window.location.search);
        setCurrentListingsView(params.get('view'));
      };
      readView();
      const handleSwitch = (e: Event) => {
        const custom = e as CustomEvent<{ view?: string }>;
        if (custom.detail?.view) {
          setCurrentListingsView(custom.detail.view);
        }
      };
      window.addEventListener('popstate', readView);
      window.addEventListener('locagestion:switch_listings_view', handleSwitch);
      return () => {
        window.removeEventListener('popstate', readView);
        window.removeEventListener('locagestion:switch_listings_view', handleSwitch);
      };
    }
  }, [pathname]);

  // ============================================================================
  // NAVIGATION BAILLEUR (Gestion du patrimoine, encaissements, locataires, baux)
  // ============================================================================
  const landlordItems: NavItem[] = [
    {
      name: 'Tableau de bord',
      href: '/dashboard',
      icon: LayoutDashboard,
      active: pathname === '/dashboard' || pathname === '/',
    },
    {
      name: 'Biens & Lots',
      href: '/properties',
      icon: Building2,
      active: pathname.startsWith('/properties'),
    },
    {
      name: 'Baux & Contrats',
      href: '/leases',
      icon: FileText,
      active: pathname.startsWith('/leases'),
      badgeCount: pendingLeasesCount > 0 ? pendingLeasesCount : undefined,
      badgeColor: 'bg-blue-600',
      sectionKey: 'leases',
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
      badgeCount: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
      badgeColor: 'bg-emerald-600',
      sectionKey: 'payments',
    },
    {
      name: 'Annonces & Visites',
      href: '/listings',
      icon: Compass,
      active: pathname.startsWith('/listings'),
      badgeCount: pendingVisitsCount > 0 ? pendingVisitsCount : undefined,
      badgeColor: 'bg-brand-500',
      badge: pendingVisitsCount > 0 ? undefined : 'Nouveau',
      sectionKey: 'visits',
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: MessageSquare,
      active: pathname.startsWith('/messages'),
      badgeCount: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
      badgeColor: 'bg-brand-500',
      sectionKey: 'messages',
    },
    {
      name: 'Relances & Préavis',
      href: '/reminders',
      icon: BellRing,
      active: pathname.startsWith('/reminders'),
      badgeCount: pendingNoticesCount > 0 ? pendingNoticesCount : undefined,
      badgeColor: 'bg-rose-500',
      sectionKey: 'notices',
    },
    {
      name: 'Pannes & Interventions',
      href: '/incidents',
      icon: Wrench,
      active: pathname.startsWith('/incidents'),
      badgeCount: pendingIncidents > 0 ? pendingIncidents : undefined,
      badgeColor: 'bg-amber-500',
      sectionKey: 'incidents',
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
      badgeCount: pendingPaymentsCount > 0 ? pendingPaymentsCount : undefined,
      badgeColor: 'bg-emerald-600',
      mobileOnly: true,
      sectionKey: 'payments',
    },
    {
      name: 'Mon Bail & Contrat',
      href: '/portal?tab=bail',
      icon: FileText,
      portalTab: 'bail',
      active: pathname === '/portal' && effectivePortalTab === 'bail',
      badgeCount: pendingLeasesCount > 0 ? pendingLeasesCount : undefined,
      badgeColor: 'bg-blue-600',
      mobileOnly: true,
      sectionKey: 'leases',
    },
    {
      name: 'États des Lieux',
      href: '/portal?tab=edl',
      icon: Camera,
      portalTab: 'edl',
      active: pathname === '/portal' && effectivePortalTab === 'edl',
      mobileOnly: true,
    },
    {
      name: 'Passeport Solvabilité',
      href: '/portal?tab=solvabilite',
      icon: ShieldCheck,
      portalTab: 'solvabilite',
      active: pathname === '/portal' && effectivePortalTab === 'solvabilite',
      mobileOnly: true,
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: MessageSquare,
      active: pathname.startsWith('/messages'),
      badgeCount: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
      badgeColor: 'bg-brand-500',
      sectionKey: 'messages',
    },
    {
      name: 'Publier une annonce',
      href: '/listings?action=publish',
      icon: Plus,
      active: false,
    },
    {
      name: 'Annonces & Visites',
      href: '/listings',
      icon: Compass,
      active: pathname.startsWith('/listings') && currentListingsView !== 'my_listings',
      badgeCount: pendingVisitsCount > 0 ? pendingVisitsCount : undefined,
      badgeColor: 'bg-brand-500',
      badge: pendingVisitsCount > 0 ? undefined : 'Nouveau',
      sectionKey: 'visits',
    },
    {
      name: 'Mes publications',
      href: '/listings?view=my_listings',
      icon: Layers,
      active: pathname.startsWith('/listings') && currentListingsView === 'my_listings',
      badgeCount: myListingsCount > 0 ? myListingsCount : undefined,
      badgeColor: 'bg-emerald-500',
    },
    {
      name: 'Relances & Préavis',
      href: '/portal?tab=preavis',
      icon: BellRing,
      portalTab: 'preavis',
      active: pathname === '/portal' && effectivePortalTab === 'preavis',
      badgeCount: pendingNoticesCount > 0 ? pendingNoticesCount : undefined,
      badgeColor: 'bg-rose-500',
      sectionKey: 'notices',
    },
    {
      name: 'Pannes & Interventions',
      href: '/incidents',
      icon: Wrench,
      active: pathname.startsWith('/incidents'),
      badgeCount: pendingIncidents > 0 ? pendingIncidents : undefined,
      badgeColor: 'bg-amber-500',
      sectionKey: 'incidents',
    },
  ];

  // ============================================================================
  // NAVIGATION STRICTEMENT DÉMARCHEUR (Publier, Annonces & Visites, Messages)
  // ============================================================================
  const demarcheurItems: NavItem[] = [
    {
      name: 'Publier une annonce',
      href: '/listings?action=publish',
      icon: Plus,
      active: false,
    },
    {
      name: 'Annonces & Visites',
      href: '/listings',
      icon: Compass,
      active: pathname.startsWith('/listings') && currentListingsView !== 'my_listings',
      badgeCount: pendingVisitsCount > 0 ? pendingVisitsCount : undefined,
      badgeColor: 'bg-brand-500',
      badge: pendingVisitsCount > 0 ? undefined : 'Nouveau',
      sectionKey: 'visits',
    },
    {
      name: 'Mes publications',
      href: '/listings?view=my_listings',
      icon: Layers,
      active: pathname.startsWith('/listings') && currentListingsView === 'my_listings',
      badgeCount: myListingsCount > 0 ? myListingsCount : undefined,
      badgeColor: 'bg-amber-500',
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: MessageSquare,
      active: pathname.startsWith('/messages'),
      badgeCount: unreadMessagesCount > 0 ? unreadMessagesCount : undefined,
      badgeColor: 'bg-brand-500',
      sectionKey: 'messages',
    },
  ];

  const currentNavItems = isTenant
    ? tenantItems
    : isDemarcheur
    ? demarcheurItems
    : landlordItems;

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
        <div className="px-4 pt-5 pb-2">
          {/* Brand Logo & Close Button */}
          <div className="flex items-center justify-between mb-5">
            <Link
              href={isTenant ? '/portal' : isDemarcheur ? '/listings' : '/'}
              className="flex items-center gap-3 group"
            >
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
                  {isTenant ? 'Portail Résidentiel' : isDemarcheur ? 'Espace Démarcheur' : 'Espace Bailleur'}
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

          {/* BADGE DE L'ESPACE EXCLUSIF DE L'UTILISATEUR */}
          <div className="p-3 bg-[#171b24] rounded-2xl border border-white/10 flex items-center gap-2.5 mb-4 shadow-sm">
            {isLandlord && (
              <>
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center shrink-0">
                  <Building2 className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Espace Dédié
                  </span>
                  <span className="text-xs font-black text-white truncate block">
                    Propriétaire Bailleur
                  </span>
                </div>
              </>
            )}
            {isDemarcheur && (
              <>
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Espace Dédié
                  </span>
                  <span className="text-xs font-black text-white truncate block">
                    Démarcheur & Agent
                  </span>
                </div>
              </>
            )}
            {isTenant && (
              <>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Espace Dédié
                  </span>
                  <span className="text-xs font-black text-white truncate block">
                    Portail Résidentiel
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Middle: Space-Specific Navigation Links */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {isTenant
              ? 'Menu Résident'
              : isDemarcheur
              ? 'Espace Démarcheur'
              : 'Pilotage Bailleur'}
          </div>

          {currentNavItems.map((item) => {
            const Icon = item.icon;
            const isPublishBtn = item.name === 'Publier une annonce';
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={(e) => {
                  if (item.sectionKey) {
                    markMenuSectionAsSeen(item.sectionKey);
                  }
                  if (isPublishBtn) {
                    window.dispatchEvent(new CustomEvent('locagestion:open_publish_listing'));
                  }
                  if (item.name === 'Mes publications') {
                    setCurrentListingsView('my_listings');
                    window.dispatchEvent(new CustomEvent('locagestion:switch_listings_view', { detail: { view: 'my_listings' } }));
                  }
                  if (item.name === 'Annonces & Visites') {
                    setCurrentListingsView('all');
                    window.dispatchEvent(new CustomEvent('locagestion:switch_listings_view', { detail: { view: 'all' } }));
                  }
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
                }flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all group min-w-0 ${
                  item.active
                    ? isDemarcheur
                      ? 'bg-amber-500/15 text-amber-200 font-bold border border-amber-500/30 shadow-sm'
                      : isLandlord
                      ? 'bg-white/[0.08] text-white shadow-sm font-bold'
                      : 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`p-1.5 rounded-xl transition-colors shrink-0 ${
                      item.active
                        ? isDemarcheur
                          ? 'text-amber-400 bg-amber-500/20'
                          : isLandlord
                          ? 'text-brand-400 bg-brand-500/10'
                          : 'text-emerald-400 bg-emerald-500/20'
                        : 'text-slate-400 group-hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <span className="truncate whitespace-nowrap text-xs">{item.name}</span>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {item.count && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
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
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 ${
                        isTenant
                          ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/25'
                          : 'text-tealAccent-400 bg-tealAccent-500/10 border border-tealAccent-500/20'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.badgeCount !== undefined && (!item.sectionKey || !item.active) && (
                    <span
                      className={`w-5 h-5 rounded-full ${
                        item.badgeColor || (isTenant ? 'bg-emerald-500' : 'bg-brand-500')
                      } text-white font-black text-[10px] flex items-center justify-center shadow-md whitespace-nowrap shrink-0`}
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
                    context?.user?.avatarUrl ||
                    userProfile.avatarUrl ||
                    (isDemarcheur
                      ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80'
                      : isLandlord
                      ? 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=160&auto=format&fit=crop&q=80'
                      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80')
                  }
                  alt={context?.user?.name || userProfile.name}
                  className="w-10 h-10 rounded-xl object-cover ring-2 ring-white/10 group-hover:ring-brand-400 group-hover:scale-105 transition-all"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-[#131720]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-white truncate group-hover:text-brand-300 transition-colors">
                    {context?.user?.firstName
                      ? `${context.user.firstName} ${context.user.lastName || ''}`.trim()
                      : (userProfile.firstName
                          ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim()
                          : userProfile.name)}
                  </h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-tealAccent-400 shrink-0" />
                </div>
                {(context?.user?.matricule || userProfile.matricule) && (
                  <p className="text-[9px] font-mono font-bold text-indigo-300/90 truncate flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                    <span>{context?.user?.matricule || userProfile.matricule}</span>
                  </p>
                )}
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
                  if (context && context.logout) {
                    context.logout();
                  }
                }}
                title="Se déconnecter de votre session"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
        activeSpace={activeSpace}
      />
    </>
  );
}
