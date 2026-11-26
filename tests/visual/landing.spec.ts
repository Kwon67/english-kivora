import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { expect, test } from '@playwright/test'
import { allowed, checkArtwork, readPaint, visitPaintStates } from './palette'
import { makeTear, sheetD } from '../../src/components/ui/pushpin-tear-footer'

const directory = 'tests/visual'
for (const [width, height] of [[390, 844], [768, 1024], [1440, 900]]) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height } })
    test.beforeEach(async ({ page }) => {
      await page.goto('/')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Seu inglês.')
      await page.evaluate(async () => {
        await document.fonts.ready
        await Promise.all(Array.from(document.images, async image => {
          image.loading = 'eager'
          await image.decode()
        }))
      })
    })
    test('antes e depois', async ({ page }) => {
      await mkdir(join(directory, 'after'), { recursive: true })
      await mkdir(join(directory, 'comparison'), { recursive: true })
      const name = `landing-${width}.png`
      const before = join(directory, 'baseline', name)
      const after = join(directory, 'after', name)
      await page.screenshot({ path: after, fullPage: true, animations: 'disabled' })
      const [old, current] = await Promise.all([sharp(before).metadata(), sharp(after).metadata()])
      expect(current.width).toBe(width)
      const gap = 16, header = 48
      const label = Buffer.from(`<svg width="${width * 2 + gap}" height="${header}"><g fill="#2c2e2a" font-family="Arial" font-size="20"><text x="12" y="31">Antes · ${width} px</text><text x="${width + gap + 12}" y="31">Depois · ${width} px</text></g></svg>`)
      await sharp({ create: { width: width * 2 + gap, height: header + Math.max(old.height!, current.height!), channels: 3, background: '#f5f4eb' } })
        .composite([{ input: label, top: 0, left: 0 }, { input: before, left: 0, top: header }, { input: after, left: width + gap, top: header }])
        .png().toFile(join(directory, 'comparison', name))
    })

    test('rodapé rasgado, teclado e cadastro', async ({ page }) => {
      const poster = page.locator('footer#rodape')
      const surface = page.locator('[data-motion-surface]', { has: poster })
      await expect(poster).toHaveCSS('border-radius', '24px 24px 0px 0px')
      await expect(surface).toHaveCSS('opacity', '1')
      await poster.scrollIntoViewIfNeeded()
      await expect(surface).toHaveCSS('transform', 'none')
      await expect(poster).toHaveClass(/\bs3\b/)
      const pin = poster.getByRole('button', { name: /Puxar o alfinete/ })
      const ridge = poster.locator('.tpf-rim')
      await expect(ridge).toHaveAttribute('d', /^M/)
      const previous = await ridge.getAttribute('d')
      await pin.focus()
      await page.keyboard.press('Enter')
      await expect(ridge).not.toHaveAttribute('d', previous!)
      await expect(poster.locator('.tpf-drop')).toHaveCSS('animation-name', 'none')

      for (const link of ['Privacidade', 'Termos de uso', 'Voltar ao início']) {
        await expect(poster.getByRole('link', { name: link, exact: true })).toBeVisible()
      }
      await poster.getByRole('link', { name: 'Voltar ao início' }).click()
      await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThan(5)

      const email = 'estudante+rodape@example.org'
      await poster.getByRole('textbox', { name: 'Comece seu cadastro gratuito' }).fill(email)
      await poster.getByRole('button', { name: 'Continuar para o cadastro' }).click()
      await expect(page).toHaveURL(url => url.pathname === '/register' && !url.search)
      await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toHaveValue(email)
      await page.goBack()
      await expect(poster.getByRole('textbox')).toBeEditable()
    })

    test('queda do alfinete, novo rasgo e contato', async ({ page, context }, testInfo) => {
      await page.emulateMedia({ reducedMotion: 'no-preference' })
      const poster = page.locator('footer#rodape')
      const surface = page.locator('[data-motion-surface]', { has: poster })
      const ridge = poster.locator('.tpf-rim')
      const pin = poster.getByRole('button', { name: /Puxar o alfinete/ })
      await expect(surface).toHaveCSS('opacity', '0')
      await poster.scrollIntoViewIfNeeded()
      await expect(poster).toHaveClass(/\bs2\b/)
      await expect(surface).toHaveCSS('opacity', '1')
      await expect(surface).toHaveCSS('transform', 'none')
      await expect(poster.locator('.tpf-drop')).toHaveCSS('animation-name', 'tpf-drop')
      const [w, h] = await poster.evaluate(el => [el.clientWidth, el.clientHeight])
      await expect(ridge).toHaveAttribute('d', sheetD(makeTear(23).ys, w, h))
      await expect(poster.locator('.tpf-word span')).toBeVisible()
      await expect.poll(() => poster.evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true)
      const overlaps = await poster.evaluate(el => {
        const collides = (a: Element, b: Element) => {
          const x = a.getBoundingClientRect(), y = b.getBoundingClientRect()
          return x.width > 0 && x.left < y.right && x.right > y.left && x.top < y.bottom && x.bottom > y.top
        }
        return [...el.querySelectorAll('.tpf-side, .tpf-flank')]
          .filter(item => collides(item, el.querySelector(item.matches('.tpf-side') ? '.tpf-brand' : '.tpf-news')!))
          .map(item => item.textContent)
      })
      expect(overlaps).toEqual([])
      await poster.screenshot({ path: testInfo.outputPath('rodape-' + width + '.png') })

      await pin.click()
      await expect(pin).toHaveAttribute('data-pin', 'lift')
      await expect(pin).toHaveAttribute('data-pin', 'stab')
      await expect(ridge).toHaveAttribute('d', sheetD(makeTear(24).ys, w, h))
      await expect(pin).toHaveAttribute('data-pin', 'idle')

      await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(page.url()).origin })
      await poster.getByRole('button', { name: /Copiar e-mail/ }).click()
      await expect(poster.getByRole('status')).toHaveText('E-mail copiado')
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('kivora.dev@outlook.com')
    })

    test('paleta e ilustrações', async ({ page }) => {
      const cream = 'rgb(245, 241, 228)'
      await expect(page.locator('body')).toHaveCSS('background-color', cream)
      const hero = page.getByRole('region', { name: 'Seu inglês. Um mundo mais aberto.' })
      expect(await hero.evaluate(el => getComputedStyle(el, '::before').backgroundColor)).toBe(cream)
      const cta = hero.getByRole('link', { name: 'Começar grátis' })
      await expect(cta).toHaveCSS('background-color', 'rgb(44, 46, 42)')
      await expect(cta).toHaveCSS('color', 'rgb(255, 255, 255)')
      await expect(hero.locator('[data-hero-keyword]')).toHaveCSS('color', 'rgb(44, 46, 42)')
      await expect(hero.locator('figcaption button')).toHaveCSS('background-color', 'rgb(245, 226, 17)')
      for (const scene of ['#revisoes', '#conversacao']) {
        await expect(page.locator(scene).locator('[data-art-motion="illustration"]').first()).toHaveCSS('filter', 'none')
      }
      await expect(page.locator('footer')).toHaveCSS('background-color', 'rgb(255, 74, 28)')
      await expect(page.locator('footer .tpf-paper')).toHaveCSS('fill', 'rgb(241, 237, 228)')
      const violations = new Set<string>()
      await visitPaintStates(page, samples => samples.forEach(sample => {
        if (!allowed(sample.color, sample.inFooter)) violations.add(`#${sample.color} · ${sample.property} · ${sample.element}`)
      }))
      await checkArtwork(page)
      expect([...violations]).toEqual([])
      if (width === 390) {
        // Exercise the same browser sampling path with an intentional violation.
        const injected = await page.addStyleTag({ content: '#hero-title { color: #ff00ff !important }' })
        try {
          await expect(page.locator('#hero-title')).toHaveCSS('color', 'rgb(255, 0, 255)')
          expect((await readPaint(page)).filter(sample => !allowed(sample.color, sample.inFooter)).map(sample => sample.color)).toContain('ff00ff')
        } finally { await injected.evaluate(style => { style.parentNode?.removeChild(style) }) }
      }
    })
  })
}
