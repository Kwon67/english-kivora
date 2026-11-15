'use client'

import { getCategoryTone } from '@/lib/learningTones'
import Link from 'next/link'
import { Check, Lock, ChevronRight, ChevronDown, BookOpen,  Target, Search, X } from 'lucide-react'
import { normalizePackLevel, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import { getPackLockReason, type LevelGate } from '@/features/learning/lib/levelGate'
import EmptyState from '@/components/ui/EmptyState'
import { useState } from 'react'
import { groupPacksByLevel } from '@/features/cards/lib/packFolders'
import { filtrarPacks, listarCategorias } from '@/features/explore/lib/packFiltering'
import { cn } from '@/lib/utils'
import {
  homeIconButton,
  homeIconGlyph,
  homeIconGlyphSm,
  homeSecondaryButton,
  homeSmallPillClass,
  homeSubscribedPillClass,
} from '@/lib/homeStyles'
import {
  exploreCardClass,
  exploreFrostedSubtle,
  exploreFrostedSurface,
  exploreNestedCardClass,
} from '@/features/explore/lib/explorePageUi'

type PackRow = {
  id: string
  name: string
  description: string | null
  level: string | null
  cover_url: string | null
  category: string | null
  curriculum_position?: number | null
}

interface SkillTreeProps {
  packs: PackRow[]
  subscribedPackIds: string[]
  /** Regra de nível: decide o que aparece liberado e o que aparece com cadeado. */
  gate: LevelGate
  recommendedLevel?: LearnerCefrLevel | null
  nextStepLevel?: LearnerCefrLevel | null
  assessing?: boolean
}

const levelOrder: Record<string, number> = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 }
const getLevelWeight = (level: string | null) => {
  const l = (level || '').toUpperCase()
  for (const key in levelOrder) {
    if (l.includes(key)) return levelOrder[key]
  }
  return 99
}

const filterBtnBase =
  'inline-flex items-center justify-center gap-2 rounded-control border border-brand-dark px-4 py-2 font-heading text-xs font-bold transition-colors'

