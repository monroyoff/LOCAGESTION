'use client';

import { AuthUser, UserSpace } from '../types';
import {
  saveUserProfile,
  setUserResidenceCountry,
  setUserResidenceCity,
  setUserResidenceDistrict,
} from './geo-service';

const STORAGE_KEY_SESSION = 'locagestion:auth:session:v1';
const STORAGE_KEY_USERS = 'locagestion:auth:users:v1';

export function getRoleLabel(role?: UserSpace | string): string {
  switch (role) {
    case 'admin':
      return 'Super-Administrateur Sécurité & Plateforme';
    case 'bailleur':
      return 'Espace Propriétaire Bailleur';
    case 'demarcheur':
      return 'Espace Démarcheur & Agent';
    case 'locataire':
      return 'Espace Résident Locataire';
    default:
      return 'Espace Utilisateur';
  }
}

export const ADMIN_CURRENT_SESSION_VERSION = 'sec_v2_20261118_revoked_all';

export const SYSTEM_ADMIN_USER: AuthUser = {
  id: 'usr-admin-omega',
  name: 'Direction Générale - Super Admin',
  firstName: 'Admin',
  lastName: 'Général',
  email: 'admin@locagestion.site',
  phone: '+229 01 96 68 92 77',
  role: 'admin',
  birthDate: '01/01/1985',
  birthPlace: 'Cotonou',
  residenceCountry: 'Bénin',
  residenceCity: 'Cotonou',
  residenceDistrict: 'Siège Central OMEGA',
  projectCountry: 'Bénin',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
  companyName: 'OMEGA LOCAGESTION HQ',
  registeredAt: '01/01/2026',
  password: 'Omega#Admin2027!LocaSecurity',
  adminSessionVersion: ADMIN_CURRENT_SESSION_VERSION,
};

/**
 * Comparaison stricte et insensible à la casse/espaces des adresses emails.
 */
export function areEmailsEqual(emailA?: string | null, emailB?: string | null): boolean {
  if (!emailA || !emailB) return false;
  return emailA.trim().toLowerCase() === emailB.trim().toLowerCase();
}

/**
 * Comparaison intelligente et universelle des numéros de téléphone africains (UEMOA/CEMAC)
 * et internationaux (indicatifs pays +229, +225, 229, 01 préfixe Bénin, zéros initiaux, etc.).
 */
export function arePhoneNumbersEqual(phoneA?: string | null, phoneB?: string | null): boolean {
  if (!phoneA || !phoneB) return false;
  const a = phoneA.replace(/[^0-9]/g, '');
  const b = phoneB.replace(/[^0-9]/g, '');
  if (a.length < 6 || b.length < 6) return false;

  // 1. Égalité stricte des chiffres
  if (a === b) return true;

  // 2. Inclusion par suffixe (ex: 22997000000 vs 97000000)
  const minLen = Math.min(a.length, b.length);
  if (minLen >= 8) {
    if (a.endsWith(b) || b.endsWith(a)) return true;
  }

  // 3. Gestion des zéros initiaux (ex: 0612345678 vs 33612345678)
  const aNoZero = a.replace(/^0+/, '');
  const bNoZero = b.replace(/^0+/, '');
  if (aNoZero.length >= 8 && bNoZero.length >= 8) {
    if (a.endsWith(bNoZero) || b.endsWith(aNoZero)) return true;
    if (aNoZero.endsWith(bNoZero) || bNoZero.endsWith(aNoZero)) return true;
  }

  // 4. Gestion du plan de numérotation ouest-africain (ex: préfixe '01' ajouté récemment au Bénin)
  if (a.length >= 8 && b.length >= 8) {
    const last8A = a.slice(-8);
    const last8B = b.slice(-8);
    if (last8A === last8B) {
      const prefixA = a.slice(0, -8);
      const prefixB = b.slice(0, -8);
      // Préfixes identiques, ou l'un est vide (local sans indicatif)
      if (!prefixA || !prefixB || prefixA === prefixB || prefixA.endsWith(prefixB) || prefixB.endsWith(prefixA)) {
        return true;
      }
      // Préfixes différant uniquement par le '01' national
      const cleanPrefA = prefixA.replace(/01$/, '');
      const cleanPrefB = prefixB.replace(/01$/, '');
      if (cleanPrefA === cleanPrefB) return true;
    }
  }

  return false;
}

function isFakeDemoUser(u?: Partial<AuthUser> | null): boolean {
  if (!u) return false;
  if (u.id === 'usr-bailleur-01' || u.id === 'usr-locataire-01' || u.id === 'usr-demarcheur-01') return true;
  if (u.name === 'Mamadou Diallo' || u.name === 'Koffi Mensah' || u.name === 'Ibrahim Traoré') return true;
  if (u.email && (
    u.email.toLowerCase().includes('diallo-patrimoine') ||
    u.email.toLowerCase().includes('fintech-africa') ||
    u.email.toLowerCase().includes('ibrahim.demarcheur') ||
    u.email.toLowerCase().includes('demarcheur@locagestion')
  )) return true;
  return false;
}

