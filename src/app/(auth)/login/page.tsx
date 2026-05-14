import Image from 'next/image'
import BrandMark from '@/components/shared/BrandMark'
import LoginForm from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="app-shell grid min-h-[100svh] md:grid-cols-[minmax(0,1.05fr)_minmax(26rem,0.95fr)]">
      <section className="relative flex min-h-[42svh] flex-col justify-between overflow-hidden bg-[linear-gradient(145deg,#17463d_0%,#276356_52%,#315a86_100%)] px-6 py-7 text-[var(--color-on-primary)] sm:px-8 md:min-h-[100svh] md:px-12 md:py-12">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,35,30,0.04),rgba(8,35,30,0.42))]" />

        <div className="relative z-10">
          <BrandMark key="login-brandmark" tone="light" subtitle="O Santuário Acadêmico" />
        </div>

        <div className="relative z-10 my-10 grid gap-8 lg:grid-cols-[1fr_18rem] lg:items-end">
          <div className="max-w-xl">
            <span className="inline-flex rounded-[0.65rem] border border-white/18 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-white/82">
              Treino diário
            </span>
            <h1 className="mt-5 max-w-lg text-4xl font-black leading-tight text-[var(--color-on-primary)] sm:text-5xl">
              Inglês com rotina, jogo e progresso real.
            </h1>
            <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--color-on-primary)]/82 sm:text-lg">
              Entre para revisar no ritmo certo, praticar fala e escuta, disputar desafios e acompanhar sua evolução.
            </p>
          </div>

          <div className="hidden rounded-[1rem] border border-white/14 bg-white/10 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-md lg:block">
            <Image
              src="/images/home/undraw-online-learning.svg"
              alt="Ilustração de estudo online"
              width={692}
              height={500}
              unoptimized
              priority
              className="h-auto w-full object-contain"
            />
          </div>
        </div>

        <div className="relative z-10 grid gap-3 text-white/84 sm:grid-cols-3">
          <div className="rounded-[0.85rem] border border-white/12 bg-white/8 p-3">
            <p className="text-lg font-black text-white">SRS</p>
            <p className="mt-1 text-xs leading-relaxed">Revisões no momento certo.</p>
          </div>
          <div className="rounded-[0.85rem] border border-white/12 bg-white/8 p-3">
            <p className="text-lg font-black text-white">Arena</p>
            <p className="mt-1 text-xs leading-relaxed">Duelos para manter ritmo.</p>
          </div>
          <div className="rounded-[0.85rem] border border-white/12 bg-white/8 p-3">
            <p className="text-lg font-black text-white">Voz</p>
            <p className="mt-1 text-xs leading-relaxed">Treino de conversação guiado.</p>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-8 sm:px-8 md:px-12">
        <div className="w-full max-w-md">
          <div className="space-y-2">
            <p className="section-kicker">Acesso</p>
            <h2 className="mt-4 text-3xl font-black text-[var(--color-text)] sm:text-4xl">
              Bem-vindo de volta
            </h2>
            <p className="text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
              Use seu usuário Kivora ou email corporativo para continuar.
            </p>
          </div>

          <div className="premium-card mt-7 p-5 sm:p-6">
            <LoginForm />
          </div>

          <p className="mt-5 text-center text-xs leading-relaxed text-[var(--color-text-subtle)]">
            A plataforma salva seu progresso, ranking e histórico de revisão na sua conta.
          </p>
        </div>
      </section>
    </div>
  )
}
