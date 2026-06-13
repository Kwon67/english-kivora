'use client'

import { m } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Check, Plus, ChevronRight, Lock, Sparkles, Loader2, BookOpen, Folder, FolderOpen } from 'lucide-react'
import EmptyState from '@/components/ui/EmptyState'
import { useTransition } from 'react'
import { notify } from '@/lib/toast'
import { groupPacksByFolder } from '@/features/cards/lib/packFolders'

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

const glassTile =
  'home-glass-tile render-contained relative overflow-hidden rounded-[20px] border border-dashed border-[#172113]/22 bg-[#f7f8ef] shadow-[0_12px_34px_rgba(31,43,18,0.10)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_16px_38px_rgba(0,0,0,0.42)] transition-all duration-300'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-[#183b16] dark:border-[#d5e6a9]/18 dark:bg-[#1d2b14] dark:text-[#b8ff5c]'
const neutralBadge =
  'inline-flex items-center rounded-full border border-[#172113]/10 dark:border-[#d5e6a9]/10 bg-[#fbfcf2] dark:bg-[#11160e] px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-[#425039] dark:text-[#b9c3a4] shadow-sm'
const accentBadge =
  'inline-flex items-center rounded-full border border-[#183b16]/10 dark:border-[#b8ff5c]/10 bg-[#183b16]/5 dark:bg-[#b8ff5c]/5 px-3 py-1 text-[0.66rem] font-bold uppercase tracking-[0.08em] text-[#183b16] dark:text-[#b8ff5c] shadow-sm'
const iconClass =
  'bg-[#e3ecc2] text-[#183b16] ring-[#172113]/18 dark:bg-[#0a0a0a] dark:text-[#b8ff5c] dark:ring-[#d5e6a9]/18'
const primaryBtn =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[#183b16] dark:bg-[#b8ff5c] px-3 py-2 text-xs font-bold text-[#f7f8ef] dark:text-[#050704] border border-dashed border-[#e3ecc2]/50 dark:border-[#1d2b14]/50 shadow-[0px_8px_15px_0px_rgba(24,59,22,0.15)] transition-all hover:bg-[#24551d] dark:hover:bg-[#cbff83] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-55'
const ghostIconBtn =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#fbfcf2] dark:bg-[#11160e] text-[#425039] dark:text-[#b9c3a4] border border-[#172113]/15 dark:border-[#d5e6a9]/15 transition-colors hover:bg-[#183b16]/10 dark:hover:bg-[#b8ff5c]/10 hover:text-[#183b16] dark:hover:text-[#b8ff5c]'
const subscribedPill =
  'inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl border border-[#183b16]/20 dark:border-[#b8ff5c]/20 bg-[#183b16]/5 dark:bg-[#b8ff5c]/5 px-3 py-2 text-xs font-bold text-[#183b16] dark:text-[#b8ff5c]'
const chevronAccent =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#183b16]/10 dark:bg-[#b8ff5c]/10 text-[#183b16] dark:text-[#b8ff5c] border border-[#183b16]/10 dark:border-[#b8ff5c]/10 transition-transform group-hover:translate-x-1'

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
  const folders = groupPacksByFolder(packs)

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
    <div className="space-y-20 sm:space-y-28">
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
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e3ecc2] text-[#183b16] ring-1 ring-[#172113]/18 dark:bg-[#1d2b14] dark:text-[#b8ff5c] dark:ring-[#d5e6a9]/18">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={softKicker}>Pasta de estudo</p>
                    <h3 className="mt-2 font-montserrat text-xl font-bold text-[#10130f] dark:text-[#f4f7e9] sm:text-2xl">
                      {folder.label}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-[#425039] dark:text-[#b9c3a4]">
                      Os pacotes abaixo pertencem a esta pasta. Avance na ordem sugerida ou escolha o treino que fizer sentido para você.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <span className={accentBadge}>
                    <Folder className="mr-1.5 h-3 w-3" />
                    {folder.packs.length} {folder.packs.length === 1 ? 'pacote' : 'pacotes'}
                  </span>
                </div>
              </div>
            </m.div>

            <div className="relative py-8 overflow-hidden sm:overflow-visible">
              <div className="absolute bottom-0 left-1/2 top-0 w-[3px] -translate-x-1/2 bg-gradient-to-b from-[#183b16]/35 via-[#172113]/25 to-[#b8ff5c]/15 dark:from-[#b8ff5c]/25 dark:via-[#d5e6a9]/20 dark:to-[#b8ff5c]/10 rounded-full opacity-60 pointer-events-none" />

              <m.div
                variants={containerVariants}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-100px' }}
                className="relative z-10 flex flex-col items-center gap-16 sm:gap-24"
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
                      <div className={`
                        hidden sm:block absolute top-1/2 h-[2px] w-1/4 bg-gradient-to-r opacity-40 pointer-events-none
                        ${isLeft
                          ? 'right-1/4 from-[#172113]/25 dark:from-[#d5e6a9]/20 to-transparent'
                          : 'left-1/4 from-transparent to-[#172113]/25 dark:to-[#d5e6a9]/20'
                        }
                      `} />

                      <m.div
                        whileHover={{ scale: 1.12 }}
                        className={`
                          absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-[#f4f5e8] dark:border-[#0a0a0a] shadow-md z-20 transition-all duration-300
                          ${isSubscribed
                            ? 'bg-[#183b16] text-[#f7f8ef] dark:bg-[#b8ff5c] dark:text-[#050704] ring-4 ring-[#183b16]/20 dark:ring-[#b8ff5c]/20 shadow-[0_0_15px_rgba(24,59,22,0.3)]'
                            : 'bg-[#fbfcf2] dark:bg-[#11160e] text-[#425039] dark:text-[#b9c3a4] border-[#172113]/15 dark:border-[#d5e6a9]/15'
                          }
                        `}
                      >
                        {isSubscribed ? (
                          <Check className="h-6 w-6 stroke-[3]" />
                        ) : (
                          <Lock className="h-4.5 w-4.5" />
                        )}
                      </m.div>

                      <div className="hidden sm:block sm:flex-1" />

                      <div className="w-[85%] sm:flex-1 z-30">
                        <article className={`${glassTile} group relative flex flex-col overflow-hidden ${isSubscribed ? 'hover:border-[#183b16]/30 dark:hover:border-[#b8ff5c]/30' : ''} hover:-translate-y-1 hover:shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:hover:shadow-[0_20px_54px_rgba(0,0,0,0.5)] transition-all duration-300`}>
                          <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />

                          <div className="relative min-h-[140px] overflow-hidden border-b border-[#172113]/15 dark:border-[#d5e6a9]/15 bg-gradient-to-br from-[#fbfcf2] via-[#f7f8ef] to-[#e3ecc2]/30 dark:from-[#11160e] dark:via-[#11160e] dark:to-[#0a0a0a]/40 p-4">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(227,236,194,0.25),transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(184,255,92,0.06),transparent_60%)] pointer-events-none" />

                            <div className="relative z-10 flex flex-wrap gap-2">
                              <span className={`${accentBadge} inline-flex items-center gap-1`}>
                                <Folder className="h-3 w-3" />
                                Pasta: {folder.label}
                              </span>
                              <span className="inline-flex items-center rounded-full border border-[#172113]/10 dark:border-[#d5e6a9]/10 bg-[#fbfcf2] dark:bg-[#11160e] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#425039] dark:text-[#b9c3a4] shadow-sm">
                                {pack.level || 'A1-A2'}
                              </span>
                              {levelWeight <= 2 && (
                                <span className="inline-flex items-center rounded-full border border-amber-900/10 dark:border-amber-400/20 bg-amber-900/5 dark:bg-amber-400/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#425039] dark:text-amber-300 shadow-sm backdrop-blur-sm flex items-center gap-1">
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

                          <div className="flex flex-1 flex-col p-5 relative z-10">
                            <h3 className="line-clamp-1 text-lg font-bold text-[#10130f] dark:text-[#f4f7e9] transition-colors group-hover:text-[#183b16] dark:group-hover:text-[#b8ff5c] leading-snug">
                              {pack.name}
                            </h3>
                            <p className="mt-2 text-xs leading-relaxed text-[#425039] dark:text-[#b9c3a4] line-clamp-2 min-h-[36px]">
                              {pack.description || 'Domine o vocabulário e a audição estruturada com este pacote de flashcards.'}
                            </p>

                            <div className="mt-4 flex items-center gap-4 text-[10px] font-bold text-[#6d7d63] dark:text-[#8e9a78]">
                              <span className="flex items-center gap-1.5">
                                <BookOpen className="w-3.5 h-3.5 text-[#183b16] dark:text-[#b8ff5c]" />
                                Flashcards de Estudo
                              </span>
                              <span className="w-1.5 h-1.5 rounded-full bg-[#172113]/25 dark:bg-[#d5e6a9]/30" />
                              <span className="text-[#183b16] dark:text-[#b8ff5c] uppercase tracking-wider">Livre Acesso</span>
                            </div>

                            <div className="mt-5 flex w-full items-center gap-3 border-t border-[#172113]/15 dark:border-[#d5e6a9]/15 pt-4">
                              {isSubscribed ? (
                                <div className={subscribedPill}>
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
                                  className={`${primaryBtn} flex min-h-10 flex-1`}
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
            </div>
          </section>
        )
      })}
    </div>
  )
}
