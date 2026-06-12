import { NextResponse } from 'next/server'
import { protectJsonPost } from '@/lib/rateLimit'
import { createAdminClient, createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const protectionResponse = protectJsonPost(request, {
    keyPrefix: 'api:presence',
    limit: 60,
    windowMs: 60_000,
  })
  if (protectionResponse) return protectionResponse

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const adminSupabase = createAdminClient()
  if (!adminSupabase) {
    return NextResponse.json({ error: 'Admin client unavailable' }, { status: 500 })
  }

  const { error } = await adminSupabase
    .from('profiles')
    .update({ last_seen_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    console.error('Presence update failed', { userId: user.id, error })
    return NextResponse.json({ error: 'Unable to update presence' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
