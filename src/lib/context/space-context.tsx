'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { UserSpace, AuthUser } from '../types';
import { AuthService, DEMO_LANDLORD, DEMO_TENANT } from '../services/auth-service';
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

// Routes réservées au Bailleur
const LANDLORD_ONLY_PREFIXES = [
  '/properties',
  '/leases',
  '/tenants',
  '/payments',
  '/reminders',
];

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Initialisation déterministe par route pour garantir une concordance 100% stricte SSR / Client
  const isPortalRoute = pathname ? pathname.startsWith('/portal') : false;
  const [user, setUser] = useState<AuthUser | null>(() => (isPortalRoute ? DEMO_TENANT : DEMO_LANDLORD));
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Synchroniser avec la session réelle après le montage client
    const current = AuthService.getCurrentUser();
    if (pathname.startsWith('/portal')) {
      if (!current || current.role !== 'locataire') {
        const tenantUser = AuthService.quickLogin('locataire');
        setUser(tenantUser);
      } else {
        setUser(current);
      }
    } else if (
      pathname === '/' ||
      LANDLORD_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    ) {
      if (!current || current.role !== 'bailleur') {
        const landlordUser = AuthService.quickLogin('bailleur');
        setUser(landlordUser);
      } else {
        setUser(current);
      }
    } else if (current) {
      setUser(current);
    }

    const syncUser = () => {
      setUser(AuthService.getCurrentUser());
    };
    window.addEventListener('locagestion:auth_changed', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('locagestion:auth_changed', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, [pathname]);

  const activeSpace: UserSpace = user ? user.role : 'bailleur';
  const isLandlord = activeSpace === 'bailleur';
  const isTenant = activeSpace === 'locataire';
  const isAuthenticated = !!user;

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
  };

  // Bascule instantanée entre Bailleur et Locataire sans obligation de se déconnecter
  const switchSpace = (targetSpace: UserSpace) => {
    const targetUser = AuthService.quickLogin(targetSpace);
    setUser(targetUser);
    if (targetSpace === 'locataire') {
      router.push('/portal');
    } else {
      router.push('/');
    }
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
