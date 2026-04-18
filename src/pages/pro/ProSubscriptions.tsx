import { useEffect, useState } from 'react';
import { Plus, RefreshCcw, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { ProLayout } from './ProLayout';

export function ProSubscriptions() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('subscription_plans').select('*').eq('professional_id', user.id);
    setPlans(data || []);
  };
  useEffect(() => { load(); }, [user]);

  const save = async () => {
    if (!user || !editing) return;
    const p = { ...editing, professional_id: user.id };
    if (editing.id) await supabase.from('subscription_plans').update(p).eq('id', editing.id);
    else await supabase.from('subscription_plans').insert(p);
    setEditing(null); load();
  };

  return (
    <ProLayout active="subscriptions">
      <div className="p-8 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 mb-1">Recurring Subscriptions</h1>
            <p className="text-stone-600">Stable, predictable monthly cash flow on autopilot.</p>
          </div>
          <button onClick={() => setEditing({ name: '', monthly_price: 0, interval_type: 'weekly', service_description: '', description: '' })} className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> New plan</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {plans.length === 0 && <div className="col-span-full bg-white border border-stone-200 rounded-2xl p-10 text-center"><RefreshCcw className="w-10 h-10 mx-auto text-stone-400 mb-3" /><p className="text-stone-600">No subscription plans yet.</p></div>}
          {plans.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-stone-200 p-5">
              <div className="text-xs font-semibold text-sky-700 uppercase">{p.interval_type}</div>
              <div className="text-xl font-bold mt-1">{p.name}</div>
              <div className="text-3xl font-bold mt-2">${p.monthly_price}<span className="text-sm text-stone-500 font-normal">/mo</span></div>
              <p className="text-sm text-stone-700 mt-3">{p.description}</p>
              <div className="text-xs text-stone-500 mt-2">{p.service_description}</div>
              <button onClick={() => setEditing(p)} className="mt-4 text-sm text-emerald-700 font-semibold">Edit</button>
            </div>
          ))}
        </div>
      </div>
      {editing && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">{editing.id ? 'Edit' : 'New'} plan</h2><button onClick={() => setEditing(null)}><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <Input label="Plan name" value={editing.name} onChange={(v: string) => setEditing({ ...editing, name: v })} />
              <div>
                <label className="text-sm font-semibold text-stone-700">Interval</label>
                <select value={editing.interval_type} onChange={(e) => setEditing({ ...editing, interval_type: e.target.value })} className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm">
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <Input label="Monthly price ($)" type="number" value={String(editing.monthly_price)} onChange={(v: string) => setEditing({ ...editing, monthly_price: Number(v) })} />
              <div>
                <label className="text-sm font-semibold text-stone-700">Description</label>
                <textarea value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm" />
              </div>
              <Input label="What's included" value={editing.service_description} onChange={(v: string) => setEditing({ ...editing, service_description: v })} />
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
