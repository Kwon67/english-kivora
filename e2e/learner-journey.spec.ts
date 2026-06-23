import { expect, test } from '@playwright/test'
import { getE2EEnv } from './support/env'
import { login } from './support/helpers'

test.describe('Learner journey', () => {
  test('onboarding through explore, study, review, and blitz', async ({ page }) => {
    const env = getE2EEnv()

    await login(page, env.memberLogin, env.memberPassword)
    await expect(page).toHaveURL(/\/home$/)

    const onboarding = page.getByTestId('onboarding-checklist')
    if (await onboarding.isVisible()) {
      await expect(onboarding.getByText('Monte sua rotina em 3 passos')).toBeVisible()
      await expect(onboarding.getByRole('link', { name: 'Explorar packs' })).toBeVisible()
    }

    await page.goto('/explore')
    await expect(page.getByRole('heading', { name: 'Encontre o próximo treino certo' })).toBeVisible()

    await page.goto('/study')
    await expect(page.getByRole('heading', { name: 'Minha rotina' })).toBeVisible()
    await expect(page.getByText('Plano de estudos')).toBeVisible()

    await page.goto('/review')
    await expect(page.getByTestId('review-page')).toBeVisible()
    await expect(
      page.getByRole('heading', { name: /tudo em dia|revisão diária|revisão concluída/i }).first()
    ).toBeVisible()

    await page.goto('/blitz')
    await expect(page.getByRole('heading', { name: 'Blitz' })).toBeVisible()
    await expect(page.getByTestId('blitz-play-link')).toBeVisible()
    await expect(page.getByText('Desafio Relâmpago')).toBeVisible()
  })
})