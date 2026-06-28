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

const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-border-muted/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] transition-all duration-300'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12'
const accentBadge =
  'inline-flex items-center rounded-full border border-primary/10 dark:border-primary/10 bg-primary/5 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-primary shadow-sm'
const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-2.5 py-1.5 text-[11px] font-bold text-on-primary border border-dashed border-primary-container/50 shadow-[0px_8px_15px_0px_rgba(24,59,22,0.15)] transition-all hover:bg-primary-dark active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-55 sm:px-3 sm:py-2 sm:text-xs'
const ghostIconBtn =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-card dark:bg-card text-text-muted dark:text-text-muted border border-border-muted/15 dark:border-border-accent/15 transition-colors hover:bg-primary/10 dark:hover:bg-primary/10 hover:text-primary sm:h-10 sm:w-10'
const subscribedPill =
  'inline-flex min-h-9 flex-1 items-center justify-center gap-2 rounded-xl border border-primary/20 dark:border-primary/20 bg-primary/5 px-2.5 py-1.5 text-[11px] font-bold text-primary sm:min-h-10 sm:px-3 sm:py-2 sm:text-xs'
const filterBtn =
  'inline-flex items-center justify-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-colors'

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
        <div className={`${glassTile} p-5 sm:p-6`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={softKicker}>Trilha personalizada</p>
              <h3 className="mt-2 font-montserrat text-lg font-bold text-text">
                {assessing
                  ? 'Estamos medindo seu nível nas revisões e lições'
                  : `Seu nível detectado: ${recommendedLevel}`}
              </h3>
              <p className="mt-2 text-sm text-text-muted">
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
                  className={`${filterBtn} ${
                    showingRecommended
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border-muted/20 bg-card text-text-muted hover:text-primary'
                  }`}
                >
                  <Target className="h-3.5 w-3.5" />
                  Recomendado para meu nível
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogMode('full')}
                  aria-pressed={!showingRecommended}
                  className={`${filterBtn} ${
                    !showingRecommended
                      ? 'border-primary/30 bg-primary/10 text-primary'
                      : 'border-border-muted/20 bg-card text-text-muted hover:text-primary'
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
            className="btn-ghost"
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
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ type: 'spring', stiffness: 90, damping: 18 }}
              className={`${glassTile} mx-auto max-w-3xl p-5 sm:p-6`}
            >
              <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />
              <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-primary ring-1 ring-border-muted/18 bg-primary/12 dark:ring-border-accent/18">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={softKicker}>Nível de estudo</p>
                    <h3 className="mt-2 font-montserrat text-xl font-bold text-text dark:text-text sm:text-2xl">
                      {folder.label}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-text-muted dark:text-text-muted">
                      Os pacotes abaixo pertencem a este nível. Avance na ordem sugerida ou escolha o treino que fizer sentido para você.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <span className={accentBadge}>
                    <Award className="mr-1.5 h-3.5 w-3.5" />
                    {folder.packs.length} {folder.packs.length === 1 ? 'pacote' : 'pacotes'}
                  </span>
                </div>
              </div>
            </m.div>

            <div className="relative overflow-hidden py-4 sm:overflow-visible sm:py-8">
              <div className="absolute bottom-0 left-1/2 top-0 w-[3px] -translate-x-1/2 bg-gradient-to-b from-primary/35 via-[#172113]/25 to-primary/15 dark:from-primary/25 dark:via-[#d5e6a9]/20 dark:to-primary/10 rounded-full opacity-60 pointer-events-none" />

              {sortedPacks.length > 0 ? (
                <m.div
                  variants={containerVariants}
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true, margin: '-100px' }}
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
                        show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 80, damping: 15 } }
                      }}
                      className={`relative flex w-full max-w-4xl items-center justify-center gap-4 sm:gap-8 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
                    >
                      <div className={`hidden sm:block absolute top-1/2 h-[2px] w-1/4 bg-gradient-to-r opacity-40 pointer-events-none ${isLeft ? 'right-1/4 from-[#172113]/25 dark:from-[#d5e6a9]/20 to-transparent' : 'left-1/4 from-transparent to-[#172113]/25 dark:to-[#d5e6a9]/20' }`} />

                      <m.div
                        whileHover={{ scale: 1.12 }}
                        className={`absolute left-1/2 top-1/2 z-20 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-[#f4f5e8] shadow-md transition-all duration-300 dark:border-[#0a0a0a] sm:h-14 sm:w-14 sm:border-4 ${isSubscribed ? 'bg-primary text-on-primary ring-4 ring-primary/20 shadow-[0_0_15px_rgba(24,59,22,0.3)] dark:ring-primary/20' : 'border-border-muted/15 bg-card text-text-muted dark:border-border-accent/15 dark:bg-card dark:text-text-muted' }`}
                      >
                        {isSubscribed ? (
                          <Check className="h-5 w-5 stroke-[3] sm:h-6 sm:w-6" />
                        ) : (
                          <Plus className="h-4.5 w-4.5 stroke-[2.5] sm:h-5 sm:w-5" />
                        )}
                      </m.div>

                      <div className="hidden sm:block sm:flex-1" />

                      <div className="z-30 w-[76%] max-w-[21rem] sm:max-w-none sm:flex-1">
                        <article className={`${glassTile} group relative flex flex-col overflow-hidden ${isSubscribed ? 'hover:border-primary/30 dark:hover:border-primary/30' : ''} hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.5)] transition-all duration-300`}>
                          <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />

                          <div className="relative min-h-[92px] overflow-hidden border-b border-border-muted/15 bg-gradient-to-br from-[#fbfcf2] via-[#f7f8ef] to-primary-container/30 p-3 dark:border-border-accent/15 dark:from-[#11160e] dark:via-[#11160e] dark:to-[#0a0a0a]/40 sm:min-h-[140px] sm:p-4">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(227,236,194,0.25),transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(184,255,92,0.06),transparent_60%)] pointer-events-none" />

                            <div className="relative z-10 flex flex-wrap gap-1.5 sm:gap-2">
                              <span className={`${accentBadge} inline-flex items-center gap-1`}>
                                <Award className="h-3 w-3" />
                                Nível: {folder.label}
                              </span>
                              <span className="inline-flex items-center rounded-full border border-border-muted/10 dark:border-border-accent/10 bg-card dark:bg-card px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted dark:text-text-muted shadow-sm">
                                {pack.level || 'A1-A2'}
                              </span>
                              {levelWeight <= 2 && (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-border-muted/14 bg-card/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted shadow-sm backdrop-blur-sm dark:border-border-accent/16 dark:bg-[#11160e]/80 dark:text-text-muted">
                                  <span className="h-1.5 w-1.5 rounded-full bg-primary/70" aria-hidden="true" />
                                  Iniciante
                                </span>
                              )}
                              {levelWeight === 4 && (
                                <span className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-primary shadow-sm flex gap-1">
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
                                className="h-full w-full object-contain filter drop-shadow-sm select-none opacity-90 transition-transform duration-500 group-hover:scale-105"
                              />
                            </m.div>
                          </div>

                          <div className="relative z-10 flex flex-1 flex-col p-3 sm:p-5">
                            <h3 className="line-clamp-1 text-base font-bold leading-snug text-text transition-colors group-hover:text-primary dark:text-text sm:text-lg">
                              {pack.name}
                            </h3>
                            <p className="mt-1.5 line-clamp-2 min-h-[32px] text-[11px] leading-relaxed text-text-muted dark:text-text-muted sm:mt-2 sm:min-h-[36px] sm:text-xs">
                              {pack.description || 'Domine o vocabulário e a audição estruturada com este pacote de flashcards.'}
                            </p>

                            <div className="mt-2 flex items-center gap-2 text-[9px] font-bold text-[#6d7d63] dark:text-[#8e9a78] sm:mt-4 sm:gap-4 sm:text-[10px]">
                              <span className="flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-primary" />
                                Flashcards de Estudo
                              </span>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#172113]/25 dark:bg-[#d5e6a9]/30" />
                              <span className="text-primary uppercase tracking-wider">Livre Acesso</span>
                            </div>

                            <div className="mt-3 flex w-full items-center gap-2 border-t border-border-muted/15 pt-3 dark:border-border-accent/15 sm:mt-5 sm:gap-3 sm:pt-4">
                              {isSubscribed ? (
                                <div className={subscribedPill}>
                                  <Check className="h-4 w-4 stroke-[2.5]" />
                                  Adicionado à rotina
                                </div>
                              ) : (
                                <button
                                  onClick={() => setSelectedPack(pack)}
                                  className={`${primaryBtn} flex min-h-9 flex-1 sm:min-h-10`}
                                >
                                  <Plus className="h-4 w-4 stroke-[2.5]" />
                                  Desbloquear Treino
                                </button>
                              )}

                              <Link
                                href={`/explore/pack/${pack.id}`}
                                className={ghostIconBtn}
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
                <div className="relative z-10 mx-auto max-w-xl rounded-2xl border border-dashed border-border-muted/18 bg-card/70 p-5 text-center text-sm font-semibold text-text-muted dark:border-border-accent/18 dark:bg-card/70">
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
