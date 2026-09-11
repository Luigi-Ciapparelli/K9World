import { useEffect, useState } from 'react';
import { Search as SearchIcon, Tag, StickyNote, X, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { ProLayout } from './ProLayout';
import { DogPhoto } from '../../components/DogPhoto';

interface ClienteRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  avatar_url: string;
  bookingCount: number;
  totalSpend: number;
  lastVisit: string | null;
  dogs: any[];
  tags: string[];
}

export function ProCRM() {
  const { user } = useAuth();
  const [clients, setClientes] = useState<ClienteRow[]>([]);
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<ClienteRow | null>(null);

  const load = async () => {
    if (!user) return;

    const { data, error } = await supabase.rpc('get_professional_clients');

    if (error) {
      console.warn('Professional CRM unavailable:', error);
      setClientes([]);
      return;
    }

    const rows: ClienteRow[] = (data || []).map((client: any) => ({
      id: client.id,
      full_name: client.full_name || 'Cliente',
      email: client.email || '',
      phone: client.phone || '',
      avatar_url: client.avatar_url || '',
      bookingCount: Number(client.booking_count || 0),
      totalSpend: Number(client.total_spend || 0),
      lastVisit: client.last_visit || null,
      dogs: Array.isArray(client.dogs) ? client.dogs : [],
      tags: Array.isArray(client.tags) ? client.tags : [],
    }));

    setClientes(rows);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = clients.filter((c) => !q || c.full_name.toLowerCase().includes(q.toLowerCase()));

  return (
    <ProLayout active="crm">
      <div className="p-8 max-w-7xl">
        <h1 className="text-3xl font-bold text-stone-900 mb-1">Cliente Management</h1>
        <p className="text-stone-600 mb-6">Your real-time client database. Consolidated, searchable, always current.</p>

        <div className="relative mb-5 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search clients..." className="w-full pl-10 pr-3 py-2 border border-stone-300 rounded-lg text-sm" />
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center">
            <Users className="w-10 h-10 mx-auto text-stone-400 mb-3" />
            <p className="text-stone-600">No clients yet. They will appear here after their first booking.</p>
          </div>
        ) : (
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-xs uppercase text-stone-500">
                <tr>
                  <th className="text-left p-4">Cliente</th>
                  <th className="text-left p-4">Dogs</th>
                  <th className="text-right p-4">Bookings</th>
                  <th className="text-right p-4">Total spend</th>
                  <th className="text-left p-4">Tags</th>
                  <th className="text-left p-4">Last visit</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id} onClick={() => setSelected(c)} className="border-t border-stone-100 hover:bg-stone-50 cursor-pointer">
                    <td className="p-4">
                      <div className="font-semibold">{c.full_name}</div>
                      <div className="text-xs text-stone-500">{c.email}</div>
                    </td>
                    <td className="p-4 text-stone-600">{c.dogs.map((d) => d.name).join(', ')}</td>
                    <td className="p-4 text-right">{c.bookingCount}</td>
                    <td className="p-4 text-right font-bold">${c.totalSpend.toFixed(0)}</td>
                    <td className="p-4">
                      <div className="flex gap-1 flex-wrap">
                        {c.tags.slice(0, 3).map((t) => <span key={t} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">{t}</span>)}
                      </div>
                    </td>
                    <td className="p-4 text-stone-500">{c.lastVisit ? new Date(c.lastVisit).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selected && <ClienteDrawer client={selected} onClose={() => { setSelected(null); load(); }} />}
    </ProLayout>
  );
}

function ClienteDrawer({ client, onClose }: { client: ClienteRow; onClose: () => void }) {
  const { user } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newTag, setNewTag] = useState('');
  const [tags, setTags] = useState<string[]>(client.tags);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('client_notes').select('*').eq('professional_id', user!.id).eq('client_id', client.id).order('created_at', { ascending: false });
      setNotes(data || []);
    })();
  }, [client.id]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    await supabase.from('client_notes').insert({ professional_id: user!.id, client_id: client.id, content: newNote });
    setNewNote('');
    const { data } = await supabase.from('client_notes').select('*').eq('professional_id', user!.id).eq('client_id', client.id).order('created_at', { ascending: false });
    setNotes(data || []);
  };

  const addTag = async () => {
    if (!newTag.trim()) return;
    await supabase.from('client_tags').insert({ professional_id: user!.id, client_id: client.id, tag: newTag });
    setTags([...tags, newTag]);
    setNewTag('');
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 z-50 flex justify-end">
      <div className="bg-white w-full max-w-lg h-full overflow-y-auto">
        <div className="p-6 border-b border-stone-200 flex justify-between items-center">
          <h2 className="text-xl font-bold">{client.full_name}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <div className="text-xs font-semibold text-stone-500 uppercase mb-1">Contact</div>
            <div className="text-sm text-stone-800">{client.email}</div>
            <div className="text-sm text-stone-800">{client.phone}</div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Mini label="Bookings" value={client.bookingCount} />
            <Mini label="Total spend" value={`$${client.totalSpend.toFixed(0)}`} />
            <Mini label="Dogs" value={client.dogs.length} />
          </div>
          <div>
            <div className="text-xs font-semibold text-stone-500 uppercase mb-2">Dogs</div>
            <div className="space-y-2">
              {client.dogs.map((d: any) => (
                <div key={d.id} className="flex items-center gap-3 p-3 rounded-lg border border-stone-100">
                  <DogPhoto
                    photoPath={d.photo_url}
                    fallbackUrl="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=200"
                    className="w-10 h-10 rounded-full object-cover"
                    alt={d.name || ''}
                  />
                  <div className="flex-1 text-sm">
                    <div className="font-semibold">{d.name}</div>
                    <div className="text-stone-500 text-xs">{d.breed} • {d.age}y • {d.weight}kg</div>
                  </div>
                  {d.aggressive && <span className="text-xs bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full">Reactive</span>}
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-stone-500 uppercase mb-2 flex items-center gap-1"><Tag className="w-3 h-3" /> Tags</div>
            <div className="flex gap-1 flex-wrap mb-2">
              {tags.map((t) => <span key={t} className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full">{t}</span>)}
            </div>
            <div className="flex gap-2">
              <input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add tag..." className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm" />
              <button onClick={addTag} className="px-3 py-2 bg-stone-900 text-white rounded-lg text-sm font-semibold">Add</button>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-stone-500 uppercase mb-2 flex items-center gap-1"><StickyNote className="w-3 h-3" /> Notes</div>
            <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={3} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm mb-2" placeholder="Write a note..." />
            <button onClick={addNote} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold">Save note</button>
            <div className="mt-4 space-y-2">
              {notes.map((n) => (
                <div key={n.id} className="p-3 rounded-lg bg-stone-50 text-sm">
                  <div className="text-xs text-stone-500 mb-1">{new Date(n.created_at).toLocaleString()}</div>
                  {n.content}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-stone-50 rounded-lg p-3 text-center">
      <div className="text-xs text-stone-500">{label}</div>
      <div className="text-lg font-bold text-stone-900">{value}</div>
    </div>
  );
}
