import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Figtree, Inter, Space_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import MotionProvider from '@/components/layout/MotionProvider';
import PresenceTracker from '@/components/layout/PresenceTracker';
import PWAExperience from '@/features/pwa/components/PWAExperience';
import { BRAND_PRIMARY } from '@/lib/brandColors';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body'
});

const spaceMono = Space_Mono({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading'
});

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-section',
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
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' }
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }]
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
  themeColor: BRAND_PRIMARY
};

export default async function RootLayout({
  children


}: {children: React.ReactNode;}) {
  const publicVapidKey =
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || process.env.VAPID_PUBLIC_KEY?.trim() || null;

  return (
	    <html lang="pt-BR" suppressHydrationWarning data-scroll-behavior="smooth" className={`${spaceMono.variable} ${inter.variable} ${figtree.variable}`}>
	      <body suppressHydrationWarning className="antialiased min-h-screen min-h-[100svh]">
	        <Script src="/pwa-init.js" strategy="beforeInteractive" />
	        <div
	          id="pwa-boot-splash"
	          aria-hidden="true"
	          style={{ display: 'none' }}
	          className="pointer-events-none fixed inset-0 z-[9999] flex-col items-center justify-center bg-surface text-primary"
	        >
	          <div className="flex flex-col items-center gap-3">
	            <div className="h-10 w-10 animate-pulse rounded-2xl bg-primary/20" />
	            <p className="text-xs font-black uppercase tracking-[0.18em]">Kivora</p>
	          </div>
	        </div>
	        <a
	          href="#main-content"
	          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary focus:shadow-md"
	        >
	          Ir para o conteúdo principal
	        </a>
	        <MotionProvider>
	          <PresenceTracker />
	          {children}
	          <PWAExperience publicVapidKey={publicVapidKey} />
	          <Toaster
	            position="bottom-center"
	            richColors={false}
	            closeButton
	            offset="1rem"
	            mobileOffset={{
	              bottom: 'var(--app-toast-offset-bottom, 5.5rem)',
	              left: '0.75rem',
	              right: '0.75rem',
	            }}
	            toastOptions={{
	              classNames: {
	                toast:
	                  'kivora-toast group toast !rounded-[13px] !border !border-brand-dark !bg-bg-card !font-body !font-medium !text-brand-dark !shadow-[6px_6px_0_#1C1915]',
	                title: '!font-heading !text-sm !font-bold !text-brand-dark',
	                description: '!font-body !text-xs !font-semibold !text-brand-secondary',
	                icon: 'kivora-toast-icon !border !border-brand-dark !bg-brand-accent !text-brand-dark',
	                closeButton:
	                  'kivora-toast-close !border !border-brand-dark !bg-bg-card !text-brand-dark hover:!bg-bg-primary',
	                error:
	                  '!border-brand-dark !bg-bg-card !text-[var(--color-error)]',
	                success:
	                  '!border-brand-dark !bg-bg-card !text-brand-dark',
	                warning:
	                  '!border-brand-dark !bg-bg-card !text-brand-dark',
	              },
	            }}
	          />
	        </MotionProvider>
	      </body>
	    </html>);

}
