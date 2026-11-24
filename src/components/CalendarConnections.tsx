import { useEffect, useRef, useState } from 'react';
import { CalendarPlus, ChevronDown, Link2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

const providers = {
  google: ['Google Calendar', 'Da un computer apri Google Calendar. Accanto ad Altri calendari scegli + → Da URL, incolla il link e aggiungi il calendario. Sul telefono attivalo nello stesso account.'],
  apple: ['Calendario Apple / iCloud', 'Su iPhone tocca Apri in Calendario Apple e conferma. In alternativa: Calendario → Calendari → Aggiungi calendario → Aggiungi calendario con iscrizione. Seleziona iCloud per ritrovarlo sugli altri dispositivi.'],
  outlook: ['Microsoft Outlook', 'In Outlook sul Web apri Calendario → Aggiungi calendario → Sottoscrivi dal Web. Incolla il link. In Outlook sul telefono usa lo stesso account e seleziona il calendario.'],
  samsung: ['Samsung Calendar', 'Usa l’account Google collegato al Galaxy: da computer aggiungi il link in Google Calendar (+ → Da URL). Sul Galaxy attiva la sincronizzazione del calendario Google e rendilo visibile in Gestisci calendari. Se lo hai già collegato a Google, usa quello senza aggiungerlo due volte.'],
} as const;
type Provider=keyof typeof providers;
const btn='min-h-11 rounded-xl border border-stone-300 px-4 py-2 text-sm font-semibold';
export function CalendarConnections({professional=false}:{professional?:boolean}){
  const [open,setOpen]=useState(false);
  return <section className="my-4 overflow-hidden rounded-2xl border border-emerald-800/25 bg-white text-stone-900" aria-label="Calendari collegati">
    <button type="button" className="flex min-h-14 w-full items-center gap-3 p-4 text-left font-semibold" aria-expanded={open} onClick={()=>setOpen(v=>!v)}>
      <CalendarPlus size={22} className="text-emerald-800" aria-hidden="true"/><span className="flex-1">Collega il tuo calendario</span><ChevronDown aria-hidden="true" size={17} className={open?'rotate-180':''}/>
    </button>
    {open&&<Choices professional={professional}/>}
  </section>;
}
function Choices({professional}:{professional:boolean}){
  const [provider,setProvider]=useState<Provider>('google');
  return <div className="space-y-4 border-t border-stone-200 p-4">
    <p className="max-w-3xl text-sm">Ritrova sul telefono gli orari degli appuntamenti confermati{professional?', degli impegni manuali e delle tue chiusure':''}. Le richieste in attesa restano sul portale. Chi collabora con un centro vede solo le lezioni prenotate che gli sono state assegnate.</p>
    <label className="block text-sm font-semibold">La tua app
      <select className="ml-2 min-h-11 max-w-full rounded-lg border border-stone-300 bg-white px-2" value={provider} onChange={e=>setProvider(e.target.value as Provider)}>{(Object.keys(providers) as Provider[]).map(p=><option key={p} value={p}>{providers[p][0]}</option>)}</select>
    </label>
    <ProviderControl key={provider} provider={provider}/>
  </div>;
}
function ProviderControl({provider}:{provider:Provider}){
  const [version,setVersion]=useState<string|null>(null),[phase,setPhase]=useState<'loading'|'ready'|'error'>('loading');
  const [secret,setSecret]=useState(''),[display,setDisplay]=useState(false),[notice,setNotice]=useState(''),[busy,setBusy]=useState(false),[reload,setReload]=useState(0);
  const [confirm,setConfirm]=useState<'rotate'|'revoke'|null>(null);const live=useRef(false),lock=useRef(false);
  useEffect(()=>{live.current=true;return()=>{live.current=false;};},[]);
  useEffect(()=>{let current=true;setPhase('loading');
    void (async()=>{try{const {data,error}=await supabase.rpc('my_calendar_version',{p_provider:provider});if(error||data!=null&&typeof data!=='string')throw Error();
      if(current){setVersion(data||null);setPhase('ready');}
    }catch{if(current)setPhase('error');}})();return()=>{current=false;};
  },[provider,reload]);
  async function change(enable:boolean){
    if(lock.current||phase!=='ready')return;lock.current=true;setBusy(true);setNotice('');setDisplay(false);setConfirm(null);setSecret('');
    try{
      const {data,error}=await supabase.rpc('change_my_calendar_connection',{p_provider:provider,p_expected:version,p_enable:enable});
      if(error||!data||(enable&&(!/^[0-9a-f]{64}$/.test(data.token)||typeof data.version!=='string')))throw Error();
      if(!live.current)return;setVersion(data.version||null);
      if(enable){const url=new URL('/functions/v1/calendar-feed/'+data.token+'.ics',import.meta.env.VITE_SUPABASE_URL);setSecret(url.href);setNotice('Link pronto. Aggiungilo nell’app scelta.');}
      else setNotice('Link disattivato. Rimuovi anche il calendario nell’app per eliminare eventuali copie già scaricate.');
    }catch{if(live.current){setNotice('Modifica non confermata. Verifica lo stato aggiornato; per creare il link occorre un account confermato e, per il professionista, approvato.');setReload(x=>x+1);}}
    finally{lock.current=false;if(live.current)setBusy(false);}
  }
  async function copy(){try{await navigator.clipboard.writeText(secret);if(live.current)setNotice('Link copiato. Incollalo soltanto nella tua app calendario.');}
    catch{if(live.current){setDisplay(true);setNotice('Seleziona il link qui sotto e copialo.');}}}
  return <div className="space-y-3 text-sm">
    <p>Il provider scelto riceverà orari e tipo di impegno, senza nomi, recapiti, cani o note. Chi possiede il link può leggerli. I tuoi eventi personali non vengono letti. Puoi interrompere il collegamento qui. <a className="underline" href="/privacy">Informativa privacy</a>.</p>
    {phase==='loading'?<p role="status">Controllo collegamento…</p>:phase==='error'?<p role="alert">Stato non disponibile. <button type="button" className={btn} onClick={()=>setReload(x=>x+1)}>Riprova</button></p>:<>
      {!version?<button type="button" className="min-h-11 rounded-xl bg-emerald-800 px-4 py-2 font-semibold text-white" disabled={busy} onClick={()=>void change(true)}><Link2 className="mr-2 inline" size={16}/>Crea il mio link privato</button>:
      <><p className="font-semibold">Link attivo per {providers[provider][0]}</p>
        {secret?<div className="space-y-2"><div className="flex flex-wrap gap-2"><button type="button" className={btn} onClick={()=>void copy()}>Copia link</button>{provider==='apple'&&<a className={btn} href={secret.replace(/^https?:/, 'webcal:')} referrerPolicy="no-referrer">Apri in Calendario Apple</a>}<button type="button" className={btn} onClick={()=>setDisplay(v=>!v)}>{display?'Nascondi link':'Mostra link'}</button></div>
          {display&&<input className="w-full rounded-lg border p-2" aria-label="Link privato al calendario" readOnly value={secret} onFocus={e=>e.target.select()}/>}</div>
          :<p>Per sicurezza il link si può copiare quando lo crei. Se lo hai perso, sostituiscilo e ricollega questa app.</p>}
        {confirm?<div className="space-y-2"><p>Il link attuale per questa app smetterà di funzionare. Gli altri collegamenti restano attivi.</p><button type="button" className={btn} onClick={()=>setConfirm(null)}>Mantieni link</button>{' '}<button type="button" className={btn} onClick={()=>void change(confirm==='rotate')}>{confirm==='rotate'?'Conferma sostituzione':'Conferma disattivazione'}</button></div>
          :<div className="flex flex-wrap gap-2"><button type="button" className={btn} disabled={busy} onClick={()=>setConfirm('rotate')}>Sostituisci link</button><button type="button" className={btn} disabled={busy} onClick={()=>setConfirm('revoke')}>Disattiva link</button></div>}
      </>}
    </>}
    {notice&&<p role="status" className="font-semibold">{notice}</p>}
    <p className="rounded-xl bg-stone-100 p-3">{providers[provider][1]}</p>
    <p>È un calendario in sola lettura: si aggiorna automaticamente quando l’app lo rilegge, anche con diverse ore di ritardo. Per cambi dell’ultimo minuto controlla qui. Comprende i 30 giorni precedenti e i prossimi 365.</p>
  </div>;
}
