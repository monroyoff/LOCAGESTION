'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  Building,
  Globe,
  MapPin,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Camera,
  UploadCloud,
  Trash2,
  Star,
  Link as LinkIcon,
  Image as ImageIcon,
} from 'lucide-react';
import { COUNTRIES_CITIES } from '@/lib/data/mock-data';
import { RentalListing } from '@/lib/types';
import { formatFCFA } from '@/lib/money/format';
import {
  getUserResidenceCountry,
  getUserResidenceCity,
  resolveLocationCoordinates,
} from '@/lib/services/geo-service';

interface PublishListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (newListing: RentalListing) => void;
}

const PRESET_PHOTOS: { label: string; url: string }[] = [
  {
    label: 'Séjour Standing',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Chambre Climatisée',
    url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Cuisine Équipée',
    url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Immeuble Moderne',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Villa avec Jardin',
    url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Salon Meublé',
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
  },
];

export function PublishListingModal({
  isOpen,
  onClose,
  onPublish,
}: PublishListingModalProps) {
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState<RentalListing['propertyType']>('Chambre salon sanitaire');
  // Pays de résidence renseigné lors de l'inscription / géolocalisation par défaut
  const [country, setCountry] = useState(() => getUserResidenceCountry());
  const [city, setCity] = useState(() => getUserResidenceCity());
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState('');
  const [district, setDistrict] = useState('');
  const [landmark, setLandmark] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [charges, setCharges] = useState('');
  const [depositMonths, setDepositMonths] = useState(2);
  const [advanceMonths, setAdvanceMonths] = useState(1);
  const [surface, setSurface] = useState('');
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);

  // Description détaillée concernant le bien (initialement vide, saisie manuelle libre)
  const [description, setDescription] = useState('');

  // Photos de l'annonce (initialement vide, import obligatoire ou facultatif par l'utilisateur)
  const [images, setImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const defaultCountry = getUserResidenceCountry();
      const defaultCity = getUserResidenceCity();
      setCountry(defaultCountry);
      setCity(defaultCity);
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

  // Upload de fichiers photos locaux
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

    // Reset input value to allow re-selecting the same file if needed
    e.target.value = '';
  };

  // Ajout par lien web
  const handleAddImageUrl = () => {
    if (!urlInput.trim()) return;
    setImages((prev) => [...prev, urlInput.trim()]);
    setUrlInput('');
    setShowUrlInput(false);
  };

  // Suppression d'une photo
  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Définir une photo comme couverture principale (la déplacer en première position)
  const handleSetAsCover = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const updated = [...prev];
      const [selected] = updated.splice(index, 1);
      return [selected, ...updated];
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const countryCodeMap: Record<string, RentalListing['countryCode']> = {
      // Zone UEMOA
      'Bénin': 'BJ',
      'Burkina Faso': 'BF',
      'Côte d’Ivoire': 'CI',
      'Guinée-Bissau': 'GW',
      'Mali': 'ML',
      'Niger': 'NE',
      'Sénégal': 'SN',
      'Togo': 'TG',
      // Zone CEMAC
      'Cameroun': 'CM',
      'Centrafrique': 'CF',
      'Congo': 'CG',
      'Gabon': 'GA',
      'Guinée Équatoriale': 'GQ',
      'Tchad': 'TD',
    };

    const finalImages = images;

    const descriptionLines = description
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const finalCity = isCustomCity && customCity.trim() ? customCity.trim() : city;
    const coords = resolveLocationCoordinates(country, finalCity, district);

    const parsedRent = parseInt(monthlyRent, 10) || 0;
    const parsedCharges = parseInt(charges, 10) || 0;

    const newListing: RentalListing = {
      id: `list-${Date.now()}`,
      title: title || `${propertyType} Moderne à ${district || finalCity}`,
      propertyType,
      country,
      countryCode: countryCodeMap[country] || 'BJ',
      flag: COUNTRIES_CITIES[country]?.flag || '🌍',
      city: finalCity,
      district: district || 'Centre-ville',
      landmark: landmark || 'Accès bitumé et sécurisé',
      latitude: coords.lat,
      longitude: coords.lng,
      monthlyRent: parsedRent,
      charges: parsedCharges,
      depositMonths,
      advanceMonths,
      agencyFees: Math.round(parsedRent * 0.5),
      surface: parseInt(surface, 10) || 0,
      bedrooms,
      bathrooms,
      images: finalImages,
      description: description.trim(),
      descriptionLines: descriptionLines,
      amenities: descriptionLines,
      isVerified: true,
      status: 'disponible',
    };

    onPublish(newListing);
    onClose();
  };

  const cities = COUNTRIES_CITIES[country]?.cities || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm">
                Publier une Nouvelle Annonce de Location
              </h3>
              <p className="text-[10px] text-slate-400">
                Diffusion certifiée sur les 14 pays des zones UEMOA & CEMAC (FCFA)
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
          {/* Badge Pays de Résidence & Géolocalisation */}
          <div className="flex items-center gap-2.5 p-3 bg-brand-50/90 rounded-2xl border border-brand-200/90 text-xs text-brand-950">
            <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
            <div className="leading-snug">
              <span>
                Pays de résidence par défaut appliqué : <strong>{country}</strong> ({city}).
              </span>
              <span className="text-[10px] text-brand-700 block mt-0.5">
                Votre annonce ciblera en exclusivité et priorité les locataires résidant dans cette zone.
              </span>
            </div>
          </div>
          {/* Titre */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Titre de l’annonce *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Chambre Salon Sanitaire Rénovée avec Balcon Personnel"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Type de bien */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Type de bien *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['Chambre salon sanitaire', 'Appartement', 'Meublé', 'Studio', 'Villa', 'Bureau', 'Boutique', 'Autres'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPropertyType(t)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                    propertyType === t
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Description détaillée concernant le bien (Cochée ligne par ligne) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 block">
                Description & Caractéristiques du bien *
              </label>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                1 ligne = 1 puce cochée (✓)
              </span>
            </div>
            <textarea
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Ex:\nChambre spacieuse et lumineuse avec placard\nSalle d’eau privative moderne avec douche et WC\nCompteur Cash Power SBEE individuel\nApprovisionnement régulier en eau avec réserve et suppresseur\nRésidence calme et sécurisée avec gardien 24/7`}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 leading-relaxed"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Chaque ligne saisie dans ce champ sera automatiquement affichée comme un point fort coché avec une coche verte (✓) sur la carte de l'annonce.
            </p>
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

          {/* Quartier & Repère */}
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
                placeholder="Ex: Haie Vive, Ouaga 2000, Cocody..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Repère local africain
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Ex: À 200m de la pharmacie"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-900"
              />
            </div>
          </div>

          {/* Loyer & Charges (FCFA) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Loyer mensuel (FCFA) *
              </label>
              <input
                type="number"
                required
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                placeholder="Ex: 150000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-black text-brand-600 placeholder-slate-400"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Charges mensuelles (FCFA)
              </label>
              <input
                type="number"
                value={charges}
                onChange={(e) => setCharges(e.target.value)}
                placeholder="Ex: 15000 (optionnel)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Surface & Pièces */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Surface (m²)
              </label>
              <input
                type="number"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                placeholder="Ex: 45"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 placeholder-slate-400"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Chambres
              </label>
              <input
                type="number"
                value={bedrooms}
                onChange={(e) => setBedrooms(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Salles d'eau
              </label>
              <input
                type="number"
                value={bathrooms}
                onChange={(e) => setBathrooms(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900"
              />
            </div>
          </div>

          {/* ================================================================= */}
          {/* SECTION AJOUT DE PHOTOS DU LOGEMENT                                */}
          {/* ================================================================= */}
          <div className="space-y-3 pt-3 border-t border-slate-200/80">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-black text-slate-900 block text-xs flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-brand-500" />
                  <span>Photos du logement ({images.length}) *</span>
                </label>
                <span className="text-[11px] text-slate-500">
                  La première photo est la couverture de votre annonce.
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-brand-400" />
                  <span>Importer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Lien URL</span>
                </button>
              </div>
            </div>

            {/* Input file caché */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Champ ajout par URL */}
            {showUrlInput && (
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in duration-150">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Coller l'URL directe d'une image (https://...)"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-1.5 rounded-lg bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 transition-colors cursor-pointer"
                >
                  Ajouter
                </button>
              </div>
            )}

            {/* Dropzone d'importation tactile & clic */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50/70 hover:bg-brand-50/15 rounded-2xl p-4 text-center cursor-pointer transition-all group"
            >
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-brand-500 group-hover:scale-105 transition-all">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-800 group-hover:text-brand-600">
                    Cliquez pour choisir des photos depuis votre appareil
                  </p>
                  <p className="text-[10px] text-slate-400">
                    JPG, PNG ou WEBP • Sélection multiple autorisée
                  </p>
                </div>
              </div>
            </div>

            {/* Grille des photos importées avec gestion (Couverture / Suppression) */}
            {images.length > 0 && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-xs"
                    >
                      <img
                        src={img}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Badge Photo de Couverture */}
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-brand-500 text-white text-[9px] font-black shadow-sm flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-white" />
                          Couverture
                        </span>
                      )}

                      {/* Overlay au survol */}
                      <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetAsCover(idx);
                            }}
                            title="Définir comme photo de couverture"
                            className="p-1.5 rounded-lg bg-white text-slate-900 hover:bg-brand-500 hover:text-white transition-colors cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          title="Supprimer cette photo"
                          className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Survolez une photo pour la supprimer ou la définir en couverture (★)</span>
                  {images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setImages([])}
                      className="text-rose-600 hover:underline font-bold"
                    >
                      Tout vider
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Suggestions / Bibliothèque de photos types */}
            <div className="pt-1.5">
              <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                Ou ajouter des photos de notre catalogue :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PHOTOS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (!images.includes(preset.url)) {
                        setImages((prev) => [...prev, preset.url]);
                      }
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-brand-500" />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
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
              Publier l’annonce ({images.length} {images.length > 1 ? 'photos' : 'photo'})
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
