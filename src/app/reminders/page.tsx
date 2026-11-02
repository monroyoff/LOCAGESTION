'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  BellRing,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MessageCircle,
  Mail,
  Smartphone,
  ChevronRight,
  ShieldCheck,
  History,
  Sparkles,
  X,
  Home,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { UserSpace } from '@/lib/types';
import { WhatsAppReminderModal } from '@/components/dashboard/WhatsAppReminderModal';
import { notifyAction } from '@/lib/notifications/action-notifier';

export default function RemindersCenterPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState<UserSpace>('bailleur');
  const [collectiveAuto, setCollectiveAuto] = useState(true);
  const [selectedReminderTarget, setSelectedReminderTarget] = useState<any | null>(null);
  const [showCollectiveModal, setShowCollectiveModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    notifyAction(msg, 'Relance transmise !', 'success');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const pendingOverdue = [
    {
      id: 'rem-1',
      tenantName: 'Fatoumata Traoré',
      tenantPhone: '+223 76 12 34 56',
      property: 'Résidence Les Cocotiers (Appt B1)',
      period: 'Octobre 2026',
      expectedAmount: 180000,
      daysLate: 26,
      level: 'Relance Ferme',
      channel: 'WhatsApp & SMS',
    },
    {
      id: 'rem-2',
      tenantName: 'Sékou Camara',
      tenantPhone: '+224 62 12 34 56',
      property: 'Immeuble Palmier Royal (Appt 4B)',
      period: 'Octobre 2026',
      expectedAmount: 240000,
      daysLate: 21,
      level: 'Relance Ferme',
      channel: 'WhatsApp',
    },
  ];

  const reminderLogs = [
    {
      id: 'log-1',
      date: '25/10/2026 à 09:00',
      type: 'Rappel Collectif Automatique (Le 25)',
      recipients: '28 locataires',
      channel: 'WhatsApp Direct',
      status: 'Livré à 100%',
    },
    {
      id: 'log-2',
      date: '05/10/2026 à 10:30',
      type: 'Avis d’échéance mensuelle',
      recipients: '28 locataires',
      channel: 'SMS & Email',
      status: 'Livré',
    },
    {
      id: 'log-3',
      date: '20/10/2026 à 14:15',
      type: 'Relance ciblée impayé',
      recipients: 'Fatoumata Traoré',
      channel: 'WhatsApp',
      status: 'Lu (Double coche bleue)',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSpace={activeSpace}
        onSpaceChange={setActiveSpace}
      />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenQuickAction={() => {}}
        />

        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Bouton Retour Accueil sur Mobile & Desktop */}
          <div className="flex items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer hover:bg-slate-50"
            >
              <Home className="w-4 h-4 text-slate-600" />
              <span>← Retour au Tableau de bord</span>
            </button>
          </div>

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Centre de Relances Automatiques & Suivi
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-brand-50 text-brand-600 border border-brand-200">
                  UEMOA & CEMAC Workflow
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Planification des rappels collectifs du 25 et des relances ciblées d'impayés du 5.
              </p>
            </div>
          </div>

          {/* 2 Core Rules Cards (Le 25 et Le 5) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Règle 1: Rappel collectif du 25 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        Rappel Collectif Informatif
                      </h3>
                      <span className="text-[10px] text-blue-600 font-bold block">
                        Chaque 25 du mois à 09:00
                      </span>
                    </div>
                  </div>

                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => setCollectiveAuto(!collectiveAuto)}
                    className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                      collectiveAuto ? 'bg-brand-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        collectiveAuto ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  Prévient courtoisement l'ensemble des <strong>28 locataires actifs</strong> du loyer à venir pour le mois suivant, avec rappel des coordonnées Wave et Mobile Money.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Prochain envoi : <strong>25/11/2026</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setShowCollectiveModal(true)}
                  className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Envoyer manuellement
                </button>
              </div>
            </div>

            {/* Règle 2: Relances d'impayés à partir du 5 */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-900">
                        Relances Ciblées sur Impayés
                      </h3>
                      <span className="text-[10px] text-rose-600 font-bold block">
                        À partir du 5 de chaque mois
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-black">
                    {pendingOverdue.length} en attente
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  S'active uniquement pour les échéances impayées ou partielles, avec escalade paramétrable (Courtois, Ferme, Mise en demeure). S'arrête instantanément dès encaissement.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Canaux : WhatsApp Direct & SMS</span>
                <span className="text-xs font-extrabold text-emerald-600">Actif en continu ✓</span>
              </div>
            </div>
          </div>

          {/* Pending Overdue Tenants Action List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-4">
            <h3 className="text-sm font-black text-slate-900">
              Locataires en Retard Nécessitant une Relance Immédiate ({pendingOverdue.length})
            </h3>

            <div className="divide-y divide-slate-100">
              {pendingOverdue.map((item) => (
                <div
                  key={item.id}
                  className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-xs text-slate-900">{item.tenantName}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        +{item.daysLate} jours de retard
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      {item.property} • Échéance : {item.period}
                    </span>
                    <span className="text-xs font-black text-rose-600 block mt-1">
                      Reste dû : {formatFCFA(item.expectedAmount)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedReminderTarget({
                        tenantName: item.tenantName,
                        tenantPhone: item.tenantPhone,
                        propertyName: item.property,
                        unitNumber: 'Appt',
                        expectedAmount: item.expectedAmount,
                        period: item.period,
                      })
                    }
                    className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm flex items-center gap-2 transition-all self-start sm:self-auto cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Relancer sur WhatsApp</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery Logs */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-soft space-y-4">
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-500" />
              <span>Journal Récent d’Exécution des Relances</span>
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              {reminderLogs.map((log) => (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-bold text-slate-800 block">{log.type}</span>
                    <span className="text-[11px] text-slate-400">
                      {log.date} • Destinataires : {log.recipients} ({log.channel})
                    </span>
                  </div>
                  <span className="text-[11px] font-black text-emerald-600 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                    {log.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {selectedReminderTarget && (
        <WhatsAppReminderModal
          payment={selectedReminderTarget}
          onClose={() => setSelectedReminderTarget(null)}
        />
      )}

      {/* Modal Rappel Collectif du 25 */}
      {showCollectiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    Diffusion du Rappel Collectif (Le 25)
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Campagne informative pour 28 locataires actifs
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCollectiveModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 whitespace-pre-wrap leading-relaxed font-sans">
                {`Bonjour [Nom du Locataire],\n\nLe Cabinet DIALLO Patrimoine vous rappelle que l'échéance de votre loyer du mois prochain sera exigible le 05.\n\nModes de règlement acceptés :\n• Wave : +229 97 12 34 56 (Réf: Votre nom)\n• MTN Mobile Money : +229 95 12 34 56\n• Virement BOA Bénin\n\nVotre quittance certifiée vous sera immédiatement délivrée dès validation.\n\nExcellente fin de mois,\nLa Direction de Gestion`}
              </div>

              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200 text-[11px] text-blue-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Envoi simultané par WhatsApp et SMS avec journalisation de livraison.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCollectiveModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 font-bold hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCollectiveModal(false);
                    showToast('Rappel collectif diffusé avec succès aux 28 locataires actifs !');
                  }}
                  className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-black shadow-pink-glow flex items-center gap-1.5"
                >
                  <Send className="w-4 h-4" />
                  <span>Diffuser maintenant (28 locataires)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

