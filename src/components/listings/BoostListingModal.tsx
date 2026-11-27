'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  Sparkles,
  Check,
  ShieldCheck,
  Clock,
  ArrowRight,
  ExternalLink,
  Flame,
  Crown,
  Star,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  CreditCard,
  Building2,
  MapPin,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { RentalListing } from '@/lib/types';
import { BOOST_PACKS, BoostPack, ListingsService } from '@/lib/services/listings-service';
import { useSpace } from '@/lib/context/space-context';
import { formatFCFA } from '@/lib/money/format';
import { notifySave } from '@/lib/notifications/action-notifier';

interface BoostListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: RentalListing | null;
  onBoostActivated?: (updated: RentalListing) => void;
}

export function BoostListingModal({
  isOpen,
  onClose,
  listing,
  onBoostActivated,
}: BoostListingModalProps) {
  const { user } = useSpace();

  // Pack sélectionné par défaut : Pack 2 (Boost Flash 7j)
  const [selectedPackId, setSelectedPackId] = useState<'flash_weekend' | 'boost_7d' | 'boost_14d'>('boost_7d');
  const [payerName, setPayerName] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+229');
  const [payerEmail, setPayerEmail] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setPayerName(user.name || '');
      setPayerEmail(user.email || '');
      if (user.phone) {
        // Détecter indicatif
        const clean = user.phone.trim();
        if (clean.startsWith('+225')) {
          setCountryCode('+225');
          setPayerPhone(clean.replace('+225', '').trim());
        } else if (clean.startsWith('+221')) {
          setCountryCode('+221');
          setPayerPhone(clean.replace('+221', '').trim());
        } else if (clean.startsWith('+228')) {
          setCountryCode('+228');
          setPayerPhone(clean.replace('+228', '').trim());
        } else if (clean.startsWith('+229')) {
          setCountryCode('+229');
          setPayerPhone(clean.replace('+229', '').trim());
        } else {
          setPayerPhone(clean.replace(/^\+\d+\s*/, ''));
        }
      }
    }
    setIsSuccess(false);
    setErrorMessage(null);
    setIsLoading(false);
  }, [isOpen, user, listing]);

  if (!isOpen || !listing) return null;

  const selectedPack = BOOST_PACKS.find((p) => p.id === selectedPackId) || BOOST_PACKS[1];
  const isCurrentlyBoosted = ListingsService.isListingBoosted(listing);
  const daysRemaining = ListingsService.getBoostDaysRemaining(listing);

  // Redirection immédiate vers le guichet officiel FedaPay Live
  const handleProceedToPayment = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setLoadingText('Connexion au guichet sécurisé FedaPay Live (Wave, MoMo, Moov, OM, CB)...');

    try {
      const cleanPhone = (payerPhone || '').replace(/\D/g, '');
      const rawCountry = countryCode.includes('225')
        ? 'ci'
        : countryCode.includes('221')
        ? 'sn'
        : countryCode.includes('228')
        ? 'tg'
        : 'bj';

      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://locagestion.site';
      const callbackUrl = `${origin}/listings?fedapay_boost_check=${encodeURIComponent(listing.id)}&pack_id=${selectedPack.id}&expected_price=${selectedPack.price}`;

      // Sauvegarder l'intention de boost localement au cas où le retour perdrait les paramètres
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          `locagestion:pending_boost:${listing.id}`,
          JSON.stringify({
            listingId: listing.id,
            packId: selectedPack.id,
            days: selectedPack.days,
            price: selectedPack.price,
            timestamp: Date.now(),
          })
        );
      }

      const response = await fetch('/api/payments/fedapay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          amount: selectedPack.price,
          description: `Boost Annonce LOCAGESTION (Réf: ${listing.referenceCode || listing.id}) - ${selectedPack.name} (${selectedPack.days}j)`,
          callback_url: callbackUrl,
          customer: {
            firstname: payerName.split(' ')[0] || user?.name?.split(' ')[0] || 'Annonceur',
            lastname: payerName.split(' ').slice(1).join(' ') || user?.name?.split(' ').slice(1).join(' ') || 'LOCAGESTION',
            email: payerEmail || user?.email || 'contact@locagestion.site',
            phone: cleanPhone || '97000000',
            country: rawCountry,
          },
        }),
      });

      const data = await response.json();

      if (data.success && data.paymentUrl) {
        setLoadingText('Ouverture immédiate du guichet de paiement Mobile Money...');
        notifySave(
          `Redirection vers le paiement ${formatFCFA(selectedPack.price)} pour booster l’annonce « ${listing.title} »...`,
          'Ouverture FedaPay'
        );

        // OUVERTURE IMMÉDIATE SANS ATTENDRE
        if (typeof window !== 'undefined') {
          window.location.href = data.paymentUrl;
        }
      } else {
        setIsLoading(false);
        const err = data.error || 'Impossible d’initialiser le paiement en ligne. Veuillez réessayer.';
        setErrorMessage(err);
      }
    } catch (err: any) {
      console.error('Erreur redirection paiement boost:', err);
      setIsLoading(false);
      setErrorMessage(err.message || 'Erreur réseau lors de la connexion au guichet de paiement.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/80 overflow-hidden my-auto">
        
        {/* BANDEAU EN-TÊTE DÉCORATIF AVEC DÉGRADÉ OR / AMBRE */}
        <div className="relative bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 p-5 sm:p-6 text-white overflow-hidden">
          {/* Cercles de fond stylisés */}
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute left-1/3 -top-12 w-32 h-32 rounded-full bg-yellow-300/20 blur-lg pointer-events-none" />

          {/* Bouton Fermer */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-2xl bg-black/20 hover:bg-black/40 text-white/90 hover:text-white transition-all cursor-pointer backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative z-10 flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-md">
              <Zap className="w-6 h-6 text-yellow-100 fill-yellow-200 animate-pulse" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/30 backdrop-blur-md text-[10px] font-black uppercase tracking-wider text-yellow-200 border border-yellow-200/30">
                <Sparkles className="w-3 h-3 text-yellow-300" />
                <span>Mise en avant & Boost Prioritaire</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Booster votre annonce
              </h2>
              <p className="text-xs text-amber-100 font-medium">
                Multipliez par 3 vos contacts directs et trouvez un locataire solvable en quelques jours.
              </p>
            </div>
          </div>
        </div>

        {/* CORPS DU MODAL */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          
          {/* ÉCRAN DE SUCCÈS APRÈS ACTIVATION */}
          {isSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900">
                  Félicitations ! Annonce boostée avec succès 🎉
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Votre annonce est désormais mise en vedette avec le badge{' '}
                  <strong className="text-amber-700 font-black">{selectedPack.badge}</strong> et épinglée en tête des résultats de recherche.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-left max-w-md mx-auto space-y-1.5 text-xs text-amber-900">
                <div className="font-bold flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-600 fill-amber-500" />
                  <span>Détails de l'activation :</span>
                </div>
                <p>• Formule : <strong>{selectedPack.name} ({selectedPack.days} jours)</strong></p>
                <p>• Réf annonce : <span className="font-mono font-bold">{listing.referenceCode || listing.id}</span></p>
                <p>• Fin de mise en avant : <strong>{new Date(Date.now() + selectedPack.days * 24 * 3600 * 1000).toLocaleDateString('fr-FR')}</strong></p>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-3 px-8 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-lg transition-all cursor-pointer"
                >
                  Fermer & Voir mon annonce
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* VIGNETTE DU BIEN CONCERNÉ */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
                <img
                  src={listing.images[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=200&auto=format&fit=crop&q=80'}
                  alt={listing.title}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200"
                />
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-800">
                      {listing.referenceCode || listing.id}
                    </span>
                    <span className="text-[10px] text-slate-500 font-bold">
                      {listing.flag} {listing.city}
                    </span>
                    {isCurrentlyBoosted && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-600" />
                        <span>Déjà en vedette (reste {daysRemaining}j)</span>
                      </span>
                    )}
                  </div>
                  <h4 className="font-black text-xs text-slate-900 truncate">
                    {listing.title}
                  </h4>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span className="font-black text-brand-600">{formatFCFA(listing.monthlyRent)}/mois</span>
                    <span>•</span>
                    <span className="truncate">{listing.district}</span>
                  </div>
                </div>
              </div>

              {/* SÉLECTEUR DES 3 PACKS DE BOOST */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 uppercase tracking-wider block">
                    Choisissez votre pack de promotion :
                  </label>
                  <span className="text-[11px] text-slate-400">Paiement unique sans engagement</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {BOOST_PACKS.map((pack) => {
                    const isSelected = selectedPackId === pack.id;
                    const isPopular = pack.tag === 'Le plus populaire';

                    return (
                      <div
                        key={pack.id}
                        onClick={() => setSelectedPackId(pack.id)}
                        className={`relative rounded-2xl p-4 transition-all cursor-pointer border flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-50/50 border-amber-500 ring-2 ring-amber-400/40 shadow-md'
                            : 'bg-white border-slate-200/90 hover:border-amber-300 hover:bg-slate-50/50'
                        }`}
                      >
                        {/* Tag "Le plus populaire" */}
                        {isPopular && (
                          <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-xs uppercase tracking-wider whitespace-nowrap">
                            ⭐ Le plus populaire
                          </span>
                        )}

                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-black text-xs text-slate-900">{pack.name}</span>
                            <span
                              className={`w-4 h-4 rounded-full flex items-center justify-center border transition-all ${
                                isSelected
                                  ? 'bg-amber-500 border-amber-500 text-white'
                                  : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <Check className="w-2.5 h-2.5" />}
                            </span>
                          </div>

                          <div className="py-1">
                            <div className="text-xl font-black text-slate-900">
                              {formatFCFA(pack.price)}
                            </div>
                            <div className="text-[10px] font-bold text-amber-700 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Validité : {pack.days} jours</span>
                            </div>
                          </div>

                          <div className="pt-1 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
                            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/70 text-amber-800 font-bold text-[10px]">
                              {pack.badge}
                            </div>
                            <p className="text-[10px] text-slate-500 line-clamp-3 leading-snug">
                              {pack.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-amber-700">
                          <span>{isSelected ? 'Pack sélectionné' : 'Sélectionner'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* COORDONNÉES DU PAYEUR (POUR LE MOBILE MONEY) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-brand-500" />
                    <span>Numéro de débit Mobile Money (Wave, MTN, Moov, Orange)</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">Sécurisé FedaPay Live</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Indicatif</label>
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    >
                      <option value="+229">🇧🇯 Bénin (+229)</option>
                      <option value="+225">🇨🇮 Côte d'Ivoire (+225)</option>
                      <option value="+221">🇸🇳 Sénégal (+221)</option>
                      <option value="+228">🇹🇬 Togo (+228)</option>
                      <option value="+226">🇧🇫 Burkina (+226)</option>
                      <option value="+223">🇲🇱 Mali (+223)</option>
                      <option value="+237">🇨🇲 Cameroun (+237)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-bold text-slate-500 block mb-1">Numéro de téléphone</label>
                    <input
                      type="tel"
                      value={payerPhone}
                      onChange={(e) => setPayerPhone(e.target.value)}
                      placeholder="97 00 00 00"
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    />
                  </div>
                </div>

                {/* Moyens de paiement pris en charge */}
                <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500 flex-wrap gap-2">
                  <span>Moyens acceptés :</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 font-black">Wave</span>
                    <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 font-black">MTN MoMo</span>
                    <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-black">Moov Flooz</span>
                    <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-black">Orange Money</span>
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-black">Visa/Mastercard</span>
                  </div>
                </div>
              </div>

              {/* MESSAGE D'ERREUR ÉVENTUEL */}
              {errorMessage && (
                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* RESTE DU RÉCAPITULATIF & BOUTON D'ACTION */}
              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Montant total à régler :</span>
                  <span className="text-xl font-black text-slate-900">
                    {formatFCFA(selectedPack.price)}
                  </span>
                </div>

                {/* BOUTON OFFICIEL FEDAPAY : OUVERTURE IMMÉDIATE */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleProceedToPayment}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{loadingText || 'Connexion au guichet sécurisé...'}</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-yellow-200 text-yellow-200" />
                      <span>
                        Payer {formatFCFA(selectedPack.price)} par Mobile Money & Activer
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
