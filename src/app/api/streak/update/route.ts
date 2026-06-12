import { NextResponse } from 'next/server'
import { updateStreak } from '@/features/streak/lib/streak'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await updateStreak(user.id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao atualizar streak', { userId: user.id, error })
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
