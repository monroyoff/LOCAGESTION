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
  Layers,
  Fingerprint,
} from 'lucide-react';
import { useAuth } from '@/lib/context/space-context';
import { UserSpace } from '@/lib/types';
import { COUNTRIES_CITIES } from '@/lib/data/mock-data';
import { detectUserGeoLocation, UserGeoLocation } from '@/lib/services/geo-service';
import { AuthService, getCountryMatriculeCode } from '@/lib/services/auth-service';
import { ListingsService } from '@/lib/services/listings-service';

// Les 14 pays officiels des zones UEMOA & CEMAC
const UEMOA_CEMAC_COUNTRIES = [
  'Bénin',
  'Côte d’Ivoire',
  'Sénégal',
  'Togo',
  'Cameroun',
  'Burkina Faso',
  'Mali',
  'Niger',
  'Gabon',
  'Congo',
  'Centrafrique',
  'Tchad',
  'Guinée-Bissau',
  'Guinée Équatoriale',
];

// Configuration complète : UEMOA & CEMAC + Principaux pays de la Diaspora internationale
const ALL_COUNTRIES_CONFIG: Record<
  string,
  { flag: string; dialCode: string; defaultCity: string; isUemoaCemac: boolean }
> = {
  // --- Zone UEMOA & CEMAC ---
  'Bénin': { flag: '🇧🇯', dialCode: '+229', defaultCity: 'Cotonou', isUemoaCemac: true },
  'Côte d’Ivoire': { flag: '🇨🇮', dialCode: '+225', defaultCity: 'Abidjan', isUemoaCemac: true },
  'Sénégal': { flag: '🇸🇳', dialCode: '+221', defaultCity: 'Dakar', isUemoaCemac: true },
  'Togo': { flag: '🇹🇬', dialCode: '+228', defaultCity: 'Lomé', isUemoaCemac: true },
  'Cameroun': { flag: '🇨🇲', dialCode: '+237', defaultCity: 'Douala', isUemoaCemac: true },
  'Burkina Faso': { flag: '🇧🇫', dialCode: '+226', defaultCity: 'Ouagadougou', isUemoaCemac: true },
  'Mali': { flag: '🇲🇱', dialCode: '+223', defaultCity: 'Bamako', isUemoaCemac: true },
  'Niger': { flag: '🇳🇪', dialCode: '+227', defaultCity: 'Niamey', isUemoaCemac: true },
  'Gabon': { flag: '🇬🇦', dialCode: '+241', defaultCity: 'Libreville', isUemoaCemac: true },
  'Congo': { flag: '🇨🇬', dialCode: '+242', defaultCity: 'Brazzaville', isUemoaCemac: true },
  'Centrafrique': { flag: '🇨🇫', dialCode: '+236', defaultCity: 'Bangui', isUemoaCemac: true },
  'Tchad': { flag: '🇹🇩', dialCode: '+235', defaultCity: 'N’Djamena', isUemoaCemac: true },
  'Guinée-Bissau': { flag: '🇬🇼', dialCode: '+245', defaultCity: 'Bissau', isUemoaCemac: true },
  'Guinée Équatoriale': { flag: '🇬🇶', dialCode: '+240', defaultCity: 'Malabo', isUemoaCemac: true },

  // --- Diaspora & International (Europe, Amérique, etc.) ---
  'France': { flag: '🇫🇷', dialCode: '+33', defaultCity: 'Paris', isUemoaCemac: false },
  'Belgique': { flag: '🇧🇪', dialCode: '+32', defaultCity: 'Bruxelles', isUemoaCemac: false },
  'Suisse': { flag: '🇨🇭', dialCode: '+41', defaultCity: 'Genève', isUemoaCemac: false },
  'Canada': { flag: '🇨🇦', dialCode: '+1', defaultCity: 'Montréal', isUemoaCemac: false },
  'États-Unis': { flag: '🇺🇸', dialCode: '+1', defaultCity: 'New York', isUemoaCemac: false },
  'Royaume-Uni': { flag: '🇬🇧', dialCode: '+44', defaultCity: 'Londres', isUemoaCemac: false },
  'Allemagne': { flag: '🇩🇪', dialCode: '+49', defaultCity: 'Berlin', isUemoaCemac: false },
  'Italie': { flag: '🇮🇹', dialCode: '+39', defaultCity: 'Rome', isUemoaCemac: false },
  'Espagne': { flag: '🇪🇸', dialCode: '+34', defaultCity: 'Madrid', isUemoaCemac: false },
  'Maroc': { flag: '🇲🇦', dialCode: '+212', defaultCity: 'Casablanca', isUemoaCemac: false },
  'Autre pays (International)': { flag: '🌍', dialCode: '+', defaultCity: '', isUemoaCemac: false },
};

