import Image from 'next/image'
import Button from '@/components/ui/Button'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'

export default function FinalCTA() {
  return (
    <section id="contato" className="px-4 py-20 sm:px-6 lg:px-8">
      <RevealOnScroll className="mx-auto max-w-6xl overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[8px_8px_0_#1C1915]">
        <div className="flex items-center gap-2 border-b border-brand-border px-5 py-3">
          <span className="h-3 w-3 rounded-full bg-red-400" />
          <span className="h-3 w-3 rounded-full bg-yellow-400" />
          <span className="h-3 w-3 rounded-full bg-brand-accent" />
        </div>
        <div className="grid gap-8 p-6 sm:p-10 md:grid-cols-[1fr_280px] md:items-center">
          <div>
            <SectionBadge label="Junte-se" />
            <h2 className="mt-6 font-heading text-3xl font-bold uppercase text-brand-dark">
              Junte-se hoje!
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-8 text-brand-secondary">
              Comece de graça e fale conosco na comunidade.
            </p>
            <Button href="/register" className="mt-8">
              Começar grátis →
            </Button>
          </div>
          <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[4px_4px_0_#1C1915]">
            <Image
              src="/images/landing/undraw-online-community.svg"
              alt="Ilustração unDraw de comunidade online aprendendo inglês"
              width={280}
              height={210}
              unoptimized
              className="h-auto w-full max-w-[240px] object-contain select-none"
            />
          </div>
        </div>
      </RevealOnScroll>
    </section>
  )
}
