// The test-only fluent adapter is intentionally dynamic; no untyped values enter production code.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach,beforeEach,describe,it,expect,vi } from 'vitest'
const state=vi.hoisted(()=>({role:'learner',client:null as unknown as (role:string)=>any}))
vi.mock('server-only',()=>({}))
vi.mock('next/cache',()=>({revalidatePath:vi.fn()}))
vi.mock('@/lib/supabase/config',()=>({supabaseUrl:'http://127.0.0.1:3212',supabaseAnonKey:'synthetic'}))
vi.mock('@/lib/supabase/server',()=>({createClient:async()=>state.client(state.role),createAdminClient:()=>state.client('service')}))
vi.mock('@/lib/tts',()=>({parseTtsVoice:(voice:string)=>voice,TTS_DEFAULT_VOICE:'synthetic',synthesizeSpeechToBuffer:async()=>{throw Error('No external audio in test')}}))
vi.mock('@/features/security/lib/security',()=>({getAdminSecret:()=> 'synthetic',getStandardAuthError:vi.fn(),getClientIp:vi.fn(),hashSecurityValue:vi.fn(),isRateLimited:vi.fn(),getSecurityBlock:vi.fn(),peekRateLimit:vi.fn(),recordSecurityEvent:vi.fn()}))
import { createManualUserPackAction,appendCardsToUserPackAction,setUserPacksFolderAction,deleteUserPackAction } from './profile-pack-actions'
import { createMemberGroup,updateMemberGroup,deleteMemberGroup,createScheduledReviewRule,updateScheduledReviewRule,toggleScheduledReviewRule,materializeScheduledReviewReleasesForUser,evaluateGamification,createAssignment,createQuestAction,listQuestsAction,updateQuestAction,deleteQuestAction,updateWeeklyReportPreferenceAction } from './actions'
import { GET as evaluateMedals } from './api/cron/evaluate-medals/route'
import { parseScheduledReviewStatus } from '@/features/review/lib/reviewSchedules'
const owner='11111111-1111-4111-8111-111111111111',other='22222222-2222-4222-8222-222222222222'
const owned='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',privatePack='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',publicPack='cccccccc-cccc-4ccc-8ccc-cccccccccccc'
const reset=async(config={})=>fetch('http://127.0.0.1:3212/reset',{method:'POST',body:JSON.stringify(config)})
const fault=async(config:object)=>fetch('http://127.0.0.1:3212/fault',{method:'POST',body:JSON.stringify(config)})
async function groupSnapshot(id:string){
 const group=(await state.client('admin').from('member_groups').select('*').eq('id',id).single()).data
 const members=(await state.client('admin').from('member_group_members').select('*').eq('group_id',id)).data
 return {name:group.name,description:group.description,memberIds:members.map((m:any)=>m.user_id).sort()}
}
const rpc=async(role:string,name:string,args:object,actor?:string)=>(await fetch('http://127.0.0.1:3212/rpc',{method:'POST',body:JSON.stringify({role,name,args,actor})})).json()

