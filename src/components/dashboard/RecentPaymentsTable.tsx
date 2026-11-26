'use client';

import React, { useState } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Receipt,
  MessageCircle,
  MoreVertical,
  ArrowRight,
  FileText,
  Phone,
  Building,
  Smartphone,
  CreditCard,
  ExternalLink,
  Calendar,
  ArrowUpDown,
  RotateCcw,
} from 'lucide-react';
import { PaymentTransaction, PaymentStatus } from '@/lib/types';
import { formatFCFA, getPaymentMethodLabel } from '@/lib/money/format';
import { MONTHS_OF_YEAR } from '@/lib/services/payment-service';

interface RecentPaymentsTableProps {
  payments: PaymentTransaction[];
  onSelectPayment: (payment: PaymentTransaction) => void;
  onSendReminder: (payment: PaymentTransaction) => void;
  initialTab?: 'all' | 'paye' | 'en_retard' | 'partiel';
}

export function RecentPaymentsTable({
  payments,
  onSelectPayment,
  onSendReminder,
  initialTab = 'all',
}: RecentPaymentsTableProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'paye' | 'en_retard' | 'partiel'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'this_month' | 'last_month' | 'last_3_months' | 'year_2026'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  const parseFrDate = (dateStr?: string) => {
    if (!dateStr) return 0;
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0])).getTime();
    }
    const d = new Date(dateStr).getTime();
    return isNaN(d) ? 0 : d;
  };

  // Filtering & Chronological Sorting
  const filteredPayments = payments
    .filter((p) => {
      const matchesTab = activeTab === 'all' || p.status === activeTab;
      const matchesSearch =
        p.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.period.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.paymentDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesTab || !matchesSearch) return false;

      // Filtre mois précis sélectionné
      if (selectedPeriod !== 'all' && p.period !== selectedPeriod) {
        return false;
      }

      // Filtres presets de date
      if (dateFilter === 'this_month') {
        return p.period.toLowerCase().includes('novembre') || p.paymentDate.includes('/11/');
      }
      if (dateFilter === 'last_month') {
        return p.period.toLowerCase().includes('octobre') || p.paymentDate.includes('/10/');
      }
      if (dateFilter === 'last_3_months') {
        const m = p.period.toLowerCase();
        return m.includes('novembre') || m.includes('octobre') || m.includes('septembre');
      }
      if (dateFilter === 'year_2026') {
        return p.period.includes('2026') || p.paymentDate.includes('2026');
      }

      return true;
    })
    .sort((a, b) => {
      const tA = parseFrDate(a.paymentDate);
      const tB = parseFrDate(b.paymentDate);
      return sortOrder === 'desc' ? tB - tA : tA - tB;
    });

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'paye':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Soldé</span>
          </span>
        );
      case 'partiel':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Acompte partiel</span>
          </span>
        );
      case 'en_retard':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
            <span>En retard (+15j)</span>
          </span>
        );
      default:
        return null;
    }
  };

  const getMethodBadge = (method: string) => {
    const m = (method || '').toLowerCase().trim();

    // MTN Mobile Money (mtn, mtn_momo, mtn-money, etc.)
    if (m === 'mtn' || m === 'mtn_momo' || m.includes('mtn')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
          <Smartphone className="w-3 h-3 text-amber-600 shrink-0" />
          <span>MTN MoMo</span>
        </span>
      );
    }

    // Moov Money (moov, moov_money, etc.)
    if (m === 'moov' || m === 'moov_money' || m.includes('moov')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
          <Smartphone className="w-3 h-3 text-blue-600 shrink-0" />
          <span>Moov Money</span>
        </span>
      );
    }

    // Wave
    if (m === 'wave' || m.includes('wave')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-cyan-50 text-cyan-700 border border-cyan-200 shadow-2xs">
          <Smartphone className="w-3 h-3 text-cyan-600 shrink-0" />
          <span>Wave</span>
        </span>
      );
    }

    // Orange Money
    if (m === 'orange' || m === 'orange_money' || m.includes('orange')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-orange-50 text-orange-700 border border-orange-200 shadow-2xs">
          <Smartphone className="w-3 h-3 text-orange-600 shrink-0" />
          <span>Orange Money</span>
        </span>
      );
    }

    // Celtiis Cash
    if (m === 'celtiis' || m === 'celtiis_cash' || m.includes('celtiis')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-purple-50 text-purple-700 border border-purple-200 shadow-2xs">
          <Smartphone className="w-3 h-3 text-purple-600 shrink-0" />
          <span>Celtiis</span>
        </span>
      );
    }

    // Virement bancaire
    if (m === 'virement' || m.includes('virement')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-2xs">
          <CreditCard className="w-3 h-3 text-indigo-600 shrink-0" />
          <span>Virement</span>
        </span>
      );
    }

    // Espèces (Reçu direct)
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
        <span>Espèces</span>
      </span>
    );
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
      {/* Table Header: Title, Tabs & Search */}
      <div className="p-5 sm:p-6 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
              <span>Opérations & Suivi des Loyers</span>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {filteredPayments.length} transactions
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Historique des quittances émises et des relances en attente
            </p>
          </div>

          {/* Segmented Filter Tabs (StayWise Style) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="p-1 bg-slate-100 rounded-2xl flex items-center">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'all'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tous ({payments.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('paye')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'paye'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Soldés
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('partiel')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'partiel'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Partiels
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('en_retard')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'en_retard'
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                En retard
              </button>
            </div>

            {/* Quick Search in Table */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrer..."
                className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
        </div>

        {/* Date Filter & Sort Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Presets */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-brand-500" />
              <span>Période :</span>
            </span>

            {[
              { key: 'all', label: 'Toutes les dates' },
              { key: 'this_month', label: 'Ce mois-ci (Novembre)' },
              { key: 'last_month', label: 'Mois dernier (Octobre)' },
              { key: 'last_3_months', label: '3 derniers mois' },
              { key: 'year_2026', label: 'Année 2026' },
            ].map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  setDateFilter(p.key as any);
                  setSelectedPeriod('all');
                }}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                  dateFilter === p.key && selectedPeriod === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Mois spécifique + Bouton de tri */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPeriod}
              onChange={(e) => {
                setSelectedPeriod(e.target.value);
                setDateFilter('all');
              }}
              className="py-1.5 pl-3 pr-7 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20 cursor-pointer"
            >
              <option value="all">Tous les mois</option>
              {MONTHS_OF_YEAR.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
              className="px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
              title="Inverser l'ordre de tri par date"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-brand-500" />
              <span>{sortOrder === 'desc' ? 'Plus récent ↓' : 'Plus ancien ↑'}</span>
            </button>

            {(dateFilter !== 'all' || selectedPeriod !== 'all' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setDateFilter('all');
                  setSelectedPeriod('all');
                  setSearchTerm('');
                }}
                className="text-[10px] font-bold text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer transition-colors p-1"
                title="Réinitialiser les filtres"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/80 border-b border-slate-100 text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
              <th className="py-3.5 px-6">Locataire & Contact</th>
              <th className="py-3.5 px-6">Lot & Résidence</th>
              <th className="py-3.5 px-6">Montant & Période</th>
              <th className="py-3.5 px-6">Moyen de Règlement</th>
              <th className="py-3.5 px-6">Statut</th>
              <th className="py-3.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {filteredPayments.map((item) => (
              <tr
                key={item.id}
                className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                onClick={() => onSelectPayment(item)}
              >
                {/* Tenant Info */}
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.tenantAvatar}
                      alt={item.tenantName}
                      className="w-10 h-10 rounded-2xl object-cover ring-1 ring-slate-200"
                    />
                    <div>
                      <span className="font-extrabold text-slate-900 block group-hover:text-brand-600 transition-colors">
                        {item.tenantName}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" />
                        {item.tenantPhone}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Property & Unit */}
                <td className="py-4 px-6">
                  <span className="font-bold text-slate-800 block">
                    {item.propertyName}
                  </span>
                  <span className="text-[11px] text-brand-600 font-semibold block mt-0.5">
                    {item.unitNumber}
                  </span>
                </td>

                {/* Amount & Date */}
                <td className="py-4 px-6">
                  <span className="font-black text-slate-900 text-sm block">
                    {formatFCFA(item.amount)}
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    {item.period} • {item.paymentDate}
                  </span>
                </td>

                {/* Method */}
                <td className="py-4 px-6">
                  <div>
                    {getMethodBadge(item.method)}
                    <span className="text-[10px] text-slate-400 block mt-1 font-mono">
                      {item.receiptNumber}
                    </span>
                  </div>
                </td>

                {/* Status */}
                <td className="py-4 px-6">{getStatusBadge(item.status)}</td>

                {/* Actions */}
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                    {item.status === 'en_retard' ? (
                      <button
                        type="button"
                        onClick={() => onSendReminder(item)}
                        className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Relancer WhatsApp</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onSelectPayment(item)}
                        className="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-500" />
                        <span>Quittance</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPayments.length === 0 && (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Receipt className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-700">Aucun paiement trouvé pour ces critères</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Ajustez vos filtres de statut, de période ou de recherche pour afficher les transactions.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setDateFilter('all');
                setSelectedPeriod('all');
                setSearchTerm('');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Afficher toutes les transactions
            </button>
          </div>
        )}
      </div>

      {/* Mobile Card List View (< 768px) */}
      <div className="md:hidden divide-y divide-slate-100">
        {filteredPayments.length === 0 ? (
          <div className="py-10 px-4 text-center space-y-2">
            <p className="text-xs text-slate-500 font-medium">Aucun paiement trouvé pour cette période.</p>
            <button
              type="button"
              onClick={() => {
                setActiveTab('all');
                setDateFilter('all');
                setSelectedPeriod('all');
                setSearchTerm('');
              }}
              className="px-3 py-1 rounded-xl bg-slate-900 text-white text-xs font-bold"
            >
              Réinitialiser
            </button>
          </div>
        ) : (
          filteredPayments.map((item) => (
          <div
            key={item.id}
            onClick={() => onSelectPayment(item)}
            className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <img
                  src={item.tenantAvatar}
                  alt={item.tenantName}
                  className="w-10 h-10 rounded-2xl object-cover ring-1 ring-slate-200"
                />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 leading-tight">
                    {item.tenantName}
                  </h4>
                  <span className="text-xs text-brand-600 font-semibold block mt-0.5">
                    {item.unitNumber}
                  </span>
                </div>
              </div>

              {getStatusBadge(item.status)}
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 block">Montant réglé</span>
                <span className="font-black text-slate-900 text-sm">
                  {formatFCFA(item.amount)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">{item.paymentDate}</span>
                {getMethodBadge(item.method)}
              </div>
            </div>
          </div>
        )))}
      </div>
    </div>
  );
}

