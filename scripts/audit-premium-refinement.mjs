import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const out='output/premium-refinement/after'; await mkdir(out,{recursive:true});
const publicURL=process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3001';
const fixtureURL=process.env.KIVORA_FIXTURE_URL;
if(!fixtureURL) throw new Error('KIVORA_FIXTURE_URL must point to the isolated UI harness');
for(const url of [publicURL,fixtureURL]) if(!['localhost','127.0.0.1','[::1]'].includes(new URL(url).hostname)) throw new Error('This audit only accepts localhost origins');
const b=await chromium.launch({executablePath:process.env.KIVORA_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const routes=[['landing',publicURL+'/'],['login',publicURL+'/login'],['register',publicURL+'/register'],...['home','explore','library','history','review','review-active','review-error','states','play/local-lesson','admin/dashboard'].map(r=>[r.replaceAll('/','-'),fixtureURL+'/'+r])];
const dimensions=[[1440,900],[834,1194],[390,844],[320,568],[844,390]];
const results=[];const errors=[];const consoleErrors=[];
for(const [name,url] of routes){
 const c=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});const p=await c.newPage();
 p.on('pageerror',e=>errors.push({name,message:e.message}));p.on('console',m=>{if(m.type()==='error')consoleErrors.push({name,message:m.text()})});
 try{
 const response=await p.goto(url,{waitUntil:'networkidle',timeout:60000});
 for(const [width,height] of dimensions){
  await p.setViewportSize({width,height});await p.evaluate(async()=>{await document.fonts.ready;scrollTo({top:0,behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
  const layout=await p.evaluate(()=>{
   const width=document.documentElement.clientWidth;
   const out=[];const clipped=[];
   for(const el of document.querySelectorAll('main *, header *, nav *')){
    if(!(el instanceof HTMLElement)||!el.getClientRects().length||el.closest('[aria-hidden="true"], .sr-only, [data-contained-carousel]'))continue;
    const style=getComputedStyle(el);if(style.visibility==='hidden'||style.clipPath==='inset(50%)')continue;
    let scrollParent=false;for(let parent=el.parentElement;parent;parent=parent.parentElement){if(['auto','scroll'].includes(getComputedStyle(parent).overflowX)&&parent.scrollWidth>parent.clientWidth+1){scrollParent=true;break}}
    const rect=el.getBoundingClientRect();
    if(!scrollParent&&rect.width>2&&(rect.left< -2||rect.right>width+2))out.push({tag:el.tagName,class:el.className,left:rect.left,right:rect.right});
    if(!scrollParent&&el.matches('button,a,input,select,textarea')&&el.clientWidth>0&&el.scrollWidth>el.clientWidth+2&&style.textOverflow!=='ellipsis')clipped.push(el.textContent?.slice(0,60));
   }
   const cta=document.querySelector('[data-testid="continue-learning"], [data-testid="game-start-button"]');const cr=cta?.getBoundingClientRect();const dock=document.querySelector('.workspace-navigation-dock');const dr=dock&&getComputedStyle(dock).display!=='none'?dock.getBoundingClientRect():null;
   return {scrollWidth:document.documentElement.scrollWidth,width,overflow:out.slice(0,12),clipped:clipped.slice(0,12),ctaBottom:cr?.bottom,dockTop:dr?.top??innerHeight,headings:document.querySelectorAll('h1').length,font:getComputedStyle(document.querySelector('h1')||document.body).fontFamily};
  });
  results.push({name,url,status:response?.status(),viewport:{width,height},...layout});
  await p.screenshot({path:`${out}/${name}-${width}x${height}.png`});
 }
 if(name==='landing'||name==='home'){
  await p.setViewportSize({width:1440,height:900});await p.evaluate(async()=>{scrollTo({top:0,behavior:'instant'});await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
  // Reveal one-shot scroll content before the full-page capture, then return to top.
  for(let y=0;y<await p.evaluate(()=>document.documentElement.scrollHeight);y+=700){await p.evaluate(y=>scrollTo({top:y,behavior:'instant'}),y);await p.waitForTimeout(30)}
  await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.screenshot({path:`${out}/${name}-full.png`,fullPage:true});
  if(name==='landing'){await p.locator('#como-funciona').scrollIntoViewIfNeeded();await p.screenshot({path:`${out}/landing-practices.png`})}
 }
 if(name==='library'){
  await p.setViewportSize({width:390,height:844});await p.getByRole('button',{name:'Criar pack',exact:true}).click();
  await p.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
  await p.screenshot({path:`${out}/library-create-390x844.png`});
 }
 }catch(e){errors.push({name,message:e.message})}finally{await c.close()}
 console.log(name)
}
await b.close();
const failures=results.filter(r=>r.status!==200||r.scrollWidth>r.width+1||r.overflow.length||r.clipped.length||(r.viewport.width===320&&r.name==='home'&&r.ctaBottom>r.dockTop));
await writeFile(`${out}/responsive-results.json`,JSON.stringify({results,failures,errors,consoleErrors},null,2));console.log(JSON.stringify({checks:results.length,failures:failures.length,errors:errors.length,consoleErrors:consoleErrors.length}));

if(failures.length||errors.length||consoleErrors.length)process.exitCode=1;
