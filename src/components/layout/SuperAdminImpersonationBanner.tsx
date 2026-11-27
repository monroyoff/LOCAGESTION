'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, ArrowLeft, UserCheck, Sparkles, ExternalLink } from 'lucide-react';
import { AuthService } from '@/lib/services/auth-service';
import { AuthUser } from '@/lib/types';

export function SuperAdminImpersonationBanner() {
  const router = useRouter();
  const [impersonating, setImpersonating] = useState(false);
  const [details, setDetails] = useState<{ originalAdmin: AuthUser; impersonatedUser: AuthUser } | null>(null);

  const checkImpersonation = () => {
    const isImp = AuthService.isImpersonating();
    setImpersonating(isImp);
    if (isImp) {
      setDetails(AuthService.getImpersonationDetails());
    } else {
      setDetails(null);
    }
  };

  useEffect(() => {
    checkImpersonation();
    const handleChanged = () => checkImpersonation();
    window.addEventListener('locagestion:impersonation_changed', handleChanged);
    window.addEventListener('storage', handleChanged);
    return () => {
      window.removeEventListener('locagestion:impersonation_changed', handleChanged);
      window.removeEventListener('storage', handleChanged);
    };
  }, []);

  if (!impersonating || !details) return null;

  const target = details.impersonatedUser;

  const handleExit = () => {
    AuthService.restoreAdminSession();
    router.push('/admin');
  };

  return (
    <div className="sticky top-0 z-[9999] w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 shadow-xl flex items-center justify-between gap-3 text-xs flex-wrap border-b border-amber-500/50">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-black/30 flex items-center justify-center shrink-0 shadow-inner">
          <Shield className="w-3.5 h-3.5 text-amber-200" />
        </div>
        <div>
          <span className="font-black uppercase tracking-wider text-[10px] bg-black/40 px-2 py-0.5 rounded-md mr-2 shadow-xs border border-white/10">
            👑 Mode Inspection Super-Admin
          </span>
          <span className="font-bold">
            Vous consultez l&apos;espace de{' '}
            <strong className="underline underline-offset-2">{target.name}</strong>{' '}
            <span className="opacity-90 font-mono">
              ({target.matricule || 'Sans matricule'} • {target.role})
            </span>
          </span>
        </div>
      </div>

      <button
        type="button"
        onClick={handleExit}
        className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-amber-200 font-black text-xs shadow-md border border-amber-500/40 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Quitter &amp; Revenir à la Console Super-Admin</span>
      </button>
    </div>
  );
}
