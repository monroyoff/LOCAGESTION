import { areEmailsEqual, arePhoneNumbersEqual, SYSTEM_ADMIN_USER } from './auth-service';
import { AuthUser } from '../types';
import { ListingsService } from './listings-service';

export interface Message {
  id: string;
  sender: 'them' | 'me';
  senderRole?: 'bailleur' | 'locataire' | 'demarcheur' | 'visitor';
  senderName: string;
  senderAvatar?: string;
  senderId?: string;
  text?: string;
  imageUrl?: string;
  time: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface Conversation {
  id: string;
  tenantName: string;
  tenantAvatar: string;
  publisherName?: string;
  publisherAvatar?: string;
  visitorId?: string;
  visitorName?: string;
  visitorAvatar?: string;
  visitorPhone?: string;
  visitorEmail?: string;
  isOnline: boolean;
  propertyTitle: string;
  propertyUnit: string;
  propertySurface: string; // "55 m²"
  propertyPrice: number; // FCFA/mois
  propertyThumbnail: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount?: number;
  hasUnread?: boolean;
  unreadBy?: 'bailleur' | 'locataire';
  isRead?: boolean;
  isArchived?: boolean;
  messages: Message[];
  listingId?: string;
  authorId?: string;
  authorName?: string;
  authorCompany?: string;
  authorEmail?: string;
  authorPhone?: string;
  authorRole?: string;
}

export const STORAGE_KEY_CONVERSATIONS = 'locagestion:conversations:v1';

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-jojovog-voglossou-01',
    listingId: 'list-bj-allada-01',
    tenantName: 'Jojo VOG',
    tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    visitorId: 'usr-tenant-jojovog',
    visitorName: 'Jojo VOG',
    visitorEmail: 'jojovog007@gmail.com',
    visitorPhone: '+229 97 00 12 34',
    visitorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    publisherName: 'VOGLOSSOU JOHANE',
    publisherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    authorId: 'usr-bailleur-voglossou',
    authorName: 'VOGLOSSOU JOHANE',
    authorCompany: 'MONROY AGENCY',
    authorEmail: 'jobovog@gmail.com',
    authorPhone: '+229 01 95 44 44 30',
    authorRole: 'bailleur',
    isOnline: true,
    propertyTitle: 'Chambre Salon Sanitaire Moderne à Dogoudo',
    propertyUnit: 'Lot 1 (Chambre Salon Sanitaire • 45 m²)',
    propertySurface: '45 m²',
    propertyPrice: 25000,
    propertyThumbnail: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&auto=format&fit=crop&q=80',
    lastMessage: "c'est parfait",
    lastMessageTime: 'À l\'instant',
    unreadCount: 0,
    hasUnread: false,
    isRead: true,
    isArchived: false,
    messages: [
      {
        id: 'msg-001',
        sender: 'them',
        senderRole: 'locataire',
        senderName: 'Jojo VOG',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
        senderId: 'usr-tenant-jojovog',
        text: 'Bonjour M. Voglossou, je vous contacte concernant le logement.',
        time: '10:15',
        status: 'read',
      },
      {
        id: 'msg-002',
        sender: 'me',
        senderRole: 'bailleur',
        senderName: 'VOGLOSSOU JOHANE',
        senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
        senderId: 'usr-bailleur-voglossou',
        text: 'Bonjour Jojo, le logement est bien disponible et le contrat de bail est prêt.',
        time: '10:20',
        status: 'read',
      },
      {
        id: 'msg-003',
        sender: 'them',
        senderRole: 'locataire',
        senderName: 'Jojo VOG',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
        senderId: 'usr-tenant-jojovog',
        text: "c'est parfait",
        time: 'À l\'instant',
        status: 'read',
      },
    ],
  },
  {
    id: 'conv-jojovog-viviimmo-01',
    listingId: 'list-bj-boutique-01',
    tenantName: 'Jojo VOG',
    tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    visitorId: 'usr-tenant-jojovog',
    visitorName: 'Jojo VOG',
    visitorEmail: 'jojovog007@gmail.com',
    visitorPhone: '+229 97 00 12 34',
    visitorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    publisherName: 'VIVI IMMO',
    publisherAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
    authorId: 'usr-demarcheur-mwr2q8mb',
    authorName: 'PARI VIVID',
    authorCompany: 'VIVI IMMO',
    authorEmail: 'vividpari@gmail.com',
    authorPhone: '+229 0132789056',
    authorRole: 'demarcheur',
    isOnline: true,
    propertyTitle: 'BOUTIQUE AVEC STAFF',
    propertyUnit: 'dogoudo, Allada',
    propertySurface: '12 m²',
    propertyPrice: 10000,
    propertyThumbnail: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=800&auto=format&fit=crop&q=80',
    lastMessage: 'dispo',
    lastMessageTime: '23:12',
    unreadCount: 0,
    hasUnread: false,
    isRead: true,
    isArchived: false,
    messages: [
      {
        id: 'msg-vivi-001',
        sender: 'them',
        senderRole: 'locataire',
        senderName: 'Jojo VOG',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
        senderId: 'usr-tenant-jojovog',
        text: 'Bonjour, je vous contacte au sujet de votre annonce « BOUTIQUE AVEC STAFF » située à dogoudo, Allada. Ce bien est-il toujours disponible ?',
        time: '23:10',
        status: 'read',
      },
      {
        id: 'msg-vivi-002',
        sender: 'me',
        senderRole: 'demarcheur',
        senderName: 'PARI VIVID',
        senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80',
        senderId: 'usr-demarcheur-mwr2q8mb',
        text: 'dispo',
        time: '23:12',
        status: 'read',
      },
    ],
  },
  {
    id: 'conv-jojovog-monroyagency-01',
    listingId: 'list-bj-calavi-17635',
    tenantName: 'Jojo VOG',
    tenantAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    visitorId: 'usr-tenant-jojovog',
    visitorName: 'Jojo VOG',
    visitorEmail: 'jojovog007@gmail.com',
    visitorPhone: '+229 97 00 12 34',
    visitorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
    publisherName: 'MONROY AGENCY',
    publisherAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
    authorId: 'usr-bailleur-voglossou',
    authorName: 'VOGLOSSOU JOHANE',
    authorCompany: 'MONROY AGENCY',
    authorEmail: 'jobovog@gmail.com',
    authorPhone: '+229 01 95 44 44 30',
    authorRole: 'bailleur',
    isOnline: true,
    propertyTitle: 'Studio Meublé Moderne — Résidence UAC Calavi',
    propertyUnit: 'Zogbadjè (Campus UAC), Abomey-Calavi',
    propertySurface: '25 m²',
    propertyPrice: 35000,
    propertyThumbnail: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&auto=format&fit=crop&q=80',
    lastMessage: 'Bonjour, je vous contacte au sujet de votre annonce « Studio Meublé Moderne — Résidence UAC Calavi » (25 m², 35 000 FCFA/mois). Ce bien est-il toujours disponible ?',
    lastMessageTime: '14:57',
    unreadCount: 0,
    hasUnread: false,
    isRead: true,
    isArchived: false,
    messages: [
      {
        id: 'msg-monroy-001',
        sender: 'them',
        senderRole: 'locataire',
        senderName: 'Jojo VOG',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
        senderId: 'usr-tenant-jojovog',
        text: 'Bonjour, je vous contacte au sujet de votre annonce « Studio Meublé Moderne — Résidence UAC Calavi » (25 m², 35 000 FCFA/mois). Ce bien est-il toujours disponible ?',
        time: '14:57',
        status: 'read',
      },
    ],
  },
];

