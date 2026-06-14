import Link from 'next/link'
import { BookOpen, ListPlus, Mic } from 'lucide-react'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'

const glassPanel =
  'home-glass-panel render-contained relative overflow-hidden rounded-[22px] border border-[#172113]/20 bg-[#fbfcf2] shadow-[0_18px_48px_rgba(31,43,18,0.14)] dark:border-[#d5e6a9]/20 dark:bg-[#11160e] dark:shadow-[0_20px_54px_rgba(0,0,0,0.5)]'
const loginButton =
  'inline-flex items-center justify-center gap-2 overflow-hidden rounded-full bg-[#183b16] px-5 py-3.5 font-montserrat text-sm font-bold text-[#f7f8ef] shadow-[0_10px_22px_rgba(24,59,22,0.22)] transition-colors hover:bg-[#24551d] focus:outline-none focus:ring-2 focus:ring-[#183b16]/40 dark:bg-[#b8ff5c] dark:text-[#050704] dark:hover:bg-[#cbff83]'
const softButton =
  'inline-flex items-center justify-center gap-2 rounded-full border border-[#172113]/20 bg-[#eef3d6] px-5 py-3.5 text-sm font-bold text-[#183b16] shadow-sm transition-colors hover:bg-[#dfe9bd] dark:border-[#d5e6a9]/20 dark:bg-[#b8ff5c]/8 dark:text-[#b8ff5c] dark:hover:bg-[#b8ff5c]/16'
const softKicker =
  'inline-flex items-center gap-2 rounded-full border border-[#172113]/18 bg-[#e3ecc2] px-3 py-1 text-[0.64rem] font-black uppercase tracking-[0.12em] text-[#183b16] dark:border-[#d5e6a9]/18 dark:bg-[#b8ff5c]/12 dark:text-[#b8ff5c]'

export default function PacksHubCard() {
  return (
    <article className={`${glassPanel} p-5 sm:p-7`}>
      <div className="home-card-sheen pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(227,236,194,0.55),rgba(251,252,242,0)_48%)] dark:bg-[linear-gradient(135deg,rgba(184,255,92,0.08),rgba(17,22,14,0)_48%)]" />

      <div className="relative z-10">
        <p className={softKicker}>Seus conteúdos</p>
        <h2 className="mt-4 font-montserrat text-2xl font-bold leading-tight text-[#10130f] dark:text-[#f4f7e9] sm:text-3xl">
          Crie ou adicione packs de estudo
        </h2>
        <p className="mt-3 max-w-2xl font-inter text-sm leading-relaxed text-[#425039] sm:text-base dark:text-[#b9c3a4]">
          Monte packs com seus próprios cards no perfil ou adicione packs prontos do catálogo Explorar à sua rotina de estudo.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/profile#user-packs-title"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={loginButton}
          >
            <ListPlus className="h-4 w-4" />
            Criar pack
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
        </div>

        <div className="mt-6 flex justify-end border-t border-dashed border-[#172113]/20 pt-4 dark:border-[#d5e6a9]/20">
          <Link
            href="/tutor"
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#5a664e] transition-colors hover:text-[#183b16] dark:text-[#9ea98b] dark:hover:text-[#b8ff5c]"
          >
            <Mic className="h-4 w-4" />
            Conversar com o tutor
          </Link>
        </div>
      </div>
    </article>
  )
}