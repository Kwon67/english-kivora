import type { ReactElement } from 'react'
import { getResend } from '@/lib/resend'

type ResendSendInput = {
  to: string | string[]
  subject: string
  react: ReactElement
}

type ResendSendResult = {
  id: string
  sandbox: boolean
  deliveredTo: string | string[]
  requestedTo: string | string[]
}

const INVALID_FROM_DOMAINS = ['outlook.com', 'hotmail.com', 'live.com', 'gmail.com', 'yahoo.com']
const DEFAULT_FROM_NAME = 'Kivora English'
const DEFAULT_FROM_LOCAL_PART = 'noreply'

function parseFromAddress(from: string) {
  const match = from.match(/<([^>]+)>/)
  return (match?.[1] || from).trim().toLowerCase()
}

export function isResendSandboxMode() {
  return process.env.RESEND_SANDBOX_MODE?.trim() === 'true'
}

export function getConfiguredEmailDomain() {
  return process.env.KIVORA_EMAIL_DOMAIN?.trim().toLowerCase().replace(/^\.+|\.+$/g, '') || null
}

function buildFromAddressFromDomain() {
  const domain = getConfiguredEmailDomain()
  if (!domain) return null

  const localPart = process.env.KIVORA_EMAIL_FROM_LOCAL_PART?.trim() || DEFAULT_FROM_LOCAL_PART
  const fromName = process.env.KIVORA_EMAIL_FROM_NAME?.trim() || DEFAULT_FROM_NAME
  return `${fromName} <${localPart}@${domain}>`
}

export function getResendFromAddress() {
  if (isResendSandboxMode()) {
    return `${DEFAULT_FROM_NAME} <onboarding@resend.dev>`
  }

  const configured = process.env.RESEND_FROM?.trim() || buildFromAddressFromDomain()
  if (!configured) {
    throw new Error(
      'Email de produção não configurado. Defina KIVORA_EMAIL_DOMAIN (recomendado) ou RESEND_FROM com domínio verificado no Resend.'
    )
  }

  const email = parseFromAddress(configured)
  const domain = email.split('@')[1] || ''

  if (INVALID_FROM_DOMAINS.includes(domain)) {
    throw new Error(
      `O remetente "${email}" não pode ser usado no Resend. Verifique um domínio próprio em https://resend.com/domains e atualize RESEND_FROM.`
    )
  }

  return configured
}

export function resolveResendRecipient(to: string | string[]) {
  const recipients = Array.isArray(to) ? to : [to]

  if (!isResendSandboxMode()) {
    return { to: recipients, requestedTo: recipients, sandbox: false }
  }

  const sandboxTo = process.env.RESEND_SANDBOX_TO?.trim().toLowerCase()
  if (!sandboxTo) {
    throw new Error(
      'RESEND_SANDBOX_MODE está ativo, mas RESEND_SANDBOX_TO não foi definido. Use o email da conta Resend para testes.'
    )
  }

  return {
    to: [sandboxTo],
    requestedTo: recipients,
    sandbox: true,
  }
}

export function formatResendErrorForUser(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)

  if (/domain is not verified|verify a domain|verify your domain/i.test(message)) {
    return 'O envio de email ainda não está configurado: verifique um domínio no Resend e atualize RESEND_FROM no servidor.'
  }

  if (/RESEND_FROM não configurado|não pode ser usado no Resend/i.test(message)) {
    return 'O remetente de email do servidor está incorreto. Configure RESEND_FROM com um domínio verificado no Resend.'
  }

  if (/RESEND_SANDBOX_TO não foi definido/i.test(message)) {
    return 'Modo de testes do Resend ativo sem destino configurado. Defina RESEND_SANDBOX_TO no servidor.'
  }

  if (/only send testing emails to your own email address/i.test(message)) {
    return 'No modo de testes do Resend, use o mesmo email da conta Resend para receber o código.'
  }

  if (/RESEND_API_KEY ausente/i.test(message)) {
    return 'O serviço de email não está configurado no servidor (RESEND_API_KEY ausente).'
  }

  if (process.env.NODE_ENV !== 'production') {
    return `Não foi possível enviar o código: ${message}`
  }

  return 'Não foi possível enviar o código de verificação. Tente novamente em instantes.'
}

export async function sendResendEmail(input: ResendSendInput): Promise<ResendSendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('RESEND_API_KEY ausente')
  }

  const from = getResendFromAddress()
  const delivery = resolveResendRecipient(input.to)

  const result = await getResend().emails.send({
    from,
    to: delivery.to,
    subject: input.subject,
    react: input.react,
  })

  if (result.error) {
    throw new Error(result.error.message)
  }

  if (!result.data?.id) {
    throw new Error('Resend não retornou ID do email enviado.')
  }

  return {
    id: result.data.id,
    sandbox: delivery.sandbox,
    deliveredTo: delivery.to,
    requestedTo: delivery.requestedTo,
  }
}