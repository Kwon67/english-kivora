const partners = [
  'Escola Nativa',
  'Fluency Lab',
  'Kivora Academy',
  'Tech Teens',
  'Global Start',
  'English Hub',
]

export default function TrustBar() {
  return (
    <section className="overflow-hidden border-y border-brand-border bg-bg-primary py-10">
      <p className="text-center font-heading text-lg font-bold text-brand-dark">
        Já usado por estudantes de todo o Brasil
      </p>
      <div className="landing-marquee mt-8">
        <div className="landing-marquee-inner">
          <div className="landing-marquee-group">
            {partners.map((partner) => (
              <span
                key={partner}
                className="whitespace-nowrap font-heading text-xl font-bold text-brand-secondary/75"
              >
                {partner}
              </span>
            ))}
          </div>
          <div className="landing-marquee-group" aria-hidden="true">
            {partners.map((partner) => (
              <span
                key={`${partner}-clone`}
                className="whitespace-nowrap font-heading text-xl font-bold text-brand-secondary/75"
              >
                {partner}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
