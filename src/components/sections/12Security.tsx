import { Database, LockKeyhole, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import LandingSectionHeader from '@/components/ui/LandingSectionHeader'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'

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
    <LandingSectionFrame band="plain">
      <RevealOnScroll className="mx-auto max-w-6xl">
        <Card
          className="relative grid gap-8 border-brand-dark/25 p-6 shadow-[0_18px_55px_rgba(28,25,21,0.06)] sm:p-8 md:grid-cols-[0.86fr_1.14fr]"
        >
          <div>
            <LandingSectionHeader
              badge="Segurança"
              title="Seus dados, tratados com cuidado"
              titleClassName="max-w-lg"
              description="Sem atalhos na privacidade: sua prática, voz e progresso ficam protegidos."
              descriptionClassName="mt-4 text-sm leading-6 text-brand-secondary"
            />
            <Link href="/privacy" className="mt-8 inline-block font-heading text-sm font-bold text-brand-dark">
              Leia nossas práticas de privacidade →
            </Link>
          </div>
          <div className="grid gap-3">
            {items.map((item) => {
              const Icon = item.icon

              return (
                <div key={item.title} className="group grid gap-4 rounded-control border border-brand-dark/15 bg-bg-primary p-4 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-dark/40 sm:grid-cols-[48px_1fr]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-control border border-brand-dark/20 bg-bg-card transition-colors group-hover:bg-brand-accent">
                    <Icon className="h-5 w-5 text-brand-dark" />
                  </div>
                  <div>
                    <h3 className="font-heading text-lg font-bold text-brand-dark">{item.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-brand-secondary">{item.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </RevealOnScroll>
    </LandingSectionFrame>
  )
}
