import BrandMark from '@/components/ui/BrandMark'
import Link from 'next/link'

export default function Footer() {
  return <footer className="editorial-footer"><Link href="/" aria-label="Kivora — início"><BrandMark showSubtitle={false} /></Link><nav aria-label="Links do rodapé"><Link href="/login">Entrar</Link><Link href="/privacy">Privacidade</Link><Link href="/terms">Termos</Link></nav><small>© {new Date().getFullYear()} Kivora English</small></footer>
}
