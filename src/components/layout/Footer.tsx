import React from 'react';

export function Footer() {
  return (
    <footer className="mt-8 pt-4 pb-6 border-t border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-slate-400">
      {/* En bas à gauche : Créée au Bénin */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white border border-slate-200/80 shadow-2xs text-[10px] font-semibold text-slate-700">
          <span className="text-xs leading-none">🇧🇯</span>
          <span>Créée au Bénin</span>
        </span>
        <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
          • Plateforme Immobilière & Gestion Locative UEMOA
        </span>
      </div>

      {/* Droite : Copyright & Certification */}
      <div className="text-[10px] text-slate-400">
        <span>© 2026 LOCAGESTION • Système certifié OHADA / UEMOA</span>
      </div>
    </footer>
  );
}

