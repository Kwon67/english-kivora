import {chromium,webkit,expect} from '@playwright/test'
import assert from 'node:assert/strict'
for(const engine of ['chromium','webkit']){
 const browser=await(engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{channel:'chrome'}:{})
 for(const width of [320,390,1440])for(const section of ['reports','dashboard']){
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message))
  await page.goto('http://localhost:3100/demo/organization-check?section='+section)
  if(section==='reports')await page.getByRole('tab',{name:'Por membro',exact:true}).click()
  await expect(page.locator('.admin-responsive-table tbody tr')).toHaveCount(4)
  await page.getByRole('tabpanel').getByRole('button',{name:'Próxima página'}).click();await expect(page.locator('.admin-responsive-table tbody tr')).toHaveCount(4)
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false)
  if(width<1024){const clipped=await page.locator('.admin-responsive-table td').evaluateAll(els=>els.filter(e=>e.getBoundingClientRect().width>0&&(e.getBoundingClientRect().right>innerWidth||e.scrollWidth>e.clientWidth+1)).length);assert.equal(clipped,0)}
  await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`output/study-quality/${engine}-${width}-${section}.png`,fullPage:true});assert.deepEqual(errors,[]);await page.close();console.log(engine,width,section,'OK')
 }
 await browser.close()
}
