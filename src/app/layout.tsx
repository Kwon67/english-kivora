import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import MotionProvider from '@/components/shared/MotionProvider'
import PresenceTracker from '@/components/shared/PresenceTracker'
import PWAExperience from '@/components/shared/PWAExperience'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
})

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
      { url: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false,
  },
  appleWebApp: {
    capable: true,
    title: 'Kivora Inglês',
    statusBarStyle: 'black-translucent',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#466259',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() || null

  return (
    <html lang="pt-BR" className={manrope.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme') || 'light';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-[100svh]">
        <MotionProvider>
          <PresenceTracker />
          {children}
          <PWAExperience publicVapidKey={publicVapidKey} />
        </MotionProvider>
      </body>
    </html>
  )
}
