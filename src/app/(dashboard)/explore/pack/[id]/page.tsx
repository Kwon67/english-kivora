import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { BookOpen, Plus, Check, ArrowLeft, Layers, Trophy, Folder } from 'lucide-react'
import { getDynamicPackCoverUrl } from '@/lib/cloudinary'
import { getPackFolderLabel } from '@/features/cards/lib/packFolders'
import { subscribeToPack } from '@/app/actions'
import Link from 'next/link'

const glassPanel =
  'home-glass-panel render-contained relative overflow-hidden rounded-[22px] border border-[#172113]/20 bg-[#fbfcf2] shadow-[0_18px_48px_rgba(31,43,18,0.14)] transition-colors duration-300 dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_20px_54px_rgba(0,0,0,0.5)]'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-[#183b16] dark:border-[#d5e6a9]/18 dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]'
const neutralBadge =
  'inline-flex items-center rounded-full border border-[#172113]/10 dark:border-[#d5e6a9]/10 bg-[#fbfcf2] dark:bg-[#11160e] px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-[#425039] dark:text-[#b9c3a4] shadow-sm'
const accentBadge =
  'inline-flex items-center rounded-full border border-[#183b16]/10 dark:border-[#b8ff5c]/10 bg-[#183b16]/5 dark:bg-[#b8ff5c]/5 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-[#183b16] dark:text-[#b8ff5c] shadow-sm'
const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#183b16] dark:bg-[#b8ff5c] w-full py-4 text-base font-bold text-[#f7f8ef] dark:text-[#050704] border border-dashed border-[#e3ecc2]/50 dark:border-[#b8ff5c]/25/50 shadow-[0px_8px_15px_0px_rgba(24,59,22,0.15)] transition-all hover:bg-[#24551d] dark:hover:bg-[#cbff83] active:scale-[0.985]'
const backLink =
  'group inline-flex w-fit items-center gap-2 rounded-full border border-dashed border-[#172113]/22 dark:border-[#d5e6a9]/20 bg-[#fbfcf2] dark:bg-[#11160e] px-4 py-2 text-sm font-bold text-[#425039] dark:text-[#b9c3a4] shadow-sm transition-colors hover:bg-[#183b16]/10 dark:hover:bg-[#b8ff5c]/10 hover:text-[#183b16] dark:hover:text-[#b8ff5c]'
const sampleCard =
  'p-4 rounded-[1.35rem] border border-[#172113]/15 dark:border-[#d5e6a9]/15 bg-[#fbfcf2] dark:bg-[#11160e]'
const iconContainer =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e3ecc2] text-[#183b16] dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]'

export default async function PackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pack, error } = await supabase
    .from('packs')
    .select('id, name, description, level, cover_url, category, created_at')
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
  const folderLabel = getPackFolderLabel(pack)

  return (
    <div className="home-mobile-optimized explorar-root relative -mx-4 -my-6 overflow-hidden bg-[#f4f5e8] px-4 py-6 pb-8 text-[#10130f] sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 dark:bg-[#0a0a0a] dark:text-[#f4f7e9]">
      <div className="home-bg-grid pointer-events-none absolute inset-0 z-0 opacity-[0.14] [background-image:linear-gradient(rgba(24,59,22,0.10)_1px,transparent_1px),linear-gradient(90deg,rgba(24,59,22,0.10)_1px,transparent_1px)] [background-size:28px_28px] dark:opacity-[0.14]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[30rem] bg-[radial-gradient(circle_at_18%_0%,rgba(223,233,189,0.55),transparent_36%),linear-gradient(180deg,rgba(225,230,196,0.42),rgba(244,245,232,0.74)_58%,rgba(244,245,232,0))] dark:bg-[radial-gradient(circle_at_18%_0%,rgba(184,255,92,0.16),transparent_30%),linear-gradient(135deg,rgba(24,59,22,0.38),transparent_62%)]" />

      <div className="relative z-10 mx-auto max-w-4xl space-y-8 pb-12 animate-fade-in">
        <Link 
          href="/explore" 
          className={backLink}
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Voltar para o Marketplace
        </Link>

        <div className={`${glassPanel} overflow-hidden p-0`}>
          <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
          <div className="relative h-64 sm:h-80 w-full">
            <Image src={coverUrl} alt={pack.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 896px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#f4f5e8] via-transparent to-transparent dark:from-[#0a0a0a]" />
            
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#172113]/15 dark:border-[#d5e6a9]/20 bg-[#fbfcf2]/90 dark:bg-[#11160e]/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#183b16] dark:text-[#b8ff5c] backdrop-blur-sm">
                  <Folder className="h-3 w-3" />
                  Pasta: {folderLabel}
                </span>
                <span className="px-3 py-1 rounded-full bg-[#183b16] dark:bg-[#b8ff5c] text-[10px] font-black uppercase tracking-widest text-[#f7f8ef] dark:text-[#050704]">
                  {pack.level || 'Básico'}
                </span>
              </div>
              <h1 className="mt-4 font-montserrat text-3xl sm:text-4xl font-bold text-[#10130f] dark:text-[#f4f7e9] tracking-tight">
                {pack.name}
              </h1>
            </div>
          </div>

          <div className="p-6 sm:p-8 grid gap-8 md:grid-cols-[1fr_300px] relative z-10">
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-black uppercase tracking-widest text-[#425039] dark:text-[#b9c3a4] mb-3">Sobre este pacote</h2>
                <p className="text-base text-[#425039] dark:text-[#b9c3a4] leading-relaxed">
                  {pack.description || 'Este pacote foi cuidadosamente selecionado para ajudar no seu progresso. Pratique frases reais e naturais para acelerar sua fluência.'}
                </p>
              </section>

              <section>
                <h2 className="text-sm font-black uppercase tracking-widest text-[#425039] dark:text-[#b9c3a4] mb-4 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  O que você vai aprender (amostra)
                </h2>
                <div className="space-y-3">
                  {cards?.map((card, i) => (
                    <div key={i} className={sampleCard}>
                      <p className="font-bold text-[#10130f] dark:text-[#f4f7e9]">{card.english_phrase}</p>
                      <p className="text-sm text-[#425039] dark:text-[#b9c3a4] mt-1">{card.portuguese_translation}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <div className={`${glassPanel} p-6`}>
                <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
                <h3 className="text-lg font-bold text-[#10130f] dark:text-[#f4f7e9] mb-4 relative z-10">Seu Progresso</h3>
                
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={iconContainer}>
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#425039] dark:text-[#b9c3a4]">Status</p>
                      <p className="text-sm font-bold text-[#10130f] dark:text-[#f4f7e9]">{isSubscribed ? 'Inscrito' : 'Não iniciado'}</p>
                    </div>
                  </div>

                  {isSubscribed ? (
                    <div className="rounded-xl border border-[#183b16]/15 dark:border-[#b8ff5c]/15 bg-[#183b16]/5 dark:bg-[#b8ff5c]/5 p-4 text-center">
                      <p className="text-xs font-bold text-[#183b16] dark:text-[#b8ff5c] flex items-center justify-center gap-2">
                        <Check className="h-4 w-4" />
                        Pronto para estudar!
                      </p>
                      <Link href="/home" className="inline-flex items-center justify-center gap-2 rounded-full border border-dashed border-[#172113]/22 dark:border-[#d5e6a9]/20 bg-[#fbfcf2] dark:bg-[#11160e] px-4 py-2 text-xs font-bold text-[#425039] dark:text-[#b9c3a4] shadow-sm transition-colors hover:bg-[#183b16]/10 dark:hover:bg-[#b8ff5c]/10 hover:text-[#183b16] dark:hover:text-[#b8ff5c] w-full mt-3">
                        Ir para meus estudos
                      </Link>
                    </div>
                  ) : (
                    <form action={async () => {
                      'use server'
                      await subscribeToPack(pack.id, 'flashcard')
                    }}>
                      <button type="submit" className={primaryBtn}>
                        <Plus className="h-5 w-5" />
                        Assinar Pacote
                      </button>
                    </form>
                  )}
                </div>
              </div>

              <div className={`${glassPanel} p-6`}>
                <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
                <div className="flex items-center gap-2 text-[#183b16] dark:text-[#b8ff5c] mb-2 relative z-10">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Dica</span>
                </div>
                <p className="text-xs text-[#425039] dark:text-[#b9c3a4] leading-relaxed relative z-10">
                  Ao assinar, este pacote aparecerá na sua tela inicial como uma tarefa pendente. Você pode escolher o modo de jogo na primeira vez que abrir.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
