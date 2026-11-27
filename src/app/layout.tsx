import type { Metadata, Viewport } from 'next';
import './globals.css';
import '@/styles/landing.css';
import { SpaceProvider } from '@/lib/context/space-context';
import { GlobalDownloadToast } from '@/components/ui/GlobalDownloadToast';
import { GlobalCenterToast } from '@/components/ui/GlobalCenterToast';
import { GlobalSyncProvider } from '@/components/layout/GlobalSyncProvider';
import { FedaPayReturnHandler } from '@/components/layout/FedaPayReturnHandler';
import { SuperAdminImpersonationBanner } from '@/components/layout/SuperAdminImpersonationBanner';

import { SITE_CONFIG } from '@/lib/config/site';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_CONFIG.url),
  title: {
    default: 'LOCAGESTION — Plateforme de Gestion Locative & Immobilière UEMOA & CEMAC',
    template: '%s | LOCAGESTION',
  },
  description:
    'SaaS moderne de gestion locative, baux électroniques certifiés OHADA, encaissement de loyers Mobile Money & devises FCFA, et annonces immobilières en Afrique.',
  applicationName: 'LOCAGESTION',
  keywords: [
    'gestion locative Afrique',
    'baux certifiés OHADA',
    'quittances de loyer numériques',
    'Mobile Money Wave MTN Moov Orange',
    'immobilier UEMOA CEMAC',
    'Bénin',
    'Côte d’Ivoire',
    'Sénégal',
    'Togo',
    'Cameroun',
    'locagestion.site',
  ],
  authors: [{ name: 'LOCAGESTION', url: 'https://locagestion.site' }],
  creator: 'LOCAGESTION',
  publisher: 'LOCAGESTION',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'LOCAGESTION — Plateforme de Gestion Locative & Immobilière UEMOA & CEMAC',
    description:
      'SaaS moderne de gestion locative, baux électroniques certifiés OHADA, encaissement de loyers Mobile Money & devises FCFA, et annonces immobilières en Afrique.',
    url: 'https://locagestion.site',
    siteName: 'LOCAGESTION',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LOCAGESTION — Gestion Locative & Baux OHADA',
    description:
      'Plateforme PropTech tout-en-un de gestion locative et immobilière en Afrique francophone (UEMOA & CEMAC).',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://locagestion.site',
  },
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
    <html lang="fr" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
      </head>
      <body
        className="h-full bg-[#F4F6F9] text-slate-900 antialiased selection:bg-brand-500 selection:text-white"
        suppressHydrationWarning
      >
        <SpaceProvider>
          <SuperAdminImpersonationBanner />
          <GlobalSyncProvider>
            {children}
            <GlobalDownloadToast />
            <GlobalCenterToast />
            <FedaPayReturnHandler />
          </GlobalSyncProvider>
        </SpaceProvider>
      </body>
    </html>
  );
}
