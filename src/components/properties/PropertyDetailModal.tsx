'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  MapPin,
  Building2,
  Trash2,
  Plus,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Zap,
  Droplet,
  Users,
  Home,
  Coins,
  Key,
  Layers,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { Property } from '@/lib/types';
import { formatFCFA } from '@/lib/money/format';

interface PropertyDetailModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (propertyId: string, propertyName: string) => void;
}

export function PropertyDetailModal({
  property,
  isOpen,
  onClose,
  onDelete,
}: PropertyDetailModalProps) {
  const router = useRouter();
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!isOpen || !property) return null;

  const imagesList = property.images && property.images.length > 0
    ? property.images
    : [property.imageUrl];

  const occupancyRate = Math.round((property.occupiedUnits / property.totalUnits) * 100);
  const vacantUnits = property.totalUnits - property.occupiedUnits;
  const avgRent = Math.round(property.monthlyRevenue / (property.occupiedUnits || 1));

  const handlePrevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIdx((prev) => (prev === 0 ? imagesList.length - 1 : prev - 1));
  };

  const handleNextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveImageIdx((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-white">
                  {property.name}
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-500 text-white">
                  {property.type}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span>{property.address}, {property.district}, {property.city} ({property.country})</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/10 transition-colors cursor-pointer"
              title="Supprimer ce bien du patrimoine"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-5 sm:p-7 overflow-y-auto space-y-6">
          {/* ==================================================================== */}
          {/* 1. GALERIE DE PHOTOS INTERACTIVE                                     */}
          {/* ==================================================================== */}
          <div className="space-y-2.5">
            <div className="relative h-64 sm:h-80 w-full rounded-2xl overflow-hidden bg-slate-950 group shadow-md">
              <img
                src={imagesList[activeImageIdx]}
                alt={`${property.name} - Vue ${activeImageIdx + 1}`}
                className="w-full h-full object-cover transition-all duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

              {/* Prev / Next Controls */}
              {imagesList.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-md"
                    aria-label="Photo précédente"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <button
                    type="button"
                    onClick={handleNextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-md"
                    aria-label="Photo suivante"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Badges on image */}
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-bold">
                  {property.city} • {property.district}
                </span>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black shadow-sm">
                  {occupancyRate}% Occupé
                </span>
              </div>

              {/* Photo counter */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/70 text-white text-xs font-mono font-bold backdrop-blur-md">
                {activeImageIdx + 1} / {imagesList.length} photos
              </div>
            </div>

            {/* Thumbnails Row */}
            {imagesList.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {imagesList.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`relative w-20 h-14 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                      activeImageIdx === idx
                        ? 'border-brand-500 ring-2 ring-brand-500/20 scale-102 shadow-sm'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Miniature ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ==================================================================== */}
          {/* 2. RECAPITULATIF FINANCIER & PERFORMANCE                             */}
          {/* ==================================================================== */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Lots
              </span>
              <span className="text-xl font-black text-slate-900 block mt-1">
                {property.totalUnits} Lots
              </span>
              <span className="text-[10px] text-slate-500">
                Immeuble complet
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                Taux d'Occupation
              </span>
              <span className="text-xl font-black text-emerald-700 block mt-1">
                {occupancyRate}%
              </span>
              <span className="text-[10px] text-emerald-600 font-bold">
                {property.occupiedUnits} occupés • {vacantUnits} {vacantUnits > 1 ? 'vacants' : 'vacant'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Revenu Mensuel
              </span>
              <span className="text-xl font-black text-brand-600 block mt-1">
                {formatFCFA(property.monthlyRevenue)}
              </span>
              <span className="text-[10px] text-slate-500">
                Loyer brut / mois
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Loyer Moyen
              </span>
              <span className="text-xl font-black text-slate-900 block mt-1">
                {formatFCFA(avgRent)}
              </span>
              <span className="text-[10px] text-slate-500">
                Par lot occupé
              </span>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed">
              <span className="font-black text-slate-900 block mb-1">
                À propos de cette résidence :
              </span>
              <p>{property.description}</p>
            </div>
          )}

          {/* ==================================================================== */}
          {/* 3. ÉQUIPEMENTS CLÉS & INFRASTRUCTURES UEMOA & CEMAC                  */}
          {/* ==================================================================== */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Équipements & Prestations Incluses</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {(property.amenities || [
                'Compteurs Cash Power SBEE individuels par lot',
                'Forage d’eau privé & château d’eau avec surpresseur',
                'Groupe électrogène de secours à démarrage automatique',
                'Gardiennage et surveillance 24h/7j',
                'Portail automatique télécommandé et interphone',
                'Parking intérieur clôturé et sécurisé',
              ]).map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-medium"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ==================================================================== */}
          {/* 4. LOTS & APPARTEMENTS DÉPENDANTS DU BIEN                            */}
          {/* ==================================================================== */}
          <div className="space-y-3 pt-2 border-t border-slate-200/80">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-brand-500" />
                  <span>Lots & Unités Disponibles ({property.unitsList ? property.unitsList.length : property.totalUnits})</span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  Cliquez sur un lot occupé pour voir la fiche locataire ou sur un lot vacant pour rédiger un bail
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push('/leases/new');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-pink-glow transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Rédiger un bail</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(property.unitsList || []).map((l, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    onClose();
                    if (l.status === 'occupe') {
                      router.push('/tenants');
                    } else {
                      router.push('/leases/new');
                    }
                  }}
                  className="p-3.5 bg-slate-50 hover:bg-white hover:shadow-md hover:border-brand-300 rounded-2xl border border-slate-200/80 flex items-center justify-between transition-all cursor-pointer group"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-xs text-slate-900 group-hover:text-brand-600 transition-colors">
                        {l.unit}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          l.status === 'occupe'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {l.status === 'occupe' ? 'Occupé' : 'Vacant'}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">{l.type}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[140px]">
                      {l.tenant}
                    </span>
                  </div>

                  <div className="text-right shrink-0">
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

        {/* Modal Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Supprimer ce bien</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold transition-all cursor-pointer"
          >
            Fermer
          </button>
        </div>

        {/* Confirmation Deletion Overlay Dialog */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>

              <div>
                <h4 className="text-base font-black text-slate-900">
                  Supprimer « {property.name} » ?
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Cette action supprimera définitivement cette résidence et ses {property.totalUnits} lots de votre patrimoine.
                </p>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    onDelete(property.id, property.name);
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/25 transition-all cursor-pointer"
                >
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

