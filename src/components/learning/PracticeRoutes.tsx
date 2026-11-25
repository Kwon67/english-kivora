import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, BookOpen, ChevronDown, Headphones, MessageCircle } from 'lucide-react'
import styles from './PracticeRoutes.module.css'

const routes = [
  { href: '/courses', title: 'Siga sua trilha', detail: 'Lições no seu nível', icon: BookOpen, tone: 'listening' },
  { href: '/review?mode=guided', title: 'Mude a prática', detail: 'Escute, escreva e relembre', icon: Headphones, tone: 'review' },
  { href: '/tutor', title: 'Puxe uma conversa', detail: 'Situações reais com IA · Pro', icon: MessageCircle, tone: 'tutor' },
] as const

export default function PracticeRoutes({ collapsible = false }: { collapsible?: boolean }) {
  const links = routes.map(({ href, title, detail, icon: Icon, tone }) => (
    <Link key={href} href={href} data-tone={tone} prefetch={false}>
      <span className={collapsible ? styles.icon : 'practice-route-icon'}>
        <Icon size={20} aria-hidden="true" />
      </span>
      <span><strong>{title}</strong><small>{detail}</small></span>
      {!collapsible && tone === 'tutor' && (
        <Image src="/images/workspace/conversation.webp" alt="" width={1536} height={1024} className="workspace-practice-art" loading="lazy" />
      )}
      <ArrowUpRight size={17} aria-hidden="true" />
    </Link>
  ))

  if (collapsible) {
    return (
      <details className={styles.card}>
        <summary>Outras formas de praticar <ChevronDown size={18} aria-hidden="true" /></summary>
        <nav className={styles.list} aria-label="Outras formas de praticar">{links}</nav>
      </details>
    )
  }

  return (
    <section className="practice-routes" aria-label="Outras formas de praticar">
      <p className="product-kicker">MAIS JEITOS DE FAZER SEU INGLÊS CRESCER</p>
      <div>{links}</div>
    </section>
  )
}
