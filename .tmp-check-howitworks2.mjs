import { chromium } from 'playwright'

const widths = [768, 820, 900, 1023]
const browser = await chromium.launch()

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  await page.goto('http://localhost:3000/#como-funciona', { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)
  await page.screenshot({ path: `/tmp/kivora-how2-${width}.png` })

  const buttons = await page.$$('button[aria-controls^="journey-preview"]')
  if (buttons.length > 2) {
    await buttons[2].click()
    await page.waitForTimeout(700)
    await page.screenshot({ path: `/tmp/kivora-how2-${width}-click3.png` })
  }

  await page.close()
}

await browser.close()
console.log('done')
