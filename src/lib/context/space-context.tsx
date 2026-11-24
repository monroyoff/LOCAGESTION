'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { UserSpace, AuthUser, LandlordSubRole } from '../types';
import { AuthService, SYSTEM_ADMIN_USER, areEmailsEqual } from '../services/auth-service';
import { notifyAction } from '../notifications/action-notifier';
import { ShieldCheck } from 'lucide-react';

export interface SpaceContextType {
  activeSpace: UserSpace;
  isLandlord: boolean;
  isTenant: boolean;
  isDemarcheur: boolean;
  isAdmin: boolean;
  landlordSubRole: LandlordSubRole;
  setLandlordSubRole: (role: LandlordSubRole) => void;
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (
    emailOrPhone: string,
    password?: string
  ) => { success: boolean; user?: AuthUser; error?: string };
  register: (
    data: Parameters<typeof AuthService.register>[0],
    options?: { autoLogin?: boolean; emailVerified?: boolean }
  ) => { success: boolean; user?: AuthUser; error?: string };
  logout: () => void;
  switchSpace: (targetSpace: UserSpace) => void;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

// Routes strictement réservées au Bailleur (inaccessibles au Démarcheur et au Locataire)
const LANDLORD_ONLY_PREFIXES = [
  '/dashboard',
  '/properties',
  '/leases',
  '/tenants',
  '/payments',
  '/reminders',
  '/incidents',
];

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [mounted, setMounted] = useState(false);

  // Routes publiques strictement accessibles sans authentification (Vitrine Landing Page, Google Play, légal, vérifications)
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/accueil' ||
    pathname?.startsWith('/accueil') ||
    pathname?.startsWith('/auth') ||
    pathname?.startsWith('/verify') ||
    pathname === '/privacy' ||
    pathname?.startsWith('/privacy') ||
    pathname === '/terms' ||
    pathname?.startsWith('/terms') ||
    pathname === '/delete-account' ||
    pathname?.startsWith('/delete-account') ||
    pathname?.startsWith('/.well-known');

  useEffect(() => {
    setMounted(true);
    const current = AuthService.getCurrentUser();
    setUser((prev) => {
      if (JSON.stringify(prev) === JSON.stringify(current)) return prev;
      return current;
    });

    // 1. Redirection stricte vers /auth/login si l'utilisateur n'est pas connecté
    if (!current) {
      if (!isPublicRoute) {
        router.replace('/auth/login');
      }
      return;
    }

    // 1.bis Si le compte est en attente de confirmation par email
    if (current.emailVerified === false) {
      if (!pathname?.startsWith('/auth')) {
        AuthService.logout();
        setUser(null);
        router.replace('/auth/login');
        return;
      }
    }

    // 2. Si déjà connecté et sur une page d'authentification (/auth/login ou /auth/register)
    if (pathname?.startsWith('/auth')) {
      if (pathname.startsWith('/auth/verify')) {
        return;
      }
      if (current.emailVerified === false) {
        return;
      }
      if (current.role === 'admin') {
        router.replace('/admin');
      } else if (current.role === 'locataire') {
        router.replace('/portal');
      } else if (current.role === 'demarcheur') {
        router.replace('/listings');
      } else {
        router.replace('/dashboard');
      }
      return;
    }

    // 2.bis Protection stricte de l'Espace Super-Admin (Isolation Étanche)
    if (pathname?.startsWith('/admin')) {
      if (current.role !== 'admin' || !areEmailsEqual(current.email, SYSTEM_ADMIN_USER.email)) {
        router.replace('/dashboard');
        return;
      }
    }

    // 3. Contrôle d'accès strict selon le rôle (3 espaces étanches / RLS Applicatif)
    if (pathname.startsWith('/portal')) {
      if (current.role !== 'locataire') {
        router.replace(current.role === 'demarcheur' ? '/listings' : '/dashboard');
        return;
      }
    } else if (
      LANDLORD_ONLY_PREFIXES.some((prefix) => pathname.startsWith(prefix))
    ) {
      if (current.role === 'demarcheur') {
        router.replace('/listings');
        return;
      }
      if (current.role === 'locataire') {
        router.replace('/portal');
        return;
      }
    }

    const syncUser = () => {
      const updated = AuthService.getCurrentUser();
      setUser((prev) => {
        if (JSON.stringify(prev) === JSON.stringify(updated)) return prev;
        return updated;
      });
      if (!updated && !isPublicRoute) {
        router.replace('/auth/login');
      }
    };

    window.addEventListener('locagestion:auth_changed', syncUser);
    window.addEventListener('storage', syncUser);
    return () => {
      window.removeEventListener('locagestion:auth_changed', syncUser);
      window.removeEventListener('storage', syncUser);
    };
  }, [pathname, isPublicRoute, router]);

