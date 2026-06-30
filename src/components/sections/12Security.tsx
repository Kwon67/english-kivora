import { Database, LockKeyhole, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import Card from '@/components/ui/Card'
import LandingSectionFrame from '@/components/ui/LandingSectionFrame'
import RevealOnScroll from '@/components/ui/RevealOnScroll'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingSectionTitleClass } from '@/lib/landingTypography'

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
        <Card className="relative grid gap-8 border-brand-dark p-6 sm:p-8 md:grid-cols-[0.86fr_1.14fr]">
          <div>
            <SectionBadge label="Segurança" className="mx-0" />
            <h2 className={`mt-8 max-w-lg ${landingSectionTitleClass}`}>
              Seus dados, tratados com cuidado
            </h2>
            <p className="mt-4 text-sm leading-6 text-brand-secondary">
              Sem atalhos na privacidade: sua prática, voz e progresso ficam protegidos.
            </p>
            <Link href="/privacy" className="mt-8 inline-block font-heading text-sm font-bold text-brand-dark">
              Leia nossas práticas de privacidade →
            </Link>
          </div>
          <div className="grid gap-3">
            {items.map((item) => {
              const Icon = item.icon

              return (
                <div key={item.title} className="grid gap-4 rounded-[13px] border border-brand-dark bg-bg-primary p-4 sm:grid-cols-[48px_1fr]">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[13px] border border-brand-dark bg-bg-card">
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
