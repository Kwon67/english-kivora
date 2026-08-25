import { describe, expect, it } from 'vitest'
import {
  BLITZ_LEVEL_WHILE_ASSESSING,
  blitzLevelCeiling,
  blitzLevelsInScope,
  filterToLevelScope,
  isPackLevelInScope,
  planBlitzAiLevels,
} from '@/features/blitz/lib/blitzLevelScope'

describe('o nível do usuário é teto, não alvo', () => {
  it('quem está no B1 joga com A1, A2 e B1', () => {
    expect(blitzLevelsInScope('B1')).toEqual(['A1', 'A2', 'B1'])
  })

  it('barra o que passa do teto', () => {
    expect(isPackLevelInScope('B2', 'B1')).toBe(false)
    expect(isPackLevelInScope('B1', 'A2')).toBe(false)
  })

  it('libera o que está abaixo e o próprio nível', () => {
    expect(isPackLevelInScope('A1', 'B1')).toBe(true)
    expect(isPackLevelInScope('B1', 'B1')).toBe(true)
  })

  it('quem está no A1 só vê A1', () => {
    expect(blitzLevelsInScope('A1')).toEqual(['A1'])
  })

  it('quem está no B2 vê a escala inteira', () => {
    expect(blitzLevelsInScope('B2')).toEqual(['A1', 'A2', 'B1', 'B2'])
  })
})

describe('nível do pack cru vindo do banco', () => {
  it('trata o rótulo legado como o CEFR equivalente', () => {
    expect(isPackLevelInScope('advanced', 'B1')).toBe(false)
    expect(isPackLevelInScope('beginner', 'B1')).toBe(true)
  })

  it('pack sem nível cai no padrão A2 em vez de ser barrado ou liberado por acidente', () => {
    expect(isPackLevelInScope(null, 'A2')).toBe(true)
    expect(isPackLevelInScope(null, 'A1')).toBe(false)
  })

  it('C1 e C2 contam como B2, o topo da escala do produto', () => {
    expect(isPackLevelInScope('C1', 'B2')).toBe(true)
    expect(isPackLevelInScope('C1', 'B1')).toBe(false)
  })
})

describe('nível ainda em avaliação', () => {
  it('usa o teto de avaliação em vez de liberar tudo', () => {
    expect(blitzLevelCeiling(null)).toBe(BLITZ_LEVEL_WHILE_ASSESSING)
    expect(isPackLevelInScope('B2', null)).toBe(false)
    expect(isPackLevelInScope('A2', null)).toBe(true)
  })
})

describe('filtro das fontes do Blitz', () => {
  it('deixa passar só os itens dentro da faixa, na ordem original', () => {
    const itens = [
      { id: '1', packs: { level: 'A1' } },
      { id: '2', packs: { level: 'B2' } },
      { id: '3', packs: { level: 'B1' } },
      { id: '4', packs: null },
    ]

    expect(
      filterToLevelScope(itens, (item) => item.packs?.level, 'B1').map((item) => item.id)
    ).toEqual(['1', '3', '4'])
  })

  it('devolve vazio quando nada cabe, sem afrouxar o teto', () => {
    const itens = [{ id: '1', level: 'B2' }, { id: '2', level: 'B1' }]
    expect(filterToLevelScope(itens, (item) => item.level, 'A1')).toEqual([])
  })
})

describe('distribuição de níveis da geração por IA', () => {
  it('entrega exatamente a quantidade pedida', () => {
    for (const total of [8, 16, 32, 40]) {
      const plano = planBlitzAiLevels(total, 'B1')
      expect(plano.reduce((soma, item) => soma + item.count, 0)).toBe(total)
    }
  })

  it('não sai da faixa do usuário', () => {
    expect(planBlitzAiLevels(32, 'B1').map((item) => item.level)).toEqual(['B1', 'A2', 'A1'])
  })

  it('concentra no nível do usuário e decai para baixo', () => {
    const counts = planBlitzAiLevels(32, 'B1').map((item) => item.count)

    expect(counts).toEqual([...counts].sort((a, b) => b - a))
    expect(counts[0]).toBeGreaterThan(counts[1])
  })

  it('quem está no A1 recebe a partida inteira em A1', () => {
    expect(planBlitzAiLevels(20, 'A1')).toEqual([{ level: 'A1', count: 20 }])
  })

  it('sem nível avaliado, não passa do teto de avaliação', () => {
    expect(planBlitzAiLevels(12, null).map((item) => item.level)).toEqual(['A2', 'A1'])
  })

  it('não devolve nível com zero frase quando a partida é curta', () => {
    const plano = planBlitzAiLevels(3, 'B2')
    expect(plano.every((item) => item.count > 0)).toBe(true)
    expect(plano.reduce((soma, item) => soma + item.count, 0)).toBe(3)
  })

  it('devolve vazio para contagem zero, em vez de um plano com níveis vazios', () => {
    expect(planBlitzAiLevels(0, 'B1')).toEqual([])
  })
})
