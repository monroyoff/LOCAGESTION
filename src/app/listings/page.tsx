'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useSpace } from '@/lib/context/space-context';
import { formatFCFA, computeEntryCost, formatDateFR } from '@/lib/money/format';
import { RentalListing } from '@/lib/types';
import { MOCK_RENTAL_LISTINGS, COUNTRIES_CITIES } from '@/lib/data/mock-data';
import { PublishListingModal } from '@/components/listings/PublishListingModal';
import { EditListingModal } from '@/components/listings/EditListingModal';
import { SkeletonListingGrid } from '@/components/ui/SkeletonLoader';
import { ListingsService, resolveListingAuthorCompany, resolveListingAuthorRole } from '@/lib/services/listings-service';
import { LeaseService, LandlordNotification } from '@/lib/services/lease-service';
import { notifyAction, notifyPublish } from '@/lib/notifications/action-notifier';
import {
  getUserResidenceCountry,
  getUserResidenceCity,
  getUserResidenceDistrict,
  setUserResidenceDistrict,
  detectUserGeoLocation,
  requestUserGeolocationWithFeedback,
  calculateDistanceKm,
  resolveLocationCoordinates,
  UserGeoLocation,
} from '@/lib/services/geo-service';
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
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Share2,
  Building2,
  Clock,
  ArrowRight,
  RotateCcw,
  Check,
  Globe,
  Coins,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Navigation,
  Layers,
  Pencil,
  Trash2,
  PauseCircle,
  PlayCircle,
  AlertCircle,
  User,
  MessageSquare,
  Copy,
  Tag,
} from 'lucide-react';

const ALL_CITIES = Array.from(
  new Set(Object.values(COUNTRIES_CITIES).flatMap((c) => c.cities))
).sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));

const PRICE_PRESETS = [
  { label: 'Tous les montants', min: 0, max: 0 },
  { label: '< 50 000 FCFA', min: 0, max: 50000 },
  { label: '50 000 - 100 000 FCFA', min: 50000, max: 100000 },
  { label: '< 100 000 FCFA', min: 0, max: 100000 },
  { label: '100 000 - 250 000 FCFA', min: 100000, max: 250000 },
  { label: '250 000 - 500 000 FCFA', min: 250000, max: 500000 },
  { label: '500 000 - 1 000 000 FCFA', min: 500000, max: 1000000 },
  { label: '> 1 000 000 FCFA', min: 1000000, max: 0 },
];

const PROPERTY_TYPES = ['Tous', 'Chambre salon sanitaire', 'Appartement', 'Meublé', 'Studio', 'Villa', 'Bureau', 'Boutique', 'Autres'];

