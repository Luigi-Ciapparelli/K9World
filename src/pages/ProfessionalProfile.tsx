import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Mail,
  MapPin,
  Phone,
  ShieldAlert,
  Star,
} from 'lucide-react';
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
    const load = async () => {
      setLoadingProfile(true);
      setProfileError('');

      const [profileRes, servicesRes, reviewsRes] = await Promise.all([
        supabase
          .from('professionals')
          .select('*, profiles!professionals_id_fkey(*)')
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('services')
          .select('*')
          .eq('professional_id', id)
          .eq('active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('reviews')
          .select('*, profiles:owner_id(full_name, avatar_url)')
          .eq('professional_id', id)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (profileRes.error) {
        setProfileError(profileRes.error.message);
        setPro(null);
        setLoadingProfile(false);
        return;
      }

      if (servicesRes.error) {
        setProfileError(servicesRes.error.message);
        setPro(null);
        setLoadingProfile(false);
        return;
      }

      if (reviewsRes.error) {
        console.warn('Reviews load error:', reviewsRes.error);
      }

      setPro(profileRes.data);
      setServices(servicesRes.data || []);
      setReviews(reviewsRes.data || []);

      if (user) {
        const { data: dogRows, error: dogsError } = await supabase
          .from('dogs')
          .select('*')
          .eq('owner_id', user.id);

        setDogs(dogsError ? [] : dogRows || []);
      } else {
        setDogs([]);
      }

      setLoadingProfile(false);
    };

    load();
  }, [id, user]);

  if (loadingProfile) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-stone-50 flex items-center justify-center">
        <div className="text-stone-500">Caricamento profilo...</div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-stone-50 p-8">
        <div className="max-w-xl mx-auto bg-white border border-rose-200 rounded-3xl p-6">
          <h1 className="text-xl font-bold text-rose-700">Impossibile caricare il profilo</h1>
          <p className="text-stone-700 mt-2">{profileError}</p>
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="mt-5 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold"
          >
            Torna alla ricerca
          </button>
        </div>
      </div>
    );
  }

  if (!pro) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-stone-50 p-8">
        <div className="max-w-xl mx-auto bg-white border border-stone-200 rounded-3xl p-6">
          <h1 className="text-xl font-bold text-stone-900">Professionista non trovato</h1>
          <p className="text-stone-600 mt-2">
            Questo profilo non è disponibile o non è ancora stato approvato.
          </p>
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="mt-5 px-4 py-2 bg-emerald-600 text-white rounded-xl font-semibold"
          >
            Torna alla ricerca
          </button>
        </div>
      </div>
    );
  }

  const proProfile = Array.isArray(pro.profiles) ? pro.profiles[0] : pro.profiles;
  const displayName = pro.business_name || proProfile?.full_name || 'Professionista PawConnect';
  const avatarUrl = proProfile?.avatar_url || '';
  const coverUrl =
    pro.cover_photo_url ||
    'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1800';
  const rating = Number(pro.rating || 0);
  const reviewCount = Number(pro.review_count || 0);
  const startingPrice = Number(pro.starting_price || services[0]?.price || 0);
  const isVerified = !!(profile?.email_verified && profile?.phone_verified);

  const onBookClick = () => {
    if (!user) return navigate('/signin');
    setShowBook(true);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-50">
      <section className="relative overflow-hidden bg-stone-950 text-white">
        <img
          src={coverUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-950 via-stone-950/75 to-stone-950/30" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.28),transparent_35%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-28">
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="inline-flex items-center gap-2 text-sm text-stone-200 hover:text-white mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla ricerca
          </button>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm font-semibold text-emerald-100 mb-5">
              <BadgeCheck className="w-4 h-4" />
              Profilo approvato PawConnect
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              {displayName}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-stone-200 mt-5">
              <span className="capitalize rounded-full bg-emerald-500/15 border border-emerald-400/20 px-3 py-1 font-semibold text-emerald-100">
                {pro.professional_type || 'professionista'}
              </span>

              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <b>{rating.toFixed(1)}</b>
                <span className="text-stone-300">({reviewCount} recensioni)</span>
              </span>

              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {pro.zone_text || 'Zona locale'}
              </span>
            </div>

            <p className="text-stone-200 text-lg mt-6 max-w-2xl leading-relaxed">
              {pro.bio ||
                'Professionista cinofilo approvato su PawConnect. Servizi, zona e disponibilità sono consultabili nella scheda.'}
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 -mt-20 relative z-10 pb-14">
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
          <div className="space-y-6">
            <section className="bg-white rounded-[2rem] border border-stone-200 shadow-sm p-6 md:p-8">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-24 h-24 rounded-2xl object-cover border border-stone-200 shadow-sm"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-3xl font-bold text-emerald-700 shadow-sm">
                    {displayName.slice(0, 1)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl md:text-3xl font-bold text-stone-900">
                      {displayName}
                    </h2>
                    <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      Verificato
                    </span>
                  </div>

                  <p className="text-stone-700 mt-4 leading-relaxed">
                    {pro.bio ||
                      'Profilo verificato da PawConnect. Informazioni e servizi disponibili nella scheda.'}
                  </p>

                  <div className="grid sm:grid-cols-3 gap-3 mt-6">
                    <InfoPill label="Zona" value={pro.zone_text || 'Locale'} />
                    <InfoPill label="Rating" value={rating.toFixed(1)} />
                    <InfoPill label="Recensioni" value={String(reviewCount)} />
                  </div>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-[2rem] border border-stone-200 shadow-sm p-6 md:p-8">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-stone-900">Servizi</h2>
                <p className="text-sm text-stone-500 mt-1">
                  Servizi attivi disponibili tramite questo profilo.
                </p>
              </div>

              {services.length === 0 ? (
                <div className="rounded-2xl bg-stone-50 border border-stone-200 p-5">
                  <p className="text-stone-600 text-sm">Nessun servizio inserito.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              )}
            </section>

            <section className="bg-white rounded-[2rem] border border-stone-200 shadow-sm p-6 md:p-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-5">Recensioni</h2>

              {reviews.length === 0 ? (
                <div className="rounded-2xl bg-stone-50 border border-stone-200 p-5">
                  <p className="text-stone-600 text-sm">
                    Nessuna recensione ancora. Le recensioni verranno mostrate dopo richieste completate.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-2xl border border-stone-200 p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-semibold text-stone-900 text-sm">
                          {review.profiles?.full_name || 'Cliente'}
                        </div>
                        <div className="flex">
                          {Array.from({ length: Number(review.rating || 0) }).map((_, index) => (
                            <Star
                              key={index}
                              className="w-3 h-3 fill-amber-400 text-amber-400"
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-stone-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="bg-white rounded-[2rem] border border-stone-200 shadow-xl p-6">
              <div className="text-sm text-stone-500">A partire da</div>
              <div className="text-4xl font-bold text-stone-900 mt-1">
                €{startingPrice}
              </div>

              <div className="h-px bg-stone-200 my-5" />

              <div className="space-y-3 text-sm text-stone-700">
                <div className="flex items-center justify-between">
                  <span>Profilo</span>
                  <span className="font-semibold text-emerald-700">Approvato</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Zona</span>
                  <span className="font-semibold">{pro.zone_text || 'Locale'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Servizi attivi</span>
                  <span className="font-semibold">{services.length}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onBookClick}
                className="w-full justify-center mt-6 px-6 py-3 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition inline-flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Richiedi prenotazione
              </button>

              <p className="text-xs text-stone-500 mt-4 leading-relaxed">
                Invia una richiesta con data, orario, servizio e informazioni sul cane.
                Il professionista potrà accettare o rifiutare dal proprio pannello.
              </p>
            </div>
          </aside>
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
      </main>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-stone-50 border border-stone-200 p-4">
      <div className="text-xs text-stone-500 font-semibold">{label}</div>
      <div className="text-sm text-stone-900 font-bold mt-1">{value}</div>
    </div>
  );
}

function ServiceCard({ service }: { service: any }) {
  const durationKind =
    service.duration_kind === 'daily'
      ? 'giornaliero'
      : service.duration_kind === 'hourly'
        ? 'orario'
        : 'variabile';

  return (
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 hover:border-emerald-200 hover:bg-emerald-50/30 transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-stone-900">{service.name}</h3>
          <p className="text-xs text-stone-500 mt-1">
            {service.duration_minutes} min · {durationKind}
          </p>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-stone-900">€{service.price}</div>
          <div className="text-xs text-stone-500">da</div>
        </div>
      </div>

      {service.description && (
        <p className="text-sm text-stone-600 mt-4">{service.description}</p>
      )}
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

function BookingModal({
  professional_id,
  services,
  dogs,
  isVerified,
  emailVerified,
  phoneVerified,
  onVerify,
  onClose,
}: BookingModalProps) {
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
      setError('Verifica email e telefono prima di richiedere una prenotazione.');
      return;
    }

    if (!date || !time || !serviceId || !dogId) {
      setError('Compila tutti i campi obbligatori.');
      return;
    }

    setSubmitting(true);
    setError('');

    const start = new Date(`${date}T${time}`);
    const selectedService = services.find((service) => service.id === serviceId);
    const end = new Date(
      start.getTime() + (selectedService?.duration_minutes || 60) * 60000
    );

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        owner_id: user.id,
        professional_id,
        service_id: serviceId,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        price: selectedService?.price || 0,
        notes,
        status: 'pending',
      })
      .select()
      .maybeSingle();

    if (bookingError) {
      const message = /row-level security|violates|policy/i.test(bookingError.message)
        ? 'Il tuo account deve essere verificato prima di prenotare.'
        : bookingError.message;

      setError(message);
      setSubmitting(false);
      return;
    }

    if (!booking) {
      setError('La prenotazione non è stata creata. Riprova.');
      setSubmitting(false);
      return;
    }

    const { error: dogError } = await supabase
      .from('booking_dogs')
      .insert({ booking_id: booking.id, dog_id: dogId });

    if (dogError) {
      setError(dogError.message);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    onClose();
    navigate('/owner/bookings');
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl">
        <h2 className="text-xl font-bold text-stone-900 mb-4">
          Richiedi prenotazione
        </h2>

        {!isVerified && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-amber-900 text-sm">
                  Verifica richiesta
                </div>
                <p className="text-sm text-amber-800 mt-1">
                  Per maggiore sicurezza, verifica email e telefono prima di richiedere una prenotazione.
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  {!emailVerified && (
                    <button
                      type="button"
                      onClick={() => onVerify('email')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 rounded-full text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Verifica email
                    </button>
                  )}

                  {!phoneVerified && (
                    <button
                      type="button"
                      onClick={() => onVerify('phone')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-amber-300 rounded-full text-xs font-semibold text-amber-900 hover:bg-amber-100 transition"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Verifica telefono
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {services.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800 mb-4">
            Questo professionista non ha ancora servizi attivi.
          </div>
        ) : dogs.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-800 mb-4">
            Aggiungi prima un cane al tuo profilo.
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-semibold text-stone-700">Servizio</label>
              <select
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                disabled={!isVerified}
                className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-xl text-sm disabled:bg-stone-50 disabled:text-stone-400"
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} — €{service.price}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-stone-700">Cane</label>
              <select
                value={dogId}
                onChange={(event) => setDogId(event.target.value)}
                disabled={!isVerified}
                className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-xl text-sm disabled:bg-stone-50 disabled:text-stone-400"
              >
                {dogs.map((dog) => (
                  <option key={dog.id} value={dog.id}>
                    {dog.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-stone-700">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  disabled={!isVerified}
                  className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-xl text-sm disabled:bg-stone-50 disabled:text-stone-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-stone-700">Ora</label>
                <input
                  type="time"
                  value={time}
                  onChange={(event) => setTime(event.target.value)}
                  disabled={!isVerified}
                  className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-xl text-sm disabled:bg-stone-50 disabled:text-stone-400"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-stone-700">Note</label>
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={!isVerified}
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-xl text-sm disabled:bg-stone-50 disabled:text-stone-400"
                placeholder="Esigenze del cane, informazioni utili, preferenze..."
              />
            </div>
          </div>
        )}

        {error && <p className="text-sm text-rose-600 mt-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-stone-300 rounded-xl font-semibold"
          >
            Annulla
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={
              submitting ||
              !isVerified ||
              services.length === 0 ||
              dogs.length === 0
            }
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Invio...' : 'Invia richiesta'}
          </button>
        </div>
      </div>
    </div>
  );
}
