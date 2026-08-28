import { describe, expect, it } from 'vitest'
import {
  getLevelGate,
  getLevelPriority,
  getPackLockReason,
  isPackLevelAllowed,
  STRETCH_MIN_CONFIDENCE,
  STRETCH_MIN_PROGRESS,
} from './levelGate'

const settled = {
  level: 'B1' as const,
  confidence: 90,
  progressToNext: 20,
  nextLevel: 'B2' as const,
}

describe('getLevelGate', () => {
  it('libera do A1 até o nível atual', () => {
    expect(getLevelGate(settled).allowed).toEqual(['A1', 'A2', 'B1'])
  })

  it('trata aluno ainda sem nível como A1', () => {
    const gate = getLevelGate({ level: null, confidence: 0, progressToNext: 0, nextLevel: 'A1' })
    expect(gate.allowed).toEqual(['A1'])
    expect(gate.current).toBe('A1')
  })

  it('não estica sem nível estimado, mesmo com números altos', () => {
    // Um aluno em avaliação pode acumular confiança sobre nada; o desafio exige
    // que o estimador já tenha nomeado um nível.
    const gate = getLevelGate({
      level: null,
      confidence: 100,
      progressToNext: 100,
      nextLevel: 'A1',
    })
    expect(gate.stretch).toBeNull()
  })

  it('abre o próximo nível quando confiança e progresso batem o mínimo', () => {
    const gate = getLevelGate({
      ...settled,
      confidence: STRETCH_MIN_CONFIDENCE,
      progressToNext: STRETCH_MIN_PROGRESS,
    })
    expect(gate.stretch).toBe('B2')
    expect(gate.allowed).toEqual(['A1', 'A2', 'B1', 'B2'])
  })

  it('não abre o próximo nível com progresso alto e confiança baixa', () => {
    const gate = getLevelGate({
      ...settled,
      confidence: STRETCH_MIN_CONFIDENCE - 1,
      progressToNext: 100,
    })
    expect(gate.stretch).toBeNull()
  })

  it('não abre o próximo nível com confiança alta e progresso baixo', () => {
    const gate = getLevelGate({
      ...settled,
      confidence: 100,
      progressToNext: STRETCH_MIN_PROGRESS - 1,
    })
    expect(gate.stretch).toBeNull()
  })

  it('no teto B2 não existe nível para esticar', () => {
    const gate = getLevelGate({
      level: 'B2',
      confidence: 100,
      progressToNext: 100,
      nextLevel: null,
    })
    expect(gate.stretch).toBeNull()
    expect(gate.allowed).toEqual(['A1', 'A2', 'B1', 'B2'])
  })
})

describe('isPackLevelAllowed', () => {
  const gate = getLevelGate(settled)

  it('aceita nível abaixo e no nível', () => {
    expect(isPackLevelAllowed('A1', gate)).toBe(true)
    expect(isPackLevelAllowed('B1', gate)).toBe(true)
  })

  it('recusa o caso que motivou a mudança: A2 recebendo C2', () => {
    const a2 = getLevelGate({ level: 'A2', confidence: 50, progressToNext: 10, nextLevel: 'B1' })
    // normalizePackLevel rebaixa C1/C2 para B2, que segue acima de A2.
    expect(isPackLevelAllowed('C2', a2)).toBe(false)
  })

  it('trata nível desconhecido como A2, o padrão do catálogo', () => {
    const a1 = getLevelGate({ level: 'A1', confidence: 80, progressToNext: 10, nextLevel: 'A2' })
    expect(isPackLevelAllowed(null, a1)).toBe(false)
    expect(isPackLevelAllowed(null, gate)).toBe(true)
  })
})

describe('getPackLockReason', () => {
  const gate = getLevelGate(settled)

  it('não trava o que está liberado', () => {
    expect(getPackLockReason('A2', gate)).toBeNull()
  })

  it('promete o próximo nível quando falta só um degrau', () => {
    expect(getPackLockReason('B2', gate)).toContain('Falta pouco')
  })

  it('nomeia o nível exigido quando está longe', () => {
    const a1 = getLevelGate({ level: 'A1', confidence: 40, progressToNext: 0, nextLevel: 'A2' })
    expect(getPackLockReason('B2', a1)).toContain('a partir do B2')
  })
})

describe('getLevelPriority', () => {
  it('põe o nível atual antes da consolidação e o desafio por último', () => {
    const gate = getLevelGate({
      ...settled,
      confidence: 100,
      progressToNext: 100,
    })
    expect(getLevelPriority(gate)).toEqual(['B1', 'A2', 'A1', 'B2'])
  })

  it('no A1 a prioridade é só o próprio nível', () => {
    const gate = getLevelGate({ level: 'A1', confidence: 10, progressToNext: 0, nextLevel: 'A2' })
    expect(getLevelPriority(gate)).toEqual(['A1'])
  })
})
