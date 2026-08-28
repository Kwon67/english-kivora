import { describe, expect, it } from 'vitest'
import { normalizePackLevel } from '@/features/cefr/lib/cefrLevels'
import { BLITZ_PACK_POOL_SIZE, selectBlitzPackPool } from './blitzPackPool'

type Pack = { id: string; level: string | null }

function catalogo(porNivel: Record<string, number>): Pack[] {
  return Object.entries(porNivel).flatMap(([level, quantidade]) =>
    Array.from({ length: quantidade }, (_, i) => ({ id: `${level}-${i}`, level }))
  )
}

/** Sorteio determinístico para o teste não depender de Math.random. */
function randomFixo(valor = 0) {
  return () => valor
}

const readLevel = (pack: Pack) => pack.level

describe('selectBlitzPackPool', () => {
  const grande = catalogo({ A1: 20, A2: 20, B1: 20, B2: 20, C1: 10 })

  it('nunca inclui pack acima do teto do aluno', () => {
    const pool = selectBlitzPackPool(grande, {
      readLevel,
      userLevel: 'A2',
      random: randomFixo(),
    })
    for (const pack of pool) {
      expect(['A1', 'A2']).toContain(normalizePackLevel(pack.level))
    }
  })

  it('C1/C2 ficam de fora de um aluno B1 (normalizados para B2)', () => {
    const pool = selectBlitzPackPool(grande, { readLevel, userLevel: 'B1', random: randomFixo() })
    expect(pool.some((p) => p.level === 'C1')).toBe(false)
  })

  it('respeita o tamanho do pool', () => {
    const pool = selectBlitzPackPool(grande, { readLevel, userLevel: 'B2', random: randomFixo() })
    expect(pool).toHaveLength(BLITZ_PACK_POOL_SIZE)
  })

  it('concentra no nível do aluno, sem ignorar os de baixo', () => {
    const pool = selectBlitzPackPool(grande, {
      readLevel,
      userLevel: 'B1',
      poolSize: 8,
      random: randomFixo(),
    })
    const contagem = pool.reduce<Record<string, number>>((acc, p) => {
      const l = normalizePackLevel(p.level)
      acc[l] = (acc[l] || 0) + 1
      return acc
    }, {})
    // Curva de decaimento: B1 leva a maior fatia, A1/A2 aparecem em dose menor.
    expect(contagem.B1).toBeGreaterThan(contagem.A2 ?? 0)
    expect(contagem.A2 ?? 0).toBeGreaterThanOrEqual(contagem.A1 ?? 0)
    expect(contagem.B1).toBeLessThan(8)
  })

  it('não devolve pack repetido', () => {
    const pool = selectBlitzPackPool(grande, { readLevel, userLevel: 'B2', random: randomFixo() })
    expect(new Set(pool.map((p) => p.id)).size).toBe(pool.length)
  })

  it('preenche a sobra quando um nível tem menos packs que a cota', () => {
    // A1 com um único pack: a cota dele sobra e deve ir para o nível do aluno.
    const escasso = catalogo({ A1: 1, B1: 30 })
    const pool = selectBlitzPackPool(escasso, {
      readLevel,
      userLevel: 'B1',
      poolSize: 10,
      random: randomFixo(),
    })
    expect(pool).toHaveLength(10)
  })

  it('devolve o que existe quando o catálogo é menor que o pool', () => {
    const pool = selectBlitzPackPool(catalogo({ A1: 3 }), {
      readLevel,
      userLevel: 'A1',
      poolSize: 12,
      random: randomFixo(),
    })
    expect(pool).toHaveLength(3)
  })

  it('devolve vazio quando nada no catálogo cabe no nível', () => {
    const pool = selectBlitzPackPool(catalogo({ B2: 10 }), {
      readLevel,
      userLevel: 'A1',
      random: randomFixo(),
    })
    expect(pool).toEqual([])
  })

  it('varia entre partidas — é isso que faz o catálogo aparecer', () => {
    // Dois sorteios diferentes sobre o mesmo catálogo não devem dar o mesmo conjunto.
    const a = selectBlitzPackPool(grande, { readLevel, userLevel: 'B2', random: randomFixo(0) })
    const b = selectBlitzPackPool(grande, { readLevel, userLevel: 'B2', random: randomFixo(0.99) })
    expect(a.map((p) => p.id).join()).not.toBe(b.map((p) => p.id).join())
  })

  it('aluno ainda em avaliação recebe até o teto A2, não o catálogo inteiro', () => {
    const pool = selectBlitzPackPool(grande, { readLevel, userLevel: null, random: randomFixo() })
    for (const pack of pool) {
      expect(['A1', 'A2']).toContain(normalizePackLevel(pack.level))
    }
  })

  it('poolSize zero não quebra', () => {
    expect(selectBlitzPackPool(grande, { readLevel, userLevel: 'B1', poolSize: 0 })).toEqual([])
  })
})
