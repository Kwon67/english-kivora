import type { BlitzGameMode } from '@/features/blitz/lib/blitzModes'

/**
 * Adaptação DENTRO da partida.
 *
 * `cardIntelligence` escolhe o baralho antes de começar; isto decide o que fazer com ele enquanto
 * a pessoa joga. Antes o modo saía de um sorteio com pesos fixos (`pickRandomBlitzMode`) e a fila
 * girava sempre igual: acertar dez seguidas ou errar três não mudava absolutamente nada do que
 * vinha depois. Um professor faz o oposto disso — ele sobe a dificuldade quando você embala e
 * alivia quando você trava.
 */

/** Estado vivo da partida. Só o que a decisão precisa; o resto fica no componente. */
export type BlitzRunState = {
  /** Acertos seguidos agora. */
  streak: number
  /** Erros na partida inteira. */
  misses: number
  /** Erros nas últimas 4 rodadas: mede se a pessoa está travando AGORA, não no começo. */
  recentMisses: number
  /** Rodadas já jogadas. */
  round: number
}

export const INITIAL_BLITZ_RUN_STATE: BlitzRunState = {
  streak: 0,
  misses: 0,
  recentMisses: 0,
  round: 0,
}

/**
 * A escada de exigência dos modos, do reconhecimento à produção.
 *
 * Reconhecer entre quatro opções é muito mais fácil que produzir a frase do zero, e falar exige
 * ainda mais. Os pesos antigos não tinham nada a ver com isso: `multiple_choice` era o mais
 * provável (30) só por ser o mais comum.
 */
export const BLITZ_MODE_DEMAND: Record<BlitzGameMode, number> = {
  multiple_choice: 1,
  matching: 2,
  listening: 3,
  typing: 4,
  speaking: 5,
}

export type BlitzPressure = 'recuperando' | 'estavel' | 'exigente'

/**
 * Em que pé a pessoa está agora.
 *
 * Dois erros recentes bastam para aliviar: insistir na dificuldade com quem acabou de travar gasta
 * as vidas restantes e não ensina nada. Quatro acertos seguidos liberam a exigência máxima.
 */
const RECOVERY_THRESHOLD = 1.5

export function getBlitzPressure(state: BlitzRunState): BlitzPressure {
  // 1.5 e não 2: com decaimento de 0.5 por acerto, um limite de 2 sairia do alívio no PRIMEIRO
  // acerto, e a janela curta não protegeria nada. Assim são precisos dois acertos seguidos para
  // a partida voltar ao ritmo normal — um acerto de sorte não basta.
  if (state.recentMisses >= RECOVERY_THRESHOLD) return 'recuperando'
  if (state.streak >= 4) return 'exigente'
  return 'estavel'
}

const PRESSURE_DEMAND_RANGE: Record<BlitzPressure, { min: number; max: number }> = {
  recuperando: { min: 1, max: 2 },
  estavel: { min: 1, max: 4 },
  exigente: { min: 3, max: 5 },
}

/**
 * O modo da próxima rodada.
 *
 * A faixa de exigência vem da pressão; dentro dela, sorteia para a partida não virar previsível.
 * `avoid` impede repetir o mesmo modo duas vezes seguidas — variar é metade da graça do Blitz.
 */
export function pickAdaptiveBlitzMode(
  state: BlitzRunState,
  available: BlitzGameMode[],
  options?: { avoid?: BlitzGameMode | null; random?: () => number }
): BlitzGameMode {
  const random = options?.random ?? Math.random
  const faixa = PRESSURE_DEMAND_RANGE[getBlitzPressure(state)]

  const naFaixa = available.filter((mode) => {
    const demand = BLITZ_MODE_DEMAND[mode]
    return demand >= faixa.min && demand <= faixa.max
  })

  const candidatos = naFaixa.length > 0 ? naFaixa : available
  const semRepetir = candidatos.filter((mode) => mode !== options?.avoid)
  const finais = semRepetir.length > 0 ? semRepetir : candidatos

  if (finais.length === 0) return available[0]

  return finais[Math.floor(random() * finais.length) % finais.length]
}

/**
 * Onde reinserir na fila o card que a pessoa errou.
 *
 * Antes ia sempre para o meio da fila, distância fixa. Repetição espaçada dentro da partida
 * funciona melhor perto: volta em 3 rodadas quando a pessoa está bem (ainda dá tempo de fixar),
 * e mais longe quando ela está travando (repetir logo o que acabou de derrubar só frustra).
 */
export function getMissReinsertOffset(state: BlitzRunState, queueLength: number): number {
  if (queueLength <= 2) return queueLength

  const base = getBlitzPressure(state) === 'recuperando' ? 6 : 3
  return Math.min(base, queueLength)
}

/** Atualiza o estado vivo depois de uma rodada. */
export function advanceBlitzRunState(state: BlitzRunState, correct: boolean): BlitzRunState {
  return {
    round: state.round + 1,
    streak: correct ? state.streak + 1 : 0,
    misses: state.misses + (correct ? 0 : 1),
    // Janela curta que esquece o passado: decai a cada acerto em vez de zerar de uma vez, senão
    // um acerto de sorte apagaria a evidência de que a pessoa está com dificuldade.
    recentMisses: correct ? Math.max(0, state.recentMisses - 0.5) : state.recentMisses + 1,
  }
}

/** Frase curta para o HUD, para a adaptação ser visível em vez de silenciosa. */
export function getBlitzPressureLabel(pressure: BlitzPressure): string {
  switch (pressure) {
    case 'recuperando':
      return 'Aliviando o ritmo'
    case 'exigente':
      return 'Subindo o nível'
    default:
      return ''
  }
}
