import PageLoadingSkeleton from '@/components/ui/PageLoadingSkeleton'

/**
 * Skeleton raiz — o primeiro pixel que a pessoa vê ao abrir o app.
 *
 * Diferente dos outros `loading.tsx`, este roda FORA do layout do dashboard, então precisa trazer
 * o próprio `<main>` com a moldura da página. O conteúdo é o mesmo skeleton de todo o resto do
 * site: quem abre o app e quem navega entre seções vê exatamente a mesma coisa.
 */
export default function Loading() {
  return (
    <main className="landing-light min-h-screen min-h-[100svh] bg-bg-primary px-4 py-6 font-body sm:px-6 sm:py-8">
      <div className="mx-auto w-full max-w-6xl">
        <PageLoadingSkeleton />
      </div>
    </main>
  )
}
