import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#090a0d',
          900: '#0e1117',
          850: '#131720',
          800: '#1a1f2c',
          700: '#262d3d',
          600: '#384259',
        },
        brand: {
          50: '#fff1f4',
          100: '#ffe4e9',
          200: '#fecdd7',
          300: '#fda4b8',
          400: '#fb7193',
          500: '#f43f6e', // StayWise vibrant rose/pink
          600: '#e11d53',
          700: '#be1243',
          800: '#9f123c',
          900: '#881337',
        },
        tealAccent: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
        },
        emeraldAccent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
      },
      borderRadius: {
        '2.5xl': '20px',
        '3xl': '24px',
        '4xl': '32px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'card': '0 10px 30px -10px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 20px 40px -15px rgba(0, 0, 0, 0.08)',
        'pink-glow': '0 10px 25px -5px rgba(244, 63, 110, 0.35)',
        'teal-glow': '0 10px 25px -5px rgba(20, 184, 166, 0.35)',
      },
      fontFamily: {
        sans: [
          'Plus Jakarta Sans',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

export default config;

