import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { periodRange, subscriptionToday, type SubscriptionPeriod } from '../lib/professionalSubscriptions';

type Balance = Pick<SubscriptionPeriod,'remaining_uses'|'starts_on'|'ends_on'>;
// The contract shows the price and lessons originally agreed; only a period's live balance tells the client what remains today.
export function SubscriptionBalance({ id, revision }: { id: string; revision: number }) {
  const el=useRef<HTMLDivElement>(null);
  const [visible, setVisible]=useState(false), [rerun, setRerun]=useState(0);
  const [state, setState]=useState<{ row?: Balance | null; error?: boolean }>({});
  useEffect(() => {
    if (!el.current || visible) return;
    if (!('IntersectionObserver' in window)) { setVisible(true); return; }
    const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){setVisible(true);observer.disconnect();}},{rootMargin:'100px'});
    observer.observe(el.current); return ()=>observer.disconnect();
  },[visible]);
  useEffect(()=>{
    if (!visible) return;
    const controller=new AbortController(); let active=true;setState({});
    void (async()=>{
      try{
        const day=subscriptionToday();
        const {data,error}=await supabase.rpc('get_subscription_periods',{p_id:id}).select('remaining_uses,starts_on,ends_on')
         .eq('state','active').eq('scheduled',false).lte('starts_on',day).gt('ends_on',day).order('ordinal',{ascending:false}).limit(1).abortSignal(controller.signal);
        if(error||!Array.isArray(data))throw new Error('balance');
        const row:Balance|undefined=data[0];
        if(row && (!Number.isInteger(row.remaining_uses)||row.remaining_uses<1||!row.starts_on||!row.ends_on))throw new Error('balance');
        if(active)setState({row:row??null});
      }catch{if(active)setState({error:true});}
    })();return()=>{active=false;controller.abort();};
  },[visible,id,revision,rerun]);
  return <div ref={el} className="pc-work-balance" aria-live="polite">
    {state.error?<><span>Saldo non disponibile.</span><button type="button" className="pc-work-link" onClick={()=>setRerun(n=>n+1)}>Riprova saldo</button></>:
      state.row?<><strong>{state.row.remaining_uses} {state.row.remaining_uses===1?'lezione disponibile':'lezioni disponibili'}</strong><span>Periodo utilizzabile: {periodRange(state.row.starts_on,state.row.ends_on)}</span></>:
      state.row===null?<span>Nessuna lezione disponibile oggi.</span>:<span>Caricamento lezioni disponibili…</span>}
  </div>;
}
