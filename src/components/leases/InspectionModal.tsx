'use client';

import React, { useState, useRef } from 'react';
import {
  X,
  Camera,
  UploadCloud,
  Trash2,
  ZoomIn,
  CheckCircle2,
  Calendar,
  Zap,
  Droplet,
  Key,
  FileText,
  Download,
  Plus,
  ShieldCheck,
  AlertCircle,
  Eye,
  Layers,
  Sparkles,
} from 'lucide-react';
import { generateInspectionPDF } from '@/lib/export/pdf-download';
import { notifySave } from '@/lib/notifications/action-notifier';

export interface InspectionPhoto {
  id: string;
  url: string;
  label: string;
  room: string;
  timestamp: string;
}

export interface InspectionData {
  type: 'entree' | 'sortie';
  date: string;
  meterCashPower: string;
  meterWater: string;
  keysDelivered: string;
  generalState: 'neuf' | 'tres_bon' | 'bon' | 'rafraichir';
  notes: string;
  photos: InspectionPhoto[];
}

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  leaseId: string;
  propertyName: string;
  unitNumber: string;
  tenantName: string;
  inspectionData: InspectionData;
  onSave: (data: InspectionData) => void;
}

const ROOM_OPTIONS = [
  'Salon / Séjour',
  'Chambre principale',
  'Chambre 2',
  'Cuisine',
  'Salle d’eau / WC',
  'Entrée / Couloir',
  'Compteurs & Tableaux',
  'Balcon / Terrasse',
  'Autre',
];

