import { expect, test } from '@playwright/test'

// No global auth setup, accounts, actual credentials, or backend mutations.
test('LAN hydrates: touch menu works at the demo and final invitation', async ({ page }) => {
  const errors: string[] = []
  const failedChunks: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  page.on('response', r => { if (r.url().includes('/_next/static/') && r.status() >= 400) failedChunks.push(new URL(r.url()).pathname) })
  await page.goto('/')
  await expect(page.locator('.landing-menu-fallback')).toHaveCount(0)
  for (const section of ['.editorial-demo-stage', '#contato']) {
    await page.locator(section).scrollIntoViewIfNeeded()
    const trigger = page.getByRole('button', { name: 'Abrir menu', exact: true })
    await trigger.tap()
    const menu = page.getByRole('dialog', { name: 'Conheça a Kivora' })
    await expect(menu).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(menu).toHaveCount(0)
    await expect(trigger).toBeFocused()
    await trigger.tap()
    await menu.getByRole('link', { name: 'Planos', exact: true }).tap()
    await expect(menu).toHaveCount(0)
    await expect(page).toHaveURL(/#precos$/)
  }
  await page.getByRole('button', { name: 'Ver tradução' }).tap()
  await expect(page.getByText('Um café, por favor.', { exact: true })).toBeVisible()
  await expect(page.locator('.editorial-demo-bottom > svg')).toHaveCount(1)
  await expect(page.locator('svg.editorial-invitation-mark')).toHaveCount(1)
  await expect(page.locator('body')).not.toContainText('↗')
  expect(errors).toEqual([])
  expect(failedChunks).toEqual([])
})

test('native menu still works without JavaScript, at both scroll positions', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 } })
  const page = await context.newPage()
  await page.goto(baseURL!)
  const fallback = page.locator('.landing-menu-fallback')
  for (const section of ['.editorial-demo-stage', '#contato']) {
    await page.locator(section).scrollIntoViewIfNeeded()
    await fallback.locator('summary').tap()
    await expect(fallback).toHaveAttribute('open', '')
    await expect(fallback.getByRole('link', { name: 'Entrar', exact: true })).toBeVisible()
    await fallback.locator('summary').tap()
    await expect(fallback).not.toHaveAttribute('open')
  }
  await context.close()
})

test('sticky header leaves anchor headings and keyboard controls visible', async ({ page, browserName }) => {
  await page.goto('/')
  await expect(page.locator('.landing-menu-fallback')).toHaveCount(0)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const hash of ['#como-funciona', '#precos', '#faq']) {
    await page.goto(`/${hash}`)
    const heading = page.locator(`${hash} h2`).first()
    await expect(heading).toBeInViewport()
    const headerBottom = await page.locator('header').evaluate(el => el.getBoundingClientRect().bottom)
    await expect.poll(async () => (await heading.boundingBox())!.y).toBeGreaterThanOrEqual(headerBottom)
  }
  await page.goto('/')
  await page.getByRole('button', { name: 'Ver tradução' }).focus()
  let checkedControls = 0
  for (let i = 0; i < 12; i++) {
    // WebKit on macOS uses Option+Tab for full navigation including links.
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab')
    const bounds = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement
      const rect = el.getBoundingClientRect()
      return { y: rect.y, bottom: rect.bottom, height: innerHeight, header: document.querySelector('header')!.getBoundingClientRect().bottom, isControl: el.matches('a[href], button, input, select, textarea, [tabindex]'), contained: Boolean(el.closest('header, [data-contained-carousel]')) }
    })
    if (bounds.isControl && !bounds.contained) {
      checkedControls++
      await expect.poll(() => page.evaluate(() => document.activeElement!.getBoundingClientRect().y)).toBeGreaterThanOrEqual(bounds.header)
      await expect.poll(() => page.evaluate(() => document.activeElement!.getBoundingClientRect().bottom)).toBeLessThanOrEqual(bounds.height)
    }
  }
  expect(checkedControls).toBeGreaterThanOrEqual(4)
})

for (const path of ['/login', '/register', '/forgot-password']) {
  test(`${path}: without JS, fields are disabled and forced submission never uses GET`, async ({ browser, baseURL }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })
    const page = await context.newPage()
    const submissions: { method: string; hasQuery: boolean }[] = []
    await page.route('**/*', async route => {
      const req = route.request()
      if (req.method() !== 'GET') {
        submissions.push({ method: req.method(), hasQuery: Boolean(new URL(req.url()).search) })
        await route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Intercepted test submission</p>' })
      } else await route.continue()
    })
    await page.goto(`${baseURL}${path}`)
    const form = page.locator('form.LoginForm')
    await expect(form).toHaveAttribute('method', 'post')
    await expect(form.locator('fieldset')).toHaveAttribute('disabled', '')
    await expect(form.getByRole('status')).toContainText('Carregando formulário')
    await expect(form.locator('input').first()).toBeDisabled()
    // Browser evaluation invokes native submission to test the safety net; no secrets are inserted.
    await form.evaluate((el: HTMLFormElement) => el.submit())
    await expect.poll(() => submissions.length).toBe(1)
    expect(submissions).toEqual([{ method: 'POST', hasQuery: false }])
    await context.close()
  })
}

test('hydrated login submits POST to an intercepted endpoint without query fields', async ({ page }) => {
  let submitted = false
  await page.route('**/api/login', async route => {
    const req = route.request()
    expect(req.method()).toBe('POST')
    expect(new URL(req.url()).search).toBe('')
    submitted = true
    await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, error: 'Resposta simulada do teste local' }) })
  })
  await page.goto('/login')
  const form = page.locator('form.LoginForm')
  await expect(form).toHaveAttribute('aria-busy', 'false')
  await expect(page.getByTestId('login-username')).toHaveAttribute('placeholder', 'Seu email ou usuário')
  await expect(page.getByTestId('login-password')).toHaveAttribute('placeholder', 'Digite sua senha')
  await expect(page.locator('.premium-auth-footer')).toContainText('Kivora Inglês')
  await page.locator('input[name="username"]').fill('ui-fixture@example.test')
  await page.locator('input[name="password"]').fill('Synthetic-Only-123')
  await page.getByTestId('login-submit').tap()
  await expect(page.getByTestId('login-error')).toHaveText('Resposta simulada do teste local')
  expect(submitted).toBe(true)
  await expect(page).toHaveURL(/\/login$/)
  // Leave no synthetic input in the final screenshot if a later assertion is added.
  await page.locator('input[name="username"]').clear()
  await page.locator('input[name="password"]').clear()
})
