import { useEffect, useState } from 'react';
import { Save, Plus, Trash2, Mail, Phone, BadgeCheck } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { VerificationModal } from '../../components/VerificationModal';
import { ProLayout } from './ProLayout';

export function ProSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const [pro, setPro] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [rules, setRules] = useState<any>(null);
  const [name, setName] = useState(profile?.full_name || '');
  const [verifying, setVerifying] = useState<'email' | 'phone' | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [p, s, r] = await Promise.all([
        supabase.from('professionals').select('*').eq('id', user.id).maybeSingle(),
        supabase.from('services').select('*').eq('professional_id', user.id),
        supabase.from('booking_rules').select('*').eq('professional_id', user.id).maybeSingle(),
      ]);
      setPro(p.data || { id: user.id, professional_type: 'walker', bio: '', zone_text: '', starting_price: 0, coverage_radius_km: 10 });
      setServices(s.data || []);
      setRules(r.data || { min_lead_hours: 4, cancellation_hours: 24, min_duration_minutes: 30, max_duration_minutes: 480, buffer_minutes: 15 });
    })();
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
    await supabase.from('professionals').upsert({ ...pro, id: user.id });
    if (rules) await supabase.from('booking_rules').upsert({ ...rules, professional_id: user.id });
    await refreshProfile();
    alert('Saved');
  };

  const addService = async () => {
    if (!user) return;
    await supabase.from('services').insert({ professional_id: user.id, name: 'New service', price: 25, duration_minutes: 60, duration_kind: 'hourly', service_type: pro?.professional_type || 'walking' });
    const { data } = await supabase.from('services').select('*').eq('professional_id', user.id);
    setServices(data || []);
  };
  const updateService = async (id: string, patch: any) => {
    await supabase.from('services').update(patch).eq('id', id);
    setServices((ss) => ss.map((s) => s.id === id ? { ...s, ...patch } : s));
  };
  const removeService = async (id: string) => {
    await supabase.from('services').delete().eq('id', id);
    setServices((ss) => ss.filter((s) => s.id !== id));
  };

  if (!pro || !rules) return <ProLayout active="settings"><div className="p-8">Loading...</div></ProLayout>;

  return (
    <ProLayout active="settings">
      <div className="p-8 max-w-4xl">
        <h1 className="text-3xl font-bold text-stone-900 mb-6">Settings</h1>

        <Section title="Account verification">
          <VerifyLine
            icon={<Mail className="w-4 h-4" />}
            label="Email"
            value={profile?.email || ''}
            verified={profile?.email_verified || false}
            onVerify={() => setVerifying('email')}
          />
          <VerifyLine
            icon={<Phone className="w-4 h-4" />}
            label="Phone"
            value={profile?.phone || ''}
            verified={profile?.phone_verified || false}
            onVerify={() => setVerifying('phone')}
          />
        </Section>

        <Section title="Profile">
          <Field label="Full name" value={name} onChange={setName} />
          <Field label="Zone / area" value={pro.zone_text} onChange={(v) => setPro({ ...pro, zone_text: v })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starting price ($)" type="number" value={String(pro.starting_price)} onChange={(v) => setPro({ ...pro, starting_price: Number(v) })} />
            <Field label="Coverage radius (km)" type="number" value={String(pro.coverage_radius_km)} onChange={(v) => setPro({ ...pro, coverage_radius_km: Number(v) })} />
          </div>
          <div>
            <label className="text-sm font-semibold text-stone-700">Bio</label>
            <textarea value={pro.bio} onChange={(e) => setPro({ ...pro, bio: e.target.value })} rows={4} className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm" />
          </div>
        </Section>

        <Section title="Services">
          <div className="space-y-3">
            {services.map((s) => (
              <div key={s.id} className="grid grid-cols-12 gap-2 items-center">
                <input value={s.name} onChange={(e) => updateService(s.id, { name: e.target.value })} className="col-span-5 px-3 py-2 border border-stone-300 rounded-lg text-sm" />
                <input type="number" value={s.price} onChange={(e) => updateService(s.id, { price: Number(e.target.value) })} className="col-span-2 px-3 py-2 border border-stone-300 rounded-lg text-sm" />
                <input type="number" value={s.duration_minutes} onChange={(e) => updateService(s.id, { duration_minutes: Number(e.target.value) })} className="col-span-2 px-3 py-2 border border-stone-300 rounded-lg text-sm" />
                <select value={s.duration_kind} onChange={(e) => updateService(s.id, { duration_kind: e.target.value })} className="col-span-2 px-3 py-2 border border-stone-300 rounded-lg text-sm">
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="variable">Variable</option>
                </select>
                <button onClick={() => removeService(s.id)} className="col-span-1 text-stone-500 hover:text-rose-600"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            <button onClick={addService} className="text-sm text-emerald-700 font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> Add service</button>
          </div>
        </Section>

        <Section title="Booking rules">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min lead time (hours)" type="number" value={String(rules.min_lead_hours)} onChange={(v) => setRules({ ...rules, min_lead_hours: Number(v) })} />
            <Field label="Cancellation window (hours)" type="number" value={String(rules.cancellation_hours)} onChange={(v) => setRules({ ...rules, cancellation_hours: Number(v) })} />
            <Field label="Min duration (min)" type="number" value={String(rules.min_duration_minutes)} onChange={(v) => setRules({ ...rules, min_duration_minutes: Number(v) })} />
            <Field label="Max duration (min)" type="number" value={String(rules.max_duration_minutes)} onChange={(v) => setRules({ ...rules, max_duration_minutes: Number(v) })} />
            <Field label="Buffer between bookings (min)" type="number" value={String(rules.buffer_minutes)} onChange={(v) => setRules({ ...rules, buffer_minutes: Number(v) })} />
          </div>
        </Section>

        <button onClick={saveProfile} className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold flex items-center gap-2"><Save className="w-4 h-4" /> Save settings</button>
      </div>
      {verifying && (
        <VerificationModal
          type={verifying}
          target={verifying === 'email' ? profile?.email || '' : profile?.phone || ''}
          onClose={() => setVerifying(null)}
          onVerified={() => setVerifying(null)}
        />
      )}
    </ProLayout>
  );
}

function VerifyLine({ icon, label, value, verified, onVerify }: { icon: React.ReactNode; label: string; value: string; verified: boolean; onVerify: () => void }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3 text-sm">
        <div className="text-stone-500">{icon}</div>
        <div>
          <div className="font-semibold text-stone-900">{label}</div>
          <div className="text-xs text-stone-500">{value || 'Not set'}</div>
        </div>
      </div>
      {verified ? (
        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1 font-semibold">
          <BadgeCheck className="w-3 h-3" /> Verified
        </span>
      ) : (
        <button
          onClick={onVerify}
          disabled={!value}
          className="text-xs bg-amber-500 text-white hover:bg-amber-600 px-3 py-1 rounded-full font-semibold disabled:opacity-50"
        >
          Verify now
        </button>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-5">
      <h2 className="text-lg font-bold text-stone-900 mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
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
