import { showRibbonReference } from './ribbon-state.mjs'
import {chromium,webkit} from '@playwright/test'
import fs from 'node:fs/promises'
const rows=[]
for(const engine of ['chromium','webkit']){
 const browser=await (engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{channel:'chrome'}:{})
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true})
 await page.goto('http://localhost:3100/');await page.waitForTimeout(2500)
 // Reconstruct the former raster rendering even when run on the optimized source.
 const restore = await showRibbonReference(page)
 for(const mode of ['static-reference','bands','bands-no-blur']) {
 if(mode==='bands')await restore()
 if(mode==='bands-no-blur')await page.addStyleTag({content:'nav {backdrop-filter:none!important}'})
 const cdp=engine==='chromium'?await page.context().newCDPSession(page):null
 if(cdp)await cdp.send('Tracing.start',{categories:'devtools.timeline',transferMode:'ReturnAsStream'})
 const result=await page.evaluate(async()=>{const frames=[];let last;const start=performance.now();document.documentElement.style.scrollBehavior='auto';await new Promise(done=>{const tick=t=>{if(last)frames.push(t-last);last=t;const p=Math.min(1,(t-start)/5000);scrollTo(0,(document.documentElement.scrollHeight-innerHeight)*(p<.5?p*2:2-p*2));if(p<1)requestAnimationFrame(tick);else done()};requestAnimationFrame(tick)});frames.sort((a,b)=>a-b);return {frames:frames.length,p95:frames[Math.floor(frames.length*.95)],over34:frames.filter(t=>t>34).length}})
 if(cdp){const completed=new Promise(r=>cdp.once('Tracing.tracingComplete',r));await cdp.send('Tracing.end');const {stream}=await completed;let json='';while(true){const r=await cdp.send('IO.read',{handle:stream});json+=r.data;if(r.eof)break}await cdp.send('IO.close',{handle:stream});const events=JSON.parse(json).traceEvents;result.trace=Object.fromEntries(['Paint','Layout','UpdateLayoutTree','PrePaint'].map(name=>[name,events.filter(e=>e.name===name&&e.ph==='X').reduce((s,e)=>s+(e.dur||0),0)/1000]));await cdp.detach()}
 rows.push({engine,mode,...result});console.log(rows.at(-1))
 }
 await browser.close()
}
await fs.writeFile('output/landing-performance/ablation.json',JSON.stringify(rows,null,2))
