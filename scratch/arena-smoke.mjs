import fs from 'fs'
import { chromium } from '@playwright/test'
import { createClient } from '@supabase/supabase-js'

function readEnvFile(path) {
  return Object.fromEntries(
    fs
      .readFileSync(path, 'utf8')
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const separator = line.indexOf('=')
        return separator === -1 ? null : [line.slice(0, separator), line.slice(separator + 1)]
      })
      .filter(Boolean)
  )
}

const envLocal = readEnvFile('.env.local')
const envE2E = readEnvFile('.env.e2e')

const baseURL = process.env.ARENA_BASE_URL || 'http://127.0.0.1:3000'
const serviceRoleKey = envLocal.SUPABASE_SERVICE_ROLE_KEY
const supabaseUrl = envLocal.NEXT_PUBLIC_SUPABASE_URL
const anonKey = envLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error('Missing Supabase env needed for smoke test.')
}

const adminApi = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const runId = `arena-${Date.now().toString(36)}`
const tempPassword = 'ArenaSmoke!123'
const tempAdmin = {
  email: `${runId}-admin@kivora.local`,
  username: `${runId}-admin`,
  role: 'admin',
}
const tempMember = {
  email: `${runId}-member@kivora.local`,
  username: `${runId}-member`,
  role: 'member',
}
const packName = `Arena Smoke ${runId}`
const packDescription = `Arena smoke fixture ${runId}`
const cards = [
  { english_phrase: 'sun', portuguese_translation: 'sol', accepted_translations: ['sol'] },
  { english_phrase: 'moon', portuguese_translation: 'lua', accepted_translations: ['lua'] },
]

const created = {
  adminUserId: null,
  memberUserId: null,
  packId: null,
  duelId: null,
}

async function createUserAccount({ email, username, role }) {
  const { data, error } = await adminApi.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: true,
  })

  if (error || !data.user) {
    throw new Error(`Failed to create auth user for ${email}: ${error?.message || 'unknown'}`)
  }

  const { error: profileError } = await adminApi.from('profiles').upsert({
    id: data.user.id,
    email,
    username,
    role,
  })

  if (profileError) {
    throw new Error(`Failed to upsert profile for ${email}: ${profileError.message}`)
  }

  return data.user.id
}

async function createPack() {
  const { data: packRows, error: packError } = await adminApi
    .from('packs')
    .insert({
      name: packName,
      description: packDescription,
      level: null,
    })
    .select('id')

  if (packError || !packRows?.[0]?.id) {
    throw new Error(`Failed to create pack: ${packError?.message || 'unknown'}`)
  }

  const packId = packRows[0].id
  created.packId = packId

  const { error: cardsError } = await adminApi.from('cards').insert(
    cards.map((card) => ({
      ...card,
      pack_id: packId,
      audio_url: null,
    }))
  )

  if (cardsError) {
    throw new Error(`Failed to create cards: ${cardsError.message}`)
  }
}

async function cleanup() {
  if (created.duelId) {
    await adminApi.from('arena_duels').delete().eq('id', created.duelId)
  }

  if (created.packId) {
    await adminApi.from('cards').delete().eq('pack_id', created.packId)
    await adminApi.from('packs').delete().eq('id', created.packId)
  }

  if (created.memberUserId) {
    await adminApi.from('profiles').delete().eq('id', created.memberUserId)
    await adminApi.auth.admin.deleteUser(created.memberUserId)
  }

  if (created.adminUserId) {
    await adminApi.from('profiles').delete().eq('id', created.adminUserId)
    await adminApi.auth.admin.deleteUser(created.adminUserId)
  }
}

async function login(page, username, password, expectedPathPattern) {
  await page.goto(`${baseURL}/login`)
  const payload = await page.evaluate(
    async ({ loginValue, loginPassword }) => {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: loginValue, password: loginPassword }),
      })

      const body = await response.json().catch(() => null)

      return {
        ok: response.ok,
        body,
      }
    },
    { loginValue: username, loginPassword: password }
  )

  if (!payload.ok || payload.body?.error) {
    throw new Error(`Login failed for ${username}: ${payload.body?.error || 'unknown'}`)
  }

  const redirectUrl = payload.body?.redirectUrl
  if (!redirectUrl) {
    throw new Error(`Login succeeded without redirectUrl for ${username}`)
  }

  await page.goto(`${baseURL}${redirectUrl}`)
  await page.waitForURL(expectedPathPattern, { timeout: 30_000, waitUntil: 'commit' })
}

async function clickMatchingPair(page, english, portuguese) {
  await page.locator('button').filter({ hasText: english }).first().click()
  await page.locator('button').filter({ hasText: portuguese }).first().click()
}

