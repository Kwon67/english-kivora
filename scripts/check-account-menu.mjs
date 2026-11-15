import {chromium,webkit} from '@playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const results=[]
for(const engine of ['chromium','webkit']){
 const browser=await(engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{channel:'chrome'}:{})
 for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto('http://localhost:3100/demo/account-check'+(width===320?'?long=1&member=1':''));await page.waitForTimeout(500)
  const trigger=page.getByRole('button',{name:'Abrir opções da conta'});await trigger.click()
  const menu=page.getByRole('menu');await menu.waitFor();assert(await page.getByRole('menuitem',{name:'Minha conta'}).isVisible());assert(await page.getByRole('menuitem',{name:'Sair da conta'}).isVisible())
  assert.equal(await page.getByRole('menuitem',{name:'Administração'}).count(),width===320?0:1)
  const bounds=await menu.boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=width)
  await page.waitForTimeout(600)
  await page.screenshot({path:`output/account-menu/${engine}-${width}.png`})
  await page.keyboard.press('Escape');await menu.waitFor({state:'hidden'});assert(await trigger.evaluate(e=>e===document.activeElement))
  await trigger.press('Enter');await menu.waitFor();await page.keyboard.press('ArrowDown');assert(await page.evaluate(()=>document.activeElement?.getAttribute('role')==='menuitem'))
  await page.keyboard.press('Escape');await page.emulateMedia({reducedMotion:'reduce'});await trigger.click();await menu.waitFor();assert(await menu.evaluate(e=>parseFloat(getComputedStyle(e).animationDuration)<=.00001));assert.equal(await menu.evaluate(e=>getComputedStyle(e).transform),'none');await page.waitForTimeout(200);await page.mouse.click(10,500);await menu.waitFor({state:'hidden'})
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);results.push({engine,width,errors,keyboard:true,reducedMotion:true});await page.close()
 }
 await browser.close()
}
await fs.writeFile('output/account-menu/results.json',JSON.stringify(results,null,2));console.log(results)
