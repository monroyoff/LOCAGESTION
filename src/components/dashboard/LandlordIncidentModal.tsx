'use client';

import React, { useState, useEffect } from 'react';
import {
  Wrench,
  X,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  Camera,
  Send,
  User,
  Building2,
  FileCheck,
  Save,
} from 'lucide-react';
import { ReportedIncident, IncidentService, IncidentStatus } from '@/lib/services/incident-service';
import { notifySave } from '@/lib/notifications/action-notifier';
import { formatFCFA } from '@/lib/money/format';

interface LandlordIncidentModalProps {
  incident: ReportedIncident | null;
  onClose: () => void;
  onStatusUpdated?: () => void;
}

export function LandlordIncidentModal({
  incident,
  onClose,
  onStatusUpdated,
}: LandlordIncidentModalProps) {
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<IncidentStatus>(
    incident?.status || 'en_attente'
  );
  const [resolutionNotes, setResolutionNotes] = useState(
    incident?.resolutionNotes || ''
  );
  const [artisanName, setArtisanName] = useState(
    incident?.assignedTechnician?.name || ''
  );
  const [artisanPhone, setArtisanPhone] = useState(
    incident?.assignedTechnician?.phone || '+229 95 00 22 33'
  );
  const [artisanTrade, setArtisanTrade] = useState(
    incident?.assignedTechnician?.trade || 'Technicien / Artisan'
  );
  const [artisanFee, setArtisanFee] = useState<number | ''>(
    incident?.artisanFee !== undefined ? incident.artisanFee : ''
  );
  const [artisanPaymentStatus, setArtisanPaymentStatus] = useState<'paye' | 'en_attente' | 'non_applicable'>(
    incident?.artisanPaymentStatus || 'paye'
  );
  const [artisanInvoiceRef, setArtisanInvoiceRef] = useState<string>(
    incident?.artisanInvoiceRef || ''
  );

  useEffect(() => {
    if (incident) {
      setCurrentStatus(incident.status);
      setResolutionNotes(incident.resolutionNotes || '');
      setArtisanName(incident.assignedTechnician?.name || '');
      setArtisanPhone(incident.assignedTechnician?.phone || '+229 95 00 22 33');
      setArtisanTrade(incident.assignedTechnician?.trade || 'Technicien / Artisan');
      setArtisanFee(incident.artisanFee !== undefined ? incident.artisanFee : '');
      setArtisanPaymentStatus(incident.artisanPaymentStatus || 'paye');
      setArtisanInvoiceRef(incident.artisanInvoiceRef || '');
    }
  }, [incident]);

  if (!incident) return null;

  const handleUpdateStatus = (newStatus: IncidentStatus) => {
    setCurrentStatus(newStatus);
    IncidentService.updateIncidentStatus(incident.id, newStatus, resolutionNotes);
    notifySave(`Statut de l'incident mis à jour : ${newStatus.toUpperCase()}`);
    if (onStatusUpdated) onStatusUpdated();
  };

  const handleSaveNotes = () => {
    IncidentService.updateIncidentStatus(incident.id, currentStatus, resolutionNotes);
    notifySave('Notes de suivi de l’incident enregistrées avec succès.');
    if (onStatusUpdated) onStatusUpdated();
  };

  const handleAssignTechnician = () => {
    if (artisanName.trim()) {
      IncidentService.assignTechnician(incident.id, {
        name: artisanName.trim(),
        phone: artisanPhone.trim() || '+229 95 00 22 33',
        trade: artisanTrade.trim() || 'Technicien / Artisan',
      });
      setCurrentStatus('pris_en_charge');
      notifySave(
        `Artisan ${artisanName.trim()} (${artisanPhone.trim()}) mandaté avec succès ! Coordonnées transmises au locataire.`,
        'Mission artisan enregistrée'
      );
      if (onStatusUpdated) onStatusUpdated();
    }
  };

  const handleSaveAll = (explicitStatus?: IncidentStatus) => {
    if (!incident) return;
    const hasArtisan = artisanName.trim().length > 0;
    const tech = hasArtisan
      ? {
          name: artisanName.trim(),
          phone: artisanPhone.trim() || '+229 95 00 22 33',
          trade: artisanTrade.trim() || 'Technicien / Artisan',
        }
      : undefined;

    let targetStatus = explicitStatus || currentStatus;
    if (!explicitStatus && targetStatus === 'en_attente' && hasArtisan) {
      targetStatus = 'pris_en_charge';
    }
    const parsedFee = typeof artisanFee === 'number' ? artisanFee : artisanFee ? Number(artisanFee) : 0;

    IncidentService.updateIncidentFull(incident.id, {
      status: targetStatus,
      resolutionNotes,
      assignedTechnician: tech,
      artisanFee: parsedFee,
      artisanPaymentStatus,
      artisanInvoiceRef: artisanInvoiceRef.trim(),
    });

    notifySave(
      hasArtisan
        ? `Fiche mise à jour ! Artisan mandaté : ${artisanName} (${artisanPhone}) • Frais : ${formatFCFA(parsedFee)} pris en compte dans Dépenses & Travaux.`
        : targetStatus === 'resolu'
        ? `Incident clôturé et résolu avec succès !`
        : 'Fiche incident enregistrée avec succès.',
      'Fiche & Dépenses enregistrées'
    );

    if (onStatusUpdated) onStatusUpdated();
    onClose();
  };

  // WhatsApp au locataire pour accuser réception
  const tenantWhatsAppText = encodeURIComponent(
    `Bonjour ${incident.tenantName},\n\nJ'ai bien pris connaissance de votre signalement pour la panne :\n"${incident.category}" sur votre logement ${incident.unit} (${incident.property}).\n\nNous mettons tout en œuvre pour intervenir dans les meilleurs délais.\n\nCordialement,\nVotre Bailleur & Gestionnaire.`
  );

  // WhatsApp à l'artisan pour lui confier l'intervention avec photos et coordonnées
  const artisanWhatsAppText = encodeURIComponent(
    `Bonjour ${artisanName || 'M.'},\n\nVoici une mission d'intervention technique urgente :\n\n- Type de panne : ${incident.category}\n- Niveau d'urgence : ${incident.urgency.toUpperCase()}\n- Logement : ${incident.unit} (${incident.property})\n- Locataire à contacter : ${incident.tenantName} (${incident.tenantPhone})\n- Description du problème : "${incident.description}"\n\nMerci de bien vouloir confirmer votre disponibilité.`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-amber-400">
                  {incident.id}
                </span>
                <span className="text-slate-500">•</span>
                <span className="text-xs font-bold text-slate-300">
                  Déclaré le {incident.createdAt}
                </span>
              </div>
              <h2 className="text-base font-black tracking-tight text-white">
                {incident.category}
              </h2>
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

        {/* Corps */}
        <div className="p-6 space-y-6 text-xs">
          {/* Badge & Urgence Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                  incident.urgency === 'critique'
                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : incident.urgency === 'urgente'
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                Urgence {incident.urgency}
              </span>

              <span
                className={`px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1.5 ${
                  currentStatus === 'resolu'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : currentStatus === 'pris_en_charge'
                    ? 'bg-blue-100 text-blue-800 border border-blue-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {currentStatus === 'resolu'
                    ? 'Résolu'
                    : currentStatus === 'pris_en_charge'
                    ? 'Pris en charge'
                    : 'En attente de traitement'}
                </span>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-semibold text-[11px]">Bascule rapide :</span>
              <button
                type="button"
                onClick={() => handleUpdateStatus('pris_en_charge')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                  currentStatus === 'pris_en_charge'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Prendre en charge
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus('resolu')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors cursor-pointer ${
                  currentStatus === 'resolu'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Marquer résolu
              </button>
            </div>
          </div>

          {/* Fiche Logement & Locataire */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                <Building2 className="w-3.5 h-3.5 text-brand-500" />
                <span>Localisation du bien</span>
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 block">
                  {incident.unit}
                </span>
                <span className="text-[11px] text-slate-600 block">
                  {incident.property}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
                  <User className="w-3.5 h-3.5 text-blue-500" />
                  <span>Locataire déclarant</span>
                </div>
                <a
                  href={`https://wa.me/${incident.tenantPhone.replace(/[^0-9]/g, '')}?text=${tenantWhatsAppText}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  <MessageCircle className="w-3 h-3 text-emerald-600" />
                  <span>Écrire sur WhatsApp</span>
                </a>
              </div>
              <div>
                <span className="text-xs font-black text-slate-900 block">
                  {incident.tenantName}
                </span>
                <span className="text-[11px] text-slate-600 font-medium block">
                  {incident.tenantPhone} • {incident.tenantEmail}
                </span>
              </div>
            </div>
          </div>

          {/* Description détaillée de la panne */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
              Constat & Description du Locataire :
            </label>
            <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3.5 rounded-xl border border-slate-200/80">
              {incident.description}
            </p>
          </div>

          {/* Photos de la panne attachées par le locataire */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-brand-500" />
                <span>Photos constatées par le locataire</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 border border-brand-200">
                  {incident.photos.length} photo{incident.photos.length > 1 ? 's' : ''}
                </span>
              </label>
              <span className="text-[10px] text-slate-400">Cliquez pour agrandir en HD</span>
            </div>

            {incident.photos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {incident.photos.map((photoUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setZoomPhoto(photoUrl)}
                    className="relative aspect-video rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-100 group shadow-xs hover:border-brand-500 transition-all cursor-pointer"
                  >
                    <img
                      src={photoUrl}
                      alt={`Photo ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-bold text-[11px]">
                      <ZoomIn className="w-4 h-4" />
                      <span>Agrandir</span>
                    </div>
                    <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-900/80 text-[10px] font-bold text-white group-hover:hidden">
                      Photo #{idx + 1}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center text-slate-400 text-xs">
                Aucune photo transmise avec ce signalement.
              </div>
            )}
          </div>

          {/* Mandatement d'un Artisan / Technicien & WhatsApp */}
          <div className="p-4.5 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <h4 className="font-extrabold text-xs">
                  Mandater un Artisan / Technicien (WhatsApp Express)
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">UEMOA & CEMAC</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-300 font-bold block mb-1">
                  Nom du Technicien / Société
                </label>
                <input
                  type="text"
                  value={artisanName}
                  onChange={(e) => setArtisanName(e.target.value)}
                  placeholder="Ex: Moussa Plomberie"
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-300 font-bold block mb-1">
                  Téléphone WhatsApp
                </label>
                <input
                  type="text"
                  value={artisanPhone}
                  onChange={(e) => setArtisanPhone(e.target.value)}
                  placeholder="+229 95 00 22 33"
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-300 font-bold block mb-1">
                  Corps de métier
                </label>
                <input
                  type="text"
                  value={artisanTrade}
                  onChange={(e) => setArtisanTrade(e.target.value)}
                  placeholder="Ex: Plombier Sanitaire"
                  className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
              </div>
            </div>

            <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] text-slate-300 font-medium">
                💡 Renseignez l’artisan puis enregistrez via <strong>« Enregistrer les modifications »</strong> en bas.
              </span>
              <a
                href={`https://wa.me/${artisanPhone.replace(/[^0-9]/g, '')}?text=${artisanWhatsAppText}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (artisanName.trim()) {
                    IncidentService.assignTechnician(incident.id, {
                      name: artisanName.trim(),
                      phone: artisanPhone.trim() || '+229 95 00 22 33',
                      trade: artisanTrade.trim() || 'Technicien / Artisan',
                    });
                    setCurrentStatus('pris_en_charge');
                    if (onStatusUpdated) onStatusUpdated();
                  }
                }}
                className="py-2 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Envoyer le dossier sur WhatsApp à l'artisan</span>
              </a>
            </div>
          </div>

          {/* Section Rémunération / Facturation Artisan (Dépenses & Travaux) */}
          <div className="p-4.5 rounded-2xl bg-amber-500/10 border border-amber-300/80 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-amber-200">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-black text-[10px]">
                  FCFA
                </div>
                <h4 className="font-extrabold text-xs text-slate-900">
                  Règlement de l'Artisan & Dépenses de Réparation
                </h4>
              </div>
              <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                Inclus dans « Dépenses & Travaux »
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] text-slate-700 font-bold block mb-1">
                  Montant payé à l'artisan (FCFA)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={artisanFee}
                    onChange={(e) => setArtisanFee(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ex: 85000"
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-extrabold text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
                    FCFA
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-700 font-bold block mb-1">
                  Statut du règlement
                </label>
                <select
                  value={artisanPaymentStatus}
                  onChange={(e) => setArtisanPaymentStatus(e.target.value as 'paye' | 'en_attente')}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/30 cursor-pointer"
                >
                  <option value="paye">✅ Payé / Soldé</option>
                  <option value="en_attente">⏳ En attente de paiement</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-700 font-bold block mb-1">
                  N° Facture / Reçu Artisan
                </label>
                <input
                  type="text"
                  value={artisanInvoiceRef}
                  onChange={(e) => setArtisanInvoiceRef(e.target.value)}
                  placeholder="Ex: FAC-PLOMB-2026-018"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-slate-300 text-slate-900 font-bold text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <p className="text-[11px] text-amber-900/80 font-medium">
                💡 Renseigner ce montant met à jour le total <strong>Dépenses & Travaux</strong> sur le tableau de bord.
              </p>
              {typeof artisanFee === 'number' && artisanFee > 0 && (
                <span className="text-xs font-black text-amber-950 bg-amber-200/80 px-2.5 py-1 rounded-lg">
                  {formatFCFA(artisanFee)}
                </span>
              )}
            </div>
          </div>

          {/* Notes de résolution & Clôture */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-700 block">
                Notes de suivi & constat de résolution :
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                S'enregistre avec « Enregistrer les modifications » en bas
              </span>
            </div>
            <textarea
              rows={2}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Ex: L'artisan est intervenu le 01/11, le siphon a été nettoyé et le joint remplacé. Tout est fonctionnel."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 font-bold hover:bg-slate-100 text-slate-700 text-xs transition-colors cursor-pointer"
          >
            Fermer
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveAll()}
              className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black text-xs flex items-center gap-2 shadow-pink-glow transition-all cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Enregistrer les modifications</span>
            </button>
            <button
              type="button"
              onClick={() => handleSaveAll('resolu')}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center gap-1.5 shadow-sm transition-all cursor-pointer text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Clôturer l'incident (Résolu)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lightbox Photo Zoom */}
      {zoomPhoto && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setZoomPhoto(null)}
        >
          <div
            className="relative max-w-3xl w-full max-h-[85vh] flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomPhoto(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={zoomPhoto}
              alt="Photo de la panne"
              className="w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/20 bg-black/50"
            />
            <p className="text-white/80 text-xs mt-3 font-medium text-center">
              Constat technique de l'incident #{incident.id} ({incident.category})
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

