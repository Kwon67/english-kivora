import { Skeleton, SkeletonSurface, SkeletonText } from '@/components/ui/RouteLoadingSkeleton'

/**
 * O skeleton de carregamento do site inteiro.
 *
 * Antes havia 21 arquivos `loading.tsx`, cada um com o próprio desenho, e TRÊS definições
 * diferentes de skeleton com três cores de base — um cáqui esverdeado, um `brand-border/40` e o
 * do shimmer antigo. Cada rota carregava com uma cara diferente, e nenhuma delas parecia o app.
 *
 * Este componente é a única forma de carregamento do produto. A silhueta é a que o Kivora repete
 * em quase toda tela — cabeçalho, card de destaque, faixa de métricas e lista — então serve de
 * Início a Admin sem precisar de variante por rota. Skeleton não precisa adivinhar o conteúdo
 * exato: precisa ocupar o espaço certo para o conteúdo real chegar onde o olho já está.
 *
 * Regra para quem for mexer: se uma rota parecer precisar de um skeleton próprio, prefira ajustar
 * este. Uma segunda forma reabre exatamente a divergência que ele veio fechar.
 */
export default function PageLoadingSkeleton() {
  return (
    <div
      className="animate-fade-in space-y-4 pb-8"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Carregando</span>

      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-7 w-40 rounded-full" />
        <Skeleton className="h-10 w-24 rounded-control" />
      </div>

      <SkeletonSurface className="p-5 sm:p-7">
        <Skeleton className="h-11 w-11 rounded-control" />
        <Skeleton className="mt-5 h-6 w-32 rounded-full" />
        <Skeleton className="mt-4 h-9 w-3/4 max-w-md rounded-control" />
        <SkeletonText lines={2} className="mt-4 max-w-xl" />
        <Skeleton className="mt-6 h-12 w-full max-w-sm rounded-control" />
      </SkeletonSurface>

      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <SkeletonSurface key={item} className="p-5">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="mt-4 h-8 w-16 rounded-control" />
            <Skeleton className="mt-3 h-3.5 w-28 rounded-full" />
          </SkeletonSurface>
        ))}
      </div>

      <div className="space-y-3">
        {[0, 1, 2].map((item) => (
          <SkeletonSurface key={item} className="flex items-center gap-4 p-4 sm:p-5">
            <Skeleton className="h-12 w-12 shrink-0 rounded-control" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-24 rounded-full" />
              <Skeleton className="h-5 w-2/3 rounded-control" />
            </div>
            <Skeleton className="hidden h-10 w-28 shrink-0 rounded-control sm:block" />
          </SkeletonSurface>
        ))}
      </div>
    </div>
  )
}
