import { expect, test } from '@playwright/test'

test('a frase alterna de idioma e reproduz a gravação', async ({ page }) => {
  await page.goto('/')
  const phrase = page.locator('#hero-phrase')
  await expect(phrase).toHaveText('Is this seat taken?')
  await page.getByRole('button', { name: /Revelar tradução/ }).press('Enter')
  await expect(phrase).toHaveText('Este lugar está ocupado?')
  await page.getByRole('button', { name: /Voltar ao inglês/ }).click()
  await expect(phrase).toHaveAttribute('lang', 'en')
  await page.getByRole('button', { name: 'Ouvir frase' }).click()
  await expect.poll(() => page.locator('audio').evaluate((audio: HTMLAudioElement) => audio.currentTime)).toBeGreaterThan(0)
})

test.describe('HTML inicial', () => {
  test.use({ javaScriptEnabled: false })
  test('título, cadastro e FAQ estão disponíveis', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Seu inglês, no mundo real.')
    await expect(page.getByRole('link', { name: 'Começar grátis' }).first()).toHaveAttribute('href', '/register')
    await page.locator('#faq summary').first().click()
    await expect(page.locator('#faq details[open] p')).toContainText('começar do zero')
  })
})
