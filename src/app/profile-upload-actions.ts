'use server'

import { z } from 'zod'
import {
  uploadProfileImageToCloudinary,
  type ProfileImageKind,
} from '@/lib/cloudinaryUpload'
import { isRateLimited } from '@/features/security/lib/security'
import { createClient } from '@/lib/supabase/server'

const UploadKindSchema = z.enum(['avatar', 'cover'])

export async function uploadProfileImageAction(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false as const, error: 'Não autenticado' }
  }

  const limited = await isRateLimited('profile_image_upload', user.id, 12, 60 * 60)
  if (limited) {
    return { success: false as const, error: 'Muitos uploads. Tente novamente em alguns minutos.' }
  }

  const kindResult = UploadKindSchema.safeParse(formData.get('kind'))
  if (!kindResult.success) {
    return { success: false as const, error: 'Tipo de imagem inválido.' }
  }

  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { success: false as const, error: 'Selecione uma imagem válida.' }
  }

  const result = await uploadProfileImageToCloudinary(
    file,
    user.id,
    kindResult.data as ProfileImageKind
  )

  if ('error' in result) {
    return { success: false as const, error: result.error }
  }

  return { success: true as const, secureUrl: result.secureUrl }
}