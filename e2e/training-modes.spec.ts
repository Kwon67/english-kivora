import { test } from '@playwright/test'
import { getE2EEnv } from './support/env'
import {
  assignPackToMember,
  completeFlashcardGame,
  completeMatchingGame,
  completeMultipleChoiceGame,
  completeTypingGame,
  createPackWithCards,
  finishGameAndVerifyHistory,
  login,
  startAssignmentByPackName,
} from './support/helpers'
import { createTrainingPacks, toTranslationMap } from './support/training-data'

const runId = new Date().toISOString().replace(/\D/g, '').slice(0, 14)
const packs = createTrainingPacks(runId)

test.describe.serial('Training flows', () => {
  test.setTimeout(300_000)

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(300_000)

    const env = getE2EEnv()
    const context = await browser.newContext()
    const page = await context.newPage()

    await login(page, env.adminLogin, env.adminPassword)

    for (const pack of packs) {
      await createPackWithCards(page, pack)
      await assignPackToMember(page, env.memberUsername, pack)
    }

    await context.close()
  })

  test('multiple choice starts and completes normally', async ({ browser }) => {
    const env = getE2EEnv()
    const pack = packs.find((item) => item.gameMode === 'multiple_choice')
    if (!pack) throw new Error('Multiple choice pack definition not found.')

    const context = await browser.newContext()
    const page = await context.newPage()

    await login(page, env.memberLogin, env.memberPassword)
    await startAssignmentByPackName(page, pack.name)
    await completeMultipleChoiceGame(page, toTranslationMap(pack.cards), pack.cards.length)
    await finishGameAndVerifyHistory(page, pack.name)

    await context.close()
  })

  test('flashcard starts and completes normally', async ({ browser }) => {
    const env = getE2EEnv()
    const pack = packs.find((item) => item.gameMode === 'flashcard')
    if (!pack) throw new Error('Flashcard pack definition not found.')

    const context = await browser.newContext()
    const page = await context.newPage()

    await login(page, env.memberLogin, env.memberPassword)
    await startAssignmentByPackName(page, pack.name)
    await completeFlashcardGame(page, pack.cards.length)
    await finishGameAndVerifyHistory(page, pack.name)

    await context.close()
  })

  test('typing starts and completes normally', async ({ browser }) => {
    const env = getE2EEnv()
    const pack = packs.find((item) => item.gameMode === 'typing')
    if (!pack) throw new Error('Typing pack definition not found.')

    const context = await browser.newContext()
    const page = await context.newPage()

    await login(page, env.memberLogin, env.memberPassword)
    await startAssignmentByPackName(page, pack.name)
    await completeTypingGame(page, toTranslationMap(pack.cards), pack.cards.length)
    await finishGameAndVerifyHistory(page, pack.name)

    await context.close()
  })

  test('matching starts and completes normally', async ({ browser }) => {
    const env = getE2EEnv()
    const pack = packs.find((item) => item.gameMode === 'matching')
    if (!pack) throw new Error('Matching pack definition not found.')

    const context = await browser.newContext()
    const page = await context.newPage()

    await login(page, env.memberLogin, env.memberPassword)
    await startAssignmentByPackName(page, pack.name)
    await completeMatchingGame(page, toTranslationMap(pack.cards))
    await finishGameAndVerifyHistory(page, pack.name)

    await context.close()
  })
})
