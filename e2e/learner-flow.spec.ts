import { expect, test } from '@playwright/test'

test('three lessons with different states fit on small phones, with no overlay action', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const [width, height] of [[390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height }); await page.goto('/trail')
    await expect(page.getByText('5 de 44 lições concluídas')).toBeVisible()
    const rows = page.locator('.study-lesson')
    await expect(rows).toHaveCount(4)
    for (let i = 0; i < 3; i++) {
      const rect = (await rows.nth(i).boundingBox())!
      const dock = (await page.getByRole('navigation', { name: 'Navegação rápida' }).boundingBox())!
      expect(rect.y + rect.height).toBeLessThanOrEqual(dock.y)
      expect(rect.height).toBeLessThan(100)
    }
    expect(await rows.nth(0).getAttribute('data-state')).toBe('done')
    expect(await rows.nth(1).getAttribute('data-state')).toBe('current')
    expect(await rows.nth(2).getAttribute('data-state')).toBe('open')
    await expect(page.locator('.learning-path-jump')).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width)
  }
})

test('history and level disclosures reflect state and animate expansion and collapse', async ({ page }) => {
  await page.goto('/trail')
  const toggle = page.getByRole('button', { name: 'Ver 4 lições concluídas anteriores' })
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  await toggle.click()
  await expect(page.getByRole('button', { name: 'Recolher lições anteriores' })).toHaveAttribute('aria-expanded', 'true')
  await expect(page.locator('.study-lesson')).toHaveCount(8)
  await expect.poll(() => page.locator('.study-unit-body').evaluate(el => el.style.height)).toBe('')
  const colors = await page.locator('.study-lesson[data-state="done"]').evaluateAll(rows => rows.map(el => getComputedStyle(el).backgroundColor))
  expect(new Set(colors).size).toBe(1)
  await page.getByRole('button', { name: 'Recolher lições anteriores' }).click()
  await expect(page.locator('.study-lesson')).toHaveCount(4)
  const heading = page.locator('.study-unit-heading')
  await heading.click(); await expect(heading).toHaveAttribute('aria-expanded', 'false')
  await expect(page.locator('.study-unit-body')).toBeHidden()
  await heading.click(); await expect(page.locator('.study-lesson').first()).toBeVisible()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await heading.click(); await expect(page.locator('.study-unit-body')).toBeHidden()
})

test('home trail shortcut leaves three lessons visible below the header', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/home')
  await page.locator('a[href="#trilha"]').click()
  const heading = (await page.locator('#trilha h2').first().boundingBox())!
  const header = (await page.locator('.workspace-navigation-bar').boundingBox())!
  const third = (await page.locator('.study-lesson').nth(2).boundingBox())!
  const dock = (await page.getByRole('navigation', { name: 'Navegação rápida' }).boundingBox())!
  expect(heading.y).toBeGreaterThanOrEqual(header.y + header.height)
  expect(third.y + third.height).toBeLessThanOrEqual(dock.y)
  await page.keyboard.press('Tab')
  await page.locator('.study-unit-heading').focus()
  await expect(page.locator('.study-unit-heading')).toBeFocused()
  await expect(page.locator('.study-unit-heading')).toHaveCSS('outline-offset', '-4px')
})

test('review needs one action and repeated clicks call only the fixture stub once', async ({ page, request }) => {
  await page.goto('/trail')
  const before = (await (await request.get('/api/fixture-count')).json()).calls.length
  const action = page.getByRole('button', { name: 'Revisar: Perguntas essenciais' })
  await action.evaluate((el: HTMLButtonElement) => { el.click(); el.click() })
  await expect(page).toHaveURL(/\/play\/local-lesson$/)
  const after = (await (await request.get('/api/fixture-count')).json()).calls.length
  expect(after - before).toBe(1)
  await page.goBack(); await expect(page.getByRole('button', { name: 'Revisar: Perguntas essenciais' })).toBeEnabled()
  await page.getByRole('link', { name: 'Continuar: Seu dia a dia' }).click()
  await expect(page).toHaveURL(/\/play\/local-lesson$/)
})

