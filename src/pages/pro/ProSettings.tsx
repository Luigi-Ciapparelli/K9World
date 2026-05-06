import { useEffect, useState } from 'react';
import {
  Save,
  Plus,
  Trash2,
  Mail,
  Phone,
  BadgeCheck,
  ShieldCheck,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { VerificationModal } from '../../components/VerificationModal';
import { ProLayout } from './ProLayout';

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

const PROFESSIONAL_TYPES = [
  { value: 'walker', label: 'Dog walker' },
  { value: 'trainer', label: 'Trainer / Educator' },
  { value: 'boarding', label: 'Boarding' },
  { value: 'sitter', label: 'Pet sitter' },
  { value: 'groomer', label: 'Groomer' },
];

const CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  rimini: { latitude: 44.0678, longitude: 12.5695 },
  riccione: { latitude: 43.9994, longitude: 12.6561 },
  cattolica: { latitude: 43.9633, longitude: 12.7386 },
  'misano adriatico': { latitude: 43.9775, longitude: 12.6983 },
  coriano: { latitude: 43.9697, longitude: 12.6003 },
  'santarcangelo di romagna': { latitude: 44.0633, longitude: 12.4464 },
  cesena: { latitude: 44.1391, longitude: 12.2431 },
  'san marino': { latitude: 43.9424, longitude: 12.4578 },
};

function findCityCoordinates(zoneText: string) {
  const normalized = zoneText.trim().toLowerCase();

  if (!normalized) return null;

  const exact = CITY_COORDINATES[normalized];
  if (exact) return exact;

  const match = Object.entries(CITY_COORDINATES).find(([city]) =>
    normalized.includes(city)
  );

  return match ? match[1] : null;
}

