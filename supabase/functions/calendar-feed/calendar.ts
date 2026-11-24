// Render a recurring subscription, not a downloadable one-off invitation.
export type Slot = { uid:string; kind:string; start:string; end:string; modified:string; dayFrom:string|null; dayTo:string|null };
const titles:Record<string,string> = {trainer:'Lezione cinofila',enci_course:'Corso cinofilo',boarding:'Pensione per cani',handler:'Esposizione cinofila',groomer:'Toelettatura',unavailable:'Indisponibilità',appointment:'Appuntamento cinofilo'};
const enc=new TextEncoder();
export async function digest(value:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(value))),b=>b.toString(16).padStart(2,'0')).join('');}
export function fold(line:string){
  const out:string[]=[];let part='',size=0;
  for(const c of line){const n=enc.encode(c).length;if(size+n>75){out.push(part);part=' ';size=1;}part+=c;size+=n;}
  out.push(part);return out.join('\r\n');
}
const stamp=(s:string)=>new Date(s).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
function day(s:string){if(!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('invalid_date');return s.replace(/-/g,'');}
export function serialize(rows:Slot[]){
 const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//PortaleCinofilo//Agenda personale//IT','CALSCALE:GREGORIAN','X-WR-CALNAME:PortaleCinofilo','REFRESH-INTERVAL;VALUE=DURATION:PT6H','X-PUBLISHED-TTL:PT6H'];
 for(const r of rows){
   if(!/^[a-f0-9]{64}$/.test(r.uid)||!(Date.parse(r.end)>Date.parse(r.start))||Boolean(r.dayFrom)!==Boolean(r.dayTo))throw Error('invalid_slot');
   lines.push('BEGIN:VEVENT','UID:'+r.uid+'@portalecinofilo.com','DTSTAMP:'+stamp(r.modified),'LAST-MODIFIED:'+stamp(r.modified));
   if(r.dayFrom&&r.dayTo){lines.push('DTSTART;VALUE=DATE:'+day(r.dayFrom),'DTEND;VALUE=DATE:'+day(r.dayTo));}
   else lines.push('DTSTART:'+stamp(r.start),'DTEND:'+stamp(r.end));
   lines.push('SUMMARY:'+(Object.hasOwn(titles,r.kind)?titles[r.kind]:titles.appointment),'CLASS:PRIVATE','TRANSP:OPAQUE','END:VEVENT');
 }
 lines.push('END:VCALENDAR');return lines.map(fold).join('\r\n')+'\r\n';
}
const base={'Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex, nofollow, noarchive','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'};
export function makeHandler(read:(hash:string)=>Promise<Slot[]|null>){
 return async(req:Request)=>{
   if(req.method!=='GET'&&req.method!=='HEAD')return new Response(null,{status:405,headers:{...base,Allow:'GET, HEAD'}});
   const url=new URL(req.url);
   const match=url.pathname.match(/\/calendar-feed\/([a-f0-9]{64})\.ics$/);
   if(!match||url.search)return new Response(null,{status:404,headers:base});
   try{
     const rows=await read(await digest(match[1]));if(rows===null)return new Response(null,{status:404,headers:base});
     const body=serialize(rows);const etag='"'+await digest(body)+'"';
     const headers={...base,ETag:etag,'Content-Type':'text/calendar; charset=utf-8','Content-Disposition':'inline; filename="PortaleCinofilo.ics"'};
     // Recheck the token even on a conditional request, including after revocation.
     if(req.headers.get('If-None-Match')===etag)return new Response(null,{status:304,headers});
     return new Response(req.method==='HEAD'?null:body,{headers});
   }catch{return new Response(null,{status:503,headers:{...base,'Retry-After':'300'}});}
 };
}
