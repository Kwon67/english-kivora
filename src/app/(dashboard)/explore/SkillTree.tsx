'use client'

import { m } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Check, Plus, ChevronRight, BookOpen, Award, Target } from 'lucide-react'
import { normalizePackLevel, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import EmptyState from '@/components/ui/EmptyState'
import { useState } from 'react'
import { groupPacksByLevel } from '@/features/cards/lib/packFolders'
import AssignPackModal from '@/features/study/components/AssignPackModal'
import SectionBadge from '@/components/ui/SectionBadge'
import {
  homeCardButton,
  homeCardClass,
  homeIconBox,
  homePrimaryButton,
  homeSecondaryButton,
  homeSmallPillClass,
  homeSubscribedPillClass,
} from '@/lib/homeStyles'

type PackRow = {
  id: string
  name: string
  description: string | null
  level: string | null
  cover_url: string | null
  category: string | null
}

interface SkillTreeProps {
  packs: PackRow[]
  subscribedPackIds: string[]
  packArtwork: string[]
  recommendedLevel?: LearnerCefrLevel | null
  nextStepLevel?: LearnerCefrLevel | null
  assessing?: boolean
}

const levelOrder: Record<string, number> = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 }
const getLevelWeight = (level: string | null) => {
  const l = (level || '').toUpperCase()
  for (const key in levelOrder) {
    if (l.includes(key)) return levelOrder[key]
  }
  return 99
}

const filterBtnBase =
  'inline-flex items-center justify-center gap-2 rounded-[13px] border border-brand-dark px-4 py-2 font-heading text-xs font-bold transition-colors'

