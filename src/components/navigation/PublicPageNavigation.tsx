import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BrandMark from '@/components/ui/BrandMark'

export default function PublicPageNavigation({ href = '/', label = 'Voltar ao início' }: {
  href?: string
  label?: string
}) {
  return (
    <nav className="premium-auth-nav public-page-nav" aria-label="Navegação principal">
      <Link href="/" aria-label="Kivora Inglês — início"><BrandMark showSubtitle={false} /></Link>
      <Link href={href} className="premium-text-link"><ArrowLeft size={16} aria-hidden="true" />{label}</Link>
    </nav>
  )
}
