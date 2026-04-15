import { expect, type Page } from '@playwright/test'
import type { TrainingPack } from './training-data'

export async function login(page: Page, loginValue: string, password: string) {
  await page.goto('/login')
  await page.getByTestId('login-username').fill(loginValue)
  await page.getByTestId('login-password').fill(password)
  await page.getByTestId('login-submit').click()

  const [navigationResult, errorResult] = await Promise.allSettled([
    page.waitForURL('**/home', { timeout: 20_000, waitUntil: 'commit' }),
    page.getByTestId('login-error').waitFor({ state: 'visible', timeout: 20_000 }),
  ])

  if (navigationResult.status === 'fulfilled') {
    return
  }

  if (errorResult.status === 'fulfilled') {
    const message =
      (await page.getByTestId('login-error').textContent())?.trim() || 'Unknown login error'
    throw new Error(`Login failed for "${loginValue}": ${message}`)
  }

  throw new Error(`Login did not complete for "${loginValue}" within 20 seconds.`)
}

export async function createPackWithCards(page: Page, pack: TrainingPack) {
  await page.goto('/admin/packs')
  await page.getByTestId('open-new-pack').click()
  await expect(page.getByTestId('new-pack-form')).toBeVisible()
  await page.getByTestId('pack-name-input').fill(pack.name)
  await page.getByTestId('pack-difficulty-select').selectOption(pack.difficulty)
  await page.getByTestId('pack-description-input').fill(pack.description)
  await page.getByTestId('create-pack-submit').click()

  const packCard = page.getByTestId('pack-card').filter({ hasText: pack.name }).first()
  await expect(packCard).toBeVisible()
  await packCard.click()

  await expect(page.getByTestId('add-card-form')).toBeVisible()
  const enInput = page.getByTestId('add-card-en-input')
  const ptInput = page.getByTestId('add-card-pt-input')
  const submitButton = page.getByTestId('add-card-submit')

  for (const card of pack.cards) {
    await expect(enInput).toBeVisible()
    await expect(ptInput).toBeVisible()
    await expect(submitButton).toBeEnabled()

    await enInput.fill('')
    await enInput.fill(card.en)
    await expect(enInput).toHaveValue(card.en)

    await ptInput.fill('')
    await ptInput.fill(card.pt)
    await expect(ptInput).toHaveValue(card.pt)

    await submitButton.click()
    await expect(page.getByText(card.en, { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(enInput).toHaveValue('')
  }
}

export async function assignPackToMember(
  page: Page,
  memberUsername: string,
  pack: TrainingPack
) {
  await page.goto('/admin/assign')
  await page.getByTestId('assign-user-select').selectOption({ label: memberUsername })
  const packOptionValue = await page
    .locator('[data-testid="assign-pack-select"] option')
    .evaluateAll((options, expectedName) => {
      const option = options.find(
        (item) => item.textContent?.trim().startsWith(expectedName)
      ) as HTMLOptionElement | undefined

      return option?.value || null
    }, pack.name)

  if (!packOptionValue) {
    throw new Error(`Pack option not found for "${pack.name}".`)
  }

  await page.getByTestId('assign-pack-select').selectOption(packOptionValue)
  await page.getByTestId(`game-mode-${pack.gameMode}`).click()
  await page.getByTestId('assign-submit').click()
  await expect(page.getByText('Tarefa atribuída com sucesso')).toBeVisible()
}

export async function startAssignmentByPackName(page: Page, packName: string) {
  await page.goto('/home')
  const card = page.getByTestId('assignment-card').filter({ hasText: packName }).first()
  await expect(card).toBeVisible()
  await card.getByTestId('assignment-start-button').click()
  await page.waitForURL('**/play/**')
  await expect(page.getByTestId('game-start-button')).toBeVisible()
  await page.getByTestId('game-start-button').click()
}

export async function completeMultipleChoiceGame(
  page: Page,
  translationMap: Record<string, string>,
  totalCards: number
) {
  for (let index = 0; index < totalCards; index++) {
    const question = (await page.getByTestId('multiple-choice-question').textContent())?.trim()
    if (!question) throw new Error('Multiple choice question not found.')

    const answer = translationMap[question]
    if (!answer) throw new Error(`Missing translation for question "${question}".`)

    await page.getByTestId('multiple-choice-option').filter({ hasText: answer }).first().click()
    await page.getByRole('button', { name: 'Verificar resposta' }).click()

    if (index < totalCards - 1) {
      await expect(page.getByTestId('multiple-choice-question')).not.toHaveText(question)
    }
  }

  await expect(page.getByTestId('game-finish-button')).toBeVisible()
}

export async function completeFlashcardGame(page: Page, totalCards: number) {
  for (let index = 0; index < totalCards; index++) {
    const question = (await page.getByTestId('flashcard-question').textContent())?.trim()
    await page.getByTestId('flashcard-reveal').click()
    await page.getByTestId('flashcard-correct').click()

    if (index < totalCards - 1 && question) {
      await expect(page.getByTestId('flashcard-question')).not.toHaveText(question)
    }
  }

  await expect(page.getByTestId('game-finish-button')).toBeVisible()
}

export async function completeTypingGame(
  page: Page,
  translationMap: Record<string, string>,
  totalCards: number
) {
  for (let index = 0; index < totalCards; index++) {
    const question = (await page.getByTestId('typing-question').textContent())?.trim()
    if (!question) throw new Error('Typing question not found.')

    const answer = translationMap[question]
    if (!answer) throw new Error(`Missing translation for question "${question}".`)

    await page.getByTestId('typing-input').fill(answer)
    await page.getByTestId('typing-submit').click()
    await page.getByRole('button', { name: 'Ir para a próxima' }).click()

    if (index < totalCards - 1) {
      await expect(page.getByTestId('typing-question')).not.toHaveText(question)
    }
  }

  await expect(page.getByTestId('game-finish-button')).toBeVisible()
}

export async function completeMatchingGame(
  page: Page,
  translationMap: Record<string, string>
) {
  for (const [english, portuguese] of Object.entries(translationMap)) {
    await page.getByTestId('matching-item').filter({ hasText: english }).first().click()
    await page.getByTestId('matching-item').filter({ hasText: portuguese }).first().click()
  }

  await expect(page.getByTestId('game-finish-button')).toBeVisible({ timeout: 10_000 })
}

export async function finishGameAndVerifyHistory(page: Page, packName: string) {
  await page.getByTestId('game-finish-button').click()
  await page.waitForURL('**/home')
  await page.goto('/history')
  await expect(page.getByText(packName)).toBeVisible()
}
