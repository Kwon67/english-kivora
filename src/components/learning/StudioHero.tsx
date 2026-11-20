import type { ReactNode, Ref } from 'react'
import Image from 'next/image'
import SpotIllustration, { type SpotMotif } from '@/components/illustrations/SpotIllustration'
import styles from './StudioHero.module.css'

type StudioHeroProps = {
  title: string
  label?: string
  description?: string
  guidance?: ReactNode
  children?: ReactNode
  compact?: boolean
  ornament?: SpotMotif
  headingId?: string
  headingRef?: Ref<HTMLHeadingElement>
}

export default function StudioHero({
  title,
  label,
  description,
  guidance,
  children,
  compact = false,
  ornament,
  headingId,
  headingRef,
}: StudioHeroProps) {
  return (
    <header className={compact ? `${styles.hero} ${styles.compact}` : styles.hero} data-studio-hero>
      <div className={styles.copy}>
        {label && <p className={styles.kicker}>
          {ornament && <SpotIllustration motif={ornament} className={styles.kickerArt} />}
          {label}
        </p>}
        <h1 id={headingId} ref={headingRef} tabIndex={headingRef ? -1 : undefined} className={styles.headline}>
          {title}
          {!label && ornament && <SpotIllustration motif={ornament} className={styles.headingArt} />}
        </h1>
        {description && <p className={styles.description}>{description}</p>}
        {guidance && <div className={styles.guidance}>{guidance}</div>}
        {children && <div className={styles.actions}>{children}</div>}
      </div>
      <Image
        src="/images/workspace/review-friends.webp"
        alt=""
        width={840}
        height={643}
        sizes={compact ? '(max-width: 639px) 72px, 104px' : '(max-width: 639px) 224px, 320px'}
        className={styles.figure}
        loading="eager"
      />
    </header>
  )
}

