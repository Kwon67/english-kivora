import { request as playwrightRequest } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loadLocalEnv } from './loadLocalEnv'
import { PLAYWRIGHT_ONBOARDING_USER } from './provisionOnboardingUser'

function getAdminClient() {
  loadLocalEnv()

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for Playwright auth.'
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function clearLoginRateLimits() {
  const admin = getAdminClient()
  await admin.from('rate_limits').delete().like('key', 'login_%')
}

export async function saveAuthenticatedStorageState(baseURL: string, path: string) {
  await clearLoginRateLimits()

  const apiContext = await playwrightRequest.newContext({ baseURL })

  try {
    const response = await apiContext.post('/api/login', {
      data: {
        username: PLAYWRIGHT_ONBOARDING_USER.login,
        password: PLAYWRIGHT_ONBOARDING_USER.password,
        website: '',
      },
      headers: {
        Origin: baseURL,
        Referer: `${baseURL}/login`,
      },
    })

    if (!response.ok()) {
      const body = await response.text()
      throw new Error(
        `Playwright API login failed (${response.status()}) for ${PLAYWRIGHT_ONBOARDING_USER.login}: ${body}`
      )
    }

    await apiContext.storageState({ path })
  } finally {
    await apiContext.dispose()
  }
}