describe.skipIf(process.env.KIVORA_ISOLATED_WORKFLOWS!=='1')('real server actions against isolated PostgreSQL',()=>{
 beforeEach(async()=>{const path=new URL('../../scripts/lib/isolated-learning-client.mjs',import.meta.url).href;state.client=(await import(/* @vite-ignore */ path)).createIsolatedClient;state.role='learner';await reset()})
 it('creates, reads, appends, moves and removes an owned collection, with database cascade',async()=>{
  const created=await createManualUserPackAction({name:'Synthetic collection',cards:[{en:'A new beginning.',pt:'Um novo começo.'}]})
  expect(created.success).toBe(true);if(!created.success)throw Error(created.error)
  expect((await state.client('learner').from('cards').select('*').eq('pack_id',created.packId)).data).toHaveLength(1)
  expect((await appendCardsToUserPackAction({packId:created.packId,cards:[{en:'A new beginning.',pt:'Um novo começo.'},{en:'A shared plan.',pt:'Um plano compartilhado.'}]})).success).toBe(true)
  expect((await state.client('learner').from('cards').select('*').eq('pack_id',created.packId)).data).toHaveLength(2)
  expect((await setUserPacksFolderAction([created.packId],'Viagens')).success).toBe(true)
  expect((await state.client('learner').from('packs').select('*').eq('id',created.packId).single()).data.category).toBe('Viagens')
  expect((await deleteUserPackAction(created.packId)).success).toBe(true)
  expect((await state.client('service').from('cards').select('*').eq('pack_id',created.packId)).data).toHaveLength(0)
 })
 it('blocks foreign collection mutations and hides private packs/cards under the existing RLS',async()=>{
  expect((await appendCardsToUserPackAction({packId:privatePack,cards:[{en:'Wrong owner.',pt:'Dono incorreto.'}]})).success).toBe(false)
  expect((await deleteUserPackAction(privatePack)).success).toBe(false)
  expect((await setUserPacksFolderAction([owned,privatePack],'No')).success).toBe(false)
  expect((await state.client('learner').from('packs').select('*').eq('id',privatePack)).data).toHaveLength(0)
  expect((await state.client('learner').from('cards').select('*').eq('pack_id',privatePack)).data).toHaveLength(0)
  expect((await state.client('admin').from('packs').select('*').eq('id',privatePack)).data).toHaveLength(1)
  expect((await state.client('learner').from('cards').insert({pack_id:privatePack,english_phrase:'forged'})).error).toBeTruthy()
 })
 it('searches both languages and pages without repeats while excluding another owner',async()=>{
  const db=state.client('learner'),base=()=>db.from('cards').select('*',{count:'exact'}).eq('packs.owner_id',owner).order('created_at',{ascending:false}).order('id')
  const a=await base().range(0,49),b=await base().range(50,99)
  expect(a.count).toBe(55);expect(a.data).toHaveLength(50);expect(b.data).toHaveLength(5);expect(new Set([...a.data,...b.data].map((r:any)=>r.id)).size).toBe(55)
  expect((await base().or('english_phrase.ilike.%word 03%,portuguese_translation.ilike.%Palavra 3%')).data.length).toBeGreaterThan(0)
 })
 it('does not import duplicates when the existing-card lookup fails',async()=>{
  await reset({fault:{table:'cards'}})
  const result=await appendCardsToUserPackAction({packId:owned,cards:[{en:'Local word 01',pt:'Palavra 1'}]})
  expect(result.success).toBe(false);expect((await state.client('service').from('cards').select('*').eq('pack_id',owned)).data).toHaveLength(55)
 })
 it('persists only the authenticated user preference and reports database failure',async()=>{
  expect((await updateWeeklyReportPreferenceAction(false)).success).toBe(true)
  expect((await state.client('service').from('profiles').select('*').eq('id',owner).single()).data.weekly_report_enabled).toBe(false)
  expect((await state.client('service').from('profiles').select('*').eq('id',other).single()).data.weekly_report_enabled).toBe(true)
  await reset({fault:{table:'profiles',mutationOnly:true}});expect((await updateWeeklyReportPreferenceAction(false)).success).toBe(false)
  state.role='anon';expect((await updateWeeklyReportPreferenceAction(false)).success).toBe(false)
 })
 it('denies direct administrator actions to students and anonymous callers',async()=>{
  for(const role of ['learner','anon']){state.role=role;await expect(createQuestAction({userId:other,questType:'any_session',target:2})).rejects.toThrow();await expect(createAssignment(new FormData())).rejects.toThrow();await expect(listQuestsAction()).rejects.toThrow()}
  expect((await state.client('service').from('user_quests').select('*')).data).toHaveLength(0)
 })
 it('admin assigns a pack and manages missions while learner reads only their own rows',async()=>{
  state.role='admin';const form=new FormData();for(const [k,v]of Object.entries({user_id:owner,pack_id:publicPack,game_mode:'multiple_choice',assigned_date:'2026-11-16'}))form.set(k,v)
  expect((await createAssignment(form)).success).toBe(true);expect((await createAssignment(form)).success).toBe(true)
  expect((await state.client('learner').from('assignments').select('*')).data).toHaveLength(1)
  expect((await state.client('other').from('assignments').select('*')).data).toHaveLength(0)
  expect((await createQuestAction({userId:'all',questType:'any_session',target:2})).success).toBe(true)
  const list=await listQuestsAction();expect(list.success).toBe(true);if(!list.success)throw Error(list.error)
  expect(list.quests).toHaveLength(2);const id=list.quests[0].id
  expect((await updateQuestAction(id,{target:3})).success).toBe(true)
  expect((await state.client('learner').from('user_quests').select('*')).data).toHaveLength(1)
  expect((await deleteQuestAction(id)).success).toBe(true)
  expect((await state.client('service').from('user_quests').select('*')).data).toHaveLength(1)
 })
 it('rejects invalid mission targets/dates and recipient read failures without claiming success',async()=>{
  state.role='admin'
  for(const input of [{userId:owner,questType:'any_session',target:-1},{userId:owner,questType:'unknown',target:1},{userId:owner,questType:'any_session',target:1,expiresAt:'invalid'}])expect((await createQuestAction(input)).success).toBe(false)
  await reset({fault:{table:'profiles'}})
  // The first profiles read is role authorization; a failure must deny the action.
  await expect(createQuestAction({userId:'all',questType:'any_session',target:1})).rejects.toThrow()
  await reset()
  const realClient=state.client
  state.client=role=>{
    const client=realClient(role)
    if(role!=='service')return client
    return {...client,from:(table:string)=>table==='profiles'?{select:()=>({eq:async()=>({data:null,error:{message:'Recipient read failed'}})})}:client.from(table)}
  }
  expect((await createQuestAction({userId:'all',questType:'any_session',target:1})).success).toBe(false)
  expect((await realClient('service').from('user_quests').select('*')).data).toHaveLength(0)
 })
 afterEach(()=>{vi.useRealTimers();vi.unstubAllEnvs()})
 it('creates, replaces and deletes group memberships, including duplicate IDs',async()=>{
  state.role='admin'
  const result=await createMemberGroup({name:'Grupo local',memberIds:[owner,owner]});expect(result.success).toBe(true)
  const id=result.groupId!
  expect((await state.client('admin').from('member_group_members').select('*').eq('group_id',id)).data).toHaveLength(1)
  expect((await updateMemberGroup(id,{name:'Grupo revisto',memberIds:[other]},await groupSnapshot(id))).success).toBe(true)
  expect((await state.client('admin').from('member_group_members').select('*').eq('group_id',id)).data.map((r:any)=>r.user_id)).toEqual([other])
  expect((await state.client('learner').from('member_groups').select('*')).data).toHaveLength(0)
  expect((await deleteMemberGroup(id)).success).toBe(true)
  expect((await state.client('service').from('member_group_members').select('*')).data).toHaveLength(0)
 })
 it('preserves prior group participants when replacement insertion fails and cleans failed creation',async()=>{
  state.role='admin';const created=await createMemberGroup({name:'Grupo local',memberIds:[owner]})
  await fault({rpcStage:'INSERT:member_group_members'})
  expect((await updateMemberGroup(created.groupId!,{name:'Grupo local',memberIds:[other]},await groupSnapshot(created.groupId!))).error).toBeTruthy()
  expect((await state.client('admin').from('member_group_members').select('*')).data.map((r:any)=>r.user_id)).toEqual([owner])
  await fetch('http://127.0.0.1:3212/fault',{method:'POST',body:JSON.stringify({table:'member_group_members',mutationOnly:true})})
  expect((await createMemberGroup({name:'Falha local',memberIds:[other]})).error).toBeTruthy()
  expect((await state.client('admin').from('member_groups').select('*')).data).toHaveLength(1)
 })
 it('materializes a due recurring rule once, preserves SRS answers, and respects pause/expiry',async()=>{
  vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-11-16T15:00:00Z'))
  state.role='admin';const card=(await state.client('service').from('cards').select('*').eq('pack_id',publicPack).single()).data
  const form=new FormData();for(const [key,value]of Object.entries({review_user_id:owner,review_pack_id:publicPack,review_time:'09:00',cards_per_release:'1',review_expires_on:'2026-11-17'}))form.set(key,value)
  form.append('review_weekdays','1');form.append('review_card_ids',card.id)
  expect((await createScheduledReviewRule(form)).success).toBe(true)
  const rule=(await state.client('service').from('assignments').select('*').single()).data
  state.role='learner';await materializeScheduledReviewReleasesForUser(owner);await materializeScheduledReviewReleasesForUser(owner)
  const reviews=await state.client('learner').from('card_reviews').select('*');expect(reviews.data).toHaveLength(1);expect(reviews.data[0].total_reviews).toBe(0)
  expect(parseScheduledReviewStatus((await state.client('learner').from('assignments').select('*').single()).data.status)?.lastReleaseKey).toBe('2026-11-16@09:00')
  await state.client('learner').from('card_reviews').update({total_reviews:7,repetitions:4,interval_days:20,quality:5}).eq('card_id',card.id)
  state.role='admin';form.set('review_time','10:00');expect((await updateScheduledReviewRule(rule.id,form)).success).toBe(true)
  state.role='learner';await materializeScheduledReviewReleasesForUser(owner)
  expect((await state.client('learner').from('card_reviews').select('*').single()).data).toMatchObject({total_reviews:7,repetitions:4,interval_days:20,quality:5})
  state.role='admin';expect((await toggleScheduledReviewRule(rule.id)).success).toBe(true)
  const paused=(await state.client('service').from('assignments').select('*').single()).data.status
  state.role='learner';await materializeScheduledReviewReleasesForUser(owner);expect((await state.client('service').from('assignments').select('*').single()).data.status).toBe(paused)
  state.role='admin';await toggleScheduledReviewRule(rule.id);vi.setSystemTime(new Date('2026-11-23T15:00:00Z'))
  state.role='learner';await materializeScheduledReviewReleasesForUser(owner);expect(parseScheduledReviewStatus((await state.client('service').from('assignments').select('*').single()).data.status)?.lastReleaseKey).toBe('2026-11-16@10:00')
 })
 it('rejects invalid times and cards from another pack, and retries failed scheduled writes',async()=>{
  vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-11-16T15:00:00Z'));state.role='admin'
  const card=(await state.client('service').from('cards').select('*').eq('pack_id',publicPack).single()).data
  const form=new FormData();for(const [key,value]of Object.entries({review_user_id:owner,review_pack_id:publicPack,review_time:'99:99',cards_per_release:'1',review_weekdays:'1',review_card_ids:card.id}))form.set(key,value)
  expect((await createScheduledReviewRule(form)).error).toBeTruthy();form.set('review_time','09:00');form.set('review_pack_id',owned)
  expect((await createScheduledReviewRule(form)).error).toBeTruthy();form.set('review_pack_id',publicPack);expect((await createScheduledReviewRule(form)).success).toBe(true)
  await fetch('http://127.0.0.1:3212/fault',{method:'POST',body:JSON.stringify({table:'card_reviews',mutationOnly:true})})
  state.role='learner';await materializeScheduledReviewReleasesForUser(owner)
  expect(parseScheduledReviewStatus((await state.client('service').from('assignments').select('*').single()).data.status)?.lastReleaseKey).toBeNull()
  await materializeScheduledReviewReleasesForUser(owner);expect((await state.client('learner').from('card_reviews').select('*')).data).toHaveLength(1)
 })
 it('does not announce mission or badge completion rejected by the existing RLS',async()=>{
  state.role='admin';await createQuestAction({userId:owner,questType:'any_session',target:1})
  const db=state.client('service');await db.from('badges').insert({name:'Local streak',description:'Synthetic',icon_name:'Star',condition_type:'streak_days',target_value:1})
  state.role='learner';expect(await evaluateGamification(owner,{type:'game',streak:2})).toEqual({questsCompleted:[],unlockedBadges:[]})
  expect((await db.from('user_quests').select('*').single()).data.progress).toBe(0);expect((await db.from('user_badges').select('*')).data).toHaveLength(0)
 })
 it('evaluates progress, combo thresholds and expiration in a privileged synthetic session',async()=>{
  // This deliberately isolates business rules; it does not claim member RLS allows writes.
  state.role='admin';await createQuestAction({userId:owner,questType:'blitz_combo',target:5});await createQuestAction({userId:owner,questType:'any_session',target:1,expiresAt:'2000-01-01T00:00:00Z'})
  state.role='service';expect((await evaluateGamification(owner,{type:'blitz',maxCombo:5})).questsCompleted).toEqual(['blitz_combo'])
  expect((await evaluateGamification(owner,{type:'blitz',maxCombo:5})).questsCompleted).toEqual([])
  const quests=(await state.client('service').from('user_quests').select('*')).data;expect(quests.find((q:any)=>q.quest_type==='blitz_combo').progress).toBe(5);expect(quests.find((q:any)=>q.quest_type==='any_session').progress).toBe(0)
 })
 async function seedCompetition(){
  const db=state.client('service'),badge=(await db.from('badges').insert({name:'Local medal',description:'Synthetic',icon_name:'Star',condition_type:'competition',target_value:1}).select('*').single()).data
  const rows=(await db.from('assignments').insert([{user_id:owner,pack_id:publicPack,assigned_date:'2026-11-15',game_mode:'typing',status:'completed|tl=15',reward_badge_id:badge.id},{user_id:other,pack_id:publicPack,assigned_date:'2026-11-15',game_mode:'typing',status:'completed'}]).select('*')).data
  await db.from('game_sessions').insert(rows.map((a:any)=>({user_id:a.user_id,assignment_id:a.id,correct_answers:a.user_id===owner?8:10,wrong_answers:a.user_id===owner?2:0,max_streak:8})))
  return {db,badge}
 }
 it('runs the actual medal cron locally: auth, reward scope, metadata status and repeat safety',async()=>{
  vi.stubEnv('CRON_SECRET','local-only');vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-11-16T15:00:00Z'))
  const {db,badge}=await seedCompetition()
  expect((await evaluateMedals(new Request('http://localhost/cron'))).status).toBe(401)
  const request=()=>new Request('http://localhost/cron',{headers:{authorization:'Bearer local-only'}})
  const response=await evaluateMedals(request());expect(response.status).toBe(200);expect((await response.json()).details[0].winner_id).toBe(owner)
  expect((await db.from('user_badges').select('*')).data).toMatchObject([{user_id:owner,badge_id:badge.id}])
  await evaluateMedals(request());expect((await db.from('user_badges').select('*')).data).toHaveLength(1)
 })
 it('keeps a competition pending when badge persistence fails and succeeds on retry',async()=>{
  vi.stubEnv('CRON_SECRET','local-only');vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-11-16T15:00:00Z'))
  const {db,badge}=await seedCompetition()
  await fetch('http://127.0.0.1:3212/fault',{method:'POST',body:JSON.stringify({table:'user_badges',mutationOnly:true})})
  const request=()=>new Request('http://localhost/cron',{headers:{'x-cron-secret':'local-only'}})
  expect((await evaluateMedals(request())).status).toBe(500);expect((await db.from('assignments').select('*').eq('reward_badge_id',badge.id).single()).data.reward_evaluated).toBe(false)
  await evaluateMedals(request());expect((await db.from('user_badges').select('*')).data).toHaveLength(1)
 })

 it('does not close a medal competition before the local date has ended',async()=>{
  vi.stubEnv('CRON_SECRET','local-only');vi.useFakeTimers({toFake:['Date']});vi.setSystemTime(new Date('2026-11-16T01:00:00Z'))
  const {db}=await seedCompetition()
  const response=await evaluateMedals(new Request('http://localhost/cron',{headers:{authorization:'Bearer local-only'}}))
  expect(response.status).toBe(200);expect((await db.from('user_badges').select('*')).data).toHaveLength(0)
  expect((await db.from('assignments').select('*')).data.every((a:any)=>a.reward_evaluated===false)).toBe(true)
 })

 it.each(['UPDATE:member_groups','INSERT:member_group_members','DELETE:member_group_members'])('rolls back the entire group edit after %s fails',async(stage)=>{
  state.role='admin';const created=await createMemberGroup({name:'Original',description:'Keep this',memberIds:[owner]});const id=created.groupId!,before=await groupSnapshot(id)
  await fault({rpcStage:stage})
  expect((await updateMemberGroup(id,{name:'Changed',description:'Replace this',memberIds:[other]},before)).error).toContain('Nenhuma alteração')
  expect(await groupSnapshot(id)).toEqual(before)
  expect((await updateMemberGroup(id,{name:'Changed',description:'Replace this',memberIds:[other]},before)).success).toBe(true)
  expect(await groupSnapshot(id)).toEqual({name:'Changed',description:'Replace this',memberIds:[other]})
 })
 it('rolls back on a real foreign-key failure and fails closed when the RPC is absent',async()=>{
  state.role='admin';const created=await createMemberGroup({name:'Original',memberIds:[owner]});const id=created.groupId!,before=await groupSnapshot(id)
  expect((await updateMemberGroup(id,{name:'Changed',memberIds:['99999999-9999-4999-8999-999999999999']},before)).error).toBeTruthy();expect(await groupSnapshot(id)).toEqual(before)
  await fault({rpcMissing:true});expect((await updateMemberGroup(id,{name:'Changed',memberIds:[other]},before)).error).toContain('ainda não está disponível');expect(await groupSnapshot(id)).toEqual(before)
 })
 it('rejects stale and competing edits while allowing an identical lost-response retry',async()=>{
  state.role='admin';const created=await createMemberGroup({name:'Original',memberIds:[owner]});const id=created.groupId!,before=await groupSnapshot(id)
  const choices=[{name:'Editor A',memberIds:[owner,other]},{name:'Editor B',memberIds:[other]}]
  const results=await Promise.all(choices.map(choice=>updateMemberGroup(id,choice,before)))
  expect(results.filter(r=>r.success)).toHaveLength(1);expect(results.filter(r=>r.error?.includes('mudou'))).toHaveLength(1)
  const winner=choices[results.findIndex(r=>r.success)];expect((await groupSnapshot(id)).name).toBe(winner.name)
  expect((await updateMemberGroup(id,winner,before)).success).toBe(true)
  expect((await updateMemberGroup(id,{name:'Stale edit',memberIds:[owner]},before)).error).toContain('mudou')
 })
 it('enforces group authorization in the action and direct invoker RPC',async()=>{
  state.role='admin';const created=await createMemberGroup({name:'Original',memberIds:[owner]});const id=created.groupId!,before=await groupSnapshot(id)
  for(const role of ['learner','other','anon']){
   state.role=role;await expect(updateMemberGroup(id,{name:'Forged',memberIds:[other]},before)).rejects.toThrow()
   const result=await rpc(role,'update_member_group_atomic',{p_group_id:id,p_expected:before,p_name:'Forged',p_description:null,p_member_ids:[other]})
   expect(result.error?.code).toBe('42501')
  }
  expect(await groupSnapshot(id)).toEqual(before)
 })
 async function verifiedEvent(userId=owner,wrong=0){
  const db=state.client('service')
  const assignment=(await db.from('assignments').insert({user_id:userId,pack_id:publicPack,game_mode:'typing',assigned_date:'2026-11-16',status:'completed'}).select('*').single()).data
  const session=(await db.from('game_sessions').insert({user_id:userId,assignment_id:assignment.id,correct_answers:999,wrong_answers:0,max_streak:999}).select('*').single()).data
  // Deliberately disagree with untrusted legacy scores; only verifier evidence is consumed.
  const result=await (await fetch('http://127.0.0.1:3212/attest',{method:'POST',body:JSON.stringify({sessionId:session.id,userId,correct:1,wrong})})).json()
  return {event:result.data,session,assignment}
 }
 it('disabled mission proposal consumes only authenticated, certified events, not arbitrary scores',async()=>{
  state.role='admin';await createQuestAction({userId:owner,questType:'any_session',target:1});await createQuestAction({userId:owner,questType:'perfect_accuracy',target:1})
  const {event}=await verifiedEvent(owner,1)
  const result=await rpc('service','consume_verified_game_event',{p_event_id:event.id,user_id:other,correct:999,progress:999},'learner')
  expect(result.error).toBeNull();expect(result.data.updated).toBe(1)
  const rows=(await state.client('service').from('user_quests').select('*')).data
  expect(rows.find((q:any)=>q.quest_type==='any_session').status).toBe('completed')
  expect(rows.find((q:any)=>q.quest_type==='perfect_accuracy').progress).toBe(0)
 })
 it('rejects event/user forgery, missing session identity and direct client attestation',async()=>{
  const {event,session}=await verifiedEvent()
  const duplicate=await (await fetch('http://127.0.0.1:3212/attest',{method:'POST',body:JSON.stringify({sessionId:session.id,userId:owner})})).json();expect(duplicate.error?.code).toBe('23505')
  for(const role of ['anon','learner','admin']){
   expect((await rpc(role,'consume_verified_game_event',{p_event_id:event.id})).error?.code).toBe('42501')
   expect((await state.client(role).from('verified_game_events').insert({session_id:session.id,user_id:owner,verified_mode:'typing',verification_method:'server_answer_check_v1',correct_answers:1,wrong_answers:0})).error?.code).toBe('42501')
  }
  expect((await rpc('service','consume_verified_game_event',{p_event_id:event.id})).error?.code).toBe('42501')
  expect((await rpc('service','consume_verified_game_event',{p_event_id:event.id},'other')).error?.code).toBe('42501')
  expect((await rpc('service','consume_verified_game_event',{p_event_id:session.id},'learner')).error?.code).toBe('42501')
  expect((await state.client('service').from('processed_events').select('*')).data).toHaveLength(0)
 })
 it('rejects a certified event whose persisted source belongs to another user',async()=>{
  const {session}=await verifiedEvent(other)
  // A malicious legacy insert is possible under existing session INSERT RLS.
  const forged=(await state.client('learner').from('game_sessions').insert({user_id:owner,assignment_id:session.assignment_id,correct_answers:100,wrong_answers:0}).select('*').single()).data
  const attested=await (await fetch('http://127.0.0.1:3212/attest',{method:'POST',body:JSON.stringify({sessionId:forged.id,userId:owner})})).json()
  expect((await rpc('service','consume_verified_game_event',{p_event_id:attested.data.id},'learner')).error?.code).toBe('42501')
 })
 it('deduplicates concurrent event delivery and skips expired missions',async()=>{
  state.role='admin';await createQuestAction({userId:owner,questType:'any_session',target:3});await createQuestAction({userId:owner,questType:'perfect_accuracy',target:1,expiresAt:'2000-01-01T00:00:00Z'})
  const {event,assignment}=await verifiedEvent()
  const results=await Promise.all([1,2].map(()=>rpc('service','consume_verified_game_event',{p_event_id:event.id},'learner')))
  expect(results.filter(r=>r.data?.duplicate===false)).toHaveLength(1);expect(results.filter(r=>r.data?.duplicate===true)).toHaveLength(1)
  const db=state.client('service'),session=(await db.from('game_sessions').insert({user_id:owner,assignment_id:assignment.id,correct_answers:9,wrong_answers:0}).select('*').single()).data
  const next=await (await fetch('http://127.0.0.1:3212/attest',{method:'POST',body:JSON.stringify({sessionId:session.id,userId:owner})})).json()
  const thirdSession=(await db.from('game_sessions').insert({user_id:owner,assignment_id:assignment.id,correct_answers:9,wrong_answers:0}).select('*').single()).data
  const third=await (await fetch('http://127.0.0.1:3212/attest',{method:'POST',body:JSON.stringify({sessionId:thirdSession.id,userId:owner})})).json()
  const concurrent=await Promise.all([next.data.id,third.data.id].map(id=>rpc('service','consume_verified_game_event',{p_event_id:id},'learner')))
  expect(concurrent.every(r=>!r.error&&r.data.updated===1)).toBe(true)
  const rows=(await db.from('user_quests').select('*')).data
  expect(rows.find((q:any)=>q.quest_type==='any_session').progress).toBe(3);expect(rows.find((q:any)=>q.quest_type==='perfect_accuracy').progress).toBe(0)
  expect((await db.from('processed_events').select('*')).data).toHaveLength(3)
 })
 it.each(['UPDATE:user_quests','INSERT:processed_events'])('rolls back mission progress and the receipt when %s fails',async(stage)=>{
  state.role='admin';await createQuestAction({userId:owner,questType:'any_session',target:1});const {event}=await verifiedEvent()
  await fault({rpcStage:stage});expect((await rpc('service','consume_verified_game_event',{p_event_id:event.id},'learner')).error).toBeTruthy()
  const db=state.client('service');expect((await db.from('user_quests').select('*').single()).data.progress).toBe(0);expect((await db.from('processed_events').select('*')).data).toHaveLength(0)
  expect((await rpc('service','consume_verified_game_event',{p_event_id:event.id},'learner')).data.updated).toBe(1)
  expect((await db.from('user_quests').select('*').single()).data.progress).toBe(1)
 })

 it('keeps both SQL functions invoker-only and the proposal inaccessible to public clients',async()=>{
  const audit=await (await fetch('http://127.0.0.1:3212/audit-integrity')).json()
  expect(audit).toEqual({invoker_only:true,client_private_schema:false,anon_group_rpc:false,client_mission_rpc:false,worker_edits_attestation:false,worker_deletes_receipts:false})
 })

})
