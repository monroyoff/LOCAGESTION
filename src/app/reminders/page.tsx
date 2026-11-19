'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  BellRing,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  Mail,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  History,
  Sparkles,
  X,
  Home,
  Plus,
  Scale,
  Download,
  Search,
  Filter,
  FileText,
  User,
  Building2,
  Tag,
  Hammer,
  DoorOpen,
  CalendarCheck,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { UserSpace } from '@/lib/types';
import { WhatsAppReminderModal } from '@/components/dashboard/WhatsAppReminderModal';
import { notifyAction } from '@/lib/notifications/action-notifier';
import {
  Notice,
  NoticeService,
  NoticeReasonType,
  NOTICE_REASONS_CATALOG,
} from '@/lib/services/notice-service';
import { IssueNoticeModal } from '@/components/reminders/IssueNoticeModal';
import { NoticeDetailsModal } from '@/components/reminders/NoticeDetailsModal';
import { NoticeEmailModal } from '@/components/reminders/NoticeEmailModal';
import { generateNoticePDF } from '@/lib/export/pdf-download';
import { useAuth } from '@/lib/context/space-context';

export default function RemindersCenterPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState<UserSpace>('bailleur');
  const [collectiveAuto, setCollectiveAuto] = useState(true);
  const [selectedReminderTarget, setSelectedReminderTarget] = useState<any | null>(null);
  const [showCollectiveModal, setShowCollectiveModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tabs : Relances d'impayés vs Préavis formels
  const [activeTab, setActiveTab] = useState<'relances' | 'preavis'>('relances');

  // Gestion des Préavis
  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticeSearch, setNoticeSearch] = useState('');
  const [selectedReasonFilter, setSelectedReasonFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [showIssueNoticeModal, setShowIssueNoticeModal] = useState(false);
  const [selectedNoticeForDetails, setSelectedNoticeForDetails] = useState<Notice | null>(null);
  const [selectedNoticeForEmail, setSelectedNoticeForEmail] = useState<Notice | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setNotices(NoticeService.getNotices());
    };
    handleUpdate();
    window.addEventListener('locagestion:notices_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('locagestion:notices_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const refreshNotices = () => {
    setNotices(NoticeService.getNotices());
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    notifyAction(msg, 'Relance transmise !', 'success');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const pendingOverdue: any[] = [];
  const reminderLogs: any[] = [];

  // Filtrage des préavis
  const filteredNotices = notices.filter((n) => {
    const matchSearch =
      noticeSearch.trim() === '' ||
      n.tenantName.toLowerCase().includes(noticeSearch.toLowerCase()) ||
      n.propertyName.toLowerCase().includes(noticeSearch.toLowerCase()) ||
      n.id.toLowerCase().includes(noticeSearch.toLowerCase()) ||
      n.reasonTitle.toLowerCase().includes(noticeSearch.toLowerCase());

    const matchReason =
      selectedReasonFilter === 'all' || n.reasonType === selectedReasonFilter;

    const matchStatus =
      selectedStatusFilter === 'all' || n.status === selectedStatusFilter;

    return matchSearch && matchReason && matchStatus;
  });

  const activeNoticesCount = notices.filter(
    (n) => n.status === 'en_cours' || n.status === 'notifie'
  ).length;

  const calculateDaysRemaining = (effectiveDateStr: string): number => {
    try {
      const parts = effectiveDateStr.split('/');
      if (parts.length === 3) {
        const targetDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        const today = new Date();
        const diffMs = targetDate.getTime() - today.getTime();
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }
      return 0;
    } catch {
      return 0;
    }
  };

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
          onOpenQuickAction={() => {}}
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

          {/* Header Principal */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Centre de Relances & Préavis Légaux
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-brand-50 text-brand-600 border border-brand-200">
                  UEMOA & OHADA
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Planification des rappels de loyer, relances d'impayés et émission des préavis formels pour différents motifs légaux.
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('preavis');
                  setShowIssueNoticeModal(true);
                }}
                className="py-2.5 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 flex items-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Émettre un Préavis Formel</span>
              </button>
            </div>
          </div>

          {/* Onglets de Navigation Principale : Relances vs Préavis */}
          <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300/60 max-w-md">
            <button
              type="button"
              onClick={() => setActiveTab('relances')}
              className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'relances'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BellRing className="w-3.5 h-3.5 text-blue-600" />
              <span>Relances & Rappels</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-blue-100 text-blue-800">
                {pendingOverdue.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('preavis')}
              className={`flex-1 py-2 px-3.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                activeTab === 'preavis'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5 text-rose-600" />
              <span>Préavis & Congés</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-100 text-rose-800">
                {activeNoticesCount}
              </span>
            </button>
          </div>

          {/* ==================================================================== */}
          {/* VUE 1 : RELANCES AUTOMATIQUES & RAPPELS DU 25 / 5                    */}
          {/* ==================================================================== */}
          {activeTab === 'relances' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 2 Core Rules Cards (Le 25 et Le 5) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Règle 1: Rappel collectif du 25 */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">
                            Rappel Collectif Informatif
                          </h3>
                          <span className="text-[10px] text-blue-600 font-bold block">
                            Chaque 25 du mois à 09:00
                          </span>
                        </div>
                      </div>

                      {/* Toggle */}
                      <button
                        type="button"
                        onClick={() => setCollectiveAuto(!collectiveAuto)}
                        className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                          collectiveAuto ? 'bg-brand-500' : 'bg-slate-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            collectiveAuto ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Prévient courtoisement l'ensemble des <strong>28 locataires actifs</strong> du loyer à venir pour le mois suivant, avec rappel des coordonnées Wave et Mobile Money.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Prochain envoi : <strong>25/11/2026</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCollectiveModal(true)}
                      className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                    >
                      Envoyer manuellement
                    </button>
                  </div>
                </div>

                {/* Règle 2: Relances d'impayés à partir du 5 */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-slate-900">
                            Relances Ciblées sur Impayés
                          </h3>
                          <span className="text-[10px] text-rose-600 font-bold block">
                            À partir du 5 de chaque mois
                          </span>
                        </div>
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                        {pendingOverdue.length} en attente
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      S'active uniquement pour les échéances impayées ou partielles, avec escalade paramétrable (Courtois, Ferme, Mise en demeure). S'arrête instantanément dès encaissement.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Canaux : WhatsApp Direct & SMS</span>
                    <span className="text-xs font-extrabold text-emerald-600">Actif en continu ✓</span>
                  </div>
                </div>
              </div>

              {/* Pending Overdue Tenants Action List */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-slate-900">
                    Locataires en Retard Nécessitant une Relance Immédiate ({pendingOverdue.length})
                  </h3>
                  <span className="text-xs text-slate-400">
                    Exercice Octobre 2026
                  </span>
                </div>

                {pendingOverdue.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                    <p className="font-bold text-slate-700">Aucun locataire en retard d'échéance</p>
                    <p className="text-[11px] text-slate-400">Tous vos loyers sont à jour pour le moment.</p>
                  </div>
                ) : (
                <div className="divide-y divide-slate-100">
                  {pendingOverdue.map((item) => (
                    <div
                      key={item.id}
                      className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-xs text-slate-900">{item.tenantName}</h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                            +{item.daysLate} jours de retard
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">
                          {item.property} • Échéance : {item.period}
                        </span>
                        <span className="text-xs font-black text-rose-600 block mt-1">
                          Reste dû : {formatFCFA(item.expectedAmount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('preavis');
                            setShowIssueNoticeModal(true);
                          }}
                          className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                          title="Émettre un préavis pour motif d'impayé persistant"
                        >
                          Préavis d'impayé
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedReminderTarget({
                              tenantName: item.tenantName,
                              tenantPhone: item.tenantPhone,
                              propertyName: item.property,
                              unitNumber: 'Appt',
                              expectedAmount: item.expectedAmount,
                              period: item.period,
                            })
                          }
                          className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>Relancer sur WhatsApp</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                )}
              </div>

              {/* Delivery Logs */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-4">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-slate-500" />
                  <span>Journal Récent d’Exécution des Relances</span>
                </h3>

                {reminderLogs.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    Aucun historique de relance récent enregistré.
                  </div>
                ) : (
                <div className="divide-y divide-slate-100 text-xs">
                  {reminderLogs.map((log) => (
                    <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-bold text-slate-800 block">{log.type}</span>
                        <span className="text-[11px] text-slate-400">
                          {log.date} • Destinataires : {log.recipients} ({log.channel})
                        </span>
                      </div>
                      <span className="text-[11px] font-black text-emerald-600 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
                )}
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* VUE 2 : PRÉAVIS DE CONGÉ & MOTIFS LÉGAUX DE RÉSILIATION              */}
          {/* ==================================================================== */}
          {activeTab === 'preavis' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 4 Cartes Métriques Synthétiques */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Préavis en Cours
                    </span>
                    <span className="p-1 rounded-lg bg-rose-50 text-rose-600">
                      <Scale className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <span className="text-xl font-black text-slate-900 block">
                    {activeNoticesCount} dossiers
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Délais légaux respectés
                  </span>
                </div>

                <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Reprise & Vente
                    </span>
                    <span className="p-1 rounded-lg bg-blue-50 text-blue-600">
                      <Home className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <span className="text-xl font-black text-blue-700 block">
                    {
                      notices.filter(
                        (n) =>
                          n.reasonType === 'reprise_personnelle' ||
                          n.reasonType === 'vente'
                      ).length
                    }{' '}
                    dossiers
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Droit de préemption & famille
                  </span>
                </div>

                <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Impayés & Fautes
                    </span>
                    <span className="p-1 rounded-lg bg-amber-50 text-amber-600">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <span className="text-xl font-black text-amber-700 block">
                    {
                      notices.filter((n) => n.reasonType === 'impayes_manquements')
                        .length
                    }{' '}
                    dossiers
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Procédure résolutoire
                  </span>
                </div>

                <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-soft">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400">
                      Travaux & Rénovation
                    </span>
                    <span className="p-1 rounded-lg bg-purple-50 text-purple-600">
                      <Hammer className="w-3.5 h-3.5" />
                    </span>
                  </div>
                  <span className="text-xl font-black text-purple-700 block">
                    {
                      notices.filter((n) => n.reasonType === 'travaux_majeurs')
                        .length
                    }{' '}
                    dossier
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Salubrité & BTP
                  </span>
                </div>
              </div>

              {/* Motifs Légaux de Préavis Reconnus (Guide & Filtres Rapides) */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-soft space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Motifs Légaux de Préavis Éligibles (Droit UEMOA / OHADA)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Cliquez sur un motif pour filtrer le registre ou vérifier les règles applicables.
                    </p>
                  </div>
                  {selectedReasonFilter !== 'all' && (
                    <button
                      type="button"
                      onClick={() => setSelectedReasonFilter('all')}
                      className="text-xs font-bold text-brand-600 hover:text-brand-700 underline cursor-pointer"
                    >
                      Réinitialiser le filtre
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-1">
                  {NOTICE_REASONS_CATALOG.map((item) => {
                    const isSelected = selectedReasonFilter === item.type;
                    const count = notices.filter((n) => n.reasonType === item.type).length;
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() =>
                          setSelectedReasonFilter(isSelected ? 'all' : item.type)
                        }
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-brand-500'
                            : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                      >
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full block w-fit mb-1 ${
                            isSelected
                              ? 'bg-brand-500 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {item.recommendedMonths} mois
                        </span>
                        <h4
                          className={`text-[11px] font-bold leading-tight line-clamp-2 ${
                            isSelected ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <span
                          className={`text-[10px] font-black mt-1 block ${
                            isSelected ? 'text-brand-300' : 'text-slate-500'
                          }`}
                        >
                          {count} {count > 1 ? 'dossiers' : 'dossier'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Registre des Préavis : Recherche, Filtres & Table */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      Registre Officiel des Préavis Émis ({filteredNotices.length})
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Suivi des notifications de congé, décompte des délais et téléchargement des actes officiels.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Recherche */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={noticeSearch}
                        onChange={(e) => setNoticeSearch(e.target.value)}
                        placeholder="Rechercher préavis, locataire..."
                        className="pl-8 pr-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                    </div>

                    {/* Filtre Statut */}
                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value)}
                      className="py-1.5 px-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                    >
                      <option value="all">Tous les statuts</option>
                      <option value="en_cours">En cours de préavis</option>
                      <option value="notifie">Signifié par Huissier</option>
                      <option value="cloture">Clôturé (Lieux libérés)</option>
                      <option value="annule">Annulé</option>
                    </select>
                  </div>
                </div>

                {filteredNotices.length === 0 ? (
                  <div className="p-10 text-center rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
                    <Scale className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-700">
                      {notices.length === 0
                        ? 'Aucun dossier de préavis enregistré'
                        : 'Aucun préavis ne correspond à vos critères de recherche'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {notices.length === 0
                        ? 'Votre registre des congés et résiliations est vierge. Les préavis émis apparaîtront ici.'
                        : 'Modifiez vos filtres ou réinitialisez votre recherche pour afficher vos dossiers.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    {filteredNotices.map((item) => {
                      const days = calculateDaysRemaining(item.effectiveDate);
                      return (
                        <div
                          key={item.id}
                          className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-xs font-black text-slate-900 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                                {item.id}
                              </span>
                              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                {item.reasonTitle}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                Mode : {item.deliveryMethod.toUpperCase()}
                              </span>
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs">
                              <h4 className="font-black text-slate-900 text-sm">
                                {item.tenantName}
                              </h4>
                              <span className="hidden sm:inline text-slate-300">•</span>
                              <span className="text-slate-600 font-medium">
                                {item.propertyName} ({item.unitNumber})
                              </span>
                              <span className="hidden sm:inline text-slate-300">•</span>
                              <span className="text-slate-700 font-bold">
                                {formatFCFA(item.monthlyRent)}/mois
                              </span>
                            </div>

                            <p className="text-[11px] text-slate-500 line-clamp-1">
                              « {item.reasonDetails} »
                            </p>

                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                              <span>
                                Notifié le : <strong>{item.noticeDate}</strong>
                              </span>
                              <span>
                                Libération exigible : <strong>{item.effectiveDate}</strong>
                              </span>
                              <span
                                className={`font-black px-2 py-0.5 rounded-full ${
                                  days > 30
                                    ? 'bg-blue-100 text-blue-800'
                                    : days > 0
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {days > 0 ? `J-${days} restants` : 'Échéance dépassée'}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
                            <button
                              type="button"
                              onClick={() => setSelectedNoticeForDetails(item)}
                              className="py-2 px-3.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                            >
                              Détails
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                generateNoticePDF(item);
                                notifyAction(
                                  `PDF officiel du préavis ${item.id} généré.`,
                                  'Téléchargement PDF',
                                  'success'
                                );
                              }}
                              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                              title="Télécharger l'acte officiel en PDF"
                            >
                              <Download className="w-3.5 h-3.5 text-slate-600" />
                              <span>PDF</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => setSelectedNoticeForEmail(item)}
                              className="py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                              title="Notifier formellement par Email"
                            >
                              <Mail className="w-3.5 h-3.5 text-blue-600" />
                              <span>Email</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const phoneClean = item.tenantPhone.replace(/[^0-9]/g, '');
                                const senderName = user?.companyName || user?.name || 'La Direction du Patrimoine';
                                const msg = `*NOTIFICATION DE PRÉAVIS DE CONGÉ*\n\nBonjour M./Mme *${item.tenantName}*,\n\nNous vous informons que votre préavis de congé pour votre logement *${item.propertyName} (${item.unitNumber})* arrive à échéance le *${item.effectiveDate}*.\n\n📌 *Motif :* ${item.reasonTitle}\n\nMerci de contacter la gestion pour coordonner l'état des lieux de sortie.\n\n*${senderName}*`;
                                window.open(
                                  `https://wa.me/${phoneClean}?text=${encodeURIComponent(msg)}`,
                                  '_blank'
                                );
                              }}
                              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>WhatsApp</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modale d'Émission d'un Préavis Formel */}
      {showIssueNoticeModal && (
        <IssueNoticeModal
          isOpen={showIssueNoticeModal}
          onClose={() => setShowIssueNoticeModal(false)}
          onNoticeCreated={() => {
            refreshNotices();
          }}
        />
      )}

      {/* Modale de Consultation et Gestion d'un Préavis */}
      {selectedNoticeForDetails && (
        <NoticeDetailsModal
          notice={selectedNoticeForDetails}
          onClose={() => setSelectedNoticeForDetails(null)}
          onNoticeUpdated={() => {
            refreshNotices();
          }}
          onOpenEmail={(notice) => setSelectedNoticeForEmail(notice)}
        />
      )}

      {/* Modale d'Aperçu & Notification Email */}
      {selectedNoticeForEmail && (
        <NoticeEmailModal
          isOpen={!!selectedNoticeForEmail}
          notice={selectedNoticeForEmail}
          onClose={() => setSelectedNoticeForEmail(null)}
        />
      )}

      {/* Modale WhatsApp Direct pour Impayé */}
      {selectedReminderTarget && (
        <WhatsAppReminderModal
          payment={selectedReminderTarget}
          onClose={() => setSelectedReminderTarget(null)}
        />
      )}

      {/* Modal Rappel Collectif du 25 */}
      {showCollectiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    Diffusion du Rappel Collectif (Le 25)
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Campagne informative pour 28 locataires actifs
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCollectiveModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                {`Bonjour [Nom du Locataire],\n\n${user?.companyName || user?.name || 'Votre Bailleur'} vous rappelle que l'échéance de votre loyer du mois prochain sera exigible le 05.\n\nModes de règlement acceptés :\n• Mobile Money (Wave, MTN, Moov, Orange)\n• Virement bancaire ou règlement direct\n\nVotre quittance certifiée vous sera immédiatement délivrée dès validation.\n\nExcellente fin de mois,\nLa Direction de Gestion`}
              </div>

              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-[11px] text-blue-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Envoi simultané par WhatsApp et SMS avec journalisation de livraison.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCollectiveModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 font-bold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCollectiveModal(false);
                    showToast('Rappel collectif diffusé avec succès aux 28 locataires actifs !');
                  }}
                  className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black shadow-pink-glow flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Diffuser maintenant (28 locataires)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
