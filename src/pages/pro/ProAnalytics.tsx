import { useEffect, useState } from 'react';
import { TrendingUp, Star, Clock, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { ProLayout } from './ProLayout';

export function ProAnalytics() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [b, s] = await Promise.all([
        supabase.from('bookings').select('*, profiles:owner_id(full_name)').eq('professional_id', user.id),
        supabase.from('services').select('*').eq('professional_id', user.id),
      ]);
      setBookings(b.data || []);
      setServices(s.data || []);
    })();
  }, [user]);

  const completed = bookings.filter((b) => b.status === 'completed');
  const revenue = completed.reduce((s, b) => s + Number(b.price), 0);
  const clientMap = new Map<string, { name: string; count: number; spend: number }>();
  completed.forEach((b) => {
    const key = b.owner_id;
    const entry = clientMap.get(key) || { name: b.profiles?.full_name || 'Cliente', count: 0, spend: 0 };
    entry.count++;
    entry.spend += Number(b.price);
    clientMap.set(key, entry);
  });
  const topClientes = [...clientMap.values()].sort((a, b) => b.spend - a.spend).slice(0, 5);

  const serviceMap = new Map<string, number>();
  completed.forEach((b) => {
    const sid = b.service_id || 'unknown';
    serviceMap.set(sid, (serviceMap.get(sid) || 0) + 1);
  });
  const topServices = [...serviceMap.entries()].map(([id, count]) => ({
    name: services.find((s) => s.id === id)?.name || 'Service',
    count,
  })).sort((a, b) => b.count - a.count).slice(0, 5);

  const utilization = Math.min(100, Math.round((completed.length / Math.max(1, bookings.length)) * 100));

  return (
    <ProLayout active="analytics">
      <div className="p-8 max-w-6xl">
        <h1 className="text-3xl font-bold text-stone-900 mb-1">Customer Loyalty Analytics</h1>
        <p className="text-stone-600 mb-6">Real-time insight into who your most valuable customers are and what they love.</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Metric icon={<DollarSign className="w-5 h-5" />} label="Total revenue" value={`$${revenue.toFixed(0)}`} />
          <Metric icon={<TrendingUp className="w-5 h-5" />} label="Completed" value={completed.length} />
          <Metric icon={<Star className="w-5 h-5" />} label="Repeat rate" value={`${topClientes.filter(c => c.count > 1).length * 20}%`} />
          <Metric icon={<Clock className="w-5 h-5" />} label="Utilization" value={`${utilization}%`} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Panel title="Top customers">
            {topClientes.length === 0 ? <Empty /> : (
              <div className="space-y-2">
                {topClientes.map((c, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-stone-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">#{i + 1}</div>
                      <div>
                        <div className="font-semibold text-sm">{c.name}</div>
                        <div className="text-xs text-stone-500">{c.count} bookings</div>
                      </div>
                    </div>
                    <div className="font-bold">${c.spend.toFixed(0)}</div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Most booked services">
            {topServices.length === 0 ? <Empty /> : (
              <div className="space-y-3">
                {topServices.map((s, i) => {
                  const pct = Math.round((s.count / Math.max(1, topServices[0].count)) * 100);
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold">{s.name}</span>
                        <span className="text-stone-500">{s.count}</span>
                      </div>
                      <div className="h-2 rounded-full bg-stone-100 overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </div>

        <div className="mt-6 bg-gradient-to-r from-emerald-50 to-amber-50 rounded-2xl p-6 border border-emerald-100">
          <div className="font-bold text-stone-900 mb-1">Personalized pricing suggestion</div>
          <p className="text-sm text-stone-700">
            Your top clients represent {topClientes.length > 0 ? Math.round((topClientes.reduce((s, c) => s + c.spend, 0) / Math.max(1, revenue)) * 100) : 0}% of your revenue.
            Consider offering them a 10% loyalty discount to retain them - a 5% increase in client retention can raise profit by 25-95%.
          </p>
        </div>
      </div>
    </ProLayout>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center mb-2">{icon}</div>
      <div className="text-2xl font-bold text-stone-900">{value}</div>
      <div className="text-xs text-stone-500 uppercase font-semibold tracking-wide">{label}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6">
      <h2 className="text-lg font-bold text-stone-900 mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Empty() {
  return <p className="text-stone-500 text-sm">No data yet — complete a few bookings to see insights.</p>;
}
