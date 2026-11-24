import { expect, test } from '@playwright/test'

for (const width of [320, 390, 430]) {
  test(`o painel e os exemplos dos seis níveis cabem em ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/#seu-caminho')

    const section = page.locator('#seu-caminho')
    const rail = section.locator('[data-level-rail]')
    const example = section.locator('#level-example')
    await expect(rail.getByRole('button')).toHaveCount(6)
    for (const button of await rail.getByRole('button').all()) {
      await button.click()
      await expect(button).toHaveAttribute('aria-pressed', 'true')
      await expect(example.locator('[data-level-stamp] strong')).toHaveText(await button.locator('span').innerText())
      const clipped = await section.evaluate(section => {
        const bounds = section.getBoundingClientRect()
        const nodes = section.querySelectorAll(':scope > div, [data-level-rail], #level-example, #level-example h3, #level-example p, #level-example a')
        return Array.from(nodes).filter(node => {
          const box = node.getBoundingClientRect()
          return box.left < bounds.left - 1 || box.right > bounds.right + 1 ||
            (!node.hasAttribute('data-level-rail') && node.scrollWidth > node.clientWidth + 1)
        }).map(node => node.tagName + '.' + node.className)
      })
      expect(clipped).toEqual([])
    }
  })
}

test('os rótulos da prática e o título das dúvidas cabem em 320px', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/')
  const lab = page.locator('[data-practice-lab]')
  await lab.getByRole('button', { name: 'Relembrar', exact: true }).click()
  await lab.getByRole('button', { name: 'Revelar significado' }).click()
  await page.evaluate(() => document.fonts.ready)

  for (const item of [lab.locator('button:visible'), page.locator('#faq-title')]) {
    const clipped = await item.evaluateAll(nodes => nodes.filter(node => {
      const range = document.createRange()
      range.selectNodeContents(node)
      const bounds = node.getBoundingClientRect()
      const section = node.closest('section')!.getBoundingClientRect()
      return Array.from(range.getClientRects()).some(rect =>
        rect.left < Math.max(bounds.left, section.left) - 1 ||
        rect.right > Math.min(bounds.right, section.right) + 1)
    }).map(node => node.textContent))
    expect(clipped).toEqual([])
  }
})

for (const [width, height] of [[320, 568], [667, 375], [844, 390]]) {
  test(`os links do menu cabem em ${width}×${height}`, async ({ page }) => {
    await page.setViewportSize({ width, height })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/')
    const trigger = page.getByRole('button', { name: 'Abrir menu' })
    await trigger.click()
    const dialog = page.getByRole('dialog')
    for (const link of await dialog.getByRole('link').all()) {
      await expect(link).toBeInViewport({ ratio: 1 })
    }
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })
}

test('o aviso de atualização e o rodapé são acessíveis juntos', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 })
  await page.goto('/')
  await page.evaluate(() => {
    if (document.querySelector('.pwa-notice')) return
    const notice = document.createElement('div')
    notice.className = 'pwa-notice'
    notice.style.height = '120px'
    notice.textContent = 'Atualização pronta'
    document.body.append(notice)
  })
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }))
  const link = page.getByRole('link', { name: 'Voltar ao início' })
  await expect(link).toBeInViewport({ ratio: 1 })
  await expect(page.locator('.pwa-notice').first()).toBeInViewport()
  await link.click()
  await expect(page.locator('#hero-title')).toBeInViewport()
})
