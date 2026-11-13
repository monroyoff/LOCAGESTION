'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { UserSpace } from '@/lib/types';
import { useSpace } from '@/lib/context/space-context';
import { notifyAction } from '@/lib/notifications/action-notifier';

interface Message {
  id: string;
  sender: 'them' | 'me';
  senderName: string;
  text?: string;
  imageUrl?: string;
  time: string;
  status: 'sent' | 'delivered' | 'read';
}

interface Conversation {
  id: string;
  tenantName: string;
  tenantAvatar: string;
  isOnline: boolean;
  propertyTitle: string;
  propertyUnit: string;
  propertySurface: string; // "55 m²"
  propertyPrice: number; // FCFA/mois
  propertyThumbnail: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  isRead?: boolean;
  isArchived?: boolean;
  messages: Message[];
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-01',
    tenantName: 'Edwin Johnson',
    tenantAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    isOnline: true,
    propertyTitle: 'Résidence Les Cocotiers',
    propertyUnit: 'Appartement 2 Pièces',
    propertySurface: '55 m²',
    propertyPrice: 180000,
    propertyThumbnail: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=160&auto=format&fit=crop&q=80',
    lastMessage: 'D’accord très bien ! Y a-t-il une place de parking réservée ?',
    lastMessageTime: '09:01',
    isRead: true,
    messages: [
      {
        id: 'm1',
        sender: 'them',
        senderName: 'Edwin Johnson',
        text: 'Bonjour M. Diallo ! Je suis très intéressé par l’appartement 2 pièces à Haie Vive que j’ai vu sur votre annonce. Est-il toujours disponible pour une entrée début décembre ?',
        time: '08:35',
        status: 'read',
      },
      {
        id: 'm2',
        sender: 'me',
        senderName: 'Mamadou Diallo',
        text: 'Bonjour Edwin ! Oui, il est parfaitement disponible. Pour confirmer votre dossier, serez-vous seul ou accompagné ?',
        time: '08:51',
        status: 'read',
      },
      {
        id: 'm3',
        sender: 'them',
        senderName: 'Edwin Johnson',
        text: 'Ce sera pour moi et mon épouse. Nous cherchons un cadre calme et sécurisé avec balcon.',
        time: '08:54',
        status: 'read',
      },
      {
        id: 'm4',
        sender: 'them',
        senderName: 'Edwin Johnson',
        text: 'Pouvez-vous me montrer la vue depuis le balcon du séjour ?',
        time: '08:55',
        status: 'read',
      },
      {
        id: 'm5',
        sender: 'me',
        senderName: 'Mamadou Diallo',
        imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
        text: 'Voici la terrasse principale orientée Sud-Est sans vis-à-vis !',
        time: '08:59',
        status: 'read',
      },
      {
        id: 'm6',
        sender: 'them',
        senderName: 'Edwin Johnson',
        text: 'D’accord très bien ! Y a-t-il une place de parking réservée ?',
        time: '09:01',
        status: 'read',
      },
    ],
  },
  {
    id: 'conv-02',
    tenantName: 'Albert Flores',
    tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    isOnline: false,
    propertyTitle: 'Immeuble Palmier Royal',
    propertyUnit: 'Studio Meublé B12',
    propertySurface: '32 m²',
    propertyPrice: 140000,
    propertyThumbnail: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=160&auto=format&fit=crop&q=80',
    lastMessage: 'Parfait, je transmets mon attestation de travail.',
    lastMessageTime: '10:37',
    isRead: true,
    messages: [
      {
        id: 'm20',
        sender: 'them',
        senderName: 'Albert Flores',
        text: 'Bonjour, je viens de finaliser mon dossier locatif sur LOCAGESTION.',
        time: '10:35',
        status: 'read',
      },
      {
        id: 'm21',
        sender: 'me',
        senderName: 'Mamadou Diallo',
        text: 'Bien reçu Albert, nous étudions votre profil.',
        time: '10:36',
        status: 'read',
      },
      {
        id: 'm22',
        sender: 'them',
        senderName: 'Albert Flores',
        text: 'Parfait, je transmets mon attestation de travail.',
        time: '10:37',
        status: 'read',
      },
    ],
  },
  {
    id: 'conv-03',
    tenantName: 'Annette Black',
    tenantAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&auto=format&fit=crop&q=80',
    isOnline: true,
    propertyTitle: 'Villa Émeraude',
    propertyUnit: 'Villa R+1 Ouest',
    propertySurface: '180 m²',
    propertyPrice: 350000,
    propertyThumbnail: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=160&auto=format&fit=crop&q=80',
    lastMessage: 'Bonjour, j’arriverai demain matin vers 10h pour l’état des lieux.',
    lastMessageTime: '09:15',
    unreadCount: 1,
    messages: [
      {
        id: 'm30',
        sender: 'them',
        senderName: 'Annette Black',
        text: 'Bonjour, j’arriverai demain matin vers 10h pour l’état des lieux.',
        time: '09:15',
        status: 'delivered',
      },
    ],
  },
  {
    id: 'conv-04',
    tenantName: 'Jerome Bell',
    tenantAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&auto=format&fit=crop&q=80',
    isOnline: false,
    propertyTitle: 'Résidence Marina Golfe',
    propertyUnit: 'Boutique Commerciale RDC',
    propertySurface: '60 m²',
    propertyPrice: 150000,
    propertyThumbnail: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=160&auto=format&fit=crop&q=80',
    lastMessage: 'J’ai bien reçu le reçu de mon virement d’avance de loyer.',
    lastMessageTime: 'Jeu',
    isRead: true,
    messages: [],
  },
  {
    id: 'conv-05',
    tenantName: 'Darrell Steward',
    tenantAvatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=160&auto=format&fit=crop&q=80',
    isOnline: true,
    propertyTitle: 'Résidence Les Cocotiers',
    propertyUnit: 'Appt A3',
    propertySurface: '75 m²',
    propertyPrice: 220000,
    propertyThumbnail: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=160&auto=format&fit=crop&q=80',
    lastMessage: 'Merci pour le passage rapide du technicien de climatisation.',
    lastMessageTime: 'Jeu',
    isRead: true,
    messages: [],
  },
  {
    id: 'conv-06',
    tenantName: 'Steven Jordan',
    tenantAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    isOnline: false,
    propertyTitle: 'Immeuble Palmier Royal',
    propertyUnit: 'Appt 4B',
    propertySurface: '68 m²',
    propertyPrice: 240000,
    propertyThumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=160&auto=format&fit=crop&q=80',
    lastMessage: 'Je confirme la date de signature électronique du bail.',
    lastMessageTime: 'Mer',
    unreadCount: 2,
    messages: [],
  },
];

