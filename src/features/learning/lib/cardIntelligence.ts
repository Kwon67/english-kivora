import {
  getCefrLevelWeight,
  normalizePackLevel,
  type LearnerCefrLevel,
} from '@/features/cefr/lib/cefrLevels'

/**
 * O modelo do aluno: por que ESTE card, agora.
 *
 * Blitz e revisão faziam a escolha por regra fixa — o Blitz embaralhava e girava a fila, a revisão
 * ordenava por data de vencimento e pegava os primeiros. Nenhum dos dois olhava o que a pessoa
 * erra, o que já esqueceu ou o que está perto do limite dela. O resultado era conteúdo correto no
 * agregado e arbitrário no detalhe: dois cards igualmente vencidos apareciam em ordem alfabética
 * de acaso, sendo que um deles a pessoa já errou quatro vezes.
 *
 * Aqui cada card recebe uma nota a partir de sinais que já existem no banco, e — igualmente
 * importante — o MOTIVO da nota. O motivo não é enfeite: é o que separa um sistema que decide de
 * um que sorteia, e é o que a tela mostra para a escolha não parecer aleatória.
 */

/** Estado de um card para um aluno específico, montado a partir de `card_reviews` + erros recentes. */
export type CardSignal = {
  cardId: string
  packId: string | null
  /** `packs.level` cru do banco: pode vir null, "intermediate" ou "B1". */
  packLevel: string | null
  /** Nunca estudado por esta pessoa. */
  isNew: boolean
  /** Quantas vezes o card já voltou à estaca zero depois de ter graduado. O sinal mais forte. */
  lapses: number
  /** Fator de facilidade do SM-2. Começa em 2.5; quanto menor, mais a pessoa penou com ele. */
  easeFactor: number
  repetitions: number
  /** Erros deste card em sessões dos últimos dias. */
  recentErrors: number
  /** Dias desde a última vez que o card foi visto. Negativo/0 = visto hoje. */
  daysSinceSeen: number
  /** Dias de atraso em relação ao agendamento. Negativo = ainda não venceu. */
  daysOverdue: number
}

export type SelectionMode = 'blitz' | 'review'

export type CardIntelligenceContext = {
  userLevel: LearnerCefrLevel | null
  mode: SelectionMode
}

export type ScoredCard = {
  signal: CardSignal
  score: number
  /** Motivo dominante, em português, pronto para a tela. */
  reason: string
  /** Rótulo curto para chip/etiqueta. */
  reasonTag: CardReasonTag
}

export type CardReasonTag =
  | 'errou-recente'
  | 'escapando'
  | 'atrasado'
  | 'no-seu-nivel'
  | 'material-novo'
  | 'consolidando'

const REASON_LABELS: Record<CardReasonTag, string> = {
  'errou-recente': 'Você errou há pouco',
  escapando: 'Está escapando',
  atrasado: 'Atrasado',
  'no-seu-nivel': 'No seu nível',
  'material-novo': 'Material novo',
  consolidando: 'Consolidando',
}

export function getCardReasonLabel(tag: CardReasonTag): string {
  return REASON_LABELS[tag]
}

/**
 * Pesos por contexto.
 *
 * A revisão existe para honrar o agendamento: atraso manda. O Blitz é treino livre e cronometrado,
 * então o que pesa é o que a pessoa erra e o que está na borda do nível dela — puxar um card
 * atrasado de A1 no meio de uma partida de B1 não é desafio, é preenchimento.
 */
const WEIGHTS: Record<SelectionMode, {
  due: number
  overduePerDay: number
  overdueCap: number
  lapsePerEvent: number
  lapseCap: number
  easeDrop: number
  errorPerEvent: number
  errorCap: number
  levelAtCeiling: number
  levelStepPenalty: number
  stalePerDay: number
  staleCap: number
  newCard: number
}> = {
  review: {
    due: 30,
    overduePerDay: 7,
    overdueCap: 28,
    lapsePerEvent: 11,
    lapseCap: 33,
    easeDrop: 18,
    errorPerEvent: 10,
    errorCap: 20,
    levelAtCeiling: 8,
    levelStepPenalty: 3,
    stalePerDay: 0.5,
    staleCap: 10,
    newCard: 16,
  },
  blitz: {
    due: 8,
    overduePerDay: 2,
    overdueCap: 6,
    lapsePerEvent: 13,
    lapseCap: 39,
    easeDrop: 20,
    errorPerEvent: 14,
    errorCap: 28,
    levelAtCeiling: 30,
    levelStepPenalty: 9,
    stalePerDay: 0.6,
    staleCap: 12,
    newCard: 20,
  },
}

/** Fator de facilidade inicial do SM-2: abaixo disso, o card já deu trabalho. */
const DEFAULT_EASE_FACTOR = 2.5

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

type Contribution = { points: number; tag: CardReasonTag; reason: string }

/**
 * Quão informativo é cada tipo de motivo — separado do peso na nota, de propósito.
 *
 * Depois do teto de nível, quase todo card do baralho está "no seu nível": isso pontua alto e
 * explica nada. Já "você errou esta 3 vezes" vale para poucos cards e diz exatamente por que ESTE
 * apareceu. O que decide a ordem da fila é a nota; o que decide a frase na tela é isto.
 */
const REASON_SALIENCE: Record<CardReasonTag, number> = {
  'errou-recente': 5,
  escapando: 4,
  atrasado: 3,
  'material-novo': 2,
  'no-seu-nivel': 1,
  consolidando: 0,
}

