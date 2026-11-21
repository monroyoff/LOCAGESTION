'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import {
  Users,
  Search,
  Filter,
  Plus,
  Phone,
  Mail,
  Building,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ChevronRight,
  TrendingUp,
  FileText,
  Camera,
  Receipt,
  UserCheck,
  Lock,
  Home,
  Share2,
  Sparkles,
  ExternalLink,
  MessageCircle,
  Eye,
  X,
  Copy,
  Send,
  Download,
  Ban,
  RotateCcw,
  Smartphone,
  Check,
  MapPin,
  Compass,
  Navigation,
  Fingerprint,
} from 'lucide-react';
import { ListingsService } from '@/lib/services/listings-service';
import {
  buildWhatsAppUrl,
  buildSmsUri,
  buildTenantMailtoUrl,
  buildTenantGmailComposeUrl,
  buildTenantInvitationTextMessage,
} from '@/lib/services/notification-dispatch-service';
import { formatFCFA, formatDateFR } from '@/lib/money/format';
import { TenantScoringService } from '@/lib/services/tenant-scoring-service';
import { UserSpace } from '@/lib/types';
import { ReceiptModal } from '@/components/dashboard/ReceiptModal';
import { WhatsAppReminderModal } from '@/components/dashboard/WhatsAppReminderModal';
import { QuickActionModal } from '@/components/dashboard/QuickActionModal';
import { ConfirmTerminateLeaseModal } from '@/components/leases/ConfirmTerminateLeaseModal';
import { generateLeasePDF } from '@/lib/export/pdf-download';
import { LeaseService, Lease } from '@/lib/services/lease-service';
import {
  AuthService,
  areEmailsEqual,
  arePhoneNumbersEqual,
  isCanonicalJojoVog,
  generateUserMatricule,
} from '@/lib/services/auth-service';
import { Footer } from '@/components/layout/Footer';
import { notifyAction, notifySave, notifyDelete } from '@/lib/notifications/action-notifier';
import { SkeletonTable } from '@/components/ui/SkeletonLoader';
import { useSpace } from '@/lib/context/space-context';

interface TenantDetail {
  id: string;
  matricule?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatar: string;
  email: string;
  phone: string;
  profession: string;
  employer: string;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  property: {
    name: string;
    unit: string;
    address: string;
    city: string;
    district?: string;
    landmark?: string;
    location: string;
    listingTitle?: string;
    listingReference?: string;
  };
  financials: {
    monthlyRent: number;
    charges: number;
    deposit: number; // Caution en FCFA
    advanceMonths: number;
    paymentDay: number;
  };
  lease: {
    id: string;
    startDate: string;
    durationMonths: number;
    status: 'actif' | 'en_renouvellement' | 'resilie';
  };
  scoring: {
    score: number; // 0 à 100
    badge: 'Excellent' | 'Fiable' | 'À surveiller' | 'À risque';
    onTimeRate: number; // %
    averageDelayDays: number;
    maxDelayDays: number;
    criticalDelaysCount: number; // Retards > 15j
    finalArrears: number; // FCFA
    historyConsentGranted: boolean;
    consentExpiresAt?: string;
  };
  recentReceipts: {
    id: string;
    receiptNumber: string;
    period: string;
    date: string;
    amount: number;
    method: 'wave' | 'mtn_momo' | 'orange_money' | 'virement' | 'especes';
  }[];
  inspection: {
    date: string;
    generalState: string;
    photosCount: number;
    signedByBoth: boolean;
  };
}

const MOCK_TENANTS: TenantDetail[] = [];

