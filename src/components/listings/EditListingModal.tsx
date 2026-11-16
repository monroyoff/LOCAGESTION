'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Building2,
  MapPin,
  Banknote,
  FileText,
  Camera,
  CheckCircle2,
  Trash2,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { RentalListing, RentalPropertyType } from '@/lib/types';
import { COUNTRIES_CITIES } from '@/lib/data/mock-data';
import { formatFCFA, computeEntryCost } from '@/lib/money/format';
import { ModerationService } from '@/lib/services/moderation-service';
import { AuthService } from '@/lib/services/auth-service';

interface EditListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: RentalListing | null;
  onSave: (id: string, updates: Partial<RentalListing>) => void;
  onDelete?: (id: string) => void;
}

const PROPERTY_TYPES: RentalPropertyType[] = [
  'Chambre salon sanitaire',
  'Studio',
  'Appartement',
  'Villa',
  'Meublé',
  'Boutique',
  'Bureau',
  'Colocation',
  'Autres',
];

export function EditListingModal({
  isOpen,
  onClose,
  listing,
  onSave,
  onDelete,
}: EditListingModalProps) {
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState<RentalPropertyType>('Appartement');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [charges, setCharges] = useState('');
  const [depositMonths, setDepositMonths] = useState(3);
  const [advanceMonths, setAdvanceMonths] = useState(3);
  const [includeFirstRent, setIncludeFirstRent] = useState(true);
  const [includeAgencyFees, setIncludeAgencyFees] = useState(true);
  const [agencyFeesAmount, setAgencyFeesAmount] = useState('');
  const [hasUtilitiesDeposit, setHasUtilitiesDeposit] = useState(false);
  const [utilitiesDepositAmount, setUtilitiesDepositAmount] = useState('50000');
  const [surface, setSurface] = useState('');
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [landmark, setLandmark] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<RentalListing['status']>('disponible');
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (listing) {
      setTitle(listing.title || '');
      setPropertyType(listing.propertyType || 'Appartement');
      setMonthlyRent(listing.monthlyRent?.toString() || '');
      setCharges(listing.charges?.toString() || '0');
      setDepositMonths(listing.depositMonths !== undefined ? listing.depositMonths : 3);
      setAdvanceMonths(listing.advanceMonths !== undefined ? listing.advanceMonths : 3);
      setIncludeFirstRent(listing.includeFirstRent !== false);
      setIncludeAgencyFees(listing.includeAgencyFees !== false);
      setAgencyFeesAmount(listing.agencyFees ? listing.agencyFees.toString() : '');
      setHasUtilitiesDeposit(!!listing.hasUtilitiesDeposit);
      setUtilitiesDepositAmount(listing.utilitiesDeposit ? listing.utilitiesDeposit.toString() : '50000');
      setSurface(listing.surface?.toString() || '');
      setBedrooms(listing.bedrooms || 1);
      setBathrooms(listing.bathrooms || 1);
      setLandmark(listing.landmark || '');
      setDescription(listing.description || '');
      setStatus(listing.status || 'disponible');
      setImages(listing.images || []);
      setErrorMsg(null);
    }
  }, [listing]);

  if (!isOpen || !listing) return null;

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setImages([...images, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const parsedRent = Math.max(0, parseInt(monthlyRent, 10) || 0);
  const parsedCharges = Math.max(0, parseInt(charges, 10) || 0);
  const parsedAgency = includeAgencyFees
    ? (agencyFeesAmount ? parseInt(agencyFeesAmount, 10) || 0 : Math.round(parsedRent * 0.5))
    : 0;
  const parsedUtilities = hasUtilitiesDeposit
    ? (parseInt(utilitiesDepositAmount, 10) || 0)
    : 0;

  const entryCost = computeEntryCost({
    monthlyRent: parsedRent,
    charges: parsedCharges,
    depositMonths,
    advanceMonths,
    includeFirstRent,
    includeAgencyFees,
    agencyFees: parsedAgency,
    hasUtilitiesDeposit,
    utilitiesDeposit: parsedUtilities,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const rentNum = parseInt(monthlyRent, 10);
    if (!title.trim()) {
      setErrorMsg('Veuillez renseigner le titre de l’annonce.');
      return;
    }
    if (isNaN(rentNum) || rentNum <= 0) {
      setErrorMsg('Veuillez renseigner un loyer mensuel valide en FCFA.');
      return;
    }

    const finalImages = images.length > 0 ? images : listing.images;

    // 1. RÈGLE STRICTE DES 2 VISUELS MINIMUM
    if (finalImages.length < 2) {
      setErrorMsg(
        `Règle de sécurité stricte : Chaque annonce doit compter au moins deux (2) photos ou vidéos représentatives (actuellement : ${finalImages.length}/2).`
      );
      return;
    }

    // 2. MODÉRATION IA SYSTÈME AUTOMATIQUE (Nudité, Propos Sexuels, Rançonnement / Extorsion)
    const proposedTitle = title.trim();
    const moderation = ModerationService.validateListing({
      title: proposedTitle,
      propertyType,
      description: description.trim(),
      landmark: landmark.trim(),
      images: finalImages,
      city: listing.city,
      district: listing.district,
    });

    if (!moderation.isValid) {
      const currentUser = AuthService.getCurrentUser();
      ModerationService.recordSecurityAlert({
        listingId: listing.id,
        listingTitle: proposedTitle,
        author: currentUser,
        country: listing.country,
        city: listing.city,
        violations: moderation.violations,
      });

      setErrorMsg(
        `Modification bloquée par l'IA de Sécurité : ${moderation.violations.map((v) => v.message).join(' | ')} (Un signalement a été transmis à la direction)`
      );
      return;
    }

    onSave(listing.id, {
      title: proposedTitle,
      propertyType,
      monthlyRent: rentNum,
      charges: parsedCharges,
      depositMonths,
      advanceMonths,
      includeFirstRent,
      includeAgencyFees,
      agencyFees: parsedAgency,
      hasUtilitiesDeposit,
      utilitiesDeposit: parsedUtilities,
      surface: parseInt(surface, 10) || listing.surface,
      bedrooms,
      bathrooms,
      landmark: landmark.trim(),
      description: description.trim(),
      status,
      images: finalImages,
      moderationStatus: 'valide',
      moderatedAt: new Date().toISOString(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                <span>Modifier votre publication</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                  ID: {listing.id}
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {listing.city} • {listing.district} {listing.flag}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Statut de visibilité */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="text-xs font-black uppercase text-slate-700 block">
              Statut de publication :
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setStatus('disponible')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  status === 'disponible'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>En ligne</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('en_pause')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  status === 'en_pause'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>En pause</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('reserve')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  status === 'reserve'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Réservé</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('loue')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  status === 'loue'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Loué</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              {status === 'en_pause'
                ? '⚠️ En pause : votre annonce est masquée des résultats publics tant qu’elle est suspendue.'
                : status === 'disponible'
                ? '🟢 En ligne : annonce visible et ouverte aux visites et prises de contact.'
                : 'Indique aux visiteurs que le bien n’est plus disponible.'}
            </p>
          </div>

          {/* 2. Titre & Type */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Titre de l'annonce *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Appartement 3 Pièces Standing avec Balcon"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Type de bien
                </label>
                <select
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value as RentalPropertyType)}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {PROPERTY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Repère local (Landmark)
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Ex: À 50m de la Pharmacie Haie Vive"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          {/* 3. Tarifs Financiers */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Loyer mensuel (FCFA) *
              </label>
              <input
                type="number"
                value={monthlyRent}
                onChange={(e) => setMonthlyRent(e.target.value)}
                placeholder="Ex: 250000"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Charges (FCFA)
              </label>
              <input
                type="number"
                value={charges}
                onChange={(e) => setCharges(e.target.value)}
                placeholder="Ex: 20000"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Surface (m²)
              </label>
              <input
                type="number"
                value={surface}
                onChange={(e) => setSurface(e.target.value)}
                placeholder="Ex: 85"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* 4. Chambres & Salles de bain */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Chambres
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={bedrooms}
                onChange={(e) => setBedrooms(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Salles d'eau / Bains
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={bathrooms}
                onChange={(e) => setBathrooms(parseInt(e.target.value, 10) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold"
              />
            </div>
          </div>

          {/* 5. CONDITIONS FINANCIÈRES & COÛT TOTAL À L’ENTRÉE (Cases à cocher personnalisables) */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-emerald-600" />
                <span>Conditions Financières & À Prévoir à l'Entrée</span>
              </span>
              <span className="text-[10px] text-emerald-800 font-bold bg-white px-2.5 py-0.5 rounded-full border border-emerald-200">
                Cases à cocher sur-mesure
              </span>
            </div>

            {/* A. 1er loyer exigé à l'entrée */}
            <div className="p-3 bg-white rounded-xl border border-emerald-100 flex items-center justify-between gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                <input
                  type="checkbox"
                  checked={includeFirstRent}
                  onChange={(e) => setIncludeFirstRent(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    Exiger le 1er mois de loyer à l'entrée
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {includeFirstRent
                      ? 'Comptabilisé dans la somme totale à la remise des clés'
                      : 'Non exigé à la signature (paiement différé ou à terme échu)'}
                  </span>
                </div>
              </label>
              <span className={`text-xs font-bold ${includeFirstRent ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                {includeFirstRent ? formatFCFA(parsedRent + parsedCharges) : '0 FCFA'}
              </span>
            </div>

            {/* B. Caution & Avance sur loyer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block flex items-center justify-between">
                  <span>Caution Loyer (Garantie)</span>
                  <span className="text-[10px] text-emerald-700 font-bold">Max 3 mois</span>
                </label>
                <select
                  value={depositMonths}
                  onChange={(e) => setDepositMonths(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold"
                >
                  <option value={0}>0 mois — Aucune caution</option>
                  <option value={1}>1 mois ({formatFCFA(parsedRent * 1)})</option>
                  <option value={2}>2 mois ({formatFCFA(parsedRent * 2)})</option>
                  <option value={3}>3 mois ({formatFCFA(parsedRent * 3)}) — ★ Standard UEMOA</option>
                </select>
              </div>

              <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block flex items-center justify-between">
                  <span>Avance sur Loyer</span>
                  <span className="text-[10px] text-emerald-700 font-bold">Standard : 3 mois</span>
                </label>
                <select
                  value={advanceMonths}
                  onChange={(e) => setAdvanceMonths(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold"
                >
                  <option value={0}>0 mois — Aucune avance</option>
                  <option value={1}>1 mois ({formatFCFA(parsedRent * 1)})</option>
                  <option value={2}>2 mois ({formatFCFA(parsedRent * 2)})</option>
                  <option value={3}>3 mois ({formatFCFA(parsedRent * 3)}) — ★ Standard Afrique</option>
                  <option value={4}>4 mois ({formatFCFA(parsedRent * 4)})</option>
                  <option value={6}>6 mois ({formatFCFA(parsedRent * 6)})</option>
                </select>
              </div>
            </div>

            {/* C. Caution Eau et Électricité (Compteur / Cash Power) */}
            <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={hasUtilitiesDeposit}
                    onChange={(e) => setHasUtilitiesDeposit(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-600" />
                      <span>Caution Compteurs Eau & Électricité (SBEE / SONEB / Cash Power)</span>
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Garantie forfaitaire pour compteurs, consommations résiduelles ou recharge initiale.
                    </span>
                  </div>
                </label>
                {hasUtilitiesDeposit && (
                  <span className="text-xs font-black text-amber-900 shrink-0">
                    + {formatFCFA(parsedUtilities)}
                  </span>
                )}
              </div>
              {hasUtilitiesDeposit && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600 shrink-0">Montant convenu :</span>
                  <input
                    type="number"
                    value={utilitiesDepositAmount}
                    onChange={(e) => setUtilitiesDepositAmount(e.target.value)}
                    placeholder="Ex: 50000"
                    className="w-36 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                  />
                  <span className="text-[11px] text-slate-500 font-bold">FCFA</span>
                </div>
              )}
            </div>

            {/* D. Frais d'agence / Démarcheur */}
            <div className="p-3 bg-white rounded-xl border border-emerald-100 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={includeAgencyFees}
                    onChange={(e) => setIncludeAgencyFees(e.target.checked)}
                    className="w-4 h-4 rounded text-slate-800 focus:ring-slate-700 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Frais d'agence / Honoraires démarcheur
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      Commission d'intermédiation à la charge du locataire entrant.
                    </span>
                  </div>
                </label>
                {includeAgencyFees && (
                  <span className="text-xs font-black text-slate-900 shrink-0">
                    + {formatFCFA(parsedAgency)}
                  </span>
                )}
              </div>
              {includeAgencyFees && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-600 shrink-0">Montant honoraires :</span>
                  <input
                    type="number"
                    value={agencyFeesAmount}
                    onChange={(e) => setAgencyFeesAmount(e.target.value)}
                    placeholder={`Défaut: ${Math.round(parsedRent * 0.5)} FCFA`}
                    className="w-36 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                  />
                  <span className="text-[11px] text-slate-500 font-bold">FCFA</span>
                </div>
              )}
            </div>

            {/* E. Encadré vert officiel : À PRÉVOIR À L’ENTRÉE (COÛT TOTAL) */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md">
              <span className="text-[10px] font-extrabold uppercase tracking-wider block text-emerald-200">
                À PRÉVOIR À L’ENTRÉE (COÛT TOTAL) :
              </span>
              <div className="text-2xl font-black mt-1">
                {formatFCFA(entryCost.total)}
              </div>
              <span className="text-xs text-emerald-100 block mt-1 font-medium">
                {entryCost.formulaLabel}
              </span>
            </div>
          </div>

          {/* 5. Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Description détaillée
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez les atouts, compteurs d'électricité, eau, sécurité et commodités du bien..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed"
            />
          </div>

          {/* 6. Photos */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              Photos de l'annonce ({images.length})
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden group border border-slate-200">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer la photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Ajouter une URL d'image (ex: https://images.unsplash.com/...)"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Ajouter
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            {onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Confirmez-vous la suppression définitive de l'annonce « ${listing.title} » ?`)) {
                    onDelete(listing.id);
                    onClose();
                  }
                }}
                className="px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer</span>
              </button>
            ) : <div />}

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
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-500 to-rose-600 hover:from-brand-600 hover:to-rose-700 text-white text-xs font-black shadow-md shadow-brand-500/25 active:scale-95 transition-all cursor-pointer"
              >
                Enregistrer les modifications
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

