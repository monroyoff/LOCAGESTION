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
} from 'lucide-react';
import { MOCK_PROPERTIES } from '@/lib/data/mock-data';
import { formatFCFA } from '@/lib/money/format';
import { Property, UserSpace } from '@/lib/types';
import { QuickActionModal } from '@/components/dashboard/QuickActionModal';
import { PropertyDetailModal } from '@/components/properties/PropertyDetailModal';
import { NewPropertyModal } from '@/components/properties/NewPropertyModal';
import { notifyAction, notifySave, notifyDelete } from '@/lib/notifications/action-notifier';

export default function PropertiesPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState<UserSpace>('bailleur');

  // Properties State
  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(MOCK_PROPERTIES[0] || null);

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
    setProperties((prev) => [newProp, ...prev]);
    setSelectedProperty(newProp);
    const msg = `La résidence « ${newProp.name} » a été ajoutée au patrimoine avec succès !`;
    showToast(msg);
    notifySave(msg, 'Résidence enregistrée !');
  };

  const filteredProperties = properties.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.district.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

            <button
              onClick={() => setNewPropertyModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-extrabold shadow-pink-glow active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Ajouter un bien</span>
            </button>
          </div>

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

              {/* Lots Grid List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Lots & Unités Disponibles ({selectedProperty.unitsList ? selectedProperty.unitsList.length : selectedProperty.totalUnits})
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
                  {(selectedProperty.unitsList || [
                    { unit: 'Appt A1', type: '3 Pièces • 75 m²', surface: 75, rent: 220000, tenant: 'Koffi Mensah', status: 'occupe' },
                    { unit: 'Appt A2', type: '2 Pièces • 55 m²', surface: 55, rent: 180000, tenant: 'Amina Diop', status: 'occupe' },
                    { unit: 'Appt A3', type: '3 Pièces • 75 m²', surface: 75, rent: 220000, tenant: 'Koffi Mensah', status: 'occupe' },
                    { unit: 'Appt B1', type: '2 Pièces • 55 m²', surface: 55, rent: 180000, tenant: 'Fatoumata Traoré', status: 'occupe' },
                    { unit: 'Appt B2', type: '3 Pièces • 80 m²', surface: 80, rent: 250000, tenant: 'Disponible', status: 'vacant' },
                    { unit: 'Penthouse C', type: '4 Pièces • 160 m²', surface: 160, rent: 450000, tenant: 'Rodrigue Agbodjan', status: 'occupe' },
                  ]).map((l, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        if (l.status === 'occupe') {
                          router.push('/tenants');
                        } else {
                          router.push('/leases/new');
                        }
                      }}
                      className="p-4 bg-slate-50 hover:bg-white hover:shadow-sm hover:border-slate-300 rounded-2xl border border-slate-200/80 flex items-center justify-between transition-all cursor-pointer group"
                      title={l.status === 'occupe' ? 'Voir le dossier du locataire' : 'Attribuer / Rédiger un nouveau bail'}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-xs text-slate-900 group-hover:text-brand-600 transition-colors">{l.unit}</span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${l.status === 'occupe'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                              }`}
                          >
                            {l.status === 'occupe' ? 'Occupé' : 'Vacant'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block mt-0.5">{l.type}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Locataire : {l.tenant}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-slate-900 block">
                          {formatFCFA(l.rent)}
                        </span>
                        <span className="text-[10px] text-brand-600 font-bold block group-hover:underline">
                          {l.status === 'occupe' ? 'Voir locataire ➔' : 'Créer bail ➔'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
