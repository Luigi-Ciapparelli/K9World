import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import type { Dog } from '../../lib/types';

export function DogsPage() {
  const { user } = useAuth();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [editing, setEditing] = useState<Partial<Dog> | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('dogs').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
    setDogs((data as Dog[]) || []);
  };

  useEffect(() => { load(); }, [user]);

  const save = async () => {
    if (!editing || !user) return;
    const payload = {
      owner_id: user.id,
      name: editing.name || '',
      breed: editing.breed || '',
      age: Number(editing.age) || 0,
      weight: Number(editing.weight) || 0,
      photo_url: editing.photo_url || '',
      vaccinated: editing.vaccinated || false,
      aggressive: editing.aggressive || false,
      medical_notes: editing.medical_notes || '',
    };
    if (editing.id) {
      await supabase.from('dogs').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('dogs').insert(payload);
    }
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Remove this dog?')) return;
    await supabase.from('dogs').delete().eq('id', id);
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
              <div key={d.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <img src={d.photo_url || 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400'} className="w-full h-40 object-cover" alt={d.name} />
                <div className="p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-stone-900">{d.name}</h3>
                      <p className="text-sm text-stone-500">{d.breed}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setEditing(d)} className="p-1.5 text-stone-500 hover:text-emerald-700"><Pencil className="w-4 h-4" /></button>
                      <button onClick={() => remove(d.id)} className="p-1.5 text-stone-500 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-3 text-sm text-stone-700">
                    <span>{d.age} yrs</span>
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

function DogModal({ dog, onChange, onSave, onClose }: { dog: Partial<Dog>; onChange: (d: Partial<Dog>) => void; onSave: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold text-stone-900">{dog.id ? 'Edit dog' : 'Add a dog'}</h2>
          <button onClick={onClose} className="text-stone-500 hover:text-stone-900"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <Input label="Name" value={dog.name || ''} onChange={(v) => onChange({ ...dog, name: v })} />
          <Input label="Breed" value={dog.breed || ''} onChange={(v) => onChange({ ...dog, breed: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Age (yrs)" type="number" value={String(dog.age ?? '')} onChange={(v) => onChange({ ...dog, age: Number(v) })} />
            <Input label="Weight (kg)" type="number" value={String(dog.weight ?? '')} onChange={(v) => onChange({ ...dog, weight: Number(v) })} />
          </div>
          <Input label="Photo URL" value={dog.photo_url || ''} onChange={(v) => onChange({ ...dog, photo_url: v })} />
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
          <button onClick={onSave} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700">Save</button>
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
