export type UserSpace = 'bailleur' | 'locataire' | 'demarcheur' | 'admin';
export type LandlordSubRole = 'bailleur' | 'demarcheur';

export type PaymentMethod =
  | 'wave'
  | 'mtn_momo'
  | 'moov_money'
  | 'orange_money'
  | 'virement'
  | 'especes'
  | 'cheque';

export type PaymentStatus = 'paye' | 'partiel' | 'en_retard' | 'en_attente';

export type UnitStatus = 'occupe' | 'vacant' | 'travaux' | 'reserve';

export type UnitType =
  | 'chambre_salon_sanitaire'
  | 'studio'
  | 'appartement_2p'
  | 'appartement_3p'
  | 'appartement_4p'
  | 'villa'
  | 'meuble'
  | 'bureau'
  | 'boutique';

export type PropertyType =
  | 'Chambre salon sanitaire'
  | 'Appartement'
  | 'Meublé'
  | 'Studio'
  | 'Villa'
  | 'Bureau'
  | 'Boutique'
  | 'Immeuble'
  | 'Résidence'
  | 'Autres';

export interface Property {
  id: string;
  name: string;
  type: PropertyType | string;
  address: string;
  city: string;
  district: string; // Quartier (ex: Haie Vive, Cocody, Almadies, Akpakpa)
  country: string;
  totalUnits: number;
  occupiedUnits: number;
  monthlyRevenue: number;
  imageUrl: string;
  images?: string[];
  description?: string;
  amenities?: string[];
  unitsList?: {
    unit: string;
    type: string;
    surface: number;
    rent: number;
    tenant: string;
    status: 'occupe' | 'vacant';
  }[];
  featured?: boolean;
}

export interface Unit {
  id: string;
  propertyId: string;
  propertyName: string;
  unitNumber: string;
  type: UnitType;
  surface: number; // m²
  rentAmount: number; // FCFA
  chargesAmount: number; // FCFA
  status: UnitStatus;
  currentTenantId?: string;
  currentTenantName?: string;
}

export interface Tenant {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  profession: string;
  avatarUrl: string;
  unitId: string;
  unitNumber: string;
  propertyName: string;
  monthlyRent: number;
  leaseStartDate: string;
  paymentStatus: 'a_jour' | 'en_retard' | 'partiel';
  scoringBadge: 'Excellent' | 'Fiable' | 'À surveiller' | 'À risque';
  scoreValue: number; // 0 - 100
}

export interface PaymentTransaction {
  id: string;
  receiptNumber: string;
  tenantId: string;
  tenantName: string;
  tenantAvatar: string;
  tenantPhone: string;
  propertyName: string;
  unitNumber: string;
  amount: number; // FCFA
  expectedAmount: number; // FCFA
  period: string; // ex: "Octobre 2026"
  paymentDate: string; // "31/10/2026"
  method: PaymentMethod;
  status: PaymentStatus;
  proofDocumentUrl?: string;
  proofUrl?: string;
  transactionRef?: string;
  notes?: string;
  isVerified: boolean;
  tenantEmail?: string;
  landlordName?: string;
  isAdvance?: boolean;
  advanceMonthsCount?: number;
  advanceMonthsList?: string[];
}

export interface DashboardKPIs {
  collectedRent: {
    amount: number;
    variationPct: number;
    periodLabel: string;
  };
  totalExpenses: {
    amount: number;
    variationPct: number;
    periodLabel: string;
  };
  averageRent: {
    amount: number;
    variationPct: number;
    periodLabel: string;
  };
  netIncome: {
    amount: number;
    variationPct: number;
    periodLabel: string;
  };
  occupancyRate: {
    totalUnits: number;
    occupiedUnits: number;
    vacantUnits: number;
    reservedUnits: number;
    inMaintenanceUnits: number;
    percentage: number;
  };
  rentBreakdown: {
    paidAmount: number;
    paidCount: number;
    paidPct: number;
    partialAmount: number;
    partialCount: number;
    partialPct: number;
    overdueAmount: number;
    overdueCount: number;
    overduePct: number;
  };
}

export type RentalPropertyType =
  | 'Chambre salon sanitaire'
  | 'Appartement'
  | 'Meublé'
  | 'Studio'
  | 'Villa'
  | 'Bureau'
  | 'Boutique'
  | 'Colocation'
  | 'Autres';

