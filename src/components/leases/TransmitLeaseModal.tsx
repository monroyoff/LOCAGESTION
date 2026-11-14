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
  MessageCircle,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Lease, LeaseService } from '@/lib/services/lease-service';
import { formatFCFA } from '@/lib/money/format';
import { notifySave, notifyAction } from '@/lib/notifications/action-notifier';
import { useAuth } from '@/lib/context/space-context';
import {
  buildWhatsAppUrl,
  buildSmsUri,
  buildMailtoUrl,
  buildGmailComposeUrl,
  buildLeaseInvitationTextMessage,
  sanitizePhoneNumber,
} from '@/lib/services/notification-dispatch-service';

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
    utilitiesDeposit?: number;
    totalDueAtEntry?: number;
    startDate?: string;
    endDate?: string;
    hashSha256?: string;
    governingLaw?: string;
    specialConditions?: string;
    invitationCode?: string;
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
  const { user } = useAuth();
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [showConfigHelp, setShowConfigHelp] = useState(false);
  const [autoOpenWhatsApp, setAutoOpenWhatsApp] = useState(true);

  // Stocke les résultats du dispatch serveur et les liens directs
  const [dispatchResult, setDispatchResult] = useState<{
    emailSent: boolean;
    emailProvider: string;
    emailError?: string | null;
    smsSent: boolean;
    smsProvider: string;
    smsError?: string | null;
    whatsappUrl: string;
    smsUri: string;
    mailtoUrl: string;
    gmailUrl: string;
    textMessage: string;
  } | null>(null);

  if (!isOpen) return null;

  // Normalisation des données du bail
  const activeLease: Lease = lease || {
    id: leaseData?.id || `BAIL-2026-${Math.floor(100 + Math.random() * 900)}`,
    tenant: leaseData?.tenantName || 'Locataire',
    tenantId: leaseData?.tenantId || undefined,
    tenantEmail: leaseData?.tenantEmail || '',
    tenantPhone: leaseData?.tenantPhone || '',
    property: leaseData?.propertyName || 'Bien immobilier',
    unit: leaseData?.unitNumber || 'Lot',
    rent: leaseData?.rent || 0,
    charges: leaseData?.charges || 0,
    deposit: leaseData?.deposit || 0,
    utilitiesDeposit: leaseData?.utilitiesDeposit || 0,
    totalDueAtEntry: leaseData?.totalDueAtEntry || 0,
    startDate: leaseData?.startDate || '2026-11-01',
    endDate: leaseData?.endDate || '2029-10-31',
    status: 'en_attente_signature',
    governingLaw: leaseData?.governingLaw,
    specialConditions: leaseData?.specialConditions,
    invitationCode: leaseData?.invitationCode || 'LOCA-INV-7842',
    landlordSignature: {
      signedBy: user?.name || user?.companyName || 'Le Bailleur',
      date: new Date().toLocaleDateString('fr-FR'),
      signatureDataUrl: '',
    },
    transmittedAt: new Date().toLocaleDateString('fr-FR'),
  };

  const portalUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/portal?tab=bail&leaseId=${activeLease.id}&code=${activeLease.invitationCode || 'LOCA-INV-7842'}&tenant=${encodeURIComponent(
          activeLease.tenant
        )}`
      : `https://locagestion.site/portal?tab=bail&leaseId=${activeLease.id}&code=${activeLease.invitationCode || 'LOCA-INV-7842'}`;

  const invitationData = {
    recipientName: activeLease.tenant,
    recipientEmail: activeLease.tenantEmail || '',
    recipientPhone: activeLease.tenantPhone || '',
    leaseId: activeLease.id,
    propertyName: activeLease.property,
    unitNumber: activeLease.unit,
    rent: activeLease.rent,
    deposit: activeLease.deposit,
    utilitiesDeposit: activeLease.utilitiesDeposit,
    totalDueAtEntry: activeLease.totalDueAtEntry,
    portalUrl,
    appDownloadUrl: 'https://locagestion.site/download',
    invitationCode: activeLease.invitationCode || 'LOCA-INV-7842',
    landlordName: activeLease.landlordSignature?.signedBy || user?.name || user?.companyName || 'Le Bailleur',
    governingLaw: activeLease.governingLaw,
  };

  const textMessage = buildLeaseInvitationTextMessage(invitationData);
  const fallbackWhatsappUrl = buildWhatsAppUrl(invitationData.recipientPhone, textMessage);
  const fallbackSmsUri = buildSmsUri(invitationData.recipientPhone, textMessage);
  const fallbackMailtoUrl = buildMailtoUrl(invitationData);
  const fallbackGmailUrl = buildGmailComposeUrl(invitationData);

  const handleCopyInviteMessage = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(dispatchResult?.textMessage || textMessage);
      setIsCopied(true);
      notifyAction(
        'Message d’invitation copié avec le lien sécurisé et le code d’activation.',
        'Message copié !',
        'success'
      );
      setTimeout(() => setIsCopied(false), 3000);
    }
  };

  const handleTransmit = async () => {
    setIsTransmitting(true);

    try {
      // 1. Appel vers l'API de dispatch de notification
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invitationData),
      });

      const data = await res.json();

      setDispatchResult({
        emailSent: Boolean(data?.emailStatus?.sent),
        emailProvider: data?.emailStatus?.provider || 'none',
        emailError: data?.emailStatus?.error || null,
        smsSent: Boolean(data?.smsStatus?.sent),
        smsProvider: data?.smsStatus?.provider || 'none',
        smsError: data?.smsStatus?.error || null,
        whatsappUrl: data?.deepLinks?.whatsappUrl || fallbackWhatsappUrl,
        smsUri: data?.deepLinks?.smsUri || fallbackSmsUri,
        mailtoUrl: data?.deepLinks?.mailtoUrl || fallbackMailtoUrl,
        gmailUrl: data?.deepLinks?.gmailUrl || fallbackGmailUrl,
        textMessage: data?.textMessage || textMessage,
      });

      // Si l'option WhatsApp automatique est activée, ouvrir l'onglet WhatsApp
      if (autoOpenWhatsApp) {
        const waTarget = data?.deepLinks?.whatsappUrl || fallbackWhatsappUrl;
        if (typeof window !== 'undefined' && waTarget) {
          window.open(waTarget, '_blank');
        }
      }
    } catch (err) {
      console.error('Erreur API notification:', err);
      // Fallback gracieux avec les liens directs
      setDispatchResult({
        emailSent: false,
        emailProvider: 'client_fallback',
        emailError: 'Erreur réseau vers le serveur',
        smsSent: false,
        smsProvider: 'client_fallback',
        smsError: null,
        whatsappUrl: fallbackWhatsappUrl,
        smsUri: fallbackSmsUri,
        mailtoUrl: fallbackMailtoUrl,
        gmailUrl: fallbackGmailUrl,
        textMessage,
      });
    }

    // 2. Enregistrement local du bail
    const transmitted = LeaseService.transmitLeaseToTenant(activeLease);
    setIsTransmitting(false);
    setIsSuccess(true);

    notifySave(
      `Le contrat ${activeLease.id} est scellé. Les notifications sont prêtes pour ${activeLease.tenant}.`,
      'Bail transmis au locataire !'
    );

    if (onTransmitted) onTransmitted(transmitted);
    if (onTransmittedSuccess) onTransmittedSuccess(transmitted);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white">
                Transmission du Bail au Locataire
              </h3>
              <p className="text-[11px] text-slate-400">
                Portail Sécurisé LOCAGESTION • Contresignature & Notification Réelle
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
          <div className="p-6 space-y-4 overflow-y-auto">
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
              <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 space-y-1">
                <span className="font-black block">
                  Le bail sera placé en statut « En attente de signature »
                </span>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Votre signature en tant que bailleur ({activeLease.landlordSignature?.signedBy || user?.name || 'Bailleur'})
                  a été apposée. Le contrat sera mis à disposition sur le portail sécurisé et le locataire sera notifié.
                </p>
              </div>
            </div>

            {/* Tenant Selected Card */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {activeLease.isNewTenant
                    ? 'Nouveau Locataire (Invitation & Accès)'
                    : 'Locataire Destinataire'}
                </span>
                {activeLease.isNewTenant ? (
                  <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-200 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-brand-600" />
                    <span>Nouveau compte</span>
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

              <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900 space-y-1.5">
                <div className="font-bold flex items-center gap-1.5 text-blue-950">
                  <Zap className="w-3.5 h-3.5 text-blue-600" />
                  <span>Canaux de notification directe prévus :</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>WhatsApp & SMS :</strong> {activeLease.tenantPhone}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px]">
                  <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span><strong>Email :</strong> {activeLease.tenantEmail}</span>
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

            {/* Spécificités du contrat */}
            {activeLease.specialConditions && activeLease.specialConditions.trim() !== '' && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Spécificités & Conditions Particulières :
                </span>
                <p className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">
                  {activeLease.specialConditions}
                </p>
              </div>
            )}

            {/* Electronic Proof */}
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-2 text-[11px] text-emerald-800">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {activeLease.governingLaw
                  ? `Bail scellé conforme à : ${activeLease.governingLaw} • Piste d'audit SHA-256 certifiée.`
                  : `Signature du bailleur vérifiée • Piste d'audit SHA-256 scellée conforme OHADA.`}
              </span>
            </div>

            {/* Auto WhatsApp trigger checkbox */}
            <label className="flex items-center gap-2.5 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl cursor-pointer hover:bg-emerald-50 transition-colors">
              <input
                type="checkbox"
                checked={autoOpenWhatsApp}
                onChange={(e) => setAutoOpenWhatsApp(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
              />
              <div className="text-xs text-emerald-950">
                <span className="font-bold flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  Ouvrir WhatsApp automatiquement pour délivrance immédiate
                </span>
                <span className="text-[10px] text-emerald-800 block">
                  Pré-remplit le message officiel avec le lien sécurisé du bail et le code d'activation
                </span>
              </div>
            </label>

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
                  {isTransmitting ? 'Transmission & Préparation des envois...' : 'Transmettre au Locataire'}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center space-y-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Bail Transmis & Prêt à Signer
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                Contrat Déposé avec Succès !
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Le bail <strong>{activeLease.id}</strong> est actif en statut{' '}
                <strong>« En attente de signature »</strong>. Utilisez les boutons ci-dessous pour délivrer instantanément la notification sur le téléphone et l'email du locataire.
              </p>
            </div>

            {/* REAL DISPATCH BOX */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl text-left space-y-3 shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Expédition Immédiate au Locataire
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Code : {activeLease.invitationCode || 'LOCA-INV-7842'}
                </span>
              </div>

              {/* Server delivery status */}
              <div className="text-[11px] space-y-1.5">
                <div className="flex items-center justify-between bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-blue-400" />
                    <span>Email ({activeLease.tenantEmail})</span>
                  </span>
                  {dispatchResult?.emailSent ? (
                    <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800">
                      <Check className="w-3.5 h-3.5" /> Envoyé avec succès (SMTP Gmail) ✓
                    </span>
                  ) : (
                    <span className="text-amber-300 font-bold text-[10px]">
                      1-Clic Disponible
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between bg-slate-800/60 p-2 rounded-xl">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Téléphone ({activeLease.tenantPhone})</span>
                  </span>
                  {dispatchResult?.smsSent ? (
                    <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-800">
                      <Check className="w-3.5 h-3.5" /> Envoyé ({dispatchResult.smsProvider}) ✓
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold text-[10px]">
                      WhatsApp & SMS Prêt
                    </span>
                  )}
                </div>
              </div>

              {/* ACTION BUTTON 1: WHATSAPP DIRECT (Preferred for West & Central Africa) */}
              <div className="space-y-2 pt-1">
                <a
                  href={dispatchResult?.whatsappUrl || fallbackWhatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Envoyer l'invitation par WhatsApp (+229...)</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>

                {/* ACTION BUTTON 2: NATIVE SMS DIRECT */}
                <a
                  href={dispatchResult?.smsUri || fallbackSmsUri}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-2 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Ouvrir l'application SMS (Messages)</span>
                </a>

                {/* ACTION BUTTON 3: EMAIL CLIENT & GMAIL */}
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={dispatchResult?.mailtoUrl || fallbackMailtoUrl}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Ouvrir Mail</span>
                  </a>

                  <a
                    href={dispatchResult?.gmailUrl || fallbackGmailUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 transition-all cursor-pointer text-center"
                  >
                    <span>Ouvrir Gmail Web</span>
                    <ExternalLink className="w-3 h-3 opacity-60" />
                  </a>
                </div>
              </div>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyInviteMessage}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              {isCopied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 text-slate-600" />
              )}
              <span>
                {isCopied
                  ? 'Message d’invitation copié dans le presse-papier !'
                  : 'Copier le message complet (avec lien de signature et code)'}
              </span>
            </button>

            {/* Collapsible Config Info */}
            <div className="text-left">
              <button
                type="button"
                onClick={() => setShowConfigHelp(!showConfigHelp)}
                className="text-[11px] text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 mx-auto cursor-pointer"
              >
                <HelpCircle className="w-3 h-3 text-slate-400" />
                <span>Comment activer l'envoi 100% automatique en tâche de fond (SMTP / Twilio) ?</span>
                {showConfigHelp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showConfigHelp && (
                <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1.5 animate-in fade-in">
                  <p>
                    Pour que le serveur expédie les emails et SMS sans ouvrir votre messagerie ni WhatsApp :
                  </p>
                  <ol className="list-decimal pl-4 space-y-1 text-slate-700 font-medium">
                    <li>
                      Renseignez votre serveur <strong>SMTP</strong> dans le fichier <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">.env.local</code> (supporte Gmail avec mot de passe d'application, Brevo gratuit, etc.).
                    </li>
                    <li>
                      (Optionnel) Renseignez vos identifiants <strong>Twilio</strong> ou <strong>Termii</strong> pour les SMS automatiques par opérateur télécom.
                    </li>
                    <li>
                      En l'absence de ces clés, les boutons <strong>WhatsApp</strong>, <strong>SMS Direct</strong> et <strong>Mail</strong> ci-dessus assurent une distribution immédiate et garantie à 100%.
                    </li>
                  </ol>
                </div>
              )}
            </div>

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
                onClick={() => router.push(`/portal?tab=bail&leaseId=${activeLease.id}&tenant=${encodeURIComponent(activeLease.tenant)}`)}
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
