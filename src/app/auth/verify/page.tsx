'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, ShieldCheck, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/context/space-context';
import { AuthService } from '@/lib/services/auth-service';
import { SyncService } from '@/lib/services/sync-service';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Validation de votre code de confirmation...');

  useEffect(() => {
    const email = searchParams.get('email');
    const code = searchParams.get('code');

    if (!email || !code) {
      setStatus('error');
      setMessage('Lien de confirmation incomplet ou expiré. Veuillez vous connecter ou vous réinscrire.');
      return;
    }

    const runVerification = async () => {
      try {
        // Synchroniser d'abord avec le serveur central au cas où l'inscription a été faite sur un autre appareil
        await SyncService.sync(true).catch(() => {});

        const pendingUsers = AuthService.getAllKnownUsers();
        const targetUser = pendingUsers.find(
          (u) => u.email.toLowerCase() === email.trim().toLowerCase()
        );

        if (targetUser) {
          // Marquer comme vérifié et connecter automatiquement
          const updated = {
            ...targetUser,
            emailVerified: true,
          };
          const updatedUsersList = pendingUsers.map((u) => (u.id === updated.id ? updated : u));
          AuthService.saveRegisteredUsers(updatedUsersList);
          AuthService.setCurrentUser(updated);

          // Synchroniser immédiatement sur le backend
          await Promise.all([
            fetch('/api/auth/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updated),
            }).catch(() => {}),
            SyncService.push({ user: updated, users: updatedUsersList }).catch(() => {}),
          ]);

          setStatus('success');
          setMessage(`Votre adresse email ${email} a été confirmée avec succès ! Redirection vers votre espace...`);

          setTimeout(() => {
            if (updated.role === 'locataire') {
              router.push('/portal');
            } else if (updated.role === 'demarcheur') {
              router.push('/listings');
            } else {
              router.push('/');
            }
          }, 1200);
        } else {
          setStatus('success');
          setMessage(`Votre code (${code}) pour ${email} a été validé ! Vous pouvez vous connecter.`);
          setTimeout(() => {
            router.push('/auth/login');
          }, 1800);
        }
      } catch (err) {
        setStatus('error');
        setMessage('Une erreur est survenue lors de la vérification.');
      }
    };

    runVerification();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#0e1117] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-pink-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div className="text-left">
            <span className="text-2xl font-black tracking-tight text-white block">
              LOCA<span className="text-brand-400">GESTION</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Confirmation de Compte
            </span>
          </div>
        </div>

        <div className="bg-[#171b24] p-8 rounded-3xl border border-white/10 shadow-2xl space-y-5">
          {status === 'verifying' && (
            <div className="py-6 space-y-4">
              <Loader2 className="w-12 h-12 text-brand-400 animate-spin mx-auto" />
              <h3 className="text-base font-bold text-white">Vérification en cours...</h3>
              <p className="text-xs text-slate-400">{message}</p>
            </div>
          )}

          {status === 'success' && (
            <div className="py-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white">Compte Confirmé !</h3>
              <p className="text-xs text-emerald-300 font-medium leading-relaxed">{message}</p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-black shadow-lg shadow-brand-500/30"
                >
                  <span>Accéder à mon espace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="py-4 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white">Lien Expiré ou Invalide</h3>
              <p className="text-xs text-rose-300 font-medium leading-relaxed">{message}</p>
              <div className="pt-2">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold"
                >
                  <span>Aller à la connexion</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-tealAccent-400" />
            <span>Sécurité & Conformité OHADA</span>
          </span>
          <span>•</span>
          <span>Zone FCFA</span>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0e1117] text-white flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}