async function main() {
  created.adminUserId = await createUserAccount(tempAdmin)
  created.memberUserId = await createUserAccount(tempMember)
  await createPack()

  const browser = await chromium.launch({ headless: true })

  try {
    const adminContext = await browser.newContext()
    const memberOneContext = await browser.newContext()
    const memberTwoContext = await browser.newContext()

    const adminPage = await adminContext.newPage()
    const gabrielPage = await memberOneContext.newPage()
    const memberTwoPage = await memberTwoContext.newPage()

    await login(gabrielPage, envE2E.E2E_MEMBER_LOGIN, envE2E.E2E_MEMBER_PASSWORD, /\/home(?:\?|$)/)
    await login(memberTwoPage, tempMember.email, tempPassword, /\/home(?:\?|$)/)
    await login(adminPage, tempAdmin.email, tempPassword, /\/admin\/dashboard(?:\?|$)/)

    await adminPage.goto(`${baseURL}/admin/arena`)
    await adminPage.getByText('Configurar duelo').waitFor({ state: 'visible', timeout: 30_000 })
    await gabrielPage.waitForTimeout(5000)
    await memberTwoPage.waitForTimeout(5000)

    const { data: gabrielProfile, error: gabrielProfileError } = await adminApi
      .from('profiles')
      .select('id')
      .eq('username', 'gabriel')
      .single()

    if (gabrielProfileError || !gabrielProfile?.id) {
      throw new Error(`Failed to resolve Gabriel profile: ${gabrielProfileError?.message || 'unknown'}`)
    }

    const { data: duelRows, error: duelInsertError } = await adminApi
      .from('arena_duels')
      .insert({
        player1_id: gabrielProfile.id,
        player2_id: created.memberUserId,
        pack_id: created.packId,
        game_type: 'flashcard',
        status: 'pending',
      })
      .select('id')

    if (duelInsertError || !duelRows?.[0]?.id) {
      throw new Error(`Failed to create duel directly: ${duelInsertError?.message || 'unknown'}`)
    }

    created.duelId = duelRows[0].id

    await gabrielPage.getByRole('button', { name: /Aceitar Desafio/i }).waitFor({
      state: 'visible',
      timeout: 20_000,
    })
    await memberTwoPage.getByRole('button', { name: /Aceitar Desafio/i }).waitFor({
      state: 'visible',
      timeout: 20_000,
    })

    await Promise.all([
      gabrielPage.waitForURL(/\/arena\//, { timeout: 20_000, waitUntil: 'commit' }),
      gabrielPage.getByRole('button', { name: /Aceitar Desafio/i }).click(),
    ])

    await Promise.all([
      memberTwoPage.waitForURL(/\/arena\//, { timeout: 20_000, waitUntil: 'commit' }),
      memberTwoPage.getByRole('button', { name: /Aceitar Desafio/i }).click(),
    ])

    await gabrielPage.waitForTimeout(5000)

    const { data: duelState } = await adminApi
      .from('arena_duels')
      .select('status,player1_joined_at,player2_joined_at,winner_id')
      .eq('id', created.duelId)
      .single()

    console.log('DUEL_STATE_BEFORE_ACTIVE_WAIT', JSON.stringify(duelState))

    await gabrielPage.getByTestId('flashcard-question').waitFor({ state: 'visible', timeout: 20_000 })
    await memberTwoPage.getByTestId('flashcard-question').waitFor({ state: 'visible', timeout: 20_000 })

    for (let index = 0; index < cards.length; index++) {
      const currentQuestion =
        (await gabrielPage.getByTestId('flashcard-question').textContent())?.trim() || ''
      await gabrielPage.getByTestId('flashcard-reveal').click()
      await gabrielPage.getByTestId('flashcard-correct').click()

      if (index < cards.length - 1) {
        await gabrielPage.waitForFunction(
          (previousQuestion) => {
            const node = document.querySelector('[data-testid="flashcard-question"]')
            return Boolean(node?.textContent?.trim() && node.textContent.trim() !== previousQuestion)
          },
          currentQuestion,
          { timeout: 10_000 }
        )
      }
    }

    await gabrielPage.waitForTimeout(2000)

    const { data: duelStateAfterPlay } = await adminApi
      .from('arena_duels')
      .select('status,winner_id')
      .eq('id', created.duelId)
      .single()

    console.log('DUEL_STATE_AFTER_PLAY', JSON.stringify(duelStateAfterPlay))

    await gabrielPage.getByText('Excellent work.').waitFor({ state: 'visible', timeout: 20_000 })
    await memberTwoPage.getByText('Good duel.').waitFor({ state: 'visible', timeout: 20_000 })

    console.log('ARENA_SMOKE_OK')
    console.log(JSON.stringify({
      duelId: created.duelId,
      admin: tempAdmin.email,
      member1: envE2E.E2E_MEMBER_LOGIN,
      member2: tempMember.email,
      pack: packName,
    }, null, 2))

    await adminContext.close()
    await memberOneContext.close()
    await memberTwoContext.close()
  } finally {
    await browser.close()
  }
}

try {
  await main()
} finally {
  await cleanup()
}
