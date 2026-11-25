'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { LandingPropertyCard, PropertyCardData } from './LandingPropertyCard';

interface ExtendedPropertyData extends PropertyCardData {
  numericPrice: number;
  category: 'chambre' | 'studio' | 'apt' | 'villa' | 'commercial';
}

const FEATURED_PROPERTIES: ExtendedPropertyData[] = [
  // 1. Offre ultra-économique 25 000 FCFA (Allada, Bénin)
  {
    id: 'prop-bj-allada-25k',
    code: 'A-BJ-84291',
    title: 'Chambre Salon Sanitaire Moderne',
    price: '25 000 FCFA',
    numericPrice: 25000,
    category: 'chambre',
    location: 'Allada, Dogoudo • Face Ancienne École Défi',
    proximity: 'À 50m du goudron',
    proximityIcon: 'near_me',
    badgeTop: 'Cash Power Dédié',
    badgeTopColor: 'secondary',
    badgeTopIcon: 'bolt',
    imageUrl:
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&auto=format&fit=crop&q=80',
    imageAlt: 'Chambre salon sanitaire moderne et propre avec sol carrelé et peinture sobre',
    features: [
      'Cash Power Personnel',
      'Sanitaire Moderne Privatif',
      'Bail Loi 2018-12 (3m max)',
      'Accès Bitumé & Sécurisé',
    ],
    ownerInitials: 'VJ',
    ownerName: 'V. Johane (Bailleur)',
    statusBadge: 'Dispo Immédiate',
    statusIcon: 'check_circle',
  },

  // 2. Offre étudiante / jeune pro 35 000 FCFA (Calavi, Bénin)
  {
    id: 'prop-bj-calavi-35k',
    code: 'A-BJ-17635',
    title: 'Studio Meublé Moderne • Campus UAC',
    price: '35 000 FCFA',
    numericPrice: 35000,
    category: 'studio',
    location: 'Abomey-Calavi, Zogbadjè • À 200m Campus UAC',
    proximity: 'À 2 min Université',
    proximityIcon: 'school',
    badgeTop: 'Wifi + Forage Inclus',
    badgeTopColor: 'primary',
    badgeTopIcon: 'wifi',
    imageUrl:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80',
    imageAlt: 'Studio meublé cosy et contemporain à Calavi avec coin bureau et lit moderne',
    features: [
      'Compteur Cash Power',
      'Forage avec Surpresseur',
      'Wifi Fibre Optique',
      'Sécurité Vigile 24/7',
    ],
    ownerInitials: 'JV',
    ownerName: 'J. Voglossou (Bailleur)',
    statusBadge: 'Mandat Validé',
    statusIcon: 'verified',
  },

  // 3. Offre accessible 45 000 FCFA (Cotonou, Bénin)
  {
    id: 'prop-bj-cotonou-45k',
    code: 'A-BJ-29410',
    title: 'Chambre Salon Spacieuse Staffée',
    price: '45 000 FCFA',
    numericPrice: 45000,
    category: 'chambre',
    location: 'Cotonou, Akpakpa Dodomè • Proche Ciné Concorde',
    proximity: 'À 80m du goudron',
    proximityIcon: 'directions_walk',
    badgeTop: 'Compteur SBEE Isolé',
    badgeTopColor: 'secondary',
    badgeTopIcon: 'electric_bolt',
    imageUrl:
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&auto=format&fit=crop&q=80',
    imageAlt: 'Chambre et salon avec belle lumière naturelle et carrelage moderne à Akpakpa',
    features: [
      'Plafond Staffé Moderne',
      'Compteur SBEE Privatif',
      'Forage Surpressé 24/7',
      'Cour Pavée Sécurisée',
    ],
    ownerInitials: 'MH',
    ownerName: 'M. Houndété (Propriétaire)',
    statusBadge: 'Dispo Immédiate',
    statusIcon: 'check_circle',
  },

  // 4. Offre accessible 60 000 FCFA (Abidjan, Côte d’Ivoire)
  {
    id: 'prop-ci-yopougon-60k',
    code: 'A-CI-58190',
    title: 'Appartement 2 Pièces • Nouvelle Bâtisse',
    price: '60 000 FCFA',
    numericPrice: 60000,
    category: 'apt',
    location: 'Abidjan, Yopougon Maroc • Carrefour Anador',
    proximity: 'Accès Bitumé Direct',
    proximityIcon: 'near_me',
    badgeTop: 'Compteurs Isolés',
    badgeTopColor: 'tertiary',
    badgeTopIcon: 'speed',
    imageUrl:
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&auto=format&fit=crop&q=80',
    imageAlt: 'Appartement 2 pièces propre et moderne à Yopougon Maroc avec grand balcon',
    features: [
      'Compteurs CIE & SODECI',
      'Conformité Loi 2019-576',
      'Balcon Privatif Aéré',
      'Quittance QR Instantanée',
    ],
    ownerInitials: 'KK',
    ownerName: 'K. Kouamé (Propriétaire)',
    statusBadge: 'Mandat Validé',
    statusIcon: 'verified',
  },

  // 5. Offre accessible 75 000 FCFA (Dakar, Sénégal)
  {
    id: 'prop-sn-dakar-75k',
    code: 'A-SN-39201',
    title: 'Logement F2 Contemporain & Lumineux',
    price: '75 000 FCFA',
    numericPrice: 75000,
    category: 'apt',
    location: 'Dakar, Grand Yoff • Proche Rond-Point Liberté 6',
    proximity: 'À 100m des Transports',
    proximityIcon: 'directions_bus',
    badgeTop: 'Compteur Woyofal',
    badgeTopColor: 'secondary',
    badgeTopIcon: 'bolt',
    imageUrl:
      'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=1200&auto=format&fit=crop&q=80',
    imageAlt: 'Logement F2 lumineux et contemporain à Dakar Grand Yoff avec cuisine équipée',
    features: [
      'Compteur Woyofal Senelec',
      'Réservoir Eau & Pompe',
      'Cuisine Américaine Carrelée',
      'Bail Électronique OHADA',
    ],
    ownerInitials: 'AD',
    ownerName: 'A. Diop (Gestionnaire)',
    statusBadge: 'Dispo Immédiate',
    statusIcon: 'check_circle',
  },

  // 6. Offre accessible 85 000 FCFA (Lomé, Togo)
  {
    id: 'prop-tg-lome-85k',
    code: 'A-TG-14830',
    title: '2 Chambres Salon Moderne avec Forage',
    price: '85 000 FCFA',
    numericPrice: 85000,
    category: 'apt',
    location: 'Lomé, Agoè Assiyéyé • À 150m Carrefour Bleu',
    proximity: 'Accès Pavé Facile',
    proximityIcon: 'directions_walk',
    badgeTop: 'Forage Permanent',
    badgeTopColor: 'tertiary',
    badgeTopIcon: 'water_drop',
    imageUrl:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&auto=format&fit=crop&q=80',
    imageAlt: '2 chambres salon carrelé et staffé à Lomé Agoè avec grand salon convivial',
    features: [
      'Compteur Cash Power Dédié',
      'Forage avec Surpresseur',
      'Garage 1 Véhicule',
      'Plafond Staff Design',
    ],
    ownerInitials: 'EL',
    ownerName: 'E. Lawson (Bailleur)',
    statusBadge: 'Dispo Immédiate',
    statusIcon: 'check_circle',
  },

  // 7. Offre accessible 95 000 FCFA (Fidjrossè Plage, Bénin)
  {
    id: 'prop-bj-fidjrosse-95k',
    code: 'A-BJ-73205',
    title: 'Appartement 2 Chambres Salon • Fidjrossè',
    price: '95 000 FCFA',
    numericPrice: 95000,
    category: 'apt',
    location: 'Cotonou, Fidjrossè • Non loin Pharmacie Akogbato',
    proximity: 'À 5 min de la Plage',
    proximityIcon: 'beach_access',
    badgeTop: 'Zone Calme & Aérée',
    badgeTopColor: 'primary',
    badgeTopIcon: 'home',
    imageUrl:
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1200&auto=format&fit=crop&q=80',
    imageAlt: 'Bel appartement 2 chambres salon ventilé proche de la plage de Fidjrossè',
    features: [
      '2 Chambres Placardées',
      'Compteur Cash Power Dédié',
      'Garage Clôturé Sécurisé',
      'Bail Loi 2018-12',
    ],
    ownerInitials: 'CA',
    ownerName: 'C. Agbogba (Propriétaire)',
    statusBadge: 'Mandat Validé',
    statusIcon: 'verified',
  },

  // 8. Standing Haut 280 000 FCFA (Cotonou Haie Vive)
  {
    id: 'prop-bj-884',
    code: 'BJ-CTN-884',
    title: 'Appartement Haut Standing F3 avec Groupe',
    price: '280 000 FCFA',
    numericPrice: 280000,
    category: 'apt',
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

  // 9. Standing Haut 450 000 FCFA (Abidjan Cocody Angré)
  {
    id: 'prop-ci-192',
    code: 'CI-ABJ-192',
    title: 'Duplex F4 Neuf • Conformité Loi 2019-576',
    price: '450 000 FCFA',
    numericPrice: 450000,
    category: 'villa',
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

  // 10. Commercial 650 000 FCFA (Dakar Almadies)
  {
    id: 'prop-sn-401',
    code: 'SN-DKR-401',
    title: 'Boutique / Showroom 75m² • Woyofal Autonome',
    price: '650 000 FCFA',
    numericPrice: 650000,
    category: 'commercial',
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

  // Carousel & Auto-rotation states
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter properties based on search query, budget and type
  const filteredProperties = useMemo(() => {
    return FEATURED_PROPERTIES.filter((prop) => {
      // Query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          prop.title.toLowerCase().includes(q) ||
          prop.location.toLowerCase().includes(q) ||
          prop.code.toLowerCase().includes(q) ||
          prop.features.some((f) => f.toLowerCase().includes(q));
        if (!matchesQuery) return false;
      }

      // Budget filter
      if (budget !== 'all') {
        const maxBudget = parseInt(budget, 10);
        if (!isNaN(maxBudget) && prop.numericPrice > maxBudget) {
          return false;
        }
      }

      // Typology filter
      if (propertyType !== 'all') {
        if (propertyType === 'apt' && prop.category !== 'apt') return false;
        if (propertyType === 'studio' && prop.category !== 'studio') return false;
        if (propertyType === 'chambre' && prop.category !== 'chambre') return false;
        if (propertyType === 'villa' && prop.category !== 'villa') return false;
        if (propertyType === 'commercial' && prop.category !== 'commercial') return false;
      }

      return true;
    });
  }, [searchQuery, budget, propertyType]);

  // Reset index when filter results change
  useEffect(() => {
    setCurrentIndex(0);
  }, [searchQuery, budget, propertyType]);

  // Auto-rotation effect: advances automatically every 4.5 seconds
  useEffect(() => {
    if (isPaused || isHovered || filteredProperties.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredProperties.length);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused, isHovered, filteredProperties.length]);

  // Determine currently visible cards (3 cards dynamically wrapped)
  const visibleCards = useMemo(() => {
    const total = filteredProperties.length;
    if (total === 0) return [];
    if (total <= 3) return filteredProperties;

    return [
      filteredProperties[currentIndex % total],
      filteredProperties[(currentIndex + 1) % total],
      filteredProperties[(currentIndex + 2) % total],
    ];
  }, [filteredProperties, currentIndex]);

  const handlePrev = () => {
    if (filteredProperties.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + filteredProperties.length) % filteredProperties.length);
  };

  const handleNext = () => {
    if (filteredProperties.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % filteredProperties.length);
  };

  const affordableCount = useMemo(() => {
    return FEATURED_PROPERTIES.filter((p) => p.numericPrice < 100000).length;
  }, []);

  return (
    <section
      id="annonces-et-recherche"
      className="w-full px-gutter md:px-margin-tablet lg:px-margin-desktop py-space-xl bg-surface-container-lowest dark:border-none border-y border-surface-container-high/30"
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
                placeholder="Ex: Cotonou Haie Vive, Calavi, Allada, Abidjan..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Field 2: Budget FCFA (featuring under 100k) */}
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
                  ≤ 50 000 FCFA (Économique)
                </option>
                <option className="bg-surface-container-high text-on-surface" value="100000">
                  ≤ 100 000 FCFA (Accessible)
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
                <option className="bg-surface-container-high text-on-surface" value="chambre">
                  Chambre Salon
                </option>
                <option className="bg-surface-container-high text-on-surface" value="studio">
                  Studio Meublé
                </option>
                <option className="bg-surface-container-high text-on-surface" value="apt">
                  Appartement F2/F3/F4
                </option>
                <option className="bg-surface-container-high text-on-surface" value="villa">
                  Duplex / Villa
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
            className="w-full lg:w-auto px-6 py-2.5 lg:px-7 lg:py-3 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(244,63,110,0.35)] hover:brightness-105 active:scale-95 transition-all shrink-0 whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[17px] sm:text-[19px]">search</span>
            <span>Explorer les Biens</span>
          </Link>
        </div>

        {/* Live Auto-Rotation Control Bar & Small Rent Highlights */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-1">
          {/* Left: Live status with pulse & affordable badge */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              En direct • Rotation automatique
            </span>

            <button
              type="button"
              onClick={() => setBudget(budget === '100000' ? 'all' : '100000')}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-medium transition-all ${
                budget === '100000'
                  ? 'bg-primary text-on-primary shadow-sm font-bold'
                  : 'bg-surface-container-high hover:bg-surface-container-highest text-on-surface-variant hover:text-on-surface border border-surface-container-highest'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">savings</span>
              Offres &lt; 100 000 FCFA ({affordableCount})
            </button>
          </div>

          {/* Right: Carousel Controls (Prev / Pause / Next & Counter) */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-xs text-on-surface-variant font-medium mr-1">
              {filteredProperties.length > 0 ? (
                <>
                  <span className="font-bold text-on-surface">
                    {Math.min(currentIndex + 1, filteredProperties.length)}
                  </span>
                  {' / '}
                  <span>{filteredProperties.length}</span> offres
                </>
              ) : (
                '0 offre'
              )}
            </span>

            <div className="inline-flex items-center gap-1 bg-surface-container-high p-1 rounded-full border border-surface-container-highest shadow-sm">
              {/* Prev Button */}
              <button
                type="button"
                onClick={handlePrev}
                disabled={filteredProperties.length <= 1}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-highest active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Offre précédente"
                aria-label="Offre précédente"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>

              {/* Pause/Play Toggle Button */}
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isPaused
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold'
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                }`}
                title={isPaused ? 'Reprendre le défilement automatique' : 'Mettre en pause'}
                aria-label={isPaused ? 'Reprendre la rotation' : 'Mettre en pause'}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {isPaused ? 'play_arrow' : 'pause'}
                </span>
              </button>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNext}
                disabled={filteredProperties.length <= 1}
                className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface hover:bg-surface-container-highest active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                title="Offre suivante"
                aria-label="Offre suivante"
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* Verified Real Estate Showcase with Auto-Rotating Cards */}
        <div
          ref={containerRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="relative min-h-[480px]"
        >
          {filteredProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-surface-container border border-surface-container-high/60">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">search_off</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                Aucun bien ne correspond à ces critères
              </h3>
              <p className="text-body-md text-on-surface-variant max-w-md mt-1 mb-4">
                Essayez d'élargir votre zone géographique ou d'augmenter le budget max pour afficher davantage d'offres.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setBudget('all');
                  setPropertyType('all');
                }}
                className="px-5 py-2 rounded-full bg-brand-500 hover:bg-brand-600 text-white font-bold text-xs shadow-md transition-all"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-lg transition-all duration-500">
              {visibleCards.map((prop, idx) => (
                <div
                  key={`${prop.id}-${currentIndex}-${idx}`}
                  className="animate-in fade-in zoom-in-95 duration-500"
                >
                  <LandingPropertyCard property={prop} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Carousel Progress Indicators / Direct Jump Dots */}
        {filteredProperties.length > 3 && (
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {filteredProperties.map((prop, index) => {
              const isActive = index === currentIndex % filteredProperties.length;
              const isAffordable = prop.numericPrice < 100000;
              return (
                <button
                  key={prop.id}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  className={`h-2 transition-all rounded-full ${
                    isActive
                      ? 'w-7 bg-brand-500'
                      : isAffordable
                      ? 'w-2 bg-emerald-500/60 hover:bg-emerald-500 hover:w-3'
                      : 'w-2 bg-surface-container-highest hover:bg-outline hover:w-3'
                  }`}
                  title={`${prop.title} - ${prop.price}`}
                  aria-label={`Aller à ${prop.title}`}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
