import { expect, test, type Locator, type Page } from '@playwright/test'
import { assertNoHorizontalOverflow } from './support/layout'

const headline = 'Seu inglês. Um mundo mais aberto.'
const lines = ['Seu inglês.', 'Um mundo', 'mais aberto.']

function primaryLink(page: Page) {
  return page.locator('[data-hero-copy]').getByRole('link', { name: 'Começar grátis', exact: true })
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

test('o cartão mantém a escala desde o primeiro quadro', async ({ page }) => {
  await page.addInitScript(() => {
    const sample = () => {
      const art = document.querySelector('[data-hero-art]')
      if (art) {
        const transform = getComputedStyle(art).transform
        const matrix = transform === 'none' ? new DOMMatrix() : new DOMMatrix(transform)
        if (matrix.a !== 1 || matrix.d !== 1) art.setAttribute('data-scaled', '')
      }
      if (performance.now() < 3500) requestAnimationFrame(sample)
    }
    requestAnimationFrame(sample)
  })
  await page.goto('/')
  await expect(page.getByText('Is this seat taken?')).toBeVisible()
  await page.waitForFunction(() => performance.now() >= 3500)
  await expect(page.locator('[data-hero-art][data-scaled]')).toHaveCount(0)
  await assertNoHorizontalOverflow(page, 'hero')
})

for (const activation of ['click', 'Enter', 'Space'] as const) {
  test(`o flashcard revela a tradução uma vez com ${activation}`, async ({ page, hasTouch }) => {
    await page.goto('/')
    const card = page.getByRole('button', { name: 'Revelar tradução' })
    await expect(card).toHaveAttribute('aria-pressed', 'false')
    await expect(card).toHaveAccessibleDescription('Is this seat taken?')
    await expect(card.getByText('Este lugar está ocupado?')).toHaveCount(0)
    if (activation === 'click') {
      if (hasTouch) await card.tap()
      else await card.click()
    } else {
      await card.focus()
      await card.press(activation)
    }
    await expect(card).toHaveAccessibleDescription('Este lugar está ocupado?')
    await expect(card).toHaveAttribute('aria-pressed', 'true')
    await expect(card).toBeDisabled()
    await expect(card).toHaveCSS('transform', 'none')
    await card.press('Enter')
    await expect(card.getByText('Este lugar está ocupado?')).toBeVisible()
  })
}

test('movimento reduzido revela a tradução com fade, sem girar o cartão', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const card = page.getByRole('button', { name: 'Revelar tradução' })
  const samples = await card.evaluate(async (button: HTMLButtonElement) => {
    const frames = []
    button.click()
    const start = performance.now()
    do {
      await new Promise(requestAnimationFrame)
      const { opacity, transform } = getComputedStyle(button)
      frames.push({ opacity: Number(opacity), transform })
    } while (performance.now() - start < 500)
    return frames
  })
  expect(samples.some(frame => frame.opacity < 1)).toBe(true)
  expect(samples.every(frame => frame.transform === 'none')).toBe(true)
  await expect(card).toHaveAccessibleDescription('Este lugar está ocupado?')
})

test('o CTA flutuante aparece apenas depois do hero no celular', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'CTA flutuante mobile')
  await page.goto('/')
  const dock = page.locator('[data-hero-dock]')
  await expect(primaryLink(page)).toBeInViewport()
  await expect(dock).toBeHidden()
  await page.locator('#como-funciona').scrollIntoViewIfNeeded()
  await expect(dock).toBeVisible()
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await expect(dock).toBeHidden()
})

