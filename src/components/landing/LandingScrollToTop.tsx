'use client';

import React, { useState, useEffect } from 'react';

export function LandingScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 280);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      aria-label="Remonter en haut de la page"
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-30 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-surface-container-high/90 text-primary hover:bg-primary-container hover:text-on-primary-container shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl border border-primary/25 hover:border-primary/50 flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-90 group cursor-pointer ${
        visible
          ? 'opacity-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 translate-y-6 pointer-events-none'
      }`}
      title="Remonter en haut"
    >
      <span className="material-symbols-outlined text-[18px] sm:text-[24px] group-hover:-translate-y-1 transition-transform duration-200">
        arrow_upward
      </span>
    </button>
  );
}