export function ProSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const [pro, setPro] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [rules, setRules] = useState<any>(null);
  const [name, setName] = useState(profile?.full_name || '');
  const [verifying, setVerifying] = useState<'email' | 'phone' | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!user) return;

    setLoadingData(true);

    const [p, s, r] = await Promise.all([
      supabase.from('professionals').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('services').select('*').eq('professional_id', user.id).order('created_at', { ascending: false }),
      supabase.from('booking_rules').select('*').eq('professional_id', user.id).maybeSingle(),
    ]);

    if (p.error) {
      console.error('Professional settings load error:', p.error);
      alert(p.error.message);
    }

    if (s.error) {
      console.error('Services load error:', s.error);
      alert(s.error.message);
    }

    if (r.error) {
      console.error('Booking rules load error:', r.error);
    }

    setPro(
      p.data || {
        id: user.id,
        professional_type: 'walker',
        bio: '',
        zone_text: '',
        latitude: null,
        longitude: null,
        coverage_radius_km: 10,
        starting_price: 0,
        business_name: '',
        vat_number: '',
        website_url: '',
        instagram_url: '',
        years_experience: 0,
        qualification_summary: '',
        insurance_summary: '',
        approval_status: 'pending',
        approved: false,
      }
    );

    setServices(s.data || []);
    setRules(
      r.data || {
        min_lead_hours: 4,
        cancellation_hours: 24,
        min_duration_minutes: 30,
        max_duration_minutes: 480,
        buffer_minutes: 15,
      }
    );

    setLoadingData(false);
  };

  useEffect(() => {
    if (!user) return;
    setName(profile?.full_name || '');
    load();
  }, [user, profile?.full_name]);

  const saveProfile = async () => {
    if (!user || !pro) return;

    setSaving(true);

    const city = findCityCoordinates(pro.zone_text || '');

    const professionalPayload = {
      professional_type: pro.professional_type || 'walker',
      bio: pro.bio || '',
      zone_text: pro.zone_text || '',
      latitude: city?.latitude ?? pro.latitude ?? null,
      longitude: city?.longitude ?? pro.longitude ?? null,
      coverage_radius_km: Number(pro.coverage_radius_km) || 10,
      starting_price: Number(pro.starting_price) || 0,
      cover_photo_url: pro.cover_photo_url || null,
      business_name: pro.business_name || null,
      vat_number: pro.vat_number || null,
      website_url: pro.website_url || null,
      instagram_url: pro.instagram_url || null,
      years_experience: Number(pro.years_experience) || 0,
      qualification_summary: pro.qualification_summary || null,
      insurance_summary: pro.insurance_summary || null,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: name })
      .eq('id', user.id);

    if (profileError) {
      setSaving(false);
      alert(profileError.message);
      return;
    }

    const { data: existingProfessional, error: existingProfessionalError } = await supabase
      .from('professionals')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfessionalError) {
      setSaving(false);
      alert(existingProfessionalError.message);
      return;
    }

    const professionalResult = existingProfessional
      ? await supabase
          .from('professionals')
          .update(professionalPayload)
          .eq('id', user.id)
      : await supabase
          .from('professionals')
          .insert({
            id: user.id,
            ...professionalPayload,
          });

    const professionalError = professionalResult.error;

    if (professionalError) {
      setSaving(false);
      alert(professionalError.message);
      return;
    }

    if (rules) {
      const { error: rulesError } = await supabase
        .from('booking_rules')
        .upsert({ ...rules, professional_id: user.id });

      if (rulesError) {
        setSaving(false);
        alert(rulesError.message);
        return;
      }
    }

    await refreshProfile();
    await load();

    setSaving(false);
    alert('Profile saved. Admin approval status is unchanged.');
  };

  const addService = async () => {
    if (!user) return;

    const { error } = await supabase.from('services').insert({
      professional_id: user.id,
      name: 'New service',
      price: 25,
      duration_minutes: 60,
      duration_kind: 'hourly',
      service_type: pro?.professional_type || 'walker',
      active: true,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const { data, error: loadError } = await supabase
      .from('services')
      .select('*')
      .eq('professional_id', user.id)
      .order('created_at', { ascending: false });

    if (loadError) {
      alert(loadError.message);
      return;
    }

    setServices(data || []);
  };

  const updateService = async (id: string, patch: any) => {
    const { error } = await supabase.from('services').update(patch).eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    setServices((ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const removeService = async (id: string) => {
    if (!confirm('Remove this service?')) return;

    const { error } = await supabase.from('services').delete().eq('id', id);

    if (error) {
      alert(error.message);
      return;
    }

    setServices((ss) => ss.filter((s) => s.id !== id));
  };

  if (loadingData || !pro || !rules) {
    return (
      <ProLayout active="settings">
        <div className="p-8">Loading...</div>
      </ProLayout>
    );
  }

  return (
    <ProLayout active="settings">
      <div className="p-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-stone-900">Professional profile</h1>
          <p className="text-stone-600 mt-1">
            Complete your profile so admins can verify you and clients can trust your services.
          </p>
        </div>

        <ApprovalBox
          status={(pro.approval_status || 'pending') as ApprovalStatus}
          approved={!!pro.approved}
          adminNotes={pro.admin_notes}
          rejectionReason={pro.rejection_reason}
        />

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

        <Section title="Business details">
          <Field label="Full name" value={name} onChange={setName} />

          <div className="grid md:grid-cols-2 gap-3">
            <Field
              label="Business / professional name"
              value={pro.business_name || ''}
              onChange={(v) => setPro({ ...pro, business_name: v })}
            />
            <Field
              label="Partita IVA / VAT number"
              value={pro.vat_number || ''}
              onChange={(v) => setPro({ ...pro, vat_number: v })}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <Field
              label="Website URL"
              value={pro.website_url || ''}
              onChange={(v) => setPro({ ...pro, website_url: v })}
            />
            <Field
              label="Instagram URL"
              value={pro.instagram_url || ''}
              onChange={(v) => setPro({ ...pro, instagram_url: v })}
            />
          </div>
        </Section>

        <Section title="Public profile">
          <div>
            <label className="text-sm font-semibold text-stone-700">Professional type</label>
            <select
              value={pro.professional_type || 'walker'}
              onChange={(e) => setPro({ ...pro, professional_type: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
            >
              {PROFESSIONAL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <Field
              label="Zone / area, e.g. Rimini"
              value={pro.zone_text || ''}
              onChange={(v) => setPro({ ...pro, zone_text: v })}
            />
            <Field
              label="Coverage radius (km)"
              type="number"
              value={String(pro.coverage_radius_km ?? 10)}
              onChange={(v) => setPro({ ...pro, coverage_radius_km: Number(v) })}
            />
            <Field
              label="Starting price (€)"
              type="number"
              value={String(pro.starting_price ?? 0)}
              onChange={(v) => setPro({ ...pro, starting_price: Number(v) })}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-stone-700">Bio</label>
            <textarea
              value={pro.bio || ''}
              onChange={(e) => setPro({ ...pro, bio: e.target.value })}
              rows={4}
              className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
              placeholder="Tell clients who you are, your experience, and what kind of dogs you work with."
            />
          </div>
        </Section>

        <Section title="Experience and verification details">
          <Field
            label="Years of experience"
            type="number"
            value={String(pro.years_experience ?? 0)}
            onChange={(v) => setPro({ ...pro, years_experience: Number(v) })}
          />

          <div>
            <label className="text-sm font-semibold text-stone-700">Qualifications / training</label>
            <textarea
              value={pro.qualification_summary || ''}
              onChange={(e) => setPro({ ...pro, qualification_summary: e.target.value })}
              rows={4}
              className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
              placeholder="Example: ENCI trainer, APNEC educator, CSEN course, obedience experience, first aid, etc."
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-stone-700">Insurance / documents summary</label>
            <textarea
              value={pro.insurance_summary || ''}
              onChange={(e) => setPro({ ...pro, insurance_summary: e.target.value })}
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
              placeholder="Example: professional insurance, municipal authorization, health authorization, documents available on request."
            />
          </div>
        </Section>

        <Section title="Services">
          <div className="space-y-3">
            {services.map((s) => (
              <div key={s.id} className="grid grid-cols-12 gap-2 items-center">
                <input
                  value={s.name || ''}
                  onChange={(e) => updateService(s.id, { name: e.target.value })}
                  className="col-span-4 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  placeholder="Service name"
                />

                <select
                  value={s.service_type || pro.professional_type || 'walker'}
                  onChange={(e) => updateService(s.id, { service_type: e.target.value })}
                  className="col-span-2 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                >
                  {PROFESSIONAL_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  value={s.price ?? 0}
                  onChange={(e) => updateService(s.id, { price: Number(e.target.value) })}
                  className="col-span-2 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  placeholder="Price"
                />

                <input
                  type="number"
                  value={s.duration_minutes ?? 60}
                  onChange={(e) => updateService(s.id, { duration_minutes: Number(e.target.value) })}
                  className="col-span-2 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                  placeholder="Minutes"
                />

                <select
                  value={s.duration_kind || 'hourly'}
                  onChange={(e) => updateService(s.id, { duration_kind: e.target.value })}
                  className="col-span-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                >
                  <option value="hourly">Hourly</option>
                  <option value="daily">Daily</option>
                  <option value="variable">Variable</option>
                </select>

                <button
                  type="button"
                  onClick={() => removeService(s.id)}
                  className="col-span-1 text-stone-500 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            <button
              type="button"
              onClick={addService}
              className="text-sm text-emerald-700 font-semibold flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add service
            </button>
          </div>
        </Section>

        <Section title="Booking rules">
          <div className="grid md:grid-cols-2 gap-3">
            <Field
              label="Min lead time (hours)"
              type="number"
              value={String(rules.min_lead_hours)}
              onChange={(v) => setRules({ ...rules, min_lead_hours: Number(v) })}
            />
            <Field
              label="Cancellation window (hours)"
              type="number"
              value={String(rules.cancellation_hours)}
              onChange={(v) => setRules({ ...rules, cancellation_hours: Number(v) })}
            />
            <Field
              label="Min duration (min)"
              type="number"
              value={String(rules.min_duration_minutes)}
              onChange={(v) => setRules({ ...rules, min_duration_minutes: Number(v) })}
            />
            <Field
              label="Max duration (min)"
              type="number"
              value={String(rules.max_duration_minutes)}
              onChange={(v) => setRules({ ...rules, max_duration_minutes: Number(v) })}
            />
            <Field
              label="Buffer between bookings (min)"
              type="number"
              value={String(rules.buffer_minutes)}
              onChange={(v) => setRules({ ...rules, buffer_minutes: Number(v) })}
            />
          </div>
        </Section>

        <button
          type="button"
          onClick={saveProfile}
          disabled={saving}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save professional profile'}
        </button>
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

function ApprovalBox({
  status,
  approved,
  adminNotes,
  rejectionReason,
}: {
  status: ApprovalStatus;
  approved: boolean;
  adminNotes?: string | null;
  rejectionReason?: string | null;
}) {
  if (status === 'approved' && approved) {
    return (
      <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 mt-0.5" />
        <div>
          <div className="font-bold text-emerald-900">Approved</div>
          <p className="text-sm text-emerald-800 mt-1">
            Your profile is visible in public search results.
          </p>
          {adminNotes && <p className="text-xs text-emerald-700 mt-2">Admin note: {adminNotes}</p>}
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="mb-5 bg-rose-50 border border-rose-200 rounded-2xl p-5 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-700 mt-0.5" />
        <div>
          <div className="font-bold text-rose-900">Rejected</div>
          <p className="text-sm text-rose-800 mt-1">
            Your profile is not visible. Update your details and contact the admin for review.
          </p>
          {rejectionReason && <p className="text-xs text-rose-700 mt-2">Reason: {rejectionReason}</p>}
          {adminNotes && <p className="text-xs text-rose-700 mt-1">Admin note: {adminNotes}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
      <Clock className="w-5 h-5 text-amber-700 mt-0.5" />
      <div>
        <div className="font-bold text-amber-900">Pending admin approval</div>
        <p className="text-sm text-amber-800 mt-1">
          Complete your profile. An admin must approve you before clients can find you in search.
        </p>
        {adminNotes && <p className="text-xs text-amber-700 mt-2">Admin note: {adminNotes}</p>}
      </div>
    </div>
  );
}

function VerifyLine({
  icon,
  label,
  value,
  verified,
  onVerify,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  verified: boolean;
  onVerify: () => void;
}) {
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
          type="button"
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

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-stone-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
      />
    </div>
  );
}
