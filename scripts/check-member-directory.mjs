import {chromium,webkit,expect} from '@playwright/test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
const results=[]
await Promise.all(['chromium','webkit'].map(async engine=>{
 const browser=await(engine==='chromium'?chromium:webkit).launch(engine==='chromium'?{channel:'chrome'}:{})
 for(const width of [320,390,768,1440]){
  const url='http://localhost:3100/demo/member-directory-check'
  const baseline=await browser.newPage({viewport:{width,height:900}});await baseline.goto(url+'?before=1');await baseline.waitForTimeout(850);const before=await baseline.locator('#diretorio table').evaluate(e=>({width:e.getBoundingClientRect().width,viewport:innerWidth}));await baseline.close()
  const page=await browser.newPage({viewport:{width,height:900}}),errors=[],writes=[]
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())})
  await page.route('**/*',route=>{if(route.request().method()==='POST' && !new URL(route.request().url()).pathname.startsWith('/__nextjs')){writes.push(route.request().url());return route.abort()}return route.continue()})
  await page.goto(url);await page.waitForTimeout(850)
  const cards=page.locator('.member-directory-card');await expect(cards).toHaveCount(4)
  async function assertFits(){
   const overflow=await page.locator('#diretorio').evaluate(root=>({page:document.documentElement.scrollWidth>innerWidth,section:root.scrollWidth>root.clientWidth+1,items:[...root.querySelectorAll('.member-directory-card,.member-directory-details dd,.member-directory-actions a,.member-directory-actions button,.workspace-pagination button')].filter(e=>{const r=e.getBoundingClientRect();return r.left<-.5||r.right>innerWidth+.5||e.scrollWidth>e.clientWidth+1}).map(e=>({tag:e.tagName,text:e.textContent.slice(0,60)}))}))
   assert.deepEqual(overflow,{page:false,section:false,items:[]})
  }
  await assertFits();assert.equal(await page.locator('#diretorio table').count(),0)
  await expect(cards.first().getByRole('button',{name:'Remover',exact:true})).toHaveCount(0)
  for(let i=0;i<4;i++){
   const card=cards.nth(i);await card.scrollIntoViewIfNeeded();await expect(card.getByText('E-mail mascarado',{exact:true})).toBeVisible();await expect(card.locator('.member-directory-email dd')).toContainText('*');await expect(card.getByRole('link',{name:/Ver perfil e histórico/})).toBeVisible();if(i)await expect(card.getByRole('button',{name:'Remover',exact:true})).toBeVisible()
  }
  const remove=page.getByRole('article',{name:'Membro bruce_wayne',exact:true}).getByRole('button',{name:'Remover',exact:true});await remove.click()
  const dialog=page.getByRole('dialog',{name:'Remover membro'});await expect(dialog).toBeVisible();await expect(dialog).toContainText('bruce_wayne');await dialog.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(dialog).toBeHidden();await expect(remove).toBeFocused()
  await remove.press('Enter');await expect(dialog).toBeVisible();await page.keyboard.press('Escape');await expect(dialog).toBeHidden();await expect(remove).toBeFocused()
  for(const first of [5,9,13,17]){await page.getByRole('button',{name:'Próxima página',exact:true}).click();await expect(page.getByRole('article',{name:`Membro Membro ${first}`,exact:true})).toBeVisible();await assertFits()}
  await expect(cards).toHaveCount(2);await expect(page.getByRole('article',{name:'Membro Membro 18',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'Admins',exact:true}).click();await expect(cards).toHaveCount(1)
  await page.getByRole('button',{name:'Alunos',exact:true}).click();await expect(cards).toHaveCount(4);await expect(cards.first()).toContainText('bruce_wayne')
  const search=page.getByRole('textbox',{name:'Buscar membros por nome ou email mascarado'});await search.fill('nao-existe');await expect(page.getByText('Nenhum membro encontrado',{exact:true})).toBeVisible();await search.fill('me*****@example.test');await expect(cards).toHaveCount(1);await expect(cards.first()).toContainText('bruce_wayne');await search.clear();await page.getByRole('button',{name:'Todos',exact:true}).click()
  await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(200);await page.screenshot({path:`output/member-directory-fix/${engine}-${width}.png`,fullPage:true})
  await page.emulateMedia({reducedMotion:'reduce'});await page.setViewportSize({width:width===320?1440:320,height:900});await assertFits()
  if(errors.length)console.log(JSON.stringify({engine,width,errors},null,2));assert.deepEqual(writes,[]);assert.deepEqual(errors,[])
  results.push({engine,width,before,afterHorizontalOverflow:false,membersReachable:18,filterSearchPagination:true,deleteConfirmationCancelled:true,keyboardFocus:true,reducedMotion:true,errors,writes});console.log(engine,width,'OK');await page.close()
 }
 await browser.close()
}))
await fs.writeFile('output/member-directory-fix/results.json',JSON.stringify(results,null,2))
