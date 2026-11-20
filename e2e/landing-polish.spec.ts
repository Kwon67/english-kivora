import { expect, test } from '@playwright/test'

test('SEO and brand assets respond without login while protected pages still redirect', async ({ request, baseURL }) => {
  for (const path of ['/', '/robots.txt', '/sitemap.xml', '/manifest.webmanifest', '/favicon.ico', '/images/kivora-social-2026.png']) {
    const response = await request.head(path, { maxRedirects: 0 })
    expect(response.status(), path).toBe(200)
    expect(response.headers().location, path).toBeUndefined()
  }

  const sitemap = await (await request.get('/sitemap.xml')).text()
  const paths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]).pathname)
  expect(paths).toEqual(['/', '/privacy', '/terms', '/login', '/register'])
  const robots = await (await request.get('/robots.txt')).text()
  expect(robots).toContain('Sitemap: https://english-kivora.vercel.app/sitemap.xml')

  const protectedPage = await request.get('/home', { maxRedirects: 0 })
  expect(protectedPage.status()).toBe(307)
  expect(new URL(protectedPage.headers().location, baseURL).pathname).toBe('/login')
})

test('the brand intro opens within its budget and skips a reload', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 })
    Object.defineProperty(navigator, 'deviceMemory', { value: 8 })
    Object.defineProperty(navigator, 'connection', { value: undefined })
  })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/', { waitUntil: 'commit' })
  const intro = page.locator('#kivora-intro')
  await expect(intro).toHaveAttribute('data-intro', /waiting|opening/)
  await expect(intro).toBeHidden({ timeout: 1500 })
  await page.reload()
  await expect(intro).toBeHidden()
  await expect(intro).not.toHaveAttribute('data-intro')
})

test('saveData selects the lightweight version and preserves the demo', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { value: Object.assign(new EventTarget(), { saveData: true, effectiveType: '4g' }) })
  })
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(/kivora-landing-lite/)
  await expect(page.locator('#kivora-intro')).toBeHidden()
  await expect(page.locator('[data-art-scene] canvas')).toHaveCount(0)
  await expect(page.locator('[data-ribbon-path]')).toHaveCSS('stroke-dasharray', 'none')
  await page.getByRole('button', { name: 'a', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click()
  const feedback = page.locator('[data-exercise-feedback]')
  await expect(feedback).toContainText('Muito bem!')
  await expect(feedback.locator('i')).toHaveCount(0)
})

test('sound starts muted and follows the preference on reload', async ({ page }) => {
  await page.addInitScript(() => {
    const create = AudioContext.prototype.createOscillator
    document.documentElement?.setAttribute('data-test-notes', '0')
    AudioContext.prototype.createOscillator = function () {
      const html = document.documentElement
      html.dataset.testNotes = String(Number(html.dataset.testNotes ?? 0) + 1)
      return create.call(this)
    }
  })
  await page.goto('/')
  const toggle = page.getByRole('button', { name: 'Sons da interface' })
  const level = page.getByRole('button', { name: /^A2/ })
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
  await level.click()
  expect(await page.locator('html').getAttribute('data-test-notes') ?? '0').toBe('0')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('html')).toHaveAttribute('data-test-notes', '1')
  await page.reload()
  await expect(toggle).toHaveAttribute('aria-pressed', 'true')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-pressed', 'false')
})
