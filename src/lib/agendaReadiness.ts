// This decides which action to present. The manual-appointment SQL function remains authoritative.
export interface StudioIdentity { approved?: boolean; approval_status?: string; zone_text?: string; professional_type?: string; listing_type?: string; business_name?: string }
export interface StudioService { duration_minutes?: number; service_type?: string }
export interface StudioCredential { issuer_name?: string; external_url?: string; document_path?: string; verification_status?: string }
export const approvedForAgenda = (p:StudioIdentity | null | undefined) => p?.approved === true && p.approval_status === 'approved';
export const hasDuration = (s:StudioService) => Number.isFinite(s.duration_minutes) && Number(s.duration_minutes) > 0;
export const agendaIsConfirmed = (u:{emailConfirmed?:boolean} | null, p:{email_verified?:boolean} | null) => u?.emailConfirmed ?? (p?.email_verified === true);
export type AgendaStep = { kind:'ready'|'action'|'waiting'|'review'; label:string; to:string; note:string };
const step=(kind:AgendaStep['kind'],label:string,to:string,note:string):AgendaStep=>({kind,label,to,note});
export function nextAgendaStep(confirmed:boolean, professional:StudioIdentity|null, services:StudioService[], credentials:StudioCredential[], name:string):AgendaStep {
  if(!confirmed) return step('action','Conferma la tua email','/account/contacts','Conferma il recapito del tuo account per utilizzare l’agenda.');
  const serviceReady=services.some(hasDuration);
  const createService=()=>step('action','Configura un servizio','/pro/settings?step=services','Serve un servizio attivo con una durata in minuti per fissare un appuntamento.');
  if(approvedForAgenda(professional)) return serviceReady ? step('ready','Nuovo appuntamento','/pro/calendar?new=1','Segna una lezione o un impegno preso direttamente.') : createService();
  if(professional?.approval_status==='rejected') return step('review','Leggi l’esito della verifica','/pro/settings?step=verification','Il profilo richiede una modifica. Nei dettagli trovi le indicazioni ricevute.');
  if(!professional || !professional.professional_type || !name.trim() || (professional.listing_type==='center' && !professional.business_name?.trim())) return step('action','Completa i dati dell’attività','/pro/settings?step=identity','Controlla il nome e il tipo della tua attività prima della verifica.');
  if(!professional.zone_text?.trim()) return step('action','Imposta la zona','/pro/settings?step=area','Indica il comune in cui lavori nel profilo guidato.');
  if(!serviceReady) return createService();
  const trainer=professional.professional_type==='trainer' || services.some(s=>s.service_type==='trainer');
  if(trainer && !credentials.some(c=>['ENCI','CSEN','OPES','FISC'].includes((c.issuer_name||'').trim().toUpperCase()) && !['revoked','rejected'].includes(c.verification_status||'') && Boolean(c.document_path?.trim() || /^https?:\/\/[^/\s]+/i.test(c.external_url||'')))) return step('action','Documenta la qualifica','/pro/settings?step=credentials','Per la verifica dell’addestratore aggiungi il tuo attestato con un documento o una fonte.');
  return step('waiting','Dettagli della verifica','/pro/settings?step=verification','Profilo in attesa di verifica. Quando sarà approvato potrai creare appuntamenti.');
}
