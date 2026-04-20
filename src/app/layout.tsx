import type { Metadata, Viewport } from 'next'
import { ViewTransition } from 'react'
import MotionProvider from '@/components/shared/MotionProvider'
import PresenceTracker from '@/components/shared/PresenceTracker'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kivora English — Treine seu Inglês',
  description:
    'Plataforma interna de treinamento de inglês da equipe Kivora. Pratique com flashcards, múltipla escolha e digitação.',
  robots: 'noindex, nofollow',
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
    url: false,
  },
  appleWebApp: {
    capable: true,
    title: 'Kivora English',
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
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-[100svh]">
        <MotionProvider>
          <PresenceTracker />
          <ViewTransition
            enter={{
              'nav-forward': 'nav-forward',
              'nav-back': 'nav-back',
              default: 'none',
            }}
            exit={{
              'nav-forward': 'nav-forward',
              'nav-back': 'nav-back',
              default: 'none',
            }}
            default="none"
          >
            {children}
          </ViewTransition>
        </MotionProvider>
      </body>
    </html>
  )
}
