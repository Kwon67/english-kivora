'use client'

import Image from 'next/image'
import { ArrowRight, BookOpen, Loader2 } from 'lucide-react'
import { getDynamicPackCoverUrl } from '@/lib/cloudinary'
import { CEFR_LEVEL_LABELS, normalizePackLevel } from '@/features/cefr/lib/cefrLevels'
import type { RankedStarterPack } from '@/features/onboarding/lib/suggestStarterPack'
import {
  onboardingActionRow,
  onboardingPackCardClass,
  onboardingPackImageShell,
  onboardingPackMetaPill,
  onboardingPackSkeletonBlock,
  onboardingPackSuggestOption,
  onboardingPrimaryButton,
  onboardingSecondaryButton,
} from '@/features/onboarding/lib/onboardingUi'
import OnboardingShell from './OnboardingShell'

type OnboardingStarterPackStepProps = {
  packs: RankedStarterPack[]
  recommended: RankedStarterPack | null
  selectedPackId: string | null
  loading: boolean
  isLoadingPacks: boolean
  onSelectPack: (packId: string) => void
  onBack: () => void
  onAssign: () => void
  onSkip: () => void
}

function PackCardSkeleton() {
  return (
    <article className={onboardingPackCardClass} aria-hidden="true">
      <div className={`${onboardingPackImageShell} ${onboardingPackSkeletonBlock} border-brand-dark/20`} />
      <div className="space-y-3 p-5 sm:p-6">
        <div className="flex flex-wrap gap-2">
          <div className={`h-7 w-28 ${onboardingPackSkeletonBlock}`} />
          <div className={`h-7 w-36 ${onboardingPackSkeletonBlock}`} />
        </div>
        <div className={`h-8 w-3/4 max-w-sm ${onboardingPackSkeletonBlock}`} />
        <div className={`h-4 w-full ${onboardingPackSkeletonBlock}`} />
        <div className={`h-4 w-5/6 ${onboardingPackSkeletonBlock}`} />
      </div>
    </article>
  )
}

export default function OnboardingStarterPackStep({
  packs,
  recommended,
  selectedPackId,
  loading,
  isLoadingPacks,
  onSelectPack,
  onBack,
  onAssign,
  onSkip,
}: OnboardingStarterPackStepProps) {
  const activePack = packs.find((pack) => pack.id === selectedPackId) ?? recommended ?? packs[0] ?? null

  return (
    <OnboardingShell
      step={5}
      totalSteps={5}
      title="Seu pack inicial"
      subtitle="Sugerimos um pack para começar hoje. Você pode trocar depois no catálogo."
    >
      <div className="space-y-4" data-testid="onboarding-starter-pack-step">
        {isLoadingPacks ? (
          <PackCardSkeleton />
        ) : activePack ? (
          <article className={onboardingPackCardClass}>
            <div className={onboardingPackImageShell}>
              <Image
                src={activePack.cover_url || getDynamicPackCoverUrl(activePack.name)}
                alt={activePack.name}
                fill
                sizes="(max-width: 640px) 100vw, 672px"
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg-card via-bg-card/30 to-transparent" />
            </div>
            <div className="space-y-3 p-5 sm:p-6">
              <div className="flex min-w-0 flex-wrap gap-2">
                <span className={`${onboardingPackMetaPill} inline-flex max-w-full items-center`}>
                  {normalizePackLevel(activePack.level)}
                  {' — '}
                  {CEFR_LEVEL_LABELS[normalizePackLevel(activePack.level)]}
                </span>
                <span
                  className={`${onboardingPackMetaPill} inline-flex max-w-full items-center`}
                  title={activePack.matchReason}
                >
                  {activePack.matchReason}
                </span>
              </div>
              <h2 className="break-words font-heading text-xl font-bold leading-tight text-brand-dark sm:text-2xl">
                {activePack.name}
              </h2>
              {activePack.description ? (
                <p className="text-sm leading-relaxed text-brand-secondary">
                  {activePack.description}
                </p>
              ) : null}
            </div>
          </article>
        ) : (
          <p className="text-sm leading-relaxed text-brand-secondary">
            Não encontramos packs públicos agora. Você pode explorar o catálogo depois.
          </p>
        )}

        {!isLoadingPacks && packs.length > 1 ? (
          <div className="space-y-2">
            <p className="font-heading text-xs font-bold uppercase tracking-widest text-brand-secondary">
              Outras sugestões
            </p>
            {packs.map((pack) => {
              const selected = pack.id === (selectedPackId ?? activePack?.id)
              return (
                <button
                  key={pack.id}
                  type="button"
                  disabled={loading}
                  aria-pressed={selected}
                  onClick={() => onSelectPack(pack.id)}
                  className={onboardingPackSuggestOption(selected)}
                >
                  <span className="min-w-0 flex-1 truncate font-heading text-sm font-bold">
                    {pack.name}
                  </span>
                  <BookOpen className="h-4 w-4 shrink-0" />
                </button>
              )
            })}
          </div>
        ) : null}

        <div className={onboardingActionRow}>
          <button
            type="button"
            disabled={loading || isLoadingPacks || !activePack}
            onClick={onAssign}
            className={onboardingPrimaryButton}
            data-testid="onboarding-starter-pack-assign"
          >
            Adicionar à rotina
            <ArrowRight className="h-4 w-4 shrink-0" />
          </button>
          <button
            type="button"
            disabled={loading || isLoadingPacks}
            onClick={onSkip}
            className={onboardingSecondaryButton}
            data-testid="onboarding-starter-pack-skip"
          >
            Explorar depois
          </button>
          <button
            type="button"
            disabled={loading || isLoadingPacks}
            onClick={onBack}
            className={onboardingSecondaryButton}
          >
            Voltar
          </button>
        </div>

        {loading ? (
          <p className="flex items-center gap-2 text-sm text-brand-secondary" aria-live="polite">
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
            {isLoadingPacks ? 'Carregando sugestões...' : 'Finalizando...'}
          </p>
        ) : null}
      </div>
    </OnboardingShell>
  )
}