export function isFakeConversation(c: any): boolean {
  if (!c) return true;

  // Protection absolue des conversations authentiques des comptes officiels
  const aEmail = (c.authorEmail || '').trim().toLowerCase();
  const vEmail = (c.visitorEmail || '').trim().toLowerCase();
  const aId = (c.authorId || '').trim();
  const vId = (c.visitorId || '').trim();
  if (
    aEmail === 'jobovog@gmail.com' ||
    vEmail === 'jojovog007@gmail.com' ||
    vEmail === 'theodoradjigla@gmail.com' ||
    aEmail === 'vividpari@gmail.com' ||
    vEmail === 'vividpari@gmail.com' ||
    aEmail === 'viviimmo.bj@gmail.com' ||
    vEmail === 'viviimmo.bj@gmail.com' ||
    aId === 'usr-bailleur-voglossou' ||
    vId === 'usr-tenant-jojovog' ||
    vId === 'usr-tenant-theodora' ||
    aId === 'usr-demarcheur-mwr2q8mb' ||
    vId === 'usr-demarcheur-mwr2q8mb' ||
    aId === 'usr-vivi-immo' ||
    vId === 'usr-vivi-immo'
  ) {
    return false;
  }
  const name = (c.tenantName || c.visitorName || '').trim().toLowerCase();
  if (
    name === 'koffi mensah' ||
    name === 'mamadou diallo' ||
    name === 'ibrahim traoré' ||
    name === 'ibrahim traore' ||
    name === 'aïcha touré' ||
    name === 'aicha toure' ||
    name === 'fatoumata traoré' ||
    name === 'fatoumata traore' ||
    name === 'amina diop'
  ) {
    return true;
  }
  const authorName = (c.authorName || c.publisherName || '').trim().toLowerCase();
  if (
    authorName === 'cabinet immobilier atlantique' ||
    authorName === 'agence immobilière bénin littoral' ||
    authorName === 'agence immobiliere benin littoral' ||
    authorName === 'agence ivoire logement' ||
    authorName === 'agence teranga immobilier' ||
    authorName === 'cabinet immobilier lomé express' ||
    authorName === 'cabinet immobilier lome express' ||
    authorName === 'mamadou diallo' ||
    authorName === 'koffi mensah' ||
    authorName === 'aïcha touré' ||
    authorName === 'aicha toure'
  ) {
    return true;
  }
  const prop = (c.propertyTitle || '').trim().toLowerCase();
  if (
    prop.includes('résidence les cocotiers') ||
    prop.includes('residence les cocotiers') ||
    prop.includes('immeuble palmier royal') ||
    prop.includes('villa émeraude')
  ) {
    return true;
  }
  const lId = (c.listingId || '').trim();
  if (
    lId === 'list-bj-uac-calavi' ||
    lId === 'list-bj-haie-vive' ||
    lId === 'list-bj-fidjrosse' ||
    lId === 'list-bj-akpakpa' ||
    lId === 'list-ci-cocody' ||
    lId === 'list-sn-almadies' ||
    lId === 'list-tg-lome'
  ) {
    return true;
  }
  return false;
}

