import { continuityEnabled } from '../../lib/continuity';
import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Calendar,
  Dog as DogIcon,
  Mail,
  Phone,
  Plus,
  Search,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { useRouter } from '../../lib/RouterContext';
import { SearchCard } from '../../components/SearchCard';
import { VerificationModal } from '../../components/VerificationModal';
import type { Dog, Booking } from '../../lib/types';
import { DogPhoto } from '../../components/DogPhoto';

export function OwnerDashboard() {
  const { profile, user } = useAuth();
  const { navigate } = useRouter();
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
  const [nextBooking, setNextBooking] = useState<Booking | null>(null);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [dogsError, setDogsError] = useState(false);
  const [recentError, setRecentError] = useState(false);
  const [upcomingError, setUpcomingError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [verifying, setVerifying] = useState<'email' | 'phone' | null>(null);
  const userId = user?.id;

  useEffect(() => {
    let active = true;
    setDogs([]);
    setRecentBookings([]);
    setNextBooking(null);
    setUpcomingCount(0);
    setDogsError(false);
    setRecentError(false);
    setUpcomingError(false);
    setLoading(Boolean(userId));
    if (!userId) return;

    (async () => {
      const now = new Date().toISOString();
      try {
        const [dogsResult, recentResult, upcomingResult] = await Promise.allSettled([
          supabase.from('dogs').select('*').eq('owner_id', userId)
            .order('created_at', { ascending: false }),
          supabase.from('bookings').select('*').eq('owner_id', userId)
            .lte('start_at', now).order('start_at', { ascending: false }).limit(4),
          supabase.from('bookings').select('*', { count: 'exact' })
            .eq('owner_id', userId).eq('status', 'accepted')
            .gt('start_at', now).order('start_at', { ascending: true }).limit(1),
        ]);
        if (!active) return;

        if (dogsResult.status === 'fulfilled' && !dogsResult.value.error) {
          setDogs((dogsResult.value.data as Dog[]) || []);
        } else {
          setDogsError(true);
        }
        if (recentResult.status === 'fulfilled' && !recentResult.value.error) {
          setRecentBookings((recentResult.value.data as Booking[]) || []);
        } else {
          setRecentError(true);
        }
        if (upcomingResult.status === 'fulfilled' && !upcomingResult.value.error
          && upcomingResult.value.count !== null) {
          setNextBooking((upcomingResult.value.data as Booking[] | null)?.[0] ?? null);
          setUpcomingCount(upcomingResult.value.count);
        } else {
          setUpcomingError(true);
        }
      } catch {
        if (!active) return;
        setDogsError(true);
        setRecentError(true);
        setUpcomingError(true);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => { active = false; };
  }, [userId, reloadKey]);

  const firstName = profile?.full_name?.trim().split(/\s+/)[0] || '';
  const needsEmailVerification = !profile?.email_verified;
  const needsPhoneVerification = !profile?.phone_verified;
  const accountNeedsAttention =
    needsEmailVerification || needsPhoneVerification;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--pc-bone-50)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-10">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-7">
          <div>
            <p className="pc-kicker">La tua area</p>
            <h1 className="pc-display text-4xl md:text-5xl font-semibold mt-2 text-[var(--pc-ink-950)]">
              {firstName ? `Ciao, ${firstName}.` : 'Ciao.'}
            </h1>
            <p className="text-[var(--pc-muted-600)] text-lg mt-3 max-w-2xl">
              Cerca un professionista, gestisci i tuoi cani e riprendi da dove
              avevi lasciato.
            </p>
          </div>

          {!loading && !upcomingError && nextBooking && (
            <button
              type="button"
              onClick={() => navigate('/owner/bookings')}
              className="pc-card px-5 py-4 text-left min-w-[250px] hover:border-[var(--pc-forest-700)] transition"
            >
              <div className="text-xs uppercase tracking-[0.12em] font-extrabold text-[var(--pc-muted-600)]">
                Prossimo impegno
              </div>
              <div className="font-bold text-[var(--pc-ink-950)] mt-1">
                {formatBookingDate(nextBooking.start_at)}
              </div>
              <div className="text-sm text-[var(--pc-forest-700)] font-semibold mt-1">
                Vedi prenotazioni →
              </div>
            </button>
          )}
        </header>

        <section aria-labelledby="owner-search-title">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-5 h-5 text-[var(--pc-forest-700)]" />
            <h2
              id="owner-search-title"
              className="font-bold text-[var(--pc-ink-950)]"
            >
              Trova subito ciò che ti serve
            </h2>
          </div>
          {continuityEnabled && profile?.role === 'owner' && <button onClick={() => navigate('/owner/relationships')} className="mb-4 rounded-xl bg-emerald-700 px-5 py-3 text-white font-semibold">Professionisti dei tuoi cani</button>}
          <SearchCard />
        </section>

        <section
          aria-label="Azioni rapide"
          className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-6"
        >
          <QuickAction
            icon={<Search className="w-5 h-5" />}
            title="Cerca professionista"
            description="Confronta profili e servizi approvati."
            meta="Ricerca"
            onClick={() => navigate('/search')}
          />
          <QuickAction
            icon={<DogIcon className="w-5 h-5" />}
            title="I miei cani"
            description={
              loading ? 'Caricamento…' : dogsError ? 'Profili non disponibili.' : dogs.length === 0
                ? 'Aggiungi il primo profilo cane.'
                : `${dogs.length} ${dogs.length === 1 ? 'cane' : 'cani'} nel tuo profilo.`
            }
            meta={!loading && !dogsError && dogs.length === 0 ? 'Da iniziare' : 'Gestisci'}
            onClick={() => navigate('/owner/dogs')}
          />
          <QuickAction
            icon={<Calendar className="w-5 h-5" />}
            title="Prenotazioni"
            description={
              loading ? 'Caricamento…' : upcomingError ? 'Impegni non disponibili.' : upcomingCount === 0
                ? 'Nessun impegno accettato in programma. Vedi anche le richieste.'
                : `${upcomingCount} ${upcomingCount === 1 ? 'impegno accettato' : 'impegni accettati'} in programma.`
            }
            meta="Apri"
            onClick={() => navigate('/owner/bookings')}
          />
          <QuickAction
            icon={<BookOpen className="w-5 h-5" />}
            title="Continua Impara"
            description="Torna alle lezioni e alle attività pratiche."
            meta="Riprendi"
            onClick={() => navigate('/impara')}
          />
        </section>

        {!loading && upcomingError && (
          <div className="mt-4">
            <LoadError text="Non siamo riusciti a caricare i prossimi impegni." onRetry={() => setReloadKey((key) => key + 1)} />
          </div>
        )}

        <div className="grid lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)] gap-6 mt-8">
          <section className="pc-card p-5 md:p-6">
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className="pc-kicker">I tuoi cani</p>
                <h2 className="pc-display text-2xl font-semibold mt-1">
                  Profili cane
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/owner/dogs')}
                className="inline-flex items-center gap-2 text-sm font-bold text-[var(--pc-forest-700)] hover:text-[var(--pc-forest-900)]"
              >
                <Plus className="w-4 h-4" />
                {!loading && !dogsError && dogs.length === 0 ? 'Aggiungi cane' : 'Gestisci'}
              </button>
            </div>

            {loading ? (
              <div className="text-[var(--pc-muted-600)] text-sm py-8">
                Caricamento…
              </div>
            ) : dogsError ? (
              <LoadError text="Non siamo riusciti a caricare i tuoi cani." onRetry={() => setReloadKey((key) => key + 1)} />
            ) : dogs.length === 0 ? (
              <EmptyState
                text="Aggiungi il tuo cane per collegare richieste, prenotazioni e informazioni utili a un profilo stabile."
                action="Aggiungi il primo cane"
                onClick={() => navigate('/owner/dogs')}
              />
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {dogs.slice(0, 4).map((dog) => (
                  <button
                    type="button"
                    key={dog.id}
                    onClick={() => navigate(`/owner/dogs/${dog.id}`)}
                    className="text-left flex items-center gap-4 p-3 rounded-2xl border border-[var(--pc-line)] bg-[var(--pc-paper)] hover:border-[var(--pc-forest-700)] transition"
                  >
                    <DogPhoto
                      photoPath={dog.photo_url}
                      fallbackUrl="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=200"
                      alt={dog.name}
                      className="w-16 h-16 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="font-bold text-[var(--pc-ink-950)] truncate">
                        {dog.name}
                      </div>
                      <div className="text-sm text-[var(--pc-muted-600)] truncate mt-0.5">
                        {dog.breed || 'Razza non indicata'}
                      </div>
                      <div className="text-xs text-[var(--pc-muted-600)] mt-1">
                        {formatDogAge(dog.birth_date, dog.age)}
                        {typeof dog.weight === 'number' && dog.weight > 0
                          ? ` · ${dog.weight} kg`
                          : ''}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>

          <aside className="pc-card p-5 md:p-6">
            <p className="pc-kicker">
              {accountNeedsAttention ? 'Da completare' : 'Account'}
            </p>
            <h2 className="pc-display text-2xl font-semibold mt-1">
              {accountNeedsAttention ? 'Proteggi il tuo account' : 'Account verificato'}
            </h2>

            <div className="mt-5 divide-y divide-[var(--pc-line)]">
              <VerifyRow
                icon={<Mail className="w-4 h-4" />}
                label="Email"
                verified={profile?.email_verified || false}
                value={profile?.email || ''}
                onVerify={() => setVerifying('email')}
              />
              <VerifyRow
                icon={<Phone className="w-4 h-4" />}
                label="Telefono"
                verified={profile?.phone_verified || false}
                value={profile?.phone || ''}
                onVerify={() => setVerifying('phone')}
              />
            </div>

            <p className="text-sm leading-6 text-[var(--pc-muted-600)] mt-5">
              Le verifiche servono per le azioni che coinvolgono altre persone,
              come richieste e prenotazioni.
            </p>
          </aside>
        </div>

        <section className="pc-card p-5 md:p-6 mt-6">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <p className="pc-kicker">Attività</p>
              <h2 className="pc-display text-2xl font-semibold mt-1">
                Prenotazioni passate
              </h2>
            </div>
            <button
              type="button"
              onClick={() => navigate('/owner/bookings')}
              className="text-sm font-bold text-[var(--pc-forest-700)] hover:text-[var(--pc-forest-900)]"
            >
              Vedi tutte
            </button>
          </div>

          {loading ? (
            <div className="text-[var(--pc-muted-600)] text-sm py-6">
              Caricamento…
            </div>
          ) : recentError ? (
            <LoadError text="Non siamo riusciti a caricare le prenotazioni passate." onRetry={() => setReloadKey((key) => key + 1)} />
          ) : recentBookings.length === 0 ? (
            <EmptyState
              text="Non hai prenotazioni passate. Puoi consultare richieste e appuntamenti in programma in “Vedi tutte”."
              action="Cerca professionista"
              onClick={() => navigate('/search')}
            />
          ) : (
            <div className="divide-y divide-[var(--pc-line)]">
              {recentBookings.map((booking) => (
                <button
                  type="button"
                  key={booking.id}
                  onClick={() => navigate('/owner/bookings')}
                  className="w-full text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 first:pt-0 last:pb-0"
                >
                  <div>
                    <div className="font-bold text-[var(--pc-ink-950)]">
                      {formatBookingDate(booking.start_at)}
                    </div>
                    <div className="text-sm text-[var(--pc-muted-600)] mt-1">
                      {typeof booking.price === 'number' && booking.price > 0
                        ? `${booking.price.toLocaleString('it-IT', {
                            style: 'currency',
                            currency: 'EUR',
                          })}`
                        : 'Prezzo da confermare'}
                      {booking.notes ? ` · ${booking.notes}` : ''}
                    </div>
                  </div>

                  <StatusBadge status={booking.status} />
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {verifying && (
        <VerificationModal
          type={verifying}
          target={
            verifying === 'email'
              ? profile?.email || ''
              : profile?.phone || ''
          }
          onClose={() => setVerifying(null)}
          onVerified={() => setVerifying(null)}
        />
      )}
    </div>
  );
}

function LoadError({ text, onRetry }: { text: string; onRetry: () => void }) {
  return (
    <div role="alert" className="rounded-2xl border border-[var(--pc-line)] bg-[var(--pc-paper)] p-4">
      <p className="text-sm text-[var(--pc-ink-950)]">{text}</p>
      <button type="button" onClick={onRetry} className="mt-3 text-sm font-bold text-[var(--pc-forest-700)] underline">
        Riprova
      </button>
    </div>
  );
}

function QuickAction({
  icon,
  title,
  description,
  meta,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  meta: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="pc-card p-5 text-left group hover:border-[var(--pc-forest-700)] transition"
    >
      <div className="w-10 h-10 rounded-full bg-[var(--pc-forest-100)] text-[var(--pc-forest-900)] flex items-center justify-center">
        {icon}
      </div>
      <h3 className="font-bold text-[var(--pc-ink-950)] mt-4">{title}</h3>
      <p className="text-sm leading-6 text-[var(--pc-muted-600)] mt-1 min-h-[3rem]">
        {description}
      </p>
      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[var(--pc-forest-700)] mt-4">
        {meta}
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </span>
    </button>
  );
}

function formatBookingDate(value: string) {
  const date = new Date(value);

  return date.toLocaleString('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatDogAge(
  birthDate: string | null | undefined,
  fallbackAge: number
) {
  if (!birthDate) {
    return fallbackAge > 0
      ? `${fallbackAge} ${fallbackAge === 1 ? 'anno' : 'anni'}`
      : 'Età non indicata';
  }

  const [year, month, day] = birthDate.split('-').map(Number);
  const today = new Date();

  let totalMonths =
    (today.getFullYear() - year) * 12 +
    (today.getMonth() + 1 - month);

  if (today.getDate() < day) totalMonths -= 1;
  if (totalMonths < 0) return 'Data non valida';

  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;

  if (years === 0) return `${months} ${months === 1 ? 'mese' : 'mesi'}`;
  if (months === 0) return `${years} ${years === 1 ? 'anno' : 'anni'}`;

  return `${years} ${years === 1 ? 'anno' : 'anni'} e ${months} ${
    months === 1 ? 'mese' : 'mesi'
  }`;
}

function VerifyRow({
  icon,
  label,
  verified,
  value,
  onVerify,
}: {
  icon: React.ReactNode;
  label: string;
  verified: boolean;
  value: string;
  onVerify: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="text-[var(--pc-muted-600)] shrink-0">{icon}</div>
        <div className="min-w-0">
          <div className="font-bold text-sm text-[var(--pc-ink-950)]">
            {label}
          </div>
          <div className="text-xs text-[var(--pc-muted-600)] truncate mt-0.5">
            {value || 'Non impostato'}
          </div>
        </div>
      </div>

      {verified ? (
        <span className="text-xs bg-[var(--pc-forest-100)] text-[var(--pc-forest-900)] px-2.5 py-1 rounded-full flex items-center gap-1 font-bold shrink-0">
          <BadgeCheck className="w-3.5 h-3.5" />
          {label === 'Telefono' ? 'Verificato' : 'Verificata'}
        </span>
      ) : (
        <button
          type="button"
          onClick={onVerify}
          disabled={!value}
          className="text-xs border border-[var(--pc-line)] bg-[var(--pc-paper)] text-[var(--pc-forest-900)] hover:border-[var(--pc-forest-700)] px-3 py-1.5 rounded-full font-bold disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
        >
          Verifica
        </button>
      )}
    </div>
  );
}

function EmptyState({
  text,
  action,
  onClick,
}: {
  text: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--pc-line)] bg-[var(--pc-bone-50)] px-5 py-8 text-center">
      <p className="text-[var(--pc-muted-600)] text-sm leading-6 max-w-xl mx-auto">
        {text}
      </p>
      <button
        type="button"
        onClick={onClick}
        className="mt-4 inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-[var(--pc-forest-900)] text-white text-sm font-bold hover:bg-[var(--pc-forest-700)] transition"
      >
        {action}
      </button>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending:
      'bg-[var(--pc-ochre-100,#F5EACB)] text-[var(--pc-ochre-900)]',
    accepted:
      'bg-[var(--pc-evidence-100)] text-[var(--pc-evidence-700)]',
    completed:
      'bg-[var(--pc-forest-100)] text-[var(--pc-forest-900)]',
    cancelled: 'bg-stone-100 text-stone-600',
    declined: 'bg-[var(--pc-danger-100)] text-[var(--pc-danger-700)]',
  };

  const labels: Record<string, string> = {
    pending: 'In attesa',
    accepted: 'Accettata',
    completed: 'Completata',
    cancelled: 'Annullata',
    declined: 'Rifiutata',
  };

  return (
    <span
      className={`text-xs px-2.5 py-1 rounded-full font-bold shrink-0 ${
        styles[status] || 'bg-stone-100 text-stone-600'
      }`}
    >
      {labels[status] || status}
    </span>
  );
}
