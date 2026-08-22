import Link from 'next/link'
import { ArrowRight, Compass, Sparkles } from 'lucide-react'
import SectionBadge from '@/components/ui/SectionBadge'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import { homeCardClass, homePrimaryButton, homeSmallPillClass } from '@/lib/homeStyles'
import type { NewMaterialStatus } from '@/features/review/lib/newMaterialStatus'
import HomeGlassBackdrop from './HomeGlassBackdrop'

/**
 * Avisa antes do silêncio.
 *
 * Sem isto, quando o material inédito acaba a fila apenas esvazia e o app parece dizer "você
 * terminou" — quando na verdade ficou sem conteúdo. Aparece só nos últimos dias de estoque.
 */
export default function NewMaterialNotice({ status }: { status: NewMaterialStatus }) {
  if (status.suggestion === null) return null

  const vazio = status.level === 'vazio'
  const paraCatalogo = status.suggestion === 'adicionar-pack'

  return (
    <div className="relative">
      <HomeGlassBackdrop />
      <section className={`${homeCardClass} home-frosted-surface home-frosted-surface-soft relative z-10 p-5 sm:p-6`} aria-labelledby="novo-material-titulo">
      <div className="flex flex-wrap items-center gap-2">
        <SectionBadge label="Material novo" />
        {!vazio ? (
          <span className={homeSmallPillClass}>
            {status.daysLeft} {status.daysLeft === 1 ? 'dia' : 'dias'} restantes
          </span>
        ) : null}
      </div>

      <h2 id="novo-material-titulo" className="mt-4 font-heading text-xl font-bold text-brand-dark sm:text-2xl">
        {vazio ? 'Você já viu tudo que tem na rotina' : 'Suas frases novas estão acabando'}
      </h2>

      <p className="mt-2 max-w-xl font-body text-sm leading-relaxed text-brand-secondary">
        {vazio
          ? 'A revisão continua com o que você já estudou, mas não há frase inédita esperando.'
          : `Restam ${status.unseenInRoutine} frases que você ainda não viu. Depois delas, só revisão do que já conhece.`}{' '}
        {paraCatalogo
          ? `Há ${status.catalogPacksAvailable} ${status.catalogPacksAvailable === 1 ? 'pack pronto' : 'packs prontos'} no catálogo que você ainda não adicionou.`
          : 'O catálogo já está todo na sua rotina — dá para gerar um pack novo sobre o tema que quiser.'}
      </p>

      <div className="mt-5">
        {paraCatalogo ? (
          <Link href="/explore" transitionTypes={navForwardTransitionTypes} className={homePrimaryButton}>
            <Compass className="h-4 w-4" />
            Ver catálogo
            <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link href="/generate" transitionTypes={navForwardTransitionTypes} className={homePrimaryButton}>
            <Sparkles className="h-4 w-4" />
            Gerar pack novo
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
      </section>
    </div>
  )
}