/**
 * Détermine si l'utilisateur est l'auteur / bailleur / démarcheur de la conversation
 */
export function isUserConversationAuthor(conv: Conversation, user?: AuthUser | any | null): boolean {
  if (!user) return false;

  const uId = user.id ? String(user.id).trim().toLowerCase() : '';
  const uMatricule = user.matricule ? String(user.matricule).trim().toLowerCase() : '';
  const uEmail = user.email ? user.email.trim().toLowerCase() : '';
  const uPhone = user.phone ? user.phone.replace(/\D/g, '') : '';
  const uName = (user.name || user.firstName || '').trim().toLowerCase();
  const uCompany = (user.companyName || '').trim().toLowerCase();

  const authorId = conv.authorId ? String(conv.authorId).trim().toLowerCase() : '';
  const authorEmail = conv.authorEmail ? conv.authorEmail.trim().toLowerCase() : '';
  const authorPhone = conv.authorPhone ? conv.authorPhone.replace(/\D/g, '') : '';
  const authorName = (conv.authorName || '').trim().toLowerCase();
  const authorCompany = (conv.authorCompany || '').trim().toLowerCase();
  const publisherName = (conv.publisherName || '').trim().toLowerCase();

  // 1. Matching par ID ou Matricule
  if (authorId) {
    if (uId && authorId === uId) return true;
    if (uMatricule && authorId === uMatricule) return true;
  }

  // 2. Matching par Email
  if (authorEmail && uEmail && areEmailsEqual(authorEmail, uEmail)) {
    return true;
  }

  // 3. Matching par Téléphone
  if (authorPhone && uPhone && arePhoneNumbersEqual(authorPhone, uPhone)) {
    return true;
  }

  // 4. Matching par Raison Sociale / Entreprise
  if (authorCompany && uCompany && authorCompany === uCompany) {
    return true;
  }

  // 5. Matching par Nom
  if (authorName && uName) {
    if (authorName === uName) return true;
    const authorWords = authorName.split(/\s+/).filter(Boolean);
    const userWords = uName.split(/\s+/).filter(Boolean);
    if (
      authorWords.length > 0 &&
      authorWords.length === userWords.length &&
      authorWords.every((w) => userWords.includes(w))
    ) {
      return true;
    }
  }

  if (publisherName && uCompany && publisherName === uCompany) {
    return true;
  }
  if (publisherName && uName && publisherName === uName) {
    return true;
  }

  // 6. Si listingId est renseigné, vérifier l'auteur de l'annonce correspondante
  if (conv.listingId) {
    try {
      const allListings = ListingsService.getAllListings();
      const listing = allListings.find(
        (l) => l.id === conv.listingId || (l.referenceCode && l.referenceCode === conv.listingId)
      );
      if (listing) {
        const lAuthorId = listing.authorId ? String(listing.authorId).trim().toLowerCase() : '';
        if (lAuthorId && (lAuthorId === uId || lAuthorId === uMatricule)) return true;
        if (listing.authorEmail && uEmail && areEmailsEqual(listing.authorEmail, uEmail)) return true;
        if (listing.authorPhone && uPhone && arePhoneNumbersEqual(listing.authorPhone, uPhone)) return true;
        if (listing.authorCompany && uCompany && listing.authorCompany.trim().toLowerCase() === uCompany) return true;
        if (listing.authorName && uName && listing.authorName.trim().toLowerCase() === uName) return true;
      }
    } catch { }
  }

  return false;
}

