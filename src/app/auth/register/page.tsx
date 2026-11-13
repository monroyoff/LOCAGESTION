'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  Sparkles,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Globe,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Compass,
  Check,
  Eye,
  EyeOff,
  Navigation,
  RefreshCw,
  Briefcase,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/context/space-context';
import { UserSpace } from '@/lib/types';
import { COUNTRIES_CITIES } from '@/lib/data/mock-data';
import { detectUserGeoLocation, UserGeoLocation } from '@/lib/services/geo-service';

const AFRICAN_COUNTRIES_CONFIG: Record<
  string,
  { flag: string; dialCode: string; defaultCity: string }
> = {
  'Bénin': { flag: '🇧🇯', dialCode: '+229', defaultCity: 'Cotonou' },
  'Côte d’Ivoire': { flag: '🇨🇮', dialCode: '+225', defaultCity: 'Abidjan' },
  'Sénégal': { flag: '🇸🇳', dialCode: '+221', defaultCity: 'Dakar' },
  'Togo': { flag: '🇹🇬', dialCode: '+228', defaultCity: 'Lomé' },
  'Cameroun': { flag: '🇨🇲', dialCode: '+237', defaultCity: 'Douala' },
  'Burkina Faso': { flag: '🇧🇫', dialCode: '+226', defaultCity: 'Ouagadougou' },
  'Mali': { flag: '🇲🇱', dialCode: '+223', defaultCity: 'Bamako' },
  'Niger': { flag: '🇳🇪', dialCode: '+227', defaultCity: 'Niamey' },
  'Gabon': { flag: '🇬🇦', dialCode: '+241', defaultCity: 'Libreville' },
  'Congo': { flag: '🇨🇬', dialCode: '+242', defaultCity: 'Brazzaville' },
  'Centrafrique': { flag: '🇨🇫', dialCode: '+236', defaultCity: 'Bangui' },
  'Tchad': { flag: '🇹🇩', dialCode: '+235', defaultCity: 'N’Djamena' },
  'Guinée-Bissau': { flag: '🇬🇼', dialCode: '+245', defaultCity: 'Bissau' },
  'Guinée Équatoriale': { flag: '🇬🇶', dialCode: '+240', defaultCity: 'Malabo' },
};

