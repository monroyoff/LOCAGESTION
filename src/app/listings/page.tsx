'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  Compass,
  MapPin,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Sparkles,
  Phone,
  MessageCircle,
  Eye,
  ShieldCheck,
  Zap,
  Droplet,
  Wifi,
  Shield,
  Plus,
} from 'lucide-react';
import { formatFCFA } from '@/lib/money/format';
import { UserSpace } from '@/lib/types';

interface Listing {
  id: string;
  title: string;
  propertyType: string;
  city: string;
  district: string;
  landmark: string; // Repère africain en texte libre (ex: "Derrière pharmacie Haie Vive")
  monthlyRent: number;
  charges: number;
  depositMonths: number;
  advanceMonths: number;
  agencyFees: number;
  surface: number;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  amenities: string[];
  isVerified: boolean;
  status: 'disponible' | 'reserve' | 'loue';
}

const MOCK_LISTINGS: Listing[] = [
  {
    id: 'list-01',
    title: 'Appartement Haut Standing 3 Pièces avec Vue Dégagée',
    propertyType: 'Appartement',
    city: 'Cotonou',
    district: 'Haie Vive',
    landmark: 'À 200m du supermarché Erevan, rue pavée',
    monthlyRent: 250000,
    charges: 25000,
    depositMonths: 3,
    advanceMonths: 1,
    agencyFees: 125000,
    surface: 85,
    bedrooms: 2,
    bathrooms: 2,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&auto=format&fit=crop&q=80',
    ],
    amenities: [
      'Compteur Cash Power prépayé',
      'Château d’eau & Surpresseur',
      'Groupe électrogène automatique',
      'Gardiennage 24h/7j',
      'Climatisation split dans toutes les pièces',
      'Fibre optique disponible',
    ],
    isVerified: true,
    status: 'disponible',
  },
  {
    id: 'list-02',
    title: 'Studio Cosy Meublé Moderne au Cœur de Cocody',
    propertyType: 'Studio',
    city: 'Abidjan',
    district: 'Cocody Danga',
    landmark: 'Carrefour de la Vie, accès bitumé facile',
    monthlyRent: 150000,
    charges: 15000,
    depositMonths: 2,
    advanceMonths: 2,
    agencyFees: 75000,
    surface: 35,
    bedrooms: 1,
    bathrooms: 1,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&auto=format&fit=crop&q=80',
    ],
    amenities: [
      'Compteur CIE individuel',
      'Eau SODECI avec bâche de réserve',
      'Sécurité par caméras & digicode',
      'Parking intérieur sécurisé',
    ],
    isVerified: true,
    status: 'disponible',
  },
  {
    id: 'list-03',
    title: 'Magnifique Villa 5 Pièces avec Jardin et Piscine',
    propertyType: 'Villa',
    city: 'Dakar',
    district: 'Almadies',
    landmark: 'Près de l’Hôtel King Fahd Palace',
    monthlyRent: 750000,
    charges: 50000,
    depositMonths: 3,
    advanceMonths: 2,
    agencyFees: 375000,
    surface: 240,
    bedrooms: 4,
    bathrooms: 4,
    images: [
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop&q=80',
    ],
    amenities: [
      'Forage privé & filtre eau potable',
      'Groupe électrogène 25 kVA',
      'Clôture électrifiée & Guérite vigile',
      'Chambre de service / boyerie',
      'Piscine entretenue',
    ],
    isVerified: true,
    status: 'disponible',
  },
];

export default function ListingsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState<UserSpace>('bailleur');
  const [searchCity, setSearchCity] = useState('');

  const calculateTotalEntryCost = (l: Listing) => {
    const depositTotal = l.monthlyRent * l.depositMonths;
    const advanceTotal = l.monthlyRent * l.advanceMonths;
    return l.monthlyRent + l.charges + depositTotal + advanceTotal + l.agencyFees;
  };

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
          {/* Top Title & Publish CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Annonces de Location & Coût d’Entrée
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-brand-50 text-brand-600 border border-brand-200">
                  Transparence Totale
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Annonces géolocalisées avec calcul automatique du coût d’entrée réel et équipements essentiels africains.
              </p>
            </div>

            <button
              onClick={() => alert('Ouverture assistant de publication d’annonce')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-extrabold shadow-pink-glow active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Publier une annonce</span>
            </button>
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_LISTINGS.map((listing) => {
              const totalEntryCost = calculateTotalEntryCost(listing);

              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden flex flex-col justify-between group hover:shadow-card-hover transition-all"
                >
                  <div>
                    {/* Image Header with Price Tag */}
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-brand-500 text-white text-[10px] font-black shadow-md">
                          {listing.propertyType}
                        </span>
                        {listing.isVerified && (
                          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-emerald-400 text-[10px] font-bold border border-white/10 flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            Bailleur Vérifié
                          </span>
                        )}
                      </div>

                      {/* Bottom rent overlay */}
                      <div className="absolute bottom-3 left-4 right-4 text-white">
                        <span className="text-2xl font-black tracking-tight">
                          {formatFCFA(listing.monthlyRent)}
                        </span>
                        <span className="text-xs text-slate-300 font-semibold"> / mois</span>
                      </div>
                    </div>

                    {/* Listing Content */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
                        {listing.title}
                      </h3>

                      <div className="text-xs text-slate-500 space-y-1">
                        <div className="flex items-center gap-1 font-bold text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                          <span>{listing.district}, {listing.city}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 italic">
                          Repère : « {listing.landmark} »
                        </p>
                      </div>

                      {/* Critical Differentiating Feature: Total Entry Cost Box */}
                      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-tealAccent-50 border border-emerald-200/80 text-xs">
                        <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                          À Prévoir à l’Entrée (Coût Total) :
                        </span>
                        <div className="text-lg font-black text-emerald-900 mt-0.5">
                          {formatFCFA(totalEntryCost)}
                        </div>
                        <span className="text-[10px] text-emerald-700 block mt-0.5">
                          (Loyer + {listing.depositMonths}m caution + {listing.advanceMonths}m avance + agence)
                        </span>
                      </div>

                      {/* Essential African Amenities */}
                      <div className="pt-2 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                          Équipements Clés Inclus :
                        </span>
                        <div className="space-y-1">
                          {listing.amenities.slice(0, 3).map((a, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px] text-slate-600 font-medium">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                              <span className="truncate">{a}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-0 flex items-center gap-2">
                    <Link
                      href="/messages"
                      className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold text-center transition-all shadow-sm"
                    >
                      Contacter
                    </Link>
                    <button
                      onClick={() => alert(`Demande de visite enregistrée pour ${listing.title}`)}
                      className="flex-1 py-2.5 px-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold text-center shadow-pink-glow transition-all"
                    >
                      Demander visite
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
