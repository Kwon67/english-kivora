import { chromium, webkit } from '@playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const results=[]
for (const engine of ['chromium','webkit']) {
 const browser=await(engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{channel:'chrome'}:{})
 for(const width of [320,390,768,1440]) {
  const page=await browser.newPage({viewport:{width,height:900}});const errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto('http://localhost:3100/demo/shape-check');await page.waitForTimeout(300)
  const icons=await page.locator('.practice-route-icon').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e),v=e.querySelector('svg').getBoundingClientRect();return {width:r.width,height:r.height,radius:s.borderRadius,svgWidth:v.width,svgHeight:v.height}}))
  assert.equal(icons.length,3);icons.forEach(r=>{assert.equal(r.width,42);assert.equal(r.height,42);assert.equal(r.radius,'50%');assert.equal(r.svgWidth,r.svgHeight)})
  const images=await page.locator('.admin-header-illustration').evaluateAll(es=>es.map(e=>({loaded:e.complete&&e.naturalWidth>0,ratio:e.getBoundingClientRect().width/e.getBoundingClientRect().height})))
  assert.equal(images.length,2);images.forEach(i=>{assert(i.loaded);assert(Math.abs(i.ratio-1.5)<.01)})
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[])
  await page.screenshot({path:`output/circle-fix/${engine}-${width}.png`,fullPage:true});results.push({engine,width,icons,images,errors});await page.close()
 }
 await browser.close()
}
await fs.writeFile('output/circle-fix/results.json',JSON.stringify(results,null,2));console.log('8 scenarios passed: circular icons, loaded illustrations, no overflow or JS errors')
