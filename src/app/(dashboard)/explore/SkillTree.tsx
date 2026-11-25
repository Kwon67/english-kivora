'use client'

import Link from 'next/link'
import { Check, Lock, ChevronRight, ChevronDown, BookOpen,  Target, Search, X } from 'lucide-react'
import { normalizePackLevel, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import { getPackLockReason, type LevelGate } from '@/features/learning/lib/levelGate'
import EmptyState from '@/components/ui/EmptyState'
import { useRef, useState } from 'react'
import { groupPacksByLevel } from '@/features/cards/lib/packFolders'
import { filtrarPacks, listarCategorias } from '@/features/explore/lib/packFiltering'
import {
  homeSecondaryButton,
} from '@/lib/homeStyles'
import {
  exploreFrostedSubtle,
  exploreFrostedSurface,
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

const filterBtnBase = 'discovery-filter'

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
  const searchRef = useRef<HTMLInputElement>(null)
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
      <div className="catalog-controls">
        {(recommendedLevel || assessing) && (
          <div className="discovery-scope">
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
                    className={filterBtnBase}
                  >
                    <Target className="h-3.5 w-3.5" />
                    Recomendados
                  </button>
                  <button
                    type="button"
                    onClick={() => setCatalogMode('full')}
                    aria-pressed={!showingRecommended}
                    className={filterBtnBase}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Todos os packs
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        )}

        <div className="discovery-search-panel space-y-3">
          <div className="relative" role="search" aria-label="Catálogo">
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-secondary" />
            <input
              id="catalog-search"
              ref={searchRef}
              type="search"
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por tema, situação ou nível..."
              aria-label="Buscar no catálogo"
              className="discovery-search"
            />
            {busca ? (
              <button
                type="button"
                onClick={() => { setBusca(''); searchRef.current?.focus() }}
                aria-label="Limpar busca"
                className="discovery-clear"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <details className="catalog-themes">
            <summary>Filtrar por tema{categoria && <strong>{categoria}</strong>}<ChevronDown size={16} aria-hidden="true" /></summary>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setCategoria(null)}
                aria-pressed={categoria === null}
                className={filterBtnBase}
              >
                Todos os temas
              </button>
              {categorias.map((item) => (
                <button
                  key={item.name}
                  type="button"
                  onClick={() => setCategoria(categoria === item.name ? null : item.name)}
                  aria-pressed={categoria === item.name}
                  className={filterBtnBase}
                >
                  {item.name}
                  <span className="font-body text-[11px] opacity-70">{item.count}</span>
                </button>
              ))}
            </div>
          </details>

          {filtroAtivo ? (
            <p className="font-body text-xs text-brand-secondary" aria-live="polite">
              {filtrados.length === 0
                ? 'Nenhuma coleção encontrada.'
                : `${filtrados.length} ${filtrados.length === 1 ? 'coleção encontrada' : 'coleções encontradas'}.`}
            </p>
          ) : null}
        </div>

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
              <ul className="discovery-pack-list" role="list">
                {sortedPacks.map((pack) => {
                  const isSubscribed = subscribedSet.has(pack.id)
                  const lockReason = getPackLockReason(pack.level, gate)
                  const StatusIcon = lockReason ? Lock : Check

                  return (
                    <li key={pack.id}>
                      <Link href={`/explore/pack/${pack.id}`} className="discovery-pack" prefetch={false}>
                        <div className="discovery-pack-copy">
                          <h3>{pack.name}</h3>
                          {pack.description && <p>{pack.description}</p>}
                          <p>{pack.level || 'A1-A2'} · Flashcards</p>
                        </div>
                        <span className="discovery-pack-status" title={lockReason || undefined}>
                          <StatusIcon size={15} aria-hidden="true" />
                          {lockReason ? `Requer ${normalizePackLevel(pack.level)}` : isSubscribed ? 'No seu plano' : 'Liberado'}
                        </span>
                        <ChevronRight size={16} aria-hidden="true" />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="px-2 py-4 text-sm text-brand-secondary">
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
