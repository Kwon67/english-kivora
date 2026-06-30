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
    <div className="flex h-12 shrink-0 items-center opacity-70 grayscale transition-opacity duration-200 hover:opacity-100">
      <Image
        src={logo}
        alt={name}
        width={180}
        height={48}
        unoptimized
        className="h-8 w-auto max-w-[11rem] object-contain sm:h-9"
      />
    </div>
  )
}

export default function TrustBar() {
  return (
    <section className="overflow-hidden border-y border-brand-dark bg-bg-primary py-10">
      <p className="text-center font-heading text-lg font-bold text-brand-dark">
        Já usado por estudantes de todo o Brasil
      </p>
      <div className="landing-marquee mt-8">
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