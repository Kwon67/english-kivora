'use client'

import { Bell, ShieldCheck, ShieldAlert } from 'lucide-react'
import { m } from 'framer-motion'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import {
  settingsHero,
  settingsPill,
  settingsProtectionStrip,
  settingsSoftBtn,
} from '@/features/profile/lib/settingsPageUi'

interface SettingsHeaderProps {
  weeklyReportEnabled: boolean
  mfaEnabled: boolean
}

export default function SettingsHeader({ weeklyReportEnabled, mfaEnabled }: SettingsHeaderProps) {
  const protectionLevel = mfaEnabled ? 'Protegida' : 'Básica'
  const protectionScore = (mfaEnabled ? 70 : 25) + (weeklyReportEnabled ? 30 : 0)

  return (
    <header className={`${settingsHero} p-5 sm:p-8 lg:p-10`}>
      {/* Coluna única: o card "Resumo" que ficava à direita repetia o estado do 2FA que a pílula,
          a faixa de proteção e o próprio bloco de Segurança abaixo já declaram — eram quatro
          afirmações da mesma coisa no mesmo cabeçalho. */}
      <div className="relative z-10 min-w-0">
        <div className="min-w-0">
          <StudyBreadcrumb
            items={[
              { label: 'Início', href: '/home' },
              { label: 'Configurações' },
            ]}
            className="mb-3"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className={`${settingsPill} ${mfaEnabled ? 'bg-brand-accent' : 'bg-bg-primary'}`}>
              {protectionLevel}
            </span>
          </div>

          <h1 className="mt-4 max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl">
            Preferências e segurança
          </h1>

          <div className={`${settingsProtectionStrip} mt-5 sm:mt-6`}>
            <div className="min-w-0">
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">
                Nível de proteção
              </p>
              <p className="mt-1 font-heading text-lg font-bold text-brand-dark sm:text-xl">
                {mfaEnabled ? '2FA ativo' : '2FA desativado'}
              </p>
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-3 sm:max-w-xs">
              <div className="h-2 flex-1 overflow-hidden rounded-full border border-brand-dark bg-bg-card">
                <m.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(8, protectionScore)}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                  className={`h-full rounded-full ${mfaEnabled ? 'bg-brand-dark' : 'bg-brand-secondary/50'}`}
                />
              </div>
              <span className="shrink-0 font-heading text-sm font-bold tabular-nums text-brand-dark">
                {protectionScore}%
              </span>
            </div>
          </div>

          <p className="mt-4 max-w-2xl font-body text-sm leading-relaxed text-brand-secondary sm:mt-5 sm:text-base">
            Controle notificações da plataforma e configure uma camada extra de proteção para o seu acesso.
          </p>

          <div className="mt-6 flex flex-col gap-2.5 sm:mt-8 sm:flex-row sm:flex-wrap sm:gap-3">
            <a href="#preferences" className={`${settingsSoftBtn} w-full sm:w-auto`}>
              <Bell className="h-4 w-4 shrink-0" />
              Preferências
            </a>
            <a href="#security" className={`${settingsSoftBtn} w-full sm:w-auto`}>
              {mfaEnabled ? (
                <ShieldCheck className="h-4 w-4 shrink-0" />
              ) : (
                <ShieldAlert className="h-4 w-4 shrink-0" />
              )}
              Segurança
            </a>
          </div>
        </div>

      </div>
    </header>
  )
}