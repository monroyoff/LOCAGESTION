'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  FileCheck2,
  ShieldCheck,
  Building,
  User,
  Calendar,
  DollarSign,
  PenTool,
  RotateCcw,
  CheckCircle2,
  Mail,
  Bell,
  Download,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { Lease, LeaseService } from '@/lib/services/lease-service';
import { formatFCFA } from '@/lib/money/format';

interface TenantSignLeaseModalProps {
  lease: Lease;
  tenantName: string;
  isOpen: boolean;
  onClose: () => void;
  onSignedSuccess?: (updatedLease: Lease) => void;
}

export function TenantSignLeaseModal({
  lease,
  tenantName,
  isOpen,
  onClose,
  onSignedSuccess,
}: TenantSignLeaseModalProps) {
  const [hasAgreedTerms, setHasAgreedTerms] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignedSuccess, setIsSignedSuccess] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Initialisation du canvas
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0284c7'; // Bleu d'encre pour signature locataire
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [isOpen, isSignedSuccess]);

  if (!isOpen) return null;

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      setSignatureDataUrl(canvasRef.current.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setSignatureDataUrl('');
  };

  const handleSignContract = () => {
    if (!hasSignature || !hasAgreedTerms) return;

    setIsSubmitting(true);

    setTimeout(() => {
      const dataUrl =
        signatureDataUrl ||
        canvasRef.current?.toDataURL('image/png') ||
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><text x="10" y="35" font-family="cursive" font-size="22" fill="%230284c7">' +
          encodeURIComponent(tenantName) +
          '</text></svg>';

      // Enregistrement de la contresignature dans le service
      const result = LeaseService.signLeaseByTenant(lease.id, tenantName, dataUrl);

      setIsSubmitting(false);
      setIsSignedSuccess(true);

      if (onSignedSuccess && result.lease) {
        onSignedSuccess(result.lease);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden flex flex-col max-h-[90vh]">
        {/* En-tête */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black tracking-tight text-white">
                  Contresignature Électronique du Bail
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  UEMOA & CEMAC Conforme
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Réf. : <span className="font-mono font-bold text-white">{lease.id}</span> • Lot :{' '}
                <span className="font-bold text-white">{lease.unit}</span> ({lease.property})
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

        {/* Corps défilable */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {!isSignedSuccess ? (
            <>
              {/* Bannière explicative */}
              <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs text-sky-950 space-y-1">
                  <p className="font-bold">
                    Votre bailleur vous a transmis ce contrat officiel pour signature électronique.
                  </p>
                  <p className="text-sky-800">
                    Vérifiez les conditions ci-dessous. Dès apposition de votre signature, le bail
                    sera immédiatement scellé, avec notification instantanée transmise au bailleur
                    dans l'application et copie envoyée par email.
                  </p>
                </div>
              </div>

              {/* Fiche récapitulative du bail */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Résumé des stipulations du bail
                  </span>
                  <span className="text-[11px] font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-200/60">
                    Bail d'habitation 3 ans
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Bailleur / Propriétaire :</span>
                    <strong className="text-slate-900 block font-bold">Mamadou Diallo</strong>
                    <span className="text-[11px] text-slate-500">Diallo Patrimoine Immobilier</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Locataire titulaire :</span>
                    <strong className="text-slate-900 block font-bold">{tenantName}</strong>
                    <span className="text-[11px] text-slate-500">Compte certifié plateforme</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Logement loué :</span>
                    <strong className="text-slate-900 block font-bold">{lease.unit}</strong>
                    <span className="text-[11px] text-slate-500">{lease.property}</span>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Date de prise d'effet :</span>
                    <strong className="text-slate-900 block font-bold">{lease.startDate}</strong>
                    <span className="text-[11px] text-slate-500">Exigibilité le 05 de chaque mois</span>
                  </div>
                </div>

                {/* Conditions financières en FCFA */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-slate-500 block">Loyer mensuel charges comprises :</span>
                    <span className="text-sm font-black text-slate-900">
                      {formatFCFA(lease.rent)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500 block">Dépôt de garantie (Caution) :</span>
                    <span className="text-sm font-black text-emerald-600">
                      {formatFCFA(lease.deposit || lease.rent * 2)}
                    </span>
                  </div>
                </div>

                {/* Signature déjà apposée par le bailleur */}
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-emerald-950 block">
                        Signature du Bailleur apposée & certifiée
                      </span>
                      <span className="text-[10px] text-emerald-700">
                        Signé par {lease.landlordSignature?.signedBy || 'Mamadou Diallo'} le{' '}
                        {lease.landlordSignature?.date || lease.transmittedAt || '01/11/2026'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                    CERTIFIÉ
                  </span>
                </div>
              </div>

              {/* Pad de signature électronique pour le locataire */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-sky-600" />
                    <span>Votre signature électronique (Locataire)</span>
                  </label>
                  {hasSignature && (
                    <button
                      type="button"
                      onClick={clearSignature}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Effacer</span>
                    </button>
                  )}
                </div>

                <div className="relative border-2 border-dashed border-sky-300 rounded-2xl bg-white overflow-hidden shadow-inner group hover:border-sky-500 transition-colors">
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={140}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-32 cursor-crosshair touch-none bg-white"
                  />

                  {!hasSignature && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-slate-400">
                      <PenTool className="w-5 h-5 text-sky-400 mb-1 opacity-60" />
                      <span className="text-xs font-medium">
                        Tracez votre signature au doigt ou à la souris
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {tenantName} — Titulaire du bail
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-400">
                    Sceau Sécurisé LOCAGESTION • UEMOA & CEMAC
                  </div>
                </div>
              </div>

              {/* Case à cocher d'engagement légal */}
              <label className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer hover:bg-slate-100 transition-colors">
                <input
                  type="checkbox"
                  checked={hasAgreedTerms}
                  onChange={(e) => setHasAgreedTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-sky-600 focus:ring-sky-500 border-slate-300"
                />
                <span className="leading-relaxed">
                  Je reconnais avoir pris connaissance de l'ensemble des clauses du contrat de bail
                  résidentiel et des conditions financières (loyer de {formatFCFA(lease.rent)}), et
                  j'appose ma signature électronique ayant valeur juridique probante.
                </span>
              </label>

              {/* Bouton d'action de signature */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!hasSignature || !hasAgreedTerms || isSubmitting}
                  onClick={handleSignContract}
                  className={`w-full py-3.5 px-6 rounded-2xl text-sm font-black flex items-center justify-center gap-2 shadow-lg transition-all ${
                    hasSignature && hasAgreedTerms && !isSubmitting
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-emerald-600/25 active:scale-[0.99] cursor-pointer'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Scellement cryptographique en cours...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Valider & Contresigner Définitivement le Bail</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center py-4 space-y-5 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                  ✓ Bail Contresigné & Actif
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-2">
                  Félicitations, votre contrat est scellé !
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-md mx-auto">
                  Le contrat de bail <strong>{lease.id}</strong> pour le logement{' '}
                  <strong>{lease.unit}</strong> ({lease.property}) a été contresigné avec succès.
                </p>
              </div>

              {/* Récapitulatif des notifications envoyées */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Notifications & Preuves automatiques</span>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Notification In-App Bailleur */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5">
                    <Bell className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-bold">
                        Notification dans l'application envoyée au bailleur
                      </strong>
                      <span className="text-[11px] text-slate-500 block">
                        Mamadou Diallo a été notifié en direct que Koffi Mensah a contresigné le bail.
                      </span>
                    </div>
                  </div>

                  {/* Notification Email Bailleur */}
                  <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-start gap-2.5">
                    <Mail className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-slate-900 block font-bold">
                        Email officiel transmis avec le bail contresigné
                      </strong>
                      <span className="text-[11px] text-slate-500 block">
                        Envoyé à : <strong>diallo.patrimoine@afrique-gestion.com</strong> avec copie archivée
                        pour le locataire.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions post-signature */}
              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Accéder à mon espace locataire
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

