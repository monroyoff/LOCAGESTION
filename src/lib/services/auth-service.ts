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

export const DEMO_LANDLORD: AuthUser = {
  id: 'usr-bailleur-01',
  name: 'Mamadou Diallo',
  email: 'contact@diallo-patrimoine.bj',
  phone: '+229 01 95 44 44 30',
  role: 'bailleur',
  residenceCountry: 'Bénin',
  residenceCity: 'Cotonou',
  residenceDistrict: 'Haie Vive',
  avatarUrl:
    'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=160&auto=format&fit=crop&q=80',
  companyName: 'Cabinet Diallo Patrimoine SARL',
  ifuNumber: '0202110485960',
  registeredAt: '15/01/2025',
  password: 'demo',
};

export const DEMO_TENANT: AuthUser = {
  id: 'usr-locataire-01',
  name: 'Koffi Mensah',
  email: 'koffi.mensah@fintech-africa.com',
  phone: '+229 97 12 34 56',
  role: 'locataire',
  residenceCountry: 'Bénin',
  residenceCity: 'Cotonou',
  residenceDistrict: 'Haie Vive',
  avatarUrl:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80',
  registeredAt: '01/11/2025',
  password: 'demo',
};

const SEED_USERS: AuthUser[] = [DEMO_LANDLORD, DEMO_TENANT];

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
    if (typeof window === 'undefined') return SEED_USERS;
    try {
      const stored = localStorage.getItem(STORAGE_KEY_USERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(SEED_USERS));
    } catch (e) {
      console.error('Erreur lecture utilisateurs:', e);
    }
    return SEED_USERS;
  },

  saveRegisteredUsers(users: AuthUser[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Erreur sauvegarde utilisateurs:', e);
    }
  },

  getCurrentUser(): AuthUser | null {
    if (typeof window === 'undefined') return DEMO_LANDLORD;
    try {
      const session = localStorage.getItem(STORAGE_KEY_SESSION);
      if (session) {
        const parsed = JSON.parse(session);
        // Correction automatique si l'ancien avatar erroné est resté dans le cache local
        if (
          parsed &&
          (parsed.role === 'bailleur' || parsed.name === 'Mamadou Diallo') &&
          parsed.avatarUrl?.includes('photo-1534528741775-53994a69daeb')
        ) {
          parsed.avatarUrl =
            'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=160&auto=format&fit=crop&q=80';
          localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(parsed));
        }
        return parsed;
      }

      // Si aucune session explicite, initialiser selon l'espace actif existant
      const savedSpace = localStorage.getItem('locagestion:active_space');
      const initialUser = savedSpace === 'locataire' ? DEMO_TENANT : DEMO_LANDLORD;
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(initialUser));
      return initialUser;
    } catch (e) {
      console.error('Erreur lecture session:', e);
      return DEMO_LANDLORD;
    }
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
        email: user.email,
        phone: user.phone,
        role: user.role,
        residenceCountry: user.residenceCountry,
        residenceCity: user.residenceCity,
        residenceDistrict: user.residenceDistrict,
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

  login(
    emailOrPhone: string,
    password?: string
  ): { success: boolean; user?: AuthUser; error?: string } {
    const cleanIdentifier = emailOrPhone.trim().toLowerCase();
    const users = this.getRegisteredUsers();

    const found = users.find(
      (u) =>
        u.email.toLowerCase() === cleanIdentifier ||
        u.phone.replace(/[^0-9]/g, '') === cleanIdentifier.replace(/[^0-9]/g, '')
    );

    if (!found) {
      return {
        success: false,
        error: "Aucun compte trouvé avec cet email ou numéro de téléphone.",
      };
    }

    // Validation mot de passe (si configuré)
    if (found.password && password && found.password !== password && password !== 'demo1234' && password !== 'demo') {
      return {
        success: false,
        error: "Mot de passe incorrect. (Pour les comptes démo, utilisez 'demo1234')",
      };
    }

    this.setCurrentUser(found);
    return {
      success: true,
      user: found,
    };
  },

  register(data: {
    name: string;
    email: string;
    phone: string;
    role: UserSpace;
    residenceCountry: string;
    residenceCity: string;
    residenceDistrict?: string;
    companyName?: string;
    ifuNumber?: string;
    password?: string;
    avatarUrl?: string;
  }): { success: boolean; user?: AuthUser; error?: string } {
    const cleanEmail = data.email.trim().toLowerCase();
    const users = this.getRegisteredUsers();

    if (users.some((u) => u.email.toLowerCase() === cleanEmail)) {
      return {
        success: false,
        error: 'Cette adresse email est déjà enregistrée. Veuillez vous connecter.',
      };
    }

    const defaultAvatar =
      data.role === 'bailleur'
        ? 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=160&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80';

    const nowFormatted = new Date().toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const newUser: AuthUser = {
      id: `usr-${data.role}-${Date.now().toString(36)}`,
      name: data.name.trim(),
      email: cleanEmail,
      phone: data.phone.trim(),
      role: data.role,
      residenceCountry: data.residenceCountry || 'Bénin',
      residenceCity: data.residenceCity || 'Cotonou',
      residenceDistrict: data.residenceDistrict?.trim() || 'Haie Vive',
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

  quickLogin(role: UserSpace): AuthUser {
    const target = role === 'bailleur' ? DEMO_LANDLORD : DEMO_TENANT;
    this.setCurrentUser(target);
    return target;
  },
};
