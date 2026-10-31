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
  ExternalLink,
} from 'lucide-react';
import { PaymentTransaction, PaymentStatus } from '@/lib/types';
import { formatFCFA, getPaymentMethodLabel } from '@/lib/money/format';

interface RecentPaymentsTableProps {
  payments: PaymentTransaction[];
  onSelectPayment: (payment: PaymentTransaction) => void;
  onSendReminder: (payment: PaymentTransaction) => void;
}

export function RecentPaymentsTable({
  payments,
  onSelectPayment,
  onSendReminder,
}: RecentPaymentsTableProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'paye' | 'en_retard' | 'partiel'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filtering
  const filteredPayments = payments.filter((p) => {
    const matchesTab = activeTab === 'all' || p.status === activeTab;
    const matchesSearch =
      p.tenantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.propertyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.unitNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
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
    switch (method) {
      case 'wave':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
            <Smartphone className="w-3 h-3 text-cyan-600" />
            <span>Wave</span>
          </span>
        );
      case 'mtn_momo':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Smartphone className="w-3 h-3 text-amber-600" />
            <span>MTN MoMo</span>
          </span>
        );
      case 'orange_money':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <Smartphone className="w-3 h-3 text-orange-600" />
            <span>Orange Money</span>
          </span>
        );
      case 'moov_money':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Smartphone className="w-3 h-3 text-blue-600" />
            <span>Moov</span>
          </span>
        );
      case 'virement':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <span>Virement</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>Espèces</span>
          </span>
        );
    }
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
      </div>

      {/* Mobile Card List View (< 768px) */}
      <div className="md:hidden divide-y divide-slate-100">
        {filteredPayments.map((item) => (
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
        ))}
      </div>
    </div>
  );
}

