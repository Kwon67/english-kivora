import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { BookOpen, Plus, Check, ArrowLeft, Layers, Trophy } from 'lucide-react'
import { getDynamicPackCoverUrl } from '@/lib/cloudinary'
import { subscribeToPack } from '@/app/actions'
import Link from 'next/link'

export default async function PackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pack, error } = await supabase
    .from('packs')
    .select('id, name, description, level, cover_url, created_at')
    .eq('id', id)
    .single()

  if (error || !pack) notFound()

  // Fetch a sample of cards to show what's inside
  const { data: cards } = await supabase
    .from('cards')
    .select('english_phrase, portuguese_translation')
    .eq('pack_id', pack.id)
    .limit(5)

  // Check subscription
  const { data: assignment } = await supabase
    .from('assignments')
    .select('id')
    .eq('user_id', user.id)
    .eq('pack_id', pack.id)
    .maybeSingle()

  const isSubscribed = !!assignment
  const coverUrl = pack.cover_url || getDynamicPackCoverUrl(pack.name)

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12 animate-fade-in">
      <Link 
        href="/explore" 
        className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-subtle)] hover:text-[var(--color-primary)] transition-colors group"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
        Voltar para o Marketplace
      </Link>

      <div className="premium-card overflow-hidden">
        <div className="relative h-64 sm:h-80 w-full">
          <Image src={coverUrl} alt={pack.name} fill className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-surface)] via-transparent to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6">
            <span className="px-3 py-1 rounded-full bg-[var(--color-primary)] text-[10px] font-black uppercase tracking-widest text-[var(--color-on-primary)]">
              {pack.level || 'Básico'}
            </span>
            <h1 className="mt-4 text-3xl sm:text-4xl font-black text-[var(--color-text)] tracking-tight">
              {pack.name}
            </h1>
          </div>
        </div>

        <div className="p-6 sm:p-8 grid gap-8 md:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-[var(--color-text-subtle)] mb-3">Sobre este pacote</h2>
              <p className="text-base text-[var(--color-text-muted)] leading-relaxed">
                {pack.description || 'Este pacote foi cuidadosamente selecionado para ajudar no seu progresso. Pratique frases reais e naturais para acelerar sua fluência.'}
              </p>
            </section>

            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-[var(--color-text-subtle)] mb-4 flex items-center gap-2">
                <Layers className="h-4 w-4" />
                O que você vai aprender (amostra)
              </h2>
              <div className="space-y-3">
                {cards?.map((card, i) => (
                  <div key={i} className="p-4 rounded-xl bg-[var(--color-surface-container-low)] border border-[var(--color-border)]/30">
                    <p className="font-bold text-[var(--color-text)]">{card.english_phrase}</p>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1">{card.portuguese_translation}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <div className="stitch-panel p-6 bg-[var(--color-surface-container)] border-none shadow-none">
              <h3 className="text-lg font-bold text-[var(--color-text)] mb-4">Seu Progresso</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-[var(--color-surface-container-high)] flex items-center justify-center text-[var(--color-primary)]">
                    <Trophy className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-subtle)]">Status</p>
                    <p className="text-sm font-bold text-[var(--color-text)]">{isSubscribed ? 'Inscrito' : 'Não iniciado'}</p>
                  </div>
                </div>

                {isSubscribed ? (
                  <div className="rounded-xl bg-[rgba(70,98,89,0.1)] p-4 border border-[var(--color-primary)]/20 text-center">
                    <p className="text-xs font-bold text-[var(--color-primary)] flex items-center justify-center gap-2">
                      <Check className="h-4 w-4" />
                      Pronto para estudar!
                    </p>
                    <Link href="/home" className="btn-ghost w-full mt-3 text-xs">
                      Ir para meus estudos
                    </Link>
                  </div>
                ) : (
                  <form action={async () => {
                    'use server'
                    await subscribeToPack(pack.id, 'flashcard')
                  }}>
                    <button type="submit" className="btn-primary w-full py-4 text-base shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
                      <Plus className="h-5 w-5" />
                      Assinar Pacote
                    </button>
                  </form>
                )}
              </div>
            </div>

            <div className="premium-card p-6 border-none bg-gradient-to-br from-[var(--color-primary)]/10 to-transparent">
              <div className="flex items-center gap-2 text-[var(--color-primary)] mb-2">
                <BookOpen className="h-4 w-4" />
                <span className="text-xs font-black uppercase tracking-widest">Dica</span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
                Ao assinar, este pacote aparecerá na sua tela inicial como uma tarefa pendente. Você pode escolher o modo de jogo na primeira vez que abrir.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
