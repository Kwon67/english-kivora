import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { expect, test } from '@playwright/test'
import { allowed, checkArtwork, readPaint, visitPaintStates } from './palette'

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

    test('paleta e ilustrações', async ({ page }) => {
      const cream = 'rgb(245, 244, 235)'
      await expect(page.locator('body')).toHaveCSS('background-color', cream)
      const hero = page.getByRole('region', { name: 'Seu inglês. Um mundo mais aberto.' })
      expect(await hero.evaluate(el => getComputedStyle(el, '::before').backgroundColor)).toBe(cream)
      const cta = hero.getByRole('link', { name: 'Começar grátis' })
      await expect(cta).toHaveCSS('background-color', 'rgb(32, 78, 84)')
      await expect(cta).toHaveCSS('color', 'rgb(255, 254, 248)')
      await expect(page.locator('footer')).toHaveCSS('background-color', cream)
      const violations = new Set<string>()
      await visitPaintStates(page, samples => samples.forEach(sample => {
        if (!allowed(sample.color)) violations.add(`#${sample.color} · ${sample.property} · ${sample.element}`)
      }))
      await checkArtwork(page)
      expect([...violations]).toEqual([])
      if (width === 390) {
        // Exercise the same browser sampling path with an intentional violation.
        const injected = await page.addStyleTag({ content: '#hero-title { color: #ff00ff !important }' })
        try {
          await expect(page.locator('#hero-title')).toHaveCSS('color', 'rgb(255, 0, 255)')
          expect((await readPaint(page)).filter(sample => !allowed(sample.color)).map(sample => sample.color)).toContain('ff00ff')
        } finally { await injected.evaluate(style => { style.parentNode?.removeChild(style) }) }
      }
    })
  })
}
