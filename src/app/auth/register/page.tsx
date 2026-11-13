'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Globe,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/context/space-context';
import { UserSpace } from '@/lib/types';
import { COUNTRIES_CITIES } from '@/lib/data/mock-data';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  // Form State
  const [role, setRole] = useState<UserSpace>('locataire');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Bénin');
  const [city, setCity] = useState('Cotonou');
  const [district, setDistrict] = useState('Haie Vive');
  const [companyName, setCompanyName] = useState('');
  const [ifuNumber, setIfuNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const availableCities = COUNTRIES_CITIES[country]?.cities || ['Cotonou', 'Porto-Novo', 'Abomey-Calavi'];

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    const cities = COUNTRIES_CITIES[newCountry]?.cities;
    if (cities && cities.length > 0) {
      setCity(cities[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Veuillez renseigner votre nom complet.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Veuillez renseigner votre adresse email.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg('Veuillez renseigner votre numéro de téléphone.');
      return;
    }
    if (password && password.length < 4) {
      setErrorMsg('Le mot de passe doit comporter au moins 4 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Les mots de passe ne correspondent pas.');
      return;
    }

    setIsLoading(true);
    try {
      const res = register({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role,
        residenceCountry: country,
        residenceCity: city,
        residenceDistrict: district.trim() || undefined,
        companyName: (role === 'bailleur' || role === 'demarcheur') ? companyName.trim() : undefined,
        ifuNumber: (role === 'bailleur' || role === 'demarcheur') ? ifuNumber.trim() : undefined,
        password: password || 'demo1234',
      });

      if (!res.success) {
        setErrorMsg(res.error || 'Erreur lors de la création du compte.');
      }
    } catch (err) {
      setErrorMsg('Une erreur inattendue est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e1117] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Glow Effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-xl relative z-10 px-4">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-pink-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <svg
              width="24"
              height="24"
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
          <div className="text-left">
            <span className="text-2xl font-black tracking-tight text-white block">
              LOCA<span className="text-brand-400">GESTION</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              SaaS Gestion Locative UEMOA & CEMAC
            </span>
          </div>
        </div>

        <h2 className="text-center text-2xl sm:text-3xl font-black tracking-tight text-white">
          Créer votre compte
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-slate-400">
          Choisissez votre statut pour accéder à votre espace de travail dédié et sécurisé.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl px-4 relative z-10">
        <div className="bg-[#171b24] py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/10 space-y-6">
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. CHOIX DU PROFIL (Séparation Stricte des Espaces) */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 block mb-3">
                1. Choisissez votre profil d'activité :
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Option Bailleur */}
                <div
                  onClick={() => setRole('bailleur')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                    role === 'bailleur'
                      ? 'bg-brand-500/15 border-brand-500 ring-2 ring-brand-500/40 text-white'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`p-2 rounded-xl ${
                        role === 'bailleur'
                          ? 'bg-brand-500 text-white shadow-md shadow-brand-500/30'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                    </span>
                    {role === 'bailleur' && (
                      <CheckCircle2 className="w-4 h-4 text-brand-400" />
                    )}
                  </div>
                  <h3 className="font-black text-xs text-white">
                    Bailleur
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Gestion de parc, loyers, baux OHADA et quittances.
                  </p>
                  <div className="mt-2.5 text-[9px] font-bold text-brand-400 uppercase tracking-wider">
                    Espace Bailleur
                  </div>
                </div>

                {/* Option Démarcheur */}
                <div
                  onClick={() => setRole('demarcheur')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                    role === 'demarcheur'
                      ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/40 text-white'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`p-2 rounded-xl ${
                        role === 'demarcheur'
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                    </span>
                    {role === 'demarcheur' && (
                      <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    )}
                  </div>
                  <h3 className="font-black text-xs text-white">
                    Démarcheur
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Publication d’annonces, visites et mise en relation.
                  </p>
                  <div className="mt-2.5 text-[9px] font-bold text-amber-400 uppercase tracking-wider">
                    Espace Démarcheur
                  </div>
                </div>

                {/* Option Locataire */}
                <div
                  onClick={() => setRole('locataire')}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left relative ${
                    role === 'locataire'
                      ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/40 text-white'
                      : 'bg-white/5 border-white/10 hover:border-white/20 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`p-2 rounded-xl ${
                        role === 'locataire'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                          : 'bg-white/10 text-slate-400'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                    </span>
                    {role === 'locataire' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <h3 className="font-black text-xs text-white">
                    Locataire
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    Paiement Mobile Money / Wave et quittances certifiées.
                  </p>
                  <div className="mt-2.5 text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                    Portail Résident
                  </div>
                </div>
              </div>
            </div>

            {/* 2. IDENTITÉ ET CONTACT */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 block mb-3">
                2. Coordonnées personnelles :
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Nom & Prénoms complets
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Koffi Mensah ou Mamadou Diallo"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      required
                    />
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Adresse Email
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ex: contact@email.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Numéro de Téléphone (Mobile Money & WhatsApp)
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ex: +229 97 12 34 56 ou +225 07..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      required
                    />
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. PAYS DE RÉSIDENCE RENSEIGNÉ LORS DE L'INSCRIPTION */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-brand-400" />
                <label className="text-xs font-black uppercase tracking-wider text-slate-300">
                  3. Pays de résidence (Zone UEMOA & CEMAC / Afrique) :
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Pays de résidence
                  </label>
                  <select
                    value={country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1e2330] border border-white/15 text-white text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                  >
                    {Object.keys(COUNTRIES_CITIES).map((cName) => (
                      <option key={cName} value={cName}>
                        {COUNTRIES_CITIES[cName].flag} {cName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Ville principale
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#1e2330] border border-white/15 text-white text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer"
                  >
                    {availableCities.map((cityName) => (
                      <option key={cityName} value={cityName}>
                        {cityName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Quartier / Secteur
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Ex: Haie Vive, Cocody..."
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
              </div>
            </div>

            {/* Champs spécifiques Bailleur / Démarcheur */}
            {(role === 'bailleur' || role === 'demarcheur') && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <span className="text-[11px] font-black uppercase text-brand-300 block">
                  Informations professionnelles (Optionnel) :
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Nom de l'agence ou Raison sociale
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Ex: Cabinet Diallo Patrimoine SARL"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Numéro IFU / NINEA / NCC
                    </label>
                    <input
                      type="text"
                      value={ifuNumber}
                      onChange={(e) => setIfuNumber(e.target.value)}
                      placeholder="Ex: 0202110485960"
                      className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. SÉCURITÉ DU COMPTE */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-slate-300 block mb-3">
                4. Mot de passe de connexion :
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-400 block mb-1">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3.5 px-4 rounded-2xl text-white font-black text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                role === 'bailleur'
                  ? 'bg-brand-500 hover:bg-brand-600 shadow-brand-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
              }`}
            >
              <span>
                {isLoading
                  ? 'Création du compte en cours...'
                  : `Créer mon compte ${role === 'bailleur' ? 'Bailleur/Démarcheur' : 'Locataire'}`}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Link to Login */}
          <div className="pt-2 border-t border-white/5 text-center">
            <p className="text-xs text-slate-400">
              Vous avez déjà un compte ?{' '}
              <Link
                href="/auth/login"
                className="text-brand-400 hover:text-brand-300 font-bold hover:underline"
              >
                Se connecter
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

