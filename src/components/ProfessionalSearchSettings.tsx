import { useEffect, useRef, useState } from 'react';
import { useUnsavedChanges } from '../lib/RouterContext';
import { supabase } from '../lib/supabase';
import { useSportDisciplines, type ProfessionalSearchModes } from '../lib/sportSearch';

export function ProfessionalSearchSettings() {
  const catalog = useSportDisciplines();
  const [modes, setModes] = useState<ProfessionalSearchModes | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  useUnsavedChanges(dirty);
  const [saving, setSaving] = useState(false);
  const inFlight = useRef(false);
  const [attempt, setAttempt] = useState(0);
  const mounted = useRef(true);

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let current = true;
    setLoading(true);
    setLoadError('');
    void (async () => {
      try {
        const { data, error } = await supabase.rpc('get_my_professional_search_modes');
        if (error) throw error;
        if (current) setModes(data);
      } catch {
        if (current) setLoadError('Non è stato possibile caricare la visibilità del profilo.');
      } finally {
        if (current) setLoading(false);
      }
    })();
    return () => { current = false; };
  }, [attempt]);

  const change = (next: ProfessionalSearchModes) => {
    setModes(next); setDirty(true); setSaved(false); setSaveError('');
  };
  const save = async () => {
    if (!modes || inFlight.current) return;
    if (modes.show_sport && !modes.discipline_ids.length) {
      setSaveError('Scegli almeno una disciplina per comparire in Sport cinofili.');
      return;
    }
    inFlight.current = true;
    setSaving(true); setSaved(false); setSaveError('');
    try {
      const { data, error } = await supabase.rpc('set_my_professional_search_modes', {
        p_show_companion: modes.show_companion,
        p_show_sport: modes.show_sport,
        p_discipline_ids: modes.discipline_ids,
      });
      if (error) throw error;
      if (mounted.current) { setModes(data); setSaved(true); setDirty(false); }
    } catch {
      if (mounted.current) setSaveError('Salvataggio non confermato. Riprova; le tue scelte sono ancora qui.');
    } finally {
      inFlight.current = false;
      if (mounted.current) setSaving(false);
    }
  };

  return (
    <section className="pc-card p-6 md:p-7 mb-5" aria-labelledby="professional-search-heading">
      <p className="pc-kicker">Come vuoi essere trovato</p>
      <h2 id="professional-search-heading" className="pc-display text-2xl font-semibold mt-2">Le tue aree di attività</h2>
      <p className="text-sm text-[var(--pc-muted-600)] mt-3 mb-5">
        Scegli dove mostrare i tuoi servizi di addestramento. Puoi attivare ciascuna sezione in modo indipendente.
      </p>
      {loading || catalog.loading ? <p role="status">Caricamento delle preferenze…</p>
        : loadError || catalog.error ? <div role="alert"><p>{loadError || catalog.error}</p>
          <button type="button" className="pc-btn pc-btn-secondary mt-3" onClick={() => { catalog.retry(); setAttempt(x => x + 1); }}>Riprova</button></div>
        : modes && <>
          <fieldset disabled={saving} className="space-y-3 disabled:opacity-60">
            <legend className="sr-only">Visibilità dei servizi di addestramento</legend>
            <label className="flex items-start gap-3 rounded-2xl border border-[var(--pc-line)] p-4 cursor-pointer">
              <input type="checkbox" className="mt-1 accent-emerald-700" checked={modes.show_companion}
                onChange={e => change({ ...modes, show_companion: e.target.checked })} />
              <span><span className="block font-semibold">Mostrami nella sezione Gestione del cane</span>
                <span className="block text-sm text-[var(--pc-muted-600)] mt-1">Per chi cerca aiuto nella vita quotidiana e nella relazione con il cane.</span></span>
            </label>
            <label className="flex items-start gap-3 rounded-2xl border border-[var(--pc-line)] p-4 cursor-pointer">
              <input type="checkbox" className="mt-1 accent-emerald-700" checked={modes.show_sport}
                onChange={e => change({ ...modes, show_sport: e.target.checked })} />
              <span><span className="block font-semibold">Mostrami nella sezione Sport cinofili</span>
                <span className="block text-sm text-[var(--pc-muted-600)] mt-1">Per chi cerca un percorso sportivo in una disciplina che insegni.</span></span>
            </label>
            {modes.show_sport && <fieldset className="rounded-2xl bg-[var(--pc-bone-50)] p-4">
              <legend className="font-bold px-1">Quali discipline insegni?</legend>
              <p className="text-sm text-[var(--pc-muted-600)] mb-3">Seleziona le attività che offri. Questa scelta descrive i tuoi servizi e non assegna una qualifica o un badge.</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {catalog.disciplines.map(d => <label key={d.id} className="flex items-center gap-3 p-2 cursor-pointer">
                  <input type="checkbox" className="accent-emerald-700" checked={modes.discipline_ids.includes(d.id)}
                    onChange={e => change({ ...modes, discipline_ids: e.target.checked
                      ? [...modes.discipline_ids, d.id] : modes.discipline_ids.filter(id => id !== d.id) })} />
                  {d.label}
                </label>)}
              </div>
            </fieldset>}
          </fieldset>
          {!modes.show_companion && !modes.show_sport && <p className="text-sm mt-3">I servizi di addestramento saranno nascosti da queste due ricerche. Gli altri servizi restano disponibili.</p>}
          <p className="text-sm text-[var(--pc-muted-600)] mt-4">Per comparire negli elenchi servono un profilo approvato e almeno un servizio di addestramento attivo.</p>
          {saveError && <p role="alert" className="text-rose-700 mt-3">{saveError}</p>}
          {saved && <p role="status" className="text-emerald-800 mt-3">Visibilità e discipline salvate.</p>}
          <button type="button" className="pc-btn pc-btn-primary mt-4" disabled={saving} onClick={() => void save()}>
            {saving ? 'Salvataggio…' : 'Salva visibilità e discipline'}
          </button>
        </>}
    </section>
  );
}
