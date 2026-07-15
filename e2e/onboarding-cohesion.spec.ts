import { expect, test, type Page } from '@playwright/test'
import { resolve } from 'path'
import {
  assertNoHorizontalOverflow,
  assertOnboardingChrome,
  assertOnboardingFillsViewport,
  assertPrimaryActionsFitViewport,
} from './support/layout'
import { provisionOnboardingUser, resetOnboardingUserState } from './support/provisionOnboardingUser'
import { isOnboardingSchemaReady } from './support/schema'

const AUTH_STATE_PATH = resolve(process.cwd(), 'e2e/.auth/onboarding-user.json')

async function resetAndOpenOnboarding(page: Page) {
  const { userId } = await provisionOnboardingUser()
  await resetOnboardingUserState(userId)

  await page.goto('/onboarding')
  await expect(page).toHaveURL(/\/onboarding$/, { timeout: 15_000 })
  await expect(page.getByTestId('onboarding-welcome-step')).toBeVisible({ timeout: 20_000 })
}

test.describe('Onboarding cohesion', () => {
  test.describe.configure({ mode: 'serial' })
  test.use({ storageState: AUTH_STATE_PATH })

  test.beforeEach(async ({ page }) => {
    await resetAndOpenOnboarding(page)
  })

  test('wizard chrome stays focused without bottom nav', async ({ page }) => {
    await assertOnboardingChrome(page)
    await assertOnboardingFillsViewport(page)
    await assertNoHorizontalOverflow(page, 'welcome')
    await assertPrimaryActionsFitViewport(page)

    await page.getByTestId('onboarding-welcome-start').click()
    await expect(page.getByTestId('onboarding-method-step')).toBeVisible()
    await assertOnboardingChrome(page)
    await assertNoHorizontalOverflow(page, 'method')
  })

  test('method step offers placement and skip paths', async ({ page }) => {
    await page.getByTestId('onboarding-welcome-start').click()
    await expect(page.getByTestId('onboarding-method-placement')).toBeVisible()
    await expect(page.getByTestId('onboarding-method-skip')).toBeVisible()
    await expect(page.getByTestId('onboarding-method-manual')).toHaveCount(0)

    await assertNoHorizontalOverflow(page, 'method')
    await assertPrimaryActionsFitViewport(page)
  })

  test('placement path keeps layout stable across intro and questions', async ({ page }) => {
    await page.getByTestId('onboarding-welcome-start').click()
    await page.getByTestId('onboarding-method-placement').click()
    await expect(page.getByTestId('onboarding-placement-intro')).toBeVisible()
    await assertNoHorizontalOverflow(page, 'placement-intro')

    await page.getByTestId('onboarding-placement-start').click()
    await expect(page.getByTestId('onboarding-placement-step')).toBeVisible({ timeout: 20_000 })
    await assertNoHorizontalOverflow(page, 'placement-q1')

    await page.getByTestId('onboarding-placement-option').first().click()
    await page.waitForTimeout(400)
    await expect(page.getByTestId('onboarding-placement-step')).toBeVisible()
    await assertNoHorizontalOverflow(page, 'placement-q2')

    await page.getByRole('button', { name: 'Voltar' }).click()
    await expect(page.getByTestId('onboarding-method-step')).toBeVisible()
    await assertNoHorizontalOverflow(page, 'method-after-placement')
  })

  test('skip path completes wizard and shows home welcome banner', async ({ page }) => {
    const schemaReady = await isOnboardingSchemaReady()
    test.skip(
      !schemaReady,
      'Tabela user_onboarding ausente no Supabase — rode node scripts/apply-onboarding-migration.mjs'
    )

    await page.getByTestId('onboarding-welcome-start').click()
    await expect(page.getByTestId('onboarding-method-step')).toBeVisible()
    await page.getByTestId('onboarding-method-skip').click()
    await expect(page.getByTestId('onboarding-goals-step')).toBeVisible({ timeout: 20_000 })
    await assertNoHorizontalOverflow(page, 'goals')

    await page.getByTestId('onboarding-interest-conversation').click()
    await page.getByTestId('onboarding-goals-continue').click()

    await expect(page.getByTestId('onboarding-starter-pack-step')).toBeVisible({ timeout: 20_000 })
    await assertNoHorizontalOverflow(page, 'starter-pack')
    await assertPrimaryActionsFitViewport(page)

    const packImage = page.locator('[data-testid="onboarding-starter-pack-step"] img')
    const packSkeleton = page.locator(
      '[data-testid="onboarding-starter-pack-step"] [aria-hidden="true"]'
    )
    await expect(packImage.or(packSkeleton).first()).toBeVisible()

    await page.getByTestId('onboarding-starter-pack-skip').click()

    await expect(page).toHaveURL(/\/home$/, { timeout: 20_000 })
    await expect(page.getByTestId('onboarding-welcome-banner')).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('Sua rotina está pronta')).toBeVisible()
    await assertNoHorizontalOverflow(page, 'home-welcome-banner')
    await assertPrimaryActionsFitViewport(page)
  })
})
