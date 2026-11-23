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

test('the hero has no intro layer before or after delayed hydration', async ({ page }) => {
  const overlaySelector = '#kivora-intro, section[aria-labelledby="hero-title"] > :not([data-hero-copy], [data-hero-parallax], a[href="#seu-caminho"])'
  await page.addInitScript(selector => {
    function checkFrame() {
      if (document.querySelector(selector)) {
        document.documentElement.setAttribute('data-test-hero-overlay', '')
        return
      }
      requestAnimationFrame(checkFrame)
    }
    requestAnimationFrame(checkFrame)
  }, overlaySelector)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const chunks = Promise.withResolvers<void>()
  await page.route('**/_next/static/**/*.js', async route => {
    await chunks.promise
    await route.continue()
  })
  const html = page.locator('html')
  const title = page.getByRole('heading', { level: 1 })
  try {
    await page.goto('/', { waitUntil: 'commit' })
    await expect(title).toBeVisible()
    await expect(page.locator(overlaySelector)).toHaveCount(0)
  } finally {
    chunks.resolve()
  }
  await expect(html).toHaveClass(/kivora-landing-scroll/)
  // Observe the entire startup window, including any animation removed before this assertion.
  await page.waitForTimeout(3000)
  await expect(page.locator('html[data-test-hero-overlay]')).toHaveCount(0)
  await expect(title).toBeVisible()
})

test('saveData selects the lightweight version and preserves the demo', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { value: Object.assign(new EventTarget(), { saveData: true, effectiveType: '4g' }) })
  })
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(/kivora-landing-lite/)
  await expect(page.locator('#kivora-intro')).toHaveCount(0)
  await expect(page.locator('[data-art-scene] canvas')).toHaveCount(0)
  await expect(page.locator('[data-ribbon-path]')).toHaveCSS('stroke-dasharray', 'none')
  await page.getByRole('button', { name: 'a', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click()
  const feedback = page.locator('[data-exercise-feedback]')
  await expect(feedback).toContainText('Muito bem!')
  await expect(feedback.locator('i')).toHaveCount(0)
})

test('interface sounds play on interaction without a toggle', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('kivora-landing-sound', 'off')
    const create = AudioContext.prototype.createOscillator
    AudioContext.prototype.createOscillator = function () {
      const html = document.documentElement
      html.dataset.testNotes = String(Number(html.dataset.testNotes ?? 0) + 1)
      return create.call(this)
    }
  })
  await page.goto('/')
  const html = page.locator('html')
  const level = page.getByRole('button', { name: /^A2/ })
  await expect(html).toHaveClass(/kivora-landing-scroll/)
  await expect(page.getByRole('button', { name: 'Sons da interface' })).toHaveCount(0)
  await expect(html).not.toHaveAttribute('data-test-notes')
  await level.click()
  await expect(html).toHaveAttribute('data-test-notes', '1')
})
