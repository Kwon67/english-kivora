import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, BookOpen, Headphones, MessageCircle } from 'lucide-react'

const routes = [
  { href: '/courses', title: 'Siga sua trilha', detail: 'Lições no seu nível', icon: BookOpen, tone: 'listening' },
  { href: '/review?mode=guided', title: 'Mude a prática', detail: 'Escute, escreva e relembre', icon: Headphones, tone: 'review' },
  { href: '/tutor', title: 'Puxe uma conversa', detail: 'Situações reais com IA · Pro', icon: MessageCircle, tone: 'tutor' },
] as const

export default function PracticeRoutes() {
  return <section className="practice-routes" aria-label="Outras formas de praticar">
    <p className="product-kicker">MAIS JEITOS DE FAZER SEU INGLÊS CRESCER</p>
    <div>{routes.map(({ href, title, detail, icon: Icon, tone }) => <Link key={href} href={href} data-tone={tone} prefetch={false}><span className="practice-route-icon"><Icon size={20} aria-hidden="true" /></span><span><strong>{title}</strong><small>{detail}</small></span>{tone === 'tutor' && <Image src="/images/workspace/conversation.webp" alt="" width={1536} height={1024} className="workspace-practice-art" loading="lazy" />}<ArrowUpRight size={17} aria-hidden="true" /></Link>)}</div>
  </section>
}
