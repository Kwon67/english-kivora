import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Daily Cron Job to evaluate missions with reward badges.
 * Finds expired missions (assigned_date < today) that haven't been evaluated yet,
 * determines the best performer for each "competition", and awards the badge to the winner.
 */
export async function GET(req: Request) {
  try {
    // Basic auth check for cron (optional but good if using Vercel Cron header)
    const authHeader = req.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // return new NextResponse('Unauthorized', { status: 401 })
    }

    const supabase = await createClient()

    // 1. Find all competitions that need evaluation
    // Groups are unique by (assigned_date, pack_id, game_mode, reward_badge_id)
    const { data: competitions, error: compError } = await supabase
      .from('assignments')
      .select('assigned_date, pack_id, game_mode, reward_badge_id')
      .not('reward_badge_id', 'is', null)
      .eq('reward_evaluated', false)
      .lt('assigned_date', new Date().toISOString().split('T')[0]) // Deadline passed
    
    if (compError) throw compError
    if (!competitions || competitions.length === 0) {
      return NextResponse.json({ message: 'No competitions to evaluate.' })
    }

    // Deduplicate competitions in memory (Supabase doesn't support SELECT DISTINCT with multiple columns easily via JS client)
    const uniqueCompetitions = Array.from(new Set(competitions.map(c => JSON.stringify(c)))).map(s => JSON.parse(s))

    const results = []

    for (const comp of uniqueCompetitions) {
      const { assigned_date, pack_id, game_mode, reward_badge_id } = comp

      // 2. Fetch all completed sessions for this specific competition
      const { data: participants, error: partError } = await supabase
        .from('game_sessions')
        .select(`
          user_id,
          correct_answers,
          wrong_answers,
          max_streak,
          completed_at,
          assignments!inner(id, assigned_date, pack_id, game_mode, status)
        `)
        .eq('assignments.assigned_date', assigned_date)
        .eq('assignments.pack_id', pack_id)
        .eq('assignments.game_mode', game_mode)
        .eq('assignments.status', 'completed') // Only those who actually finished

      if (partError) {
        console.error('Error fetching participants:', partError)
        continue
      }

      if (!participants || participants.length === 0) {
        // No one completed it? Just mark as evaluated and skip
        await supabase
          .from('assignments')
          .update({ reward_evaluated: true })
          .eq('assigned_date', assigned_date)
          .eq('pack_id', pack_id)
          .eq('game_mode', game_mode)
          .eq('reward_badge_id', reward_badge_id)
        continue
      }

      // 3. Determine the winner
      // Scoring: Accuracy primary, Max Streak secondary, Time third
      const ranked = participants.map(p => {
        const total = p.correct_answers + p.wrong_answers
        const accuracy = total > 0 ? p.correct_answers / total : 0
        return {
          ...p,
          accuracy,
        }
      }).sort((a, b) => {
        if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy
        if (b.max_streak !== a.max_streak) return b.max_streak - a.max_streak
        return new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
      })

      const winner = ranked[0]

      // 4. Award the badge to the winner
      if (winner) {
        const { error: badgeError } = await supabase
          .from('user_badges')
          .upsert(
            { user_id: winner.user_id, badge_id: reward_badge_id },
            { onConflict: 'user_id,badge_id' }
          )
        
        if (badgeError) {
          console.error(`Error awarding badge to ${winner.user_id}:`, badgeError)
        } else {
          results.push({
            competition: comp,
            winner_id: winner.user_id,
            accuracy: winner.accuracy
          })
        }
      }

      // 5. Mark all assignments in this competition as evaluated
      await supabase
        .from('assignments')
        .update({ reward_evaluated: true })
        .eq('assigned_date', assigned_date)
        .eq('pack_id', pack_id)
        .eq('game_mode', game_mode)
        .eq('reward_badge_id', reward_badge_id)
    }

    return NextResponse.json({
      success: true,
      evaluated_competitions: results.length,
      details: results
    })

  } catch (err: unknown) {
    console.error('Cron Medal Evaluation Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
