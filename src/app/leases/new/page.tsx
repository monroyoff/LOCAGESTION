'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  FileText,
  Building,
  User,
  DollarSign,
  ShieldCheck,
  PenTool,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Lock,
  Download,
  Send,
  UserCheck,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { UserSpace } from '@/lib/types';
import { MOCK_PROPERTIES } from '@/lib/data/mock-data';
import { generateLeasePDF } from '@/lib/export/pdf-download';
import {
  REGISTERED_TENANTS,
  LeaseService,
  Lease,
} from '@/lib/services/lease-service';
import { TransmitLeaseModal } from '@/components/leases/TransmitLeaseModal';
import { notifySave } from '@/lib/notifications/action-notifier';

export default function NewLeasePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState<UserSpace>('bailleur');

  // Stepper state (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);

  // Form state
  const [selectedProperty, setSelectedProperty] = useState(MOCK_PROPERTIES[0].name);
  const [unitNumber, setUnitNumber] = useState('Appt B2 (3 pièces)');
  const [surface, setSurface] = useState('78');

  const [tenantMode, setTenantMode] = useState<'existing' | 'new'>('existing');
  const [selectedRegisteredTenantId, setSelectedRegisteredTenantId] = useState<string>('ten-01');
  const [tenantName, setTenantName] = useState('Koffi Mensah');
  const [tenantEmail, setTenantEmail] = useState('koffi.mensah@fintech-africa.com');
  const [tenantPhone, setTenantPhone] = useState('+229 97 00 11 22');

  const [isTransmitModalOpen, setIsTransmitModalOpen] = useState(false);
  const [preparedLease, setPreparedLease] = useState<Lease | null>(null);

  const handleSelectRegisteredTenant = (id: string) => {
    setSelectedRegisteredTenantId(id);
    const found = REGISTERED_TENANTS.find((t) => t.id === id);
    if (found) {
      setTenantName(found.name);
      setTenantEmail(found.email);
      setTenantPhone(found.phone);
      if (found.unit) setUnitNumber(found.unit);
      if (found.property) setSelectedProperty(found.property);
    }
  };

  const [monthlyRent, setMonthlyRent] = useState('220000');
  const [charges, setCharges] = useState('30000');
  const [depositMonths, setDepositMonths] = useState('3');
  const [advanceMonths, setAdvanceMonths] = useState('2');
  const [paymentDay, setPaymentDay] = useState('5');

  const [leaseType, setLeaseType] = useState('habitation');
  const [durationMonths, setDurationMonths] = useState('12');

  // Signature canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // Initialize canvas
  useEffect(() => {
    if (currentStep === 5 && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [currentStep]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
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
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleFinish = () => {
    const signatureData =
      canvasRef.current?.toDataURL('image/png') ||
      'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><text x="10" y="35" font-family="cursive" font-size="22" fill="%23ec4899">Mamadou Diallo</text></svg>';

    const lease: Lease = {
      id: `BAIL-2026-${Math.floor(100 + Math.random() * 900)}`,
      tenant: tenantName,
      tenantId: tenantMode === 'existing' ? selectedRegisteredTenantId : undefined,
      tenantEmail,
      tenantPhone,
      property: selectedProperty,
      unit: unitNumber,
      rent: parseInt(monthlyRent, 10) || 220000,
      deposit: (parseInt(monthlyRent, 10) || 220000) * (parseInt(depositMonths, 10) || 3),
      charges: parseInt(charges, 10) || 30000,
      startDate: '2026-11-01',
      endDate: '2029-10-31',
      durationMonths: parseInt(durationMonths, 10) || 36,
      status: 'en_attente_signature',
      landlordSignature: {
        signedBy: 'Mamadou Diallo',
        date: new Date().toLocaleDateString('fr-FR'),
        signatureDataUrl: signatureData,
      },
      transmittedAt: new Date().toLocaleDateString('fr-FR'),
    };

    setPreparedLease(lease);
    setIsTransmitModalOpen(true);
  };

  const steps = [
    { num: 1, title: 'Lot & Bien', icon: Building },
    { num: 2, title: 'Locataire', icon: User },
    { num: 3, title: 'Conditions FCFA', icon: DollarSign },
    { num: 4, title: 'Clauses Juridiques', icon: ShieldCheck },
    { num: 5, title: 'Signature Électronique', icon: PenTool },
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

        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-4xl mx-auto w-full">
          {/* Bouton Retour Accueil sur Mobile & Desktop */}
          <div className="flex items-center gap-2 pb-1">
            <Link
              href="/leases"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer hover:bg-slate-50"
            >
              <ArrowLeft className="w-4 h-4 text-slate-600" />
              <span>← Retour aux Contrats de Bail</span>
            </Link>
          </div>

          {/* Top Title */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href="/leases"
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                </Link>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Assistant de Création de Bail Conforme UEMOA & CEMAC
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-1 pl-8">
                Génération en 5 étapes avec scellement numérique et piste d’audit.
              </p>
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/80 shadow-soft">
            <div className="grid grid-cols-5 gap-2 text-center">
              {steps.map((s) => {
                const Icon = s.icon;
                const isCurrent = currentStep === s.num;
                const isPassed = currentStep > s.num;

                return (
                  <div
                    key={s.num}
                    onClick={() => setCurrentStep(s.num)}
                    className="flex flex-col items-center cursor-pointer group"
                  >
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-all ${
                        isCurrent
                          ? 'bg-brand-500 text-white shadow-pink-glow scale-110'
                          : isPassed
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span
                      className={`text-[10px] font-bold mt-2 truncate w-full ${
                        isCurrent
                          ? 'text-brand-600 font-black'
                          : isPassed
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {s.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Body Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft min-h-[420px] flex flex-col justify-between">
            {/* Step 1: Bien & Lot */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h2 className="text-base font-black text-slate-900">
                  Étape 1 : Désignation de l’Immeuble & du Lot Loué
                </h2>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Résidence / Bien
                    </label>
                    <select
                      value={selectedProperty}
                      onChange={(e) => setSelectedProperty(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800"
                    >
                      {MOCK_PROPERTIES.map((p) => (
                        <option key={p.id} value={p.name}>
                          {p.name} ({p.address}, {p.city})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Numéro de porte / Lot
                      </label>
                      <input
                        type="text"
                        value={unitNumber}
                        onChange={(e) => setUnitNumber(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Surface habitable (m²)
                      </label>
                      <input
                        type="number"
                        value={surface}
                        onChange={(e) => setSurface(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Locataire */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-black text-slate-900">
                    Étape 2 : Identité du Locataire Titulaire
                  </h2>
                  <span className="text-xs text-brand-600 font-bold bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200/60 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Compte plateforme</span>
                  </span>
                </div>

                {/* Sélecteur de mode : Locataire déjà créé ou Nouveau */}
                <div className="p-1.5 bg-slate-100 rounded-2xl flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setTenantMode('existing');
                      handleSelectRegisteredTenant('ten-01');
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      tenantMode === 'existing'
                        ? 'bg-white text-slate-900 shadow-sm font-black'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5 text-brand-500" />
                    <span>Locataire enregistré (Compte déjà créé)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTenantMode('new')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      tenantMode === 'new'
                        ? 'bg-white text-slate-900 shadow-sm font-black'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Nouveau locataire (Saisie libre)</span>
                  </button>
                </div>

                {tenantMode === 'existing' && (
                  <div className="p-4 rounded-2xl bg-brand-50/50 border border-brand-200/60 space-y-2">
                    <label className="text-xs font-black text-brand-950 block">
                      Sélectionnez le compte locataire qui recevra le bail pour contresignature :
                    </label>
                    <select
                      value={selectedRegisteredTenantId}
                      onChange={(e) => handleSelectRegisteredTenant(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-white border border-brand-300 text-xs font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-brand-500 focus:outline-none cursor-pointer"
                    >
                      {REGISTERED_TENANTS.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} — {t.unit || 'Lot'} ({t.property || 'Résidence'}) • {t.email}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      ✓ Dès signature du bailleur, le contrat apparaîtra avec la mention{' '}
                      <strong className="text-amber-700">« En attente de signature »</strong> et sera
                      transmis directement dans son Portail Locataire.
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Nom complet du locataire
                    </label>
                    <input
                      type="text"
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Numéro WhatsApp / Mobile
                      </label>
                      <input
                        type="text"
                        value={tenantPhone}
                        onChange={(e) => setTenantPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Adresse Email
                      </label>
                      <input
                        type="email"
                        value={tenantEmail}
                        onChange={(e) => setTenantEmail(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Conditions Financières */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h2 className="text-base font-black text-slate-900">
                  Étape 3 : Conditions Financières & Modalités UEMOA & CEMAC
                </h2>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Loyer mensuel principal (FCFA)
                    </label>
                    <input
                      type="number"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Charges forfaitaires (FCFA)
                    </label>
                    <input
                      type="number"
                      value={charges}
                      onChange={(e) => setCharges(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Caution / Dépôt de garantie
                    </label>
                    <select
                      value={depositMonths}
                      onChange={(e) => setDepositMonths(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold"
                    >
                      <option value="1">1 mois ({formatFCFA(Number(monthlyRent) * 1)})</option>
                      <option value="2">2 mois ({formatFCFA(Number(monthlyRent) * 2)})</option>
                      <option value="3">3 mois ({formatFCFA(Number(monthlyRent) * 3)}) — Standard</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Jour d’échéance du loyer
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={paymentDay}
                      onChange={(e) => setPaymentDay(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs">
                  <span className="font-extrabold text-emerald-900 block mb-0.5">
                    Total exigible à l’entrée dans les lieux :
                  </span>
                  <div className="text-xl font-black text-emerald-800">
                    {formatFCFA(
                      Number(monthlyRent) +
                        Number(charges) +
                        Number(monthlyRent) * Number(depositMonths)
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-700">
                    (1er mois de loyer + {depositMonths} mois de caution)
                  </span>
                </div>
              </div>
            )}

            {/* Step 4: Clauses Juridiques */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <h2 className="text-base font-black text-slate-900">
                  Étape 4 : Modèle Juridique & Clauses Conformes OHADA
                </h2>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                  <div className="font-extrabold text-slate-900">
                    Clauses types incluses dans ce contrat :
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                    <li>Destination exclusive à usage d'habitation bourgeoise</li>
                    <li>Clause résolutoire automatique en cas d'impayé supérieur à 30 jours</li>
                    <li>Interdiction stricte de sous-location sans accord écrit du bailleur</li>
                    <li>Règlement privilégié par Mobile Money (Wave, MTN, Orange, Moov)</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Step 5: Signature Électronique Tactile */}
            {currentStep === 5 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-slate-900">
                      Étape 5 : Signature Tactile & Scellement Numérique
                    </h2>
                    <p className="text-xs text-slate-500">
                      Signez au doigt ou à la souris dans l’encadré ci-dessous.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={clearSignature}
                    className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Effacer</span>
                  </button>
                </div>

                {/* Signature Canvas Pad */}
                <div className="border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden bg-white shadow-inner relative h-48">
                  <canvas
                    ref={canvasRef}
                    width={680}
                    height={192}
                    className="w-full h-full cursor-crosshair touch-none"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />

                  {!hasSignature && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs font-semibold">
                      Apposez votre signature ici (Bailleur : Mamadou Diallo)
                    </div>
                  )}
                </div>

                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    La signature sera scellée avec horodatage certifié, adresse IP et hash SHA-256 infalsifiable.
                  </span>
                </div>
              </div>
            )}

            {/* Bottom Stepper Navigation */}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep - 1)}
                  className="py-2.5 px-5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Précédent</span>
                </button>
              ) : (
                <div />
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="py-2.5 px-6 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all"
                >
                  <span>Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!hasSignature}
                  onClick={handleFinish}
                  className={`py-3 px-6 rounded-2xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-pink-glow transition-all ${
                    hasSignature
                      ? 'bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white cursor-pointer active:scale-95'
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Signer & Transmettre au Locataire</span>
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Modal de Transmission du Bail au Locataire */}
      {preparedLease && (
        <TransmitLeaseModal
          lease={preparedLease}
          isOpen={isTransmitModalOpen}
          onClose={() => setIsTransmitModalOpen(false)}
          onTransmittedSuccess={(transmittedLease) => {
            setIsTransmitModalOpen(false);
            notifySave(
              `Le contrat ${transmittedLease.id} a été validé et transmis à ${transmittedLease.tenant}.`,
              'Bail enregistré & transmis !'
            );
            router.push('/leases');
          }}
        />
      )}

      {/* Modal de Succès & Scellement de Bail Direct */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Scellement Électronique Conforme UEMOA & CEMAC
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                Bail Émis avec Succès !
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Le contrat de bail pour <strong>{tenantName}</strong> sur le lot <strong>{unitNumber}</strong> a été horodaté et archivé avec sa piste d'audit numérique.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Réf. Contrat :</span>
                <span className="font-mono font-bold text-slate-800">BAIL-2026-N09</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Loyer Mensuel :</span>
                <span className="font-extrabold text-brand-600">{formatFCFA(parseInt(monthlyRent, 10) || 220000)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Caution Déposée :</span>
                <span className="font-bold text-slate-700">{formatFCFA((parseInt(monthlyRent, 10) || 220000) * (parseInt(depositMonths, 10) || 3))}</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  generateLeasePDF({
                    id: 'BAIL-2026-N09',
                    tenantName,
                    propertyName: selectedProperty,
                    unit: unitNumber,
                    rent: parseInt(monthlyRent, 10) || 220000,
                    deposit: (parseInt(monthlyRent, 10) || 220000) * (parseInt(depositMonths, 10) || 3),
                    startDate: '2026-11-01',
                  });
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Télécharger le Bail</span>
              </button>

              <button
                type="button"
                onClick={() => router.push('/leases')}
                className="flex-1 py-2.5 px-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black shadow-pink-glow transition-all cursor-pointer"
              >
                <span>Voir les baux</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

