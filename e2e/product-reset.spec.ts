import { test, expect } from '@playwright/test'
test.beforeEach(async ({ request }) => { await request.post('/api/product-fixture', { data: {} }) })
test('add, duplicate click, feedback, collection and immediate review without audio', async ({ page, request }) => {
  await page.goto('/add'); await page.getByLabel('Em inglês').fill('take a break'); await page.getByLabel('Significado').fill('fazer uma pausa')
  const save=page.getByRole('button',{name:'Adicionar palavra',exact:true});await save.evaluate((el:HTMLButtonElement)=>{el.click();el.click()})
  await expect(page.getByRole('status')).toContainText('take a break');await expect(page.getByLabel('Em inglês')).toBeFocused()
  const state=await (await request.get('/api/product-fixture')).json();expect(state.calls).toBe(1);expect(state.words).toHaveLength(1)
  await page.locator('.word-confirmation').getByRole('link',{name:'Revisar'}).click();await expect(page.locator('.memory-card h2')).toHaveText('take a break')
  await page.getByRole('button',{name:'Mostrar resposta'}).click();await expect(page.locator('.memory-answer')).toHaveText('fazer uma pausa')
  await page.getByRole('button',{name:/Lembrei/}).click();await expect(page.locator('.memory-card h2')).not.toHaveText('take a break')
  await page.goto('/library');await page.locator('summary').click();await expect(page.locator('.collection-word')).toContainText('take a break')
})
test('failed and lost add responses retain draft and retry safely', async ({page,request})=>{
  await request.post('/api/product-fixture',{data:{fail:1,loseResponse:1}});await page.goto('/add');await page.getByLabel('Em inglês').fill('hello');await page.getByLabel('Significado').fill('olá');await page.getByRole('button',{name:'Adicionar palavra',exact:true}).click();await expect(page.locator('.product-error[role=alert]')).toContainText('Falha simulada');await page.getByRole('button',{name:'Tentar novamente',exact:true}).click();await expect(page.locator('.product-error[role=alert]')).toContainText('Envio não confirmado');await page.reload();await expect(page.getByLabel('Em inglês')).toHaveValue('hello');await page.getByRole('button',{name:'Tentar novamente',exact:true}).click();await expect(page.getByRole('status')).toContainText('hello');expect((await(await request.get('/api/product-fixture')).json()).words).toHaveLength(1)
})
test('review failure does not advance; retries, reload and repeated clicks retain progress',async({page,request})=>{
  await request.post('/api/product-fixture',{data:{fail:1}});await page.goto('/home');const original=await page.locator('.memory-card h2').innerText();await page.getByRole('button',{name:'Mostrar resposta'}).click();await page.getByRole('button',{name:/Lembrei/}).click();await expect(page.locator('.product-error[role=alert]')).toBeVisible();await expect(page.locator('.memory-card h2')).toHaveText(original)
  await page.getByRole('button',{name:/Lembrei/}).evaluate((el:HTMLButtonElement)=>{el.click();el.click()});await expect(page.locator('.memory-card h2')).not.toHaveText(original);await page.reload();await expect(page.locator('.memory-card h2')).not.toHaveText(original);expect((await(await request.get('/api/product-fixture')).json()).reviews).toHaveLength(1)
  for(let i=0;i<3;i++){await page.getByRole('button',{name:'Mostrar resposta'}).click();await page.getByRole('button',{name:/Lembrei/}).click()}
  await expect(page.getByRole('heading',{name:'Bom trabalho.'})).toBeVisible();await expect(page.getByText('4 respostas salvas.')).toBeVisible()
})
test('navigation, focus, reduced motion and layout across viewports',async({page})=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message))
  for(const [width,height] of [[320,568],[390,844],[768,1024],[1440,900],[844,390]]){
    await page.setViewportSize({width,height});await page.goto('/home');expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width)
    await page.getByRole('button',{name:'Mostrar resposta'}).click();await expect(page.getByRole('button',{name:/Lembrei/})).toBeVisible()
  }
  await page.setViewportSize({width:390,height:844})
  for(let i=0;i<3;i++){const trigger=page.getByRole('button',{name:'Abrir mais opções'});await trigger.click();await expect(page.getByRole('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);await expect(trigger).toBeFocused();await page.getByRole('navigation',{name:'Navegação rápida'}).getByRole('link',{name:'Coleção',exact:true}).click();await page.waitForURL('**/library');await page.goBack();await page.waitForURL('**/home');await page.goForward();await page.waitForURL('**/library');await page.goBack();await page.waitForURL('**/home')}
  const audit=await page.evaluate(()=>(window as unknown as {__motionAudit:()=>{detached:number;detachedTweens:number}}).__motionAudit());expect(audit.detached).toBe(0);expect(audit.detachedTweens).toBe(0)
  await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Abrir mais opções'}).click();await expect(page.getByRole('dialog')).toHaveCSS('transform','none');await page.keyboard.press('Escape');expect(errors).toEqual([])
})
test('large collection only renders a page and searches across all words',async({page,request})=>{
 const words=Array.from({length:1500},(_,i)=>({cardId:`word-${i}`,packId:'22222222-2222-4222-8222-222222222222',en:`word ${i}`,pt:`palavra ${i}`}));await request.post('/api/product-fixture',{data:{words}});await page.goto('/library');await expect(page.locator('.collection-word')).toHaveCount(50);await expect(page.getByText('1–50 de 1500 palavras')).toBeVisible();await page.getByRole('link',{name:'Próxima',exact:true}).click();await expect(page.getByText('51–100 de 1500 palavras')).toBeVisible();await page.getByRole('searchbox',{name:'Buscar palavra'}).fill('word 1499');await page.getByRole('button',{name:'Buscar',exact:true}).click();await expect(page.locator('.collection-word')).toHaveCount(1);await expect(page.locator('.collection-word')).toContainText('word 1499')
})
test('hero is usable with reduced motion and HTML remains readable without JavaScript',async({page,browser})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await expect(page.getByRole('heading',{name:'Palavras novas. Inglês que fica.'})).toBeVisible();await page.getByRole('button',{name:'Mostrar resposta'}).click();await expect(page.getByText('um pouco mais perto',{exact:true})).toBeVisible();await page.getByRole('button',{name:'Próxima palavra'}).click();await expect(page.getByRole('heading',{name:'make it happen'})).toBeVisible()
 const c=await browser.newContext({javaScriptEnabled:false});const p=await c.newPage();await p.goto('http://127.0.0.1:3100/');await expect(p.getByRole('heading',{name:'Palavras novas. Inglês que fica.'})).toBeVisible();await p.goto('http://127.0.0.1:3100/add');await expect(p.getByLabel('Em inglês')).toBeDisabled();await c.close()
})
