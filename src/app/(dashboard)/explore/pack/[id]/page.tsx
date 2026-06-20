import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { BookOpen, Layers, Trophy, Folder } from 'lucide-react'
import { getDynamicPackCoverUrl } from '@/lib/cloudinary'
import { getPackFolderLabel } from '@/features/cards/lib/packFolders'
import Link from 'next/link'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import PackDetailSubscribe from '@/features/study/components/PackDetailSubscribe'
import { isPackInRoutine } from '@/features/study/lib/routineAssignments'
import { getAppDateString } from '@/lib/timezone'
import { pageBgGlowExplore, pageBgGridExplore } from '@/lib/pageShellBackground'

const glassPanel =
  'home-glass-panel render-contained relative overflow-hidden rounded-[22px] border border-border-muted/20 bg-card shadow-[0_18px_48px_rgba(31,43,18,0.14)] transition-colors duration-300 dark:border-border-accent/20 dark:bg-card dark:shadow-[0_20px_54px_rgba(0,0,0,0.5)]'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12'
const neutralBadge =
  'inline-flex items-center rounded-full border border-border-muted/10 dark:border-border-accent/10 bg-card dark:bg-card px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-text-muted dark:text-text-muted shadow-sm'
const accentBadge =
  'inline-flex items-center rounded-full border border-primary/10 dark:border-primary/10 bg-primary/5 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-primary shadow-sm'
const sampleCard =
  'p-4 rounded-[1.35rem] border border-border-muted/15 dark:border-border-accent/15 bg-card dark:bg-card'
const iconContainer =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-primary dark:bg-primary/12'

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

  const today = getAppDateString()
  const { data: assignments } = await supabase
    .from('assignments')
    .select('id,pack_id,game_mode,status,assigned_by,assigned_date,created_at,reward_badge_id')
    .eq('user_id', user.id)
    .eq('pack_id', pack.id)

  const isSubscribed = isPackInRoutine(assignments || [], pack.id, today)
  const coverUrl = pack.cover_url || getDynamicPackCoverUrl(pack.name)
  const folderLabel = getPackFolderLabel(pack)

  return (
    <div className="home-mobile-optimized explorar-root relative -mx-4 -my-6 overflow-x-hidden bg-surface px-4 py-6 pb-8 text-text sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8 dark:bg-[#0a0a0a] dark:text-text">
      <div className={pageBgGridExplore} />
      <div className={pageBgGlowExplore} />

      <div className="relative z-10 mx-auto max-w-4xl space-y-8 pb-12 animate-fade-in">
        <StudyBreadcrumb
          items={[
            { label: 'Explorar', href: '/explore' },
            { label: pack.name },
          ]}
        />

        <div className={`${glassPanel} overflow-hidden p-0`}>
          <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
          <div className="relative h-64 sm:h-80 w-full">
            <Image src={coverUrl} alt={pack.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 896px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#f4f5e8] via-transparent to-transparent dark:from-[#0a0a0a]" />
            
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border-muted/15 dark:border-border-accent/20 bg-card/90 dark:bg-card/90 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-primary backdrop-blur-sm">
                  <Folder className="h-3 w-3" />
                  Pasta: {folderLabel}
                </span>
                <span className="px-3 py-1 rounded-full bg-primary text-[10px] font-black uppercase tracking-widest text-on-primary">
                  {pack.level || 'Básico'}
                </span>
              </div>
              <h1 className="mt-4 font-montserrat text-3xl sm:text-4xl font-bold text-text dark:text-text tracking-tight">
                {pack.name}
              </h1>
            </div>
          </div>

          <div className="p-6 sm:p-8 grid gap-8 md:grid-cols-[1fr_300px] relative z-10">
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-black uppercase tracking-widest text-text-muted dark:text-text-muted mb-3">Sobre este pacote</h2>
                <p className="text-base text-text-muted dark:text-text-muted leading-relaxed">
                  {pack.description || 'Este pacote foi cuidadosamente selecionado para ajudar no seu progresso. Pratique frases reais e naturais para acelerar sua fluência.'}
                </p>
              </section>

              <section>
                <h2 className="text-sm font-black uppercase tracking-widest text-text-muted dark:text-text-muted mb-4 flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  O que você vai aprender (amostra)
                </h2>
                <div className="space-y-3">
                  {cards?.map((card, i) => (
                    <div key={i} className={sampleCard}>
                      <p className="font-bold text-text dark:text-text">{card.english_phrase}</p>
                      <p className="text-sm text-text-muted dark:text-text-muted mt-1">{card.portuguese_translation}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <div className={`${glassPanel} p-6`}>
                <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
                <h3 className="text-lg font-bold text-text dark:text-text mb-4 relative z-10">Seu Progresso</h3>
                
                <div className="space-y-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className={iconContainer}>
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-text-muted dark:text-text-muted">Status</p>
                      <p className="text-sm font-bold text-text dark:text-text">{isSubscribed ? 'Inscrito' : 'Não iniciado'}</p>
                    </div>
                  </div>

                  <PackDetailSubscribe
                    packId={pack.id}
                    packName={pack.name}
                    isSubscribed={isSubscribed}
                  />
                </div>
              </div>

              <div className={`${glassPanel} p-6`}>
                <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
                <div className="flex items-center gap-2 text-primary mb-2 relative z-10">
                  <BookOpen className="h-4 w-4" />
                  <span className="text-xs font-black uppercase tracking-widest">Dica</span>
                </div>
                <p className="text-xs text-text-muted dark:text-text-muted leading-relaxed relative z-10">
                  Ao adicionar à rotina, você escolhe o modo de estudo e o pacote aparece no Início e em Minha rotina.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}
