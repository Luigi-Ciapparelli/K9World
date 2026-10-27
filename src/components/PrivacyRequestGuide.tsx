import { useState } from 'react';
import { PRIVACY_CONTACT } from '../lib/legalNotices';

const requests = [
  { id: 'access', label: 'Accesso ai miei dati', text: 'Chiedo di sapere quali miei dati personali trattate e di riceverne una copia, con le informazioni previste dal GDPR.' },
  { id: 'correction', label: 'Correzione dei dati', text: 'Chiedo la rettifica dei dati personali inesatti o incompleti che indicherò di seguito.' },
  { id: 'deletion', label: 'Cancellazione dei dati o dell’account', text: 'Chiedo la cancellazione dei dati personali o dell’account che indicherò di seguito. Chiedo di conoscere eventuali dati da conservare, il motivo e il relativo termine o criterio.' },
  { id: 'restriction', label: 'Limitazione del trattamento', text: 'Chiedo di limitare il trattamento dei dati personali indicati di seguito, per il motivo che descriverò.' },
  { id: 'portability', label: 'Portabilità dei dati', text: 'Chiedo di ricevere, nei casi previsti dal GDPR, i dati personali che ho fornito in un formato strutturato e leggibile da dispositivo automatico.' },
  { id: 'objection', label: 'Opposizione o revoca del consenso', text: 'Chiedo di interrompere il trattamento o revocare il consenso per la finalità che indicherò di seguito. Per comunicazioni promozionali, chiedo di non ricevere ulteriori invii.' },
] as const;

export function PrivacyRequestGuide() {
  const [kind, setKind] = useState<string>('access');
  const [status, setStatus] = useState('');
  const request = requests.find(item => item.id === kind) || requests[0];
  const body = `Buongiorno,\n\n${request.text}\n\nEmail associata all’account o altro riferimento utile: [da completare, se pertinente]\nDati, servizio o contenuti interessati: [da completare]\nUlteriori dettagli utili: [facoltativi]\n\nGrazie.`;
  const emailHref = `mailto:${PRIVACY_CONTACT}?subject=${encodeURIComponent('Richiesta privacy — ' + request.label)}&body=${encodeURIComponent(body)}`;
  return (
    <section id="richieste-privacy" aria-labelledby="privacy-request-heading" className="mb-8 scroll-mt-24 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:p-6">
      <h2 id="privacy-request-heading" className="text-xl font-bold text-stone-900">Esercita i tuoi diritti</h2>
      <p className="mt-3 text-sm leading-relaxed">Puoi scrivere liberamente a <a href={`mailto:${PRIVACY_CONTACT}`} className="break-all font-semibold underline">{PRIVACY_CONTACT}</a>. Non servono un account o questo modello: la richiesta è di regola gratuita. Se vuoi, scegli un testo di partenza.</p>
      <label htmlFor="privacy-request-kind" className="mt-4 block text-sm font-semibold">Cosa vuoi richiedere?</label>
      <select id="privacy-request-kind" value={kind} onChange={event => { setKind(event.target.value); setStatus(''); }} className="mt-2 w-full min-w-0 rounded-xl border border-stone-300 bg-white p-3 text-sm">
        {requests.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      <label htmlFor="privacy-request-text" className="mt-4 block text-sm font-semibold">Testo da completare nella tua email</label>
      <textarea id="privacy-request-text" readOnly value={body} rows={9} className="mt-2 w-full rounded-xl border border-stone-300 bg-white p-3 text-sm leading-relaxed" />
      <div className="mt-3 flex flex-wrap gap-3">
        <a href={emailHref} className="rounded-xl bg-emerald-800 px-4 py-3 text-sm font-semibold text-white">Apri la tua app email</a>
        <button type="button" className="rounded-xl border border-emerald-800 px-4 py-3 text-sm font-semibold text-emerald-900" onClick={async () => {
          try { await navigator.clipboard.writeText(body); setStatus('Testo copiato. Completalo nella tua email e invialo a ' + PRIVACY_CONTACT + '.'); }
          catch { setStatus('Copia automatica non disponibile. Seleziona il testo nel riquadro e copialo manualmente.'); }
        }}>Copia il testo</button>
      </div>
      <p role="status" className="mt-2 text-sm">{status}</p>
      <p className="mt-3 text-sm leading-relaxed"><strong>La richiesta non è ancora inviata.</strong> Devi completare e inviare l’email dalla tua casella. Questa guida non salva un modulo e non invia messaggi automaticamente.</p>
      <p className="mt-3 text-sm leading-relaxed">Indica solo i riferimenti necessari a trovare i dati. Non inviare password, codici di accesso o documenti d’identità in anticipo. Se servono chiarimenti o una verifica proporzionata dell’identità, ti contatteremo.</p>
      <p className="mt-3 text-sm leading-relaxed">Il termine ordinario di risposta è un mese dalla ricezione. Nei casi previsti dal GDPR può essere esteso di altri due mesi: riceverai la comunicazione e il motivo entro il primo mese. Le richieste riguardanti anche un professionista possono richiedere il suo coinvolgimento, senza rendere disponibili dati di altre persone.</p>
      <p className="mt-3 text-sm">Per eliminare soltanto preferenze e progressi da questo dispositivo, usa <a href="/cookies#gestisci-dati-locali" className="font-semibold underline">i comandi dei dati locali</a>.</p>
    </section>
  );
}
