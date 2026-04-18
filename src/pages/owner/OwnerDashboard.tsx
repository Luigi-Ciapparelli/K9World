import { useEffect, useState } from 'react';
import { Dog as DogIcon, Plus, Calendar, MessageCircle, BadgeCheck, Phone, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useRouter } from '../../lib/RouterContext';
import { SearchCard } from '../../components/SearchCard';
import { VerificationModal } from '../../components/VerificationModal';
import type { Dog, Booking } from '../../lib/types';

export function OwnerDashboard() {
  const { profile, user } = useAuth();
  const { navigate } = useRouter();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState<'email' | 'phone' | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [dogsRes, bookingsRes] = await Promise.all([
        supabase.from('dogs').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
        supabase.from('bookings').select('*').eq('owner_id', user.id).order('start_at', { ascending: false }).limit(4),
      ]);
      setDogs((dogsRes.data as Dog[]) || []);
      setBookings((bookingsRes.data as Booking[]) || []);
      setLoading(false);
    })();
  }, [user]);

  const upcoming = bookings.filter((b) => new Date(b.start_at) > new Date()).length;

  return (
    <div className="bg-stone-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900">Hi, {profile?.full_name?.split(' ')[0] || 'there'}.</h1>
          <p className="text-stone-600">Find someone wonderful for your dog.</p>
        </div>

        <SearchCard />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 mb-10">
          <StatCard icon={<DogIcon className="w-5 h-5" />} label="Your dogs" value={dogs.length} />
          <StatCard icon={<Calendar className="w-5 h-5" />} label="Upcoming bookings" value={upcoming} />
          <StatCard icon={<MessageCircle className="w-5 h-5" />} label="Messages" value={0} />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl border border-stone-200 p-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-stone-900">Your dogs</h2>
              <button onClick={() => navigate('/owner/dogs')} className="text-sm text-emerald-700 font-semibold hover:text-emerald-800 flex items-center gap-1">
                <Plus className="w-4 h-4" /> Add dog
              </button>
            </div>
            {loading ? (
              <div className="text-stone-500 text-sm">Loading...</div>
            ) : dogs.length === 0 ? (
              <EmptyState text="No dogs added yet. Add your first dog to start booking services." action="Add a dog" onClick={() => navigate('/owner/dogs')} />
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {dogs.slice(0, 4).map((d) => (
                  <div key={d.id} className="flex items-center gap-4 p-3 rounded-xl border border-stone-100 hover:border-emerald-200 transition">
                    <img
                      src={d.photo_url || 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=200'}
                      alt={d.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-semibold text-stone-900">{d.name}</div>
                      <div className="text-xs text-stone-500">{d.breed || 'Unknown breed'}</div>
                      <div className="text-xs text-stone-500">{d.age} yrs • {d.weight} kg</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h3 className="font-bold text-stone-900 mb-4">Account verification</h3>
            <VerifyRow icon={<Mail className="w-4 h-4" />} label="Email" verified={profile?.email_verified || false} value={profile?.email || ''} onVerify={() => setVerifying('email')} />
            <VerifyRow icon={<Phone className="w-4 h-4" />} label="Phone" verified={profile?.phone_verified || false} value={profile?.phone || ''} onVerify={() => setVerifying('phone')} />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 mt-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-stone-900">Recent bookings</h2>
            <button onClick={() => navigate('/owner/bookings')} className="text-sm text-emerald-700 font-semibold">View all</button>
          </div>
          {bookings.length === 0 ? (
            <EmptyState text="No bookings yet. Start by searching for a professional above." action="Find a pro" onClick={() => navigate('/search')} />
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => (
                <div key={b.id} className="flex justify-between items-center p-3 rounded-lg border border-stone-100">
                  <div>
                    <div className="text-sm font-semibold text-stone-900">{new Date(b.start_at).toLocaleDateString()} • {new Date(b.start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    <div className="text-xs text-stone-500">${b.price} • {b.notes || 'No notes'}</div>
                  </div>
                  <StatusBadge status={b.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {verifying && (
        <VerificationModal
          type={verifying}
          target={verifying === 'email' ? profile?.email || '' : profile?.phone || ''}
          onClose={() => setVerifying(null)}
          onVerified={() => setVerifying(null)}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-xs text-stone-500 uppercase font-semibold tracking-wide">{label}</div>
        <div className="text-2xl font-bold text-stone-900">{value}</div>
      </div>
    </div>
  );
}

function VerifyRow({ icon, label, verified, value, onVerify }: { icon: React.ReactNode; label: string; verified: boolean; value: string; onVerify: () => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2 text-sm">
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
          className="text-xs bg-amber-500 text-white hover:bg-amber-600 px-3 py-1 rounded-full font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Verify now
        </button>
      )}
    </div>
  );
}

function EmptyState({ text, action, onClick }: { text: string; action: string; onClick: () => void }) {
  return (
    <div className="text-center py-8">
      <p className="text-stone-600 mb-3 text-sm">{text}</p>
      <button onClick={onClick} className="px-4 py-2 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700">{action}</button>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    accepted: 'bg-blue-50 text-blue-700',
    completed: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-stone-100 text-stone-500',
    declined: 'bg-rose-50 text-rose-700',
  };
  return <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${map[status] || 'bg-stone-100 text-stone-500'}`}>{status}</span>;
}