/**
 * Détermine si l'utilisateur est le visiteur / candidat / locataire de la conversation
 */
export function isUserConversationVisitor(conv: Conversation, user?: AuthUser | any | null): boolean {
  if (!user) return false;

  const uId = user.id ? String(user.id).trim().toLowerCase() : '';
  const uMatricule = user.matricule ? String(user.matricule).trim().toLowerCase() : '';
  const uEmail = user.email ? user.email.trim().toLowerCase() : '';
  const uPhone = user.phone ? user.phone.replace(/\D/g, '') : '';
  const uName = (user.name || user.firstName || '').trim().toLowerCase();

  const visitorId = conv.visitorId ? String(conv.visitorId).trim().toLowerCase() : '';
  const visitorEmail = conv.visitorEmail ? conv.visitorEmail.trim().toLowerCase() : '';
  const visitorPhone = conv.visitorPhone ? conv.visitorPhone.replace(/\D/g, '') : '';
  const visitorName = (conv.visitorName || '').trim().toLowerCase();
  const tenantName = (conv.tenantName || '').trim().toLowerCase();
  const publisherName = (conv.publisherName || '').trim().toLowerCase();
  const authorName = (conv.authorName || '').trim().toLowerCase();

  // 1. ID ou Matricule
  if (visitorId) {
    if (uId && visitorId === uId) return true;
    if (uMatricule && visitorId === uMatricule) return true;
  }

  // 2. Email
  if (visitorEmail && uEmail && areEmailsEqual(visitorEmail, uEmail)) {
    return true;
  }

  // 3. Téléphone
  if (visitorPhone && uPhone && arePhoneNumbersEqual(visitorPhone, uPhone)) {
    return true;
  }

  // 4. Nom du visiteur
  if (visitorName && uName) {
    if (visitorName === uName) return true;
    const visitorWords = visitorName.split(/\s+/).filter(Boolean);
    const userWords = uName.split(/\s+/).filter(Boolean);
    if (
      visitorWords.length > 0 &&
      visitorWords.length === userWords.length &&
      visitorWords.every((w) => userWords.includes(w))
    ) {
      return true;
    }
  }

  // 5. TenantName s'il n'est pas le nom du bailleur/publisher
  if (
    tenantName &&
    uName &&
    tenantName === uName &&
    tenantName !== publisherName &&
    tenantName !== authorName
  ) {
    return true;
  }

  return false;
}

/**
 * Détermine si l'utilisateur est un participant légitime (Auteur OU Visiteur) ou Super-Admin
 * avec respect absolu du cloisonnement étanche des 3 espaces (Bailleur, Locataire, Démarcheur).
 */
