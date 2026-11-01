'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Navigation,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Info,
} from 'lucide-react';
import { UserProfile, UserSpace } from '@/lib/types';
import {
  getUserProfile,
  saveUserProfile,
  detectUserGeoLocation,
  UserGeoLocation,
} from '@/lib/services/geo-service';
import { COUNTRIES_CITIES } from '@/lib/data/mock-data';
import { notifySave } from '@/lib/notifications/action-notifier';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSpace?: UserSpace;
}

export function UserProfileModal({
  isOpen,
  onClose,
  activeSpace = 'locataire',
}: UserProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile>(() => getUserProfile(activeSpace));
  const [userLocation, setUserLocation] = useState<UserGeoLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const p = getUserProfile(activeSpace);
      setProfile(p);
      setSavedSuccess(false);
      detectUserGeoLocation().then((geo) => setUserLocation(geo)).catch(() => {});
    }
  }, [isOpen, activeSpace]);

  if (!isOpen) return null;

  const currentCountryData = COUNTRIES_CITIES[profile.residenceCountry] || {
    flag: '🇧🇯',
    cities: ['Cotonou', 'Abomey-Calavi', 'Porto-Novo', 'Parakou'],
  };

  const handleCountryChange = (country: string) => {
    const data = COUNTRIES_CITIES[country];
    const newCity = data && data.cities.length > 0 ? data.cities[0] : 'Cotonou';
    setProfile((prev) => ({
      ...prev,
      residenceCountry: country,
      residenceCity: newCity,
    }));
  };

  const handleRefreshGPS = async () => {
    setIsLocating(true);
    try {
      const geo = await detectUserGeoLocation();
      setUserLocation(geo);
    } catch (e) {
    } finally {
      setIsLocating(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveUserProfile(profile);
    setSavedSuccess(true);
    notifySave(
      `Votre pays de résidence d’inscription est désormais configuré sur ${profile.residenceCountry} (${profile.residenceCity}). Les recherches de logements et créations d'annonces sont automatiquement adaptées par défaut.`,
      'Profil & Inscription enregistrés avec succès !'
    );
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500 flex items-center justify-center font-black text-white shadow-md shadow-brand-500/30">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Profil & Informations d'Inscription
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {profile.role === 'bailleur' ? 'Espace Bailleur' : 'Espace Locataire'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Définit votre pays de résidence par défaut et votre géolocalisation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Alerte Explicative Règle Métier */}
          <div className="p-4 rounded-2xl bg-brand-50 border border-brand-200/80 text-xs text-brand-900 flex items-start gap-3">
            <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Règle d'or LOCAGESTION :</strong> Le pays de résidence renseigné lors de
              votre inscription est appliqué <strong>par défaut et en exclusivité</strong> lors de
              vos recherches de logements (qui vous présenteront en priorité les annonces les plus
              proches de votre lieu actuel) ainsi que lors de la création d'annonces.
            </div>
          </div>

          {/* Identité */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-brand-500" />
                <span>Nom complet</span>
              </label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-brand-500" />
                <span>Email de contact</span>
              </label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-brand-500" />
                <span>Téléphone (WhatsApp & Appels)</span>
              </label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
              />
            </div>
          </div>

          {/* Pays & Ville de résidence d'inscription (Obligatoire) */}
          <div className="pt-3 border-t border-slate-100 space-y-3.5">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-500" />
              <span>Pays & Localité de Résidence d'Inscription</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Pays d'inscription */}
              <div>
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <span>Pays de résidence renseigné</span>
                  <span className="text-[10px] text-brand-600 font-bold bg-brand-50 px-2 py-0.2 rounded-full">
                    Par défaut
                  </span>
                </label>
                <div className="relative">
                  <select
                    value={profile.residenceCountry}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                  >
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

              {/* Ville d'inscription */}
              <div>
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-500" />
                  <span>Ville de résidence</span>
                </label>
                <div className="relative">
                  <select
                    value={profile.residenceCity}
                    onChange={(e) => setProfile({ ...profile, residenceCity: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                  >
                    {currentCountryData.cities.map((city) => (
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

              {/* Quartier / Emplacement actuel */}
              <div className="sm:col-span-2">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Quartier / Lieu de résidence actuel</span>
                  <span className="text-[10px] text-slate-400 font-medium">(Pour le calcul de proximité)</span>
                </label>
                <input
                  type="text"
                  value={profile.residenceDistrict || ''}
                  onChange={(e) => setProfile({ ...profile, residenceDistrict: e.target.value })}
                  placeholder="ex: Haie Vive, Agla, Fidjrossè, Akpakpa, Menontin, Zogbo, Godomey, Cocotomey, Cococodji..."
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section Système de Géolocalisation */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Navigation className="w-4 h-4 text-brand-500" />
                <span className="text-xs font-black text-slate-900">
                  Système de Géolocalisation Intégré
                </span>
              </div>
              <button
                type="button"
                onClick={handleRefreshGPS}
                disabled={isLocating}
                className="px-2.5 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Navigation className={`w-3 h-3 text-brand-500 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Détection...' : 'Actualiser GPS'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/60">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-700">Lieu détecté : </span>
                <span className="font-black text-slate-900">
                  {userLocation ? userLocation.label : `${profile.residenceDistrict || profile.residenceCity} (${profile.residenceCountry})`}
                </span>
                {userLocation && (
                  <span className="text-[10px] text-slate-400 font-mono ml-2">
                    ({userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)} • source: {userLocation.source})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {savedSuccess ? (
              <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Enregistré avec succès !</span>
              </div>
            ) : (
              <span className="text-[11px] text-slate-400">
                La mise à jour s'appliquera immédiatement sur toute l'application.
              </span>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black shadow-pink-glow transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Enregistrer mon profil</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

