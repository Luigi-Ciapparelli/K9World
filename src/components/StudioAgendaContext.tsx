import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { agendaIsConfirmed, approvedForAgenda, nextAgendaStep, type AgendaStep, type StudioService, type StudioCredential } from '../lib/agendaReadiness';

type State={id?: string; status:'loading'|'error'|'done'; centre:boolean; step?:AgendaStep};
const initial:State={status:'loading',centre:false};
const Context=createContext<State & {retry:()=>void}>({...initial,retry:()=>{}});
export const useStudioAgenda=()=>useContext(Context);
export function StudioAgendaProvider({children}:{children:ReactNode}) {
 const {user,profile}=useAuth(), uid=user?.id, role=profile?.role, confirmed=agendaIsConfirmed(user,profile), fullName=profile?.full_name??'';
 const [data,set]=useState<State>(initial), [tick,setTick]=useState(0);
 useEffect(()=>{let live=true;const controller=new AbortController();set(initial);
  if(!uid || role!=='professional')return;
  async function read(id:string){
   let centre=false;
   try{
    const [identity,offers]=await Promise.all([supabase.from('professionals').select('approved,approval_status,listing_type,professional_type,business_name,zone_text').eq('id',id).abortSignal(controller.signal).maybeSingle(),supabase.from('services').select('service_type,duration_minutes').eq('professional_id',id).eq('active',true).abortSignal(controller.signal)]);
    if(identity.error)throw identity.error;
    const pro=identity.data;centre=pro?.listing_type==='center';
    if(offers.error || !Array.isArray(offers.data))throw new Error('services');
    const services=offers.data as StudioService[];let credentials:StudioCredential[]=[];
    const prelim=nextAgendaStep(confirmed,pro,services,[],fullName);
    if(!approvedForAgenda(pro) && prelim.to==='/pro/settings?step=credentials'){
      const response=await supabase.from('professional_credentials').select('issuer_name,external_url,document_path,verification_status').eq('professional_id',id).eq('credential_type','professional_qualification').abortSignal(controller.signal);
      if(response.error || !Array.isArray(response.data))throw new Error('credentials');
      credentials=response.data;
    }
    if(live)set({id,status:'done',centre,step:nextAgendaStep(confirmed,pro,services,credentials,fullName)});
   }catch{if(live)set({id,status:'error',centre});}
  }
  void read(uid);return()=>{live=false;controller.abort();};
 },[uid,role,confirmed,fullName,tick]);
 const state=data.id===uid?data:initial;
 return <Context.Provider value={{...state,retry:()=>setTick(n=>n+1)}}>{children}</Context.Provider>;
}
