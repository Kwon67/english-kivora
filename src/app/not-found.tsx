import Link from 'next/link'
import { SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <main className="flex min-h-[100svh] items-center justify-center bg-[var(--color-background)] px-6 py-16">
      <section className="w-full max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)]">
          <SearchX className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-3xl font-bold tracking-tight text-[var(--color-text)]">
          Página não encontrada
        </h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-muted)]">
          O endereço acessado não existe ou foi movido.
        </p>
        <Link
          href="/home"
          className="mt-8 inline-flex items-center justify-center rounded-full bg-[var(--color-primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-dark)]"
        >
          Voltar ao início
        </Link>
      </section>
    </main>
  )
}
