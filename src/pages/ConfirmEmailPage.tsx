import { useEffect, useRef, useState, type FormEvent } from 'react';
import { SignupConfirmationResend } from '../components/SignupConfirmationResend';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import { signupReturn, supabase } from '../lib/supabase';
import type { ConfirmationResult } from '../lib/signupConfirmation';
import { AuthFrame } from './AuthPages';

const button = 'w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50';
const link = 'font-semibold text-emerald-700 underline underline-offset-4';
const field = 'mt-1 block w-full rounded-xl border border-stone-300 px-3 py-2 text-stone-900';

export function ConfirmEmailPage() {
  const { navigate, params } = useRouter();
  const { user, loading } = useAuth();
  const [result, setResult] = useState<ConfirmationResult | null>(null);
  const [email, setEmail] = useState(params.email || '');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const inFlight = useRef(false);
  useEffect(() => {
    let active = true;
    void signupReturn.then(next => { if (active) setResult(next); });
    return () => { active = false; };
  }, []);
  async function verify(event: FormEvent) {
    event.preventDefault();
    if (inFlight.current || !email.trim() || !/^\d{6,10}$/.test(code.trim())) return;
    inFlight.current = true; setBusy(true); setError('');
    try {
      const { data, error } = await supabase.auth.verifyOtp({ type: 'email', email: email.trim(), token: code.trim() });
      setCode('');
      if (!error && data.user?.email_confirmed_at && data.user.email?.toLowerCase() === email.trim().toLowerCase()
          && data.session?.user.id === data.user.id) {
        setResult({ state: 'confirmed', id: data.user.id });
      } else {
        setError(error?.code === 'otp_expired' ? 'Il codice è scaduto o non è valido. Usa l’email più recente o richiedine una nuova.'
          : error?.status === 429 ? 'Troppi tentativi. Attendi prima di riprovare.'
          : 'Conferma non riuscita. Controlla indirizzo e codice dell’ultima email, poi riprova.');
      }
    } catch { setError('Non siamo riusciti a contattare il servizio. Controlla la connessione e riprova.'); }
    finally { inFlight.current = false; setBusy(false); }
  }
  if (!result || (result.state === 'confirmed' && loading && !user)) return <AuthFrame title="Controllo del link" subtitle="Stiamo verificando la risposta del servizio di accesso.">
    <p role="status">Attendi un momento…</p>
    <button className={link} onClick={() => navigate('/signin')}>Vai ad Accedi</button>
  </AuthFrame>;
  if (result.state === 'confirmed' && user?.id === result.id) return <AuthFrame title="Email confermata" subtitle="Il tuo indirizzo email è stato verificato.">
    <p className="mb-4 text-sm text-stone-700">Se hai presentato una candidatura professionale, la verifica della qualifica è un passaggio separato.</p>
    <button className={button} onClick={() => navigate('/account/contacts')}>Continua nel tuo account</button>
  </AuthFrame>;
  const title = result.state === 'expired' ? 'Link scaduto o già utilizzato' : result.state === 'invalid' ? 'Link non valido'
    : result.state === 'unavailable' ? 'Verifica non disponibile' : 'Conferma la tua email';
  return <AuthFrame title={title} subtitle={result.state === 'open' ? 'Usa l’indirizzo con cui ti sei registrato.' : 'Se hai già confermato l’email, puoi accedere. Altrimenti richiedi un nuovo messaggio.'}>
    <form onSubmit={verify} className="space-y-4">
      <label className="block text-sm font-semibold">Email di registrazione
        <input className={field} type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} />
      </label>
      <SignupConfirmationResend email={email} />
      <details open={params.mode === 'code' || undefined} className="rounded-xl border border-stone-200 p-3">
        <summary className="cursor-pointer font-semibold">Ho un codice nell’email</summary>
        <label className="mt-3 block text-sm">Codice di conferma
          <input className={field} type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10}
            value={code} onChange={e => setCode(e.target.value.trim())} />
        </label>
        <button className={button + ' mt-3'} disabled={busy || !/^\d{6,10}$/.test(code) || !email.trim()}>{busy ? 'Verifica in corso…' : 'Conferma il codice'}</button>
      </details>
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    </form>
    <div className="mt-5 flex flex-wrap gap-4 border-t pt-4 text-sm"><button className={link} onClick={() => navigate('/signin')}>Accedi</button>
      <button className={link} onClick={() => navigate('/forgot-password')}>Recupera la password</button></div>
  </AuthFrame>;
}