export function isUserConversationParticipant(
  conv: Conversation,
  user?: AuthUser | any | null,
  activeSpace?: string
): boolean {
  if (!user) return false;

  // Super-Administrateur : supervision complète autorisée uniquement en console admin ou si l'espace n'est pas restreint
  if (
    user.role === 'admin' ||
    areEmailsEqual(user.email, SYSTEM_ADMIN_USER.email) ||
    areEmailsEqual(user.email, 'admin@locagestion.site')
  ) {
    if (!activeSpace || activeSpace === 'admin') {
      return true;
    }
  }

  // 1. DÉTECTION DU RÔLE DE LA CONVERSATION
  let convRole = (conv.authorRole || '').toLowerCase().trim();
  if (!convRole && conv.listingId) {
    try {
      const allListings = ListingsService.getAllListings();
      const match = allListings.find(
        (l) => l.id === conv.listingId || (l.referenceCode && l.referenceCode === conv.listingId)
      );
      if (match?.authorRole) {
        convRole = match.authorRole.toLowerCase().trim();
      }
    } catch {}
  }
  if (!convRole) {
    convRole = 'bailleur'; // Par défaut, les baux et baux d'habitation relèvent du bailleur
  }

  // 2. ISOLATION STRICTE MULTI-ESPACES (3 ESPACES ÉTANCHES : Bailleur, Locataire, Démarcheur)
  const currentSpace = (activeSpace || user.role || 'bailleur').toLowerCase().trim();

  if (currentSpace === 'demarcheur') {
    // Dans l'Espace Démarcheur :
    // - INTERDICTION ABSOLUE d'afficher les conversations de baux / gestion locative bailleur (authorRole === 'bailleur')
    if (convRole === 'bailleur') {
      return false;
    }
    // L'utilisateur doit être l'auteur/mandataire de la conversation démarcheur
    return isUserConversationAuthor(conv, user);
  }

  if (currentSpace === 'bailleur') {
    // Dans l'Espace Bailleur :
    // - Ne doit afficher QUE les échanges où l'utilisateur intervient en tant que Bailleur (gestion de ses biens, baux, loyers)
    // - Exclut strictement les annonces de pure intermédiation démarcheur
    if (convRole === 'demarcheur') {
      return false;
    }
    return isUserConversationAuthor(conv, user);
  }

  if (currentSpace === 'locataire') {
    // Dans l'Espace Locataire / Résident :
    // - L'utilisateur doit impérativement être le VISITEUR / LOCATAIRE / CANDIDAT (jamais l'auteur bailleur ou démarcheur)
    return isUserConversationVisitor(conv, user);
  }

  return isUserConversationAuthor(conv, user) || isUserConversationVisitor(conv, user);
}

/**
 * Récupère le nom du contact interlocuteur avec isolation stricte
 */
export function getConversationContactName(
  conv: Conversation,
  currentUser?: any,
  activeSpace?: string
): string {
  const isAuthor = isUserConversationAuthor(conv, currentUser);
  const isVisitor = isUserConversationVisitor(conv, currentUser);

  // Si l'utilisateur est l'auteur (Bailleur ou Démarcheur)
  if (isAuthor && !isVisitor) {
    return conv.visitorName || conv.tenantName || 'Candidat Locataire';
  }

  // Si l'utilisateur est le visiteur / candidat
  if (isVisitor && !isAuthor) {
    return conv.publisherName || conv.authorCompany || conv.authorName || 'Bailleur / Propriétaire';
  }

  // Si l'espace est bailleur/démarcheur par défaut
  if (activeSpace === 'bailleur' || activeSpace === 'demarcheur') {
    return conv.visitorName || conv.tenantName || 'Candidat Locataire';
  }

  return conv.publisherName || conv.authorCompany || conv.authorName || conv.tenantName || 'Bailleur / Propriétaire';
}

/**
 * Récupère l'avatar du contact interlocuteur
 */
export function getConversationContactAvatar(
  conv: Conversation,
  currentUser?: any,
  activeSpace?: string
): string {
  const isAuthor = isUserConversationAuthor(conv, currentUser);
  const isVisitor = isUserConversationVisitor(conv, currentUser);

  if (isAuthor && !isVisitor) {
    return (
      conv.visitorAvatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    );
  }

  if (isVisitor && !isAuthor) {
    return (
      conv.publisherAvatar ||
      conv.tenantAvatar ||
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400'
    );
  }

  if (activeSpace === 'bailleur' || activeSpace === 'demarcheur') {
    return (
      conv.visitorAvatar ||
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
    );
  }

  return (
    conv.publisherAvatar ||
    conv.tenantAvatar ||
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=400'
  );
}

/**
 * Récupère le numéro de téléphone de l'interlocuteur
 */
export function getConversationContactPhone(
  conv: Conversation,
  currentUser?: any,
  activeSpace?: string
): string {
  const isAuthor = isUserConversationAuthor(conv, currentUser);
  const isVisitor = isUserConversationVisitor(conv, currentUser);

  if (isAuthor && !isVisitor) {
    return conv.visitorPhone || '';
  }
  if (isVisitor && !isAuthor) {
    return conv.authorPhone || '';
  }
  if (activeSpace === 'bailleur' || activeSpace === 'demarcheur') {
    return conv.visitorPhone || '';
  }
  return conv.authorPhone || '';
}

