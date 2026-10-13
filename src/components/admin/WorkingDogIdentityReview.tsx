import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

type Identity = {
  id: string; professional_id: string; profile_url: string; provider_user_id: string | null;
  verification_version: string; verification_status: string; verification_note: string | null;
};
const labels: Record<string, string> = { pending: 'Da verificare', verified: 'Verificati', rejected: 'Rifiutati', revoked: 'Revocati' };

export function WorkingDogIdentityReview() {
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState<Identity[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setConfirmed({}); setNotes({});
    try {
      const {data, error} = await supabase.from('professional_external_identities')
        .select('id, professional_id, profile_url, provider_user_id, verification_version, verification_status, verification_note')
        .eq('provider', 'working_dog').eq('verification_status', status).order('updated_at', {ascending: false}).limit(100);
      if (error) throw error;
      const result = (data || []) as Identity[];
      const ids = [...new Set(result.map(row => row.professional_id))];
      if (ids.length) {
        const profiles = await supabase.from('profiles').select('id, full_name').in('id', ids);
        if (profiles.error) throw profiles.error;
        setNames(Object.fromEntries((profiles.data || []).map(row => [row.id, row.full_name || 'Professionista'])));
      }
      setRows(result);
    } catch { setRows([]); setNotice('Collegamenti non caricati. Premi Aggiorna per riprovare.'); }
    finally { setLoading(false); }
  }, [status]);
  useEffect(() => { void load(); }, [load]);
  async function review(row: Identity, decision: 'verified' | 'rejected' | 'revoked') {
    const note = (notes[row.id] || '').trim();
    if (busy || note.length < 20 || (decision === 'verified' && !confirmed[row.id])) return;
    setBusy(row.id); setNotice('');
    try {
      const {error} = await supabase.rpc('review_working_dog_identity', {
        p_id: row.id, p_expected_version: row.verification_version, p_status: decision, p_note: note,
      });
      if (error) {
        setNotice(error.code === '40001' ? 'Il collegamento è cambiato. Aggiorna e controlla la nuova versione.' : error.message);
      } else { setNotice(decision === 'verified' ? 'Titolarità verificata. I risultati richiedono un controllo separato.' : 'Esito registrato. Le verifiche automatiche dei risultati collegati sono state invalidate.'); await load(); }
    } catch { setNotice('Esito non confermato. Aggiorna prima di riprovare.'); }
    finally { setBusy(null); }
  }
  return <section className="pc-card p-6 md:p-8 mb-8">
    <h2 className="pc-display text-2xl font-semibold">Collegamenti Working-Dog</h2>
    <p className="mt-3 text-sm leading-6">Verifica che il professionista controlli davvero il profilo indicato. Nome, foto e risultati pubblici da soli non dimostrano la titolarità. Registra una prova, ad esempio un codice concordato pubblicato temporaneamente dal titolare sul suo profilo, se il servizio lo consente, oppure una verifica diretta documentata.</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <label>Mostra <select aria-label="Stato collegamenti Working-Dog" className="ml-2 rounded-lg border p-2" value={status} disabled={busy !== null || loading} onChange={event => {setNotice(''); setStatus(event.target.value);}}>
        {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select></label>
      <button className="pc-btn pc-btn-secondary" disabled={busy !== null || loading} onClick={() => {setNotice(''); void load();}}>Aggiorna</button>
    </div>
    {notice && <p role="status" className="mt-3 text-sm">{notice}</p>}
    {loading ? <p className="mt-4">Caricamento…</p> : rows.length === 0 ? <p className="mt-4 text-sm">Nessun collegamento in questo stato.</p> :
      <div className="mt-4 grid gap-4">{rows.map(row => <article key={row.id} className="rounded-xl border border-[var(--pc-line)] p-4">
        <h3 className="font-bold">{names[row.professional_id] || 'Professionista'}</h3>
        {row.provider_user_id ? <a className="underline text-sm" href={row.profile_url} target="_blank" rel="noopener noreferrer">Apri il profilo Working-Dog · {row.provider_user_id}</a> : <p className="text-sm">URL precedente non valido: chiedi di inserire il collegamento al profilo personale.</p>}
        {row.verification_note && <p className="mt-2 text-sm">Ultimo esito: {row.verification_note}</p>}
        <label className="mt-3 block text-sm">Prova di titolarità o motivo dell’esito (20–1000 caratteri)
          <textarea className="mt-1 w-full rounded-lg border p-2" rows={3} minLength={20} maxLength={1000} disabled={busy !== null} value={notes[row.id] || ''} onChange={event => setNotes({...notes, [row.id]: event.target.value})} />
        </label>
        <p className="text-xs">Descrivi il controllo; non inserire password, documenti di identità o codici di accesso.</p>
        {status !== 'verified' && <label className="mt-3 flex items-start gap-2 text-sm"><input type="checkbox" className="mt-1" checked={Boolean(confirmed[row.id])} disabled={busy !== null} onChange={event => setConfirmed({...confirmed, [row.id]: event.target.checked})} />Ho verificato la titolarità del profilo con una prova distinta dalla corrispondenza del nome.</label>}
        <div className="mt-3 flex flex-wrap gap-2">
          {status !== 'verified' && <button className="pc-btn pc-btn-primary" disabled={busy !== null || !row.provider_user_id || !confirmed[row.id] || (notes[row.id] || '').trim().length < 20} onClick={() => void review(row, 'verified')}>Conferma titolarità</button>}
          <button className="pc-btn pc-btn-secondary" disabled={busy !== null || (notes[row.id] || '').trim().length < 20} onClick={() => void review(row, status === 'verified' ? 'revoked' : 'rejected')}>{status === 'verified' ? 'Revoca verifica' : 'Rifiuta collegamento'}</button>
        </div>
      </article>)}{rows.length === 100 && <p className="text-sm">Sono mostrati i primi 100 collegamenti. Completa le verifiche e aggiorna per vedere i successivi.</p>}</div>}
  </section>;
}
