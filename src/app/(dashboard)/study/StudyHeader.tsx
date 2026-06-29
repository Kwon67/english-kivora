'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Compass, Plus } from 'lucide-react'
import { m } from 'framer-motion'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import { LibraryBadge, ghostBtn, primaryBtn, softKicker } from '@/features/profile/lib/libraryUi'
import { navBackTransitionTypes, navForwardTransitionTypes } from '@/lib/navigationTransitions'

interface StudyHeaderProps {
  activityCount: number
  pendingCount: number
}

const glassTile =
  'render-contained relative overflow-hidden rounded-2xl border-2 border-brand-dark bg-bg-card shadow-[8px_8px_0_var(--color-brand-dark)] transition-all duration-300'
export default function StudyHeader({ activityCount, pendingCount }: StudyHeaderProps) {
  return (
    <header className={`${glassTile} relative overflow-hidden p-6 sm:p-8 lg:p-10 group`}>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 relative z-10">
        <Link
          href="/home"
          transitionTypes={navBackTransitionTypes}
          className={`${ghostBtn} min-h-10`}
        >
          <ArrowLeft className="h-4 w-4" />
          Início
        </Link>
        <Link
          href="/explore"
          transitionTypes={navForwardTransitionTypes}
          className={primaryBtn}
        >
          <Plus className="h-4 w-4" />
          Adicionar pack
        </Link>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center relative z-10">
        <div>
          <StudyBreadcrumb
            items={[
              { label: 'Início', href: '/home' },
              { label: 'Minha rotina' },
            ]}
            className="mb-4"
          />
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <LibraryBadge label="Plano de estudos" />
            <p className="rounded-full border border-brand-dark bg-brand-accent px-3 py-1 font-heading text-xs font-bold uppercase tracking-widest text-brand-dark">Rotina diária</p>
          </div>
          <h1 className="max-w-2xl font-heading text-4xl font-bold leading-tight text-brand-dark sm:text-5xl">
            Minha rotina
          </h1>
          <p className="mt-5 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Escolha o que estudar hoje. Você pode adicionar packs do catálogo e remover apenas os que incluiu.
          </p>

          <div className="mt-8 flex flex-wrap gap-3.5">
            <Link href="/explore" transitionTypes={navForwardTransitionTypes} className={primaryBtn}>
              <Compass className="h-4 w-4" />
              Explorar packs
            </Link>
            {pendingCount > 0 ? (
              <a href="#atividades" className={ghostBtn}>
                <BookOpen className="h-4 w-4" />
                {pendingCount} {pendingCount === 1 ? 'pendente' : 'pendentes'}
              </a>
            ) : null}
          </div>
        </div>

        <m.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.15 }}
          className={`${glassTile} relative z-10 overflow-hidden p-5 transition-transform hover:-translate-y-1 sm:p-6`}
        >
          <div className="flex items-start justify-between gap-4 relative z-10">
            <div>
              <p className={softKicker}>Hoje</p>
              <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
                {activityCount} {activityCount === 1 ? 'atividade' : 'atividades'}
              </h2>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary">
                {pendingCount > 0
                  ? `${pendingCount} ${pendingCount === 1 ? 'sessão aguardando' : 'sessões aguardando'} para você começar.`
                  : activityCount > 0
                    ? 'Todas as sessões de hoje foram concluídas.'
                    : 'Adicione packs do catálogo para montar sua rotina.'}
              </p>
            </div>
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-brand-dark bg-brand-accent text-brand-dark shadow-[3px_3px_0_var(--color-brand-dark)]">
              <BookOpen className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-5 flex min-h-[140px] items-center justify-center overflow-hidden rounded-xl border-2 border-brand-dark bg-bg-primary p-4 shadow-[4px_4px_0_var(--color-brand-dark)]">
            <m.div
              animate={{ y: [0, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="w-full max-w-[200px]"
            >
              <Image
                src="/images/home/undraw-studying.svg"
                alt="Ilustração de rotina de estudos"
                width={300}
                height={240}
                unoptimized
                priority
                className="mx-auto h-auto w-full object-contain filter drop-shadow-sm select-none"
              />
            </m.div>
          </div>
        </m.div>
      </div>
    </header>
  )
}
