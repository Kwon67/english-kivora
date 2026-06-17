import type { Metadata } from 'next'
import Features from '@/components/landing/Features'
import FinalCTA from '@/components/landing/FinalCTA'
import FlightPaths from '@/components/landing/FlightPaths'
import Footer from '@/components/landing/Footer'
import Hero from '@/components/landing/Hero'
import HowItWorks from '@/components/landing/HowItWorks'
import Navbar from '@/components/landing/Navbar'
import Testimonials from '@/components/landing/Testimonials'

export const metadata: Metadata = {
  title: 'Kivora English | Aprenda inglês com prática diária',
  description:
    'Conheça a plataforma Kivora English: trilhas por nível, exercícios interativos e acompanhamento de progresso para evoluir no inglês.',
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
        <main>
          <Hero />
          <HowItWorks />
          <Features />
          <Testimonials />
          <FinalCTA />
        </main>
        <Footer />
      </div>
    </div>
  )
}
