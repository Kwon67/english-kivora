import { beforeEach, describe, expect, it, vi } from 'vitest'
import HistoryError from './error'

const transition = vi.hoisted(() => ({
  pending: false,
  start: vi.fn((action: () => void) => action()),
}))

vi.mock('react', async (importOriginal) => ({
  ...await importOriginal<typeof import('react')>(),
  useTransition: () => [transition.pending, transition.start],
}))

describe('Histórico: recuperação de erro', () => {
  beforeEach(() => {
    transition.pending = false
    transition.start.mockClear()
  })

  it('usa o retry que recarrega os dados do Next em vez de apenas limpar o erro', () => {
    const retry = vi.fn()
    const reset = vi.fn()
    const nextErrorBoundary = { retry, reset }

    const fallback = HistoryError(nextErrorBoundary)
    fallback.props.reset()

    expect(retry).toHaveBeenCalledOnce()
    expect(reset).not.toHaveBeenCalled()
  })

  it('ignora outra ativação durante o carregamento e permite tentar após nova falha', () => {
    const retry = vi.fn()
    transition.pending = true

    const pending = HistoryError({ retry })
    pending.props.reset()

    expect(pending.props.retryPending).toBe(true)
    expect(transition.start).not.toHaveBeenCalled()
    expect(retry).not.toHaveBeenCalled()

    transition.pending = false
    const failedAgain = HistoryError({ retry })
    failedAgain.props.reset()

    expect(failedAgain.props.retryPending).toBe(false)
    expect(retry).toHaveBeenCalledOnce()
  })
})
