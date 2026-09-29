import { useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, Mail, Lock } from 'lucide-react';
import { AuthFrame } from './AuthPages';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/RouterContext';
import { finishPasswordRecovery, getPasswordRecoveryState, invalidatePasswordRecovery, passwordRecoveryRedirect, usePasswordRecovery } from '../lib/passwordRecovery';

const primary = 'w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50';
const secondary = 'w-full rounded-xl border border-stone-300 px-4 py-3 font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-50';
const input = 'w-full rounded-xl border border-stone-300 px-3 py-3 text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500';

export function ForgotPasswordPage() {
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current || !email.trim()) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: passwordRecoveryRedirect() });
      if (error) {
        setError(error.status === 429 || error.code === 'over_email_send_rate_limit'
          ? 'Sono state inviate troppe richieste. Attendi qualche minuto prima di riprovare.'
          : 'Non è stato possibile confermare l’invio. Controlla la connessione e riprova; se continua, contatta info@portalecinofilo.com.');
      } else { setSent(true); }
    } catch {
      setError('Invio non confermato. Controlla la connessione e riprova.');
    } finally { inFlight.current = false; setBusy(false); }
  }
  return <AuthFrame title="Recupera la password" subtitle="Ti aiutiamo a tornare nel tuo account.">
    {sent ? <div className="space-y-4">
      <div role="status" className="rounded-xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-stone-700">
        <CheckCircle2 className="w-6 h-6 text-emerald-700 mb-2" aria-hidden="true" />
        <p>Se l’indirizzo corrisponde a un account, riceverai un’email con il link per scegliere una nuova password.</p>
        <p className="mt-2">Controlla anche la cartella spam. Usa il link dell’email più recente.</p>
      </div>
      <button type="button" className={secondary} onClick={() => { setSent(false); setError(''); }}>Correggi l’indirizzo email</button>
      <button type="button" className={primary} onClick={() => navigate('/signin')}>Torna ad accedere</button>
    </div> : <form onSubmit={submit} className="space-y-4" aria-busy={busy}>
      <label className="block text-sm font-semibold text-stone-700" htmlFor="recovery-email"><span className="flex items-center gap-2 mb-2"><Mail size={16} aria-hidden="true" /> Email del tuo account</span></label>
      <input className={input} id="recovery-email" type="email" autoComplete="email" required maxLength={254} value={email} disabled={busy} onChange={event => setEmail(event.target.value)} />
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <button className={primary} disabled={busy}>{busy ? 'Invio in corso…' : 'Invia il link di recupero'}</button>
      <button type="button" className={secondary} disabled={busy} onClick={() => navigate('/signin')}>Torna ad accedere</button>
    </form>}
  </AuthFrame>;
}

