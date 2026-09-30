import { useEffect, useId, useRef, useState } from 'react';
import { Mail, Phone, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { contactRequest, type ContactKind, type ContactStatus, type ContactChallenge } from '../lib/accountContacts';

const fieldClass = 'mt-2 block w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-stone-900 focus:ring-2 focus:ring-emerald-600';
const buttonClass = 'rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white disabled:opacity-50';

export function AccountContacts({ initialKind, onVerified }: { initialKind?: ContactKind; onVerified?: () => void }) {
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState<ContactStatus | null>(null);
  const [kind, setKind] = useState<ContactKind | null>(initialKind || null);
  const [target, setTarget] = useState('');
  const [challenge, setChallenge] = useState<ContactChallenge | null>(null);
  const [targetCode, setTargetCode] = useState('');
  const [otherCode, setOtherCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reload, setReload] = useState(0);
  const lock = useRef(false), mounted = useRef(true), id = useId();

  const emailOnly = Boolean(status && !status.smsDeliveryReady);
  const changing = Boolean(status && kind && (kind === 'email'
    ? target.trim().toLowerCase() !== status.email.trim().toLowerCase()
    : target.replace(/[\s().-]/g, '') !== status.phone.replace(/[\s().-]/g, '')));
  const channelReady = Boolean(status && (kind === 'email' ? status.emailDeliveryReady : status.smsDeliveryReady));
  const otherVerified = Boolean(status && (kind === 'email' ? status.phoneVerified : status.emailVerified));
  const canBegin = channelReady && (!changing || Boolean(otherVerified && status?.emailDeliveryReady && status?.smsDeliveryReady));

  useEffect(() => {
    mounted.current = true;
    let active = true;
    contactRequest<ContactStatus>({ action: 'status' }).then(data => {
      if (!active) return;
      setStatus(data);
      if (initialKind) setTarget(data[initialKind] || '');
    }).catch(() => { if (active) setError('Impossibile caricare i recapiti. Riprova.'); });
    return () => { active = false; mounted.current = false; };
  }, [initialKind, reload]);

  const choose = (value: ContactKind) => {
    setKind(value); setTarget(status?.[value] || ''); setChallenge(null);
    setTargetCode(''); setOtherCode(''); setError(''); setMessage('');
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (lock.current || !kind || (!challenge && !canBegin)) return;
    lock.current = true; setBusy(true); setError(''); setMessage('');
    try {
      if (!challenge) {
        const next = await contactRequest<ContactChallenge>({ action: 'begin', kind, target });
        if (mounted.current) setChallenge(next);
      } else {
        const done = await contactRequest<{success:boolean}>({ action: 'complete', id:challenge.id, targetCode, otherCode });
        if (!done.success) throw new Error('Verifica non completata.');
        if (!mounted.current) return;
        setChallenge(null); setKind(null); setTargetCode(''); setOtherCode('');
        setMessage('Recapito confermato e aggiornato.');
        await refreshProfile();
        await supabase.auth.refreshSession();
        const next = await contactRequest<ContactStatus>({ action:'status' });
        if (mounted.current) { setStatus(next); onVerified?.(); }
      }
    } catch (caught) {
      if (mounted.current) setError(caught instanceof Error ? caught.message : 'Operazione non confermata. Riprova.');
    } finally { lock.current=false; if (mounted.current) setBusy(false); }
  };

  return <div className="space-y-5 text-stone-900">
    <p className="text-sm leading-6 text-stone-600">L’email confermata serve per proteggere il tuo account e richiedere appuntamenti. La verifica del telefono non è necessaria per prenotare.</p>
    {message && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-900">{message}</p>}
    {!status && !error && <p role="status">Caricamento recapiti…</p>}
    {!status && error && <button onClick={() => { setError(''); setReload(value=>value+1); }} className={buttonClass}>Riprova</button>}
    {status && !kind && <div className="space-y-3">{(['email','phone'] as const).map(value => {
      const verified = value==='email' ? status.emailVerified : status.phoneVerified;
      const available = value === 'email' ? status.emailDeliveryReady && (!verified || !emailOnly) : status.smsDeliveryReady;
      return <section key={value} className="rounded-2xl border border-stone-200 p-4">
        <h3 className="flex items-center gap-2 font-bold">{value==='email' ? <Mail size={18}/> : <Phone size={18}/>} {value==='email' ? 'Email' : 'Telefono'}</h3>
        <p className="my-2 break-all">{status[value] || 'Non inserito'}</p>
        <p className={`mb-3 flex items-center gap-2 text-sm ${verified ? 'text-emerald-800' : 'text-amber-800'}`}>{verified && <CheckCircle2 size={16}/>} {verified ? 'Recapito verificato' : 'Da verificare'}</p>
        <button disabled={!available} onClick={()=>choose(value)} className={buttonClass}>{value === 'email' && emailOnly && !verified ? 'Verifica email' : `${verified ? 'Modifica' : 'Verifica o correggi'} ${value==='email' ? 'email' : 'telefono'}`}</button>
        {emailOnly && value === 'phone' && <p className="mt-3 text-sm text-stone-600">Verifica e modifica del telefono non sono ancora disponibili. Puoi usare il portale con l’email confermata.</p>}
        {emailOnly && value === 'email' && verified && <p className="mt-3 text-sm text-stone-600">La modifica dell’email richiede anche la conferma sul telefono. Finché la verifica SMS non è disponibile, l’indirizzo resta quello attuale. Per un indirizzo errato, contatta l’assistenza.</p>}
        {value === 'email' && !status.emailDeliveryReady && <p role="status" className="mt-3 text-sm text-amber-800">Invio dei codici email temporaneamente non disponibile. Riprova più tardi o contatta l’assistenza.</p>}
      </section>;
    })}</div>}
    {status && kind && <form onSubmit={submit} className="space-y-4">
      <button type="button" disabled={busy} onClick={()=>{setKind(null);setChallenge(null);setError('');}} className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-800"><ArrowLeft size={16}/> Tutti i recapiti</button>
      {!challenge ? <>
        <label htmlFor={`${id}-target`} className="block font-semibold">{kind==='email' ? 'Email da verificare' : 'Telefono da verificare'}
          <input id={`${id}-target`} type={kind==='email' ? 'email':'tel'} autoComplete={kind==='email' ? 'email':'tel'} required maxLength={254} disabled={busy || !channelReady} readOnly={emailOnly && kind==='email'} value={target} onChange={event=>setTarget(event.target.value)} className={fieldClass}/>
        </label>
        {kind==='phone' && channelReady && <p className="text-sm text-stone-600">Includi il prefisso internazionale, per esempio +39. Se il numero è sbagliato puoi correggerlo qui.</p>}
        {emailOnly ? <p className="text-sm text-stone-600">Puoi confermare l’email attuale con un codice. La modifica dei recapiti richiede anche un telefono verificato e sarà disponibile quando attiveremo gli SMS. Per una correzione, contatta l’assistenza.</p>
          : <p className="text-sm text-stone-600">Per verificare il recapito attuale basta un codice. Per cambiarlo servono il codice sull’altro recapito già verificato e quello sul nuovo; fino alla conferma resta valido il recapito attuale.</p>}
        {!canBegin && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{!channelReady ? `Invio ${kind==='email' ? 'email' : 'SMS'} non disponibile. Nessun codice verrà inviato.` : changing && !otherVerified ? 'Prima di cambiare questo recapito devi verificare l’altro.' : 'Per questa modifica serve anche la verifica SMS, al momento non disponibile.'}</p>}
        <button disabled={busy || !canBegin} className={buttonClass}>{busy ? 'Invio in corso…' : 'Invia codice di conferma'}</button>
      </> : <>
        <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{challenge.otherTarget ? 'Codici inviati. Scadono tra 10 minuti.' : 'Codice inviato. Scade tra 10 minuti.'} Il recapito non è ancora stato modificato.</p>
        {challenge.otherTarget && <label htmlFor={`${id}-other`} className="block font-semibold">Codice ricevuto su {challenge.otherTarget}
          <input id={`${id}-other`} value={otherCode} onChange={event=>setOtherCode(event.target.value.replace(/\D/g,''))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required disabled={busy} className={fieldClass}/>
        </label>}
        <label htmlFor={`${id}-code`} className="block font-semibold">Codice ricevuto su {challenge.target}
          <input id={`${id}-code`} value={targetCode} onChange={event=>setTargetCode(event.target.value.replace(/\D/g,''))} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required disabled={busy} className={fieldClass}/>
        </label>
        <div className="flex flex-wrap gap-3"><button disabled={busy} className={buttonClass}>{busy ? 'Verifica in corso…' : 'Conferma recapito'}</button>
          <button type="button" disabled={busy} onClick={()=>{setChallenge(null);setTargetCode('');setOtherCode('');setError('');}} className="rounded-xl border border-stone-300 px-4 py-3 font-semibold">Correggi o richiedi nuovi codici</button></div>
      </>}
    </form>}
    {error && <p role="alert" className="rounded-xl bg-rose-50 p-3 text-rose-800">{error}</p>}
    <p className="text-xs leading-5 text-stone-600">Non hai accesso a nessun recapito verificato? <a className="font-semibold underline" href="mailto:info@portalecinofilo.com">Contatta l’assistenza</a>. La verifica dei contatti è distinta dall’approvazione del profilo professionale.</p>
  </div>;
}
