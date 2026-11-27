import { useEffect, useId, useRef, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import type { Dog } from '../../lib/types';
import { loadFciBreeds, normalizeBreedSearch, type FciBreed } from '../../lib/fciBreeds';
import { dogAgeLabel, dogWeightLabel } from '../../lib/ownerDogFacts';
import { RouteLink } from '../../components/RouteLink';
import '../../owner-workspace.css';
import { DogPhoto } from '../../components/DogPhoto';
import { deleteDogPhoto, uploadDogPhoto, prepareDogPhoto } from '../../lib/dogPhotos';

export function DogsPage() {
  const { user } = useAuth();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [editing, setEditing] = useState<Partial<Dog> | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const read = useRef(0);
  const load = async () => {
    const id=++read.current;
    setLoadError(false); setLoading(true);
    if (!user) return;
    const { data, error } = await supabase.from('dogs').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });

    if (id !== read.current) return;
    setLoading(false);
    if (error) { setLoadError(true); setDogs([]); return; }

    setDogs((data as Dog[]) || []);
  };

  useEffect(() => { setDogs([]); void load(); return () => { read.current++; }; }, [user?.id]);

  const save = async (photoFile: File | null, removePhoto: boolean) => {
    if (!editing || !user) return;

    const typedBreedName = (editing.breed || '').trim();

    if (!typedBreedName) {
      alert('Inserisci la razza del cane');
      return;
    }

    const normalizedTypedBreed = normalizeBreedSearch(typedBreedName);
    const isMixedBreed =
      normalizedTypedBreed === normalizeBreedSearch('Meticcio / altra razza') ||
      normalizedTypedBreed === 'meticcio';

    let breedName = isMixedBreed ? 'Meticcio / altra razza' : typedBreedName;
    let breedSlug = isMixedBreed ? null : editing.breed_slug || null;
    let fciGroup = isMixedBreed ? null : editing.fci_group || null;

    if (!isMixedBreed && !breedSlug) {
      try {
        const allBreeds = await loadFciBreeds();
        const exactBreed = allBreeds.find(
          (breed) => normalizeBreedSearch(breed.name) === normalizedTypedBreed
        );

        if (!exactBreed) {
          alert('Seleziona la razza dai suggerimenti oppure scegli Meticcio / altra razza');
          return;
        }

        breedName = exactBreed.name;
        breedSlug = exactBreed.slug;
        fciGroup = exactBreed.fciGroup;
      } catch (error) {
        console.error('FCI breeds load error:', error);
        alert('Impossibile verificare la razza in questo momento. Riprova.');
        return;
      }
    }

    const payload = {
      owner_id: user.id,
      name: editing.name || '',
      breed: breedName,
      breed_slug: breedSlug,
      fci_group: fciGroup,
      age: Number(editing.age) || 0,
      birth_date: editing.birth_date || null,
      weight: Number(editing.weight) || 0,
      vaccinated: editing.vaccinated || false,
      aggressive: editing.aggressive || false,
      medical_notes: editing.medical_notes || '',
    };

    let dogId = editing.id;

    if (dogId) {
      const { error } = await supabase
        .from('dogs')
        .update(payload)
        .eq('id', dogId)
        .eq('owner_id', user.id);

      if (error) {
        console.error('Dog save error:', error);
        alert('Operazione non riuscita. Riprova.');
        return;
      }
    } else {
      const { data, error } = await supabase
        .from('dogs')
        .insert(payload)
        .select('id')
        .single();

      if (error || !data) {
        console.error('Dog create error:', error);
        alert('Impossibile creare il profilo del cane. Riprova.');
        return;
      }

      dogId = data.id;
    }

    if (!dogId) {
      alert('Impossibile determinare il profilo del cane salvato');
      return;
    }

    let photoWarning = '';

    if (photoFile) {
      try {
        const oldPhotoPath = editing.photo_url || '';
        const photoPath = await uploadDogPhoto({
          file: photoFile,
          ownerId: user.id,
          dogId,
        });

        const { error } = await supabase
          .from('dogs')
          .update({ photo_url: photoPath })
          .eq('id', dogId)
          .eq('owner_id', user.id);

        if (error) throw error;

        if (oldPhotoPath && oldPhotoPath !== photoPath) {
          try {
            await deleteDogPhoto(oldPhotoPath);
          } catch (cleanupError) {
            console.warn('Old dog photo cleanup error:', cleanupError);
          }
        }
      } catch (error) {
        console.error('Dog photo upload error:', error);
        photoWarning =
          error instanceof Error
            ? `I dati del cane sono stati salvati, ma la foto non è stata caricata: ${error.message}`
            : 'I dati del cane sono stati salvati, ma la foto non è stata caricata.';
      }
    } else if (removePhoto && editing.photo_url) {
      const oldPhotoPath = editing.photo_url;

      const { error } = await supabase
        .from('dogs')
        .update({ photo_url: '' })
        .eq('id', dogId)
        .eq('owner_id', user.id);

      if (error) {
        console.error('Dog photo remove error:', error);
        photoWarning = `I dati del cane sono stati salvati, ma la foto non è stata rimossa: ${error.message}`;
      } else {
        try {
          await deleteDogPhoto(oldPhotoPath);
        } catch (cleanupError) {
          console.warn('Dog photo storage cleanup error:', cleanupError);
        }
      }
    }

    setEditing(null);
    await load();

    if (photoWarning) {
      alert(photoWarning);
    }
  };

  const remove = async (dog: Dog) => {
    if (!confirm(`Eliminare la scheda di ${dog.name}? Questa azione non può essere annullata.`)) return;

    const { error } = await supabase
      .from('dogs')
      .delete()
      .eq('id', dog.id)
      .eq('owner_id', user?.id);

    if (error) {
      console.error('Dog remove error:', error);
      alert('Operazione non riuscita. Riprova.');
      return;
    }

    try {
      await deleteDogPhoto(dog.photo_url);
    } catch (cleanupError) {
      console.warn('Dog photo cleanup after delete failed:', cleanupError);
    }

    load();
  };

  return <main className="pc-owner">
    <div className="pc-owner-wrap">
      <RouteLink className="pc-owner-back" to="/owner">Area cliente</RouteLink>
      <header className="pc-owner-heading">
        <div><h1>I miei cani</h1><p>Apri una scheda per vedere i dati e lo storico del tuo cane.</p></div>
        <button type="button" className="pc-owner-primary" onClick={() => setEditing({})}><Plus size={18} aria-hidden="true"/> Aggiungi cane</button>
      </header>
      {loading ? <p role="status">Caricamento dei cani…</p> : loadError ? <p role="alert">Non siamo riusciti a caricare i tuoi cani. <button className="pc-owner-link" onClick={() => void load()}>Riprova</button></p>
        : !dogs.length ? <p className="pc-owner-surface">Non hai ancora aggiunto un cane. Puoi iniziare con il suo nome e la razza.</p>
        : <div className="pc-dogs-list">{dogs.map(d => <article className="pc-dog-card" key={d.id}>
          <div className="pc-dog-thumb"><DogPhoto photoPath={d.photo_url} silhouette alt={d.name} className="pc-dog-img"/></div>
          <div className="pc-dog-summary"><h2><RouteLink to={`/owner/dogs/${d.id}`}>{d.name}</RouteLink></h2><p>{d.breed || 'Razza non indicata'}</p>
            <div className="pc-dog-facts"><span>{dogAgeLabel(d.birth_date,d.age)}</span><span aria-hidden="true">·</span><span>{dogWeightLabel(d.weight)}</span></div>
            {d.fci_group && <RouteLink className="pc-owner-link" to={`/gruppi-fci/${d.fci_group}`}>Gruppo FCI {d.fci_group}</RouteLink>}
            {(d.vaccinated || d.aggressive) && <div className="pc-dog-flags">{d.vaccinated && <span>Vaccinato</span>}{d.aggressive && <span>Reattivo con altri cani</span>}</div>}
          </div>
          <div className="pc-dog-actions"><button aria-label={`Modifica ${d.name}`} onClick={() => setEditing(d)}><Pencil size={17} aria-hidden="true"/>Modifica</button><button aria-label={`Elimina ${d.name}`} onClick={() => void remove(d)}><Trash2 size={17} aria-hidden="true"/>Elimina</button></div>
        </article>)}</div>}
    </div>
    {editing && <DogModal dog={editing} onChange={setEditing} onSave={save} onClose={() => setEditing(null)} />}
  </main>;
}

