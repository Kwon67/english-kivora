import { createHmac, timingSafeEqual } from 'crypto'

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

export function verifyAbacateHmac({
  rawBody,
  secretFromUrl,
  signature,
  expectedSecret,
  publicKey,
}: {
  rawBody: string
  secretFromUrl: string | null
  signature: string | null
  expectedSecret: string | null
  publicKey: string | null
}) {
  if (!expectedSecret || !publicKey || !secretFromUrl || !signature) return false
  if (!safeEqual(secretFromUrl, expectedSecret)) return false
  const expectedSignature = createHmac('sha256', publicKey)
    .update(Buffer.from(rawBody, 'utf8'))
    .digest('base64')
  return safeEqual(signature, expectedSignature)
}

