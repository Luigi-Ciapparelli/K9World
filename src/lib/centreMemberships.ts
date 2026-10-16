import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from './supabase';
export type CentreMembership = {
 id:string; instructor_id:string; instructor_name:string; account_name:string; centre_name:string;
 version:string; status:'pending'|'active'|'declined'|'revoked'|'expired'; is_centre:boolean;
 can_complete_lessons?:boolean; can_message_clients?:boolean; instructor_active:boolean; invited_at:string; expires_at:string; accepted_at:string|null;
};
export type CentreLesson = {id:string; start_at:string; end_at:string; status:string; service_name:string; centre_name:string; instructor_name:string; client_name:string; dog_names:string[]; membership_id?:string; membership_version?:string; assignment_version?:string; can_complete?:boolean; can_message?:boolean; message_count?:number; unread_count?:number; completed_by?:string|null};
export const membershipLabels = {pending:'Da confermare',active:'Collegato',declined:'Rifiutato',revoked:'Revocato',expired:'Scaduto'};
export function membershipError(error:unknown){
 const code=(error as {code?:string})?.code;
 if(code==='PCR01')return 'Puoi segnare la lezione come svolta solo dopo l’orario di fine previsto.';
 if(code==='40001')return 'I dati sono cambiati. Aggiorna e controlla prima di riprovare.';
 if(code==='42501')return 'Operazione non consentita. Controlla di usare il tuo account con email confermata.';
 if(code==='22023'||code==='23505')return 'Codice o richiesta non più disponibili. Controlla il codice, lo stato dell’istruttore e gli eventuali collegamenti già aperti.';
 return 'Esito non confermato. Aggiorna per controllare prima di riprovare.';
}
export function useCentreMemberships(){
 const [rows,setRows]=useState<CentreMembership[]>([]),[loading,setLoading]=useState(true),[error,setError]=useState('');
 const generation=useRef(0),alive=useRef(true);
 useEffect(()=>{alive.current=true;const requests=generation;return()=>{alive.current=false;requests.current++;};},[]);
 const reload=useCallback(async()=>{
  const request=++generation.current;setLoading(true);setError('');
  try{const {data,error}=await supabase.rpc('get_my_centre_memberships');if(error)throw error;
   if(alive.current&&request===generation.current)setRows(data||[]);
  }catch{if(alive.current&&request===generation.current){setRows([]);setError('Collegamenti non caricati. Riprova.');}}
  finally{if(alive.current&&request===generation.current)setLoading(false);}
 },[]);
 useEffect(()=>{void reload();},[reload]);
 return {rows,loading,error,reload};
}
