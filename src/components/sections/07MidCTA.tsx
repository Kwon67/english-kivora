import Button from '@/components/ui/Button'
import RevealOnScroll from '@/components/ui/RevealOnScroll'

export default function MidCTA() {
  return (
    <section className="bg-bg-card px-4 py-16 text-center sm:px-6 lg:px-8">
      <RevealOnScroll>
        <h2 className="font-heading text-3xl font-bold text-brand-dark sm:text-5xl">
          Pare de procrastinar. Comece a falar.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-brand-secondary">
          O Kivora multiplica sua evolução sem multiplicar suas horas.
        </p>
        <Button href="/register" className="mt-8">
          Começar grátis →
        </Button>
      </RevealOnScroll>
    </section>
  )
}
