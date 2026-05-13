import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { BookOpen, Check, ChevronRight, Filter, Sparkles, Plus, Layers3, Wand2, BookMarked } from 'lucide-react'
import { getDynamicPackCoverUrl } from '@/lib/cloudinary'
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
    <div className="mx-auto max-w-6xl space-y-8 pb-12 animate-fade-in">
      <header className="premium-card relative overflow-hidden p-6 sm:p-8 lg:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="relative z-10">
            <div className="mb-5 flex flex-wrap items-center gap-2">
              <span className="stitch-pill bg-[var(--color-primary-container)] text-[var(--color-primary)]">
                Marketplace
              </span>
              <p className="section-kicker">Pacotes prontos para estudar</p>
            </div>
            <h1 className="max-w-2xl text-4xl font-black tracking-tight text-[var(--color-text)] sm:text-5xl">
              Explore novos pacotes sem perder tempo
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-[var(--color-text-muted)] sm:text-lg">
              Encontre pacotes públicos da comunidade e da IA, compare o nível antes de abrir e entre direto no que faz sentido para seu momento.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/home" className="btn-primary">
                <BookOpen className="h-4 w-4" />
                Ir para a home
              </Link>
              <Link href="#packs" className="btn-ghost">
                <Filter className="h-4 w-4" />
                Ver pacotes
              </Link>
            </div>
          </div>

          <div className="relative z-10 overflow-hidden rounded-[1.6rem] border border-[var(--color-border)]/35 bg-[var(--color-surface-container-low)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">Destaque</p>
                <h2 className="mt-3 text-2xl font-extrabold text-[var(--color-text)]">
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

            <div className="mt-5 rounded-[1.25rem] bg-[var(--color-surface-container-lowest)] p-4">
              <Image
                src="/images/home/undraw-online-learning.svg"
                alt="Ilustração de descoberta de pacotes de estudo"
                width={692}
                height={500}
                unoptimized
                className="h-auto w-full max-w-sm object-contain"
              />
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="stitch-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Total</p>
              <p className="mt-4 text-3xl font-black text-[var(--color-text)]">{typedPacks.length}</p>
            </div>
            <Layers3 className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">Pacotes públicos disponíveis para assinar.</p>
        </article>
        <article className="stitch-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Inscritos</p>
              <p className="mt-4 text-3xl font-black text-[var(--color-primary)]">{subscribedCount}</p>
            </div>
            <BookMarked className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">Pacotes já adicionados aos seus estudos.</p>
        </article>
        <article className="stitch-panel p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="section-kicker">Entrada fácil</p>
              <p className="mt-4 text-3xl font-black text-[var(--color-text)]">{beginnerCount}</p>
            </div>
            <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">Pacotes com foco A1-A2 para começar sem atrito.</p>
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

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {typedPacks.length > 0 ? (
            typedPacks.map((pack) => {
              const isSubscribed = subscribedPackIds.has(pack.id)
              const coverUrl = pack.cover_url || getDynamicPackCoverUrl(pack.name)

              return (
                <article
                  key={pack.id}
                  className="premium-card group flex h-full flex-col overflow-hidden border border-[var(--color-border)]/50 transition-all duration-500 hover:-translate-y-1 hover:shadow-[var(--shadow-xl)] active:scale-[0.99]"
                >
                  <div className="relative h-52 w-full overflow-hidden bg-[var(--color-surface-container-high)]">
                    <Image
                      src={coverUrl}
                      alt={pack.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                          {pack.level || 'Básico'}
                        </span>
                        <span className="rounded-full bg-white/12 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                          {isSubscribed ? 'Assinado' : 'Livre'}
                        </span>
                      </div>
                      <h3 className="mt-3 text-xl font-black leading-tight text-white">
                        {pack.name}
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-sm leading-relaxed text-[var(--color-text-muted)] line-clamp-3">
                      {pack.description || 'Sem descrição disponível para este pacote.'}
                    </p>

                    <div className="mt-6 flex items-center justify-between gap-3 border-t border-[var(--color-border)]/30 pt-5">
                      {isSubscribed ? (
                        <div className="flex items-center gap-2 rounded-xl bg-[var(--color-primary-container)]/30 px-4 py-2 text-sm font-bold text-[var(--color-primary)]">
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
                            className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm shadow-md group-hover:shadow-lg transition-all"
                          >
                            <Plus className="h-4 w-4" />
                            Adicionar
                          </button>
                        </form>
                      )}

                      <Link
                        href={`/explore/pack/${pack.id}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-container)] text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-primary)]"
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
