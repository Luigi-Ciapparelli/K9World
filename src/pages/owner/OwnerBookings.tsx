import { useEffect, useState } from 'react';
import { Star, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { StatusBadge } from './OwnerDashboard';

export function OwnerBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [reviewing, setReviewing] = useState<any>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('bookings').select('*, professional:professional_id(full_name, avatar_url)').eq('owner_id', user.id).order('start_at', { ascending: false });
    setBookings(data || []);
  };
  useEffect(() => { load(); }, [user]);

  const cancel = async (id: string) => {
    if (!confirm('Cancel this booking?')) return;
    await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id);
    load();
  };

  return (
    <div className="bg-stone-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-stone-900 mb-6">Your bookings</h1>
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-stone-200 text-stone-600">No bookings yet.</div>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white rounded-2xl p-5 border border-stone-200 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <img src={b.professional?.avatar_url || 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200'} className="w-14 h-14 rounded-full object-cover" alt="" />
                <div className="flex-1">
                  <div className="font-bold">{b.professional?.full_name}</div>
                  <div className="text-sm text-stone-600">{new Date(b.start_at).toLocaleString()}</div>
                  <div className="text-xs text-stone-500 mt-1">${b.price} • {b.notes || 'No notes'}</div>
                </div>
                <StatusBadge status={b.status} />
                <div className="flex gap-2">
                  {b.status === 'pending' && <button onClick={() => cancel(b.id)} className="text-xs text-rose-600 font-semibold">Cancel</button>}
                  {b.status === 'completed' && <button onClick={() => setReviewing(b)} className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-full font-semibold flex items-center gap-1"><Star className="w-3 h-3" /> Leave review</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {reviewing && <ReviewModal booking={reviewing} onClose={() => { setReviewing(null); load(); }} />}
    </div>
  );
}

function ReviewModal({ booking, onClose }: { booking: any; onClose: () => void }) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const submit = async () => {
    if (!user) return;
    await supabase.from('reviews').insert({ booking_id: booking.id, owner_id: user.id, professional_id: booking.professional_id, rating, comment });
    const { data } = await supabase.from('reviews').select('rating').eq('professional_id', booking.professional_id);
    if (data && data.length) {
      const avg = data.reduce((s: number, r: any) => s + r.rating, 0) / data.length;
      await supabase.from('professionals').update({ rating: avg, review_count: data.length }).eq('id', booking.professional_id);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">Leave a review</h2><button onClick={onClose}><X className="w-5 h-5" /></button></div>
        <div className="flex gap-1 mb-4">
          {[1,2,3,4,5].map((n) => (
            <button key={n} onClick={() => setRating(n)}><Star className={`w-7 h-7 ${n <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`} /></button>
          ))}
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Share your experience..." rows={4} className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm" />
        <button onClick={submit} className="w-full mt-4 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold">Submit review</button>
      </div>
    </div>
  );
}
