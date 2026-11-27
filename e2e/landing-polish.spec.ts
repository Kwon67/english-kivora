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

test('movimento reduzido preserva a interação sem animações', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
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

test('a barra acompanha a leitura e desliga ao reduzir movimento', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const root = page.locator('#inicio')
  await expect(root).toHaveAttribute('data-motion', 'active')
  const bar = root.locator(':scope > [aria-hidden="true"]')
  await page.locator('#rodape').scrollIntoViewIfNeeded()
  await expect.poll(() => bar.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a)).toBeGreaterThan(.85)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(root).not.toHaveAttribute('data-motion', 'active')
  await expect.poll(() => bar.evaluate(el => new DOMMatrix(getComputedStyle(el).transform).a)).toBe(0)
})

test('a conversa aceita nova tentativa, avança e devolve o foco', async ({ page }) => {
  await page.goto('/')
  const trigger = page.getByRole('button', { name: 'Praticar no café' })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Conversa no café' })
  await dialog.getByRole('button', { name: /Onde fica a cafeteria/ }).click()
  await expect(dialog.getByText(/Quase!/)).toBeVisible()
  await dialog.getByRole('button', { name: /Um café, por favor/ }).click()
  await dialog.getByRole('button', { name: 'Próxima expressão' }).click()
  await expect(dialog.getByText(/Nice to meet you/)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
})

test('deslizar o exemplo troca o nível sem sair do explorador', async ({ page }) => {
  await page.goto('/#nivel-B1')
  const panel = page.locator('#level-example')
  await panel.scrollIntoViewIfNeeded()
  const bounds = (await panel.boundingBox())!
  const x = bounds.x + bounds.width * .75
  const y = bounds.y + bounds.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x - 95, y, { steps: 8 })
  await page.mouse.up()
  await expect(page.getByRole('button', { name: 'B2', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page).toHaveURL(/#nivel-B2$/)
})
