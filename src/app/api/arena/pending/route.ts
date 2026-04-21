import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ duelId: null }, { status: 200 })
  }

  const { data: duel } = await supabase
    .from('arena_duels')
    .select('id,status')
    .or(`player1_id.eq.${user.id},player2_id.eq.${user.id}`)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    duelId: duel?.id ?? null,
    status: duel?.status ?? null,
  })
}
