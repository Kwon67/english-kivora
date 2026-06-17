#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs'
import { Resend } from 'resend'

function loadEnvFile(path) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const index = trimmed.indexOf('=')
    if (index === -1) continue
    const key = trimmed.slice(0, index).trim()
    let value = trimmed.slice(index + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (!process.env[key]) process.env[key] = value
  }
}

loadEnvFile('.env')
loadEnvFile('.env.local')

const apiKey = process.env.RESEND_API_KEY?.trim()
const sandbox = process.env.RESEND_SANDBOX_MODE?.trim() === 'true'
const sandboxTo = process.env.RESEND_SANDBOX_TO?.trim()
const domain = process.env.KIVORA_EMAIL_DOMAIN?.trim()
const fromLocal = process.env.KIVORA_EMAIL_FROM_LOCAL_PART?.trim() || 'noreply'
const fromName = process.env.KIVORA_EMAIL_FROM_NAME?.trim() || 'Kivora English'
const from =
  process.env.RESEND_FROM?.trim() ||
  (domain ? `${fromName} <${fromLocal}@${domain}>` : '')

if (!apiKey) {
  console.error('RESEND_API_KEY ausente')
  process.exit(1)
}

const resend = new Resend(apiKey)
const effectiveFrom = sandbox ? 'Kivora English <onboarding@resend.dev>' : from
const effectiveTo = sandbox ? sandboxTo : process.argv[2] || sandboxTo

if (!effectiveFrom) {
  console.error('Configure RESEND_SANDBOX_MODE=true para testes, ou KIVORA_EMAIL_DOMAIN para produção.')
  process.exit(1)
}

console.log('modo:', sandbox ? 'sandbox (testes)' : 'produção')
if (domain) console.log('domínio configurado:', domain)

if (!effectiveTo) {
  console.error('Informe um destino: node scripts/diagnose-resend.mjs email@exemplo.com')
  process.exit(1)
}

console.log('from:', effectiveFrom)
console.log('to:', effectiveTo)
console.log('sandbox:', sandbox)

const result = await resend.emails.send({
  from: effectiveFrom,
  to: effectiveTo,
  subject: 'Diagnóstico Kivora Resend',
  html: '<p>Se você recebeu este email, o Resend está configurado corretamente.</p>',
})

if (result.error) {
  console.error('ERRO:', result.error.message)
  process.exit(1)
}

console.log('OK: email enviado com id', result.data.id)