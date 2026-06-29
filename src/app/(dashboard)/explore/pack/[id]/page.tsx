import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Image from 'next/image'
import { BookOpen, Layers, Trophy, Folder } from 'lucide-react'
import { getDynamicPackCoverUrl } from '@/lib/cloudinary'
import { getPackFolderLabel } from '@/features/cards/lib/packFolders'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import PackDetailSubscribe from '@/features/study/components/PackDetailSubscribe'
import { isPackInRoutine } from '@/features/study/lib/routineAssignments'
import { getAppDateString } from '@/lib/timezone'

const glassPanel =
  'render-contained relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[8px_8px_0_var(--color-brand-dark)] transition-colors duration-300'
const sampleCard =
  'rounded-xl border border-brand-border bg-bg-card p-4'
const iconContainer =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]'
const pillClass =
  'inline-flex items-center gap-1.5 rounded-full border border-brand-dark bg-bg-primary px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark'
const accentPill =
  'inline-flex items-center rounded-full border border-brand-dark bg-brand-accent px-3 py-1 font-heading text-[10px] font-bold uppercase tracking-widest text-brand-dark'

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
    <div className="home-mobile-optimized explorar-root landing-light relative -mx-4 -my-6 overflow-x-hidden bg-bg-primary px-4 py-6 pb-8 font-body text-brand-dark sm:-mx-6 sm:-my-8 sm:px-6 sm:py-8">
      <div className="relative z-10 mx-auto max-w-4xl space-y-8 pb-12 animate-fade-in">
        <StudyBreadcrumb
          items={[
            { label: 'Explorar', href: '/explore' },
            { label: pack.name },
          ]}
        />

        <div className={`${glassPanel} overflow-hidden p-0`}>
          <div className="relative h-64 w-full border-b-2 border-brand-dark bg-bg-primary sm:h-80">
            <Image src={coverUrl} alt={pack.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 896px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-bg-card/40 to-transparent" />
            
            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`${pillClass} bg-bg-card/90 backdrop-blur-sm`}>
                  <Folder className="h-3 w-3" />
                  Pasta: {folderLabel}
                </span>
                <span className={accentPill}>
                  {pack.level || 'Básico'}
                </span>
              </div>
              <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
                {pack.name}
              </h1>
            </div>
          </div>

          <div className="relative z-10 grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              <section>
                <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-widest text-brand-dark">Sobre este pacote</h2>
                <p className="font-body text-base leading-relaxed text-brand-secondary">
                  {pack.description || 'Este pacote foi cuidadosamente selecionado para ajudar no seu progresso. Pratique frases reais e naturais para acelerar sua fluência.'}
                </p>
              </section>

              <section>
                <h2 className="mb-4 flex items-center gap-2 font-heading text-sm font-bold uppercase tracking-widest text-brand-dark">
                  <Layers className="h-4 w-4" />
                  O que você vai aprender (amostra)
                </h2>
                <div className="space-y-3">
                  {cards?.map((card, i) => (
                    <div key={i} className={sampleCard}>
                      <p className="font-body font-semibold text-brand-dark">{card.english_phrase}</p>
                      <p className="mt-1 font-body text-sm text-brand-secondary">{card.portuguese_translation}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <div className={`${glassPanel} p-6`}>
                <h3 className="relative z-10 mb-4 font-heading text-lg font-bold text-brand-dark">Seu Progresso</h3>
                
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={iconContainer}>
                      <Trophy className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">Status</p>
                      <p className="font-body text-sm font-semibold text-brand-dark">{isSubscribed ? 'Inscrito' : 'Não iniciado'}</p>
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
                <div className="relative z-10 mb-2 flex items-center gap-2 text-brand-dark">
                  <BookOpen className="h-4 w-4" />
                  <span className="font-heading text-xs font-bold uppercase tracking-widest">Dica</span>
                </div>
                <p className="relative z-10 font-body text-xs leading-relaxed text-brand-secondary">
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
