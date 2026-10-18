import { useState } from 'react';
import { RefreshCw, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import { RouteLink } from './RouteLink';

export function AccountProfileRecovery() {
  const { refreshProfile, signOut } = useAuth();
  const { navigate } = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const retry = async () => { if (busy) return; setBusy(true); setError(''); try { await refreshProfile(); } finally { setBusy(false); } };
  const leave = async () => {
    if (busy) return;
    setBusy(true); setError('');
    try { await signOut(); navigate('/signin'); }
    catch { setError('Uscita non riuscita. Controlla la connessione e riprova.'); }
    finally { setBusy(false); }
  };
  return <main className="flex min-h-[80dvh] items-center justify-center bg-stone-50 px-4 py-10 text-stone-900">
    <section className="w-full max-w-lg rounded-3xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8" aria-labelledby="profile-recovery-title" aria-busy={busy}>
      <p className="mb-3 text-sm font-bold text-emerald-800">PortaleCinofilo · Il tuo account</p>
      <h1 id="profile-recovery-title" className="text-2xl font-bold">Non riesco a caricare il tuo profilo</h1>
      <p className="mt-4 leading-relaxed text-stone-600">Hai effettuato l’accesso, ma i dati del profilo non sono disponibili. Controlla la connessione e riprova.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" disabled={busy} onClick={retry} className="inline-flex items-center gap-2 rounded-xl bg-emerald-800 px-4 py-3 font-semibold text-white disabled:opacity-50"><RefreshCw aria-hidden="true" size={18} />Riprova caricamento</button>
        <button type="button" disabled={busy} onClick={leave} className="inline-flex items-center gap-2 rounded-xl border border-stone-300 px-4 py-3 font-semibold disabled:opacity-50"><LogOut aria-hidden="true" size={18} />Esci dall’account</button>
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-rose-700">{error}</p>}
      <p className="mt-6 text-sm leading-relaxed text-stone-600">Se il problema continua, scrivi a <a href="mailto:info@portalecinofilo.com" className="break-all font-semibold text-emerald-800 underline">info@portalecinofilo.com</a>. Non serve creare un secondo account.</p>
      <RouteLink to="/impara" className="mt-5 inline-flex items-center gap-2 py-2 font-semibold text-emerald-800"><ArrowLeft aria-hidden="true" size={18} />Continua a leggere Impara</RouteLink>
    </section>
  </main>;
}
