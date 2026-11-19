import { createElement } from 'react'
import { afterEach, expect, it, vi } from 'vitest'
import { sendResendEmail } from './resendMail'

const send = vi.hoisted(() => vi.fn())
vi.mock('./resend', () => ({ getResend: () => ({ emails: { send } }) }))
afterEach(() => { vi.unstubAllEnvs(); send.mockReset() })
it('reusa a chave do relatório e comunica a falha do provedor sem envio externo', async () => {
  vi.stubEnv('RESEND_API_KEY', 'local-test')
  vi.stubEnv('RESEND_SANDBOX_MODE', 'true')
  vi.stubEnv('RESEND_SANDBOX_TO', 'sandbox@example.test')
  const mail = { to: 'student@example.test', subject: 'Resumo', react: createElement('p', null, 'Teste'), idempotencyKey: 'weekly-report/test/2026-11-19' }
  send.mockResolvedValueOnce({ error: { message: 'Indisponível' } }).mockResolvedValueOnce({ data: { id: 'test' } })
  await expect(sendResendEmail(mail)).rejects.toThrow('Indisponível')
  await expect(sendResendEmail(mail)).resolves.toMatchObject({ id: 'test', sandbox: true })
  for (const [payload, options] of send.mock.calls) {
    expect(payload.to).toEqual(['sandbox@example.test'])
    expect(options).toEqual({ idempotencyKey: mail.idempotencyKey })
  }
})
