export type LeaderboardMember = {
  id: string
  username: string
}

export type LeaderboardSession = {
  user_id: string | null
  correct_answers: number
  wrong_answers: number
  max_streak: number
}

export type LeaderboardEntry = {
  rank: number
  userId: string
  username: string
  score: number
  accuracy: number
  sessions: number
  bestStreak: number
}

export function calculateWeeklyFocusScore(session: LeaderboardSession) {
  return (
    session.correct_answers * 2 +
    Math.max(0, 4 - session.wrong_answers) +
    Math.min(session.max_streak, 12)
  )
}

export function getLeaderboardTier(score: number) {
  if (score >= 140) return 'Elite'
  if (score >= 95) return 'Diamante'
  if (score >= 55) return 'Ouro'
  if (score >= 25) return 'Prata'
  return 'Bronze'
}

export function buildWeeklyLeaderboard(
  members: LeaderboardMember[],
  sessions: LeaderboardSession[]
) {
  const sessionMap = new Map<string, LeaderboardSession[]>()

  for (const session of sessions) {
    if (!session.user_id) continue
    const current = sessionMap.get(session.user_id) || []
    current.push(session)
    sessionMap.set(session.user_id, current)
  }

  const entries = members.map((member) => {
    const memberSessions = sessionMap.get(member.id) || []
    const totalCorrect = memberSessions.reduce((sum, session) => sum + session.correct_answers, 0)
    const totalWrong = memberSessions.reduce((sum, session) => sum + session.wrong_answers, 0)
    const totalAnswers = totalCorrect + totalWrong
    const score = memberSessions.reduce((sum, session) => sum + calculateWeeklyFocusScore(session), 0)

    return {
      userId: member.id,
      username: member.username,
      score,
      accuracy: totalAnswers > 0 ? Math.round((totalCorrect / totalAnswers) * 100) : 0,
      sessions: memberSessions.length,
      bestStreak: memberSessions.reduce((best, session) => Math.max(best, session.max_streak), 0),
    }
  })

  entries.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    if (b.accuracy !== a.accuracy) return b.accuracy - a.accuracy
    if (b.sessions !== a.sessions) return b.sessions - a.sessions
    return a.username.localeCompare(b.username)
  })

  return entries.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }))
}
