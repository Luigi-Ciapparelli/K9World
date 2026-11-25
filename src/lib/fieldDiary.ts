// Text remains readable in older clients. Booking permissions, authorship, order,
// timestamps and idempotency come from the existing booking-message RPCs.
import type { BookingMessage } from './bookingMessages';
import { exerciseIndex } from './practiceCatalog';
import { romeDay, addDays as moveDay } from './professionalCalendar';
export {romeDay, moveDay};
export const observations = { tried: 'Ho provato', hard: 'Ho provato e mi sono fermato', rest: 'Oggi facciamo pausa', question: 'Ho una domanda' } as const;
export type Observation = keyof typeof observations;
export type FieldPlan = { slug:string; title:string; goal:number; note:string };
export type FieldEntry = { ref:string; kind:Observation; note:string };
export type FieldRecord = {message:BookingMessage; plan:FieldPlan; entries:{message:BookingMessage; report:FieldEntry}[]};
const identifier = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const planPrefix = 'Dal campo a casa · Scheda v1';
const entryPrefix = 'Dal campo a casa · Diario v1';
const single = (s:string) => s.replace(/[\r\n\t]+/g,' ').trim();
export function planText(p:FieldPlan) {
  return [planPrefix, 'Esercizio: '+p.slug, 'Titolo: '+single(p.title), 'Giorni concordati: '+p.goal, 'Indicazione: '+p.note.trim()].join('\n').trimEnd();
}
export function entryText(ref:string, kind:Observation, note:string) {
  return [entryPrefix,'Scheda: '+ref,'Oggi: '+observations[kind],'Nota: '+note.trim()].join('\n').trimEnd();
}
export function readPlan(m:BookingMessage):FieldPlan|null {
  if (m.is_automatic || !['professional','instructor'].includes(m.sender_kind) || !identifier.test(m.id)) return null;
  const [prefix,slugLine,titleLine,goalLine,...noteLines] = m.body.split('\n');
  if(prefix!==planPrefix||!slugLine?.startsWith('Esercizio: ')||!titleLine?.startsWith('Titolo: ')||!/^Giorni concordati: [0-3]$/.test(goalLine)||!/^Indicazione:( |$)/.test(noteLines[0]||''))return null;
  const slug=slugLine.slice(11), title=titleLine.slice(8).trim(), goal=Number(goalLine.slice(-1)), note=noteLines.join('\n').slice(12).trim();
  // Published titles are snapshots: copy edits must not erase old diaries.
  const ex=exerciseIndex.find(item=>item.slug===slug);
  if ((!ex && slug!=='personale')||!title||title.length>100||note.length>500||(slug==='personale'&&!note)) return null;
  return {slug,title,goal,note};
}
export function readEntry(m:BookingMessage):FieldEntry|null {
  if(m.is_automatic||m.sender_kind!=='owner')return null;
  const [prefix,refLine,kindLine,...lines]=m.body.split('\n');
  if(prefix!==entryPrefix||!refLine?.startsWith('Scheda: ')||!kindLine?.startsWith('Oggi: ')||!/^Nota:( |$)/.test(lines[0]||''))return null;
  const ref=refLine.slice(8), kind=(Object.keys(observations) as Observation[]).find(k=>observations[k]===kindLine.slice(6));
  const note=lines.join('\n').slice(5).trim();
  return identifier.test(ref)&&kind&&note.length<=300?{ref,kind,note}:null;
}
export function collectDiary(rows:BookingMessage[]) {
  const records=new Map<string,FieldRecord>();
  for(const msg of [...rows].sort((a,b)=>Number(a.sequence)-Number(b.sequence))){
    const plan=readPlan(msg);
    if(plan){records.set(msg.id,{message:msg,plan,entries:[]});continue;}
    const report=readEntry(msg), record=report&&records.get(report.ref);
    if(record&&report&&Number.isFinite(Date.parse(msg.created_at)))record.entries.push({message:msg,report});
  }
  return [...records.values()].reverse();
}
export function weekOf(day:string){return moveDay(day,-((new Date(day+'T12:00:00Z').getUTCDay()+6)%7));}
export function dayLabel(day:string){return new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(day+'T12:00:00Z'));}
export function diaryWeek(rec:FieldRecord, monday:string){
  const days=Array.from({length:7},(_,i)=>({date:moveDay(monday,i),events:[] as FieldRecord['entries']}));
  for(const e of rec.entries){const d=days.find(d=>d.date===romeDay(e.message.created_at));if(d)d.events.push(e);}
  // A question cannot erase an earlier attempt. Explicit pauses count as contact,
  // never as practice; multiple attempts on a date still count as only one day.
  return {days,practised:days.filter(d=>d.events.some(e=>e.report.kind==='tried'||e.report.kind==='hard')).length};
}
