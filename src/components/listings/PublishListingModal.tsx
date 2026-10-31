'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Building,
  Globe,
  MapPin,
  Coins,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { COUNTRIES_CITIES } from '@/lib/data/mock-data';
import { RentalListing } from '@/lib/types';
import { formatFCFA } from '@/lib/money/format';

interface PublishListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (newListing: RentalListing) => void;
}

export function PublishListingModal({
  isOpen,
  onClose,
  onPublish,
}: PublishListingModalProps) {
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState<RentalListing['propertyType']>('Appartement');
  const [country, setCountry] = useState('Bénin');
  const [city, setCity] = useState('Cotonou');
  const [district, setDistrict] = useState('');
  const [landmark, setLandmark] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('250000');
  const [charges, setCharges] = useState('25000');
  const [depositMonths, setDepositMonths] = useState(2);
  const [advanceMonths, setAdvanceMonths] = useState(1);
  const [surface, setSurface] = useState('85');
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);

  if (!isOpen) return null;

  const handleCountryChange = (c: string) => {
    setCountry(c);
    const cities = COUNTRIES_CITIES[c]?.cities || [];
    if (cities.length > 0) {
      setCity(cities[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const countryCodeMap: Record<string, RentalListing['countryCode']> = {
      'Bénin': 'BJ',
      'Burkina Faso': 'BF',
      'Côte d’Ivoire': 'CI',
      'Guinée-Bissau': 'GW',
      'Mali': 'ML',
      'Niger': 'NE',
      'Sénégal': 'SN',
      'Togo': 'TG',
      'Cameroun': 'CM',
    };

    const newListing: RentalListing = {
      id: `list-${Date.now()}`,
      title: title || `${propertyType} Moderne à ${district || city}`,
      propertyType,
      country,
      countryCode: countryCodeMap[country] || 'BJ',
      flag: COUNTRIES_CITIES[country]?.flag || '🌍',
      city,
      district: district || 'Centre-ville',
      landmark: landmark || 'Accès bitumé et sécurisé',
      monthlyRent: parseInt(monthlyRent, 10) || 200000,
      charges: parseInt(charges, 10) || 20000,
      depositMonths,
      advanceMonths,
      agencyFees: Math.round((parseInt(monthlyRent, 10) || 200000) * 0.5),
      surface: parseInt(surface, 10) || 75,
      bedrooms,
      bathrooms,
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
      ],
      amenities: [
        'Compteur d’électricité individuel',
        'Approvisionnement eau avec réserve',
        'Gardiennage sécurisé 24/7',
        'Climatisation split',
      ],
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
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
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
                Diffusion certifiée sur les 9 pays de la zone FCFA
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
              placeholder="Ex: Appartement Meublé 3 Pièces avec Vue Dégagée"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Type de bien */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Type de bien *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['Appartement', 'Meublé', 'Studio', 'Villa', 'Bureau', 'Boutique'] as const).map((t) => (
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
              <label className="font-bold text-slate-700 block mb-1">
                Ville *
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900"
              >
                {cities.map((ci) => (
                  <option key={ci} value={ci}>
                    {ci}
                  </option>
                ))}
              </select>
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-black text-brand-600"
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
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900"
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
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900"
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
              Publier l’annonce
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