test('lesson errors keep the direct action available and details return focus', async ({ page }) => {
  await page.goto('/trail-error')
  const action = page.getByRole('button', { name: 'Começar: Lição com falha simulada' })
  await action.click(); await expect(page.getByText('Falha simulada. Tente novamente.')).toBeVisible(); await expect(action).toBeEnabled()
  const details = page.getByRole('button', { name: 'Detalhes de Lição com falha simulada' })
  await details.click(); await expect(page.getByText('Vocabulário e frases curtas para usar no dia a dia.')).toBeVisible()
  await page.keyboard.press('Escape'); await expect(details).toBeFocused()
})

test('drawer animates, restores focus, navigates, and cleans up across routes', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message))
  await page.setViewportSize({ width: 390, height: 844 }); await page.goto('/home')
  for (const triggerName of ['Abrir menu de navegação', 'Abrir mais opções']) {
    const trigger = page.getByRole('button', { name: triggerName, exact: true })
    await trigger.click(); const dialog = page.getByRole('dialog', { name: 'Seu espaço', exact: true })
    await expect(dialog).toBeVisible()
    const opening = await page.evaluate(async () => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      return getComputedStyle(document.querySelector('[role="dialog"]')!).transform
    })
    expect(opening).not.toBe('none')
    await expect.poll(() => dialog.evaluate(el => getComputedStyle(el).transform)).toBe('none')
    await page.keyboard.press('Escape')
    const closing = await page.evaluate(async () => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const node = document.querySelector('[role="dialog"]')
      return { present: Boolean(node), transform: node ? getComputedStyle(node).transform : null }
    })
    expect(closing.present).toBe(true); expect(closing.transform).not.toBe('none')
    await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused()
  }
  for (let i = 0; i < 3; i++) {
    await page.getByRole('button', { name: 'Abrir mais opções' }).click()
    await page.getByRole('dialog').getByRole('link', { name: /Progresso/ }).click()
    await expect(page).toHaveURL(/\/history$/)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await page.goBack(); await expect(page).toHaveURL(/\/home$/)
    await page.goForward(); await expect(page).toHaveURL(/\/history$/)
    await page.goBack()
    const motion = await page.evaluate(() => (window as unknown as { __motionAudit: () => { detached: number; detachedTweens: number } }).__motionAudit())
    expect(motion.detached).toBe(0)
    expect(motion.detachedTweens).toBe(0)
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.getByRole('button', { name: 'Abrir mais opções' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCSS('transform', 'none')
  await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(errors).toEqual([])
})

test('essential student destinations are reachable with clear states', async ({ page }) => {
  await page.goto('/home')
  await page.getByTestId('continue-learning').click(); await expect(page).toHaveURL(/\/play\/local-lesson$/)
  await page.goBack(); await page.locator('.focus-mode').filter({ hasText: 'Revisar' }).click()
  await expect(page).toHaveURL(/\/review$/); await expect(page.getByText('Tudo em dia.', { exact: true })).toBeVisible()
  await page.goBack(); await page.getByRole('link', { name: 'Ver progresso', exact: true }).click(); await expect(page).toHaveURL(/\/history$/)
  await page.goto('/review-error'); await page.getByRole('button', { name: 'Voltar ao início' }).click(); await expect(page).toHaveURL(/\/home$/)
  await page.goto('/states'); await expect(page.getByRole('status')).toContainText('Carregando seu espaço de aprendizado')
})

test('cards share the typing exercise corners without widening the mobile layout', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 320, height: 568 })
  await page.goto('/practice')
  await page.getByRole('button', { name: 'typing', exact: true }).click()
  const reference = await page.locator('.exercise-prompt').evaluate(el => getComputedStyle(el).borderRadius)
  expect(parseFloat(reference)).toBeGreaterThanOrEqual(20)
  for (const [route, selector] of [
    ['/home', '.focus-session, .focus-today, .focus-mode, .study-unit'],
    ['/', '.editorial-demo-stage, .editorial-demo-card, .editorial-mode, #precos article, .editorial-invitation'],
    ['/review', '.refined-empty-state'],
  ]) {
    await page.goto(route)
    const cards = page.locator(selector)
    expect(await cards.count()).toBeGreaterThan(0)
    const radii = await cards.evaluateAll(nodes => nodes.map(el => getComputedStyle(el).borderRadius))
    expect(radii.every(radius => radius === reference)).toBe(true)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
  }
})
