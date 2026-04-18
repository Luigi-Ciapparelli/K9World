import { useEffect, useState } from 'react';
import { Plus, Ticket, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { ProLayout } from './ProLayout';

export function ProPasses() {
  const { user } = useAuth();
  const [passes, setPasses] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('passes').select('*').eq('professional_id', user.id);
    setPasses(data || []);
  };
  useEffect(() => { load(); }, [user]);

  const save = async () => {
    if (!user || !editing) return;
    const p = { ...editing, professional_id: user.id };
    if (editing.id) await supabase.from('passes').update(p).eq('id', editing.id);
    else await supabase.from('passes').insert(p);
    setEditing(null); load();
  };

  return (
    <ProLayout active="passes">
      <div className="p-8 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 mb-1">Passes & Tickets</h1>
            <p className="text-stone-600">Prepaid packs that secure revenue and drive repeat visits.</p>
          </div>
          <button onClick={() => setEditing({ name: '', total_uses: 10, price: 100, valid_days: 90, description: '' })} className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> New pass</button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {passes.length === 0 && <div className="col-span-full bg-white border border-stone-200 rounded-2xl p-10 text-center"><Ticket className="w-10 h-10 mx-auto text-stone-400 mb-3" /><p className="text-stone-600">No passes yet. Create your first punch card.</p></div>}
          {passes.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="text-xs font-semibold text-amber-700 uppercase">{p.total_uses} uses</div>
              <div className="text-xl font-bold mt-1">{p.name}</div>
              <div className="text-3xl font-bold mt-2">${p.price}</div>
              <div className="text-xs text-stone-500">Valid {p.valid_days} days</div>
              <p className="text-sm text-stone-700 mt-3">{p.description}</p>
              <button onClick={() => setEditing(p)} className="mt-4 text-sm text-emerald-700 font-semibold">Edit</button>
            </div>
          ))}
        </div>
      </div>
      {editing && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">{editing.id ? 'Edit' : 'New'} pass</h2><button onClick={() => setEditing(null)}><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <Input label="Name" value={editing.name} onChange={(v: string) => setEditing({ ...editing, name: v })} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Total uses" type="number" value={String(editing.total_uses)} onChange={(v: string) => setEditing({ ...editing, total_uses: Number(v) })} />
                <Input label="Price ($)" type="number" value={String(editing.price)} onChange={(v: string) => setEditing({ ...editing, price: Number(v) })} />
              </div>
              <Input label="Valid for (days)" type="number" value={String(editing.valid_days)} onChange={(v: string) => setEditing({ ...editing, valid_days: Number(v) })} />
              <div>
                <label className="text-sm font-semibold text-stone-700">Description</label>
                <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setEditing(null)} className="flex-1 py-2.5 border border-stone-300 rounded-lg font-semibold">Cancel</button>
              <button onClick={save} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold">Save</button>
            </div>
          </div>
        </div>
      )}
    </ProLayout>
  );
}

function Input({ label, value, onChange, type = 'text' }: any) {
  return <div><label className="text-sm font-semibold text-stone-700">{label}</label><input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm" /></div>;
}
