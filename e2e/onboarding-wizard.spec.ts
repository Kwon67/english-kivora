import { expect, test } from '@playwright/test'
import { getE2EEnv } from './support/env'
import { login } from './support/helpers'

test.describe('Onboarding wizard', () => {
  test('skip-path completes wizard and lands on home', async ({ page }) => {
    const env = getE2EEnv()

    await login(page, env.memberLogin, env.memberPassword)

    if (page.url().endsWith('/home')) {
      const welcomeBanner = page.getByTestId('onboarding-welcome-banner')
      if (await welcomeBanner.isVisible()) {
        await expect(welcomeBanner.getByText('Sua rotina está pronta')).toBeVisible()
      }
      return
    }

    await expect(page).toHaveURL(/\/onboarding$/)
    await expect(page.getByTestId('onboarding-welcome-step')).toBeVisible()

    await page.getByTestId('onboarding-welcome-start').click()
    await expect(page.getByTestId('onboarding-method-step')).toBeVisible()

    await page.getByTestId('onboarding-method-skip').click()
    await expect(page.getByTestId('onboarding-goals-step')).toBeVisible()

    await page.getByTestId('onboarding-interest-conversation').click()
    await page.getByTestId('onboarding-goals-continue').click()

    await expect(page.getByTestId('onboarding-starter-pack-step')).toBeVisible({ timeout: 20_000 })
    await page.getByTestId('onboarding-starter-pack-skip').click()

    await expect(page).toHaveURL(/\/home$/, { timeout: 20_000 })
    await expect(page.getByTestId('onboarding-welcome-banner')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Sua rotina está pronta')).toBeVisible()
  })
})