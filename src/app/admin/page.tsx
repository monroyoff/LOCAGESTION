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
} from 'lucide-react';
import { useSpace } from '@/lib/context/space-context';
import { ModerationService } from '@/lib/services/moderation-service';
import { ListingsService } from '@/lib/services/listings-service';
import { AuthService } from '@/lib/services/auth-service';
import { SecurityAlert, RentalListing, AuthUser } from '@/lib/types';
import { formatFCFA } from '@/lib/money/format';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAdmin, logout } = useSpace();

  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [listings, setListings] = useState<RentalListing[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [activeTab, setActiveTab] = useState<'alerts' | 'listings' | 'rules'>('alerts');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Charger les données de sécurité et annonces
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
    return () => {
      window.removeEventListener('locagestion:security_alerts_updated', handleAlertsUpdate);
      window.removeEventListener('locagestion:listings_updated', handleAlertsUpdate);
    };
  }, [user, router]);

  if (!user || user.role !== 'admin' || user.email !== 'admin@locagestion.site') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <p className="text-sm font-bold text-slate-400">Accès restreint au Super-Administrateur...</p>
      </div>
    );
  }

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

  const handleDeleteListing = (id: string) => {
    if (confirm('Voulez-vous supprimer définitivement cette annonce de la plateforme ?')) {
      ListingsService.deleteListing(id);
      refreshData();
      setActionSuccessMsg('Annonce supprimée définitivement.');
      setTimeout(() => setActionSuccessMsg(null), 4000);
    }
  };

  const handleTogglePauseListing = (id: string) => {
    ListingsService.togglePause(id);
    refreshData();
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
    if (filterSeverity === 'all') return true;
    if (filterSeverity === 'non_traite') return a.status === 'non_traite';
    if (filterSeverity === 'sexual') {
      return a.violations.some((v) => v.type === 'nudite' || v.type === 'propos_sexuel');
    }
    if (filterSeverity === 'extortion') {
      return a.violations.some((v) => v.type === 'extorsion_rancon');
    }
    if (filterSeverity === 'photos') {
      return a.violations.some((v) => v.type === 'photos_insuffisantes');
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
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white">
                LOCAGESTION <span className="text-rose-400">ADMIN</span>
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                Console Nationale Sécurité & Modération IA
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Supervision temps réel • 14 pays UEMOA & CEMAC • Protection des utilisateurs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold">IA de Sécurité Active 24/7</span>
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
                Alertes Non Traitées
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-rose-400">{unreadAlerts.length}</span>
              <span className="text-xs text-slate-400">sur {alerts.length} au total</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span>Infractions bloquées avant diffusion publique</span>
            </p>
          </div>

          {/* Card 2: Nudité & Propos Sexuels */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Nudité & Sexuel Bloqués
              </span>
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <Ban className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-purple-300">{sexualViolationsCount}</span>
              <span className="text-xs text-slate-400">tentatives proscrites</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Règle stricte : Tolérance zéro nudité et solicitation
            </p>
          </div>

          {/* Card 3: Extorsion & Rançonnement */}
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Extorsion & Rançon Bloqués
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                <Flame className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-3xl font-black text-amber-300">{extortionViolationsCount}</span>
              <span className="text-xs text-slate-400">tentatives déjouées</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Paiement avant visite physique formellement interdit
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
                {listings.filter((l) => l.status !== 'rejete').length}
              </span>
              <span className="text-xs text-slate-400">vérifiées par l'IA</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Chaque annonce comprend au moins 2 photos certifiées
            </p>
          </div>
        </div>

        {/* 2. Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 flex-wrap gap-3">
          <div className="flex items-center gap-2">
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
              <span>Journal des Alertes de Sécurité IA ({alerts.length})</span>
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
              <span>Supervision Globale des Annonces ({listings.length})</span>
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

          <button
            type="button"
            onClick={refreshData}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
            title="Rafraîchir les données"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* 3. Tab Contents */}

        {/* TAB 1: JOURNAL DES ALERTES DE SÉCURITÉ */}
        {activeTab === 'alerts' && (
          <div className="space-y-4">
            {/* Filtre d'alertes */}
            <div className="flex items-center gap-2 flex-wrap">
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
                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  {f.label}
                </button>
              ))}
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
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
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
                          <span className="text-xs text-slate-400">{alert.detectedAt}</span>
                          <span className="text-xs text-slate-500">• {alert.country} ({alert.city})</span>
                        </div>
                        <h4 className="text-sm font-black text-white">{alert.listingTitle}</h4>
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
                      <span className="text-[11px] text-slate-500 font-mono">ID: {alert.id}</span>
                      <div className="flex items-center gap-2">
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
                              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
                            >
                              Autoriser par Dérogation
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleResolveAlert(alert.id, 'supprime')}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
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

        {/* TAB 2: SUPERVISION GLOBALE DES ANNONCES */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{listings.length} publications enregistrées sur la plateforme</span>
              <span>Devise : FCFA (XOF / XAF)</span>
            </div>

            <div className="space-y-3">
              {listings.map((l) => (
                <div
                  key={l.id}
                  className="p-4 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 flex-wrap hover:border-slate-700 transition-all"
                >
                  <div className="flex items-center gap-3.5">
                    <img
                      src={l.images[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200'}
                      alt={l.title}
                      className="w-16 h-16 rounded-2xl object-cover border border-slate-800 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-black text-white">{l.title}</h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                          {l.propertyType}
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
                            <span>Vérifié Conforme</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {l.city} ({l.country}) • Loyer : <strong>{formatFCFA(l.monthlyRent)}</strong> • {l.images.length} photos
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTogglePauseListing(l.id)}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                    >
                      {l.status === 'en_pause' ? 'Activer' : 'Mettre en pause'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteListing(l.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Supprimer définitivement"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: RÈGLES D'OR & PROTOCOLE DE SÉCURITÉ IA */}
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
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
                    Au Moins Deux (2) Photos ou Vidéos
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Toute annonce comportant 0 ou 1 seule photo est strictement rejetée.
                    L'obligation de 2 médias minimum garantit la transparence visuelle et protège
                    les locataires contre les annonces fantômes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

