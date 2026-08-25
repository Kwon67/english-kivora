'use client'

import Image from 'next/image'
import { BarChart3, BookOpen } from 'lucide-react'
import { m } from 'motion/react'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import { landingRadiusLg } from '@/lib/landingStyles'
import {
  historyFrostedSubtle,
  historyHero,
  historyPill,
  historySoftBtn,
} from '@/features/history/lib/historyUi'

interface HistoryHeaderProps {
  filterDate?: string
}

/**
 * Cabeçalho do histórico.
 *
 * Ele ocupava 779px num aparelho de 812px — uma tela inteira antes de qualquer número — e o
 * primeiro dado real só aparecia em y=1202. O que foi cortado, e por quê:
 *
 * - Botão "← Início" E trilha "Início > Histórico": o mesmo destino duas vezes, empilhado, com a
 *   barra inferior oferecendo um terceiro caminho para lá. Ficou a trilha, que além de levar para
 *   casa diz onde você está, em uma linha.
 * - Selo "Arquivo de evolução" e pílula "Sólido": o primeiro é jargão e o segundo era um juízo
 *   sobre a taxa de acerto sem mostrar a taxa. O painel logo abaixo diz "77% sobre 542 respostas",
 *   que é a mesma informação sem pedir confiança.
 * - Bloco "Resumo / Seu progresso / 43 sessões registradas": duplicado duas vezes na própria
 *   página — existe um contador "Sessões" logo abaixo, e o título colidia com o painel de
 *   aprendizado.
 * - Subtítulo: descrevia o layout ("os números estão logo abaixo"), coisa que rolar já resolve.
 *
 * A ilustração fica só a partir de `lg`, onde a grade vira duas colunas e ela não custa nada em
 * altura. É a linguagem visual que as outras páginas de cabeçalho usam; no telefone ela era o
 * maior pedaço isolado do container.
 */
export default function HistoryHeader({ filterDate }: HistoryHeaderProps) {
  const formattedFilterDate = filterDate ? filterDate.split('-').reverse().join('/') : null

  return (
    <header className={`${historyHero} p-5 sm:p-8 lg:p-10`}>
      <div className="relative z-10 grid min-w-0 gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <StudyBreadcrumb items={[{ label: 'Início', href: '/home' }, { label: 'Histórico' }]} />
            {formattedFilterDate ? (
              <span className={`${historyPill} bg-brand-accent`}>Filtro: {formattedFilterDate}</span>
            ) : null}
          </div>

          <h1 className="mt-4 font-heading text-3xl font-bold leading-[1.1] text-brand-dark sm:text-4xl">
            Seu histórico
          </h1>
          <p className="mt-2 max-w-xl font-body text-sm leading-relaxed text-brand-secondary">
            O que você já estudou e o quanto ficou.
          </p>

          {/* Atalhos reais: a página é longa e as duas âncoras existem (#graficos, #sessoes). */}
          <div className="mt-5 flex flex-wrap gap-2.5">
            <a href="#graficos" className={historySoftBtn}>
              <BarChart3 className="h-4 w-4 shrink-0" />
              Gráficos
            </a>
            <a href="#sessoes" className={historySoftBtn}>
              <BookOpen className="h-4 w-4 shrink-0" />
              Sessões
            </a>
          </div>
        </div>

        <m.div
          initial={{ opacity: 0, scale: 0.98, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: 'spring', delay: 0.12, stiffness: 260, damping: 24 }}
          aria-hidden="true"
          className={`hidden lg:flex items-center justify-center overflow-hidden ${landingRadiusLg} border border-brand-dark bg-bg-primary p-6 ${historyFrostedSubtle}`}
        >
          <m.div
            animate={{ y: [0, -4, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
            className="w-full max-w-[220px]"
          >
            <Image
              src="/images/home/undraw-growth-analytics.svg"
              alt=""
              width={300}
              height={240}
              unoptimized
              className="mx-auto h-auto w-full select-none object-contain"
            />
          </m.div>
        </m.div>
      </div>
    </header>
  )
}
