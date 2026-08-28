'use client'

import Link from 'next/link'
import { ArrowRight, BookOpen, Filter } from 'lucide-react'
import { m } from 'motion/react'
import {
  homePrimaryButton,
  homeSecondaryButton,
  homeSmallPillClass,
} from '@/lib/homeStyles'
import { navForwardTransitionTypes } from '@/lib/navigationTransitions'
import {
  exploreHeroCardClass,
  exploreNestedCardClass,
} from '@/features/explore/lib/explorePageUi'

interface PackRow {
  id: string
  name: string
  description: string | null
  level: string | null
  cover_url: string | null
}

interface ExploreHeaderProps {
  featuredPack?: PackRow
}

/**
 * Cabeçalho do catálogo.
 *
 * O que saiu, e por quê:
 * - Selo "Catálogo" + pílula "Pacotes prontos para estudar" + título: três rótulos empilhados
 *   dizendo a mesma coisa antes de qualquer conteúdo.
 * - O parágrafo explicava a organização em pastas (PEC, vocabulário, temas livres). Isso a própria
 *   lista logo abaixo mostra; descrever a tela para quem está olhando a tela é texto morto.
 * - A ilustração, que ocupava o card inteiro do destaque sem dizer nada sobre o pack.
 *
 * Também corrigido: aqui se dizia "pacote"/"pacotes". O app inteiro usa "pack" — a navegação diz
 * "Explorar packs" e "Adicionar pack" —, então esta página falava uma língua diferente do resto.
 */
export default function ExploreHeader({ featuredPack }: ExploreHeaderProps) {
  return (
    <section className={exploreHeroCardClass}>
      <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center lg:gap-8 lg:p-10">
        <div>
          {/* Esta tela deixou de ser uma vitrine onde se escolhe pack e virou o mapa do
              caminho. O título antigo ("Encontre o próximo pack") convidava a uma busca que o
              produto não quer mais — era essa caça que fazia o aluno se perder e desistir. */}
          <h1 className="max-w-2xl font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl">
            Sua trilha de inglês
          </h1>
          <p className="mt-3 max-w-xl font-body text-sm leading-relaxed text-brand-secondary">
            Você não precisa escolher nada: todo dia o Kivora monta seu plano com material do seu
            nível. Aqui você vê o que já está liberado e o que vem pela frente.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/home" transitionTypes={navForwardTransitionTypes} className={homePrimaryButton}>
              <BookOpen className="h-4 w-4" />
              Plano de hoje
            </Link>
            <a href="#packs" className={homeSecondaryButton}>
              <Filter className="h-4 w-4" />
              Ver a trilha
            </a>
          </div>
        </div>

        {/* O destaque virou link para o próprio pack. O hover só faz sentido em algo clicável —
            antes era um cartão inerte, e um card que levanta ao passar o mouse sem levar a lugar
            nenhum promete uma ação que não existe. */}
        <m.div
          initial={{ opacity: 0, scale: 0.97, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.12, stiffness: 280, damping: 26 }}
        >
          <Link
            href={featuredPack ? `/explore/pack/${featuredPack.id}` : '#packs'}
            transitionTypes={navForwardTransitionTypes}
            prefetch={false}
            className={`${exploreNestedCardClass} group block p-5 transition-[transform,box-shadow] duration-200 hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-[4px_4px_0_var(--color-brand-dark)] focus-visible:-translate-y-[2px] focus-visible:shadow-[4px_4px_0_var(--color-brand-dark)] focus-visible:outline-none active:translate-x-0 active:translate-y-0 active:shadow-none sm:p-6`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className={homeSmallPillClass}>Destaque</span>
              {featuredPack?.level ? (
                <span className={`${homeSmallPillClass} bg-brand-accent`}>{featuredPack.level}</span>
              ) : null}
            </div>

            <h2 className="mt-3 font-heading text-xl font-bold leading-snug text-brand-dark sm:text-2xl">
              {featuredPack?.name || 'Pack em destaque'}
            </h2>
            <p className="mt-2 line-clamp-2 font-body text-sm leading-relaxed text-brand-secondary">
              {featuredPack?.description || 'Um bom ponto de partida para hoje.'}
            </p>

            <span className="mt-4 inline-flex items-center gap-1.5 font-heading text-sm font-bold text-brand-dark">
              Ver pack
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </span>
          </Link>
        </m.div>
      </div>
    </section>
  )
}
