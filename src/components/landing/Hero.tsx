import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, PlayCircle, Trophy } from 'lucide-react'
import { onPrimaryCardKicker, onPrimaryCardTitle } from '@/lib/brandUi'

const dailyStats = [
  { label: 'Meta diária', value: '86%', tone: 'bg-primary' },
  { label: 'Sequência', value: '12 dias', tone: 'bg-[#8d9e69]' },
  { label: 'Nível', value: 'B1+', tone: 'bg-[#d4b85a]' },
]

const lessonItems = [
  { title: 'Listening: séries e conversas', progress: '72%' },
  { title: 'Speaking: respostas rápidas', progress: '58%' },
  { title: 'Vocabulário para rotina', progress: '91%' },
]

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -left-4 top-8 hidden h-24 w-24 rounded-[18px] border border-dashed border-border-muted/20 bg-[#f7f8ef]/70 shadow-[0_18px_48px_rgba(31,43,18,0.12)] dark:border-border-accent/18 dark:bg-card/70 sm:block" />
      <div className="absolute -right-3 bottom-12 hidden h-28 w-28 rounded-[18px] border border-dashed border-border-muted/20 bg-primary-light/70 shadow-[0_18px_48px_rgba(31,43,18,0.12)] dark:border-border-accent/18 dark:bg-primary/10 sm:block" />

      <div className="relative overflow-hidden rounded-[22px] border border-border-muted/20 bg-card shadow-[0_24px_70px_rgba(31,43,18,0.16)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_24px_70px_rgba(0,0,0,0.54)]">
        <div className="flex items-center justify-between border-b border-border-muted/14 bg-primary-light px-4 py-3 dark:border-border-accent/14 dark:bg-primary/8">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#d4b85a]" />
            <span className="h-3 w-3 rounded-full bg-[#8d9e69]" />
            <span className="h-3 w-3 rounded-full bg-primary" />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.12em] text-text-subtle dark:text-text-subtle">Dashboard Kivora</span>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4 rounded-[18px] bg-primary p-5 text-on-primary dark:bg-[#0b1308]">
            <div>
              <p className={`text-sm font-black uppercase tracking-[0.12em] ${onPrimaryCardKicker}`}>Plano de hoje</p>
              <h3 className={`mt-2 max-w-xs text-2xl font-bold leading-tight ${onPrimaryCardTitle}`}>
                Pratique 18 minutos para manter sua evolução
              </h3>
            </div>
            <Image
              src="/brand/kivora-mark.png"
              alt=""
              aria-hidden="true"
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-2xl bg-[#f7f8ef]/12 p-2"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {dailyStats.map((stat) => (
              <div key={stat.label} className="rounded-[16px] border border-dashed border-border-muted/20 bg-[#f7f8ef] p-4 dark:border-border-accent/18 dark:bg-card">
                <span className={`block h-2 w-10 rounded-full ${stat.tone}`} />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.1em] text-text-subtle dark:text-text-subtle">{stat.label}</p>
                <p className="mt-1 text-lg font-bold text-text dark:text-text">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[18px] border border-dashed border-border-muted/20 bg-[#f7f8ef] p-4 dark:border-border-accent/18 dark:bg-card">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.1em] text-text-subtle dark:text-text-subtle">Trilha recomendada</p>
                <h4 className="mt-1 text-base font-bold text-text dark:text-text">Inglês para conversas reais</h4>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container text-primary dark:bg-primary/12">
                <BookOpen className="h-5 w-5" strokeWidth={2.3} />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {lessonItems.map((item) => (
                <div key={item.title}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold">
                    <span className="text-text-muted dark:text-text-muted">{item.title}</span>
                    <span className="text-primary">{item.progress}</span>
                  </div>
                  <div className="h-2 rounded-full bg-primary-light dark:bg-primary/8">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: item.progress }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-[16px] border border-border-muted/18 bg-primary-light p-4 dark:border-border-accent/18 dark:bg-primary/8">
              <BarChart3 className="h-5 w-5 text-primary" strokeWidth={2.3} />
              <span className="text-sm font-bold text-primary dark:text-primary-container">Progresso visível</span>
            </div>
            <div className="flex items-center gap-3 rounded-[16px] border border-border-muted/18 bg-primary-light p-4 dark:border-border-accent/18 dark:bg-primary/8">
              <Trophy className="h-5 w-5 text-primary" strokeWidth={2.3} />
              <span className="text-sm font-bold text-primary dark:text-primary-container">Conquistas semanais</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-transparent pt-28 dark:bg-transparent sm:pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.14] dark:opacity-[0.14]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_36%),linear-gradient(180deg,rgba(225,230,196,0.42),rgba(244,245,232,0.74)_58%,rgba(244,245,232,0))] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(184,255,92,0.16),transparent_30%),linear-gradient(135deg,rgba(24,59,22,0.38),transparent_62%)]" />

      <div className="relative mx-auto grid w-full max-w-[var(--page-width)] items-center gap-10 px-4 pb-16 sm:px-6 sm:pb-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-2 text-sm font-black text-primary shadow-[0_10px_24px_rgba(31,43,18,0.10)] dark:border-border-accent/18 dark:bg-primary/12">
            <CheckCircle2 className="h-4 w-4" strokeWidth={2.4} />
            Inglês com prática guiada todos os dias
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-normal text-text dark:text-text sm:text-5xl lg:text-6xl">
            Aprenda inglês com uma rotina clara, prática e feita para evoluir.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-text-muted dark:text-text-muted">
            O Kivora English combina trilhas por nível, exercícios interativos e acompanhamento de progresso para transformar estudo em hábito.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-bold text-on-primary shadow-[0_16px_34px_rgba(24,59,22,0.22)] transition-transform hover:-translate-y-0.5 hover:bg-primary-dark"
            >
              Começar agora grátis
              <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
            </Link>
            <Link
              href="#como-funciona"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-border-muted/20 bg-primary-light px-6 text-base font-bold text-primary shadow-sm transition-colors hover:bg-hero-lime dark:border-border-accent/20 dark:bg-primary/8 hover:bg-primary/16"
            >
              <PlayCircle className="h-5 w-5" strokeWidth={2.2} />
              Ver como funciona
            </Link>
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-2xl font-extrabold text-text dark:text-text">5+</p>
              <p className="mt-1 leading-5 text-text-muted dark:text-text-muted">modos de prática</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-text dark:text-text">24/7</p>
              <p className="mt-1 leading-5 text-text-muted dark:text-text-muted">acesso online</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-text dark:text-text">A1-C1</p>
              <p className="mt-1 leading-5 text-text-muted dark:text-text-muted">trilhas por nível</p>
            </div>
          </div>
        </div>

        <DashboardMockup />
      </div>
    </section>
  )
}