function notifyAuthChange(user: AuthUser | null) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('locagestion:auth_changed', { detail: { user } })
    );
    window.dispatchEvent(new Event('locagestion:profile_updated'));
  }
}

export const AuthService = {
  getRegisteredUsers(): AuthUser[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Élimination des faux utilisateurs démo ET de tout ancien snapshot admin périmé
          const sanitized = parsed.filter(
            (u) =>
              !isFakeDemoUser(u) &&
              !areEmailsEqual(u.email, SYSTEM_ADMIN_USER.email) &&
              u.id !== SYSTEM_ADMIN_USER.id &&
              u.role !== 'admin'
          );
          if (sanitized.length !== parsed.length) {
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(sanitized));
          }
          return sanitized;
        }
      }
    } catch (e) {
      console.error('Erreur lecture utilisateurs:', e);
    }
    return [];
  },

  saveRegisteredUsers(users: AuthUser[]): void {
    if (typeof window === 'undefined') return;
    try {
      const sanitized = users.filter((u) => !isFakeDemoUser(u));
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(sanitized));
    } catch (e) {
      console.error('Erreur sauvegarde utilisateurs:', e);
    }
  },

  getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return null;
    try {
      const session = localStorage.getItem(STORAGE_KEY_SESSION);
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed && isFakeDemoUser(parsed)) {
          localStorage.removeItem(STORAGE_KEY_SESSION);
          return null;
        }
        if (parsed && (parsed.role === 'admin' || areEmailsEqual(parsed.email, SYSTEM_ADMIN_USER.email))) {
          // RÉVOCATION DE SESSION GLOBALE : si la session admin provient de l'ancienne version exposée,
          // déconnexion immédiate sur tout appareil !
          if (parsed.adminSessionVersion !== ADMIN_CURRENT_SESSION_VERSION) {
            localStorage.removeItem(STORAGE_KEY_SESSION);
            localStorage.removeItem('locagestion:active_space');
            notifyAuthChange(null);
            return null;
          }
          parsed.phone = SYSTEM_ADMIN_USER.phone;
        }
        return parsed || null;
      }
      return null;
    } catch (e) {
      console.error('Erreur lecture session:', e);
      return null;
    }
  },

  /**
   * Retourne l'ensemble de tous les utilisateurs enregistrés et connus,
   * y compris la session active et le Super Administrateur système.
   */
  getAllKnownUsers(): AuthUser[] {
    const registered = this.getRegisteredUsers();
    const current = this.getCurrentUser();
    // Le Super-Admin système est toujours présent avec ses identifiants officiels à jour
    const list = [...registered, SYSTEM_ADMIN_USER];

    if (current && !list.some((u) => u.id === current.id || areEmailsEqual(u.email, current.email))) {
      list.unshift(current);
    }
    return list;
  },

  /**
   * Connexion avec le compte Super-Admin (Sécurisée - Requiert mot de passe)
   */
  loginAsAdmin(): { success: boolean; error: string } {
    return {
      success: false,
      error: "Accès direct désactivé. Veuillez vous connecter avec le mot de passe secret du Super-Admin.",
    };
  },

  /**
   * Vérifie la disponibilité stricte d'un email et d'un numéro de téléphone
   * sur TOUTE la plateforme LOCAGESTION, tous rôles / espaces confondus (Bailleur, Démarcheur, Locataire).
   * Un seul compte par email et par numéro est autorisé.
   */
  checkIdentifierAvailability(
    email?: string | null,
    phone?: string | null,
    excludeUserId?: string | null
  ): {
    available: boolean;
    conflictType?: 'email' | 'phone';
    existingRole?: UserSpace;
    existingName?: string;
    message?: string;
  } {
    const allUsers = this.getAllKnownUsers().filter(
      (u) => !excludeUserId || u.id !== excludeUserId
    );

    // 1. Vérification stricte de l'Email
    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      const emailConflict = allUsers.find((u) => areEmailsEqual(u.email, cleanEmail));
      if (emailConflict) {
        const roleLabel = getRoleLabel(emailConflict.role);
        return {
          available: false,
          conflictType: 'email',
          existingRole: emailConflict.role,
          existingName: emailConflict.firstName || emailConflict.name,
          message: `Cette adresse email (${cleanEmail}) est déjà associée à un compte (${roleLabel}). Un seul compte par adresse email est autorisé sur toute la plateforme LOCAGESTION (tous espaces confondus).`,
        };
      }
    }

    // 2. Vérification stricte du Numéro de téléphone
    if (phone && phone.trim()) {
      const cleanPhone = phone.trim();
      const phoneConflict = allUsers.find((u) => arePhoneNumbersEqual(u.phone, cleanPhone));
      if (phoneConflict) {
        const roleLabel = getRoleLabel(phoneConflict.role);
        return {
          available: false,
          conflictType: 'phone',
          existingRole: phoneConflict.role,
          existingName: phoneConflict.firstName || phoneConflict.name,
          message: `Ce numéro de téléphone (${cleanPhone}) est déjà associé à un compte (${roleLabel}). Un seul compte par numéro est autorisé sur toute la plateforme LOCAGESTION (tous espaces confondus).`,
        };
      }
    }

    return { available: true };
  },

  setCurrentUser(user: AuthUser): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
      localStorage.setItem('locagestion:active_space', user.role);

      // Synchroniser le profil et la géolocalisation
      saveUserProfile({
        id: user.id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        birthDate: user.birthDate,
        birthPlace: user.birthPlace,
        residenceCountry: user.residenceCountry,
        residenceCity: user.residenceCity,
        residenceDistrict: user.residenceDistrict,
        projectCountry: user.projectCountry,
        avatarUrl: user.avatarUrl,
        companyName: user.companyName,
        ifuNumber: user.ifuNumber,
        registrationDate: user.registeredAt,
      });

      setUserResidenceCountry(user.residenceCountry);
      setUserResidenceCity(user.residenceCity);
      if (user.residenceDistrict) {
        setUserResidenceDistrict(user.residenceDistrict);
      }

      notifyAuthChange(user);
    } catch (e) {
      console.error('Erreur stockage session:', e);
    }
  },

  updateCurrentUser(updates: Partial<AuthUser>): AuthUser | null {
    const user = this.getCurrentUser();
    if (!user) return null;
    const updatedUser: AuthUser = {
      ...user,
      ...updates,
    };
    this.setCurrentUser(updatedUser);

    const list = this.getRegisteredUsers();
    const idx = list.findIndex(
      (u) => u.id === user.id || (u.email && user.email && areEmailsEqual(u.email, user.email))
    );
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates };
      this.saveRegisteredUsers(list);
    }
    return updatedUser;
  },

  updateUser(userId: string, updates: Partial<AuthUser>): { success: boolean; error?: string } {
    if (typeof window === 'undefined') return { success: false, error: 'Environnement non supporté.' };
    
    // Protection Super-Admin système
    if (userId === SYSTEM_ADMIN_USER.id) {
      if (updates.role && updates.role !== 'admin') {
        return { success: false, error: 'Impossible de modifier le rôle du Super-Administrateur système.' };
      }
    }

    const list = this.getRegisteredUsers();
    const idx = list.findIndex((u) => u.id === userId);
    if (idx === -1) {
      return { success: false, error: 'Utilisateur introuvable.' };
    }

    list[idx] = { ...list[idx], ...updates };
    this.saveRegisteredUsers(list);

    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.setCurrentUser({ ...current, ...updates });
    }

    return { success: true };
  },

  deleteUser(userId: string): { success: boolean; error?: string } {
    if (typeof window === 'undefined') return { success: false, error: 'Environnement non supporté.' };
    
    // Protection absolue du compte Super-Admin système
    if (userId === SYSTEM_ADMIN_USER.id) {
      return { success: false, error: 'Impossible de supprimer le compte Super-Administrateur système.' };
    }

    const list = this.getRegisteredUsers();
    const userToDelete = list.find((u) => u.id === userId);
    if (userToDelete && areEmailsEqual(userToDelete.email, SYSTEM_ADMIN_USER.email)) {
      return { success: false, error: 'Action interdite sur le Super-Administrateur.' };
    }

    const filtered = list.filter((u) => u.id !== userId);
    this.saveRegisteredUsers(filtered);

    // Supprimer aussi de la session active si ce n'est pas le Super-Admin
    const current = this.getCurrentUser();
    if (current && current.id === userId) {
      this.logout();
    }

    return { success: true };
  },

  login(
    emailOrPhone: string,
    password?: string
  ): { success: boolean; user?: AuthUser; error?: string } {
    const cleanIdentifier = emailOrPhone.trim();

    // 1. VÉRIFICATION STRICTE & PRIORITAIRE DU SUPER-ADMINISTRATEUR SYSTÈME
    if (
      areEmailsEqual(cleanIdentifier, SYSTEM_ADMIN_USER.email) ||
      arePhoneNumbersEqual(cleanIdentifier, SYSTEM_ADMIN_USER.phone)
    ) {
      if (!password || password.trim() !== SYSTEM_ADMIN_USER.password) {
        return {
          success: false,
          error: "Mot de passe incorrect.",
        };
      }
      const adminSession: AuthUser = {
        ...SYSTEM_ADMIN_USER,
        adminSessionVersion: ADMIN_CURRENT_SESSION_VERSION,
      };
      this.setCurrentUser(adminSession);
      return {
        success: true,
        user: adminSession,
      };
    }

    // 2. RECHERCHE PARMI LES UTILISATEURS ENREGISTRÉS
    const allUsers = this.getAllKnownUsers();

    const found = allUsers.find((u) => {
      // Correspondance par Email
      if (areEmailsEqual(u.email, cleanIdentifier)) {
        return true;
      }
      // Correspondance par Numéro de téléphone universel
      if (arePhoneNumbersEqual(u.phone, cleanIdentifier)) {
        return true;
      }
      return false;
    });

    if (!found) {
      return {
        success: false,
        error: "Aucun compte trouvé avec cet email ou numéro de téléphone.",
      };
    }

    // Validation mot de passe
    if (found.password && password && found.password !== password) {
      return {
        success: false,
        error: "Mot de passe incorrect.",
      };
    }

    const userToSave: AuthUser = {
      ...found,
      ...(found.role === 'admin' || areEmailsEqual(found.email, SYSTEM_ADMIN_USER.email)
        ? { adminSessionVersion: ADMIN_CURRENT_SESSION_VERSION }
        : {}),
    };

    this.setCurrentUser(userToSave);
    return {
      success: true,
      user: userToSave,
    };
  },

  register(data: {
    role: UserSpace;
    firstName: string;
    lastName: string;
    name?: string;
    email: string;
    phone: string;
    birthDate: string;
    birthPlace: string;
    residenceCountry: string;
    residenceCity: string;
    residenceDistrict?: string;
    projectCountry?: string;
    companyName?: string;
    ifuNumber?: string;
    password?: string;
    avatarUrl?: string;
  }): { success: boolean; user?: AuthUser; error?: string } {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanPhone = data.phone.trim();
    const cleanPhoneDigits = cleanPhone.replace(/[^0-9]/g, '');
    const users = this.getRegisteredUsers();

    if (!cleanEmail) {
      return {
        success: false,
        error: 'Une adresse email valide est obligatoire.',
      };
    }

    if (!cleanPhone || cleanPhoneDigits.length < 6) {
      return {
        success: false,
        error: 'Un numéro de téléphone valide est obligatoire.',
      };
    }

    if (!data.birthDate) {
      return {
        success: false,
        error: 'La date de naissance est obligatoire.',
      };
    }

    if (!data.birthPlace || !data.birthPlace.trim()) {
      return {
        success: false,
        error: 'Le lieu de naissance est obligatoire.',
      };
    }

    // VÉRIFICATION D'UNICITÉ GLOBALE STRICTE (EMAIL ET TÉLÉPHONE)
    const availability = this.checkIdentifierAvailability(cleanEmail, cleanPhone);
    if (!availability.available) {
      return {
        success: false,
        error:
          availability.message ||
          'Ce compte ne peut être créé car ces coordonnées sont déjà utilisées sur la plateforme.',
      };
    }

    const defaultAvatar =
      data.role === 'bailleur'
        ? 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=160&auto=format&fit=crop&q=80'
        : data.role === 'demarcheur'
          ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=160&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80';

    const nowFormatted = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const fullName = data.name?.trim() || `${data.firstName.trim()} ${data.lastName.trim()}`;

    const newUser: AuthUser = {
      id: `usr-${data.role}-${Date.now().toString(36)}`,
      name: fullName,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: cleanEmail,
      phone: cleanPhone,
      role: data.role,
      birthDate: data.birthDate.trim(),
      birthPlace: data.birthPlace.trim(),
      residenceCountry: data.residenceCountry || 'Bénin',
      residenceCity: data.residenceCity || 'Cotonou',
      residenceDistrict: data.residenceDistrict?.trim() || 'Haie Vive',
      projectCountry: data.projectCountry || data.residenceCountry || 'Bénin',
      avatarUrl: data.avatarUrl || defaultAvatar,
      companyName: data.companyName?.trim(),
      ifuNumber: data.ifuNumber?.trim(),
      registeredAt: nowFormatted,
      password: data.password || 'demo1234',
    };

    const updatedList = [newUser, ...users];
    this.saveRegisteredUsers(updatedList);
    this.setCurrentUser(newUser);

    return {
      success: true,
      user: newUser,
    };
  },

  logout(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(STORAGE_KEY_SESSION);
      notifyAuthChange(null);
    } catch (e) {
      console.error('Erreur déconnexion:', e);
    }
  },
};
