import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'
import { BookOpen, Sparkles, Plus, Check, Info } from 'lucide-react'
import { getDynamicPackCoverUrl } from '@/lib/cloudinary'
import { subscribeToPack } from '@/app/actions'
import Link from 'next/link'

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

  const subscribedPackIds = new Set(assignments?.map(a => a.pack_id))

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12 animate-fade-in">
      <header className="premium-card p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <Sparkles className="h-64 w-64 text-[var(--color-primary)]" />
        </div>
        
        <div className="relative z-10">
          <p className="section-kicker">Marketplace da Comunidade</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-extrabold text-[var(--color-text)] tracking-tight">
            Explore Novos Mundos
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-[var(--color-text-muted)] leading-relaxed">
            Descubra pacotes de estudo criados pela comunidade e pela nossa Inteligência Artificial. 
            Escolha um tema que te interessa e comece a praticar agora mesmo.
          </p>
        </div>
      </header>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-[var(--color-primary)]" />
            Pacotes Disponíveis
          </h2>
          <div className="text-sm text-[var(--color-text-subtle)] font-medium">
            {packs?.length || 0} pacotes encontrados
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packs && packs.length > 0 ? (
            packs.map((pack) => {
              const isSubscribed = subscribedPackIds.has(pack.id)
              const coverUrl = pack.cover_url || getDynamicPackCoverUrl(pack.name)

              return (
                <div 
                  key={pack.id} 
                  className="premium-card group overflow-hidden flex flex-col h-full hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 active:scale-[0.98] border border-[var(--color-border)]/50"
                >
                  <div className="relative h-48 w-full overflow-hidden bg-[var(--color-surface-container-high)]">
                    <Image 
                      src={coverUrl} 
                      alt={pack.name} 
                      fill 
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-white border border-white/20">
                        {pack.level || 'Básico'}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-bold text-[var(--color-text)] leading-tight group-hover:text-[var(--color-primary)] transition-colors">
                      {pack.name}
                    </h3>
                    <p className="mt-3 text-sm text-[var(--color-text-muted)] line-clamp-2 flex-1 leading-relaxed">
                      {pack.description || 'Sem descrição disponível para este pacote.'}
                    </p>

                    <div className="mt-6 pt-5 border-t border-[var(--color-border)]/30 flex items-center justify-between gap-3">
                      {isSubscribed ? (
                        <div className="flex items-center gap-2 text-[var(--color-primary)] font-bold text-sm bg-[var(--color-primary-container)]/30 px-4 py-2 rounded-xl">
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
                            Adicionar aos Estudos
                          </button>
                        </form>
                      )}
                      
                      <Link 
                        href={`/explore/pack/${pack.id}`}
                        className="p-3 rounded-xl bg-[var(--color-surface-container)] text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] hover:bg-[var(--color-surface-container-high)] transition-all"
                        title="Ver detalhes"
                      >
                        <Info className="h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full py-20 text-center">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-surface-container)] text-[var(--color-text-subtle)] mb-6">
                <BookOpen className="h-10 w-10 opacity-20" />
              </div>
              <h3 className="text-xl font-bold text-[var(--color-text)]">Nenhum pacote encontrado</h3>
              <p className="mt-2 text-[var(--color-text-muted)]">Volte mais tarde para ver novas sugestões.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
