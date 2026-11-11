'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCheck,
  Building,
  Mail,
  Smartphone,
  ArrowRight,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Lease, LeaseService } from '@/lib/services/lease-service';
import { formatFCFA } from '@/lib/money/format';
import { notifySave } from '@/lib/notifications/action-notifier';

interface TransmitLeaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  lease?: Lease;
  leaseData?: {
    id: string;
    tenantId?: string;
    tenantName?: string;
    tenantEmail?: string;
    tenantPhone?: string;
    propertyName?: string;
    unitNumber?: string;
    rent: number;
    charges?: number;
    deposit?: number;
    startDate?: string;
    endDate?: string;
    hashSha256?: string;
  };
  onTransmitted?: (transmittedLease: Lease) => void;
  onTransmittedSuccess?: (transmittedLease: Lease) => void;
}

export function TransmitLeaseModal({
  isOpen,
  onClose,
  lease,
  leaseData,
  onTransmitted,
  onTransmittedSuccess,
}: TransmitLeaseModalProps) {
  const router = useRouter();
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  // Normalisation des données du bail
  const activeLease: Lease = lease || {
    id: leaseData?.id || `BAIL-2026-${Math.floor(100 + Math.random() * 900)}`,
    tenant: leaseData?.tenantName || 'Koffi Mensah',
    tenantId: leaseData?.tenantId || 'ten-01',
    tenantEmail: leaseData?.tenantEmail || 'koffi.mensah@fintech-africa.com',
    tenantPhone: leaseData?.tenantPhone || '+229 97 00 11 22',
    property: leaseData?.propertyName || 'Résidence Les Cocotiers',
    unit: leaseData?.unitNumber || 'Appt A3',
    rent: leaseData?.rent || 220000,
    charges: leaseData?.charges || 30000,
    deposit: leaseData?.deposit || 440000,
    startDate: leaseData?.startDate || '2026-11-01',
    endDate: leaseData?.endDate || '2029-10-31',
    status: 'en_attente_signature',
    landlordSignature: {
      signedBy: 'Mamadou Diallo',
      date: new Date().toLocaleDateString('fr-FR'),
      signatureDataUrl: '',
    },
    transmittedAt: new Date().toLocaleDateString('fr-FR'),
  };

  const handleCopyInviteMessage = () => {
    const portalUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/portal?tab=bail`
        : 'http://localhost:3001/portal?tab=bail';
    const downloadUrl = 'https://locagestion.app/download';
    const code = activeLease.invitationCode || 'LOCA-INV-7842';

    const text = `Bonjour ${activeLease.tenant},\nVotre contrat de bail pour le logement ${activeLease.unit} (${activeLease.property}) a été établi par votre bailleur Mamadou Diallo.\n\n👉 Accédez directement à votre espace sécurisé pour le contresigner :\n${portalUrl}\n\n📲 Téléchargez l'application mobile LOCAGESTION (Android & iOS) :\n${downloadUrl}\n\nVotre code d'activation : ${code}`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  const handleTransmit = () => {
    setIsTransmitting(true);
    setTimeout(() => {
      const transmitted = LeaseService.transmitLeaseToTenant(activeLease);
      setIsTransmitting(false);
      setIsSuccess(true);
      notifySave(
        `Le contrat ${activeLease.id} a été déposé avec succès sur le portail résidentiel de ${activeLease.tenant} pour contresignature.`,
        'Bail transmis au locataire !'
      );
      if (onTransmitted) onTransmitted(transmitted);
      if (onTransmittedSuccess) onTransmittedSuccess(transmitted);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white">
                Transmission du Bail au Locataire
              </h3>
              <p className="text-[11px] text-slate-400">
                Portail Sécurisé LOCAGESTION • Contresignature Électronique
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!isSuccess ? (
          <div className="p-6 space-y-4">
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <span className="font-black block">
                  Le bail sera placé en statut « En attente de signature »
                </span>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Votre signature en tant que bailleur (Mamadou Diallo) a été apposée. Le contrat sera
                  déposé instantanément sur le compte locataire certifié pour qu'il puisse contresigner.
                </p>
              </div>
            </div>

            {/* Tenant Selected Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {activeLease.isNewTenant
                    ? 'Nouveau Locataire (Création de compte & Invitation)'
                    : 'Locataire Destinataire (Compte plateforme créé en amont)'}
                </span>
                {activeLease.isNewTenant ? (
                  <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-brand-600" />
                    <span>Accès automatique</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>Compte Actif</span>
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-black text-xs">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{activeLease.tenant}</h4>
                    <span className="text-[11px] text-slate-500 block">{activeLease.tenantEmail}</span>
                  </div>
                </div>
              </div>

              {activeLease.isNewTenant && (
                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-900 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-950">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Envois automatiques programmés :</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <Smartphone className="w-3 h-3 text-emerald-600" />
                    <span>SMS au <strong>{activeLease.tenantPhone}</strong> avec lien de contresignature et de téléchargement</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px]">
                    <Mail className="w-3 h-3 text-emerald-600" />
                    <span>Email au <strong>{activeLease.tenantEmail}</strong> avec copie PDF scellée et accès portail</span>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200/70 flex items-center gap-3 text-[11px] text-slate-600">
                <div className="flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{activeLease.tenantPhone}</span>
                </div>
              </div>
            </div>

            {/* Summary Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block">Logement Loué</span>
                <span className="font-extrabold text-slate-900 block truncate">
                  {activeLease.property}
                </span>
                <span className="text-[11px] text-slate-500">{activeLease.unit}</span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block">Conditions Financières</span>
                <span className="font-black text-brand-600 block">{formatFCFA(activeLease.rent)}/mois</span>
                <span className="text-[11px] text-slate-500 block">
                  Caution : {formatFCFA(activeLease.deposit || activeLease.rent * 2)}
                </span>
                {activeLease.utilitiesDeposit && activeLease.utilitiesDeposit > 0 ? (
                  <span className="text-[11px] text-amber-700 block font-bold">
                    Caution Eau/Élec : {formatFCFA(activeLease.utilitiesDeposit)}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Electronic Proof */}
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-2 text-[11px] text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {activeLease.governingLaw
                  ? `Bail scellé conforme à : ${activeLease.governingLaw} • Piste d'audit SHA-256 certifiée.`
                  : `Signature du bailleur vérifiée • Piste d'audit SHA-256 scellée conforme OHADA.`}
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleTransmit}
                disabled={isTransmitting}
                className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-extrabold shadow-pink-glow active:scale-95 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isTransmitting ? 'Transmission en cours...' : 'Transmettre au Locataire'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          /* Success Screen */
          <div className="p-6 text-center space-y-4 animate-in fade-in duration-150">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
              <Clock className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                Bail Envoyé pour Signature
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                Contrat Transmis avec Succès !
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Le bail <strong>{activeLease.id}</strong> a été déposé sur le compte de{' '}
                <strong>{activeLease.tenant}</strong>. Il est désormais affiché dans la section Baux
                avec la mention <strong>« En attente de signature »</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Statut actuel :</span>
                <span className="font-extrabold text-amber-600 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  En attente de signature
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Signature Bailleur :</span>
                <span className="font-bold text-emerald-600">Signé et scellé ✓</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Signature Locataire :</span>
                <span className="font-bold text-amber-600">En attente de contresignature...</span>
              </div>
              {activeLease.utilitiesDeposit && activeLease.utilitiesDeposit > 0 ? (
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-400">Caution Eau & Électricité :</span>
                  <span className="font-bold text-amber-700">{formatFCFA(activeLease.utilitiesDeposit)}</span>
                </div>
              ) : null}
            </div>

            {/* Notification confirmation for new tenant */}
            {activeLease.isNewTenant && (
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 text-left text-xs space-y-2">
                <div className="font-black text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Compte créé & Notifications délivrées avec succès :</span>
                </div>
                <div className="space-y-1 text-[11px] text-emerald-900">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>SMS envoyé à {activeLease.tenantPhone}</span>
                    </span>
                    <span className="font-bold text-emerald-700">Délivré ✓</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Email sécurisé envoyé à {activeLease.tenantEmail}</span>
                    </span>
                    <span className="font-bold text-emerald-700">Délivré ✓</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-emerald-200/60">
                    <span>Code d'invitation locataire :</span>
                    <strong className="font-mono text-slate-900 font-bold">{activeLease.invitationCode || 'LOCA-INV-7842'}</strong>
                  </div>
                </div>
              </div>
            )}

            {activeLease.isNewTenant && (
              <button
                type="button"
                onClick={handleCopyInviteMessage}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                <span>{isCopied ? 'Message d’invitation copié !' : 'Copier le message d’invitation (SMS / WhatsApp)'}</span>
              </button>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => router.push('/leases')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Voir les baux en attente</span>
              </button>

              <button
                type="button"
                onClick={() => router.push('/portal?tab=bail')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs font-black shadow-pink-glow flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Tester la signature locataire</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
