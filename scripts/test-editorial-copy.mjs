import { strict as assert } from 'node:assert'
import { readFile, mkdtemp, access, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { applyEditorialCopy, writeEditorialCopy } from './apply-editorial-copy.mjs'
const source = 'output/learning-evolution/catalog-readonly.json'
const manifest = 'docs/catalogo-decisoes-editoriais-2026-11-16.json'
const rows = JSON.parse(await readFile(source, 'utf8'))
const decisions = JSON.parse(await readFile(manifest, 'utf8'))
test('all 116 findings have exactly one disposition; only 32 translations change', () => {
 assert.equal(decisions.decisions.length,116)
 assert.equal(new Set(decisions.decisions.map(item=>item.card_id)).size,116)
 assert.equal(decisions.patches.length,32)
 const updated=applyEditorialCopy(rows,decisions.patches)
 assert.equal(updated.length,2213)
 assert.equal(updated.filter((r,i)=>r.portuguese_translation!==rows[i].portuguese_translation).length,32)
 updated.forEach((row,i)=>assert.deepEqual({...row,portuguese_translation:rows[i].portuguese_translation},rows[i]))
 assert.deepEqual(applyEditorialCopy(updated,decisions.patches,true),rows)
 const wallet = updated.find(row=>row.id==='7d66c09d-4ca6-4633-8ce5-810f36ab1145')
 assert.deepEqual(wallet,rows.find(row=>row.id===wallet.id))
 assert.ok(wallet.accepted_translations.includes('Infelizmente, deixei minha carteira em casa.'))
})
test('conflicts, duplicate IDs and unintended fields fail before mutation', () => {
 const before=JSON.stringify(rows), patch=decisions.patches[0]
 for (const bad of [{...patch,before:'unexpected'}, {...patch,field:'english_phrase'}, {...patch,card_id:'missing'}]) assert.throws(()=>applyEditorialCopy(rows,[bad]))
 assert.throws(()=>applyEditorialCopy(rows,[patch,patch]))
 assert.equal(JSON.stringify(rows),before)
})
test('writes only a fresh copy; fingerprint conflict leaves no output', async () => {
 const directory=await mkdtemp(join(tmpdir(),'kivora-editorial-'))
 try {
  const destination=join(directory,'copy.json')
  await writeEditorialCopy(source,manifest,destination)
  await assert.rejects(writeEditorialCopy(source,manifest,destination))
  await assert.rejects(writeEditorialCopy(source,manifest,source))
  const bad=join(directory,'bad.json'), absent=join(directory,'absent.json')
  await writeFile(bad,JSON.stringify({...decisions,source_sha256:'wrong'}))
  await assert.rejects(writeEditorialCopy(source,bad,absent))
  await assert.rejects(access(absent))
 } finally { await rm(directory,{recursive:true,force:true}) }
})
