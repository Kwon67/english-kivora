import type { Metadata } from 'next'
import Features from '@/components/landing/Features'
import FAQ from '@/components/landing/FAQ'
import FinalCTA from '@/components/landing/FinalCTA'
import FlightPaths from '@/components/landing/FlightPaths'
import Footer from '@/components/landing/Footer'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import Navbar from '@/components/landing/Navbar'
import ProductInPractice from '@/components/landing/ProductInPractice'

export const metadata: Metadata = {
  title: {
    absolute: 'Kivora English | Prática diária, revisão e conversação',
  },
  description:
    'Pratique inglês com revisão espaçada, listening, speaking, desafios Blitz, tutor de voz com IA e acompanhamento de progresso.',
  openGraph: {
    title: 'Kivora English | Prática diária, revisão e conversação',
    description:
      'Pratique inglês com revisão espaçada, listening, speaking, desafios rápidos e tutor de voz com IA.',
    images: [
      {
        url: '/images/kivora_banner.png',
        width: 1024,
        height: 1024,
        alt: 'Kivora English',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kivora English | Prática diária, revisão e conversação',
    description:
      'Pratique inglês com revisão espaçada, listening, speaking, desafios rápidos e tutor de voz com IA.',
    images: ['/images/kivora_banner.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-surface text-text dark:bg-[#050704] dark:text-text">
      {/* Decorative flight paths — absolute, z-0, below all content */}
      <FlightPaths />
      {/* All page content — relative, z-1, above the flight paths */}
      <div className="relative z-[1]">
        <Navbar />
        <main id="main-content">
          <Hero />
          <HowItWorks />
          <Features />
          <ProductInPractice />
          <FAQ />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </div>
  )
}