export function InspectionModal({
  isOpen,
  onClose,
  leaseId,
  propertyName,
  unitNumber,
  tenantName,
  inspectionData: initialData,
  onSave,
}: InspectionModalProps) {
  const [data, setData] = useState<InspectionData>(initialData);
  const [activeTab, setActiveTab] = useState<'photos' | 'meters' | 'notes'>('photos');
  const [previewPhoto, setPreviewPhoto] = useState<InspectionPhoto | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle uploading local photos (multiple supported)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newPhotos: InspectionPhoto[] = [];
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('fr-FR');
    const timeFormatted = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const timestampStr = `${dateFormatted} à ${timeFormatted}`;

    let processedCount = 0;
    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        if (resultUrl) {
          newPhotos.push({
            id: `photo-${Date.now()}-${index}`,
            url: resultUrl,
            label: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            room: 'Salon / Séjour',
            timestamp: timestampStr,
          });
        }
        processedCount++;
        if (processedCount === files.length) {
          setData((prev) => ({
            ...prev,
            photos: [...prev.photos, ...newPhotos],
          }));
          setIsUploading(false);
          notifySave(`${newPhotos.length} photo(s) ajoutée(s) à l'état des lieux.`, 'Photos importées !');
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add preset template photo if needed
  const handleAddPresetPhoto = (room: string, defaultLabel: string, presetUrl: string) => {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('fr-FR');
    const timeFormatted = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const newPhoto: InspectionPhoto = {
      id: `photo-${Date.now()}`,
      url: presetUrl,
      label: defaultLabel,
      room,
      timestamp: `${dateFormatted} à ${timeFormatted}`,
    };

    setData((prev) => ({
      ...prev,
      photos: [newPhoto, ...prev.photos],
    }));
    notifySave(`Photo de ${room} ajoutée avec succès.`, 'Photo enregistrée !');
  };

  const handleDeletePhoto = (id: string) => {
    setData((prev) => ({
      ...prev,
      photos: prev.photos.filter((p) => p.id !== id),
    }));
  };

  const handleUpdatePhoto = (id: string, field: 'label' | 'room', value: string) => {
    setData((prev) => ({
      ...prev,
      photos: prev.photos.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    }));
  };

  const handleDownloadPDF = () => {
    generateInspectionPDF({
      id: leaseId || 'BAIL-2026-N09',
      tenantName: tenantName || 'Locataire',
      propertyName: propertyName || 'Résidence Les Cocotiers',
      unit: unitNumber || 'Lot A1',
      date: data.date,
      meterCashPower: data.meterCashPower,
      meterWater: data.meterWater,
      keysDelivered: data.keysDelivered,
      generalState:
        data.generalState === 'neuf'
          ? 'Neuf / Rénovation complète'
          : data.generalState === 'tres_bon'
          ? 'Très bon état d’usage'
          : data.generalState === 'bon'
          ? 'Bon état général'
          : 'À rafraîchir',
    });
    notifySave('Téléchargement du procès-verbal d’état des lieux en PDF officiel.', 'PDF Généré !');
  };

  const handleSaveAndClose = () => {
    onSave(data);
    notifySave(
      `Procès-verbal d'état des lieux validé avec ${data.photos.length} photos horodatées annexées.`,
      'État des lieux annexé au bail !'
    );
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-4xl max-h-[92vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
          
          {/* HEADER */}
          <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    État des Lieux & Constat Photo
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {data.type === 'entree' ? 'État des Lieux d’Entrée' : 'État des Lieux de Sortie'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {propertyName} • Lot {unitNumber} • Locataire : <span className="text-white font-bold">{tenantName || 'En cours'}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* NAVIGATION TABS */}
          <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('photos')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all cursor-pointer border-b-2 ${
                  activeTab === 'photos'
                    ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Photos & Constats Visuels</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                  {data.photos.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('meters')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all cursor-pointer border-b-2 ${
                  activeTab === 'meters'
                    ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span>Relevé des Compteurs & Clés</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-black transition-all cursor-pointer border-b-2 ${
                  activeTab === 'notes'
                    ? 'border-emerald-600 text-emerald-700 bg-white shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Réserves & Observations</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 mb-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer shadow-xs"
              title="Télécharger le modèle de procès-verbal"
            >
              <Download className="w-3.5 h-3.5 text-brand-600" />
              <span>Télécharger PV (PDF)</span>
            </button>
          </div>

          {/* MODAL BODY */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
            
            {/* TAB 1: PHOTOS & VISUAL EVIDENCE */}
            {activeTab === 'photos' && (
              <div className="space-y-6 animate-in fade-in duration-150">
                
                {/* Upload Action Area */}
                <div className="p-5 rounded-3xl bg-emerald-500/5 border-2 border-dashed border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 text-center sm:text-left">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-500/20">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        Ajoutez des photos de l'état des lieux
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Importez vos photos réelles depuis votre téléphone ou ordinateur (JPG, PNG). Horodatage certifié automatique.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{isUploading ? 'Import en cours...' : '+ Prendre / Ajouter des photos'}</span>
                    </button>
                  </div>
                </div>

                {/* Quick Add Presets / Suggestions */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Ajout instantané de pièces types (Exemples de référence) :</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Cliquez pour ajouter</span>
                  </div>
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    <button
                      type="button"
                      onClick={() =>
                        handleAddPresetPhoto(
                          'Compteurs & Tableaux',
                          'Compteur électrique & Index d’entrée',
                          'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80'
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-xs"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>+ Compteur électrique</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddPresetPhoto(
                          'Salon / Séjour',
                          'Vue générale du salon & carrelage',
                          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80'
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-xs"
                    >
                      <Layers className="w-3.5 h-3.5 text-brand-500" />
                      <span>+ Salon / Séjour</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddPresetPhoto(
                          'Cuisine',
                          'Plan de travail, évier & robinetterie',
                          'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80'
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-xs"
                    >
                      <Droplet className="w-3.5 h-3.5 text-blue-500" />
                      <span>+ Cuisine & Évier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddPresetPhoto(
                          'Salle d’eau / WC',
                          'Douche sanitaire & lavabo neuf',
                          'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&auto=format&fit=crop&q=80'
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-xs"
                    >
                      <Droplet className="w-3.5 h-3.5 text-emerald-500" />
                      <span>+ Sanitaires / Salle d’eau</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddPresetPhoto(
                          'Entrée / Couloir',
                          'Trousseau de clés & télécommandes remises',
                          'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800&auto=format&fit=crop&q=80'
                        )
                      }
                      className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-emerald-500 text-[11px] font-bold text-slate-700 flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer shadow-xs"
                    >
                      <Key className="w-3.5 h-3.5 text-rose-500" />
                      <span>+ Remise des clés</span>
                    </button>
                  </div>
                </div>

                {/* Photos Grid */}
                {data.photos.length === 0 ? (
                  <div className="py-12 px-4 text-center rounded-3xl border border-slate-200 bg-slate-50 space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center mx-auto shadow-xs">
                      <Camera className="w-7 h-7" />
                    </div>
                    <div className="max-w-sm mx-auto">
                      <h4 className="text-sm font-bold text-slate-800">Aucune photo enregistrée</h4>
                      <p className="text-xs text-slate-500 mt-1">
                        Prenez des photos de chaque pièce du logement (compteurs, murs, sols, sanitaires) pour garantir la conformité contradictoire.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.photos.map((photo) => (
                      <div
                        key={photo.id}
                        className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
                      >
                        {/* Image Preview Thumbnail */}
                        <div className="relative h-44 bg-slate-900 overflow-hidden cursor-pointer">
                          <img
                            src={photo.url}
                            alt={photo.label}
                            onClick={() => setPreviewPhoto(photo)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-900/80 backdrop-blur-md text-white border border-white/20">
                              {photo.room}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeletePhoto(photo.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white shadow-sm transition-colors cursor-pointer"
                            title="Supprimer cette photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <div
                            onClick={() => setPreviewPhoto(photo)}
                            className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-slate-900/70 text-white hover:bg-slate-900 transition-colors"
                            title="Agrandir la photo"
                          >
                            <ZoomIn className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        {/* Card Info & Caption Editing */}
                        <div className="p-3.5 space-y-2.5 flex-1 flex flex-col justify-between">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                              Légende / Constat :
                            </label>
                            <input
                              type="text"
                              value={photo.label}
                              onChange={(e) => handleUpdatePhoto(photo.id, 'label', e.target.value)}
                              placeholder="Description de la photo..."
                              className="w-full px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                            <select
                              value={photo.room}
                              onChange={(e) => handleUpdatePhoto(photo.id, 'room', e.target.value)}
                              className="px-2 py-1 rounded-lg bg-slate-100 text-[10px] font-bold text-slate-700 border-none focus:outline-none cursor-pointer"
                            >
                              {ROOM_OPTIONS.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                            <span className="font-mono text-slate-400">{photo.timestamp}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: METERS & KEYS */}
            {activeTab === 'meters' && (
              <div className="space-y-5 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Compteur Électricité */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                    <label className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span>Compteur Électricité (Index & Référence)</span>
                    </label>
                    <input
                      type="text"
                      value={data.meterCashPower}
                      onChange={(e) => setData({ ...data, meterCashPower: e.target.value })}
                      placeholder="Ex: 1 420 kWh (Cash Power N° 041289238)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                    <p className="text-[11px] text-slate-500">
                      Indiquez l’index de départ et le numéro de série du compteur (SBEE, CIE, etc.).
                    </p>
                  </div>

                  {/* Compteur Eau */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                    <label className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-blue-500" />
                      <span>Compteur d’Eau (Index & Référence)</span>
                    </label>
                    <input
                      type="text"
                      value={data.meterWater}
                      onChange={(e) => setData({ ...data, meterWater: e.target.value })}
                      placeholder="Ex: 384 m³ (SODECI / SONEB N° 99312)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                    <p className="text-[11px] text-slate-500">
                      Relevé d'index volumétrique en mètres cubes le jour de la remise des clés.
                    </p>
                  </div>

                  {/* Clés remises */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2 sm:col-span-2">
                    <label className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
                      <Key className="w-4 h-4 text-emerald-600" />
                      <span>Inventaire des Clés, Badges & Télécommandes Remis</span>
                    </label>
                    <input
                      type="text"
                      value={data.keysDelivered}
                      onChange={(e) => setData({ ...data, keysDelivered: e.target.value })}
                      placeholder="Ex: 3 clés de sûreté porte d'entrée + 1 télécommande portail + 1 badge"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                    <p className="text-[11px] text-slate-500">
                      Mentionnez le nombre exact de clés et accès remis au locataire signataire.
                    </p>
                  </div>
                </div>

                {/* État Général du Logement */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <label className="text-xs font-black uppercase text-slate-700 block">
                    Appréciation Globale de l'État du Logement :
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { id: 'neuf', label: 'Neuf / Rénové', color: 'emerald' },
                      { id: 'tres_bon', label: 'Très bon état', color: 'emerald' },
                      { id: 'bon', label: 'Bon état d’usage', color: 'blue' },
                      { id: 'rafraichir', label: 'À rafraîchir', color: 'amber' },
                    ].map((state) => {
                      const isSelected = data.generalState === state.id;
                      return (
                        <button
                          key={state.id}
                          type="button"
                          onClick={() => setData({ ...data, generalState: state.id as any })}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                            isSelected
                              ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20 shadow-xs'
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {state.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: NOTES & RESERVES */}
            {activeTab === 'notes' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
                  <label className="text-xs font-black uppercase text-slate-700 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Observations & Réserves Contradictoires</span>
                  </label>
                  <textarea
                    rows={6}
                    value={data.notes}
                    onChange={(e) => setData({ ...data, notes: e.target.value })}
                    placeholder="Notez ici les constats particuliers (ex: micro-rayures plinthes, peinture neuve refaite le 10/11, bon fonctionnement des climatiseurs et chauffe-eau)..."
                    className="w-full p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all leading-relaxed"
                  />
                  <p className="text-[11px] text-slate-500">
                    Ces observations seront textuellement intégrées au procès-verbal officiel contradictoire et annexées au bail.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold block">Valeur Légale et Preuve Contradictoire OHADA & UEMOA :</span>
                    <p className="text-[11px] text-emerald-700 leading-relaxed">
                      L'état des lieux d'entrée établi en présence du bailleur et du locataire fait foi absolue de l'état du bien au moment de la remise des clés. Les photos horodatées font foi contre tout litige ultérieur lors de la restitution du dépôt de garantie.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FOOTER ACTIONS */}
          <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>
                <strong className="text-slate-900">{data.photos.length} photo(s)</strong> horodatée(s) prêtes à être annexées au contrat
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleSaveAndClose}
                className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Enregistrer & Annexer au Bail</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FULL-SCREEN PHOTO LIGHTBOX PREVIEW */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div className="relative max-w-3xl max-h-[85vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col">
            <div className="p-4 bg-slate-900/90 text-white flex items-center justify-between border-b border-white/10">
              <div>
                <h4 className="text-sm font-bold">{previewPhoto.label}</h4>
                <p className="text-[11px] text-slate-400">
                  {previewPhoto.room} • Prise le {previewPhoto.timestamp}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center p-2 overflow-hidden bg-black">
              <img
                src={previewPhoto.url}
                alt={previewPhoto.label}
                className="max-w-full max-h-[70vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