test('o brilho pausa fora da tela e respeita movimento reduzido', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 })
    Object.defineProperty(navigator, 'deviceMemory', { value: 8 })
    Object.defineProperty(navigator, 'connection', { value: undefined })
  })
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const glint = page.locator('[data-hero-glint]')
  const matrix = () => glint.evaluate(el => getComputedStyle(el).transform)
  const first = await matrix()
  await expect.poll(matrix).not.toBe(first)
  await page.locator('#como-funciona').scrollIntoViewIfNeeded()
  await expect(glint).not.toBeInViewport()
  await page.waitForTimeout(120)
  const paused = await matrix()
  await page.waitForTimeout(300)
  expect(await matrix()).toBe(paused)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(glint).toHaveCSS('transform', 'none')
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
  const emphasis = title.locator('[data-hero-keyword]')
  await expect(emphasis).toHaveCSS('font-style', 'italic')
  expect(await emphasis.evaluate(el => getComputedStyle(el).fontSynthesis)).toContain('style')
  const widths = isMobile ? [360, 375, 390, 402, 430] : [768, 834, 1440, 2560]
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
    for (const word of await title.locator('[data-title-word]').all()) {
      await expect(word).toHaveCSS('opacity', '1')
      await expect(word).toHaveCSS('transform', 'none')
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
  for (const target of await page.locator('#hero-title [data-title-word]').all()) {
    await expect(target).toHaveCSS('transform', 'none')
  }
})

test('o título aparece estático com movimento reduzido', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const title = await checkHeading(page)
  await expect(page.locator('script[data-hero-reveal]')).toHaveCount(0)
  for (const word of await title.locator('[data-title-word]').all()) {
    await expect(word).toHaveCSS('opacity', '1')
    await expect(word).toHaveCSS('transform', 'none')
  }
})

test('o título fica legível quando os chunks falham', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.route('**/_next/static/**/*.js', route => route.abort())
  await page.goto('/')
  const title = await checkHeading(page)
  await expect(page.locator('script[data-hero-reveal]')).toHaveCount(0, { timeout: 3000 })
  for (const word of await title.locator('[data-title-word]').all()) {
    await expect(word).toHaveCSS('opacity', '1')
    await expect(word).toHaveCSS('transform', 'none')
  }
})

test('o título revela as palavras uma vez e fica estável, sem controles', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  const chunks = Promise.withResolvers<void>()
  await page.route('**/_next/static/**/*.js', async route => {
    await chunks.promise
    await route.continue()
  })
  const title = page.locator('#hero-title')
  const words = title.locator('[data-title-word]')
  try {
    await page.goto('/', { waitUntil: 'commit' })
    await expect(words).toHaveCount(6)
    await expect(words.first()).toHaveCSS('opacity', '0')
  } finally {
    chunks.resolve()
  }
  await expect(words.first()).not.toHaveCSS('transform', 'none')
  await expect(page.locator('[data-hero-copy] button')).toHaveCount(0)
  const wordStyles = () => words.evaluateAll(elements => elements.map(element => {
    const { transform, opacity } = getComputedStyle(element)
    return { transform, opacity }
  }))
  await page.waitForFunction(() => performance.now() >= 3000)
  const resting = await wordStyles()
  expect(resting).toEqual(Array(6).fill({ transform: 'none', opacity: '1' }))
  await title.evaluate(element => {
    const observer = new MutationObserver(() => {
      element.setAttribute('data-test-title-replayed', '')
      observer.disconnect()
    })
    observer.observe(element, { attributes: true, attributeFilter: ['style'], subtree: true })
    window.scrollTo({ top: innerHeight * 2, behavior: 'instant' })
  })
  const viewport = page.viewportSize()!
  await page.setViewportSize({ ...viewport, width: viewport.width + 10 })
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.waitForFunction(() => performance.now() >= 6000)
  expect(await wordStyles()).toEqual(resting)
  await expect(page.locator('#hero-title[data-test-title-replayed]')).toHaveCount(0)
  await checkHeading(page)
  const selected = await title.evaluate(element => {
    const range = document.createRange()
    range.selectNodeContents(element)
    const selection = window.getSelection()!
    selection.addRange(range)
    const text = selection.toString().replace(/\s+/g, ' ').trim()
    selection.removeAllRanges()
    return text
  })
  expect(selected).toBe(headline)
})
