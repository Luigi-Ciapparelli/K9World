import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.57.4';
import { normalizeContact, createContactCode, contactCodeHash, deliveryConfigured, deliverContactCode, type ContactKind } from '../_shared/contactDelivery.ts';

const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey', 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
const env = (key: string) => Deno.env.get(key);
const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
const messages: Record<string,string> = {
  other_contact_unverified: 'Prima verifica l’altro recapito del tuo account.',
  rate_limited: 'Attendi almeno un minuto. Puoi richiedere al massimo cinque invii in un’ora.',
  expired: 'Richiesta scaduta o sostituita. Richiedi nuovi codici.',
  too_many_attempts: 'Troppi tentativi. Richiedi nuovi codici.',
  invalid_code: 'Codice non corretto. Controlla i messaggi ricevuti.',
  contact_changed: 'I recapiti sono cambiati. Avvia una nuova richiesta.',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers });
  if (req.method !== 'POST') return reply({ error: 'Metodo non consentito.' },405);
  try {
    const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY')!;
    const admin = createClient(env('SUPABASE_URL')!,serviceKey,{ auth: { persistSession: false, autoRefreshToken: false } });
    const token = req.headers.get('Authorization')?.match(/^Bearer (.+)$/i)?.[1];
    if (!token) return reply({ error: 'Accedi nuovamente.' },401);
    const { data: auth, error: authError } = await admin.auth.getUser(token);
    if (authError || !auth.user) return reply({ error: 'Accedi nuovamente.' },401);
    const uid = auth.user.id;
    const raw = await req.text();
    if (raw.length>2048) return reply({error:'Richiesta non valida.'},400);
    const body = JSON.parse(raw);
    if (body.action === 'status') {
      const { data, error } = await admin.rpc('account_contact_status',{p_user:uid});
      if (error || !data) return reply({error:'Recapiti non disponibili. Riprova.'},503);
      return reply({ ...data, emailDeliveryReady:deliveryConfigured('email',env), smsDeliveryReady:deliveryConfigured('phone',env) });
    }
    if (body.action === 'begin') {
      if (!['email','phone'].includes(body.kind) || typeof body.target !== 'string') return reply({error:'Recapito non valido.'},400);
      const kind: ContactKind = body.kind, target = normalizeContact(kind,body.target);
      const { data: current, error: stateError } = await admin.rpc('account_contact_status',{p_user:uid});
      if (stateError || !current) return reply({error:'Recapiti non disponibili. Riprova.'},503);
      // Existing input may itself be malformed: it must remain correctable.
      const oldTarget = kind==='email' ? String(current.email || '').trim().toLowerCase() : String(current.phone || '').replace(/[\s().-]/g,'');
      const changing = target !== oldTarget;
      const otherKind: ContactKind = kind==='email' ? 'phone' : 'email';
      if (changing && !current[otherKind+'Verified']) return reply({error:messages.other_contact_unverified},400);
      if (!deliveryConfigured(kind,env) || (changing && !deliveryConfigured(otherKind,env))) return reply({error:'Invio email o SMS non ancora disponibile. Il recapito attuale rimane valido. Contatta info@portalecinofilo.com.'},503);
      const id = crypto.randomUUID(), targetCode = createContactCode(), otherCode = createContactCode();
      const { data, error } = await admin.rpc('begin_account_contact', {p_user:uid,p_id:id,p_kind:kind,p_target:target,
        p_target_hash:await contactCodeHash(serviceKey,uid,id,'target',targetCode),p_other_hash:await contactCodeHash(serviceKey,uid,id,'other',otherCode)});
      if (error) return reply({error:'Impossibile preparare la verifica. Riprova.'},400);
      if (data?.error) return reply({error:messages[data.error] || 'Richiesta non disponibile.'},400);
      if (!data?.id) return reply({error:'Verifica non disponibile.'},503);
      // Authorize first: never change a contact when either provider fails.
      let delivered = true;
      if (data.otherTarget) delivered = await deliverContactCode(otherKind,data.otherTarget,otherCode,'authorize',env);
      if (delivered) delivered = await deliverContactCode(kind,data.target,targetCode,'verify',env);
      const marked = await admin.rpc('mark_account_contact_delivery',{p_user:uid,p_id:id,p_delivered:delivered});
      if (!delivered || marked.error || !marked.data) return reply({error:'Invio non completato. Nessun recapito è stato modificato. Attendi un minuto e riprova.'},503);
      return reply({ id, kind, target:data.target, otherTarget:data.otherTarget, expiresIn:600 });
    }
    if (body.action === 'complete') {
      if (typeof body.id!=='string' || !/^[a-f0-9-]{36}$/i.test(body.id) || !/^\d{6}$/.test(body.targetCode || '') || (body.otherCode && !/^\d{6}$/.test(body.otherCode))) return reply({error:'Inserisci i codici di sei cifre.'},400);
      const {data,error} = await admin.rpc('complete_account_contact',{p_user:uid,p_id:body.id,
        p_target_hash:await contactCodeHash(serviceKey,uid,body.id,'target',body.targetCode),
        p_other_hash:await contactCodeHash(serviceKey,uid,body.id,'other',body.otherCode || '')});
      if (error) return reply({error:'Verifica non completata. Riprova.'},400);
      if (data?.error) return reply({error:messages[data.error] || 'Verifica non completata.'},400);
      if (data?.applyEmail) {
        const applied = await admin.auth.admin.updateUserById(uid,{ email:data.applyEmail,email_confirm:true });
        if (applied.error) return reply({error:'Cambio email non completato. L’indirizzo potrebbe essere già utilizzato oppure la richiesta non è più valida. Il precedente rimane attivo.'},400);
        // The Auth trigger atomically rechecks/consumes the grant, syncing profiles.
      } else if (!data?.applied) return reply({error:'Verifica non completata.'},400);
      return reply({success:true});
    }
    return reply({error:'Operazione non valida.'},400);
  } catch {
    // Do not expose provider responses, tokens, OTPs or private database details.
    return reply({error:'Richiesta non valida o servizio temporaneamente non disponibile.'},400);
  }
});
