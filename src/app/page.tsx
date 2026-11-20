import type { Metadata } from 'next'
import { publicSiteOrigin } from '@/lib/publicSite'
import { getLandingRiveAssets } from '@/components/landing/landingRiveAssets'
import MindmarketLanding from '@/components/landing/MindmarketLanding'

const socialImage = {
  url: publicSiteOrigin + '/images/kivora-social-2026.png',
  width: 1200,
  height: 630,
  alt: 'Kivora English. Seu inglês. Um mundo mais aberto.',
}

export const metadata: Metadata = {
  title: {
    absolute: 'Kivora English | Seu inglês ganha vida.',
  },
  description:
    'Aprenda inglês do A1 ao C2 com exercícios interativos, revisões inteligentes, trilhas personalizadas e conversação com IA.',
  openGraph: {
    images: [socialImage],
    title: 'Kivora English | Seu inglês ganha vida.',
    description:
      'Aprenda fazendo: revisões inteligentes, novas descobertas e conversas em inglês.',
  },
  twitter: {
    card: 'summary_large_image',
    images: [socialImage],
    title: 'Kivora English | Seu inglês ganha vida.',
    description:
      'Aprenda fazendo: revisões inteligentes, novas descobertas e conversas em inglês.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LandingPage() {
  return <MindmarketLanding riveAssets={getLandingRiveAssets()} />
}
