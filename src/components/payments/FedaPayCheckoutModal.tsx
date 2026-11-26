'use client';

import React, { useState } from 'react';
import {
  X,
  Smartphone,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  QrCode,
  Download,
  AlertCircle,
  FileCheck,
  Receipt,
  Sparkles,
  PhoneCall,
  ChevronRight,
  Store,
  Layers,
} from 'lucide-react';
import { Lease } from '@/lib/services/lease-service';
import { FedaPayService, RentSplitCalculation } from '@/lib/services/fedapay-service';
import { formatFCFA } from '@/lib/money/format';
import { PaymentMethod } from '@/lib/types';
import { generateReceiptPDF } from '@/lib/export/pdf-download';
import { notifySave } from '@/lib/notifications/action-notifier';

interface FedaPayCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  lease?: Lease | null;
  tenantUser?: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    matricule?: string;
  };
  initialPeriod?: string;
  onPaymentSuccess?: (paymentId: string) => void;
}

export function FedaPayCheckoutModal({
  isOpen,
  onClose,
  lease,
  tenantUser,
  initialPeriod = 'Novembre 2026',
  onPaymentSuccess,
}: FedaPayCheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mtn');
  const [countryCode, setCountryCode] = useState('+229');
  const [payerPhone, setPayerPhone] = useState(() => tenantUser?.phone?.replace(/^\+\d+\s*/, '') || '97001234');
  const [step, setStep] = useState<'checkout' | 'processing' | 'success'>('checkout');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [period, setPeriod] = useState(initialPeriod);

  if (!isOpen) return null;

  const rentAmount = lease?.rent || 50000;
  const landlordPlan = 'serenite'; // Par défaut Sérénité 2%
  const split: RentSplitCalculation = FedaPayService.calculateRentSplit(rentAmount, landlordPlan);

  const paymentMethods: {
    id: PaymentMethod;
    name: string;
    operator: string;
    badge: string;
    logoBg: string;
    accent: string;
  }[] = [
    {
      id: 'mtn',
      name: 'MTN Mobile Money',
      operator: 'MoMo Bénin / CI / Cameroun',
      badge: 'Le plus utilisé',
      logoBg: 'bg-[#ffcc00] text-black font-black',
      accent: 'border-yellow-400',
    },
    {
      id: 'moov',
      name: 'Moov Money',
      operator: 'Flooz Bénin / Togo / CI',
      badge: 'Instantané',
      logoBg: 'bg-[#005ba6] text-white font-bold',
      accent: 'border-blue-500',
    },
    {
      id: 'wave',
      name: 'Wave Money',
      operator: 'Wave CI / SN / BJ',
      badge: 'Zéro stress',
      logoBg: 'bg-[#1dc4f9] text-white font-black',
      accent: 'border-cyan-400',
    },
    {
      id: 'orange_money',
      name: 'Orange Money',
      operator: 'Orange CI / SN / ML',
      badge: 'Régional',
      logoBg: 'bg-[#ff7900] text-white font-bold',
      accent: 'border-orange-500',
    },
    {
      id: 'carte_bancaire',
      name: 'Carte Bancaire',
      operator: 'Visa & Mastercard',
      badge: 'International',
      logoBg: 'bg-slate-900 text-white font-bold',
      accent: 'border-slate-800',
    },
  ];

  const handlePay = async () => {
    setIsSubmitting(true);
    setStep('processing');

    setTimeout(async () => {
      try {
        const fullPhone = `${countryCode} ${payerPhone.trim()}`;
        const res = await FedaPayService.processDirectPayment({
          leaseId: lease?.id || 'BAIL-2026-421',
          lease,
          tenantId: tenantUser?.id || 'usr-tenant-jojovog',
          tenantName: tenantUser?.name || 'Locataire',
          tenantPhone: fullPhone,
          tenantEmail: tenantUser?.email,
          tenantMatricule: tenantUser?.matricule,
          landlordId: lease?.landlordId || 'usr-bailleur-voglossou',
          landlordName: lease?.landlordName || lease?.landlordSignature?.signedBy || 'Bailleur',
          landlordPhone: lease?.landlordPhone || lease?.landlordWhatsapp || '+229 97 00 00 01',
          propertyName: lease?.property || 'Résidence Principale',
          unitNumber: lease?.unit || 'Lot 1',
          rentAmount,
          period,
          paymentMethod: selectedMethod,
          payerPhone,
          payerCountryCode: countryCode,
        });

        setTransactionRef(res.reference);
        setReceiptNumber(res.receiptNumber);
        setStep('success');
        setIsSubmitting(false);

        notifySave(
          `Paiement de ${formatFCFA(rentAmount)} validé via FedaPay. La quittance officielle a été émise.`,
          'Paiement validé ✓'
        );

        if (onPaymentSuccess) {
          onPaymentSuccess(res.payment.id);
        }
      } catch (err) {
        console.error('Erreur lors du paiement FedaPay:', err);
        setIsSubmitting(false);
        setStep('checkout');
      }
    }, 1800);
  };

  const handleDownloadPDF = () => {
    generateReceiptPDF({
      receiptNumber: receiptNumber || 'QUITTANCE-FEDA-2026',
      landlordName: lease?.landlordSignature?.signedBy || lease?.landlordName || 'VOGLOSSOU JOHANE',
      tenantName: tenantUser?.name || 'Jojo VOG',
      tenantPhone: tenantUser?.phone || '+229 97 00 00 02',
      propertyName: lease?.property || 'CHAMBRE SALON SANITAIRE',
      unitNumber: lease?.unit || 'Lot 1',
      period,
      amount: rentAmount,
      expectedAmount: rentAmount,
      paymentDate: new Date().toLocaleDateString('fr-FR'),
      method: selectedMethod,
      isVerified: true,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Header Sécurisé FedaPay */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-black shadow-inner">
              <CreditCard className="w-5 h-5 text-brand-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Paiement Mobile Money Sécurisé
                </span>
                <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                  • Passerelle FedaPay
                </span>
              </div>
              <h3 className="font-extrabold text-sm sm:text-base text-white mt-0.5">
                Réglement de Loyer en Direct
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs">
          {step === 'checkout' && (
            <>
              {/* Informations du bien et mois de loyer */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Bail &amp; Lot
                  </span>
                  <div className="font-extrabold text-slate-900 truncate max-w-[240px]">
                    {lease ? `${lease.unit} (${lease.property})` : 'Mon Logement'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Bailleur : <strong>{lease?.landlordSignature?.signedBy || lease?.landlordName || 'VOGLOSSOU JOHANE'}</strong>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400">
                    Période
                  </span>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="block text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-2 py-1 mt-0.5 cursor-pointer focus:ring-1 focus:ring-brand-500"
                  >
                    <option value="Novembre 2026">Novembre 2026</option>
                    <option value="Décembre 2026">Décembre 2026</option>
                    <option value="Janvier 2027">Janvier 2027</option>
                    <option value="Octobre 2026">Octobre 2026</option>
                  </select>
                </div>
              </div>

              {/* Panier & Ventilation Mathématique Transparente (Option 1) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-50/60 to-slate-50 border border-brand-200/80 space-y-2.5">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-medium">Loyer contractuel :</span>
                  <span className="font-mono font-bold text-slate-900">{formatFCFA(split.rentAmount)}</span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    <span>Frais opérateur Mobile Money (~2%) :</span>
                    <span className="text-[10px] text-slate-400 bg-white px-1.5 py-0.2 rounded border border-slate-200">
                      Prise en charge locataire
                    </span>
                  </span>
                  <span className="font-mono font-bold text-brand-600">+{formatFCFA(split.fedapayFee)}</span>
                </div>

                <div className="pt-2 border-t border-brand-200/60 flex items-baseline justify-between">
                  <div>
                    <span className="text-xs font-black uppercase text-slate-900 block">
                      Total Débité de votre compte :
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Quittance scellée instantanée avec QR Code
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg sm:text-xl font-extrabold text-brand-600 font-mono">
                      {formatFCFA(split.totalTenantCharged)}
                    </span>
                  </div>
                </div>

                {/* Note de Transparence Split Payment */}
                <div className="p-2.5 rounded-xl bg-white/80 border border-brand-200/50 text-[10px] text-slate-500 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>• Reversement net garanti au bailleur (98%) :</span>
                    <strong className="text-emerald-700 font-mono">{formatFCFA(split.landlordPayout)}</strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>• Commission de service LOCAGESTION (2%) :</span>
                    <strong className="text-slate-700 font-mono">{formatFCFA(split.platformCommission)}</strong>
                  </div>
                </div>
              </div>

              {/* Sélection du Moyen de Paiement */}
              <div>
                <label className="font-bold text-slate-800 block mb-1.5">
                  Choisissez votre opérateur de paiement *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {paymentMethods.map((m) => {
                    const isSelected = selectedMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMethod(m.id)}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? `bg-brand-50/70 ${m.accent} ring-2 ring-brand-500/20 shadow-xs font-bold`
                            : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-[11px] shrink-0 shadow-xs ${m.logoBg}`}
                          >
                            {m.id === 'mtn' ? 'MoMo' : m.id === 'moov' ? 'Flooz' : m.id === 'wave' ? 'Wave' : m.id === 'orange_money' ? 'OM' : 'CB'}
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 block leading-tight">
                              {m.name}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {m.operator}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Saisie du Numéro de téléphone payeur */}
              <div>
                <label className="font-bold text-slate-800 block mb-1">
                  Numéro de compte Mobile Money débité *
                </label>
                <div className="flex items-center gap-2">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 cursor-pointer focus:ring-2 focus:ring-brand-500 shrink-0"
                  >
                    <option value="+229">🇧🇯 +229 (Bénin)</option>
                    <option value="+225">🇨🇮 +225 (Côte d'Ivoire)</option>
                    <option value="+221">🇸🇳 +221 (Sénégal)</option>
                    <option value="+228">🇹🇬 +228 (Togo)</option>
                    <option value="+237">🇨🇲 +237 (Cameroun)</option>
                    <option value="+226">🇧🇫 +226 (Burkina Faso)</option>
                  </select>

                  <input
                    type="tel"
                    value={payerPhone}
                    onChange={(e) => setPayerPhone(e.target.value)}
                    placeholder="97 00 12 34"
                    className="flex-1 p-2.5 rounded-xl border border-slate-200 font-mono font-bold text-xs text-slate-900 focus:ring-2 focus:ring-brand-500 outline-none"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Une notification USSD push ou un code de confirmation sera envoyé sur ce numéro.
                </span>
              </div>

              {/* Reassurance Footer */}
              <div className="pt-2 flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100">
                <span className="flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" /> Cryptage SSL 256-bit
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> Agrément FedaPay &amp; BCEAO
                </span>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shadow-inner relative">
                <PhoneCall className="w-8 h-8 animate-bounce text-brand-600" />
                <div className="absolute inset-0 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-600 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                  Validation Mobile Money en cours
                </span>
                <h4 className="text-base font-black text-slate-900 mt-2">
                  Consultez votre téléphone ({countryCode} {payerPhone})
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mt-1">
                  Veuillez approuver le prélèvement de <strong>{formatFCFA(split.totalTenantCharged)}</strong> sur votre application ou invite USSD {selectedMethod.toUpperCase()}.
                </p>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-300">
                  Paiement Confirmé &amp; Quittance Scellée
                </span>
                <h4 className="text-lg font-black text-slate-900 mt-2">
                  Loyer de {period} réglé avec succès !
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Votre quittance numérique officielle avec QR Code de certification bancaire est prête. Votre score de solvabilité est à jour (100/100).
                </p>
              </div>

              {/* Récépissé FedaPay */}
              <div className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Réf. Transaction FedaPay :</span>
                  <span className="font-mono font-bold text-slate-800">{transactionRef}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">N° Quittance Officielle :</span>
                  <span className="font-mono font-bold text-emerald-700">{receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Montant Loyer :</span>
                  <span className="font-mono font-bold text-slate-900">{formatFCFA(rentAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reversement Bailleur (98%) :</span>
                  <span className="font-mono font-bold text-slate-700">{formatFCFA(split.landlordPayout)}</span>
                </div>
              </div>

              <div className="w-full pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Télécharger la Quittance PDF</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        {step === 'checkout' && (
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handlePay}
              disabled={isSubmitting || !payerPhone.trim()}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-extrabold text-xs shadow-pink-glow active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <span>Valider &amp; Payer {formatFCFA(split.totalTenantCharged)}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 'success' && (
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs cursor-pointer transition-colors"
            >
              Terminer &amp; Fermer
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
