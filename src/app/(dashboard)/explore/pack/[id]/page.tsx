import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { BookOpen, Layers, Trophy, Folder } from 'lucide-react'
import { getPackFolderLabel } from '@/features/cards/lib/packFolders'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import { isPackInRoutine } from '@/features/study/lib/routineAssignments'
import { getUserCefrProfile } from '@/features/cefr/lib/cefrAssessment'
import { normalizePackLevel } from '@/features/cefr/lib/cefrLevels'
import { getLevelGate, getPackLockReason } from '@/features/learning/lib/levelGate'
import { getAppDateString } from '@/lib/timezone'
import SectionBadge from '@/components/ui/SectionBadge'
import {
  homeIconBox,
  homeShellClass,
  homeSmallPillClass,
} from '@/lib/homeStyles'
import {
  exploreCardClass,
  exploreNestedCardClass,
} from '@/features/explore/lib/explorePageUi'

export default async function PackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: pack, error } = await supabase
    .from('packs')
    .select('id, name, description, level, category, created_at')
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
  const cefrProfile = await getUserCefrProfile(supabase, user.id, user.user_metadata)
  const lockReason = getPackLockReason(pack.level, getLevelGate(cefrProfile))
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

        {/* A capa saiu daqui.
            `getDynamicPackCoverUrl` montava uma URL de texto sobre `v1/sample.jpg` no Cloudinary
            que responde 404 — verificado em 10 packs, e nenhum tem `cover_url` próprio. O
            resultado era uma faixa de 256–320px no topo de TODA apresentação de pack exibindo o
            ícone de imagem quebrada com o alt ao lado. Um herói vazio custava um terço da primeira
            tela para não mostrar nada; sem ele, o nome do pack é a primeira coisa que se lê. */}
        <div className={`${exploreCardClass} overflow-hidden`}>
          <div className="border-b border-brand-dark/20 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className={homeSmallPillClass}>
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
                    <div key={i} className={`${exploreNestedCardClass} p-4`}>
                      <p className="font-body font-semibold text-brand-dark">{card.english_phrase}</p>
                      <p className="mt-1 font-body text-sm text-brand-secondary">{card.portuguese_translation}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <aside className="space-y-4">
              <div className={`${exploreNestedCardClass} p-6`}>
                <SectionBadge label="Seu progresso" animate={false} />
                <div className="mt-4 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 ${homeIconBox}`}>
                      <Trophy className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <div>
                      <p className="font-heading text-2xs font-bold uppercase tracking-widest text-brand-secondary">Status</p>
                      <p className="font-body text-sm font-semibold text-brand-dark">
                        {lockReason ? `Trancado · ${normalizePackLevel(pack.level)}` : isSubscribed ? 'No seu plano' : 'Liberado no seu nível'}
                      </p>
                    </div>
                  </div>

                  {/* O botão de assinar saiu.
                      Distribuir o catálogo passou a ser trabalho do motor diário, que respeita o
                      nível do aluno. O painel agora explica o critério em vez de oferecer uma
                      decisão que o produto não quer mais que ele tome. */}
                  <p className="font-body text-sm leading-relaxed text-brand-secondary">
                    {lockReason ??
                      (isSubscribed
                        ? 'Este pack está no seu plano de hoje. Abra o Início para começar.'
                        : 'Este pack está no seu nível. O plano diário pode trazê-lo para você em breve.')}
                  </p>
                </div>
              </div>

              <div className={`${exploreNestedCardClass} p-6`}>
                <div className="mb-2 flex items-center gap-2 text-brand-dark">
                  <BookOpen className="h-4 w-4" />
                  <SectionBadge label="Dica" animate={false} />
                </div>
                <p className="mt-3 font-body text-xs leading-relaxed text-brand-secondary">
                  Todo dia o Kivora monta seu plano com o material do seu nível. Você não precisa
                  procurar nada — é só abrir o Início e estudar o que já está lá.
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  )
}