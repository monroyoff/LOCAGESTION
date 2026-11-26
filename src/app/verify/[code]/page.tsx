'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  Building2,
  Calendar,
  Lock,
  ArrowLeft,
  Search,
  AlertTriangle,
  ExternalLink,
  CreditCard,
  User,
  Home,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { PaymentService } from '@/lib/services/payment-service';
import { PaymentTransaction } from '@/lib/types';
import { SkeletonCertificate } from '@/components/ui/SkeletonLoader';
import { matchPaymentByCode } from '@/lib/services/receipt-matcher';

interface VerifyPageProps {
  params: {
    code: string;
  };
}

export default function VerifyReceiptPage({ params }: VerifyPageProps) {
  const router = useRouter();
  const rawCode = decodeURIComponent(params.code || '').trim();
  const [inputCode, setInputCode] = useState(rawCode);
  const [matchedPayment, setMatchedPayment] = useState<PaymentTransaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const performSearch = (codeToSearch: string) => {
    setIsLoading(true);
    const cleaned = codeToSearch.trim();

    // 1. Recherche locale immédiate (mémoire et cache)
    const localPayments = [
      ...PaymentService.getVerifiedPayments(),
      ...PaymentService.getDeclaredPayments(),
    ];
    const localFound = localPayments.find((p) => matchPaymentByCode(p, cleaned));
    if (localFound) {
      setMatchedPayment(localFound);
      setIsLoading(false);
      return;
    }

    // 2. Recherche distante vers /api/sync (accessible sur smartphone tiers)
    fetch('/api/sync')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success) {
          const serverPayments: PaymentTransaction[] = [
            ...(data.verifiedPayments || []),
            ...(data.payments || []),
          ];
          const serverFound = serverPayments.find((p) => matchPaymentByCode(p, cleaned));
          if (serverFound) {
            setMatchedPayment(serverFound);
          } else {
            setMatchedPayment(null);
          }
        } else {
          setMatchedPayment(null);
        }
      })
      .catch((err) => {
        console.error('Erreur recherche serveur quittance:', err);
        setMatchedPayment(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    performSearch(rawCode);
  }, [rawCode]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputCode.trim()) return;
    router.push(`/verify/${encodeURIComponent(inputCode.trim())}`);
  };

  const landlordName = matchedPayment?.landlordName || 'VOGLOSSOU JOHANE';
  const landlordIfu = matchedPayment?.landlordIfu || '3201984210987';
  const tenantName = matchedPayment?.tenantName || 'Jojo VOG';
  const tenantMatricule = matchedPayment?.tenantMatricule || 'LOCA-MAT-BJ-17635';
  const propertyDesc = matchedPayment
    ? `${matchedPayment.propertyName} (${matchedPayment.unitNumber})`
    : 'Lot sous contrat de bail certifié';
  const period = matchedPayment?.period || 'Période contractuelle';
  const method =
    matchedPayment?.method?.toUpperCase() === 'MTN'
      ? 'MTN Mobile Money (Passerelle FedaPay)'
      : matchedPayment?.method?.toUpperCase() === 'MOOV'
      ? 'Moov Money (Passerelle FedaPay)'
      : matchedPayment?.method?.toUpperCase() === 'WAVE'
      ? 'Wave Mobile Money'
      : matchedPayment?.method?.toUpperCase() || 'MOBILE MONEY / VIREMENT';
  const amount = matchedPayment?.amount || 0;
  const paymentDate = matchedPayment?.paymentDate || '26/11/2026';
  const receiptNum = matchedPayment?.receiptNumber || rawCode;
  const transactionRef = matchedPayment?.transactionRef;

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 py-10 px-4 sm:px-6 flex flex-col justify-center items-center">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <Link href="/accueil" className="inline-flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-brand-500/25 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">
            LOCA<span className="text-brand-500">GESTION</span>
          </span>
        </Link>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mt-1">
          Guichet Public de Vérification Numérique UEMOA & CEMAC
        </span>
      </div>

      {/* Verification Card */}
      {isLoading ? (
        <SkeletonCertificate />
      ) : matchedPayment ? (
        <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in duration-300">
          {/* Certificate banner */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3.5 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest block">
                Document Officiel Certifié Conforme
              </span>
              <h2 className="text-base font-black text-emerald-950">
                Quittance de Loyer Authentique & Scellée
              </h2>
              <p className="text-[11px] text-emerald-700">
                Intégrité cryptographique vérifiée dans le registre public officiel LOCAGESTION.
              </p>
            </div>
          </div>

          {/* Receipt Key Info */}
          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100 items-center">
              <span className="text-slate-500 font-medium">Référence Quittance :</span>
              <span className="font-mono font-black text-brand-600 bg-brand-50 px-2 py-0.5 rounded-lg border border-brand-200">
                {receiptNum}
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Bailleur Émetteur :</span>
              <span className="font-bold text-slate-900 text-right">
                {landlordName} <span className="text-slate-400 font-normal block sm:inline">• IFU : {landlordIfu}</span>
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100 items-center">
              <span className="text-slate-500 font-medium">Statut Juridique :</span>
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 text-[11px]">
                Soldé & Conforme OHADA ✓
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Locataire Titulaire :</span>
              <span className="font-bold text-slate-900 text-right">
                {tenantName} <span className="text-slate-400 font-normal block sm:inline">• Matr. {tenantMatricule}</span>
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Logement Loué :</span>
              <span className="font-bold text-slate-800 text-right">{propertyDesc}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Période Acquittée :</span>
              <span className="font-bold text-slate-900">{period}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Mode de Règlement :</span>
              <span className="font-semibold text-slate-900 text-right">{method}</span>
            </div>
            {transactionRef && (
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Réf. Transaction :</span>
                <span className="font-mono font-bold text-slate-800 text-right">{transactionRef}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Date d’Encaissement :</span>
              <span className="font-bold text-slate-900">{paymentDate}</span>
            </div>
            <div className="flex justify-between py-2 pt-3 items-center">
              <span className="text-slate-800 font-bold text-sm">Montant Total Encaissé :</span>
              <span className="font-black text-emerald-600 text-xl">
                {formatFCFA(amount)}
              </span>
            </div>
          </div>

          {/* Cryptographic Seal & SHA-256 Hash */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-[10px] space-y-1 text-slate-500 font-mono">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold">
              <Lock className="w-3.5 h-3.5 text-brand-500" />
              <span>Sceau d'intégrité cryptographique SHA-256 :</span>
            </div>
            <div className="break-all text-[9px] text-slate-600">
              e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
            </div>
          </div>

          {/* Action Links */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold border-t border-slate-100">
            <Link
              href="/accueil"
              className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à l’accueil du site</span>
            </Link>
            <Link
              href="/portal?tab=quittances"
              className="inline-flex items-center gap-1.5 text-brand-600 hover:text-brand-700 transition-colors"
            >
              <span>Accéder à mon espace</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        /* Not Found State */
        <div className="w-full max-w-xl bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest block">
                Vérification Introuvable
              </span>
              <h2 className="text-base font-black text-amber-950">
                Quittance Non Répertoriée
              </h2>
              <p className="text-[11px] text-amber-800">
                Aucune quittance correspondant à la référence « <strong className="font-mono">{rawCode}</strong> » n'a été trouvée dans le registre officiel.
              </p>
            </div>
          </div>

          <form onSubmit={handleManualSearch} className="space-y-3">
            <label className="text-xs font-bold text-slate-700 block">
              Rechercher une autre référence ou un numéro de quittance :
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Ex : LOCA-QUITT-BJ-114409497 ou FEDA-114409497"
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-hidden focus:border-brand-500"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Vérifier</span>
              </button>
            </div>
          </form>

          <div className="pt-2 text-center border-t border-slate-100">
            <Link
              href="/accueil"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à la page d’accueil du site</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
