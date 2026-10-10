import { useEffect, useId, useRef, useState } from 'react';
import { IMAGE_LIMITS, prepareProfileImage, removeProfileImage, saveProfileImage, type ImageKind } from '../lib/profileImages';

export function ProfileImageEditor({ userId, kind, currentUrl, onSaved, onActivity }: {
  userId: string; kind: ImageKind; currentUrl?: string;
  onSaved: (url: string) => void | Promise<void>; onActivity?: (active: boolean) => void;
}) {
  const id = useId();
  const [file, setFile] = useState<File | null>(null);
  const [fit, setFit] = useState<'contain' | 'cover'>(kind === 'cover' ? 'cover' : 'contain');
  const [position, setPosition] = useState(50);
  const [prepared, setPrepared] = useState<{ blob: Blob; url: string; file: File; fit: string; position: number; kind: ImageKind } | null>(null);
  const [busy, setBusy] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [notice, setNotice] = useState('');
  const [failedPreview, setFailedPreview] = useState('');
  const lock = useRef(false), mounted = useRef(true);
  const preparation = useRef<Promise<void>>(Promise.resolve());
  const current = prepared?.file === file && prepared?.fit === fit && prepared?.position === position && prepared?.kind === kind ? prepared : null;
  const title = kind === 'cover' ? 'Banner del profilo' : kind === 'client' ? 'La tua foto personale' : 'Foto o logo della tua attività';
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { onActivity?.(busy || preparing || Boolean(file)); }, [busy, preparing, file, onActivity]);
  useEffect(() => {
    let active = true, url = '';
    const controller = new AbortController();
    setPrepared(null);
    if (!file) return;
    setPreparing(true); setNotice('');
    // Coalesce slider movement and allow only one decoder/encoder per editor.
    const timer = window.setTimeout(() => {
      preparation.current = preparation.current.then(async () => {
        if (!active) return;
        try {
          const blob = await prepareProfileImage(file, kind, fit, position, controller.signal);
          if (!active) return;
          url = URL.createObjectURL(blob); setPrepared({ blob, url, file, fit, position, kind });
        } catch (error) { if (active) setNotice(error instanceof Error ? error.message : 'Immagine non leggibile.'); }
        finally { if (active) setPreparing(false); }
      });
    }, 180);
    return () => { active = false; window.clearTimeout(timer); controller.abort(); if (url) URL.revokeObjectURL(url); };
  }, [file, fit, position, kind]);
  const act = async (remove: boolean) => {
    if (lock.current || preparing || (!remove && !current)) return;
    lock.current = true; setBusy(true); setNotice('');
    try {
      const url = remove ? (await removeProfileImage(userId, kind), '') : await saveProfileImage(userId, kind, current!.blob);
      if (!mounted.current) return;
      await onSaved(url);
      if (!mounted.current) return;
      setFile(null); setNotice(remove ? 'Foto rimossa.' : 'Foto salvata.');
    } catch (error) { if (mounted.current) setNotice(error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Operazione non riuscita. Riprova.'); }
    finally { lock.current = false; if (mounted.current) setBusy(false); }
  };
  const src = current?.url || currentUrl || '';
  return <section className="pc-card p-5 sm:p-6 mb-5" aria-labelledby={id} aria-busy={busy || preparing}>
    <h2 id={id} className="text-xl font-bold">{title}</h2>
    <p className="mt-2 text-sm leading-relaxed text-stone-600">{kind === 'client' ? 'Facoltativa. Ti rende riconoscibile ai professionisti con una richiesta in attesa, un servizio accettato o completato, oppure una relazione attiva. Non compare nella ricerca pubblica.' : kind === 'cover' ? 'Una foto orizzontale del tuo lavoro o del centro, visibile a chi apre il profilo. Disponibile per tutti i professionisti.' : 'Questa immagine è pubblica: comparirà nei risultati di ricerca e nel tuo profilo.'}</p>
    <div className={`mt-4 overflow-hidden rounded-2xl bg-stone-100 border border-stone-200 ${kind === 'cover' ? 'aspect-[8/3] w-full' : 'w-36 h-36'}`}>
      {src && failedPreview !== src ? <img src={src} alt={`Anteprima: ${title}`} onError={() => setFailedPreview(src)} className="h-full w-full object-cover" /> : <div className="h-full flex items-center justify-center text-center px-3 text-sm text-stone-500">{kind === 'cover' ? 'Il tuo banner' : 'Nessuna foto'}</div>}
    </div>
    <label className="mt-4 inline-block rounded-xl border border-emerald-700 px-4 py-2 font-semibold text-emerald-900 cursor-pointer">
      Scegli immagine
      <input aria-label={title} disabled={busy} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={e => { const next = e.target.files?.[0]; if (next) { setFile(next); setPosition(50); } e.currentTarget.value = ''; }} />
    </label>
    <p className="mt-2 text-xs text-stone-600">JPG, PNG o WebP, fino a 10 MB. Ottimizzazione automatica: massimo {Math.round(IMAGE_LIMITS[kind].bytes / 1024)} KB. Viene caricata soltanto la copia preparata.</p>
    {file && <div className="mt-4 space-y-3">
      <label className="block text-sm font-semibold">Inquadratura<select disabled={busy} value={fit} onChange={e => setFit(e.target.value as 'contain' | 'cover')} className="ml-2 rounded-lg border p-2"><option value="contain">Mantieni immagine intera</option><option value="cover">Riempi il riquadro</option></select></label>
      {fit === 'cover' && <label className="block text-sm">Posizione verticale<input aria-label="Posizione verticale" type="range" min="0" max="100" value={position} disabled={busy} onChange={e => setPosition(Number(e.target.value))} className="block w-full max-w-sm mt-2" /></label>}
      <p className="text-xs text-stone-600">{preparing ? 'Preparazione anteprima…' : current ? `Copia pronta: ${Math.ceil(current.blob.size / 1024)} KB. Controlla l’inquadratura prima di salvare.` : 'Scegli un’altra immagine o modifica l’inquadratura.'}</p>
      <div className="flex flex-wrap gap-3"><button disabled={busy || preparing || !current} onClick={() => void act(false)} className="rounded-xl bg-emerald-800 px-4 py-2 text-white font-semibold disabled:opacity-50">{busy ? 'Salvataggio…' : 'Salva foto'}</button><button disabled={busy} onClick={() => { setFile(null); setPreparing(false); setNotice(''); }} className="px-3 py-2 underline">Annulla</button></div>
    </div>}
    {!file && currentUrl && <button disabled={busy} onClick={() => void act(true)} className="ml-3 text-sm underline text-rose-700">Rimuovi foto</button>}
    {notice && <p role="status" className="mt-3 text-sm font-semibold">{notice}</p>}
  </section>;
}
