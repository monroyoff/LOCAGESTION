'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  FileText,
  Building,
  Building2,
  Home,
  Bed,
  DoorOpen,
  Layers,
  MapPin,
  Plus,
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
  Zap,
  Mail,
  Smartphone,
  Copy,
  Check,
  Scale,
  BookOpen,
  Info,
  AlertCircle,
  ChevronDown,
  ChevronUp,
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
import { getUserResidenceCountry } from '@/lib/services/geo-service';
import {
  CountryTenancyLaw,
  COUNTRIES_TENANCY_LAWS,
  SUPPORTED_TENANCY_COUNTRIES,
  resolveCountryTenancyLaw,
} from '@/lib/legal/country-tenancy-law';

const LEASE_PROPERTY_TYPES = [
  { id: 'chambre_individuelle', label: 'Chambre individuelle', sub: 'Entrée coucher', icon: Bed },
  { id: 'chambre_salon', label: 'Chambre salon sanitaire', sub: 'Sanitaires privés', icon: DoorOpen },
  { id: 'studio', label: 'Studio meublé / américain', sub: 'Kitchenette intégrée', icon: Building2 },
  { id: 'appartement', label: 'Appartement (2 à 4 pièces)', sub: 'Standing résidentiel', icon: Home },
  { id: 'villa', label: 'Maison / Villa complète', sub: 'Cour ou jardin privé', icon: Building },
  { id: 'commercial', label: 'Boutique / Local commercial', sub: 'Usage professionnel', icon: Layers },
];

