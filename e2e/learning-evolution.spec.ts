import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'

test.beforeEach(async ({ page, request }) => {
  await request.post('/api/product-fixture', { data: {} })
  await page.route('**/*', route => ['localhost', '127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort())
  await page.emulateMedia({ reducedMotion: 'reduce' })
})

for (const level of ['A1','A2','B1','B2','C1','C2']) test(`${level}: context, free writing, rewrite and local recovery`, async ({ page }, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto(`/today?level=${level}`)
  await page.getByRole('button', { name: 'Começar contexto' }).click()
  await expect(page.getByRole('heading', { name: 'O que você entendeu?' })).toBeFocused()
  await page.getByRole('radio').first().check()
  await page.getByRole('button', { name: 'Usar o que entendi' }).click()
  const answer = 'I would suggest another time. Could we discuss the details before deciding?'
  await page.getByLabel('Seu texto em inglês', { exact: true }).fill(answer)
  await page.reload()
  await expect(page.getByLabel('Seu texto em inglês', { exact: true })).toHaveValue(answer)
  await page.getByRole('button', { name: 'Ver critérios e revisar' }).click()
  await expect(page.getByText('Você não precisa copiar as palavras dele.', { exact: false })).toBeVisible()
  await page.getByLabel('Sua nova versão', { exact: true }).fill('Let us consider another time and clarify the details together before we decide.')
  await page.getByRole('button', { name: 'Concluir esta prática' }).click()
  await expect(page.getByRole('heading', { name: 'Prática registrada' })).toBeVisible()
  await expect(page.getByText('Registro salvo somente neste navegador.')).toBeVisible()
  await expect(page.getByText(/não comprovam domínio do nível/)).toBeVisible()
  await page.reload(); await expect(page.getByRole('heading', { name: 'Prática registrada' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  if (level === 'A1') await page.screenshot({ path: `output/learning-evolution/today-${info.project.name}.png`, fullPage: true })
  expect(errors).toEqual([])
})

test('storage blocked preserves usable writing and explains the limitation', async ({ page }) => {
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException('Blocked', 'SecurityError') } })
  await page.goto('/today')
  await expect(page.getByText(/não conseguiu guardar o rascunho/)).toBeVisible()
  await page.getByRole('button', { name: 'Começar contexto' }).click()
  await page.getByRole('radio').first().check()
  await page.getByRole('button', { name: 'Usar o que entendi' }).click()
  await expect(page.getByLabel('Seu texto em inglês', { exact: true })).toBeEnabled()
  await page.getByLabel('Seu texto em inglês', { exact: true }).fill('Hi Maya. Ten is fine.')
  await page.getByRole('button', { name: 'Ver critérios e revisar' }).click()
  await page.getByLabel('Sua nova versão', { exact: true }).fill('Hi Maya, ten is fine. Can I bring a friend?')
  await page.getByRole('button', { name: 'Concluir esta prática' }).click()
  await expect(page.getByRole('heading', { name: 'Prática concluída' })).toBeVisible()
  await expect(page.getByText('Registro salvo somente neste navegador.')).toHaveCount(0)
})

test('failed review does not advance, retry saves exactly once and recovers', async ({ page, request }) => {
  await request.post('/api/product-fixture', { data: { fail: 1 } })
  await page.goto('/review')
  await page.getByRole('button', { name: 'Mostrar resposta' }).click()
  await page.getByRole('button', { name: /Lembrei/ }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Resposta não confirmada' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'How are you today?' })).toBeVisible()
  await page.getByRole('button', { name: /Lembrei/ }).click()
  await expect(page.getByRole('heading', { name: 'A coffee, please.' })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'A coffee, please.' })).toBeVisible()
  const state = await (await request.get('/api/product-fixture')).json()
  expect(state.reviews).toHaveLength(1)
})

test('pending relearning survives a reload with an empty server queue', async ({ page, request }) => {
  await request.post('/api/product-fixture', { data: { empty: true } })
  await page.addInitScript(() => {
    const card = { id:'review-a',card_id:'a',pack_id:'p',cards:{id:'a',english_phrase:'Hello.',portuguese_translation:'Olá.'},packs:{id:'p',level:'A1'},repetitions:0,total_reviews:1,interval_days:0,ease_factor:2.5,learning_step:1 }
    sessionStorage.setItem('kivora-focused-review-v2:fixture-user', JSON.stringify({ version:2,at:Date.now(),queue:[],pending:[{card,dueAt:Date.now()+60000}],completed:1 }))
  })
  await page.goto('/review'); await expect(page.getByText('PAUSA PARA FIXAR')).toBeVisible()
  await page.reload(); await expect(page.getByText('PAUSA PARA FIXAR')).toBeVisible()
  await expect(page.getByText('SESSÃO CONCLUÍDA')).toHaveCount(0)
})

test('guided flashcard has no zero denominator and restores its phase', async ({ page }) => {
  await page.goto('/guided')
  await expect(page.getByText('Flashcard · 1/0')).toHaveCount(0)
  await page.getByRole('button', { name: 'Mostrar resposta', exact: true }).click()
  await page.getByRole('button', { name: 'Continuar', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Continuar sessão' }).click()
  await expect(page.getByRole('button', { name: 'Mostrar resposta', exact: true })).toHaveCount(0)
})

test('empty review offers one useful contextual next action', async ({ page, request }) => {
  await request.post('/api/product-fixture', { data: { empty: true } })
  await page.goto('/review')
  await page.getByRole('link', { name: 'Praticar em contexto' }).click()
  await expect(page.getByTestId('today-session')).toBeVisible()
})

test('audio failure allows retry and never grades the learner', async ({ page }) => {
  // Exercise a manual retry consistently, including browsers that allow autoplay in tests.
  await page.addInitScript(() => {
    let activated = false
    document.addEventListener('click', () => { activated = true }, { capture: true, once: true })
    const play = HTMLMediaElement.prototype.play
    HTMLMediaElement.prototype.play = function () {
      return activated ? play.call(this) : Promise.reject(new DOMException('User gesture required', 'NotAllowedError'))
    }
  })
  let attempts = 0
  const manifest = JSON.parse(await readFile('audio/manifest.json', 'utf8')) as Record<string, { path: string }>
  const recording = await readFile('public' + Object.values(manifest)[0].path)
  await page.route('**/api/tts/preview?**', route => {
    attempts++
    return attempts === 1 ? route.fulfill({ status: 503 }) : route.fulfill({ contentType: 'audio/mpeg', body: recording })
  })
  await page.goto('/learning-lab?case=listening')
  await page.getByRole('button', { name: /Ouvir pronúncia/ }).click()
  await expect(page.getByText(/O áudio não está disponível/)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Áudio indisponível. Tentar novamente' })).toBeEnabled()
  await expect(page.getByTestId('listening-input')).toBeHidden()
  await expect(page.getByText('Avaliações: 0')).toBeVisible()
  await page.getByRole('button', { name: 'Áudio indisponível. Tentar novamente' }).click()
  await expect(page.getByTestId('listening-input')).toBeVisible()
  await expect(page.getByText('Avaliações: 0')).toBeVisible()
  expect(attempts).toBe(2)
})

test('single-card quiz uses an unscored fallback without fabricated alternatives', async ({ page }) => {
  await page.goto('/learning-lab?case=choice')
  await expect(page.getByText(/não tem alternativas suficientes/)).toBeVisible()
  await expect(page.getByText('Avaliações: 0')).toBeVisible()
  await expect(page.getByTestId('multiple-choice-option')).toHaveCount(0)
})

test('keyboard navigation returns focus after closing the global menu', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 }); await page.goto('/today')
  const trigger = page.getByRole('button', { name: 'Abrir menu de navegação' })
  await trigger.focus(); await page.keyboard.press('Enter')
  await expect(page.getByRole('dialog', { name: 'Seu espaço', exact: true })).toBeVisible()
  await page.keyboard.press('Escape'); await expect(trigger).toBeFocused()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('a failed lesson result stays available and retries without duplicating the session', async ({ page, request }) => {
  await request.post('/api/product-fixture', { data: { fail: 1 } })
  await page.goto('/game-recovery')
  await expect(page.getByText(/Resultado ainda não confirmado/)).toBeVisible()
  await expect(page).toHaveURL(/game-recovery/)
  await page.getByTestId('game-finish-button').click()
  await expect(page).toHaveURL(/\/home\?sessionComplete=true/)
  const state = await (await request.get('/api/product-fixture')).json()
  expect(state.games).toHaveLength(1)
  expect(state.games[0].clientSessionId).toMatch(/^[\da-f-]{36}$/)
})

for (const path of ['/failure', '/admin/failure']) test(`recoverable route error and focus: ${path}`, async ({ page }) => {
  await page.goto(path)
  await expect(page.getByRole('heading', { name: 'Não foi possível abrir esta área' })).toBeFocused()
  await page.getByRole('button', { name: 'Tentar novamente' }).click()
  await expect(page.getByRole('heading', { name: 'Área recarregada' })).toBeVisible()
})

for (const failure of ['failBefore', 'loseResponse']) test(`context account persistence: ${failure}, retry and another device`, async ({ page, request, browser }) => {
  await request.post('http://127.0.0.1:3211/__fixture', { data: { [failure]: 1 } })
  await page.goto('/today-account')
  await page.getByRole('button', { name: 'Começar contexto' }).click()
  await page.getByRole('radio').nth(1).check()
  await page.getByRole('button', { name: 'Usar o que entendi' }).click()
  await page.getByLabel('Seu texto em inglês', { exact: true }).fill('Hi Maya. Ten is fine.')
  await page.getByRole('button', { name: 'Ver critérios e revisar' }).click()
  const revision = 'Hi Maya, ten is fine. Can I bring a friend?'
  await page.getByLabel('Sua nova versão', { exact: true }).fill(revision)
  await page.getByRole('button', { name: 'Concluir esta prática' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'Não foi possível confirmar' })).toBeVisible()
  await expect(page.getByLabel('Sua nova versão', { exact: true })).toHaveValue(revision)
  await page.getByRole('button', { name: 'Concluir esta prática' }).click()
  await expect(page.getByText('Registro salvo na sua conta.')).toBeVisible()
  expect((await (await request.get('http://127.0.0.1:3211/__fixture')).json()).count).toBe(1)
  const otherDevice = await browser.newContext()
  try {
    const restored = await otherDevice.newPage()
    await restored.route('**/*', route => ['localhost','127.0.0.1'].includes(new URL(route.request().url()).hostname) ? route.continue() : route.abort())
    await restored.goto('http://127.0.0.1:3210/today-account')
    await expect(restored.getByText('Registro salvo na sua conta.')).toBeVisible()
    await restored.getByText('Ver minha versão revisada', { exact: true }).click()
    await expect(restored.getByText(revision, { exact: true })).toBeVisible()
  } finally { await otherDevice.close() }
})

test('global workspace tabs retain keyboard focus and expose their panels', async ({ page }) => {
  for (const path of ['/history','/settings','/admin/packs','/admin/reports']) {
    await page.goto(path)
    const tabs = page.getByRole('tab')
    const count = await tabs.count()
    expect(count).toBeGreaterThan(1)
    for (let index = 0; index < count; index++) {
      await tabs.nth(index).click()
      await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true')
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    }
    await tabs.last().focus(); await page.keyboard.press('Home')
    await expect(tabs.first()).toBeFocused()
  }
})

for (const localVoice of [false, true]) test(`shadowing preserves the task with ${localVoice ? 'a failed local voice' : 'only a remote voice'}`, async ({ page }) => {
  await page.addInitScript((localService) => {
    const synthesis = Object.assign(new EventTarget(), {
      getVoices: () => [{ lang: 'en-US', localService }],
      cancel: () => {}, speak: () => { throw new Error('Simulated voice unavailable') },
    })
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: synthesis })
    Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: class {} })
  }, localVoice)
  await page.goto('/today')
  await page.getByRole('button', { name: 'Começar contexto' }).click()
  await page.getByRole('radio').first().check()
  await page.getByRole('button', { name: 'Usar o que entendi' }).click()
  await page.getByText('Repetir com o áudio · opcional', { exact: true }).click()
  if (localVoice) {
    await page.getByRole('button', { name: 'Ouvir trecho' }).click()
    await expect(page.getByText('A voz do dispositivo não está disponível. Você pode continuar pela transcrição.')).toBeVisible()
  } else {
    await expect(page.getByRole('button', { name: 'Ouvir trecho' })).toHaveCount(0)
    await expect(page.getByText(/Sem voz local em inglês/)).toBeVisible()
  }
  await page.getByText('Ver transcrição', { exact: true }).click()
  await expect(page.getByLabel('Seu texto em inglês', { exact: true })).toBeEnabled()
})

