import { Loader2 } from 'lucide-react'
import { cardClass } from '@/features/profile/lib/libraryUi'

const glassTile = cardClass

function StatSkeleton() {
  return (
    <div className="flex items-center gap-2.5 rounded-[13px] border-2 border-brand-dark/20 bg-bg-primary px-3 py-2.5">
      <div className="h-4 w-4 shrink-0 rounded border-2 border-brand-dark/20 bg-bg-card" />
      <div className="h-4 w-28 rounded-lg border-2 border-brand-dark/20 bg-bg-card" />
    </div>
  )
}

export default function Loading() {
  return (
    <div className="home-mobile-optimized gerador-root landing-light relative -mx-4 -my-6 overflow-x-hidden bg-bg-primary px-4 py-6 pb-12 font-body text-brand-dark sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto max-w-6xl animate-pulse space-y-8 pb-12">
        {/* Espelha o cabeçalho real: trilha, pílula, título, uma linha de apoio e três itens.
            Antes este esqueleto desenhava o header antigo — botão de voltar, duas colunas e um
            bloco de 16rem para a ilustração —, então a página piscava alta e encolhia ao montar. */}
        <div className={`${glassTile} overflow-hidden p-5 sm:p-8`}>
          <div className="h-4 w-40 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          <div className="mt-3 h-7 w-48 rounded-full border-2 border-brand-dark/20 bg-bg-primary" />
          <div className="mt-4 h-10 w-56 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          <div className="mt-2 h-10 w-full max-w-xl rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          <div className="mt-5 grid gap-2 sm:grid-cols-3">
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className={`${glassTile} space-y-4 p-5 sm:p-6`}>
            <div className="h-6 w-32 rounded-full border-2 border-brand-dark/20 bg-bg-primary" />
            <div className="h-8 w-40 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
            <div className="h-12 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
            <div className="h-24 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="h-12 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
              <div className="h-12 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
            </div>
            <div className="h-28 rounded-xl border-2 border-brand-dark/20 bg-bg-primary" />
            <div className="h-12 rounded-lg border-2 border-brand-dark/20 bg-bg-primary" />
          </div>

          <div className="space-y-4">
            <div className={`${glassTile} space-y-3 p-5`}>
              <div className="h-6 w-20 rounded-full border-2 border-brand-dark/20 bg-bg-primary" />
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-12 rounded-xl border-2 border-brand-dark/20 bg-bg-primary" />
              ))}
            </div>
            <div className={`${glassTile} h-36 p-5`} />
          </div>
        </div>

        <div className="flex justify-center py-2">
          <Loader2 className="h-6 w-6 animate-spin text-brand-dark" />
        </div>
      </div>
    </div>
  )
}