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

test('conteúdo e controles permanecem estáticos ao interagir', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await page.getByRole('button', { name: /Revelar tradução/ }).click()
  await page.locator('#practice-build').click()
  await page.locator('#faq summary').first().click()
  await expect(page.locator('#faq details[open] p')).toBeVisible()
  expect(await page.locator('#inicio').evaluate(el => el.getAnimations({ subtree: true }).length)).toBe(0)
  await expect(page.locator('html')).toHaveCSS('scroll-behavior', 'auto')
  expect(errors).toEqual([])
})
