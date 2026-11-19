'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Home,
  ChevronRight,
  TrendingUp,
  Layers,
  Sparkles,
  Trash2,
  Eye,
  Camera,
  User,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { MOCK_PROPERTIES } from '@/lib/data/mock-data';
import { formatFCFA } from '@/lib/money/format';
import { Property, UserSpace } from '@/lib/types';
import { useSpace } from '@/lib/context/space-context';
import { AuthService } from '@/lib/services/auth-service';
import { QuickActionModal } from '@/components/dashboard/QuickActionModal';
import { PropertyDetailModal } from '@/components/properties/PropertyDetailModal';
import { NewPropertyModal } from '@/components/properties/NewPropertyModal';
import { Footer } from '@/components/layout/Footer';
import { notifyAction, notifySave, notifyDelete } from '@/lib/notifications/action-notifier';

export default function PropertiesPage() {
  const router = useRouter();
  const { user, isAdmin } = useSpace();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState<UserSpace>('bailleur');

  // Properties State
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [selectedLandlordFilter, setSelectedLandlordFilter] = useState<string>('all');

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('locagestion:properties:v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Récupération des utilisateurs connus pour rétro-affecter les propriétaires si manquant
          const knownUsers = AuthService.getAllKnownUsers();
          const defaultBailleur = knownUsers.find((u) => u.role === 'bailleur') || knownUsers[0];

          let changed = false;
          const sanitized = parsed.map((p: Property) => {
            let propertyChanged = false;

            // Rétro-affectation de l'auteur si absent
            if (!p.authorName) {
              propertyChanged = true;
              p = {
                ...p,
                authorId: user?.id || defaultBailleur?.id || 'usr_bailleur_1',
                authorName: user?.name || defaultBailleur?.name || 'Bailleur Propriétaire',
                authorEmail: user?.email || defaultBailleur?.email || '',
                authorPhone: user?.phone || defaultBailleur?.phone || '',
                authorCompany: user?.companyName || defaultBailleur?.companyName || '',
                authorMatricule: user?.matricule || defaultBailleur?.matricule || '',
                authorRole: 'bailleur',
                createdAt: p.createdAt || '15/01/2025',
              };
            }

            // Nettoyage et assainissement des biens existants pour éliminer tout locataire fictif automatique ("Locataire Lot X")
            const updatedUnits = (p.unitsList || []).map((u) => {
              if (
                u.tenant &&
                (u.tenant.startsWith('Locataire Lot') ||
                  u.tenant.toLowerCase().includes('fictif') ||
                  u.tenant.toLowerCase() === 'locataire lot 1')
              ) {
                propertyChanged = true;
                return {
                  ...u,
                  tenant: 'Disponible',
                  status: 'vacant' as const,
                };
              }
              return u;
            });

            if (propertyChanged) {
              changed = true;
              const realOccupiedCount = updatedUnits.filter((u) => u.status === 'occupe').length;
              return {
                ...p,
                occupiedUnits: realOccupiedCount,
                unitsList: updatedUnits,
              };
            }
            return p;
          });

          if (changed) {
            localStorage.setItem('locagestion:properties:v1', JSON.stringify(sanitized));
          }
          setProperties(sanitized);
          setSelectedProperty(sanitized[0]);
        }
      }
    } catch (e) {
      console.error('Erreur lecture propriétés:', e);
    }
  }, []);

  // Modals State
  const [detailModalProperty, setDetailModalProperty] = useState<Property | null>(null);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
  const [newPropertyModalOpen, setNewPropertyModalOpen] = useState(false);
  const [quickAction, setQuickAction] = useState<'new_lease' | 'new_payment' | 'new_property' | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    notifyAction(msg, 'Enregistrement validé !', 'success');
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Suppression d'un bien
  const handleDeleteProperty = (propertyId: string, propertyName: string) => {
    setProperties((prev) => {
      const updated = prev.filter((p) => p.id !== propertyId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('locagestion:properties:v1', JSON.stringify(updated));
      }
      if (selectedProperty?.id === propertyId) {
        setSelectedProperty(updated.length > 0 ? updated[0] : null);
      }
      return updated;
    });
    const msg = `Le bien « ${propertyName} » a été supprimé du patrimoine avec succès.`;
    showToast(msg);
    notifyDelete(msg, 'Bien supprimé du patrimoine');
  };

  // Ajout d'un nouveau bien
  const handleAddProperty = (newProp: Property) => {
    setProperties((prev) => {
      const updated = [newProp, ...prev];
      if (typeof window !== 'undefined') {
        localStorage.setItem('locagestion:properties:v1', JSON.stringify(updated));
      }
      return updated;
    });
    setSelectedProperty(newProp);
    const msg = `La résidence « ${newProp.name} » a été ajoutée au patrimoine avec succès !`;
    showToast(msg);
    notifySave(msg, 'Résidence enregistrée !');
  };

  // Extraction de la liste unique des bailleurs propriétaires pour le filtrage Super-Admin
  const landlordsList = React.useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
        company?: string;
        matricule?: string;
        email?: string;
        phone?: string;
        count: number;
      }
    >();

    properties.forEach((p) => {
      const key = p.authorId || p.authorMatricule || p.authorName || 'Bailleur Inconnu';
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, {
          id: key,
          name: p.authorName || 'Bailleur Non Renseigné',
          company: p.authorCompany,
          matricule: p.authorMatricule,
          email: p.authorEmail,
          phone: p.authorPhone,
          count: 1,
        });
      }
    });

    return Array.from(map.values());
  }, [properties]);

  const filteredProperties = properties.filter((p) => {
    // Filtrage Super-Admin par bailleur spécifique
    if (selectedLandlordFilter !== 'all') {
      const key = p.authorId || p.authorMatricule || p.authorName || 'Bailleur Inconnu';
      if (key !== selectedLandlordFilter) return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.district.toLowerCase().includes(q) ||
      (p.authorName && p.authorName.toLowerCase().includes(q)) ||
      (p.authorCompany && p.authorCompany.toLowerCase().includes(q)) ||
      (p.authorMatricule && p.authorMatricule.toLowerCase().includes(q))
    );
  });

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
          onOpenQuickAction={(action) => {
            if (action === 'new_property') {
              setNewPropertyModalOpen(true);
            } else {
              setQuickAction(action);
            }
          }}
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

          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Patrimoine Immobilier & Lots
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-brand-50 text-brand-600 border border-brand-200">
                  {properties.length} {properties.length > 1 ? 'Résidences' : 'Résidence'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Gestion des immeubles, villas, appartements et états d'occupation par lot.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={isAdmin ? "Rechercher bien, bailleur, matricule..." : "Rechercher une résidence..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 shadow-xs"
                />
              </div>

              <button
                onClick={() => setNewPropertyModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-extrabold shadow-pink-glow active:scale-95 transition-all shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Ajouter un bien</span>
              </button>
            </div>
          </div>

          {/* BANDEAU SUPER-ADMIN : VUE GLOBALE PAR BAILLEUR */}
          {isAdmin && (
            <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 text-white shadow-xl space-y-4 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm font-black text-white">Console Super-Admin : Vue Globale par Bailleur</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-500/25 text-indigo-300 border border-indigo-500/30">
                        Super Admin
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Filtrez et pilotez le parc immobilier bailleur par bailleur. Cliquez sur un bien pour afficher les coordonnées complètes de son auteur.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs bg-slate-800/80 px-3 py-1.5 rounded-2xl border border-slate-700/80">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span className="text-slate-400">Bailleurs identifiés :</span>
                  <span className="font-mono font-bold text-white">{landlordsList.length}</span>
                </div>
              </div>

              {/* Onglets sélecteurs Bailleurs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedLandlordFilter('all')}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    selectedLandlordFilter === 'all'
                      ? 'bg-brand-500 text-white shadow-pink-glow'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Tous les Bailleurs ({properties.length})</span>
                </button>

                {landlordsList.map((ll) => {
                  const isSelected = selectedLandlordFilter === ll.id;
                  return (
                    <button
                      key={ll.id}
                      type="button"
                      onClick={() => setSelectedLandlordFilter(ll.id)}
                      className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-400/30'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                    >
                      <User className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-extrabold">{ll.name}</span>
                      {ll.company && <span className="text-[10px] text-indigo-200">({ll.company})</span>}
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          isSelected ? 'bg-indigo-800 text-white' : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {ll.count} {ll.count > 1 ? 'biens' : 'bien'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Properties Grid */}
          {filteredProperties.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Building2 className="w-7 h-7" />
              </div>
              <h3 className="font-extrabold text-base text-slate-800">
                Aucun bien dans le patrimoine
              </h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Enregistrez votre première résidence ou villa pour démarrer la gestion locative centralisée.
              </p>
              <button
                type="button"
                onClick={() => setNewPropertyModalOpen(true)}
                className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black shadow-pink-glow transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Ajouter une résidence</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredProperties.map((prop) => {
                const occupancy = Math.round((prop.occupiedUnits / prop.totalUnits) * 100);
                const isSelected = selectedProperty?.id === prop.id;
                const photosCount = prop.images && prop.images.length > 0 ? prop.images.length : 1;

                return (
                  <div
                    key={prop.id}
                    onClick={() => {
                      setSelectedProperty(prop);
                      setDetailModalProperty(prop);
                    }}
                    className={`bg-white rounded-3xl border overflow-hidden transition-all cursor-pointer group hover:shadow-card-hover relative flex flex-col justify-between ${isSelected
                      ? 'border-brand-500 ring-2 ring-brand-500/20 shadow-md'
                      : 'border-slate-200/80 shadow-soft'
                      }`}
                  >
                    {/* Image Header with Corbeille & Photos Badges */}
                    <div>
                      <div className="relative h-44 overflow-hidden">
                        <img
                          src={prop.imageUrl}
                          alt={prop.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent pointer-events-none" />

                        {/* Top-Left: Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                            {prop.totalUnits} Lots
                          </span>
                          <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold flex items-center gap-1">
                            <Camera className="w-3 h-3 text-brand-400" />
                            <span>{photosCount}</span>
                          </span>
                        </div>

                        {/* Top-Right: BOUTON CORBEILLE (Supprimer le bien) */}
                        <div className="absolute top-3 right-3 z-10">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPropertyToDelete(prop);
                            }}
                            className="w-8 h-8 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center backdrop-blur-md transition-all shadow-md cursor-pointer group/trash"
                            title={`Supprimer « ${prop.name} »`}
                            aria-label={`Supprimer ${prop.name}`}
                          >
                            <Trash2 className="w-4 h-4 text-white group-hover/trash:scale-110 transition-transform" />
                          </button>
                        </div>

                        {/* Bottom image overlay */}
                        <div className="absolute bottom-3 left-3 right-3 text-white pointer-events-none">
                          <h3 className="font-black text-sm truncate">{prop.name}</h3>
                          <p className="text-[11px] text-slate-200 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-brand-400 shrink-0" />
                            <span className="truncate">{prop.district}, {prop.city}</span>
                          </p>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Occupation</span>
                          <span className="font-extrabold text-slate-800">
                            {prop.occupiedUnits} / {prop.totalUnits} ({occupancy}%)
                          </span>
                        </div>

                        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            style={{ width: `${occupancy}%` }}
                            className="h-full rounded-full bg-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bandeau Auteur / Propriétaire du Bien */}
                    <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <User className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span className="text-slate-400 text-[10px]">Par :</span>
                        <span className="font-bold text-slate-800 truncate" title={prop.authorName}>
                          {prop.authorName || 'Bailleur'}
                        </span>
                      </div>
                      {prop.authorMatricule && (
                        <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 shrink-0">
                          {prop.authorMatricule}
                        </span>
                      )}
                    </div>

                    {/* Card Footer with Direct Action Buttons */}
                    <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Revenu mensuel</span>
                        <span className="text-xs font-black text-slate-900">
                          {formatFCFA(prop.monthlyRevenue)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProperty(prop);
                          setDetailModalProperty(prop);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-brand-500 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Photos & Détails</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Selected Property Detail Card & Lots Breakdown */}
          {selectedProperty && (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-600 uppercase tracking-wider block">
                      Détail de la Résidence
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700">
                      {selectedProperty.type}
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1">
                    {selectedProperty.name} ({selectedProperty.city})
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedProperty.address} • Total de {selectedProperty.totalUnits} lots
                  </p>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-right">
                    <span className="text-[10px] text-emerald-800 uppercase font-bold block">
                      Revenu Mensuel
                    </span>
                    <span className="text-base font-black text-emerald-700">
                      {formatFCFA(selectedProperty.monthlyRevenue)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDetailModalProperty(selectedProperty)}
                    className="py-3 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black shadow-pink-glow flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Voir les photos & détails</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPropertyToDelete(selectedProperty)}
                    className="p-3 rounded-2xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                    title="Supprimer cette résidence"
                    aria-label="Supprimer cette résidence"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Carte Auteur / Propriétaire du Bien Sélectionné */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white border border-indigo-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-black tracking-wider text-indigo-300 block">
                      Enregistré par le Propriétaire Bailleur
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-white">
                      {selectedProperty.authorName || 'Bailleur Non Renseigné'}
                      {selectedProperty.authorCompany ? ` (${selectedProperty.authorCompany})` : ''}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {selectedProperty.authorMatricule && (
                    <span className="px-2.5 py-1 rounded-xl bg-slate-950 border border-indigo-500/40 font-mono font-black text-indigo-200">
                      Matricule : {selectedProperty.authorMatricule}
                    </span>
                  )}
                  {selectedProperty.authorPhone && (
                    <span className="px-2 py-1 rounded-xl bg-white/10 font-mono text-slate-200 text-[11px]">
                      📞 {selectedProperty.authorPhone}
                    </span>
                  )}
                  {selectedProperty.authorEmail && (
                    <span className="px-2 py-1 rounded-xl bg-white/10 text-slate-200 text-[11px] truncate max-w-[200px]">
                      ✉️ {selectedProperty.authorEmail}
                    </span>
                  )}
                </div>
              </div>

              {/* Lots Grid List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Lots & Unités ({selectedProperty.unitsList ? selectedProperty.unitsList.length : selectedProperty.totalUnits})
                  </h3>
                  <button
                    type="button"
                    onClick={() => router.push('/leases/new')}
                    className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Rédiger un bail</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(selectedProperty.unitsList || []).map((l, idx) => {
                    const isOccupied =
                      l.status === 'occupe' &&
                      l.tenant &&
                      !l.tenant.toLowerCase().includes('disponible') &&
                      !l.tenant.startsWith('Locataire Lot') &&
                      !l.tenant.toLowerCase().includes('fictif');

                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (isOccupied) {
                            router.push('/tenants');
                          } else {
                            router.push('/leases/new');
                          }
                        }}
                        className="p-4 bg-slate-50 hover:bg-white hover:shadow-sm hover:border-slate-300 rounded-2xl border border-slate-200/80 flex items-center justify-between transition-all cursor-pointer group"
                        title={isOccupied ? 'Voir le dossier du locataire' : 'Attribuer / Rédiger un nouveau bail'}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-slate-900 group-hover:text-brand-600 transition-colors">
                              {l.unit}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                isOccupied
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {isOccupied ? 'Occupé' : 'Vacant (Disponible)'}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 block mt-0.5">{l.type}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {isOccupied ? `Locataire : ${l.tenant}` : 'Non loué (Disponible)'}
                          </span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-slate-900 block">
                            {formatFCFA(l.rent)}
                          </span>
                          <span className="text-[10px] text-brand-600 font-bold block group-hover:underline">
                            {isOccupied ? 'Voir locataire ➔' : 'Créer bail ➔'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Footer en fin de page : Créée au Bénin (en bas à gauche) */}
          <Footer />
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODALE DÉTAIL IMMERSIVE & GALERIE PHOTOS                              */}
      {/* ==================================================================== */}
      <PropertyDetailModal
        property={detailModalProperty}
        isOpen={!!detailModalProperty}
        onClose={() => setDetailModalProperty(null)}
        onDelete={handleDeleteProperty}
      />

      {/* ==================================================================== */}
      {/* MODALE AJOUT D'UNE NOUVELLE RÉSIDENCE                                */}
      {/* ==================================================================== */}
      <NewPropertyModal
        isOpen={newPropertyModalOpen}
        onClose={() => setNewPropertyModalOpen(false)}
        onAddProperty={handleAddProperty}
      />

      {/* ==================================================================== */}
      {/* DIALOGUE DE CONFIRMATION DE SUPPRESSION                              */}
      {/* ==================================================================== */}
      {propertyToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h4 className="text-base font-black text-slate-900">
                Supprimer « {propertyToDelete.name} » ?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Cette action supprimera définitivement cette résidence ({propertyToDelete.totalUnits} lots) de votre patrimoine immobilier.
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setPropertyToDelete(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteProperty(propertyToDelete.id, propertyToDelete.name);
                  setPropertyToDelete(null);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/25 transition-all cursor-pointer"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Modal */}
      {quickAction && (
        <QuickActionModal
          actionType={quickAction}
          onClose={() => setQuickAction(null)}
          onSuccess={(msg) => showToast(msg)}
        />
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
