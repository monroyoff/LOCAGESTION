'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSpace } from '@/lib/context/space-context';
import { formatFCFA } from '@/lib/money/format';
import { RentalListing } from '@/lib/types';
import { MOCK_RENTAL_LISTINGS } from '@/lib/data/mock-data';
import {
  Compass,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Sparkles,
  Phone,
  MessageCircle,
  Eye,
  ShieldCheck,
  Zap,
  Droplet,
  Wifi,
  Shield,
  Plus,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Share2,
  Building2,
  Clock,
  ArrowRight,
  RotateCcw,
  Check,
  Globe,
  Coins,
} from 'lucide-react';

// Pays & Villes d'Afrique de l'Ouest et Centrale couvertes par LOCAGESTION
const COUNTRIES_CITIES: Record<string, { flag: string; cities: string[] }> = {
  'Bénin': {
    flag: '🇧🇯',
    cities: ['Cotonou', 'Abomey-Calavi', 'Porto-Novo', 'Parakou'],
  },
  'Côte d’Ivoire': {
    flag: '🇨🇮',
    cities: ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro'],
  },
  'Sénégal': {
    flag: '🇸🇳',
    cities: ['Dakar', 'Thiès', 'Saly', 'Saint-Louis'],
  },
  'Togo': {
    flag: '🇹🇬',
    cities: ['Lomé', 'Kpalimé'],
  },
  'Cameroun': {
    flag: '🇨🇲',
    cities: ['Douala', 'Yaoundé'],
  },
};

const ALL_CITIES = Array.from(
  new Set(Object.values(COUNTRIES_CITIES).flatMap((c) => c.cities))
).sort();

const PRICE_PRESETS = [
  { label: 'Tous les montants', min: 0, max: 0 },
  { label: '< 100 000 FCFA', min: 0, max: 100000 },
  { label: '100 000 - 250 000 FCFA', min: 100000, max: 250000 },
  { label: '250 000 - 500 000 FCFA', min: 250000, max: 500000 },
  { label: '500 000 - 1 000 000 FCFA', min: 500000, max: 1000000 },
  { label: '> 1 000 000 FCFA', min: 1000000, max: 0 },
];

const PROPERTY_TYPES = ['Tous', 'Appartement', 'Studio', 'Villa', 'Bureau', 'Boutique'];

