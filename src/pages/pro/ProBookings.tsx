import { useEffect, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { ProLayout } from './ProLayout';
import { StatusBadge } from '../owner/OwnerDashboard';

export function ProBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [q, setQ] = useState('');

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase.from('bookings').select('*, profiles:owner_id(full_name, email)').eq('professional_id', user.id).order('start_at', { ascending: false });
      setBookings(data || []);
    })();
  }, [user]);

  const filtered = bookings.filter((b) => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (q && !(b.profiles?.full_name || '').toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const statuses = ['all', 'pending', 'accepted', 'completed', 'cancelled', 'declined'];

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('bookings').update({ status }).eq('id', id);
    setBookings((bs) => bs.map((b) => b.id === id ? { ...b, status } : b));
  };

  return (
    <ProLayout active="bookings">
      <div className="p-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-stone-900 mb-1">Bookings</h1>
        <p className="text-stone-600 mb-6">All bookings, tasks and activity in one place.</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {statuses.map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 rounded-full text-sm capitalize border ${filter === s ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-stone-300 text-stone-600'}`}>{s}</button>
          ))}
        </div>
        <div className="relative mb-5">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by client name" className="w-full max-w-md pl-10 pr-3 py-2 border border-stone-300 rounded-lg text-sm" />
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-stone-500">No bookings found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                <tr><th className="text-left p-4">Cliente</th><th className="text-left p-4">When</th><th className="text-left p-4">Status</th><th className="text-right p-4">Price</th><th className="p-4"></th></tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id} className="border-t border-stone-100">
                    <td className="p-4 font-semibold">{b.profiles?.full_name}</td>
                    <td className="p-4 text-stone-600">{new Date(b.start_at).toLocaleString()}</td>
                    <td className="p-4"><StatusBadge status={b.status} /></td>
                    <td className="p-4 text-right font-bold">${b.price}</td>
                    <td className="p-4 text-right">
                      <select value={b.status} onChange={(e) => updateStatus(b.id, e.target.value)} className="text-xs border border-stone-300 rounded-md px-2 py-1">
                        <option value="pending">pending</option>
                        <option value="accepted">accepted</option>
                        <option value="completed">completed</option>
                        <option value="cancelled">cancelled</option>
                        <option value="declined">declined</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </ProLayout>
  );
}
