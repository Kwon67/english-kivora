import { expect, test, type Locator, type Page } from '@playwright/test'
import { assertNoHorizontalOverflow } from './support/layout'

const headline = 'Seu inglês. Um mundo mais aberto.'
const lines = ['Seu inglês.', 'Um mundo', 'mais aberto.']

function primaryLink(page: Page) {
  return page.locator('[data-hero-copy], [data-hero-dock]').getByRole('link', { name: 'Começar grátis', exact: true })
}

async function checkHeading(page: Page) {
  const title = page.getByRole('heading', { level: 1 })
  await expect(title).toHaveCount(1)
  await expect(title).toHaveAccessibleName(headline)
  await expect(title.locator('[data-title-line]')).toHaveText(lines)
  await expect(title.locator('[data-hero-keyword]')).toHaveText('aberto.')
  return title
}

function measureLines(title: Locator) {
  return title.locator('[data-title-line]').evaluateAll(elements => elements.map(element => {
    const range = document.createRange()
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    const bounds: DOMRect[] = []
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      range.selectNodeContents(node)
      bounds.push(...Array.from(range.getClientRects()).filter(rect => rect.width > 0))
    }
    const centers = bounds.map(rect => rect.top + rect.height / 2)
    return {
      text: element.textContent,
      wrapped: Math.max(...centers) - Math.min(...centers) > parseFloat(getComputedStyle(element).fontSize) / 2,
      left: Math.min(...bounds.map(rect => rect.left)),
      right: Math.max(...bounds.map(rect => rect.right)),
      top: Math.min(...centers),
    }
  }))
}

test('etiquetas respondem ao ponteiro e o CTA continua navegável', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Ponteiro fino')
  await page.goto('/')
  const label = page.locator('[data-hero-parallax] [data-float] [data-cursor]').first()
  const box = await label.boundingBox()
  expect(box).not.toBeNull()
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2)
  await expect.poll(() => label.evaluate(el => getComputedStyle(el).transform)).not.toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/)
  await page.locator('[data-magnetic]').click()
  await expect(page).toHaveURL(/\/register$/)
})

