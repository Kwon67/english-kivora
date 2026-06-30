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
    <div className="flex h-14 shrink-0 items-center opacity-70 grayscale transition-opacity duration-200 hover:opacity-100 sm:h-16">
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
    <section className="overflow-hidden border-y border-brand-dark bg-bg-primary py-7 sm:py-8">
      <div className="mx-auto max-w-4xl px-5 sm:px-6 lg:max-w-5xl">
        <p className="text-center font-heading text-base font-bold text-brand-dark sm:text-lg">
          Já usado por estudantes de todo o Brasil
        </p>
      </div>

      <div className="landing-marquee landing-marquee--trust mt-5 w-full sm:mt-6">
        <div className="landing-marquee-inner">
          <div className="landing-marquee-group">
            {partners.map((partner) => (
              <PartnerLogo key={partner.name} name={partner.name} logo={partner.logo} />
            ))}
          </div>
          <div className="landing-marquee-group" aria-hidden="true">
            {partners.map((partner) => (
              <PartnerLogo key={`${partner.name}-clone`} name={partner.name} logo={partner.logo} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}