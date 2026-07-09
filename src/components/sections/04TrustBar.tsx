import Image from 'next/image'

const partners = [
  { name: 'Escola Nativa', logo: '/images/landing/trust/escola-nativa.svg' },
  { name: 'Fluency Lab', logo: '/images/landing/trust/fluency-lab.svg' },
  { name: 'Kivora Academy', logo: '/images/landing/trust/kivora-academy.svg' },
  { name: 'Tech Teens', logo: '/images/landing/trust/tech-teens.svg' },
  { name: 'Global Start', logo: '/images/landing/trust/global-start.svg' },
  { name: 'English Hub', logo: '/images/landing/trust/english-hub.svg' },
] as const

function PartnerLogo({ name, logo }: { name: string; logo: string }) {
  return (
    <div className="flex h-16 min-w-[160px] shrink-0 items-center justify-center rounded-[12px] border border-brand-dark/10 bg-bg-card px-5 opacity-65 grayscale transition-[opacity,transform,border-color] duration-200 hover:-translate-y-0.5 hover:border-brand-dark/30 hover:opacity-100 sm:min-w-0">
      <Image
        src={logo}
        alt={name}
        width={220}
        height={56}
        unoptimized
        className="h-10 w-auto max-w-[12.5rem] object-contain sm:h-11 sm:max-w-[13.5rem] md:h-12"
      />
    </div>
  )
}

export default function TrustBar() {
  return (
    <section aria-labelledby="trust-title" className="overflow-hidden border-y border-brand-dark/20 bg-bg-primary py-8 sm:py-10">
      <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:max-w-5xl">
        <p id="trust-title" className="text-center font-heading text-sm font-bold text-brand-dark sm:text-base">
          Já usado por estudantes de todo o Brasil
        </p>
      </div>

      <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="landing-trust-track -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-6">
          {partners.map((partner) => (
            <div key={partner.name} className="snap-center">
              <PartnerLogo name={partner.name} logo={partner.logo} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
