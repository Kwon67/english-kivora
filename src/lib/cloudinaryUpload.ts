import { createHash } from 'crypto'

const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
])

const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export type ProfileImageKind = 'avatar' | 'cover'

type CloudinaryUploadResponse = {
  secure_url?: string
  error?: { message?: string }
}

function getCloudinaryConfig() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim()
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()

  if (!cloudName || !apiKey || !apiSecret) {
    return null
  }

  return { cloudName, apiKey, apiSecret }
}

function signCloudinaryParams(params: Record<string, string>, apiSecret: string) {
  const serialized = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join('&')

  return createHash('sha1').update(serialized + apiSecret).digest('hex')
}

export function isAllowedCloudinaryDeliveryUrl(url: string) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim()
  if (!cloudName || !url) return false

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:') return false
    if (parsed.hostname !== 'res.cloudinary.com') return false
    return parsed.pathname.startsWith(`/${cloudName}/image/upload/`)
  } catch {
    return false
  }
}

export function validateProfileImageFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return 'Formato inválido. Use JPEG, PNG, WebP ou GIF.'
  }

  if (file.size > MAX_IMAGE_BYTES) {
    return 'A imagem deve ter no máximo 5MB.'
  }

  return null
}

export async function uploadProfileImageToCloudinary(
  file: File,
  userId: string,
  kind: ProfileImageKind
): Promise<{ secureUrl: string } | { error: string }> {
  const validationError = validateProfileImageFile(file)
  if (validationError) return { error: validationError }

  const config = getCloudinaryConfig()
  if (!config) {
    return { error: 'Cloudinary não configurado no servidor.' }
  }

  const folder = `kivora/profiles/${userId}/${kind}`
  const timestamp = Math.round(Date.now() / 1000).toString()
  const paramsToSign = { folder, timestamp }
  const signature = signCloudinaryParams(paramsToSign, config.apiSecret)

  const formData = new FormData()
  formData.append('file', file)
  formData.append('api_key', config.apiKey)
  formData.append('timestamp', timestamp)
  formData.append('signature', signature)
  formData.append('folder', folder)

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
    { method: 'POST', body: formData }
  )

  const payload = (await response.json().catch(() => ({}))) as CloudinaryUploadResponse

  if (!response.ok || !payload.secure_url) {
    return {
      error: payload.error?.message || 'Falha no upload da imagem.',
    }
  }

  if (!isAllowedCloudinaryDeliveryUrl(payload.secure_url)) {
    return { error: 'Resposta de upload inválida.' }
  }

  return { secureUrl: payload.secure_url }
}