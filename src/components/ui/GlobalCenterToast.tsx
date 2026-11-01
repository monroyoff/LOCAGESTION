'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  CheckCircle2,
  Check,
  Ban,
  Trash2,
  X,
  Globe,
  Building,
  FileCheck2,
} from 'lucide-react';
import { ActionToastPayload } from '@/lib/notifications/action-notifier';

export function GlobalCenterToast() {
  const [toast, setToast] = useState<ActionToastPayload | null>(null);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let interval: NodeJS.Timeout;

    const handleActionToast = (event: Event) => {
      const customEvent = event as CustomEvent<ActionToastPayload>;
      if (!customEvent.detail) return;

      const duration = customEvent.detail.duration || 3200;
      setToast(customEvent.detail);
      setProgress(100);

      // Gestion de la barre de décompte
      const startTime = Date.now();
      clearInterval(interval);
      interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remainingRatio = Math.max(0, 1 - elapsed / duration);
        setProgress(remainingRatio * 100);
      }, 30);

      clearTimeout(timer);
      timer = setTimeout(() => {
        setToast(null);
        clearInterval(interval);
      }, duration);
    };

    window.addEventListener('locagestion:center_toast', handleActionToast);

    return () => {
      window.removeEventListener('locagestion:center_toast', handleActionToast);
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Fermeture par la touche Échap
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && toast) {
        setToast(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toast]);

  if (!toast) return null;

  const type = toast.type || 'success';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={() => setToast(null)}
    >
      <div
        className="relative max-w-sm sm:max-w-md w-full bg-slate-900/95 text-white backdrop-blur-xl border border-slate-700/80 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] rounded-3xl p-6 flex flex-col items-center text-center space-y-3.5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton Fermer */}
        <button
          type="button"
          onClick={() => setToast(null)}
          className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          title="Fermer"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Grand Badge Icône Expressif */}
        {type === 'publish' ? (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-500 via-pink-500 to-rose-500 text-white flex items-center justify-center shadow-pink-glow ring-4 ring-brand-500/20">
            <Sparkles className="w-7 h-7 animate-pulse" />
          </div>
        ) : type === 'update' ? (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-lg ring-4 ring-sky-500/20">
            <Check className="w-7 h-7 stroke-[3]" />
          </div>
        ) : type === 'delete' ? (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-red-600 text-white flex items-center justify-center shadow-lg ring-4 ring-rose-500/20">
            <Trash2 className="w-7 h-7" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-lg ring-4 ring-emerald-500/20">
            <CheckCircle2 className="w-7 h-7" />
          </div>
        )}

        {/* Titre & Message */}
        <div className="space-y-1.5 px-2">
          <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
            {toast.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {toast.message}
          </p>
        </div>

        {/* Barre de progression / Décompte visuel */}
        <div className="w-full bg-slate-800/80 h-1.5 rounded-full overflow-hidden mt-1">
          <div
            className={`h-full transition-all duration-75 ease-linear ${
              type === 'publish'
                ? 'bg-gradient-to-r from-brand-500 to-pink-400'
                : type === 'delete'
                ? 'bg-gradient-to-r from-rose-500 to-red-400'
                : type === 'update'
                ? 'bg-gradient-to-r from-sky-400 to-blue-500'
                : 'bg-gradient-to-r from-emerald-400 to-teal-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

