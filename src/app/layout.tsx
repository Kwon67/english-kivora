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
  applicationName: 'Kivora English',
  title: {
    default: 'Kivora English | Aprenda inglês com prática diária',
    template: '%s | Kivora English',
  },
  description:
    'Plataforma de aprendizado de inglês com trilhas por nível, exercícios interativos e acompanhamento de progresso.',
  keywords: ['aprender inglês', 'EdTech', 'inglês online', 'trilhas de inglês', 'prática de inglês'],
  authors: [{ name: 'Kivora English' }],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: 'https://english-kivora.vercel.app',
    title: 'Kivora English | Aprenda inglês com prática diária',
    description: 'Plataforma de aprendizado de inglês.',
    siteName: 'Kivora English',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kivora English',
    description: 'Aprenda inglês com prática diária.',
  },
  manifest: '/manifest.webmanifest',
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
    { url: '/icon.png', sizes: '512x512', type: 'image/png' },
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
    title: 'Kivora English',
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
  themeColor: '#1DB954'
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
          <PWAExperience publicVapidKey={publicVapidKey} />
        </MotionProvider>
      </body>
    </html>);

}
