'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  Building,
  Globe,
  MapPin,
  Coins,
  ShieldCheck,
  CheckCircle2,
  Camera,
  UploadCloud,
  Trash2,
  Star,
  Link as LinkIcon,
  Image as ImageIcon,
  Banknote,
  Zap,
  AlertCircle,
  ShieldAlert,
  AlertTriangle,
  Sparkles,
  Clock,
  Loader2,
} from 'lucide-react';
import { COUNTRIES_CITIES } from '@/lib/data/mock-data';
import { RentalListing } from '@/lib/types';
import { formatFCFA, computeEntryCost } from '@/lib/money/format';
import { ModerationService, ModerationViolation } from '@/lib/services/moderation-service';
import { AuthService } from '@/lib/services/auth-service';
import { notifyPublish, notifyAction } from '@/lib/notifications/action-notifier';
import { LeaseService } from '@/lib/services/lease-service';
import {
  getUserResidenceCountry,
  getUserResidenceCity,
  resolveLocationCoordinates,
} from '@/lib/services/geo-service';

interface PublishListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (newListing: RentalListing) => void;
}

const PRESET_PHOTOS: { label: string; url: string }[] = [
  {
    label: 'Séjour Standing',
    url: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Chambre Climatisée',
    url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Cuisine Équipée',
    url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Immeuble Moderne',
    url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Villa avec Jardin',
    url: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&auto=format&fit=crop&q=80',
  },
  {
    label: 'Salon Meublé',
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
  },
];

