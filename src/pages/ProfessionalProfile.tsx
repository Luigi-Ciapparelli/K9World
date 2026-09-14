import { ProfessionalCredentialsPublic } from '../components/ProfessionalCredentialsPublic';
import { continuityEnabled } from '../lib/continuity';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Calendar,
  Mail,
  MapPin,
  ShieldAlert,
  Star,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import { VerificationModal } from '../components/VerificationModal';
import { PublicBookingAvailability } from '../components/PublicBookingAvailability';
import { bookingAvailabilityError } from '../lib/professionalCalendar';
import { readJourneyContext } from '../lib/journeyContext';
import { JourneyContextNotice } from '../components/ecosystem/ProfessionalBridge';

// ECOSYSTEM_PASS_V1
export function ProfessionalProfile({ id }: { id: string }) {
  const [pro, setPro] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [dogs, setDogs] = useState<any[]>([]);
  const [showBook, setShowBook] = useState(false);
  const [verifying, setVerifying] = useState<'email' | 'phone' | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [servicesError, setServicesError] = useState(false);
  const [reviewsError, setReviewsError] = useState(false);
  const [dogsLoadError, setDogsLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const { user, profile } = useAuth();
  const { navigate } = useRouter();

  const journey = readJourneyContext();
  const profileQuery = window.location.hash.includes('?') ? window.location.hash.split('?')[1] : '';
  const returnToSearch = profileQuery ? `/search?${profileQuery}` : '/search';
  useEffect(() => {
    let active = true;
    setShowBook(false);
    setVerifying(null);
    const load = async () => {
      setLoadingProfile(true);
      setProfileError('');
      setServicesError(false);
      setReviewsError(false);
      setDogsLoadError(false);
      setPro(null);
      setServices([]);
      setReviews([]);
      setDogs([]);
      try {

      const [profileRes, servicesRes, reviewsRes] = await Promise.all([
        supabase
          .from('public_professional_profiles')
          .select(
            'id, display_name, avatar_url, professional_type, bio, zone_text, starting_price, cover_photo_url, rating, review_count'
          )
          .eq('id', id)
          .maybeSingle(),
        supabase.rpc('get_public_professional_services', {
          p_professional_id: id,
        }),
        supabase
          .from('public_reviews')
          .select('id, professional_id, rating, comment, reviewer_name, created_at')
          .eq('professional_id', id)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (!active) return;
      if (profileRes.error) {
        setProfileError('Il profilo non è stato caricato. Riprova tra poco.');
        setPro(null);
        setLoadingProfile(false);
        return;
      }

      setServicesError(Boolean(servicesRes.error));
      setReviewsError(Boolean(reviewsRes.error));

      setPro(profileRes.data);
      setServices(servicesRes.data || []);
      setReviews(reviewsRes.data || []);

      if (user && profile?.role === 'owner') {
        const { data: dogRows, error: dogsError } = await supabase
          .from('dogs')
          .select('id, name')
          .eq('owner_id', user.id);

        if (!active) return;
        setDogsLoadError(Boolean(dogsError));
        setDogs(dogsError ? [] : dogRows || []);
      } else {
        setDogs([]);
      }

      } catch {
        if (active) setProfileError('Non è stato possibile caricare il profilo. Riprova tra poco.');
      } finally {
        if (active) setLoadingProfile(false);
      }
    };

    void load();
    return () => { active = false; };
  }, [id, user?.id, profile?.role, reloadKey]);

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
          <p role="alert" className="text-stone-700 mt-2">{profileError}</p>
          <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="block mt-4 font-semibold underline">Riprova</button>
          <button
            type="button"
            onClick={() => navigate(returnToSearch)}
            className="mt-5 px-4 py-2 bg-[var(--pc-forest-900)] text-white rounded-xl font-semibold"
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
            onClick={() => navigate(returnToSearch)}
            className="mt-5 px-4 py-2 bg-[var(--pc-forest-900)] text-white rounded-xl font-semibold"
          >
            Torna alla ricerca
          </button>
        </div>
      </div>
    );
  }

  const displayName = pro.display_name || 'Professionista PortaleCinofilo';
  const avatarUrl = pro.avatar_url || '';
  const coverUrl =
    pro.cover_photo_url ||
    'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1800';
  const rating = Number(pro.rating || 0);
  const reviewCount = Number(pro.review_count || 0);
  const servicePrices = services.map((service) => Number(service.price)).filter((price) => Number.isFinite(price) && price > 0);
  const listedPrice = Number(pro.starting_price);
  const startingPrice = Number.isFinite(listedPrice) && listedPrice > 0
    ? listedPrice : servicePrices.length ? Math.min(...servicePrices) : null;
  const hasRating = reviewCount > 0 && Number.isFinite(rating) && rating >= 1 && rating <= 5;
  const professionalLabels: Record<string, string> = {
    trainer: 'Educazione e addestramento', walker: 'Dog walking',
    sitter: 'Dog sitting', boarding: 'Pensione per cani',
  };
  const isVerified = !!profile?.email_verified;

  const onBookClick = () => {
    if (!user) return navigate('/signin');
    if (profile?.role !== 'owner' || servicesError || dogsLoadError || !services.length) return;
    setShowBook(true);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-stone-50">
      <section className="relative overflow-hidden bg-[#15110b] text-white">
        <img
          src={coverUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#15110b]/70 via-[#15110b]/45 to-[#15110b]/15" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.24),transparent_35%)]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-28">
          <button
            type="button"
            onClick={() => navigate(returnToSearch)}
            className="inline-flex items-center gap-2 text-sm text-stone-200 hover:text-white mb-10"
          >
            <ArrowLeft className="w-4 h-4" />
            Torna alla ricerca
          </button>

          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold text-white mb-5">
              <BadgeCheck className="w-4 h-4" />
              Profilo approvato PortaleCinofilo
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              {displayName}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-stone-200 mt-5">
              <span className="capitalize rounded-full bg-white/10 border border-white/20 px-3 py-1 font-semibold text-white">
                {professionalLabels[pro.professional_type] || 'Professionista cinofilo'}
              </span>

              {hasRating ? <span className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <b>{rating.toFixed(1)}</b>
                <span className="text-stone-300">({reviewCount} {reviewCount === 1 ? 'recensione' : 'recensioni'})</span>
              </span> : <span>Valutazione non ancora disponibile</span>}

              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {pro.zone_text || 'Zona locale'}
              </span>
            </div>

            <p className="text-stone-200 text-lg mt-6 max-w-2xl leading-relaxed">
              {pro.bio ||
                'Professionista cinofilo approvato su PortaleCinofilo. Servizi e zona sono consultabili nella scheda. Le date richieste devono essere accettate dal professionista.'}
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 -mt-20 relative z-10 pb-14">
        <JourneyContextNotice context={journey} className="mb-6 shadow-sm" />
        <div className="grid lg:grid-cols-[1fr_380px] gap-6 items-start">
          <div className="space-y-6">
            <section className="bg-[var(--pc-paper)] rounded-[2rem] border border-[var(--pc-line)] shadow-sm p-6 md:p-8">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-24 h-24 rounded-2xl object-cover border border-stone-200 shadow-sm"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-amber-50 border border-[var(--pc-line)] flex items-center justify-center text-3xl font-bold text-[var(--pc-forest-900)] shadow-sm">
                    {displayName.slice(0, 1)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl md:text-3xl font-bold text-stone-900">
                      {displayName}
                    </h2>
                    <span className="text-xs bg-amber-50 text-[var(--pc-forest-900)] px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      Approvato
                    </span>
                  </div>

                  <p className="text-stone-700 mt-4 leading-relaxed">
                    {pro.bio ||
                      'Profilo approvato da PortaleCinofilo. Informazioni e servizi disponibili nella scheda.'}
                  </p>

                  <div className="grid sm:grid-cols-3 gap-3 mt-6">
                    <InfoPill label="Zona" value={pro.zone_text || 'Locale'} />
                    <InfoPill label="Valutazione" value={hasRating ? rating.toFixed(1) : 'Non disponibile'} />
                    <InfoPill label="Recensioni" value={String(reviewCount)} />
                  </div>
                </div>
              </div>
            </section>

            <ProfessionalCredentialsPublic professionalId={id} />

            <section className="bg-[var(--pc-paper)] rounded-[2rem] border border-[var(--pc-line)] shadow-sm p-6 md:p-8">
              <div className="mb-5">
                <h2 className="text-2xl font-bold text-stone-900">Servizi</h2>
                <p className="text-sm text-stone-500 mt-1">
                  Servizi attivi disponibili tramite questo profilo.
                </p>
              </div>

              {servicesError ? (
                <InlineLoadError text="Non è stato possibile caricare i servizi." onRetry={() => setReloadKey((key) => key + 1)} />
              ) : services.length === 0 ? (
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

            <section className="bg-[var(--pc-paper)] rounded-[2rem] border border-[var(--pc-line)] shadow-sm p-6 md:p-8">
              <h2 className="text-2xl font-bold text-stone-900 mb-5">Recensioni</h2>

              {reviewsError ? (
                <InlineLoadError text="Non è stato possibile caricare le recensioni." onRetry={() => setReloadKey((key) => key + 1)} />
              ) : reviews.length === 0 ? (
                <div className="rounded-2xl bg-stone-50 border border-stone-200 p-5">
                  <p className="text-stone-600 text-sm">
                    Nessuna recensione ancora. Le recensioni verranno mostrate dopo prenotazioni completate.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="rounded-2xl border border-stone-200 p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="font-semibold text-stone-900 text-sm">
                          {review.reviewer_name || 'Cliente'}
                        </div>
                        <div className="flex">
                          {Array.from({ length: Math.max(0, Math.min(5, Math.floor(Number(review.rating) || 0))) }).map((_, index) => (
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
            <div className="bg-[var(--pc-paper)] rounded-[2rem] border border-[var(--pc-line)] shadow-xl p-6">
              <div className="text-sm text-stone-500">{startingPrice === null ? 'Tariffa' : 'A partire da'}</div>
              <div className="text-4xl font-bold text-stone-900 mt-1">
                {formatPrice(startingPrice)}
              </div>

              <div className="h-px bg-stone-200 my-5" />

              <div className="space-y-3 text-sm text-stone-700">
                <div className="flex items-center justify-between">
                  <span>Profilo</span>
                  <span className="font-semibold text-[var(--pc-forest-900)]">Approvato</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Zona</span>
                  <span className="font-semibold">{pro.zone_text || 'Locale'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Servizi attivi</span>
                  <span className="font-semibold">{servicesError ? 'Non disponibili' : services.length}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={onBookClick}
                disabled={servicesError || services.length === 0 || dogsLoadError || Boolean(user && profile?.role !== 'owner')}
                className="w-full justify-center mt-6 px-6 py-3 bg-[var(--pc-forest-900)] text-white rounded-full font-semibold hover:bg-[var(--pc-forest-700)] transition inline-flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Richiedi prenotazione
              </button>

              <PublicBookingAvailability key={id} professionalId={id} />

              <section className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4" aria-labelledby="dog-relationship-heading">
                <h2 id="dog-relationship-heading" className="font-bold text-stone-900">Percorso con il tuo cane</h2>
                <p className="mt-2 text-sm text-stone-700">Invita questo professionista a seguire il cane. Potrà registrare sessioni quando avrà accettato l’invito.</p>
                <button
                  type="button"
                  disabled={!continuityEnabled || Boolean(user && profile?.role !== 'owner')}
                  onClick={() => navigate(user ? `/owner/relationships?professional=${encodeURIComponent(id)}` : '/signin')}
                  className="mt-3 w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                >Invita a seguire il tuo cane</button>
                {!continuityEnabled ? <p className="mt-2 text-sm text-stone-700">Gli inviti non sono ancora disponibili in questa versione del sito.</p>
                  : !user ? <p className="mt-2 text-sm text-stone-700">Accedi come proprietario per scegliere il cane e inviare l’invito.</p>
                  : !profile ? <p role="status" className="mt-2 text-sm text-stone-700">Profilo account non disponibile. Ricarica la pagina o accedi nuovamente.</p>
                  : profile.role !== 'owner' ? <p className="mt-2 text-sm text-stone-700">Stai usando un account {profile.role === 'professional' ? 'professionista' : profile.role === 'admin' ? 'amministratore' : 'non proprietario'}. Per inviare l’invito occorre accedere con l’account proprietario del cane.</p>
                  : <p className="mt-2 text-sm text-stone-700">Sceglierai il cane nella schermata successiva. L’invito è distinto dalla richiesta di un appuntamento.</p>}
              </section>

              {dogsLoadError && <InlineLoadError text="Non è stato possibile caricare i tuoi cani." onRetry={() => setReloadKey((key) => key + 1)} />}
              {user && profile?.role !== 'owner' && <p className="text-sm text-stone-600 mt-4">Per inviare una richiesta, accedi con un account proprietario.</p>}
              <p className="text-xs text-stone-500 mt-4 leading-relaxed">
                Invia una richiesta con data, orario, servizio e informazioni sul cane.
                Il professionista potrà accettare o rifiutare dal proprio pannello.
              </p>
            </div>
          </aside>
        </div>

        {showBook && (
          <BookingModal
            services={services}
            dogs={dogs}
            isVerified={isVerified}
            emailVerified={!!profile?.email_verified}
            onVerify={(kind) => { setShowBook(false); setVerifying(kind); }}
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

function formatPrice(value: unknown) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0
    ? price.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' })
    : 'Prezzo da confermare';
}

function InlineLoadError({ text, onRetry }: { text: string; onRetry: () => void }) {
  return <div role="alert" className="mt-4 text-sm"><p>{text}</p><button type="button" onClick={onRetry} className="mt-2 font-semibold underline">Riprova</button></div>;
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
    <div className="rounded-2xl border border-stone-200 bg-stone-50 p-5 hover:border-[var(--pc-forest-700)] transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-bold text-stone-900">{service.name}</h3>
          <p className="text-xs text-stone-500 mt-1">
            {Number(service.duration_minutes) > 0 ? `${service.duration_minutes} min · ` : ''}{durationKind}
          </p>
        </div>

        <div className="text-right">
          <div className="text-lg font-bold text-stone-900">{formatPrice(service.price)}</div>

        </div>
      </div>

      {service.description && (
        <p className="text-sm text-stone-600 mt-4">{service.description}</p>
      )}
    </div>
  );
}

interface BookingModalProps {
  services: any[];
  dogs: any[];
  isVerified: boolean;
  emailVerified: boolean;
  onVerify: (kind: 'email' | 'phone') => void;
  onClose: () => void;
}

function BookingModal({
  services,
  dogs,
  isVerified,
  emailVerified,
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
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inFlight = useRef(false);
  const mounted = useRef(false);
  const [uncertain, setUncertain] = useState(false);
  const localToday = new Date();
  const minDate = `${localToday.getFullYear()}-${String(localToday.getMonth() + 1).padStart(2, '0')}-${String(localToday.getDate()).padStart(2, '0')}`;

  useEffect(() => {
    mounted.current = true;
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog?.showModal();
    return () => {
      mounted.current = false;
      dialog?.close();
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);

  const submit = async () => {
    if (!user || inFlight.current || uncertain) return;

    if (!isVerified) {
      setError('Conferma la tua email prima di richiedere una prenotazione.');
      return;
    }

    if (!date || !time || !serviceId || !dogId) {
      setError('Compila tutti i campi obbligatori.');
      return;
    }

    if (!services.some((service) => service.id === serviceId) || !dogs.some((dog) => dog.id === dogId)) {
      setError('Seleziona un servizio e un cane disponibili.');
      return;
    }
    const start = new Date(`${date}T${time}`);
    if (!Number.isFinite(start.getTime()) || start.getTime() <= Date.now()) {
      setError('Scegli una data e un orario futuri.');
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setError('');
    try {
      const { error: bookingError } = await supabase.rpc('create_booking_with_dog', {
        p_service_id: serviceId,
        p_dog_id: dogId,
        p_start_at: start.toISOString(),
        p_notes: notes.trim(),
      });
      if (!mounted.current) return;
      if (bookingError) {
        const availabilityError = bookingAvailabilityError(bookingError);
        if (availabilityError) {
          setError(availabilityError);
        } else if (/email verification required/i.test(bookingError.message)) {
          setError('Conferma la tua email prima di inviare la richiesta.');
        } else {
          setUncertain(true);
          setError('Non è stato possibile confermare l’esito. Controlla le tue prenotazioni prima di inviare una nuova richiesta.');
        }
        return;
      }
      onClose();
      navigate('/owner/bookings');
    } catch {
      if (mounted.current) {
        setUncertain(true);
        setError('Connessione interrotta. Controlla le tue prenotazioni prima di inviare una nuova richiesta.');
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setSubmitting(false);
    }
  };

  return (
    <dialog ref={dialogRef} aria-labelledby="booking-title" aria-describedby="booking-description"
      onCancel={(event) => { event.preventDefault(); if (!inFlight.current) onClose(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain rounded-3xl p-0 bg-white text-stone-900 backdrop:bg-stone-900/50">
      <div className="p-4 sm:p-6" aria-busy={submitting}>
        <h2 id="booking-title" className="text-xl font-bold text-stone-900 mb-4">
          Richiedi prenotazione
        </h2>

        <p id="booking-description" className="text-sm text-stone-600 mb-4">Proponi data e orario nel fuso del tuo dispositivo. L’appuntamento sarà confermato solo dopo l’accettazione del professionista.</p>
        {!isVerified && (
          <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-amber-900 text-sm">
                  Verifica richiesta
                </div>
                <p className="text-sm text-amber-800 mt-1">
                  Conferma la tua email prima di richiedere una prenotazione.
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
            <button type="button" onClick={() => { onClose(); navigate('/owner/dogs'); }} className="block mt-3 font-semibold underline">Vai ai tuoi cani</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label htmlFor="booking-service" className="text-sm font-semibold text-stone-700">Servizio</label>
              <select
                id="booking-service"
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
                disabled={!isVerified || submitting || uncertain}
                className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-xl text-sm disabled:bg-stone-50 disabled:text-stone-400"
              >
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} — {formatPrice(service.price)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="booking-dog" className="text-sm font-semibold text-stone-700">Cane</label>
              <select
                id="booking-dog"
                value={dogId}
                onChange={(event) => setDogId(event.target.value)}
                disabled={!isVerified || submitting || uncertain}
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
                <label htmlFor="booking-date" className="text-sm font-semibold text-stone-700">Data</label>
                <input
                  type="date"
                  min={minDate}
                  id="booking-date"
                value={date}
                  onChange={(event) => setDate(event.target.value)}
                  disabled={!isVerified || submitting || uncertain}
                  className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-xl text-sm disabled:bg-stone-50 disabled:text-stone-400"
                />
              </div>

              <div>
                <label htmlFor="booking-time" className="text-sm font-semibold text-stone-700">Ora</label>
                <input
                  type="time"
                  id="booking-time"
                value={time}
                  onChange={(event) => setTime(event.target.value)}
                  disabled={!isVerified || submitting || uncertain}
                  className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-xl text-sm disabled:bg-stone-50 disabled:text-stone-400"
                />
              </div>
            </div>

            <div>
              <label htmlFor="booking-notes" className="text-sm font-semibold text-stone-700">Note</label>
              <textarea
                id="booking-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                disabled={!isVerified || submitting || uncertain}
                rows={3}
                className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-xl text-sm disabled:bg-stone-50 disabled:text-stone-400"
                placeholder="Esigenze del cane, informazioni utili, preferenze..."
              />
            </div>
          </div>
        )}

        {error && <p role="alert" className="text-sm text-rose-600 mt-4">{error}</p>}
        {uncertain && <button type="button" onClick={() => { onClose(); navigate('/owner/bookings'); }} className="mt-3 font-semibold underline">Controlla le prenotazioni</button>}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => { if (!inFlight.current) onClose(); }}
            disabled={submitting}
            className="flex-1 py-2.5 border border-stone-300 rounded-xl font-semibold"
          >
            Annulla
          </button>

          <button
            type="button"
            onClick={submit}
            disabled={
              submitting || uncertain ||
              !isVerified ||
              services.length === 0 ||
              dogs.length === 0
            }
            className="flex-1 py-2.5 bg-[var(--pc-forest-900)] text-white rounded-xl font-semibold hover:bg-[var(--pc-forest-700)] disabled:opacity-50"
          >
            {submitting ? 'Invio...' : 'Invia richiesta'}
          </button>
        </div>
      </div>
    </dialog>
  );
}