  const activeSpace: UserSpace = user ? user.role : 'bailleur';
  const isLandlord = activeSpace === 'bailleur';
  const isTenant = activeSpace === 'locataire';
  const isDemarcheur = activeSpace === 'demarcheur';
  const isAdmin = user?.role === 'admin' || activeSpace === 'admin';
  const landlordSubRole: LandlordSubRole = isDemarcheur ? 'demarcheur' : 'bailleur';
  const isAuthenticated = !!user;

  const setLandlordSubRole = (role: LandlordSubRole) => {
    switchSpace(role);
  };

  const login = (emailOrPhone: string, password?: string) => {
    const res = AuthService.login(emailOrPhone, password);
    if (res.success && res.user) {
      setUser(res.user);
      if (res.user.role === 'admin') {
        router.push('/admin');
      } else if (res.user.role === 'locataire') {
        router.push('/portal');
      } else if (res.user.role === 'demarcheur') {
        router.push('/listings');
      } else {
        router.push('/');
      }
    }
    return res;
  };

  const register = (
    data: Parameters<typeof AuthService.register>[0],
    options?: { autoLogin?: boolean; emailVerified?: boolean }
  ) => {
    const res = AuthService.register(data, options);
    if (res.success && res.user) {
      if (options?.autoLogin !== false) {
        setUser(res.user);
        if (res.user.matricule) {
          notifyAction(
            `Compte créé avec succès ! Votre matricule officiel unique est : ${res.user.matricule}`,
            'Matricule Officiel Attribué',
            'success'
          );
        }
        if (res.user.role === 'admin') {
          router.push('/admin');
        } else if (res.user.role === 'locataire') {
          router.push('/portal');
        } else if (res.user.role === 'demarcheur') {
          router.push('/listings');
        } else {
          router.push('/');
        }
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

  // Bascule entre les espaces pour le compte connecté
  const switchSpace = (targetSpace: UserSpace) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    // RLS Applicatif : Seul le compte vérifié Super-Admin a le droit d'accéder au rôle 'admin'
    if (targetSpace === 'admin' && !areEmailsEqual(user.email, SYSTEM_ADMIN_USER.email)) {
      console.warn("Tentative d'accès non autorisé à l'espace Super-Admin bloquée.");
      return;
    }
    const updatedUser = { ...user, role: targetSpace };
    AuthService.setCurrentUser(updatedUser);
    setUser(updatedUser);
    if (targetSpace === 'admin') {
      router.push('/admin');
    } else if (targetSpace === 'locataire') {
      router.push('/portal');
    } else if (targetSpace === 'demarcheur') {
      router.push('/listings');
    } else {
      router.push('/');
    }
  };

  // Si l'utilisateur n'est pas authentifié et accède à une page protégée
  if (mounted && !user && !isPublicRoute) {
    return (
      <div className="min-h-screen bg-[#0e1117] text-white flex flex-col items-center justify-center p-4 selection:bg-brand-500 selection:text-white">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-pink-500 flex items-center justify-center shadow-lg shadow-brand-500/30 animate-pulse mb-4 text-white font-black text-xl">
          <ShieldCheck className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-bold text-slate-200">Authentification requise</p>
        <p className="text-xs text-slate-400 mt-1">Redirection sécurisée vers la page de connexion...</p>
      </div>
    );
  }

  return (
    <SpaceContext.Provider
      value={{
        activeSpace,
        isLandlord,
        isTenant,
        isDemarcheur,
        isAdmin,
        landlordSubRole,
        setLandlordSubRole,
        user,
        isAuthenticated,
        login,
        register,
        logout,
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
