import { describe, expect, it } from 'vitest'
import {
  filtrarPacks,
  listarCategorias,
  normalizeBusca,
  packAtendeBusca,
  type FiltravelPack,
} from './packFiltering'

const pack = (over: Partial<FiltravelPack> = {}): FiltravelPack => ({
  id: 'x',
  name: 'Entrevista de emprego',
  description: 'Falar da sua experiência e dos seus pontos fracos.',
  level: 'B2',
  category: 'Negócios',
  ...over,
})

describe('normalizeBusca', () => {
  it('remove acento e caixa', () => {
    expect(normalizeBusca('  NEGÓCIOS  ')).toBe('negocios')
  })

  it('colapsa espaço interno', () => {
    expect(normalizeBusca('a    b')).toBe('a b')
  })
})

describe('packAtendeBusca', () => {
  it('acha por nome sem o acento digitado', () => {
    expect(packAtendeBusca(pack(), 'negocios')).toBe(true)
  })

  it('acha por palavra da descrição', () => {
    expect(packAtendeBusca(pack(), 'pontos fracos')).toBe(true)
  })

  /** O caso que motivou a busca por termos independentes. */
  it('combina termos que vivem em colunas diferentes', () => {
    expect(packAtendeBusca(pack(), 'entrevista b2')).toBe(true)
  })

  it('exige TODOS os termos, não qualquer um', () => {
    expect(packAtendeBusca(pack(), 'entrevista viagem')).toBe(false)
  })

  it('busca vazia deixa tudo passar', () => {
    expect(packAtendeBusca(pack(), '   ')).toBe(true)
  })

  it('não estoura com descrição nula', () => {
    expect(packAtendeBusca(pack({ description: null, category: null, level: null }), 'entrevista')).toBe(true)
  })
})

describe('filtrarPacks', () => {
  const catalogo = [
    pack({ id: '1', name: 'No aeroporto', category: 'Viagem', level: 'A2', description: 'Check-in e bagagem.' }),
    pack({ id: '2', name: 'Reunião de equipe', category: 'Negócios', level: 'B1', description: 'Entrar na conversa.' }),
    pack({ id: '3', name: 'Phrasal verbs', category: 'Gramática', level: 'B1', description: 'Os mais comuns.' }),
    pack({ id: '4', name: 'Sem tema', category: null, level: 'A1', description: null }),
  ]

  it('sem filtro devolve tudo', () => {
    expect(filtrarPacks(catalogo)).toHaveLength(4)
  })

  it('filtra por categoria', () => {
    expect(filtrarPacks(catalogo, { category: 'Viagem' }).map((p) => p.id)).toEqual(['1'])
  })

  it('trata categoria ausente como Geral', () => {
    expect(filtrarPacks(catalogo, { category: 'Geral' }).map((p) => p.id)).toEqual(['4'])
  })

  it('combina categoria e busca', () => {
    expect(filtrarPacks(catalogo, { category: 'Negócios', query: 'reunião' }).map((p) => p.id)).toEqual(['2'])
  })

  it('devolve vazio quando nada casa, sem estourar', () => {
    expect(filtrarPacks(catalogo, { query: 'jabuticaba' })).toEqual([])
  })
})

describe('listarCategorias', () => {
  it('conta e ordena da maior para a menor', () => {
    const cats = listarCategorias([
      pack({ category: 'Viagem' }),
      pack({ category: 'Negócios' }),
      pack({ category: 'Negócios' }),
    ])
    expect(cats).toEqual([
      { name: 'Negócios', count: 2 },
      { name: 'Viagem', count: 1 },
    ])
  })

  it('agrupa os sem categoria em Geral', () => {
    expect(listarCategorias([pack({ category: null }), pack({ category: null })])).toEqual([
      { name: 'Geral', count: 2 },
    ])
  })

  it('catálogo vazio devolve lista vazia', () => {
    expect(listarCategorias([])).toEqual([])
  })
})
