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
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { UserSpace } from '@/lib/types';
import { MOCK_PROPERTIES } from '@/lib/data/mock-data';

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
  const [tenantName, setTenantName] = useState('Koffi Mensah');
  const [tenantEmail, setTenantEmail] = useState('koffi.mensah@fintech-africa.com');
  const [tenantPhone, setTenantPhone] = useState('+229 97 12 34 56');

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

  const handleFinish = () => {
    alert(`Contrat de bail scellé avec succès pour ${tenantName} ! Redirection vers la liste des baux.`);
    router.push('/leases');
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
                  Assistant de Création de Bail Conforme UEMOA
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
                <h2 className="text-base font-black text-slate-900">
                  Étape 2 : Identité du Locataire Titulaire
                </h2>

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
                  Étape 3 : Conditions Financières & Modalités UEMOA
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
                  onClick={handleFinish}
                  className="py-3 px-6 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white text-xs sm:text-sm font-black shadow-pink-glow flex items-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Finaliser & Émettre le Bail</span>
                </button>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
