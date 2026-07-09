import Link from 'next/link'

const productLinks = [
  { label: 'Cadastro', href: '/register' },
  { label: 'Preços', href: '#precos' },
  { label: 'Recursos', href: '#como-funciona' },
  { label: 'FAQ', href: '#faq' },
]

const communityLinks = [
  { label: 'Discord', href: '#contato' },
  { label: 'Contato', href: '#contato' },
  { label: 'Newsletter', href: '#contato' },
]

const socialLinks = ['IG', 'X', 'IN'] as const

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-brand-dark bg-bg-card px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl md:grid md:grid-cols-[1.1fr_0.7fr_0.7fr_1.2fr] md:items-start md:gap-10">
        <div className="flex items-center justify-between gap-4 md:block">
          <Link href="/" className="font-heading text-lg font-bold text-brand-dark sm:text-xl">
            Kivora English
          </Link>
          <div className="flex shrink-0 items-center gap-3 text-brand-dark md:mt-4 md:gap-4">
            {socialLinks.map((label) => (
              <span key={label} className="font-heading text-xs font-bold sm:text-sm">
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4 sm:gap-x-8 md:contents md:mt-0">
          <FooterColumn title="Produto" links={productLinks} />
          <FooterColumn title="Comunidade" links={communityLinks} />
        </div>

        <div
          className="hidden justify-self-end font-heading text-5xl font-bold text-brand-dark [text-shadow:6px_6px_0_rgba(28,25,21,0.14)] md:block"
        >
          &lt;/&gt;
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-6xl border-t border-brand-dark pt-4 text-xs text-brand-secondary sm:text-sm md:mt-10 md:pt-6">
        © 2025 Kivora Agency. Todos os direitos reservados.
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="font-heading text-xs font-bold text-brand-dark sm:text-sm">{title}</h3>
      <ul className="mt-2 space-y-1.5 sm:space-y-2 md:mt-4 md:space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              href={link.href}
              className="text-xs text-brand-secondary transition-colors hover:text-brand-dark sm:text-sm"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
