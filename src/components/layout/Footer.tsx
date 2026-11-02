import React from 'react';

export function Footer() {
  return (
    <footer className="mt-12 pt-6 pb-8 border-t border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-slate-400">
      {/* En bas à gauche : Créée au Bénin */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs text-xs font-bold text-slate-800">
          <span className="text-sm leading-none">🇧🇯</span>
          <span>Créée au Bénin</span>
        </span>
        <span className="text-xs text-slate-400 font-medium hidden sm:inline">
          • Plateforme Immobilière & Gestion Locative UEMOA
        </span>
      </div>

      {/* Droite : Copyright & Certification */}
      <div className="text-[11px] text-slate-400 font-medium">
        <span>© 2026 LOCAGESTION • Système certifié OHADA / UEMOA</span>
      </div>
    </footer>
  );
}
