import {
  Skeleton,
  SkeletonSurface,
  SkeletonText,
} from '@/components/ui/RouteLoadingSkeleton'

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
export default function PageLoadingSkeleton({
  dashboard = false,
  admin = false,
}: {
  dashboard?: boolean
  admin?: boolean
}) {
  if (admin) return (
    <div className="space-y-6" role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Carregando administração</span>
      <div className="space-y-4 py-3">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="h-9 w-48 rounded-control" />
        <Skeleton className="h-4 w-80 max-w-full rounded-full" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => <SkeletonSurface key={i} className="p-5"><Skeleton className="h-3 w-16 rounded-full" /><Skeleton className="mt-4 h-6 w-12 rounded-control" /></SkeletonSurface>)}
      </div>
      <SkeletonSurface className="space-y-5 p-5 sm:p-7">
        <Skeleton className="h-6 w-44 rounded-control" />
        <Skeleton className="h-11 w-full rounded-control" />
        {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14 w-full rounded-control" />)}
      </SkeletonSurface>
    </div>
  )
  if (dashboard)
    return (
      <div
        className="space-y-6"
        role="status"
        aria-busy="true"
        aria-live="polite"
      >
        <span className="sr-only">Carregando seu espaço de aprendizado</span>
        <div className="space-y-3">
          <Skeleton className="h-3 w-40 rounded-full" />
          <Skeleton className="h-10 w-56 rounded-control" />
          <Skeleton className="h-4 w-64 max-w-full rounded-full" />
        </div>
        <div className="focus-main-grid">
          <SkeletonSurface className="min-h-72 p-7">
            <Skeleton className="h-4 w-32 rounded-full" />
            <Skeleton className="mt-6 h-9 w-3/4 rounded-control" />
            <SkeletonText lines={2} className="mt-5 max-w-sm" />
            <Skeleton className="mt-7 h-12 w-44 rounded-control" />
          </SkeletonSurface>
          <SkeletonSurface className="flex flex-col items-center justify-center gap-5 p-6">
            <Skeleton className="h-5 w-36 rounded-control" />
            <Skeleton className="h-28 w-28 rounded-full" />
            <Skeleton className="h-3 w-40 rounded-full" />
          </SkeletonSurface>
        </div>
        <Skeleton className="h-7 w-48 rounded-control" />
        <div className="focus-mode-grid">
          {[0, 1, 2].map((item) => (
            <SkeletonSurface key={item} className="min-h-28 p-6">
              <Skeleton className="h-12 w-12 rounded-control" />
              <Skeleton className="mt-7 h-6 w-3/4 rounded-control" />
              <SkeletonText lines={2} className="mt-4" />
              <Skeleton className="mt-7 h-3 w-full rounded-full" />
            </SkeletonSurface>
          ))}
        </div>
      </div>
    )
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
          <SkeletonSurface
            key={item}
            className="flex items-center gap-4 p-4 sm:p-5"
          >
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
