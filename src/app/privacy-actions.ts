'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'

/**
 * LGPD Art. 18 rights: portability (export) and elimination (delete).
 *
 * Both are required before charging Brazilian consumers, and neither existed. Deletion is
 * routed through the Auth admin API rather than table-by-table DELETEs because every user-owned
 * table hangs off `profiles.id -> auth.users(id) ON DELETE CASCADE`, so removing the auth user
 * is the one operation that cannot leave orphans behind as new tables are added.
 */

/**
 * Tables owned by the user, keyed by the column that points at them, plus the columns to read.
 *
 * `profiles` cannot use `*`: that table has column-level grants (`REVOKE SELECT ... GRANT
 * SELECT (id, username, ...)`) which deliberately exclude email, so `select('*')` is refused
 * outright and the profile would silently export as empty.
 */
const PROFILE_COLUMNS =
  'id,username,role,created_at,updated_at,last_seen_at,avatar_url,cover_url,bio,description,weekly_report_enabled'

const EXPORTABLE_TABLES: readonly (readonly [string, string, string])[] = [
  ['profiles', 'id', PROFILE_COLUMNS],
  ['assignments', 'user_id', '*'],
  ['card_reviews', 'user_id', '*'],
  ['game_sessions', 'user_id', '*'],
  ['blitz_runs', 'user_id', '*'],
  ['user_streaks', 'user_id', '*'],
  ['user_badges', 'user_id', '*'],
  ['user_quests', 'user_id', '*'],
  ['user_onboarding', 'user_id', '*'],
  ['user_cefr_assessments', 'user_id', '*'],
  ['placement_responses', 'user_id', '*'],
  ['learning_plan_history', 'user_id', '*'],
  ['learning_resource_events', 'user_id', '*'],
  // packs are owned via owner_id, not user_id — an easy column to get wrong, and it exported
  // silently empty until `incomplete` started reporting failures.
  ['packs', 'owner_id', '*'],
]

export type UserDataExport = {
  exportedAt: string
  userId: string
  email: string | null
  data: Record<string, unknown[]>
  /** Tables that could not be read. Empty on a complete export. */
  incomplete: string[]
}

type ExportResult =
  | { success: true; export: UserDataExport }
  | { success: false; error: string }

export async function exportUserDataAction(): Promise<ExportResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Não autenticado.' }

  const data: Record<string, unknown[]> = {}
  const incomplete: string[] = []

  for (const [table, column, columns] of EXPORTABLE_TABLES) {
    // Read through the user's own session so RLS stays in force: an export must never be able
    // to reach rows the user cannot otherwise see.
    const { data: rows, error } = await supabase
      .from(table)
      .select(columns)
      .eq(column, user.id)

    data[table] = rows ?? []

    // Never swallow this. A silently partial export is worse than a failed one, because the
    // user walks away believing they hold a complete copy of their data.
    if (error) incomplete.push(table)
  }

  return {
    success: true,
    export: {
      exportedAt: new Date().toISOString(),
      userId: user.id,
      email: user.email ?? null,
      data,
      incomplete,
    },
  }
}

type DeleteResult = { success: true } | { success: false; error: string }

/**
 * Irreversible. The caller must have already confirmed with the user; this action does not
 * prompt. Requires the typed confirmation phrase so a stray call cannot destroy an account.
 */
export async function deleteAccountAction(confirmation: string): Promise<DeleteResult> {
  if (confirmation.trim().toUpperCase() !== 'EXCLUIR') {
    return { success: false, error: 'Digite EXCLUIR para confirmar.' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Não autenticado.' }

  const adminSupabase = createAdminClient()
  if (!adminSupabase) {
    return {
      success: false,
      error: 'Exclusão indisponível no momento. Fale com o suporte para concluir o pedido.',
    }
  }

  const { error } = await adminSupabase.auth.admin.deleteUser(user.id)
  if (error) {
    return { success: false, error: 'Não foi possível excluir a conta. Tente novamente.' }
  }

  // Drop the local session so the browser cannot keep acting as a user that no longer exists.
  await supabase.auth.signOut()

  return { success: true }
}
