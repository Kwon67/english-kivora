import {beforeEach,describe,expect,it,vi} from 'vitest'
const mocks=vi.hoisted(()=>({role:'admin',targetRole:'member',userId:'11111111-1111-4111-8111-111111111111',revalidate:vi.fn(),fetch:vi.fn()}))
vi.mock('server-only',()=>({}))
vi.mock('@/lib/supabase/config',()=>({supabaseUrl:'https://example.test',supabaseAnonKey:'test'}))
vi.mock('@/features/security/lib/security',()=>({getAdminSecret:()=> 'test',getStandardAuthError:vi.fn(),getClientIp:vi.fn(),hashSecurityValue:vi.fn(),isRateLimited:vi.fn(),peekRateLimit:vi.fn(),recordSecurityEvent:vi.fn()}))
vi.mock('next/cache',()=>({revalidatePath:mocks.revalidate}))
vi.mock('@/lib/supabase/server',()=>({createAdminClient:()=>({}),createClient:async()=>({auth:{getUser:async()=>({data:{user:{id:mocks.userId}}})},from:()=>({select:()=>({eq:()=>({single:async()=>({data:{role:mocks.role}}),maybeSingle:async()=>({data:{role:mocks.targetRole},error:null})})})})})}))
import {deleteMember} from './actions'
const target='22222222-2222-4222-8222-222222222222'
describe('member management authorization',()=>{
 beforeEach(()=>{mocks.role='admin';mocks.targetRole='member';vi.clearAllMocks();vi.stubGlobal('fetch',mocks.fetch)})
 it('rejects members before calling the account-management backend',async()=>{mocks.role='member';await expect(deleteMember(target)).rejects.toThrow('Acesso negado');expect(mocks.fetch).not.toHaveBeenCalled()})
 it('protects the current administrator',async()=>{expect((await deleteMember(mocks.userId)).success).toBe(false);expect(mocks.fetch).not.toHaveBeenCalled()})
 it('protects other administrators even with a forged direct action request',async()=>{mocks.targetRole='admin';expect((await deleteMember(target)).success).toBe(false);expect(mocks.fetch).not.toHaveBeenCalled()})
 it('rejects invalid identifiers',async()=>{expect((await deleteMember('invalid')).success).toBe(false);expect(mocks.fetch).not.toHaveBeenCalled()})
 it('invalidates member lists only after confirmed removal',async()=>{mocks.fetch.mockResolvedValue({ok:true,json:async()=>({success:true})});expect(await deleteMember(target)).toEqual({success:true});expect(mocks.fetch).toHaveBeenCalledOnce();expect(mocks.revalidate).toHaveBeenCalledWith('/admin/members');expect(mocks.revalidate).toHaveBeenCalledWith('/admin/reports')})
 it('does not report success when the backend refuses removal',async()=>{mocks.fetch.mockResolvedValue({ok:false,json:async()=>({error:'Refused'})});expect((await deleteMember(target)).error).toBe('Refused');expect(mocks.revalidate).not.toHaveBeenCalled()})
})
