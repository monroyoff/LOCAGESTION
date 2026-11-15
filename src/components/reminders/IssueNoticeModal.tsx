'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  FileWarning,
  Home,
  Tag,
  AlertTriangle,
  Hammer,
  CalendarCheck,
  DoorOpen,
  Calendar,
  Send,
  Download,
  MessageCircle,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  Building2,
  Scale,
  FileText,
} from 'lucide-react';
import {
  Notice,
  NoticeReasonType,
  NoticeDeliveryMethod,
  NOTICE_REASONS_CATALOG,
  NoticeService,
} from '@/lib/services/notice-service';
import { LeaseService, RegisteredTenant } from '@/lib/services/lease-service';
import { formatFCFA } from '@/lib/money/format';
import { generateNoticePDF } from '@/lib/export/pdf-download';
import { notifyAction } from '@/lib/notifications/action-notifier';
import { NoticeEmailModal } from './NoticeEmailModal';

interface IssueNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNoticeCreated: (notice: Notice) => void;
  preselectedTenantName?: string;
}

export function IssueNoticeModal({
  isOpen,
  onClose,
  onNoticeCreated,
  preselectedTenantName,
}: IssueNoticeModalProps) {
  const [registeredTenants, setRegisteredTenants] = useState<RegisteredTenant[]>(() => {
    if (typeof window !== 'undefined') {
      return LeaseService.getRegisteredTenants();
    }
    return [];
  });

  const [selectedTenantKey, setSelectedTenantKey] = useState<string>('');
  const [tenantName, setTenantName] = useState<string>('');
  const [tenantPhone, setTenantPhone] = useState<string>('');
  const [tenantEmail, setTenantEmail] = useState<string>('');
  const [propertyName, setPropertyName] = useState<string>('');
  const [unitNumber, setUnitNumber] = useState<string>('');
  const [monthlyRent, setMonthlyRent] = useState<number>(0);

  const [reasonType, setReasonType] = useState<NoticeReasonType>('reprise_personnelle');
  const [reasonDetails, setReasonDetails] = useState<string>('');
  const [beneficiaryName, setBeneficiaryName] = useState<string>('');
  const [salePrice, setSalePrice] = useState<number>(0);
  const [noticeMonths, setNoticeMonths] = useState<number>(3);
  const [deliveryMethod, setDeliveryMethod] = useState<NoticeDeliveryMethod>('huissier');

  // Dates
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const [noticeDateInput, setNoticeDateInput] = useState<string>(todayStr);

  const calculateEffectiveDate = (startDate: string, months: number): string => {
    try {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + months);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const [effectiveDateInput, setEffectiveDateInput] = useState<string>(() =>
    calculateEffectiveDate(todayStr, 3)
  );

  const [departureInspectionDate, setDepartureInspectionDate] = useState<string>(() =>
    calculateEffectiveDate(todayStr, 3)
  );

  // Modale Email d'aperçu avant envoi
  const [noticeForEmailPreview, setNoticeForEmailPreview] = useState<Notice | null>(null);

  // CLIC SUR UN MOTIF : REMPLISSAGE AUTOMATIQUE SYSTÉMATIQUE DE LA CASE EXPOSÉ DES MOTIFS
  const handleSelectReason = (type: NoticeReasonType) => {
    setReasonType(type);
    const catalogItem = NOTICE_REASONS_CATALOG.find((c) => c.type === type);
    if (catalogItem) {
      setNoticeMonths(catalogItem.recommendedMonths);
      setEffectiveDateInput(calculateEffectiveDate(noticeDateInput, catalogItem.recommendedMonths));
      setDepartureInspectionDate(calculateEffectiveDate(noticeDateInput, catalogItem.recommendedMonths));
      // Remplissage automatique et immédiat de l'exposé des motifs avec le contenu du motif cliqué
      setReasonDetails(catalogItem.defaultExpose);
    }
  };

  // Pré-remplissage uniquement si locataire pré-sélectionné
  useEffect(() => {
    if (preselectedTenantName) {
      const match = registeredTenants.find(
        (t) => t.name.toLowerCase() === preselectedTenantName.toLowerCase()
      );
      if (match) {
        setSelectedTenantKey(match.id);
        setTenantName(match.name);
        setTenantPhone(match.phone);
        setTenantEmail(match.email);
        if (match.property) setPropertyName(match.property);
        if (match.unit) setUnitNumber(match.unit);
      } else {
        setTenantName(preselectedTenantName);
      }
    }
  }, [preselectedTenantName, registeredTenants]);

  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenantKey(tenantId);
    if (tenantId === 'custom' || !tenantId) {
      setTenantName('');
      setTenantPhone('');
      setTenantEmail('');
      setPropertyName('');
      setUnitNumber('');
      return;
    }
    const t = registeredTenants.find((item) => item.id === tenantId);
    if (t) {
      setTenantName(t.name);
      setTenantPhone(t.phone);
      setTenantEmail(t.email);
      if (t.property) setPropertyName(t.property);
      if (t.unit) setUnitNumber(t.unit);
    }
  };

  const handleMonthsChange = (months: number) => {
    setNoticeMonths(months);
    setEffectiveDateInput(calculateEffectiveDate(noticeDateInput, months));
    setDepartureInspectionDate(calculateEffectiveDate(noticeDateInput, months));
  };

  const formatDateDisplay = (iso: string): string => {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return iso;
  };

  const activeCatalog = NOTICE_REASONS_CATALOG.find((c) => c.type === reasonType)!;

  const buildNoticePayload = (): Omit<Notice, 'id' | 'createdAt'> => {
    const formattedNoticeDate = formatDateDisplay(noticeDateInput);
    const formattedEffectiveDate = formatDateDisplay(effectiveDateInput);
    const formattedInspectionDate = formatDateDisplay(departureInspectionDate);

    return {
      tenantName: tenantName.trim() || 'Locataire',
      tenantPhone: tenantPhone.trim() || '+229 97 00 00 00',
      tenantEmail: tenantEmail.trim() || undefined,
      propertyName,
      unitNumber,
      monthlyRent,
      reasonType,
      reasonTitle: activeCatalog.title,
      reasonDetails: reasonDetails.trim() || activeCatalog.defaultExpose,
      noticeMonths,
      noticeDate: formattedNoticeDate,
      effectiveDate: formattedEffectiveDate,
      deliveryMethod,
      status: 'notifie' as const,
      beneficiaryName: reasonType === 'reprise_personnelle' ? beneficiaryName : undefined,
      salePrice: reasonType === 'vente' ? salePrice : undefined,
      legalBasis: activeCatalog.legalBasis,
      departureInspectionDate: formattedInspectionDate,
      notes: `Préavis formel émis le ${formattedNoticeDate} avec délai de ${noticeMonths} mois.`,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName.trim()) {
      alert('Veuillez indiquer le nom du locataire.');
      return;
    }

    const payload = buildNoticePayload();
    const created = NoticeService.addNotice(payload);
    onNoticeCreated(created);
    notifyAction(
      `Préavis ${created.id} émis avec succès pour ${created.tenantName} (${created.reasonTitle})`,
      'Préavis Formel Émis !',
      'success'
    );
    onClose();
  };

  const handleDownloadPDF = () => {
    const payload = buildNoticePayload();
    generateNoticePDF({
      ...payload,
      id: 'PREAV-2026-SIMUL',
    });
    notifyAction('Téléchargement du document officiel de préavis en cours...', 'PDF Prêt', 'info');
  };

  const handleShareWhatsApp = () => {
    const payload = buildNoticePayload();
    const phoneClean = payload.tenantPhone.replace(/[^0-9]/g, '');
    const message = `*NOTIFICATION FORMELLE DE CONGÉ / PRÉAVIS DE BAIL*\n\nBonjour M./Mme *${payload.tenantName}*,\n\nNous vous notifions officiellement par la présente le préavis de congé concernant votre logement : *${payload.propertyName} (${payload.unitNumber})*.\n\n📌 *Motif du congé :* ${payload.reasonTitle}\n⚖️ *Fondement juridique :* ${payload.legalBasis}\n⏳ *Délai de préavis légal :* ${payload.noticeMonths} mois\n🗓️ *Date impérative de libération des lieux :* ${payload.effectiveDate}\n\nConformément à la réglementation UEMOA, le paiement régulier des loyers demeure obligatoire jusqu'à la remise effective de l'intégralité des clés.\n\nL'état des lieux de sortie contradictoire et la restitution de caution seront organisés à l'échéance du préavis.\n\n*Cabinet DIALLO Patrimoine & Gestion Immobilière*\nContact : +229 97 12 34 56`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneClean}?text=${encoded}`, '_blank');
  };

  const handleOpenEmailModal = () => {
    const payload = buildNoticePayload();
    const simulatedNotice: Notice = {
      ...payload,
      id: 'PREAV-2026-NOUV',
      createdAt: new Date().toISOString(),
    };
    setNoticeForEmailPreview(simulatedNotice);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
        <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-6 max-h-[92vh]">
          {/* Header Modal */}
          <div className="px-5 sm:px-7 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold border border-rose-500/30">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-white">
                    Émettre un Préavis Formel de Congé
                  </h3>
                  <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    Droit UEMOA / OHADA
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Notification officielle de résiliation de bail pour motif légal certifié (par Huissier, Email ou WhatsApp).
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

          {/* Scrollable Form Body */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
            {/* Étape 1 : Choix du Locataire & Logement */}
            <div className="space-y-3">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-500" />
                <span>1. Locataire & Logement Concerné</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Sélectionner un locataire actif
                  </label>
                  <select
                    value={selectedTenantKey}
                    onChange={(e) => handleSelectTenant(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="">Sélectionner un locataire...</option>
                    {registeredTenants.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} {t.property ? `• ${t.property} (${t.unit || ''})` : ''}
                      </option>
                    ))}
                    <option value="custom">+ Autre locataire (saisie libre)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Nom complet du locataire
                  </label>
                  <input
                    type="text"
                    required
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="Nom complet du locataire"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Email du locataire (Pour notification par mail)
                  </label>
                  <input
                    type="email"
                    value={tenantEmail}
                    onChange={(e) => setTenantEmail(e.target.value)}
                    placeholder="locataire@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Téléphone WhatsApp du locataire
                  </label>
                  <input
                    type="text"
                    required
                    value={tenantPhone}
                    onChange={(e) => setTenantPhone(e.target.value)}
                    placeholder="+229 97 00 11 22"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Immeuble / Propriété
                  </label>
                  <input
                    type="text"
                    required
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Lot / Numéro de porte & Loyer (FCFA)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      value={unitNumber}
                      onChange={(e) => setUnitNumber(e.target.value)}
                      placeholder="Appt A3"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                    <input
                      type="number"
                      required
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(Number(e.target.value))}
                      placeholder="220000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Étape 2 : Raison / Motif Légal du Préavis (6 Motifs Cliquables avec Remplissage Automatique) */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <label className="text-xs font-black uppercase text-slate-700 tracking-wider flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-brand-500" />
                  <span>2. Motif Légal du Préavis (Cliquez sur un motif pour remplir l'exposé)</span>
                </label>
                <span className="text-[11px] text-brand-600 font-bold bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200/80 w-fit">
                  ✓ Remplissage automatique de l'exposé au clic
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {NOTICE_REASONS_CATALOG.map((item) => {
                  const isSelected = reasonType === item.type;
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleSelectReason(item.type)}
                      className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-brand-500 scale-[1.01]'
                          : 'bg-slate-50 hover:bg-white text-slate-800 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                              isSelected
                                ? 'bg-brand-500 text-white'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            Préavis : {item.recommendedMonths} mois
                          </span>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />}
                        </div>
                        <h4
                          className={`text-xs font-black leading-tight ${
                            isSelected ? 'text-white' : 'text-slate-900'
                          }`}
                        >
                          {item.title}
                        </h4>
                        <p
                          className={`text-[11px] mt-1 line-clamp-2 ${
                            isSelected ? 'text-slate-300' : 'text-slate-500'
                          }`}
                        >
                          {item.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Champs additionnels selon le motif */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Fondement juridique : {activeCatalog.legalBasis}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold">
                    Délai légal recommandé : {activeCatalog.recommendedMonths} mois
                  </span>
                </div>

                {reasonType === 'reprise_personnelle' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Bénéficiaire de la reprise (Propriétaire, conjoint, ascendant ou descendant direct)
                    </label>
                    <input
                      type="text"
                      value={beneficiaryName}
                      onChange={(e) => setBeneficiaryName(e.target.value)}
                      placeholder="Ex: Propriétaire, conjoint ou descendant direct"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                )}

                {reasonType === 'vente' && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">
                      Prix de vente notifié au locataire pour l'exercice du droit de préemption (FCFA)
                    </label>
                    <input
                      type="number"
                      value={salePrice}
                      onChange={(e) => setSalePrice(Number(e.target.value))}
                      placeholder="45000000"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-black text-slate-800">
                      Exposé des motifs & justifications (Rempli automatiquement selon le motif cliqué)
                    </label>
                    <button
                      type="button"
                      onClick={() => setReasonDetails(activeCatalog.defaultExpose)}
                      className="text-[10px] font-bold text-brand-600 hover:text-brand-700 underline cursor-pointer"
                    >
                      Réinitialiser au texte type
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={reasonDetails}
                    onChange={(e) => setReasonDetails(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 leading-relaxed font-sans shadow-2xs"
                    placeholder="L'exposé se remplit automatiquement dès que vous cliquez sur l'un des motifs ci-dessus..."
                  />
                </div>
              </div>
            </div>

            {/* Étape 3 : Délais & Calendrier d'Exécution */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-brand-500" />
                <span>3. Délais Légaux & Dates d'Effet</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Durée du préavis
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[1, 2, 3].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => handleMonthsChange(m)}
                        className={`py-2 rounded-xl text-xs font-black border transition-all cursor-pointer text-center ${
                          noticeMonths === m
                            ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {m} {m === 1 ? 'mois' : 'mois'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Date de notification
                  </label>
                  <input
                    type="date"
                    value={noticeDateInput}
                    onChange={(e) => {
                      setNoticeDateInput(e.target.value);
                      setEffectiveDateInput(calculateEffectiveDate(e.target.value, noticeMonths));
                      setDepartureInspectionDate(calculateEffectiveDate(e.target.value, noticeMonths));
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Libération des lieux au plus tard
                  </label>
                  <input
                    type="date"
                    value={effectiveDateInput}
                    onChange={(e) => setEffectiveDateInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-300 text-xs font-black text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Mode de délivrance
                  </label>
                  <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value as NoticeDeliveryMethod)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  >
                    <option value="email_officiel">Notification par Email Officiel</option>
                    <option value="huissier">Huissier / Commissaire de Justice</option>
                    <option value="main_propre">Remise en main propre c/ décharge</option>
                    <option value="courrier_recommande">Courrier Recommandé avec AR</option>
                    <option value="whatsapp_email">WhatsApp Officiel & Email</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Aperçu Synthétique */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white space-y-2">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-rose-400 uppercase tracking-wider text-[10px]">
                  Synthèse Juridique de la Notification
                </span>
                <span className="text-slate-400 font-normal">Préavis de {noticeMonths} mois</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-sans">
                « Notification de congé délivrée à <strong>{tenantName || 'M./Mme le Locataire'}</strong> pour{' '}
                <strong>{activeCatalog.title}</strong> concernant le lot{' '}
                <strong>{unitNumber} ({propertyName})</strong>. Les lieux devront être intégralement libérés
                au plus tard le <strong>{formatDateDisplay(effectiveDateInput)}</strong>. »
              </p>
            </div>

            {/* Footer Actions */}
            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleDownloadPDF}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Prévisualiser et télécharger le PDF officiel"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  <span>PDF Officiel</span>
                </button>

                <button
                  type="button"
                  onClick={handleOpenEmailModal}
                  className="py-2.5 px-3.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Prévisualiser et transmettre le préavis par Email"
                >
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>Notifier par Email</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Transmettre le texte du préavis par WhatsApp"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold hover:bg-slate-50 text-slate-700 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <Send className="w-4 h-4" />
                  <span>Émettre & Enregistrer le Préavis</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Modale d'Aperçu & Notification Email */}
      {noticeForEmailPreview && (
        <NoticeEmailModal
          isOpen={!!noticeForEmailPreview}
          notice={noticeForEmailPreview}
          onClose={() => setNoticeForEmailPreview(null)}
        />
      )}
    </>
  );
}
