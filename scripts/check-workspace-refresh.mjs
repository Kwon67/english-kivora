import { chromium,webkit } from '@playwright/test'
import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
const results=[]
for(const engine of ['chromium','webkit'])for(const width of [390,1440]){
 const browser=await(engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{channel:'chrome'}:{})
 const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message))
 for(const admin of [false,true]){
 await page.goto(`http://localhost:3100/demo/workspace-check${admin?'?admin=1':''}`);await page.waitForTimeout(1600)
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
 if(!admin){await page.getByRole('button',{name:'Mostrar resposta'}).click();await page.waitForTimeout(600);assert(await page.getByText('Cada pequeno passo abre uma nova porta.').isVisible())}
 await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(1000)
 if(!admin){assert.equal(await page.locator('.practice-routes').evaluate(e=>getComputedStyle(e).opacity),'1');assert.equal(await page.locator('img[src*=workspace]').count(),2)}
 const style=await page.locator('h1').evaluate(e=>({font:getComputedStyle(e).fontFamily,weight:getComputedStyle(e).fontWeight}));assert.equal(style.weight,'500');assert(!style.font.includes('Georgia'))
 await page.screenshot({path:`output/workspace-refresh/${engine}-${width}-${admin?'admin':'member'}.png`,fullPage:true})
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(200)
 assert.equal(await page.locator('h1').evaluate(e=>getComputedStyle(e).opacity),'1')
 await page.emulateMedia({reducedMotion:'no-preference'})
 }
 results.push({engine,width,errors});assert.deepEqual(errors,[]);await browser.close()
}
await fs.writeFile('output/workspace-refresh/browser-results.json',JSON.stringify(results,null,2));console.log(results)
