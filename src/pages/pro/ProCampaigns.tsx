import { useEffect, useState } from 'react';
import { Mail, Plus, Send, X, Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { ProLayout } from './ProLayout';

export function ProCampaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [composing, setComposing] = useState<any>(null);
  const [showGroups, setShowGroups] = useState(false);

  const load = async () => {
    if (!user) return;
    const [c, g] = await Promise.all([
      supabase.from('email_campaigns').select('*').eq('professional_id', user.id).order('created_at', { ascending: false }),
      supabase.from('client_groups').select('*').eq('professional_id', user.id),
    ]);
    setCampaigns(c.data || []);
    setGroups(g.data || []);
  };
  useEffect(() => { load(); }, [user]);

  const send = async () => {
    if (!user || !composing) return;
    const { data: bookings } = await supabase.from('bookings').select('owner_id').eq('professional_id', user.id);
    const recipientCount = new Set((bookings || []).map((b: any) => b.owner_id)).size;
    await supabase.from('email_campaigns').insert({
      professional_id: user.id,
      group_id: composing.group_id || null,
      subject: composing.subject,
      content: composing.content,
      status: 'sent',
      sent_at: new Date().toISOString(),
      recipient_count: recipientCount,
    });
    setComposing(null);
    load();
  };

  return (
    <ProLayout active="campaigns">
      <div className="p-8 max-w-6xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 mb-1">Email Campaigns</h1>
            <p className="text-stone-600">Send to exactly the right target audience. Dynamic groups included.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowGroups(true)} className="px-4 py-2 border border-stone-300 rounded-full text-sm font-semibold flex items-center gap-1"><Users className="w-4 h-4" /> Dynamic groups</button>
            <button onClick={() => setComposing({ subject: '', content: '', group_id: '' })} className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-semibold flex items-center gap-1"><Plus className="w-4 h-4" /> New campaign</button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
          {campaigns.length === 0 ? (
            <div className="p-10 text-center"><Mail className="w-10 h-10 mx-auto text-stone-400 mb-3" /><p className="text-stone-600">No campaigns sent yet.</p></div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-xs uppercase text-stone-500"><tr><th className="text-left p-4">Subject</th><th className="text-left p-4">Status</th><th className="text-right p-4">Recipients</th><th className="text-left p-4">Sent</th></tr></thead>
              <tbody>
                {campaigns.map((c) => (
                  <tr key={c.id} className="border-t border-stone-100">
                    <td className="p-4 font-semibold">{c.subject}</td>
                    <td className="p-4"><span className={`text-xs px-2 py-1 rounded-full capitalize ${c.status === 'sent' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>{c.status}</span></td>
                    <td className="p-4 text-right">{c.recipient_count}</td>
                    <td className="p-4 text-stone-500">{c.sent_at ? new Date(c.sent_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {composing && (
        <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6">
            <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">New campaign</h2><button onClick={() => setComposing(null)}><X className="w-5 h-5" /></button></div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-stone-700">Target audience</label>
                <select value={composing.group_id} onChange={(e) => setComposing({ ...composing, group_id: e.target.value })} className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm">
                  <option value="">All clients</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div><label className="text-sm font-semibold text-stone-700">Subject</label><input value={composing.subject} onChange={(e) => setComposing({ ...composing, subject: e.target.value })} className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm" /></div>
              <div><label className="text-sm font-semibold text-stone-700">Message</label><textarea value={composing.content} onChange={(e) => setComposing({ ...composing, content: e.target.value })} rows={6} className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm" /></div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setComposing(null)} className="flex-1 py-2.5 border border-stone-300 rounded-lg font-semibold">Cancel</button>
              <button onClick={send} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold flex items-center justify-center gap-1"><Send className="w-4 h-4" /> Send</button>
            </div>
          </div>
        </div>
      )}

      {showGroups && <GroupsModal groups={groups} onClose={() => { setShowGroups(false); load(); }} />}
    </ProLayout>
  );
}

function GroupsModal({ groups, onClose }: { groups: any[]; onClose: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [rule, setRule] = useState('high_spenders');

  const save = async () => {
    if (!user || !name) return;
    await supabase.from('client_groups').insert({ professional_id: user.id, name, description: desc, filter_rules: { rule } });
    setName(''); setDesc('');
  };

  const remove = async (id: string) => {
    await supabase.from('client_groups').delete().eq('id', id);
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6">
        <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">Dynamic client groups</h2><button onClick={onClose}><X className="w-5 h-5" /></button></div>
        <div className="space-y-3 mb-5">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Group name" className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm" />
          <input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Description" className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm" />
          <select value={rule} onChange={(e) => setRule(e.target.value)} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm">
            <option value="high_spenders">High spenders ($500+)</option>
            <option value="frequent">Frequent clients (5+ bookings)</option>
            <option value="inactive">Inactive 60+ days</option>
            <option value="new">New clients (last 30 days)</option>
          </select>
          <button onClick={save} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold">Create group</button>
        </div>
        <div className="space-y-2">
          {groups.map((g) => (
            <div key={g.id} className="flex justify-between items-center p-3 rounded-lg border border-stone-100">
              <div><div className="font-semibold text-sm">{g.name}</div><div className="text-xs text-stone-500">{g.description}</div></div>
              <button onClick={() => remove(g.id)} className="text-stone-500 hover:text-rose-600"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
