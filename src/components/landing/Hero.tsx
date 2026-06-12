import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BarChart3, BookOpen, CheckCircle2, PlayCircle, Trophy } from 'lucide-react'

const dailyStats = [
  { label: 'Meta diária', value: '86%', tone: 'bg-[#183b16] dark:bg-[#b8ff5c]' },
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
      <div className="absolute -left-4 top-8 hidden h-24 w-24 rounded-[18px] border border-dashed border-[#172113]/20 bg-[#f7f8ef]/70 shadow-[0_18px_48px_rgba(31,43,18,0.12)] dark:border-[#d5e6a9]/18 dark:bg-[#11160e]/70 sm:block" />
      <div className="absolute -right-3 bottom-12 hidden h-28 w-28 rounded-[18px] border border-dashed border-[#172113]/20 bg-[#eef3d6]/70 shadow-[0_18px_48px_rgba(31,43,18,0.12)] dark:border-[#d5e6a9]/18 dark:bg-[#1a2513]/70 sm:block" />

      <div className="relative overflow-hidden rounded-[22px] border border-[#172113]/20 bg-[#fbfcf2] shadow-[0_24px_70px_rgba(31,43,18,0.16)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_24px_70px_rgba(0,0,0,0.54)]">
        <div className="flex items-center justify-between border-b border-[#172113]/14 bg-[#eef3d6] px-4 py-3 dark:border-[#d5e6a9]/14 dark:bg-[#1a2513]">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-[#d4b85a]" />
            <span className="h-3 w-3 rounded-full bg-[#8d9e69]" />
            <span className="h-3 w-3 rounded-full bg-[#183b16] dark:bg-[#b8ff5c]" />
          </div>
          <span className="text-xs font-black uppercase tracking-[0.12em] text-[#5a664e] dark:text-[#9ea98b]">Dashboard Kivora</span>
        </div>

        <div className="grid gap-4 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4 rounded-[18px] bg-[#183b16] p-5 text-[#f7f8ef] dark:bg-[#0b1308]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.12em] text-[#dfe9bd] dark:text-[#b8ff5c]">Plano de hoje</p>
              <h3 className="mt-2 max-w-xs text-2xl font-bold leading-tight text-[#f7f8ef]">
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
              <div key={stat.label} className="rounded-[16px] border border-dashed border-[#172113]/20 bg-[#f7f8ef] p-4 dark:border-[#d5e6a9]/18 dark:bg-[#11160e]">
                <span className={`block h-2 w-10 rounded-full ${stat.tone}`} />
                <p className="mt-3 text-xs font-black uppercase tracking-[0.1em] text-[#5a664e] dark:text-[#9ea98b]">{stat.label}</p>
                <p className="mt-1 text-lg font-bold text-[#10130f] dark:text-[#f4f7e9]">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-[18px] border border-dashed border-[#172113]/20 bg-[#f7f8ef] p-4 dark:border-[#d5e6a9]/18 dark:bg-[#11160e]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#5a664e] dark:text-[#9ea98b]">Trilha recomendada</p>
                <h4 className="mt-1 text-base font-bold text-[#10130f] dark:text-[#f4f7e9]">Inglês para conversas reais</h4>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e3ecc2] text-[#183b16] dark:bg-[#1d2b14] dark:text-[#b8ff5c]">
                <BookOpen className="h-5 w-5" strokeWidth={2.3} />
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {lessonItems.map((item) => (
                <div key={item.title}>
                  <div className="mb-1 flex items-center justify-between gap-3 text-xs font-bold">
                    <span className="text-[#425039] dark:text-[#b9c3a4]">{item.title}</span>
                    <span className="text-[#183b16] dark:text-[#b8ff5c]">{item.progress}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#eef3d6] dark:bg-[#1a2513]">
                    <div
                      className="h-full rounded-full bg-[#183b16] dark:bg-[#b8ff5c]"
                      style={{ width: item.progress }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-[16px] border border-[#172113]/18 bg-[#eef3d6] p-4 dark:border-[#d5e6a9]/18 dark:bg-[#1a2513]">
              <BarChart3 className="h-5 w-5 text-[#183b16] dark:text-[#b8ff5c]" strokeWidth={2.3} />
              <span className="text-sm font-bold text-[#425039] dark:text-[#d5e6a9]">Progresso visível</span>
            </div>
            <div className="flex items-center gap-3 rounded-[16px] border border-[#172113]/18 bg-[#eef3d6] p-4 dark:border-[#d5e6a9]/18 dark:bg-[#1a2513]">
              <Trophy className="h-5 w-5 text-[#183b16] dark:text-[#b8ff5c]" strokeWidth={2.3} />
              <span className="text-sm font-bold text-[#425039] dark:text-[#d5e6a9]">Conquistas semanais</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#f4f5e8] pt-28 dark:bg-[#050704] sm:pt-32">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] bg-[size:28px_28px] opacity-[0.14] dark:opacity-[0.14]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_36%),linear-gradient(180deg,rgba(225,230,196,0.42),rgba(244,245,232,0.74)_58%,rgba(244,245,232,0))] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(184,255,92,0.16),transparent_30%),linear-gradient(135deg,rgba(24,59,22,0.38),transparent_62%)]" />

      <div className="relative mx-auto grid w-full max-w-[var(--page-width)] items-center gap-10 px-4 pb-16 sm:px-6 sm:pb-20 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-3 py-2 text-sm font-black text-[#183b16] shadow-[0_10px_24px_rgba(31,43,18,0.10)] dark:border-[#d5e6a9]/18 dark:bg-[#1d2b14] dark:text-[#b8ff5c]">
            <CheckCircle2 className="h-4 w-4" strokeWidth={2.4} />
            Inglês com prática guiada todos os dias
          </div>

          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-normal text-[#10130f] dark:text-[#f4f7e9] sm:text-5xl lg:text-6xl">
            Aprenda inglês com uma rotina clara, prática e feita para evoluir.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#425039] dark:text-[#b9c3a4]">
            O Kivora English combina trilhas por nível, exercícios interativos e acompanhamento de progresso para transformar estudo em hábito.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#183b16] px-6 text-base font-bold text-[#f7f8ef] shadow-[0_16px_34px_rgba(24,59,22,0.22)] transition-transform hover:-translate-y-0.5 hover:bg-[#24551d] dark:bg-[#b8ff5c] dark:text-[#050704] dark:hover:bg-[#cbff83]"
            >
              Começar agora grátis
              <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
            </Link>
            <Link
              href="#como-funciona"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-[#172113]/20 bg-[#eef3d6] px-6 text-base font-bold text-[#183b16] shadow-sm transition-colors hover:bg-[#dfe9bd] dark:border-[#d5e6a9]/20 dark:bg-[#1a2513] dark:text-[#b8ff5c] dark:hover:bg-[#243318]"
            >
              <PlayCircle className="h-5 w-5" strokeWidth={2.2} />
              Ver como funciona
            </Link>
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-2xl font-extrabold text-[#10130f] dark:text-[#f4f7e9]">5+</p>
              <p className="mt-1 leading-5 text-[#425039] dark:text-[#b9c3a4]">modos de prática</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#10130f] dark:text-[#f4f7e9]">24/7</p>
              <p className="mt-1 leading-5 text-[#425039] dark:text-[#b9c3a4]">acesso online</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-[#10130f] dark:text-[#f4f7e9]">A1-C1</p>
              <p className="mt-1 leading-5 text-[#425039] dark:text-[#b9c3a4]">trilhas por nível</p>
            </div>
          </div>
        </div>

        <DashboardMockup />
      </div>
    </section>
  )
}
