import { chromium } from 'playwright'

const widths = [1440, 1280, 1024, 1023, 900, 768]
const browser = await chromium.launch()

for (const width of widths) {
  const page = await browser.newPage({ viewport: { width, height: 900 } })
  await page.goto('http://localhost:3000/#como-funciona', { waitUntil: 'networkidle' })
  await page.waitForTimeout(300)

  const layoutInfo = await page.evaluate(() => {
    const rightCol = document.querySelector('.sticky.top-28')
    const isRightColVisible = rightCol ? getComputedStyle(rightCol).display !== 'none' : false
    return { isRightColVisible }
  })

  await page.screenshot({ path: `/tmp/kivora-how-${width}-before.png` })

  // Click the first step card
  const buttons = await page.$$('button[aria-controls^="journey-preview"]')
  if (buttons.length > 0) {
    await buttons[0].click()
    await page.waitForTimeout(700)
    await page.screenshot({ path: `/tmp/kivora-how-${width}-after-click-1.png` })

    // click the SECOND card (index 1) since first is often already active by default (activeIndex=0)
    if (buttons.length > 1) {
      await buttons[1].click()
      await page.waitForTimeout(700)
      await page.screenshot({ path: `/tmp/kivora-how-${width}-after-click-2.png` })
    }
  }

  console.log(width, JSON.stringify(layoutInfo))
  await page.close()
}

await browser.close()