export function ResetPasswordPage() {
  const recovery = usePasswordRecovery();
  const { navigate } = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [closed, setClosed] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  const leave = (path: string) => { finishPasswordRecovery(); navigate(path); };
  async function closeSession() {
    setBusy(true); setError('');
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
      setClosed(true); finishPasswordRecovery();
    } catch {
      setError('La password è aggiornata, ma non è stato possibile chiudere la sessione. Riprova la disconnessione.');
    } finally { setBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current || saved || recovery.status !== 'ready') return;
    setError('');
    if (password.length < 8) { setError('Usa almeno 8 caratteri per la nuova password.'); return; }
    if (password !== confirmation) { setError('Le due password non coincidono.'); return; }
    inFlight.current = true; setBusy(true);
    try {
      // Recheck identity server-side; the sessionStorage marker alone never authorizes a change.
      const { data, error: identityError } = await supabase.auth.getUser();
      if (identityError && identityError.status !== 401 && identityError.status !== 403 && !['session_not_found', 'refresh_token_not_found', 'bad_jwt'].includes(identityError.code || '')) {
        setError('Non è stato possibile verificare l’account. Controlla la connessione e riprova.'); return;
      }
      const current = getPasswordRecoveryState();
      if (identityError || !data.user || current.status !== 'ready' || current.userId !== recovery.userId || data.user.id !== recovery.userId || current.expiresAt <= Date.now()) {
        invalidatePasswordRecovery(); return;
      }
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        if (['session_not_found', 'refresh_token_not_found', 'bad_jwt'].includes(error.code || '') || error.status === 401) {
          invalidatePasswordRecovery();
        } else {
          setError(error.code === 'same_password' ? 'Scegli una password diversa da quella precedente.'
            : error.code === 'weak_password' ? 'La password non rispetta i requisiti dell’account. Scegline una più lunga e meno comune.'
            : 'Modifica non confermata. Controlla la connessione e riprova.');
        }
        return;
      }
      setPassword(''); setConfirmation(''); setSaved(true);
      finishPasswordRecovery();
      await closeSession();
    } catch {
      setError('Modifica non confermata. Controlla la connessione. Se la password era già stata aggiornata, puoi provare ad accedere con quella nuova.');
    } finally { inFlight.current = false; setBusy(false); }
  }
  if (saved) return <AuthFrame title="Password aggiornata" subtitle="La nuova password è stata salvata.">
    <div className="space-y-4">
      <CheckCircle2 className="w-9 h-9 text-emerald-700" aria-hidden="true" />
      <p role="status" className="text-sm text-stone-700">{closed ? 'Ora puoi accedere con la nuova password.' : busy ? 'Chiusura della sessione in corso.' : 'La nuova password è già salvata.'}</p>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <button type="button" className={primary} disabled={busy} onClick={() => closed ? leave('/signin') : void closeSession()}>{closed ? 'Accedi con la nuova password' : busy ? 'Attendi…' : 'Riprova la disconnessione'}</button>
    </div>
  </AuthFrame>;
  if (recovery.status === 'checking') return <AuthFrame title="Verifica del link" subtitle="Stiamo verificando il collegamento ricevuto via email."><p role="status" className="text-sm text-stone-700">Attendi qualche istante…</p></AuthFrame>;
  if (recovery.status !== 'ready') return <AuthFrame title={recovery.status === 'invalid' && recovery.reason === 'connection' ? 'Verifica non riuscita' : 'Richiedi un nuovo link'} subtitle="Per cambiare la password serve un collegamento valido.">
    <div className="space-y-4">
      <p role="alert" className="text-sm text-stone-700">{recovery.status === 'invalid' && recovery.reason === 'connection' ? 'Non è stato possibile verificare il collegamento. Controlla la connessione e richiedi un nuovo link.' : 'Il collegamento è scaduto, è già stato utilizzato o non è presente. Richiedine uno nuovo e apri l’email più recente.'}</p>
      <button type="button" className={primary} onClick={() => leave('/forgot-password')}>Richiedi un nuovo link</button>
      <button type="button" className={secondary} onClick={() => leave('/signin')}>Torna ad accedere</button>
    </div>
  </AuthFrame>;
  return <AuthFrame title="Scegli una nuova password" subtitle={recovery.email ? `Account: ${recovery.email}` : 'Completa il recupero del tuo account.'}>
    <form className="space-y-4" onSubmit={submit} aria-busy={busy}>
      <p id="new-password-help" className="text-sm text-stone-600">Usa almeno 8 caratteri e una password che non utilizzi su altri siti.</p>
      <label className="block text-sm font-semibold text-stone-700" htmlFor="new-password"><span className="flex items-center gap-2 mb-2"><Lock size={16} aria-hidden="true" /> Nuova password</span></label>
      <input className={input} id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} disabled={busy} aria-describedby="new-password-help" onChange={event => setPassword(event.target.value)} />
      <label className="block text-sm font-semibold text-stone-700" htmlFor="confirm-password">Ripeti la nuova password</label>
      <input className={input} id="confirm-password" type="password" autoComplete="new-password" minLength={8} required value={confirmation} disabled={busy} onChange={event => setConfirmation(event.target.value)} />
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      <button className={primary} disabled={busy}>{busy ? 'Salvataggio…' : 'Salva la nuova password'}</button>
      <button type="button" className={secondary} disabled={busy} onClick={() => leave('/signin')}>Torna ad accedere</button>
    </form>
  </AuthFrame>;
}
