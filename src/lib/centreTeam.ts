import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from './supabase';
export type CentreInstructor = {id: string; display_name: string; active: boolean; version: string; assigned_bookings?: number};
export type CentreTeam = {enabled: boolean; members: CentreInstructor[]};
export type BookingInstructorRow = {booking_id: string; instructor_id: string | null; instructor_name: string | null; version: string | null; instructor_active: boolean | null; can_assign: boolean};
export function teamError(error: unknown) {
 const code=(error as {code?: string})?.code;
 if(code==='40001') return 'I dati sono cambiati in un’altra sessione. Aggiorna e controlla prima di salvare di nuovo.';
 if(code==='42501') return 'Questa operazione è riservata al centro che gestisce la prenotazione.';
 if(code==='22023') return 'Controlla i dati: scegli un istruttore attivo e una lezione accettata, non ancora completata.';
 if(code==='54000') return 'Hai raggiunto il limite dell’elenco. Contatta l’assistenza.';
 return 'Esito non confermato. Aggiorna per controllare i dati prima di riprovare.';
}
export function useBookingInstructors(ids: string[], refresh = 0) {
 const {user}=useAuth(); const userId=user?.id;
 const key=JSON.stringify([...new Set(ids)].sort());
 const [tick,setTick]=useState(0);
 const [state,setState]=useState<{userId?: string; key: string; rows: Record<string,BookingInstructorRow>; error: boolean}>({key:'',rows:{},error:false});
 const stableIds=useMemo(()=>JSON.parse(key) as string[],[key]);
 useEffect(()=>{
  let active=true;
  setState({userId,key,rows:{},error:false});
  if(!userId||!stableIds.length) return;
  void (async()=>{try {
   const rows: BookingInstructorRow[]=[];
   for(let offset=0;offset<stableIds.length;offset+=200){
    const {data,error}=await supabase.rpc('get_booking_instructors',{p_booking_ids:stableIds.slice(offset,offset+200)});
    if(!active)return; if(error)throw error;
    rows.push(...(data||[]));
   }
   if(active)setState({userId,key,rows:Object.fromEntries(rows.map(r=>[r.booking_id,r])),error:false});
  }catch{if(active)setState({userId,key,rows:{},error:true});}})();
  return()=>{active=false;};
 },[userId,key,stableIds,refresh,tick]);
 return {rows:state.userId===userId&&state.key===key?state.rows:{},error:state.userId===userId&&state.key===key&&state.error,reload:()=>setTick(n=>n+1)};
}
