import {chromium,webkit,expect} from '@playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const results=[]
for(const engine of ['chromium','webkit']){
 const browser=await(engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{channel:'chrome'}:{})
 for(const width of [320,390,768,1440]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[]
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  await page.route('**/*.supabase.co/**',r=>r.abort())
  await page.goto('http://localhost:3100/demo/study-quality-check');await page.waitForTimeout(800)
  const overflow=()=>page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)
  assert.equal(await overflow(),false)
  await page.locator('[data-date="2026-11-12"]').click()
  await expect(page.locator('.study-heatmap-detail')).toContainText('80%');await expect(page.locator('.study-heatmap-detail')).toContainText('20%')
  await expect(page.locator('.study-heatmap-detail')).toContainText('Bom domínio no dia')
  await page.locator('[data-date="2026-11-14"]').click();await expect(page.locator('.study-heatmap-detail')).toContainText('5 respostas autoavaliadas')
  await page.locator('[data-date="2026-11-13"]').click();await expect(page.locator('.study-heatmap-detail')).toContainText('Sem estudo registrado')
  await page.getByRole('button',{name:'Mês anterior'}).click();await page.locator('[data-date="2026-10-12"]').click();await expect(page.locator('.study-heatmap-detail')).toContainText('Precisa de reforço')
  await page.getByRole('button',{name:'Próximo mês'}).click();await page.locator('[data-date="2026-11-12"]').focus();await page.keyboard.press('Enter');await expect(page.locator('.study-heatmap-detail')).toContainText('80%')
  await expect(page.locator('[data-date="2026-11-16"]')).toBeDisabled()
  await page.getByText('Como interpretar este heatmap').click();assert.equal(await overflow(),false)
  await page.getByText('Como interpretar este heatmap').click()
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(250)
  await page.screenshot({path:`output/study-quality/${engine}-${width}-heatmap.png`,fullPage:true})
  for(const tab of ['Rotina','Sessões','Conta']){
   await page.getByRole('tab',{name:tab,exact:true}).click();await page.waitForTimeout(700)
   assert.equal(await overflow(),false);await expect(page.getByRole('tabpanel')).toHaveCount(1)
   if(tab==='Sessões'){await expect(page.getByRole('tabpanel').locator('.member-session-card')).toHaveCount(5);await page.getByRole('button',{name:'Próxima página'}).click();await expect(page.getByRole('tabpanel').locator('.member-session-card')).toHaveCount(5)}
   if(tab==='Conta'){await expect(page.getByRole('button',{name:'Salvar nível'})).toBeVisible();await expect(page.getByRole('button',{name:/remover/i}).first()).toBeVisible()}
  }
  await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('tab',{name:'Qualidade',exact:true}).click();await page.setViewportSize({width:width===320?768:320,height:800});assert.equal(await overflow(),false)
  const font=await page.locator('.study-heatmap h2').evaluate(e=>getComputedStyle(e).fontFamily);assert.match(font,/Inter|inter/)
  await page.goto('http://localhost:3100/demo/study-quality-check?section=problems');await page.waitForTimeout(500)
  for(const tab of ['Recuperar','Erros recentes','Consolidar']){await page.getByRole('tab',{name:tab,exact:true}).click();assert.equal(await overflow(),false)}
  assert.deepEqual(errors,[]);results.push({engine,width,checks:'dates, accuracy, self-rating, empty day, month navigation, keyboard, pagination, account controls, resize, reduced motion, typography',consoleErrors:0});await page.close();console.log(engine,width,'OK')
 }
 await browser.close()
}
await fs.writeFile('output/study-quality/browser-results.json',JSON.stringify(results,null,2))