export function PublishListingModal({
  isOpen,
  onClose,
  onPublish,
}: PublishListingModalProps) {
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState<RentalListing['propertyType']>('Chambre salon sanitaire');
  // Pays de résidence renseigné lors de l'inscription / géolocalisation par défaut
  const [country, setCountry] = useState(() => getUserResidenceCountry());
  const [city, setCity] = useState(() => getUserResidenceCity());
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState('');
  const [district, setDistrict] = useState('');
  const [landmark, setLandmark] = useState('');
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
  const [bedrooms, setBedrooms] = useState(1);
  const [bathrooms, setBathrooms] = useState(1);

  // Description détaillée concernant le bien (initialement vide, saisie manuelle libre)
  const [description, setDescription] = useState('');

  // Photos de l'annonce (initialement vide, import obligatoire ou facultatif par l'utilisateur)
  const [images, setImages] = useState<string[]>([]);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [securityViolation, setSecurityViolation] = useState<{
    title: string;
    message: string;
    violations: ModerationViolation[];
  } | null>(null);

  // État de Contrôle IA de Sécurité Haute Vitesse (~2.3 secondes)
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState(0);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<'scanning' | 'approved' | 'rejected'>('scanning');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const defaultCountry = getUserResidenceCountry();
      const defaultCity = getUserResidenceCity();
      setCountry(defaultCountry);
      setCity(defaultCity);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCountryChange = (c: string) => {
    setCountry(c);
    setIsCustomCity(false);
    setCustomCity('');
    const cities = COUNTRIES_CITIES[c]?.cities || [];
    if (cities.length > 0) {
      setCity(cities[0]);
    }
  };

  const handleCitySelect = (val: string) => {
    if (val === '__custom__') {
      setIsCustomCity(true);
    } else {
      setIsCustomCity(false);
      setCity(val);
    }
  };

  // Upload de fichiers photos locaux
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setImages((prev) => [...prev, uploadEvent.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input value to allow re-selecting the same file if needed
    e.target.value = '';
  };

  // Ajout par lien web
  const handleAddImageUrl = () => {
    if (!urlInput.trim()) return;
    setImages((prev) => [...prev, urlInput.trim()]);
    setUrlInput('');
    setShowUrlInput(false);
  };

  // Suppression d'une photo
  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Définir une photo comme couverture principale (la déplacer en première position)
  const handleSetAsCover = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const updated = [...prev];
      const [selected] = updated.splice(index, 1);
      return [selected, ...updated];
    });
  };

  const parsedRent = Math.max(0, parseInt(monthlyRent, 10) || 0);
  const parsedCharges = Math.max(0, parseInt(charges, 10) || 0);
  const parsedAgency = includeAgencyFees
    ? (agencyFeesAmount !== '' ? Math.max(0, parseInt(agencyFeesAmount, 10) || 0) : Math.round(parsedRent * 0.5))
    : 0;
  const parsedUtilities = hasUtilitiesDeposit
    ? Math.max(0, parseInt(utilitiesDepositAmount, 10) || 0)
    : 0;

  const entryCostPreview = computeEntryCost({
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

    const countryCodeMap: Record<string, RentalListing['countryCode']> = {
      // Zone UEMOA
      'Bénin': 'BJ',
      'Burkina Faso': 'BF',
      'Côte d’Ivoire': 'CI',
      'Guinée-Bissau': 'GW',
      'Mali': 'ML',
      'Niger': 'NE',
      'Sénégal': 'SN',
      'Togo': 'TG',
      // Zone CEMAC
      'Cameroun': 'CM',
      'Centrafrique': 'CF',
      'Congo': 'CG',
      'Gabon': 'GA',
      'Guinée Équatoriale': 'GQ',
      'Tchad': 'TD',
    };

    const finalImages = images;

    setSecurityViolation(null);

    const descriptionLines = description
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const finalCity = isCustomCity && customCity.trim() ? customCity.trim() : city;
    const coords = resolveLocationCoordinates(country, finalCity, district);
    const proposedTitle = title || `${propertyType} Moderne à ${district || finalCity}`;

    // =========================================================================
    // DÉCLENCHEMENT DU SCAN DE SÉCURITÉ IA EN DIRECT (Durée totale : ~2.3 secondes)
    // =========================================================================
    setIsVerifying(true);
    setVerificationStatus('scanning');
    setVerificationStep(1);
    setVerificationProgress(25);

    // Étape 1 : Analyse des visuels (≥ 2 photos/vidéos requises sur toute la plateforme)
    setTimeout(() => {
      if (finalImages.length < 2) {
        setVerificationStatus('rejected');
        setVerificationProgress(100);

        const violationData = {
          title: 'Photos ou Vidéos Insuffisantes (Règle Stricte)',
          message: `Chaque annonce doit impérativement comporter au moins deux (2) photos ou vidéos représentatives du logement pour pouvoir être publiée sur toute la plateforme (actuellement : ${finalImages.length}/2).`,
          violations: [
            {
              type: 'photos_insuffisantes' as const,
              severity: 'high' as const,
              message: `Minimum 2 photos ou vidéos requises. Vous n'avez importé que ${finalImages.length} fichier(s).`,
            },
          ],
        };

        const currentUser = AuthService.getCurrentUser();
        ModerationService.recordSecurityAlert({
          listingTitle: proposedTitle,
          author: currentUser,
          country,
          city: finalCity,
          violations: violationData.violations,
        });

        LeaseService.addLandlordNotification({
          id: `notif-rej-${Date.now()}`,
          title: '⛔ Annonce Non Éligible (Rejetée par l\'IA)',
          message: `Votre annonce « ${proposedTitle} » a été rejetée par l'IA : minimum 2 photos ou vidéos requises (${finalImages.length}/2).`,
          type: 'listing_rejected',
          read: false,
          timestamp: 'À l\'instant',
        });

        notifyAction({
          title: 'Publication Refusée par l\'IA',
          message: `L'annonce a été bloquée : minimum 2 photos ou vidéos requises.`,
          type: 'delete',
          duration: 5000,
        });

        setTimeout(() => {
          setIsVerifying(false);
          setSecurityViolation(violationData);
        }, 800);
        return;
      }

      setVerificationStep(2);
      setVerificationProgress(60);

      // Étape 2 : Analyse neuronale anti-nudité & propos sexuels
      setTimeout(() => {
        setVerificationStep(3);
        setVerificationProgress(85);

        // Étape 3 : Audit anti-extorsion & rançonnement financier
        setTimeout(() => {
          setVerificationProgress(100);

          // ÉVALUATION COMPLÈTE VIA LE MOTEUR DE MODÉRATION IA
          const moderation = ModerationService.validateListing({
            title: proposedTitle,
            propertyType,
            description,
            landmark,
            images: finalImages,
            city: finalCity,
            district,
          });

          const currentUser = AuthService.getCurrentUser();

          if (!moderation.isValid) {
            // REFUSÉ PAR L'IA
            setVerificationStatus('rejected');

            // Signalement automatique au compte Super-Admin
            ModerationService.recordSecurityAlert({
              listingTitle: proposedTitle,
              author: currentUser,
              country,
              city: finalCity,
              violations: moderation.violations,
            });

            // Notification persistante dans la cloche
            LeaseService.addLandlordNotification({
              id: `notif-rej-${Date.now()}`,
              title: '⛔ Annonce Rejetée par l\'IA de Sécurité',
              message: `Votre annonce « ${proposedTitle} » n'a pas été mise en ligne : ${moderation.violations.map((v) => v.message).join(' ')}`,
              type: 'listing_rejected',
              read: false,
              timestamp: 'À l\'instant',
            });

            // Notification Toast Rouge Centrale
            notifyAction({
              title: 'Publication Refusée par l\'IA',
              message: `L'annonce ne remplit pas les critères de sécurité. Corrigez les points signalés pour la republier.`,
              type: 'delete',
              duration: 5000,
            });

            setTimeout(() => {
              setIsVerifying(false);
              setSecurityViolation({
                title: 'Publication Refusée par l\'IA de Sécurité',
                message: moderation.summary,
                violations: moderation.violations,
              });
            }, 800);
          } else {
            // VALIDÉ PAR L'IA EN QUELQUES SECONDES -> MISE EN LIGNE IMMÉDIATE
            setVerificationStatus('approved');
            setVerificationStep(4);

            const newListing: RentalListing = {
              id: `list-${Date.now()}`,
              title: proposedTitle,
              propertyType,
              country,
              countryCode: countryCodeMap[country] || 'BJ',
              flag: COUNTRIES_CITIES[country]?.flag || '🌍',
              city: finalCity,
              district: district || 'Centre-ville',
              landmark: landmark || 'Accès bitumé et sécurisé',
              latitude: coords.lat,
              longitude: coords.lng,
              monthlyRent: parsedRent,
              charges: parsedCharges,
              depositMonths,
              advanceMonths,
              includeFirstRent,
              includeAgencyFees,
              agencyFees: parsedAgency,
              hasUtilitiesDeposit,
              utilitiesDeposit: parsedUtilities,
              surface: parseInt(surface, 10) || 0,
              bedrooms,
              bathrooms,
              images: finalImages,
              description: description.trim(),
              descriptionLines: descriptionLines,
              amenities: descriptionLines,
              isVerified: true,
              status: 'disponible',
              moderationStatus: 'valide',
              moderatedAt: new Date().toISOString(),
              authorId: currentUser?.id,
              authorName: currentUser?.name,
              authorCompany: currentUser?.companyName || undefined,
              authorEmail: currentUser?.email,
              authorPhone: currentUser?.phone,
              authorRole: currentUser?.role,
              authorAvatar: currentUser?.avatarUrl,
            };

            // Notification persistante dans la cloche
            LeaseService.addLandlordNotification({
              id: `notif-appr-${Date.now()}`,
              title: '✅ Annonce Validée par l\'IA & En Ligne !',
              message: `Votre annonce « ${proposedTitle} » a été vérifiée en 2.3s par l'IA et mise en ligne avec succès sur toute la plateforme.`,
              type: 'listing_approved',
              read: false,
              listingId: newListing.id,
              timestamp: 'À l\'instant',
            });

            // Notification Toast Vert Centrale
            notifyPublish(
              `Votre annonce « ${proposedTitle} » a été vérifiée par l'IA et est désormais en ligne sur toute la plateforme !`,
              'Annonce Validée & En Ligne !'
            );

            // Mise en ligne officielle et fermeture de la modale après 800ms
            setTimeout(() => {
              setIsVerifying(false);
              setVerificationStatus('scanning');
              onPublish(newListing);
              onClose();
            }, 850);
          }
        }, 800);
      }, 750);
    }, 700);
  };

  const cities = COUNTRIES_CITIES[country]?.cities || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
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
                Diffusion certifiée sur les 14 pays des zones UEMOA & CEMAC (FCFA)
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
          {/* Badge Pays de Résidence & Géolocalisation */}
          <div className="flex items-center gap-2.5 p-3 bg-brand-50/90 rounded-2xl border border-brand-200/90 text-xs text-brand-950">
            <MapPin className="w-4 h-4 text-brand-600 shrink-0" />
            <div className="leading-snug">
              <span>
                Pays de résidence par défaut appliqué : <strong>{country}</strong> ({city}).
              </span>
              <span className="text-[10px] text-brand-700 block mt-0.5">
                Votre annonce ciblera en exclusivité et priorité les locataires résidant dans cette zone.
              </span>
            </div>
          </div>
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
              placeholder="Ex: Chambre Salon Sanitaire Rénovée avec Balcon Personnel"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Type de bien */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Type de bien *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['Chambre salon sanitaire', 'Appartement', 'Meublé', 'Studio', 'Villa', 'Bureau', 'Boutique', 'Autres'] as const).map((t) => (
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

          {/* Description détaillée concernant le bien (Cochée ligne par ligne) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700 block">
                Description & Caractéristiques du bien *
              </label>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                1 ligne = 1 puce cochée (✓)
              </span>
            </div>
            <textarea
              rows={5}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={`Ex:\nChambre spacieuse et lumineuse avec placard\nSalle d’eau privative moderne avec douche et WC\nCompteur Cash Power SBEE individuel\nApprovisionnement régulier en eau avec réserve et suppresseur\nRésidence calme et sécurisée avec gardien 24/7`}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 leading-relaxed"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Chaque ligne saisie dans ce champ sera automatiquement affichée comme un point fort coché avec une coche verte (✓) sur la carte de l'annonce.
            </p>
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
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  Ville *
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {cities.length} villes
                </span>
              </div>
              <select
                value={isCustomCity ? '__custom__' : city}
                onChange={(e) => handleCitySelect(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900"
              >
                {cities.map((ci) => (
                  <option key={ci} value={ci}>
                    {ci}
                  </option>
                ))}
                <option value="__custom__">✨ Autre ville (saisir manuellement)...</option>
              </select>

              {isCustomCity && (
                <div className="mt-2 animate-in fade-in duration-150">
                  <input
                    type="text"
                    required
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="Préciser le nom de la ville ou commune..."
                    className="w-full px-3 py-2 rounded-xl bg-white border border-brand-400 text-xs font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              )}
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
                placeholder="Ex: 150000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-black text-brand-600 placeholder-slate-400"
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
                placeholder="Ex: 15000 (optionnel)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 placeholder-slate-400"
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
                placeholder="Ex: 45"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900 placeholder-slate-400"
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

          {/* ================================================================= */}
          {/* CONDITIONS FINANCIÈRES & COÛT TOTAL À L’ENTRÉE (Cases à cocher sur-mesure) */}
          {/* ================================================================= */}
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
                {formatFCFA(entryCostPreview.total)}
              </div>
              <span className="text-xs text-emerald-100 block mt-1 font-medium">
                {entryCostPreview.formulaLabel}
              </span>
            </div>
          </div>

          {/* ================================================================= */}
          {/* SECTION AJOUT DE PHOTOS DU LOGEMENT (MINIMUM 2 OBLIGATOIRE)        */}
          {/* ================================================================= */}
          <div className="space-y-3 pt-3 border-t border-slate-200/80">
            <div className="flex items-center justify-between">
              <div>
                <label className="font-black text-slate-900 block text-xs flex items-center gap-1.5 flex-wrap">
                  <Camera className="w-4 h-4 text-brand-500" />
                  <span>Photos du logement ({images.length}) *</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      images.length >= 2
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200 animate-pulse'
                    }`}
                  >
                    {images.length >= 2 ? '✓ Minimum 2 photos atteint' : `Obligatoire : au moins 2 photos (${images.length}/2)`}
                  </span>
                </label>
                <span className="text-[11px] text-slate-500">
                  Règle de sécurité stricte : Chaque annonce doit compter au moins 2 photos ou vidéos représentatives.
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer active:scale-95"
                >
                  <UploadCloud className="w-3.5 h-3.5 text-brand-400" />
                  <span>Importer</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Lien URL</span>
                </button>
              </div>
            </div>

            {/* Input file caché */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Champ ajout par URL */}
            {showUrlInput && (
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 animate-in fade-in duration-150">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="Coller l'URL directe d'une image (https://...)"
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-1.5 rounded-lg bg-brand-500 text-white font-bold text-xs hover:bg-brand-600 transition-colors cursor-pointer"
                >
                  Ajouter
                </button>
              </div>
            )}

            {/* Dropzone d'importation tactile & clic */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-brand-500 bg-slate-50/70 hover:bg-brand-50/15 rounded-2xl p-4 text-center cursor-pointer transition-all group"
            >
              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-500 group-hover:text-brand-500 group-hover:scale-105 transition-all">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-extrabold text-xs text-slate-800 group-hover:text-brand-600">
                    Cliquez pour choisir des photos depuis votre appareil
                  </p>
                  <p className="text-[10px] text-slate-400">
                    JPG, PNG ou WEBP • Sélection multiple autorisée
                  </p>
                </div>
              </div>
            </div>

            {/* Grille des photos importées avec gestion (Couverture / Suppression) */}
            {images.length > 0 && (
              <div className="space-y-1.5">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-xs"
                    >
                      <img
                        src={img}
                        alt={`Photo ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />

                      {/* Badge Photo de Couverture */}
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-brand-500 text-white text-[9px] font-black shadow-sm flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-white" />
                          Couverture
                        </span>
                      )}

                      {/* Overlay au survol */}
                      <div className="absolute inset-0 bg-black/65 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetAsCover(idx);
                            }}
                            title="Définir comme photo de couverture"
                            className="p-1.5 rounded-lg bg-white text-slate-900 hover:bg-brand-500 hover:text-white transition-colors cursor-pointer"
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveImage(idx);
                          }}
                          title="Supprimer cette photo"
                          className="p-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                  <span>Survolez une photo pour la supprimer ou la définir en couverture (★)</span>
                  {images.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setImages([])}
                      className="text-rose-600 hover:underline font-bold"
                    >
                      Tout vider
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Suggestions / Bibliothèque de photos types */}
            <div className="pt-1.5">
              <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                Ou ajouter des photos de notre catalogue :
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_PHOTOS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (!images.includes(preset.url)) {
                        setImages((prev) => [...prev, preset.url]);
                      }
                    }}
                    className="px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-brand-500" />
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
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
              disabled={images.length < 2}
              className={`py-2.5 px-5 rounded-xl font-extrabold shadow-pink-glow active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 ${
                images.length < 2
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  : 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {images.length < 2
                  ? `Ajoutez au moins 2 photos (${images.length}/2)`
                  : `Publier l’annonce (${images.length} photos)`}
              </span>
            </button>
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
                    <span>Conformité Totale Validée</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Annonce Non Conforme</span>
                  </>
                )}
              </div>

              <h3 className="text-xl font-black text-white">
                {verificationStatus === 'approved'
                  ? 'Annonce Validée & En Ligne !'
                  : verificationStatus === 'rejected'
                  ? 'Publication Bloquée par l\'IA'
                  : 'Vérification IA en cours...'}
              </h3>
              <p className="text-xs text-slate-300">
                {verificationStatus === 'approved'
                  ? 'Votre bien est certifié et immédiatement visible par tous les locataires.'
                  : verificationStatus === 'rejected'
                  ? 'Des infractions aux règles de sécurité ont été détectées.'
                  : 'Analyse automatique de conformité en quelques secondes avant diffusion.'}
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

        {/* ================================================================= */}
        {/* MODAL ALERTE SÉCURITÉ DE REJET AUTOMATIQUE PAR L'IA               */}
        {/* ================================================================= */}
        {securityViolation && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md p-6 flex items-center justify-center animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-rose-600 rounded-3xl p-6 max-w-md w-full shadow-2xl text-white space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 border border-rose-500/30 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-6 h-6 text-rose-500" />
                </div>
                <div>
                  <h4 className="text-base font-black text-white">{securityViolation.title}</h4>
                  <span className="text-[10px] font-bold uppercase text-rose-400 bg-rose-950 px-2 py-0.5 rounded-full border border-rose-800">
                    Signalement transmis à l'Administration
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-900/50 space-y-2 text-xs">
                {securityViolation.violations.map((v, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="font-bold text-rose-200 flex items-start gap-1.5">
                      <span className="text-rose-400">⛔</span>
                      <span>{v.message}</span>
                    </div>
                    {v.triggerSnippet && (
                      <div className="text-[11px] text-rose-300/80 font-mono pl-4 italic">
                        {v.triggerSnippet}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="text-[11px] text-slate-400 space-y-1">
                <p>
                  <strong>Politique de Sécurité LOCAGESTION :</strong> Les propos à caractère sexuel,
                  la nudité, les tentatives d'extorsion, le rançonnement ou les annonces avec moins de 2 photos
                  sont strictement prohibés.
                </p>
                <p className="text-slate-500 italic">
                  Un rapport de sécurité a été automatiquement enregistré dans la console d'administration.
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSecurityViolation(null)}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                >
                  Corriger mon annonce
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