export interface RentalListing {
  id: string;
  title: string;
  propertyType: RentalPropertyType;
  country: string;
  countryCode:
    | 'BJ'
    | 'CI'
    | 'SN'
    | 'TG'
    | 'BF'
    | 'ML'
    | 'NE'
    | 'GW'
    | 'CM'
    | 'CF'
    | 'CG'
    | 'GA'
    | 'GQ'
    | 'TD';
  flag: string;
  city: string;
  district: string;
  landmark: string; // Repère local africain (ex: "Derrière pharmacie Haie Vive")
  monthlyRent: number; // Loyer mensuel en FCFA
  charges: number; // Charges mensuelles en FCFA
  depositMonths: number;
  advanceMonths: number;
  agencyFees: number;
  includeFirstRent?: boolean; // 1er loyer exigé à l'entrée (défaut true)
  includeAgencyFees?: boolean; // Frais d'agence / démarcheur inclus (défaut true)
  hasUtilitiesDeposit?: boolean; // Caution compteurs Eau & Électricité (défaut false)
  utilitiesDeposit?: number; // Montant en FCFA de la caution eau & électricité
  surface: number; // m²
  bedrooms: number;
  bathrooms: number;
  images: string[];
  amenities: string[];
  description?: string; // Description détaillée du bien
  descriptionLines?: string[]; // Lignes de description cochées dans l'annonce
  latitude?: number; // Coordonnées GPS pour proximité
  longitude?: number;
  distanceKm?: number; // Distance calculée par rapport à l'utilisateur
  isVerified: boolean;
  status: 'disponible' | 'reserve' | 'loue' | 'en_pause' | 'rejete' | 'en_attente_moderation';
  moderationStatus?: 'valide' | 'rejete' | 'en_attente';
  moderationReason?: string;
  moderationFlags?: ('nudite' | 'propos_sexuel' | 'extorsion_rancon' | 'photos_insuffisantes')[];
  moderatedAt?: string;
  authorId?: string;
  authorName?: string;
  authorCompany?: string; // Nom de l'agence ou de la société mandataire
  authorEmail?: string;
  authorPhone?: string;
  authorRole?: UserSpace;
  authorAvatar?: string;
  createdAt?: string;
  referenceCode?: string; // Référence unique plateforme (ex: LOCA-ANN-84291)
  viewsCount?: number;
  inquiriesCount?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  role: UserSpace;
  birthDate?: string;       // Date de naissance
  birthPlace?: string;      // Lieu de naissance
  residenceCountry: string; // Pays de résidence renseigné lors de l'inscription (ex: 'Bénin', 'France')
  residenceCity: string;    // Ville de résidence (ex: 'Cotonou', 'Paris')
  residenceDistrict?: string; // Quartier / Lieu actuel (ex: 'Haie Vive', 'Agla', etc.)
  projectCountry?: string;  // Pays du projet immobilier situé dans l'UEMOA & CEMAC (ex: 'Bénin')
  avatarUrl?: string;
  registrationDate?: string;
  companyName?: string;
  ifuNumber?: string;
  matricule?: string;       // Matricule officiel unique attribué à l'utilisateur (ex: LOCA-MAT-BJ-84291 ou LOCA-MAT-ADMIN-00001)
  currentLocation?: {
    latitude: number;
    longitude: number;
    label: string;
    source: 'gps' | 'profile' | 'timezone' | 'manual';
  };
}

export interface AuthUser {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  role: UserSpace; // 'bailleur' | 'locataire' | 'demarcheur'
  birthDate?: string; // Date de naissance (ex: '15/06/1988')
  birthPlace?: string; // Lieu de naissance (ex: 'Cotonou')
  residenceCountry: string; // Pays de résidence proposé par géolocalisation (ex: 'Bénin', 'France')
  residenceCity: string;    // Ville (ex: 'Cotonou', 'Paris')
  residenceDistrict?: string; // Quartier (ex: 'Haie Vive')
  projectCountry?: string;  // Pays du projet immobilier dans l'espace UEMOA & CEMAC (ex: 'Bénin')
  avatarUrl?: string;
  companyName?: string;     // Nom d'entreprise / Agence (Bailleur / Démarcheur)
  ifuNumber?: string;       // IFU fiscal (Bailleur)
  matricule?: string;       // Matricule officiel plateforme (ex: LOCA-MAT-BJ-84291 ou LOCA-MAT-ADMIN-00001)
  registeredAt: string;
  password?: string;
  adminSessionVersion?: string; // Version de session pour invalidation et déconnexion globale
}

export interface SecurityAlert {
  id: string;
  listingId?: string;
  listingTitle: string;
  authorName: string;
  authorEmail: string;
  authorPhone: string;
  authorRole: string;
  country: string;
  city: string;
  violations: {
    type: 'photos_insuffisantes' | 'nudite' | 'propos_sexuel' | 'extorsion_rancon';
    message: string;
    triggerSnippet?: string;
    severity: 'high' | 'critical' | 'medium';
  }[];
  detectedAt: string;
  status: 'non_traite' | 'bloque' | 'autorise_par_admin' | 'supprime';
  adminNotes?: string;
}




