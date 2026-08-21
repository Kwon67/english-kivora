'use client'

import { m } from 'motion/react'
import Link from 'next/link'
import { Check, Plus, ChevronRight, ChevronDown, BookOpen, Award, Target, Search, X } from 'lucide-react'
import { normalizePackLevel, type LearnerCefrLevel } from '@/features/cefr/lib/cefrLevels'
import EmptyState from '@/components/ui/EmptyState'
import { useState } from 'react'
import { groupPacksByLevel } from '@/features/cards/lib/packFolders'
import { filtrarPacks, listarCategorias } from '@/features/explore/lib/packFiltering'
import AssignPackModal from '@/features/study/components/AssignPackModal'
import SectionBadge from '@/components/ui/SectionBadge'
import { cn } from '@/lib/utils'
import {
  homeCardClass,
  homeIconBox,
  homeIconButton,
  homeIconGlyph,
  homeIconGlyphSm,
  homePrimaryButton,
  homeSecondaryButton,
  homeSmallPillClass,
  homeSubscribedPillClass,
} from '@/lib/homeStyles'

type PackRow = {
  id: string
  name: string
  description: string | null
  level: string | null
  cover_url: string | null
  category: string | null
}

interface SkillTreeProps {
  packs: PackRow[]
  subscribedPackIds: string[]
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
  recommendedLevel = null,
  nextStepLevel = null,
  assessing = false,
}: SkillTreeProps) {
  const [selectedPack, setSelectedPack] = useState<PackRow | null>(null)
  const [catalogMode, setCatalogMode] = useState<'full' | 'recommended'>('full')
  const [busca, setBusca] = useState('')
  const [categoria, setCategoria] = useState<string | null>(null)
  // Níveis que a pessoa abriu à mão. O do nível dela já nasce aberto (ver `abertoPorPadrao`).
  const [abertos, setAbertos] = useState<Record<string, boolean>>({})

  if (!packs || packs.length === 0) {
    return (
      <EmptyState
        imageSrc="/images/home/undraw-online-learning.svg"
        imageAlt="Ilustração unDraw para catálogo sem packs"
        title="Nenhum pack encontrado"
        description="Volte mais tarde para ver novas sugestões."
        variant="glass"
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

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  }


  return (
    <div className="space-y-8">
      {(recommendedLevel || assessing) && (
        <div className={`${homeCardClass} p-5 sm:p-6`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <SectionBadge label="Trilha personalizada" animate={false} />
              <h3 className="mt-3 font-heading text-lg font-bold text-brand-dark">
                {assessing
                  ? 'Estamos medindo seu nível nas revisões e lições'
                  : `Seu nível detectado: ${recommendedLevel}`}
              </h3>
              <p className="mt-2 font-body text-sm text-brand-secondary">
                {assessing
                  ? 'Continue praticando — após algumas sessões o app indica A1, A2, B1 ou B2 automaticamente.'
                  : nextStepLevel
                    ? `Próximo passo sugerido: packs de nível ${nextStepLevel}.`
                    : 'Você já atingiu B2 no escopo atual do catálogo.'}
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
                  Recomendado para meu nível
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
                  Ver catálogo completo
                </button>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <div className={`${homeCardClass} space-y-4 p-5 sm:p-6`}>
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
          imageSrc="/images/home/undraw-studying.svg"
          imageAlt="Nenhum pack recomendado"
          title="Nenhum pack neste filtro ainda"
          description="Mostre o catálogo completo ou aguarde novos packs no seu nível."
          variant="glass"
        >
          <button
            type="button"
            onClick={() => setCatalogMode('full')}
            className={homeSecondaryButton}
          >
            Ver catálogo completo
          </button>
        </EmptyState>
      ) : null}

      <div className="space-y-10 sm:space-y-14">
      {folders.map((folder) => {
        const sortedPacks = [...folder.packs].sort(
          (a, b) => getLevelWeight(a.level) - getLevelWeight(b.level)
        )

        const aberto = estaAberto(folder.id, folder.label)
        const idConteudo = `nivel-${folder.id}`

        return (
          <section key={folder.id} className="space-y-5 sm:space-y-6">
            <button
              type="button"
              onClick={() => setAbertos((atual) => ({ ...atual, [folder.id]: !aberto }))}
              aria-expanded={aberto}
              aria-controls={idConteudo}
              className={`${homeCardClass} flex w-full flex-col gap-4 p-5 text-left transition-colors hover:bg-brand-accent/10 sm:flex-row sm:items-center sm:justify-between sm:p-6`}
            >
              <div className="flex items-start gap-4">
                <div className={`h-12 w-12 shrink-0 ${homeIconBox}`}>
                  <Award className="h-5 w-5" strokeWidth={2.2} />
                </div>
                <div>
                  <p className={homeSmallPillClass}>Nível de estudo</p>
                  <h3 className="mt-2 font-heading text-xl font-bold text-brand-dark sm:text-2xl">
                    {folder.label}
                  </h3>
                  <p className="mt-2 font-body text-xs leading-relaxed text-brand-secondary">
                    {aberto
                      ? 'Escolha o treino que fizer mais sentido para você agora.'
                      : 'Toque para ver as coleções deste nível.'}
                  </p>
                </div>
              </div>
              <span className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
                <span className={`${homeSmallPillClass} bg-brand-accent`}>
                  <Award className="mr-1.5 h-3.5 w-3.5" />
                  {folder.packs.length} {folder.packs.length === 1 ? 'coleção' : 'coleções'}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-brand-dark transition-transform ${aberto ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </span>
            </button>

            {aberto ? (
              <div id={idConteudo}>
            {sortedPacks.length > 0 ? (
              <m.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              >
                {sortedPacks.map((pack) => {
                  const isSubscribed = subscribedSet.has(pack.id)
                  const levelWeight = getLevelWeight(pack.level)

                  return (
                    <m.article
                      key={pack.id}
                      variants={{
                        hidden: { opacity: 0, y: 16 },
                        show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
                      }}
                      className={`${homeCardClass} group relative flex flex-col overflow-hidden transition-[transform,border-color] hover:-translate-y-0.5 hover:border-brand-dark`}
                    >
                      {/* A ilustração saiu daqui. Ela ocupava uma faixa de 120–140px no topo de
                          cada card só para repetir uma de cinco artes genéricas, sem relação com o
                          conteúdo do pack — empurrava o nome, que é a informação que a pessoa
                          realmente lê, para baixo da dobra do card. Sem ela o card encolhe, cabem
                          mais coleções na tela e o título vira a primeira coisa que o olho encontra. */}
                      <div className="relative z-10 flex flex-1 flex-col p-4 sm:p-5">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* O nível vira a âncora visual: numa árvore de habilidades é por ele
                              que a pessoa se localiza, então ele ganha o preenchimento lime. */}
                          <span className={`${homeSmallPillClass} bg-brand-accent`}>
                            {pack.level || 'A1-A2'}
                          </span>
                          {levelWeight <= 2 && (
                            <span className={homeSmallPillClass}>
                              <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-brand-dark" aria-hidden="true" />
                              Iniciante
                            </span>
                          )}
                          {levelWeight === 4 && (
                            <span className={homeSmallPillClass}>
                              <Target className={`mr-1.5 ${homeIconGlyphSm}`} />
                              B2
                            </span>
                          )}
                          {isSubscribed ? (
                            <span
                              className="ml-auto inline-flex items-center gap-1.5 font-heading text-2xs font-bold uppercase tracking-widest text-brand-dark"
                              title="Já está na sua rotina"
                            >
                              <Check className={`${homeIconGlyphSm} stroke-[3]`} />
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
                        <h3 className="mt-3 line-clamp-2 font-heading text-base font-bold leading-snug text-brand-dark sm:text-lg">
                          {pack.name}
                        </h3>
                        <p className="mt-2 line-clamp-2 font-body text-xs leading-relaxed text-brand-secondary sm:text-sm">
                          {pack.description || 'Domine o vocabulário e a audição estruturada com este pack de flashcards.'}
                        </p>

                        {/* Empurrado para a base com mt-auto: os cards de uma linha do grid têm
                            alturas de texto diferentes, e sem isso a régua de metadados e o rodapé
                            flutuavam em posições distintas de card para card. */}
                        <div className="mt-auto pt-3 sm:pt-4">
                          <div className="flex items-center gap-2 font-body text-2xs font-semibold text-brand-secondary sm:gap-3">
                            <span className="flex items-center gap-1.5">
                              <BookOpen className={`${homeIconGlyphSm} text-brand-dark`} />
                              Flashcards
                            </span>
                            <span className="h-1 w-1 shrink-0 rounded-full bg-brand-dark/30" aria-hidden="true" />
                            <span className="font-heading uppercase tracking-wider text-brand-dark">Livre acesso</span>
                          </div>

                          <div className="mt-3 flex w-full items-center gap-2 border-t border-brand-border pt-3 sm:gap-3 sm:pt-4">
                            {/* cn(), não interpolação: `homePrimaryButton` traz `px-6 py-3` e o
                                override `px-4 py-2` numa string concatenada não vence — quem
                                decide passa a ser a ordem no CSS, e o botão saía com 46px de
                                altura contra os 40px da pílula "Adicionado à rotina", deixando os
                                cards da mesma linha desalinhados em 3px. O twMerge resolve o
                                conflito de verdade. Ambos os estados usam h-10, igual ao botão
                                de detalhes ao lado. */}
                            {/* Rótulos de uma palavra + `whitespace-nowrap`: numa coluna do grid
                                sobram 145px para o texto e "Desbloquear treino" pede 154px, então
                                ele quebrava em duas linhas e estourava a altura fixa do botão. E
                                "treino" não informava nada — o card inteiro é um treino, e a régua
                                logo acima já diz o formato. Com uma linha garantida, os 40px valem
                                para os dois estados e o rodapé continua alinhado entre os cards. */}
                            {isSubscribed ? (
                              <div className={cn(homeSubscribedPillClass, 'min-h-10 flex-1 whitespace-nowrap px-4 py-2 text-xs sm:text-sm')}>
                                <Check className={`${homeIconGlyph} stroke-[2.5]`} />
                                Adicionado
                              </div>
                            ) : (
                              <button
                                onClick={() => setSelectedPack(pack)}
                                className={cn(homePrimaryButton, 'min-h-10 flex-1 whitespace-nowrap px-4 py-2 text-xs sm:text-sm')}
                              >
                                <Plus className={`${homeIconGlyph} stroke-[2.5]`} />
                                Desbloquear
                              </button>
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
                    </m.article>
                  )
                })}
              </m.div>
            ) : (
              <div className={`${homeCardClass} p-5 text-center font-body text-sm font-semibold text-brand-secondary`}>
                Ainda não há packs publicados neste nível.
              </div>
            )}
              </div>
            ) : null}
          </section>
        )
      })}
      </div>
      {selectedPack ? (
        <AssignPackModal
          packId={selectedPack.id}
          packName={selectedPack.name}
          open={Boolean(selectedPack)}
          onClose={() => setSelectedPack(null)}
        />
      ) : null}
    </div>
  )
}