export default function ListingsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { activeSpace, switchSpace, isLandlord, isTenant, isDemarcheur, user } = useSpace();

  // Mode d'affichage : Catalogue public ('all') vs Mes publications ('my_listings')
  const [activeView, setActiveView] = useState<'all' | 'my_listings'>('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedListingForEdit, setSelectedListingForEdit] = useState<RentalListing | null>(null);
  const [listingToDelete, setListingToDelete] = useState<RentalListing | null>(null);
  const [myListingsFilter, setMyListingsFilter] = useState<'all' | 'disponible' | 'en_pause' | 'reserve_loue'>('all');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  // Pays de résidence renseigné lors de l'inscription (mis par défaut pour toute recherche)
  const [selectedCountry, setSelectedCountry] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryCountry = params.get('country');
      if (queryCountry && (queryCountry in COUNTRIES_CITIES || queryCountry === 'all')) {
        return queryCountry;
      }
    }
    return getUserResidenceCountry();
  });
  const [selectedCity, setSelectedCity] = useState('all');
  const [currentDistrict, setCurrentDistrict] = useState<string>(() => getUserResidenceDistrict());
  const [pricePresetIdx, setPricePresetIdx] = useState(0);
  const [customMinPrice, setCustomMinPrice] = useState<string>('');
  const [customMaxPrice, setCustomMaxPrice] = useState<string>('');
  const [selectedPropertyType, setSelectedPropertyType] = useState('Tous');
  // Tri prioritaire par proximité géographique / GPS
  const [sortBy, setSortBy] = useState<'proximity' | 'featured' | 'price_asc' | 'price_desc' | 'surface_desc'>('proximity');

  // Géolocalisation dynamique de l'utilisateur
  const [userLocation, setUserLocation] = useState<UserGeoLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;
    setIsLocating(true);
    detectUserGeoLocation()
      .then((geo) => {
        if (isMounted) {
          setUserLocation(geo);
          setIsLocating(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLocating(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Écoute de mise à jour du profil d'inscription
  useEffect(() => {
    const handleResidenceUpdate = () => {
      const country = getUserResidenceCountry();
      const dist = getUserResidenceDistrict();
      setSelectedCountry(country);
      setCurrentDistrict(dist);
      detectUserGeoLocation().then((geo) => setUserLocation(geo)).catch(() => {});
    };
    window.addEventListener('locagestion:residence_updated', handleResidenceUpdate);
    return () => window.removeEventListener('locagestion:residence_updated', handleResidenceUpdate);
  }, []);

  const handleDistrictChange = (dist: string) => {
    setCurrentDistrict(dist);
    setUserResidenceDistrict(dist);
    const resolved = resolveLocationCoordinates(selectedCountry, 'Cotonou', dist);
    setUserLocation({
      country: selectedCountry,
      city: 'Cotonou',
      district: dist,
      latitude: resolved.lat,
      longitude: resolved.lng,
      source: 'manual',
      label: `${dist}, Cotonou (${selectedCountry})`,
    });
    showToast(`Position actuelle définie sur : ${dist}. Annonces classées par proximité.`);
  };

  const handleRefreshGPS = async () => {
    setIsLocating(true);
    try {
      const res = await requestUserGeolocationWithFeedback();
      setUserLocation(res.location);
      showToast(res.message);
    } catch (e) {
      showToast('Position GPS actualisée.');
    } finally {
      setIsLocating(false);
    }
  };

  // Modals & Notifications
  const [listings, setListings] = useState<RentalListing[]>(() => {
    if (typeof window !== 'undefined') {
      return ListingsService.getAllListings();
    }
    return [];
  });
  const getTodayIsoDate = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [selectedListingForDetail, setSelectedListingForDetail] = useState<RentalListing | null>(null);
  const [currentDetailPhotoIdx, setCurrentDetailPhotoIdx] = useState(0);
  const [selectedListingForVisit, setSelectedListingForVisit] = useState<RentalListing | null>(null);
  const [visitDate, setVisitDate] = useState<string>(getTodayIsoDate);
  const [visitTimeSlot, setVisitTimeSlot] = useState('15:00 - 17:00');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenVisitModal = (listing: RentalListing) => {
    setVisitDate(getTodayIsoDate());
    setSelectedListingForVisit(listing);
  };

  // Charger les annonces centralisées via ListingsService
  useEffect(() => {
    const loadListings = () => {
      const all = ListingsService.getAllListings();
      setListings(all);
    };

    loadListings();
    window.addEventListener('locagestion:listings_updated', loadListings);
    window.addEventListener('storage', loadListings);
    return () => {
      window.removeEventListener('locagestion:listings_updated', loadListings);
      window.removeEventListener('storage', loadListings);
    };
  }, []);

  // Synchronisation de l'affichage avec l'URL (?view=my_listings) et les événements globaux
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'my_listings') {
        setActiveView('my_listings');
      }
      const handleSwitch = (e: Event) => {
        const custom = e as CustomEvent<{ view?: string }>;
        if (custom.detail?.view === 'my_listings') {
          setActiveView('my_listings');
        } else if (custom.detail?.view === 'all') {
          setActiveView('all');
        }
      };
      window.addEventListener('locagestion:switch_listings_view', handleSwitch);
      return () => {
        window.removeEventListener('locagestion:switch_listings_view', handleSwitch);
      };
    }
  }, []);

  const handleSwitchView = (view: 'all' | 'my_listings') => {
    setActiveView(view);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (view === 'my_listings') {
        url.searchParams.set('view', 'my_listings');
      } else {
        url.searchParams.delete('view');
      }
      window.history.replaceState({}, '', url.toString());
      window.dispatchEvent(new CustomEvent('locagestion:switch_listings_view', { detail: { view } }));
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handlePublishListing = (newListing: RentalListing) => {
    const enriched: RentalListing = {
      ...newListing,
      authorId: user?.id || newListing.authorId,
      authorName: user?.name || newListing.authorName || 'Bailleur Certifié',
      authorCompany: newListing.authorCompany?.trim() || user?.companyName?.trim() || undefined,
      authorEmail: user?.email || newListing.authorEmail,
      authorPhone: user?.phone || newListing.authorPhone,
      authorRole: user?.role || activeSpace || newListing.authorRole || 'bailleur',
      authorAvatar: user?.avatarUrl || newListing.authorAvatar,
      createdAt: new Date().toLocaleDateString('fr-FR'),
      viewsCount: 0,
      inquiriesCount: 0,
    };
    ListingsService.createListing(enriched);
    showToast(`Annonce « ${enriched.title} » publiée avec succès !`);
    notifyPublish(
      `Votre annonce « ${enriched.title} » est désormais en ligne et diffusée avec succès sur toute la plateforme !`
    );
  };

  // Publications de l'utilisateur connecté
  const myListings = useMemo(() => {
    return ListingsService.getUserListings(user, activeSpace);
  }, [listings, user, activeSpace]);

  const filteredMyListings = useMemo(() => {
    if (myListingsFilter === 'disponible') {
      return myListings.filter((l) => l.status === 'disponible');
    }
    if (myListingsFilter === 'en_pause') {
      return myListings.filter((l) => l.status === 'en_pause');
    }
    if (myListingsFilter === 'reserve_loue') {
      return myListings.filter((l) => l.status === 'reserve' || l.status === 'loue');
    }
    return myListings;
  }, [myListings, myListingsFilter]);

  const handleTogglePause = (id: string) => {
    const updated = ListingsService.togglePause(id);
    if (updated) {
      setListings((prev) => prev.map((l) => (l.id === id ? updated : l)));
      if (updated.status === 'en_pause') {
        showToast(`Annonce mise en pause : elle est temporairement masquée des recherches publiques.`);
      } else {
        showToast(`Annonce réactivée : elle est de nouveau visible en ligne !`);
      }
    }
  };

  const handleOpenEdit = (listing: RentalListing) => {
    setSelectedListingForEdit(listing);
    setEditModalOpen(true);
  };

  const handleSaveEdit = (id: string, updates: Partial<RentalListing>) => {
    const updated = ListingsService.updateListing(id, updates);
    if (updated) {
      setListings((prev) => prev.map((l) => (l.id === id ? updated : l)));
      if (selectedListingForDetail && selectedListingForDetail.id === id) {
        setSelectedListingForDetail(updated);
      }
    }
    setEditModalOpen(false);
    setSelectedListingForEdit(null);
    showToast(`Modifications enregistrées avec succès !`);
  };

  const handleDeleteListing = (id: string) => {
    ListingsService.deleteListing(id);
    setListings((prev) => prev.filter((l) => l.id !== id));
    if (selectedListingForEdit && selectedListingForEdit.id === id) {
      setEditModalOpen(false);
      setSelectedListingForEdit(null);
    }
    showToast(`Annonce supprimée définitivement.`);
  };

  // Sync with URL Query Parameters (ex: from Global Header Search or ?action=publish)
  useEffect(() => {
    const handleUrlActions = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const action = params.get('action');
        if (action === 'publish' || action === 'new' || params.get('publish') === 'true') {
          setPublishModalOpen(true);
        }
        const q = params.get('q');
        const country = params.get('country');
        const city = params.get('city');
        const maxPrice = params.get('maxPrice');
        const type = params.get('type');

        if (q) setSearchQuery(q);
        if (country && (country in COUNTRIES_CITIES || country === 'all')) {
          setSelectedCountry(country);
        }
        if (city) setSelectedCity(city);
        if (maxPrice) setCustomMaxPrice(maxPrice);
        if (type && PROPERTY_TYPES.includes(type)) setSelectedPropertyType(type);
      }
    };

    handleUrlActions();

    const handleOpenPublish = () => setPublishModalOpen(true);
    window.addEventListener('locagestion:open_publish_listing', handleOpenPublish);
    return () => {
      window.removeEventListener('locagestion:open_publish_listing', handleOpenPublish);
    };
  }, []);

  // When country changes, reset city if it does not belong to the selected country
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country);
    if (country === 'all') {
      setSelectedCity('all');
    } else {
      const validCities = COUNTRIES_CITIES[country]?.cities || [];
      if (!validCities.includes(selectedCity)) {
        setSelectedCity('all');
      }
    }
  };

  // Cities available based on country selection
  const availableCities = useMemo(() => {
    if (selectedCountry === 'all') {
      return ALL_CITIES;
    }
    return COUNTRIES_CITIES[selectedCountry]?.cities || [];
  }, [selectedCountry]);

  // Count available listings per country
  const countryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    listings.forEach((l) => {
      counts[l.country] = (counts[l.country] || 0) + 1;
    });
    return counts;
  }, [listings]);

  // Compute Active Price Range
  const { minRent, maxRent } = useMemo(() => {
    if (customMinPrice || customMaxPrice) {
      return {
        minRent: customMinPrice ? parseInt(customMinPrice, 10) || 0 : 0,
        maxRent: customMaxPrice ? parseInt(customMaxPrice, 10) || 0 : 0,
      };
    }
    const preset = PRICE_PRESETS[pricePresetIdx];
    return { minRent: preset.min, maxRent: preset.max };
  }, [pricePresetIdx, customMinPrice, customMaxPrice]);

  // Active user coordinates for proximity calculation
  const userCoords = useMemo(() => {
    if (userLocation) {
      return { lat: userLocation.latitude, lng: userLocation.longitude };
    }
    const country = selectedCountry !== 'all' ? selectedCountry : getUserResidenceCountry();
    const city = getUserResidenceCity();
    const district = currentDistrict || getUserResidenceDistrict();
    return resolveLocationCoordinates(country, city, district);
  }, [userLocation, selectedCountry, currentDistrict]);

  // Filter listings & Calculate GPS Proximity
  const filteredListings = useMemo(() => {
    const list = listings.filter((l) => {
      // Exclure les annonces en pause du catalogue public général
      if (l.status === 'en_pause') {
        return false;
      }

      const q = searchQuery.trim().toLowerCase();

      // PRIORITÉ ABSOLUE : RECHERCHE PAR RÉFÉRENCE UNIQUE OU ID
      // Si la recherche correspond à la référence d'une annonce (ex: LOCA-BJ-17635) ou à son ID,
      // on l'affiche IMMÉDIATEMENT sur toute la plateforme, sans restriction de pays, de ville, de type ou de budget !
      if (q) {
        const refCode = (l.referenceCode || '').toLowerCase();
        const idLower = (l.id || '').toLowerCase();
        const cleanQ = q.replace(/[^a-z0-9]/gi, '');
        const cleanRef = refCode.replace(/[^a-z0-9]/gi, '');
        const cleanId = idLower.replace(/[^a-z0-9]/gi, '');

        const isRefMatch =
          refCode === q ||
          idLower === q ||
          refCode.includes(q) ||
          idLower.includes(q) ||
          (cleanQ.length >= 3 && cleanRef.includes(cleanQ)) ||
          (cleanQ.length >= 3 && cleanId.includes(cleanQ));

        if (isRefMatch) {
          return true; // Trouvé instantanément sur toute la plateforme, sans aucune barrière de pays ou de ville !
        }
      }

      // 1. Country Filter (Par défaut strict Bénin selon le profil utilisateur)
      if (selectedCountry !== 'all' && l.country !== selectedCountry) {
        return false;
      }

      // 2. City Filter
      if (selectedCity !== 'all' && l.city !== selectedCity) {
        return false;
      }

      // 3. Property Type Filter
      if (selectedPropertyType !== 'Tous' && l.propertyType !== selectedPropertyType) {
        return false;
      }

      // 4. Rent Amount Filter
      if (minRent > 0 && l.monthlyRent < minRent) {
        return false;
      }
      if (maxRent > 0 && l.monthlyRent > maxRent) {
        return false;
      }

      // 5. Text Search (title, district, landmark, amenities, city, country, author, reference)
      if (q) {
        const matchesTitle = l.title.toLowerCase().includes(q);
        const matchesDistrict = (l.district || '').toLowerCase().includes(q);
        const matchesLandmark = (l.landmark || '').toLowerCase().includes(q);
        const matchesCity = (l.city || '').toLowerCase().includes(q);
        const matchesCountry = (l.country || '').toLowerCase().includes(q);
        const matchesAmenities = l.amenities?.some((a) => a.toLowerCase().includes(q));
        const matchesAuthor =
          (l.authorName || '').toLowerCase().includes(q) ||
          (l.authorCompany || '').toLowerCase().includes(q);
        const matchesRef =
          (l.referenceCode || '').toLowerCase().includes(q) || l.id.toLowerCase().includes(q);

        if (
          !matchesTitle &&
          !matchesDistrict &&
          !matchesLandmark &&
          !matchesCity &&
          !matchesCountry &&
          !matchesAmenities &&
          !matchesAuthor &&
          !matchesRef
        ) {
          return false;
        }
      }

      return true;
    }).map((l) => {
      let lat = l.latitude;
      let lng = l.longitude;
      if (lat === undefined || lng === undefined) {
        const resolved = resolveLocationCoordinates(l.country, l.city, l.district);
        lat = resolved.lat;
        lng = resolved.lng;
      }
      const distanceKm = userCoords
        ? calculateDistanceKm(userCoords.lat, userCoords.lng, lat, lng)
        : undefined;

      return {
        ...l,
        latitude: lat,
        longitude: lng,
        distanceKm,
      };
    });

    return list.sort((a, b) => {
      // 1. Tri prioritaire par proximité géographique / GPS
      if (sortBy === 'proximity') {
        const distA = a.distanceKm ?? 9999;
        const distB = b.distanceKm ?? 9999;
        return distA - distB;
      }
      if (sortBy === 'price_asc') return a.monthlyRent - b.monthlyRent;
      if (sortBy === 'price_desc') return b.monthlyRent - a.monthlyRent;
      if (sortBy === 'surface_desc') return b.surface - a.surface;
      // Default: verified first, then proximity
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      return (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999);
    });
  }, [
    listings,
    selectedCountry,
    selectedCity,
    selectedPropertyType,
    minRent,
    maxRent,
    searchQuery,
    sortBy,
    userCoords,
  ]);

  // Clear all filters back to default (Pays de résidence d'inscription par défaut)
  const resetFilters = () => {
    const defaultCountry = getUserResidenceCountry();
    setSearchQuery('');
    setSelectedCountry(defaultCountry);
    setSelectedCity('all');
    setPricePresetIdx(0);
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setSelectedPropertyType('Tous');
    setSortBy('proximity');
    showToast(`Filtres réinitialisés sur votre pays de résidence d'inscription (${defaultCountry}) et proximité.`);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCountry !== getUserResidenceCountry() ||
    selectedCity !== 'all' ||
    pricePresetIdx !== 0 ||
    customMinPrice !== '' ||
    customMaxPrice !== '' ||
    selectedPropertyType !== 'Tous';

  // Calculate total upfront move-in cost (Loyer + Caution + Avance + Agence + Eau/Élec)
  const calculateTotalEntryCost = (l: RentalListing) => {
    return computeEntryCost(l).total;
  };

  const handleContactPublisher = (listing: RentalListing) => {
    const publisherName = listing.authorCompany?.trim()
      ? listing.authorCompany.trim()
      : listing.authorName?.trim()
      ? listing.authorName.trim()
      : resolveListingAuthorCompany(listing) || 'Bailleur / Propriétaire';

    const convId = `conv-listing-${listing.id}`;
    const initialText = `Bonjour, je vous contacte au sujet de votre annonce « ${listing.title} » située à ${listing.district}, ${listing.city} (${listing.surface} m², ${formatFCFA(listing.monthlyRent)}/mois). Ce bien est-il toujours disponible ?`;

    try {
      const STORAGE_KEY_CONVERSATIONS = 'locagestion:conversations:v1';
      const stored = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      let existingList: any[] = [];
      if (stored) {
        try {
          existingList = JSON.parse(stored);
        } catch {}
      }
      if (!Array.isArray(existingList)) existingList = [];

      const existingIndex = existingList.findIndex(
        (c) => c.id === convId || (c.listingId && c.listingId === listing.id)
      );

      const candidateName = user?.name || user?.firstName || 'Candidat Locataire';
      const candidatePhone = user?.phone || '';
      const candidateEmail = user?.email || '';
      const candidateAvatar = user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
      const publisherAvatar = listing.authorAvatar || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400';

      const newMsg = {
        id: `m-${Date.now()}`,
        sender: 'them' as const,
        senderRole: 'locataire' as const,
        senderName: candidateName,
        senderAvatar: candidateAvatar,
        text: initialText,
        time: 'À l’instant',
        status: 'sent' as const,
      };

      if (existingIndex >= 0) {
        existingList[existingIndex] = {
          ...existingList[existingIndex],
          messages: [...(existingList[existingIndex].messages || []), newMsg],
          lastMessage: initialText,
          lastMessageTime: 'À l’instant',
          isArchived: false,
          visitorName: candidateName,
          visitorPhone: candidatePhone,
          visitorEmail: candidateEmail,
          visitorAvatar: candidateAvatar,
          publisherName,
          publisherAvatar,
          tenantAvatar: candidateAvatar,
          unreadCount: (existingList[existingIndex].unreadCount || 0) + 1,
          hasUnread: true,
          unreadBy: 'bailleur',
        };
      } else {
        const newConv = {
          id: convId,
          tenantName: publisherName,
          publisherName,
          publisherAvatar,
          visitorName: candidateName,
          visitorPhone: candidatePhone,
          visitorEmail: candidateEmail,
          visitorAvatar: candidateAvatar,
          tenantAvatar: candidateAvatar,
          unreadCount: 1,
          hasUnread: true,
          unreadBy: 'bailleur',
          isOnline: true,
          propertyTitle: listing.title,
          propertyUnit: `${listing.district}, ${listing.city}`,
          propertySurface: `${listing.surface} m²`,
          propertyPrice: listing.monthlyRent,
          propertyThumbnail:
            (listing.images && listing.images[0]) ||
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
          lastMessage: initialText,
          lastMessageTime: 'À l’instant',
          isRead: false,
          isArchived: false,
          listingId: listing.id,
          authorId: listing.authorId,
          authorName: listing.authorName,
          authorCompany: listing.authorCompany,
          authorEmail: listing.authorEmail,
          authorPhone: listing.authorPhone,
          authorRole: listing.authorRole,
          messages: [newMsg],
        };
        existingList.unshift(newConv);
      }

      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(existingList));

      // Notification pour le Bailleur / Démarcheur dans sa cloche
      const notifId = `notif-msg-${Date.now()}`;
      const landlordNotif: LandlordNotification = {
        id: notifId,
        title: `💬 Nouveau message : ${listing.title}`,
        message: `${candidateName} (${candidatePhone || 'En direct'}) vous a contacté au sujet de « ${listing.title} » (${listing.district}, ${listing.city}).`,
        time: 'À l’instant',
        timestamp: new Date().toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        type: 'message_received',
        read: false,
        listingId: listing.id,
        convId: convId,
        tenantName: candidateName,
        property: listing.title,
        unit: `${listing.district}, ${listing.city}`,
        visitorName: candidateName,
        visitorPhone: candidatePhone,
        visitorEmail: candidateEmail,
        authorId: listing.authorId,
        authorName: listing.authorName,
        authorCompany: listing.authorCompany,
        authorEmail: listing.authorEmail,
        authorPhone: listing.authorPhone,
        authorRole: listing.authorRole,
        emailSentTo: listing.authorEmail,
      };
      LeaseService.addLandlordNotification(landlordNotif);

      window.dispatchEvent(new CustomEvent('locagestion:conversations_updated'));
      window.dispatchEvent(new CustomEvent('locagestion:notifications_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Erreur ouverture discussion annonce:', e);
    }

    router.push(`/messages?convId=${encodeURIComponent(convId)}&listingId=${encodeURIComponent(listing.id)}`);
  };

  const handleBookVisitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListingForVisit) return;
    if (visitDate < getTodayIsoDate()) {
      alert("La date de visite ne peut pas être antérieure à la date d'aujourd'hui.");
      return;
    }

    const listing = selectedListingForVisit;
    const visitorName = user?.name || user?.firstName || 'Candidat Locataire';
    const visitorPhone = user?.phone || 'Téléphone non précisé';
    const visitorEmail = user?.email || 'Email non précisé';
    const convId = `conv-listing-${listing.id}`;
    const formattedVisitDate = formatDateFR(visitDate);
    const nowFormatted = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const visitMessageText = `📅 DEMANDE DE VISITE OFFICIELLE\n\nBonjour, je souhaite planifier une visite pour votre bien « ${listing.title} » situé à ${listing.district}, ${listing.city}.\n\n🗓️ Date souhaitée : ${formattedVisitDate}\n⏰ Créneau horaire : ${visitTimeSlot}\n👤 Candidat : ${visitorName}\n📞 Téléphone : ${visitorPhone}\n\nMerci de bien vouloir me confirmer votre disponibilité.`;

    // 1. Notification officielle pour le Bailleur / Démarcheur
    const notifId = `notif-visit-${Date.now()}`;
    const landlordNotif: LandlordNotification = {
      id: notifId,
      title: `📅 Demande de visite : ${listing.title}`,
      message: `${visitorName} (${visitorPhone}) souhaite visiter votre bien « ${listing.title} » (${listing.district}, ${listing.city}) le ${formattedVisitDate} sur le créneau ${visitTimeSlot}.`,
      time: 'À l’instant',
      timestamp: nowFormatted,
      type: 'visit_requested',
      read: false,
      listingId: listing.id,
      convId: convId,
      tenantName: visitorName,
      property: listing.title,
      unit: `${listing.district}, ${listing.city}`,
      visitDate: formattedVisitDate,
      visitTimeSlot: visitTimeSlot,
      visitorName: visitorName,
      visitorPhone: visitorPhone,
      visitorEmail: visitorEmail,
      authorId: listing.authorId,
      authorName: listing.authorName,
      authorCompany: listing.authorCompany,
      authorEmail: listing.authorEmail,
      authorPhone: listing.authorPhone,
      authorRole: listing.authorRole,
      emailSentTo: listing.authorEmail,
    };

    LeaseService.addLandlordNotification(landlordNotif);

    // 2. Création / Envoi automatique dans la boîte de discussion
    try {
      const STORAGE_KEY_CONVERSATIONS = 'locagestion:conversations:v1';
      const stored = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      let existingList: any[] = [];
      if (stored) {
        try {
          existingList = JSON.parse(stored);
        } catch {}
      }
      if (!Array.isArray(existingList)) existingList = [];

      const publisherName = listing.authorCompany?.trim()
        ? listing.authorCompany.trim()
        : listing.authorName?.trim()
        ? listing.authorName.trim()
        : resolveListingAuthorCompany(listing) || 'Bailleur / Propriétaire';

      const existingIndex = existingList.findIndex(
        (c) => c.id === convId || (c.listingId && c.listingId === listing.id)
      );

      const visitorAvatar = user?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
      const publisherAvatar = listing.authorAvatar || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400';

      const newMsg = {
        id: `m-${Date.now()}`,
        sender: 'them' as const,
        senderRole: 'locataire' as const,
        senderName: visitorName,
        senderAvatar: visitorAvatar,
        text: visitMessageText,
        time: 'À l’instant',
        status: 'sent' as const,
      };

      if (existingIndex >= 0) {
        const existingConv = existingList[existingIndex];
        existingList[existingIndex] = {
          ...existingConv,
          messages: [...(existingConv.messages || []), newMsg],
          lastMessage: `📅 Demande de visite : ${formattedVisitDate} (${visitTimeSlot})`,
          lastMessageTime: 'À l’instant',
          isArchived: false,
          visitorName,
          visitorPhone,
          visitorEmail,
          visitorAvatar,
          publisherName,
          publisherAvatar,
          tenantAvatar: visitorAvatar,
          unreadCount: (existingConv.unreadCount || 0) + 1,
          hasUnread: true,
          unreadBy: 'bailleur',
        };
      } else {
        const newConv = {
          id: convId,
          tenantName: publisherName,
          publisherName,
          publisherAvatar,
          visitorName,
          visitorPhone,
          visitorEmail,
          visitorAvatar,
          tenantAvatar: visitorAvatar,
          unreadCount: 1,
          hasUnread: true,
          unreadBy: 'bailleur',
          isOnline: true,
          propertyTitle: listing.title,
          propertyUnit: `${listing.district}, ${listing.city}`,
          propertySurface: `${listing.surface} m²`,
          propertyPrice: listing.monthlyRent,
          propertyThumbnail:
            (listing.images && listing.images[0]) ||
            'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400',
          lastMessage: `📅 Demande de visite : ${formattedVisitDate} (${visitTimeSlot})`,
          lastMessageTime: 'À l’instant',
          isRead: false,
          isArchived: false,
          listingId: listing.id,
          authorId: listing.authorId,
          authorName: listing.authorName,
          authorCompany: listing.authorCompany,
          authorEmail: listing.authorEmail,
          authorPhone: listing.authorPhone,
          authorRole: listing.authorRole,
          messages: [newMsg],
        };
        existingList.unshift(newConv);
      }

      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(existingList));
      window.dispatchEvent(new CustomEvent('locagestion:conversations_updated'));
      window.dispatchEvent(new CustomEvent('locagestion:notifications_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Erreur enregistrement message visite:', e);
    }

    const msg = `Demande de visite confirmée pour le ${formattedVisitDate} (${visitTimeSlot}) — ${listing.title} ! Notification et message envoyés avec succès au bailleur.`;
    showToast(msg);
    notifyAction(msg, 'Demande de visite transmise !', 'success');
    setSelectedListingForVisit(null);
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex">
      {/* 1. Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSpace={activeSpace}
        onSpaceChange={switchSpace}
      />

      {/* 2. Main Layout */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenQuickAction={() => {}}
        />

        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Top Title & Publisher Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Bonjour {user?.firstName || (user?.name ? user.name.split(' ')[0] : 'Cher Partenaire')} 👋 — Annonces & Visites
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-brand-50 text-brand-600 border border-brand-200">
                  Zone UEMOA & CEMAC
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Explorez les logements vérifiés, planifiez vos visites ou publiez votre propre annonce (location, colocation, sous-location ou reprise de bail).
              </p>
            </div>

            {/* Bouton Publier une annonce accessible à la fois aux bailleurs et aux locataires */}
            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={() => setPublishModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-extrabold shadow-pink-glow active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Publier une annonce</span>
              </button>
            </div>
          </div>

          {/* ==================================================================== */}
          {/* SÉLECTEUR DE VUE : CATALOGUE PUBLIC vs MES PUBLICATIONS            */}
          {/* ==================================================================== */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="p-1 bg-slate-100 rounded-2xl border border-slate-200/80 flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleSwitchView('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeView === 'all'
                    ? 'bg-white text-slate-900 shadow-sm font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Compass className={`w-4 h-4 ${activeView === 'all' ? 'text-brand-500' : 'text-slate-400'}`} />
                <span>Toutes les annonces</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-700 font-extrabold">
                  {filteredListings.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleSwitchView('my_listings')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeView === 'my_listings'
                    ? 'bg-gradient-to-r from-brand-500 to-rose-600 text-white shadow-md shadow-brand-500/25 font-black'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Mes publications</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    activeView === 'my_listings'
                      ? 'bg-white/20 text-white'
                      : 'bg-brand-50 text-brand-600 border border-brand-200'
                  }`}
                >
                  {myListings.length}
                </span>
              </button>
            </div>

            {activeView === 'my_listings' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPublishModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nouvelle annonce</span>
                </button>
              </div>
            )}
          </div>

          {activeView === 'my_listings' ? (
            <div className="space-y-6">
              {/* KPIs de Mes Publications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-soft">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    Total Publications
                  </span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {myListings.length}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Sur toute la zone UEMOA/CEMAC
                  </span>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-soft">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block">
                    Actives & En Ligne
                  </span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">
                    {myListings.filter((l) => l.status === 'disponible').length}
                  </div>
                  <span className="text-[11px] text-emerald-700/80 block mt-0.5">
                    Visibles par les visiteurs
                  </span>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-soft">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
                    En Pause
                  </span>
                  <div className="text-2xl font-black text-amber-600 mt-1">
                    {myListings.filter((l) => l.status === 'en_pause').length}
                  </div>
                  <span className="text-[11px] text-amber-700/80 block mt-0.5">
                    Temporairement masquées
                  </span>
                </div>

                <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-soft">
                  <span className="text-[10px] font-black uppercase tracking-wider text-brand-600 block">
                    Intérêt & Contacts
                  </span>
                  <div className="text-2xl font-black text-brand-600 mt-1">
                    {myListings.reduce((sum, l) => sum + (l.inquiriesCount || 0), 0)}
                  </div>
                  <span className="text-[11px] text-slate-400 block mt-0.5">
                    Demandes de visite reçues
                  </span>
                </div>
              </div>

              {/* Filtres par statut */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1.5 p-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex-wrap">
                  <button
                    type="button"
                    onClick={() => setMyListingsFilter('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      myListingsFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Toutes ({myListings.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMyListingsFilter('disponible')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      myListingsFilter === 'disponible'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>En ligne ({myListings.filter((l) => l.status === 'disponible').length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMyListingsFilter('en_pause')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      myListingsFilter === 'en_pause'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <PauseCircle className="w-3.5 h-3.5" />
                    <span>En pause ({myListings.filter((l) => l.status === 'en_pause').length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMyListingsFilter('reserve_loue')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      myListingsFilter === 'reserve_loue'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Réservées / Louées ({myListings.filter((l) => l.status === 'reserve' || l.status === 'loue').length})
                  </button>
                </div>

                <div className="text-xs text-slate-500">
                  Affichage de <span className="font-bold text-slate-800">{filteredMyListings.length}</span> publication{filteredMyListings.length > 1 ? 's' : ''}
                </div>
              </div>

              {/* Liste de Mes Publications */}
              {filteredMyListings.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-soft max-w-lg mx-auto space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-brand-50 text-brand-500 flex items-center justify-center mx-auto">
                    <Layers className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-black text-lg text-slate-900">
                      {myListings.length === 0 ? "Vous n'avez pas encore publié d'annonce" : 'Aucune annonce avec ce statut'}
                    </h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {myListings.length === 0
                        ? 'Publiez votre premier logement dès maintenant pour recevoir des demandes de visite et trouver des locataires qualifiés.'
                        : 'Modifiez votre filtre pour afficher vos autres publications.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPublishModalOpen(true)}
                    className="py-2.5 px-5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black shadow-pink-glow transition-all cursor-pointer inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Publier une annonce</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredMyListings.map((listing) => {
                    const isPaused = listing.status === 'en_pause';

                    return (
                      <div
                        key={listing.id}
                        className={`rounded-3xl border transition-all flex flex-col justify-between overflow-hidden group shadow-soft hover:shadow-lg ${
                          isPaused
                            ? 'bg-amber-50/20 border-amber-300/80 ring-1 ring-amber-400/20'
                            : 'bg-white border-slate-200/90 hover:border-brand-500/40'
                        }`}
                      >
                        {/* Photo avec badge de statut - Cliquer pour ouvrir la gestion */}
                        <div
                          onClick={() => handleOpenEdit(listing)}
                          className="relative aspect-[16/10] overflow-hidden bg-slate-900 cursor-pointer"
                          title="Cliquez pour gérer et modifier cette annonce"
                        >
                          <img
                            src={listing.images[0] || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80'}
                            alt={listing.title}
                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                              isPaused ? 'grayscale-[30%] opacity-80' : ''
                            }`}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

                          {/* Statut en haut à gauche */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap">
                            {isPaused ? (
                              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-amber-500 text-white shadow-md flex items-center gap-1">
                                <PauseCircle className="w-3.5 h-3.5" />
                                <span>En pause • Masquée</span>
                              </span>
                            ) : listing.status === 'disponible' ? (
                              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-600 text-white shadow-md flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
                                <span>En ligne • Active</span>
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-slate-800 text-white shadow-md">
                                {listing.status === 'reserve' ? 'Réservé' : 'Loué'}
                              </span>
                            )}
                            <span className="px-2 py-1 rounded-xl text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                              {listing.flag} {listing.city}
                            </span>
                          </div>

                          {/* Loyer en bas à gauche */}
                          <div className="absolute bottom-3 left-3 text-white">
                            <div className="text-lg font-black tracking-tight drop-shadow-md">
                              {formatFCFA(listing.monthlyRent)}
                              <span className="text-xs font-normal opacity-90">/mois</span>
                            </div>
                            <div className="text-[10px] text-slate-300 font-medium">
                              + {formatFCFA(listing.charges)} charges
                            </div>
                          </div>

                          {/* Type de bien en haut à droite */}
                          <span className="absolute top-3 right-3 px-2 py-0.5 rounded-lg text-[10px] font-black bg-white/90 backdrop-blur-sm text-slate-800 shadow-xs">
                            {listing.propertyType}
                          </span>
                        </div>

                        {/* Contenu */}
                        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                          <div className="space-y-2">
                            {/* Ligne Référence Officielle */}
                            <div className="flex items-center justify-between gap-2">
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                    navigator.clipboard.writeText(listing.referenceCode || listing.id);
                                    showToast(`Référence ${listing.referenceCode || listing.id} copiée !`);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono font-black border border-slate-200 cursor-pointer group/ref"
                                title="Cliquer pour copier la référence"
                              >
                                <span className="text-[9px] font-sans font-bold text-slate-400 uppercase">Réf</span>
                                <span className="group-hover/ref:text-brand-600 transition-colors">
                                  {listing.referenceCode || listing.id}
                                </span>
                                <Copy className="w-3 h-3 text-slate-400 group-hover/ref:text-brand-500" />
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                  Statut: {resolveListingAuthorRole(listing)}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">
                                  {listing.propertyType}
                                </span>
                              </div>
                            </div>

                            <h4
                              onClick={() => handleOpenEdit(listing)}
                              className="font-black text-sm text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1 cursor-pointer"
                              title="Cliquez pour gérer et modifier cette annonce"
                            >
                              {listing.title}
                            </h4>
                            <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                              <span className="truncate">{listing.district}, {listing.city}</span>
                            </div>
                            <p className="text-[11px] text-slate-400 italic line-clamp-1">
                              « {listing.landmark} »
                            </p>
                          </div>

                          {/* Caractéristiques */}
                          <div className="flex items-center gap-3 py-2 border-y border-slate-100 text-[11px] text-slate-600 font-semibold">
                            <span>📐 {listing.surface} m²</span>
                            <span>•</span>
                            <span>🛏️ {listing.bedrooms} ch</span>
                            <span>•</span>
                            <span>🚿 {listing.bathrooms} sdb</span>
                          </div>

                          {/* Statistiques d'engagement */}
                          <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-[11px]">
                            <span className="text-slate-500 flex items-center gap-1">
                              <Eye className="w-3.5 h-3.5 text-slate-400" />
                              <span><strong>{listing.viewsCount || 0}</strong> vues</span>
                            </span>
                            <span className="text-slate-500 flex items-center gap-1">
                              <MessageCircle className="w-3.5 h-3.5 text-brand-500" />
                              <span><strong>{listing.inquiriesCount || 0}</strong> contacts</span>
                            </span>
                          </div>

                          {/* BARRE D'ACTIONS : MODIFIER / METTRE EN PAUSE / SUPPRIMER */}
                          <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-2">
                            {/* Bouton Mettre en pause / Réactiver */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePause(listing.id);
                              }}
                              className={`py-2 px-2 rounded-xl text-[11px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer min-w-0 ${
                                isPaused
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                              }`}
                              title={isPaused ? "Réactiver l'annonce" : "Mettre en pause l'annonce"}
                            >
                              {isPaused ? (
                                <>
                                  <PlayCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">Activer</span>
                                </>
                              ) : (
                                <>
                                  <PauseCircle className="w-3.5 h-3.5 shrink-0" />
                                  <span className="truncate">Pause</span>
                                </>
                              )}
                            </button>

                            {/* Bouton Gérer / Modifier */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEdit(listing);
                              }}
                              className="py-2 px-2 rounded-xl text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors flex items-center justify-center gap-1 cursor-pointer min-w-0"
                              title="Gérer et modifier l'annonce"
                            >
                              <Pencil className="w-3.5 h-3.5 shrink-0 text-slate-600" />
                              <span className="truncate">Gérer</span>
                            </button>

                            {/* Bouton Supprimer */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setListingToDelete(listing);
                              }}
                              className="py-2 px-2 rounded-xl text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition-colors flex items-center justify-center gap-1 cursor-pointer min-w-0"
                              title="Supprimer définitivement cette publication"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Supprimer</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Console de recherche & filtres multi-critères */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-soft space-y-4">
            {/* Ligne 1 : Mot-clé, Pays, Ville, Montant (Les 3 filtres demandés) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Filtre 1 : Pays */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-1.5">
                  <Globe className="w-3.5 h-3.5 text-brand-500" />
                  <span>Pays</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCountry}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">🌍 Tous les pays ({Object.keys(COUNTRIES_CITIES).length})</option>
                    {Object.entries(COUNTRIES_CITIES).map(([country, data]) => (
                      <option key={country} value={country}>
                        {data.flag} {country}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Filtre 2 : Ville */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-500" />
                  <span>Ville</span>
                </label>
                <div className="relative">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="all">📍 Toutes les villes ({availableCities.length})</option>
                    {availableCities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Filtre 3 : Montant / Budget (FCFA) */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-1.5">
                  <Coins className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Budget Loyer (FCFA)</span>
                </label>
                <div className="relative">
                  <select
                    value={customMinPrice || customMaxPrice ? 'custom' : pricePresetIdx}
                    onChange={(e) => {
                      if (e.target.value === 'custom') return;
                      setPricePresetIdx(parseInt(e.target.value, 10));
                      setCustomMinPrice('');
                      setCustomMaxPrice('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all appearance-none cursor-pointer"
                  >
                    {PRICE_PRESETS.map((preset, idx) => (
                      <option key={idx} value={idx}>
                        💰 {preset.label}
                      </option>
                    ))}
                    {(customMinPrice || customMaxPrice) && (
                      <option value="custom">
                        Personnalisé ({customMinPrice ? `${formatFCFA(customMinPrice)} min` : ''}
                        {customMinPrice && customMaxPrice ? ' - ' : ''}
                        {customMaxPrice ? `${formatFCFA(customMaxPrice)} max` : ''})
                      </option>
                    )}
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Champ Recherche Libre (Quartier, Repère, Mot-clé) */}
              <div>
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-1.5">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <span>Recherche par mot-clé</span>
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="listings-search-input"
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Référence (ex: LOCA-BJ-...), quartier, repère, meublé..."
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Raccourcis Pays (Zone UEMOA & CEMAC) */}
            <div className="pt-2 flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-1 whitespace-nowrap hidden sm:inline">
                Pays :
              </span>
              <button
                type="button"
                onClick={() => handleCountryChange('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCountry === 'all'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                }`}
              >
                🌍 Tous ({listings.length})
              </button>
              {Object.entries(COUNTRIES_CITIES).map(([country, data]) => {
                const count = countryCounts[country] || 0;
                return (
                  <button
                    key={country}
                    type="button"
                    onClick={() => handleCountryChange(country)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                      selectedCountry === country
                        ? 'bg-rose-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    <span>{data.flag}</span>
                    <span>{country}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        selectedCountry === country ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-500'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Ligne 2 : Type de Bien, Tranches Précises Min/Max & Tri */}
            <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Type de bien (Pills) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[10px] font-bold text-slate-400 uppercase mr-1 hidden sm:inline">
                  Type :
                </span>
                {PROPERTY_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedPropertyType(type)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                      selectedPropertyType === type
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* Tri & Réinitialiser */}
              <div className="flex items-center gap-2.5 self-start md:self-auto">
                <div className="flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/60">
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
                  >
                    <option value="proximity">📍 Plus proches de moi (GPS)</option>
                    <option value="featured">⭐ En vedette</option>
                    <option value="price_asc">💰 Loyer croissant</option>
                    <option value="price_desc">💎 Loyer décroissant</option>
                    <option value="surface_desc">📐 Plus grand (m²)</option>
                  </select>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold transition-all border border-rose-200 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Effacer</span>
                  </button>
                )}
              </div>
            </div>

            {/* Badges des filtres actifs */}
            {hasActiveFilters && (
              <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-[11px] font-bold text-slate-400">Filtres actifs :</span>
                {selectedCountry !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold">
                    <span>Pays : {selectedCountry}</span>
                    <button onClick={() => setSelectedCountry('all')} className="hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedCity !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold">
                    <span>Ville : {selectedCity}</span>
                    <button onClick={() => setSelectedCity('all')} className="hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {(minRent > 0 || maxRent > 0) && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                    <span>
                      Budget : {minRent > 0 ? `${formatFCFA(minRent)} min` : ''}
                      {minRent > 0 && maxRent > 0 ? ' - ' : ''}
                      {maxRent > 0 ? `${formatFCFA(maxRent)} max` : ''}
                    </span>
                    <button
                      onClick={() => {
                        setPricePresetIdx(0);
                        setCustomMinPrice('');
                        setCustomMaxPrice('');
                      }}
                      className="hover:text-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedPropertyType !== 'Tous' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 text-[11px] font-bold">
                    <span>Type : {selectedPropertyType}</span>
                    <button onClick={() => setSelectedPropertyType('Tous')} className="hover:text-rose-500">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 text-brand-900 text-[11px] font-bold border border-brand-200">
                    <Tag className="w-3 h-3 text-brand-600" />
                    <span>Recherche : « {searchQuery} » (Tous pays et villes)</span>
                    <button onClick={() => setSearchQuery('')} className="hover:text-rose-500 ml-0.5">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Results Summary Bar */}
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1 flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                {filteredListings.length}{' '}
                {filteredListings.length > 1 ? 'logements trouvés' : 'logement trouvé'}
              </span>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] font-bold text-brand-600 hover:text-brand-700 underline cursor-pointer ml-1"
                >
                  (Filtres actifs : Cliquer ici pour réinitialiser et voir toutes les annonces)
                </button>
              )}
            </div>
            <span className="text-[11px] text-slate-400">
              Devise officielle : <strong>FCFA (XOF / XAF)</strong>
            </span>
          </div>

          {/* ==================================================================== */}
          {/* GRILLE DES RÉSULTATS                                                 */}
          {/* ==================================================================== */}
          {isLoading ? (
            <SkeletonListingGrid count={6} />
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => {
                const entryCost = computeEntryCost(listing);

                return (
                  <div
                    key={listing.id}
                    className="bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden flex flex-col justify-between group hover:shadow-card-hover transition-all"
                  >
                    <div>
                      {/* Image Header with Price Tag & Badges (Click to inspect all photos & details) */}
                      <div
                        onClick={() => {
                          setSelectedListingForDetail(listing);
                          setCurrentDetailPhotoIdx(0);
                        }}
                        className="relative h-52 overflow-hidden cursor-pointer group/img"
                        title="Cliquer pour voir toutes les photos et la description complète"
                      >
                        <img
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                        {/* Top Badges (Left) */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 flex-wrap max-w-[70%]">
                          <span className="px-2.5 py-1 rounded-full bg-brand-500 text-white text-[10px] font-black shadow-md flex items-center gap-1">
                            <span>{listing.flag}</span>
                            <span>{listing.country}</span>
                          </span>

                          <span className="px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/10">
                            {listing.propertyType}
                          </span>
                        </div>

                        {/* Top Badges (Right - Photos count) */}
                        {listing.images.length > 1 && (
                          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold border border-white/10 flex items-center gap-1 shadow-sm">
                            <ImageIcon className="w-3 h-3" />
                            <span>{listing.images.length} photos</span>
                          </div>
                        )}

                        {/* Bottom rent overlay */}
                        <div className="absolute bottom-3 left-4 right-4 text-white flex items-baseline justify-between">
                          <div>
                            <span className="text-2xl font-black tracking-tight">
                              {formatFCFA(listing.monthlyRent)}
                            </span>
                            <span className="text-xs text-slate-300 font-semibold"> / mois</span>
                          </div>
                          {listing.surface > 0 && (
                            <span className="text-xs font-bold text-white/90 bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-lg">
                              {listing.surface} m²
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Listing Content */}
                      <div className="p-5 space-y-3">
                        {/* Ligne Référence Officielle & Certification Bailleur */}
                        <div className="flex items-center justify-between gap-2">
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (typeof navigator !== 'undefined' && navigator.clipboard) {
                                navigator.clipboard.writeText(listing.referenceCode || listing.id);
                                showToast(`Référence ${listing.referenceCode || listing.id} copiée !`);
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-mono font-black border border-slate-200/90 shadow-2xs transition-all cursor-pointer group/ref"
                            title="Cliquer pour copier la référence officielle"
                          >
                            <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider">Réf</span>
                            <span className="text-slate-900 group-hover/ref:text-brand-600 transition-colors">
                              {listing.referenceCode || listing.id}
                            </span>
                            <Copy className="w-3 h-3 text-slate-400 group-hover/ref:text-brand-500 transition-colors" />
                          </div>

                          {listing.isVerified && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200/70">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Bailleur Vérifié</span>
                            </span>
                          )}
                        </div>

                        <h3
                          onClick={() => {
                            setSelectedListingForDetail(listing);
                            setCurrentDetailPhotoIdx(0);
                          }}
                          className="font-extrabold text-base text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1 cursor-pointer"
                          title="Cliquer pour voir la description complète"
                        >
                          {listing.title}
                        </h3>

                        <div className="text-xs text-slate-500 space-y-1">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1 font-bold text-slate-800">
                              <MapPin className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                              <span>
                                {listing.district}, {listing.city} ({listing.country})
                              </span>
                            </div>
                            {listing.distanceKm !== undefined && (
                              <span className="text-[10px] font-black text-brand-700 bg-brand-50 border border-brand-200 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                                <Compass className="w-3 h-3 text-brand-500" />
                                <span>{listing.distanceKm < 1 ? '< 1 km' : `~${listing.distanceKm} km`}</span>
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 italic">
                            Repère : « {listing.landmark} »
                          </p>
                        </div>

                        {/* Fonctionnalité Clé : Boîte Coût Total d'Entrée */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-50 to-tealAccent-50 border border-emerald-200/80 text-xs">
                          <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                            À Prévoir à l’Entrée (Coût Total) :
                          </span>
                          <div className="text-lg font-black text-emerald-900 mt-0.5">
                            {formatFCFA(entryCost.total)}
                          </div>
                          <span className="text-[10px] text-emerald-700 block mt-0.5">
                            {entryCost.formulaLabel}
                          </span>
                        </div>

                        {/* Description concernant le bien cochée ligne par ligne */}
                        <div className="pt-2.5 border-t border-slate-100 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>Description du bien :</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {((listing.descriptionLines && listing.descriptionLines.length > 0)
                                ? listing.descriptionLines
                                : listing.description
                                ? listing.description.split('\n').filter((l) => l.trim().length > 0)
                                : listing.amenities
                              ).length} points clés
                            </span>
                          </div>

                          <div className="space-y-1.5 bg-slate-50/90 p-2.5 rounded-xl border border-slate-100">
                            {((listing.descriptionLines && listing.descriptionLines.length > 0)
                              ? listing.descriptionLines
                              : listing.description
                              ? listing.description.split('\n').filter((l) => l.trim().length > 0)
                              : listing.amenities
                            ).map((line, idx) => (
                              <div
                                key={idx}
                                className="flex items-start gap-1.5 text-[11px] text-slate-700 font-medium"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                <span className="leading-snug">{line.replace(/^[-•*✓✔]\s*/, '')}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Identité de l'Annonceur / Agence (Visible sur toute la plateforme) */}
                        {(() => {
                          const resolvedCompany = resolveListingAuthorCompany(listing);
                          const hasCompany = Boolean(resolvedCompany);
                          const publisherName = resolvedCompany || listing.authorName || 'Bailleur Certifié';

                          return (
                            <div
                              onClick={() => {
                                setSelectedListingForDetail(listing);
                                setCurrentDetailPhotoIdx(0);
                              }}
                              className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs cursor-pointer group/pub hover:bg-slate-50/60 p-2 rounded-xl transition-colors"
                              title="Cliquer pour afficher la fiche complète de l'annonceur"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-xl bg-slate-900 text-brand-400 flex items-center justify-center text-xs font-black shrink-0 shadow-sm group-hover/pub:bg-brand-500 group-hover/pub:text-white transition-colors">
                                  {hasCompany ? (
                                    <Building2 className="w-4 h-4" />
                                  ) : (
                                    <User className="w-4 h-4" />
                                  )}
                                </div>
                                <div className="min-w-0 truncate">
                                  <span className="text-[10px] text-slate-400 block leading-tight font-medium">
                                    Publié par
                                  </span>
                                  <span className="font-extrabold text-slate-900 text-[11px] truncate block group-hover/pub:text-brand-600 transition-colors">
                                    {publisherName}
                                  </span>
                                </div>
                              </div>
                              <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                Statut: {resolveListingAuthorRole(listing)}
                              </span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-5 pt-0 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedListingForDetail(listing);
                          setCurrentDetailPhotoIdx(0);
                        }}
                        className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
                        title="Voir photos et détails complets"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleContactPublisher(listing)}
                        className="flex-1 py-2.5 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold text-center transition-all shadow-sm cursor-pointer"
                      >
                        Contacter
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenVisitModal(listing)}
                        className="flex-1 py-2.5 px-3 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold text-center shadow-pink-glow transition-all cursor-pointer"
                      >
                        Demander visite
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-soft max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Search className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-lg text-slate-900">
                  Aucun logement ne correspond à vos filtres
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Essayez d'élargir votre recherche en sélectionnant « Tous les pays », une ville différente ou en ajustant la tranche de budget.
                </p>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="py-2.5 px-5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-pink-glow transition-all cursor-pointer"
              >
                Réinitialiser tous les filtres
              </button>
            </div>
          )}
            </>
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODALE DE DEMANDE DE VISITE                                          */}
      {/* ==================================================================== */}
      {selectedListingForVisit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-400" />
                <h3 className="font-extrabold text-sm">Planifier une Visite</h3>
              </div>
              <button
                onClick={() => setSelectedListingForVisit(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookVisitSubmit} className="p-6 space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-brand-600 uppercase">Bien ciblé :</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white text-slate-700 font-bold border border-slate-200">
                    {selectedListingForVisit.propertyType}
                  </span>
                </div>
                <h4 className="font-extrabold text-xs text-slate-900">
                  {selectedListingForVisit.title}
                </h4>
                <p className="text-[11px] text-slate-500">
                  {selectedListingForVisit.district}, {selectedListingForVisit.city} ({selectedListingForVisit.country})
                  • <strong>{formatFCFA(selectedListingForVisit.monthlyRent)}/mois</strong>
                </p>

                {/* Description cochée ligne par ligne dans la modale */}
                <div className="pt-2 border-t border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Description & Points Clés :</span>
                  </span>
                  <div className="space-y-1 bg-white p-2.5 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                    {((selectedListingForVisit.descriptionLines && selectedListingForVisit.descriptionLines.length > 0)
                      ? selectedListingForVisit.descriptionLines
                      : selectedListingForVisit.description
                      ? selectedListingForVisit.description.split('\n').filter((l) => l.trim().length > 0)
                      : selectedListingForVisit.amenities
                    ).map((line, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] text-slate-700 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{line.replace(/^[-•*✓✔]\s*/, '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700 block">
                    Date de visite souhaitée *
                  </label>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Dès aujourd’hui ({formatDateFR(new Date())})
                  </span>
                </div>
                <input
                  type="date"
                  min={getTodayIsoDate()}
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  La planification démarre au plus tôt à la date du jour d’action ({formatDateFR(new Date())}).
                </span>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Créneau horaire disponible *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['09:00 - 11:00', '11:00 - 13:00', '15:00 - 17:00'].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setVisitTimeSlot(slot)}
                      className={`py-2 px-2 rounded-xl border text-[11px] font-bold text-center ${
                        visitTimeSlot === slot
                          ? 'border-brand-500 bg-brand-50 text-brand-600 ring-2 ring-brand-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-600'
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedListingForVisit(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-100 font-bold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold shadow-pink-glow cursor-pointer"
                >
                  Confirmer le rendez-vous
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODALE D’INSPECTION COMPLÈTE & DESCRIPTION COCHÉE DU BIEN            */}
      {/* ==================================================================== */}
      {selectedListingForDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] my-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center font-bold">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm line-clamp-1 text-white flex items-center gap-2 flex-wrap">
                    <span>{selectedListingForDetail.title}</span>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                      Réf: {selectedListingForDetail.referenceCode || selectedListingForDetail.id}
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    {selectedListingForDetail.propertyType} • {selectedListingForDetail.district}, {selectedListingForDetail.city} ({selectedListingForDetail.country})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedListingForDetail(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Photo Gallery Viewer */}
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video shadow-inner group">
                <img
                  src={selectedListingForDetail.images[currentDetailPhotoIdx] || selectedListingForDetail.images[0]}
                  alt={selectedListingForDetail.title}
                  className="w-full h-full object-cover transition-all"
                />

                {/* Left/Right controls if multiple photos */}
                {selectedListingForDetail.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentDetailPhotoIdx((prev) =>
                          prev === 0 ? selectedListingForDetail.images.length - 1 : prev - 1
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white hover:bg-black/90 flex items-center justify-center backdrop-blur-sm transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setCurrentDetailPhotoIdx((prev) =>
                          prev === selectedListingForDetail.images.length - 1 ? 0 : prev + 1
                        )
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-white hover:bg-black/90 flex items-center justify-center backdrop-blur-sm transition-all"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[11px] font-mono font-bold">
                      {currentDetailPhotoIdx + 1} / {selectedListingForDetail.images.length}
                    </div>
                  </>
                )}

                {/* Badges on main photo */}
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full bg-brand-500 text-white text-[10px] font-black shadow-md flex items-center gap-1">
                    <span>{selectedListingForDetail.flag}</span>
                    <span>{selectedListingForDetail.country}</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10px] font-bold">
                    {selectedListingForDetail.propertyType}
                  </span>
                  {selectedListingForDetail.isVerified && (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-md">
                      <ShieldCheck className="w-3 h-3" />
                      Vérifié
                    </span>
                  )}
                </div>
              </div>

              {/* Thumbnails row */}
              {selectedListingForDetail.images.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {selectedListingForDetail.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentDetailPhotoIdx(idx)}
                      className={`relative w-16 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                        currentDetailPhotoIdx === idx
                          ? 'border-brand-500 ring-2 ring-brand-500/20 scale-105'
                          : 'border-slate-200 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="Aperçu" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Pricing Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Loyer Mensuel Principal
                  </span>
                  <div className="text-xl font-black text-slate-900 mt-0.5">
                    {formatFCFA(selectedListingForDetail.monthlyRent)}
                    <span className="text-xs text-slate-400 font-semibold"> / mois</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Charges forfaitaires : {formatFCFA(selectedListingForDetail.charges)}
                  </span>
                </div>

                {(() => {
                  const modalCost = computeEntryCost(selectedListingForDetail);
                  return (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-tealAccent-50 border border-emerald-200 text-emerald-950">
                      <span className="text-[10px] font-bold uppercase tracking-wider block text-emerald-800">
                        Coût Total à l'Entrée
                      </span>
                      <div className="text-xl font-black text-emerald-900 mt-0.5">
                        {formatFCFA(modalCost.total)}
                      </div>
                      <span className="text-[10px] text-emerald-700 block mt-0.5">
                        {modalCost.formulaLabel}
                      </span>
                    </div>
                  );
                })()}
              </div>

              {/* Description Cochée Ligne par Ligne */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-black text-slate-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Description Détaillée & Points Clés du Bien</span>
                  </span>
                  <span className="text-[11px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-200/60">
                    Caractéristiques certifiées
                  </span>
                </div>

                <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200/80">
                  {((selectedListingForDetail.descriptionLines && selectedListingForDetail.descriptionLines.length > 0)
                    ? selectedListingForDetail.descriptionLines
                    : selectedListingForDetail.description
                    ? selectedListingForDetail.description.split('\n').filter((l) => l.trim().length > 0)
                    : selectedListingForDetail.amenities
                  ).map((line, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span className="leading-snug">{line.replace(/^[-•*✓✔]\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Localisation & Repère Africain */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-brand-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs text-slate-900">
                    {selectedListingForDetail.district}, {selectedListingForDetail.city} ({selectedListingForDetail.country})
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 italic">
                    Indication de repère local : « {selectedListingForDetail.landmark} »
                  </p>
                </div>
              </div>

              {/* Fiche Annonceur / Agence Immobilière (Nom et Coordonnées sur toute la plateforme) */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 text-white border border-slate-800 shadow-md">
                {(() => {
                  const detailCompany = resolveListingAuthorCompany(selectedListingForDetail);
                  const detailDisplayName = detailCompany || selectedListingForDetail.authorName || 'Bailleur Certifié LOCAGESTION';

                  return (
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-600 flex items-center justify-center text-white font-black text-lg shadow-pink-glow shrink-0">
                          {detailCompany ? (
                            <Building2 className="w-6 h-6 text-white" />
                          ) : (
                            <User className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-300">
                              Publié par
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                              <ShieldCheck className="w-3 h-3 text-emerald-400" />
                              Vérifié LOCAGESTION
                            </span>
                          </div>
                          <h4 className="text-base font-black text-white mt-0.5">
                            {detailDisplayName}
                          </h4>
                          {detailCompany && selectedListingForDetail.authorName && (
                            <p className="text-xs text-slate-300 font-medium mt-0.5">
                              Nom civil / Représentant : <span className="text-white font-semibold">{selectedListingForDetail.authorName}</span>
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-slate-300 font-medium">
                              Statut : <strong className="text-white">
                                {resolveListingAuthorRole(selectedListingForDetail)}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Boutons d'action et contact direct avec l'annonceur */}
                <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center gap-2 flex-wrap">
                  {selectedListingForDetail.authorPhone && (
                    <a
                      href={`tel:${selectedListingForDetail.authorPhone.replace(/\s+/g, '')}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                    >
                      <Phone className="w-3.5 h-3.5 text-brand-300" />
                      <span>{selectedListingForDetail.authorPhone}</span>
                    </a>
                  )}
                  {selectedListingForDetail.authorPhone && (
                    <a
                      href={`https://wa.me/${selectedListingForDetail.authorPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                        `Bonjour, je vous contacte depuis la plateforme LOCAGESTION au sujet de votre annonce : "${selectedListingForDetail.title}" située à ${selectedListingForDetail.district}, ${selectedListingForDetail.city}. Le bien est-il toujours disponible ?`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-white" />
                      <span>WhatsApp</span>
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => handleContactPublisher(selectedListingForDetail)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold transition-all shadow-pink-glow cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-white" />
                    <span>Discuter en direct</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedListingForDetail(null)}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl border border-slate-200 font-bold text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                Fermer
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = selectedListingForDetail;
                  setSelectedListingForDetail(null);
                  if (target) handleContactPublisher(target);
                }}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-center transition-all cursor-pointer"
              >
                Contacter le bailleur
              </button>

              <button
                type="button"
                onClick={() => {
                  const target = selectedListingForDetail;
                  setSelectedListingForDetail(null);
                  if (target) handleOpenVisitModal(target);
                }}
                className="w-full sm:w-auto py-2.5 px-5 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-black shadow-pink-glow transition-all cursor-pointer"
              >
                Demander une visite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assistant Publication Annonce */}
      <PublishListingModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        onPublish={handlePublishListing}
      />

      {/* Modale d'Édition et Gestion de l'Annonce */}
      <EditListingModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedListingForEdit(null);
        }}
        listing={selectedListingForEdit}
        onSave={handleSaveEdit}
        onDelete={(id) => {
          handleDeleteListing(id);
          setEditModalOpen(false);
          setSelectedListingForEdit(null);
        }}
      />

      {/* Boîte de Dialogue de Confirmation de Suppression Définitive */}
      {listingToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl">
              <Trash2 className="w-7 h-7" />
            </div>
            <div className="text-center space-y-1.5">
              <h3 className="text-base font-black text-slate-900">
                Supprimer cette annonce ?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Êtes-vous sûr de vouloir supprimer définitivement votre publication « <strong className="text-slate-800">{listingToDelete.title}</strong> » ? Cette action est irréversible.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setListingToDelete(null)}
                className="py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDeleteListing(listingToDelete.id);
                  setListingToDelete(null);
                }}
                className="py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black transition shadow-sm cursor-pointer"
              >
                Oui, supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