export default function TenantsPage() {
  const router = useRouter();
  const { user } = useSpace();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSpace, setActiveSpace] = useState<UserSpace>('bailleur');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);
  const [selectedTenant, setSelectedTenant] = useState<TenantDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'apercu' | 'solvabilite' | 'bail' | 'edl' | 'paiements'>('apercu');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBadge, setFilterBadge] = useState<string>('all');
  const [copiedMatricule, setCopiedMatricule] = useState<string | null>(null);

  const handleCopyMatricule = (mat: string) => {
    if (!mat) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(mat);
      }
    } catch (e) {}
    setCopiedMatricule(mat);
    showToast(`Matricule certifié ${mat} copié !`);
    setTimeout(() => setCopiedMatricule(null), 2500);
  };

  // Modals state
  const [quickAction, setQuickAction] = useState<'new_lease' | 'new_payment' | 'new_property' | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<any | null>(null);
  const [reminderPayment, setReminderPayment] = useState<any | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteToken, setInviteToken] = useState('tok_8942abc');
  const [inviteCode, setInviteCode] = useState('LOCA-INV-7842');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteSentSuccess, setInviteSentSuccess] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [inviteDispatchResult, setInviteDispatchResult] = useState<{
    emailSent: boolean;
    emailProvider?: string;
    emailError?: string | null;
    smsSent: boolean;
    smsProvider?: string;
    smsError?: string | null;
    whatsappUrl: string;
    smsUri: string;
    mailtoUrl: string;
    gmailUrl: string;
    textMessage: string;
    portalUrl: string;
  } | null>(null);

  const inviteFullName = `${inviteLastName.trim()} ${inviteFirstName.trim()}`.trim();

  const openInviteModal = () => {
    const randomTok = 'tok_' + Math.random().toString(36).substring(2, 9);
    const randomCode = 'LOCA-INV-' + Math.floor(1000 + Math.random() * 9000);
    setInviteToken(randomTok);
    setInviteCode(randomCode);
    setInviteLastName('');
    setInviteFirstName('');
    setInvitePhone('');
    setInviteEmail('');
    setInviteSentSuccess(false);
    setInviteDispatchResult(null);
    setShowInviteModal(true);
  };

  const computedPortalUrl = useMemo(() => {
    const origin = typeof window !== 'undefined' && window.location.origin
      ? window.location.origin
      : 'https://locagestion.site';
    const params = new URLSearchParams();
    if (inviteToken) params.set('invite', inviteToken);
    if (inviteCode) params.set('code', inviteCode);
    const fullName = `${inviteLastName.trim()} ${inviteFirstName.trim()}`.trim();
    if (fullName) params.set('name', fullName);
    if (inviteLastName.trim()) params.set('lastName', inviteLastName.trim());
    if (inviteFirstName.trim()) params.set('firstName', inviteFirstName.trim());
    if (inviteEmail.trim()) params.set('email', inviteEmail.trim());
    if (invitePhone.trim()) params.set('phone', invitePhone.trim());
    return `${origin}/portal?${params.toString()}`;
  }, [inviteToken, inviteCode, inviteLastName, inviteFirstName, inviteEmail, invitePhone]);

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = `${inviteLastName.trim()} ${inviteFirstName.trim()}`.trim();
    if (!inviteLastName.trim() || !inviteFirstName.trim() || !invitePhone.trim() || !inviteEmail.trim()) {
      showToast('Veuillez renseigner le nom, le prénom, le numéro de téléphone/SMS et l’adresse email.');
      return;
    }

    setIsSendingInvite(true);
    const currentUser = AuthService.getCurrentUser();
    const landlordName = currentUser?.name || currentUser?.companyName || 'VOGLOSSOU JOHANE';

    const tenantInviteData = {
      recipientName: fullName,
      recipientEmail: inviteEmail.trim(),
      recipientPhone: invitePhone.trim(),
      portalUrl: computedPortalUrl,
      invitationCode: inviteCode,
      landlordName,
      isGeneralInvite: true,
      type: 'TENANT_INVITE',
    };

    const textMessage = buildTenantInvitationTextMessage(tenantInviteData);
    const fallbackWhatsappUrl = buildWhatsAppUrl(invitePhone.trim(), textMessage);
    const fallbackSmsUri = buildSmsUri(invitePhone.trim(), textMessage);
    const fallbackMailtoUrl = buildTenantMailtoUrl(tenantInviteData);
    const fallbackGmailUrl = buildTenantGmailComposeUrl(tenantInviteData);

    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tenantInviteData),
      });

      const data = await res.json();

      setInviteDispatchResult({
        emailSent: Boolean(data?.emailStatus?.sent),
        emailProvider: data?.emailStatus?.provider,
        emailError: data?.emailStatus?.error,
        smsSent: Boolean(data?.smsStatus?.sent),
        smsProvider: data?.smsStatus?.provider,
        smsError: data?.smsStatus?.error,
        whatsappUrl: data?.deepLinks?.whatsappUrl || fallbackWhatsappUrl,
        smsUri: data?.deepLinks?.smsUri || fallbackSmsUri,
        mailtoUrl: data?.deepLinks?.mailtoUrl || fallbackMailtoUrl,
        gmailUrl: data?.deepLinks?.gmailUrl || fallbackGmailUrl,
        textMessage: data?.textMessage || textMessage,
        portalUrl: computedPortalUrl,
      });
      setInviteSentSuccess(true);

      // Sur mobile (smartphone / tablette), déclencher l'ouverture de l'application SMS native
      const targetSmsUri = data?.deepLinks?.smsUri || fallbackSmsUri;
      if (typeof window !== 'undefined' && targetSmsUri) {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = targetSmsUri;
        }
      }

      const msg = `Email officiel expédié à ${inviteEmail} et SMS prêt pour ${invitePhone} !`;
      showToast(msg);
      notifySave(msg, 'Invitation locataire expédiée');
    } catch (err) {
      console.error('Erreur dispatch notification:', err);
      const targetSmsUri = fallbackSmsUri;
      setInviteDispatchResult({
        emailSent: false,
        smsSent: false,
        whatsappUrl: fallbackWhatsappUrl,
        smsUri: fallbackSmsUri,
        mailtoUrl: fallbackMailtoUrl,
        gmailUrl: fallbackGmailUrl,
        textMessage,
        portalUrl: computedPortalUrl,
      });
      setInviteSentSuccess(true);

      if (typeof window !== 'undefined' && targetSmsUri) {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          window.location.href = targetSmsUri;
        }
      }

      const msg = `Lien d'invitation préparé pour ${fullName} !`;
      showToast(msg);
      notifySave(msg, 'Invitation prête pour expédition');
    } finally {
      setIsSendingInvite(false);
    }
  };
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [lastResiliatedId, setLastResiliatedId] = useState<string | null>(null);
  const [leaseToTerminate, setLeaseToTerminate] = useState<{
    id: string;
    tenant: string;
    property?: string;
    unit?: string;
    rent?: number;
  } | null>(null);

  useEffect(() => {
    const refreshLeases = () => {
      setLeases(LeaseService.getLeasesForLandlord(user));
    };
    refreshLeases();
    window.addEventListener('locagestion:leases_updated', refreshLeases);
    window.addEventListener('storage', refreshLeases);
    return () => {
      window.removeEventListener('locagestion:leases_updated', refreshLeases);
      window.removeEventListener('storage', refreshLeases);
    };
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleTerminateTenantLease = (leaseId: string, tenantName: string, reason?: string) => {
    LeaseService.terminateLease(leaseId, reason);
    setLastResiliatedId(leaseId);
    setLeases(LeaseService.getLeasesForLandlord(user));
    const msg = `Bail ${leaseId} (${tenantName}) résilié. Le logement est dissocié.`;
    showToast(`⚠️ ${msg}`);
    notifyDelete(msg, 'Bail résilié !');
  };

  const handleReactivateTenantLease = (leaseId: string, tenantName: string) => {
    LeaseService.reactivateLease(leaseId);
    setLastResiliatedId(null);
    setLeases(LeaseService.getLeasesForLandlord(user));
    const msg = `Bail ${leaseId} (${tenantName}) réactivé avec succès ! Liaison rétablie sans autres démarches.`;
    showToast(`✅ ${msg}`);
    notifySave(msg, 'Bail réactivé avec succès !');
  };

  // Transformer les vrais baux du bailleur en fiches locataires dynamiques avec identité scellée
  const dynamicTenants: TenantDetail[] = useMemo(() => {
    const registeredUsers = AuthService.getRegisteredUsers();
    const allListings = ListingsService.getAllListings();

    return leases.map((l, idx) => {
      const matchedUser = registeredUsers.find(
        (u) =>
          (l.tenantEmail && areEmailsEqual(u.email, l.tenantEmail)) ||
          (l.tenantPhone && arePhoneNumbersEqual(u.phone, l.tenantPhone)) ||
          (u.id && l.tenantId && u.id === l.tenantId)
      );

      const isJojo = isCanonicalJojoVog(
        l.tenantEmail || matchedUser?.email,
        matchedUser?.matricule,
        l.tenant || matchedUser?.name
      );

      let resolvedFirstName = isJojo ? 'Jojo' : (matchedUser?.firstName || '');
      let resolvedLastName = isJojo ? 'VOG' : (matchedUser?.lastName || '');
      let resolvedFullName = isJojo
        ? 'Jojo VOG'
        : (matchedUser?.name || `${resolvedFirstName} ${resolvedLastName}`.trim() || l.tenant || 'Locataire');

      if (!resolvedFirstName && !resolvedLastName) {
        const rawParts = (l.tenant || 'Locataire').trim().split(/\s+/);
        if (rawParts.length >= 2) {
          resolvedFirstName = rawParts[0];
          resolvedLastName = rawParts.slice(1).join(' ');
        } else {
          resolvedFirstName = rawParts[0];
          resolvedLastName = '';
        }
      }

      // Résolution de l'annonce correspondante et de la localisation du bien loué
      const matchedListing = allListings.find(
        (listing) =>
          (l.listingId && listing.id === l.listingId) ||
          (l.listingReference && (listing.referenceCode === l.listingReference || listing.id === l.listingReference)) ||
          (l.property && listing.title.toLowerCase().includes(l.property.toLowerCase()))
      );

      const resolvedDistrict =
        l.propertyDistrict ||
        matchedListing?.district ||
        (isJojo ? 'Haie Vive' : (l.tenantAddress && l.tenantAddress.includes('Haie Vive') ? 'Haie Vive' : ''));

      const resolvedCity =
        l.propertyCity ||
        matchedListing?.city ||
        (l.tenantAddress && l.tenantAddress.includes('Cotonou') ? 'Cotonou' : 'Cotonou');

      const resolvedCountry = l.country || matchedListing?.country || 'Bénin';

      const resolvedLandmark =
        l.propertyLandmark ||
        matchedListing?.landmark ||
        (isJojo ? 'Proche Pavé Haie Vive' : undefined);

      const resolvedAddress =
        l.propertyAddress ||
        (resolvedDistrict ? `${resolvedDistrict}, ${resolvedCity}` : (l.tenantAddress || `${resolvedCity}, ${resolvedCountry}`));

      const resolvedLocation =
        l.propertyLocation ||
        [resolvedDistrict, resolvedCity, resolvedCountry].filter(Boolean).join(', ') ||
        (isJojo ? 'Haie Vive, Cotonou, Bénin' : `${resolvedCity}, ${resolvedCountry}`);

      const computedScore = TenantScoringService.calculateScore(l.tenantEmail, l.tenantPhone);
      const badgeMapping: 'Excellent' | 'Fiable' | 'À surveiller' | 'À risque' =
        computedScore.tier.tier === 'excellent'
          ? 'Excellent'
          : computedScore.tier.tier === 'bon'
            ? 'Fiable'
            : computedScore.tier.tier === 'vigilance'
              ? 'À surveiller'
              : 'À risque';

      const resolvedAdvanceMonths =
        l.advanceMonths ||
        (l.deposit && l.rent ? Math.round(l.deposit / l.rent) : 0) ||
        (isJojo ? 3 : 0);

      const resolvedMatricule =
        (isJojo
          ? 'LOCA-MAT-BJ-17635'
          : (matchedUser?.matricule ||
             l.tenantMatricule ||
             (l as any).matricule ||
             (matchedUser?.email ? generateUserMatricule(resolvedCountry || 'Bénin', 'locataire', matchedUser.email) : undefined) ||
             (l.tenantEmail ? generateUserMatricule(resolvedCountry || 'Bénin', 'locataire', l.tenantEmail) : undefined)
            )
        ) || (l.tenantId ? `LOCA-MAT-BJ-${l.tenantId.slice(-5).toUpperCase()}` : 'LOCA-MAT-BJ-17635');

      return {
        id: l.id || `loc-${idx}`,
        matricule: resolvedMatricule,
        firstName: resolvedFirstName,
        lastName: resolvedLastName,
        fullName: resolvedFullName,
        avatar: matchedUser?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        email: matchedUser?.email || l.tenantEmail || '',
        phone: matchedUser?.phone || l.tenantPhone || '',
        profession: 'Locataire Résident',
        employer: resolvedLocation,
        emergencyContact: {
          name: l.emergencyContactName || 'N/A',
          phone: l.emergencyContactPhone || 'N/A',
          relation: l.emergencyContactRelation || 'Proche',
        },
        property: {
          name: l.property || (matchedListing?.title ? matchedListing.title : 'CHAMBRE SALON SANITAIRE'),
          unit: l.unit || 'Lot 1 (Chambre Salon Sanitaire • 45 m²)',
          address: resolvedAddress,
          city: resolvedCity,
          district: resolvedDistrict,
          landmark: resolvedLandmark,
          location: resolvedLocation,
          listingTitle: matchedListing?.title,
          listingReference: l.listingReference || matchedListing?.referenceCode || matchedListing?.id,
        },
        financials: {
          monthlyRent: l.rent || 0,
          charges: l.charges || 0,
          deposit: l.deposit || 0,
          advanceMonths: resolvedAdvanceMonths,
          paymentDay: 5,
        },
        lease: {
          id: l.id,
          startDate: l.startDate || '01/01/2026',
          durationMonths: l.durationMonths || 12,
          status: l.status === 'resilie' ? 'resilie' : 'actif',
        },
        scoring: {
          score: computedScore.currentScore,
          badge: badgeMapping,
          onTimeRate: computedScore.isNewTenant
            ? 100
            : Math.round(
              100 *
              (computedScore.onTimePaymentsCount /
                Math.max(1, computedScore.onTimePaymentsCount + computedScore.delayedPaymentsCount))
            ),
          averageDelayDays: computedScore.currentMonthDelayedDays,
          maxDelayDays: computedScore.currentMonthDelayedDays,
          criticalDelaysCount: computedScore.delayedPaymentsCount,
          finalArrears: 0,
          historyConsentGranted: true,
        },
        recentReceipts: [],
        inspection: {
          date: l.startDate || '01/01/2026',
          generalState: 'Très bon état général',
          photosCount: 0,
          signedByBoth: !!l.signedByTenant && !!l.landlordSignedAt,
        },
      };
    });
  }, [leases]);

  const filteredTenants = dynamicTenants.filter((t) => {
    // Filtre par palier de solvabilité
    const matchesFilter = filterBadge === 'all' || t.scoring.badge === filterBadge;
    if (!matchesFilter) return false;

    const rawQ = searchQuery.trim().toLowerCase();
    if (!rawQ) return true;

    // Décomposition et normalisation pour recherche souple
    const cleanQ = rawQ.replace(/[^a-z0-9]/gi, '');
    const tokens = rawQ.split(/\s+/).filter(Boolean);

    // 1. Recherche par Matricule (ex: LOCA-MAT-BJ-17635, 17635, BJ-17635)
    const mat = (t.matricule || '').toLowerCase();
    const cleanMat = mat.replace(/[^a-z0-9]/gi, '');
    const matchesMatricule =
      mat.includes(rawQ) ||
      (cleanQ.length >= 2 && cleanMat.includes(cleanQ));

    // 2. Recherche par Référence de Bail (ex: BAIL-2026-421, 421, 2026-421)
    const leaseId = (t.lease?.id || '').toLowerCase();
    const cleanLeaseId = leaseId.replace(/[^a-z0-9]/gi, '');
    const matchesLease =
      leaseId.includes(rawQ) ||
      (cleanQ.length >= 2 && cleanLeaseId.includes(cleanQ));

    // 3. Recherche par Nom & Prénom (direct, inversé, prénom seul, nom seul ou multi-mots)
    const fn = (t.firstName || '').toLowerCase();
    const ln = (t.lastName || '').toLowerCase();
    const full = (t.fullName || '').toLowerCase();
    const reverseFull = `${ln} ${fn}`.trim();
    const matchesName =
      full.includes(rawQ) ||
      reverseFull.includes(rawQ) ||
      fn.includes(rawQ) ||
      ln.includes(rawQ) ||
      (tokens.length > 1 && tokens.every((tok) => full.includes(tok) || reverseFull.includes(tok)));

    // 4. Recherche par Lieu (Localisation, Quartier, Ville, Repère local, Adresse)
    const loc = (t.property.location || '').toLowerCase();
    const district = (t.property.district || '').toLowerCase();
    const city = (t.property.city || '').toLowerCase();
    const landmark = (t.property.landmark || '').toLowerCase();
    const address = (t.property.address || '').toLowerCase();
    const matchesLocation =
      loc.includes(rawQ) ||
      district.includes(rawQ) ||
      city.includes(rawQ) ||
      landmark.includes(rawQ) ||
      address.includes(rawQ) ||
      (tokens.length > 1 && tokens.some((tok) => loc.includes(tok) || landmark.includes(tok) || district.includes(tok) || city.includes(tok)));

    // 5. Recherche par Propriété, Lot ou Référence d'Annonce
    const propName = (t.property.name || '').toLowerCase();
    const unit = (t.property.unit || '').toLowerCase();
    const listingRef = (t.property.listingReference || '').toLowerCase();
    const matchesProperty =
      propName.includes(rawQ) ||
      unit.includes(rawQ) ||
      listingRef.includes(rawQ);

    // 6. Recherche par Téléphone ou Email
    const cleanPhone = (t.phone || '').replace(/[^0-9]/g, '');
    const cleanQDigits = rawQ.replace(/[^0-9]/g, '');
    const matchesContact =
      (t.email && t.email.toLowerCase().includes(rawQ)) ||
      (t.phone && t.phone.toLowerCase().includes(rawQ)) ||
      (cleanQDigits.length >= 3 && cleanPhone.includes(cleanQDigits));

    return (
      matchesMatricule ||
      matchesLease ||
      matchesName ||
      matchesLocation ||
      matchesProperty ||
      matchesContact
    );
  });

  useEffect(() => {
    if (!selectedTenant && filteredTenants.length > 0) {
      setSelectedTenant(filteredTenants[0]);
    }
  }, [filteredTenants, selectedTenant]);

  const getScoringBadgeUI = (badge: string) => {
    switch (badge) {
      case 'Excellent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Excellent (Score 90+)</span>
          </span>
        );
      case 'Fiable':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            <span>Fiable (Score 80-89)</span>
          </span>
        );
      case 'À surveiller':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>À surveiller</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>À risque</span>
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-900 flex">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        activeSpace={activeSpace}
        onSpaceChange={setActiveSpace}
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Header
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenQuickAction={(action) => setQuickAction(action)}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Bouton Retour Accueil sur Mobile & Desktop */}
          <div className="flex items-center gap-2 pb-1">
            <button
              type="button"
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border border-slate-200 text-slate-800 text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer hover:bg-slate-50"
            >
              <Home className="w-4 h-4 text-slate-600" />
              <span>← Retour au Tableau de bord</span>
            </button>
          </div>

          {/* Top Bar: Title & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Répertoire des Locataires & Dossiers
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-brand-50 text-brand-600 border border-brand-200">
                  {dynamicTenants.length} Fiches
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Fiches d’identité, baux actifs, solvabilité vérifiée et quittances dématérialisées.
              </p>
            </div>

            {/* Top Action */}
            <button
              type="button"
              onClick={openInviteModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold shadow-sm active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
            >
              <UserCheck className="w-4 h-4 text-brand-400" />
              <span>+ Inviter un locataire</span>
            </button>
          </div>

          {filteredTenants.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-soft space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Users className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-lg text-slate-900">
                  Aucun locataire enregistré pour le moment
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Vos locataires apparaîtront ici dès la création de leurs baux ou après envoi d’une invitation électronique.
                </p>
              </div>
              <button
                type="button"
                onClick={openInviteModal}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black shadow-pink-glow transition-all cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>+ Inviter un premier locataire</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column (5 cols): Tenants List */}
              <div className="lg:col-span-5 bg-white rounded-3xl p-5 border border-slate-200/80 shadow-soft space-y-4">
                {/* Search & Filter */}
                <div className="space-y-2.5">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher par matricule, réf bail, nom, prénom, lieu..."
                      className="w-full pl-10 pr-9 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                        title="Effacer la recherche"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
                    {['all', 'Excellent', 'Fiable', 'À surveiller'].map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFilterBadge(f)}
                        className={`px-3 py-1 rounded-xl transition-all whitespace-nowrap cursor-pointer ${filterBadge === f
                          ? 'bg-slate-900 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        {f === 'all' ? 'Tous' : f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tenants Vertical Cards */}
                <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                  {isLoading ? (
                    <SkeletonTable rows={4} />
                  ) : filteredTenants.length === 0 ? (
                    <div className="p-6 text-center text-slate-500 text-xs bg-slate-50/70 rounded-2xl border border-dashed border-slate-200">
                      <Search className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-800">Aucun locataire trouvé</p>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                        Aucun résultat pour « <strong className="text-slate-700">{searchQuery}</strong> ».
                        Essayez par matricule, réf bail, nom, prénom ou lieu (quartier/ville).
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          setFilterBadge('all');
                        }}
                        className="mt-3 text-[11px] font-bold text-brand-600 hover:text-brand-700 underline cursor-pointer"
                      >
                        Effacer la recherche
                      </button>
                    </div>
                  ) : (
                    filteredTenants.map((t) => {
                    const isSelected = selectedTenant?.id === t.id;

                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTenant(t)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                          ? 'bg-brand-50/40 border-brand-500/50 shadow-sm ring-1 ring-brand-500/20'
                          : 'bg-white hover:bg-slate-50 border-slate-200/80'
                          }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <img
                              src={t.avatar}
                              alt={t.fullName}
                              className="w-11 h-11 rounded-2xl object-cover ring-1 ring-slate-200"
                            />
                            <span
                              className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-white ${t.scoring.score >= 85
                                ? 'bg-emerald-500'
                                : t.scoring.score >= 70
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                                }`}
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-xs font-black text-slate-900 truncate">
                                {t.fullName}
                              </h3>
                              {t.matricule && (
                                <span className="font-mono text-[9px] font-black px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
                                  {t.matricule}
                                </span>
                              )}
                              <span className="text-[10px] font-extrabold text-slate-400">
                                {t.scoring.score}/100
                              </span>
                            </div>
                            <span className="text-[11px] text-brand-600 font-bold block truncate mt-0.5">
                              {t.property.unit} • {t.property.name}
                            </span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 truncate mt-0.5 font-medium">
                              <MapPin className="w-3 h-3 text-rose-500 shrink-0" />
                              <span className="truncate">{t.property.location}</span>
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                              Loyer : {formatFCFA(t.financials.monthlyRent)}/mois
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${isSelected
                              ? 'text-brand-600 translate-x-1'
                              : 'text-slate-300'
                              }`}
                          />
                        </div>
                      </div>
                    );
                  }))}
                </div>
              </div>

              {/* Right Column (7 cols): Full Tenant File & Tabs */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200/80 shadow-soft overflow-hidden">
                {!selectedTenant ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    Sélectionnez un locataire dans la liste pour afficher sa fiche complète.
                  </div>
                ) : (
                  <>
                    {/* Tenant Header Banner */}
                    <div className="p-6 bg-gradient-to-r from-slate-900 via-[#161a25] to-slate-900 text-white relative">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={selectedTenant.avatar}
                            alt={selectedTenant.fullName}
                            className="w-16 h-16 rounded-3xl object-cover ring-2 ring-brand-500/50 shadow-md"
                          />
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h2 className="text-lg font-black tracking-tight">
                                {selectedTenant.fullName}
                              </h2>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-500 text-white shadow-sm">
                                Bail Actif
                              </span>
                              {selectedTenant.matricule && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyMatricule(selectedTenant.matricule!)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-indigo-500/25 hover:bg-indigo-500/35 text-indigo-200 border border-indigo-400/30 font-mono font-black text-[11px] shadow-sm tracking-wider cursor-pointer transition-colors group"
                                  title="Cliquer pour copier le matricule certifié"
                                >
                                  <Fingerprint className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                  <span>Matricule : {selectedTenant.matricule}</span>
                                  {copiedMatricule === selectedTenant.matricule ? (
                                    <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-indigo-300 opacity-60 group-hover:opacity-100 shrink-0" />
                                  )}
                                </button>
                              )}
                            </div>
                            {/* Lieu du logement loué bien visible tout de suite */}
                            <div className="flex items-center flex-wrap gap-1.5 mt-1 text-xs">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] shadow-sm">
                                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>{selectedTenant.property.location}</span>
                              </span>
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-200 font-semibold text-xs truncate max-w-xs">
                                {selectedTenant.property.name}
                              </span>
                            </div>

                            <div className="flex items-center flex-wrap gap-2.5 mt-2 text-xs text-slate-400">
                              <span className="flex items-center gap-1 text-slate-300">
                                <Phone className="w-3.5 h-3.5 text-brand-400" />
                                {selectedTenant.phone}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-slate-300">
                                <Building className="w-3.5 h-3.5 text-tealAccent-400" />
                                {selectedTenant.property.unit}
                              </span>
                              {selectedTenant.property.landmark && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1 text-amber-300 text-[11px] font-medium">
                                    <Compass className="w-3 h-3 text-amber-400" />
                                    <span>{selectedTenant.property.landmark}</span>
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Solvability score circle preview */}
                        <div className="p-3 bg-white/10 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center self-start sm:self-auto">
                          <span className="text-[10px] uppercase font-bold text-slate-300">
                            Score Solvabilité
                          </span>
                          <span className="text-2xl font-black text-white mt-0.5">
                            {selectedTenant.scoring.score}
                            <span className="text-xs text-brand-400 font-bold">/100</span>
                          </span>
                          <span className="text-[10px] font-black text-emerald-400 uppercase mt-0.5">
                            {selectedTenant.scoring.badge}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Segmented Navigation Tabs */}
                    <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto text-xs font-bold">
                      {[
                        { id: 'apercu', label: 'Aperçu & Coordonnées', icon: UserCheck },
                        { id: 'solvabilite', label: 'Score & Antécédents', icon: ShieldCheck },
                        { id: 'bail', label: 'Bail & Documents', icon: FileText },
                        { id: 'edl', label: 'État des Lieux', icon: Camera },
                        { id: 'paiements', label: 'Quittances & Règlements', icon: Receipt },
                      ].map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-1.5 py-2 px-3 rounded-xl transition-all whitespace-nowrap cursor-pointer ${isActive
                              ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-black'
                              : 'text-slate-500 hover:text-slate-900'
                              }`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-brand-500' : 'text-slate-400'}`} />
                            <span>{tab.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Tab Contents */}
                    <div className="p-6">
                      {/* 1. Onglet Aperçu */}
                      {activeTab === 'apercu' && (
                        <div className="space-y-5 animate-in fade-in duration-200">
                          {/* Carte Visuelle du Lieu du Logement Loué (Issu de l'Annonce / Contrat) */}
                          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 via-blue-50/25 to-emerald-50/25 border border-slate-200/90 shadow-xs">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2.5 border-b border-slate-200/80">
                              <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                                <span>Lieu du Logement Loué (Issu du Contrat & de l'Annonce)</span>
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                {selectedTenant.matricule && (
                                  <button
                                    type="button"
                                    onClick={() => handleCopyMatricule(selectedTenant.matricule!)}
                                    className="flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full border border-indigo-200 cursor-pointer transition-colors group"
                                    title="Cliquer pour copier le matricule certifié"
                                  >
                                    <Fingerprint className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                                    <span className="text-[10px] font-bold text-slate-500">Matricule :</span>
                                    <span className="text-[11px] font-black font-mono">
                                      {selectedTenant.matricule}
                                    </span>
                                    {copiedMatricule === selectedTenant.matricule ? (
                                      <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                                    ) : (
                                      <Copy className="w-2.5 h-2.5 text-indigo-400 opacity-60 group-hover:opacity-100 shrink-0" />
                                    )}
                                  </button>
                                )}
                                <div className="flex items-center gap-1.5 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                                  <span className="text-[10px] font-bold text-slate-500">Réf Bail :</span>
                                  <span className="text-[11px] font-black text-brand-600">
                                    {selectedTenant.lease.id}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                              <div className="space-y-1">
                                <span className="text-slate-500 text-[11px] font-semibold block">Bien & Désignation du Lot :</span>
                                <span className="font-extrabold text-slate-900 block text-sm">
                                  {selectedTenant.property.name}
                                </span>
                                <span className="font-semibold text-tealAccent-700 text-xs flex items-center gap-1">
                                  <Building className="w-3.5 h-3.5" />
                                  <span>{selectedTenant.property.unit}</span>
                                </span>
                                {selectedTenant.property.listingReference && (
                                  <span className="text-[10px] text-brand-600 font-bold block pt-0.5">
                                    Annonce liée : {selectedTenant.property.listingReference}
                                  </span>
                                )}
                              </div>

                              <div className="space-y-1">
                                <span className="text-slate-500 text-[11px] font-semibold block">Localisation géographique exacte :</span>
                                <span className="font-black text-slate-900 flex items-center gap-1.5 text-xs text-emerald-950">
                                  <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  <span>{selectedTenant.property.location}</span>
                                </span>
                                {selectedTenant.property.landmark ? (
                                  <span className="text-amber-800 text-[11px] font-medium flex items-center gap-1 pt-0.5">
                                    <Compass className="w-3 h-3 text-amber-500 shrink-0" />
                                    <span>Repère local : <strong>{selectedTenant.property.landmark}</strong></span>
                                  </span>
                                ) : (
                                  <span className="text-slate-500 text-[11px] block pt-0.5">
                                    Adresse : {selectedTenant.property.address}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Identité Locataire & Matricule */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                Identité du Locataire
                              </span>
                              <div className="space-y-2 text-xs">
                                <div>
                                  <span className="font-black text-slate-900 text-sm block">
                                    {selectedTenant.fullName}
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-medium">
                                    Locataire Résident
                                  </span>
                                </div>
                                {selectedTenant.matricule && (
                                  <div>
                                    <button
                                      type="button"
                                      onClick={() => handleCopyMatricule(selectedTenant.matricule!)}
                                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-mono font-black text-[11px] transition-colors cursor-pointer group"
                                      title="Copier le matricule certifié"
                                    >
                                      <Fingerprint className="w-3 h-3 text-indigo-600 shrink-0" />
                                      <span>{selectedTenant.matricule}</span>
                                      {copiedMatricule === selectedTenant.matricule ? (
                                        <Check className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                      ) : (
                                        <Copy className="w-2.5 h-2.5 text-indigo-400 opacity-60 group-hover:opacity-100 shrink-0" />
                                      )}
                                    </button>
                                  </div>
                                )}
                                <div className="space-y-1 pt-1 border-t border-slate-200">
                                  <div className="flex items-center gap-1.5 text-slate-700 text-xs">
                                    <Phone className="w-3 h-3 text-brand-500 shrink-0" />
                                    <span>{selectedTenant.phone}</span>
                                  </div>
                                  {selectedTenant.email && (
                                    <div className="flex items-center gap-1.5 text-slate-600 text-[11px] truncate">
                                      <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                      <span className="truncate">{selectedTenant.email}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Financial info */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                Modalités Financières
                              </span>
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Loyer mensuel :</span>
                                  <span className="font-extrabold text-slate-900">
                                    {formatFCFA(selectedTenant.financials.monthlyRent)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Charges incluses :</span>
                                  <span className="font-bold text-slate-700">
                                    {formatFCFA(selectedTenant.financials.charges)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Dépôt de caution :</span>
                                  <span className="font-extrabold text-brand-600">
                                    {formatFCFA(selectedTenant.financials.deposit)} ({selectedTenant.financials.advanceMonths} mois)
                                  </span>
                                </div>
                                <div className="flex justify-between pt-1 border-t border-slate-200">
                                  <span className="text-slate-500">Jour d’exigibilité :</span>
                                  <span className="font-extrabold text-slate-900">
                                    Le {selectedTenant.financials.paymentDay} de chaque mois
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Emergency Contact */}
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                Contact d’Urgence / Garant
                              </span>
                              <div className="space-y-1.5 text-xs">
                                <div className="font-extrabold text-slate-900">
                                  {selectedTenant.emergencyContact.name}
                                </div>
                                <div className="text-slate-500">
                                  Lien : <strong>{selectedTenant.emergencyContact.relation}</strong>
                                </div>
                                <div className="flex items-center gap-1.5 text-brand-600 font-bold mt-2">
                                  <Phone className="w-3.5 h-3.5" />
                                  {selectedTenant.emergencyContact.phone}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Quick WhatsApp Action Button */}
                          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                <MessageCircle className="w-5 h-5" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-emerald-950">
                                  Canal WhatsApp Direct
                                </h4>
                                <p className="text-[11px] text-emerald-800">
                                  Ouvrir une conversation directe avec le locataire sur {selectedTenant.phone}
                                </p>
                              </div>
                            </div>
                            <a
                              href={`https://wa.me/${selectedTenant.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all shrink-0 flex items-center gap-1.5"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>Contacter</span>
                            </a>
                          </div>
                        </div>
                      )}

                      {/* 2. Onglet Solvabilité & Historique Inter-Bailleurs */}
                      {activeTab === 'solvabilite' && (
                        <div className="space-y-5 animate-in fade-in duration-200">
                          {/* Consent Warning Box */}
                          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
                            <Lock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                              <h4 className="font-extrabold text-blue-950 mb-0.5">
                                Protection des Données & Consentement RGPD / UEMOA & CEMAC
                              </h4>
                              <p className="leading-relaxed text-[11px] text-blue-800">
                                {selectedTenant.scoring.historyConsentGranted ? (
                                  <>
                                    Le locataire a consenti au partage de son dossier locatif objectif (ponctualité, retards, fin de bail). Ce consentement est temporaire (valable jusqu'au {selectedTenant.scoring.consentExpiresAt}) et révocable.
                                  </>
                                ) : (
                                  <>
                                    Le locataire n’a pas encore activé le consentement de partage avec les tiers. Seules ses statistiques au sein de votre organisation sont visibles.
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          {/* Score Breakdown Cards */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                Taux à l’Heure
                              </span>
                              <span className="text-lg font-black text-emerald-600 mt-0.5 block">
                                {selectedTenant.scoring.onTimeRate}%
                              </span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                Retard Moyen
                              </span>
                              <span className="text-lg font-black text-slate-900 mt-0.5 block">
                                {selectedTenant.scoring.averageDelayDays} jours
                              </span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                Retard Max
                              </span>
                              <span className="text-lg font-black text-slate-900 mt-0.5 block">
                                {selectedTenant.scoring.maxDelayDays} jours
                              </span>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">
                                Arriérés Actuels
                              </span>
                              <span className={`text-lg font-black mt-0.5 block ${selectedTenant.scoring.finalArrears > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formatFCFA(selectedTenant.scoring.finalArrears)}
                              </span>
                            </div>
                          </div>

                          {/* Formula Explanation */}
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2">
                            <h4 className="font-extrabold text-slate-900">
                              Barème Déterministe de Solvabilité LOCAGESTION :
                            </h4>
                            <p className="text-slate-600 text-[11px] leading-relaxed">
                              Le score démarre obligatoirement à <strong>100/100 (Vert)</strong> pour tout nouveau locataire dès la création de son compte. Il évolue ensuite selon le comportement de paiement à l'échéance du 5 du mois : <strong>Palier Vert (85 à 100)</strong>, <strong>Palier Bleu (70 à 84)</strong>, <strong>Palier Orange (50 à 69)</strong> et <strong>Palier Rouge (&lt; 50)</strong>. Aucune appréciation subjective n’est enregistrée afin de garantir une intégrité juridique totale.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* 3. Onglet Bail & Documents */}
                      {activeTab === 'bail' && (() => {
                        const currentLeaseObj = leases.find((l) => l.id === selectedTenant.lease.id);
                        const isLeaseResiliated = currentLeaseObj?.status === 'resilie';

                        return (
                          <div className="space-y-4 animate-in fade-in duration-200">
                            <div
                              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isLeaseResiliated
                                ? 'bg-rose-50/50 border-rose-200 shadow-soft'
                                : 'bg-slate-50 border-slate-200'
                                }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isLeaseResiliated
                                    ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                    : 'bg-brand-50 text-brand-600'
                                    }`}
                                >
                                  {isLeaseResiliated ? (
                                    <Ban className="w-5 h-5 text-rose-600" />
                                  ) : (
                                    <FileText className="w-5 h-5" />
                                  )}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-xs font-bold text-slate-900">
                                      Contrat de Bail d’Habitation Scellé
                                    </h4>
                                    {isLeaseResiliated ? (
                                      <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                        <Ban className="w-3 h-3 text-rose-600" />
                                        <span>Bail Résilié • Logement dissocié</span>
                                      </span>
                                    ) : (
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>Bail Actif</span>
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] text-slate-400 block mt-0.5">
                                    Réf: <strong className="text-slate-700">{selectedTenant.lease.id}</strong>
                                    {selectedTenant.matricule && (
                                      <> • Matricule : <strong className="text-indigo-700 font-mono">{selectedTenant.matricule}</strong></>
                                    )}
                                    {` • Prise d'effet le ${selectedTenant.lease.startDate}`}
                                    {currentLeaseObj?.resiliatedAt && ` • Résilié le ${currentLeaseObj.resiliatedAt}`}
                                    {currentLeaseObj?.reactivatedAt && ` • Réactivé le ${currentLeaseObj.reactivatedAt}`}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                {/* Bouton Réactiver le bail sans démarches */}
                                {isLeaseResiliated ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleReactivateTenantLease(
                                        selectedTenant.lease.id,
                                        selectedTenant.fullName
                                      )
                                    }
                                    className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                                    title="Réactiver le bail sans autres démarches"
                                  >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    <span>Réactiver le bail</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setLeaseToTerminate({
                                        id: selectedTenant.lease.id,
                                        tenant: selectedTenant.fullName,
                                        property: selectedTenant.property.name,
                                        unit: selectedTenant.property.unit,
                                        rent: selectedTenant.financials.monthlyRent,
                                      })
                                    }
                                    className="py-1.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                                    title="Résilier ce contrat de bail et dissocier le logement"
                                  >
                                    <Ban className="w-3.5 h-3.5 text-rose-600" />
                                    <span>Résilier le bail</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    generateLeasePDF({
                                      id: selectedTenant.lease.id,
                                      tenantName: selectedTenant.fullName,
                                      tenantPhone: selectedTenant.phone,
                                      tenantEmail: selectedTenant.email,
                                      propertyName: selectedTenant.property.name,
                                      unit: selectedTenant.property.unit,
                                      propertyLocation: selectedTenant.property.location,
                                      propertyAddress: selectedTenant.property.address,
                                      propertyCity: selectedTenant.property.city,
                                      rent: selectedTenant.financials.monthlyRent,
                                      deposit: selectedTenant.financials.deposit,
                                      startDate: selectedTenant.lease.startDate,
                                    });
                                    showToast(`Contrat de bail ${selectedTenant.lease.id} téléchargé en PDF officiel !`);
                                  }}
                                  className="py-1.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-bold shadow-sm transition-all cursor-pointer"
                                >
                                  Consulter (PDF)
                                </button>
                              </div>
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                                  <UserCheck className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900">
                                    Pièce d’Identité Certifiée & IFU
                                  </h4>
                                  <span className="text-[11px] text-slate-400">
                                    Passeport / CNI vérifié par le bailleur
                                  </span>
                                </div>
                              </div>

                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Vérifié ✓
                              </span>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 4. Onglet État des Lieux */}
                      {activeTab === 'edl' && (
                        <div className="space-y-4 animate-in fade-in duration-200">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-black text-slate-900">
                                État des Lieux d’Entrée
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                Date : {selectedTenant.inspection.date}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 mb-3 bg-white p-3 rounded-xl border border-slate-200">
                              « {selectedTenant.inspection.generalState} »
                            </p>
                            <div className="flex items-center justify-between text-xs text-slate-500">
                              <span>{selectedTenant.inspection.photosCount} photos horodatées annexées</span>
                              <span className="text-emerald-600 font-bold">
                                Contresigné par le locataire ✓
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 5. Onglet Quittances & Règlements */}
                      {activeTab === 'paiements' && (
                        <div className="space-y-3 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                              Quittances Émises ({selectedTenant.recentReceipts.length})
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuickAction('new_payment')}
                              className="text-xs font-bold text-brand-600 hover:text-brand-700 cursor-pointer"
                            >
                              + Encaisser une mensualité
                            </button>
                          </div>

                          {selectedTenant.recentReceipts.map((rec) => (
                            <div
                              key={rec.id}
                              className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 hover:bg-white transition-all cursor-pointer"
                              onClick={() =>
                                setReceiptPayment({
                                  receiptNumber: rec.receiptNumber,
                                  tenantName: selectedTenant.fullName,
                                  tenantPhone: selectedTenant.phone,
                                  propertyName: selectedTenant.property.name,
                                  unitNumber: selectedTenant.property.unit,
                                  amount: rec.amount,
                                  period: rec.period,
                                  paymentDate: rec.date,
                                  method: rec.method,
                                  status: 'paye',
                                  isVerified: true,
                                })
                              }
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                  <Receipt className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-xs font-black text-slate-900 block">
                                    {rec.period}
                                  </span>
                                  <span className="text-[10px] text-slate-400 block font-mono">
                                    {rec.receiptNumber} • {rec.date}
                                  </span>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-xs font-black text-slate-900 block">
                                  {formatFCFA(rec.amount)}
                                </span>
                                <span className="text-[10px] text-emerald-700 font-bold block">
                                  Soldé (Wave)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Footer en fin de page : Créée au Bénin (en bas à gauche) */}
          <Footer />
        </main>
      </div>

      {/* Modal Inviter un Locataire */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-brand-500/20 text-brand-400 flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm">
                    Inviter un Nouveau Locataire
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Transmission par Email, SMS et WhatsApp
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowInviteModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!inviteSentSuccess ? (
              <form
                onSubmit={handleSendInvitation}
                className="p-6 space-y-4 text-xs"
              >
                {/* Information Canaux */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90 flex items-center justify-between gap-2">
                  <span className="text-[11px] font-bold text-slate-600">Canaux d'envoi simultanés :</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-[10px] border border-blue-200 flex items-center gap-1">
                      <Mail className="w-2.5 h-2.5" /> Email
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center gap-1">
                      <Smartphone className="w-2.5 h-2.5" /> SMS
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-green-50 text-green-700 font-bold text-[10px] border border-green-200 flex items-center gap-1">
                      <MessageCircle className="w-2.5 h-2.5" /> WhatsApp
                    </span>
                  </div>
                </div>

                {/* Nom et Prénom séparés sur la même ligne */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Nom de famille *
                    </label>
                    <input
                      type="text"
                      required
                      value={inviteLastName}
                      onChange={(e) => setInviteLastName(e.target.value)}
                      placeholder="Ex: Touré, Mensah..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Prénom(s) *
                    </label>
                    <input
                      type="text"
                      required
                      value={inviteFirstName}
                      onChange={(e) => setInviteFirstName(e.target.value)}
                      placeholder="Ex: Aïcha, Kofi..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Numéro WhatsApp / SMS *
                    </label>
                    <input
                      type="tel"
                      required
                      value={invitePhone}
                      onChange={(e) => setInvitePhone(e.target.value)}
                      placeholder="Ex: +229 97 00 00 00"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      Adresse email du locataire *
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="locataire@exemple.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Lien d'invitation sécurisé à usage unique :
                    </span>
                    <span className="text-[10px] font-mono text-brand-600 font-bold">
                      Code : {inviteCode}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={computedPortalUrl}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-600 truncate"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(computedPortalUrl);
                        setInviteCopied(true);
                        showToast('Lien d’invitation copié dans le presse-papier !');
                        setTimeout(() => setInviteCopied(false), 2500);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                    >
                      {inviteCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{inviteCopied ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 text-slate-700 cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingInvite}
                    className="py-2.5 px-5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-extrabold shadow-pink-glow flex items-center gap-2 cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSendingInvite ? 'Envoi en cours...' : 'Envoyer par Email & SMS'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-4 text-xs">
                {/* Bannière de confirmation */}
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200/90 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="font-black text-sm text-emerald-950">
                        Invitation générée avec succès !
                      </h4>
                      <p className="text-[11px] text-emerald-800">
                        Pour <strong>{inviteFullName || 'le locataire'}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1 text-[11px]">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-emerald-200 text-emerald-900 font-semibold shadow-2xs">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-blue-600" />
                        <span>Email officiel à <strong>{inviteEmail}</strong></span>
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                        {inviteDispatchResult?.emailSent ? '✓ Expédié' : '✓ Envoi déclenché'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-emerald-200 text-emerald-900 font-semibold shadow-2xs">
                      <span className="flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                        <span>SMS vers <strong>{invitePhone}</strong></span>
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                        Prêt pour envoi direct
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions directes 1-clic */}
                <div className="space-y-2.5">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Expédier immédiatement via vos applications :
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* SMS direct */}
                    {inviteDispatchResult?.smsUri && (
                      <a
                        href={inviteDispatchResult.smsUri}
                        className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 font-black text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                      >
                        <Smartphone className="w-4 h-4" />
                        <span>Ouvrir dans l'app SMS</span>
                      </a>
                    )}

                    {/* WhatsApp direct */}
                    {inviteDispatchResult?.whatsappUrl && (
                      <a
                        href={inviteDispatchResult.whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-3 rounded-2xl bg-green-600 hover:bg-green-700 text-white flex items-center justify-center gap-2 font-black text-xs shadow-md shadow-green-600/20 active:scale-95 transition-all cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Envoyer par WhatsApp</span>
                      </a>
                    )}
                  </div>

                  {/* Mail direct */}
                  {inviteDispatchResult?.gmailUrl && (
                    <a
                      href={inviteDispatchResult.gmailUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-center gap-2 font-bold text-xs transition-colors cursor-pointer"
                    >
                      <Mail className="w-4 h-4 text-blue-600" />
                      <span>Ouvrir le brouillon dans Gmail / Application Mail</span>
                    </a>
                  )}
                </div>

                {/* Copier le message complet */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Lien d'invitation sécurisé :
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const txt = inviteDispatchResult?.textMessage || computedPortalUrl;
                        navigator.clipboard?.writeText(txt);
                        setInviteCopied(true);
                        showToast('Message et lien d’invitation copiés !');
                        setTimeout(() => setInviteCopied(false), 2500);
                      }}
                      className="text-brand-600 hover:text-brand-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      {inviteCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                      <span>{inviteCopied ? 'Copié !' : 'Copier tout le texte'}</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    readOnly
                    value={computedPortalUrl}
                    className="w-full px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-[11px] font-mono text-slate-600 truncate"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={openInviteModal}
                    className="py-2.5 px-4 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 text-slate-700 cursor-pointer text-xs"
                  >
                    + Inviter un autre locataire
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold cursor-pointer text-xs"
                  >
                    Terminer
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast Notification avec option Annuler l'erreur */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4.5 py-3.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5 max-w-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1">{toastMessage}</span>
          {lastResiliatedId && (
            <button
              type="button"
              onClick={() => {
                handleReactivateTenantLease(lastResiliatedId, selectedTenant?.fullName || 'Locataire');
              }}
              className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black flex items-center gap-1.5 cursor-pointer transition-all shrink-0 shadow-md active:scale-95"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Annuler l'erreur / Réactiver</span>
            </button>
          )}
        </div>
      )}

      {/* Receipts Inspection Modal */}
      {receiptPayment && (
        <ReceiptModal
          payment={receiptPayment}
          onClose={() => setReceiptPayment(null)}
        />
      )}

      {/* Quick Action Modal */}
      {quickAction && (
        <QuickActionModal
          actionType={quickAction}
          onClose={() => setQuickAction(null)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}

      {/* Modale de Confirmation de Résiliation */}
      <ConfirmTerminateLeaseModal
        isOpen={!!leaseToTerminate}
        lease={leaseToTerminate}
        onClose={() => setLeaseToTerminate(null)}
        onConfirm={(reason) => {
          if (leaseToTerminate) {
            handleTerminateTenantLease(
              leaseToTerminate.id,
              leaseToTerminate.tenant,
              reason
            );
          }
          setLeaseToTerminate(null);
        }}
      />
    </div>
  );
}

