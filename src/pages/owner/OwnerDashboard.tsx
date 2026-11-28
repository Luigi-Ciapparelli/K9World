import { useEffect, useState } from 'react';
import { BookOpen, CalendarDays, Contact, PawPrint, Users, Layers3, Search } from 'lucide-react';
import { useAuth } from '../../lib/AuthContext';
import { supabase } from '../../lib/supabase';
import { continuityEnabled } from '../../lib/continuity';
import { bookingDateTime } from '../../lib/bookingDetails';
import { BookingMessageInbox } from '../../components/BookingMessageInbox';
import { ServiceReviewNotice } from '../../components/ServiceReviews';
import { ClientPortrait, useClientPortraits } from '../../components/ClientPortrait';
import { RouteLink } from '../../components/RouteLink';
import '../../owner-workspace.css';

type NextBooking = { id:string; start_at:string; service_name:string; professional_name:string };
type Summary = { dogCount:number | null; names:string[]; next:NextBooking | null; nextOk:boolean; waiting:number | null; fresh:boolean };
const search='/search?type=trainer';
export function OwnerDashboard() {
  const {user}=useAuth();
  return user ? <OwnerHome key={user.id} userId={user.id}/> : null;
}
function OwnerHome({userId}:{userId:string}) {
  const {profile}=useAuth(), portraits=useClientPortraits([userId]);
  const [data,setData]=useState<Summary|null>(null),[refresh,setRefresh]=useState(0);
  useEffect(()=>{
    let active=true;
    const controller=new AbortController();
    const now=new Date().toISOString();
    const summary=async()=>{
      // All booking reads reuse the owner-only projection; the server enforces the caller.
      const [dogs,future,pending]=await Promise.allSettled([
        supabase.from('dogs').select('name',{count:'exact'}).eq('owner_id',userId).order('created_at',{ascending:false}).limit(3).abortSignal(controller.signal),
        supabase.rpc('get_my_owner_bookings').select('id,start_at,service_name,professional_name').eq('status','accepted').gte('start_at',now).order('start_at',{ascending:true}).limit(1).abortSignal(controller.signal),
        supabase.rpc('get_my_owner_bookings',{}, {count:'exact'}).select('id').eq('status','pending').limit(1).abortSignal(controller.signal),
      ]);
      if(!active)return;
      const dog=dogs.status==='fulfilled'&&!dogs.value.error?dogs.value:null, next=future.status==='fulfilled'&&!future.value.error?future.value:null;
      const requests=pending.status==='fulfilled'&&!pending.value.error?pending.value:null;
      const upcomingRows=Array.isArray(next?.data)?next.data:null, pendingRows=Array.isArray(requests?.data)?requests.data:null;
      const noBookings=upcomingRows?.length===0 && pendingRows?.length===0;
      setData({dogCount:dog?.count??(dog?.data?.length===0?0:null),names:(dog?.data??[]).map((d:{name:string})=>d.name),
        next:upcomingRows?.[0]??null,nextOk:upcomingRows!==null,waiting:requests?.count??(pendingRows?.length===0?0:null),fresh:noBookings});
    };
    void summary();return()=>{active=false; controller.abort();};
  },[userId,refresh]);
  const first=profile?.full_name?.trim().split(/\s+/)[0], retry=()=>setRefresh(k=>k+1);
  return <main className="pc-owner"><div className="pc-owner-wrap">
    <header className="pc-owner-heading"><div className="pc-owner-greeting"><RouteLink to="/account/contacts" aria-label="Modifica la tua foto"><ClientPortrait src={portraits[userId]} name={profile?.full_name||'Il tuo profilo'} className="h-12 w-12"/></RouteLink><div><div className="pc-owner-eyebrow">Area cliente</div><h1>{first?`Ciao, ${first}.`:'La tua area'}</h1></div></div></header>
    {data?.fresh && <section className="pc-owner-fresh"><div><h2>Cerca un professionista</h2><p className="pc-owner-hint">Trova un educatore, un addestratore o una pensione nella tua zona.</p></div><RouteLink to={search} className="pc-owner-primary"><Search size={18} aria-hidden="true"/>Trova aiuto per il cane</RouteLink></section>}
    <section className="pc-owner-at-a-glance" aria-label="La tua situazione">
      <article className="pc-owner-tile"><h2>I miei cani</h2>{!data?<p>Caricamento…</p>:data.dogCount===null?<Retry retry={retry}/>:<><strong>{data.dogCount===0?'Nessun cane aggiunto':data.dogCount===1?'1 cane':`${data.dogCount} cani`}</strong>{data.names.length>0&&<p>{data.names.join(' · ')}</p>}</>}<RouteLink to="/owner/dogs" className="pc-owner-link">{data?.dogCount===0?'Aggiungi il tuo cane':'Apri le schede'}</RouteLink></article>
      <article className={'pc-owner-tile'+(data?.next?' pc-owner-focus':'')}><h2>Prossimo appuntamento</h2>{!data?<p>Caricamento…</p>:!data.nextOk?<Retry retry={retry}/>:data.next?<><strong>{bookingDateTime(data.next.start_at)}</strong><p>{[data.next.service_name,data.next.professional_name].filter(Boolean).join(' · ')}</p></>:<p>Nessun appuntamento confermato.</p>}<RouteLink to="/owner/bookings" className="pc-owner-link">Vedi prenotazioni</RouteLink></article>
      <article className={'pc-owner-tile'+(data?.waiting&&!data.next?' pc-owner-focus':'')}><h2>Richieste in attesa</h2>{!data?<p>Caricamento…</p>:data.waiting===null?<Retry retry={retry}/>:data.waiting?<strong>{data.waiting===1?'1 richiesta':`${data.waiting} richieste`}</strong>:<p>Nessuna richiesta in attesa.</p>}<RouteLink to="/owner/bookings?stato=pending" className="pc-owner-link">Vedi richieste</RouteLink></article>
    </section>
    {!profile?.email_verified && <aside className="pc-owner-surface mb-4"><strong>Conferma la tua email</strong><p className="pc-owner-hint">Serve per inviare una richiesta di prenotazione.</p><RouteLink to="/account/contacts" className="pc-owner-link">Apri email e telefono</RouteLink></aside>}
    <BookingMessageInbox compactEmpty/><ServiceReviewNotice/>
    <section className="pc-owner-surface"><h2>Nel tuo account</h2><nav className="pc-owner-nav" aria-label="Risorse per il cliente">
      <RouteLink to="/owner/passes"><Layers3 size={18}/>Lezioni · pacchetti e abbonamenti</RouteLink>
      {continuityEnabled&&<RouteLink to="/owner/relationships"><Users size={18}/>Professionisti dei tuoi cani</RouteLink>}
      <RouteLink to="/account/contacts"><Contact size={18}/>Email e telefono</RouteLink>
      <RouteLink to="/impara"><BookOpen size={18}/>Impara</RouteLink>
      {!data?.fresh&&<RouteLink to={search}><PawPrint size={18}/>Cerca un professionista</RouteLink>}
      <RouteLink to="/owner/bookings"><CalendarDays size={18}/>Prenotazioni e messaggi</RouteLink>
    </nav></section>
  </div></main>;
}
function Retry({retry}:{retry:()=>void}){return <p role="alert">Dati non disponibili. <button className="pc-owner-link" onClick={retry}>Riprova</button></p>;}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:
      'bg-[var(--pc-ochre-100,#F5EACB)] text-[var(--pc-ochre-900)]',
    accepted:
      'bg-[var(--pc-evidence-100)] text-[var(--pc-evidence-700)]',
    completed:
      'bg-[var(--pc-forest-100)] text-[var(--pc-forest-900)]',
    cancelled: 'bg-stone-100 text-stone-600',
    declined: 'bg-[var(--pc-danger-100)] text-[var(--pc-danger-700)]',
  };

  const labels: Record<string, string> = {
    pending: 'In attesa',
    accepted: 'Accettata',
    completed: 'Completata',
    cancelled: 'Annullata',
    declined: 'Rifiutata',
  };

  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full font-bold shrink-0 ${
        styles[status] || 'bg-stone-100 text-stone-600'
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
