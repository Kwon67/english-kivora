import Button from '@/components/ui/Button'
import LandingSectionHeader from '@/components/ui/LandingSectionHeader'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import { MacTrafficLights, MacWindowControlButtons } from '@/components/ui/WindowChromeControls'
import { landingCtaCardShadow, landingRadius, landingSurfaceClass } from '@/lib/landingStyles'

export default function FinalCTA() {
  return (
    <LandingSectionFrame id="contato" band="plain" className="pb-12">
      <RevealOnScroll
        className={`mx-auto max-w-5xl ${landingSurfaceClass} bg-bg-card ${landingCtaCardShadow}`}
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
          <div className={`relative flex min-h-[220px] flex-col justify-center overflow-hidden ${landingRadius} border border-brand-dark bg-bg-primary p-5`}>
            <div className={`${landingRadius} border border-brand-dark bg-bg-card p-4`}>
              <p className="font-heading text-sm font-bold text-brand-dark">Sessão pronta</p>
              <div className="mt-4 space-y-2">
                <span className="block h-2 rounded-full bg-brand-border" />
                <span className="block h-2 w-4/5 rounded-full bg-brand-border" />
                <span className="block h-2 w-2/3 rounded-full bg-brand-accent" />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {['IA', 'SRS', 'XP'].map((item) => (
                <span key={item} className="rounded-md border border-brand-dark bg-bg-card px-2 py-2 text-center font-heading text-xs font-bold text-brand-dark">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}
