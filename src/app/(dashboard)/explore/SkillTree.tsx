'use client'

import { m } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Check, Plus, ChevronRight, Lock, Sparkles, Loader2, BookOpen } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { useTransition } from 'react'
import { notify } from '@/lib/toast'

type PackRow = {
  id: string
  name: string
  description: string | null
  level: string | null
  cover_url: string | null
}

interface SkillTreeProps {
  packs: PackRow[]
  subscribedPackIds: string[]
  packArtwork: string[]
  subscribeAction: (packId: string) => Promise<void>
}

const levelOrder: Record<string, number> = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 }
const getLevelWeight = (level: string | null) => {
  const l = (level || '').toUpperCase()
  for (const key in levelOrder) {
    if (l.includes(key)) return levelOrder[key]
  }
  return 99
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
  // Sort packs by level weight to form a clear progression
  const sortedPacks = [...packs].sort((a, b) => getLevelWeight(a.level) - getLevelWeight(b.level))

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15
      }
    }
  }

  return (
    <div className="relative py-8 overflow-hidden sm:overflow-visible">
      {/* Central Pathway Line */}
      <div className="absolute bottom-0 left-1/2 top-0 w-[3px] -translate-x-1/2 bg-gradient-to-b from-[var(--color-primary)]/40 via-[var(--color-border)] to-[var(--color-primary-light)]/20 rounded-full opacity-60 pointer-events-none" />
      
      <m.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-100px" }}
        className="relative z-10 flex flex-col items-center gap-16 sm:gap-24"
      >
        {sortedPacks.map((pack, index) => {
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
              {/* Connector horizontal line to the central timeline */}
              <div className={`
                hidden sm:block absolute top-1/2 h-[2px] w-1/4 bg-gradient-to-r opacity-40 pointer-events-none
                ${isLeft 
                  ? 'right-1/4 from-[var(--color-border)] to-transparent' 
                  : 'left-1/4 from-transparent to-[var(--color-border)]'
                }
              `} />

              {/* Glowing Timeline Checkpoint Node */}
              <m.div 
                whileHover={{ scale: 1.12 }}
                className={`
                  absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-[var(--color-bg)] shadow-md z-20 transition-all duration-300
                  ${isSubscribed 
                    ? 'bg-[var(--color-primary)] text-white ring-4 ring-[var(--color-primary)]/20 shadow-[0_0_15px_rgba(39,99,86,0.3)]' 
                    : 'bg-[var(--color-surface-container-high)] text-[var(--color-text-muted)] border-[var(--color-border)]'
                  }
                `}
              >
                {isSubscribed ? (
                  <Check className="h-6 w-6 stroke-[3]" />
                ) : (
                  <Lock className="h-4.5 w-4.5" />
                )}
              </m.div>

              {/* Empty column spacer to keep staggered grid format */}
              <div className="hidden sm:block sm:flex-1" />

              {/* Interactive Pack Card */}
              <div className="w-[85%] sm:flex-1 z-30">
                <article className={`
                  premium-card group relative flex flex-col overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg
                  ${isSubscribed 
                    ? 'border-emerald-500/20 shadow-sm shadow-emerald-500/5 bg-gradient-to-b from-[var(--color-card)] to-emerald-500/[0.01]' 
                    : 'border-[var(--color-border)]/70 bg-[var(--color-card)]'
                  }
                `}>
                  {/* Card Art Banner */}
                  <div className="relative min-h-[140px] overflow-hidden border-b border-[var(--color-border)]/50 bg-gradient-to-br from-[var(--color-surface-container-lowest)] via-[var(--color-surface-container-low)] to-[var(--color-primary-light)]/20 p-4">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.4),transparent_60%)] pointer-events-none" />
                    
                    <div className="relative z-10 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-[var(--color-card)]/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--color-primary)] border border-[var(--color-border)]/40 shadow-sm backdrop-blur-sm">
                        {pack.level || 'A1-A2'}
                      </span>
                      {levelWeight <= 2 && (
                        <span className="rounded-lg bg-amber-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-amber-600 border border-amber-500/20 shadow-sm backdrop-blur-sm flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          Iniciante
                        </span>
                      )}
                    </div>

                    <m.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                      className="absolute bottom-1 right-3 h-28 w-32 origin-bottom-right"
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

                  {/* Card Information & Actions */}
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="line-clamp-1 text-lg font-black text-[var(--color-text)] transition-colors group-hover:text-[var(--color-primary)] leading-snug">
                      {pack.name}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)] line-clamp-2 min-h-[36px]">
                      {pack.description || 'Domine o vocabulário e a audição estruturada com este pacote de flashcards.'}
                    </p>

                    {/* Stats strip */}
                    <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-[var(--color-text-subtle)]">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        Flashcards de Estudo
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-border)]" />
                      <span className="text-[var(--color-primary)] uppercase tracking-wider">Livre Acesso</span>
                    </div>

                    {/* Actions panel */}
                    <div className="mt-5 flex w-full items-center gap-3 border-t border-[var(--color-border)]/40 pt-4">
                      {isSubscribed ? (
                        <div className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-600">
                          <Check className="h-4 w-4 stroke-[2.5]" />
                          Adicionado à rotina
                        </div>
                      ) : (
                        <button
                          onClick={() => {
	                            startTransition(async () => {
	                              try {
	                                await subscribeAction(pack.id)
	                                notify.success('Pack adicionado com sucesso')
	                              } catch {
	                                notify.error('Verifique os campos')
	                              }
	                            })
	                          }}
                          disabled={isPending}
                          className="btn-primary flex min-h-10 flex-1 items-center justify-center gap-2 text-xs font-bold"
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Plus className="h-4 w-4 stroke-[2.5]" />
                          )}
                          Desbloquear Treino
                        </button>
                      )}

                      <Link
                        href={`/explore/pack/${pack.id}`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-surface-container)] text-[var(--color-text-subtle)] border border-[var(--color-border)]/40 transition-colors hover:bg-[var(--color-surface-container-high)] hover:text-[var(--color-primary)]"
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
    </div>
  )
}
