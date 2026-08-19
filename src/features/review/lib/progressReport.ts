/**
 * "Eu estou realmente aprendendo?"
 *
 * O item 8 nasceu como "relatório que prova retenção, para gerar renovação". A parte de renovação
 * morreu junto com a decisão de não vender, e o que sobra é a pergunta honesta acima.
 *
 * Três decisões que definem este arquivo:
 *
 * 1. Conta FRASES DISTINTAS, não linhas de card_reviews. Packs diferentes contêm frases idênticas
 *    (um pack inteiro do catálogo está contido em outro), então contar linhas infla o número de
 *    "dominadas" com repetição da mesma frase. `duplicatesCollapsed` devolve quanto foi colapsado,
 *    para o número poder ser auditado em vez de ter que ser acreditado.
 *
 * 2. Acerto vem de `game_sessions`, que é LOG. `card_reviews` guarda uma linha por card com o
 *    estado atual, não o histórico — dele não se extrai taxa de acerto ao longo do tempo, só a
 *    última nota. Calcular "retenção" a partir dele daria um número plausível e errado.
 *
 * 3. Com amostra pequena o relatório devolve `null`, não um número. Uma taxa de acerto sobre três
 *    respostas não informa nada, e mostrá-la com uma casa decimal finge uma precisão que não existe.
 */

/** Intervalo a partir do qual uma frase conta como dominada. 21 dias é o limite de "mature" do Anki. */
export const MASTERED_INTERVAL_DAYS = 21

/** Fronteira entre "aprendendo" e "familiar", em dias. Abaixo disso a frase ainda está na escada. */
export const FAMILIAR_INTERVAL_DAYS = 3

/** Abaixo disto não se reporta taxa de acerto: o número diria mais sobre o acaso que sobre você. */
export const MIN_ANSWERS_FOR_ACCURACY = 20

/** Abaixo disto não se reporta tendência — duas amostras minúsculas sempre "mudam" de uma para outra. */
export const MIN_SESSIONS_FOR_TREND = 6

export type ProgressInput = {
  /** Uma entrada por card em estudo (o estado atual, vindo de card_reviews). */
  cards: { cardId: string; intervalDays: number; repetitions: number }[]
  /** cardId -> frase em inglês, usada só para colapsar duplicatas. */
  phraseByCardId: Record<string, string>
  /** Log de partidas, mais recente por último. */
  sessions: { correct: number; wrong: number }[]
}

export type ProgressReport = {
  phrasesMastered: number
  phrasesLearning: number
  phrasesTotal: number
  /** Quantas linhas foram colapsadas por serem a mesma frase. Torna o total auditável. */
  duplicatesCollapsed: number
  /** Percentual inteiro de acerto, ou null quando a amostra é pequena demais para significar algo. */
  accuracy: number | null
  /** Quantas respostas sustentam `accuracy`. Sempre presente, mesmo quando accuracy é null. */
  accuracySample: number
  /** Comparação entre a metade recente e a antiga das partidas. null quando há partidas de menos. */
  trend: 'melhorando' | 'piorando' | 'estavel' | null
  /**
   * Distribuição das MESMAS frases desduplicadas, para o gráfico de domínio da página não
   * contradizer o número grande logo acima dele. Antes o gráfico usava outro limite (14 dias) e
   * contava linhas, então a mesma página dava dois valores diferentes para "dominado".
   */
  buckets: { learning: number; familiar: number; mastered: number }
}

function normalisePhrase(phrase: string | undefined): string {
  return (phrase ?? '').trim().toLowerCase()
}

function accuracyOf(sessions: { correct: number; wrong: number }[]): { pct: number; sample: number } {
  const correct = sessions.reduce((sum, s) => sum + Math.max(0, s.correct), 0)
  const wrong = sessions.reduce((sum, s) => sum + Math.max(0, s.wrong), 0)
  const sample = correct + wrong
  return { pct: sample === 0 ? 0 : Math.round((correct / sample) * 100), sample }
}

export function buildProgressReport(input: ProgressInput): ProgressReport {
  // Colapsa por frase, guardando o MAIOR intervalo entre as cópias: se a mesma frase aparece em
  // dois packs e você domina uma delas, você sabe a frase — o pior dos dois estados seria mentira
  // na direção oposta.
  const melhorPorFrase = new Map<string, number>()
  let vistos = 0
  for (const card of input.cards) {
    const chave = normalisePhrase(input.phraseByCardId[card.cardId]) || card.cardId
    vistos += 1
    const atual = melhorPorFrase.get(chave)
    if (atual === undefined || card.intervalDays > atual) melhorPorFrase.set(chave, card.intervalDays)
  }

  const intervalos = [...melhorPorFrase.values()]
  const phrasesMastered = intervalos.filter((d) => d >= MASTERED_INTERVAL_DAYS).length

  const { pct, sample } = accuracyOf(input.sessions)

  let trend: ProgressReport['trend'] = null
  if (input.sessions.length >= MIN_SESSIONS_FOR_TREND) {
    const meio = Math.floor(input.sessions.length / 2)
    const antes = accuracyOf(input.sessions.slice(0, meio))
    const depois = accuracyOf(input.sessions.slice(meio))
    if (antes.sample > 0 && depois.sample > 0) {
      const delta = depois.pct - antes.pct
      // 5 pontos de folga: variação menor que isso é ruído entre duas amostras pequenas.
      trend = delta > 5 ? 'melhorando' : delta < -5 ? 'piorando' : 'estavel'
    }
  }

  return {
    phrasesMastered,
    buckets: {
      learning: intervalos.filter((d) => d < FAMILIAR_INTERVAL_DAYS).length,
      familiar: intervalos.filter((d) => d >= FAMILIAR_INTERVAL_DAYS && d < MASTERED_INTERVAL_DAYS).length,
      mastered: phrasesMastered,
    },
    phrasesLearning: intervalos.length - phrasesMastered,
    phrasesTotal: intervalos.length,
    duplicatesCollapsed: vistos - intervalos.length,
    accuracy: sample >= MIN_ANSWERS_FOR_ACCURACY ? pct : null,
    accuracySample: sample,
    trend,
  }
}
