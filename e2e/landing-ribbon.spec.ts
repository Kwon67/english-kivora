import sharp from 'sharp'
import { showRibbonReference } from '../scripts/ribbon-state.mjs'
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

test.describe('touch ribbon', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(!await page.evaluate(() => matchMedia('(pointer: coarse)').matches), 'Touch renderer')
    await page.goto('/')
    await expect(page.locator('[data-ribbon-band="8"] svg')).toHaveAttribute('viewBox', /./)
    await page.evaluate(() => document.fonts.ready)
  })

  test('native reveal starts in the hero and reverses without JS writes', async ({ page }) => {
    const bands = page.locator('[data-ribbon-band]')
    await expect(bands).toHaveCount(9)
    expect(await page.evaluate(() => scrollY)).toBe(0)
    const result = await bands.evaluateAll(async elements => {
      const frame = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
      const writes: string[] = []
      const observer = new MutationObserver(records => writes.push(...records.map(r => r.type)))
      for (const el of elements) observer.observe(el, { attributes: true, childList: true, subtree: true })
      const read = (el: Element) => {
        const gate = el.querySelector('[data-ribbon-gate]')!, art = gate.firstElementChild!
        const a = new DOMMatrix(getComputedStyle(gate).transform).m42
        const b = new DOMMatrix(getComputedStyle(art).transform).m42
        const rect = el.getBoundingClientRect()
        return { error: Math.abs(a + b), bottom: rect.bottom + a, height: rect.height }
      }
      const sample = async (index: number) => {
        await frame(); await frame(); await frame()
        return read(elements[index])
      }
      const initial = await sample(0)
      const checks = []
      for (const index of [1, 2, 6, 1, 5, 2, 7, 1, 0]) {
        const el = elements[index]
        const middle = el.getBoundingClientRect().top + scrollY + el.clientHeight / 2 - innerHeight / 2
        for (const offset of [0, 0.5, 2, 1, 0]) {
          scrollTo({ top: middle + offset, behavior: 'instant' })
          checks.push(await sample(index))
        }
      }
      observer.disconnect()
      return { initial, checks, writes, focus: innerHeight / 2, dpr: devicePixelRatio }
    })
    expect(result.dpr).toBe(3)
    expect(result.writes).toEqual([])
    for (const sample of [result.initial, ...result.checks]) {
      expect(sample.error).toBeLessThan(0.1 / result.dpr)
      expect(Math.abs(sample.bottom - result.focus)).toBeLessThan(1)
    }
  })

  test('DPR 3 retains the continuous ink across seams, cards and rapid reversals', async ({ page }) => {
    test.setTimeout(120_000)
    const bands = page.locator('[data-ribbon-band]')
    // Distinguish the ribbon from the green section background. The cards,
    // text clearances, stacking order and the actual browser compositor stay live.
    await page.addStyleTag({ content: '[data-ribbon-journey] path[vector-effect="non-scaling-stroke"] {stroke:#ff00ff!important}' })
    const capture = async () => sharp(await page.screenshot({ scale: 'device' })).removeAlpha().raw().toBuffer({ resolveWithObject: true })
    const sample = async (y: number, top: number, bottom: number, settleForeground = false) => {
      await page.evaluate(async y => {
        scrollTo({ top: y, behavior: 'instant' })
        await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))
      }, y)
      if (settleForeground) await page.waitForTimeout(800)
      const actual = await capture()
      const restore = await showRibbonReference(page)
      let reference
      try { reference = await capture() } finally { await restore() }
      const isInk = (p: Buffer, i: number) => p[i] > 225 && p[i+1] < 45 && p[i+2] > 225
      let ink = 0
      for (let row = Math.round(top * 3); row < Math.round(bottom * 3); row++) {
        let missing = 0, extra = 0
        for (let x = 0; x < actual.info.width; x++) {
          const i = (row * actual.info.width + x) * 3
          const a = isInk(actual.data, i), b = isInk(reference.data, i)
          if (b) ink++
          if (a && !b) extra++
          if (b && !a) missing++
          // A lightly translucent scanline inside otherwise solid ink is also
          // a seam, even when it still passes the magenta classification.
          if (a && b && reference.data[i + 1] === 0 && actual.data[i + 1] > 8) missing++
        }
        // A cropped scanline cannot lose a strip of ink. Permit edge AA
        // differences at the two sides of the stroke or a rounded clearance.
        if (Math.max(missing, extra) > 8) {
          for (const [label, shot] of [['tiled', actual], ['reference', reference]] as const) {
            await test.info().attach(label, { body: await sharp(shot.data, { raw: shot.info }).png().toBuffer(), contentType: 'image/png' })
          }
        }
        expect(Math.max(missing, extra), `scroll ${y}, device row ${row}`).toBeLessThanOrEqual(8)
      }
      return ink
    }
    for (const viewport of [{ width: 390, height: 844 }, { width: 844, height: 390 }]) {
      await page.setViewportSize(viewport)
      const narrow = viewport.width < 768
      await expect(bands.first().locator('svg')).toHaveAttribute('viewBox', narrow ? /^0 -?[\d.]+ 390 / : /^0 -?[\d.]+ 1440 /)
      const half = viewport.height / 2
      await sample(0, half - 22, half - 2)
      const edges = await bands.evaluateAll(els => els.slice(1).map(el => el.getBoundingClientRect().top + scrollY))
      const row = Math.round(half - 45)
      for (const edge of [...edges, edges[1], edges[0], edges.at(-1)!]) {
        await sample(Math.round(edge - row), row - 3, row + 3, true)
      }
      // Isolate the ribbon for the same reference check behind opaque cards.
      const hideCards = await page.addStyleTag({ content: '[data-ribbon-journey] > main, [data-ribbon-journey] > footer {visibility:hidden}' })
      if (narrow) expect(await sample(0, half - 22, half - 2)).toBeGreaterThan(0)
      for (const edge of edges) await sample(Math.round(edge - row), row - 3, row + 3)
      const entry = edges[0] - row
      for (const delta of [0, 0.5, 1, 0.5, 0]) {
        const ink = await sample(entry + delta, row - 4, row + 4)
        if (narrow) expect(ink).toBeGreaterThan(0)
      }
      await hideCards.evaluate(el => el.parentNode?.removeChild(el))
    }
  })

  test('base styles keep the complete ink with scroll timeline rules unavailable', async ({ page }) => {
    // Remove the progressive enhancement from the local sheet, exercising the
    // same base cascade an engine that rejects the feature query receives.
    const removed = await page.evaluate(() => {
      let count = 0
      for (const sheet of document.styleSheets) {
        for (let i = sheet.cssRules.length - 1; i >= 0; i--) {
          const rule = sheet.cssRules[i]
          if (rule instanceof CSSSupportsRule && rule.conditionText.includes('animation-timeline') && rule.cssText.includes('ribbonGate')) {
            sheet.deleteRule(i)
            count++
          }
        }
      }
      return count
    })
    expect(removed).toBe(1)
    await page.locator('#faq').evaluate(el => el.scrollIntoView())
    await expect(page.locator('[data-ribbon-band="7"] [data-ribbon-gate]')).toHaveCSS('transform', 'none')
    await expect(page.locator('[data-ribbon-band] path[vector-effect]')).toHaveCount(9)
  })

  test('FAQ, landscape and static reduced motion retain all nine contiguous bands', async ({ page }) => {
    const last = page.locator('[data-ribbon-band="8"]')
    const top = () => last.evaluate(el => (el as HTMLElement).offsetTop)
    const initial = await top()
    const summary = page.locator('#faq summary').first()
    await summary.click()
    await expect.poll(top).toBeGreaterThan(initial)
    await summary.click()
    await expect.poll(top).toBe(initial)
    await page.setViewportSize({ width: 844, height: 390 })
    await expect(page.locator('[data-ribbon-band="0"] svg')).toHaveAttribute('viewBox', /^0 -?[\d.]+ 1440 /)
    await page.emulateMedia({ reducedMotion: 'reduce' })
    const bands = page.locator('[data-ribbon-band]')
    const gaps = await bands.evaluateAll(els => els.slice(1).map((el, i) =>
      el.getBoundingClientRect().top - els[i].getBoundingClientRect().bottom))
    expect(gaps).toEqual(Array(8).fill(0))
    await expect(last.locator('[data-ribbon-gate]')).toHaveCSS('animation-name', 'none')
    await expect(last.locator('path[vector-effect]')).toHaveAttribute('d', /^M/)
  })
})
