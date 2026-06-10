import type { Metadata } from 'next'
import Features from '@/components/landing/Features'
import FinalCTA from '@/components/landing/FinalCTA'
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
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
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
  )
}
