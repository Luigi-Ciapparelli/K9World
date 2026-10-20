import { CredentialReviewPanel } from '../../components/admin/CredentialReviewPanel';
import { WorkingDogIdentityReview } from '../../components/admin/WorkingDogIdentityReview';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ProfessionalApprovalDialog } from '../../components/admin/ProfessionalApprovalDialog';
import { approvalLabels } from '../../lib/professionalApproval';
import type { ApprovalStatus, ProfessionalApproval } from '../../lib/professionalApproval';
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

type ProfessionistaRow = {
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
  const [professionals, setProfessionistas] = useState<ProfessionistaRow[]>([]);
  const [dogs, setDogs] = useState<DogRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [error, setError] = useState('');
  const [dataLoading, setDataLoading] = useState(false);
  const [decision, setDecision] = useState<{ id: string; name: string; status: ApprovalStatus } | null>(null);
  const observeApproval = useCallback((record: ProfessionalApproval) => {
    setProfessionistas(rows => rows.map(row => row.id === record.id ? { ...row, ...record } : row));
  }, []);

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
    setProfessionistas((professionalsRes.data || []) as ProfessionistaRow[]);
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

  if (loading) {
    return <div className="p-8 text-stone-600">Caricamento…</div>;
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-stone-50 p-8">
        <div className="max-w-2xl mx-auto bg-white border border-stone-200 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-stone-900">Accesso riservato</h1>
          <p className="text-stone-600 mt-2">
            Questa pagina è riservata agli amministratori.
          </p>
          <p className="text-sm text-stone-500 mt-4">
            Ruolo attuale: {profile?.role || 'profilo non disponibile'}
          </p>
        </div>
      </div>
    );
  }

  const pendingCount = professionals.filter((p) => p.approval_status === 'pending').length;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col items-start sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold text-stone-900">Amministrazione</h1>
            <p className="text-stone-600 mt-1">
              Controlla i profili professionali e consulta utenti, cani e prenotazioni.
            </p>
          </div>

          <button
            type="button"
            onClick={load}
            disabled={dataLoading || decision !== null}
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
          >
            Aggiorna dati
          </button>
        </div>

        <WorkingDogIdentityReview />
        <CredentialReviewPanel />

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4">
            {error}
          </div>
        )}

        {dataLoading && (
          <div className="mb-6 bg-white border border-stone-200 rounded-2xl p-4">
            Caricamento dei dati amministrativi…
          </div>
        )}

        <div className="grid md:grid-cols-5 gap-4 mb-8">
          <Stat title="Utenti" value={profiles.length} />
          <Stat title="Professionisti" value={professionals.length} />
          <Stat title="In attesa" value={pendingCount} />
          <Stat title="Cani" value={dogs.length} />
          <Stat title="Prenotazioni" value={bookings.length} />
        </div>

        <Section title="Approvazione professionisti">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-stone-200">
                  <th className="py-3 pr-4">Nome</th>
                  <th className="py-3 pr-4">Attività</th>
                  <th className="py-3 pr-4">Tipo</th>
                  <th className="py-3 pr-4">Zona</th>
                  <th className="py-3 pr-4">Esperienza</th>
                  <th className="py-3 pr-4">Qualifiche</th>
                  <th className="py-3 pr-4">Stato</th>
                  <th className="py-3 pr-4">Azioni</th>
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
                          <div className="text-xs text-stone-500">Partita IVA: {pro.vat_number}</div>
                        )}
                      </td>
                      <td className="py-3 pr-4">{pro.professional_type || '-'}</td>
                      <td className="py-3 pr-4">{pro.zone_text || '-'}</td>
                      <td className="py-3 pr-4">{pro.years_experience || 0} anni</td>
                      <td className="py-3 pr-4 max-w-xs">
                        {pro.qualification_summary || '-'}
                        {pro.insurance_summary && (
                          <div className="text-xs text-stone-500 mt-1">
                            Assicurazione: {pro.insurance_summary}
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusBadge status={pro.approval_status || 'pending'} />
                        {pro.admin_notes && (
                          <div className="text-xs text-stone-500 mt-1">Note: {pro.admin_notes}</div>
                        )}
                        {pro.rejection_reason && (
                          <div className="text-xs text-rose-600 mt-1">Motivo: {pro.rejection_reason}</div>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={dataLoading || decision !== null}
                            onClick={() => setDecision({ id: pro.id, name: pro.business_name || p?.full_name || pro.id, status: 'approved' })}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Approva
                          </button>
                          <button
                            type="button"
                            disabled={dataLoading || decision !== null}
                            onClick={() => setDecision({ id: pro.id, name: pro.business_name || p?.full_name || pro.id, status: 'pending' })}
                            className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-stone-50"
                          >
                            Rimetti in attesa
                          </button>
                          <button
                            type="button"
                            disabled={dataLoading || decision !== null}
                            onClick={() => setDecision({ id: pro.id, name: pro.business_name || p?.full_name || pro.id, status: 'rejected' })}
                            className="px-3 py-1.5 rounded-lg border border-rose-300 text-rose-700 hover:bg-rose-50"
                          >
                            Rifiuta
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

        <Section title="Prenotazioni recenti">
          <div className="grid gap-3">
            {bookings.map((booking) => {
              const owner = profileById.get(booking.owner_id);
              const pro = profileById.get(booking.professional_id);
              const service = booking.service_id ? serviceById.get(booking.service_id) : null;

              return (
                <div key={booking.id} className="border border-stone-200 rounded-xl p-4">
                  <div className="font-semibold text-stone-900">
                    {owner?.full_name || 'Cliente'} → {pro?.full_name || 'Professionista'}
                  </div>
                  <div className="text-sm text-stone-600 mt-1">
                    {service?.name || 'Servizio'} · stato: {booking.status} · prezzo: {booking.price || 0}
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        <Section title="Utenti">
          <div className="grid md:grid-cols-2 gap-3">
            {profiles.map((p) => (
              <div key={p.id} className="border border-stone-200 rounded-xl p-4">
                <div className="font-semibold text-stone-900">{p.full_name || 'Nome non indicato'}</div>
                <div className="text-sm text-stone-600">{p.email}</div>
                <div className="text-xs text-stone-500 mt-2">
                  ruolo: {p.role || 'non disponibile'} · email verificata: {p.email_verified == null ? 'non disponibile' : p.email_verified ? 'sì' : 'no'} · telefono verificato: {p.phone_verified == null ? 'non disponibile' : p.phone_verified ? 'sì' : 'no'}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
      {decision && <ProfessionalApprovalDialog key={decision.id} {...decision} onClose={() => setDecision(null)} onObserved={observeApproval} />}
    </div>
  );
}

function StatusBadge({ status }: { status: 'pending' | 'approved' | 'rejected' }) {
  if (status === 'approved') {
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700">{approvalLabels[status]}</span>;
  }

  if (status === 'rejected') {
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700">{approvalLabels[status]}</span>;
  }

  return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">{approvalLabels[status]}</span>;
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
