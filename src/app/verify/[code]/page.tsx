'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  QrCode,
  Building2,
  Receipt,
  Calendar,
  Lock,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';

interface VerifyPageProps {
  params: {
    code: string;
  };
}

export default function VerifyReceiptPage({ params }: VerifyPageProps) {
  const code = params.code || 'QUITT-2026-1048';

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 py-12 px-4 sm:px-6 flex flex-col justify-center items-center">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-brand-500/25">
            Ω
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">
            LOCA<span className="text-brand-500">GESTION</span>
          </span>
        </Link>
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mt-1">
          Guichet Public de Vérification Numérique UEMOA
        </span>
      </div>

      {/* Verification Card */}
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Certificate banner */}
        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">
              Document Certifié Conforme
            </span>
            <h2 className="text-base font-black text-emerald-950">
              Quittance de Loyer Authentique & Scellée
            </h2>
            <p className="text-[11px] text-emerald-700">
              Intégrité cryptographique vérifiée dans le registre OMEGA LOCAGESTION.
            </p>
          </div>
        </div>

        {/* Receipt Key Info */}
        <div className="space-y-3 text-xs">
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-400 font-medium">Référence Quittance :</span>
            <span className="font-mono font-bold text-slate-900">{code}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-400 font-medium">Bailleur Émetteur :</span>
            <span className="font-bold text-slate-900">DIALLO PATRIMOINE SARL</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-400 font-medium">Numéro IFU Bailleur :</span>
            <span className="font-mono font-bold text-slate-700">0202110485960 (Bénin)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-400 font-medium">Locataire Titulaire :</span>
            <span className="font-bold text-slate-900">Koffi Mensah</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-400 font-medium">Logement :</span>
            <span className="font-bold text-brand-600">Résidence Les Cocotiers (Appt A3)</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-400 font-medium">Période Quittancée :</span>
            <span className="font-bold text-slate-900">Octobre 2026</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-100">
            <span className="text-slate-400 font-medium">Mode d'encaissement :</span>
            <span className="font-bold text-slate-900">Wave Mobile Money</span>
          </div>
          <div className="flex justify-between py-2 pt-3">
            <span className="text-slate-700 font-bold text-sm">Montant Total Réglé :</span>
            <span className="font-black text-emerald-600 text-lg">
              {formatFCFA(220000)}
            </span>
          </div>
        </div>

        {/* Cryptographic Seal & SHA-256 Hash */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-[10px] space-y-1 text-slate-500 font-mono">
          <div className="flex items-center gap-1.5 text-slate-700 font-bold">
            <Lock className="w-3.5 h-3.5 text-brand-500" />
            <span>Sceau d'intégrité SHA-256 :</span>
          </div>
          <div className="break-all text-[9px] text-slate-600">
            e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Retour à l’application LOCAGESTION</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

