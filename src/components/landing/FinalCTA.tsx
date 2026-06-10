import Link from 'next/link'

export default function FinalCTA() {
  return (
    <section className="border-t border-[var(--color-border)] bg-[#F9FAFB] py-24">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <h2 className="text-4xl font-bold tracking-normal text-[#111827] sm:text-5xl">
          Comece sua jornada no inglês hoje
        </h2>
        <p className="mx-auto mt-4 text-lg font-normal leading-8 text-[#6B7280]">
          Dê o primeiro passo com uma plataforma feita para guiar sua prática e mostrar sua evolução.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-8 py-4 text-base font-bold text-white hover:bg-emerald-700"
          >
            Criar conta gratuita
          </Link>
        </div>
        <p className="mt-5 text-center text-sm text-gray-400">Sem cartão de crédito. Comece em minutos.</p>
      </div>
    </section>
  )
}
