import { expect, test } from '@playwright/test'
import { readFileSync } from 'node:fs'
import { staticAudioUrl } from '../src/lib/staticAudio'
import { WELCOME_TEXT } from '../src/lib/audioRoles'
import { getTutorScenario } from '../src/features/tutor/lib/scenarios'

test.beforeEach(async ({ page }) => {
  await page.route('**/*', (route) =>
    ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname)
      ? route.continue()
      : route.abort(),
  )
  await page.goto('/today?unit=travel')
  await page.getByText('Praticar a escuta com três vozes').click()
})

test('escuta real das três vozes, pausa e navegação', async ({ page }) => {
  for (const voice of ['siren', 'lauren', 'jarnathan'] as const) {
    const clip = staticAudioUrl(WELCOME_TEXT, voice)
    expect(clip).toBeTruthy()
    const response = page.waitForResponse((r) => r.url().endsWith(clip!) && r.ok())
    await page.getByRole('button', { name: 'Ouvir ' + voice, exact: true }).click()
    await response
    const pause = page.getByRole('button', { name: 'Pausar áudio' })
    await expect(pause).toHaveCount(1)
    await expect(pause).toHaveClass(/bg-primary-light/)
    await pause.click()
    await expect(page.getByRole('button', { name: 'Ouvir ' + voice, exact: true })).toBeEnabled()
  }
  await page.getByRole('button', { name: 'Começar contexto' }).click()
  await expect(page.getByRole('button', { name: 'Ouvir contexto' })).toBeVisible()
})

test('falha do MP3 recorre à prévia sem bloquear a atividade', async ({ page }) => {
  await page.route('**/audio/kivora/*.mp3', (route) => route.fulfill({ status: 404, body: '' }))
  const data = readFileSync('public' + staticAudioUrl(WELCOME_TEXT, 'siren'))
  await page.route('**/api/tts/preview?*', (route) =>
    route.fulfill({ contentType: 'audio/mpeg', body: data }),
  )
  const fallback = page.waitForResponse((r) => r.url().includes('/api/tts/preview?'))
  await page.getByRole('button', { name: 'Ouvir siren' }).click()
  await fallback
  await expect(page.getByRole('button', { name: 'Pausar áudio' })).toHaveClass(/bg-primary-light/)
  await page.getByRole('button', { name: 'Começar contexto' }).click()
  await expect(page.getByRole('heading', { name: 'O que você entendeu?' })).toBeVisible()
})

test('diálogo do hotel usa as duas vozes e interrompe a fala anterior', async ({ page }) => {
  await page.evaluate(() =>
    localStorage.setItem(
      'kivora-travel-v1:fixture-user',
      JSON.stringify({
        version: 1,
        completed: ['travel-arrival-01'],
        updatedAt: new Date().toISOString(),
      }),
    ),
  )
  await page.reload()
  await page.getByRole('button', { name: 'Começar contexto' }).click()
  const lines = [
    {
      label: 'Ouvir fala 1 · Receptionist',
      text: 'Your room will be ready at three. You can leave your bag here now.',
      voice: 'lauren',
    },
    { label: 'Ouvir fala 2 · Guest', text: 'Can I collect it at two?', voice: 'jarnathan' },
  ] as const
  for (const line of lines) {
    const url = staticAudioUrl(line.text, line.voice)
    expect(url).toBeTruthy()
    const response = page.waitForResponse((r) => r.url().endsWith(url!) && r.ok())
    await page.getByRole('button', { name: line.label }).click()
    await response
    await expect(page.getByRole('button', { name: 'Pausar áudio' })).toHaveCount(1)
    await expect(page.getByRole('button', { name: 'Pausar áudio' })).toHaveClass(/bg-primary-light/)
  }
  await page.getByRole('radio').nth(1).check()
  await page.getByRole('button', { name: 'Usar o que entendi' }).click()
  await expect(page.getByLabel('Seu texto em inglês', { exact: true })).toBeVisible()
})

test('Tutor toca uma resposta simulada e cancela sem repetir síntese', async ({ page }) => {
  // A published opening plays locally. Use a distinct conversation reply to exercise streaming.
  await page.evaluate(() => {
    sessionStorage.setItem(
      'kivora-tutor-draft-v1:fixture-user:coffee-shop',
      JSON.stringify({
        version: 1,
        input: '',
        messages: [{ role: 'assistant', content: 'We have a fresh pot of decaf for your table.' }],
      }),
    )
  })
  await page.addInitScript(() => {
    const Base = window.Audio
    window.Audio = class extends Base {
      constructor(src?: string) {
        super(src)
        Object.assign(window, { tutorTestAudio: this })
      }
    }
  })
  let posts = 0
  const audio = readFileSync('public' + staticAudioUrl(WELCOME_TEXT, 'lauren'))
  await page.route('**/api/tts/tutor', (r) => {
    posts++
    return r.fulfill({ contentType: 'audio/mpeg', body: audio })
  })
  await page.goto('/audio-tutor-fixture')
  await page.getByRole('button', { name: 'Ouvir resposta 1' }).click()
  await expect
    .poll(() =>
      page.evaluate(
        () => (Reflect.get(window, 'tutorTestAudio') as HTMLAudioElement | undefined)?.currentTime ?? 0,
      ),
    )
    .toBeGreaterThan(0)
  await page.getByRole('button', { name: 'Parar áudio' }).click()
  expect(await page.evaluate(() => (Reflect.get(window, 'tutorTestAudio') as HTMLAudioElement).paused)).toBe(
    true,
  )
  expect(posts).toBe(1)
})

