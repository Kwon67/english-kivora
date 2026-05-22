import Image from 'next/image'
import BrandMark from '@/components/ui/BrandMark'
import LoginHeroIllustration from '@/features/auth/components/LoginHeroIllustration'
import LoginForm from '@/features/auth/components/LoginForm'

const loginHighlights = [
  { label: 'SRS', value: 'Revisão inteligente' },
  { label: 'Arena', value: 'Ritmo competitivo' },
  { label: 'Voz', value: 'Prática guiada' },
]

export default function LoginPage() {
  return (
    <div className="app-shell grid min-h-[100svh] overflow-hidden bg-[radial-gradient(circle_at_82%_14%,rgba(244,189,117,0.16),transparent_26%),linear-gradient(135deg,var(--color-surface-container-lowest)_0%,var(--color-surface)_48%,var(--color-surface-container-high)_100%)] lg:grid-cols-[minmax(0,1.08fr)_minmax(26rem,0.92fr)]">
      <section className="relative flex min-h-[58svh] flex-col overflow-hidden bg-[radial-gradient(circle_at_22%_14%,rgba(244,189,117,0.42),transparent_25%),radial-gradient(circle_at_78%_80%,rgba(255,255,255,0.18),transparent_26%),linear-gradient(145deg,#12352e_0%,#276356_50%,#233f3b_100%)] px-6 py-7 text-[var(--color-on-primary)] sm:px-8 lg:min-h-[100svh] lg:px-12 lg:py-12 xl:px-16">
        <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(7,24,21,0.16),rgba(7,24,21,0.58))]" />
        <div className="absolute left-6 top-24 h-40 w-px bg-gradient-to-b from-transparent via-white/34 to-transparent sm:left-8 lg:left-12 xl:left-16" />
        <div className="absolute -right-20 top-10 h-72 w-72 rounded-full border border-white/12" />
        <div className="absolute -bottom-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-black/12 blur-3xl" />

        <div className="relative z-10">
          <BrandMark key="login-brandmark" tone="light" subtitle="O Santuário Acadêmico" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col justify-center gap-8 py-9 lg:gap-10 lg:py-12">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-white/20 bg-white/12 px-4 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-white/84 shadow-[0_12px_32px_rgba(0,0,0,0.12)] backdrop-blur-md">
              Treino diário premium
            </span>
            <h1 className="mt-6 max-w-2xl text-5xl font-black leading-[0.98] text-[var(--color-on-primary)] sm:text-6xl lg:text-7xl">
              Inglês que parece ritual, não tarefa.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[var(--color-on-primary)]/82 sm:text-lg">
              Uma rotina visualmente limpa para revisar no momento certo, treinar fala e escuta, disputar desafios e enxergar progresso real.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[38rem] lg:mx-0 lg:max-w-[45rem]">
            <div className="absolute -inset-4 rounded-[1.75rem] border border-white/8" />
            <div className="absolute inset-x-12 bottom-0 h-20 rounded-full bg-black/24 blur-3xl" />
            <LoginHeroIllustration />
          </div>
        </div>

        <div className="relative z-10 grid gap-px overflow-hidden rounded-[1rem] border border-white/14 bg-white/14 text-white/82 shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-md sm:grid-cols-3">
          {loginHighlights.map((item) => (
            <div key={item.label} className="bg-white/8 p-4">
              <p className="text-xl font-black text-white">{item.label}</p>
              <p className="mt-1 text-xs font-semibold leading-relaxed">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative flex items-center justify-center px-6 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.7),rgba(255,255,255,0))] dark:hidden" />
        <div className="absolute inset-0 opacity-[0.28] [background-image:radial-gradient(circle_at_center,color-mix(in_srgb,var(--color-primary)_34%,transparent)_1px,transparent_1px)] [background-size:18px_18px]" />
        <div className="relative w-full max-w-md">
          <div className="space-y-2 text-center lg:text-left">
            <p className="section-kicker">Acesso</p>
            <h2 className="mt-5 text-4xl font-black leading-tight text-[var(--color-text)] sm:text-5xl">
              Bem-vindo de volta
            </h2>
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
              Entre no seu espaço Kivora para continuar exatamente de onde parou.
            </p>
          </div>

          <figure className="pointer-events-none mx-auto mt-6 w-full max-w-[10rem] lg:ml-auto lg:mr-0 lg:max-w-[11rem]">
            <Image
              src="/images/login/undraw-access-account.svg"
              alt=""
              width={420}
              height={300}
              className="h-auto w-full object-contain drop-shadow-[0_18px_34px_rgba(24,32,29,0.10)]"
            />
          </figure>

          <div className="premium-card mt-8 border-[color-mix(in_srgb,var(--color-primary)_20%,transparent)] bg-[color-mix(in_srgb,var(--color-card)_92%,white)] p-5 shadow-[0_30px_90px_rgba(24,32,29,0.13)] sm:p-7 dark:border-[var(--color-border)] dark:bg-[var(--color-card)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.42)]">
            <LoginForm />
          </div>

          <div className="mt-6 flex items-center justify-center gap-3 text-xs font-semibold text-[var(--color-text-subtle)] lg:justify-start">
            <span className="h-px w-10 bg-[var(--color-border)]" />
            <span>Progresso, ranking e histórico sempre sincronizados.</span>
          </div>
        </div>
      </section>
    </div>
  )
}