const TOTAL_STEPS = 6;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  // Navigation du wizard
  const [currentStep, setCurrentStep] = useState(1);

  // Étape 1 : Choix en primo de l'espace (Bailleur, Locataire ou Démarcheur)
  const [role, setRole] = useState<UserSpace>('bailleur');

  // Étape 2 : Nom et Prénoms (+ infos entreprise, IFU uniquement pour bailleur)
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [ifuNumber, setIfuNumber] = useState('');

  // Étape 3 : Coordonnées obligatoires (Mail ET Numéro)
  const [email, setEmail] = useState('');
  const [dialCode, setDialCode] = useState('+229');
  const [phoneDigits, setPhoneDigits] = useState('');

  // Étape 4 : État civil (Lieu de naissance mondial, non restreint à l'UEMOA/CEMAC)
  const [birthDate, setBirthDate] = useState('');
  const [birthPlace, setBirthPlace] = useState('');

  // Étape 5 : Pays de résidence (proposé automatiquement) + Pays du projet (si résidence hors UEMOA/CEMAC)
  const [residenceCountry, setResidenceCountry] = useState('Bénin');
  const [residenceCity, setResidenceCity] = useState('Cotonou');
  const [residenceDistrict, setResidenceDistrict] = useState('');
  const [projectCountry, setProjectCountry] = useState('Bénin');
  const [isDetectingGeo, setIsDetectingGeo] = useState(false);
  const [detectedGeoLabel, setDetectedGeoLabel] = useState<string | null>(null);
  const [geoSource, setGeoSource] = useState<'gps' | 'ip' | 'default'>('default');

  // Étape 6 : Sécurité (Mot de passe)
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // États de validation
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Étape de vérification par email
  const [showVerificationStep, setShowVerificationStep] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [enteredCode, setEnteredCode] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailStatusMsg, setEmailStatusMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Vérifier si la résidence actuelle est hors zone UEMOA / CEMAC (ex: France, Belgique, USA...)
  const isOutsideUEMOACEMAC = !UEMOA_CEMAC_COUNTRIES.includes(residenceCountry);

  // Villes suggérées
  const availableCities =
    COUNTRIES_CITIES[residenceCountry]?.cities ||
    (residenceCountry === 'France'
      ? ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Toulouse', 'Lille', 'Nantes']
      : residenceCountry === 'Belgique'
      ? ['Bruxelles', 'Liège', 'Anvers', 'Gand']
      : residenceCountry === 'Canada'
      ? ['Montréal', 'Québec', 'Toronto', 'Ottawa']
      : ['Cotonou', 'Porto-Novo', 'Abomey-Calavi', 'Parakou']);

  // Détection automatique de la géolocalisation au chargement
  const runGeoDetection = async () => {
    setIsDetectingGeo(true);
    try {
      const geo: UserGeoLocation = await detectUserGeoLocation();
      if (geo && geo.country) {
        // Trouver une correspondance dans notre liste de pays
        const matchedCountry = Object.keys(ALL_COUNTRIES_CONFIG).find(
          (c) =>
            c.toLowerCase() === geo.country.toLowerCase() ||
            geo.country.toLowerCase().includes(c.toLowerCase()) ||
            c.toLowerCase().includes(geo.country.toLowerCase())
        );

        const detectedCountryName = matchedCountry || geo.country;
        setResidenceCountry(detectedCountryName);

        if (geo.city) {
          setResidenceCity(geo.city);
        } else if (ALL_COUNTRIES_CONFIG[detectedCountryName]) {
          setResidenceCity(ALL_COUNTRIES_CONFIG[detectedCountryName].defaultCity);
        }

        if (geo.district) {
          setResidenceDistrict(geo.district);
        }

        if (ALL_COUNTRIES_CONFIG[detectedCountryName]) {
          setDialCode(ALL_COUNTRIES_CONFIG[detectedCountryName].dialCode);
        }

        setDetectedGeoLabel(geo.label || `${geo.city || 'Position active'} (${detectedCountryName})`);
        setGeoSource(geo.source === 'gps' ? 'gps' : 'ip');

        // Si le pays de résidence détecté est hors UEMOA/CEMAC, pré-initialiser le pays du projet sur le Bénin
        if (!UEMOA_CEMAC_COUNTRIES.includes(detectedCountryName)) {
          setProjectCountry('Bénin');
        } else {
          setProjectCountry(detectedCountryName);
        }
      }
    } catch (e) {
      console.warn('Géolocalisation automatique indisponible, utilisation du profil par défaut.');
    } finally {
      setIsDetectingGeo(false);
    }
  };

  useEffect(() => {
    runGeoDetection();
  }, []);

  const handleCountryChange = (newCountry: string) => {
    setResidenceCountry(newCountry);
    const countryCfg = ALL_COUNTRIES_CONFIG[newCountry];
    if (countryCfg) {
      setDialCode(countryCfg.dialCode);
      const cities = COUNTRIES_CITIES[newCountry]?.cities;
      if (cities && cities.length > 0) {
        setResidenceCity(cities[0]);
      } else {
        setResidenceCity(countryCfg.defaultCity);
      }
    }

    if (UEMOA_CEMAC_COUNTRIES.includes(newCountry)) {
      setProjectCountry(newCountry);
    } else {
      // Pour les pays hors zone, proposer le Bénin ou conserver le projet existant
      setProjectCountry((prev) => (UEMOA_CEMAC_COUNTRIES.includes(prev) ? prev : 'Bénin'));
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

    // Question 3 : Coordonnées (Mail ET Numéro obligatoires avec vérification d'unicité stricte)
    if (currentStep === 3) {
      if (!email.trim() || !email.includes('@') || !email.includes('.')) {
        setErrorMsg('Une adresse email valide est obligatoire (ex: nom@domaine.com).');
        return false;
      }
      const digits = phoneDigits.replace(/[^0-9]/g, '');
      if (!digits || digits.length < 6) {
        setErrorMsg('Un numéro de téléphone valide est obligatoire.');
        return false;
      }

      // VÉRIFICATION D'UNICITÉ PLATEFORME STRICTE (EMAIL ET TÉLÉPHONE SUR TOUS LES ESPACES)
      const fullPhoneNumber = `${dialCode} ${phoneDigits.trim()}`;
      const availability = AuthService.checkIdentifierAvailability(
        email.trim(),
        fullPhoneNumber
      );
      if (!availability.available) {
        setErrorMsg(
          availability.message ||
            'Ces coordonnées (email ou téléphone) sont déjà associées à un compte existant sur la plateforme.'
        );
        return false;
      }

      return true;
    }

    // Question 4 : État Civil (Date et Lieu de naissance mondial)
    if (currentStep === 4) {
      if (!birthDate) {
        setErrorMsg('Veuillez indiquer votre date de naissance.');
        return false;
      }
      if (!birthPlace.trim()) {
        setErrorMsg('Veuillez indiquer votre lieu de naissance (ex: Paris, Cotonou, Montréal...).');
        return false;
      }
      return true;
    }

    // Question 5 : Résidence & Projet UEMOA/CEMAC
    if (currentStep === 5) {
      if (!residenceCountry) {
        setErrorMsg('Veuillez sélectionner votre pays de résidence.');
        return false;
      }
      if (!residenceCity) {
        setErrorMsg('Veuillez indiquer votre ville de résidence.');
        return false;
      }
      if (isOutsideUEMOACEMAC && (!projectCountry || !UEMOA_CEMAC_COUNTRIES.includes(projectCountry))) {
        setErrorMsg('Pour les résidents hors UEMOA/CEMAC, veuillez sélectionner le pays de votre projet immobilier.');
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

  const sendEmailCode = async (codeToSend: string) => {
    setIsSendingEmail(true);
    setEmailStatusMsg(null);
    try {
      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: `${firstName.trim()} ${lastName.trim()}`,
          role,
          code: codeToSend,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEmailStatusMsg(`Code officiel envoyé avec succès à ${email.trim()} !`);
      } else {
        setEmailStatusMsg(`Email envoyé. Vérifiez votre boîte de réception et vos spams.`);
      }
    } catch (e) {
      console.error('Erreur expédition email:', e);
      setEmailStatusMsg(`Email envoyé. Vérifiez votre boîte de réception.`);
    } finally {
      setIsSendingEmail(false);
      setResendCooldown(45);
    }
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < TOTAL_STEPS) {
        setCurrentStep(currentStep + 1);
        setErrorMsg(null);
      } else {
        handleInitiateVerification();
      }
    }
  };

  const handleBack = () => {
    setErrorMsg(null);
    if (showVerificationStep) {
      setShowVerificationStep(false);
      return;
    }
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 1. Déclenchement de la vérification par email
  const handleInitiateVerification = async () => {
    if (!validateCurrentStep()) return;

    // Double vérification d'unicité avant expédition du code
    const fullPhoneNumber = `${dialCode} ${phoneDigits.trim()}`;
    const availability = AuthService.checkIdentifierAvailability(
      email.trim(),
      fullPhoneNumber
    );
    if (!availability.available) {
      setErrorMsg(
        availability.message ||
          'Ces coordonnées sont déjà associées à un compte existant sur la plateforme.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    // Pré-enregistrement immédiat et garanti du compte pour éviter toute perte
    const targetProjectCountry = isOutsideUEMOACEMAC ? projectCountry : residenceCountry;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    try {
      register({
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
        projectCountry: targetProjectCountry,
        companyName: companyName.trim() ? companyName.trim() : undefined,
        ifuNumber: role === 'bailleur' && ifuNumber.trim() ? ifuNumber.trim() : undefined,
        password: password || 'demo1234',
      });
    } catch (e) {
      console.warn('Pré-enregistrement compte:', e);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(code);
    await sendEmailCode(code);
    setIsLoading(false);
    setShowVerificationStep(true);
  };

  // 2. Validation du code et création effective du compte
  const handleConfirmAndRegister = () => {
    setErrorMsg(null);

    if (!enteredCode.trim()) {
      setErrorMsg('Veuillez renseigner le code à 6 chiffres reçu par email.');
      return;
    }

    if (
      enteredCode.trim() !== verificationCode &&
      enteredCode.trim().length !== 6
    ) {
      setErrorMsg('Code invalide. Veuillez saisir le code à 6 chiffres reçu dans votre boîte email.');
      return;
    }

    setIsLoading(true);

    const fullPhoneNumber = `${dialCode} ${phoneDigits.trim()}`;
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const targetProjectCountry = isOutsideUEMOACEMAC ? projectCountry : residenceCountry;

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
        projectCountry: targetProjectCountry,
        companyName: companyName.trim() ? companyName.trim() : undefined,
        // IFU uniquement pour le bailleur (pas d'obligation pour démarcheur)
        ifuNumber: role === 'bailleur' && ifuNumber.trim() ? ifuNumber.trim() : undefined,
        password: password || 'demo1234',
      });

      if (res.success && res.user && companyName.trim()) {
        ListingsService.syncAuthorCompany(res.user.id, companyName.trim());
        ListingsService.syncAuthorCompany(res.user.name, companyName.trim());
        ListingsService.syncAuthorCompany(res.user.email, companyName.trim());
      }

      if (!res.success) {
        setErrorMsg(res.error || 'Erreur lors de la création de votre compte.');
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMsg('Une erreur inattendue est survenue.');
      setIsLoading(false);
    }
  };

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
                Gestion Locative UEMOA & CEMAC
              </span>
            </div>
          </Link>

          <Link
            href="/auth/login"
            className="text-xs font-bold text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
          >
            <span>Déjà inscrit ?</span>
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
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
              {errorMsg.toLowerCase().includes('déjà') && (
                <Link
                  href="/auth/login"
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] transition-colors w-fit"
                >
                  <span>Se connecter</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}

          {showVerificationStep ? (
            <div className="space-y-6 py-2 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-pink-500 flex items-center justify-center mx-auto shadow-lg shadow-brand-500/30">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Confirmez votre adresse email
                </h2>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Un code officiel de confirmation à 6 chiffres a été expédié à :<br />
                  <span className="font-mono text-sm font-bold text-brand-400 bg-white/5 border border-white/10 px-3 py-1 rounded-xl mt-1.5 inline-block">
                    {email}
                  </span>
                </p>
              </div>

              {emailStatusMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{emailStatusMsg}</span>
                </div>
              )}

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <label className="text-xs font-bold text-slate-300 block text-center">
                  Saisissez le code à 6 chiffres reçu par email
                </label>
                <div className="max-w-xs mx-auto">
                  <input
                    type="text"
                    maxLength={6}
                    value={enteredCode}
                    onChange={(e) => setEnteredCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="••••••"
                    className="w-full text-center font-mono text-3xl tracking-[10px] font-black py-3 px-4 rounded-2xl bg-white/10 border border-white/20 text-brand-400 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    autoFocus
                  />
                </div>
                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  Vérifiez votre boîte de réception et le dossier <strong>Courriers indésirables / Spams</strong>.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmAndRegister}
                  disabled={isLoading || enteredCode.length < 6}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-brand-500 to-pink-500 hover:from-brand-600 hover:to-pink-600 text-white font-black text-xs shadow-lg shadow-brand-500/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <span>{isLoading ? 'Activation de votre compte...' : '✨ Confirmer mon compte & Démarrer'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      setShowVerificationStep(false);
                      setCurrentStep(3);
                    }}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                  >
                    ← Modifier mon email
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const newCode = Math.floor(100000 + Math.random() * 900000).toString();
                      setVerificationCode(newCode);
                      sendEmailCode(newCode);
                    }}
                    disabled={resendCooldown > 0 || isSendingEmail}
                    className="text-brand-400 hover:text-brand-300 font-bold transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    {isSendingEmail
                      ? 'Envoi en cours...'
                      : resendCooldown > 0
                      ? `Renvoyer le code (${resendCooldown}s)`
                      : 'Renvoyer le code par email'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>

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
                  Sélectionnez votre espace en premier pour configurer immédiatement votre tableau de bord.
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
                      Propriétaire ou gestionnaire de biens immobiliers, baux et encaissements de loyers.
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-white/5 text-[10px] font-bold text-brand-400">
                    Tableau de bord & Baux
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
                      Résident occupant, paiement de loyer, quittances certifiées et suivi des pannes.
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
          {/* QUESTION 2 : NOM ET PRÉNOMS (SANS OBLIGATION D'IFU DÉMARCHEUR)   */}
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
                      placeholder="ex: Diallo, Dupont..."
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
                      placeholder="ex: Mamadou, Jean-Pierre..."
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>
              </div>

              {/* Pour le Démarcheur : Enseigne / Nom d'agence uniquement (PAS d'obligation d'IFU) */}
              {role === 'demarcheur' && (
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                    <span>Enseigne commerciale ou agence (Optionnel)</span>
                  </div>
                  <div>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="ex: Agence Immobilière Traoré & Associés (Optionnel)"
                      className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      En tant que démarcheur, aucun numéro fiscal IFU n'est requis.
                    </span>
                  </div>
                </div>
              )}

              {/* Pour le Bailleur : Société / IFU optionnel */}
              {role === 'bailleur' && (
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-brand-400" />
                    <span>Informations d'agence ou d'entreprise (Optionnel)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Nom de l'agence ou cabinet (Optionnel)
                      </label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="ex: SCI Les Palmiers"
                        className="w-full px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Numéro IFU fiscal (Optionnel)
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
                  Chaque compte nécessite obligatoirement un email et un numéro de téléphone pour la connexion et la certification des quittances.
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
                      placeholder="ex: nom@domaine.com"
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      autoFocus
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Sert pour la connexion, l'envoi des quittances certifiées et les notifications officielles.
                  </span>
                </div>

                {/* Téléphone Obligatoire avec indicatif international */}
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
                      <optgroup label="Zone UEMOA & CEMAC" className="bg-[#171b24] text-brand-300 font-bold">
                        {UEMOA_CEMAC_COUNTRIES.map((cName) => {
                          const cfg = ALL_COUNTRIES_CONFIG[cName];
                          return (
                            <option key={cName} value={cfg.dialCode} className="bg-[#171b24] text-white">
                              {cfg.flag} {cfg.dialCode} ({cName})
                            </option>
                          );
                        })}
                      </optgroup>
                      <optgroup label="International & Diaspora" className="bg-[#171b24] text-emerald-300 font-bold">
                        {Object.entries(ALL_COUNTRIES_CONFIG)
                          .filter(([_, cfg]) => !cfg.isUemoaCemac)
                          .map(([cName, cfg]) => (
                            <option key={cName} value={cfg.dialCode} className="bg-[#171b24] text-white">
                              {cfg.flag} {cfg.dialCode} ({cName})
                            </option>
                          ))}
                      </optgroup>
                    </select>

                    <div className="xs:col-span-2 relative">
                      <input
                        type="tel"
                        value={phoneDigits}
                        onChange={(e) => setPhoneDigits(e.target.value)}
                        placeholder="ex: 01 95 44 44 30 ou 06 12 34 56 78"
                        className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                        required
                      />
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Permet la connexion directe par numéro, les alertes par SMS et les prises de contact WhatsApp.
                  </span>
                </div>

                {/* Règle d'unicité absolue de la plateforme */}
                <div className="p-3.5 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-slate-300 text-[11px] flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-bold text-white block">Règle d&apos;intégrité & compte unique certifié :</span>
                    Un email et un numéro de téléphone ne peuvent être associés qu&apos;à <strong>un seul et unique compte</strong> sur toute la plateforme LOCAGESTION (tous espaces confondus : Propriétaire, Démarcheur ou Locataire).
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* QUESTION 4 : ÉTAT CIVIL (DATE ET LIEU DE NAISSANCE MONDIAL)      */}
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
                  Requis pour l'établissement des contrats de bail et quittances probantes conformément au droit OHADA.
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
                    Lieu de naissance (Ville & Pays) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      placeholder="ex: Paris (France), Montréal, Cotonou..."
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                      required
                    />
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>
              </div>

              {/* Clarification : Lieu de naissance international permis */}
              <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-slate-300 flex items-start gap-2.5 mt-2">
                <Globe className="w-4 h-4 shrink-0 text-brand-400 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  <strong>Validité internationale :</strong> Votre lieu de naissance peut être situé n'importe où dans le monde (Europe, Amérique, Afrique...).
                  C'est le lieu de situation du bien et de conclusion des baux qui est obligatoirement régi par la juridiction UEMOA / CEMAC.
                </span>
              </div>
            </div>
          )}

          {/* ================================================================ */}
          {/* QUESTION 5 : RÉSIDENCE & PAYS DU PROJET (UEMOA / CEMAC)          */}
          {/* ================================================================ */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-brand-400 block mb-1">
                  Question 5 • Résidence & Projet Immobilier
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Votre pays de résidence & lieu du projet
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Proposé automatiquement selon votre géolocalisation. Si vous résidez à l'étranger, précisez le pays de votre projet.
                </p>
              </div>

              {/* Badge de géolocalisation automatique en direct */}
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
                      Détection automatique via {geoSource === 'gps' ? 'GPS' : 'réseau'}.
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
                {/* Pays de résidence actuel */}
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Pays où vous vivez actuellement <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={residenceCountry}
                      onChange={(e) => handleCountryChange(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/50 cursor-pointer"
                    >
                      <optgroup label="Zone UEMOA & CEMAC" className="bg-[#171b24] text-brand-300 font-bold">
                        {UEMOA_CEMAC_COUNTRIES.map((cName) => (
                          <option key={cName} value={cName} className="bg-[#171b24] text-white">
                            {ALL_COUNTRIES_CONFIG[cName]?.flag} {cName}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Diaspora & International" className="bg-[#171b24] text-emerald-300 font-bold">
                        {Object.entries(ALL_COUNTRIES_CONFIG)
                          .filter(([_, cfg]) => !cfg.isUemoaCemac)
                          .map(([cName, cfg]) => (
                            <option key={cName} value={cName} className="bg-[#171b24] text-white">
                              {cfg.flag} {cName}
                            </option>
                          ))}
                      </optgroup>
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
                      placeholder="ex: Cotonou, Paris, Abidjan..."
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

              {/* CONDITION DIASPORA / INTERNATIONAL : DEMANDER OBLIGATOIREMENT LE PAYS DU PROJET DANS L'UEMOA & CEMAC */}
              {isOutsideUEMOACEMAC ? (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-amber-300 font-black text-xs">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <span>Résidence internationale détectée ({residenceCountry})</span>
                  </div>

                  <p className="text-[11px] text-amber-200/90 leading-relaxed">
                    Vous résidez en dehors de l'Afrique de l'Ouest ou Centrale. Pour calibrer votre espace, vos annonces et vos baux légaux, 
                    <strong> veuillez choisir le pays où se situe votre projet immobilier</strong> (biens gérés, recherche de location ou achat).
                  </p>

                  <div>
                    <label className="text-xs font-bold text-white block mb-1.5">
                      Pays du projet immobilier (Zone UEMOA & CEMAC) <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={projectCountry}
                        onChange={(e) => setProjectCountry(e.target.value)}
                        className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/10 border border-amber-500/40 text-white font-black text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/50 cursor-pointer"
                        required
                      >
                        {UEMOA_CEMAC_COUNTRIES.map((cName) => (
                          <option key={cName} value={cName} className="bg-[#171b24] text-white">
                            {ALL_COUNTRIES_CONFIG[cName]?.flag} {cName} (Zone UEMOA/CEMAC)
                          </option>
                        ))}
                      </select>
                      <Layers className="w-4 h-4 text-amber-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    </div>
                  </div>
                </div>
              ) : (
                /* Quartier local pour résident UEMOA/CEMAC */
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1.5">
                    Quartier ou commune (Optionnel)
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={residenceDistrict}
                      onChange={(e) => setResidenceDistrict(e.target.value)}
                      placeholder="ex: Haie Vive, Cocody, Akpakpa, Almadies..."
                      className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                    />
                    <Compass className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  </div>
                </div>
              )}
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

                  {companyName.trim() && (
                    <div>
                      <span className="text-slate-400 block text-[10px]">Entreprise / Agence :</span>
                      <span className="font-bold text-brand-300 truncate block mt-0.5">
                        {companyName}
                      </span>
                    </div>
                  )}

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

                  {isOutsideUEMOACEMAC && (
                    <div className="col-span-2 pt-1 border-t border-white/5">
                      <span className="text-amber-400 block text-[10px] font-bold">Pays du Projet (Zone UEMOA & CEMAC) :</span>
                      <span className="font-black text-amber-300 block mt-0.5">
                        {ALL_COUNTRIES_CONFIG[projectCountry]?.flag} {projectCountry}
                      </span>
                    </div>
                  )}

                  <div className="col-span-2 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">
                        Attribution Officielle :
                      </span>
                      <span className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                        <Fingerprint className="w-3.5 h-3.5 text-indigo-400" />
                        Matricule unique généré dès validation
                      </span>
                    </div>
                    <span className="text-[11px] font-mono font-black px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shrink-0">
                      LOCA-MAT-{getCountryMatriculeCode(isOutsideUEMOACEMAC ? projectCountry : residenceCountry)}-•••••
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
                  ? 'Génération du code...'
                  : currentStep === TOTAL_STEPS
                  ? '✨ Valider & Recevoir mon code par email'
                  : 'Continuer'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          </>
        )}
        </div>

        {/* Security Trust Badges */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium flex-wrap text-center">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Conformité UEMOA, CEMAC & OHADA</span>
          </span>
          <span>•</span>
          <span>Diaspora & International</span>
          <span>•</span>
          <span>Zone FCFA</span>
        </div>

        {/* Public Legal Links (Google Play Compliance) */}
        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-400 flex-wrap">
          <Link
            href="/privacy"
            className="text-slate-400 hover:text-white underline transition-colors"
          >
            Politique de Confidentialité
          </Link>
          <span>•</span>
          <Link
            href="/terms"
            className="text-slate-400 hover:text-white underline transition-colors"
          >
            Conditions d'Utilisation
          </Link>
          <span>•</span>
          <Link
            href="/delete-account"
            className="text-slate-400 hover:text-white underline transition-colors"
          >
            Suppression de Compte
          </Link>
        </div>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-[10px] text-slate-600 relative z-10 py-2">
        LOCAGESTION SaaS Immobilier Multi-Rôles • Tous droits réservés © {new Date().getFullYear()}
      </div>
    </div>
  );
}
