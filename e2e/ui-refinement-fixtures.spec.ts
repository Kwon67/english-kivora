import { expect, test } from '@playwright/test'

const fixture = process.env.KIVORA_FIXTURE_URL
if (fixture && !['localhost', '127.0.0.1', '[::1]'].includes(new URL(fixture).hostname)) throw new Error('Fixtures must run on localhost')
test.skip(!fixture, 'Set KIVORA_FIXTURE_URL to the isolated UI harness; never production')

test.describe('Real components with isolated fixtures (no authenticated integration)', () => {
  test.beforeEach(async ({ page }) => { await page.goto(`${fixture}/home`) })
  test('account logout submits before the menu can unmount the form', async ({ page }) => {
    // Stop at the UI boundary: fixture auth mutations are deliberately disabled.
    await page.evaluate(() => {
      document.addEventListener('submit', event => {
        event.preventDefault()
        const count = Number(document.documentElement.dataset.logoutSubmits || 0)
        document.documentElement.dataset.logoutSubmits = String(count + 1)
      }, true)
    })
    const trigger = page.getByRole('button', { name: 'Abrir opções da conta' })
    await trigger.click()
    await page.getByRole('menuitem', { name: 'Sair da conta' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-logout-submits', '1')
    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
    await trigger.press('Enter')
    await page.getByRole('menuitem', { name: 'Sair da conta' }).focus()
    await page.keyboard.press('Enter')
    await expect(page.locator('html')).toHaveAttribute('data-logout-submits', '2')
  })
  test('main study action is visible above the dock at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    const action = page.getByTestId('continue-learning')
    await expect(action).toBeInViewport({ ratio: 1 })
    const actionBox = await action.boundingBox()
    const dockBox = await page.getByRole('navigation', { name: 'Navegação rápida' }).boundingBox()
    expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(dockBox!.y)
    await action.click()
    await expect(page).toHaveURL(/#trilha$/)
  })

  test('both mobile menu triggers restore focus and close without trapping the page', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 })
    for (const name of ['Abrir menu de navegação', 'Abrir mais opções']) {
      const trigger = page.getByRole('button', { name, exact: true })
      await trigger.focus(); await page.keyboard.press('Enter')
      const dialog = page.getByRole('dialog', { name: 'Seu espaço', exact: true })
      await expect(dialog).toBeVisible()
      for (let i=0;i<18;i++) { await page.keyboard.press('Tab'); expect(await dialog.evaluate(el=>el.contains(document.activeElement))).toBe(true) }
      await page.keyboard.press('Escape'); await expect(dialog).toHaveCount(0); await expect(trigger).toBeFocused()
    }
  })

  test('plan and confirmation dialogs return focus', async ({ page }) => {
    const plan = page.getByRole('button', { name: 'Ver meu plano de estudo' })
    await plan.click(); await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0); await expect(plan).toBeFocused()
    await page.goto(`${fixture}/states`)
    const trigger=page.getByRole('button',{name:'Abrir confirmação'})
    await trigger.click(); await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0); await expect(trigger).toBeFocused()
  })

  test('repeated routes, Back/Forward and GSAP cleanup', async ({ page }) => {
    const errors: string[]=[]; page.on('pageerror',error=>errors.push(error.message))
    await page.setViewportSize({ width: 1440, height: 900 })
    for(let i=0;i<3;i++) {
      await page.locator('.focus-mode').filter({hasText:'Revisar'}).click()
      await expect(page).toHaveURL(/\/review$/)
      await expect(page.getByText('Tudo em dia.',{exact:true})).toBeVisible()
      await page.goBack(); await expect(page.getByTestId('continue-learning')).toBeVisible()
      await page.goForward(); await expect(page).toHaveURL(/\/review$/)
      await page.getByRole('link',{name:'Kivora — início',exact:true}).click()
      await expect(page.getByTestId('continue-learning')).toBeVisible()
      const probe = await page.evaluate(()=> (window as unknown as {__motionAudit:()=>{triggers:number;detached:number}}).__motionAudit())
      expect(probe.detached).toBe(0); expect(probe.triggers).toBeLessThanOrEqual(4)
    }
    await page.emulateMedia({reducedMotion:'reduce'})
    await expect.poll(() => page.evaluate(()=>(window as unknown as {__motionAudit:()=>{triggers:number}}).__motionAudit().triggers)).toBe(0)
    expect(errors).toEqual([])
  })

  test('practice starts, choices remain usable, and flashcard can be revealed', async ({ page }) => {
    await page.goto(`${fixture}/play/local-lesson`)
    await page.getByTestId('game-start-button').click()
    await expect(page.getByTestId('game-start-button')).toHaveCount(0)
    await expect(page.locator('main')).toContainText(/Como|café|conhecer|amanhã/)
    await page.goto(`${fixture}/practice`)
    await page.getByRole('button',{name:/Olá/}).click()
    await page.getByRole('button',{name:/Confirmar/}).click()
    await expect(page.getByTestId('result')).toHaveText('correct')
    await page.getByRole('button',{name:'flashcard',exact:true}).click()
    await page.getByTestId('flashcard-reveal').focus()
    await page.keyboard.press('Enter')
    await expect(page.getByText('Olá',{exact:true})).toBeVisible()
  })

  test('loading and review error states remain actionable', async ({ page }) => {
    await page.goto(`${fixture}/states`)
    await expect(page.getByRole('status')).toContainText('Carregando seu espaço de aprendizado')
    await page.goto(`${fixture}/review-error`)
    await expect(page.getByText('A revisão demorou demais.')).toBeVisible()
    await expect(page.getByRole('button',{name:'Tentar novamente'})).toBeVisible()
    await page.getByRole('button',{name:'Voltar ao início'}).click()
    await expect(page).toHaveURL(/\/home$/)
  })

  test('library opens creation on demand and retains manual and AI drafts', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(`${fixture}/library`)
    const create = page.getByRole('button', { name: 'Criar pack', exact: true })
    await expect(create).toHaveAttribute('aria-expanded', 'false')
    await expect(page.getByLabel('Nome do Pack')).toBeHidden()
    await expect(page.getByRole('heading', { name: 'Packs e pastas' })).toBeVisible()
    await create.click()
    await expect(page.getByRole('heading', { name: 'Criar pack' })).toBeFocused()
    await page.getByLabel('Nome do Pack').fill('Rascunho local')
    await page.getByLabel('Cards (Inglês | Tradução)').fill('Hello | Olá')
    await page.getByRole('button', { name: 'Gerar com IA', exact: true }).first().click()
    await page.getByLabel('Tema ou Assunto').fill('Café')
    await page.getByRole('button', { name: 'Manual', exact: true }).click()
    await expect(page.getByLabel('Nome do Pack')).toHaveValue('Rascunho local')
    await expect(page.getByLabel('Cards (Inglês | Tradução)')).toHaveValue('Hello | Olá')
    await page.getByRole('button', { name: 'Recolher criação de pack' }).click()
    await expect(create).toBeFocused()
    await create.click()
    await expect(page.getByLabel('Nome do Pack')).toHaveValue('Rascunho local')
    await page.getByRole('button', { name: 'Gerar com IA', exact: true }).first().click()
    await expect(page.getByLabel('Tema ou Assunto')).toHaveValue('Café')
  })

  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`flashcard records one response per card (${reducedMotion})`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion })
      await page.goto(`${fixture}/practice`)
      await page.getByRole('button', { name: 'flashcard', exact: true }).click()
      const reveal = page.getByTestId('flashcard-reveal')
      const count = page.getByTestId('answer-count')
      const next = page.getByRole('button', { name: 'Próximo card de teste' })
      await reveal.click()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(40)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(350)
      await expect(count).toHaveText('1')
      await next.click(); await expect(page.getByTestId('flashcard-question')).toHaveText('Good morning')
      await reveal.click(); await page.getByTestId('flashcard-correct').dblclick()
      await page.waitForTimeout(350); await expect(count).toHaveText('2')
      await next.click(); await expect(page.getByTestId('flashcard-question')).toHaveText('Thank you')
      await reveal.click()
      const box = (await reveal.boundingBox())!
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 160, box.y + box.height / 2, { steps: 10 }); await page.mouse.up()
      await page.keyboard.press('Enter')
      await page.waitForTimeout(350); await expect(count).toHaveText('3')
      await next.click(); await expect(page.getByTestId('flashcard-question')).toHaveText('See you')
      await reveal.click(); await page.getByTestId('flashcard-wrong').focus(); await page.keyboard.press('Enter')
      await expect(count).toHaveText('4'); await expect(page.getByTestId('result')).toHaveText('wrong')
    })
  }
})
