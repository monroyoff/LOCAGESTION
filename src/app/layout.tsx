import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LOCAGESTION — Plateforme de Gestion Locative & Immobilière UEMOA',
  description:
    'SaaS moderne de gestion locative, baux, encaissement de loyers, solvabilité et quittances certifiées en Afrique de l’Ouest et Centrale.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0e1117',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="h-full">
      <body className="h-full bg-[#F4F6F9] text-slate-900 antialiased selection:bg-brand-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}

