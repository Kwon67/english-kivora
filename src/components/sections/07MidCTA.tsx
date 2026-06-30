import Button from '@/components/ui/Button'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingSectionTitleClass } from '@/lib/landingTypography'

export default function MidCTA() {
  return (
    <LandingSectionFrame band="default" className="text-center">
      <RevealOnScroll>
        <SectionBadge label="Comece agora" className="mx-auto" />
        <h2 className={`mt-8 ${landingSectionTitleClass}`}>
          Pare de procrastinar. Comece a falar.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-brand-secondary">
          O Kivora multiplica sua evolução sem multiplicar suas horas.
        </p>
        <Button landing href="/register" className="mt-8">
          Começar grátis →
        </Button>
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}
