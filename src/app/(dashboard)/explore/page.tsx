import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { BookOpen, Check, ChevronRight, Filter, Sparkles, Plus, Layers3, Wand2, BookMarked, GraduationCap } from 'lucide-react'
import { subscribeToPack } from '@/app/actions'
import Link from 'next/link'
import EmptyState from '@/components/shared/EmptyState'

type PackRow = {
  id: string
  name: string
  description: string | null
  level: string | null
  cover_url: string | null
}

const packArtwork = [
  '/images/home/undraw-studying.svg',
  '/images/home/undraw-online-learning.svg',
  '/images/arena/undraw-game-day.svg',
  '/images/home/undraw-learning-to-sketch.svg',
  '/images/home/undraw-sharing-knowledge.svg',
]

function getPackArtwork(index: number) {
  return packArtwork[index % packArtwork.length]
}

export default async function ExplorePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all public packs
  const { data: packs, error: packsError } = await supabase
    .from('packs')
    .select('id, name, description, level, cover_url')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (packsError) {
    console.error('Error fetching public packs:', packsError)
  }

  // Fetch current user assignments to check what they already have
  const { data: assignments } = await supabase
    .from('assignments')
    .select('pack_id, game_mode')
    .eq('user_id', user.id)

  const subscribedPackIds = new Set(assignments?.map((assignment) => assignment.pack_id))
  const typedPacks = (packs || []) as PackRow[]
  const subscribedCount = typedPacks.filter((pack) => subscribedPackIds.has(pack.id)).length
  const beginnerCount = typedPacks.filter((pack) => (pack.level || '').toUpperCase().includes('A1') || (pack.level || '').toUpperCase().includes('A2')).length
  const intermediateCount = typedPacks.filter((pack) => {
    const level = (pack.level || '').toUpperCase()
    return level.includes('B1') || level.includes('B2')
  }).length
  const featuredPack = typedPacks[0]

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12 animate-fade-in">
      <header className="premium-card relative overflow-hidden border-[var(--color-border)]/70 p-5 sm:p-7 lg:p-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="relative z-10">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="stitch-pill bg-[var(--color-primary-container)] text-[var(--color-primary)]">
                Marketplace
              </span>
              <p className="section-kicker">Pacotes prontos para estudar</p>
            </div>
            <h1 className="max-w-2xl text-3xl font-black leading-tight text-[var(--color-text)] sm:text-4xl">
              Encontre o próximo treino certo
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)] sm:text-base">
              Compare níveis, veja o que já está na sua rotina e adicione novos packs sem sair do fluxo de estudo.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/home" className="btn-primary">
                <BookOpen className="h-4 w-4" />
                Minha rotina
              </Link>
              <Link href="#packs" className="btn-ghost">
                <Filter className="h-4 w-4" />
                Ver catálogo
              </Link>
            </div>
          </div>

          <div className="relative z-10 overflow-hidden rounded-[1rem] border border-[var(--color-border)] bg-[linear-gradient(145deg,var(--color-surface-container-lowest),var(--color-primary-light))] p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">Destaque</p>
                <h2 className="mt-3 text-xl font-extrabold text-[var(--color-text)] sm:text-2xl">
                  {featuredPack?.name || 'Pacote em destaque'}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
                  {featuredPack?.description || 'Pacotes com visual mais claro e ações rápidas para começar agora.'}
                </p>
              </div>
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-[var(--color-primary-light)] text-[var(--color-primary)]">
                <Wand2 className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-5 rounded-[0.9rem] border border-white/60 bg-white/55 p-4 shadow-[var(--shadow-sm)]">
              <Image
                src="/images/home/undraw-sharing-knowledge.svg"
                alt="Ilustração de descoberta de pacotes de estudo"
                width={996}
                height={793}
                unoptimized
                priority
                className="mx-auto h-auto w-full max-w-xs object-contain"
              />
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="stitch-panel p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Total</p>
              <p className="mt-3 text-3xl font-black text-[var(--color-text)]">{typedPacks.length}</p>
            </div>
            <Layers3 className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Pacotes públicos disponíveis.</p>
        </article>
        <article className="stitch-panel p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Inscritos</p>
              <p className="mt-3 text-3xl font-black text-[var(--color-primary)]">{subscribedCount}</p>
            </div>
            <BookMarked className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Já adicionados à rotina.</p>
        </article>
        <article className="stitch-panel p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Entrada fácil</p>
              <p className="mt-3 text-3xl font-black text-[var(--color-text)]">{beginnerCount}</p>
            </div>
            <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">Foco A1-A2 para começar.</p>
        </article>
      </section>

      <section id="packs" className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Catálogo</p>
            <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">Pacotes disponíveis</h2>
          </div>
          <div className="text-sm font-semibold text-[var(--color-text-subtle)]">
            {intermediateCount} pacotes B1-B2 ou acima
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {typedPacks.length > 0 ? (
            typedPacks.map((pack, index) => {
              const isSubscribed = subscribedPackIds.has(pack.id)
              const coverUrl = getPackArtwork(index)

              return (
                <article
                  key={pack.id}
                  className="premium-card group flex h-full flex-col overflow-hidden border border-[var(--color-border)]/70 bg-[var(--color-card)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--color-border-hover)] hover:shadow-[var(--shadow-lg)] active:scale-[0.99]"
                >
                  <div className="relative min-h-36 overflow-hidden border-b border-[var(--color-border)]/50 bg-[linear-gradient(145deg,var(--color-primary-light),var(--color-secondary-light))] p-4 sm:min-h-40">
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,transparent,rgba(24,32,29,0.16))]" />
                    <div className="relative z-10 flex items-start justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-[0.6rem] bg-white/72 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-primary)] shadow-[var(--shadow-sm)] backdrop-blur-md">
                          {pack.level || 'Básico'}
                        </span>
                        <span className="rounded-[0.6rem] bg-white/72 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-text-muted)] shadow-[var(--shadow-sm)] backdrop-blur-md">
                          {isSubscribed ? 'Assinado' : 'Livre'}
                        </span>
                      </div>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.75rem] bg-white/72 text-[var(--color-primary)] shadow-[var(--shadow-sm)] backdrop-blur-md">
                        <GraduationCap className="h-4 w-4" />
                      </span>
                    </div>

                    <Image
                      src={coverUrl}
                      alt=""
                      width={996}
                      height={793}
                      unoptimized
                      className="absolute bottom-0 right-2 h-28 w-32 object-contain opacity-90 transition-transform duration-500 group-hover:scale-105 sm:h-32 sm:w-36"
                    />

                    <div className="relative z-10 mt-10 max-w-[68%] sm:mt-12">
                      <h3 className="line-clamp-2 text-xl font-black leading-tight text-[var(--color-text)]">
                        {pack.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4 sm:p-5">
                    <p className="min-h-10 text-sm leading-relaxed text-[var(--color-text-muted)] line-clamp-2">
                      {pack.description || 'Sem descrição disponível para este pacote.'}
                    </p>

                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--color-border)]/40 pt-4">
                      {isSubscribed ? (
                        <div className="inline-flex min-h-11 items-center gap-2 rounded-[0.75rem] bg-[var(--color-primary-container)] px-3 py-2 text-sm font-bold text-[var(--color-on-primary-container)]">
                          <Check className="h-4 w-4" />
                          Já inscrito
                        </div>
                      ) : (
                        <form action={async () => {
                          'use server'
                          await subscribeToPack(pack.id, 'flashcard')
                        }} className="w-full">
                          <button
                            type="submit"
                            className="btn-primary flex w-full items-center justify-center gap-2 text-sm"
                          >
                            <Plus className="h-4 w-4" />
                            Adicionar
                          </button>
                        </form>
                      )}

                      <Link
                        href={`/explore/pack/${pack.id}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.75rem] bg-[var(--color-surface-container)] text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-primary)]"
                        aria-label={`Abrir detalhes de ${pack.name}`}
                        title="Ver detalhes"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </article>
              )
            })
          ) : (
            <EmptyState
              imageSrc="/images/home/undraw-online-learning.svg"
              imageAlt="Ilustração unDraw para catálogo sem pacotes"
              title="Nenhum pacote encontrado"
              description="Volte mais tarde para ver novas sugestões."
              variant="default"
              className="col-span-full"
              imageClassName="max-w-48"
            />
          )}
        </div>
      </section>
    </div>
  )
}
