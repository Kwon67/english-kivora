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
      <div className="mt-8 flex overflow-hidden">
        <div className="flex min-w-full animate-[kivora-marquee_22s_linear_infinite] items-center gap-10 pr-10">
          {[...partners, ...partners].map((partner, index) => (
            <span
              key={`${partner}-${index}`}
              className="whitespace-nowrap font-heading text-xl font-bold text-brand-secondary/75"
            >
              {partner}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