export default function MessagesPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeSpace, switchSpace, isLandlord, isTenant, isDemarcheur } = useSpace();
  const [activeTab, setActiveTab] = useState<'general' | 'archive'>('general');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConv, setSelectedConv] = useState<Conversation>(MOCK_CONVERSATIONS[0]);
  const [inputText, setInputText] = useState('');
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [optionsMenuOpen, setOptionsMenuOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    notifyAction(msg, 'Messagerie en direct', 'success');
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredConversations = MOCK_CONVERSATIONS.filter((c) => {
    const matchesTab = activeTab === 'general' ? !c.isArchived : c.isArchived;
    const matchesSearch =
      c.tenantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.propertyTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: `m-${Date.now()}`,
      sender: 'me',
      senderName: 'Mamadou Diallo',
      text: inputText,
      time: 'À l’instant',
      status: 'sent',
    };

    setSelectedConv((prev) => ({
      ...prev,
      messages: [...prev.messages, newMessage],
      lastMessage: inputText,
      lastMessageTime: 'À l’instant',
    }));

    setInputText('');
  };

  const handleAttachDocument = () => {
    const docMessage: Message = {
      id: `m-doc-${Date.now()}`,
      sender: 'me',
      senderName: 'Mamadou Diallo',
      text: '📄 Pièce jointe : Quittance_Loyer_Certifiee_REC-2026-088.pdf (Transmis)',
      time: 'À l’instant',
      status: 'sent',
    };

    setSelectedConv((prev) => ({
      ...prev,
      messages: [...prev.messages, docMessage],
      lastMessage: '📄 Quittance de loyer transmise',
      lastMessageTime: 'À l’instant',
    }));
    showToast('Document officiel attaché et transmis dans la conversation !');
  };

  const handleAttachPhoto = () => {
    const photoMessage: Message = {
      id: `m-img-${Date.now()}`,
      sender: 'me',
      senderName: 'Mamadou Diallo',
      text: 'Voici la photo récente du logement et des équipements :',
      time: 'À l’instant',
      status: 'sent',
      imageUrl: selectedConv.propertyThumbnail,
    };

    setSelectedConv((prev) => ({
      ...prev,
      messages: [...prev.messages, photoMessage],
      lastMessage: '📷 Photo du logement envoyée',
      lastMessageTime: 'À l’instant',
    }));
    showToast('Photo du logement transmise dans la conversation !');
  };

  const handleToggleArchive = () => {
    setOptionsMenuOpen(false);
    setSelectedConv((prev) => ({
      ...prev,
      isArchived: !prev.isArchived,
    }));
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
          {/* Bouton Retour Accueil sur Mobile & Desktop (masqué sur mobile quand le chat est ouvert pour maximiser l'espace) */}
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
                    6
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
                    2
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
              {filteredConversations.map((conv) => {
                const isSelected = selectedConv.id === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setSelectedConv(conv);
                      setMobileChatOpen(true);
                    }}
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
                        src={conv.tenantAvatar}
                        alt={conv.tenantName}
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
                            {conv.tenantName}
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
                      {conv.unreadCount ? (
                        <span className="w-5 h-5 rounded-full bg-brand-500 text-white font-black text-[10px] flex items-center justify-center shadow-md">
                          {conv.unreadCount}
                        </span>
                      ) : (
                        <CheckCheck className="w-3.5 h-3.5 text-brand-500" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Active Chat Stream (StayWise Faithful Reproduction) */}
          <div
            className={`flex-1 bg-white rounded-3xl border border-slate-200/80 shadow-soft flex flex-col overflow-hidden ${
              mobileChatOpen ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Conversation Top Header */}
            <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between gap-2 sm:gap-4 bg-white/95 backdrop-blur-sm z-10 shrink-0">
              {/* Back to list on mobile */}
              <button
                onClick={() => setMobileChatOpen(false)}
                className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 active:scale-95 transition-all shrink-0 cursor-pointer"
                title="Retour aux conversations"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              {/* Contact & Apartment Info */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
                <div className="relative shrink-0 flex items-center">
                  <img
                    src={selectedConv.propertyThumbnail}
                    alt={selectedConv.propertyTitle}
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl object-cover ring-1 ring-slate-200"
                  />
                  <div className="relative -ml-3.5 sm:-ml-4 shrink-0">
                    <img
                      src={selectedConv.tenantAvatar}
                      alt={selectedConv.tenantName}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                    {selectedConv.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 truncate">
                      {selectedConv.tenantName}
                    </h3>
                    {selectedConv.isOnline && (
                      <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                        En ligne
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500 mt-0.5 min-w-0 overflow-hidden">
                    <span className="truncate shrink min-w-0">
                      {selectedConv.propertyUnit}
                    </span>
                    <span className="text-slate-300 shrink-0">•</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 font-extrabold text-[10px] sm:text-[11px] whitespace-nowrap shrink-0">
                      {formatFCFA(selectedConv.propertyPrice)}/mois
                    </span>
                  </div>
                </div>
              </div>

              {/* Top Action Icons (Phone, Options) */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <a
                  href={`tel:+2290195444430`}
                  title="Appeler"
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
                const isMe = msg.sender === 'me';

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
                        src={selectedConv.tenantAvatar}
                        alt={msg.senderName}
                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover shrink-0 mb-1"
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
                        {msg.text && <p>{msg.text}</p>}

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
                        src="https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=160&auto=format&fit=crop&q=80"
                        alt="Mamadou Diallo"
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
                placeholder={`Répondre à ${selectedConv.tenantName}...`}
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

