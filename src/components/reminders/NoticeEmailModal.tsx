'use client';

import React, { useState } from 'react';
import {
  X,
  Mail,
  Send,
  Copy,
  CheckCircle2,
  Download,
  Building2,
  Scale,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Notice } from '@/lib/services/notice-service';
import { formatFCFA } from '@/lib/money/format';
import { generateNoticePDF } from '@/lib/export/pdf-download';
import { notifyAction } from '@/lib/notifications/action-notifier';

interface NoticeEmailModalProps {
  isOpen: boolean;
  notice: Notice | null;
  onClose: () => void;
}

export function NoticeEmailModal({ isOpen, notice, onClose }: NoticeEmailModalProps) {
  if (!isOpen || !notice) return null;

  const [recipientEmail, setRecipientEmail] = useState(notice.tenantEmail || '');
  const [copied, setCopied] = useState(false);

  const subject = `[NOTIFICATION OFFICIELLE DE PRÉAVIS] Réf: ${notice.id} — Congé pour ${notice.reasonTitle} — ${notice.tenantName}`;

  const emailBody = `À l'attention de M./Mme ${notice.tenantName},

OBJET : NOTIFICATION FORMELLE DE PRÉAVIS DE CONGÉ DU BAIL D'HABITATION
RÉFÉRENCE DU DOSSIER : ${notice.id}
DATE D'ÉMISSION : ${notice.noticeDate}
LOGEMENT CONCERNÉ : ${notice.propertyName} (${notice.unitNumber})
LOYER MENSUEL CONTRACTUEL : ${formatFCFA(notice.monthlyRent)}

Madame, Monsieur,

Par la présente, le Cabinet DIALLO Patrimoine & Gestion Immobilière, agissant au nom et pour le compte du propriétaire bailleur, vous notifie officiellement congé et résiliation de votre contrat de bail d'habitation concernant le logement mentionné ci-dessus.

1. MOTIF LÉGAL DU CONGÉ :
${notice.reasonTitle.toUpperCase()}
« ${notice.reasonDetails} »
${notice.beneficiaryName ? `\n• Bénéficiaire désigné de la reprise : ${notice.beneficiaryName}` : ''}${notice.salePrice ? `\n• Offre préalable d'acquisition (Droit légal de préemption) : ${formatFCFA(notice.salePrice)}` : ''}
• Fondement juridique : ${notice.legalBasis}

2. DÉLAI DE PRÉAVIS LÉGAL ET DATE IMPÉRATIVE DE LIBÉRATION DES LIEUX :
Conformément aux stipulations contractuelles et à la législation en vigueur dans l'espace UEMOA, un délai de préavis légal de ${notice.noticeMonths} mois commence à courir à compter de la réception de cette notification.

En conséquence, les lieux devront être intégralement libérés, vides de tout occupant et de tout meuble, au plus tard le :
>>> DATE D'ÉCHÉANCE ET DE REMISE DES CLÉS : ${notice.effectiveDate} à 18h00 <<<

3. PRESCRIPTIONS JURIDIQUES ET OBLIGATIONS JUSQU'AU DÉPART DÉFINITIF :
- Paiement des loyers : Le preneur reste tenu au paiement ponctuel et régulier des loyers et charges jusqu'à la remise effective de la totalité des clés.
- Dépôt de garantie (Caution) : La caution consignée ne peut en aucun cas s'imputer sur les derniers loyers exigibles.
- État des lieux de sortie : Fixé contradictoirement au terme du préavis avec relevé des index des compteurs.
- Restitution de la caution : Effectuée sous 30 jours conformément à la loi, déduction faite des éventuelles réparations locatives justifiées.

Le document officiel signé et scellé (PDF haute conformité) est joint à la présente notification.

Nous restons à votre entière disposition pour coordonner les modalités pratiques de l'état des lieux de sortie.

Veuillez agréer, Madame, Monsieur, l'expression de nos salutations distinguées.

Direction de la Gestion Immobilière
Cabinet DIALLO Patrimoine
Rue 340, Haie Vive, Cotonou (Bénin)
Tél : +229 97 12 34 56 • Email : gestion@locagestion.bj`;

  const handleOpenMailClient = () => {
    if (!recipientEmail.trim()) {
      alert('Veuillez renseigner une adresse email de destination pour le locataire.');
      return;
    }
    const mailtoUrl = `mailto:${encodeURIComponent(recipientEmail.trim())}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(emailBody)}`;
    window.location.href = mailtoUrl;
    notifyAction(
      `Messagerie ouverte pour notification du préavis ${notice.id} à ${recipientEmail}`,
      'Email Prêt à l’envoi',
      'success'
    );
  };

  const handleCopyText = async () => {
    try {
      const fullText = `Destinataire: ${recipientEmail}\nObjet: ${subject}\n\n${emailBody}`;
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      notifyAction('Texte de la notification copié dans le presse-papier !', 'Texte Copié', 'success');
      setTimeout(() => setCopied(false), 3000);
    } catch {
      alert('Impossible de copier automatiquement. Veuillez sélectionner le texte manuellement.');
    }
  };

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
    notifyAction('Téléchargement du PDF officiel de préavis pour pièce jointe', 'PDF Téléchargé', 'info');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* En-tête */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold border border-blue-500/30">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  Notification de Préavis par Email
                </h3>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {notice.id}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Transmission officielle du préavis de congé directement dans la boîte mail du locataire.
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

        {/* Corps */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Champs Destinataire & Objet */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Adresse Email du Locataire (Destinataire)
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="Ex: locataire@email.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Objet de l'Email
              </label>
              <input
                type="text"
                readOnly
                value={subject}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Aperçu du Contenu de l'Email */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-blue-600" />
                <span>Corps du Message Officiel</span>
              </label>
              <span className="text-[10px] text-slate-400">
                Formaté conforme droit immobilier UEMOA
              </span>
            </div>

            <textarea
              readOnly
              rows={12}
              value={emailBody}
              className="w-full p-4 rounded-2xl bg-white border border-slate-200 text-[11px] font-mono leading-relaxed text-slate-800 focus:outline-none select-all"
            />
          </div>

          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-[11px] font-medium">
                Conseil : Téléchargez également le PDF officiel ci-dessous pour le joindre en pièce jointe de votre email.
              </span>
            </div>
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 text-[11px] font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Télécharger le PDF</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopyText}
            className={`py-2.5 px-4 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
              copied
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Texte copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-600" />
                <span>Copier le texte complet</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              Fermer
            </button>

            <button
              type="button"
              onClick={handleOpenMailClient}
              className="py-2.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md shadow-blue-600/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Send className="w-4 h-4" />
              <span>Ouvrir dans ma messagerie (Email)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
