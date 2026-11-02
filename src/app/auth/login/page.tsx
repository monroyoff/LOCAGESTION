'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Users,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Phone,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '@/lib/context/space-context';
import { DEMO_LANDLORD, DEMO_TENANT } from '@/lib/services/auth-service';

export default function LoginPage() {
  const router = useRouter();
  const { login, quickLogin } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!identifier.trim()) {
      setErrorMsg('Veuillez renseigner votre email ou numéro de téléphone.');
      return;
    }

    setIsLoading(true);
    try {
      const res = login(identifier.trim(), password);
      if (!res.success) {
        setErrorMsg(res.error || 'Identifiants invalides.');
      }
    } catch (err) {
      setErrorMsg('Une erreur inattendue est survenue.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role: 'bailleur' | 'locataire') => {
    quickLogin(role);
  };

  return (
    <div className="min-h-screen bg-[#0e1117] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden selection:bg-brand-500 selection:text-white">
      {/* Background Decorative Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-brand-500 to-pink-500 flex items-center justify-center shadow-lg shadow-brand-500/30">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-white"
            >
              <path
                d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V14H9V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
                fill="currentColor"
              />
              <path
                d="M12 7.5L6 12.5V19H8V12H16V19H18V12.5L12 7.5Z"
                fill="rgba(255,255,255,0.4)"
              />
            </svg>
          </div>
          <div className="text-left">
            <span className="text-2xl font-black tracking-tight text-white block">
              LOCA<span className="text-brand-400">GESTION</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              SaaS Gestion Locative UEMOA
            </span>
          </div>
        </div>

        <h2 className="text-center text-2xl sm:text-3xl font-black tracking-tight text-white">
          Connexion à votre espace
        </h2>
        <p className="mt-2 text-center text-xs sm:text-sm text-slate-400">
          Sélectionnez votre profil ou entrez vos identifiants pour accéder à votre espace dédié.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4 relative z-10">
        <div className="bg-[#171b24] py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/10 space-y-6">
          {/* Quick Demo Login Cards */}
          <div className="space-y-3">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-400 block">
              Connexion instantanée (Comptes Démo certifiés) :
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Card Bailleur */}
              <button
                type="button"
                onClick={() => handleQuickLogin('bailleur')}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-brand-950/40 to-slate-900 border border-brand-500/30 hover:border-brand-500 text-left transition-all group hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-brand-500/20 text-brand-400 border border-brand-500/30">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-brand-500 text-white">
                    Bailleur
                  </span>
                </div>
                <div className="font-bold text-white text-xs group-hover:text-brand-300">
                  {DEMO_LANDLORD.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  Cabinet Diallo • Bénin 🇧🇯
                </div>
                <div className="mt-2.5 text-[10px] font-bold text-brand-400 flex items-center gap-1">
                  <span>Accéder au Dashboard</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>

              {/* Card Locataire */}
              <button
                type="button"
                onClick={() => handleQuickLogin('locataire')}
                className="p-3.5 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-slate-900 border border-emerald-500/30 hover:border-emerald-500 text-left transition-all group hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Users className="w-4 h-4" />
                  </span>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                    Locataire
                  </span>
                </div>
                <div className="font-bold text-white text-xs group-hover:text-emerald-300">
                  {DEMO_TENANT.name}
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-0.5">
                  Résident Titulaire • Bénin 🇧🇯
                </div>
                <div className="mt-2.5 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <span>Accéder au Portail</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#171b24] px-3 text-slate-400 font-bold text-[10px]">
                Ou se connecter avec vos identifiants
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-300 block mb-1.5">
                Adresse Email ou Téléphone
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="ex: contact@diallo-patrimoine.bj ou +229..."
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  required
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Mot de passe
                </label>
                <span className="text-[10px] text-slate-400">
                  Démo : <code className="text-brand-300 font-mono">demo1234</code>
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-2xl bg-white/5 border border-white/15 text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-brand-500 hover:bg-brand-600 text-white font-black text-xs shadow-lg shadow-brand-500/30 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
            >
              <span>{isLoading ? 'Connexion en cours...' : 'Se connecter'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Link to Register */}
          <div className="pt-2 border-t border-white/5 text-center">
            <p className="text-xs text-slate-400">
              Vous n'avez pas encore de compte ?{' '}
              <Link
                href="/auth/register"
                className="text-brand-400 hover:text-brand-300 font-bold hover:underline"
              >
                Créer un compte (Inscription)
              </Link>
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-tealAccent-400" />
            <span>Conformité OHADA & UEMOA</span>
          </span>
          <span>•</span>
          <span>Données Chiffrées</span>
          <span>•</span>
          <span>Zone FCFA</span>
        </div>
      </div>
    </div>
  );
}

