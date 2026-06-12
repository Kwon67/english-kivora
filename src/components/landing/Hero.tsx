import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, PlayCircle, Trophy } from 'lucide-react'

const dailyStats = [
  { label: 'Meta diária', value: '86%', tone: 'bg-[var(--color-primary)]' },
  { label: 'Sequência', value: '12 dias', tone: 'bg-[var(--color-accent-container)]' },
  { label: 'Nível', value: 'B1+', tone: 'bg-[var(--color-secondary)]' },
]

const lessonItems = [
  { title: 'Listening: séries e conversas', progress: '72%' },
  { title: 'Speaking: respostas rápidas', progress: '58%' },
  { title: 'Vocabulário para rotina', progress: '91%' },
]

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="absolute -left-4 top-8 hidden h-24 w-24 rounded-lg border border-white/70 bg-white/50 shadow-[var(--shadow-lg)] backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/50 sm:block" />
      <div className="absolute -right-3 bottom-12 hidden h-28 w-28 rounded-lg border border-white/70 bg-white/45 shadow-[var(--shadow-lg)] backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/45 sm:block" />

      <div className="relative overflow-hidden rounded-xl border border-white/70 bg-white shadow-[var(--shadow-xl)] dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-container-low)] px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-red-300" />
            <span className="h-3 w-3 rounded-full bg-amber-300" />
            <span className="h-3 w-3 rounded-full bg-emerald-400" />
          </div>
          <span className="text-xs font-bold text-[var(--color-text-subtle)]">Dashboard Kivora</span>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4 rounded-lg bg-[var(--color-primary)] p-5 text-white">
            <div>
              <p className="text-sm font-semibold text-white/78">Plano de hoje</p>
              <h3 className="mt-2 max-w-xs text-2xl font-bold leading-tight text-white">
                Pratique 18 minutos para manter sua evolução
              </h3>
            </div>
            <Image
              src="/brand/kivora-mark.png"
              alt=""
              aria-hidden="true"
              width={56}
              height={56}
              className="h-14 w-14 shrink-0 rounded-lg bg-white/12 p-2"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {dailyStats.map((stat) => (
              <div key={stat.label} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-4">
                <span className={`block h-2 w-10 rounded-full ${stat.tone}`} />
                <p className="mt-3 text-xs font-bold text-[var(--color-text-subtle)]">{stat.label}</p>
                <p className="mt-1 text-lg font-bold text-[var(--color-text)]">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-container-lowest)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-[var(--color-text-subtle)]">Trilha recomendada</p>
                <h4 className="mt-1 text-base font-bold text-[var(--color-text)]">Inglês para conversas reais</h4>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                <BookOpen className="h-5 w-5" strokeWidth={2.3} />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {lessonItems.map((item) => (
                <div key={item.title}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold">
                    <span className="text-[var(--color-text-muted)]">{item.title}</span>
                    <span className="text-[var(--color-primary)]">{item.progress}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--color-surface-container)]">
                    <div
                      className="h-full rounded-full bg-[var(--color-primary)]"
                      style={{ width: item.progress }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-secondary-light)] p-4">
              <BarChart3 className="h-5 w-5 text-[var(--color-secondary)]" strokeWidth={2.3} />
              <span className="text-sm font-bold text-[var(--color-on-secondary-container)]">Progresso visível</span>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-accent-light)] p-4">
              <Trophy className="h-5 w-5 text-[var(--color-accent)]" strokeWidth={2.3} />
              <span className="text-sm font-bold text-[var(--color-accent)]">Conquistas semanais</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(135deg,#f7f8f6_0%,#e9f6f2_48%,#eef6ff_100%)] pt-28 dark:bg-[linear-gradient(135deg,#030712_0%,#052e2b_52%,#0f172a_100%)] sm:pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,color-mix(in_srgb,var(--color-primary)_22%,transparent)_1px,transparent_1px)] bg-[size:18px_18px] opacity-25" />

      <div className="relative mx-auto grid w-full max-w-[var(--page-width)] items-center gap-10 px-4 pb-16 sm:px-6 sm:pb-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-white/70 px-3 py-2 text-sm font-bold text-[var(--color-primary)] shadow-[var(--shadow-sm)] dark:bg-gray-900/70 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4" strokeWidth={2.4} />
            Inglês com prática guiada todos os dias
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-normal text-[var(--color-text)] sm:text-5xl lg:text-6xl">
            Aprenda inglês com uma rotina clara, prática e feita para evoluir.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-text-muted)]">
            O Kivora English combina trilhas por nível, exercícios interativos e acompanhamento de progresso para transformar estudo em hábito.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[var(--color-primary)] px-6 text-base font-bold text-white shadow-[0_16px_34px_color-mix(in_srgb,var(--color-primary)_22%,transparent)] hover:-translate-y-0.5 hover:brightness-105"
            >
              Começar agora grátis
              <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
            </Link>
            <Link
              href="#como-funciona"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-white/75 px-6 text-base font-bold text-[var(--color-primary)] shadow-[var(--shadow-sm)] hover:bg-white dark:bg-gray-900/75 dark:text-emerald-300 dark:hover:bg-gray-800"
            >
              <PlayCircle className="h-5 w-5" strokeWidth={2.2} />
              Ver como funciona
            </Link>
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-2xl font-extrabold text-[var(--color-text)]">5+</p>
              <p className="mt-1 leading-5 text-[var(--color-text-muted)]">modos de prática</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[var(--color-text)]">24/7</p>
              <p className="mt-1 leading-5 text-[var(--color-text-muted)]">acesso online</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[var(--color-text)]">A1-C1</p>
              <p className="mt-1 leading-5 text-[var(--color-text-muted)]">trilhas por nível</p>
            </div>
          </div>
        </div>

        <DashboardMockup />
      </div>
    </section>
  )
}