const TOTAL_STEPS = 6;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  // Wizard Navigation
  const [currentStep, setCurrentStep] = useState(1);

  // Étape 1 : Choix de l'espace en premier (Bailleur, Locataire ou Démarcheur)
  const [role, setRole] = useState<UserSpace>('bailleur');

  // Étape 2 : Nom et Prénoms (+ infos entreprise pour pro)
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [ifuNumber, setIfuNumber] = useState('');

  // Étape 3 : Coordonnées obligatoires (Mail ET Numéro)
  const [email, setEmail] = useState('');
  const [dialCode, setDialCode] = useState('+229');
  const [phoneDigits, setPhoneDigits] = useState('');

  // Étape 4 : État Civil (Date et Lieu de naissance)
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');

  // Étape 5 : Pays de résidence (proposé automatiquement par géolocalisation)
  const [residenceCountry, setResidenceCountry] = useState('Bénin');
  const [residenceCity, setResidenceCity] = useState('Cotonou');
  const [residenceDistrict, setResidenceDistrict] = useState('Haie Vive');
  const [isDetectingGeo, setIsDetectingGeo] = useState(false);
  const [detectedGeoLabel, setDetectedGeoLabel] = useState<string | null>(null);
  const [geoSource, setGeoSource] = useState<'gps' | 'ip' | 'default'>('default');

  // Étape 6 : Sécurité (Mot de passe)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Villes disponibles pour le pays sélectionné
  const availableCities =
    COUNTRIES_CITIES[residenceCountry]?.cities || ['Cotonou', 'Porto-Novo', 'Abomey-Calavi', 'Parakou'];

  // Détection automatique de la géolocalisation au chargement
  const runGeoDetection = async () => {
    setIsDetectingGeo(true);
    try {
      const geo: UserGeoLocation = await detectUserGeoLocation();
      if (geo && geo.country) {
        // Normalisation avec les pays supportés
        const matchedCountry = Object.keys(AFRICAN_COUNTRIES_CONFIG).find(
          (c) => c.toLowerCase() === geo.country.toLowerCase() || geo.country.toLowerCase().includes(c.toLowerCase())
        );

        const finalCountry = matchedCountry || 'Bénin';
        setResidenceCountry(finalCountry);

        if (geo.city) {
          setResidenceCity(geo.city);
        } else if (AFRICAN_COUNTRIES_CONFIG[finalCountry]) {
          setResidenceCity(AFRICAN_COUNTRIES_CONFIG[finalCountry].defaultCity);
        }

        if (geo.district) {
          setResidenceDistrict(geo.district);
        }

        // Mettre à jour l'indicatif téléphonique par défaut selon le pays détecté
        if (AFRICAN_COUNTRIES_CONFIG[finalCountry]) {
          setDialCode(AFRICAN_COUNTRIES_CONFIG[finalCountry].dialCode);
        }

        setDetectedGeoLabel(geo.label || `${geo.city || 'Position active'} (${finalCountry})`);
        setGeoSource(geo.source === 'gps' ? 'gps' : 'ip');
      }
    } catch (e) {
      console.warn('Géolocalisation automatique indisponible, utilisation du Bénin par défaut.');
    } finally {
      setIsDetectingGeo(false);
    }
  };

  useEffect(() => {
    runGeoDetection();
  }, []);

  const handleCountryChange = (newCountry: string) => {
    setResidenceCountry(newCountry);
    const countryCfg = AFRICAN_COUNTRIES_CONFIG[newCountry];
    if (countryCfg) {
      setDialCode(countryCfg.dialCode);
      const cities = COUNTRIES_CITIES[newCountry]?.cities;
      if (cities && cities.length > 0) {
        setResidenceCity(cities[0]);
      } else {
        setResidenceCity(countryCfg.defaultCity);
      }
    }
  };

  // Validation par question
  const validateCurrentStep = (): boolean => {
    setErrorMsg(null);

    // Question 1 : Espace
    if (currentStep === 1) {
      if (!role) {
        setErrorMsg('Veuillez sélectionner votre profil (Bailleur, Locataire ou Démarcheur).');
        return false;
      }
      return true;
    }

    // Question 2 : Nom & Prénoms
    if (currentStep === 2) {
      if (!lastName.trim()) {
        setErrorMsg('Veuillez renseigner votre nom de famille.');
        return false;
      }
      if (!firstName.trim()) {
        setErrorMsg('Veuillez renseigner votre ou vos prénom(s).');
        return false;
      }
      return true;
    }

    // Question 3 : Coordonnées (Mail ET Numéro obligatoires)
    if (currentStep === 3) {
      if (!email.trim() || !email.includes('@') || !email.includes('.')) {
        setErrorMsg('Une adresse email valide est obligatoire (ex: nom@domaine.com).');
        return false;
      }
      const digits = phoneDigits.replace(/[^0-9]/g, '');
      if (!digits || digits.length < 8) {
        setErrorMsg('Un numéro de téléphone valide d’au moins 8 chiffres est obligatoire.');
        return false;
      }
      return true;
    }

    // Question 4 : État Civil (Date et Lieu de naissance)
    if (currentStep === 4) {
      if (!birthDate) {
        setErrorMsg('Veuillez indiquer votre date de naissance.');
        return false;
      }
      if (!birthPlace.trim()) {
        setErrorMsg('Veuillez indiquer votre commune ou ville de naissance.');
        return false;
      }
      return true;
    }

    // Question 5 : Résidence
    if (currentStep === 5) {
      if (!residenceCountry) {
        setErrorMsg('Veuillez sélectionner votre pays de résidence.');
        return false;
      }
      if (!residenceCity) {
        setErrorMsg('Veuillez indiquer votre ville de résidence.');
        return false;
      }
      return true;
    }

    // Question 6 : Sécurité
    if (currentStep === 6) {
      if (!password || password.length < 4) {
        setErrorMsg('Le mot de passe doit comporter au moins 4 caractères.');
        return false;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Les mots de passe ne correspondent pas.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
        setErrorMsg(null);
      } else {
        handleFinalSubmit();
      }
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Soumission finale de l'inscription
  const handleFinalSubmit = () => {
    if (!validateCurrentStep()) return;

    setIsLoading(true);
    setErrorMsg(null);

    const fullPhoneNumber = `${dialCode} ${phoneDigits.trim()}`;
    const fullName = `${lastName.trim()} ${firstName.trim()}`;

    try {
      const res = register({
        role,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: fullName,
        email: email.trim(),
        phone: fullPhoneNumber,
        birthDate: birthDate.trim(),
        birthPlace: birthPlace.trim(),
        residenceCountry,
        residenceCity,
        residenceDistrict: residenceDistrict.trim() || undefined,
        companyName: (role === 'bailleur' || role === 'demarcheur') && companyName.trim() ? companyName.trim() : undefined,
        ifuNumber: (role === 'bailleur' || role === 'demarcheur') && ifuNumber.trim() ? ifuNumber.trim() : undefined,
        password: password || 'demo1234',
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Erreur lors de la création de votre compte.');
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMsg('Une erreur inattendue est survenue.');
      setIsLoading(false);
    }
  };

  // Progression en pourcentage
  const progressPercent = Math.round((currentStep / TOTAL_STEPS) * 100);

  return (
    <div className="min-h-screen bg-[#0e1117] text-white flex flex-col justify-between py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header & Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10">
        <div className="flex items-center justify-between mb-4">
          <Link href="/auth/login" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-pink-500 flex items-center justify-center shadow-lg shadow-brand-500/30 group-hover:scale-105 transition-transform">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
                  fill="currentColor"
                />
                <path
                  d="M12 7.5L6 12.5V19H8V12H16V19H18V12.5L12 7.5Z"
                  fill="rgba(255,255,255,0.4)"
                />
              </svg>
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block">
                LOCA<span className="text-brand-400">GESTION</span>
              </span>
              <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">
                Création de compte sécurisée
              </span>
            </div>
          </Link>

          <Link
            href="/auth/login"
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
          >
            <span>Déjà un compte ?</span>
            <span className="text-brand-400 font-black">Connexion</span>
          </Link>
        </div>

        {/* Step Counter & Progress Bar */}
        <div className="space-y-2 mb-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-black text-brand-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
              Étape {currentStep} sur {TOTAL_STEPS}
            </span>
            <span className="font-bold text-slate-400 text-[11px]">
              {progressPercent}% complété
            </span>
          </div>

          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-pink-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Wizard Form Card */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10 my-4">
        <div className="bg-[#171b24] py-7 px-5 sm:px-9 shadow-2xl rounded-3xl border border-white/10 space-y-6">

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* ================================================================ */}
          {/* QUESTION 1 : CHOIX EN PRIMO DE L'ESPACE (BAILLEUR, LOCATAIRE...)  */}
          {/* ================================================================ */}
          {currentStep === 1 && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-brand-400 block mb-1">
                  Question 1 • Sélection de votre rôle
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Quel est votre profil sur LOCAGESTION ?
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Sélectionnez votre espace en premier pour adapter immédiatement les fonctionnalités à votre usage.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                {/* 1. Carte Bailleur */}
                <button
                  type="button"
                  onClick={() => setRole('bailleur')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                    role === 'bailleur'
                      ? 'bg-gradient-to-br from-brand-950/60 to-[#1e2330] border-brand-500 ring-2 ring-brand-500/30 shadow-lg shadow-brand-500/20'
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  {role === 'bailleur' && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center mb-3">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-white text-sm mb-1 group-hover:text-brand-300">
                      Bailleur
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Propriétaire ou gestionnaire de logements, baux et encaissements de loyers.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-bold text-brand-400">
                    Tableau de bord & Patrimoine
                  </div>
                </button>

                {/* 2. Carte Locataire */}
                <button
                  type="button"
                  onClick={() => setRole('locataire')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                    role === 'locataire'
                      ? 'bg-gradient-to-br from-emerald-950/60 to-[#1e2330] border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-500/20'
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  {role === 'locataire' && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-3">
                      <Users className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-white text-sm mb-1 group-hover:text-emerald-300">
                      Locataire
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Résident occupant, paiement de loyers, quittances certifiées et pannes.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-bold text-emerald-400">
                    Portail Résident & Reçus
                  </div>
                </button>

                {/* 3. Carte Démarcheur */}
                <button
                  type="button"
                  onClick={() => setRole('demarcheur')}
                  className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative group flex flex-col justify-between ${
                    role === 'demarcheur'
                      ? 'bg-gradient-to-br from-amber-950/60 to-[#1e2330] border-amber-500 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/20'
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  {role === 'demarcheur' && (
                    <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-sm">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                  <div>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center mb-3">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h3 className="font-black text-white text-sm mb-1 group-hover:text-amber-300">
                      Démarcheur
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Agent immobilier de terrain, publication d’annonces et organisation des visites.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-bold text-amber-400">
                    Annonces & Visites vérifiées
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* QUESTION 2 : NOM ET PRÉNOMS                                      */}
          {/* ================================================================ */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-brand-400 block mb-1">
                  Question 2 • Votre Identité
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Comment vous appelez-vous ?
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Indiquez vos nom et prénoms tels qu’ils figurent sur vos pièces d'identité officielles.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Nom de famille <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="ex: Diallo"
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      autoFocus
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Prénom(s) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="ex: Mamadou Ibrahim"
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>
              </div>

              {/* Informations professionnelles facultatives pour Bailleur et Démarcheur */}
              {(role === 'bailleur' || role === 'demarcheur') && (
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-brand-400" />
                    <span>Informations d'agence ou d'entreprise (Optionnel)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Nom de l'agence ou cabinet
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="ex: Cabinet Diallo & Fils SARL"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Numéro IFU fiscal (Bénin / UEMOA)
                      </label>
                      <input
                        type="text"
                        value={ifuNumber}
                        onChange={(e) => setIfuNumber(e.target.value)}
                        placeholder="ex: 0202110485960"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================ */}
          {/* QUESTION 3 : COORDONNÉES (MAIL ET NUMÉRO OBLIGATOIRES)           */}
          {/* ================================================================ */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-brand-400 block mb-1">
                  Question 3 • Coordonnées de Contact
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Vos coordonnées obligatoires
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Chaque compte nécessite obligatoirement un email et un numéro de téléphone pour la délivrance des quittances et la sécurité.
                </p>
              </div>

              <div className="space-y-3.5 pt-2">
                {/* Email Obligatoire */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Adresse Email <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ex: contact@diallo-patrimoine.bj"
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      autoFocus
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Utilisé pour la connexion, l'envoi des quittances officielles et des notifications de contrat.
                  </span>
                </div>

                {/* Téléphone Obligatoire avec indicatif pays */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Numéro de Téléphone (Mobile Money & WhatsApp) <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-1 xs:grid-cols-3 gap-2">
                    <select
                      value={dialCode}
                      onChange={(e) => setDialCode(e.target.value)}
                      className="xs:col-span-1 px-3 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
                    >
                      {Object.entries(AFRICAN_COUNTRIES_CONFIG).map(([cName, cfg]) => (
                        <option key={cName} value={cfg.dialCode} className="bg-[#171b24] text-white">
                          {cfg.flag} {cfg.dialCode} ({cName})
                        </option>
                      ))}
                    </select>

                    <div className="xs:col-span-2 relative">
                      <input
                        type="tel"
                        value={phoneDigits}
                        onChange={(e) => setPhoneDigits(e.target.value)}
                        placeholder="ex: 01 95 44 44 30 ou 97 12 34 56"
                        className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                        required
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Sert pour la connexion rapide, les notifications SMS et les relances de loyer.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* QUESTION 4 : ÉTAT CIVIL (DATE ET LIEU DE NAISSANCE)              */}
          {/* ================================================================ */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-brand-400 block mb-1">
                  Question 4 • État Civil Légal
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Votre date et lieu de naissance
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Obligatoire selon la législation UEMOA / CEMAC pour l'édition des baux notifiés et des quittances authentifiées.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Date de naissance <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      max="2008-12-31"
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
                      autoFocus
                      required
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Lieu de naissance <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      placeholder="ex: Cotonou, Dakar, Abidjan..."
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      required
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-xs text-brand-300 flex items-start gap-2.5 mt-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-brand-400 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  Conformément au droit OHADA et au Code Foncier et Domanial, ces mentions garantissent la validité juridique de vos contrats de location.
                </span>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* QUESTION 5 : PAYS DE RÉSIDENCE (GÉOLOCALISATION AUTOMATIQUE)     */}
          {/* ================================================================ */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-brand-400 block mb-1">
                  Question 5 • Résidence & Géolocalisation
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Votre pays de résidence
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Proposé automatiquement par votre géolocalisation pour paramétrer vos devises et lois locatives applicables.
                </p>
              </div>

              {/* Badge dynamique de géolocalisation automatique */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <Navigation className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black text-emerald-300 truncate">
                      {detectedGeoLabel ? `Position détectée : ${detectedGeoLabel}` : 'Position géographique détectée automatiquement'}
                    </div>
                    <div className="text-[10px] text-emerald-400/80">
                      Proposition automatique basée sur votre {geoSource === 'gps' ? 'GPS' : 'connexion réseau'}.
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={runGeoDetection}
                  disabled={isDetectingGeo}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isDetectingGeo ? 'animate-spin' : ''}`} />
                  <span>Re-détecter</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {/* Pays de résidence */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Pays de résidence <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={residenceCountry}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
                    >
                      {Object.keys(AFRICAN_COUNTRIES_CONFIG).map((cName) => (
                        <option key={cName} value={cName} className="bg-[#171b24] text-white">
                          {AFRICAN_COUNTRIES_CONFIG[cName].flag} {cName}
                        </option>
                      ))}
                    </select>
                    <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  </div>
                </div>

                {/* Ville de résidence */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Ville de résidence <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      list="cities-suggestions"
                      value={residenceCity}
                      onChange={(e) => setResidenceCity(e.target.value)}
                      placeholder="ex: Cotonou"
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      required
                    />
                    <datalist id="cities-suggestions">
                      {availableCities.map((city) => (
                        <option key={city} value={city} />
                      ))}
                    </datalist>
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>
              </div>

              {/* Quartier / Zone */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Quartier / Repère géographique (Optionnel)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={residenceDistrict}
                    onChange={(e) => setResidenceDistrict(e.target.value)}
                    placeholder="ex: Haie Vive, Akpakpa, Cocody, Almadies..."
                    className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  />
                  <Compass className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* QUESTION 6 : SÉCURITÉ & RÉCAPITULATIF FINAL                       */}
          {/* ================================================================ */}
          {currentStep === 6 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-brand-400 block mb-1">
                  Question 6 • Sécurité & Finalisation
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Sécurisez l'accès à votre compte
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Définissez votre mot de passe pour finaliser l’ouverture de votre espace.
                </p>
              </div>

              {/* Récapitulatif Visuel du Compte */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Récapitulatif de votre inscription :
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Espace sélectionné :</span>
                    <span className="font-bold text-white capitalize flex items-center gap-1 mt-0.5">
                      {role === 'bailleur' ? '🏢 Bailleur' : role === 'demarcheur' ? '✨ Démarcheur' : '👥 Locataire'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Identité :</span>
                    <span className="font-bold text-white truncate block mt-0.5">
                      {lastName} {firstName}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Email :</span>
                    <span className="font-bold text-brand-400 truncate block mt-0.5">
                      {email}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Téléphone :</span>
                    <span className="font-bold text-emerald-400 truncate block mt-0.5">
                      {dialCode} {phoneDigits}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">État Civil :</span>
                    <span className="font-medium text-slate-300 truncate block mt-0.5">
                      Né(e) le {birthDate} à {birthPlace}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[10px]">Résidence :</span>
                    <span className="font-medium text-slate-300 truncate block mt-0.5">
                      {residenceCountry} ({residenceCity})
                    </span>
                  </div>
                </div>
              </div>

              {/* Champs Mot de passe */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Mot de passe <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      autoFocus
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Confirmer le mot de passe <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* BARRE D'ACTIONS INFÉRIEURE : PRÉCÉDENT & SUIVANT                  */}
          {/* ================================================================ */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isLoading}
                className="py-3 px-4 sm:px-5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-bold text-xs border border-white/10 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Précédent</span>
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={handleNext}
              disabled={isLoading}
              className="py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-500 to-pink-500 hover:from-brand-600 hover:to-pink-600 text-white font-black text-xs shadow-lg shadow-brand-500/30 transition-all flex items-center gap-2 cursor-pointer active:scale-95 ml-auto"
            >
              <span>
                {isLoading
                  ? 'Création du compte en cours...'
                  : currentStep === TOTAL_STEPS
                  ? '✨ Créer mon compte & Démarrer'
                  : 'Continuer'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Security Trust Badges */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium flex-wrap text-center">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Conformité UEMOA, CEMAC & OHADA</span>
          </span>
          <span>•</span>
          <span>Données Chiffrées & Sécurisées</span>
          <span>•</span>
          <span>Zone FCFA</span>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-[10px] text-slate-600 relative z-10 py-2">
        LOCAGESTION SaaS Immobilier Multi-Rôles • Tous droits réservés © {new Date().getFullYear()}
      </div>
    </div>
  );
}
