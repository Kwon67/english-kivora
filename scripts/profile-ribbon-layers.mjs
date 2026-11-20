// Run against a local production build. The WebKit layer inspector is specific
// to the WebKit revision shipped with the project's Playwright dependency.
import assert from 'node:assert/strict'
import { installCanvasProbe, readCanvasCounters } from './ribbon-canvas-probe.mjs'
import { chromium, webkit } from '@playwright/test'

const url = new URL(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000')
if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
  throw new Error('Use a loopback URL for this compositor profile')
}

async function inspectRibbonLayers(page, engine) {
  const isWebKit = engine === webkit
  const session = isWebKit ? page._connection.toImpl(page).delegate._session : await page.context().newCDPSession(page)
  let layers = []
  if (!isWebKit) session.on('LayerTree.layerTreeDidChange', event => { layers = event.layers ?? [] })
  await session.send('LayerTree.enable')
  return async () => {
    if (isWebKit) {
      const { root } = await session.send('DOM.getDocument')
      layers = (await session.send('LayerTree.layersForNode', { nodeId: root.nodeId })).layers
    }
    const found = []
    for (const layer of layers) {
      const node = isWebKit ? { nodeId: layer.nodeId } : { backendNodeId: layer.backendNodeId }
      if (!(node.nodeId || node.backendNodeId)) continue
      // Pseudo-elements and discarded layers may lack an inspectable DOM node.
      const resolved = await session.send('DOM.resolveNode', node).catch(() => null)
      if (!resolved) continue
      const { objectId } = resolved.object
      try {
        const { result } = await session.send('Runtime.callFunctionOn', {
          objectId, returnByValue: true, functionDeclaration: `function () {
            if (this.matches?.('[data-ribbon-canvas]')) return { element: this.tagName }
          }`,
        })
        if (result.value) found.push({ ...result.value, id: layer.layerId, paints: layer.paintCount,
          memoryBytes: layer.memory, drawsContent: layer.drawsContent })
      } finally {
        await session.send('Runtime.releaseObject', { objectId })
      }
    }
    if (!found.length) throw new Error('No inspectable ribbon layers in this browser revision')
    return found
  }
}

for (const engine of [webkit, chromium]) {
  const browser = await engine.launch(engine === chromium ? { executablePath: process.env.KIVORA_CHROME_EXECUTABLE } : {})
  try {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3,
      isMobile: true, hasTouch: true, ignoreHTTPSErrors: true })
    await page.route('**/*', route => new URL(route.request().url()).origin === url.origin ? route.continue() : route.abort())
    await page.addInitScript(installCanvasProbe)
    await page.goto(url.href)
    await page.waitForSelector('[data-ribbon-canvas]')
    await page.evaluate(() => document.fonts.ready)
    const sample = await inspectRibbonLayers(page, engine)
    const layerSamples = []
    for (const y of [0, 400, 1700, 6200, 1700, 6200, 1700]) {
      await page.evaluate(top => scrollTo({ top, behavior: 'instant' }), y)
      await page.waitForTimeout(150)
      layerSamples.push({ y, layers: await sample() })
    }
    const before = await page.evaluate(readCanvasCounters)
    const timings = await page.evaluate(async () => {
      const probe = window.__ribbonProbe
      probe.frames.length = 0
      const max = document.documentElement.scrollHeight - innerHeight
      const frame = () => new Promise(resolve => requestAnimationFrame(resolve))
      for (const step of [32, 96]) {
        for (let y = 0; y < max; y += step) { scrollTo({ top: y, behavior: 'instant' }); await frame() }
        for (let y = max; y >= 0; y -= step) { scrollTo({ top: y, behavior: 'instant' }); await frame() }
      }
      await frame(); await frame()
      const times = probe.frames.map(f => f.ms).sort((a, b) => a - b)
      const canvas = document.querySelector('[data-ribbon-canvas]')
      return { samples: times.length, averageMs: times.reduce((a,b) => a+b, 0) / times.length,
        p95Ms: times[Math.ceil(times.length * .95) - 1],
        strokesPerDraw: probe.frames.reduce((sum, f) => sum + f.strokes, 0) / times.length,
        drawRectReads: probe.frames.reduce((sum, f) => sum + f.rectReads, 0),
        drawLengthReads: probe.frames.reduce((sum, f) => sum + f.lengthReads, 0),
        rgbaBytes: canvas.width * canvas.height * 4 }
    })
    await page.setViewportSize({ width: 390, height: 774 })
    await page.waitForTimeout(350)
    await page.setViewportSize({ width: 390, height: 844 })
    await page.waitForTimeout(350)
    const after = await page.evaluate(readCanvasCounters)
    assert.equal(after.rectReads, before.rectReads, 'Ribbon rect reads including toolbar resizing')
    assert.equal(after.lengthReads, before.lengthReads, 'Ribbon SVG length reads including toolbar resizing')
    assert.equal(after.bufferWrites, before.bufferWrites, 'Viewport buffer stayed allocated')
    assert.equal(timings.drawRectReads + timings.drawLengthReads, 0, 'Draw callback read geometry')
    console.log(JSON.stringify({ engine: engine.name(), timings, layerSamples, rectReads: after.rectReads - before.rectReads,
      lengthReads: after.lengthReads - before.lengthReads, bufferWrites: after.bufferWrites - before.bufferWrites }))
  } finally {
    await browser.close()
  }
}
