import { describe, expect, it } from 'vitest'
import { readMfaState } from './readMfaState'

describe('verificação de fatores', () => {
  it('distingue uma consulta concluída sem fatores de uma consulta indisponível', async () => {
    expect(await readMfaState(async () => ({ data: { all: [] }, error: null }))).toEqual({ status: 'clear' })
    expect(await readMfaState(async () => ({ data: null, error: { status: 503 } }))).toEqual({ status: 'unavailable' })
    expect(await readMfaState(async () => { throw new Error('offline') })).toEqual({ status: 'unavailable' })
  })
  it('mantém o acesso pendente se o provedor não responde a tempo', async () => {
    expect(await readMfaState(() => new Promise(() => {}), 5)).toEqual({ status: 'unavailable' })
  })
  it('distingue sessão ausente, fator pendente e fator verificado', async () => {
    expect(await readMfaState(async () => ({ data: null, error: { name: 'AuthSessionMissingError' } }))).toEqual({ status: 'signed-out' })
    expect(await readMfaState(async () => ({ data: { all: [{ id: 'a', status: 'unverified' }, { id: 'b', status: 'verified' }] }, error: null }))).toEqual({ status: 'required', factorId: 'b' })
  })
})
