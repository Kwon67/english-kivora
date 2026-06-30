import type { Metadata } from 'next'
import AnnouncementBanner from '@/components/sections/01AnnouncementBanner'
import Navbar from '@/components/sections/02Navbar'
import Hero from '@/components/sections/03Hero'
import TrustBar from '@/components/sections/04TrustBar'
import DemoSection from '@/components/sections/05DemoSection'
import AudienceTabs from '@/components/sections/06AudienceTabs'
import MidCTA from '@/components/sections/07MidCTA'
import HowItWorks from '@/components/sections/08HowItWorks'
import TestimonialsCarousel from '@/components/sections/09TestimonialsCarousel'
import LearningStack from '@/components/sections/10LearningStack'
import PricingCarousel from '@/components/sections/11PricingCarousel'
import Security from '@/components/sections/12Security'
import FAQAccordion from '@/components/sections/13FAQAccordion'
import FinalCTA from '@/components/sections/14FinalCTA'
import Footer from '@/components/sections/15Footer'

export const metadata: Metadata = {
  title: {
    absolute: 'Kivora English | Prática diária, revisão e conversação',
  },
  description:
    'Pratique inglês com revisão espaçada, listening, speaking, desafios Blitz, tutor de voz com IA e acompanhamento de progresso.',
  openGraph: {
    title: 'Kivora English | Aprenda inglês de verdade com IA',
    description:
      'IA + gamificação + revisão espaçada para evoluir no inglês com dados reais de progresso.',
  },
  twitter: {
    card: 'summary',
    title: 'Kivora English | Aprenda inglês de verdade com IA',
    description:
      'IA + gamificação + revisão espaçada para evoluir no inglês com dados reais de progresso.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function LandingPage() {
  return (
    <div className="landing-light scroll-smooth min-h-screen overflow-x-hidden bg-bg-primary font-body text-brand-dark">
      <AnnouncementBanner />
      <Navbar />
      <main id="main-content">
        <Hero />
        <TrustBar />
        <DemoSection />
        <AudienceTabs />
        <MidCTA />
        <HowItWorks />
        <LearningStack />
        <PricingCarousel />
        <TestimonialsCarousel />
        <Security />
        <FAQAccordion />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  )
}
