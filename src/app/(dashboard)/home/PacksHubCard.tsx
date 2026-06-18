import Link from 'next/link'
import { BookOpen, Compass, ListChecks, ListPlus, Mic } from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

const glassPanel =
  'home-glass-panel render-contained relative overflow-hidden rounded-[22px] border border-border-muted/20 bg-card shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:border-border-accent/20 dark:bg-card dark:shadow-[0_20px_54px_rgba(0,0,0,0.5)]'
const loginButton =
  'inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-5 py-3.5 font-montserrat text-sm font-bold text-on-primary shadow-[0_10px_22px_rgba(24,59,22,0.22)] transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/40 bg-primary  hover:bg-primary-dark'
const softButton =
  'inline-flex items-center justify-center gap-2 rounded-full border border-border-muted/20 bg-primary-light px-5 py-3.5 text-sm font-bold text-primary shadow-sm transition-colors hover:bg-hero-lime dark:border-border-accent/20 dark:bg-primary/8 text-primary hover:bg-primary/16'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-border-muted/18 bg-primary-container px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-primary dark:border-border-accent/18 dark:bg-primary/12'

type PacksHubCardProps = {
  isEmptyRoutine?: boolean
}

export default function PacksHubCard({ isEmptyRoutine = false }: PacksHubCardProps) {
  if (isEmptyRoutine) {
    return (
      <article className={`${glassPanel} p-5 sm:p-7`}>
        <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />

        <div className="relative z-10">
          <p className={softKicker}>Primeiros passos</p>
          <h2 className="mt-4 font-montserrat text-2xl font-bold leading-tight text-text dark:text-text sm:text-3xl">
            Monte sua rotina em 3 passos
          </h2>
          <p className="mt-3 max-w-2xl font-inter text-sm leading-relaxed text-text-muted sm:text-base dark:text-text-muted">
            Escolha packs do catálogo, adicione à sua rotina e comece a estudar pelo Início.
          </p>

          <ol className="mt-6 space-y-3 text-sm text-text-muted">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-black text-primary">
                1
              </span>
              <span>
                <strong className="text-text">Explore o catálogo</strong> — encontre packs por nível ou tema.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-black text-primary">
                2
              </span>
              <span>
                <strong className="text-text">Adicione à rotina</strong> — escolha o modo de estudo de cada pack.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs font-black text-primary">
                3
              </span>
              <span>
                <strong className="text-text">Comece pelo Início</strong> — o dashboard mostra seu próximo passo.
              </span>
            </li>
          </ol>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/explore"
              transitionTypes={navForwardTransitionTypes}
              prefetch={false}
              className={loginButton}
            >
              <Compass className="h-4 w-4" />
              Explorar packs
            </Link>
            <Link
              href="/study"
              transitionTypes={navForwardTransitionTypes}
              prefetch={false}
              className={softButton}
            >
              <ListChecks className="h-4 w-4" />
              Ver minha rotina
            </Link>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article className={`${glassPanel} p-5 sm:p-7`}>
      <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />

      <div className="relative z-10">
        <p className={softKicker}>Seus conteúdos</p>
        <h2 className="mt-4 font-montserrat text-2xl font-bold leading-tight text-text dark:text-text sm:text-3xl">
          Crie ou adicione packs de estudo
        </h2>
        <p className="mt-3 max-w-2xl font-inter text-sm leading-relaxed text-text-muted sm:text-base dark:text-text-muted">
          Monte packs com seus próprios cards no perfil ou adicione packs prontos do catálogo Explorar à sua rotina de estudo.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/study"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={loginButton}
          >
            <ListChecks className="h-4 w-4" />
            Gerenciar rotina
          </Link>
          <Link
            href="/explore"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={softButton}
          >
            <BookOpen className="h-4 w-4" />
            Explorar packs
          </Link>
          <Link
            href="/profile#user-packs-title"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={softButton}
          >
            <ListPlus className="h-4 w-4" />
            Criar pack
          </Link>
        </div>

        <div className="mt-6 flex justify-end border-t border-dashed border-border-muted/20 pt-4 dark:border-border-accent/20">
          <Link
            href="/tutor"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className="inline-flex items-center gap-2 text-sm font-bold text-text-subtle transition-colors hover:text-primary dark:text-text-subtle"
          >
            <Mic className="h-4 w-4" />
            Conversar com o tutor
          </Link>
        </div>
      </div>
    </article>
  )
}