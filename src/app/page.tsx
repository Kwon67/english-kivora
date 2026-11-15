import type { Metadata } from 'next'
import { getLandingRiveAssets } from '@/components/landing/landingRiveAssets'
import MindmarketLanding from '@/components/landing/MindmarketLanding'

export const metadata: Metadata = {
  title: {
    absolute: 'Kivora English | Seu inglês ganha vida.',
  },
  description:
    'Aprenda inglês do A1 ao C2 com exercícios interativos, revisões inteligentes, trilhas personalizadas e conversação com IA.',
  openGraph: {
    title: 'Kivora English | Seu inglês ganha vida.',
    description:
      'Aprenda fazendo: revisões inteligentes, novas descobertas e conversas em inglês.',
  },
  twitter: {
    card: 'summary',
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
