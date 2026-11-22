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

export function isFakeConversation(c: any): boolean {
  if (!c) return true;
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
 */
export function isUserConversationParticipant(conv: Conversation, user?: AuthUser | any | null): boolean {
  if (!user) return false;

  // Super-Administrateur : supervision complète autorisée
  if (
    user.role === 'admin' ||
    areEmailsEqual(user.email, SYSTEM_ADMIN_USER.email) ||
    areEmailsEqual(user.email, 'admin@locagestion.site')
  ) {
    return true;
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
    if (!isUserConversationParticipant(c, currentUser)) return false;

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
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.filter((c) => !isFakeConversation(c));
          if (sanitized.length !== parsed.length) {
            try {
              localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(sanitized));
            } catch { }
          }
          return sanitized;
        }
      }
    } catch { }
    return [];
  },

  getConversationsForUser(user?: AuthUser | any | null): Conversation[] {
    if (!user) return [];
    const all = this.getAllConversations();
    return all.filter((c) => isUserConversationParticipant(c, user));
  },

  saveConversations(conversations: Conversation[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
      window.dispatchEvent(new CustomEvent('locagestion:conversations_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch { }
  },
};
