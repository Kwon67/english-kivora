/**
 * Utilitários para feedback haptico e sonoro.
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
* Gera um feedback sonoro programaticamente usando AudioContext.
*/
class FeedbackAudio {
private context: AudioContext | null = null

private getContext() {
  if (!this.context && typeof window !== 'undefined') {
    const AudioCtx = window.AudioContext || (window as (typeof window & { webkitAudioContext?: typeof AudioContext })).webkitAudioContext
    if (AudioCtx) {
      this.context = new AudioCtx()
    }
  }
  return this.context
}

  play(type: 'success' | 'error' | 'click' | 'streak') {
    const ctx = this.getContext()
    if (!ctx) return

    // Garante que o contexto está ativo (browsers exigem interação do usuário)
    if (ctx.state === 'suspended') {
      void ctx.resume()
    }

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    const now = ctx.currentTime

    if (type === 'success') {
      // Som ascendente, brilhante e "vibrante"
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, now) // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08) // A5
      osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15) // E6
      
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)
      
      osc.start(now)
      osc.stop(now + 0.25)
    } else if (type === 'error') {
      // Som descendente, mais "pesado" e curto
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(180, now)
      osc.frequency.linearRampToValueAtTime(90, now + 0.12)
      
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.15, now + 0.01)
      gain.gain.linearRampToValueAtTime(0, now + 0.18)
      
      osc.start(now)
      osc.stop(now + 0.2)
    } else if (type === 'click') {
      // "Click" mais tátil e seco
      osc.type = 'sine'
      osc.frequency.setValueAtTime(700, now)
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.06, now + 0.005)
      gain.gain.linearRampToValueAtTime(0, now + 0.04)
      osc.start(now)
      osc.stop(now + 0.04)
    } else if (type === 'streak') {
      // Som de "brilho" para combos
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.1)
      
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(660, now)
      osc2.frequency.exponentialRampToValueAtTime(1320, now + 0.15)

      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.08, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)

      gain2.gain.setValueAtTime(0, now)
      gain2.gain.linearRampToValueAtTime(0.06, now + 0.04)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4)

      osc.start(now)
      osc2.start(now)
      osc.stop(now + 0.3)
      osc2.stop(now + 0.4)
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
    // Pulso único forte e seco
    triggerHapticFeedback(65)
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
    feedbackAudio?.play('streak')
  },
  snakeHit: () => {
    // Vibração dramática para impacto da cobra na arena
    triggerHapticFeedback([100, 50, 100, 50, 200])
  }
}
