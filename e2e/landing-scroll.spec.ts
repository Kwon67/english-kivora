import { expect, test, type Locator, type Page } from '@playwright/test'

function usesSmoothScroll(page: Page) {
  return page.evaluate(() => matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)').matches)
}

function anchorOffset(section: Locator) {
  return section.evaluate(el => Math.abs(el.getBoundingClientRect().top - parseFloat(getComputedStyle(el).scrollMarginTop)))
}

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
  await page.goto('/')
  await expect(page.locator('html')).toHaveClass(/kivora-landing-scroll/)
})

test('âncora, margem, histórico e retorno à landing', async ({ page }) => {
  const html = page.locator('html')
  if (await usesSmoothScroll(page)) await expect(html).toHaveClass(/\blenis\b/)
  else await expect(html).not.toHaveClass(/\blenis\b/)
  await page.locator('a[href="#seu-caminho"]:visible').first().click()
  const section = page.locator('#seu-caminho')
  await expect(page).toHaveURL(/#seu-caminho$/)
  await expect.poll(() => anchorOffset(section)).toBeLessThan(3)
  if (await usesSmoothScroll(page)) await expect(section).toBeFocused()
  await page.goBack()
  await expect(page).toHaveURL(/\/$/)
  await page.goForward()
  await expect(page).toHaveURL(/#seu-caminho$/)
  await page.locator('footer a[href="/terms"]').click()
  await expect(html).not.toHaveClass(/kivora-landing-scroll|\blenis\b/)
  await page.goBack()
  await expect(html).toHaveClass(/kivora-landing-scroll/)
})

test('menu estreito protege a rolagem e devolve foco e navegação', async ({ page }) => {
  await page.setViewportSize({ width: 800, height: 450 })
  const button = page.getByRole('button', { name: 'Abrir menu' })
  await button.click()
  const dialog = page.locator('dialog[open][data-lenis-prevent]')
  await expect(dialog).toBeVisible()
  if (await usesSmoothScroll(page)) await expect(page.locator('html')).toHaveClass(/lenis-stopped/)
  await dialog.evaluate(el => { el.scrollTop = 200 })
  expect(await page.evaluate(() => window.scrollY)).toBe(0)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(button).toBeFocused()
  await button.click()
  await dialog.locator('a[href="#faq"]').click()
  await expect(page).toHaveURL(/#faq$/)
  await expect(page.locator('html')).not.toHaveClass(/lenis-stopped/)
  await expect.poll(() => anchorOffset(page.locator('#faq'))).toBeLessThan(4)
})

test('movimento reduzido preserva teclado e FAQ nativos', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('html')).not.toHaveClass(/\blenis\b/)
  const item = page.locator('#faq details').first()
  await item.locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(item).toHaveAttribute('open', '')
  await page.keyboard.press('Enter')
  await expect(item).not.toHaveAttribute('open', '')
})

test('reativar animações numa visita direta ao FAQ mantém a página utilizável', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  // The shared setup visits /. Force a new document at the anchor for hydration.
  await page.goto('/#faq')
  await page.reload()
  const faq = page.locator('#faq')
  const paint = () => page.evaluate(() =>
    document.querySelector<HTMLElement>('#memory-title [data-mark]')?.style.getPropertyValue('--paint'))
  await expect(faq).toBeInViewport()
  await expect.poll(paint).toBe('1')
  // The ranking sits above the FAQ. Wait for its entry to settle before toggling.
  await expect(page.locator('[data-ranking] li').last()).toHaveCSS('transform', 'none')
  for (let toggle = 0; toggle < 2; toggle++) {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect.poll(paint).toBe('')
    await page.evaluate(() => new Promise<void>(done => requestAnimationFrame(() => requestAnimationFrame(() => done()))))
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect.poll(async () => ({ paint: await paint(), errors })).toEqual({ paint: '1', errors: [] })
  }
  const item = faq.locator('details').first()
  await item.locator('summary').focus()
  await page.keyboard.press('Enter')
  await expect(item).toHaveAttribute('open', '')
  expect(errors).toEqual([])
})

