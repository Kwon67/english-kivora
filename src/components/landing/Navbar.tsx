import Image from 'next/image'
import Link from 'next/link'
import ThemeToggle from '@/components/ui/ThemeToggle'

const navigationLinks = [
  { href: '#como-funciona', label: 'Como funciona' },
  { href: '#recursos', label: 'Recursos' },
  { href: '#depoimentos', label: 'Depoimentos' },
]

export default function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-[#172113]/14 bg-[#fbfcf2]/90 backdrop-blur-xl dark:border-[#d5e6a9]/16 dark:bg-[#080b06]/90">
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
          <span className="min-w-0 font-[family:var(--font-display)] text-lg font-bold tracking-normal text-[#10130f] dark:text-[#f4f7e9] sm:text-xl">
            Kivora English
          </span>
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {navigationLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-bold tracking-normal text-[#425039] transition-colors hover:text-[#183b16] dark:text-[#b9c3a4] dark:hover:text-[#b8ff5c]"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-full px-4 text-sm font-bold text-[#183b16] transition-colors hover:bg-[#e3ecc2] dark:text-[#b8ff5c] dark:hover:bg-[#1d2b14]"
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className="inline-flex h-11 items-center justify-center rounded-full bg-[#183b16] px-4 text-sm font-bold text-[#f7f8ef] shadow-[0_12px_24px_rgba(24,59,22,0.20)] transition-transform hover:-translate-y-0.5 hover:bg-[#24551d] dark:bg-[#b8ff5c] dark:text-[#050704] dark:hover:bg-[#cbff83] sm:px-5"
          >
            Começar grátis
          </Link>
        </div>
      </nav>
    </header>
  )
}
