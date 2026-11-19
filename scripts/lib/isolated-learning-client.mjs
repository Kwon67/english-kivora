/** Local test adapter only. Fixed loopback destination; no application credentials. */
export const identities={learner:'11111111-1111-4111-8111-111111111111',other:'22222222-2222-4222-8222-222222222222',admin:'33333333-3333-4333-8333-333333333333'}
export function createIsolatedClient(role='learner') {
 return {
  auth:{getUser:async()=>({data:{user:role==='anon'?null:{id:identities[role]||identities.learner}},error:null})},
  storage:{from:()=>({upload:async()=>({data:null,error:{message:'Audio upload intentionally disabled in fixture'}})})},
  rpc:(name,args)=>fetch('http://127.0.0.1:3212/rpc',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({role,name,args})}).then(r=>r.json()),
  from(table){
   const operations=[]
   const query=new Proxy({}, {get(_target,key){
    if(key==='then')return(resolve,reject)=>fetch('http://127.0.0.1:3212/query',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({role,table,operations})}).then(r=>r.json()).then(resolve,reject)
    return(...args)=>{operations.push([key,args]);return query}
   }})
   return query
  },
 }
}
