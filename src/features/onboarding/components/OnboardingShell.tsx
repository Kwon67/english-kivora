'use client'

import { useEffect, useRef, type ReactNode } from 'react'
import styles from './Onboarding.module.css'

type OnboardingShellProps = {
  step: number
  totalSteps: number
  title: string
  subtitle?: string
  children: ReactNode
}

export default function OnboardingShell({
  step,
  totalSteps,
  title,
  subtitle,
  children,
}: OnboardingShellProps) {
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (step > 1) heading.current?.focus()
  }, [step, title])

  return (
    <div data-testid="onboarding-wizard" className={styles.shell}>
      <div className={styles.progress}>
        <span>Etapa <strong>{step} de {totalSteps}</strong></span>
        <div
          className={styles.track}
          role="progressbar"
          aria-label="Progresso da configuração"
          aria-valuemin={0}
          aria-valuemax={totalSteps}
          aria-valuenow={step}
        >
          <span style={{ width: `${(step / totalSteps) * 100}%` }} />
        </div>
      </div>
      <section aria-labelledby="onboarding-heading">
        <h1 id="onboarding-heading" ref={heading} tabIndex={-1}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <div className={styles.content}>{children}</div>
      </section>
    </div>
  )
}
