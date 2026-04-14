import { ArrowRight, Brain, CheckCircle2, Sparkles, Target } from 'lucide-react'
import BrandMark from '@/components/shared/BrandMark'
import LoginForm from '@/components/auth/LoginForm'

const highlights = [
  {
    icon: Brain,
    title: 'Retenção mais forte',
    text: 'Revisão espaçada e repetição inteligente para segurar vocabulário por mais tempo.',
  },
  {
    icon: Target,
    title: 'Treino com foco',
    text: 'Lições curtas, modos variados e feedback rápido para criar ritmo diário.',
  },
  {
    icon: Sparkles,
    title: 'Progresso legível',
    text: 'Histórico, ofensiva e sinais visuais claros para manter constância sem ruído.',
  },
]

export default function LoginPage() {
  return (
    <div className="app-shell min-h-[100svh] px-4 py-4 sm:px-6 sm:py-6">
      <div className="mx-auto grid min-h-[calc(100svh-2rem)] max-w-[var(--page-width)] gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-hero relative hidden overflow-hidden p-8 lg:flex lg:flex-col lg:justify-between xl:p-10">
          <div className="relative z-10">
            <BrandMark subtitle="Daily Fluency Lab" />
          </div>

          <div className="relative z-10 max-w-2xl">
            <div className="section-kicker">English performance studio</div>
            <h1 className="mt-6 max-w-3xl text-responsive-xl font-semibold text-[var(--color-text)]">
              Treino de inglês com mais ritmo, clareza e presença visual.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-text-muted)]">
              A Kivora agora ganha uma interface mais premium para estudo diário:
              menos cara de sistema interno, mais cara de produto bem resolvido.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {highlights.map((item) => {
                const Icon = item.icon

                return (
                  <div key={item.title} className="metric-tile">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] text-[var(--color-text)]">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <h2 className="text-xl font-semibold text-[var(--color-text)]">{item.title}</h2>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                      {item.text}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="relative z-10 grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-subtle)]">
                New visual language
              </p>
              <div className="mt-4 rounded-[28px] bg-[linear-gradient(135deg,rgba(43,122,11,0.14),rgba(29,78,216,0.1),rgba(234,88,12,0.12))] p-5">
                <svg
                  aria-hidden="true"
                  className="h-auto w-full"
                  viewBox="0 0 360 190"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect x="12" y="16" width="336" height="158" rx="30" fill="rgba(255,255,255,0.55)" />
                  <path d="M48 62C79 43 109 34 140 34C181 34 217 47 250 73" stroke="#2B7A0B" strokeWidth="8" strokeLinecap="round" />
                  <path d="M44 97C84 77 124 67 164 67C206 67 242 78 284 102" stroke="#1f5f08" strokeWidth="8" strokeLinecap="round" />
                  <path d="M62 132C95 118 127 111 159 111C198 111 232 120 266 138" stroke="#1f5f08" strokeWidth="8" strokeLinecap="round" />
                  <circle cx="66" cy="132" r="11" fill="#112033" />
                  <circle cx="283" cy="102" r="10" fill="#2B7A0B" fillOpacity="0.22" />
                  <circle cx="248" cy="73" r="8" fill="#1f5f08" fillOpacity="0.18" />
                </svg>
              </div>
            </div>

            <div className="card p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--color-text-subtle)]">
                What changes
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-start gap-3 rounded-[22px] bg-white/72 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" strokeWidth={2.2} />
                  <div>
                    <p className="font-semibold text-[var(--color-text)]">Superficies com mais profundidade</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      Camadas claras, contraste melhor e menos UI genérica.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-[22px] bg-white/72 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--color-primary)]" strokeWidth={2.2} />
                  <div>
                    <p className="font-semibold text-[var(--color-text)]">SVG e grafismos próprios</p>
                    <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                      Nada de emoji e nada de imagem aleatória puxada da internet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center">
          <div className="premium-card w-full max-w-xl animate-fade-in p-6 sm:p-8 lg:p-10">
            <div className="mb-8 flex items-start justify-between gap-4">
              <div>
                <BrandMark className="lg:hidden" subtitle="Daily Fluency Lab" />
                <div className="section-kicker mt-4 lg:mt-0">Entrar na plataforma</div>
                <h1 className="mt-4 text-4xl font-semibold text-[var(--color-text)] sm:text-5xl">
                  Volte para o seu fluxo.
                </h1>
                <p className="mt-3 max-w-md text-base leading-relaxed text-[var(--color-text-muted)]">
                  Entre com seu usuário para acessar tarefas, revisões e desempenho em inglês.
                </p>
              </div>
              <div className="hidden h-14 w-14 items-center justify-center rounded-[22px] bg-[linear-gradient(135deg,var(--color-primary-light),var(--color-secondary-light))] text-[var(--color-text)] sm:flex">
                <ArrowRight className="h-6 w-6" strokeWidth={2.1} />
              </div>
            </div>

            <LoginForm />
          </div>
        </section>
      </div>
    </div>
  )
}
