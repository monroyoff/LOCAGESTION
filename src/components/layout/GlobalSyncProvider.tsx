'use client';

import { useEffect, useRef } from 'react';
import { SyncService } from '@/lib/services/sync-service';

export function GlobalSyncProvider({ children }: { children: React.ReactNode }) {
  const initialVersionRef = useRef<string | null>(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    // 1. Initialisation du moteur de synchronisation temps réel des données Web <-> Mobile
    SyncService.init();

    // 2. Détection automatique et transparente des nouvelles versions du code (PWA & Mobile)
    const checkAppVersion = async () => {
      if (typeof window === 'undefined' || isCheckingRef.current) return;
      isCheckingRef.current = true;
      try {
        const res = await fetch('/api/version', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.version) {
            const storedVersion = localStorage.getItem('locagestion:client_build_version');
            if (!initialVersionRef.current) {
              initialVersionRef.current = data.version;
              if (storedVersion && storedVersion !== data.version) {
                localStorage.setItem('locagestion:client_build_version', data.version);
                window.location.reload();
                return;
              }
              localStorage.setItem('locagestion:client_build_version', data.version);
            } else if (initialVersionRef.current !== data.version) {
              initialVersionRef.current = data.version;
              localStorage.setItem('locagestion:client_build_version', data.version);
              window.location.reload();
            }
          }
        }
      } catch (e) {
        // En cas de perte temporaire de connexion, ignorer
      } finally {
        isCheckingRef.current = false;
      }
    };

    // Vérification initiale
    checkAppVersion();

    // Vérification automatique immédiate dès que l'utilisateur rouvre l'application sur smartphone
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkAppVersion();
      }
    };

    const handleFocus = () => {
      checkAppVersion();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', checkAppVersion);

    // Polling toutes les 15 secondes pour détecter un nouveau déploiement en tâche de fond
    const intervalId = setInterval(checkAppVersion, 15000);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', checkAppVersion);
      clearInterval(intervalId);
    };
  }, []);

  return <>{children}</>;
}
