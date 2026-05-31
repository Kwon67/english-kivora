import type { Metadata, Viewport } from 'next';
import { Manrope, Montserrat, Inter } from 'next/font/google';
import MotionProvider from '@/components/layout/MotionProvider';
import PresenceTracker from '@/components/layout/PresenceTracker';
import PWAExperience from '@/features/pwa/components/PWAExperience';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope'
});

const montserrat = Montserrat({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-montserrat'
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
});

export const metadata: Metadata = {
  applicationName: 'Kivora Inglês',
  title: 'Kivora Inglês — Treine seu inglês',
  description:
  'Plataforma interna de treinamento de inglês da equipe Kivora. Pratique com flashcards, múltipla escolha e digitação.',
  manifest: '/manifest.webmanifest',
  robots: 'noindex, nofollow',
  icons: {
    icon: [
    { url: '/icon.svg', type: 'image/svg+xml' },
    { url: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
    { url: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' }],

    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }]
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false
  },
  appleWebApp: {
    capable: true,
    title: 'Kivora Inglês',
    statusBarStyle: 'black-translucent'
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#466259'
};

export default async function RootLayout({
  children


}: {children: React.ReactNode;}) {
  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || null;

  return (
    <html lang="pt-BR" className={`${manrope.variable} ${montserrat.variable} ${inter.variable}`}>
      <body className="antialiased min-h-[100svh]">
        <MotionProvider>
          <PresenceTracker />
          {children}
          <PWAExperience publicVapidKey={publicVapidKey} veA5uuvaaClassName="rounded-[1rem] border border-[var(--color-border)] shadow-[var(--shadow-xl)] backdrop-blur-md block static w-[400px] h-[135px] m-0 p-3 text-base font-normal leading-6 tracking-[-0.011em] text-start text-text bg-white rounded-2xl opacity-100 overflow-visible z-auto" />
        </MotionProvider>
      </body>
    </html>);

}