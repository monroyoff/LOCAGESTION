'use client';

import React, { useState } from 'react';
import {
  X,
  MessageCircle,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Send,
} from 'lucide-react';
import { PaymentTransaction } from '@/lib/types';
import { formatFCFA } from '@/lib/money/format';
import { notifyAction } from '@/lib/notifications/action-notifier';

interface WhatsAppReminderModalProps {
  payment: PaymentTransaction | null;
  onClose: () => void;
}

export function WhatsAppReminderModal({ payment, onClose }: WhatsAppReminderModalProps) {
  const [copied, setCopied] = useState(false);
  const [urgencyLevel, setUrgencyLevel] = useState<'courtois' | 'ferme'>('courtois');

  if (!payment) return null;

  const cleanPhone = payment.tenantPhone.replace(/[^0-9]/g, '');

  const messageText =
    urgencyLevel === 'courtois'
      ? `Bonjour M./Mme ${payment.tenantName},

J'espère que vous vous portez bien.

Sauf erreur de notre part, nous n'avons pas encore enregistré le règlement de votre loyer pour le logement situé à ${payment.propertyName} (${payment.unitNumber}), pour la période de ${payment.period}.

Montant restant dû : ${formatFCFA(payment.expectedAmount)}

Moyens de paiement acceptés :
• Wave au +229 01 95 44 44 30
• MTN Mobile Money / Moov Money au +229 01 95 44 44 30
• Virement bancaire sur compte BOA/UBA

Merci de bien vouloir nous faire parvenir la confirmation de votre règlement dès que possible.

Bien cordialement,
Direction DIALLO PATRIMOINE SARL`
      : `NOTIFICATION OFFICIELLE DE RETARD DE LOYER

À l'attention de M./Mme ${payment.tenantName},
Locataire du logement : ${payment.propertyName} (${payment.unitNumber})

Nous constatons à ce jour un impayé sur l'échéance de ${payment.period} d'un montant de ${formatFCFA(payment.expectedAmount)}.

Conformément aux clauses de votre contrat de bail et à la réglementation en vigueur, nous vous prions de régulariser cette situation sous 48 heures ouvrées par Wave, Mobile Money ou virement bancaire.

En l'absence de régularisation, une procédure formelle de mise en demeure sera engagée.

Pour toute difficulté, merci de nous contacter d'urgence au +229 01 95 44 44 30.

DIALLO PATRIMOINE SARL`;

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    notifyAction('Message de relance copié dans le presse-papier !', 'Relance copiée !', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 bg-emerald-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Relance WhatsApp Directe</h3>
              <p className="text-[10px] text-emerald-100">
                Destinataire : {payment.tenantName} ({payment.tenantPhone})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          {/* Level Switcher */}
          <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              type="button"
              onClick={() => setUrgencyLevel('courtois')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${urgencyLevel === 'courtois'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              Rappel Courtois (Standard)
            </button>
            <button
              type="button"
              onClick={() => setUrgencyLevel('ferme')}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${urgencyLevel === 'ferme'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
                }`}
            >
              Relance Ferme (+15j)
            </button>
          </div>

          {/* Message Preview Box */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-sans max-h-60 overflow-y-auto leading-relaxed">
            {messageText}
          </div>

          <div className="text-[11px] text-slate-400">
            Ce message sera envoyé directement au numéro <strong>{payment.tenantPhone}</strong> avec votre application WhatsApp.
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="py-2.5 px-4 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copié !' : 'Copier'}</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Ouvrir sur WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}

