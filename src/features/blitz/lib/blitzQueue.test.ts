import { describe, expect, it } from 'vitest'
import { reinsertHead, rotateQueue } from '@/features/blitz/lib/blitzQueue'

const baralho = (n: number) => Array.from({ length: n }, (_, i) => i)

/** Joga `rodadas` rodadas e devolve os cards vistos, na ordem. */
function jogar(tamanho: number, rodadas: number, passo: (len: number) => number) {
  let fila = baralho(tamanho)
  const vistos: number[] = []

  for (let r = 0; r < rodadas; r += 1) {
    vistos.push(fila[0])
    fila = reinsertHead(fila, passo(fila.length))
  }

  return vistos
}

describe('nenhuma frase fica de fora nem entra em looping', () => {
  // O bug relatado: baralhos de 6, 9 e 12 cards mostravam exatamente TRÊS frases, para sempre.
  const tamanhos = [4, 5, 6, 8, 9, 12, 20, 40]

  it.each(tamanhos)('baralho de %i mostra todas as frases antes de repetir qualquer uma', (n) => {
    const vistos = jogar(n, n, (len) => len - 1)
    expect(new Set(vistos).size).toBe(n)
  })

  it.each(tamanhos)('baralho de %i não cicla num subconjunto ao longo de muitas rodadas', (n) => {
    const vistos = jogar(n, n * 5, (len) => len - 1)
    expect(new Set(vistos).size).toBe(n)
  })

  it('o passo antigo de teto(len/3) prendia um baralho de 12 em três frases', () => {
    // Guarda de regressão: reproduz a operação antiga para o problema ficar registrado.
    let fila = baralho(12)
    const vistos: number[] = []
    for (let r = 0; r < 30; r += 1) {
      vistos.push(fila[0])
      fila = rotateQueue(fila, Math.ceil(fila.length / 3))
    }
    expect(new Set(vistos).size).toBe(3)

    // A operação nova, no mesmo baralho, mostra as doze.
    expect(new Set(jogar(12, 30, (len) => len - 1)).size).toBe(12)
  })
})

describe('a distância de reinserção significa o que diz', () => {
  it('distância N faz exatamente N outras frases tocarem antes de o card voltar', () => {
    for (const distancia of [3, 6]) {
      const vistos = jogar(20, distancia + 2, () => distancia)

      expect(vistos[0]).toBe(0)
      // as N frases do meio são outras, sem repetição
      expect(vistos.slice(1, distancia + 1)).toEqual(
        Array.from({ length: distancia }, (_, i) => i + 1)
      )
      // e só então o card errado reaparece
      expect(vistos[distancia + 1]).toBe(0)
    }
  })

  it('mandar para o fim faz o card voltar só depois de todos os outros', () => {
    const vistos = jogar(8, 9, (len) => len - 1)
    expect(vistos).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 0])
  })
})

describe('casos de borda', () => {
  it('fila de um card não quebra nem se perde', () => {
    expect(reinsertHead([7], 3)).toEqual([7])
  })

  it('fila vazia continua vazia', () => {
    expect(reinsertHead([], 3)).toEqual([])
    expect(rotateQueue([], 3)).toEqual([])
  })

  it('distância maior que a fila cai no fim, sem estourar', () => {
    expect(reinsertHead([0, 1, 2], 99)).toEqual([1, 2, 0])
  })

  it('distância zero ou negativa ainda avança: nunca serve o mesmo card duas vezes seguidas', () => {
    expect(reinsertHead([0, 1, 2], 0)[0]).toBe(1)
    expect(reinsertHead([0, 1, 2], -5)[0]).toBe(1)
  })

  it('nunca perde nem duplica card', () => {
    let fila = baralho(13)
    for (let r = 0; r < 50; r += 1) {
      fila = reinsertHead(fila, (r % 7) + 1)
      expect(fila).toHaveLength(13)
      expect(new Set(fila).size).toBe(13)
    }
  })
})

describe('rotateQueue segue válido para rodadas que consomem vários cards', () => {
  it('combinação consome quatro e manda os quatro para o fim', () => {
    expect(rotateQueue([0, 1, 2, 3, 4, 5], 4)).toEqual([4, 5, 0, 1, 2, 3])
  })
})
