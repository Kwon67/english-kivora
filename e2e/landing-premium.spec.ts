import { expect, test } from '@playwright/test'

test('escolher oferece explicação, tentativa e próxima questão', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('link', { name: 'Experimentar uma prática' }).click()
  await page.getByRole('button', { name: 'an', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Vamos entender?' })).toBeVisible()
  await page.getByRole('button', { name: 'Tentar de novo' }).click()
  await page.getByRole('button', { name: 'a', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar' }).click()
  await expect(page.getByText('Muito bem!')).toBeVisible()
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await expect(page.locator('[data-exercise-question]')).toContainText('She has')
})

test('montar verifica a ordem e permite recomeçar', async ({ page }) => {
  await page.goto('/#practice-build')
  const panel = page.locator('#practice-panel')
  for (const part of ['Can I have', 'a coffee,', 'please?']) {
    await panel.getByRole('button', { name: part, exact: true }).click()
  }
  await panel.getByRole('button', { name: 'Verificar frase' }).click()
  await expect(panel.getByText('inicia um pedido educado.', { exact: false })).toBeVisible()
  await panel.getByRole('button', { name: 'Recomeçar frase' }).click()
  await expect(panel.getByRole('button', { name: 'Verificar frase' })).toBeDisabled()
})

test('relembrar estima uma revisão e avança para outra expressão', async ({ page }) => {
  await page.goto('/#practice-recall')
  await page.getByRole('button', { name: 'Revelar significado' }).click()
  await expect(page.getByText('um pouco mais perto')).toBeVisible()
  await page.getByRole('button', { name: /Lembrei/ }).click()
  await expect(page.getByText(/Próxima revisão em/)).toBeVisible()
  await page.getByRole('button', { name: 'Próxima expressão' }).click()
  await expect(page.getByRole('heading', { name: 'around the corner' })).toBeVisible()
})

test('login e cadastro mantêm os destinos e transferem o email', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link', { name: 'Entrar' }).click()
  await expect(page).toHaveURL(/\/login$/)
  await page.goBack()
  await page.getByLabel('Comece seu cadastro gratuito').fill('teste@example.org')
  await page.getByRole('button', { name: 'Continuar para o cadastro' }).click()
  await expect(page).toHaveURL(/\/register$/)
  await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toHaveValue('teste@example.org')
})
