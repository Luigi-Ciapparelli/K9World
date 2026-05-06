import { useEffect, useState } from 'react';
import { Calendar, DollarSign, Users, TrendingUp, Bell, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useRouter } from '../../lib/RouterContext';
import { ProLayout } from './ProLayout';

export function ProDashboard() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [clients, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user) return;
    const [b, c] = await Promise.all([
      supabase.from('bookings').select('*, profiles:owner_id(full_name, avatar_url, email)').eq('professional_id', user.id).order('start_at', { ascending: true }),
      supabase.from('bookings').select('owner_id').eq('professional_id', user.id),
    ]);
    setBookings(b.data || []);
    const unique = new Set((c.data || []).map((x: any) => x.owner_id));
    setClientes([...unique]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();
  const todays = bookings.filter((b) => b.start_at >= todayStart && b.start_at < todayEnd);
  const pending = bookings.filter((b) => b.status === 'pending');
  const completed = bookings.filter((b) => b.status === 'completed');
  const revenue = completed.reduce((s, b) => s + Number(b.price), 0);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    load();
  };

  return (
    <ProLayout active="dashboard">
      <div className="p-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-stone-900 mb-1">Mission Control</h1>
        <p className="text-stone-600 mb-8">Your business at a glance.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Stat icon={<Calendar />} label="Today" value={todays.length} color="emerald" />
          <Stat icon={<Bell />} label="Pending" value={pending.length} color="amber" />
          <Stat icon={<Users />} label="Clientes" value={clients.length} color="sky" />
          <Stat icon={<DollarSign />} label="Revenue" value={`$${revenue.toFixed(0)}`} color="stone" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="text-lg font-bold text-stone-900 mb-4">Today's schedule</h2>
            {loading ? <p className="text-stone-500 text-sm">Loading...</p> :
              todays.length === 0 ? <p className="text-stone-500 text-sm">Nothing scheduled today. Enjoy your day.</p> :
              <div className="space-y-3">
                {todays.map((b) => (
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-lg bg-stone-50">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                      {new Date(b.start_at).getHours()}:{String(new Date(b.start_at).getMinutes()).padStart(2, '0')}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-stone-900 text-sm">{b.profiles?.full_name}</div>
                      <div className="text-xs text-stone-500">{b.notes || 'No notes'}</div>
                    </div>
                    <div className="text-sm font-bold">${b.price}</div>
                  </div>
                ))}
              </div>
            }
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="text-lg font-bold text-stone-900 mb-4">Pending requests</h2>
            {pending.length === 0 ? <p className="text-stone-500 text-sm">No pending requests.</p> :
              <div className="space-y-3">
                {pending.map((b) => (
                  <div key={b.id} className="p-3 rounded-lg border border-stone-100">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-stone-900 text-sm">{b.profiles?.full_name}</div>
                        <div className="text-xs text-stone-500">{new Date(b.start_at).toLocaleString()}</div>
                      </div>
                      <div className="text-sm font-bold">${b.price}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => updateStatus(b.id, 'accepted')} className="flex-1 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1"><Check className="w-3 h-3" /> Accept</button>
                      <button onClick={() => updateStatus(b.id, 'declined')} className="flex-1 py-1.5 border border-stone-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1"><X className="w-3 h-3" /> Decline</button>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickCard label="Go to Bookings" onClick={() => navigate('/pro/bookings')} />
          <QuickCard label="Open CRM" onClick={() => navigate('/pro/crm')} />
          <QuickCard label="Run a Campaign" onClick={() => navigate('/pro/campaigns')} />
          <QuickCard label="View Analytics" onClick={() => navigate('/pro/analytics')} />
        </div>
      </div>
    </ProLayout>
  );
}

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    sky: 'bg-sky-50 text-sky-700',
    stone: 'bg-stone-100 text-stone-700',
  };
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <div className={`w-10 h-10 rounded-lg ${colors[color]} flex items-center justify-center mb-3`}>{icon}</div>
      <div className="text-2xl font-bold text-stone-900">{value}</div>
      <div className="text-xs text-stone-500 font-semibold uppercase tracking-wide">{label}</div>
    </div>
  );
}

function QuickCard({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="bg-white border border-stone-200 rounded-xl p-4 text-left hover:border-emerald-300 hover:shadow-sm transition text-sm font-semibold text-stone-900 flex items-center justify-between">
      {label}
      <TrendingUp className="w-4 h-4 text-emerald-600" />
    </button>
  );
}
