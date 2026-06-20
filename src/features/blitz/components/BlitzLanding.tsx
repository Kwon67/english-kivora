'use client'

import Link from 'next/link'
import { ArrowRight, Flame, Heart, Trophy, Zap } from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import type { BlitzLeaderboardEntry } from '@/features/blitz/lib/weeklyBlitzLeaderboard'
import {
  blitzGlassPanel,
  blitzGlassTile,
  blitzKicker,
  blitzNestedRow,
  blitzPrimaryBtn,
} from '@/features/blitz/lib/blitzUi'
import StaggeredFadeIn from '@/components/ui/StaggeredFadeIn'

interface BlitzLandingProps {
  personalBest: number
  bestCombo: number
  leaderboard: BlitzLeaderboardEntry[]
  scoresReady?: boolean
}

export default function BlitzLanding({
  personalBest,
  bestCombo,
  leaderboard,
  scoresReady = true,
}: BlitzLandingProps) {
  return (
    <div className="space-y-6 pb-4 animate-fade-in">
      {!scoresReady && (
        <section className="rounded-[20px] border border-dashed border-amber-500/35 bg-amber-500/10 px-5 py-4 text-sm text-text">
          Os recordes do Blitz ainda não estão ativos neste ambiente. Aplique a migration{' '}
          <code className="rounded bg-black/10 px-1.5 py-0.5 text-xs">20260619120000_remove_arena_add_blitz.sql</code>{' '}
          no Supabase para habilitar ranking e salvamento de partidas. Você ainda pode jogar normalmente.
        </section>
      )}

      <StaggeredFadeIn>
        <section className={`${blitzGlassPanel} p-6 sm:p-8`}>
          <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.75),rgba(251,252,242,0.18)_42%,transparent)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.10),rgba(17,22,14,0)_48%)]" />
          <div className="relative z-10">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-dashed border-border-muted/22 bg-primary-container text-primary shadow-sm dark:border-border-accent/18 dark:bg-primary/12">
              <Zap className="h-6 w-6" strokeWidth={2} />
            </div>
            <p className={`${blitzKicker} mt-5`}>Desafio Relâmpago</p>
            <h1 className="mt-4 font-montserrat text-3xl font-bold leading-tight text-text sm:text-4xl">
              Blitz
            </h1>
            <p className="mt-4 max-w-2xl font-inter text-sm leading-relaxed text-text-muted sm:text-base">
              Partida solo rápida com modos mistos, combos e três vidas. Quanto mais acertos seguidos, maior o multiplicador de pontos.
            </p>
            <Link
              href="/blitz/play"
              className={`${blitzPrimaryBtn} mt-6`}
              transitionTypes={navForwardTransitionTypes}
            >
              <Zap className="h-4 w-4" />
              Jogar agora
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </StaggeredFadeIn>

      <div className="grid gap-6 lg:grid-cols-2">
        <StaggeredFadeIn delay={0.05}>
          <section className={`${blitzGlassPanel} p-6`}>
            <p className={blitzKicker}>Seu recorde</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className={blitzGlassTile}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-subtle">Melhor score</p>
                <p className="mt-2 flex items-center gap-2 text-3xl font-black text-text">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  {personalBest}
                </p>
              </div>
              <div className={blitzGlassTile}>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-subtle">Melhor combo</p>
                <p className="mt-2 flex items-center gap-2 text-3xl font-black text-text">
                  <Flame className="h-5 w-5 text-orange-500" />
                  {bestCombo}
                </p>
              </div>
            </div>
          </section>
        </StaggeredFadeIn>

        <StaggeredFadeIn delay={0.1}>
          <section className={`${blitzGlassPanel} p-6`}>
            <div className="flex items-center justify-between gap-3">
              <p className={blitzKicker}>Top da semana</p>
              <Link
                href="/blitz/ranking"
                className="text-xs font-bold text-primary hover:underline"
                transitionTypes={navForwardTransitionTypes}
              >
                Ver ranking completo
              </Link>
            </div>
            {leaderboard.length === 0 ? (
              <p className="mt-4 text-sm text-text-muted">Seja o primeiro a pontuar esta semana.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {leaderboard.map((entry) => (
                  <li key={entry.userId} className={blitzNestedRow}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-border-muted/18 bg-primary-container text-xs font-black text-primary dark:border-border-accent/18 dark:bg-primary/12">
                        {entry.rank}
                      </span>
                      <span className="font-bold text-text">{entry.username}</span>
                    </div>
                    <span className="text-sm font-black text-text">{entry.score}</span>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </StaggeredFadeIn>
      </div>

      <StaggeredFadeIn delay={0.15}>
        <section className={`${blitzGlassPanel} p-6`}>
          <p className={blitzKicker}>Como funciona</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <article className={`${blitzGlassTile} text-left`}>
              <Heart className="h-5 w-5 text-rose-500" />
              <h3 className="mt-3 font-bold text-text">3 vidas</h3>
              <p className="mt-2 text-sm text-text-muted">Cada erro custa um coração. Quando acabarem, a partida termina.</p>
            </article>
            <article className={`${blitzGlassTile} text-left`}>
              <Flame className="h-5 w-5 text-orange-500" />
              <h3 className="mt-3 font-bold text-text">Combos</h3>
              <p className="mt-2 text-sm text-text-muted">Acertos seguidos aumentam o multiplicador até 5x.</p>
            </article>
            <article className={`${blitzGlassTile} text-left`}>
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="mt-3 font-bold text-text">Modos mistos</h3>
              <p className="mt-2 text-sm text-text-muted">Múltipla escolha, digitação, combinação e fala no microfone em sequência aleatória.</p>
            </article>
          </div>
        </section>
      </StaggeredFadeIn>
    </div>
  )
}