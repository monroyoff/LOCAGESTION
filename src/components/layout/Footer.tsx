import React from 'react';

export function Footer() {
  return (
    <footer className="mt-6 pt-3 pb-5 border-t border-slate-200/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-slate-400">
      {/* En bas à gauche : Créée au Bénin */}
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 border border-slate-200/70 shadow-2xs text-[9px] font-medium text-slate-600">
          <span className="text-[10px] leading-none">🇧🇯</span>
          <span>Créée au Bénin</span>
        </span>
        <span className="text-[9px] text-slate-400 font-normal hidden sm:inline">
          • Plateforme Immobilière & Gestion Locative UEMOA
        </span>
      </div>

      {/* Droite : Copyright & Certification */}
      <div className="text-[9px] text-slate-400">
        <span>© 2026 LOCAGESTION • Système certifié OHADA / UEMOA</span>
      </div>
    </footer>
  );
}

