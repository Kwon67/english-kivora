import Link from 'next/link'
import type { ReactNode } from 'react'
import PublicPageNavigation from '@/components/navigation/PublicPageNavigation'
import MotionSurface from '@/components/motion/MotionSurface'
import ConversationIllustration from '@/components/illustrations/ConversationIllustration'
import SpotIllustration from '@/components/illustrations/SpotIllustration'

type Props = {
  className?: string
  formIllustration?: ReactNode
  title: string
  eyebrow: string
  description: ReactNode
  children: ReactNode
}
export default function AuthShell({
  className = '',
  formIllustration,
  title,
  eyebrow,
  description,
  children,
}: Props) {
  return (
    <main id="main-content" className={`premium-auth ${className}`}>
      <PublicPageNavigation />
      <div className="premium-auth-grid">
        <aside className="auth-learning-story relative" aria-label="Aprender com a Kivora">
          <ConversationIllustration />
          <SpotIllustration motif="chat" className="pointer-events-none absolute right-7 top-6 h-11 w-11" />
          <h2>Um novo jeito de<br />encontrar sua voz.</h2>
        </aside>
        <MotionSurface className="premium-auth-form">
          {formIllustration}
          <p className="premium-kicker">{eyebrow}</p>
          <h1>{title}</h1>
          <div className="premium-auth-description">{description}</div>
          <div className="premium-auth-fields">{children}</div>
        </MotionSurface>
      </div>
      <footer className="premium-auth-footer">
        <span>Kivora Inglês</span>
        <div>
          <Link href="/privacy" prefetch={false}>Privacidade</Link>
          <Link href="/terms" prefetch={false}>Termos de uso</Link>
        </div>
      </footer>
    </main>
  )
}
