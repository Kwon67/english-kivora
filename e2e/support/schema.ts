import { createClient } from '@supabase/supabase-js'
import { loadLocalEnv } from './loadLocalEnv'

let onboardingSchemaReady: boolean | null = null

export async function isOnboardingSchemaReady(): Promise<boolean> {
  if (onboardingSchemaReady != null) return onboardingSchemaReady

  loadLocalEnv()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) {
    onboardingSchemaReady = false
    return false
  }

  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { error } = await admin.from('user_onboarding').select('user_id').limit(1)
  onboardingSchemaReady = !error?.message?.includes('Could not find the table')
  return onboardingSchemaReady
}