'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { LandingPropertyCard, PropertyCardData } from './LandingPropertyCard';

const FEATURED_PROPERTIES: PropertyCardData[] = [
  {
    id: 'prop-bj-884',
    code: 'BJ-CTN-884',
    title: 'Appartement Haut Standing F3 avec Groupe',
    price: '280 000 FCFA',
    location: 'Cotonou, Haie Vive • Face ancienne pharmacie Concorde',
    proximity: 'À 120m du goudron',
    proximityIcon: 'near_me',
    badgeTop: 'Cash Power Dédié',
    badgeTopColor: 'secondary',
    badgeTopIcon: 'bolt',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCePY9ReEW0OiF_aVi-EwaKC_jnCsfUrkKSoy5Gqxm7gLgX3M4RI8wFGCjfho51ODYs39mBx1qqtIrkCWXznZvtwN2ZjGGEgFZ_VBZtZhpDEYoHLj0Z02nB9OywPnA_Wuka5uo8sKT-OMYb9V0Z0cvyoJGELKtb671rqMi95P4xq6LmVxrQsuvV_Qt0g9LzuqQuEEIqs80h6QCkO9XIUYVwsFyRyheUXnFr5xwvwmg_',
    imageAlt:
      'Modern upscale West African 3-bedroom villa in Haie Vive Cotonou with private parking, tropical lush palm garden, clean perimeter wall, warm sunset light and luxury dark slate architecture',
    features: [
      'Forage + Surpresseur',
      'Gardiennage 24/7',
      'Garage 2 véhicules',
      'Bail Loi 2018-12 (3m max)',
    ],
    ownerInitials: 'KD',
    ownerName: 'K. Dossou (Propriétaire)',
    statusBadge: 'Auto-désactivation',
    statusIcon: 'timer_off',
  },
  {
    id: 'prop-ci-192',
    code: 'CI-ABJ-192',
    title: 'Duplex F4 Neuf • Conformité Loi 2019-576',
    price: '450 000 FCFA',
    location: 'Abidjan, Cocody Angré 8ème Tranche • Carrefour Nelson Mandela',
    proximity: 'Accès Pavé direct',
    proximityIcon: 'directions_walk',
    badgeTop: 'Compteur SODECI Isolé',
    badgeTopColor: 'tertiary',
    badgeTopIcon: 'local_fire_department',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD31R2cBh_dqiYbR4x555RppJVep9dQd1s_iSbj96k_hsU_hJqkrlR57mXxT6Ks9I-jLSa59rXZ2QXMcEB0w4oYGy6wzv8XIh9JwjRlQvM3Z9imSg7qiSb1c82UZIgy7b23umOqpfhMf4GK77EWCoDz3NUpdAlu_Bz0WohVH2ME_if8IF1KcEX4zEVbtjPIvQJQOjXWm0XB6_K4hdvEE0k7eJwYaFfyWZHJ2jja2LT-',
    imageAlt:
      'Chic residential apartment building facade in Cocody Angre Abidjan Ivory Coast with tropical greenery, glass balconies, dusk moody lighting, modern African design aesthetic',
    features: [
      '2m Caution + 2m Avance',
      'Fibre Optique Orange',
      'Pré-équipé Split',
      'Quittance QR Immédiate',
    ],
    ownerInitials: 'AT',
    ownerName: 'Agence Terrains & Toits',
    statusBadge: 'Mandat Validé',
    statusIcon: 'verified',
  },
  {
    id: 'prop-sn-401',
    code: 'SN-DKR-401',
    title: 'Boutique / Showroom 75m² • Woyofal Autonome',
    price: '650 000 FCFA',
    location: 'Dakar, Route des Almadies • Près Ambassade USA',
    proximity: 'En front de mer',
    proximityIcon: 'store',
    badgeTop: 'Local Commercial',
    badgeTopColor: 'primary',
    badgeTopIcon: 'storefront',
    imageUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDwWIfiMakmCAmRUK2SwniO1UeyZWhDdjAm9hoP_iH8f13In9ckxeOAv-6xsfRPynsBNtUfDCFKBLfpHNyuRLJWNTHbZChSV11rWDATpvgfpKE2BuNLOyDhJLxdTiGaPC-Wk5ykj9cJqq-kXjwcfPUX5z9qHJXklhM7ju7f1NpUIwvjkeRMXihF3T4sIesb6zUOoCZHsNcDS9Kz__OMiZHlvf21v0jK0a23ucsSEcds',
    imageAlt:
      'Contemporary ocean view commercial boutique and luxury studio in Dakar Almadies Senegal, modern glass storefront with terracotta warm elements, clean architectural shadows',
    features: [
      'Compteur Woyofal Senelec',
      'Bail Commercial OHADA',
      'Paiement Wave / Free Money',
      'Dépôt de Garantie Séquestré',
    ],
    ownerInitials: 'MS',
    ownerName: 'M. Sène (Gestionnaire)',
    statusBadge: 'Dispo Immédiate',
    statusIcon: 'check_circle',
  },
];

