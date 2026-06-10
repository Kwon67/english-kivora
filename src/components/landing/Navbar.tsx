import Image from 'next/image'
import Link from 'next/link'

const navigationLinks = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#depoimentos', label: 'Depoimentos' },
]

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[var(--color-border)] bg-white/88 backdrop-blur-xl">
      <nav
        aria-label="Navegação da landing page"
        className="mx-auto flex h-20 w-full max-w-[var(--page-width)] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
      >
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label="Kivora English">
          <Image
            src="/brand/kivora-mark.png"
            alt=""
            aria-hidden="true"
            width={44}
            height={44}
            className="h-11 w-11 shrink-0 object-contain"
            priority
          />
          <span className="min-w-0 font-[family:var(--font-display)] text-lg font-bold tracking-normal text-[var(--color-text)] sm:text-xl">
            Kivora English
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-bold tracking-normal text-[var(--color-text-muted)] hover:text-[var(--color-primary)]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-bold text-[var(--color-primary)] hover:bg-[var(--color-primary-light)]"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[var(--color-primary)] px-4 text-sm font-bold text-white shadow-[0_12px_24px_color-mix(in_srgb,var(--color-primary)_18%,transparent)] hover:-translate-y-0.5 hover:brightness-105 sm:px-5"
          >
            Começar grátis
          </Link>
        </div>
      </nav>
    </header>
  )
}
