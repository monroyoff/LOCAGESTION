'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search,
  X,
  Globe,
  MapPin,
  Coins,
  Building,
  RotateCcw,
  ArrowRight,
  Check,
  Sparkles,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { COUNTRIES_CITIES, MOCK_RENTAL_LISTINGS } from '@/lib/data/mock-data';
import { RentalListing } from '@/lib/types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

const PROPERTY_TYPES = ['Tous', 'Appartement', 'Studio', 'Villa', 'Bureau', 'Boutique'];

const PRICE_PRESETS = [
  { label: 'Tous', min: 0, max: 0 },
  { label: '< 100k', min: 0, max: 100000 },
  { label: '100k - 250k', min: 100000, max: 250000 },
  { label: '250k - 500k', min: 250000, max: 500000 },
  { label: '500k - 1M', min: 500000, max: 1000000 },
  { label: '> 1M', min: 1000000, max: 0 },
];

export function GlobalSearchModal({
  isOpen,
  onClose,
  initialQuery = '',
}: GlobalSearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter States
  const [query, setQuery] = useState(initialQuery);
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedType, setSelectedType] = useState('Tous');
  const [pricePresetIdx, setPricePresetIdx] = useState(0);
  const [customMaxPrice, setCustomMaxPrice] = useState('');

  // Auto focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Synchronize initial query
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle country switch
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    if (country === 'all') {
      setSelectedCity('all');
    } else {
      const validCities = COUNTRIES_CITIES[country]?.cities || [];
      if (!validCities.includes(selectedCity)) {
        setSelectedCity('all');
      }
    }
  };

  // Available cities based on selected country
  const availableCities = useMemo(() => {
    if (selectedCountry === 'all') {
      return Array.from(
        new Set(Object.values(COUNTRIES_CITIES).flatMap((c) => c.cities))
      ).sort();
    }
    return COUNTRIES_CITIES[selectedCountry]?.cities || [];
  }, [selectedCountry]);

  // Calculate matching budget range
  const { minRent, maxRent } = useMemo(() => {
    if (customMaxPrice) {
      return { minRent: 0, maxRent: parseInt(customMaxPrice, 10) || 0 };
    }
    const preset = PRICE_PRESETS[pricePresetIdx];
    return { minRent: preset.min, maxRent: preset.max };
  }, [pricePresetIdx, customMaxPrice]);

  // Real-time matching listings calculation
  const matchingListings = useMemo(() => {
    return MOCK_RENTAL_LISTINGS.filter((l) => {
      // Country
      if (selectedCountry !== 'all' && l.country !== selectedCountry) {
        return false;
      }
      // City
      if (selectedCity !== 'all' && l.city !== selectedCity) {
        return false;
      }
      // Type
      if (selectedType !== 'Tous' && l.propertyType !== selectedType) {
        return false;
      }
      // Budget
      if (minRent > 0 && l.monthlyRent < minRent) {
        return false;
      }
      if (maxRent > 0 && l.monthlyRent > maxRent) {
        return false;
      }
      // Query text
      if (query.trim()) {
        const q = query.toLowerCase().trim();
        const matchesTitle = l.title.toLowerCase().includes(q);
        const matchesDistrict = l.district.toLowerCase().includes(q);
        const matchesLandmark = l.landmark.toLowerCase().includes(q);
        const matchesCity = l.city.toLowerCase().includes(q);
        const matchesCountry = l.country.toLowerCase().includes(q);
        const matchesAmenities = l.amenities.some((a) => a.toLowerCase().includes(q));

        if (
          !matchesTitle &&
          !matchesDistrict &&
          !matchesLandmark &&
          !matchesCity &&
          !matchesCountry &&
          !matchesAmenities
        ) {
          return false;
        }
      }
      return true;
    });
  }, [selectedCountry, selectedCity, selectedType, minRent, maxRent, query]);

  // Check if any filter is active
  const hasActiveFilters =
    query.trim() !== '' ||
    selectedCountry !== 'all' ||
    selectedCity !== 'all' ||
    selectedType !== 'Tous' ||
    pricePresetIdx !== 0 ||
    customMaxPrice !== '';

  // Reset all filters
  const resetFilters = () => {
    setQuery('');
    setSelectedCountry('all');
    setSelectedCity('all');
    setSelectedType('Tous');
    setPricePresetIdx(0);
    setCustomMaxPrice('');
  };

  // Submit and Navigate to /listings with query params
  const handleLaunchSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('q', query.trim());
    if (selectedCountry !== 'all') params.set('country', selectedCountry);
    if (selectedCity !== 'all') params.set('city', selectedCity);
    if (selectedType !== 'Tous') params.set('type', selectedType);
    if (maxRent > 0) params.set('maxPrice', maxRent.toString());

    onClose();
    router.push(`/listings?${params.toString()}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      {/* Click outside backdrop area */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Main Filter Console Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden my-4 sm:my-8 animate-in zoom-in-95 duration-200">
        {/* Header Bar */}
        <div className="px-5 sm:px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>Moteur de Recherche Multi-Critères</span>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-500 text-white">
                  9 Pays UEMOA & CEMAC
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Configurez vos critères pour afficher les logements disponibles en temps réel
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Query Input */}
        <form onSubmit={handleLaunchSearch} className="p-5 sm:p-6 space-y-5">
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-1.5">
              <Search className="w-3.5 h-3.5 text-brand-500" />
              <span>Mot-clé / Quartier / Caractéristique</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Haie Vive, Ouaga 2000, ACI 2000, Plateau, Piscine, Clim..."
                className="w-full pl-10 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Section 1 : Pays (9 pays UEMOA & CEMAC) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-brand-500" />
                <span>1. Pays ({Object.keys(COUNTRIES_CITIES).length} disponibles)</span>
              </label>
              {selectedCountry !== 'all' && (
                <button
                  type="button"
                  onClick={() => handleCountryChange('all')}
                  className="text-[11px] font-bold text-brand-600 hover:underline cursor-pointer"
                >
                  Tous les pays
                </button>
              )}
            </div>

            {/* Quick Country Buttons */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => handleCountryChange('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedCountry === 'all'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                }`}
              >
                🌍 Tous
              </button>
              {Object.entries(COUNTRIES_CITIES).map(([country, data]) => (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleCountryChange(country)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedCountry === country
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/80'
                  }`}
                >
                  <span>{data.flag}</span>
                  <span>{country}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2 : Ville & Budget Loyer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Ville */}
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-brand-500" />
                <span>2. Ville</span>
              </label>
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="all">📍 Toutes les villes ({availableCities.length})</option>
                  {availableCities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Budget Loyer (FCFA) */}
            <div>
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-1.5">
                <Coins className="w-3.5 h-3.5 text-emerald-600" />
                <span>3. Budget Loyer (FCFA)</span>
              </label>
              <div className="relative">
                <select
                  value={customMaxPrice ? 'custom' : pricePresetIdx}
                  onChange={(e) => {
                    if (e.target.value === 'custom') return;
                    setPricePresetIdx(parseInt(e.target.value, 10));
                    setCustomMaxPrice('');
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                >
                  {PRICE_PRESETS.map((preset, idx) => (
                    <option key={idx} value={idx}>
                      💰 {preset.label} {preset.max > 0 ? 'FCFA' : ''}
                    </option>
                  ))}
                  {customMaxPrice && (
                    <option value="custom">
                      Max : {formatFCFA(customMaxPrice)}
                    </option>
                  )}
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Section 3 : Type de Bien */}
          <div>
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-2">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>4. Type de Bien</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSelectedType(type)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    selectedType === type
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Real-time Matching Preview */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-bold text-slate-800">
                  {matchingListings.length} logement{matchingListings.length > 1 ? 's' : ''} correspondant{matchingListings.length > 1 ? 's' : ''}
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-400">
                Zone UEMOA • FCFA
              </span>
            </div>

            {/* Quick Listing Previews (First 2) */}
            {matchingListings.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {matchingListings.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      onClose();
                      router.push(`/listings?country=${encodeURIComponent(item.country)}&city=${encodeURIComponent(item.city)}`);
                    }}
                    className="p-2 rounded-xl bg-white border border-slate-200 flex items-center gap-2.5 hover:border-brand-300 hover:shadow-sm cursor-pointer transition-all"
                  >
                    <img
                      src={item.images[0]}
                      alt={item.title}
                      className="w-11 h-11 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {item.title}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                        <span>{item.flag}</span>
                        <span>{item.city} ({item.district})</span>
                      </p>
                      <p className="text-[11px] font-extrabold text-brand-600">
                        {formatFCFA(item.monthlyRent)}/mois
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Footer */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {hasActiveFilters ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Réinitialiser les filtres</span>
              </button>
            ) : (
              <span className="text-[11px] text-slate-400">
                Sélectionnez vos critères
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Fermer
              </button>

              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs font-black shadow-pink-glow active:scale-95 transition-all cursor-pointer"
              >
                <span>Afficher les {matchingListings.length} résultats</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

