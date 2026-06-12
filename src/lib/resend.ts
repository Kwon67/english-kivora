import { Resend } from 'resend'

let _resend: Resend | null = null

export function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY)
  }
  return _resend
}

/** @deprecated Use getResend() instead to avoid build-time initialization errors. */
export const resend = {
  get emails() {
    return getResend().emails
  },
}
