import { expect, test } from '@playwright/test'

const routes = [
  '/home', '/today', '/courses', '/study', '/add', '/dictionary', '/library',
  '/explore', '/explore/pack/pack-0', '/generate', '/problem-words', '/history',
  '/tutor', '/tutor/fixture', '/blitz', '/blitz/play', '/blitz/ranking', '/settings',
  '/onboarding', '/exam/A1', '/play/local-lesson', '/admin/dashboard', '/admin/packs',
  '/admin/assign', '/admin/members', '/admin/members/11111111-1111-4111-8111-111111111110', '/admin/reports',
]

for (const path of routes) test(`global route opens without layout overflow: ${path}`, async ({ page }, info) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort())
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const response = await page.goto(path)
  expect(response?.status()).toBe(200)
  await expect(page.locator('h1').first()).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  expect(errors).toEqual([])
  if (['/today', '/history', '/admin/reports'].includes(path)) {
    await page.screenshot({ path: `output/learning-evolution/global-${path.replaceAll('/', '-')}-${info.project.name}.png`, fullPage: true })
  }
})
