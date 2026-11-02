'use client';

import React, { useState } from 'react';
import {
  X,
  Scale,
  Calendar,
  Clock,
  User,
  Building2,
  Download,
  MessageCircle,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { Notice, NoticeService, NOTICE_REASONS_CATALOG } from '@/lib/services/notice-service';
import { formatFCFA } from '@/lib/money/format';
import { generateNoticePDF } from '@/lib/export/pdf-download';
import { notifyAction, notifyDelete } from '@/lib/notifications/action-notifier';
import { NoticeEmailModal } from './NoticeEmailModal';

interface NoticeDetailsModalProps {
  notice: Notice | null;
  onClose: () => void;
  onNoticeUpdated: () => void;
  onOpenEmail?: (notice: Notice) => void;
}

export function NoticeDetailsModal({
  notice,
  onClose,
  onNoticeUpdated,
  onOpenEmail,
}: NoticeDetailsModalProps) {
  const [showEmailModal, setShowEmailModal] = useState(false);

  if (!notice) return null;

  const catalogItem = NOTICE_REASONS_CATALOG.find((c) => c.type === notice.reasonType);

  // Calcul du nombre de jours restants
  const calculateDaysRemaining = (effectiveDateStr: string): number => {
    try {
      const parts = effectiveDateStr.split('/');
      if (parts.length === 3) {
        const targetDate = new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
        const today = new Date();
        const diffMs = targetDate.getTime() - today.getTime();
        return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      }
      return 0;
    } catch {
      return 0;
    }
  };

  const daysRemaining = calculateDaysRemaining(notice.effectiveDate);

  const handleDownloadPDF = () => {
    generateNoticePDF({
      id: notice.id,
      tenantName: notice.tenantName,
      tenantPhone: notice.tenantPhone,
      tenantEmail: notice.tenantEmail,
      propertyName: notice.propertyName,
      unitNumber: notice.unitNumber,
      monthlyRent: notice.monthlyRent,
      reasonType: notice.reasonType,
      reasonTitle: notice.reasonTitle,
      reasonDetails: notice.reasonDetails,
      noticeMonths: notice.noticeMonths,
      noticeDate: notice.noticeDate,
      effectiveDate: notice.effectiveDate,
      deliveryMethod: notice.deliveryMethod,
      beneficiaryName: notice.beneficiaryName,
      salePrice: notice.salePrice,
      legalBasis: notice.legalBasis,
      departureInspectionDate: notice.departureInspectionDate,
      notes: notice.notes,
    });
    notifyAction(`PDF officiel du préavis ${notice.id} téléchargé`, 'Téléchargement réussi', 'success');
  };

  const handleWhatsApp = () => {
    const phoneClean = notice.tenantPhone.replace(/[^0-9]/g, '');
    const message = `*RAPPEL PRÉAVIS DE CONGÉ DU BAIL (${notice.id})*\n\nBonjour M./Mme *${notice.tenantName}*,\n\nNous vous rappelons que votre préavis de congé pour votre logement *${notice.propertyName} (${notice.unitNumber})* est actuellement en cours.\n\n📌 *Motif :* ${notice.reasonTitle}\n🗓️ *Date limite de libération des locaux :* ${notice.effectiveDate} (${daysRemaining > 0 ? `${daysRemaining} jours restants` : 'Échéance atteinte'})\n\nNous restons à votre disposition pour coordonner l'état des lieux de sortie contradictoire et la remise des clés.\n\n*Direction DIALLO Patrimoine*`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneClean}?text=${encoded}`, '_blank');
  };

  const handleStatusChange = (newStatus: Notice['status']) => {
    NoticeService.updateNoticeStatus(notice.id, newStatus);
    notifyAction(
      `Statut du préavis ${notice.id} mis à jour : ${newStatus.toUpperCase()}`,
      'Statut Modifié',
      'info'
    );
    onNoticeUpdated();
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Confirmez-vous la suppression du préavis ${notice.id} pour ${notice.tenantName} ?`)) {
      NoticeService.deleteNotice(notice.id);
      notifyDelete(`Préavis ${notice.id} supprimé du registre.`);
      onNoticeUpdated();
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header Modal */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold border border-rose-500/30">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Détail du Préavis : {notice.id}
                  </h3>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-white/10 text-slate-200">
                    {notice.status === 'en_cours'
                      ? 'En cours'
                      : notice.status === 'notifie'
                      ? 'Signifié'
                      : notice.status === 'cloture'
                      ? 'Clôturé / Lieux libérés'
                      : 'Annulé'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Notification de résiliation émise le {notice.noticeDate}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {/* Alerte Décompte Temporel */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                daysRemaining > 30
                  ? 'bg-blue-50/80 border-blue-200 text-blue-900'
                  : daysRemaining > 0
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-rose-50/80 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 shrink-0" />
                <div>
                  <h4 className="font-black text-sm">
                    {daysRemaining > 0
                      ? `Délai restant : ${daysRemaining} jours`
                      : 'Date d’échéance du préavis atteinte'}
                  </h4>
                  <p className="text-[11px] opacity-90">
                    Date impérative de libération des locaux : <strong>{notice.effectiveDate}</strong> (Délai de {notice.noticeMonths} mois).
                  </p>
                </div>
              </div>
              <span className="text-xs font-black uppercase px-2.5 py-1 rounded-xl bg-white shadow-2xs">
                {notice.deliveryMethod.toUpperCase()}
              </span>
            </div>

            {/* Fiche Locataire & Logement */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Locataire Désigné
                </span>
                <h4 className="text-sm font-black text-slate-900">{notice.tenantName}</h4>
                <p className="text-slate-600 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-500" />
                  <span>{notice.tenantPhone}</span>
                </p>
                <p className="text-slate-600 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-500" />
                  <span>{notice.tenantEmail || 'Aucun email renseigné'}</span>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">
                  Logement & Loyer
                </span>
                <h4 className="text-sm font-black text-slate-900">{notice.propertyName}</h4>
                <p className="text-slate-600">
                  Lot : <strong>{notice.unitNumber}</strong>
                </p>
                <p className="text-slate-700 font-bold">
                  Loyer mensuel : {formatFCFA(notice.monthlyRent)}
                </p>
              </div>
            </div>

            {/* Motif & Justifications Légales */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-black tracking-wider text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                  Motif Légal Certifié
                </span>
                <span className="text-[11px] text-slate-500 font-bold">
                  Préavis légal : {notice.noticeMonths} mois
                </span>
              </div>

              <h4 className="text-sm font-black text-slate-900">{notice.reasonTitle}</h4>
              <p className="text-slate-700 leading-relaxed font-sans">{notice.reasonDetails}</p>

              {notice.beneficiaryName && (
                <p className="text-blue-900 bg-blue-50 p-2.5 rounded-xl border border-blue-200 font-bold text-[11px]">
                  👤 Bénéficiaire désigné de la reprise : {notice.beneficiaryName}
                </p>
              )}

              {notice.salePrice && (
                <p className="text-purple-900 bg-purple-50 p-2.5 rounded-xl border border-purple-200 font-bold text-[11px]">
                  🏷️ Prix d'acquisition avec droit légal de préemption : {formatFCFA(notice.salePrice)}
                </p>
              )}

              <p className="text-[10px] text-slate-400 font-medium pt-1">
                ⚖️ Base juridique : {notice.legalBasis}
              </p>
            </div>

            {/* Changer le statut du dossier */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Mettre à jour l'état d'avancement du préavis
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStatusChange('en_cours')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    notice.status === 'en_cours'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  En cours de préavis
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('notifie')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    notice.status === 'notifie'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Signifié par Huissier
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('cloture')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    notice.status === 'cloture'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Clôturé (Lieux libérés & Clés restituées)
                </button>
                <button
                  type="button"
                  onClick={() => handleStatusChange('annule')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    notice.status === 'annule'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Annuler le préavis
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleDelete}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 py-2 px-3 rounded-xl hover:bg-rose-50 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer</span>
            </button>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => {
                  if (onOpenEmail) {
                    onOpenEmail(notice);
                  } else {
                    setShowEmailModal(true);
                  }
                }}
                className="py-2.5 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
                title="Notifier formellement par email avec accusé"
              >
                <Mail className="w-4 h-4" />
                <span>Notifier par Email</span>
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                className="py-2.5 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-black shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger PDF</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modale Email si appelée en interne */}
      {showEmailModal && (
        <NoticeEmailModal
          isOpen={showEmailModal}
          notice={notice}
          onClose={() => setShowEmailModal(false)}
        />
      )}
    </>
  );
}
