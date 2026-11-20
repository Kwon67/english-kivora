import sharp from 'sharp'
import { auditStaticRibbonScroll, showRibbonReference } from '../scripts/ribbon-state.mjs'
import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin
  await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort())
})

type Segment = {
  d: string
  width: number
  dash: string
  scaleX: number
  scaleY: number
  endX: number
  endY: number
}

// Isolate the real segment from the cards and crop around its endpoint. This also
// makes the part of the final curve beyond the footer observable in all engines.
async function measureInk(segment: Segment) {
  const { d, width, dash, scaleX, scaleY, endX, endY } = segment
  const size = Math.ceil(width) + 40
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!
  const transform = `matrix(${scaleX} 0 0 ${scaleY} ${size / 2 - endX * scaleX} ${size / 2 - endY * scaleY})`

  async function ink(array: string, offset: number) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
      <path d="${d}" transform="${transform}" fill="none" vector-effect="non-scaling-stroke"
        stroke="black" stroke-width="${width}" stroke-linecap="round" stroke-dasharray="${array}"
        stroke-dashoffset="${offset}"/></svg>`
    const image = new Image()
    image.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
    await image.decode()
    ctx.clearRect(0, 0, size, size)
    ctx.drawImage(image, 0, 0)
    const pixels = ctx.getImageData(0, 0, size, size).data
    let area = 0
    for (let i = 3; i < pixels.length; i += 4) area += pixels[i] / 255
    return area
  }

  const forward = []
  for (const remaining of [8, 4, 0, 4, 8]) forward.push(await ink(dash, remaining))
  const length = parseFloat(dash)
  return {
    areas: forward,
    solid: await ink('none', 0),
    start: await ink(dash, length - 0.5),
    startReference: await ink('0.5 100000', 0),
  }
}

test('every ribbon segment paints and retracts its final eight CSS pixels', async ({ page }) => {
  test.skip(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), 'Projected dash renderer uses a fine pointer')
  test.setTimeout(120_000)
  // Move the journey below the fold in the test so even the hero's first
  // segment can go all the way back to its hidden state.
  await page.addInitScript(() => {
    document.addEventListener('DOMContentLoaded', () => {
      const journey = document.querySelector<HTMLElement>('[data-ribbon-journey]')
      if (journey) journey.style.marginTop = '150vh'
      window.dispatchEvent(new Event('resize'))
    })
  })
  await page.goto('/')
  const ribbon = page.locator('svg:is([data-ribbon-mobile],[data-ribbon-desktop]):visible')
  await expect(ribbon.locator('path[visibility="hidden"][vector-effect]').first()).toBeAttached()
  await page.evaluate(() => document.fonts.ready)

  const results = await ribbon.evaluate(async element => {
    const svg = element as SVGSVGElement
    const paths = Array.from(svg.querySelectorAll<SVGPathElement>('path[vector-effect]:not([data-ribbon-path])'))
    const matrix = svg.getScreenCTM()!
    const samples = paths.map(() => ({ dash: '', down: [] as number[], up: [] as number[] }))
    const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
    async function move(y: number, direction: 'down' | 'up') {
      scrollTo({ top: y, behavior: 'instant' })
      await frame()
      for (const [i, path] of paths.entries()) {
        if (!path.style.strokeDasharray) continue
        samples[i].dash = path.style.strokeDasharray
        samples[i][direction].push(parseFloat(path.style.strokeDashoffset))
      }
    }
    const end = document.documentElement.scrollHeight - innerHeight
    for (let y = 0; y < end; y += 12) await move(y, 'down')
    await move(end, 'down')
    const settled = () => new Promise(resolve => setTimeout(resolve, 300))
    await settled()
    const complete = paths.every(p => p.getAttribute('visibility') === 'visible' && !p.style.strokeDasharray)
    for (let y = end; y > 0; y -= 12) await move(y, 'up')
    await move(0, 'up')
    await settled()
    const hidden = paths.every(p => p.getAttribute('visibility') === 'hidden')
    return { complete, hidden, segments: paths.map((p, i) => {
      const point = p.getPointAtLength(p.getTotalLength())
      return {
        d: p.getAttribute('d')!, width: Number(p.getAttribute('stroke-width')),
        scaleX: matrix.a, scaleY: matrix.d, endX: point.x, endY: point.y, ...samples[i],
      }
    }) }
  })

  expect(results.complete).toBe(true)
  expect(results.hidden).toBe(true)
  expect(results.segments.length).toBeGreaterThan(1)
  for (const [i, segment] of results.segments.entries()) {
    await test.step(`segment ${i + 1}`, async () => {
      expect(segment.down[0]).toBeGreaterThan(segment.down[segment.down.length - 1])
      expect(segment.up[0]).toBeLessThan(segment.up[segment.up.length - 1])
      const { areas, solid, start, startReference } = await page.evaluate(measureInk, segment)
      // The tip must add visible ink in BOTH halves of the last 8px.
      expect(areas[1] - areas[0]).toBeGreaterThan(1)
      expect(areas[2] - areas[1]).toBeGreaterThan(1)
      expect(areas.slice(3)).toEqual([areas[1], areas[0]])
      // Allow subpixel rasterization where the solid cap meets the dashed cap.
      expect(Math.abs(areas[2] - solid)).toBeLessThan(segment.width * 0.5)
      expect(Math.abs(start - startReference)).toBeLessThan(segment.width * 0.5)
    })
  }
})

test('opening the FAQ and changing breakpoint remeasure the active dash', async ({ page }) => {
  test.skip(await page.evaluate(() => matchMedia('(pointer: coarse)').matches), 'Projected dash renderer uses a fine pointer')
  await page.goto('/')
  const ribbon = page.locator('svg:is([data-ribbon-mobile],[data-ribbon-desktop]):visible')
  const summary = page.locator('#faq summary').first()
  await summary.scrollIntoViewIfNeeded()
  await expect(ribbon).toHaveAttribute('viewBox', /./)
  const initial = await ribbon.getAttribute('viewBox')

  async function verifyNewGeometry(previous: string | null) {
    await expect(ribbon).not.toHaveAttribute('viewBox', previous!)
    // Compare the live dash to an independent screen-space measurement from
    // the browser's Bézier evaluator after the ResizeObserver has rebuilt it.
    await expect.poll(() => ribbon.evaluate(element => {
      const path = Array.from(element.querySelectorAll<SVGPathElement>('path[vector-effect]'))
        .find(p => p.style.strokeDasharray)
      if (!path) return Infinity
      const transform = path.getScreenCTM()!
      const length = path.getTotalLength()
      let previous = path.getPointAtLength(0).matrixTransform(transform)
      let projected = 0
      for (let i = 1; i <= 256; i++) {
        const point = path.getPointAtLength(length * i / 256).matrixTransform(transform)
        projected += Math.hypot(point.x - previous.x, point.y - previous.y)
        previous = point
      }
      return Math.abs(projected - parseFloat(path.style.strokeDasharray))
    })).toBeLessThan(0.5)
    return ribbon.getAttribute('viewBox')
  }

  await summary.click()
  const expanded = await verifyNewGeometry(initial)
  const width = page.viewportSize()!.width < 768 ? 960 : 390
  await page.setViewportSize({ width, height: 844 })
  await summary.scrollIntoViewIfNeeded()
  const resized = await verifyNewGeometry(expanded)
  await summary.click()
  await verifyNewGeometry(resized)
})

test.describe('touch SVG', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!await page.evaluate(() => matchMedia('(pointer: coarse)').matches), 'Touch renderer')
    await page.goto('/')
    await expect(page.locator('[data-ribbon-mobile] [data-ribbon-clip]').first()).toBeAttached()
    await page.evaluate(() => document.fonts.ready)
  })

  test('the entire static path stays anchored with zero ribbon mutations in both directions', async ({ page }) => {
    const state = await page.evaluate(auditStaticRibbonScroll)
    expect(state).toMatchObject({
      mutations: 0, samples: 11, position: 'absolute', canvas: 0,
      strokes: 1, visibility: 'visible', strokeDasharray: 'none', strokeDashoffset: '0px',
    })
    expect(state.drift).toBeLessThan(.01)
    expect(state.clips).toBeGreaterThan(0)
  })

  test('static ink matches the SVG reference at cards, demo, FAQ and after rotation', async ({ page }) => {
    test.setTimeout(90_000)
    // Isolate ink and retain the real clearance geometry behind the foreground.
    await page.addStyleTag({ content: '[data-ribbon-journey] > main,[data-ribbon-journey] > footer {visibility:hidden} [data-ribbon-journey] path[vector-effect] {stroke:#ff00ff!important}' })
    const summary = page.locator('#faq summary').first()
    const capture = async () => sharp(await page.screenshot({ scale: 'css' })).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    const compare = async (selector: string) => {
      await page.locator(selector).first().evaluate(el => scrollTo({ top: scrollY + el.getBoundingClientRect().top - innerHeight * .3, behavior: 'instant' }))
      await page.evaluate(async () => { for (let i = 0; i < 3; i++) await new Promise(requestAnimationFrame) })
      const actual = await capture()
      const restore = await showRibbonReference(page)
      let oracle
      try { oracle = await capture() } finally { await restore() }
      let refInk = 0, misplaced = 0
      const width = actual.info.width, height = actual.info.height
      const ink = (data: Buffer, x: number, y: number) => {
        if (x < 0 || x >= width || y < 0 || y >= height) return false
        const i = (y * width + x) * 3
        return data[i] > 230 && data[i+1] < 45 && data[i+2] > 230
      }
      // The SVG mask and clip paths can quantize an antialiased
      // boundary differently. Compare ink silhouettes within one CSS pixel.
      const near = (data: Buffer, x: number, y: number) =>
        ink(data, x-1, y) || ink(data, x+1, y) || ink(data, x, y-1) || ink(data, x, y+1)
      for (let i = 0; i < actual.data.length; i += 3) {
        const x = (i / 3) % width, y = Math.floor(i / (3 * width))
        const expected = ink(oracle.data, x, y), rendered = ink(actual.data, x, y)
        if (expected) refInk++
        if (expected !== rendered && !near(expected ? actual.data : oracle.data, x, y)) misplaced++
      }
      expect(refInk, selector).toBeGreaterThan(100)
      expect(misplaced, selector).toBeLessThanOrEqual(8)
    }
    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport)
      const viewBox = page.locator(viewport.width < 768 ? '[data-ribbon-mobile]' : '[data-ribbon-desktop]')
      await expect(viewBox.locator('[data-ribbon-clip]').first()).toBeAttached()
      for (const selector of ['#seu-caminho button', '#como-funciona', '#practice-demo', '#faq', 'footer']) await compare(selector)
      const before = await viewBox.getAttribute('viewBox')
      await summary.evaluate(el => (el as HTMLElement).click())
      await expect(viewBox).not.toHaveAttribute('viewBox', before!)
      await compare('#faq')
      await summary.evaluate(el => (el as HTMLElement).click())
      await expect(viewBox).toHaveAttribute('viewBox', before!)
      await compare('#faq')
    }
  })
})
