export type UserSpace = 'bailleur' | 'locataire';

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
  | 'studio'
  | 'appartement_2p'
  | 'appartement_3p'
  | 'appartement_4p'
  | 'villa'
  | 'bureau'
  | 'boutique';

export interface Property {
  id: string;
  name: string;
  type: 'immeuble' | 'residence' | 'villa' | 'commercial';
  address: string;
  city: string;
  district: string; // Quartier (ex: Haie Vive, Cocody, Almadies, Akpakpa)
  country: string;
  totalUnits: number;
  occupiedUnits: number;
  monthlyRevenue: number;
  imageUrl: string;
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
  isVerified: boolean;
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

export interface RentalListing {
  id: string;
  title: string;
  propertyType: 'Appartement' | 'Studio' | 'Villa' | 'Bureau' | 'Boutique';
  country: string;
  countryCode: 'BJ' | 'CI' | 'SN' | 'TG' | 'CM' | 'NE' | 'ML' | 'BF' | 'GW';
  flag: string;
  city: string;
  district: string;
  landmark: string; // Repère local africain (ex: "Derrière pharmacie Haie Vive")
  monthlyRent: number; // Loyer mensuel en FCFA
  charges: number; // Charges mensuelles en FCFA
  depositMonths: number;
  advanceMonths: number;
  agencyFees: number;
  surface: number; // m²
  bedrooms: number;
  bathrooms: number;
  images: string[];
  amenities: string[];
  isVerified: boolean;
  status: 'disponible' | 'reserve' | 'loue';
}

