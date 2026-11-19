'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Camera,
  UploadCloud,
  Check,
  Building2,
  Lock,
  LogOut,
  Users,
  Repeat,
  Copy,
  Fingerprint,
} from 'lucide-react';
import { UserProfile, UserSpace } from '@/lib/types';
import {
  getUserProfile,
  saveUserProfile,
  detectUserGeoLocation,
  requestUserGeolocationWithFeedback,
  UserGeoLocation,
} from '@/lib/services/geo-service';
import { AuthService, isCanonicalJojoVog } from '@/lib/services/auth-service';
import { COUNTRIES_CITIES } from '@/lib/data/mock-data';
import { notifySave } from '@/lib/notifications/action-notifier';
import { useSpace } from '@/lib/context/space-context';
import { ListingsService } from '@/lib/services/listings-service';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSpace?: UserSpace;
}

export function UserProfileModal({
  isOpen,
  onClose,
  activeSpace: initialActiveSpace = 'locataire',
}: UserProfileModalProps) {
  const { activeSpace, switchSpace, logout, user } = useSpace();
  const currentRole = activeSpace || initialActiveSpace;

  const [profile, setProfile] = useState<UserProfile>(() => getUserProfile(currentRole));
  const [userLocation, setUserLocation] = useState<UserGeoLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedMatricule, setCopiedMatricule] = useState(false);
  const [gpsFeedback, setGpsFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleCopyMatricule = (matricule: string) => {
    if (!matricule) return;
    navigator.clipboard?.writeText(matricule);
    setCopiedMatricule(true);
    setTimeout(() => setCopiedMatricule(false), 2000);
  };

  // Synchronisation des données à l'ouverture de la modale
  useEffect(() => {
    if (isOpen) {
      const p = getUserProfile(currentRole);
      if (user) {
        if (user.avatarUrl) p.avatarUrl = user.avatarUrl;
        if (user.companyName !== undefined) p.companyName = user.companyName;
        if (user.name) p.name = user.name;
        if (user.firstName) p.firstName = user.firstName;
        if (user.lastName) p.lastName = user.lastName;
        if (user.email) p.email = user.email;
        if (user.phone) p.phone = user.phone;
        if (user.matricule) p.matricule = user.matricule;
        if (user.residenceCountry) p.residenceCountry = user.residenceCountry;
        if (user.residenceCity) p.residenceCity = user.residenceCity;
        if (user.residenceDistrict) p.residenceDistrict = user.residenceDistrict;
        if (user.projectCountry) p.projectCountry = user.projectCountry;
      }
      setProfile(p);
      setSavedSuccess(false);
      setGpsFeedback(null);
      detectUserGeoLocation()
        .then((geo) => setUserLocation(geo))
        .catch(() => {});
    }
  }, [isOpen, currentRole, user]);

  // Fermeture par la touche Échap (Hook inconditionnel)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Le return null est placé APRÈS TOUS les hooks
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

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Redimensionnement et compression intelligente pour éviter tout dépassement de quota localStorage
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const targetSize = 320;
          const minSide = Math.min(img.width, img.height);
          const startX = (img.width - minSide) / 2;
          const startY = (img.height - minSide) / 2;

          canvas.width = targetSize;
          canvas.height = targetSize;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, targetSize, targetSize);
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.85);

            setProfile((prev) => ({
              ...prev,
              avatarUrl: compressedUrl,
            }));
          } else {
            setProfile((prev) => ({
              ...prev,
              avatarUrl: rawDataUrl,
            }));
          }
        } catch {
          setProfile((prev) => ({
            ...prev,
            avatarUrl: rawDataUrl,
          }));
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRefreshGPS = async () => {
    setIsLocating(true);
    setGpsFeedback(null);
    try {
      const res = await requestUserGeolocationWithFeedback();
      setUserLocation(res.location);
      setGpsFeedback(res.message);
      notifySave(res.message);
    } catch (e) {
      notifySave('Géolocalisation mise à jour.');
    } finally {
      setIsLocating(false);
    }
  };

  const handleRoleToggle = (newRole: UserSpace) => {
    setProfile((prev) => ({ ...prev, role: newRole }));
    switchSpace(newRole);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Calcul des données d'identité saisies par l'utilisateur avec scellement d'intégrité
    const isJojo = isCanonicalJojoVog(profile.email || user?.email, profile.matricule || user?.matricule, profile.name || user?.name);

    const resolvedFirstName = isJojo ? 'Jojo' : (profile.firstName?.trim() || '');
    const resolvedLastName = isJojo ? 'VOG' : (profile.lastName?.trim() || '');
    const resolvedPhone = isJojo ? (profile.phone?.trim() || '+229 97 00 12 34') : (profile.phone?.trim() || '');
    const resolvedMatricule = isJojo ? 'LOCA-MAT-BJ-17635' : (profile.matricule || user?.matricule || 'LOCA-MAT-BJ-00000');

    const isComplete = Boolean(resolvedFirstName && resolvedLastName && resolvedPhone);
    const isSealed = Boolean(profile.isIdentitySealed || isComplete || isJojo);

    const fullName = `${resolvedFirstName} ${resolvedLastName}`.trim() || profile.name || user?.name || '';
    const cleanCompany = profile.role === 'locataire' ? undefined : (profile.companyName !== undefined ? profile.companyName.trim() : undefined);
    const targetAvatar = profile.avatarUrl || user?.avatarUrl;

    const finalProfile: UserProfile = {
      ...profile,
      name: fullName,
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      phone: resolvedPhone,
      email: user?.email || profile.email,
      matricule: resolvedMatricule,
      isIdentitySealed: isSealed,
      companyName: cleanCompany,
      avatarUrl: targetAvatar,
    };

    // 2. Sauvegarde du profil via geo-service
    saveUserProfile(finalProfile);

    // 3. Mise à jour via AuthService
    if (user?.id) {
      AuthService.updateUser(user.id, {
        companyName: cleanCompany,
        avatarUrl: targetAvatar,
        residenceCountry: finalProfile.residenceCountry,
        residenceCity: finalProfile.residenceCity,
        residenceDistrict: finalProfile.residenceDistrict,
        projectCountry: finalProfile.projectCountry,
      });
    }

    AuthService.updateCurrentUser({
      companyName: cleanCompany,
      avatarUrl: targetAvatar,
      residenceCountry: finalProfile.residenceCountry,
      residenceCity: finalProfile.residenceCity,
      residenceDistrict: finalProfile.residenceDistrict,
      projectCountry: finalProfile.projectCountry,
    });

    // 4. Synchronisation sur toutes les annonces publiées par cet utilisateur si bailleur/démarcheur
    if (finalProfile.role !== 'locataire') {
      if (finalProfile.id) {
        ListingsService.syncAuthorCompany(finalProfile.id, cleanCompany);
      }
      if (finalProfile.name) {
        ListingsService.syncAuthorCompany(finalProfile.name, cleanCompany);
      }
      if (finalProfile.email) {
        ListingsService.syncAuthorCompany(finalProfile.email, cleanCompany);
      }
      if (finalProfile.phone) {
        ListingsService.syncAuthorCompany(finalProfile.phone, cleanCompany);
      }
    }

    // 5. Synchronisation absolue dans la session active et les utilisateurs enregistrés
    if (typeof window !== 'undefined') {
      try {
        const payloadUser = {
          ...(user || {}),
          ...finalProfile,
          companyName: cleanCompany,
          avatarUrl: targetAvatar,
        };

        // Sauvegarde sur le serveur Next.js en arrière-plan
        fetch('/api/auth/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadUser),
        }).catch(() => {});

        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user: payloadUser }),
        }).catch(() => {});

        window.dispatchEvent(new CustomEvent('locagestion:auth_changed', { detail: { user: payloadUser } }));
        window.dispatchEvent(new CustomEvent('locagestion:profile_updated', { detail: finalProfile }));
        window.dispatchEvent(new CustomEvent('locagestion:users_updated'));
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.error('Erreur mise à jour session:', err);
      }
    }

    setSavedSuccess(true);
    notifySave(
      `Profil de ${finalProfile.name || 'votre compte'} mis à jour avec succès !`,
      'Profil enregistré'
    );
    setTimeout(() => {
      onClose();
    }, 700);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <img
                src={
                  profile.avatarUrl ||
                  (profile.role === 'bailleur'
                    ? 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=160&auto=format&fit=crop&q=80'
                    : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80')
                }
                alt={profile.name}
                className="w-14 h-14 rounded-2xl object-cover ring-2 ring-white/20 shadow-md"
              />
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-900" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Profil & Informations d'Inscription
                </h2>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {profile.role === 'bailleur'
                    ? 'Bailleur Propriétaire'
                    : profile.role === 'demarcheur'
                    ? 'Démarcheur Immobilier'
                    : 'Locataire Résident'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {profile.name} • Résidence {profile.residenceCountry} {currentCountryData.flag}
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
          {/* Statut & Rôle Certifié du Compte Connecté */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${
                  profile.role === 'bailleur'
                    ? 'bg-brand-500 shadow-md shadow-brand-500/20'
                    : profile.role === 'demarcheur'
                    ? 'bg-amber-500 shadow-md shadow-amber-500/20'
                    : 'bg-emerald-600 shadow-md shadow-emerald-600/20'
                }`}
              >
                {profile.role === 'bailleur' ? (
                  <Building2 className="w-5 h-5" />
                ) : profile.role === 'demarcheur' ? (
                  <Sparkles className="w-5 h-5" />
                ) : (
                  <Users className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-900 block">
                    {profile.role === 'bailleur'
                      ? 'Compte Bailleur Propriétaire'
                      : profile.role === 'demarcheur'
                      ? 'Compte Démarcheur Professionnel'
                      : 'Compte Locataire Résident'}
                  </span>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                      profile.role === 'bailleur'
                        ? 'bg-brand-50 text-brand-600 border border-brand-200'
                        : profile.role === 'demarcheur'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {profile.role === 'bailleur' ? 'Patrimoine' : profile.role === 'demarcheur' ? 'Intermédiaire' : 'Résident'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  {profile.role === 'bailleur'
                    ? 'Espace strictement dédié au pilotage de votre parc immobilier et baux'
                    : profile.role === 'demarcheur'
                    ? 'Espace strictement dédié aux annonces, visites et contacts'
                    : 'Espace strictement dédié à vos loyers et quittances certifiées'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
                Espace {profile.role === 'bailleur' ? 'Bailleur' : profile.role === 'demarcheur' ? 'Démarcheur' : 'Locataire'}
              </span>
            </div>
          </div>

          {/* Photo de profil / Avatar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                <img
                  src={
                    profile.avatarUrl ||
                    (profile.role === 'bailleur'
                      ? 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=160&auto=format&fit=crop&q=80'
                      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80')
                  }
                  alt={profile.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-white shadow-xs"
                />
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 block flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-brand-500" />
                  <span>Photo de profil / Avatar</span>
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Format JPG, PNG ou WEBP • Optimisée automatiquement
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <UploadCloud className="w-3.5 h-3.5 text-brand-500" />
              <span>Changer la photo</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarFileUpload}
              className="hidden"
            />
          </div>

          {/* Alerte Explicative Règle Métier */}
          <div className="p-3.5 rounded-2xl bg-brand-50 border border-brand-200/80 text-xs text-brand-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Pays d'inscription :</strong> Définit automatiquement votre pays par défaut
              pour la <strong>recherche de logements</strong> (annonces de ce pays affichées en exclusivité et par proximité) et la <strong>création d'annonces</strong>.
            </div>
          </div>

          {/* Matricule Officiel Certifié */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-indigo-500/30 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">
                    Matricule Officiel Unique
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                    Certifié Plateforme
                  </span>
                </div>
                <div className="text-sm sm:text-base font-black font-mono tracking-wider text-white mt-0.5 truncate">
                  {user?.matricule || profile.matricule || 'LOCA-MAT-BJ-00000'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopyMatricule(user?.matricule || profile.matricule || '')}
              className="px-3 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              title="Copier le matricule"
            >
              {copiedMatricule ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier</span>
                </>
              )}
            </button>
          </div>


          {/* Identité Personnelle (Nom, Prénom, Téléphone, Email strictement scellés) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Nom de famille */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nom de famille</span>
                </label>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Scellé
                </span>
              </div>
              <input
                type="text"
                value={profile.lastName || ''}
                disabled
                readOnly
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 cursor-not-allowed select-none opacity-85 shadow-inner"
              />
            </div>

            {/* Prénom(s) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Prénom(s)</span>
                </label>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Scellé
                </span>
              </div>
              <input
                type="text"
                value={profile.firstName || ''}
                disabled
                readOnly
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 cursor-not-allowed select-none opacity-85 shadow-inner"
              />
            </div>

            {/* Email certifié (Identifiant unique) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>Email officiel (Identifiant unique)</span>
                </label>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Scellé
                </span>
              </div>
              <input
                type="email"
                value={profile.email}
                disabled
                readOnly
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 cursor-not-allowed select-none opacity-85 shadow-inner"
              />
            </div>

            {/* Téléphone certifié */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Numéro de téléphone officiel</span>
                </label>
                <span className="text-[10px] font-bold text-slate-600 bg-slate-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5" /> Scellé
                </span>
              </div>
              <input
                type="tel"
                value={profile.phone || ''}
                disabled
                readOnly
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 cursor-not-allowed select-none opacity-85 shadow-inner"
              />
            </div>
          </div>


          {/* Entreprise / Agence Immobilière (Optionnel - Pour Bailleur et Démarcheur uniquement) */}
          {profile.role !== 'locataire' && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-brand-500" />
                  <span>Nom de l&apos;entreprise ou agence (Optionnel)</span>
                </label>
                <span className="text-[10px] text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full font-bold border border-brand-200">
                  Prioritaire sous « Publié par »
                </span>
              </div>
              <input
                type="text"
                value={profile.companyName || ''}
                onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                placeholder="Ex: Agence Immobilière Prestige, SCI Le Phénix..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-[10px] text-slate-500 leading-snug">
                💡 <strong>Règle d&apos;affichage :</strong> Si vous renseignez le nom de votre entreprise ou agence, celui-ci s&apos;affichera en priorité sous <em>« Publié par »</em> sur vos annonces. Si non renseigné, votre nom et prénom civil (<strong>{profile.name}</strong>) apparaîtront par défaut.
              </p>
            </div>
          )}

          {/* Pays & Localité de résidence d'inscription (Obligatoire) */}
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
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Quartier / Lieu de résidence actuel</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    (Pour le calcul de proximité géographique)
                  </span>
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

          {/* Système de Géolocalisation */}
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
                className="px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-black shadow-pink-glow transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Activer la détection GPS par votre navigateur"
              >
                <Navigation className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{isLocating ? 'Détection GPS...' : 'Activer la géolocalisation'}</span>
              </button>
            </div>

            {gpsFeedback && (
              <div className="p-2.5 rounded-xl bg-slate-900 text-white text-[11px] font-medium leading-relaxed flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span>{gpsFeedback}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/60">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div className="truncate">
                <span className="font-semibold text-slate-700">Lieu détecté : </span>
                <span className="font-black text-slate-900">
                  {userLocation
                    ? userLocation.label
                    : `${profile.residenceDistrict || profile.residenceCity} (${profile.residenceCountry})`}
                </span>
                {userLocation && (
                  <span className="text-[10px] text-slate-400 font-mono ml-2">
                    ({userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)})
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bouton de sauvegarde & Déconnexion */}
          <div className="pt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                onClose();
                logout();
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Se déconnecter</span>
            </button>

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
