'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { UserSpace } from '../types';

interface SpaceContextType {
  activeSpace: UserSpace;
  isLandlord: boolean;
  isTenant: boolean;
  switchSpace: (targetSpace: UserSpace) => void;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Initial space detection based on current URL path
  const [activeSpace, setActiveSpace] = useState<UserSpace>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/portal')) {
        return 'locataire';
      }
      const saved = localStorage.getItem('locagestion:active_space');
      if (saved === 'locataire' || saved === 'bailleur') {
        return saved;
      }
    }
    return 'bailleur';
  });

  // Sync space when route changes
  useEffect(() => {
    if (pathname.startsWith('/portal')) {
      setActiveSpace('locataire');
      try {
        localStorage.setItem('locagestion:active_space', 'locataire');
      } catch (e) {}
    } else if (
      pathname === '/' ||
      pathname.startsWith('/tenants') ||
      pathname.startsWith('/properties') ||
      pathname.startsWith('/leases') ||
      pathname.startsWith('/payments') ||
      pathname.startsWith('/reminders')
    ) {
      setActiveSpace('bailleur');
      try {
        localStorage.setItem('locagestion:active_space', 'bailleur');
      } catch (e) {}
    }
  }, [pathname]);

  const switchSpace = (targetSpace: UserSpace) => {
    setActiveSpace(targetSpace);
    try {
      localStorage.setItem('locagestion:active_space', targetSpace);
    } catch (e) {}

    if (targetSpace === 'locataire') {
      router.push('/portal');
    } else {
      router.push('/');
    }
  };

  const isLandlord = activeSpace === 'bailleur';
  const isTenant = activeSpace === 'locataire';

  return (
    <SpaceContext.Provider
      value={{
        activeSpace,
        isLandlord,
        isTenant,
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
