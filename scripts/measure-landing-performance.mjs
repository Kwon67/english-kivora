import { readRibbonState } from './ribbon-state.mjs'
import { chromium, webkit } from '@playwright/test'
import fs from 'node:fs/promises'
const label = process.argv[2] || 'current'
const out = `output/landing-performance/${label}`
await fs.mkdir(out, {recursive:true})
const results=[]
for (const engine of ['chromium','webkit']) for (const mobile of [false,true]) {
 const browser=await (engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{channel:'chrome',headless:true}:{headless:true})
 const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile})
 const page=await context.newPage(); const errors=[]
 page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 await page.addInitScript(()=>{window.__geometry=0;const original=SVGPathElement.prototype.getTotalLength;SVGPathElement.prototype.getTotalLength=function(){window.__geometry++;return original.call(this)}})
 await page.goto('http://localhost:3100/',{waitUntil:'networkidle'}); await page.waitForTimeout(1600)
 const name=`${engine}-${mobile?'mobile':'desktop'}`
 const geometry=await page.evaluate(readRibbonState)
 const runs=[]
 for(let trial=0;trial<3;trial++) {
 const session=engine==='chromium'?await context.newCDPSession(page):null
 if(session)await session.send('Performance.enable')
 const before=session?(await session.send('Performance.getMetrics')).metrics:null
 const sample=await page.evaluate(async()=>{
 document.documentElement.style.scrollBehavior='auto'
 const intervals=[]; let last; const start=performance.now(); const duration=6000; const max=document.documentElement.scrollHeight-innerHeight
 await new Promise(resolve=>{function frame(now){if(last)intervals.push(now-last);last=now;const p=Math.min(1,(now-start)/duration);window.scrollTo(0,max*(p<.5?p*2:2-p*2));if(p<1)requestAnimationFrame(frame);else resolve()}requestAnimationFrame(frame)})
 intervals.sort((a,b)=>a-b);return {frames:intervals.length,p50:intervals[Math.floor(intervals.length*.5)],p95:intervals[Math.floor(intervals.length*.95)],over34:intervals.filter(x=>x>34).length,geometryCalls:window.__geometry}
 })
 if(session){const after=(await session.send('Performance.getMetrics')).metrics;sample.cpu=Object.fromEntries(['TaskDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount'].map(k=>[k,after.find(x=>x.name===k).value-before.find(x=>x.name===k).value]));await session.detach()}
 runs.push(sample)
 }
 await page.locator('#faq').scrollIntoViewIfNeeded();await page.waitForTimeout(1000)
 const pre=await page.evaluate(()=>window.__geometry)
 await page.locator('details summary').first().click();await page.waitForTimeout(700)
 const faqGeometry=await page.evaluate(()=>window.__geometry)-pre
 await page.screenshot({path:`${out}/${name}-faq.png`})
 await page.setViewportSize(mobile?{width:844,height:390}:{width:1100,height:800});await page.waitForTimeout(600)
 await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(600)
 const bottom=await page.evaluate(readRibbonState)
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(300)
 const hidden=await page.locator('[data-reveal]').evaluateAll(es=>es.filter(e=>getComputedStyle(e).opacity==='0').length)
 results.push({name,geometry,runs,faqGeometry,bottom,hidden,errors});console.log(JSON.stringify(results.at(-1)))
 await browser.close()
}
await fs.writeFile(`${out}/results.json`,JSON.stringify(results,null,2))
