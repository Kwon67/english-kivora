import { chromium, webkit } from 'playwright'

async function testEngine(engineName, engine) {
  const browser = await engine.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  // Break ResizeObserver entirely before any app code runs, to simulate the worst case.
  await page.addInitScript(() => {
    // @ts-ignore
    window.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  })

  await page.goto('http://localhost:3000/#depoimentos', { waitUntil: 'networkidle' })

  for (const delay of [100, 300, 500, 700]) {
    await page.waitForTimeout(delay === 100 ? 100 : 200)
    const info = await page.evaluate(() => {
      const track = document.querySelector('[aria-roledescription="carousel"] > div')
      if (!track) return null
      return getComputedStyle(track).opacity
    })
    console.log(engineName, `t~${delay}ms`, 'opacity=', info)
  }

  await page.screenshot({ path: `/tmp/kivora-failsafe-${engineName}.png` })
  await browser.close()
}

await testEngine('chromium', chromium)
await testEngine('webkit', webkit)
