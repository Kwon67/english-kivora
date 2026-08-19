import { describe, expect, it } from 'vitest'
import {
  LOW_MATERIAL_DAYS,
  getNewMaterialStatus,
  type NewMaterialInput,
} from '@/features/review/lib/newMaterialStatus'

const base: NewMaterialInput = { unseenInRoutine: 100, dailyNewLimit: 10, catalogPacksAvailable: 4 }

describe('quando avisar', () => {
  it('fica quieto enquanto há material de sobra', () => {
    const s = getNewMaterialStatus(base)
    expect(s.level).toBe('ok')
    expect(s.suggestion).toBeNull()
  })

  it('avisa a partir do limite, com dias ainda de sobra para agir', () => {
    const s = getNewMaterialStatus({ ...base, unseenInRoutine: LOW_MATERIAL_DAYS * 10 })
    expect(s.level).toBe('acabando')
    expect(s.daysLeft).toBe(LOW_MATERIAL_DAYS)
  })

  it('reconhece quando não sobrou nada', () => {
    const s = getNewMaterialStatus({ ...base, unseenInRoutine: 0 })
    expect(s.level).toBe('vazio')
    expect(s.daysLeft).toBe(0)
  })

  it('conta os dias pelo teto diário, não pelo total bruto', () => {
    expect(getNewMaterialStatus({ ...base, unseenInRoutine: 26, dailyNewLimit: 10 }).daysLeft).toBe(3)
    expect(getNewMaterialStatus({ ...base, unseenInRoutine: 26, dailyNewLimit: 5 }).daysLeft).toBe(6)
  })
})

describe('o que sugerir', () => {
  it('manda adicionar pack do catálogo antes de gerar com IA', () => {
    // Conteúdo curado que já existe não custa nada e já foi revisado. Gerar é o caminho de quem
    // realmente esgotou o catálogo — no baralho real havia 4 packs e 40 cards parados.
    const s = getNewMaterialStatus({ unseenInRoutine: 5, dailyNewLimit: 10, catalogPacksAvailable: 4 })
    expect(s.suggestion).toBe('adicionar-pack')
  })

  it('só oferece gerar quando o catálogo acabou', () => {
    const s = getNewMaterialStatus({ unseenInRoutine: 5, dailyNewLimit: 10, catalogPacksAvailable: 0 })
    expect(s.suggestion).toBe('gerar')
  })

  it('sugere gerar também quando já está vazio e não há catálogo', () => {
    const s = getNewMaterialStatus({ unseenInRoutine: 0, dailyNewLimit: 10, catalogPacksAvailable: 0 })
    expect(s.level).toBe('vazio')
    expect(s.suggestion).toBe('gerar')
  })

  it('não sugere nada enquanto está tudo bem, mesmo com catálogo disponível', () => {
    expect(getNewMaterialStatus(base).suggestion).toBeNull()
  })
})

describe('entradas degeneradas', () => {
  it('não divide por zero se o teto diário vier zerado', () => {
    const s = getNewMaterialStatus({ unseenInRoutine: 20, dailyNewLimit: 0, catalogPacksAvailable: 0 })
    expect(Number.isFinite(s.daysLeft)).toBe(true)
  })

  it('trata número negativo como zero', () => {
    const s = getNewMaterialStatus({ unseenInRoutine: -5, dailyNewLimit: 10, catalogPacksAvailable: -2 })
    expect(s.level).toBe('vazio')
    expect(s.catalogPacksAvailable).toBe(0)
  })
})