export default function SkillTree({
  packs,
  subscribedPackIds,
  gate,
  recommendedLevel = null,
  nextStepLevel = null,
  assessing = false,
}: SkillTreeProps) {
  const [catalogMode, setCatalogMode] = useState<'full' | 'recommended'>('full')
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  // Níveis que a pessoa abriu à mão. O do nível dela já nasce aberto (ver `abertoPorPadrao`).
  const [abertos, setAbertos] = useState<Record<string, boolean>>({})

  if (!packs || packs.length === 0) {
    return (
      <EmptyState
        imageSrc="/images/mindmarket/discovery.png"
        imageAlt="Ilustração para catálogo sem packs"
        title="Nenhum pack encontrado"
        description="Volte mais tarde para ver novas sugestões."
        variant="glass"
        className={exploreFrostedSurface}
        imageWrapClassName={exploreFrostedSubtle}
      />
    )
  }

  const subscribedSet = new Set(subscribedPackIds)
  const showingRecommended = catalogMode === 'recommended' && Boolean(recommendedLevel)
  const visiblePacks = showingRecommended
    ? packs.filter((pack) => {
        const packLevel = normalizePackLevel(pack.level)
        if (packLevel === recommendedLevel) return true
        if (nextStepLevel && packLevel === nextStepLevel) return true
        return false
      })
    : packs
  const categorias = listarCategorias(packs)
  const filtrados = filtrarPacks(visiblePacks, { query: busca, category: categoria })
  const filtroAtivo = busca.trim().length > 0 || categoria !== null

  // Com filtro ativo, nível sem resultado só polui — some em vez de virar seção vazia.
  const folders = groupPacksByLevel(filtrados, {
    includeEmptyLevels: !showingRecommended && !filtroAtivo,
  })

  /**
   * Que seções começam abertas.
   *
   * Com 105 coleções, abrir os seis níveis de uma vez rende quase 38 mil pixels de rolagem e
   * enterra justamente o material do nível da pessoa. Então abre-se o nível dela e o próximo —
   * o resto fica a um clique. Quando há filtro, tudo abre: quem buscou quer ver o que achou.
   */
  const abertoPorPadrao = (folderId: string, label: string) => {
    if (filtroAtivo || showingRecommended) return true
    const alvo = `${folderId} ${label}`.toUpperCase()
    // Só o nível da pessoa. Abrir também o "próximo passo" parecia gentil e dobrava a página:
    // B1 e B2 juntos somam 46 coleções, 21 telas de rolagem. O próximo nível já é anunciado no
    // texto acima e fica a um clique — não precisa estar desenrolado na frente.
    if (recommendedLevel && alvo.includes(recommendedLevel)) return true
    // Sem nível detectado ainda, abre do começo para não mostrar uma parede fechada.
    return !recommendedLevel && alvo.includes('A1')
  }

  const estaAberto = (folderId: string, label: string) =>
    abertos[folderId] ?? abertoPorPadrao(folderId, label)

  return (
    <div className="space-y-4">
      {(recommendedLevel || assessing) && (
        <div className={`${exploreCardClass} p-4 sm:p-5`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>

              <h3 className="font-heading text-base font-semibold text-brand-dark">
                {assessing
                  ? 'Estamos medindo seu nível nas revisões e lições'
                  : `Nível atual: ${recommendedLevel}`}
              </h3>
              <p className="mt-2 font-body text-sm text-brand-secondary">
                {assessing
                  ? 'Continue praticando para acompanhar sua evolução nos níveis A1 a C2.'
                  : nextStepLevel
                    ? `Avance nas lições do seu nível antes de passar para ${nextStepLevel}.`
                    : 'Continue consolidando as habilidades do seu nível.'}
              </p>
            </div>
            {!assessing && recommendedLevel ? (
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCatalogMode('recommended')}
                  aria-pressed={showingRecommended}
                  className={`${filterBtnBase} ${
                    showingRecommended
                      ? 'bg-brand-accent text-brand-dark'
                      : 'bg-bg-card text-brand-dark hover:bg-brand-dark hover:text-white'
                  }`}
                >
                  <Target className="h-3.5 w-3.5" />
                  Recomendados
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogMode('full')}
                  aria-pressed={!showingRecommended}
                  className={`${filterBtnBase} ${
                    !showingRecommended
                      ? 'bg-brand-accent text-brand-dark'
                      : 'bg-bg-card text-brand-dark hover:bg-brand-dark hover:text-white'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  Todos os packs
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className={`${exploreCardClass} space-y-4 p-4 sm:p-5`}>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary" />
          <input
            type="search"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por tema, situação ou nível..."
            aria-label="Buscar no catálogo"
            className="w-full rounded-control border border-brand-dark bg-bg-primary py-3 pl-11 pr-10 font-body text-sm text-brand-dark placeholder:text-brand-secondary focus:outline-none focus:ring-2 focus:ring-brand-accent"
          />
          {busca ? (
            <button
              type="button"
              onClick={() => setBusca('')}
              aria-label="Limpar busca"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-brand-secondary transition-colors hover:bg-brand-dark hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoria(null)}
            aria-pressed={categoria === null}
            className={`${filterBtnBase} ${
              categoria === null
                ? 'bg-brand-accent text-brand-dark'
                : 'bg-bg-card text-brand-dark hover:bg-brand-dark hover:text-white'
            }`}
          >
            Todos os temas
          </button>
          {categorias.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setCategoria(categoria === item.name ? null : item.name)}
              aria-pressed={categoria === item.name}
              className={`${filterBtnBase} ${
                categoria === item.name
                  ? 'bg-brand-accent text-brand-dark'
                  : 'bg-bg-card text-brand-dark hover:bg-brand-dark hover:text-white'
              }`}
            >
              {item.name}
              <span className="font-body text-[11px] opacity-70">{item.count}</span>
            </button>
          ))}
        </div>

        {filtroAtivo ? (
          <p className="font-body text-xs text-brand-secondary" aria-live="polite">
            {filtrados.length === 0
              ? 'Nenhuma coleção encontrada.'
              : `${filtrados.length} ${filtrados.length === 1 ? 'coleção encontrada' : 'coleções encontradas'}.`}
          </p>
        ) : null}
      </div>

      {showingRecommended && visiblePacks.length === 0 ? (
        <EmptyState
          imageSrc="/images/mindmarket/discovery.png"
          imageAlt="Nenhum pack recomendado"
          title="Nenhum pack neste filtro ainda"
          description="Mostre o catálogo completo ou aguarde novos packs no seu nível."
          variant="glass"
          className={exploreFrostedSurface}
          imageWrapClassName={exploreFrostedSubtle}
        >
          <button
            type="button"
            onClick={() => setCatalogMode('full')}
            className={homeSecondaryButton}
          >
            Todos os packs
          </button>
        </EmptyState>
      ) : null}

      <div className="discovery-levels">
      {folders.map((folder) => {
        const sortedPacks = [...folder.packs].sort(
          (a, b) => getLevelWeight(a.level) - getLevelWeight(b.level)
            || (a.curriculum_position ?? Number.MAX_SAFE_INTEGER) - (b.curriculum_position ?? Number.MAX_SAFE_INTEGER)
            || a.name.localeCompare(b.name, 'pt-BR')
        )

        const aberto = estaAberto(folder.id, folder.label)
        const idConteudo = `nivel-${folder.id}`

        return (
          <section key={folder.id} className="discovery-level">
            <button
              type="button"
              onClick={() => setAbertos((atual) => ({ ...atual, [folder.id]: !aberto }))}
              aria-expanded={aberto}
              aria-controls={idConteudo}
              className="discovery-level-toggle"
            >
              <span className="discovery-level-name"><span className="discovery-level-index" aria-hidden="true">{folder.label.match(/[ABC][12]/)?.[0] || 'EN'}</span><span><strong>{folder.label}</strong><small>{folder.packs.length} {folder.packs.length === 1 ? 'coleção' : 'coleções'}</small></span></span>
              <ChevronDown className={`h-5 w-5 shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>

            {aberto ? (
              <div id={idConteudo}>
            {sortedPacks.length > 0 ? (
              <div className="learning-card-grid">
                {sortedPacks.map((pack) => {
                  const isSubscribed = subscribedSet.has(pack.id)
                  const lockReason = getPackLockReason(pack.level, gate)
                  const tone = getCategoryTone(pack.category)

                  return (
                    <article
                      key={pack.id}
                      data-tone={tone}
                      className={`${exploreNestedCardClass} learning-module-card group relative flex flex-col min-w-0 transition-[transform,border-color] hover:-translate-y-0.5 hover:border-brand-dark`}
                    >
                      {/* A ilustração saiu daqui. Ela ocupava uma faixa de 120–140px no topo de
                          cada card só para repetir uma de cinco artes genéricas, sem relação com o
                          conteúdo do pack — empurrava o nome, que é a informação que a pessoa
                          realmente lê, para baixo da dobra do card. Sem ela o card encolhe, cabem
                          mais coleções na tela e o título vira a primeira coisa que o olho encontra. */}
                      <div className="relative z-10 flex flex-1 flex-col p-4 sm:p-5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="tone-chip">
                            {pack.level || 'A1-A2'}
                          </span>
                          {isSubscribed ? (
                            <span
                              className="ml-auto inline-flex items-center gap-1.5 font-heading text-2xs font-bold uppercase tracking-widest text-brand-dark"
                              title="Já está na sua rotina"
                            >
                              <Check className={`${homeIconGlyphSm}`} />
                              Na rotina
                            </span>
                          ) : null}
                        </div>

                        {/* Duas linhas no máximo: com nomes que dizem o conteúdo ("Inglês falado:
                            gonna, wanna, gotta"), medindo em Space Mono, vários estouram a coluna,
                            e o corte tira justamente a parte que distingue um pack do outro.
                            A altura mínima que existia aqui para alinhar os cards saiu: quem alinha
                            agora é o `mt-auto` do bloco de baixo, que encosta metadados e rodapé na
                            base independente do tamanho do texto. Reservar duas linhas além disso
                            só abria um vão morto sob os títulos de uma linha. */}
                        <h3 className="mt-2 font-heading text-base font-semibold leading-snug text-brand-dark sm:text-lg">
                          {pack.name}
                        </h3>
                        <p className="mt-1.5 line-clamp-2 font-body text-sm leading-relaxed text-brand-secondary sm:text-sm">
                          {pack.description || 'Domine o vocabulário e a audição estruturada com este pack de flashcards.'}
                        </p>

                        {/* Empurrado para a base com mt-auto: os cards de uma linha do grid têm
                            alturas de texto diferentes, e sem isso a régua de metadados e o rodapé
                            flutuavam em posições distintas de card para card. */}
                        <div className="mt-auto pt-2 sm:pt-3">
                          <div className="flex items-center gap-2 font-body text-2xs font-semibold text-brand-secondary sm:gap-3">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className={`${homeIconGlyphSm} text-brand-dark`} />
                              Flashcards
                            </span>
                            <span className="h-1 w-1 shrink-0 rounded-full bg-brand-dark/30" aria-hidden="true" />
                            {/* "Livre acesso" contradizia o cadeado no mesmo card. A régua agora
                                diz o nível exigido, que é a informação de que a pessoa precisa. */}
                            <span className="font-heading uppercase tracking-wider text-brand-dark">
                              {lockReason ? `Requer ${normalizePackLevel(pack.level)}` : 'No seu nível'}
                            </span>
                          </div>

                          <div className="mt-3 flex w-full items-center gap-2 border-t border-brand-border pt-3 sm:gap-3 sm:pt-4">
                            {/* cn(), não interpolação: os helpers de pílula trazem o próprio
                                padding, e um override em string concatenada não vence — quem
                                decidiria passaria a ser a ordem no CSS. O twMerge resolve o
                                conflito de verdade. Os três estados usam min-h-10, igual ao botão
                                de detalhes ao lado, para os rodapés dos cards de uma mesma linha
                                do grid ficarem alinhados.
                                Rótulos de uma palavra + `whitespace-nowrap`: sobram ~145px de
                                texto na coluna, e duas palavras quebram em duas linhas e estouram
                                a altura. */}
                            {/* O botão de adicionar saiu daqui.
                                Escolher pack virou trabalho do motor diário, que respeita o nível
                                do aluno — era esta tela que deixava um A2 montar rotina de C2. O
                                rodapé agora RELATA a situação do pack em vez de pedir uma decisão:
                                no plano, liberado, ou trancado com o critério à vista. Um cadeado
                                sem critério lê como punição; com o nível que falta, lê como meta. */}
                            {lockReason ? (
                              <div
                                className={cn(
                                  homeSmallPillClass,
                                  'min-h-10 flex-1 justify-center gap-2 px-4 py-2 text-xs opacity-70 sm:text-sm'
                                )}
                                title={lockReason}
                              >
                                <Lock className={`${homeIconGlyph}`} />
                                {normalizePackLevel(pack.level)}
                              </div>
                            ) : isSubscribed ? (
                              <div className={cn(homeSubscribedPillClass, 'min-h-10 flex-1 whitespace-nowrap px-4 py-2 text-xs sm:text-sm')}>
                                <Check className={`${homeIconGlyph}`} />
                                No seu plano
                              </div>
                            ) : (
                              <div
                                className={cn(
                                  homeSmallPillClass,
                                  'min-h-10 flex-1 justify-center gap-2 px-4 py-2 text-xs sm:text-sm'
                                )}
                                title="O plano diário pode trazer este pack para você"
                              >
                                <Check className={`${homeIconGlyph}`} />
                                Liberado
                              </div>
                            )}

                            {/* Mesmo 40px de lado do botão ao lado, para o par ficar alinhado. */}
                            <Link
                              href={`/explore/pack/${pack.id}`}
                              className={`${homeIconButton} h-10 w-10`}
                              aria-label={`Abrir detalhes de ${pack.name}`}
                              title="Ver detalhes"
                            >
                              <ChevronRight className={homeIconGlyph} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className={`${exploreNestedCardClass} p-5 text-center font-body text-sm font-semibold text-brand-secondary`}>
                Ainda não há packs publicados neste nível.
              </div>
            )}
              </div>
            ) : null}
          </section>
        )
      })}
      </div>
    </div>
  )
}