export default function SkillTree({
  packs,
  subscribedPackIds,
  packArtwork,
  recommendedLevel = null,
  nextStepLevel = null,
  assessing = false,
}: SkillTreeProps) {
  const [selectedPack, setSelectedPack] = useState<PackRow | null>(null)
  const [catalogMode, setCatalogMode] = useState<'full' | 'recommended'>('full')

  if (!packs || packs.length === 0) {
    return (
      <EmptyState
        imageSrc="/images/home/undraw-online-learning.svg"
        imageAlt="Ilustração unDraw para catálogo sem pacotes"
        title="Nenhum pacote encontrado"
        description="Volte mais tarde para ver novas sugestões."
        variant="glass"
      />
    )
  }

  const subscribedSet = new Set(subscribedPackIds)
  const showingRecommended = catalogMode === 'recommended' && Boolean(recommendedLevel)
  const visiblePacks = showingRecommended
    ? packs.filter((pack) => {
        const packLevel = normalizePackLevel(pack.level)
        if (packLevel === recommendedLevel) return true
        if (nextStepLevel && packLevel === nextStepLevel) return true
        return false
      })
    : packs
  const folders = groupPacksByLevel(visiblePacks, { includeEmptyLevels: !showingRecommended })

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  let globalPackIndex = 0

  return (
    <div className="space-y-8">
      {(recommendedLevel || assessing) && (
        <div className={`${homeCardClass} p-5 sm:p-6`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <SectionBadge label="Trilha personalizada" animate={false} />
              <h3 className="mt-3 font-heading text-lg font-bold text-brand-dark">
                {assessing
                  ? 'Estamos medindo seu nível nas revisões e lições'
                  : `Seu nível detectado: ${recommendedLevel}`}
              </h3>
              <p className="mt-2 font-body text-sm text-brand-secondary">
                {assessing
                  ? 'Continue praticando — após algumas sessões o app indica A1, A2, B1 ou B2 automaticamente.'
                  : nextStepLevel
                    ? `Próximo passo sugerido: packs de nível ${nextStepLevel}.`
                    : 'Você já atingiu B2 no escopo atual do catálogo.'}
              </p>
            </div>
            {!assessing && recommendedLevel ? (
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCatalogMode('recommended')}
                  aria-pressed={showingRecommended}
                  className={`${filterBtnBase} ${
                    showingRecommended
                      ? 'bg-brand-accent text-brand-dark'
                      : 'bg-bg-card text-brand-dark hover:bg-brand-dark hover:text-white'
                  }`}
                >
                  <Target className="h-3.5 w-3.5" />
                  Recomendado para meu nível
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogMode('full')}
                  aria-pressed={!showingRecommended}
                  className={`${filterBtnBase} ${
                    !showingRecommended
                      ? 'bg-brand-accent text-brand-dark'
                      : 'bg-bg-card text-brand-dark hover:bg-brand-dark hover:text-white'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Ver catálogo completo
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {showingRecommended && visiblePacks.length === 0 ? (
        <EmptyState
          imageSrc="/images/home/undraw-studying.svg"
          imageAlt="Nenhum pack recomendado"
          title="Nenhum pack neste filtro ainda"
          description="Mostre o catálogo completo ou aguarde novos packs no seu nível."
          variant="glass"
        >
          <button
            type="button"
            onClick={() => setCatalogMode('full')}
            className={homeSecondaryButton}
          >
            Ver catálogo completo
          </button>
        </EmptyState>
      ) : null}

      <div className="space-y-14 sm:space-y-28">
      {folders.map((folder) => {
        const sortedPacks = [...folder.packs].sort(
          (a, b) => getLevelWeight(a.level) - getLevelWeight(b.level)
        )

        return (
          <section key={folder.id} className="space-y-8">
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`${homeCardClass} mx-auto max-w-3xl p-5 sm:p-6`}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 shrink-0 ${homeIconBox}`}>
                    <Award className="h-5 w-5" strokeWidth={2.2} />
                  </div>
                  <div>
                    <p className={homeSmallPillClass}>Nível de estudo</p>
                    <h3 className="mt-2 font-heading text-xl font-bold text-brand-dark sm:text-2xl">
                      {folder.label}
                    </h3>
                    <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary">
                      Os pacotes abaixo pertencem a este nível. Avance na ordem sugerida ou escolha o treino que fizer sentido para você.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <span className={`${homeSmallPillClass} bg-brand-accent`}>
                    <Award className="mr-1.5 h-3.5 w-3.5" />
                    {folder.packs.length} {folder.packs.length === 1 ? 'pacote' : 'pacotes'}
                  </span>
                </div>
              </div>
            </m.div>

            <div className="relative overflow-hidden py-4 sm:overflow-visible sm:py-8">
              <div className="pointer-events-none absolute bottom-0 left-1/2 top-0 w-px -translate-x-1/2 bg-brand-dark/25" />

              {sortedPacks.length > 0 ? (
                <m.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="relative z-10 flex flex-col items-center gap-10 sm:gap-24"
                >
                  {sortedPacks.map((pack) => {
                  const index = globalPackIndex++
                  const isSubscribed = subscribedSet.has(pack.id)
                  const coverUrl = packArtwork[index % packArtwork.length]
                  const isLeft = index % 2 === 0
                  const levelWeight = getLevelWeight(pack.level)

                  return (
                    <m.div
                      key={pack.id}
                      variants={{
                        hidden: { opacity: 0, y: 30 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
                      }}
                      className={`relative flex w-full max-w-4xl items-center justify-center gap-4 sm:gap-8 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
                    >
                      <div className={`pointer-events-none absolute top-1/2 hidden h-px w-1/4 bg-brand-dark/25 sm:block ${isLeft ? 'right-1/4' : 'left-1/4'}`} />

                      <m.div
                        whileHover={{ scale: 1.08 }}
                        className={`absolute left-1/2 top-1/2 z-20 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-brand-dark transition-all duration-300 sm:h-14 sm:w-14 ${isSubscribed ? 'bg-brand-accent-soft text-brand-dark' : 'bg-bg-card text-brand-dark'}`}
                      >
                        {isSubscribed ? (
                          <Check className="h-5 w-5 stroke-[3] sm:h-6 sm:w-6" />
                        ) : (
                          <Plus className="h-4.5 w-4.5 stroke-[2.5] sm:h-5 sm:w-5" />
                        )}
                      </m.div>

                      <div className="hidden sm:block sm:flex-1" />

                      <div className="z-30 w-[76%] max-w-[21rem] sm:max-w-none sm:flex-1">
                        <article className={`${homeCardClass} group relative flex flex-col overflow-hidden transition-transform hover:-translate-y-0.5`}>
                          <div className={`relative min-h-[92px] overflow-hidden border-b border-brand-dark bg-bg-primary p-3 sm:min-h-[140px] sm:p-4`}>
                            <div className="relative z-10 flex flex-wrap gap-1.5 sm:gap-2">
                              <span className={`${homeSmallPillClass} bg-brand-accent`}>
                                <Award className="h-3 w-3" />
                                Nível: {folder.label}
                              </span>
                              <span className={homeSmallPillClass}>
                                {pack.level || 'A1-A2'}
                              </span>
                              {levelWeight <= 2 && (
                                <span className={homeSmallPillClass}>
                                  <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-brand-dark" aria-hidden="true" />
                                  Iniciante
                                </span>
                              )}
                              {levelWeight === 4 && (
                                <span className={`${homeSmallPillClass} bg-brand-accent`}>
                                  <Target className="h-3 w-3" />
                                  B2
                                </span>
                              )}
                            </div>

                            <m.div
                              animate={{ y: [0, -3, 0] }}
                              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                              className="absolute bottom-1 right-2 h-16 w-20 origin-bottom-right sm:right-3 sm:h-28 sm:w-32"
                            >
                              <Image
                                src={coverUrl}
                                alt=""
                                width={400}
                                height={300}
                                unoptimized
                                className="h-full w-full object-contain select-none opacity-90 transition-transform duration-500 group-hover:scale-105"
                              />
                            </m.div>
                          </div>

                          <div className="relative z-10 flex flex-1 flex-col p-3 sm:p-5">
                            <h3 className="line-clamp-1 font-heading text-base font-bold leading-snug text-brand-dark sm:text-lg">
                              {pack.name}
                            </h3>
                            <p className="mt-1.5 line-clamp-2 min-h-[32px] font-body text-[11px] leading-relaxed text-brand-secondary sm:mt-2 sm:min-h-[36px] sm:text-xs">
                              {pack.description || 'Domine o vocabulário e a audição estruturada com este pacote de flashcards.'}
                            </p>

                            <div className="mt-2 flex items-center gap-2 font-body text-[9px] font-semibold text-brand-secondary sm:mt-4 sm:gap-4 sm:text-[10px]">
                              <span className="flex items-center gap-1.5">
                                <BookOpen className="h-3.5 w-3.5 text-brand-dark" />
                                Flashcards de Estudo
                              </span>
                              <span className="h-1.5 w-1.5 rounded-full bg-brand-dark/25" />
                              <span className="font-heading uppercase tracking-wider text-brand-dark">Livre Acesso</span>
                            </div>

                            <div className="mt-3 flex w-full items-center gap-2 border-t border-brand-border pt-3 sm:mt-5 sm:gap-3 sm:pt-4">
                              {isSubscribed ? (
                                <div className={`${homeSubscribedPillClass} min-h-9 flex-1 sm:min-h-10`}>
                                  <Check className="h-4 w-4 stroke-[2.5]" />
                                  Adicionado à rotina
                                </div>
                              ) : (
                                <button
                                  onClick={() => setSelectedPack(pack)}
                                  className={`${homePrimaryButton} min-h-9 flex-1 px-4 py-2 text-xs sm:min-h-10 sm:text-sm`}
                                >
                                  <Plus className="h-4 w-4 stroke-[2.5]" />
                                  Desbloquear Treino
                                </button>
                              )}

                              <Link
                                href={`/explore/pack/${pack.id}`}
                                className={`flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10 ${homeCardButton}`}
                                aria-label={`Abrir detalhes de ${pack.name}`}
                                title="Ver detalhes"
                              >
                                <ChevronRight className="h-4.5 w-4.5" />
                              </Link>
                            </div>
                          </div>
                        </article>
                      </div>
                    </m.div>
                  )
                  })}
                </m.div>
              ) : (
                <div className={`relative z-10 mx-auto max-w-xl ${homeCardClass} p-5 text-center font-body text-sm font-semibold text-brand-secondary`}>
                  Ainda não há packs publicados neste nível.
                </div>
              )}
            </div>
          </section>
        )
      })}
      </div>
      {selectedPack ? (
        <AssignPackModal
          packId={selectedPack.id}
          packName={selectedPack.name}
          open={Boolean(selectedPack)}
          onClose={() => setSelectedPack(null)}
        />
      ) : null}
    </div>
  )
}
