import { createElement } from 'react'
import SignupVerification from '@/emails/SignupVerification'
import { sendResendEmail } from '@/lib/resendMail'
import { SIGNUP_CODE_TTL_MINUTES } from '@/features/auth/lib/signupVerification'

function getAppUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://english-kivora.vercel.app'
}

export async function sendSignupVerificationEmail(input: {
  email: string
  username: string
  code: string
}) {
  const appUrl = getAppUrl()
  const subjectPrefix = process.env.RESEND_SANDBOX_MODE === 'true' ? '[TESTE] ' : ''

  return sendResendEmail({
    to: input.email,
    subject: `${subjectPrefix}${input.code} é seu código Kivora English`,
    react: createElement(SignupVerification, {
      username: input.username,
      code: input.code,
      appUrl,
      expiresMinutes: SIGNUP_CODE_TTL_MINUTES,
    }),
  })
}