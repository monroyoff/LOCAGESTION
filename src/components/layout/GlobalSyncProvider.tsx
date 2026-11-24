'use client';

import { useEffect } from 'react';
import { SyncService } from '@/lib/services/sync-service';

export function GlobalSyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 1. Initialisation du moteur de synchronisation temps réel des données Web <-> Mobile <-> Android
    SyncService.init();

    // 2. Détection automatique et transparente des nouvelles versions déployées (TWA Android & Mobile)
    const checkVersion = async () => {
      try {
        const res = await fetch('/api/version', {
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          const savedVersion = localStorage.getItem('locagestion_app_version');
          if (savedVersion && data.version && savedVersion !== data.version) {
            localStorage.setItem('locagestion_app_version', data.version);
            // Rafraîchissement automatique de la WebView Android
            window.location.reload();
          } else if (data.version) {
            localStorage.setItem('locagestion_app_version', data.version);
          }
        }
      } catch (e) {}
    };

    checkVersion();
    const interval = setInterval(checkVersion, 45000);
    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
}
