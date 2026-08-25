/**
 * Utilitários para feedback háptico e sonoro.
 */

/**
 * Vibra o dispositivo se suportado.
 * @param pattern - Padrão de vibração em milissegundos.
 */
export function triggerHapticFeedback(pattern: number | number[] = 10) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(pattern)
    } catch {
      // Ignora falhas silenciosamente
    }
  }
}

/**
 * Sons sintetizados na hora, com Web Audio.
 *
 * A versão anterior usava UM oscilador por som: uma senoide subindo para o acerto, uma triangular
 * descendo para o erro. Um oscilador só não tem timbre — é o bipe de brinquedo eletrônico, e soa
 * barato em qualquer aparelho decente.
 *
 * O que muda aqui não é o volume nem a duração, é o corpo do som:
 *
 * - **Vários parciais afinados em intervalos musicais** em vez de uma frequência só. Acerto é um
 *   acorde maior com sexta; erro é uma terça menor descendente. Intervalo musical é o que faz o
 *   ouvido reconhecer "isso foi composto" em vez de "isso foi gerado".
 * - **Ataque suave (8 ms) em vez de instantâneo.** Ganho que salta de 0 no mesmo instante produz
 *   um clique — é o estalo que dá a sensação de plástico.
 * - **Filtro passa-baixa** tirando o brilho agressivo dos harmônicos altos.
 * - **Leve desafinação entre as vozes**, que é o que dá largura ao som em vez de deixá-lo pontual.
 * - **Uma cauda curta de eco**, que é o que faz parecer que o som acontece num lugar e não dentro
 *   do alto-falante.
 * - **Volume mais baixo que o anterior.** Som premium não é o mais alto; é o que você ouve o dia
 *   inteiro sem cansar.
 *
 * O som de erro merece nota à parte: era grave e seco, de punição. Agora é um acorde curto e
 * abafado, mais suave que o de acerto. Errar faz parte de estudar, e um som que soa como castigo
 * ensina a pessoa a evitar a prática.
 */

type Voice = {
  /** Frequência em Hz. */
  freq: number
  /** Quando entra, em segundos a partir do disparo. */
  delay: number
  /** Duração total da voz. */
  duration: number
  /** Volume relativo desta voz. */
  gain: number
  type?: OscillatorType
  /** Desafinação em cents: pequenas diferenças dão largura ao som. */
  detune?: number
}

type SoundRecipe = {
  voices: Voice[]
  /** Corte do passa-baixa, em Hz. */
  cutoff: number
  /** Quanto da cauda de eco entra na mistura (0 = seco). */
  space: number
}

const ATTACK_SECONDS = 0.008
const MASTER_GAIN = 0.5

/**
 * Notas em Hz. Nomear as frequências deixa o intervalo visível: dá para ver que o acerto é um
 * acorde maior e o erro uma terça menor, em vez de ler números soltos.
 */
const NOTE = {
  D3: 146.83,
  F3: 174.61,
  A3: 220.0,
  D4: 293.66,
  F4: 349.23,
  Fs4: 369.99,
  A4: 440.0,
  B4: 493.88,
  D5: 587.33,
  Fs5: 739.99,
  A5: 880.0,
  B5: 987.77,
  D6: 1174.66,
} as const

/** Acorde de Ré maior com sexta, em arpejo rápido: resolve para cima e soa acolhedor. */
const SUCCESS_RECIPE: SoundRecipe = {
  cutoff: 5200,
  space: 0.22,
  voices: [
    { freq: NOTE.D5, delay: 0, duration: 0.75, gain: 0.16, type: 'sine' },
    { freq: NOTE.Fs5, delay: 0.045, duration: 0.7, gain: 0.13, type: 'sine', detune: 4 },
    { freq: NOTE.A5, delay: 0.09, duration: 0.66, gain: 0.11, type: 'sine', detune: -5 },
    { freq: NOTE.B5, delay: 0.135, duration: 0.6, gain: 0.07, type: 'sine' },
    // Um parcial grave dá fundamento: sem ele o acorde fica fino e flutuando.
    { freq: NOTE.D4, delay: 0, duration: 0.5, gain: 0.07, type: 'triangle' },
  ],
}

/** Terça menor descendente, curta e abafada. Marca o erro sem soar como punição. */
const ERROR_RECIPE: SoundRecipe = {
  cutoff: 1500,
  space: 0.12,
  voices: [
    { freq: NOTE.F4, delay: 0, duration: 0.3, gain: 0.11, type: 'sine' },
    { freq: NOTE.D4, delay: 0.075, duration: 0.34, gain: 0.1, type: 'sine', detune: -6 },
    { freq: NOTE.D3, delay: 0, duration: 0.28, gain: 0.075, type: 'triangle' },
    { freq: NOTE.A3, delay: 0.075, duration: 0.26, gain: 0.045, type: 'triangle' },
  ],
}

/** Toque seco e discreto para interação. Curto o bastante para não atrapalhar cliques seguidos. */
const CLICK_RECIPE: SoundRecipe = {
  cutoff: 2600,
  space: 0,
  voices: [
    { freq: NOTE.A4, delay: 0, duration: 0.05, gain: 0.05, type: 'sine' },
    { freq: NOTE.A5, delay: 0, duration: 0.035, gain: 0.025, type: 'sine' },
  ],
}

