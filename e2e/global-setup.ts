import { existsSync, mkdirSync } from 'fs'
import { dirname, resolve } from 'path'
import { saveAuthenticatedStorageState } from './support/authSession'
import { provisionOnboardingUser } from './support/provisionOnboardingUser'

const AUTH_STATE_PATH = resolve(process.cwd(), 'e2e/.auth/onboarding-user.json')
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'

async function waitForAppReady(url: string, attempts = 30) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      const response = await fetch(`${url}/login`)
      if (response.ok) return
    } catch {
      // retry until webServer is up
    }
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  throw new Error(`Playwright global setup could not reach ${url}/login. Start dev server or run without PLAYWRIGHT_BASE_URL.`)
}

export default async function globalSetup() {
  mkdirSync(dirname(AUTH_STATE_PATH), { recursive: true })
  await waitForAppReady(baseURL)
  await provisionOnboardingUser()

  if (existsSync(AUTH_STATE_PATH)) {
    return
  }

  await saveAuthenticatedStorageState(baseURL, AUTH_STATE_PATH)
}