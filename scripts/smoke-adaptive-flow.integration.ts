import { test, expect } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { chromium } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'

process.loadEnvFile('.env.local')

test.skipIf(!process.env.ADAPTIVE_TEST_URL)('deployed adaptive flow for an isolated test member', async () => {
  const baseURL = process.env.ADAPTIVE_TEST_URL!
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false, autoRefreshToken: false } })
  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } })
  const suffix = randomUUID().slice(0, 8)
  const email = `audit-${suffix}@kivora-e2e.test`
  const password = `Audit-${randomUUID()}!`
  const created = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { username: `audit_${suffix}` } })
  if (created.error || !created.data.user) throw new Error(`Test account setup: ${created.error?.message}`)
  const userId = created.data.user.id
  const browser = await chromium.launch({ headless: true, channel: 'chrome' }).catch(async (error) => {
    await admin.auth.admin.deleteUser(userId)
    throw error
  })
  const errors: string[] = []
  const context = await browser.newContext({ viewport: { width: 1365, height: 1000 } })
  const page = await context.newPage()
  page.on('pageerror', (error) => errors.push(error.message))
  try {
    if (process.env.ADAPTIVE_TEST_ACCESS_URL) {
      await page.goto(process.env.ADAPTIVE_TEST_ACCESS_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    }
    const onboarding = await admin.from('user_onboarding').upsert({ user_id: userId, onboarding_completed_at: new Date().toISOString(), daily_goal_minutes: 5, interests: ['travel'], level_source: 'placement', placement_confidence: 85 })
    if (onboarding.error) throw onboarding.error
    const assessment = await admin.from('user_cefr_assessments').upsert({ user_id: userId, estimated_level: 'A1', confidence: 85, level_source: 'auto', level_scores: { placement: { level: 'A1', confidence: 85 } }, total_interactions: 0 })
    if (assessment.error) throw assessment.error
    const login = await client.auth.signInWithPassword({ email, password })
    if (login.error || !login.data.session) throw new Error('Test sign-in failed')
    let cookies: Array<{ name: string; value: string; options: CookieOptions }> = []
    const cookieClient = createServerClient(url, anon, { cookies: { getAll: () => cookies, setAll: (next) => { cookies = next } } })
    await cookieClient.auth.setSession(login.data.session)
    await context.addCookies(cookies.map(({ name, value, options }) => ({
      name, value, domain: new URL(baseURL).hostname, path: options.path || '/', secure: true, httpOnly: false, sameSite: 'Lax' as const,
    })))
    await page.goto(`${baseURL}/home`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
    expect(new URL(page.url()).pathname).toBe('/home')
    await page.locator('#personal-learning-title').waitFor({ timeout: 30_000 })
    let status: { status?: string; packId?: string; activityId?: string; message?: string } = {}
    for (let poll = 0; poll < 60; poll++) {
      const response = await context.request.get(`${baseURL}/api/learning/personalize`)
      expect(response.status()).toBe(200)
      status = await response.json()
      if (status.status === 'ready') break
      if (['unavailable','disabled','deferred'].includes(status.status || '')) throw new Error(`Unexpected learning state: ${status.status}`)
      await page.waitForTimeout(2500)
    }
    expect(status.status).toBe('ready')
    const packId = status.packId!
    const pack = await admin.from('packs').select('id,owner_id,is_public,level').eq('id', packId).single()
    expect(pack.data).toMatchObject({ owner_id: userId, is_public: false, level: 'A1' })
    const cards = await admin.from('cards').select('id,english_phrase,audio_url').eq('pack_id', packId)
    expect(cards.data).toHaveLength(4)
    expect(cards.data?.every((card) => card.audio_url?.startsWith('https://'))).toBe(true)
    const activities = await admin.from('assignments').select('id,game_mode').eq('user_id', userId).eq('pack_id', packId)
    expect(activities.data?.map((row) => row.game_mode).sort()).toEqual(['listening','multiple_choice','speaking'])
    const publicClient = createClient(url, anon)
    const anonymousPack = await publicClient.from('packs').select('id').eq('id', packId)
    if (anonymousPack.error) expect(anonymousPack.error.code).toBe('42501')
    else expect(anonymousPack.data).toEqual([])
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('link', { name: 'Começar meu treino', exact: true }).waitFor({ timeout: 30_000 })
    const audioDuration = await page.evaluate((audioUrl) => new Promise<number>((resolve, reject) => {
      const audio = new Audio(audioUrl)
      audio.addEventListener('loadedmetadata', () => resolve(audio.duration), { once: true })
      audio.addEventListener('error', () => reject(new Error('Cannot load generated MP3')), { once: true })
      audio.load()
    }), cards.data![0].audio_url as string)
    expect(audioDuration).toBeGreaterThan(0)
    await mkdir('output/adaptive-audit', { recursive: true })
    await page.screenshot({ path: 'output/adaptive-audit/home-desktop.png', fullPage: true })
    await page.setViewportSize({ width: 390, height: 844 })
    await page.screenshot({ path: 'output/adaptive-audit/home-mobile.png', fullPage: true })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true)
    await page.getByRole('link', { name: 'Começar meu treino', exact: true }).click()
    await page.waitForURL('**/play/**', { timeout: 30_000 })
    await page.screenshot({ path: 'output/adaptive-audit/practice-mobile.png', fullPage: true })
    await page.goto(`${baseURL}/review`, { waitUntil: 'domcontentloaded' })
    await page.screenshot({ path: 'output/adaptive-audit/review-mobile.png', fullPage: true })
    expect(await page.locator('body').innerText()).not.toMatch(/Application error|erro inesperado/i)
    expect(errors).toEqual([])
    const readyJobs = await admin.from('personal_learning_jobs').select('id,status').eq('user_id', userId)
    expect(readyJobs.data).toHaveLength(1)
    await writeFile('output/adaptive-audit/deployed-flow.json', JSON.stringify({ url: baseURL, status: 'passed', cards: cards.data?.length, activities: activities.data?.map((row) => row.game_mode), audioDuration, pageErrors: errors, mobileOverflow: false, privatePack: true, idempotent: true }, null, 2))
    console.log('PASS: deployed home → Groq → Microsoft TTS → private pack → activities → SRS, desktop/mobile, playable MP3 and no duplicate job.')
  } catch (error) {
    await mkdir('output/adaptive-audit', { recursive: true })
    await page.screenshot({ path: 'output/adaptive-audit/failure.png', fullPage: true }).catch(() => {})
    const jobs = await admin.from('personal_learning_jobs').select('status,attempts,error_code').eq('user_id', userId)
    console.log('Test job diagnostic:', JSON.stringify(jobs.data), 'Page:', page.url(), 'Errors:', JSON.stringify(errors))
    throw error
  } finally {
    await browser.close()
    await client.auth.signOut()
    const packs = await admin.from('packs').select('id').eq('owner_id', userId)
    for (const pack of packs.data || []) {
      const cards = await admin.from('cards').select('id').eq('pack_id', pack.id)
      for (const card of cards.data || []) {
        const files = await admin.storage.from('card_audios').list(card.id)
        if (files.data?.length) await admin.storage.from('card_audios').remove(files.data.map((file) => `${card.id}/${file.name}`))
      }
      await admin.from('packs').delete().eq('id', pack.id).eq('owner_id', userId)
    }
    await admin.auth.admin.deleteUser(userId)
  }
})
