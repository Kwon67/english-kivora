import { Database, LockKeyhole, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'

const items = [
  {
    icon: ShieldCheck,
    title: 'Sem compartilhamento',
    description: 'Seus dados nunca saem da plataforma sem sua autorização.',
  },
  {
    icon: LockKeyhole,
    title: 'IA ética',
    description: 'Não usamos seus textos para treinar modelos.',
  },
  {
    icon: Database,
    title: 'Progresso seguro',
    description: 'Backup automático do seu histórico de estudo.',
  },
]

export default function Security() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <RevealOnScroll className="mx-auto max-w-6xl">
        <Card className="p-6 sm:p-10">
          <SectionBadge label="Segurança" className="mx-0" />
          <h2 className="mt-8 max-w-3xl font-heading text-3xl font-bold text-brand-dark sm:text-5xl">
            Seus dados, tratados com cuidado
          </h2>
          <div className="mt-10 grid gap-0 overflow-hidden rounded-2xl border border-brand-border md:grid-cols-3">
            {items.map((item) => {
              const Icon = item.icon

              return (
                <div key={item.title} className="border-b border-brand-border p-6 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-brand-border bg-bg-primary">
                    <Icon className="h-6 w-6 text-brand-dark" />
                  </div>
                  <h3 className="mt-5 font-heading text-xl font-bold text-brand-dark">{item.title}</h3>
                  <p className="mt-3 leading-7 text-brand-secondary">{item.description}</p>
                </div>
              )
            })}
          </div>
          <Link href="/privacy" className="mt-8 inline-block font-heading text-sm font-bold text-brand-dark">
            Leia nossas práticas de privacidade →
          </Link>
        </Card>
      </RevealOnScroll>
    </section>
  )
}
