'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSpace } from '@/lib/context/space-context';
import {
  Wrench,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Camera,
  ZoomIn,
  MessageCircle,
  ExternalLink,
  ChevronRight,
  User,
  Building2,
  ArrowRight,
  Filter,
  Search,
  Plus,
  Phone,
  Mail,
  X,
  Send,
  UploadCloud,
  ShieldCheck,
  AlertCircle,
  Sparkles,
  Calendar,
  Home,
} from 'lucide-react';
import {
  ReportedIncident,
  IncidentService,
  IncidentStatus,
  IncidentUrgency,
  INITIAL_INCIDENTS,
} from '@/lib/services/incident-service';
import { LandlordIncidentModal } from '@/components/dashboard/LandlordIncidentModal';
import { notifySave, notifyUpdate } from '@/lib/notifications/action-notifier';
import { formatFCFA } from '@/lib/money/format';

const ISSUE_SAMPLE_PHOTOS = [
  {
    label: 'Fuite robinet / lavabo',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Climatiseur / Split',
    url: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Disjoncteur / Électricité',
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Serrure / Poignée',
    url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=800&auto=format&fit=crop&q=80',
  },
];

function IncidentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLandlord, isTenant, activeSpace, switchSpace } = useSpace();

  // Liste des incidents synchronisée
  const [incidents, setIncidents] = useState<ReportedIncident[]>(INITIAL_INCIDENTS);
  const [selectedIncident, setSelectedIncident] = useState<ReportedIncident | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'critique' | 'urgente' | 'normale'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // État du formulaire de signalement locataire
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [issueCategory, setIssueCategory] = useState('Plomberie / Fuite d’eau');
  const [issueDesc, setIssueDesc] = useState('');
  const [issueUrgency, setIssueUrgency] = useState<IncidentUrgency>('normale');
  const [issuePhotos, setIssuePhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
  ]);
  const [issueUrlInput, setIssueUrlInput] = useState('');
  const [showIssueUrlInput, setShowIssueUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadIncidents = () => {
    setIncidents(IncidentService.getIncidents());
  };

  useEffect(() => {
    loadIncidents();
    const handleUpdate = () => loadIncidents();
    window.addEventListener('locagestion:incidents_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('locagestion:incidents_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Détection du paramètre d'URL pour ouvrir directement le modal de signalement
  useEffect(() => {
    if (searchParams.get('action') === 'new') {
      setReportModalOpen(true);
    }
  }, [searchParams]);

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Upload de fichier photo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setIssuePhotos((prev) => [...prev, uploadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // Soumission d'une nouvelle panne par le locataire
  const handleSubmitIssue = (e: React.FormEvent) => {
    e.preventDefault();
    const photoCount = issuePhotos.length;

    IncidentService.addIncident({
      category: issueCategory,
      urgency: issueUrgency,
      description: issueDesc,
      photos: issuePhotos,
      tenantName: 'Koffi Mensah',
      tenantPhone: '+229 97 00 11 22',
      tenantEmail: 'koffi.mensah@fintech-africa.com',
      property: 'Résidence Les Cocotiers',
      unit: 'Appt A3 (3 pièces)',
      status: 'en_attente',
    });

    setReportModalOpen(false);
    setIssueDesc('');
    setIssueCategory('Plomberie / Fuite d’eau');
    setIssueUrgency('normale');
    setIssuePhotos([
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80',
    ]);

    const successMsg = `Panne signalée avec succès (${photoCount} photo${photoCount > 1 ? 's' : ''}) ! Votre bailleur et le gestionnaire ont été alertés.`;
    setToastMessage(`✅ ${successMsg}`);
    notifySave(successMsg, 'Panne signalée avec succès !');
  };

  // Changement rapide de statut par le bailleur
  const handleQuickStatusChange = (
    id: string,
    newStatus: IncidentStatus,
    e: React.MouseEvent
  ) => {
    e.stopPropagation();
    IncidentService.updateIncidentStatus(id, newStatus);
    loadIncidents();
    const label = newStatus === 'resolu' ? 'Résolu' : 'Pris en charge';
    const updateMsg = `Statut de la panne mis à jour : ${label}`;
    setToastMessage(updateMsg);
    notifyUpdate(updateMsg, 'Intervention mise à jour !');
  };

  // Compteurs statistiques
  const totalCount = incidents.length;
  const pendingCount = incidents.filter((i) => i.status === 'en_attente').length;
  const inProgressCount = incidents.filter(
    (i) => i.status === 'pris_en_charge' || i.status === 'en_cours_reparation'
  ).length;
  const resolvedCount = incidents.filter((i) => i.status === 'resolu').length;
  // Cumul financier total des dépenses payées ou engagées aux artisans
  const totalArtisanExpenses = incidents.reduce((acc, curr) => acc + (curr.artisanFee || 0), 0);

  // Filtrage des pannes
  const filteredIncidents = incidents.filter((i) => {
    // Filtre statut
    if (statusFilter === 'pending' && i.status !== 'en_attente') return false;
    if (statusFilter === 'in_progress' && i.status !== 'pris_en_charge' && i.status !== 'en_cours_reparation')
      return false;
    if (statusFilter === 'resolved' && i.status !== 'resolu') return false;

    // Filtre urgence
    if (urgencyFilter !== 'all' && i.urgency !== urgencyFilter) return false;

    // Filtre texte
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText =
        i.id.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.tenantName.toLowerCase().includes(q) ||
        i.property.toLowerCase().includes(q) ||
        i.unit.toLowerCase().includes(q);
      if (!matchText) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex text-slate-800">
      {/* Barre latérale partagée */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Contenu principal */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenTenantAction={(action) => {
            if (action === 'report_issue') setReportModalOpen(true);
          }}
        />

        <main className="p-4 sm:p-8 space-y-6 max-w-7xl w-full mx-auto animate-in fade-in duration-200">
          {/* ==================================================================== */}
          {/* VUE 1 : ESPACE BAILLEUR (Gestion des Pannes & Interventions)          */}
          {/* ==================================================================== */}
          {isLandlord ? (
            <div className="space-y-6">
              {/* Bouton Retour Accueil (visible sur mobile et desktop) */}
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

              {/* En-tête de page Bailleur */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden">
                <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                      Maintenance & Technique
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-slate-300 text-xs font-semibold">Diallo Patrimoine</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <Wrench className="w-6 h-6 text-amber-400" />
                    <span>Pannes & Interventions Signalées</span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    Centralisation des signalements émis par vos locataires. Coordonnez les artisans, suivez les réparations avec photos et validez les clôtures.
                  </p>
                </div>

                <div className="relative z-10 flex items-center gap-2.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => switchSpace('locataire')}
                    className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-1.5 cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tester la vue Locataire</span>
                  </button>
                </div>
              </div>

              {/* 5 Cartes KPI Indicateurs dont Dépenses & Travaux */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Total Signalements
                    </span>
                    <span className="p-2 rounded-xl bg-slate-100 text-slate-700">
                      <Wrench className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-900">{totalCount}</div>
                  <p className="text-[11px] text-slate-400 mt-1">Sur l’ensemble du parc</p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-amber-200/80 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                      En attente
                    </span>
                    <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                      <Clock className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-amber-600 flex items-center gap-2">
                    <span>{pendingCount}</span>
                    {pendingCount > 0 && (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white animate-pulse">
                        À traiter
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-amber-600/80 mt-1">Nécessite un artisan</p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-blue-200/80 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                      Pris en charge
                    </span>
                    <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                      <Building2 className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-blue-700">{inProgressCount}</div>
                  <p className="text-[11px] text-blue-600/80 mt-1">Artisan mandaté</p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-white border border-emerald-200/80 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                      Résolus / Clôturés
                    </span>
                    <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-2xl font-black text-emerald-700">{resolvedCount}</div>
                  <p className="text-[11px] text-emerald-600/80 mt-1">Interventions validées</p>
                </div>

                {/* Carte 5 : Dépenses & Travaux Artisans */}
                <div className="col-span-2 lg:col-span-1 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-500/10 to-transparent border border-amber-300/90 shadow-soft">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider">
                      Dépenses & Travaux
                    </span>
                    <span className="p-2 rounded-xl bg-amber-500 text-white shadow-xs">
                      <Wrench className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-950">
                    {formatFCFA(totalArtisanExpenses)}
                  </div>
                  <p className="text-[11px] text-amber-900/80 mt-1 font-semibold">
                    Cumul factures artisans
                  </p>
                </div>
              </div>

              {/* Barre de Recherche et Filtres Avancés */}
              <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Recherche textuelle */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par locataire, bien, lot, catégorie ou mot-clé..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filtres de statut */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl self-start md:self-auto text-xs font-bold overflow-x-auto max-w-full">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Tous ({totalCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('pending')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'pending'
                        ? 'bg-amber-500 text-white shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    En attente ({pendingCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('in_progress')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'in_progress'
                        ? 'bg-blue-600 text-white shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Pris en charge ({inProgressCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('resolved')}
                    className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                      statusFilter === 'resolved'
                        ? 'bg-emerald-600 text-white shadow-xs font-black'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Résolus ({resolvedCount})
                  </button>
                </div>

                {/* Filtre Urgence */}
                <div className="flex items-center gap-2">
                  <select
                    value={urgencyFilter}
                    onChange={(e) => setUrgencyFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  >
                    <option value="all">⚡ Toutes urgences</option>
                    <option value="critique">🔴 Urgence critique</option>
                    <option value="urgente">🟠 Urgence haute</option>
                    <option value="normale">⚪ Urgence normale</option>
                  </select>
                </div>
              </div>

              {/* Liste Détaillée des Pannes & Incidents */}
              {filteredIncidents.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-soft">
                  <div className="w-14 h-14 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                  </div>
                  <h3 className="font-black text-slate-800 text-base">Aucun signalement ne correspond à vos filtres</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Toutes les installations sont fonctionnelles ou vos filtres de recherche sont trop restrictifs.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredIncidents.map((incident) => {
                    const isPending = incident.status === 'en_attente';
                    const isInProgress = incident.status === 'pris_en_charge' || incident.status === 'en_cours_reparation';
                    const isResolved = incident.status === 'resolu';

                    return (
                      <div
                        key={incident.id}
                        onClick={() => setSelectedIncident(incident)}
                        className={`p-5 sm:p-6 rounded-3xl bg-white border transition-all cursor-pointer hover:shadow-md ${
                          isPending
                            ? 'border-amber-300 shadow-sm bg-gradient-to-r from-amber-50/20 to-white'
                            : 'border-slate-200/90 shadow-soft'
                        }`}
                      >
                        {/* Barre supérieure : ID, Catégorie, Urgence et Statut */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                              {incident.id}
                            </span>
                            <span className="text-xs font-black text-slate-900">{incident.category}</span>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Signalé le {incident.createdAt}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Badge Urgence */}
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                incident.urgency === 'critique'
                                  ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                  : incident.urgency === 'urgente'
                                  ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border border-slate-200'
                              }`}
                            >
                              Urgence {incident.urgency}
                            </span>

                            {/* Badge Statut */}
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                                isResolved
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : isInProgress
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-amber-100 text-amber-800 border border-amber-200'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              <span>
                                {isResolved ? 'Résolu' : isInProgress ? 'Pris en charge' : 'En attente'}
                              </span>
                            </span>
                          </div>
                        </div>

                        {/* Corps : Bien, Locataire et Description */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                          {/* Col 1 : Info Locataire & Logement */}
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center gap-2 text-slate-900 font-bold">
                              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                              <span>{incident.property}</span>
                            </div>
                            <div className="text-slate-600 pl-6 font-semibold">
                              Lot : {incident.unit}
                            </div>
                            <div className="flex items-center gap-2 text-slate-700 pt-1">
                              <User className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                              <span className="font-bold">{incident.tenantName}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 pl-5">
                              {incident.tenantPhone} • {incident.tenantEmail}
                            </div>
                          </div>

                          {/* Col 2 : Description du Problème */}
                          <div className="md:col-span-2 space-y-2">
                            <p className="text-xs text-slate-700 leading-relaxed font-normal bg-slate-50 p-3 rounded-2xl border border-slate-100">
                              "{incident.description}"
                            </p>

                            {/* Photos attachées avec zoom */}
                            {incident.photos && incident.photos.length > 0 && (
                              <div className="flex items-center gap-2 flex-wrap pt-1">
                                <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                                  <Camera className="w-3.5 h-3.5 text-slate-400" />
                                  <span>{incident.photos.length} photo{incident.photos.length > 1 ? 's' : ''} constatée{incident.photos.length > 1 ? 's' : ''} :</span>
                                </span>
                                {incident.photos.map((photo, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewPhoto(photo);
                                    }}
                                    className="relative w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-xs hover:ring-2 hover:ring-amber-500 transition-all cursor-pointer group"
                                  >
                                    <img
                                      src={photo}
                                      alt="Constat de panne"
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                      <ZoomIn className="w-3.5 h-3.5" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Artisan assigné si présent */}
                            {incident.assignedTechnician && (
                              <div className="flex items-center gap-2 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-100 w-fit">
                                <Wrench className="w-3.5 h-3.5 text-blue-500" />
                                <span>Artisan mandaté : {incident.assignedTechnician.name} ({incident.assignedTechnician.trade})</span>
                              </div>
                            )}

                            {/* Montant payé à l'artisan & Facture */}
                            {incident.artisanFee !== undefined && incident.artisanFee > 0 && (
                              <div className="flex items-center gap-2 text-xs font-bold text-amber-950 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-300/80 w-fit flex-wrap">
                                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                                <span>Frais artisan : <strong>{formatFCFA(incident.artisanFee)}</strong></span>
                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                                  incident.artisanPaymentStatus === 'paye' || incident.status === 'resolu'
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {incident.artisanPaymentStatus === 'paye' || incident.status === 'resolu' ? 'Soldé' : 'À régler'}
                                </span>
                                {incident.artisanInvoiceRef && (
                                  <span className="text-[10px] text-slate-500 font-mono">Ref : {incident.artisanInvoiceRef}</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Pied de carte : Actions Rapides */}
                        <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {/* WhatsApp Locataire */}
                            <a
                              href={`https://wa.me/${incident.tenantPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Bonjour ${incident.tenantName},\n\nConcernant votre signalement technique "${incident.category}" sur ${incident.unit} (${incident.property}) :\nNous nous en occupons activement.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="py-1.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1.5 border border-emerald-200 transition-all"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp Locataire</span>
                            </a>

                            {/* Appel direct */}
                            <a
                              href={`tel:${incident.tenantPhone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-all"
                            >
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              <span>Appeler</span>
                            </a>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Changer Statut : Pris en charge */}
                            {isPending && (
                              <button
                                type="button"
                                onClick={(e) => handleQuickStatusChange(incident.id, 'pris_en_charge', e)}
                                className="py-1.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold border border-blue-200 transition-all cursor-pointer"
                              >
                                Marquer pris en charge
                              </button>
                            )}

                            {/* Changer Statut : Résolu */}
                            {!isResolved && (
                              <button
                                type="button"
                                onClick={(e) => handleQuickStatusChange(incident.id, 'resolu', e)}
                                className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                              >
                                Marquer résolu ✓
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedIncident(incident)}
                              className="py-1.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                            >
                              <span>Gérer & Artisan</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bouton Retour Accueil (visible sur mobile et desktop) */}
              <div className="flex items-center gap-2 pb-1">
                <button
                  type="button"
                  onClick={() => router.push('/portal')}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer hover:bg-slate-50"
                >
                  <Home className="w-4 h-4 text-slate-600" />
                  <span>← Retour à l’Accueil</span>
                </button>
              </div>

              {/* En-tête de page Locataire */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-2.5 py-0.5 rounded-full border border-emerald-400/20">
                      Assistance Technique Résident
                    </span>
                    <span className="text-slate-400 text-xs">•</span>
                    <span className="text-slate-300 text-xs font-semibold">Koffi Mensah • Appt A3</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <Wrench className="w-6 h-6 text-brand-400" />
                    <span>Pannes & Demandes d’Intervention</span>
                  </h2>
                  <p className="text-xs text-slate-300 mt-1 max-w-xl">
                    Signalez tout dysfonctionnement (fuite d'eau, panne de climatiseur, coupure électrique, serrure) avec photos justificatives. Votre bailleur et son artisan partenaire sont immédiatement notifiés.
                  </p>
                </div>

                <div className="relative z-10 flex items-center gap-2.5 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(true)}
                    className="py-3 px-5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black shadow-pink-glow transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>+ Signaler une nouvelle panne</span>
                  </button>
                </div>
              </div>

              {/* 3 Étapes du Suivi d'Intervention */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200/90 shadow-soft">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Comment se déroule la prise en charge de votre panne ?</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/60 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900">Constat & Transmission</h5>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Vous décrivez la panne et joignez des photos. Le bailleur reçoit une notification en direct.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/60 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900">Mandat d’un Artisan</h5>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        Le bailleur valide la demande et mandate un artisan certifié (plombier, électricien, frigoriste).
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/60 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-900">Réparation & Clôture</h5>
                      <p className="text-[11px] text-slate-600 mt-0.5">
                        L'artisan intervient chez vous. Le ticket passe en "Résolu" avec l'historique complet conservé.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Historique Personnel des Pannes Signalées par le Locataire */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-brand-50 text-brand-600 shrink-0">
                      <Clock className="w-4 h-4" />
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                      Vos Signalements & Demandes de Réparation ({incidents.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReportModalOpen(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-600 border border-brand-200/80 text-xs font-bold transition-all shadow-2xs cursor-pointer w-full sm:w-auto shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Nouveau signalement</span>
                  </button>
                </div>

                {incidents.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/90 shadow-soft">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <h4 className="font-black text-slate-900 text-sm">Aucune panne signalée pour votre logement</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Tout fonctionne correctement dans votre logement. En cas d'imprévu, cliquez sur "+ Signaler une nouvelle panne".
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {incidents.map((incident) => {
                      const isPending = incident.status === 'en_attente';
                      const isInProgress = incident.status === 'pris_en_charge' || incident.status === 'en_cours_reparation';
                      const isResolved = incident.status === 'resolu';

                      return (
                        <div
                          key={incident.id}
                          className="p-4 sm:p-6 rounded-3xl bg-white border border-slate-200/90 shadow-soft space-y-3.5"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-xs font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                                {incident.id}
                              </span>
                              <span className="text-xs sm:text-sm font-black text-slate-900">{incident.category}</span>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                              {/* Urgence */}
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  incident.urgency === 'critique'
                                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                    : incident.urgency === 'urgente'
                                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                Urgence {incident.urgency}
                              </span>

                              {/* Statut */}
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase flex items-center gap-1 ${
                                  isResolved
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : isInProgress
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}
                              >
                                <Clock className="w-3 h-3" />
                                <span>
                                  {isResolved ? 'Résolu' : isInProgress ? 'Pris en charge' : 'En attente'}
                                </span>
                              </span>

                              <span className="text-[11px] text-slate-400 font-medium">{incident.createdAt}</span>
                            </div>
                          </div>

                          <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-slate-100">
                            {incident.description}
                          </p>

                          {/* Photos constatées */}
                          {incident.photos && incident.photos.length > 0 && (
                            <div className="pt-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Camera className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-[11px] font-bold text-slate-600">
                                  Photos jointes ({incident.photos.length}) :
                                </span>
                                <span className="text-[10px] text-slate-400 italic">(cliquez pour zoomer)</span>
                              </div>
                              <div className="flex flex-wrap items-center gap-2.5">
                                {incident.photos.map((photo, pIdx) => (
                                  <button
                                    key={pIdx}
                                    type="button"
                                    onClick={() => setPreviewPhoto(photo)}
                                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 shadow-xs hover:ring-2 hover:ring-brand-500 transition-all cursor-pointer group shrink-0"
                                  >
                                    <img
                                      src={photo}
                                      alt="Photo constatée"
                                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                      <ZoomIn className="w-4 h-4" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}



                          {/* Artisan mandaté pour le locataire */}
                          {incident.assignedTechnician && (
                            <div className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/20">
                                  <Wrench className="w-5 h-5" />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                      Artisan Mandaté
                                    </span>
                                    <span className="text-xs font-bold text-slate-600">
                                      {incident.assignedTechnician.trade || 'Technicien / Artisan'}
                                    </span>
                                  </div>
                                  <p className="font-black text-slate-900 text-sm mt-0.5 truncate">
                                    {incident.assignedTechnician.name}
                                  </p>
                                  <p className="text-xs font-bold text-blue-700 flex items-center gap-1.5 mt-0.5">
                                    <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span>{incident.assignedTechnician.phone}</span>
                                  </p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
                                <a
                                  href={`tel:${incident.assignedTechnician.phone.replace(/[^0-9+]/g, '')}`}
                                  className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer w-full sm:w-auto"
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  <span>Appeler l'artisan</span>
                                </a>
                                <a
                                  href={`https://wa.me/${incident.assignedTechnician.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                    `Bonjour ${incident.assignedTechnician.name},\n\nJe suis le locataire pour l'intervention #${incident.id} (${incident.category}) sur mon logement ${incident.unit}.\nQuand seriez-vous disponible pour intervenir ?\n\nMerci.`
                                  )}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer w-full sm:w-auto"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>WhatsApp</span>
                                </a>
                              </div>
                            </div>
                          )}



                          {/* Montant facturé/payé à l'artisan (visible locataire & bailleur sur mobile et desktop) */}
                          {incident.artisanFee !== undefined && incident.artisanFee > 0 && (
                            <div className="mt-3 p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-300/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 text-amber-950 font-bold">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                                <span>Règlement intervention artisan : <strong className="text-sm font-black text-slate-900">{formatFCFA(incident.artisanFee)}</strong></span>
                                {incident.artisanInvoiceRef && (
                                  <span className="text-[10px] text-slate-500 font-mono">({incident.artisanInvoiceRef})</span>
                                )}
                              </div>
                              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                                {incident.artisanPaymentStatus === 'paye' || incident.status === 'resolu' ? 'Pris en charge bailleur' : 'En cours de validation'}
                              </span>
                            </div>
                          )}
                          {incident.resolutionNotes && (
                            <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                              <span className="font-bold text-slate-900 block mb-0.5">
                                📝 Suivi du bailleur :
                              </span>
                              <p className="text-slate-600 font-medium">{incident.resolutionNotes}</p>
                            </div>
                          )}

                          {/* Statut d'avancement pour le locataire */}
                          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              {isInProgress ? (
                                <div className="text-blue-700 font-bold flex items-center gap-1.5 text-xs">
                                  <Wrench className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  <span>
                                    {incident.assignedTechnician
                                      ? `Intervention planifiée avec ${incident.assignedTechnician.name}`
                                      : 'Prise en charge par le bailleur'}
                                  </span>
                                </div>
                              ) : isResolved ? (
                                <div className="text-emerald-700 font-bold flex items-center gap-1.5 text-xs">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span>Intervention clôturée avec succès {incident.resolvedAt ? `le ${incident.resolvedAt}` : ''}</span>
                                </div>
                              ) : (
                                <div className="text-amber-700 font-bold flex items-center gap-1.5 text-xs">
                                  <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                  <span>En attente de validation par le bailleur</span>
                                </div>
                              )}
                            </div>

                            {/* Contact Bailleur WhatsApp direct */}
                            <a
                              href={`https://wa.me/22997000000?text=${encodeURIComponent(
                                `Bonjour cher bailleur,\n\nJe reviens vers vous concernant la panne signalée (${incident.id} - ${incident.category}) sur mon logement Appt A3.\nPouvez-vous me tenir informé de l'avancement ?\n\nMerci.`
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="py-2 px-3.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200 transition-all w-full sm:w-auto cursor-pointer shrink-0"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Contacter le bailleur</span>
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Guide Pratique & Numéros d'Urgence UEMOA & CEMAC */}
              <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-soft space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider text-rose-400">
                      Urgences & Numéros Utiles (Zone UEMOA & CEMAC)
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      En cas de fuite majeure menaçant l'immeuble ou de coupure générale d'eau / électricité :
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Électricité / Réseau</span>
                    <p className="font-bold text-white">SBEE (Bénin) : 7300</p>
                    <p className="text-[10px] text-slate-400">CIE (CI) : 179 • Senelec : 33 867</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Eau / Distribution</span>
                    <p className="font-bold text-white">SONEB (Bénin) : 69 00 00 00</p>
                    <p className="text-[10px] text-slate-400">SODECI (CI) : 175 • SEN'EAU : 800 00</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Secours & Pompiers</span>
                    <p className="font-bold text-rose-400">Pompiers : 118</p>
                    <p className="text-[10px] text-slate-400">Police secours : 117 ou 166</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1 : DÉCLARATION / SIGNALEMENT DE PANNE (Espace Locataire)      */}
      {/* ==================================================================== */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header du modal */}
            <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white">Signaler une Panne ou Incident</h3>
                  <p className="text-[11px] text-slate-400">Appt A3 • Résidence Les Cocotiers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Corps du formulaire avec scroll */}
            <form onSubmit={handleSubmitIssue} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Catégorie */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Catégorie de la panne *
                </label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="Plomberie / Fuite d’eau">💧 Plomberie / Fuite d’eau / Robinetterie</option>
                  <option value="Climatisation / Split en panne">❄️ Climatisation / Split / Ventilation</option>
                  <option value="Électricité / Disjoncteur / Prise">⚡ Électricité / Disjoncteur / Prises</option>
                  <option value="Serrure / Poignée / Clé cassée">🔑 Serrure / Poignée / Porte bloquée</option>
                  <option value="Infiltration mur / Plafond">🌧️ Infiltration mur / Plafond / Humidité</option>
                  <option value="Vitrage / Fenêtre / Volet">🪟 Vitrage / Fenêtre / Volet roulant</option>
                  <option value="Autre dysfonctionnement technique">🛠️ Autre dysfonctionnement technique</option>
                </select>
              </div>

              {/* Niveau d'urgence */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Degré d'urgence constaté *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setIssueUrgency('normale')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      issueUrgency === 'normale'
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Normale
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssueUrgency('urgente')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      issueUrgency === 'urgente'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Urgente
                  </button>
                  <button
                    type="button"
                    onClick={() => setIssueUrgency('critique')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      issueUrgency === 'critique'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Critique
                  </button>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description détaillée du dysfonctionnement *
                </label>
                <textarea
                  rows={3}
                  required
                  value={issueDesc}
                  onChange={(e) => setIssueDesc(e.target.value)}
                  placeholder="Ex : Le robinet sous le lavabo fuit abondamment depuis ce matin. L'eau commence à s'infiltrer sous le meuble..."
                  className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                />
              </div>

              {/* Photos de la panne avec upload réel */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-brand-500" />
                    <span>Photos constatées ({issuePhotos.length})</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-medium">Recommandé pour accélérer le diagnostic</span>
                </div>

                {/* Galerie des photos actuelles */}
                {issuePhotos.length > 0 && (
                  <div className="flex flex-wrap gap-2.5 mb-2.5">
                    {issuePhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="relative w-16 h-16 rounded-xl overflow-hidden border border-slate-200 shadow-xs group"
                      >
                        <img src={photo} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setIssuePhotos(issuePhotos.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 p-1 rounded-md bg-rose-600 text-white hover:bg-rose-700 shadow-sm"
                          title="Supprimer cette photo"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Boutons d'ajout photo */}
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
                    <span>Importer depuis l'appareil</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowIssueUrlInput(!showIssueUrlInput)}
                    className="py-2 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Lien URL Web</span>
                  </button>
                </div>

                {/* Champ URL photo */}
                {showIssueUrlInput && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="url"
                      value={issueUrlInput}
                      onChange={(e) => setIssueUrlInput(e.target.value)}
                      placeholder="https://images.unsplash.com/photo-..."
                      className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (issueUrlInput.trim()) {
                          setIssuePhotos((prev) => [...prev, issueUrlInput.trim()]);
                          setIssueUrlInput('');
                          setShowIssueUrlInput(false);
                        }
                      }}
                      className="py-1.5 px-3 rounded-xl bg-brand-500 text-white text-xs font-bold hover:bg-brand-600"
                    >
                      Ajouter
                    </button>
                  </div>
                )}

                {/* Presets de photos de démonstration */}
                <div className="mt-2.5 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">
                    Exemples de photos fréquentes :
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ISSUE_SAMPLE_PHOTOS.map((sample, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => {
                          if (!issuePhotos.includes(sample.url)) {
                            setIssuePhotos((prev) => [...prev, sample.url]);
                          }
                        }}
                        className="text-[10px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                      >
                        + {sample.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bouton de validation */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs font-extrabold shadow-pink-glow transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Transmettre le signalement au bailleur</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2 : GESTION DÉTAILLÉE DE L'INCIDENT (Bailleur & Artisan)       */}
      {/* ==================================================================== */}
      {selectedIncident && (
        <LandlordIncidentModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onStatusUpdated={() => {
            loadIncidents();
            setSelectedIncident(null);
            setToastMessage('✅ Fiche incident et mission artisan mises à jour.');
          }}
        />
      )}

      {/* ==================================================================== */}
      {/* MODAL 3 : ZOOM PLEIN ÉCRAN DE PHOTO                                  */}
      {/* ==================================================================== */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] flex flex-col items-center">
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={previewPhoto}
              alt="Aperçu grand format"
              className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 py-3 px-4.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-xl border border-white/10 flex items-center gap-2.5 animate-in slide-in-from-bottom duration-200">
          <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default function IncidentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
        </div>
      }
    >
      <IncidentsPageContent />
    </Suspense>
  );
}
