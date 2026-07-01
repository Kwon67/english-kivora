import { createClient } from '@supabase/supabase-js'
import { loadLocalEnv } from './loadLocalEnv'

export const PLAYWRIGHT_ONBOARDING_USER = {
  login: 'pw_onboarding',
  email: 'playwright.onboarding@kivora-e2e.test',
  password: 'PlaywrightOnboarding!2026',
  username: 'pw_onboarding',
} as const

function getAdminClient() {
  loadLocalEnv()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for Playwright provisioning.'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

async function findUserIdByEmail(admin: ReturnType<typeof getAdminClient>, email: string) {
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (error) throw error
  return data.users.find((user) => user.email === email)?.id ?? null
}

export async function resetOnboardingUserState(userId: string) {
  const admin = getAdminClient()

  await admin.from('user_onboarding').delete().eq('user_id', userId)
  await admin.from('user_cefr_assessments').delete().eq('user_id', userId)
  await admin.from('assignments').delete().eq('user_id', userId)
}

export async function provisionOnboardingUser() {
  const admin = getAdminClient()
  const { email, password, username } = PLAYWRIGHT_ONBOARDING_USER

  let userId = await findUserIdByEmail(admin, email)

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, role: 'member' },
    })

    if (error || !data.user) {
      throw new Error(`Failed to create Playwright onboarding user: ${error?.message || 'unknown'}`)
    }

    userId = data.user.id
  }

  const { error: profileError } = await admin.from('profiles').upsert(
    {
      id: userId,
      email,
      username,
      role: 'member',
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    throw new Error(`Failed to upsert Playwright onboarding profile: ${profileError.message}`)
  }

  await resetOnboardingUserState(userId)

  return { userId, ...PLAYWRIGHT_ONBOARDING_USER }
}