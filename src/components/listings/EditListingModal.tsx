'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Building2,
  MapPin,
  Banknote,
  FileText,
  Camera,
  UploadCloud,
  CheckCircle2,
  Trash2,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  Zap,
  Sparkles,
  Clock,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { RentalListing, RentalPropertyType } from '@/lib/types';
import { COUNTRIES_CITIES } from '@/lib/data/mock-data';
import { formatFCFA, computeEntryCost } from '@/lib/money/format';
import { ModerationService } from '@/lib/services/moderation-service';
import { AuthService } from '@/lib/services/auth-service';
import { notifyUpdate, notifyAction } from '@/lib/notifications/action-notifier';
import { LeaseService } from '@/lib/services/lease-service';
import { resolveListingAuthorCompany } from '@/lib/services/listings-service';

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
  const [authorCompany, setAuthorCompany] = useState('');
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState<RentalPropertyType>('Appartement');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [charges, setCharges] = useState('');
  const [depositMonths, setDepositMonths] = useState(3);
  const [advanceMonths, setAdvanceMonths] = useState(0);
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

  // Contrôle IA Haute Vitesse (~2.3s)
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<'scanning' | 'approved' | 'rejected'>('scanning');

  useEffect(() => {
    if (listing) {
      setAuthorCompany(listing.authorCompany || resolveListingAuthorCompany(listing) || '');
      setTitle(listing.title || '');
      setPropertyType(listing.propertyType || 'Appartement');
      setMonthlyRent(listing.monthlyRent?.toString() || '');
      setCharges(listing.charges?.toString() || '0');
      setDepositMonths(listing.depositMonths !== undefined ? listing.depositMonths : 3);
      setAdvanceMonths(listing.advanceMonths !== undefined ? listing.advanceMonths : 0);
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

  const MAX_PHOTOS = 8;
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !listing) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remainingSlots = MAX_PHOTOS - images.length;
    if (remainingSlots <= 0) {
      alert('Vous avez déjà atteint la limite maximale de 8 photos.');
      return;
    }

    const filesToRead = Array.from(files).slice(0, remainingSlots);

    filesToRead.forEach((file) => {
      // Vérification immédiate du nom du fichier sélectionné
      if (ModerationService.isSuspiciousFileName(file.name)) {
        alert(`Le fichier « ${file.name} » a été rejeté : son nom évoque un contenu non autorisé.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setImages((prev) => {
            if (prev.length >= MAX_PHOTOS) return prev;
            return [...prev, uploadEvent.target!.result as string];
          });
        }
      };
      reader.readAsDataURL(file);
    });

    if (e.target) {
      e.target.value = '';
    }
  };

  const handleAddImage = () => {
    const cleanUrl = newImageUrl.trim();
    if (cleanUrl) {
      if (images.length >= MAX_PHOTOS) {
        alert('Limite maximale de 8 photos atteinte.');
        return;
      }
      if (ModerationService.isSuspiciousImageSource(cleanUrl)) {
        alert('Cette URL d\'image a été rejetée : descripteur ou contenu non conforme détecté.');
        return;
      }
      setImages((prev) => [...prev, cleanUrl].slice(0, MAX_PHOTOS));
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
    const proposedTitle = title.trim();

    // =========================================================================
    // DÉCLENCHEMENT DU SCAN DE SÉCURITÉ IA EN DIRECT (~2.3 SECONDES)
    // =========================================================================
    setIsVerifying(true);
    setVerificationStatus('scanning');
    setVerificationStep(1);
    setVerificationProgress(25);

    setTimeout(() => {
      if (finalImages.length < 2) {
        setVerificationStatus('rejected');
        setVerificationProgress(100);

        const violations = [
          {
            type: 'photos_insuffisantes' as const,
            severity: 'high' as const,
            message: `Minimum 2 photos ou vidéos requises (actuellement : ${finalImages.length}/2).`,
          },
        ];

        const currentUser = AuthService.getCurrentUser();
        ModerationService.recordSecurityAlert({
          listingId: listing.id,
          listingReference: listing.referenceCode || listing.id,
          listingTitle: proposedTitle,
          author: currentUser,
          country: listing.country,
          city: listing.city,
          violations,
        });

        LeaseService.addLandlordNotification({
          id: `notif-rej-${Date.now()}`,
          title: '⛔ Modification Rejetée par l\'IA',
          message: `Votre annonce « ${proposedTitle} » doit compter au moins 2 photos ou vidéos.`,
          type: 'listing_rejected',
          read: false,
          timestamp: 'À l\'instant',
        });

        notifyAction({
          title: 'Modification Refusée par l\'IA',
          message: `Minimum 2 photos ou vidéos requises sur toute la plateforme.`,
          type: 'delete',
          duration: 5000,
        });

        setTimeout(() => {
          setIsVerifying(false);
          setErrorMsg(`Minimum 2 photos ou vidéos requises (actuellement : ${finalImages.length}/2).`);
        }, 800);
        return;
      }

      setVerificationStep(2);
      setVerificationProgress(60);

      setTimeout(() => {
        setVerificationStep(3);
        setVerificationProgress(85);

        setTimeout(() => {
          setVerificationProgress(100);

          const moderation = ModerationService.validateListing({
            title: proposedTitle,
            propertyType,
            description: description.trim(),
            landmark: landmark.trim(),
            images: finalImages,
            city: listing.city,
            district: listing.district,
          });

          const currentUser = AuthService.getCurrentUser();

          if (!moderation.isValid) {
            setVerificationStatus('rejected');

            ModerationService.recordSecurityAlert({
              listingId: listing.id,
              listingReference: listing.referenceCode || listing.id,
              listingTitle: proposedTitle,
              author: currentUser,
              country: listing.country,
              city: listing.city,
              violations: moderation.violations,
            });

            LeaseService.addLandlordNotification({
              id: `notif-rej-${Date.now()}`,
              title: '⛔ Modification Rejetée par l\'IA',
              message: `Votre annonce « ${proposedTitle} » a été rejetée : ${moderation.violations.map((v) => v.message).join(' ')}`,
              type: 'listing_rejected',
              read: false,
              timestamp: 'À l\'instant',
            });

            notifyAction({
              title: 'Modification Refusée par l\'IA',
              message: `Des règles de sécurité ont été enfreintes. Veuillez corriger les points signalés.`,
              type: 'delete',
              duration: 5000,
            });

            setTimeout(() => {
              setIsVerifying(false);
              setErrorMsg(
                `Modification bloquée par l'IA : ${moderation.violations.map((v) => v.message).join(' | ')}`
              );
            }, 800);
          } else {
            setVerificationStatus('approved');
            setVerificationStep(4);

            onSave(listing.id, {
              title: proposedTitle,
              propertyType,
              authorCompany: authorCompany.trim() ? authorCompany.trim() : undefined,
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

            const currentUser = AuthService.getCurrentUser();
            if (currentUser && authorCompany.trim() && currentUser.companyName !== authorCompany.trim()) {
              AuthService.updateCurrentUser({ companyName: authorCompany.trim() });
            }

            LeaseService.addLandlordNotification({
              id: `notif-appr-${Date.now()}`,
              title: '✅ Modification Validée par l\'IA & En Ligne !',
              message: `Votre annonce « ${proposedTitle} » a été vérifiée en 2.3s par l'IA et mise à jour avec succès.`,
              type: 'listing_approved',
              read: false,
              listingId: listing.id,
              timestamp: 'À l\'instant',
            });

            notifyUpdate(
              `Votre annonce « ${proposedTitle} » a été vérifiée par l'IA et mise à jour avec succès !`,
              'Modifications Validées & En Ligne !'
            );

            setTimeout(() => {
              setIsVerifying(false);
              setVerificationStatus('scanning');
              onClose();
            }, 850);
          }
        }, 800);
      }, 750);
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col border border-slate-100">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 border border-brand-500/30 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight text-white flex items-center gap-2 flex-wrap">
                <span>Modifier votre publication</span>
                <span className="text-[10px] font-mono font-black px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Réf: {listing.referenceCode || listing.id}
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

          {/* Identité Entreprise / Agence sous « Publié par » */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/90 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-brand-600" />
                <span>Nom de l&apos;entreprise ou agence (Optionnel)</span>
              </label>
              <span className="text-[10px] text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full font-bold border border-brand-200">
                Prioritaire sous « Publié par »
              </span>
            </div>
            <input
              type="text"
              value={authorCompany}
              onChange={(e) => setAuthorCompany(e.target.value)}
              placeholder="Ex: Agence Immobilière Prestige, Alafia Immo SARL..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-white border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-[10px] text-slate-500 leading-snug">
              💡 <strong>Règle d&apos;affichage :</strong> Si renseigné, ce nom d&apos;entreprise apparaîtra sous <strong>« Publié par »</strong> sur toute la plateforme. Si laissé vide, votre nom civil (<strong>{listing.authorName || 'Nom civil'}</strong>) sera affiché par défaut.
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
                  <span className="text-[10px] text-slate-500 font-bold">
                    {advanceMonths === 0 ? '0 mois (Par défaut)' : `${advanceMonths} mois sélectionné${advanceMonths > 1 ? 's' : ''}`}
                  </span>
                </label>
                <select
                  value={advanceMonths}
                  onChange={(e) => setAdvanceMonths(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold"
                >
                  <option value={0}>0 mois — Aucune avance (Par défaut)</option>
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

          {/* 6. Photos (Max 8 au total) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-brand-600" />
                  <span>Photos du logement ({images.length} / {MAX_PHOTOS} max)</span>
                </label>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Ajoutez jusqu&apos;à 8 photos de qualité pour valoriser votre annonce (min. 2 requises).
                </span>
              </div>
              <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${
                images.length >= MAX_PHOTOS
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                {images.length >= MAX_PHOTOS ? '8 / 8 (Max atteint)' : `${images.length} / 8 photos`}
              </span>
            </div>

            {/* Grille des photos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {images.map((img, idx) => (
                <div key={idx} className="relative aspect-video rounded-2xl overflow-hidden group border-2 border-slate-200 bg-slate-900 shadow-sm">
                  <img src={img} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  <span className="absolute bottom-1.5 left-1.5 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-black/70 text-white backdrop-blur-sm">
                    #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-xl shadow-md transition-transform active:scale-90 cursor-pointer"
                    title="Supprimer cette photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* Slot d'ajout si moins de 8 photos */}
              {images.length < MAX_PHOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-video rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/50 hover:bg-brand-50 text-brand-700 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer group"
                >
                  <UploadCloud className="w-5 h-5 group-hover:scale-110 transition-transform text-brand-600" />
                  <span className="text-[11px] font-bold">+ Ajouter photo</span>
                  <span className="text-[9px] text-brand-500 font-medium">({MAX_PHOTOS - images.length} restante{MAX_PHOTOS - images.length > 1 ? 's' : ''})</span>
                </button>
              )}
            </div>

            {/* Input d'upload de fichiers caché */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Boutons d'ajout */}
            {images.length < MAX_PHOTOS ? (
              <div className="space-y-2 pt-1">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2.5 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                  >
                    <Camera className="w-4 h-4 text-brand-400" />
                    <span>Importer des photos depuis l&apos;appareil ({MAX_PHOTOS - images.length} slot{MAX_PHOTOS - images.length > 1 ? 's' : ''} libre{MAX_PHOTOS - images.length > 1 ? 's' : ''})</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    placeholder="Ou coller une URL d'image web (https://...)"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleAddImage}
                    disabled={!newImageUrl.trim()}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 disabled:opacity-50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Ajouter URL
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Limite de 8 photos atteinte :</strong> Vous avez atteint le nombre maximal de 8 photos pour cette annonce. Supprimez-en une si vous souhaitez la remplacer.
                </span>
              </div>
            )}
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

        {/* ================================================================= */}
        {/* ÉCRAN DE CONTRÔLE DE SÉCURITÉ IA EN DIRECT (~2.3 SECONDES)        */}
        {/* ================================================================= */}
        {isVerifying && (
          <div className="absolute inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-200">
            {/* Glowing AI Radar / Shield Icon */}
            <div className="relative mb-5">
              <div
                className={`w-20 h-20 rounded-3xl flex items-center justify-center shadow-2xl transition-all duration-500 ${
                  verificationStatus === 'approved'
                    ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/50 scale-110'
                    : verificationStatus === 'rejected'
                    ? 'bg-gradient-to-tr from-rose-600 to-red-600 shadow-rose-500/50'
                    : 'bg-gradient-to-tr from-brand-600 to-indigo-600 shadow-pink-glow animate-pulse'
                }`}
              >
                {verificationStatus === 'approved' ? (
                  <CheckCircle2 className="w-10 h-10 text-white animate-in zoom-in duration-300" />
                ) : verificationStatus === 'rejected' ? (
                  <ShieldAlert className="w-10 h-10 text-white animate-in zoom-in duration-300" />
                ) : (
                  <ShieldCheck className="w-10 h-10 text-white" />
                )}
              </div>
              {verificationStatus === 'scanning' && (
                <div className="absolute -inset-2 rounded-3xl border-2 border-brand-500/40 animate-ping pointer-events-none" />
              )}
            </div>

            <div className="text-center space-y-1.5 max-w-md">
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-1 border ${
                  verificationStatus === 'approved'
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : verificationStatus === 'rejected'
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                    : 'bg-brand-500/20 border-brand-500/40 text-brand-300'
                }`}
              >
                {verificationStatus === 'scanning' ? (
                  <>
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-brand-300" />
                    <span>IA Shield LOCAGESTION en action</span>
                  </>
                ) : verificationStatus === 'approved' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Modifications Validées</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Modifications Rejetées</span>
                  </>
                )}
              </div>

              <h3 className="text-xl font-black text-white">
                {verificationStatus === 'approved'
                  ? 'Modifications Validées & En Ligne !'
                  : verificationStatus === 'rejected'
                  ? 'Modification Bloquée par l\'IA'
                  : 'Vérification IA en cours...'}
              </h3>
              <p className="text-xs text-slate-300">
                {verificationStatus === 'approved'
                  ? 'Votre annonce mise à jour est conforme et immédiatement active.'
                  : verificationStatus === 'rejected'
                  ? 'Des infractions aux règles de sécurité ont été détectées.'
                  : 'Analyse automatique de conformité en quelques secondes avant mise à jour.'}
              </p>
            </div>

            {/* Étapes du scan en direct */}
            <div className="w-full max-w-md mt-6 space-y-2.5">
              {/* Étape 1 : Visuels */}
              <div
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-xs font-bold ${
                  verificationStep > 1
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : verificationStep === 1
                    ? 'bg-slate-900 border-brand-500/60 text-white'
                    : 'bg-slate-900/50 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {verificationStep > 1 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : verificationStep === 1 ? (
                    <Loader2 className="w-4 h-4 text-brand-400 animate-spin shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                  <span>Visuels certifiés (≥ 2 photos/vidéos)</span>
                </div>
                <span className="text-[10px] font-mono font-bold">
                  {verificationStep > 1 ? 'CONFORME' : verificationStep === 1 ? 'ANALYSE...' : 'EN ATTENTE'}
                </span>
              </div>

              {/* Étape 2 : Nudité & Propos sexuels */}
              <div
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-xs font-bold ${
                  verificationStep > 2
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : verificationStep === 2
                    ? 'bg-slate-900 border-brand-500/60 text-white'
                    : 'bg-slate-900/50 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {verificationStep > 2 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : verificationStep === 2 ? (
                    <Loader2 className="w-4 h-4 text-brand-400 animate-spin shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                  <span>Filtre anti-nudité & propos sexuels</span>
                </div>
                <span className="text-[10px] font-mono font-bold">
                  {verificationStep > 2 ? 'CONFORME' : verificationStep === 2 ? 'ANALYSE...' : 'EN ATTENTE'}
                </span>
              </div>

              {/* Étape 3 : Anti-extorsion & rançonnement */}
              <div
                className={`p-3 rounded-2xl border transition-all flex items-center justify-between text-xs font-bold ${
                  verificationStep > 3
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                    : verificationStep === 3
                    ? 'bg-slate-900 border-brand-500/60 text-white'
                    : 'bg-slate-900/50 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {verificationStep > 3 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : verificationStep === 3 ? (
                    <Loader2 className="w-4 h-4 text-brand-400 animate-spin shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                  <span>Audit anti-extorsion & rançonnement</span>
                </div>
                <span className="text-[10px] font-mono font-bold">
                  {verificationStep > 3 ? 'CONFORME' : verificationStep === 3 ? 'ANALYSE...' : 'EN ATTENTE'}
                </span>
              </div>
            </div>

            {/* Barre de progression & Chrono */}
            <div className="w-full max-w-md mt-6 space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-400">
                <span>Délai de vérification : ~2.3s</span>
                <span className="text-brand-400 font-mono">{verificationProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ease-out ${
                    verificationStatus === 'approved'
                      ? 'bg-emerald-500'
                      : verificationStatus === 'rejected'
                      ? 'bg-rose-500'
                      : 'bg-gradient-to-r from-brand-500 to-indigo-500'
                  }`}
                  style={{ width: `${verificationProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

