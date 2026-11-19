import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import BrandMark from '@/components/ui/BrandMark'
import MotionSurface from '@/components/motion/MotionSurface'
import ConversationIllustration from '@/components/illustrations/ConversationIllustration'

type Props = {
  title: string
  eyebrow: string
  description: ReactNode
  children: ReactNode
}
export default function AuthShell({
  title,
  eyebrow,
  description,
  children,
}: Props) {
  return (
    <main id="main-content" className="premium-auth">
      <div className="premium-auth-nav">
        <Link href="/" aria-label="Kivora Inglês — início">
          <BrandMark showSubtitle={false} />
        </Link>
        <Link href="/" className="premium-text-link">
          <ArrowLeft size={15} />
          Voltar ao início
        </Link>
      </div>
      <div className="premium-auth-grid">
        <aside className="auth-learning-story" aria-label="Aprender com a Kivora"><ConversationIllustration /><h2>Um novo jeito de<br />encontrar sua voz.</h2></aside>
        <MotionSurface className="premium-auth-form">
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
