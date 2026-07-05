'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const LearningResourceEventSchema = z.object({
  resourceId: z.string().trim().min(3).max(120),
  eventType: z.literal('open'),
  stage: z.enum(['diagnostic', 'vocabulary', 'srs-repair', 'listening', 'shadowing', 'reading', 'fluency']),
  level: z.enum(['A1', 'A2', 'B1', 'B2']).nullable(),
  resourceKind: z.enum(['video', 'series', 'reading', 'shadowing', 'listening']).nullable(),
  resourceTitle: z.string().trim().min(1).max(180),
  resourceUrl: z.string().trim().min(1).max(1000),
})

export async function recordLearningResourceEvent(input: unknown) {
  const parsed = LearningResourceEventSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Evento inválido' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false, error: 'Não autenticado' }
  }

  const payload = parsed.data
  const { error } = await supabase.from('learning_resource_events').insert({
    user_id: user.id,
    resource_id: payload.resourceId,
    event_type: payload.eventType,
    stage: payload.stage,
    level: payload.level,
    resource_kind: payload.resourceKind,
    resource_title: payload.resourceTitle,
    resource_url: payload.resourceUrl,
    metadata: {},
  })

  if (error) {
    console.error('Failed to record learning resource event', {
      userId: user.id,
      resourceId: payload.resourceId,
      error,
    })
    return { ok: false, error: 'Falha ao registrar evento' }
  }

  return { ok: true }
}
