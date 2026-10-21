import { useState } from 'react';
import { browserDataGroups, clearBrowserData, type BrowserDataGroup } from '../lib/browserData';

export function BrowserDataControls() {
  const [pending, setPending] = useState<BrowserDataGroup | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const confirm = async () => {
    if (!pending || busy) return;
    setBusy(true);
    try {
      await clearBrowserData(pending);
      setMessage('Operazione completata in questo browser. Account e dati online non sono stati modificati.');
      setPending(null);
    } catch {
      setMessage('Il browser non ha consentito di completare la cancellazione. Puoi gestire i dati dalle sue impostazioni; non risulta confermata la rimozione di tutti i dati selezionati.');
    } finally { setBusy(false); }
  };
  return <div>
    <p>Questi comandi agiscono soltanto sul browser che stai usando. Non eliminano account, prenotazioni, messaggi o archivi online e non ti disconnettono. Su un dispositivo condiviso, gli appunti di Impara e le risposte al test sono accessibili anche ad altre persone.</p>
    <div className="mt-5 divide-y divide-stone-200">
      {browserDataGroups.map(group => <div key={group.id} className="py-4">
        <h3 className="font-semibold text-stone-900">{group.title}</h3>
        <p className="mt-1 text-sm">{group.description}</p>
        <button type="button" disabled={busy} onClick={() => { setPending(group.id); setMessage(''); }} className="mt-3 rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold hover:bg-stone-100 disabled:opacity-60">{group.action}</button>
        {pending === group.id && <div role="group" aria-label={`Conferma: ${group.title}`} className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-stone-900">
          <p>Confermi questa operazione? I dati locali cancellati non sono recuperabili senza un tuo backup. Chiudi le altre schede del sito per evitare che risalvino dati ancora aperti.</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" disabled={busy} onClick={() => setPending(null)} className="rounded-lg border border-stone-300 px-4 py-2 font-semibold">Annulla</button>
            <button type="button" disabled={busy} onClick={() => void confirm()} className="rounded-lg bg-emerald-800 px-4 py-2 font-semibold text-white">{busy ? 'Operazione in corso…' : 'Conferma operazione'}</button>
          </div>
        </div>}
      </div>)}
    </div>
    <p role="status" aria-live="polite" className="mt-3 font-semibold">{message}</p>
    <p className="mt-4 text-sm">Per chiudere la sessione usa «Esci» nel menu account. Per rimuovere anche i dati dell’account dal browser usa le impostazioni del browser: dovrai poi accedere di nuovo. Per i dati conservati online consulta l’informativa privacy e contatta info@portalecinofilo.com.</p>
  </div>;
}
