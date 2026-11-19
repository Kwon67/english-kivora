import { getCurriculumState } from '@/features/curriculum/lib/curriculumState'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Check, Lock } from 'lucide-react'
import { getPackFolderLabel } from '@/features/cards/lib/packFolders'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import { isPackInRoutine } from '@/features/study/lib/routineAssignments'
import { normalizePackLevel } from '@/features/cefr/lib/cefrLevels'
import { getCurriculumGate, getPackLockReason } from '@/features/learning/lib/levelGate'
import { getAppDateString } from '@/lib/timezone'
import { homeShellClass } from '@/lib/homeStyles'

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

  if (error && !['PGRST116','22P02'].includes(error.code)) throw new Error('Não foi possível carregar este pack. Tente novamente.')
  if (!pack) notFound()

  const { data: cards, error: sampleError } = await supabase
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
  const lockReason = getPackLockReason(pack.level, getCurriculumGate((await getCurriculumState(user.id)).currentLevel))
  const folderLabel = getPackFolderLabel(pack)

  const status = lockReason
    ? `Trancado · ${normalizePackLevel(pack.level)}`
    : isSubscribed ? 'No seu plano' : 'Liberado no seu nível'
  const StatusIcon = lockReason ? Lock : Check

  return (
    <div className={homeShellClass}>
      <div className="pack-detail">
        <StudyBreadcrumb items={[{ label: 'Explorar', href: '/explore' }, { label: pack.name }]} />

        <header className="pack-detail-heading">
          <p>{pack.level || 'Básico'} · {folderLabel}</p>
          <h1>{pack.name}</h1>
          {pack.description && <p>{pack.description}</p>}
        </header>

        <section className="pack-detail-status" aria-labelledby="pack-status-title">
          <div>
            <h2 id="pack-status-title"><StatusIcon size={16} aria-hidden="true" />{status}</h2>
            <p>{lockReason ?? (isSubscribed
              ? 'Esta coleção faz parte do seu plano de hoje.'
              : 'O plano diário pode incluir esta coleção em uma próxima prática.')}</p>
          </div>
          {isSubscribed && !lockReason && (
            <Link href="/home" className="product-primary">
              Abrir plano de hoje <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </section>

        <section aria-labelledby="pack-sample-title">
          <h2 id="pack-sample-title" className="pack-sample-title">Amostra do conteúdo</h2>
          {sampleError ? (
            <p role="alert" className="pack-sample-note">Não foi possível carregar os exemplos. Atualize a página para tentar novamente.</p>
          ) : cards?.length ? (
            <ul role="list" className="pack-sample">
              {cards.map((card, index) => (
                <li key={index}>
                  <p lang="en">{card.english_phrase}</p>
                  <p lang="pt-BR">{card.portuguese_translation}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="pack-sample-note">Esta coleção ainda não tem exemplos disponíveis.</p>
          )}
        </section>
      </div>
    </div>
  )
}
