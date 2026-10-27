import { LEGAL_NOTICE_VERSION, PRIVACY_CONTACT } from '../lib/legalNotices';

export function SignupPrivacyNotice({ dog = false }: { dog?: boolean }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 text-sm leading-relaxed text-stone-700">
      <p>{dog
        ? 'I dati del cane servono a preparare le richieste e le relazioni con i professionisti. Nome e razza sono richiesti; le altre informazioni sono facoltative. Inserisci solo ciò che serve al servizio ed evita dati sanitari delle persone o informazioni private di terzi.'
        : 'Luigi Ciapparelli usa nome, email, telefono e credenziali per creare e gestire il tuo account. I campi indicati sono richiesti in questa registrazione. L’email serve anche alla conferma e al recupero dell’accesso. La registrazione non ti iscrive a comunicazioni promozionali.'}</p>
      <p className="mt-2">
        <a href="/privacy" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-800 underline underline-offset-4">Leggi l’informativa privacy (nuova scheda)</a>
        {' '}per finalità, fornitori, conservazione e diritti. Puoi scrivere a{' '}
        <a href={`mailto:${PRIVACY_CONTACT}`} className="break-all underline">{PRIVACY_CONTACT}</a>.
      </p>
    </div>
  );
}

export function SignupTerms({ professional, checked, onChange }: { professional: boolean; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <div className="rounded-xl border border-stone-200 p-3 text-sm text-stone-700">
      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" required checked={checked} onChange={event => onChange(event.target.checked)} aria-describedby="signup-terms-links" className="mt-1 h-4 w-4 shrink-0 accent-emerald-700" />
        <span>{professional ? 'Accetto i Termini di utilizzo e i Termini per i professionisti.' : 'Accetto i Termini di utilizzo.'}</span>
      </label>
      <p id="signup-terms-links" className="mt-2 leading-relaxed">
        <a href="/terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-800 underline underline-offset-4">Termini di utilizzo (nuova scheda)</a>
        {professional && <> · <a href="/professional-terms" target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-800 underline underline-offset-4">Termini per i professionisti (nuova scheda)</a></>}
      </p>
      <p className="mt-2 text-xs text-stone-600">Versione {LEGAL_NOTICE_VERSION}. Questa scelta riguarda il contratto di utilizzo, non il consenso al marketing.</p>
    </div>
  );
}