test('títulos mantêm suas linhas ao recarregar e rolar no celular', async ({ page, hasTouch }) => {
  test.skip(!hasTouch, 'O efeito por linha pertence aos dispositivos com ponteiro fino.')
  const ids = ['practice-title', 'blitz-title', 'pricing-title', 'faq-title']
  // At an anchored reload, the section can start in view before hydration.
  await page.goto('/#como-funciona')
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/kivora-landing-scroll/)
  await page.evaluate(() => document.fonts.ready.then(() => undefined))

  for (const width of [390, 320, 430]) {
    await page.setViewportSize({ width, height: 844 })
    const problems = await page.evaluate(async headingIds => {
      const issues = new Set<string>()
      const nextFrame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      for (const id of headingIds) {
        const heading = document.getElementById(id)!
        const ink = heading.querySelector<HTMLElement>('[data-title-ink]')!
        heading.scrollIntoView({ block: 'center', behavior: 'instant' })
        const initialHeight = ink.offsetHeight
        for (let frame = 0; frame < 12; frame++) {
          await nextFrame()
          if (heading.children.length !== 1 || getComputedStyle(ink).opacity !== '1') issues.add(id + ' trocou o texto por uma cópia')
          if (ink.offsetHeight !== initialHeight) issues.add(id + ' mudou a altura durante o scroll')
        }
      }
      const heading = document.getElementById('faq-title')!
      const doodle = heading.nextElementSibling!
      if (heading.getBoundingClientRect().bottom > doodle.getBoundingClientRect().top) issues.add('ilustração do FAQ invadiu a faixa do título')
      const practice = document.getElementById('practice-title')!
      const ornament = practice.closest('section')!.querySelector('[data-journey-prop]')!
      if (practice.getBoundingClientRect().bottom > ornament.getBoundingClientRect().top) issues.add('ornamento da prática invadiu a faixa do título')
      return [...issues]
    }, ids)
    expect(problems, width + ' px').toEqual([])
  }
})

test('as três cenas trocam os ornamentos estáticos pela mesma arte em movimento', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { value: 8 })
    Object.defineProperty(navigator, 'deviceMemory', { value: 8 })
    Object.defineProperty(navigator, 'connection', { value: undefined })
  })
  const scenes = ['discovery', 'memory', 'conversation'] as const
  const gates = new Map(scenes.map(name => [name, Promise.withResolvers<void>()]))
  for (const [name, gate] of gates) {
    await page.route(`**/${name}-illustrated.riv`, async route => {
      await gate.promise
      await route.continue()
    })
  }
  await page.goto('/')

  try {
    for (const [name, gate] of gates) {
      const scene = page.locator(`[data-art-scene="${name}"]`)
      const ornaments = scene.locator('[data-depth-ornaments]')
      const poster = scene.locator('picture img').first()
      await scene.evaluate(el => el.scrollIntoView({ block: 'center', behavior: 'instant' }))
      await expect(scene.locator('[data-rive-ready=false]')).toHaveCount(1)
      await expect(ornaments).toBeVisible()
      await expect(poster).toHaveCSS('clip-path', 'none')
      await expect.poll(() => ornaments.locator('img').evaluateAll(images =>
        images.every(image => image instanceof HTMLImageElement && image.complete && image.naturalWidth > 0))).toBe(true)

      if (name === 'memory') {
        const sunflower = await ornaments.locator('img[src*="/sunflower-grounded."]').boundingBox()
        const ground = await ornaments.boundingBox()
        const label = await page.getByText('remember', { exact: true }).boundingBox()
        expect(sunflower).not.toBeNull()
        expect(ground).not.toBeNull()
        expect(label).not.toBeNull()
        expect(Math.abs(sunflower!.y + sunflower!.height - (ground!.y + ground!.height))).toBeLessThan(6)
        expect(sunflower!.y + sunflower!.height).toBeLessThan(label!.y)
        await expect(scene.locator('img[src*="/dots."]')).toHaveCount(0)
      }

      gate.resolve()
      const canvas = scene.locator('[data-rive-ready=true] canvas')
      await expect(canvas).toBeVisible({ timeout: 15_000 })
      await expect(ornaments).toBeHidden()
      await expect(poster).toBeVisible()
      const frame = () => canvas.evaluate((element, memory) => {
        const surface = element as HTMLCanvasElement
        const context = surface.getContext('2d')!
        const left = memory ? Math.floor(surface.width * .82) : 0
        const top = memory ? Math.floor(surface.height * .62) : 0
        const pixels = context.getImageData(left, top, surface.width - left, surface.height - top).data
        let yellow = 0, grass = 0, hash = 0
        for (let i = 0; i < pixels.length; i += 4) {
          if (pixels[i + 3] < 200) continue
          const [r, g, b] = [pixels[i], pixels[i + 1], pixels[i + 2]]
          if (r > 220 && g > 190 && b < 70) yellow++
          if (r > 100 && r < 180 && g > 190 && b < 140) grass++
          hash = (hash * 31 + i + r + g + b) | 0
        }
        return { yellow, grass, hash }
      }, name === 'memory')
      await expect.poll(async () => (await frame()).hash).not.toBe(0)
      const initial = await frame()
      await expect.poll(async () => (await frame()).hash).not.toBe(initial.hash)
      if (name === 'memory') {
        expect(initial.yellow).toBeGreaterThan(0)
        expect(initial.grass).toBeGreaterThan(0)
      }
    }
  } finally {
    for (const gate of gates.values()) gate.resolve()
  }

  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(page.locator('[data-art-scene] canvas')).toHaveCount(0)
  for (const ornaments of await page.locator('[data-depth-ornaments]').all()) await expect(ornaments).toBeVisible()
})
