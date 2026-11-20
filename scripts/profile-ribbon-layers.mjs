// Run against a local production build. The WebKit layer inspector is specific
// to the WebKit revision shipped with the project's Playwright dependency.
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
            const band = this.closest?.('[data-ribbon-band]')
            if (band) return { band: Number(band.dataset.ribbonBand), element: this.classList.value }
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
    await page.goto(url.href)
    await page.waitForSelector('[data-ribbon-band="0"] path[vector-effect]')
    await page.evaluate(() => document.fonts.ready)
    const sample = await inspectRibbonLayers(page, engine)
    for (const y of [0, 230, 235, 240, 245, ...Array.from({ length: 11 }, (_, i) => i % 2 ? 6200 : 1700)]) {
      await page.evaluate(top => scrollTo({ top, behavior: 'instant' }), y)
      await page.waitForTimeout(150)
      const layers = await sample()
      console.log(JSON.stringify({ engine: engine.name(), y, layers }))
    }
    const visibility = await page.evaluate(async () => {
      const bands = Array.from(document.querySelectorAll('[data-ribbon-band]'))
      const maximum = document.documentElement.scrollHeight - innerHeight
      let samples = 0, nearestSkippedEdge = Infinity
      const skippedNearFocus = []
      const positions = []
      for (const step of [64, 512]) {
        for (let top = 0; top < maximum; top += step) positions.push(top)
        for (let top = maximum; top >= 0; top -= step) positions.push(top)
      }
      for (const top of positions) {
        scrollTo({ top, behavior: 'instant' })
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
        samples++
        for (const band of bands) {
          if (band.querySelector('[data-ribbon-gate]').checkVisibility({ contentVisibilityAuto: true })) continue
          const rect = band.getBoundingClientRect()
          const distance = Math.max(0, rect.top - innerHeight / 2, innerHeight / 2 - rect.bottom)
          nearestSkippedEdge = Math.min(nearestSkippedEdge, distance)
          if (distance < 1) skippedNearFocus.push({ sample: samples, scroll: scrollY, band: band.dataset.ribbonBand })
        }
      }
      return { samples, skippedNearFocus, nearestSkippedEdge: Number.isFinite(nearestSkippedEdge) ? nearestSkippedEdge : null }
    })
    console.log(JSON.stringify({ engine: engine.name(), visibility }))
  } finally {
    await browser.close()
  }
}
