import { useEffect, useState } from 'react';
import { Star, MapPin, BadgeCheck, Calendar, ShieldAlert, Mail, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import { VerificationModal } from '../components/VerificationModal';

export function ProfessionalProfile({ id }: { id: string }) {
  const [pro, setPro] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [dogs, setDogs] = useState<any[]>([]);
  const [showBook, setShowBook] = useState(false);
  const [verifying, setVerifying] = useState<'email' | 'phone' | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');
  const { user, profile } = useAuth();
  const { navigate } = useRouter();

  useEffect(() => {
    (async () => {
      setLoadingProfile(true);
      setProfileError('');

      const [p, s, r] = await Promise.all([
        supabase.from('professionals').select('*, profiles!professionals_id_fkey(*)').eq('id', id).maybeSingle(),
        supabase.from('services').select('*').eq('professional_id', id).eq('active', true),
        supabase.from('reviews').select('*, profiles:owner_id(full_name, avatar_url)').eq('professional_id', id).order('created_at', { ascending: false }).limit(10),
      ]);

      if (p.error) {
        console.error('Professional profile load error:', p.error);
        setProfileError(p.error.message);
        setPro(null);
        setLoadingProfile(false);
        return;
      }

      if (s.error) {
        console.error('Professional services load error:', s.error);
        setProfileError(s.error.message);
        setPro(null);
        setLoadingProfile(false);
        return;
      }

      if (r.error) {
        console.error('Professional reviews load error:', r.error);
      }

      setPro(p.data);
      setServices(s.data || []);
      setReviews(r.data || []);

      if (user) {
        const { data: d, error: dogsError } = await supabase.from('dogs').select('*').eq('owner_id', user.id);

        if (dogsError) {
          console.error('Client dogs load error:', dogsError);
          setDogs([]);
        } else {
          setDogs(d || []);
        }
      } else {
        setDogs([]);
      }

      setLoadingProfile(false);
    })();
  }, [id, user]);

  if (loadingProfile) return <div className="p-10 text-stone-500">Loading...</div>;

  if (profileError) {
    return (
      <div className="p-10">
        <div className="max-w-xl bg-white border border-rose-200 rounded-2xl p-6">
          <h1 className="text-xl font-bold text-rose-700">Could not load professional</h1>
          <p className="text-stone-700 mt-2">{profileError}</p>
          <button onClick={() => navigate('/search')} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold">
            Back to search
          </button>
        </div>
      </div>
    );
  }

  if (!pro) {
    return (
      <div className="p-10">
        <div className="max-w-xl bg-white border border-stone-200 rounded-2xl p-6">
          <h1 className="text-xl font-bold text-stone-900">Professional not found</h1>
          <p className="text-stone-600 mt-2">This professional is not available or has not been approved yet.</p>
          <button onClick={() => navigate('/search')} className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold">
            Back to search
          </button>
        </div>
      </div>
    );
  }

  const isVerified = !!(profile?.email_verified && profile?.phone_verified);
  const onBookClick = () => {
    if (!user) return navigate('/signin');
    setShowBook(true);
  };

  return (
    <div className="bg-stone-50 min-h-[calc(100vh-4rem)]">
      <div className="h-60 bg-gradient-to-r from-emerald-200 to-amber-100 relative">
        <img src={pro.cover_photo_url || 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1600'} className="w-full h-full object-cover" alt="" />
      </div>
      <div className="max-w-6xl mx-auto px-6 -mt-12">
        <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col md:flex-row gap-6">
          <img src={pro.profiles?.avatar_url || 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200'} className="w-28 h-28 rounded-full object-cover border-4 border-white -mt-16 shadow" alt="" />
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-stone-900">{pro.profiles?.full_name}</h1>
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> Verified</span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-stone-600 mt-1">
              <span className="capitalize font-semibold text-emerald-700">{pro.professional_type}</span>
              <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-amber-400 text-amber-400" /><b>{pro.rating.toFixed(1)}</b> ({pro.review_count} reviews)</span>
              <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{pro.zone_text || 'Local area'}</span>
            </div>
            <p className="text-stone-700 mt-3">{pro.bio || 'Passionate about dogs and dedicated to providing the best care.'}</p>
          </div>
          <div>
            <button
              onClick={onBookClick}
              className="px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" /> Request booking
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="text-xl font-bold text-stone-900 mb-4">Services</h2>
            {services.length === 0 ? (
              <p className="text-stone-500 text-sm">No services listed.</p>
            ) : (
              <div className="space-y-3">
                {services.map((s) => (
                  <div key={s.id} className="flex justify-between items-center p-3 rounded-lg border border-stone-100">
                    <div>
                      <div className="font-semibold text-stone-900">{s.name}</div>
                      <div className="text-xs text-stone-500">{s.duration_minutes} min \u2022 {s.duration_kind}</div>
                    </div>
                    <div className="font-bold">${s.price}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="text-xl font-bold text-stone-900 mb-4">Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-stone-500 text-sm">No reviews yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => (
                  <div key={r.id} className="border-b border-stone-100 pb-4 last:border-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="font-semibold text-stone-900 text-sm">{r.profiles?.full_name || 'Client'}</div>
                      <div className="flex">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}</div>
                    </div>
                    <p className="text-sm text-stone-700">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showBook && (
          <BookingModal
            professional_id={id}
            services={services}
            dogs={dogs}
            isVerified={isVerified}
            emailVerified={!!profile?.email_verified}
            phoneVerified={!!profile?.phone_verified}
            onVerify={(kind) => setVerifying(kind)}
            onClose={() => setShowBook(false)}
          />
        )}

        {verifying && profile && (
          <VerificationModal
            type={verifying}
            target={verifying === 'email' ? profile.email : profile.phone}
            onClose={() => setVerifying(null)}
            onVerified={() => setVerifying(null)}
          />
        )}

        <div className="h-10" />
      </div>
    </div>
  );
}

interface BookingModalProps {
  professional_id: string;
  services: any[];
  dogs: any[];
  isVerified: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  onVerify: (kind: 'email' | 'phone') => void;
  onClose: () => void;
}

function BookingModal({ professional_id, services, dogs, isVerified, emailVerified, phoneVerified, onVerify, onClose }: BookingModalProps) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [serviceId, setServiceId] = useState(services[0]?.id || '');
  const [dogId, setDogId] = useState(dogs[0]?.id || '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!user) return;
    if (!isVerified) {
      setError('Please verify your email and phone before booking.');
      return;
    }
    if (!date || !time || !serviceId || !dogId) { setError('Fill in all required fields'); return; }
    setSubmitting(true);
    setError('');
    const start = new Date(`${date}T${time}`);
    const svc = services.find((s) => s.id === serviceId);
    const end = new Date(start.getTime() + (svc?.duration_minutes || 60) * 60000);
    const { data: b, error: e } = await supabase.from('bookings').insert({
      owner_id: user.id,
      professional_id,
      service_id: serviceId,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      price: svc?.price || 0,
      notes,
      status: 'pending',
    }).select().maybeSingle();
    if (e) {
      const msg = /row-level security|violates|policy/i.test(e.message)
        ? 'Your account must be verified before booking.'
        : e.message;
      setError(msg);
      setSubmitting(false);
      return;
    }
    if (!b) {
      setError('Booking was not created. Please try again.');
      setSubmitting(false);
      return;
    }

    const { error: bookingDogError } = await supabase.from('booking_dogs').insert({ booking_id: b.id, dog_id: dogId });

    if (bookingDogError) {
      console.error('Booking dog link error:', bookingDogError);
      setError(bookingDogError.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onClose();
    navigate('/owner/bookings');
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6">
        <h2 className="text-xl font-bold text-stone-900 mb-4">Request booking</h2>

        {!isVerified && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-amber-900 text-sm">Verification required</div>
                <p className="text-sm text-amber-800 mt-1">
                  For everyone's safety, please verify your email and phone number before requesting a booking.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {!emailVerified && (
                    <button
                      onClick={() => onVerify('email')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 rounded-full text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
                    >
                      <Mail className="w-3.5 h-3.5" /> Verify email
                    </button>
                  )}
                  {!phoneVerified && (
                    <button
                      onClick={() => onVerify('phone')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 rounded-full text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
                    >
                      <Phone className="w-3.5 h-3.5" /> Verify phone
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {dogs.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 mb-4">
            Add a dog to your profile first.
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-stone-700">Service</label>
              <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} disabled={!isVerified} className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm disabled:bg-stone-50 disabled:text-stone-400">
                {services.map((s) => <option key={s.id} value={s.id}>{s.name} \u2014 ${s.price}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-semibold text-stone-700">Dog</label>
              <select value={dogId} onChange={(e) => setDogId(e.target.value)} disabled={!isVerified} className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm disabled:bg-stone-50 disabled:text-stone-400">
                {dogs.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-stone-700">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={!isVerified} className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm disabled:bg-stone-50 disabled:text-stone-400" />
              </div>
              <div>
                <label className="text-sm font-semibold text-stone-700">Time</label>
                <input type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={!isVerified} className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm disabled:bg-stone-50 disabled:text-stone-400" />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-stone-700">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} disabled={!isVerified} className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm disabled:bg-stone-50 disabled:text-stone-400" />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
          </div>
        )}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-stone-300 rounded-lg font-semibold">Cancel</button>
          <button disabled={submitting || dogs.length === 0 || !isVerified} onClick={submit} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Sending...' : !isVerified ? 'Verify to book' : 'Send request'}
          </button>
        </div>
      </div>
    </div>
  );
}
