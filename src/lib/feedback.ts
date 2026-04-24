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

  play(type: 'success' | 'error' | 'click') {
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
      // Som ascendente e brilhante
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, now) // A4
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1) // A5
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.1, now + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2)
      osc.start(now)
      osc.stop(now + 0.2)
    } else if (type === 'error') {
      // Som descendente e grave
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(150, now)
      osc.frequency.linearRampToValueAtTime(100, now + 0.15)
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.1, now + 0.02)
      gain.gain.linearRampToValueAtTime(0, now + 0.2)
      osc.start(now)
      osc.stop(now + 0.2)
    } else if (type === 'click') {
      // "Click" curto e seco
      osc.type = 'sine'
      osc.frequency.setValueAtTime(600, now)
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(0.05, now + 0.01)
      gain.gain.linearRampToValueAtTime(0, now + 0.05)
      osc.start(now)
      osc.stop(now + 0.05)
    }
  }
}

export const feedbackAudio = typeof window !== 'undefined' ? new FeedbackAudio() : null

/**
 * Atalhos rápidos para feedbacks comuns.
 */
export const feedback = {
  success: () => {
    triggerHapticFeedback(10)
    feedbackAudio?.play('success')
  },
  error: () => {
    triggerHapticFeedback([50, 30, 50])
    feedbackAudio?.play('error')
  },
  click: () => {
    triggerHapticFeedback(5)
    feedbackAudio?.play('click')
  }
}
