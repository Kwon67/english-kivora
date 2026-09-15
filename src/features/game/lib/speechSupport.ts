import type { GameMode } from '@/types/database.types'

/**
 * O que fazer com uma atividade de FALA num aparelho que não consegue ouvir.
 *
 * Antes: sem `SpeechRecognition` (Firefox, vários WebViews) ou com o microfone negado, a tela de
 * fala mostrava um erro e o único botão era "Pular esta frase" — que chamava `onWrong`. A sessão
 * fechava com 0%, cada card virava `session_errors`, o SRS punia e a página Dificuldades enchia
 * de frases que a pessoa nunca chegou a tentar. E como o estimador de nível exige evidência de
 * fala com acerto mínimo, quem estava nesse aparelho ficava preso no A1 para sempre.
 *
 * A saída honesta é trocar a mecânica, não fingir tentativa: a mesma frase, o mesmo áudio, mas a
 * pessoa DIGITA o que ouviu em vez de repetir. A evidência é gravada como escuta, que é o que de
 * fato aconteceu.
 */
export const SPEECH_FALLBACK_MODE = 'listening' satisfies GameMode

export function hasSpeechRecognitionSupport(): boolean {
  if (typeof window === 'undefined') return false
  const win = window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }
  return Boolean(win.SpeechRecognition || win.webkitSpeechRecognition)
}

/** O modo que de fato vai rodar, dado o que o aparelho suporta. */
export function resolvePlayableMode(mode: GameMode, speechAvailable: boolean): GameMode {
  return mode === 'speaking' && !speechAvailable ? SPEECH_FALLBACK_MODE : mode
}

/** Blitz sorteia entre modos; sem microfone a fala sai do sorteio em vez de virar erro. */
export function withoutSpeaking<Mode extends GameMode>(modes: readonly Mode[]): Mode[] {
  return modes.filter((mode) => mode !== 'speaking')
}

export const SPEECH_FALLBACK_NOTICE =
  'Sem reconhecimento de voz neste aparelho: você vai ouvir e digitar a frase em vez de repeti-la.'