test('Tutor reproduz a abertura publicada sem pedir síntese', async ({ page }) => {
  const path = staticAudioUrl(getTutorScenario('coffee-shop')?.initialMessage, 'lauren')
  expect(path).toBeTruthy()
  const requests: string[] = []
  await page.route('**/api/tts**', (route) => {
    requests.push(route.request().method())
    return route.abort()
  })
  await page.goto('/audio-tutor-fixture')
  const recording = page.waitForResponse((r) => r.url().endsWith(path!) && r.ok())
  await page.getByRole('button', { name: 'Ouvir resposta 1' }).click()
  await recording
  await page.getByRole('button', { name: 'Parar áudio' }).click()
  expect(requests).toEqual([])
})

for (const example of [
  { level: 'B1', fixture: 'recorded-listening', text: 'Give me a couple of minutes.' },
  {
    level: 'C2',
    fixture: 'recorded-listening-c2',
    text: 'We can keep the discussion open, while we wait for the final decision.',
  },
]) {
  test(
    'card publicado usa Lauren na escuta sem solicitar síntese nem o arquivo legado · ' + example.level,
    async ({ page }) => {
      const path = staticAudioUrl(example.text, 'lauren')
      expect(path).toBeTruthy()
      const unexpected: string[] = []
      await page.route(/\/api\/tts|\/legacy-audio-fixture\.mp3/, (route) => {
        unexpected.push(new URL(route.request().url()).pathname)
        return route.abort()
      })
      await page.addInitScript(() => {
        let activated = false
        document.addEventListener(
          'click',
          () => {
            activated = true
          },
          { capture: true, once: true },
        )
        const play = HTMLMediaElement.prototype.play
        HTMLMediaElement.prototype.play = function () {
          return activated
            ? play.call(this)
            : Promise.reject(new DOMException('User gesture required', 'NotAllowedError'))
        }
      })
      await page.goto('/learning-lab?case=' + example.fixture)
      const recording = page.waitForResponse((r) => r.url().endsWith(path!) && r.ok())
      await page.getByRole('button', { name: 'Ouvir pronúncia' }).click()
      await recording
      await expect(page.getByRole('button', { name: 'Pausar áudio' })).toHaveClass(/bg-primary-light/)
      await page.getByRole('button', { name: 'Pausar áudio' }).click()
      await expect(page.getByTestId('listening-input')).toBeEnabled()
      expect(unexpected).toEqual([])
    },
  )
}

test('todos os MP3s publicados decodificam até o fim', async ({ page }) => {
  test.setTimeout(120_000)
  const entries: { path: string; sha256: string }[] = Object.values(
    JSON.parse(readFileSync('audio/manifest.json', 'utf8')),
  )
  const result = await page.evaluate(async (files) => {
    const context = new OfflineAudioContext(1, 1, 44100)
    const durations = []
    for (const entry of files) {
      const response = await fetch(entry.path)
      if (!response.ok) throw Error('Arquivo ausente')
      const bytes = await response.arrayBuffer()
      const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), (v) =>
        v.toString(16).padStart(2, '0'),
      ).join('')
      if (hash !== entry.sha256) throw Error('Digest divergente')
      const audio = await context.decodeAudioData(bytes)
      if (!audio.length || !audio.getChannelData(0).some((sample) => Math.abs(sample) > 0.001))
        throw Error('Gravação vazia')
      durations.push(audio.duration)
    }
    return durations
  }, entries)
  expect(result.length).toBe(entries.length)
  expect(Math.min(...result)).toBeGreaterThan(0)
})

test('card recorre ao arquivo legado quando o MP3 premium falha e o F0 está desligado', async ({ page }) => {
  const legacy = readFileSync('public' + staticAudioUrl(WELCOME_TEXT, 'lauren'))
  let synthesis = 0
  await page.route('**/api/tts**', route => { synthesis++; return route.abort() })
  await page.route('**/audio/kivora/*.mp3', route => route.fulfill({ status: 404, body: '' }))
  await page.route('**/legacy-audio-fixture.mp3', route => route.fulfill({ contentType: 'audio/mpeg', body: legacy }))
  const fallback = page.waitForResponse(r => r.url().endsWith('/legacy-audio-fixture.mp3') && r.ok())
  await page.goto('/learning-lab?case=recorded-listening-c2')
  const play = page.getByRole('button', {name:'Ouvir pronúncia'})
  if (await play.isVisible()) await play.click()
  await fallback
  await expect(page.getByRole('button', { name: 'Pausar áudio' })).toHaveClass(/bg-primary-light/)
  expect(synthesis).toBe(0)
})
