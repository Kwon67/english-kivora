import { describe, expect, it } from 'vitest'
import { BLITZ_GAME_MODES } from '@/features/blitz/lib/blitzModes'
import {
  BLITZ_MODE_DEMAND,
  INITIAL_BLITZ_RUN_STATE,
  advanceBlitzRunState,
  getBlitzPressure,
  getMissReinsertOffset,
  pickAdaptiveBlitzMode,
  type BlitzRunState,
} from '@/features/blitz/lib/blitzAdaptive'

const estado = (over: Partial<BlitzRunState>): BlitzRunState => ({
  ...INITIAL_BLITZ_RUN_STATE,
  ...over,
})

describe('a partida percebe em que pé o jogador está', () => {
  it('começa estável', () => {
    expect(getBlitzPressure(INITIAL_BLITZ_RUN_STATE)).toBe('estavel')
  })

  it('alivia depois de dois erros recentes', () => {
    expect(getBlitzPressure(estado({ recentMisses: 2 }))).toBe('recuperando')
  })

  it('aperta depois de quatro acertos seguidos', () => {
    expect(getBlitzPressure(estado({ streak: 4 }))).toBe('exigente')
  })

  it('erro recente manda mais que sequência antiga', () => {
    expect(getBlitzPressure(estado({ streak: 9, recentMisses: 2 }))).toBe('recuperando')
  })
})

describe('a exigência do modo acompanha o desempenho', () => {
  const sempre = () => 0

  it('quem está travando recebe só modos de reconhecimento', () => {
    for (let i = 0; i < 12; i += 1) {
      const modo = pickAdaptiveBlitzMode(estado({ recentMisses: 3 }), [...BLITZ_GAME_MODES], {
        random: () => i / 12,
      })
      expect(BLITZ_MODE_DEMAND[modo]).toBeLessThanOrEqual(2)
    }
  })

  it('quem está embalado recebe modos de produção', () => {
    for (let i = 0; i < 12; i += 1) {
      const modo = pickAdaptiveBlitzMode(estado({ streak: 6 }), [...BLITZ_GAME_MODES], {
        random: () => i / 12,
      })
      expect(BLITZ_MODE_DEMAND[modo]).toBeGreaterThanOrEqual(3)
    }
  })

  it('não repete o mesmo modo duas rodadas seguidas', () => {
    const modo = pickAdaptiveBlitzMode(INITIAL_BLITZ_RUN_STATE, [...BLITZ_GAME_MODES], {
      avoid: 'typing',
      random: sempre,
    })
    expect(modo).not.toBe('typing')
  })

  it('não trava quando só existe um modo disponível', () => {
    expect(
      pickAdaptiveBlitzMode(INITIAL_BLITZ_RUN_STATE, ['typing'], { avoid: 'typing', random: sempre })
    ).toBe('typing')
  })

  it('a escada de exigência cobre todos os modos do Blitz', () => {
    for (const modo of BLITZ_GAME_MODES) {
      expect(BLITZ_MODE_DEMAND[modo]).toBeGreaterThan(0)
    }
  })
})

describe('o card errado volta na hora certa', () => {
  it('volta rápido quando o jogador está bem', () => {
    expect(getMissReinsertOffset(estado({ streak: 3 }), 20)).toBe(3)
  })

  it('demora mais quando o jogador está travando', () => {
    expect(getMissReinsertOffset(estado({ recentMisses: 3 }), 20)).toBe(6)
  })

  it('nunca passa do tamanho da fila', () => {
    expect(getMissReinsertOffset(estado({ recentMisses: 3 }), 4)).toBe(4)
    expect(getMissReinsertOffset(INITIAL_BLITZ_RUN_STATE, 1)).toBe(1)
  })
})

describe('o estado vivo da partida', () => {
  it('conta sequência e zera no erro', () => {
    let s = INITIAL_BLITZ_RUN_STATE
    s = advanceBlitzRunState(s, true)
    s = advanceBlitzRunState(s, true)
    expect(s.streak).toBe(2)

    s = advanceBlitzRunState(s, false)
    expect(s.streak).toBe(0)
    expect(s.misses).toBe(1)
    expect(s.round).toBe(3)
  })

  it('a janela de erros recentes decai aos poucos, não some num acerto de sorte', () => {
    let s = advanceBlitzRunState(advanceBlitzRunState(INITIAL_BLITZ_RUN_STATE, false), false)
    expect(getBlitzPressure(s)).toBe('recuperando')

    s = advanceBlitzRunState(s, true)
    expect(getBlitzPressure(s)).toBe('recuperando')

    s = advanceBlitzRunState(s, true)
    expect(getBlitzPressure(s)).toBe('estavel')
  })
})
