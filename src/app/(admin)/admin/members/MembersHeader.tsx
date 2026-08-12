'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Contact, Users } from 'lucide-react'
import { m } from 'framer-motion'
import type { ReactNode } from 'react'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingRadius } from '@/lib/landingStyles'
import { homeIconGlyph } from '@/lib/homeStyles'
import { adminDashboardIconBoxLg } from '@/features/admin/lib/adminDashboardUi'
import {
  adminMembersHero,
  adminMembersPill,
  adminMembersSoftBtn,
  adminMembersTile,
} from '@/features/admin/lib/adminMembersUi'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'

interface MembersHeaderProps {
  totalMembers: number
  action?: ReactNode
}

export default function MembersHeader({ totalMembers, action }: MembersHeaderProps) {
  return (
    <header className={`${adminMembersHero} p-4 sm:p-8 lg:p-10`}>
      <div className="relative z-10 mb-5">
        <Link href="/admin/dashboard" transitionTypes={navBackTransitionTypes} className={adminMembersSoftBtn}>
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Torre de Comando
        </Link>
      </div>

      <div className="relative z-10 grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-8">
        <div className="min-w-0">
          <StudyBreadcrumb
            items={[
              { label: 'Admin', href: '/admin/dashboard' },
              { label: 'Diretório' },
            ]}
            className="mb-4"
          />

          <div className="flex flex-wrap items-center gap-2">
            <SectionBadge label="Base de alunos" animate={false} />
            <span className={adminMembersPill}>{totalMembers} cadastrados</span>
          </div>

          <h1 className="mt-5 max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl lg:text-5xl">
            Diretório Operacional
          </h1>

          <p className="mt-3 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:text-base">
            Gerencie acessos, acompanhe presença e abra o histórico individual de cada membro do programa. A
            composição completa da base está logo abaixo.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center">
            <a href="#diretorio" className={`${adminMembersSoftBtn} w-full sm:w-auto`}>
              <Contact className="h-4 w-4 shrink-0" />
              Ver diretório
            </a>
            {action ? <div className="w-full sm:w-auto">{action}</div> : null}
          </div>
        </div>

        <m.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.12, stiffness: 260, damping: 24 }}
          className={`${adminMembersTile} p-4 sm:p-6`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className={adminMembersPill}>Composição</span>
              <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
                Diretório da base
              </h2>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary sm:text-sm">
                Papéis, streaks e último acesso — filtre e abra o perfil operacional de cada membro.
              </p>
            </div>
            <div className={adminDashboardIconBoxLg}>
              <Users className={homeIconGlyph} strokeWidth={2.2} />
            </div>
          </div>

          <div
            className={`mt-4 flex min-h-[120px] items-center justify-center overflow-hidden ${landingRadius} border border-brand-dark bg-bg-primary p-3 sm:mt-5 sm:min-h-[140px] sm:p-4`}
          >
            <m.div
              animate={{ y: [0, -4, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
              className="w-full max-w-[180px] sm:max-w-[200px]"
            >
              <Image
                src="/images/admin/undraw-member-roster.svg"
                alt="Ilustração de comunidade e membros"
                width={300}
                height={240}
                unoptimized
                priority
                className="mx-auto h-auto w-full object-contain select-none"
              />
            </m.div>
          </div>
        </m.div>
      </div>
    </header>
  )
}