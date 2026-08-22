'use client'

import { m } from 'motion/react'
import Button from '@/components/ui/Button'
import LandingSectionHeader from '@/components/ui/LandingSectionHeader'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import { MacTrafficLights, MacWindowControlButtons } from '@/components/ui/WindowChromeControls'
import { landingFrostedSubtle, landingFrostedSurface, landingRadius, landingSurfaceClass, landingRadiusLg } from '@/lib/landingStyles'
import { useHydratedReducedMotion } from '@/hooks/useHydratedReducedMotion'

/** Bars "load in", then the accent bar locks — the session assembling itself. */
const sessionBars = [
  { width: '100%', accent: false },
  { width: '80%', accent: false },
  { width: '66.6667%', accent: true },
]

const sessionTags = ['IA', 'SRS', 'XP']

export default function FinalCTA() {
  const reducedMotion = useHydratedReducedMotion()

  return (
    <LandingSectionFrame id="contato" band="plain" className="pb-12">
      <RevealOnScroll
        className={`mx-auto max-w-5xl ${landingSurfaceClass} ${landingFrostedSurface}`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-brand-dark px-5 py-3">
          <MacTrafficLights />
          <MacWindowControlButtons />
        </div>
        <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[1fr_330px] md:items-center">
          <div>
            <LandingSectionHeader
              badge="Junte-se"
              title="Junte-se hoje!"
              titleClassName="mt-6"
              description="Comece de graça e fale conosco na comunidade."
              descriptionClassName="mt-4 max-w-xl text-lg leading-8 text-brand-secondary"
            />
            <Button landing href="/register" className="mt-8">
              Começar grátis →
            </Button>
          </div>
          <div className={`relative flex min-h-[220px] flex-col justify-center overflow-hidden ${landingRadius} ${landingFrostedSubtle} border border-brand-dark p-5`}>
            <div className={`${landingRadiusLg} ${landingFrostedSubtle} border border-brand-dark p-4`}>
              <p className="font-heading text-sm font-bold text-brand-dark">Sessão pronta</p>
              <div className="mt-4 space-y-2">
                {sessionBars.map((bar, index) => (
                  <m.span
                    key={index}
                    className={`block h-2 rounded-full ${bar.accent ? 'bg-brand-accent' : 'bg-brand-border'}`}
                    initial={reducedMotion ? false : { width: 0 }}
                    whileInView={{ width: bar.width }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{
                      duration: reducedMotion ? 0 : 0.5,
                      delay: reducedMotion ? 0 : index * 0.14,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {sessionTags.map((item, index) => (
                <m.span
                  key={item}
                  className="rounded-md border border-brand-dark bg-bg-card px-2 py-2 text-center font-heading text-xs font-bold text-brand-dark"
                  initial={reducedMotion ? false : { opacity: 0, scale: 0.85 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{
                    duration: reducedMotion ? 0 : 0.4,
                    delay: reducedMotion ? 0 : 0.42 + index * 0.08,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                >
                  {item}
                </m.span>
              ))}
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}
