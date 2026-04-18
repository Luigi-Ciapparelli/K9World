import { useEffect, useState } from 'react';
import { Plus, Award, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { ProLayout } from './ProLayout';

export function ProMemberships() {
  const { user } = useAuth();
  const [tiers, setTiers] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('membership_tiers').select('*').eq('professional_id', user.id).order('monthly_price');
    setTiers(data || []);
  };
  useEffect(() => { load(); }, [user]);

  const save = async () => {
    if (!user || !editing) return;
    const p = { ...editing, professional_id: user.id };
    if (editing.id) await supabase.from('membership_tiers').update(p).eq('id', editing.id);
    else await supabase.from('membership_tiers').insert(p);
    setEditing(null); load();
  };

  return (
    <ProLayout active="memberships">
      <div className="p-8 max-w-5xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 mb-1">Memberships</h1>
            <p className="text-stone-600">Multi-tier loyalty programs that drive retention.</p>
          </div>
          <button onClick={() => setEditing({ name: '', monthly_price: 0, discount_percent: 0, threshold_bookings: 0, threshold_spend: 0, perks: '' })} className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> New tier</button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tiers.length === 0 && <div className="col-span-full bg-white border border-stone-200 rounded-2xl p-10 text-center"><Award className="w-10 h-10 mx-auto text-stone-400 mb-3" /><p className="text-stone-600">Create your first tier to start rewarding loyal clients.</p></div>}
          {tiers.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-sm transition">
              <div className="text-xs font-semibold text-emerald-700 uppercase">{t.name}</div>
              <div className="text-3xl font-bold mt-1">${t.monthly_price}<span className="text-sm text-stone-500 font-normal">/mo</span></div>
              <div className="text-sm text-stone-600 mt-2">{t.discount_percent}% off all services</div>
              <div className="text-xs text-stone-500 mt-1">Auto-assign at {t.threshold_bookings}+ bookings</div>
              <p className="text-sm text-stone-700 mt-3 whitespace-pre-wrap">{t.perks}</p>
              <button onClick={() => setEditing(t)} className="mt-4 text-sm text-emerald-700 font-semibold">Edit</button>
            </div>
          ))}
        </div>
      </div>
      {editing && <TierModal tier={editing} onChange={setEditing} onSave={save} onClose={() => setEditing(null)} />}
    </ProLayout>
  );
}

function TierModal({ tier, onChange, onSave, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">{tier.id ? 'Edit' : 'New'} tier</h2><button onClick={onClose}><X className="w-5 h-5" /></button></div>
        <div className="space-y-3">
          <Field label="Tier name" value={tier.name} onChange={(v) => onChange({ ...tier, name: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly price ($)" type="number" value={String(tier.monthly_price)} onChange={(v) => onChange({ ...tier, monthly_price: Number(v) })} />
            <Field label="Discount (%)" type="number" value={String(tier.discount_percent)} onChange={(v) => onChange({ ...tier, discount_percent: Number(v) })} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Auto-assign: bookings" type="number" value={String(tier.threshold_bookings)} onChange={(v) => onChange({ ...tier, threshold_bookings: Number(v) })} />
            <Field label="Or spend ($)" type="number" value={String(tier.threshold_spend)} onChange={(v) => onChange({ ...tier, threshold_spend: Number(v) })} />
          </div>
          <div>
            <label className="text-sm font-semibold text-stone-700">Perks</label>
            <textarea value={tier.perks} onChange={(e) => onChange({ ...tier, perks: e.target.value })} rows={3} className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm" />
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-stone-300 rounded-lg font-semibold">Cancel</button>
          <button onClick={onSave} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold">Save</button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="text-sm font-semibold text-stone-700">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm" />
    </div>
  );
}
