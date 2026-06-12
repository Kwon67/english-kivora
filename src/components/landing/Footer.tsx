import Image from 'next/image'
import Link from 'next/link'

const footerLinks = [
  { href: '/terms', label: 'Termos de uso' },
  { href: '/privacy', label: 'Privacidade' },
  { href: 'mailto:kivora.dev@outlook.com', label: 'Contato' },
]

export default function Footer() {
  return (
    <footer className="border-t border-[#172113]/14 bg-transparent dark:border-[#d5e6a9]/16 dark:bg-transparent">
      <div className="mx-auto flex w-full max-w-[var(--page-width)] flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="Kivora English">
          <Image
            src="/brand/kivora-mark.png"
            alt=""
            aria-hidden="true"
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
          <div>
            <p className="font-[family:var(--font-display)] text-base font-bold tracking-normal text-[#10130f] dark:text-[#f4f7e9]">
              Kivora English
            </p>
            <p className="mt-1 text-sm text-[#5a664e] dark:text-[#9ea98b]">Plataforma de aprendizado de inglês</p>
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-[#425039] dark:text-[#b9c3a4]">
          {footerLinks.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-[#183b16] dark:hover:text-[#b8ff5c]">
              {link.label}
            </Link>
          ))}
        </div>

        <p className="text-sm text-[#5a664e] dark:text-[#9ea98b]">
          © {new Date().getFullYear()} Kivora English. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  )
}
