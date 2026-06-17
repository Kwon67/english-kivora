import { createElement } from 'react'
import SignupVerification from '@/emails/SignupVerification'
import { getResend } from '@/lib/resend'
import { SIGNUP_CODE_TTL_MINUTES } from '@/features/auth/lib/signupVerification'

function getAppUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://english-kivora.vercel.app'
}

function getFromAddress() {
  return process.env.RESEND_FROM?.trim() || 'Kivora English <kivora.dev@outlook.com>'
}

export async function sendSignupVerificationEmail(input: {
  email: string
  username: string
  code: string
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim()
  if (!apiKey) {
    throw new Error('RESEND_API_KEY ausente')
  }

  const appUrl = getAppUrl()
  const result = await getResend().emails.send({
    from: getFromAddress(),
    to: input.email,
    subject: `${input.code} é seu código Kivora English`,
    react: createElement(SignupVerification, {
      username: input.username,
      code: input.code,
      appUrl,
      expiresMinutes: SIGNUP_CODE_TTL_MINUTES,
    }),
  })

  if (result.error) {
    throw new Error(result.error.message)
  }

  return result.data
}