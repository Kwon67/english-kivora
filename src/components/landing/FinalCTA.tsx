import Link from 'next/link'

export default function FinalCTA() {
  return (
    <section className="border-t border-[#172113]/14 bg-transparent py-24 dark:border-[#d5e6a9]/16 dark:bg-transparent">
      <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
        <div className="rounded-[24px] border border-[#172113]/20 bg-[#f7f8ef] px-6 py-12 shadow-[0_18px_48px_rgba(31,43,18,0.12)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_20px_54px_rgba(0,0,0,0.5)] sm:px-10">
        <h2 className="text-4xl font-bold tracking-normal text-[#10130f] dark:text-[#f4f7e9] sm:text-5xl">
          Comece sua jornada no inglês hoje
        </h2>
        <p className="mx-auto mt-4 text-lg font-normal leading-8 text-[#425039] dark:text-[#b9c3a4]">
          Dê o primeiro passo com uma plataforma feita para guiar sua prática e mostrar sua evolução.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-full bg-[#183b16] px-8 py-4 text-base font-bold text-[#f7f8ef] shadow-[0_16px_34px_rgba(24,59,22,0.22)] transition-colors hover:bg-[#24551d] dark:bg-[#b8ff5c] dark:text-[#050704] dark:hover:bg-[#cbff83]"
          >
            Criar conta gratuita
          </Link>
        </div>
        <p className="mt-5 text-center text-sm text-[#5a664e] dark:text-[#9ea98b]">Sem cartão de crédito. Comece em minutos.</p>
        </div>
      </div>
    </section>
  )
}
