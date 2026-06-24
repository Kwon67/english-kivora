import Image from 'next/image'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'

const navigationLinks = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#na-pratica', label: 'Na prática' },
  { href: '#duvidas', label: 'Dúvidas' },
]

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border-muted/14 bg-card/90 backdrop-blur-xl dark:border-border-accent/16 dark:bg-surface-container-low/90">
      <nav
        aria-label="Navegação da landing page"
        className="mx-auto flex h-16 w-full max-w-[var(--page-width)] items-center justify-between gap-2 px-3 sm:h-20 sm:gap-4 sm:px-6 lg:px-8"
      >
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3" aria-label="Kivora English">
          <Image
            src="/brand/kivora-mark.png"
            alt=""
            aria-hidden="true"
            width={44}
            height={44}
            className="h-9 w-9 shrink-0 object-contain sm:h-11 sm:w-11"
            priority
          />
          <span className="hidden min-w-0 truncate font-[family:var(--font-display)] text-base font-bold tracking-normal text-text dark:text-text min-[390px]:inline min-[390px]:text-lg sm:text-xl">
            Kivora English
          </span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-bold tracking-normal text-text-muted transition-colors hover:text-primary dark:text-text-muted"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex h-10 items-center justify-center rounded-full px-2 text-xs font-bold text-primary transition-colors hover:bg-primary-container dark:hover:bg-primary/12 sm:h-11 sm:px-4 sm:text-sm"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full bg-primary px-3 text-xs font-bold text-on-primary shadow-[0_12px_24px_rgba(24,59,22,0.20)] transition-transform hover:-translate-y-0.5 hover:bg-primary-dark sm:h-11 sm:px-5 sm:text-sm"
          >
            <span className="sm:hidden">Começar</span>
            <span className="hidden sm:inline">Começar grátis</span>
          </Link>
        </div>
      </nav>
    </header>
  )
}