test('o poster acompanha a preferência de movimento em tempo real', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const hero = page.locator('[data-art-scene="discovery"]')
  await expect(hero.locator('picture img')).toBeVisible()
  await expect(hero.locator('canvas')).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(hero.locator('[data-rive-ready=true]')).toHaveCount(1, { timeout: 15_000 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(hero.locator('canvas')).toHaveCount(0)
  await assertNoHorizontalOverflow(page, 'hero')
})

test('falha do arquivo Rive preserva a ilustração e a prática', async ({ page }) => {
  await page.route('**/*.riv', route => route.abort())
  await page.goto('/')
  await expect(page.locator('[data-art-scene="discovery"] picture img')).toBeVisible()
  await page.getByRole('button', { name: 'Relembrar', exact: true }).click()
  await page.getByRole('button', { name: 'Revelar significado' }).click()
  await expect(page.getByText('um pouco mais perto', { exact: true })).toBeVisible()
})

test('o CTA aceita o primeiro toque ou clique durante a entrada', async ({ page, hasTouch }) => {
  await page.goto('/', { waitUntil: 'commit' })
  const title = page.locator('#hero-title')
  const link = primaryLink(page)
  await expect(title).toHaveAccessibleName(headline)
  await expect(link).toHaveAttribute('href', '/register')
  const point = await link.evaluate(anchor => {
    const rect = anchor.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    return { x, y, hittable: anchor.contains(document.elementFromPoint(x, y)) }
  })
  expect(point.hittable).toBe(true)
  if (hasTouch) await page.touchscreen.tap(point.x, point.y)
  else await page.mouse.click(point.x, point.y)
  await expect(page).toHaveURL(/\/register$/)
})

test('cada linha cabe com a fonte de fallback e após carregar a fonte da página', async ({ page, isMobile }, testInfo) => {
  const fonts = Promise.withResolvers<void>()
  let requested = 0
  await page.route(/\.woff2(?:\?|$)/, async route => {
    requested++
    await fonts.promise
    await route.continue()
  })
  // Measure the actual text ranges without intentional headline transforms.
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const title = await checkHeading(page)
  const widths = isMobile ? [375, 390, 402, 430] : [834, 1440, 2560]
  const evidence = []
  try {
    await expect.poll(() => requested).toBeGreaterThan(0)
    for (const phase of ['fallback', 'loaded']) {
      if (phase === 'loaded') {
        fonts.resolve()
        await page.evaluate(() => document.fonts.ready.then(() => undefined))
      }
      for (const width of widths) {
        await page.setViewportSize({ width, height: isMobile ? 844 : 900 })
        const layout = await measureLines(title)
        expect(layout.map(line => line.text)).toEqual(lines)
        for (const line of layout) {
          expect(line.wrapped, `${width}px | ${phase} | ${line.text}`).toBe(false)
          expect(line.left).toBeGreaterThanOrEqual(-1)
          expect(line.right).toBeLessThanOrEqual(width + 1)
        }
        expect(layout[0].top).toBeLessThan(layout[1].top)
        expect(layout[1].top).toBeLessThan(layout[2].top)
        evidence.push({ phase, width, layout })
      }
    }
  } finally {
    fonts.resolve()
    await testInfo.attach('geometria-das-linhas', { body: JSON.stringify(evidence), contentType: 'application/json' })
  }
})

test.describe('HTML inicial', () => {
  test.use({ javaScriptEnabled: false })
  test('uma única frase e o cadastro funcionam sem JavaScript', async ({ page }) => {
    await page.goto('/')
    const title = await checkHeading(page)
    await expect(title).toBeVisible()
    for (const line of await title.locator('[data-title-line]').all()) {
      await expect(line).toHaveCSS('opacity', '1')
    }
    await primaryLink(page).click()
    await expect(page).toHaveURL(/\/register$/)
  })
})

test('a cena de memória responde ao scroll depois de sair, voltar e avançar', async ({ page }) => {
  await page.goto('/')
  const mark = page.locator('#memory-title [data-mark]')
  const paint = () => mark.evaluate(el => el.style.getPropertyValue('--paint'))
  async function checkScene() {
    await checkHeading(page)
    await expect.poll(paint).toBe('0')
    await mark.evaluate(el => {
      const section = el.closest('section')!
      window.scrollTo({ top: scrollY + section.getBoundingClientRect().bottom, behavior: 'instant' })
    })
    await expect.poll(paint).toBe('1')
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await expect.poll(paint).toBe('0')
  }

  await checkScene()
  await primaryLink(page).click()
  await expect(page).toHaveURL(/\/register$/)
  await expect(mark).toHaveCount(0)
  await page.goBack()
  await checkScene()
  await page.goForward()
  await expect(page).toHaveURL(/\/register$/)
  await page.goBack()
  await checkScene()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect.poll(paint).toBe('')
  for (const target of await page.locator('#hero-title [data-title-line], #hero-title [data-hero-keyword]').all()) {
    await expect(target).toHaveCSS('transform', 'none')
  }
})

test('o título espera pela aba visível no modo leve', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 2 })
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
  })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/#hero-title')
  const letters = page.locator('[data-hero-letters] > span')
  await expect(page.locator('html')).toHaveClass(/kivora-landing-lite/)
  await expect(letters).toHaveCount(0)
  await page.evaluate(() => {
    Reflect.deleteProperty(document, 'hidden')
    document.dispatchEvent(new Event('visibilitychange'))
  })
  await expect(letters.first()).toBeAttached()
  await expect(letters).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(letters).toHaveCount(0)
  await checkHeading(page)
})

test('o título continua se movendo após a entrada sem botões de controle', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/#hero-title')
  await expect(page.locator('[data-hero-copy] button')).toHaveCount(0)
  const word = page.locator('[data-hero-keyword]')
  const width = () => word.evaluate(el => el.getBoundingClientRect().width)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(word).toHaveCSS('transform', 'none')
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  const resting = await width()
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await expect(page.locator('[data-hero-letters] > span').first()).toBeAttached()
  await expect(page.locator('[data-hero-letters] > span')).toHaveCount(0)
  for (let cycle = 0; cycle < 2; cycle++) {
    await expect.poll(width).toBeGreaterThan(resting * 1.06)
    await expect.poll(width).toBeCloseTo(resting, 0)
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(word).toHaveCSS('transform', 'none')
})
