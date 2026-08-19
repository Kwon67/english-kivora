'use client'

import { Languages, Volume2, Wand2 } from 'lucide-react'
import StudyBreadcrumb from '@/components/navigation/StudyBreadcrumb'
import { accentBadge, cardClass } from '@/features/profile/lib/libraryUi'

/**
 * Cabeçalho do gerador.
 *
 * Ocupava 1245px num aparelho de 812 — 1,53 tela — e o formulário só começava em y=1366. O que
 * saiu, e por quê:
 * - Botão "Início" acima de uma trilha que já leva para casa: o mesmo destino duas vezes.
 * - Selo "Geração com IA" logo acima de um título sobre gerar com IA. Ficou a pílula "Prévia antes
 *   de salvar", que é promessa real e não se deduz do formulário.
 * - O card "Fluxo / 3 passos" com três sub-cards e uma ilustração. Os três fatos (prévia, par
 *   EN+PT, áudio) valem como contexto, então viraram uma linha; o resto era moldura.
 * - Botão "Começar geração", que rolava até um formulário agora visível logo abaixo.
 */

const PONTOS = [
  { Icon: Wand2, titulo: 'Prévia', detalhe: 'antes de salvar' },
  { Icon: Languages, titulo: 'EN + PT', detalhe: 'par de tradução' },
  { Icon: Volume2, titulo: 'Áudio', detalhe: 'voz neural' },
] as const

export default function GenerateHeader() {
  return (
    <header className={`${cardClass} relative overflow-hidden p-5 sm:p-8`}>
      <div className="relative z-10">
        <StudyBreadcrumb
          items={[{ label: 'Início', href: '/home' }, { label: 'Gerador IA' }]}
          className="mb-3"
        />

        <span className={accentBadge}>Prévia antes de salvar</span>

        <h1 className="mt-4 max-w-2xl font-heading text-3xl font-bold leading-[1.1] tracking-tight text-brand-dark sm:text-4xl">
          Gerador IA
        </h1>
        <p className="mt-2 max-w-xl font-body text-sm leading-relaxed text-brand-secondary">
          Descreva um tema e revise as frases antes de virar pack.
        </p>

        {/* Uma linha no lugar de três cards empilhados dentro de outro card. */}
        <ul className="mt-5 grid gap-2 sm:grid-cols-3">
          {PONTOS.map(({ Icon, titulo, detalhe }) => (
            <li
              key={titulo}
              className="flex items-center gap-2.5 rounded-[20px] border border-brand-dark bg-bg-primary px-3 py-2.5"
            >
              <Icon className="h-4 w-4 shrink-0 text-brand-dark" strokeWidth={2.2} />
              <span className="min-w-0 font-heading text-sm font-bold text-brand-dark">
                {titulo}
                <span className="ml-1.5 font-body text-xs font-semibold text-brand-secondary">{detalhe}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </header>
  )
}
