'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  Search,
  Phone,
  MoreVertical,
  Send,
  Paperclip,
  Image as ImageIcon,
  Smile,
  Check,
  CheckCheck,
  Building2,
  Calendar,
  Sparkles,
  ExternalLink,
  Archive,
  ShieldAlert,
  ArrowLeft,
  X,
  FileText,
  CheckCircle2,
  MessageCircle,
  UserCheck,
  Home,
  Eye,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { UserSpace } from '@/lib/types';
import { useSpace } from '@/lib/context/space-context';
import { notifyAction } from '@/lib/notifications/action-notifier';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import { ListingsService } from '@/lib/services/listings-service';
import { areEmailsEqual, arePhoneNumbersEqual } from '@/lib/services/auth-service';
import { LeaseService, LandlordNotification } from '@/lib/services/lease-service';
import { TenantNotificationService } from '@/lib/services/tenant-notification-service';

import {
  Message,
  Conversation,
  STORAGE_KEY_CONVERSATIONS,
  isFakeConversation,
  isUserConversationAuthor,
  isUserConversationVisitor,
  isUserConversationParticipant,
  getConversationContactName,
  getConversationContactAvatar,
  getConversationContactPhone,
  isMessageSentByCurrentUser,
  getUnreadConversationsCount,
} from '@/lib/services/conversation-service';

function MessagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryConvId = searchParams?.get('convId') || null;
  const queryListingId = searchParams?.get('listingId') || null;
  const queryFromListings = searchParams?.get('from') === 'listings';
  const [cameFromListings, setCameFromListings] = useState<boolean>(() => queryFromListings);

  useEffect(() => {
    if (queryFromListings) {
      setCameFromListings(true);
    }
  }, [queryFromListings]);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, activeSpace, switchSpace, isLandlord, isTenant, isDemarcheur } = useSpace();
  const [activeTab, setActiveTab] = useState<'general' | 'archive'>('general');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Conversations réelles persistées — STRICTEMENT VIDE AU DÉPART
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.filter((c) => !isFakeConversation(c));
          if (sanitized.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(sanitized));
          }
          return sanitized;
        }
      }
    } catch {}
    return [];
  });

  const [selectedConvId, setSelectedConvId] = useState<string | null>(() => {
    return queryConvId || null;
  });

  const selectedConv = React.useMemo(() => {
    if (!selectedConvId) return null;
    return conversations.find((c) => c.id === selectedConvId) || null;
  }, [conversations, selectedConvId]);

  const handledQueryKeyRef = useRef<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Synchronisation dynamique avec le stockage local & événements d'autres pages
  useEffect(() => {
    const handleSync = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const sanitized = parsed.filter((c) => !isFakeConversation(c));
            setConversations(sanitized);
          }
        }
      } catch {}
    };

    window.addEventListener('locagestion:conversations_updated', handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener('locagestion:conversations_updated', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const isBailleurSide = activeSpace === 'bailleur' || activeSpace === 'demarcheur';

  // Seules les conversations dont l'utilisateur connecté est participant légitime selon l'espace actif sont visibles (3 espaces étanches)
  const userConversations = React.useMemo(() => {
    if (!user) return [];
    return conversations.filter((c) => isUserConversationParticipant(c, user, activeSpace));
  }, [conversations, user, activeSpace]);

  const getUnreadCountForCurrentUser = (conv: Conversation): number => {
    // Si la discussion est actuellement sélectionnée et visible à l'écran, le compteur non lu pour l'utilisateur actuel est 0
    if (selectedConv?.id === conv.id) {
      return 0;
    }

    if (!conv.unreadCount || conv.unreadCount <= 0) {
      return 0;
    }

    const isAuthor = isUserConversationAuthor(conv, user);
    const isVisitor = isUserConversationVisitor(conv, user);

    if (isAuthor && !isVisitor) {
      if (conv.unreadBy === 'locataire') return 0;
      return conv.unreadCount;
    } else if (isVisitor && !isAuthor) {
      if (conv.unreadBy !== 'locataire') return 0;
      return conv.unreadCount;
    } else {
      if (isBailleurSide) {
        if (conv.unreadBy === 'locataire') return 0;
        return conv.unreadCount;
      } else {
        if (conv.unreadBy !== 'locataire') return 0;
        return conv.unreadCount;
      }
    }
  };

  const selectAndMarkAsRead = (conv: Conversation) => {
    if (!isUserConversationParticipant(conv, user, activeSpace)) return;

    setSelectedConvId(conv.id);
    setMobileChatOpen(true);

    // Mettre à jour l'URL sans rechargement pour refléter fidèlement la conversation active
    if (typeof window !== 'undefined') {
      handledQueryKeyRef.current = `${conv.id}:::`;
      const preserveFrom =
        cameFromListings ||
        queryFromListings ||
        new URLSearchParams(window.location.search).get('from') === 'listings';
      window.history.replaceState(
        null,
        '',
        `/messages?convId=${encodeURIComponent(conv.id)}${preserveFrom ? '&from=listings' : ''}`
      );
    }

    const userUnread = getUnreadCountForCurrentUser(conv);

    if (userUnread > 0 || conv.hasUnread) {
      const updatedConv: Conversation = {
        ...conv,
        unreadCount: 0,
        hasUnread: false,
        isRead: true,
      };
      const updatedList = conversations.map((c) => (c.id === conv.id ? updatedConv : c));
      saveConversations(updatedList);
    }

    // Marquer systématiquement les notifications de messagerie associées comme lues (Bailleur & Locataire)
    try {
      if (isBailleurSide) {
        LeaseService.markNotificationAsRead(conv.id);
        LeaseService.markNotificationAsRead(`notif-conv-${conv.id}`);
        LeaseService.markNotificationAsRead(`notif-msg-${conv.id}`);
        const lNotifs = LeaseService.getLandlordNotifications(user);
        lNotifs.forEach((n) => {
          if (!n.read && n.type === 'message_received' && (n.convId === conv.id || n.property === conv.propertyTitle)) {
            LeaseService.markNotificationAsRead(n.id);
          }
        });
      } else {
        const tNotifs = TenantNotificationService.getNotifications(user);
        tNotifs.forEach((n) => {
          if (
            !n.read &&
            (n.type === 'chat_message' || n.link?.includes('/messages')) &&
            (n.link?.includes(conv.id) || (conv.propertyTitle && n.title?.toLowerCase().includes(conv.propertyTitle.toLowerCase())))
          ) {
            TenantNotificationService.markAsRead(n.id);
          }
        });
      }
    } catch {}
  };

  // Désélectionner immédiatement toute conversation qui n'appartient pas à l'utilisateur ou à l'espace actif
  useEffect(() => {
    if (selectedConv && user && !isUserConversationParticipant(selectedConv, user, activeSpace)) {
      setSelectedConvId(null);
    }
  }, [selectedConv, user, activeSpace]);

  // Détection des paramètres URL (convId / listingId) pour ouvrir immédiatement le dialogue
  useEffect(() => {
    if (!queryConvId && !queryListingId) return;

    const queryKey = `${queryConvId || ''}:::${queryListingId || ''}`;
    // Si cette requête URL a déjà été appliquée, ne pas la ré-exécuter (empêche tout rebond ou bascule forcée)
    if (handledQueryKeyRef.current === queryKey) return;

    // 1. Recherche dans l'état actuel
    const matchInState = conversations.find(
      (c) =>
        (queryConvId && c.id === queryConvId) ||
        (queryListingId && c.listingId === queryListingId)
    );

    if (matchInState && isUserConversationParticipant(matchInState, user, activeSpace)) {
      handledQueryKeyRef.current = queryKey;
      selectAndMarkAsRead(matchInState);
      return;
    }

    // 2. Recherche dans le localStorage
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      if (stored) {
        const parsed: Conversation[] = JSON.parse(stored);
        const matchInStorage = parsed.find(
          (c) =>
            (queryConvId && c.id === queryConvId) ||
            (queryListingId && c.listingId === queryListingId)
        );
        if (matchInStorage && isUserConversationParticipant(matchInStorage, user, activeSpace)) {
          handledQueryKeyRef.current = queryKey;
          selectAndMarkAsRead(matchInStorage);
          return;
        }
      }
    } catch {}

    // 3. Si aucun échange trouvé mais un listingId est fourni, instanciation automatique
    if (queryListingId) {
      handledQueryKeyRef.current = queryKey;
      const allListings = ListingsService.getAllListings();
      const listing = allListings.find((l) => l.id === queryListingId);
      if (listing) {
        const publisherName = listing.authorCompany?.trim()
          ? listing.authorCompany.trim()
          : listing.authorName?.trim()
          ? listing.authorName.trim()
          : 'Bailleur / Propriétaire';

        const convId = queryConvId || `conv-listing-${listing.id}`;
        const autoGreeting = `Bonjour, je vous contacte au sujet de votre annonce « ${listing.title} » située à ${listing.district}, ${listing.city} (${listing.surface} m², ${formatFCFA(listing.monthlyRent)}/mois). Ce bien est-il toujours disponible ?`;

        const newConv: Conversation = {
          id: convId,
          tenantName: publisherName,
          publisherName,
          publisherAvatar: listing.authorAvatar || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
          visitorName: user?.name || user?.firstName || 'Candidat Locataire',
          visitorAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          visitorPhone: user?.phone || '',
          visitorEmail: user?.email || '',
          tenantAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
          isOnline: true,
          propertyTitle: listing.title,
          propertyUnit: `${listing.district}, ${listing.city}`,
          propertySurface: `${listing.surface} m²`,
          propertyPrice: listing.monthlyRent,
          propertyThumbnail: (listing.images && listing.images[0]) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
          lastMessage: autoGreeting,
          lastMessageTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          unreadCount: 0,
          isRead: true,
          isArchived: false,
          listingId: listing.id,
          authorId: listing.authorId,
          authorName: listing.authorName,
          authorCompany: listing.authorCompany,
          authorEmail: listing.authorEmail,
          authorPhone: listing.authorPhone,
          authorRole: listing.authorRole,
          messages: [
            {
              id: `m-${Date.now()}`,
              sender: 'me',
              senderRole: (activeSpace === 'bailleur' || activeSpace === 'demarcheur') ? 'bailleur' : 'locataire',
              senderName: user?.name || user?.firstName || 'Moi',
              senderAvatar: user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
              text: autoGreeting,
              time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
              status: 'sent',
            },
          ],
        };

        const updated = [newConv, ...conversations.filter((c) => c.id !== newConv.id)];
        saveConversations(updated);
        selectAndMarkAsRead(newConv);
      }
    }
  }, [queryConvId, queryListingId, conversations, user]);

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  const saveConversations = (updated: Conversation[]) => {
    setConversations(updated);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent('locagestion:conversations_updated'));
        window.dispatchEvent(new Event('storage'));

        // Synchronisation montante immédiate vers le serveur (Web <-> Mobile)
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversations: updated }),
        }).catch(() => {});
      } catch {}
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    notifyAction(msg, 'Messagerie en direct', 'success');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredConversations = React.useMemo(() => {
    return userConversations.filter((c) => {
      const matchesTab = activeTab === 'general' ? !c.isArchived : c.isArchived;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchesTab;
      const matchesSearch =
        c.tenantName.toLowerCase().includes(q) ||
        c.propertyTitle.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q) ||
        (c.visitorName && c.visitorName.toLowerCase().includes(q)) ||
        (c.authorName && c.authorName.toLowerCase().includes(q)) ||
        (c.publisherName && c.publisherName.toLowerCase().includes(q));
      return matchesTab && matchesSearch;
    });
  }, [userConversations, activeTab, searchQuery]);

  const handleGoToListing = () => {
    if (!selectedConv) return;
    const allListings = ListingsService.getAllListings();

    // 1. Recherche par listingId direct
    let targetId = selectedConv.listingId;

    // 2. Recherche par pattern convId `conv-listing-${id}`
    if (!targetId && selectedConv.id && selectedConv.id.startsWith('conv-listing-')) {
      targetId = selectedConv.id.replace('conv-listing-', '');
    }

    // 3. Correspondance précise dans allListings par id ou référence
    if (targetId) {
      const cleanTarget = targetId.toLowerCase().trim();
      const match = allListings.find(
        (l) =>
          (l.id && l.id.toLowerCase() === cleanTarget) ||
          (l.referenceCode && l.referenceCode.toLowerCase() === cleanTarget) ||
          (cleanTarget.length >= 4 && l.id && l.id.toLowerCase().includes(cleanTarget)) ||
          (cleanTarget.length >= 4 && l.referenceCode && l.referenceCode.toLowerCase().includes(cleanTarget))
      );
      if (match) {
        router.push(`/listings?detail=${encodeURIComponent(match.id)}`);
        return;
      }
    }

    // 4. Recherche par titre, quartier, vignette ou loyer
    const cleanTitle = (selectedConv.propertyTitle || '').trim().toLowerCase();
    const cleanUnit = (selectedConv.propertyUnit || '').trim().toLowerCase();
    const matchedListing = allListings.find((l) => {
      const matchTitle = cleanTitle && (l.title || '').trim().toLowerCase() === cleanTitle;
      const matchUnit = cleanUnit && (
        `${l.district}, ${l.city}`.toLowerCase().includes(cleanUnit) ||
        cleanUnit.includes((l.district || '').toLowerCase())
      );
      const matchThumb = selectedConv.propertyThumbnail && (
        l.images && l.images.some((img) => img === selectedConv.propertyThumbnail)
      );
      return (matchTitle && matchUnit) || (matchTitle && matchThumb) || matchTitle;
    });

    if (matchedListing) {
      router.push(`/listings?detail=${encodeURIComponent(matchedListing.id)}`);
      return;
    }

    // 5. Redirection de secours avec l'identifiant disponible
    if (targetId) {
      router.push(`/listings?detail=${encodeURIComponent(targetId)}`);
    } else {
      router.push('/listings');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv) return;

    const isAuthor = isUserConversationAuthor(selectedConv, user);
    const isVisitor = isUserConversationVisitor(selectedConv, user);
    const isBailleurSide = isAuthor && !isVisitor ? true : isVisitor && !isAuthor ? false : (activeSpace === 'bailleur' || activeSpace === 'demarcheur');
    const myRole = isBailleurSide ? ('bailleur' as const) : ('locataire' as const);
    const myName = user?.name || user?.firstName || (isBailleurSide ? 'Bailleur' : 'Locataire');
    const myAvatar =
      user?.avatarUrl ||
      (isBailleurSide
        ? selectedConv.publisherAvatar || selectedConv.tenantAvatar
        : selectedConv.visitorAvatar) ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';

    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const nowIso = new Date().toISOString();

    const newMessage: Message = {
      id: `m-${Date.now()}`,
      sender: 'me',
      senderRole: myRole,
      senderName: myName,
      senderAvatar: myAvatar,
      text: inputText,
      time: nowTime,
      status: 'sent',
    };

    const updatedConv: Conversation = {
      ...selectedConv,
      messages: [...selectedConv.messages, newMessage],
      lastMessage: inputText,
      lastMessageTime: nowTime,
      unreadCount: 1,
      hasUnread: true,
      unreadBy: isBailleurSide ? 'locataire' : 'bailleur',
    };

    setSelectedConvId(updatedConv.id);
    saveConversations(conversations.map((c) => (c.id === updatedConv.id ? updatedConv : c)));
    setInputText('');

    // Si c'est le bailleur qui répond, notifier le locataire dans sa cloche
    if (isBailleurSide) {
      const recipientName = selectedConv.visitorName || selectedConv.tenantName || 'Locataire';
      const recipientEmail = selectedConv.visitorEmail;
      const recipientPhone = selectedConv.visitorPhone;

      TenantNotificationService.addNotification({
        title: `💬 Réponse de votre bailleur : ${selectedConv.propertyTitle}`,
        message: `${myName} vous a répondu : « ${inputText.slice(0, 70)}${inputText.length > 70 ? '...' : ''} »`,
        createdAt: nowIso,
        time: nowTime,
        type: 'chat_message',
        read: false,
        link: `/messages?convId=${encodeURIComponent(selectedConv.id)}`,
        tenantName: recipientName,
        tenantEmail: recipientEmail,
        tenantPhone: recipientPhone,
        recipientName: recipientName,
        recipientEmail: recipientEmail,
        recipientPhone: recipientPhone,
        actor: myName,
        actionLabel: 'Lire le message',
      });
    } else {
      // Si c'est un locataire/candidat qui répond ou écrit au bailleur, notifier le bailleur dans sa cloche
      const landlordNotif: LandlordNotification = {
        id: `notif-msg-${Date.now()}`,
        title: `💬 Nouveau message : ${selectedConv.propertyTitle}`,
        message: `${myName} vous a répondu : « ${inputText.slice(0, 70)}${inputText.length > 70 ? '...' : ''} »`,
        createdAt: nowIso,
        time: nowTime,
        timestamp: new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        type: 'message_received',
        read: false,
        listingId: selectedConv.listingId,
        convId: selectedConv.id,
        tenantName: myName,
        property: selectedConv.propertyTitle,
        unit: selectedConv.propertyUnit,
        visitorName: selectedConv.visitorName,
        visitorPhone: selectedConv.visitorPhone,
        authorId: selectedConv.authorId,
        authorEmail: selectedConv.authorEmail,
        authorPhone: selectedConv.authorPhone,
      };
      LeaseService.addLandlordNotification(landlordNotif);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('locagestion:conversations_updated'));
      window.dispatchEvent(new CustomEvent('locagestion:notifications_updated'));
      window.dispatchEvent(new CustomEvent('locagestion:tenant_notifications_updated'));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const handleAttachDocument = () => {
    if (!selectedConv) return;
    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const docMessage: Message = {
      id: `m-doc-${Date.now()}`,
      sender: 'me',
      senderName: user?.name || 'Moi',
      text: '📄 Pièce jointe : Document_Officiel_Certifie.pdf (Transmis)',
      time: nowTime,
      status: 'sent',
    };

    const updatedConv: Conversation = {
      ...selectedConv,
      messages: [...selectedConv.messages, docMessage],
      lastMessage: '📄 Quittance de loyer transmise',
      lastMessageTime: nowTime,
    };

    setSelectedConvId(updatedConv.id);
    saveConversations(conversations.map((c) => (c.id === updatedConv.id ? updatedConv : c)));
    showToast('Document officiel attaché et transmis dans la conversation !');
  };

  const handleAttachPhoto = () => {
    if (!selectedConv) return;
    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const photoMessage: Message = {
      id: `m-img-${Date.now()}`,
      sender: 'me',
      senderName: user?.name || 'Moi',
      text: 'Voici la photo récente du logement et des équipements :',
      time: nowTime,
      status: 'sent',
      imageUrl: selectedConv.propertyThumbnail,
    };

    const updatedConv: Conversation = {
      ...selectedConv,
      messages: [...selectedConv.messages, photoMessage],
      lastMessage: '📷 Photo du logement envoyée',
      lastMessageTime: nowTime,
    };

    setSelectedConvId(updatedConv.id);
    saveConversations(conversations.map((c) => (c.id === updatedConv.id ? updatedConv : c)));
    showToast('Photo du logement transmise dans la conversation !');
  };

  const handleToggleArchive = () => {
    if (!selectedConv) return;
    setOptionsMenuOpen(false);
    const updatedConv: Conversation = {
      ...selectedConv,
      isArchived: !selectedConv.isArchived,
    };
    setSelectedConvId(updatedConv.id);
    saveConversations(conversations.map((c) => (c.id === updatedConv.id ? updatedConv : c)));
    showToast(
      !selectedConv.isArchived
        ? 'Conversation archivée avec succès.'
        : 'Conversation réintégrée dans la boîte principale.'
    );
  };

  return (
    <div className="h-screen bg-[#F4F6F9] text-slate-900 flex overflow-hidden">
      {/* 1. Dark Sidebar (StayWise Style) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSpace={activeSpace}
        onSpaceChange={switchSpace}
      />

      {/* 2. Main 3-Panel Messaging View */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72 h-full">
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenQuickAction={() => {}}
        />

        {/* 3-Panel Content Wrapper */}
        <div className="flex-1 flex flex-col overflow-hidden p-2.5 sm:p-6 gap-2 sm:gap-3">
          {/* Bouton Retour : Cas spécifique "Retour aux Annonces" si ouvert via "Contacter" depuis une annonce, sinon retour standard */}
          {cameFromListings ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push('/listings?restore=1')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black shadow-pink-glow active:scale-95 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-white" />
                <span>← Retour aux Annonces (Continuer ma recherche)</span>
              </button>
            </div>
          ) : (
            <div className={`flex items-center gap-2 ${mobileChatOpen ? 'hidden lg:flex' : 'flex'}`}>
              <button
                type="button"
                onClick={() => router.push(isDemarcheur ? '/listings' : isLandlord ? '/' : '/portal')}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer hover:bg-slate-50"
              >
                <Home className="w-4 h-4 text-slate-600" />
                <span>← Retour {isDemarcheur ? 'aux Annonces & Visites' : isLandlord ? 'au Tableau de bord' : 'à l’Accueil'}</span>
              </button>
            </div>
          )}

          <div className="flex-1 flex overflow-hidden gap-5">
          {/* Middle Panel: Conversations List (StayWise White Card with Pink Pill) */}
          <div
            className={`w-full lg:w-96 bg-white rounded-3xl border border-slate-200/80 shadow-soft flex flex-col overflow-hidden shrink-0 ${
              mobileChatOpen ? 'hidden lg:flex' : 'flex'
            }`}
          >
            {/* Panel Header: Title & Segmented Pills */}
            <div className="p-5 pb-3 border-b border-slate-100">
              <h2 className="text-xl font-black text-slate-900 tracking-tight mb-4">
                Messages
              </h2>

              {/* Segmented Pill Tabs (StayWise Pink Style) */}
              <div className="p-1 bg-slate-100 rounded-2xl flex items-center mb-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('general')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'general'
                      ? 'bg-brand-500 text-white shadow-pink-glow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Boîte Principale</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    activeTab === 'general' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {userConversations.filter((c) => !c.isArchived).length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('archive')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'archive'
                      ? 'bg-brand-500 text-white shadow-pink-glow'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Archives</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    activeTab === 'archive' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {userConversations.filter((c) => c.isArchived).length}
                  </span>
                </button>
              </div>

              {/* Search Box */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher une conversation..."
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {/* Conversations Scrollable List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {isLoading ? (
                <SkeletonTable rows={4} />
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2 mt-8">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-700">Aucun message</h4>
                  <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                    {activeTab === 'general'
                      ? 'Votre boîte de réception est vide. Tous vos échanges apparaîtront ici.'
                      : 'Aucune conversation archivée.'}
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                const isSelected = selectedConv?.id === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => selectAndMarkAsRead(conv)}
                    className={`p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-3 relative ${
                      isSelected
                        ? 'bg-slate-100/90 shadow-sm'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Apartment Thumbnail on the left (as in StayWise) */}
                    <img
                      src={conv.propertyThumbnail}
                      alt={conv.propertyTitle}
                      className="w-12 h-12 rounded-2xl object-cover shrink-0 ring-1 ring-slate-200"
                    />

                    {/* Contact Mini Avatar Overlap */}
                    <div className="relative -ml-5 shrink-0">
                      <img
                        src={getConversationContactAvatar(conv, user, activeSpace)}
                        alt={getConversationContactName(conv, user, activeSpace)}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                      />
                      {conv.isOnline && (
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                      )}
                    </div>

                    {/* Middle Info */}
                    <div className="min-w-0 flex-1 pl-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {getConversationContactName(conv, user, activeSpace)}
                          </h4>
                          {conv.isOnline && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold shrink-0">
                          {conv.lastMessageTime}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 truncate leading-relaxed">
                        {conv.lastMessage}
                      </p>
                    </div>

                    {/* Right Badge / Status */}
                    <div className="shrink-0 flex items-center justify-center">
                      {(() => {
                        const countForUser = getUnreadCountForCurrentUser(conv);
                        if (countForUser > 0) {
                          return (
                            <span className="w-5 h-5 rounded-full bg-brand-500 text-white font-black text-[10px] flex items-center justify-center shadow-md animate-pulse">
                              {countForUser}
                            </span>
                          );
                        }
                        return <CheckCheck className="w-3.5 h-3.5 text-brand-500" />;
                      })()}
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>

          {/* Right Panel: Active Chat Stream (StayWise Faithful Reproduction) */}
          <div
            className={`flex-1 bg-white rounded-3xl border border-slate-200/80 shadow-soft flex flex-col overflow-hidden ${
              mobileChatOpen ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {!selectedConv ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-3">
                  <MessageCircle className="w-8 h-8 text-slate-400" />
                </div>
                <h4 className="text-base font-bold text-slate-700">Aucune conversation active</h4>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Sélectionnez un échange dans la boîte principale ou contactez un utilisateur depuis une annonce.
                </p>
              </div>
            ) : (
              <>
            {/* Conversation Top Header */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-2 sm:gap-4 bg-white/95 backdrop-blur-sm z-10 shrink-0">
              {/* Back to list on mobile */}
              <button
                onClick={() => {
                  setMobileChatOpen(false);
                  if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', '/messages');
                  }
                }}
                className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 active:scale-95 transition-all shrink-0 cursor-pointer"
                title="Retour aux conversations"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Contact & Apartment Info */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
                <button
                  type="button"
                  onClick={handleGoToListing}
                  title="Voir l'annonce du bien"
                  className="relative shrink-0 flex items-center group cursor-pointer text-left focus:outline-none"
                >
                  <img
                    src={selectedConv.propertyThumbnail}
                    alt={selectedConv.propertyTitle}
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl object-cover ring-1 ring-slate-200 group-hover:ring-2 group-hover:ring-brand-500 transition-all group-hover:scale-105 shadow-xs"
                  />
                  <div className="relative -ml-3.5 sm:-ml-4 shrink-0">
                    <img
                      src={getConversationContactAvatar(selectedConv, user, activeSpace)}
                      alt={getConversationContactName(selectedConv, user, activeSpace)}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                    {selectedConv.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                      {getConversationContactName(selectedConv, user, activeSpace)}
                    </h3>
                    {selectedConv.isOnline && (
                      <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                        En ligne
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleGoToListing}
                    title="Cliquer pour accéder à l'annonce du bien"
                    className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 hover:text-brand-600 mt-0.5 min-w-0 overflow-hidden group cursor-pointer text-left transition-colors focus:outline-none"
                  >
                    <span className="truncate shrink min-w-0 group-hover:underline">
                      {selectedConv.propertyUnit}
                    </span>
                    <span className="text-slate-300 shrink-0">•</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 group-hover:bg-brand-50 text-slate-700 group-hover:text-brand-700 font-extrabold text-[10px] sm:text-[11px] whitespace-nowrap shrink-0 transition-colors border border-slate-200/60 group-hover:border-brand-200">
                      {formatFCFA(selectedConv.propertyPrice)}/mois
                    </span>
                    <ExternalLink className="w-2.5 h-2.5 text-slate-400 group-hover:text-brand-600 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity ml-0.5" />
                  </button>
                </div>
              </div>

              {/* Top Action Icons (Voir Annonce, Phone, Options) */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleGoToListing}
                  title="Accéder à l'annonce du bien"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl sm:rounded-2xl bg-brand-50 hover:bg-brand-100 border border-brand-200 text-brand-700 text-[10px] sm:text-xs font-bold transition-all shadow-xs shrink-0 cursor-pointer active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                  <span className="hidden sm:inline">Voir l’annonce</span>
                </button>

                <a
                  href={`tel:${getConversationContactPhone(selectedConv, user, activeSpace).replace(/\s+/g, '')}`}
                  title={`Appeler (${getConversationContactPhone(selectedConv, user, activeSpace)})`}
                  className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
                >
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </a>

                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setOptionsMenuOpen(!optionsMenuOpen)}
                    title="Options de conversation"
                    className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-colors cursor-pointer shrink-0"
                  >
                    <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>

                  {/* Dropdown Menu */}
                  {optionsMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 z-50 text-xs font-bold text-slate-700 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        type="button"
                        onClick={() => {
                          setOptionsMenuOpen(false);
                          handleGoToListing();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-brand-50 text-brand-700 flex items-center gap-2 cursor-pointer font-bold"
                      >
                        <Eye className="w-4 h-4 text-brand-600" />
                        <span>Voir l’annonce du bien</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setOptionsMenuOpen(false);
                          router.push('/tenants');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                      >
                        <UserCheck className="w-4 h-4 text-slate-500" />
                        <span>Fiche locataire & solvabilité</span>
                      </button>

                      <a
                        href={`https://wa.me/2290195444430?text=${encodeURIComponent(
                          `Bonjour ${selectedConv.tenantName}, suite à nos échanges sur la messagerie LOCAGESTION...`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOptionsMenuOpen(false)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-emerald-50 text-emerald-700 flex items-center gap-2 cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span>Contacter sur WhatsApp</span>
                      </a>

                      <button
                        type="button"
                        onClick={handleToggleArchive}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 flex items-center gap-2 cursor-pointer text-slate-600"
                      >
                        <Archive className="w-4 h-4 text-slate-400" />
                        <span>{selectedConv.isArchived ? 'Désarchiver' : 'Archiver la conversation'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Chat Messages Stream */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4 bg-[#FAFBFD]">
              {selectedConv.messages.map((msg) => {
                const isMe = isMessageSentByCurrentUser(msg, user, activeSpace, selectedConv);

                return (
                  <div
                    key={msg.id}
                    className={`flex items-end gap-2 sm:gap-3 ${
                      isMe ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {/* Left avatar for received message */}
                    {!isMe && (
                      <img
                        src={msg.senderAvatar || getConversationContactAvatar(selectedConv, user, activeSpace)}
                        alt={msg.senderName}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 mb-1 ring-1 ring-slate-200"
                      />
                    )}

                    {/* Bubble Container */}
                    <div className="max-w-[85%] sm:max-w-md space-y-1">
                      {/* Name tag on received message */}
                      {!isMe && (
                        <span className="text-[10px] font-bold text-slate-400 pl-3">
                          {msg.senderName}
                        </span>
                      )}

                      <div
                        className={`p-3.5 sm:p-4 rounded-3xl text-xs leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-brand-500 text-white rounded-br-none shadow-pink-glow'
                            : 'bg-slate-100 text-slate-800 rounded-bl-none'
                        }`}
                      >
                        {/* Image attachment if any */}
                        {msg.imageUrl && (
                          <div className="rounded-2xl overflow-hidden mb-2.5 ring-2 ring-white/20">
                            <img
                              src={msg.imageUrl}
                              alt="Photo"
                              className="w-full h-40 sm:h-44 object-cover"
                            />
                          </div>
                        )}

                        {/* Text */}
                        {msg.text && <p className="whitespace-pre-wrap">{msg.text}</p>}

                        {/* Timestamp & Checkmarks */}
                        <div
                          className={`flex items-center justify-end gap-1 text-[10px] mt-1.5 ${
                            isMe ? 'text-white/80' : 'text-slate-400'
                          }`}
                        >
                          <span>{msg.time}</span>
                          {isMe && <CheckCheck className="w-3.5 h-3.5 text-white" />}
                        </div>
                      </div>
                    </div>

                    {/* Right avatar for sent message */}
                    {isMe && (
                      <img
                        src={
                          msg.senderAvatar ||
                          user?.avatarUrl ||
                          ((activeSpace === 'bailleur' || activeSpace === 'demarcheur')
                            ? selectedConv.publisherAvatar || selectedConv.tenantAvatar
                            : selectedConv.visitorAvatar) ||
                          "https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=160&auto=format&fit=crop&q=80"
                        }
                        alt={user?.name || "Moi"}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 mb-1 ring-1 ring-brand-500/50"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Anti-fraud banner */}
            <div className="px-3 sm:px-6 py-2 bg-amber-50 border-t border-amber-200/60 flex items-center justify-between text-[10px] sm:text-[11px] text-amber-900 shrink-0">
              <span className="flex items-center gap-1.5 font-semibold leading-tight">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Sécurité : Ne versez jamais de caution avant visite physique.</span>
              </span>
              <span className="font-bold text-amber-700 hidden md:inline shrink-0">UEMOA & CEMAC</span>
            </div>

            {/* Message Input Box (Bottom) */}
            <form onSubmit={handleSendMessage} className="p-2.5 sm:p-4 bg-white border-t border-slate-100 flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <button
                  type="button"
                  onClick={handleAttachDocument}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Attacher un document (Quittance, bail, pièce)"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleAttachPhoto}
                  className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Attacher une photo du logement"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
              </div>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Répondre à ${getConversationContactName(selectedConv, user, activeSpace)}...`}
                className="flex-1 min-w-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />

              <button
                type="submit"
                className="py-2 sm:py-2.5 px-3 sm:px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-pink-glow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
              >
                <span className="hidden xs:inline">Envoyer</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
            </>
            )}
          </div>
        </div>
      </div>
      </div>

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

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F6F9] p-8 flex items-center justify-center">
          <SkeletonTable rows={4} />
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}

