import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const PROFILE_SELECT_WITH_WEEKLY =
  'username,role,bio,description,avatar_url,cover_url,weekly_report_enabled' as const

const PROFILE_SELECT_BASE =
  'username,role,bio,description,avatar_url,cover_url' as const

export type OwnProfile = {
  username: string
  role: string | null
  bio: string | null
  description: string | null
  avatar_url: string | null
  cover_url: string | null
  weekly_report_enabled: boolean
}

type ProfileBaseRow = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'username' | 'role' | 'bio' | 'description' | 'avatar_url' | 'cover_url'
>

type ProfileWithWeeklyRow = ProfileBaseRow & {
  weekly_report_enabled: boolean | null
}

function toOwnProfile(
  row: ProfileBaseRow,
  weeklyReportEnabled: boolean | null | undefined
): OwnProfile | null {
  if (!row.username) return null

  return {
    ...row,
    username: row.username,
    weekly_report_enabled: weeklyReportEnabled ?? true,
  }
}

export async function getOwnProfile(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<OwnProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT_WITH_WEEKLY)
    .eq('id', userId)
    .maybeSingle()

  if (!error && data) {
    const profile = toOwnProfile(data as ProfileWithWeeklyRow, data.weekly_report_enabled)
    if (profile) return profile
  }

  const { data: fallback, error: fallbackError } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT_BASE)
    .eq('id', userId)
    .maybeSingle()

  if (fallbackError || !fallback) {
    return null
  }

  return toOwnProfile(fallback as ProfileBaseRow, true)
}