/**
 * Combo: arpejo que sobe mais alto conforme a sequência cresce.
 *
 * Três níveis com topo diferente, para a recompensa acompanhar o feito em vez de tocar sempre a
 * mesma coisa — o combo de dez precisa soar melhor que o de dois.
 */
const STREAK_TOPS = [NOTE.A5, NOTE.B5, NOTE.D6] as const

function buildStreakRecipe(level: number): SoundRecipe {
  const topo = STREAK_TOPS[Math.min(Math.max(level, 1), STREAK_TOPS.length) - 1]

  return {
    cutoff: 6200,
    space: 0.18,
    voices: [
      { freq: NOTE.D5, delay: 0, duration: 0.34, gain: 0.09, type: 'sine' },
      { freq: NOTE.Fs5, delay: 0.05, duration: 0.32, gain: 0.08, type: 'sine', detune: 4 },
      { freq: topo, delay: 0.1, duration: 0.42, gain: 0.09, type: 'sine' },
    ],
  }
}

export type FeedbackSound = 'success' | 'error' | 'click' | 'streak'

class FeedbackAudio {
  private context: AudioContext | null = null
  private master: GainNode | null = null
  /** Cauda de eco compartilhada: um nó só para todos os sons, em vez de um por disparo. */
  private space: { input: GainNode; delay: DelayNode } | null = null

  private getContext() {
    if (!this.context && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.context = new AudioCtx()
      }
    }
    return this.context
  }

  private getMaster(ctx: AudioContext) {
    if (!this.master) {
      this.master = ctx.createGain()
      this.master.gain.value = MASTER_GAIN
      this.master.connect(ctx.destination)
    }
    return this.master
  }

  /**
   * Eco curto com realimentação baixa.
   *
   * Não é uma reverberação de verdade — seria caro para um som de interface — mas resolve o mesmo
   * problema: sem nenhuma cauda, o som termina abruptamente e parece colado no alto-falante.
   */
  private getSpace(ctx: AudioContext) {
    if (!this.space) {
      const input = ctx.createGain()
      input.gain.value = 0

      const delay = ctx.createDelay(0.5)
      delay.delayTime.value = 0.085

      const feedback = ctx.createGain()
      feedback.gain.value = 0.24

      const damp = ctx.createBiquadFilter()
      damp.type = 'lowpass'
      damp.frequency.value = 2400

      input.connect(delay)
      delay.connect(damp)
      damp.connect(feedback)
      feedback.connect(delay)
      damp.connect(this.getMaster(ctx))

      this.space = { input, delay }
    }
    return this.space
  }

  private playRecipe(recipe: SoundRecipe) {
    const ctx = this.getContext()
    if (!ctx) return

    // Navegadores só liberam áudio depois de uma interação; sem isto o primeiro som some.
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }

    const now = ctx.currentTime
    const master = this.getMaster(ctx)

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = recipe.cutoff
    // Q baixo: a intenção é tirar aspereza, não colorir o som com ressonância.
    filter.Q.value = 0.7
    filter.connect(master)

    if (recipe.space > 0) {
      const space = this.getSpace(ctx)
      const send = ctx.createGain()
      send.gain.value = recipe.space
      filter.connect(send)
      send.connect(space.input)
      space.input.gain.value = 1
    }

    for (const voice of recipe.voices) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = voice.type ?? 'sine'
      osc.frequency.value = voice.freq
      if (voice.detune) osc.detune.value = voice.detune

      const start = now + voice.delay
      const end = start + voice.duration

      // Rampa de ataque em vez de salto: o salto é o que produz o clique de plástico.
      gain.gain.setValueAtTime(0, start)
      gain.gain.linearRampToValueAtTime(voice.gain, start + ATTACK_SECONDS)
      // Queda exponencial, que é como um corpo físico perde energia — a linear soa mecânica.
      gain.gain.exponentialRampToValueAtTime(0.0001, end)

      osc.connect(gain)
      gain.connect(filter)
      osc.start(start)
      osc.stop(end + 0.02)
    }
  }

  play(type: FeedbackSound, level = 1) {
    switch (type) {
      case 'success':
        return this.playRecipe(SUCCESS_RECIPE)
      case 'error':
        return this.playRecipe(ERROR_RECIPE)
      case 'click':
        return this.playRecipe(CLICK_RECIPE)
      case 'streak':
        return this.playRecipe(buildStreakRecipe(level))
    }
  }
}

export const feedbackAudio = typeof window !== 'undefined' ? new FeedbackAudio() : null

/**
 * Atalhos rápidos para feedbacks comuns.
 */
export const feedback = {
  success: () => {
    // Duplo pulso leve (heartbeat de sucesso)
    triggerHapticFeedback([30, 40, 30])
    feedbackAudio?.play('success')
  },
  error: () => {
    // Pulso mais curto que antes: a vibração longa reforçava a sensação de punição que o som
    // novo justamente abandonou.
    triggerHapticFeedback(45)
    feedbackAudio?.play('error')
  },
  click: () => {
    triggerHapticFeedback(8)
    feedbackAudio?.play('click')
  },
  streak: (level: number = 1) => {
    // Vibração crescente conforme o streak
    const pattern = Array.from({ length: Math.min(level, 3) }).map(() => 20)
    triggerHapticFeedback(pattern)
    feedbackAudio?.play('streak', level)
  },
}
