import type { Metadata, Viewport } from 'next';
import './globals.css';
import { SpaceProvider } from '@/lib/context/space-context';
import { GlobalDownloadToast } from '@/components/ui/GlobalDownloadToast';
import { GlobalCenterToast } from '@/components/ui/GlobalCenterToast';
import { GlobalSyncProvider } from '@/components/layout/GlobalSyncProvider';

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
      <body
        className="h-full bg-[#F4F6F9] text-slate-900 antialiased selection:bg-brand-500 selection:text-white"
        suppressHydrationWarning
      >
        <SpaceProvider>
          <GlobalSyncProvider>
            {children}
            <GlobalDownloadToast />
            <GlobalCenterToast />
          </GlobalSyncProvider>
        </SpaceProvider>
      </body>
    </html>
  );
}
