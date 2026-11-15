import {chromium,webkit} from '@playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const results=[]
await Promise.all(['chromium','webkit'].map(async engine => {
 const browser=await(engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{channel:'chrome'}:{})
 for(const width of [390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  // No writes or external requests: these are presentation fixtures.
  await page.route('**/*.supabase.co/**',route=>route.abort())
  for(const section of ['before','reports','dashboard','members','assign','packs','generate','history','review']) {
   await page.goto('http://localhost:3100/demo/organization-check?section='+section);await page.waitForTimeout(900)
   const initialHeight=await page.evaluate(()=>document.documentElement.scrollHeight)
   const tabs=page.getByRole('tab'), count=await tabs.count();const heights=[]
   for(let i=0;i<count;i++){
    await tabs.nth(i).click();await page.waitForTimeout(850)
    assert.equal(await page.getByRole('tabpanel').count(),1,'only one visible panel')
    await page.getByRole('tabpanel').evaluate(e=>e.scrollIntoView({block:'start'}));await page.waitForTimeout(800)
    const hidden=await page.getByRole('tabpanel').locator('[data-motion-surface]').evaluateAll(els=>els.filter(e=>e.getBoundingClientRect().top<innerHeight&&e.getBoundingClientRect().bottom>0&&getComputedStyle(e).opacity==='0').length)
    assert.equal(hidden,0,'visible content must not remain transparent')
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'no horizontal page overflow')
    await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(800);await page.evaluate(()=>scrollTo(0,0));
    heights.push(await page.evaluate(()=>document.documentElement.scrollHeight))
   }
   if(count){await tabs.first().click();await tabs.first().focus();await page.keyboard.press('End');assert.equal(await tabs.last().getAttribute('aria-selected'),'true');await page.keyboard.press('Home');assert.equal(await tabs.first().getAttribute('aria-selected'),'true')}
   if(section==='assign'){
    await page.getByRole('tab',{name:'Grupos',exact:true}).click();const input=page.getByPlaceholder(/nome do grupo/i);if(await input.count()){await input.fill('Turma preservada');await tabs.first().click();await page.getByRole('tab',{name:'Grupos',exact:true}).click();assert.equal(await input.inputValue(),'Turma preservada')}
   }
   if(section==='packs'){await page.getByRole('tab',{name:'Criar pack',exact:true}).click();await page.getByPlaceholder('Nome do pack',{exact:true}).fill('Novo pack preservado');await page.getByRole('tab',{name:'Áudio',exact:true}).click();await page.getByRole('tab',{name:'Criar pack',exact:true}).click();assert.equal(await page.getByPlaceholder('Nome do pack',{exact:true}).inputValue(),'Novo pack preservado')}
   if(section==='generate'){
    await page.getByLabel('Tema ou contexto').fill('Conversas de viagem');await page.getByText('Personalizar instruções e visibilidade',{exact:true}).click();await page.getByLabel('Instruções para a IA',{exact:false}).fill('Frases naturais');await page.getByText('Personalizar instruções e visibilidade',{exact:true}).click();await page.getByText('Personalizar instruções e visibilidade',{exact:true}).click();assert.equal(await page.getByLabel('Instruções para a IA',{exact:false}).inputValue(),'Frases naturais')
   }
   await page.evaluate(()=>{if(document.activeElement instanceof HTMLElement)document.activeElement.blur();scrollTo(0,document.documentElement.scrollHeight)});await page.waitForTimeout(850);await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(300);await page.screenshot({path:`output/workspace-organization/${engine}-${width}-${section}.png`,fullPage:true})
   results.push({engine,width,section,initialHeight,panelHeights:heights});console.log(engine,width,section,'OK')
  }
  await page.goto('http://localhost:3100/demo/organization-check?section=reports#ranking');await page.waitForTimeout(1000);assert.equal(await page.getByRole('tab',{name:'Ranking',exact:true}).getAttribute('aria-selected'),'true')
  await page.getByRole('button',{name:'Próxima página'}).click();assert(await page.getByText('7º · Membro 7',{exact:true}).isVisible())
  await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('tab',{name:'Resumo',exact:true}).click();await page.setViewportSize({width:320,height:700});await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  assert.deepEqual(errors,[]);await page.close()
 }
 await browser.close()
}))
await fs.writeFile('output/workspace-organization/results.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2))
