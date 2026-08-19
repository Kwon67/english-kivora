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
import SectionBadge from '@/components/ui/SectionBadge'
import { landingCtaCardShadow } from '@/lib/landingStyles'
import {
  homeCardClass,
  homeIconBox,
  homeNestedCardClass,
  homeShellClass,
  homeSmallPillClass,
} from '@/lib/homeStyles'

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
    <div className={homeShellClass}>
      <div className="relative z-10 mx-auto max-w-4xl space-y-8 pb-12 animate-fade-in">
        <StudyBreadcrumb
          items={[
            { label: 'Explorar', href: '/explore' },
            { label: pack.name },
          ]}
        />

        <div className={`${homeCardClass} ${landingCtaCardShadow} overflow-hidden`}>
          <div className="relative h-64 w-full border-b border-brand-dark bg-bg-primary sm:h-80">
            <Image src={coverUrl} alt={pack.name} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 896px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-bg-card/40 to-transparent" />

            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`${homeSmallPillClass} bg-bg-card/90 backdrop-blur-sm`}>
                  <Folder className="h-3 w-3" />
                  Pasta: {folderLabel}
                </span>
                <span className={`${homeSmallPillClass} bg-brand-accent`}>
                  {pack.level || 'Básico'}
                </span>
              </div>
              <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight text-brand-dark sm:text-4xl">
                {pack.name}
              </h1>
            </div>
          </div>

          <div className="grid gap-8 p-6 sm:p-8 md:grid-cols-[1fr_300px]">
            <div className="space-y-6">
              <section>
                <SectionBadge label="Sobre este pack" animate={false} />
                <p className="mt-3 font-body text-base leading-relaxed text-brand-secondary">
                  {pack.description || 'Este pack foi cuidadosamente selecionado para ajudar no seu progresso. Pratique frases reais e naturais para acelerar sua fluência.'}
                </p>
              </section>

              <section>
                <div className="mb-4 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-brand-dark" />
                  <SectionBadge label="Amostra do conteúdo" animate={false} />
                </div>
                <div className="space-y-3">
                  {cards?.map((card, i) => (
                    <div key={i} className={`${homeNestedCardClass} p-4`}>
                      <p className="font-body font-semibold text-brand-dark">{card.english_phrase}</p>
                      <p className="mt-1 font-body text-sm text-brand-secondary">{card.portuguese_translation}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <div className={`${homeCardClass} p-6`}>
                <SectionBadge label="Seu progresso" animate={false} />
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 ${homeIconBox}`}>
                      <Trophy className="h-5 w-5" strokeWidth={2.2} />
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

              <div className={`${homeCardClass} p-6`}>
                <div className="mb-2 flex items-center gap-2 text-brand-dark">
                  <BookOpen className="h-4 w-4" />
                  <SectionBadge label="Dica" animate={false} />
                </div>
                <p className="mt-3 font-body text-xs leading-relaxed text-brand-secondary">
                  Ao adicionar à rotina, você escolhe o modo de estudo e o pack aparece no Início e em Minha rotina.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}