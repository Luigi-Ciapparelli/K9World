import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  email_verified: boolean | null;
  phone_verified: boolean | null;
};

type ProfessionalRow = {
  id: string;
  professional_type: string | null;
  bio: string | null;
  zone_text: string | null;
  approved: boolean | null;
  approval_status: 'pending' | 'approved' | 'rejected' | null;
  business_name: string | null;
  vat_number: string | null;
  years_experience: number | null;
  qualification_summary: string | null;
  insurance_summary: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  starting_price: number | null;
  rating: number | null;
};

type DogRow = {
  id: string;
  owner_id: string;
  name: string;
  breed: string | null;
};

type BookingRow = {
  id: string;
  owner_id: string;
  professional_id: string;
  service_id: string | null;
  status: string;
  price: number | null;
  start_at: string | null;
  created_at: string | null;
};

type ServiceRow = {
  id: string;
  professional_id: string;
  name: string | null;
  service_type: string | null;
  price: number | null;
  active: boolean | null;
};

export function AdminDashboard() {
  const { profile, loading } = useAuth();

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalRow[]>([]);
  const [dogs, setDogs] = useState<DogRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(false);

  const profileById = useMemo(() => {
    return new Map(profiles.map((p) => [p.id, p]));
  }, [profiles]);

  const serviceById = useMemo(() => {
    return new Map(services.map((s) => [s.id, s]));
  }, [services]);

  const load = async () => {
    setDataLoading(true);
    setError('');

    const profilesRes = await supabase
      .from('profiles')
      .select('id, full_name, email, role, email_verified, phone_verified');

    const professionalsRes = await supabase
      .from('professionals')
      .select('id, professional_type, bio, zone_text, approved, approval_status, business_name, vat_number, years_experience, qualification_summary, insurance_summary, admin_notes, rejection_reason, starting_price, rating')
      .order('approval_status', { ascending: false });

    const dogsRes = await supabase
      .from('dogs')
      .select('id, owner_id, name, breed');

    const bookingsRes = await supabase
      .from('bookings')
      .select('id, owner_id, professional_id, service_id, status, price, start_at, created_at')
      .order('created_at', { ascending: false });

    const servicesRes = await supabase
      .from('services')
      .select('id, professional_id, name, service_type, price, active');

    const firstError =
      profilesRes.error ||
      professionalsRes.error ||
      dogsRes.error ||
      bookingsRes.error ||
      servicesRes.error;

    if (firstError) {
      setError(firstError.message);
      setDataLoading(false);
      return;
    }

    setProfiles((profilesRes.data || []) as ProfileRow[]);
    setProfessionals((professionalsRes.data || []) as ProfessionalRow[]);
    setDogs((dogsRes.data || []) as DogRow[]);
    setBookings((bookingsRes.data || []) as BookingRow[]);
    setServices((servicesRes.data || []) as ServiceRow[]);
    setDataLoading(false);
  };

  useEffect(() => {
    if (!loading && profile?.role === 'admin') {
      load();
    }
  }, [loading, profile?.role]);

  const setApproval = async (
    professionalId: string,
    approvalStatus: 'pending' | 'approved' | 'rejected'
  ) => {
    const rejectionReason =
      approvalStatus === 'rejected'
        ? window.prompt('Reason for rejection?') || 'Rejected by admin'
        : null;

    const adminNotes = window.prompt('Admin notes, optional:') || null;

    const { error: updateError } = await supabase.rpc('admin_set_professional_approval', {
      target_professional_id: professionalId,
      new_approval_status: approvalStatus,
      new_admin_notes: adminNotes,
      new_rejection_reason: rejectionReason,
    });

    if (updateError) {
      alert(updateError.message);
      return;
    }

    await load();
  };

  if (loading) {
    return <div className="p-8 text-stone-600">Loading...</div>;
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stone-50 p-8">
        <div className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-stone-900">Access denied</h1>
          <p className="text-stone-600 mt-2">
            You are logged in, but your profile role is not admin.
          </p>
          <p className="text-sm text-stone-500 mt-4">
            Current role: {profile?.role || 'no profile loaded'}
          </p>
        </div>
      </div>
    );
  }

  const pendingCount = professionals.filter((p) => p.approval_status === 'pending').length;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-900">Admin dashboard</h1>
            <p className="text-stone-600 mt-1">
              Approve professionals and monitor users, dogs and bookings.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4">
            {error}
          </div>
        )}

        {dataLoading && (
          <div className="mb-6 bg-white border border-stone-200 rounded-2xl p-4">
            Loading admin data...
          </div>
        )}

        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Stat title="Users" value={profiles.length} />
          <Stat title="Professionals" value={professionals.length} />
          <Stat title="Pending" value={pendingCount} />
          <Stat title="Dogs" value={dogs.length} />
          <Stat title="Bookings" value={bookings.length} />
        </div>

        <Section title="Professional approval">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-stone-200">
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Business</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Zone</th>
                  <th className="py-3 pr-4">Experience</th>
                  <th className="py-3 pr-4">Qualifications</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {professionals.map((pro) => {
                  const p = profileById.get(pro.id);

                  return (
                    <tr key={pro.id} className="border-b border-stone-100 align-top">
                      <td className="py-3 pr-4 font-semibold">
                        {p?.full_name || pro.id}
                        <div className="text-xs text-stone-500 font-normal">{p?.email}</div>
                      </td>
                      <td className="py-3 pr-4">
                        {pro.business_name || '-'}
                        {pro.vat_number && (
                          <div className="text-xs text-stone-500">VAT: {pro.vat_number}</div>
                        )}
                      </td>
                      <td className="py-3 pr-4">{pro.professional_type || '-'}</td>
                      <td className="py-3 pr-4">{pro.zone_text || '-'}</td>
                      <td className="py-3 pr-4">{pro.years_experience || 0} yrs</td>
                      <td className="py-3 pr-4 max-w-xs">
                        {pro.qualification_summary || '-'}
                        {pro.insurance_summary && (
                          <div className="text-xs text-stone-500 mt-1">
                            Insurance: {pro.insurance_summary}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={pro.approval_status || 'pending'} />
                        {pro.admin_notes && (
                          <div className="text-xs text-stone-500 mt-1">Note: {pro.admin_notes}</div>
                        )}
                        {pro.rejection_reason && (
                          <div className="text-xs text-rose-600 mt-1">Reason: {pro.rejection_reason}</div>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setApproval(pro.id, 'approved')}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => setApproval(pro.id, 'pending')}
                            className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50"
                          >
                            Pending
                          </button>
                          <button
                            type="button"
                            onClick={() => setApproval(pro.id, 'rejected')}
                            className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        <Section title="Recent bookings">
          <div className="grid gap-3">
            {bookings.map((booking) => {
              const owner = profileById.get(booking.owner_id);
              const pro = profileById.get(booking.professional_id);
              const service = booking.service_id ? serviceById.get(booking.service_id) : null;

              return (
                <div key={booking.id} className="border border-stone-200 rounded-xl p-4">
                  <div className="font-semibold text-stone-900">
                    {owner?.full_name || 'Client'} → {pro?.full_name || 'Professional'}
                  </div>
                  <div className="text-sm text-stone-600 mt-1">
                    {service?.name || 'Service'} · status: {booking.status} · price: {booking.price || 0}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Users">
          <div className="grid md:grid-cols-2 gap-3">
            {profiles.map((p) => (
              <div key={p.id} className="border border-stone-200 rounded-xl p-4">
                <div className="font-semibold text-stone-900">{p.full_name || 'No name'}</div>
                <div className="text-sm text-stone-600">{p.email}</div>
                <div className="text-xs text-stone-500 mt-2">
                  role: {p.role} · email verified: {String(p.email_verified)} · phone verified: {String(p.phone_verified)}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  if (status === 'approved') {
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">approved</span>;
  }

  if (status === 'rejected') {
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">rejected</span>;
  }

  return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">pending</span>;
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5">
      <div className="text-sm text-stone-500">{title}</div>
      <div className="text-3xl font-bold text-stone-900 mt-1">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-white border border-stone-200 rounded-2xl p-5 mb-6">
      <h2 className="text-xl font-bold text-stone-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}
