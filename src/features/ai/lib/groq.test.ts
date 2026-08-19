import { describe, expect, it } from 'vitest'
import { parseRetryDelayMs } from './groq'

describe('parseRetryDelayMs', () => {
  it('lê os segundos que a própria mensagem da Groq sugere', () => {
    expect(parseRetryDelayMs('Rate limit reached. Please try again in 1.155s.', null)).toBe(1155)
  })

  it('entende a sugestão em milissegundos', () => {
    expect(parseRetryDelayMs('Please try again in 480ms.', null)).toBe(480)
  })

  it('prefere o cabeçalho retry-after quando ele vem', () => {
    expect(parseRetryDelayMs('Please try again in 1s.', '7')).toBe(7000)
  })

  it('devolve null quando não há dica nenhuma', () => {
    expect(parseRetryDelayMs('Something went wrong', null)).toBeNull()
  })

  it('ignora cabeçalho inválido e cai na mensagem', () => {
    expect(parseRetryDelayMs('Please try again in 2s.', 'abc')).toBe(2000)
  })
})
