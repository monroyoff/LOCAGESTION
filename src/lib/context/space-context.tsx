'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { UserSpace, AuthUser } from '../types';
import { AuthService } from '../services/auth-service';
import { notifyAction } from '../notifications/action-notifier';

export interface SpaceContextType {
  activeSpace: UserSpace;
  isLandlord: boolean;
  isTenant: boolean;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (
    emailOrPhone: string,
    password?: string
  ) => { success: boolean; user?: AuthUser; error?: string };
  register: (
    data: Parameters<typeof AuthService.register>[0]
  ) => { success: boolean; user?: AuthUser; error?: string };
  logout: () => void;
  quickLogin: (role: UserSpace) => void;
  switchSpace: (targetSpace: UserSpace) => void;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

// Routes strictement réservées aux Bailleurs & Gestionnaires
const LANDLORD_ONLY_PREFIXES = [
  '/properties',
  '/leases',
  '/tenants',
  '/payments',
  '/reminders',
];

// Routes publiques exemptées de redirection forcée
const PUBLIC_PREFIXES = ['/auth', '/verify'];

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(() => AuthService.getCurrentUser());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const syncUser = () => {
      setUser(AuthService.getCurrentUser());
    };
    window.addEventListener('locagestion:auth_changed', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('locagestion:auth_changed', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, []);

  const activeSpace: UserSpace = user ? user.role : 'bailleur';
  const isLandlord = activeSpace === 'bailleur';
  const isTenant = activeSpace === 'locataire';
  const isAuthenticated = !!user;

  // SÉPARATION STRICTE DES ESPACES & ROUTE GUARDING
  useEffect(() => {
    if (!mounted) return;

    // 1. Pages publiques exemptées
    const isPublic = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    if (isPublic) return;

    // 2. Utilisateur non connecté -> redirection vers la page de connexion
    if (!user) {
      router.replace('/auth/login');
      return;
    }

    // 3. Utilisateur Locataire tentant d'accéder à l'espace Bailleur
    if (user.role === 'locataire') {
      const isLandlordRoute =
        pathname === '/' ||
        LANDLORD_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix));

      if (isLandlordRoute) {
        router.replace('/portal');
        notifyAction(
          'Accès réservé aux Bailleurs & Gestionnaires. Vous avez été redirigé vers votre Portail Locataire.',
          'Espace Locataire Résident',
          'info'
        );
      }
    }

    // 4. Utilisateur Bailleur tentant d'accéder au portail Locataire
    if (user.role === 'bailleur') {
      const isTenantRoute = pathname === '/portal' || pathname.startsWith('/portal');

      if (isTenantRoute) {
        router.replace('/');
        notifyAction(
          'Cet espace est le portail privé des locataires. Vous êtes connecté en tant que Bailleur (Gestion de patrimoine).',
          'Espace Bailleur Certifié',
          'info'
        );
      }
    }
  }, [pathname, user, mounted, router]);

  const login = (emailOrPhone: string, password?: string) => {
    const res = AuthService.login(emailOrPhone, password);
    if (res.success && res.user) {
      setUser(res.user);
      if (res.user.role === 'locataire') {
        router.push('/portal');
      } else {
        router.push('/');
      }
    }
    return res;
  };

  const register = (data: Parameters<typeof AuthService.register>[0]) => {
    const res = AuthService.register(data);
    if (res.success && res.user) {
      setUser(res.user);
      if (res.user.role === 'locataire') {
        router.push('/portal');
      } else {
        router.push('/');
      }
    }
    return res;
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    router.push('/auth/login');
    notifyAction(
      'Vous avez été déconnecté avec succès de votre session LOCAGESTION.',
      'Déconnexion réussie',
      'info'
    );
  };

  const quickLogin = (role: UserSpace) => {
    const targetUser = AuthService.quickLogin(role);
    setUser(targetUser);
    if (role === 'locataire') {
      router.push('/portal');
    } else {
      router.push('/');
    }
    notifyAction(
      `Connecté en tant que ${targetUser.name} (${role === 'bailleur' ? 'Bailleur Certifié' : 'Locataire Résident'})`,
      'Connexion réussie',
      'success'
    );
  };

  const switchSpace = (targetSpace: UserSpace) => {
    // Si l'utilisateur est déjà dans le bon rôle, rediriger simplement
    if (user && user.role === targetSpace) {
      if (targetSpace === 'locataire') {
        router.push('/portal');
      } else {
        router.push('/');
      }
      return;
    }

    // Si l'utilisateur souhaite changer d'espace, il doit changer de compte
    quickLogin(targetSpace);
  };

  return (
    <SpaceContext.Provider
      value={{
        activeSpace,
        isLandlord,
        isTenant,
        user,
        isAuthenticated,
        login,
        register,
        logout,
        quickLogin,
        switchSpace,
      }}
    >
      {children}
    </SpaceContext.Provider>
  );
}

export function useSpace() {
  const context = useContext(SpaceContext);
  if (!context) {
    throw new Error('useSpace must be used within a SpaceProvider');
  }
  return context;
}

export function useAuth() {
  return useSpace();
}
