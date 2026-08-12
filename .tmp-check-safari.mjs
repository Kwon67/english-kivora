import { webkit } from 'playwright'

const browser = await webkit.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
const consoleMsgs = []
page.on('console', (msg) => consoleMsgs.push(`${msg.type()}: ${msg.text()}`))
page.on('pageerror', (err) => consoleMsgs.push(`pageerror: ${err.message}`))

await page.goto('http://localhost:3000/#depoimentos', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

const info = await page.evaluate(() => {
  const track = document.querySelector('[aria-roledescription="carousel"] > div')
  const card = document.querySelector('[aria-roledescription="slide"]')
  const container = document.querySelector('[aria-roledescription="carousel"]')
  if (!track || !card || !container) return { found: false }
  const style = getComputedStyle(track)
  return {
    found: true,
    opacity: style.opacity,
    transform: style.transform,
    cardOffsetWidth: card.offsetWidth,
    containerClientWidth: container.clientWidth,
  }
})
console.log('INFO', JSON.stringify(info))
console.log('CONSOLE', JSON.stringify(consoleMsgs))

await page.screenshot({ path: '/tmp/kivora-webkit-testimonials.png' })
await browser.close()