function DogModal({
  dog,
  onChange,
  onSave,
  onClose,
}: {
  dog: Partial<Dog>;
  onChange: (d: Partial<Dog>) => void;
  onSave: (photoFile: File | null, removePhoto: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const element=dialog.current, previous=document.activeElement as HTMLElement | null;
    element?.showModal(); return () => { element?.close(); if (previous?.isConnected) previous.focus(); };
  }, []);
  const [breeds, setBreeds] = useState<FciBreed[]>([]);
  const [breedMenuOpen, setBreedMenuOpen] = useState(false);
  const [breedsLoading, setBreedsLoading] = useState(true);
  const [breedLoadError, setBreedLoadError] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [photoPreparing, setPhotoPreparing] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const photoTask = useRef<AbortController | null>(null);
  useEffect(() => () => photoTask.current?.abort(), []);

  useEffect(() => {
    let active = true;

    setBreedsLoading(true);
    setBreedLoadError('');

    loadFciBreeds()
      .then((items) => {
        if (active) setBreeds(items);
      })
      .catch((error) => {
        console.error('FCI breeds load error:', error);
        if (active) setBreedLoadError('Impossibile caricare l’elenco FCI');
      })
      .finally(() => {
        if (active) setBreedsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);


  useEffect(() => {
    if (!photoFile) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(photoFile);
    setPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [photoFile]);

  const choosePhoto = async (file: File | null) => {
    if (!file || saving) return;
    photoTask.current?.abort();
    const task = new AbortController(); photoTask.current = task;
    setPhotoPreparing(true); setPhotoError(''); setPhotoFile(null);
    try {
      const prepared = await prepareDogPhoto(file, task.signal);
      if (task.signal.aborted) return;
      setPhotoFile(prepared); setRemovePhoto(false);
    } catch (error) {
      if (!task.signal.aborted) setPhotoError(error instanceof Error ? error.message : 'Foto non valida');
    } finally { if (!task.signal.aborted) setPhotoPreparing(false); }
  };

  const clearPhoto = () => {
    photoTask.current?.abort(); setPhotoPreparing(false); setPhotoError('');
    setPhotoFile(null); setRemovePhoto(Boolean(dog.photo_url));
  };

  const handleSave = async () => {
    if (saving || photoPreparing) return;

    setSaving(true);
    try {
      await onSave(photoFile, removePhoto);
    } finally {
      setSaving(false);
    }
  };

  const normalizedBreed = normalizeBreedSearch(dog.breed || '');

  const breedSuggestions =
    normalizedBreed.length >= 2
      ? breeds
          .filter((breed) =>
            normalizeBreedSearch(breed.name).includes(normalizedBreed)
          )
          .sort((a, b) => {
            const aStarts = normalizeBreedSearch(a.name).startsWith(normalizedBreed);
            const bStarts = normalizeBreedSearch(b.name).startsWith(normalizedBreed);
            if (aStarts !== bStarts) return aStarts ? -1 : 1;
            return a.name.localeCompare(b.name);
          })
          .slice(0, 12)
      : [];

  const selectedBreed =
    dog.breed_slug
      ? breeds.find((breed) => breed.slug === dog.breed_slug) || null
      : null;

  const commitExactBreed = () => {
    if (dog.breed_slug) return;

    const normalized = normalizeBreedSearch(dog.breed || '');

    if (normalized === 'meticcio') {
      onChange({
        ...dog,
        breed: 'Meticcio / altra razza',
        breed_slug: null,
        fci_group: null,
      });
      return;
    }

    const exactBreed = breeds.find(
      (breed) => normalizeBreedSearch(breed.name) === normalized
    );

    if (exactBreed) {
      onChange({
        ...dog,
        breed: exactBreed.name,
        breed_slug: exactBreed.slug,
        fci_group: exactBreed.fciGroup,
      });
    }
  };

  return (
    <dialog ref={dialog} aria-labelledby="dog-editor-title" className="pc-dog-dialog" onCancel={e => { e.preventDefault(); if (!saving) onClose(); }}>
      <form onSubmit={e => { e.preventDefault(); void handleSave(); }} className="p-4 sm:p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 id="dog-editor-title" className="text-xl font-bold text-stone-900">{dog.id ? 'Modifica cane' : 'Aggiungi cane'}</h2>
          <button type="button" aria-label="Chiudi modifica cane" disabled={saving} onClick={onClose} className="text-stone-500 hover:text-stone-900"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <Input label="Nome del cane" required value={dog.name || ''} onChange={(v) => onChange({ ...dog, name: v })} />
          <div className="relative">
            <label htmlFor="dog-breed" className="text-sm font-semibold text-stone-700">Razza</label>
            <input
              id="dog-breed" required type="text"
              value={dog.breed || ''}
              onFocus={() => setBreedMenuOpen(true)}
              onBlur={() => {
                commitExactBreed();
                window.setTimeout(() => setBreedMenuOpen(false), 150);
              }}
              onChange={(e) => {
                onChange({
                  ...dog,
                  breed: e.target.value,
                  breed_slug: null,
                  fci_group: null,
                });
                setBreedMenuOpen(true);
              }}
              placeholder="Razza, es. Rottweiler"
              autoComplete="off"
              className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:border-emerald-500 focus:outline-none"
            />

            {breedMenuOpen && (
              <div className="absolute z-[80] left-0 right-0 mt-2 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden max-h-72 overflow-y-auto">
                {breedsLoading && (
                  <div className="px-4 py-3 text-sm text-stone-500">
                    Caricamento razze FCI...
                  </div>
                )}

                {!breedsLoading && breedLoadError && (
                  <div className="px-4 py-3 text-sm text-rose-600">
                    {breedLoadError}
                  </div>
                )}

                {!breedsLoading && !breedLoadError && normalizedBreed.length < 2 && (
                  <div className="px-4 py-3 text-sm text-stone-500">
                    Scrivi almeno 2 lettere per cercare una razza.
                  </div>
                )}

                {!breedsLoading &&
                  !breedLoadError &&
                  normalizedBreed.length >= 2 &&
                  breedSuggestions.length === 0 && (
                    <div className="px-4 py-3 text-sm text-stone-500">
                      Nessuna razza FCI trovata.
                    </div>
                  )}

                {!breedsLoading && !breedLoadError && normalizedBreed.length >= 2 &&
                  breedSuggestions.map((breed) => (
                  <button
                    key={breed.slug}
                    type="button"
                    onClick={() => {
                      onChange({
                        ...dog,
                        breed: breed.name,
                        breed_slug: breed.slug,
                        fci_group: breed.fciGroup,
                      });
                      setBreedMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b border-stone-100 last:border-0"
                  >
                    <span className="block font-semibold text-stone-900">
                      {breed.name}
                    </span>
                    <span className="block text-xs text-stone-500 mt-0.5">
                      Gruppo FCI {breed.fciGroup} · {breed.fciGroupName}
                    </span>
                  </button>
                ))}

                <div className="border-t border-stone-100" />

                <button
                  type="button"
                  onClick={() => {
                    onChange({
                      ...dog,
                      breed: 'Meticcio / altra razza',
                      breed_slug: null,
                      fci_group: null,
                    });
                    setBreedMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-3 hover:bg-stone-50"
                >
                  <span className="block font-semibold text-stone-800">
                    Meticcio / altra razza
                  </span>
                  <span className="block text-xs text-stone-500">
                    Nessun gruppo FCI
                  </span>
                </button>
              </div>
            )}

            {selectedBreed && (
              <div className="mt-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
                <p className="text-sm font-semibold text-emerald-800">
                  Gruppo FCI {selectedBreed.fciGroup}
                </p>
                <p className="text-xs text-stone-600 mt-0.5">
                  {selectedBreed.fciGroupName}
                </p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Data di nascita"
              type="date"
              value={dog.birth_date || ''}
              onChange={(v) => onChange({ ...dog, birth_date: v || null })}
            />
            <Input label="Peso (kg)" type="number" value={dog.weight ? String(dog.weight) : ''} onChange={(v) => onChange({ ...dog, weight: v === '' ? undefined : Number(v) })} />
          </div>
          <div>
            <label className="text-sm font-semibold text-stone-700">Foto</label>
            <div className="mt-1 rounded-xl border border-stone-200 bg-stone-50 p-3 flex gap-4 items-center">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-stone-200 shrink-0">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt={`Anteprima ${dog.name || 'cane'}`}
                    className="w-full h-full object-cover"
                  />
                ) : !removePhoto && dog.photo_url ? (
                  <DogPhoto
                    silhouette photoPath={dog.photo_url}
                    alt={dog.name || 'Cane'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-stone-500 text-center px-2">
                    Nessuna foto
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="flex gap-2 flex-wrap">
                  <label className="inline-flex cursor-pointer px-3 py-2 border border-stone-300 rounded-lg text-sm font-semibold focus-within:ring-2 focus-within:ring-emerald-600">
                    {previewUrl || (!removePhoto && dog.photo_url) ? 'Cambia foto' : 'Scegli foto'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      aria-label="Foto del cane"
                      disabled={saving}
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0] || null;
                        e.currentTarget.value = '';
                        void choosePhoto(file);
                      }}
                    />
                  </label>

                  {(previewUrl || (!removePhoto && dog.photo_url)) && (
                    <button
                      type="button"
                      onClick={clearPhoto}
                      disabled={saving}
                      className="px-3 py-2 border border-stone-300 text-stone-700 rounded-lg text-sm font-semibold hover:bg-white"
                    >
                      Rimuovi foto
                    </button>
                  )}
                </div>

                <p className="text-xs text-stone-500 mt-2">
                  Immagine privata. JPG, PNG o WebP fino a 8 MB; copia ottimizzata fino a 512 × 512 pixel e 160 KB. L’originale non viene caricato.
                </p>

                {photoPreparing && <p role="status" className="text-xs text-stone-600 mt-2">Preparazione della foto…</p>}
                {photoError && <p role="alert" className="text-xs text-rose-700 mt-2">{photoError}</p>}
                {photoFile && !photoPreparing && <p className="text-xs text-stone-600 mt-2">Copia pronta: {Math.ceil(photoFile.size / 1024)} KB. Questa è l’immagine che verrà salvata.</p>}
                {removePhoto && !previewUrl && (
                  <p className="text-xs text-rose-600 mt-1">
                    La foto attuale verrà rimossa al salvataggio.
                  </p>
                )}
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" checked={dog.vaccinated || false} onChange={(e) => onChange({ ...dog, vaccinated: e.target.checked })} /> Vaccinato
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" checked={dog.aggressive || false} onChange={(e) => onChange({ ...dog, aggressive: e.target.checked })} /> Può essere reattivo con altri cani
          </label>
          <div>
            <label htmlFor="dog-medical-notes" className="text-sm font-semibold text-stone-700">Note sulla salute</label>
            <textarea id="dog-medical-notes"
              value={dog.medical_notes || ''}
              onChange={(e) => onChange({ ...dog, medical_notes: e.target.value })}
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button type="button" disabled={saving} onClick={onClose} className="flex-1 py-2.5 border border-stone-300 rounded-lg font-semibold">Annulla</button>
          <button
            type="submit"
            disabled={saving || photoPreparing}
            className="flex-1 py-2.5 bg-emerald-800 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvataggio…' : 'Salva'}
          </button>
        </div>
      </form>
    </dialog>
  );
}

function Input({ label, value, onChange, type = 'text', required = false }: { required?: boolean; label: string; value: string; onChange: (v: string) => void; type?: string }) {
  const id=useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-stone-700">{label}</label>
      <input
        id={id} type={type} required={required} min={type === 'number' ? 0 : undefined} step={type === 'number' ? 'any' : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:border-emerald-500 focus:outline-none"
      />
    </div>
  );
}