export default function ListingsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeSpace, switchSpace, isLandlord, isTenant } = useSpace();

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');
  const [selectedCity, setSelectedCity] = useState('all');
  const [pricePresetIdx, setPricePresetIdx] = useState(0);
  const [customMinPrice, setCustomMinPrice] = useState<string>('');
  const [customMaxPrice, setCustomMaxPrice] = useState<string>('');
  const [selectedPropertyType, setSelectedPropertyType] = useState('Tous');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc' | 'surface_desc'>('featured');

  // Modals & Notifications
  const [selectedListingForVisit, setSelectedListingForVisit] = useState<RentalListing | null>(null);
  const [visitDate, setVisitDate] = useState('2026-11-04');
  const [visitTimeSlot, setVisitTimeSlot] = useState('15:00 - 17:00');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Sync with URL Query Parameters (ex: from Global Header Search)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      const country = params.get('country');
      const city = params.get('city');
      const maxPrice = params.get('maxPrice');
      const type = params.get('type');

      if (q) setSearchQuery(q);
      if (country && (country in COUNTRIES_CITIES || country === 'all')) {
        setSelectedCountry(country);
      }
      if (city) setSelectedCity(city);
      if (maxPrice) setCustomMaxPrice(maxPrice);
      if (type && PROPERTY_TYPES.includes(type)) setSelectedPropertyType(type);
    }
  }, []);

  // When country changes, reset city if it does not belong to the selected country
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

  // Cities available based on country selection
  const availableCities = useMemo(() => {
    if (selectedCountry === 'all') {
      return ALL_CITIES;
    }
    return COUNTRIES_CITIES[selectedCountry]?.cities || [];
  }, [selectedCountry]);

  // Compute Active Price Range
  const { minRent, maxRent } = useMemo(() => {
    if (customMinPrice || customMaxPrice) {
      return {
        minRent: customMinPrice ? parseInt(customMinPrice, 10) || 0 : 0,
        maxRent: customMaxPrice ? parseInt(customMaxPrice, 10) || 0 : 0,
      };
    }
    const preset = PRICE_PRESETS[pricePresetIdx];
    return { minRent: preset.min, maxRent: preset.max };
  }, [pricePresetIdx, customMinPrice, customMaxPrice]);

  // Filter listings
  const filteredListings = useMemo(() => {
    return MOCK_RENTAL_LISTINGS.filter((l) => {
      // 1. Country Filter
      if (selectedCountry !== 'all' && l.country !== selectedCountry) {
        return false;
      }

      // 2. City Filter
      if (selectedCity !== 'all' && l.city !== selectedCity) {
        return false;
      }

      // 3. Property Type Filter
      if (selectedPropertyType !== 'Tous' && l.propertyType !== selectedPropertyType) {
        return false;
      }

      // 4. Rent Amount Filter
      if (minRent > 0 && l.monthlyRent < minRent) {
        return false;
      }
      if (maxRent > 0 && l.monthlyRent > maxRent) {
        return false;
      }

      // 5. Text Search (title, district, landmark, amenities, city, country)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
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
    }).sort((a, b) => {
      if (sortBy === 'price_asc') return a.monthlyRent - b.monthlyRent;
      if (sortBy === 'price_desc') return b.monthlyRent - a.monthlyRent;
      if (sortBy === 'surface_desc') return b.surface - a.surface;
      // Default: verified first, then ID
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      return 0;
    });
  }, [
    selectedCountry,
    selectedCity,
    selectedPropertyType,
    minRent,
    maxRent,
    searchQuery,
    sortBy,
  ]);

  // Clear all filters back to default
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCountry('all');
    setSelectedCity('all');
    setPricePresetIdx(0);
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setSelectedPropertyType('Tous');
    setSortBy('featured');
    showToast('Filtres de recherche réinitialisés.');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCountry !== 'all' ||
    selectedCity !== 'all' ||
    pricePresetIdx !== 0 ||
    customMinPrice !== '' ||
    customMaxPrice !== '' ||
    selectedPropertyType !== 'Tous';

  // Calculate total upfront move-in cost (Loyer + Caution + Avance + Agence)
  const calculateTotalEntryCost = (l: RentalListing) => {
    const depositTotal = l.monthlyRent * l.depositMonths;
    const advanceTotal = l.monthlyRent * l.advanceMonths;
    return l.monthlyRent + l.charges + depositTotal + advanceTotal + l.agencyFees;
  };

  const handleBookVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListingForVisit) return;
    showToast(
      `Demande de visite confirmée pour le ${visitDate} (${visitTimeSlot}) — ${selectedListingForVisit.title} ! Notification envoyée au bailleur.`
    );
    setSelectedListingForVisit(null);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex">
      {/* 1. Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSpace={activeSpace}
        onSpaceChange={switchSpace}
      />

      {/* 2. Main Layout */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenQuickAction={() => {}}
        />

        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Title & Publisher Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Recherche de Locations & Biens Disponibles
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-brand-50 text-brand-600 border border-brand-200">
                  Zone UEMOA & CEMAC
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Explorez les logements vérifiés avec filtres stricts par pays, ville, budget en FCFA et décomposition transparente du coût d'entrée.
              </p>
            </div>

            {/* SEULEMENT LE BAILLEUR PEUT PUBLIER UNE ANNONCE */}
            {isLandlord && (
              <button
                type="button"
                onClick={() => showToast('Ouverture de l’assistant de publication d’annonce')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-extrabold shadow-pink-glow active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Publier une annonce</span>
              </button>
            )}

            {/* LE LOCATAIRE EXPLORE ET TROUVE UN LOGEMENT SANS BOUTON BAILLEUR */}
            {isTenant && (
              <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold self-start sm:self-auto">
                <Compass className="w-4 h-4 text-emerald-600" />
                <span>Recherche de logement certifiée</span>
              </div>
            )}
          </div>

          {/* ==================================================================== */}
          {/* CONSOLE DE RECHERCHE & FILTRES MULTI-CRITÈRES                        */}
          {/* ==================================================================== */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-soft space-y-4">
            {/* Ligne 1 : Mot-clé, Pays, Ville, Montant (Les 3 filtres demandés) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Filtre 1 : Pays */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-1.5">
                  <Globe className="w-3.5 h-3.5 text-brand-500" />
                  <span>Pays</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCountry}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">🌍 Tous les pays (5)</option>
                    {Object.entries(COUNTRIES_CITIES).map(([country, data]) => (
                      <option key={country} value={country}>
                        {data.flag} {country}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Filtre 2 : Ville */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-500" />
                  <span>Ville</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
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

              {/* Filtre 3 : Montant / Budget (FCFA) */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Budget Loyer (FCFA)</span>
                </label>
                <div className="relative">
                  <select
                    value={customMinPrice || customMaxPrice ? 'custom' : pricePresetIdx}
                    onChange={(e) => {
                      if (e.target.value === 'custom') return;
                      setPricePresetIdx(parseInt(e.target.value, 10));
                      setCustomMinPrice('');
                      setCustomMaxPrice('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                  >
                    {PRICE_PRESETS.map((preset, idx) => (
                      <option key={idx} value={idx}>
                        💰 {preset.label}
                      </option>
                    ))}
                    {(customMinPrice || customMaxPrice) && (
                      <option value="custom">
                        Personnalisé ({customMinPrice ? `${formatFCFA(customMinPrice)} min` : ''}
                        {customMinPrice && customMaxPrice ? ' - ' : ''}
                        {customMaxPrice ? `${formatFCFA(customMaxPrice)} max` : ''})
                      </option>
                    )}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Champ Recherche Libre (Quartier, Repère, Mot-clé) */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Recherche par mot-clé</span>
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Quartier, repère, piscine, meublé..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Ligne 2 : Type de Bien, Tranches Précises Min/Max & Tri */}
            <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Type de bien (Pills) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1 hidden sm:inline">
                  Type :
                </span>
                {PROPERTY_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedPropertyType(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedPropertyType === type
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Tri & Réinitialiser */}
              <div className="flex items-center gap-2.5 self-start md:self-auto">
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/60">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="featured">En vedette</option>
                    <option value="price_asc">Loyer croissant</option>
                    <option value="price_desc">Loyer décroissant</option>
                    <option value="surface_desc">Plus grand (m²)</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all border border-rose-200 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Effacer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Badges des filtres actifs */}
            {hasActiveFilters && (
              <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[11px] font-bold text-slate-400">Filtres actifs :</span>
                {selectedCountry !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold">
                    <span>Pays : {selectedCountry}</span>
                    <button onClick={() => setSelectedCountry('all')} className="hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedCity !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold">
                    <span>Ville : {selectedCity}</span>
                    <button onClick={() => setSelectedCity('all')} className="hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {(minRent > 0 || maxRent > 0) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                    <span>
                      Budget : {minRent > 0 ? `${formatFCFA(minRent)} min` : ''}
                      {minRent > 0 && maxRent > 0 ? ' - ' : ''}
                      {maxRent > 0 ? `${formatFCFA(maxRent)} max` : ''}
                    </span>
                    <button
                      onClick={() => {
                        setPricePresetIdx(0);
                        setCustomMinPrice('');
                        setCustomMaxPrice('');
                      }}
                      className="hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedPropertyType !== 'Tous' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold">
                    <span>Type : {selectedPropertyType}</span>
                    <button onClick={() => setSelectedPropertyType('Tous')} className="hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold">
                    <span>Recherche : « {searchQuery} »</span>
                    <button onClick={() => setSearchQuery('')} className="hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>
              {filteredListings.length}{' '}
              {filteredListings.length > 1 ? 'logements trouvés' : 'logement trouvé'}
            </span>
            <span className="text-[11px] text-slate-400">
              Devise officielle : <strong>FCFA (XOF / XAF)</strong>
            </span>
          </div>

          {/* ==================================================================== */}
          {/* GRILLE DES RÉSULTATS                                                 */}
          {/* ==================================================================== */}
          {filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => {
                const totalEntryCost = calculateTotalEntryCost(listing);

                return (
                  <div
                    key={listing.id}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden flex flex-col justify-between group hover:shadow-card-hover transition-all"
                  >
                    <div>
                      {/* Image Header with Price Tag & Badges */}
                      <div className="relative h-52 overflow-hidden">
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                        {/* Top Badges */}
                        <div className="absolute top-3 left-3 flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-1 rounded-full bg-brand-500 text-white text-[10px] font-black shadow-md flex items-center gap-1">
                            <span>{listing.flag}</span>
                            <span>{listing.country}</span>
                          </span>

                          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">
                            {listing.propertyType}
                          </span>

                          {listing.isVerified && (
                            <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-400 text-[10px] font-bold border border-white/10 flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              Bailleur Vérifié
                            </span>
                          )}
                        </div>

                        {/* Bottom rent overlay */}
                        <div className="absolute bottom-3 left-4 right-4 text-white flex items-baseline justify-between">
                          <div>
                            <span className="text-2xl font-black tracking-tight">
                              {formatFCFA(listing.monthlyRent)}
                            </span>
                            <span className="text-xs text-slate-300 font-semibold"> / mois</span>
                          </div>
                          {listing.surface > 0 && (
                            <span className="text-xs font-bold text-white/90 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-lg">
                              {listing.surface} m²
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Listing Content */}
                      <div className="p-5 space-y-3">
                        <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                          {listing.title}
                        </h3>

                        <div className="text-xs text-slate-500 space-y-1">
                          <div className="flex items-center gap-1 font-bold text-slate-800">
                            <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                            <span>
                              {listing.district}, {listing.city} ({listing.country})
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 italic">
                            Repère : « {listing.landmark} »
                          </p>
                        </div>

                        {/* Fonctionnalité Clé : Boîte Coût Total d'Entrée */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-tealAccent-50 border border-emerald-200/80 text-xs">
                          <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                            À Prévoir à l’Entrée (Coût Total) :
                          </span>
                          <div className="text-lg font-black text-emerald-900 mt-0.5">
                            {formatFCFA(totalEntryCost)}
                          </div>
                          <span className="text-[10px] text-emerald-700 block mt-0.5">
                            (1er loyer + {listing.depositMonths}m caution + {listing.advanceMonths}m avance + agence)
                          </span>
                        </div>

                        {/* Équipements essentiels africains */}
                        <div className="pt-2 border-t border-slate-100">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Équipements Clés Inclus :
                          </span>
                          <div className="space-y-1">
                            {listing.amenities.slice(0, 3).map((a, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium"
                              >
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span className="truncate">{a}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-5 pt-0 flex items-center gap-2">
                      <Link
                        href="/messages"
                        className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold text-center transition-all shadow-sm"
                      >
                        Contacter
                      </Link>
                      <button
                        type="button"
                        onClick={() => setSelectedListingForVisit(listing)}
                        className="flex-1 py-2.5 px-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold text-center shadow-pink-glow transition-all cursor-pointer"
                      >
                        Demander visite
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Empty State */
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-soft max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-lg text-slate-900">
                  Aucun logement ne correspond à vos filtres
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Essayez d'élargir votre recherche en sélectionnant « Tous les pays », une ville différente ou en ajustant la tranche de budget.
                </p>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="py-2.5 px-5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-pink-glow transition-all cursor-pointer"
              >
                Réinitialiser tous les filtres
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODALE DE DEMANDE DE VISITE                                          */}
      {/* ==================================================================== */}
      {selectedListingForVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-400" />
                <h3 className="font-extrabold text-sm">Planifier une Visite</h3>
              </div>
              <button
                onClick={() => setSelectedListingForVisit(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookVisitSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-brand-600 uppercase">Bien ciblé :</span>
                <h4 className="font-extrabold text-xs text-slate-900">
                  {selectedListingForVisit.title}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {selectedListingForVisit.district}, {selectedListingForVisit.city} ({selectedListingForVisit.country})
                  • <strong>{formatFCFA(selectedListingForVisit.monthlyRent)}/mois</strong>
                </p>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Date de visite souhaitée *
                </label>
                <input
                  type="date"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Créneau horaire disponible *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['09:00 - 11:00', '11:00 - 13:00', '15:00 - 17:00'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setVisitTimeSlot(slot)}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-bold text-center ${
                        visitTimeSlot === slot
                          ? 'border-brand-500 bg-brand-50 text-brand-600 ring-2 ring-brand-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedListingForVisit(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 font-bold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold shadow-pink-glow cursor-pointer"
                >
                  Confirmer le rendez-vous
                </button>
              </div>
            </form>
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
