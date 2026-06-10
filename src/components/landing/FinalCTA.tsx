import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

export default function FinalCTA() {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto w-full max-w-[var(--page-width)] px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-xl bg-[linear-gradient(135deg,var(--color-primary)_0%,#315a86_100%)] px-6 py-12 text-center shadow-[var(--shadow-xl)] sm:px-10 lg:px-16">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/14 text-white">
            <CheckCircle2 className="h-7 w-7" strokeWidth={2.4} />
          </div>
          <h2 className="mx-auto mt-6 max-w-3xl text-3xl font-extrabold tracking-normal text-white sm:text-4xl">
            Comece sua jornada no inglês hoje
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-white/82">
            Dê o primeiro passo com uma plataforma feita para guiar sua prática e mostrar sua evolução.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/register"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-white px-7 text-base font-extrabold text-[var(--color-primary)] shadow-[0_18px_40px_rgba(0,0,0,0.18)] hover:-translate-y-0.5"
            >
              Criar conta gratuita
              <ArrowRight className="h-5 w-5" strokeWidth={2.4} />
            </Link>
          </div>
          <p className="mt-5 text-sm font-semibold text-white/78">Sem cartão de crédito. Comece em minutos.</p>
        </div>
      </div>
    </section>
  )
}
