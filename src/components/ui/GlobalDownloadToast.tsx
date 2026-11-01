'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Download, X, FileText, Sparkles } from 'lucide-react';
import { DownloadEventDetail } from '@/lib/export/download-notifier';

export function GlobalDownloadToast() {
  const [downloadInfo, setDownloadInfo] = useState<DownloadEventDetail | null>(null);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const handleDownload = (e: Event) => {
      const customEvent = e as CustomEvent<DownloadEventDetail>;
      if (customEvent.detail) {
        setDownloadInfo(customEvent.detail);
        setProgress(100);
      }
    };

    window.addEventListener('locagestion:download_complete', handleDownload);
    return () => {
      window.removeEventListener('locagestion:download_complete', handleDownload);
    };
  }, []);

  // Timer de disparition automatique (4,5 secondes) avec barre de progression fluide
  useEffect(() => {
    if (!downloadInfo) return;

    const DURATION = 4500;
    const INTERVAL = 50;
    const decrement = (INTERVAL / DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= decrement) {
          clearInterval(timer);
          setDownloadInfo(null);
          return 0;
        }
        return prev - decrement;
      });
    }, INTERVAL);

    return () => clearInterval(timer);
  }, [downloadInfo]);

  if (!downloadInfo) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-5 right-4 sm:right-6 z-[9999] max-w-sm sm:max-w-md w-[calc(100vw-2rem)] pointer-events-auto animate-in slide-in-from-top-4 fade-in duration-300 shadow-2xl"
    >
      <div className="p-4 sm:p-4.5 bg-slate-900/95 backdrop-blur-md text-white rounded-3xl border border-emerald-500/40 shadow-2xl shadow-emerald-950/40 flex items-start gap-3.5 relative overflow-hidden">
        {/* Glow & Badge Icône */}
        <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-sm mt-0.5 relative">
          <CheckCircle2 className="w-6 h-6 text-emerald-400 animate-in zoom-in-75 duration-200" />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 animate-ping opacity-75" />
        </div>

        {/* Contenu du message */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Téléchargement réussi
            </span>
            <span className="text-slate-400 text-[10px]">•</span>
            <span className="text-slate-300 text-[10px] font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              Prêt
            </span>
          </div>

          <h4 className="text-xs sm:text-sm font-black text-white tracking-tight">
            Votre document a bien été téléchargé !
          </h4>

          {/* Nom du fichier */}
          <div className="mt-1.5 flex items-center gap-2 text-xs font-mono font-bold text-slate-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 truncate">
            <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{downloadInfo.filename}</span>
          </div>

          <p className="text-[11px] text-slate-400 mt-1.5 leading-snug">
            Le fichier est enregistré dans votre dossier <strong>Téléchargements</strong>.
          </p>
        </div>

        {/* Bouton de fermeture instantanée */}
        <button
          type="button"
          onClick={() => setDownloadInfo(null)}
          className="absolute top-3 right-3 p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Fermer la notification"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Barre de décompte animée */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-tealAccent-400 transition-all ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
