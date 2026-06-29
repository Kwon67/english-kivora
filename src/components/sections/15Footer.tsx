import Link from 'next/link'

const productLinks = [
  { label: 'Cadastro', href: '/register' },
  { label: 'Preços', href: '#precos' },
  { label: 'Recursos', href: '#recursos' },
  { label: 'FAQ', href: '#faq' },
]

const communityLinks = [
  { label: 'Discord', href: '#contato' },
  { label: 'Contato', href: '#contato' },
  { label: 'Newsletter', href: '#contato' },
]

export default function Footer() {
  return (
    <footer className="border-t border-brand-border bg-bg-card px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Link href="/" className="font-heading text-xl font-bold text-brand-dark">
            Kivora English
          </Link>
          <div className="mt-5 flex gap-4 text-brand-dark">
            <span className="font-heading text-sm font-bold">IG</span>
            <span className="font-heading text-sm font-bold">X</span>
            <span className="font-heading text-sm font-bold">IN</span>
          </div>
        </div>
        <FooterColumn title="Produto" links={productLinks} />
        <FooterColumn title="Comunidade" links={communityLinks} />
      </div>
      <div className="mx-auto mt-10 max-w-7xl border-t border-brand-border pt-6 text-sm text-brand-secondary">
        © 2025 Kivora Agency. Todos os direitos reservados.
      </div>
    </footer>
  )
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div>
      <h3 className="font-heading text-sm font-bold text-brand-dark">{title}</h3>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <Link href={link.href} className="text-sm text-brand-secondary hover:text-brand-dark">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
