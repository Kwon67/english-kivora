'use client'

import { m } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Check, Plus, ChevronRight, Lock, Sparkles, Loader2 } from 'lucide-react'
import EmptyState from '@/components/shared/EmptyState'
import { useTransition } from 'react'

type PackRow = {
  id: string
  name: string
  description: string | null
  level: string | null
  cover_url: string | null
}

interface SkillTreeProps {
  packs: PackRow[]
  subscribedPackIds: string[] // using array to avoid hydration issues with Sets
  packArtwork: string[]
  subscribeAction: (packId: string) => Promise<void>
}

const levelOrder: Record<string, number> = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 }
const getLevelWeight = (level: string | null) => {
  const l = (level || '').toUpperCase()
  for (const key in levelOrder) {
    if (l.includes(key)) return levelOrder[key]
  }
  return 99 // Unspecified at the end
}

export default function SkillTree({ packs, subscribedPackIds, packArtwork, subscribeAction }: SkillTreeProps) {
  const [isPending, startTransition] = useTransition()
  
  if (!packs || packs.length === 0) {
    return (
      <EmptyState
        imageSrc="/images/home/undraw-online-learning.svg"
        imageAlt="Ilustração unDraw para catálogo sem pacotes"
        title="Nenhum pacote encontrado"
        description="Volte mais tarde para ver novas sugestões."
        variant="default"
      />
    )
  }

  const subscribedSet = new Set(subscribedPackIds)
  // Sort packs by level to create a logical progression path
  const sortedPacks = [...packs].sort((a, b) => getLevelWeight(a.level) - getLevelWeight(b.level))

  return (
    <div className="relative py-12 overflow-hidden sm:overflow-visible">
      {/* Path Background Line */}
      <div className="absolute bottom-0 left-1/2 top-0 w-2 -translate-x-1/2 rounded-full bg-[var(--color-surface-container-highest)] dark:bg-[var(--color-surface-variant)] opacity-50" />
      
      <div className="relative z-10 flex flex-col items-center gap-16 sm:gap-28">
        {sortedPacks.map((pack, index) => {
          const isSubscribed = subscribedSet.has(pack.id)
          const coverUrl = packArtwork[index % packArtwork.length]
          const isLeft = index % 2 === 0
          const levelWeight = getLevelWeight(pack.level)
          
          return (
            <m.div
              key={pack.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`relative flex w-full max-w-4xl items-center justify-center gap-4 sm:gap-8 ${isLeft ? 'flex-row' : 'flex-row-reverse'}`}
            >
              {/* Connector Line to Center */}
              <div className={`hidden sm:block absolute top-1/2 h-1 w-1/4 bg-[var(--color-surface-container-highest)] dark:bg-[var(--color-surface-variant)] opacity-50 ${isLeft ? 'right-1/4' : 'left-1/4'}`} />

              {/* Node (Center dot) */}
              <m.div 
                whileHover={{ scale: 1.15 }}
                className={`absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[6px] border-[var(--color-bg)] bg-[var(--color-surface-container-highest)] shadow-xl z-20 transition-colors duration-300 ${isSubscribed ? 'ring-4 ring-[var(--color-primary)]/20' : ''}`}
              >
                {isSubscribed ? (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-[0_0_20px_rgba(39,99,86,0.4)]">
                    <Check className="h-7 w-7" strokeWidth={3} />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-full bg-[var(--color-surface-container-highest)] text-[var(--color-text-muted)] dark:bg-[var(--color-surface-variant)]">
                    <Lock className="h-6 w-6" />
                  </div>
                )}
              </m.div>

              {/* Spacer for the side without the card */}
              <div className="hidden sm:block sm:flex-1" />

              {/* Pack Card */}
              <div className="w-[85%] sm:flex-1 z-30">
                <article className={`premium-card group relative flex flex-col overflow-hidden border border-[var(--color-border)]/70 bg-[var(--color-card)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--color-border-hover)] hover:shadow-[var(--shadow-xl)] ${isSubscribed ? 'ring-2 ring-[var(--color-primary)]/20' : ''}`}>
                  
                  <div className="relative min-h-32 overflow-hidden border-b border-[var(--color-border)]/50 bg-[linear-gradient(145deg,var(--color-primary-light),var(--color-secondary-light))] p-4 dark:bg-[linear-gradient(145deg,var(--color-primary-container),var(--color-surface-variant))]">
                    <div className="absolute inset-x-0 bottom-0 h-16 bg-[linear-gradient(180deg,transparent,rgba(24,32,29,0.16))]" />
                    <div className={`relative z-10 flex items-start gap-3`}>
                      <span className="rounded-[0.6rem] bg-white/72 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[var(--color-primary)] shadow-[var(--shadow-sm)] backdrop-blur-md dark:bg-black/40 dark:text-[var(--color-primary-light)]">
                        {pack.level || 'Básico'}
                      </span>
                      {levelWeight <= 2 && (
                        <span className="rounded-[0.6rem] bg-amber-400/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-amber-600 shadow-[var(--shadow-sm)] backdrop-blur-md dark:bg-amber-400/10 dark:text-amber-400 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Iniciante
                        </span>
                      )}
                    </div>

                    <Image
                      src={coverUrl}
                      alt=""
                      width={400}
                      height={300}
                      unoptimized
                      className={`absolute bottom-0 h-28 w-32 object-contain opacity-90 transition-transform duration-500 group-hover:scale-110 right-2 origin-bottom-right`}
                    />
                  </div>

                  <div className={`flex flex-1 flex-col p-4 sm:p-5`}>
                    <h3 className="line-clamp-2 text-xl font-black leading-tight text-[var(--color-text)]">
                      {pack.name}
                    </h3>
                    <p className={`mt-2 min-h-[2.5rem] text-sm leading-relaxed text-[var(--color-text-muted)] line-clamp-2`}>
                      {pack.description || 'Sem descrição disponível para este pacote.'}
                    </p>

                    <div className={`mt-5 flex w-full items-center gap-3 border-t border-[var(--color-border)]/40 pt-4 flex-row sm:justify-start`}>
                      {isSubscribed ? (
                        <div className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[0.75rem] bg-[var(--color-primary-container)] px-3 py-2 text-sm font-bold text-[var(--color-on-primary-container)] dark:bg-[var(--color-primary)]/20 dark:text-[var(--color-primary-light)]">
                          <Check className="h-4 w-4" />
                          Inscrito
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            startTransition(async () => {
                              await subscribeAction(pack.id)
                            })
                          }}
                          disabled={isPending}
                          className="btn-primary flex min-h-11 flex-1 items-center justify-center gap-2 text-sm"
                        >
                          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                          Desbloquear
                        </button>
                      )}

                      <Link
                        href={`/explore/pack/${pack.id}`}
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.75rem] bg-[var(--color-surface-container)] text-[var(--color-text-subtle)] transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-primary)]"
                        aria-label={`Abrir detalhes de ${pack.name}`}
                        title="Ver detalhes"
                      >
                        <ChevronRight className={`h-5 w-5`} />
                      </Link>
                    </div>
                  </div>
                </article>
              </div>
            </m.div>
          )
        })}
      </div>
    </div>
  )
}