/**
 * Détermine si un message a été envoyé par l'utilisateur connecté
 */
export function isMessageSentByCurrentUser(
  msg: Message,
  currentUser?: any,
  activeSpace?: string,
  conv?: Conversation | null
): boolean {
  if (!conv || !currentUser) return msg.sender === 'me';

  const isAuthor = isUserConversationAuthor(conv, currentUser);
  const isVisitor = isUserConversationVisitor(conv, currentUser);

  if (currentUser?.name && msg.senderName) {
    if (msg.senderName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) {
      return true;
    }
  }

  if (msg.senderRole) {
    if (isAuthor && !isVisitor) {
      return msg.senderRole === 'bailleur' || msg.senderRole === 'demarcheur';
    } else if (isVisitor && !isAuthor) {
      return msg.senderRole === 'locataire' || msg.senderRole === 'visitor';
    }
  }

  return msg.sender === 'me';
}

/**
 * Calcule le nombre total de conversations ayant des messages non lus pour l'utilisateur
 */
export function getUnreadConversationsCount(
  conversations: Conversation[],
  currentUser?: AuthUser | any | null,
  activeSpace?: string
): number {
  if (!currentUser || !Array.isArray(conversations)) return 0;
  const isLandlordSide = activeSpace === 'bailleur' || activeSpace === 'demarcheur';

  return conversations.filter((c) => {
    if (c.isArchived) return false;
    if (!isUserConversationParticipant(c, currentUser, activeSpace)) return false;

    const isAuthor = isUserConversationAuthor(c, currentUser);
    const isVisitor = isUserConversationVisitor(c, currentUser);

    if (isAuthor && !isVisitor) {
      return (
        (c.unreadCount && c.unreadCount > 0 && c.unreadBy !== 'locataire') ||
        (c.hasUnread && c.unreadBy !== 'locataire')
      );
    }
    if (isVisitor && !isAuthor) {
      return (
        (c.unreadCount && c.unreadCount > 0 && c.unreadBy === 'locataire') ||
        (c.hasUnread && c.unreadBy === 'locataire')
      );
    }

    if (isLandlordSide) {
      return (
        (c.unreadCount && c.unreadCount > 0 && c.unreadBy !== 'locataire') ||
        (c.hasUnread && c.unreadBy !== 'locataire')
      );
    } else {
      return (
        (c.unreadCount && c.unreadCount > 0 && c.unreadBy === 'locataire') ||
        (c.hasUnread && c.unreadBy === 'locataire')
      );
    }
  }).length;
}

export const ConversationService = {
  getAllConversations(): Conversation[] {
    if (typeof window === 'undefined') return INITIAL_CONVERSATIONS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          let mutated = false;
          const sanitized = parsed
            .filter((c) => !isFakeConversation(c))
            .map((c) => {
              if (c.authorEmail === 'viviimmo.bj@gmail.com' || c.authorId === 'usr-vivi-immo') {
                mutated = true;
                return {
                  ...c,
                  authorId: 'usr-demarcheur-mwr2q8mb',
                  authorEmail: 'vividpari@gmail.com',
                  authorPhone: '+229 0132789056',
                  propertyUnit: 'dogoudo, Allada',
                  propertySurface: '12 m²',
                  propertyPrice: 10000,
                };
              }
              return c;
            });
          if (mutated || sanitized.length !== parsed.length) {
            try {
              localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(sanitized));
            } catch { }
          }
          if (sanitized.length > 0) return sanitized;
        }
      }
      if (INITIAL_CONVERSATIONS.length > 0) {
        try {
          localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(INITIAL_CONVERSATIONS));
        } catch { }
        return INITIAL_CONVERSATIONS;
      }
    } catch { }
    return INITIAL_CONVERSATIONS;
  },

  getConversationsForUser(user?: AuthUser | any | null, activeSpace?: string): Conversation[] {
    if (!user) return [];
    const all = this.getAllConversations();
    return all.filter((c) => isUserConversationParticipant(c, user, activeSpace));
  },

  saveConversations(conversations: Conversation[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
      window.dispatchEvent(new CustomEvent('locagestion:conversations_updated'));
      window.dispatchEvent(new Event('storage'));

      // Synchronisation montante instantanée Web <-> Mobile
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversations }),
      }).catch(() => {});
    } catch { }
  },
};
