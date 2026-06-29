import Link from 'next/link'
import Button from '@/components/ui/Button'

const links = [
  { href: '#como-funciona', label: 'Como Funciona' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#precos', label: 'Preços' },
  { href: '#faq', label: 'FAQ' },
]

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-border bg-bg-primary/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="font-heading text-lg font-bold text-brand-dark sm:text-xl">
          Kivora English
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-brand-secondary hover:text-brand-dark"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden font-heading text-xs font-bold uppercase text-brand-dark sm:inline"
          >
            Entrar
          </Link>
          <Button href="/register" variant="outline" className="px-3 py-2 text-xs sm:px-5 sm:py-2.5">
            Começar grátis →
          </Button>
        </div>
      </nav>
    </header>
  )
}
