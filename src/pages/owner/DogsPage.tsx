import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useRouter } from '../../lib/RouterContext';
import type { Dog } from '../../lib/types';
import { loadFciBreeds, normalizeBreedSearch, type FciBreed } from '../../lib/fciBreeds';
import { DogPhoto } from '../../components/DogPhoto';
import { deleteDogPhoto, uploadDogPhoto, validateDogPhotoFile } from '../../lib/dogPhotos';

export function DogsPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [editing, setEditing] = useState<Partial<Dog> | null>(null);

  const load = async () => {
    if (!user) return;
    const { data, error } = await supabase.from('dogs').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });

    if (error) {
      console.error('Dogs load error:', error);
      alert(error.message);
      return;
    }

    setDogs((data as Dog[]) || []);
  };

  useEffect(() => { load(); }, [user]);

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
        alert(error.message);
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
        alert(error?.message || 'Impossibile creare il profilo del cane');
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
    if (!confirm('Remove this dog?')) return;

    const { error } = await supabase
      .from('dogs')
      .delete()
      .eq('id', dog.id)
      .eq('owner_id', user?.id);

    if (error) {
      console.error('Dog remove error:', error);
      alert(error.message);
      return;
    }

    try {
      await deleteDogPhoto(dog.photo_url);
    } catch (cleanupError) {
      console.warn('Dog photo cleanup after delete failed:', cleanupError);
    }

    load();
  };

  return (
    <div className="bg-stone-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Your dogs</h1>
            <p className="text-stone-600">Keep your dogs' info up to date so pros can take better care.</p>
          </div>
          <button onClick={() => setEditing({})} className="px-5 py-2.5 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add dog
          </button>
        </div>

        {dogs.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center text-stone-600">
            No dogs yet. Add your first dog to start booking.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {dogs.map((d) => (
              <div
                key={d.id}
                onClick={() => navigate(`/owner/dogs/${d.id}`)}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden cursor-pointer hover:shadow-md transition"
              >
                <DogPhoto
                  photoPath={d.photo_url}
                  className="w-full h-40 object-cover"
                  alt={d.name}
                />
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">{d.name}</h3>
                      <p className="text-sm text-stone-500">{d.breed}</p>

                      {d.fci_group && (
                        <span className="inline-flex mt-2 text-xs font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                          Gruppo FCI {d.fci_group}
                        </span>
                      )}

                      {d.fci_group && (
                        <button
                          type="button"
                          onClick={() => navigate(`/gruppi-fci/${d.fci_group}`)}
                          className="mt-2 text-xs text-emerald-700 font-semibold hover:text-emerald-800"
                        >
                          Scopri il Gruppo FCI {d.fci_group} →
                        </button>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={(e) => { e.stopPropagation(); setEditing(d); }} className="p-1.5 text-stone-500 hover:text-emerald-700"><Pencil className="w-4 h-4" /></button>
                      <button onClick={(e) => { e.stopPropagation(); remove(d); }} className="p-1.5 text-stone-500 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-3 text-sm text-stone-700">
                    <span>{formatDogAge(d.birth_date, d.age)}</span>
                    <span className="text-stone-300">\u2022</span>
                    <span>{d.weight} kg</span>
                  </div>
                  <div className="flex gap-2 mt-3 flex-wrap">
                    {d.vaccinated && <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">Vaccinated</span>}
                    {d.aggressive && <span className="text-xs bg-rose-50 text-rose-700 px-2 py-1 rounded-full">Reactive</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editing && <DogModal dog={editing} onChange={setEditing} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}


function formatDogAge(birthDate: string | null | undefined, fallbackAge: number) {
  if (!birthDate) {
    return fallbackAge > 0
      ? `${fallbackAge} ${fallbackAge === 1 ? 'anno' : 'anni'}`
      : 'Età non indicata';
  }

  const [year, month, day] = birthDate.split('-').map(Number);
  const today = new Date();

  let totalMonths =
    (today.getFullYear() - year) * 12 +
    (today.getMonth() + 1 - month);

  if (today.getDate() < day) totalMonths -= 1;
  if (totalMonths < 0) return 'Data non valida';

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) {
    return `${months} ${months === 1 ? 'mese' : 'mesi'}`;
  }

  if (months === 0) {
    return `${years} ${years === 1 ? 'anno' : 'anni'}`;
  }

  return `${years} ${years === 1 ? 'anno' : 'anni'} e ${months} ${
    months === 1 ? 'mese' : 'mesi'
  }`;
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
  const [breeds, setBreeds] = useState<FciBreed[]>([]);
  const [breedMenuOpen, setBreedMenuOpen] = useState(false);
  const [breedsLoading, setBreedsLoading] = useState(true);
  const [breedLoadError, setBreedLoadError] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const choosePhoto = (file: File | null) => {
    if (!file) return;

    try {
      validateDogPhotoFile(file);
      setPhotoFile(file);
      setRemovePhoto(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Foto non valida');
    }
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setRemovePhoto(Boolean(dog.photo_url));
  };

  const handleSave = async () => {
    if (saving) return;

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
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-stone-900">{dog.id ? 'Edit dog' : 'Add a dog'}</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-900"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <Input label="Name" value={dog.name || ''} onChange={(v) => onChange({ ...dog, name: v })} />
          <div className="relative">
            <label className="text-sm font-semibold text-stone-700">Razza</label>
            <input
              type="text"
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
            <Input label="Weight (kg)" type="number" value={String(dog.weight ?? '')} onChange={(v) => onChange({ ...dog, weight: Number(v) })} />
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
                    photoPath={dog.photo_url}
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
                  <label className="inline-flex cursor-pointer px-3 py-2 bg-stone-900 text-white rounded-lg text-sm font-semibold hover:bg-stone-800">
                    {previewUrl || (!removePhoto && dog.photo_url) ? 'Cambia foto' : 'Scegli foto'}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0] || null;
                        e.currentTarget.value = '';
                        choosePhoto(file);
                      }}
                    />
                  </label>

                  {(previewUrl || (!removePhoto && dog.photo_url)) && (
                    <button
                      type="button"
                      onClick={clearPhoto}
                      className="px-3 py-2 border border-stone-300 text-stone-700 rounded-lg text-sm font-semibold hover:bg-white"
                    >
                      Rimuovi foto
                    </button>
                  )}
                </div>

                <p className="text-xs text-stone-500 mt-2">
                  Immagine privata. Massimo 8 MB.
                </p>

                {removePhoto && !previewUrl && (
                  <p className="text-xs text-rose-600 mt-1">
                    La foto attuale verrà rimossa al salvataggio.
                  </p>
                )}
              </div>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" checked={dog.vaccinated || false} onChange={(e) => onChange({ ...dog, vaccinated: e.target.checked })} /> Vaccinated
          </label>
          <label className="flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" checked={dog.aggressive || false} onChange={(e) => onChange({ ...dog, aggressive: e.target.checked })} /> Can be reactive with other dogs
          </label>
          <div>
            <label className="text-sm font-semibold text-stone-700">Medical notes</label>
            <textarea
              value={dog.medical_notes || ''}
              onChange={(e) => onChange({ ...dog, medical_notes: e.target.value })}
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 border border-stone-300 rounded-lg font-semibold">Cancel</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Salvataggio...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-sm font-semibold text-stone-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:border-emerald-500 focus:outline-none"
      />
    </div>
  );
}
