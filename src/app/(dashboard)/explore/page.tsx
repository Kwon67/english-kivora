import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { BookOpen, Filter, Sparkles, Layers3, Wand2, BookMarked } from 'lucide-react'
import { subscribeToPack } from '@/app/actions'
import Link from 'next/link'
import SkillTree from './SkillTree'

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

        <SkillTree
          packs={typedPacks}
          subscribedPackIds={Array.from(subscribedPackIds)}
          packArtwork={packArtwork}
          subscribeAction={async (packId) => {
            'use server'
            await subscribeToPack(packId, 'flashcard')
          }}
        />
      </section>
    </div>
  )
}