/**
 * Nota do card e o motivo dominante.
 *
 * Cada componente devolve pontos E uma explicação. O motivo exibido é o do maior componente, não
 * uma frase genérica escolhida depois — assim o texto na tela e a decisão real são a mesma coisa.
 */
export function scoreCard(signal: CardSignal, context: CardIntelligenceContext): ScoredCard {
  const weights = WEIGHTS[context.mode]
  const contributions: Contribution[] = []

  if (signal.isNew) {
    contributions.push({
      points: weights.newCard,
      tag: 'material-novo',
      reason: 'Frase nova, ainda não vista por você',
    })
  }

  if (signal.recentErrors > 0) {
    const vezes = signal.recentErrors === 1 ? '1 vez' : `${signal.recentErrors} vezes`
    contributions.push({
      points: Math.min(weights.errorCap, signal.recentErrors * weights.errorPerEvent),
      tag: 'errou-recente',
      reason: `Você errou esta frase ${vezes} nos últimos dias`,
    })
  }

  if (signal.lapses > 0) {
    contributions.push({
      points: Math.min(weights.lapseCap, signal.lapses * weights.lapsePerEvent),
      tag: 'escapando',
      reason:
        signal.lapses === 1
          ? 'Você já sabia esta e ela escapou uma vez'
          : `Esta já escapou ${signal.lapses} vezes depois de aprendida`,
    })
  }

  // Facilidade abaixo do padrão é memória de dificuldade acumulada, mesmo sem lapso registrado.
  const easeGap = clamp(DEFAULT_EASE_FACTOR - signal.easeFactor, 0, 1.2)
  if (easeGap > 0.05) {
    contributions.push({
      points: easeGap * weights.easeDrop,
      tag: 'escapando',
      reason: 'Esta frase tem custado mais esforço que as outras',
    })
  }

  // O bônus de vencimento entra como BASE, sem disputar o motivo exibido: ele é idêntico para
  // todo card vencido da sessão, então explicaria nada. Só o atraso EXTRA, que varia de card para
  // card, vira motivo — a pergunta que a tela responde é "por que esta frase e não a outra".
  let basePoints = 0
  if (signal.daysOverdue > -1) {
    basePoints += weights.due
  }

  if (signal.daysOverdue > 1) {
    const dias = Math.round(signal.daysOverdue)
    contributions.push({
      points: Math.min(weights.overdueCap, signal.daysOverdue * weights.overduePerDay),
      tag: 'atrasado',
      reason: `Está ${dias} dias atrasada na revisão`,
    })
  }

  // Encaixe de nível: o card no teto do aluno é a borda de crescimento; abaixo dela é consolidação,
  // que vale menos mas não vale zero — rever o que já se sabe é o que sustenta o que vem depois.
  if (context.userLevel) {
    const distancia =
      getCefrLevelWeight(context.userLevel) - getCefrLevelWeight(normalizePackLevel(signal.packLevel))
    if (distancia >= 0) {
      const pontos = Math.max(0, weights.levelAtCeiling - distancia * weights.levelStepPenalty)
      if (pontos > 0) {
        contributions.push({
          points: pontos,
          tag: distancia === 0 ? 'no-seu-nivel' : 'consolidando',
          reason:
            distancia === 0
              ? `Está exatamente no seu nível (${context.userLevel})`
              : 'Reforça uma base que sustenta o seu nível atual',
        })
      }
    }
  }

  if (signal.daysSinceSeen > 0 && !signal.isNew) {
    contributions.push({
      points: Math.min(weights.staleCap, signal.daysSinceSeen * weights.stalePerDay),
      tag: 'consolidando',
      reason: `Faz ${Math.round(signal.daysSinceSeen)} dias que você não vê esta frase`,
    })
  }

  const score = contributions.reduce((total, item) => total + item.points, basePoints)
  const dominante = contributions.reduce<Contribution | null>((melhor, item) => {
    if (!melhor) return item
    const relevancia = REASON_SALIENCE[item.tag] - REASON_SALIENCE[melhor.tag]
    if (relevancia > 0) return item
    if (relevancia < 0) return melhor
    return item.points > melhor.points ? item : melhor
  }, null)

  return {
    signal,
    score: Math.round(score * 10) / 10,
    reason: dominante?.reason ?? 'Vence hoje pelo seu agendamento',
    reasonTag: dominante?.tag ?? 'atrasado',
  }
}

/**
 * Evita servir várias frases do mesmo pack em sequência.
 *
 * Sem isto, a nota sozinha agrupa: um pack que a pessoa acabou de começar tem todos os cards novos
 * com a mesma pontuação, e a sessão inteira vira aquele pack. Intercalar é o que faz a sessão
 * parecer montada por alguém, e é prática de aprendizagem consolidada — misturar contextos fixa
 * mais do que blocar.
 */
export function interleaveByPack(cards: ScoredCard[]): ScoredCard[] {
  const restantes = [...cards]
  const saida: ScoredCard[] = []
  let ultimoPack: string | null = null

  while (restantes.length > 0) {
    // Já vem ordenado por nota: o primeiro que não repete o pack anterior é o melhor disponível.
    let escolhido = restantes.findIndex((item) => item.signal.packId !== ultimoPack)
    if (escolhido === -1) escolhido = 0

    const [card] = restantes.splice(escolhido, 1)
    saida.push(card)
    ultimoPack = card.signal.packId
  }

  return saida
}

export function rankCards(
  signals: CardSignal[],
  context: CardIntelligenceContext
): ScoredCard[] {
  const pontuados = signals
    .map((signal) => scoreCard(signal, context))
    .sort((a, b) => b.score - a.score)

  return interleaveByPack(pontuados)
}