export default function NewLeasePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState<UserSpace>('bailleur');

  // Stepper state (1 to 5)
  const [currentStep, setCurrentStep] = useState(1);

  // Form state - Bien & Lot / Chambre
  const [propertyMode, setPropertyMode] = useState<'portfolio' | 'manual'>('portfolio');

  // Mode Patrimoine
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(MOCK_PROPERTIES[0].id);
  const [selectedProperty, setSelectedProperty] = useState(MOCK_PROPERTIES[0].name);
  const [selectedUnitMode, setSelectedUnitMode] = useState<'catalog' | 'custom'>('catalog');
  const [customUnitNumber, setCustomUnitNumber] = useState('');

  // Mode Saisie Directe
  const [manualPropertyName, setManualPropertyName] = useState('');
  const [manualPropertyType, setManualPropertyType] = useState('chambre_salon');
  const [manualUnitName, setManualUnitName] = useState('');
  const [manualCity, setManualCity] = useState('Cotonou');
  const [manualAddress, setManualAddress] = useState('');

  // Données communes
  const [unitNumber, setUnitNumber] = useState('Appt B2 (3 pièces)');
  const [surface, setSurface] = useState('78');

  // Bien sélectionné dans le patrimoine
  const currentProperty =
    MOCK_PROPERTIES.find((p) => p.id === selectedPropertyId) || MOCK_PROPERTIES[0];

  // Pays de juridiction & droit applicable
  const [selectedCountryName, setSelectedCountryName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return getUserResidenceCountry() || 'Bénin';
    }
    return 'Bénin';
  });

  const activeLaw: CountryTenancyLaw = resolveCountryTenancyLaw(selectedCountryName);

  // Clauses juridiques optionnelles & interactives
  const [optionalClauses, setOptionalClauses] = useState({
    indexation: true,
    animals: false,
    worksApproval: true,
    lateFee: true,
    sublettingProhibition: true,
  });
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
  const [isCopiedAllClauses, setIsCopiedAllClauses] = useState(false);

  const handleCopyAllClauses = () => {
    const text = activeLaw.clauses
      .map((c) => `${c.articleNumber} : ${c.title}\n${c.fullText}\n`)
      .join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(
        `CONTRAT OFFICIEL DE BAIL D'HABITATION CONFORME - ${activeLaw.countryName.toUpperCase()}\n` +
          `Référence Légale : ${activeLaw.officialLawReference} (${activeLaw.officialLawTitle})\n\n` +
          text
      );
      setIsCopiedAllClauses(true);
      setTimeout(() => setIsCopiedAllClauses(false), 3000);
    }
  };

  // Propriété et unité résolues pour l'ensemble du bail
  const resolvedPropertyName =
    propertyMode === 'portfolio'
      ? selectedProperty
      : manualPropertyName.trim() || 'Bien en saisie directe';

  const resolvedUnitName =
    propertyMode === 'portfolio'
      ? selectedUnitMode === 'custom'
        ? customUnitNumber.trim() || 'Lot personnalisé'
        : unitNumber
      : manualUnitName.trim() ||
        `${LEASE_PROPERTY_TYPES.find((o) => o.id === manualPropertyType)?.label || 'Logement'} • ${surface || 0} m²`;

  const handleSelectProperty = (propId: string) => {
    setSelectedPropertyId(propId);
    const p = MOCK_PROPERTIES.find((item) => item.id === propId);
    if (p) {
      setSelectedProperty(p.name);
      if (p.country) {
        setSelectedCountryName(p.country);
      }
      // Sélectionner par défaut le premier lot vacant ou le premier lot
      const defaultUnit = p.unitsList?.find((u) => u.status === 'vacant') || p.unitsList?.[0];
      if (defaultUnit) {
        setSelectedUnitMode('catalog');
        setUnitNumber(`${defaultUnit.unit} (${defaultUnit.type})`);
        setSurface(String(defaultUnit.surface || ''));
        if (defaultUnit.rent) {
          setMonthlyRent(String(defaultUnit.rent));
        }
      }
    }
  };

  const handleSelectUnitFromCatalog = (unitObj: {
    unit: string;
    type: string;
    surface: number;
    rent: number;
    status: string;
  }) => {
    setSelectedUnitMode('catalog');
    setUnitNumber(`${unitObj.unit} (${unitObj.type})`);
    setSurface(String(unitObj.surface || ''));
    if (unitObj.rent) {
      setMonthlyRent(String(unitObj.rent));
    }
  };

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
      if (found.property) {
        setSelectedProperty(found.property);
        const match = MOCK_PROPERTIES.find((p) => p.name === found.property);
        if (match) {
          setSelectedPropertyId(match.id);
          if (match.country) {
            setSelectedCountryName(match.country);
          }
        }
      }
    }
  };

  // Step 2 nouveau locataire - invitations SMS & Email
  const [notifyBySms, setNotifyBySms] = useState(true);
  const [notifyByEmail, setNotifyByEmail] = useState(true);
  const [generatedInvitationCode] = useState(
    () => `LOCA-INV-${Math.floor(1000 + Math.random() * 9000)}`
  );

  // Step 3 conditions financières
  const [monthlyRent, setMonthlyRent] = useState('220000');
  const [charges, setCharges] = useState('30000');
  const [includeFirstRent, setIncludeFirstRent] = useState(true);
  const [depositMonths, setDepositMonths] = useState('3');
  const [customDepositAmount, setCustomDepositAmount] = useState('');
  const [hasUtilitiesDeposit, setHasUtilitiesDeposit] = useState(true);
  const [utilitiesDepositAmount, setUtilitiesDepositAmount] = useState('50000');
  const [advanceMonths, setAdvanceMonths] = useState('0');
  const [paymentDay, setPaymentDay] = useState('5');

  const [leaseType, setLeaseType] = useState('habitation');
  const [durationMonths, setDurationMonths] = useState('12');

  // Calculs financiers dissociés
  const parsedRent = parseInt(monthlyRent, 10) || 0;
  const parsedCharges = parseInt(charges, 10) || 0;
  const parsedUtilitiesDeposit = hasUtilitiesDeposit
    ? parseInt(utilitiesDepositAmount, 10) || 0
    : 0;
  const parsedAdvanceRent = parsedRent * (parseInt(advanceMonths, 10) || 0);

  const parsedDeposit =
    depositMonths === 'custom'
      ? parseInt(customDepositAmount, 10) || 0
      : parsedRent * (parseInt(depositMonths, 10) || 0);

  const totalDueAtEntry =
    (includeFirstRent ? parsedRent + parsedCharges : 0) +
    parsedDeposit +
    parsedUtilitiesDeposit +
    parsedAdvanceRent;

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
      property: resolvedPropertyName,
      unit: resolvedUnitName,
      country: activeLaw.countryName,
      governingLaw: `${activeLaw.officialLawReference} (${activeLaw.countryName})`,
      rent: parsedRent,
      deposit: parsedDeposit,
      charges: parsedCharges,
      utilitiesDeposit: parsedUtilitiesDeposit,
      includeFirstRent,
      advanceMonths: parseInt(advanceMonths, 10) || 0,
      totalDueAtEntry,
      isNewTenant: tenantMode === 'new',
      invitationCode: tenantMode === 'new' ? generatedInvitationCode : undefined,
      invitationSentBySms: tenantMode === 'new' ? notifyBySms : true,
      invitationSentByEmail: tenantMode === 'new' ? notifyByEmail : true,
      appDownloadLink: 'https://locagestion.app/download',
      portalAccessLink: 'http://localhost:3001/portal?tab=bail',
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
            {/* Step 1: Bien & Lot / Chambre */}
            {currentStep === 1 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Building className="w-5 h-5 text-brand-500" />
                      <span>Étape 1 : Désignation de l’Immeuble, Lot ou Chambre à Louer</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Sélectionnez une unité de votre patrimoine existant ou saisissez directement un bien ou une chambre libre.
                    </p>
                  </div>
                  <span className="text-xs text-slate-600 font-bold bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60 flex items-center gap-1 self-start sm:self-auto">
                    <span>Étape 1 sur 5</span>
                  </span>
                </div>

                {/* Sélecteur de mode : Patrimoine existant vs Saisie directe */}
                <div className="p-1.5 bg-slate-100 rounded-2xl flex flex-col sm:flex-row items-stretch gap-1">
                  <button
                    type="button"
                    onClick={() => setPropertyMode('portfolio')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      propertyMode === 'portfolio'
                        ? 'bg-white text-slate-900 shadow-sm font-black'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5 text-brand-500" />
                    <span>Sélectionner dans mon patrimoine (Biens & Lots)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPropertyMode('manual')}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      propertyMode === 'manual'
                        ? 'bg-white text-slate-900 shadow-sm font-black'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Home className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Saisie directe (Bien ou Chambre à louer)</span>
                  </button>
                </div>

                {/* MODE 1 : Sélection dans le patrimoine existant */}
                {propertyMode === 'portfolio' && (
                  <div className="space-y-4">
                    {/* Choix du Bien / Immeuble dans le patrimoine */}
                    <div>
                      <label className="text-xs font-black text-slate-800 block mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-brand-500" />
                          <span>Sélectionner le bien immobilier ou l’immeuble :</span>
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {MOCK_PROPERTIES.length} biens répertoriés
                        </span>
                      </label>
                      <select
                        value={selectedPropertyId}
                        onChange={(e) => handleSelectProperty(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-brand-500 focus:outline-none cursor-pointer"
                      >
                        {MOCK_PROPERTIES.map((p) => {
                          const vacantCount =
                            p.unitsList?.filter((u) => u.status === 'vacant').length || 0;
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} — {p.district ? `${p.district}, ` : ''}{p.city} ({p.totalUnits} lots{vacantCount > 0 ? ` • ${vacantCount} disponible(s)` : ''})
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Carte récapitulative du bien sélectionné */}
                    {currentProperty && (
                      <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center font-black shrink-0">
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-slate-900 truncate">
                              {currentProperty.name}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>
                                {currentProperty.address}, {currentProperty.city}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {currentProperty.unitsList?.filter((u) => u.status === 'vacant').length || 0} vacant(s) / {currentProperty.totalUnits} lots
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Sélection du Lot ou de la Chambre dans ce bien */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                          <DoorOpen className="w-3.5 h-3.5 text-brand-500" />
                          <span>Sélectionner le lot, appartement ou chambre à louer :</span>
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedUnitMode(
                              selectedUnitMode === 'catalog' ? 'custom' : 'catalog'
                            )
                          }
                          className="text-[11px] text-brand-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
                        >
                          {selectedUnitMode === 'catalog' ? (
                            <>
                              <Plus className="w-3 h-3" />
                              <span>Saisir un lot non listé</span>
                            </>
                          ) : (
                            <>
                              <Layers className="w-3 h-3" />
                              <span>Revenir aux lots du catalogue</span>
                            </>
                          )}
                        </button>
                      </div>

                      {selectedUnitMode === 'catalog' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                          {currentProperty?.unitsList?.map((u) => {
                            const isSelected = unitNumber.includes(u.unit);
                            const isVacant = u.status === 'vacant';
                            return (
                              <div
                                key={u.unit}
                                onClick={() => handleSelectUnitFromCatalog(u)}
                                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                                  isSelected
                                    ? 'bg-brand-50/70 border-brand-500 ring-2 ring-brand-500/20 shadow-xs'
                                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                                    {u.type?.toLowerCase().includes('chambre') ? (
                                      <Bed className="w-3.5 h-3.5 text-brand-500" />
                                    ) : (
                                      <DoorOpen className="w-3.5 h-3.5 text-brand-500" />
                                    )}
                                    <span>{u.unit}</span>
                                  </span>
                                  <span
                                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                      isVacant
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {isVacant ? 'Disponible' : 'Occupé'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-slate-600 truncate">{u.type}</div>
                                <div className="flex items-center justify-between mt-1 text-[11px]">
                                  <span className="text-slate-500">{u.surface} m²</span>
                                  <span className="font-bold text-brand-600">
                                    {formatFCFA(u.rent)}/mois
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-brand-50/50 border border-brand-200/60 space-y-3">
                          <div className="text-xs font-bold text-brand-900 flex items-center gap-1.5">
                            <Plus className="w-3.5 h-3.5" />
                            <span>
                              Saisie d'un nouveau lot ou chambre dans {currentProperty?.name} :
                            </span>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                Désignation du lot / chambre
                              </label>
                              <input
                                type="text"
                                placeholder="Ex: Chambre 3, Lot 104..."
                                value={customUnitNumber}
                                onChange={(e) => setCustomUnitNumber(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl bg-white border border-brand-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                                Surface habitable (m²)
                              </label>
                              <input
                                type="number"
                                placeholder="Ex: 40"
                                value={surface}
                                onChange={(e) => setSurface(e.target.value)}
                                className="w-full px-3.5 py-2 rounded-xl bg-white border border-brand-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* MODE 2 : Saisie Directe (Bien ou Chambre à louer) */}
                {propertyMode === 'manual' && (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Saisie libre & directe :</strong> Renseignez directement le bien, la maison, l'appartement ou la chambre indépendante à mettre en location sans avoir à le créer préalablement dans le catalogue.
                      </span>
                    </div>

                    {/* Type d'espace loué */}
                    <div>
                      <label className="text-xs font-black text-slate-800 block mb-1.5">
                        Type d’espace ou hébergement à louer :
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {LEASE_PROPERTY_TYPES.map((opt) => {
                          const Icon = opt.icon;
                          const isSelected = manualPropertyType === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setManualPropertyType(opt.id);
                                if (!manualUnitName) {
                                  setManualUnitName(opt.label);
                                }
                              }}
                              className={`p-2.5 rounded-2xl border text-left cursor-pointer transition-all flex items-start gap-2 ${
                                isSelected
                                  ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                              }`}
                            >
                              <div
                                className={`p-1.5 rounded-xl shrink-0 ${
                                  isSelected
                                    ? 'bg-emerald-500 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0">
                                <div
                                  className={`text-xs font-bold truncate ${
                                    isSelected
                                      ? 'text-emerald-950 font-black'
                                      : 'text-slate-800'
                                  }`}
                                >
                                  {opt.label}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">{opt.sub}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Nom du bien / Concession / Villa */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Nom du bien, concession, villa ou immeuble
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Villa Les Hibiscus, Concession Akpakpa, Maison Familiale Soglo..."
                        value={manualPropertyName}
                        onChange={(e) => setManualPropertyName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                      />
                    </div>

                    {/* Désignation précise de la chambre ou du lot */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Désignation précise de la chambre ou du lot
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Chambre n°2 avec sanitaire, Studio RDC gauche, Porte A..."
                          value={manualUnitName}
                          onChange={(e) => setManualUnitName(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Surface habitable estimée (m²)
                        </label>
                        <input
                          type="number"
                          placeholder="Ex: 35"
                          value={surface}
                          onChange={(e) => setSurface(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                        />
                      </div>
                    </div>

                    {/* Localisation : Ville & Adresse */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Ville
                        </label>
                        <select
                          value={manualCity}
                          onChange={(e) => {
                            const val = e.target.value;
                            setManualCity(val);
                            const detected = resolveCountryTenancyLaw(val);
                            if (detected) {
                              setSelectedCountryName(detected.countryName);
                            }
                          }}
                          className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none cursor-pointer"
                        >
                          <option value="Cotonou">Cotonou (Bénin)</option>
                          <option value="Abidjan">Abidjan (Côte d'Ivoire)</option>
                          <option value="Dakar">Dakar (Sénégal)</option>
                          <option value="Lomé">Lomé (Togo)</option>
                          <option value="Ouagadougou">Ouagadougou (Burkina Faso)</option>
                          <option value="Douala">Douala (Cameroun)</option>
                          <option value="Yaoundé">Yaoundé (Cameroun)</option>
                          <option value="Bamako">Bamako (Mali)</option>
                          <option value="Niamey">Niamey (Niger)</option>
                          <option value="Autre">Autre ville</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-700 block mb-1">
                          Quartier / Rue / Repère
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Haie Vive, Rue 340 / Cocody Angré 8e Tranche..."
                          value={manualAddress}
                          onChange={(e) => setManualAddress(e.target.value)}
                          className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Récapitulatif dynamique du lot retenu pour le bail */}
                <div className="p-3.5 rounded-2xl bg-slate-100/90 border border-slate-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-slate-600">Désignation retenue :</span>
                    <strong className="text-slate-900 font-extrabold">
                      {resolvedPropertyName} — {resolvedUnitName}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-[11px] self-start sm:self-auto">
                    {surface && <span>{surface} m²</span>}
                    <span>•</span>
                    <span className="font-semibold text-brand-600">
                      {propertyMode === 'portfolio' ? 'Patrimoine' : 'Saisie directe'}
                    </span>
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

                  {/* Nouveau locataire : Création de compte & Notification SMS / Email automatique */}
                  {tenantMode === 'new' && (
                    <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          <span className="text-xs font-black text-emerald-950">
                            Création automatique du compte & Invitation multicanale
                          </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          Nouveau Locataire
                        </span>
                      </div>

                      <p className="text-[11px] text-emerald-900 leading-relaxed">
                        Ce locataire n'a pas encore de compte sur la plateforme. Dès que vous validerez le contrat de bail, son espace locataire sera automatiquement créé et activé. Il recevra immédiatement une notification avec son lien d'accès et le lien de téléchargement de l'application mobile.
                      </p>

                      {/* Canaux de notification cochables */}
                      <div className="space-y-2 pt-1 border-t border-emerald-200/60">
                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifyBySms}
                            onChange={(e) => setNotifyBySms(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                          />
                          <div className="text-xs">
                            <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Notification par SMS & WhatsApp (au {tenantPhone || 'numéro mobile'})</span>
                            </span>
                            <span className="text-[11px] text-emerald-800 block">
                              Contient le lien direct pour contresigner le bail et le lien de téléchargement de l'application mobile LOCAGESTION.
                            </span>
                          </div>
                        </label>

                        <label className="flex items-start gap-2.5 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={notifyByEmail}
                            onChange={(e) => setNotifyByEmail(e.target.checked)}
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                          />
                          <div className="text-xs">
                            <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Notification par Email officiel (à {tenantEmail || 'l’adresse email'})</span>
                            </span>
                            <span className="text-[11px] text-emerald-800 block">
                              Contient la copie numérique scellée du contrat en PDF, le code d’activation et les identifiants d’accès.
                            </span>
                          </div>
                        </label>
                      </div>

                      {/* Aperçu du message d'invitation */}
                      <div className="p-3 bg-white/90 rounded-xl border border-emerald-200 text-[11px] text-slate-700 space-y-1">
                        <div className="font-bold text-slate-900 flex items-center justify-between">
                          <span className="flex items-center gap-1 text-[11px]">
                            <span>💬 Aperçu du SMS & Email d'invitation envoyé au locataire :</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">Code : {generatedInvitationCode}</span>
                        </div>
                        <p className="text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-200/60 text-[10.5px]">
                          « Bonjour <strong>{tenantName || 'Locataire'}</strong>, M. Mamadou Diallo a établi votre contrat de bail pour <strong>{resolvedUnitName}</strong> ({resolvedPropertyName}).
                          <br />
                          👉 <strong>Accédez à votre espace sécurisé pour contresigner :</strong> http://localhost:3001/portal?tab=bail
                          <br />
                          📲 <strong>Téléchargez l'application mobile LOCAGESTION :</strong> https://locagestion.app/download
                          <br />
                          Code d’activation : <strong>{generatedInvitationCode}</strong> »
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Conditions Financières */}
            {currentStep === 3 && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-emerald-600" />
                      <span>Étape 3 : Conditions Financières & Modalités UEMOA & CEMAC</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Définissez le loyer, les cautions dissociées (loyer et compteurs) et le total exigible à la signature.
                    </p>
                  </div>
                  <span className="text-xs text-slate-600 font-bold bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60 flex items-center gap-1 self-start sm:self-auto">
                    <span>Étape 3 sur 5</span>
                  </span>
                </div>

                {/* Grille des montants de base : Loyer et Charges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Loyer mensuel principal (FCFA)
                    </label>
                    <input
                      type="number"
                      value={monthlyRent}
                      onChange={(e) => setMonthlyRent(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-black text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Charges forfaitaires mensuelles (FCFA)
                    </label>
                    <input
                      type="number"
                      value={charges}
                      onChange={(e) => setCharges(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:bg-white focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>
                </div>

                {/* 1. Case à cocher : 1er loyer exigible à l'entrée */}
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3 transition-colors hover:bg-slate-100/60">
                  <input
                    type="checkbox"
                    id="includeFirstRent"
                    checked={includeFirstRent}
                    onChange={(e) => setIncludeFirstRent(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 mt-0.5 cursor-pointer"
                  />
                  <label htmlFor="includeFirstRent" className="text-xs cursor-pointer flex-1">
                    <span className="font-extrabold text-slate-900 block">
                      Exiger le 1er loyer à l’entrée dans les lieux
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {includeFirstRent
                        ? `Le premier mois de loyer (${formatFCFA(parsedRent)}${parsedCharges > 0 ? ` + charges de ${formatFCFA(parsedCharges)}` : ''}) est comptabilisé dans le montant exigible à la remise des clés.`
                        : 'Le premier loyer n’est pas exigé le jour de la signature (ex: paiement à terme échu ou différé).'}
                    </span>
                  </label>
                  <span className={`text-xs font-bold shrink-0 ${includeFirstRent ? 'text-slate-900' : 'text-slate-400 line-through'}`}>
                    {includeFirstRent ? formatFCFA(parsedRent + parsedCharges) : '0 FCFA'}
                  </span>
                </div>

                {/* Information légale de conformité pour le pays de juridiction */}
                <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{activeLaw.flag}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Réglementation {activeLaw.countryName}
                        </span>
                        <span className="text-[10px] bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2 py-0.2 rounded-full font-bold">
                          {activeLaw.shortReference}
                        </span>
                      </div>
                      <p className="text-slate-200 text-[11px] font-medium mt-0.5">
                        {activeLaw.depositAdviceText}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl border border-slate-700 font-bold flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  >
                    <Scale className="w-3.5 h-3.5 text-brand-400" />
                    <span>Consulter les clauses</span>
                  </button>
                </div>

                {/* 2. Caution Loyer avec plus d'options + Standard adapté au pays */}
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-800 block flex items-center justify-between">
                    <span>Caution / Dépôt de garantie Loyer :</span>
                    <span className="text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">
                      Standard légal : {activeLaw.depositCapMonths} mois ({activeLaw.shortReference})
                    </span>
                  </label>
                  <select
                    value={depositMonths}
                    onChange={(e) => setDepositMonths(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-brand-500 focus:outline-none cursor-pointer"
                  >
                    <option value="0">0 mois — Aucune caution loyer (0 FCFA)</option>
                    <option value="1">1 mois de caution ({formatFCFA(parsedRent * 1)})</option>
                    <option value="2">
                      2 mois de caution ({formatFCFA(parsedRent * 2)}) {activeLaw.depositCapMonths === 2 ? '— ★ Plafond légal d’ordre public' : ''}
                    </option>
                    <option value="3">
                      3 mois de caution ({formatFCFA(parsedRent * 3)}) {activeLaw.depositCapMonths === 3 ? `— ★ Standard ${activeLaw.countryName} / UEMOA` : ''}
                    </option>
                    <option value="4">4 mois de caution ({formatFCFA(parsedRent * 4)})</option>
                    <option value="5">5 mois de caution ({formatFCFA(parsedRent * 5)})</option>
                    <option value="6">6 mois de caution ({formatFCFA(parsedRent * 6)})</option>
                    <option value="custom">Montant libre personnalisé en FCFA...</option>
                  </select>

                  {/* Avertissement de dépassement du plafond légal du pays */}
                  {parseInt(depositMonths, 10) > activeLaw.depositCapMonths && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-[11px] text-amber-900">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        <strong>Attention réglementation :</strong> En {activeLaw.countryName}, {activeLaw.depositAdviceText} Exiger plus expose à la requalification ou contestation devant {activeLaw.competentCourt}.
                      </span>
                    </div>
                  )}

                  {depositMonths === 'custom' && (
                    <div className="pt-1">
                      <input
                        type="number"
                        placeholder="Saisissez le montant exact de caution convenu en FCFA..."
                        value={customDepositAmount}
                        onChange={(e) => setCustomDepositAmount(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-white border border-brand-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                    </div>
                  )}
                </div>

                {/* 3. Bouton / Case à cocher : Caution Eau et Électricité avec montant à entrer */}
                <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-2.5">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="hasUtilitiesDeposit"
                      checked={hasUtilitiesDeposit}
                      onChange={(e) => setHasUtilitiesDeposit(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="hasUtilitiesDeposit" className="text-xs cursor-pointer flex-1">
                      <span className="font-extrabold text-amber-950 block flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-amber-600" />
                        <span>Caution Compteurs Eau & Électricité (SBEE / SONEB / CIE / SODECI)</span>
                      </span>
                      <span className="text-[11px] text-amber-800 block mt-0.5">
                        Garantie spécifique pour couvrir les consommations d'eau et d'énergie résiduelles et l'entretien des compteurs.
                      </span>
                    </label>
                    {hasUtilitiesDeposit && (
                      <span className="text-xs font-black text-amber-900 shrink-0">
                        + {formatFCFA(parsedUtilitiesDeposit)}
                      </span>
                    )}
                  </div>

                  {hasUtilitiesDeposit && (
                    <div className="pt-2 border-t border-amber-200/60 pl-7 flex flex-col sm:flex-row sm:items-center gap-2">
                      <label className="text-[11px] font-bold text-amber-900 shrink-0">
                        Montant de la caution Eau & Électricité (FCFA) :
                      </label>
                      <input
                        type="number"
                        placeholder="Ex: 50000"
                        value={utilitiesDepositAmount}
                        onChange={(e) => setUtilitiesDepositAmount(e.target.value)}
                        className="w-full sm:w-48 px-3.5 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-black text-amber-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  )}
                </div>

                {/* 4. Échéance et Mois d'avance */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Mois de loyer d'avance (Optionnel)
                    </label>
                    <select
                      value={advanceMonths}
                      onChange={(e) => setAdvanceMonths(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                    >
                      <option value="0">0 mois d'avance</option>
                      <option value="1">1 mois d'avance ({formatFCFA(parsedRent * 1)})</option>
                      <option value="2">2 mois d'avance ({formatFCFA(parsedRent * 2)})</option>
                      <option value="3">3 mois d'avance ({formatFCFA(parsedRent * 3)})</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Jour d’échéance mensuelle du loyer
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

                {/* 5. DISSOCIATION DU TOTAL EXIGIBLE EN DÉTAIL */}
                <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 text-white shadow-lg space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      <span>Décomposition du Total Exigible à l’Entrée :</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      À verser à la signature
                    </span>
                  </div>

                  {/* Lignes dissociées */}
                  <div className="space-y-1.5 text-xs">
                    {/* 1er loyer */}
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${includeFirstRent ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        <span>1er mois de loyer principal {includeFirstRent ? '' : '(différé)'}</span>
                      </span>
                      <span className={`font-mono font-bold ${includeFirstRent ? 'text-white' : 'text-slate-500 line-through'}`}>
                        {includeFirstRent ? formatFCFA(parsedRent) : '0 FCFA'}
                      </span>
                    </div>

                    {/* Charges */}
                    {parsedCharges > 0 && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${includeFirstRent ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                          <span>Charges locatives initiales</span>
                        </span>
                        <span className={`font-mono font-bold ${includeFirstRent ? 'text-white' : 'text-slate-500 line-through'}`}>
                          {includeFirstRent ? formatFCFA(parsedCharges) : '0 FCFA'}
                        </span>
                      </div>
                    )}

                    {/* Caution loyer */}
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-brand-400" />
                        <span>Caution Loyer ({depositMonths === 'custom' ? 'Montant libre' : `${depositMonths} mois`})</span>
                      </span>
                      <span className="font-mono font-bold text-white">
                        {formatFCFA(parsedDeposit)}
                      </span>
                    </div>

                    {/* Caution eau et électricité */}
                    {hasUtilitiesDeposit && (
                      <div className="flex items-center justify-between text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-400" />
                          <span>Caution compteurs Eau & Électricité</span>
                        </span>
                        <span className="font-mono font-bold text-amber-200">
                          + {formatFCFA(parsedUtilitiesDeposit)}
                        </span>
                      </div>
                    )}

                    {/* Loyer d'avance */}
                    {parsedAdvanceRent > 0 && (
                      <div className="flex items-center justify-between text-blue-300">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-400" />
                          <span>Loyer(s) d'avance ({advanceMonths} mois)</span>
                        </span>
                        <span className="font-mono font-bold text-blue-200">
                          + {formatFCFA(parsedAdvanceRent)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Grand Total */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">
                        Montant global net exigible :
                      </span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-400">
                        {formatFCFA(totalDueAtEntry)}
                      </span>
                    </div>
                    <div className="text-right text-[10px] text-slate-400">
                      <span>Règlement : Mobile Money ou Virement</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Clauses Juridiques & Droit National Applicable */}
            {currentStep === 4 && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Scale className="w-5 h-5 text-brand-600" />
                      <span>Étape 4 : Cadre Légal & Clauses Spécifiques au Pays de Résidence</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Clauses juridiques formulées selon la législation en vigueur dans le pays de situation du logement.
                    </p>
                  </div>
                  <span className="text-xs text-slate-600 font-bold bg-slate-100 px-3 py-1 rounded-full border border-slate-200/60 flex items-center gap-1 self-start sm:self-auto">
                    <span>Étape 4 sur 5</span>
                  </span>
                </div>

                {/* 1. Bandeau Sélecteur de Pays & Juridiction */}
                <div className="p-4 rounded-3xl bg-slate-900 text-white shadow-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl p-1 bg-slate-800 rounded-2xl border border-slate-700">
                        {activeLaw.flag}
                      </span>
                      <div>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Juridiction & Réglementation Nationale Applicable :
                        </span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-sm sm:text-base font-black text-white">
                            {activeLaw.countryName}
                          </span>
                          <span className="text-[10px] bg-brand-500/20 text-brand-300 border border-brand-500/30 px-2.5 py-0.5 rounded-full font-bold">
                            {activeLaw.shortReference}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-300 font-medium hidden sm:inline">
                        Adapter à un autre pays :
                      </label>
                      <select
                        value={selectedCountryName}
                        onChange={(e) => setSelectedCountryName(e.target.value)}
                        className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
                      >
                        {SUPPORTED_TENANCY_COUNTRIES.map((c) => (
                          <option key={c.countryName} value={c.countryName}>
                            {c.flag} {c.countryName} — {c.shortReference}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center gap-y-2 gap-x-4 text-[11px] text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                      <span><strong>Texte officiel :</strong> {activeLaw.officialLawReference}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>Plafond caution :</strong> {activeLaw.depositCapMonths} mois max</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      <span><strong>Délai restitution :</strong> {activeLaw.restitutionDeadlineDays} jours max</span>
                    </div>
                  </div>
                </div>

                {/* 2. Synthèse Institutionnelle des Règles d'Ordre Public */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200/80 space-y-2 text-xs shadow-xs">
                  <div className="font-black text-slate-900 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Info className="w-4 h-4 text-brand-600" />
                      <span>Prescriptions Légales en Vigueur ({activeLaw.countryName})</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyAllClauses}
                      className="text-[11px] text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1 cursor-pointer bg-brand-50 hover:bg-brand-100/70 px-2.5 py-1 rounded-xl transition-colors"
                    >
                      {isCopiedAllClauses ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700">Texte copié !</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copier le texte des clauses</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px]">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">
                        Formalité Fiscale & Déclaration :
                      </span>
                      <p className="text-slate-700 leading-relaxed">
                        {activeLaw.fiscalRegistrationRequirement}
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                      <span className="text-slate-400 block font-bold uppercase tracking-wider text-[10px]">
                        Juridiction Territoriale Compétente :
                      </span>
                      <p className="text-slate-700 leading-relaxed font-semibold">
                        {activeLaw.competentCourt}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Liste des Articles Rédigés Spécifiques au Pays */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-brand-600" />
                      <span>Articles et Clauses Types Intégrés au Contrat ({activeLaw.clauses.length} articles) :</span>
                    </h3>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Conforme droit OHADA & Code locatif national
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {activeLaw.clauses.map((clause) => {
                      const isExpanded = expandedArticle === clause.articleNumber;
                      return (
                        <div
                          key={clause.articleNumber}
                          className="p-3.5 rounded-2xl bg-white border border-slate-200/90 hover:border-brand-200 hover:shadow-xs transition-all space-y-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-900 text-white font-mono">
                                  {clause.articleNumber}
                                </span>
                                <span className="text-xs font-extrabold text-slate-900">
                                  {clause.title}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 pl-1">
                                {clause.summary}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setExpandedArticle(isExpanded ? null : clause.articleNumber)
                              }
                              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                              title={isExpanded ? 'Réduire' : 'Lire le texte intégral'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>

                          {/* Texte Notarié Déplié */}
                          {isExpanded ? (
                            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-700 leading-relaxed animate-in fade-in duration-150">
                              <p className="font-serif italic">{clause.fullText}</p>
                            </div>
                          ) : (
                            <div
                              onClick={() => setExpandedArticle(clause.articleNumber)}
                              className="text-[10px] text-brand-600 font-bold hover:underline cursor-pointer flex items-center gap-1 pl-1"
                            >
                              <span>Voir la formulation juridique complète</span>
                              <ChevronDown className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Clauses Personnalisées & Options Additionnelles */}
                <div className="p-4 rounded-3xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-brand-600" />
                      <span>Clauses Additionnelles Personnalisables :</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">Activées par défaut</span>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/80 cursor-pointer transition-colors text-xs">
                      <input
                        type="checkbox"
                        checked={optionalClauses.indexation}
                        onChange={(e) =>
                          setOptionalClauses({ ...optionalClauses, indexation: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">
                          Clause d’Indexation & Révision Annuelle du Loyer
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Le loyer pourra être réajusté à la date anniversaire selon la variation de l'indice officiel des prix à la consommation.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/80 cursor-pointer transition-colors text-xs">
                      <input
                        type="checkbox"
                        checked={optionalClauses.lateFee}
                        onChange={(e) =>
                          setOptionalClauses({ ...optionalClauses, lateFee: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">
                          Clause Pénale de Retard Forfaitaire (10%)
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Application d’une indemnité forfaitaire de 10% sur tout loyer non acquitté après le 10 de chaque mois civil.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/80 cursor-pointer transition-colors text-xs">
                      <input
                        type="checkbox"
                        checked={optionalClauses.worksApproval}
                        onChange={(e) =>
                          setOptionalClauses({ ...optionalClauses, worksApproval: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">
                          Agrément Écrit Préalable pour Tous Travaux
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Interdiction d'effectuer des percements majeurs ou modifications sans autorisation écrite préalable du propriétaire.
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white/80 cursor-pointer transition-colors text-xs">
                      <input
                        type="checkbox"
                        checked={optionalClauses.animals}
                        onChange={(e) =>
                          setOptionalClauses({ ...optionalClauses, animals: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 mt-0.5"
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">
                          Interdiction Stricte des Animaux Nuisibles ou Dangereux
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          Les animaux susceptibles de causer des détériorations ou de troubler le calme des voisins sont proscrits.
                        </span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2 text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Ces clauses juridiques certifiées seront automatiquement insérées et scellées dans le contrat PDF officiel lors de la signature à l'étape suivante.
                  </span>
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
                Le contrat de bail pour <strong>{tenantName}</strong> sur le lot <strong>{resolvedUnitName}</strong> ({resolvedPropertyName}) a été horodaté et archivé avec sa piste d'audit numérique.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Réf. Contrat :</span>
                <span className="font-mono font-bold text-slate-800">{preparedLease?.id || 'BAIL-2026-N09'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Bien & Lot :</span>
                <span className="font-bold text-slate-800 truncate max-w-[220px]">
                  {resolvedPropertyName} • {resolvedUnitName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Loyer Mensuel :</span>
                <span className="font-extrabold text-brand-600">{formatFCFA(parsedRent)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Caution Loyer :</span>
                <span className="font-bold text-slate-700">{formatFCFA(parsedDeposit)}</span>
              </div>
              {hasUtilitiesDeposit && (
                <div className="flex justify-between text-amber-700">
                  <span>Caution Eau & Électricité :</span>
                  <span className="font-bold font-mono">+{formatFCFA(parsedUtilitiesDeposit)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-500">
                <span>Cadre Légal :</span>
                <span className="font-bold text-slate-800">
                  {activeLaw.flag} {activeLaw.shortReference}
                </span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-slate-200 font-black text-slate-900">
                <span>Total exigible à l'entrée :</span>
                <span className="text-emerald-600">{formatFCFA(totalDueAtEntry)}</span>
              </div>
            </div>

            {tenantMode === 'new' && (
              <div className="p-3 bg-brand-50 border border-brand-200 rounded-2xl text-left text-xs space-y-1">
                <div className="font-bold text-brand-900 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-brand-600" />
                  <span>Invitation envoyée par SMS & E-mail</span>
                </div>
                <p className="text-[11px] text-brand-700 leading-relaxed">
                  Le locataire a reçu son lien de téléchargement d'application et son accès portail avec le code d'activation <strong className="font-mono text-brand-900">{generatedInvitationCode}</strong>.
                </p>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  generateLeasePDF({
                    id: preparedLease?.id || 'BAIL-2026-N09',
                    tenantName,
                    propertyName: resolvedPropertyName,
                    unit: resolvedUnitName,
                    country: activeLaw.countryName,
                    governingLaw: `${activeLaw.officialLawReference} (${activeLaw.countryName})`,
                    rent: parsedRent,
                    deposit: parsedDeposit,
                    utilitiesDeposit: hasUtilitiesDeposit ? parsedUtilitiesDeposit : 0,
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

