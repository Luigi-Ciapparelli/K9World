import { useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { signupEmailRedirect } from '../lib/signupConfirmation';

export function SignupConfirmationResend({ email }: { email: string }) {
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const locked = useRef(false);
  useEffect(() => {
    if (!cooldown) return;
    const timer = window.setTimeout(() => { locked.current = false; setCooldown(false); }, 60000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);
  async function resend() {
    if (locked.current) return;
    locked.current = true; setBusy(true); setInfo('');
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim(), options: { emailRedirectTo: signupEmailRedirect() } });
      if (!error || error.status === 429) setCooldown(true);
      else locked.current = false;
      setInfo(!error ? 'Se l’indirizzo è in attesa di conferma, riceverai una nuova email. Apri solo l’ultima; controlla anche lo spam.'
        : error.status === 429 ? 'È già stato richiesto un invio. Controlla la posta e attendi un minuto prima di riprovare.'
        : 'Invio non confermato. Riprova tra poco; se il problema continua, scrivi a info@portalecinofilo.com.');
    } catch {
      locked.current = false; setInfo('Invio non confermato. Controlla la connessione e riprova.');
    } finally { setBusy(false); }
  }
  return <div className="text-sm text-stone-700">
    <button type="button" disabled={busy || cooldown || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())}
      className="mt-2 font-semibold text-emerald-700 underline underline-offset-4 disabled:opacity-50" onClick={resend}>
      {busy ? 'Invio in corso…' : 'Reinvia email di conferma'}
    </button>
    {info && <p role="status" className="mt-2">{info}</p>}
  </div>;
}
