import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { expect, type Page } from '@playwright/test'
import reference from './palette.json'

type Sample = { color: string; element: string; property: string }
export async function readPaint(page: Page) {
  return page.evaluate((artwork: string[]) => {
    const samples = new Map<string, { color: string; element: string; property: string }>()
    const canvas = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!
    const normalized = new Map<string, string>()
    const colors = /(?:rgba?|hsla?|hwb|(?:ok)?l(?:ab|ch)|color)\([^()]*\)/gi
    const properties = ['color', 'background-color', 'background-image', 'border-top-color', 'border-right-color',
      'border-bottom-color', 'border-left-color', 'outline-color', 'text-decoration-color', 'box-shadow',
      'text-shadow', 'fill', 'stroke', 'stop-color', 'filter', 'caret-color', 'accent-color', 'column-rule-color',
      'flood-color', 'lighting-color', '-webkit-text-fill-color', '-webkit-text-stroke-color']
    const root = document.querySelector('[data-ribbon-journey]')!.parentElement!
    for (const el of [root, ...root.querySelectorAll('*')]) {
      for (const pseudo of [null, '::before', '::after', ...(el.tagName === 'DIALOG' ? ['::backdrop'] : [])]) {
        const style = getComputedStyle(el, pseudo)
        if (pseudo?.startsWith('::') && pseudo !== '::backdrop' && style.content === 'none') continue
        for (const property of properties) {
          if (property === 'outline-color' && style.outlineStyle === 'none') continue
          if (property.startsWith('border-') && style.getPropertyValue(property.replace('color', 'style')) === 'none') continue
          const value = style.getPropertyValue(property)
          if (property === 'background-image') {
            for (const match of value.matchAll(/url\(["']?([^"')]+)["']?\)/g)) {
              const asset = new URL(match[1], location.href)
              if (asset.origin !== location.origin || !artwork.includes(asset.pathname)) {
                throw Error('Imagem de fundo fora da referência de paleta: ' + asset.href)
              }
            }
          }
          for (const [token] of value.matchAll(colors)) {
            let color = normalized.get(token)
            if (color === undefined) {
              // Compare the pigment independent of its opacity. Rasterization
              // introduces many more RGB values along text and curved edges.
              const opaque = token.replace(/\s*\/\s*[\d.%]+\s*\)$/, ')').replace(/^(rgba)\(([^,]+,[^,]+,[^,]+),[^)]+\)$/, 'rgb($2)')
              canvas.clearRect(0, 0, 1, 1)
              canvas.fillStyle = opaque
              canvas.fillRect(0, 0, 1, 1)
              color = Array.from(canvas.getImageData(0, 0, 1, 1).data.slice(0, 3), n => n.toString(16).padStart(2, '0')).join('')
              normalized.set(token, color)
            }
            if (!samples.has(color)) samples.set(color, { color, element: el.tagName + '.' + (el.getAttribute('class') ?? '') + (pseudo ?? '') + ' ' + (el.textContent ?? '').trim().slice(0, 24) + ' [' + token + ']', property })
          }
        }
      }
    }
    return [...samples.values()]
  }, Object.keys(reference.artwork))
}

export async function visitPaintStates(page: Page, collect: (samples: Sample[]) => void) {
  const sample = async () => collect(await readPaint(page))
  await sample()
  await page.locator('header a[href="/login"]').focus()
  await sample()
  for (const link of [page.locator('header a[href="/register"]'), page.locator('footer a').last(), page.locator('[data-landing-plan]').first()]) {
    if (await link.isVisible()) { await link.hover(); await sample() }
  }
  const menu = page.getByRole('button', { name: 'Abrir menu' })
  if (await menu.isVisible()) {
    await menu.click()
    await sample()
    await page.keyboard.press('Escape')
  }
  const levels = page.locator('[aria-label="Explore os níveis de inglês"] button')
  for (const level of await levels.all()) { await level.click(); await sample() }
  const options = page.locator('[aria-label="Alternativas"] button')
  for (const index of [0, 0]) {
    await options.nth(index).click()
    await sample()
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click()
    await sample()
    const next = page.locator('[data-exercise-feedback] ~ button').last()
    if (await next.count()) await next.click()
  }
  for (const mode of ['Montar', 'Relembrar']) {
    await page.getByRole('button', { name: mode, exact: true }).click()
    await sample()
    if (mode === 'Montar') {
      const words = page.locator('button').filter({ hasText: /^Can I have|^a coffee|^please/ })
      for (const item of await words.all()) { if (await item.isEnabled()) await item.click() }
      const verify = page.getByRole('button', { name: 'Verificar frase' })
      if (await verify.isEnabled()) { await verify.click(); await sample() }
    }
  }
  await page.getByRole('button', { name: 'Revelar significado' }).click()
  await sample()
  await page.locator('details summary').first().click()
  await sample()
}

// Accept exact original pigments and their sRGB shades/tints to black/white.
export function allowed(color: string) {
  const rgb = (hex: string) => [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16))
  const target = rgb(color)
  return reference.colors.some(base => {
    if (base === color) return true
    const channels = rgb(base)
    return [0, 255].some(endpoint => {
      const i = channels.indexOf(endpoint === 0 ? Math.max(...channels) : Math.min(...channels))
      const t = (target[i] - endpoint) / (channels[i] - endpoint)
      return t >= 0 && t <= 1 && channels.every((v, k) => Math.abs(Math.round(endpoint + t * (v - endpoint)) - target[k]) <= 1)
    })
  })
}

export async function checkArtwork(page: Page) {
  const paths = await page.locator('picture source, img, svg image').evaluateAll(nodes =>
    nodes.flatMap(node => {
      const single = node.getAttribute('src') ?? node.getAttribute('href') ?? node.getAttribute('xlink:href')
      const variants = (node.getAttribute('srcset') ?? '').split(',').map(candidate => candidate.trim().split(/\s+/)[0])
      return [single, ...variants].filter((path): path is string => Boolean(path))
    }))
  for (const file of new Set([...paths, ...Object.keys(reference.artwork)])) {
    expect(file in reference.artwork, file).toBe(true)
    expect(createHash('sha256').update(readFileSync(resolve('public', '.' + file))).digest('hex'), file)
      .toBe((reference.artwork as Record<string, string>)[file])
  }
}
