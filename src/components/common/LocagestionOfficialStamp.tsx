'use client';

import React, { useId } from 'react';

interface LocagestionOfficialStampProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  tilt?: boolean;
  variant?: 'emerald' | 'blue' | 'slate';
  showBackground?: boolean;
  date?: string;
}

const SIZE_MAP = {
  sm: 'w-16 h-16',
  md: 'w-20 h-20 sm:w-24 sm:h-24',
  lg: 'w-24 h-24 sm:w-28 sm:h-28',
  xl: 'w-32 h-32 sm:w-36 sm:h-36',
};

const COLOR_MAP = {
  emerald: {
    text: 'text-emerald-700',
    fill: 'fill-emerald-700',
    stroke: '#047857',
    bg: '#ecfdf5',
    ring: 'border-emerald-600',
  },
  blue: {
    text: 'text-sky-700',
    fill: 'fill-sky-700',
    stroke: '#0369a1',
    bg: '#f0f9ff',
    ring: 'border-sky-600',
  },
  slate: {
    text: 'text-slate-800',
    fill: 'fill-slate-800',
    stroke: '#1e293b',
    bg: '#f8fafc',
    ring: 'border-slate-700',
  },
};

export default function LocagestionOfficialStamp({
  size = 'md',
  className = '',
  tilt = true,
  variant = 'emerald',
  showBackground = true,
  date,
}: LocagestionOfficialStampProps) {
  const rawId = useId();
  const safeId = rawId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const topArcId = `loca-top-arc-${safeId}`;
  const bottomArcId = `loca-bot-arc-${safeId}`;

  const colors = COLOR_MAP[variant] || COLOR_MAP.emerald;
  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const tiltClass = tilt ? '-rotate-12 hover:rotate-0 transition-transform duration-300' : '';

  return (
    <div
      className={`inline-block shrink-0 select-none ${tiltClass} ${sizeClass} ${className}`}
      title="Cachet d'Authentification Officiel LOCAGESTION — Scellé Numérique Certifié"
    >
      <svg
        viewBox="0 0 140 140"
        className="w-full h-full drop-shadow-sm"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Top arc (clockwise) */}
          <path
            id={topArcId}
            d="M 22,70 A 48,48 0 1,1 118,70"
            fill="none"
          />
          {/* Bottom arc (counter-clockwise so text is upright) */}
          <path
            id={bottomArcId}
            d="M 23,70 A 47,47 0 0,0 117,70"
            fill="none"
          />
        </defs>

        {/* Outer Circular Ring (Official double-gauge) */}
        <circle
          cx="70"
          cy="70"
          r="66"
          stroke={colors.stroke}
          strokeWidth="2.5"
          fill={showBackground ? colors.bg : 'none'}
          fillOpacity={showBackground ? '0.75' : '0'}
        />

        {/* Dashed Security Ring */}
        <circle
          cx="70"
          cy="70"
          r="59"
          stroke={colors.stroke}
          strokeWidth="1.2"
          strokeDasharray="3 2"
          fill="none"
        />

        {/* Inner Solid Border Ring */}
        <circle
          cx="70"
          cy="70"
          r="41"
          stroke={colors.stroke}
          strokeWidth="1"
          fill="none"
        />

        {/* Top Arched Text: CACHET D'AUTHENTIFICATION */}
        <text
          fill={colors.stroke}
          fontSize="7"
          fontWeight="900"
          letterSpacing="0.8"
        >
          <textPath href={`#${topArcId}`} startOffset="50%" textAnchor="middle">
            ★ CACHET D&apos;AUTHENTIFICATION ★
          </textPath>
        </text>

        {/* Bottom Arched Text: RÉPUBLIQUE DU BÉNIN • UEMOA */}
        <text
          fill={colors.stroke}
          fontSize="6.2"
          fontWeight="800"
          letterSpacing="0.6"
        >
          <textPath href={`#${bottomArcId}`} startOffset="50%" textAnchor="middle">
            RÉPUBLIQUE DU BÉNIN • UEMOA
          </textPath>
        </text>

        {/* Center Stamp Typography */}
        <g textAnchor="middle" fill={colors.stroke}>
          {/* Top Star mention */}
          <text
            x="70"
            y="52"
            fontSize="6.2"
            fontWeight="800"
            letterSpacing="0.8"
          >
            ★ SCELLÉ OFFICIEL ★
          </text>

          {/* Brand Name LOCAGESTION */}
          <text
            x="70"
            y="66"
            fontSize="11"
            fontWeight="900"
            letterSpacing="1.2"
            fontFamily="system-ui, -apple-system, sans-serif"
          >
            LOCAGESTION
          </text>

          {/* Validation Status */}
          <text
            x="70"
            y="76"
            fontSize="7"
            fontWeight="800"
            letterSpacing="0.4"
          >
            AUTHENTIQUE ✓
          </text>

          {/* Legal Mention / Date */}
          <text
            x="70"
            y="84"
            fontSize="5.2"
            fontWeight="700"
            letterSpacing="0.5"
            fillOpacity="0.85"
          >
            {date ? `SCELLÉ LE ${date}` : 'CONFORME OHADA'}
          </text>
        </g>
      </svg>
    </div>
  );
}
