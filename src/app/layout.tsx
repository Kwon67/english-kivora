import type { Metadata, Viewport } from 'next'
import { Manrope } from 'next/font/google'
import MotionProvider from '@/components/shared/MotionProvider'
import PresenceTracker from '@/components/shared/PresenceTracker'
import './globals.css'

const manrope = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  title: 'Kivora Inglês — Treine seu inglês',
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
        </MotionProvider>
      </body>
    </html>
  )
}
