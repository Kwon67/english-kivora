import { auditStaticRibbonScroll, readRibbonState, showRibbonReference } from './ribbon-state.mjs'
import {chromium,webkit} from '@playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import sharp from 'sharp'
const reports=[]
for(const engine of ['chromium','webkit'])for(const mobile of [false,true]){
 const browser=await(engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{channel:'chrome'}:{})
 const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1440,height:900},deviceScaleFactor:mobile?3:1,isMobile:mobile,hasTouch:mobile})
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
 await page.goto('http://localhost:3100/',{waitUntil:'networkidle'});await page.waitForTimeout(1500)
 const baseline=JSON.parse(await fs.readFile('output/landing-performance/before/results.json','utf8')).find(r=>r.name===`${engine}-${mobile?'mobile':'desktop'}`)
 const read=()=>page.evaluate(readRibbonState)
 assert.equal((await read()).d,baseline.geometry.d,'Exact original path')
 if(mobile){const state=await page.evaluate(auditStaticRibbonScroll);assert(state.position==='absolute'&&state.clips>0&&state.canvas===0&&state.mutations===0)}
 const devicePixel = 1 / await page.evaluate(() => devicePixelRatio)
 const down=[]
 for(const p of [0,.2,.4,.6,.8,1]){await page.evaluate(p=>{document.documentElement.style.scrollBehavior='auto';scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*p)},p);await page.waitForTimeout(1000);const r=await read();assert.equal(r.hidden,0);down.push(r.offset)}
 assert(down.every((v,i)=>i===0||v<=down[i-1]));assert(down.at(-1)<devicePixel)
 const up=[]
 for(const p of [1,.8,.6,.4,.2,0]){await page.evaluate(p=>scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*p),p);await page.waitForTimeout(150);up.push((await read()).offset)}
 assert(up.every((v,i)=>i===0||v>=up[i-1]));assert(down.every((v,i)=>Math.abs(v-up[5-i])<1),'Reversible at same scroll position')
 await page.locator('#faq').scrollIntoViewIfNeeded();await page.waitForTimeout(1000)
 const faq=page.locator('details').first();await faq.locator('summary').click();await page.waitForTimeout(800);assert.equal(await faq.getAttribute('open'),'');assert(await faq.locator('p').isVisible())
 await page.screenshot({path:`output/workspace-refresh/${engine}-${mobile?'mobile':'desktop'}-verified.png`})
 await faq.locator('summary').click();await page.waitForTimeout(600);assert.equal(await faq.getAttribute('open'),null)
 await page.setViewportSize(mobile?{width:844,height:390}:{width:600,height:900});await page.waitForTimeout(700)
 await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));await page.waitForTimeout(500);assert((await read()).offset<devicePixel)
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(300);assert.equal((await read()).offset,0)
 await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(200);assert.equal((await read()).hidden,0)
 const visual=[]
 for(const viewport of [mobile?{width:390,height:844}:{width:1440,height:900},mobile?{width:844,height:390}:{width:600,height:900}]) {
 await page.setViewportSize(viewport);await page.waitForTimeout(500)
 for(const position of [0,.45,1]) {
  await page.evaluate(p=>scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*p),position);await page.waitForTimeout(200)
  const rendered=await page.screenshot()
  const restore = await showRibbonReference(page)
  const original = await page.screenshot()
  await restore()
  const a=await sharp(rendered).raw().toBuffer(),b=await sharp(original).raw().toBuffer();let changed=0,max=0
  for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);if(d>8)changed++;max=Math.max(max,d)}
  const ratio=changed/a.length;visual.push({viewport,position,changedChannelRatio:ratio,maxDifference:max});assert(ratio<.001,'Vector rendering must match original full mask')
 }
 }
 await page.evaluate(()=>scrollTo(0,0))
 await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(1200);assert(mobile ? (await read()).offset === 0 : (await read()).offset > 0)
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[])
 reports.push({engine,mobile,pathUnchanged:true,down,up,faq:true,resize:true,reducedMotion:true,visual,errors});console.log(`${engine} ${mobile?'mobile':'desktop'} passed`)
 await browser.close()
}
await fs.writeFile('output/workspace-refresh/ribbon-verification.json',JSON.stringify(reports,null,2))
