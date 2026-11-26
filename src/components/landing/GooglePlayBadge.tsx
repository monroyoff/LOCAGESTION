'use client';

import React from 'react';

interface GooglePlayBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'button' | 'pill';
}

export const PLAYSTORE_URL =
  'https://play.google.com/store/apps/details?id=com.locagestion.app';

/**
 * Icône vectorielle officielle Google Play
 */
export const GooglePlayIcon: React.FC<{ className?: string }> = ({
  className = 'w-6 h-6',
}) => (
  <svg
    viewBox="0 0 512 512"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M325.3 234.3L104.6 13l280.8 161.2-60.1 59.9z"
      fill="#FBBC04"
    />
    <path
      d="M47 38.8v434.4l246.6-239.1L47 38.8z"
      fill="#4285F4"
    />
    <path
      d="M325.3 277.7l60.1 59.9L104.6 499l220.7-221.3z"
      fill="#EA4335"
    />
    <path
      d="M465 244.6L385.4 199l-60.1 60.1 60.1 60.1 79.6-45.7c14.4-8.3 14.4-20.6 0-28.9z"
      fill="#34A853"
    />
  </svg>
);

export const GooglePlayBadge: React.FC<GooglePlayBadgeProps> = ({
  className = '',
  size = 'md',
  variant = 'badge',
}) => {
  if (variant === 'pill') {
    return (
      <a
        href={PLAYSTORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 hover:bg-black text-white text-xs font-bold border border-slate-700/80 shadow-md hover:shadow-lg transition-all active:scale-95 group ${className}`}
        title="Télécharger LOCAGESTION sur Google Play Store"
      >
        <GooglePlayIcon className="w-4 h-4 shrink-0 group-hover:scale-110 transition-transform" />
        <span className="flex items-center gap-1.5">
          <span>Sur Google Play</span>
          <span className="text-[10px] text-emerald-400 font-extrabold uppercase bg-emerald-950/80 px-1.5 py-0.2 rounded">
            App
          </span>
        </span>
      </a>
    );
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-left gap-2 rounded-xl',
    md: 'px-4 py-2 text-left gap-2.5 rounded-2xl',
    lg: 'px-5 py-2.5 text-left gap-3 rounded-2xl',
  }[size];

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  }[size];

  const subTextSizes = {
    sm: 'text-[8.5px]',
    md: 'text-[9.5px]',
    lg: 'text-[10.5px]',
  }[size];

  const mainTextSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  return (
    <a
      href={PLAYSTORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center bg-slate-950 hover:bg-black text-white border border-slate-700/80 shadow-lg hover:shadow-xl transition-all duration-200 active:scale-95 group cursor-pointer ${sizeClasses} ${className}`}
      title="Télécharger l'application LOCAGESTION sur Google Play Store"
    >
      <GooglePlayIcon
        className={`${iconSizes} shrink-0 group-hover:scale-110 transition-transform`}
      />
      <div className="flex flex-col leading-none">
        <span
          className={`${subTextSizes} font-bold text-slate-300 uppercase tracking-wider block`}
        >
          DISPONIBLE SUR
        </span>
        <span className={`${mainTextSizes} font-black text-white tracking-tight mt-0.5 block`}>
          Google Play
        </span>
      </div>
    </a>
  );
};
