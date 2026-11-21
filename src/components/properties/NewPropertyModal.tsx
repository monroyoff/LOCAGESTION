'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  Building2,
  MapPin,
  Coins,
  ShieldCheck,
  Camera,
  UploadCloud,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { COUNTRIES_CITIES } from '@/lib/data/mock-data';
import { Property } from '@/lib/types';
import { formatFCFA } from '@/lib/money/format';
import { getUserResidenceCountry, getUserResidenceCity } from '@/lib/services/geo-service';
import { AuthService } from '@/lib/services/auth-service';
import { PropertyService } from '@/lib/services/property-service';

interface NewPropertyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProperty: (newProperty: Property) => void;
}

const PRESET_PROPERTY_PHOTOS = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&auto=format&fit=crop&q=80',
];

const PROPERTY_TYPES = [
  'Chambre salon sanitaire',
  'Appartement',
  'Meublé',
  'Studio',
  'Villa',
  'Bureau',
  'Boutique',
  'Immeuble',
  'Résidence',
  'Autres',
] as const;

export function NewPropertyModal({
  isOpen,
  onClose,
  onAddProperty,
}: NewPropertyModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<string>('Chambre salon sanitaire');
  const [country, setCountry] = useState(() => getUserResidenceCountry());
  const [city, setCity] = useState(() => getUserResidenceCity());
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [totalUnits, setTotalUnits] = useState(1);
  const [monthlyRevenue, setMonthlyRevenue] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setCountry(getUserResidenceCountry());
      setCity(getUserResidenceCity());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCountryChange = (c: string) => {
    setCountry(c);
    setIsCustomCity(false);
    setCustomCity('');
    const cities = COUNTRIES_CITIES[c]?.cities || [];
    if (cities.length > 0) {
      setCity(cities[0]);
    }
  };

  const handleCitySelect = (val: string) => {
    if (val === '__custom__') {
      setIsCustomCity(true);
    } else {
      setIsCustomCity(false);
      setCity(val);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setImages((prev) => [...prev, uploadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalImages = images;
    const unitsCount = Math.max(1, totalUnits);
    const rev = parseInt(monthlyRevenue, 10) || 0;
    const rentPerUnit = unitsCount > 0 ? Math.round(rev / unitsCount) : rev;

    // À la création du bien, chaque lot est libre et vacant (pas de surface fictive par défaut)
    const generatedUnits = Array.from({ length: unitsCount }).map((_, idx) => ({
      unit: `Lot ${idx + 1}`,
      type: idx === 0 ? (type || 'Chambre Salon Sanitaire') : `${idx + 1} Pièces`,
      surface: 0,
      rent: rentPerUnit,
      tenant: 'Disponible',
      status: 'vacant' as const,
    }));

    const finalCity = isCustomCity && customCity.trim() ? customCity.trim() : city;

    const currentUser = AuthService.getCurrentUser();

    const newProperty: Property = {
      id: `prop-${Date.now()}`,
      name: name || `Résidence ${district || finalCity}`,
      type,
      address: address || `Rue Principale, ${district || finalCity}`,
      city: finalCity,
      district: district || 'Centre-ville',
      country,
      totalUnits: unitsCount,
      occupiedUnits: 0, // 0 lot occupé à l'enregistrement initial du bien
      monthlyRevenue: rev,
      imageUrl: finalImages[0] || '',
      images: finalImages,
      description: description.trim(),
      amenities: [
        'Compteurs d’électricité individuels',
        'Réserve d’eau et surpresseur',
        'Gardiennage et sécurité 24h/7j',
        'Parking clôturé',
      ],
      unitsList: generatedUnits,
      authorId: currentUser?.id,
      authorName: currentUser?.name || 'Bailleur Propriétaire',
      authorEmail: currentUser?.email || 'bailleur@locagestion.site',
      authorPhone: currentUser?.phone || '+229 01 00 00 00',
      authorCompany: currentUser?.companyName,
      authorMatricule: currentUser?.matricule,
      authorRole: currentUser?.role || 'bailleur',
      createdAt: new Date().toLocaleDateString('fr-FR'),
    };

    const saved = PropertyService.saveProperty(newProperty, currentUser);
    onAddProperty(saved);
    onClose();
  };

  const cities = COUNTRIES_CITIES[country]?.cities || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">
                Ajouter une Nouvelle Propriété / Immeuble
              </h3>
              <p className="text-[10px] text-slate-400">
                Enregistrement dans votre patrimoine immobilier
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Nom du bien */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Nom du bien / résidence *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Chambre Salon Sanitaire Fidjrossè, Appartement 3 Pièces Haie Vive..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Type de bien (Identique à l'espace locataire & annonces) */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Type de bien *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PROPERTY_TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setType(t);
                    if (t === 'Chambre salon sanitaire' || t === 'Studio') {
                      if (totalUnits > 4) setTotalUnits(1);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    type === t
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Pays & Ville */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Pays *
              </label>
              <select
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900"
              >
                {Object.entries(COUNTRIES_CITIES).map(([c, data]) => (
                  <option key={c} value={c}>
                    {data.flag} {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  Ville *
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {cities.length} villes
                </span>
              </div>
              <select
                value={isCustomCity ? '__custom__' : city}
                onChange={(e) => handleCitySelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900"
              >
                {cities.map((ci) => (
                  <option key={ci} value={ci}>
                    {ci}
                  </option>
                ))}
                <option value="__custom__">✨ Autre ville (saisir manuellement)...</option>
              </select>

              {isCustomCity && (
                <div className="mt-2 animate-in fade-in duration-150">
                  <input
                    type="text"
                    required
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="Préciser le nom de la ville ou commune..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-brand-400 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Quartier & Adresse */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Quartier *
              </label>
              <input
                type="text"
                required
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="Ex: Haie Vive, Cocody..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Adresse exacte
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ex: Rue 340, Face Pharmacie"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Nombre de lots & Revenu total */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Nombre total de lots / appartements *
              </label>
              <input
                type="number"
                min="1"
                required
                value={totalUnits}
                onChange={(e) => setTotalUnits(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Revenu mensuel attendu (FCFA) *
              </label>
              <input
                type="number"
                required
                value={monthlyRevenue}
                onChange={(e) => setMonthlyRevenue(e.target.value)}
                placeholder="Ex: 250000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-black text-brand-600 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Photos */}
          <div className="space-y-2 pt-2 border-t border-slate-200/80">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-900 block text-xs flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-brand-500" />
                <span>Photos de la propriété ({images.length})</span>
              </label>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Importer</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {images.length > 0 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden aspect-video border border-slate-200 bg-slate-100">
                    <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-rose-400 hover:text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-extrabold shadow-pink-glow active:scale-95 transition-all cursor-pointer"
            >
              Ajouter au patrimoine
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