export function LandingSearchSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [budget, setBudget] = useState('all');
  const [propertyType, setPropertyType] = useState('all');

  return (
    <section
      id="annonces-et-recherche"
      className="w-full px-gutter md:px-margin-tablet lg:px-margin-desktop py-space-xl bg-surface-container-lowest border-y border-surface-container-high/30"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-space-lg">
        {/* Section Heading with Asymmetric Overline */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
          <div className="flex flex-col gap-1">
            <div className="inline-flex items-center gap-2 font-label-md text-label-md text-primary font-bold uppercase tracking-widest">
              <span className="w-6 h-0.5 bg-primary-container" />
              Marché Immobilier Géolocalisé
            </div>
            <h2 className="font-headline-lg text-headline-lg-mobile sm:text-headline-lg text-on-surface font-extrabold tracking-tight">
              Trouvez ou Publiez des Biens Certifiés
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
              Adresses réelles adaptées au terrain africain : repères locaux, Cash Power vérifié, forage opérationnel et dépublication instantanée dès signature.
            </p>
          </div>

          {/* Quick Action Pill for Landlords & Demarcheurs */}
          <div className="flex items-center gap-space-sm p-space-sm rounded-full bg-surface-container-high self-start md:self-auto shadow-md border border-surface-container-highest">
            <span className="px-3 py-1 rounded-full bg-secondary-container text-on-secondary font-label-sm text-label-sm font-bold uppercase">
              Facilité
            </span>
            <span className="font-label-sm text-label-sm text-on-surface pr-3">
              Dans tous les espaces : postez une annonce en quelques secondes
            </span>
          </div>
        </div>

        {/* Advanced Search Bar Africanized */}
        <div className="p-space-md rounded-2xl bg-surface-container-high shadow-xl flex flex-col lg:flex-row items-center gap-space-sm border border-surface-container-highest/60">
          {/* Field 1: Zone/Neighborhood */}
          <div className="flex-1 w-full flex items-center gap-space-sm px-space-md py-space-sm rounded-full bg-surface-container-low text-on-surface border border-surface-container-high/60 focus-within:border-primary-container/80 transition-colors">
            <span className="material-symbols-outlined text-primary-container shrink-0">
              location_on
            </span>
            <div className="flex flex-col flex-1 min-w-0">
              <label className="font-label-sm text-label-sm text-on-surface-variant">
                Zone / Ville / Repère
              </label>
              <input
                className="bg-transparent border-0 text-on-surface font-label-lg text-label-lg focus:outline-none placeholder:text-outline truncate"
                placeholder="Ex: Cotonou Haie Vive, Abidjan Cocody..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Field 2: Budget FCFA */}
          <div className="w-full lg:w-64 flex items-center gap-space-sm px-space-md py-space-sm rounded-full bg-surface-container-low text-on-surface border border-surface-container-high/60 focus-within:border-secondary/80 transition-colors">
            <span className="material-symbols-outlined text-secondary shrink-0">payments</span>
            <div className="flex flex-col flex-1 min-w-0">
              <label className="font-label-sm text-label-sm text-on-surface-variant">
                Budget Max (FCFA)
              </label>
              <select
                className="bg-transparent border-0 text-on-surface font-label-lg text-label-lg focus:outline-none cursor-pointer"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              >
                <option className="bg-surface-container-high text-on-surface" value="all">
                  Tous les prix
                </option>
                <option className="bg-surface-container-high text-on-surface" value="50000">
                  ≤ 50 000 FCFA
                </option>
                <option className="bg-surface-container-high text-on-surface" value="150000">
                  ≤ 150 000 FCFA
                </option>
                <option className="bg-surface-container-high text-on-surface" value="300000">
                  ≤ 300 000 FCFA
                </option>
                <option className="bg-surface-container-high text-on-surface" value="750000">
                  ≤ 750 000 FCFA
                </option>
                <option className="bg-surface-container-high text-on-surface" value="1500000">
                  ≥ 1 500 000 FCFA
                </option>
              </select>
            </div>
          </div>

          {/* Field 3: Typologie */}
          <div className="w-full lg:w-56 flex items-center gap-space-sm px-space-md py-space-sm rounded-full bg-surface-container-low text-on-surface border border-surface-container-high/60 focus-within:border-tertiary/80 transition-colors">
            <span className="material-symbols-outlined text-tertiary shrink-0">apartment</span>
            <div className="flex flex-col flex-1 min-w-0">
              <label className="font-label-sm text-label-sm text-on-surface-variant">
                Type d'espace
              </label>
              <select
                className="bg-transparent border-0 text-on-surface font-label-lg text-label-lg focus:outline-none cursor-pointer"
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value)}
              >
                <option className="bg-surface-container-high text-on-surface" value="all">
                  Tous types
                </option>
                <option className="bg-surface-container-high text-on-surface" value="apt">
                  Appartement F3/F4
                </option>
                <option className="bg-surface-container-high text-on-surface" value="studio">
                  Studio Meublé
                </option>
                <option className="bg-surface-container-high text-on-surface" value="villa">
                  Villa Individuelle
                </option>
                <option className="bg-surface-container-high text-on-surface" value="commercial">
                  Boutique / Magasin
                </option>
              </select>
            </div>
          </div>

          {/* Submit Search Button - Pro Sleek */}
          <Link
            href="/listings"
            className="w-full lg:w-auto px-5 py-2.5 lg:px-6 lg:py-3 rounded-full bg-primary-container text-on-primary font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm hover:brightness-105 active:scale-95 transition-all shrink-0 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[17px] sm:text-[19px]">search</span>
            <span>Explorer les Biens</span>
          </Link>
        </div>

        {/* Verified Real Estate Showcase (3 Tailored Cards via Reusable Component) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg">
          {FEATURED_PROPERTIES.map((prop) => (
            <LandingPropertyCard key={prop.id} property={prop} />
          ))}
        </div>
      </div>
    </section>
  );
}
