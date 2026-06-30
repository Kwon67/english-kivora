'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Bell, ShieldCheck, ShieldAlert } from 'lucide-react'
import { m } from 'framer-motion'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import SectionBadge from '@/components/ui/SectionBadge'
import { landingRadius } from '@/lib/landingStyles'
import {
  settingsHero,
  settingsIconBox,
  settingsPill,
  settingsProtectionStrip,
  settingsSoftBtn,
  settingsTile,
} from '@/features/profile/lib/settingsPageUi'
import { navBackTransitionTypes } from '@/lib/navigationTransitions'

interface SettingsHeaderProps {
  weeklyReportEnabled: boolean
  mfaEnabled: boolean
}

export default function SettingsHeader({ weeklyReportEnabled, mfaEnabled }: SettingsHeaderProps) {
  const protectionLevel = mfaEnabled ? 'Protegida' : 'Básica'
  const protectionScore = (mfaEnabled ? 70 : 25) + (weeklyReportEnabled ? 30 : 0)

  return (
    <header className={`${settingsHero} p-4 sm:p-8 lg:p-10`}>
      <div className="relative z-10 mb-5">
        <Link href="/home" transitionTypes={navBackTransitionTypes} className={settingsSoftBtn}>
          <ArrowLeft className="h-4 w-4 shrink-0" />
          Início
        </Link>
      </div>

      <div className="relative z-10 grid min-w-0 gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-8">
        <div className="min-w-0">
          <StudyBreadcrumb
            items={[
              { label: 'Início', href: '/home' },
              { label: 'Configurações' },
            ]}
            className="mb-4"
          />

          <div className="flex flex-wrap items-center gap-2">
            <SectionBadge label="Painel da conta" animate={false} />
            <span className={`${settingsPill} ${mfaEnabled ? 'bg-brand-accent' : 'bg-bg-primary'}`}>
              {protectionLevel}
            </span>
          </div>

          <h1 className="mt-5 max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl lg:text-5xl">
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

        <m.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.12, stiffness: 260, damping: 24 }}
          className={`${settingsTile} p-4 sm:p-6`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <span className={settingsPill}>Resumo</span>
              <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
                {mfaEnabled ? 'Conta protegida' : 'Reforço recomendado'}
              </h2>
              <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary sm:text-sm">
                {mfaEnabled
                  ? 'Autenticação em duas etapas ativa. Você pode desativá-la na seção Segurança.'
                  : 'Ative o 2FA para bloquear acessos não autorizados mesmo se sua senha vazar.'}
              </p>
            </div>
            <div className={`h-11 w-11 shrink-0 ${settingsIconBox}`}>
              {mfaEnabled ? (
                <ShieldCheck className="h-5 w-5" strokeWidth={2.2} />
              ) : (
                <ShieldAlert className="h-5 w-5" strokeWidth={2.2} />
              )}
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
                src="/images/home/undraw-biometric-login.svg"
                alt="Ilustração de login seguro e autenticação"
                width={300}
                height={240}
                unoptimized
                priority
                className="mx-auto h-auto w-full object-contain select-none"
              />
            </m.div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5">
            <div className={`${landingRadius} border border-brand-dark/25 bg-bg-primary px-3 py-2.5`}>
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">2FA</p>
              <p className="mt-1 font-heading text-sm font-bold text-brand-dark">{mfaEnabled ? 'Ativo' : 'Inativo'}</p>
            </div>
            <div className={`${landingRadius} border border-brand-dark/25 bg-bg-primary px-3 py-2.5`}>
              <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-brand-secondary">Relatório</p>
              <p className="mt-1 font-heading text-sm font-bold text-brand-dark">{weeklyReportEnabled ? 'Semanal' : 'Off'}</p>
            </div>
          </div>
        </m.div>
      </div>
    </header>
  )
}