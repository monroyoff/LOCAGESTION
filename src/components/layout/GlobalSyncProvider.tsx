'use client';

import { useEffect } from 'react';
import { SyncService } from '@/lib/services/sync-service';

export function GlobalSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialisation du moteur de synchronisation temps réel Web <-> Mobile
    SyncService.init();
  }, []);

  return <>{children}</>;
}
