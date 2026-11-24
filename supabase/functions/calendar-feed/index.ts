import { makeHandler, type Slot } from './calendar.ts';
const read=async(hash:string):Promise<Slot[]|null>=>{
 const root=Deno.env.get('SUPABASE_URL'),key=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!root||!key)throw Error('configuration');
 const reply=await fetch(root+'/rest/v1/rpc/read_personal_calendar_feed',{method:'POST',
   headers:{'Content-Type':'application/json',apikey:key,Authorization:'Bearer '+key},
   body:JSON.stringify({p_hash:hash}),signal:AbortSignal.timeout(12000)});
 if(!reply.ok)throw Error('calendar_unavailable');
 // PostgREST can return HTTP 200 with an empty body for a scalar SQL NULL.
 const raw=await reply.text();const result=raw.trim()?JSON.parse(raw):null;
 if(result!==null&&!Array.isArray(result))throw Error('unexpected_result');
 return result;
};
Deno.serve(makeHandler(read));
