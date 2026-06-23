import type { UserCefrProfile } from '@/features/cefr/lib/cefrAssessment'

type CefrLevelBadgeProps = {
  profile: UserCefrProfile
  compact?: boolean
}

export default function CefrLevelBadge({ profile, compact = false }: CefrLevelBadgeProps) {
  const levelDisplay = profile.level ?? '—'
  const subtitle = profile.assessing
    ? `${profile.totalInteractions} interações — continue praticando`
    : profile.nextLevel
      ? `${profile.progressToNext ?? 0}% rumo ao ${profile.nextLevel}`
      : 'Nível máximo detectado no escopo atual'

  if (compact) {
    return (
      <div>
        <p className="font-montserrat text-3xl font-bold text-primary">{levelDisplay}</p>
        <p className="mt-1 text-sm font-bold text-text-muted">{profile.levelName}</p>
      </div>
    )
  }

  return (
    <div>
      <p className="font-montserrat text-3xl font-bold text-primary">{levelDisplay}</p>
      <p className="mt-1 text-sm font-bold text-text-muted">{profile.levelName}</p>
      <p className="mt-2 text-xs font-semibold text-text-subtle">{subtitle}</p>
      {!profile.assessing && profile.source === 'auto' ? (
        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary/80">
          Detectado automaticamente · {profile.confidence}% confiança
        </p>
      ) : null}
    </div>
  )
}