test('admin export preserves empty-state meaning and emits valid PDF color operands', async ({ page }, info) => {
  await page.goto('/admin/reports')
  await expect(page.getByText('Um traço indica ausência de dados.', { exact: false })).toBeVisible()
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exportar PDF' }).click()
  const file = info.outputPath('admin-report.pdf')
  await (await downloading).saveAs(file)
  const pdf = (await readFile(file)).toString('latin1')
  expect(pdf.startsWith('%PDF-')).toBe(true)
  expect(pdf).toContain('Cards acompanhados')
  expect(pdf).not.toMatch(/#[a-f\d]{8}/i)
})

test('travel: three connected episodes, optional speaking, transfer and recovery', async ({ page }, info) => {
  await page.addInitScript(() => { if (navigator.mediaDevices) navigator.mediaDevices.getUserMedia = async () => { throw new DOMException('Denied', 'NotAllowedError') } })
  await page.goto('/today?unit=travel')
  for (let episode = 0; episode < 4; episode++) {
    await page.getByRole('button', { name: 'Começar contexto' }).click()
    const h = page.getByRole('heading', { name: 'O que você entendeu?' })
    await expect(h).toBeFocused()
    const headerBottom = await page.locator('.workspace-navigation').evaluate(el => el.getBoundingClientRect().bottom)
    expect((await h.boundingBox())!.y).toBeGreaterThanOrEqual(headerBottom)
    await page.getByRole('radio').nth([0,1,2,1][episode]).check()
    if (episode === 3) await expect(page.getByText('Você identificou a ideia.')).toHaveCount(0)
    await page.getByRole('button', { name: 'Usar o que entendi' }).click()
    if (episode === 0) {
      await page.getByText('Praticar em voz alta · opcional', { exact: true }).click()
      const record = page.getByRole('button', { name: 'Gravar minha tentativa' })
      if (await record.count()) { await record.click(); await expect(page.getByText(/Microfone indisponível/)).toBeVisible() }
      await page.getByRole('checkbox', { name: /Pratiquei em voz alta/ }).check()
    }
    if (episode === 3) { await expect(page.getByText('Repetir com o áudio · opcional',{exact:true})).toHaveCount(0); await expect(page.locator('blockquote')).toHaveCount(0); await page.getByText('Consultar o contexto', {exact:true}).click() }
    await page.getByLabel('Seu texto em inglês', {exact:true}).fill('Could you confirm the time and place? I can come on Wednesday.')
    await page.getByRole('button', {name:'Ver critérios e revisar'}).click()
    await page.getByLabel('Sua nova versão', {exact:true}).fill('Wednesday at eleven in Room 2 works for me. Please confirm the booking.')
    await page.getByRole('button', {name:'Concluir esta prática'}).click()
    await expect(page.getByRole('heading', {name:'Prática registrada'})).toBeVisible()
    await expect(page.getByRole('region', {name:'Evidências desta tentativa'})).toContainText('primeira escolha correta')
    if (episode === 0) await expect(page.getByRole('region', {name:'Evidências desta tentativa'})).toContainText('informou que praticou em voz alta')
    if (episode < 3) await page.getByRole('button', {name:episode===2?'Tentar uma situação nova':'Continuar a viagem'}).click()
  }
  await expect(page.getByRole('region', {name:'Evidências desta tentativa'})).toContainText('consultou apoio')
  await page.reload()
  await expect(page.getByText('Você completou a sequência e tentou transferir o que praticou.')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({path:`output/learning-evolution/travel-transfer-${info.project.name}.png`,fullPage:true})
})

test('signup: isolated errors, retry, confirmation, onboarding and first activity', async ({ page }, info) => {
  await page.goto('/register')
  await page.getByTestId('register-email').fill('unavailable@example.test')
  await page.getByTestId('register-password').fill('synthetic-password-123')
  await page.getByTestId('register-confirm-password').fill('synthetic-password-124')
  await page.getByTestId('register-submit').click()
  await expect(page.getByTestId('register-error')).toContainText('As senhas não conferem.')
  await page.getByTestId('register-confirm-password').fill('synthetic-password-123')
  await page.getByTestId('register-submit').click()
  await expect(page.getByTestId('register-error')).toContainText('temporariamente indisponível')
  await page.getByTestId('register-email').fill('synthetic@example.test')
  await page.getByTestId('register-submit').click()
  await expect(page.getByTestId('register-success')).toContainText('Confirme seu e-mail')
  await page.getByRole('button', {name:'Reenviar link de confirmação'}).click()
  await expect(page.getByRole('status').filter({ hasText: 'Se a conta aguarda confirmação' })).toBeVisible()
  await page.getByRole('button', {name:'Corrigir e-mail ou tentar novamente'}).click()
  await expect(page.getByTestId('register-email')).toHaveValue('synthetic@example.test')
  await expect(page.getByTestId('register-password')).toHaveValue('')
  await page.goto('/auth/confirm?code=expired-fixture')
  await expect(page).toHaveURL(/login\?confirmation=check/)
  await page.goto('/auth/confirm?code=fixture-confirmed')
  await expect(page).toHaveURL(/onboarding/)
  await page.getByTestId('onboarding-welcome-start').click()
  await page.getByTestId('onboarding-method-skip').click()
  await page.getByTestId('onboarding-interest-travel').click()
  await page.getByTestId('onboarding-goals-continue').click()
  await page.getByTestId('onboarding-starter-pack-assign').click()
  await expect(page).toHaveURL(/today/)
  await page.getByRole('button', {name:'Começar contexto'}).click()
  await page.getByRole('radio').nth(1).check()
  await page.getByRole('button', {name:'Usar o que entendi'}).click()
  await page.getByLabel('Seu texto em inglês', {exact:true}).fill('Hi Maya, ten is fine. Can I bring a friend?')
  await page.getByRole('button', {name:'Ver critérios e revisar'}).click()
  await page.getByLabel('Sua nova versão', {exact:true}).fill('Hi Maya, I am Alex. Ten at the cafe is fine. Can I bring a friend?')
  await page.getByRole('button', {name:'Concluir esta prática'}).click()
  await expect(page.getByRole('heading', {name:'Prática registrada'})).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({path:`output/learning-evolution/signup-first-activity-${info.project.name}.png`,fullPage:true})
})

test('travel account: another browser resumes next episode with saved comprehension evidence', async ({ page, request, browser }) => {
  await request.post('http://127.0.0.1:3211/__fixture', {data:{}})
  await page.goto('/travel-account')
  await page.getByRole('button',{name:'Começar contexto'}).click()
  await page.getByRole('radio').nth(2).check()
  await page.getByRole('radio').nth(0).check()
  await page.getByRole('button',{name:'Usar o que entendi'}).click()
  await page.getByLabel('Seu texto em inglês',{exact:true}).fill('Where can I buy a ticket to Central Station? Is this platform two?')
  await page.getByRole('button',{name:'Ver critérios e revisar'}).click()
  await page.getByLabel('Sua nova versão',{exact:true}).fill('Excuse me. Is platform two for Central Station? Where can I buy a train ticket?')
  await page.getByRole('button',{name:'Concluir esta prática'}).click()
  await expect(page.getByText('Registro salvo na sua conta.')).toBeVisible()
  await expect(page.getByRole('region',{name:'Evidências desta tentativa'})).toContainText('primeira escolha precisou de revisão')
  const secondDevice=await browser.newContext()
  try {
    const restored=await secondDevice.newPage()
    await restored.route('**/*',route=>['localhost','127.0.0.1'].includes(new URL(route.request().url()).hostname)?route.continue():route.abort())
    await restored.goto('http://127.0.0.1:3210/travel-account')
    await expect(restored.getByTestId('travel-unit-status')).toContainText('2/3 episódios')
    await expect(restored.getByRole('heading',{name:/2\./})).toBeVisible()
  } finally {await secondDevice.close()}
  expect((await (await request.get('http://127.0.0.1:3211/__fixture')).json()).count).toBe(1)
})

test('travel microphone: synthetic recording releases tracks and blob on completion', async ({ page }, info) => {
  await page.addInitScript(() => {
    const state = {stopped:0,revoked:0}
    Object.assign(window,{fixtureMicrophone:state})
    Object.defineProperty(navigator,'mediaDevices',{value:{getUserMedia:async()=>({getTracks:()=>[{stop:()=>state.stopped++}]})},configurable:true})
    class FakeRecorder {
      state='inactive';mimeType='audio/webm';ondataavailable:((e:{data:Blob})=>void)|null=null;onstop:(()=>void)|null=null
      start(){this.state='recording'}
      stop(){this.state='inactive';this.ondataavailable?.({data:new Blob(['synthetic sound'],{type:this.mimeType})});this.onstop?.()}
    }
    Object.assign(window,{MediaRecorder:FakeRecorder})
    const revoke=URL.revokeObjectURL.bind(URL)
    URL.revokeObjectURL=url=>{state.revoked++;revoke(url)}
  })
  await page.goto('/today?unit=travel')
  await page.getByRole('button',{name:'Começar contexto'}).click()
  await page.getByRole('radio').first().check()
  await page.getByRole('button',{name:'Usar o que entendi'}).click()
  await page.getByText('Praticar em voz alta · opcional',{exact:true}).click()
  await page.getByRole('button',{name:'Gravar minha tentativa'}).click()
  await expect(page.getByText('Gravando. Limite de um minuto; pare quando terminar.')).toBeVisible()
  await page.getByRole('button',{name:'Parar gravação'}).click()
  await expect(page.getByLabel('Ouvir minha tentativa')).toHaveAttribute('src',/^blob:/)
  await page.getByLabel('Seu texto em inglês',{exact:true}).fill('Excuse me. Is this the train to Central Station?')
  await page.getByRole('button',{name:'Ver critérios e revisar'}).click()
  await page.getByLabel('Sua nova versão',{exact:true}).fill('Excuse me. Is platform two for Central Station? Where can I buy a ticket?')
  await page.getByRole('button',{name:'Concluir esta prática'}).click()
  await expect(page.getByRole('heading',{name:'Prática registrada'})).toBeVisible()
  const state=await page.evaluate(()=>Reflect.get(window,'fixtureMicrophone') as {stopped:number;revoked:number})
  expect(state.stopped).toBeGreaterThan(0);expect(state.revoked).toBe(1)
  await page.screenshot({path:`output/learning-evolution/travel-viewport-${info.project.name}.png`})
})

test('onboarding recovers a disconnected submit and reaches today without an eligible pack', async ({ page, request }) => {
  await request.post('/api/product-fixture', { data: { empty: true } })
  await page.goto('/onboarding')
  await page.getByTestId('onboarding-welcome-start').click()
  let dropped = false
  await page.route('**/onboarding', route => {
    if (!dropped && route.request().method() === 'POST') {
      dropped = true
      return route.abort('failed')
    }
    return route.continue()
  })
  const skip = page.getByTestId('onboarding-method-skip')
  await skip.click()
  await expect(page.getByRole('alert').filter({ hasText: 'Verifique a conexão' })).toBeVisible()
  await expect(skip).toBeEnabled()
  await skip.click()
  await page.getByTestId('onboarding-interest-travel').click()
  await page.getByTestId('onboarding-goals-continue').click()
  await expect(page.getByTestId('onboarding-starter-pack-assign')).toBeDisabled()
  await expect(page.getByText(/Não encontramos packs públicos/)).toBeVisible()
  await page.getByTestId('onboarding-starter-pack-skip').click()
  await expect(page.getByRole('button', { name: 'Começar contexto' })).toBeEnabled()
})

test('Blitz restores only the signed-in learner’s result after reopening the game', async ({ page }) => {
  await page.goto('/blitz/play')
  const exit = page.getByRole('button', { name: 'Sair do Blitz' })
  await expect(exit).toBeVisible()
  const snapshot = {
    score: 41, maxCombo: 3, cardsAnswered: 2, savedBest: 41, personalBest: 41,
    isNewRecord: false, misses: [], runRewards: null, saveStatus: 'saved', savedAt: new Date().toISOString(),
  }
  await page.evaluate(value => {
    sessionStorage.setItem('kivora-blitz-result', value)
    sessionStorage.setItem('kivora-blitz-result:another-fixture-user', value)
  }, JSON.stringify(snapshot))
  await page.reload()
  await expect(exit).toBeVisible()
  await expect(page.locator('#blitz-result-title')).toHaveCount(0)
  await page.evaluate(value => sessionStorage.setItem('kivora-blitz-result:admin-fixture', value), JSON.stringify(snapshot))
  await page.reload()
  await expect(page.locator('#blitz-result-title')).toBeVisible()
})

test('closing the speaking exercise during permission acquisition releases a late microphone', async ({ page }) => {
  await page.addInitScript(() => {
    let release: () => void = () => {}
    let stopped = 0
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: {
      getUserMedia: () => new Promise(resolve => {
        release = () => resolve({ getTracks: () => [{ stop: () => { stopped++ } }] })
      }),
    } })
    Object.defineProperty(window, 'MediaRecorder', { configurable: true, value: class {
      constructor() { throw new Error('The closed exercise must never start recording') }
    } })
    Object.assign(window, { finishPermission: () => release(), stoppedTracks: () => stopped })
  })
  await page.goto('/today?unit=travel')
  await page.getByRole('button', { name: 'Começar contexto' }).click()
  await page.getByRole('radio').first().check()
  await page.getByRole('button', { name: 'Usar o que entendi' }).click()
  const details = page.getByText('Praticar em voz alta · opcional', { exact: true })
  await details.click()
  await page.getByRole('button', { name: 'Gravar minha tentativa' }).click()
  await expect(page.getByRole('button', { name: 'Aguardando microfone…' })).toBeDisabled()
  await details.click()
  await page.waitForFunction(() => !document.querySelector('details[open] button:disabled'))
  await page.evaluate(() => Reflect.get(window, 'finishPermission')())
  await expect.poll(() => page.evaluate(() => Reflect.get(window, 'stoppedTracks')())).toBe(1)
  await details.click()
  await expect(page.getByText('Microfone indisponível', { exact: false })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Gravar minha tentativa' })).toBeEnabled()
})
