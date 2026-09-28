import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowRight, BookOpen, Check, ChevronRight, Compass, GraduationCap, Home, MapPin, Search, Trophy, Footprints, Scissors, User, Clock3 } from 'lucide-react';
import { RouteLink } from '../components/RouteLink';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import { cityLabel, loadItalianCities, normalizeCitySearch, type ItalianCity } from '../lib/italianCities';

function HomeProfessionalSearch() {
  const { navigate } = useRouter();
  const [address, setAddress] = useState('');
  const [cities, setCities] = useState<ItalianCity[]>([]);

  useEffect(() => {
    let current = true;
    loadItalianCities().then(data => { if (current) setCities(data); }).catch(() => { /* Free-text search remains available. */ });
    return () => { current = false; };
  }, []);

  const suggestions = useMemo(() => {
    const needle = normalizeCitySearch(address);
    return needle.length < 2 ? [] : cities.filter(city => normalizeCitySearch(cityLabel(city)).includes(needle)).slice(0, 8);
  }, [address, cities]);

  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams({ type: 'trainer' });
    const value = address.trim();
    if (value) {
      params.set('address', value);
      const matches = cities.filter(city => normalizeCitySearch(cityLabel(city)) === normalizeCitySearch(value) || normalizeCitySearch(city.name) === normalizeCitySearch(value));
      if (matches.length === 1) {
        params.set('address', cityLabel(matches[0]));
        params.set('lat', String(matches[0].lat));
        params.set('lng', String(matches[0].lng));
      }
    }
    navigate(`/search?${params}`);
  };

  return (
    <div className="pc-home-search" aria-labelledby="home-search-title">
      <div className="pc-home-search-heading">
        <span className="pc-home-search-icon"><Search size={25} aria-hidden="true" /></span>
        <p>UN PROFESSIONISTA AL TUO FIANCO</p>
        <h2 id="home-search-title">Un aiuto concreto,<br />vicino a te.</h2>
        <p className="pc-home-search-intro">Educazione, passeggiate, vita in casa. Trova un addestratore con cui costruire il vostro percorso.</p>
      </div>
      <form onSubmit={search} className="pc-home-search-form">
        <label htmlFor="home-city">Dove cerchi?<span>Facoltativo</span></label>
        <div className="pc-home-city-field">
          <MapPin size={19} aria-hidden="true" />
          <input id="home-city" name="address" value={address} onChange={event => setAddress(event.target.value)} list="home-city-options" autoComplete="off" placeholder="Città o zona, ad esempio Rimini" />
          <datalist id="home-city-options">{suggestions.map(city => <option key={city.code} value={cityLabel(city)} />)}</datalist>
        </div>
        <button type="submit" className="pc-entry-button pc-entry-primary">Trova un addestratore <ArrowRight size={19} aria-hidden="true" /></button>
        <p className="pc-home-search-note">Esplora i profili senza registrarti.</p>
      </form>
      <div className="pc-home-search-foot"><Check size={16} aria-hidden="true" /> Esperienza, servizi e qualifiche nei profili</div>
    </div>
  );
}

const everydayServices = [
  { type: 'boarding', title: 'Pensioni', icon: Home },
  { type: 'sitter', title: 'Pet sitting', icon: User },
  { type: 'walker', title: 'Passeggiate', icon: Footprints },
  { type: 'groomer', title: 'Toelettatura', icon: Scissors },
];

const starterLessons = [
  { slug: 'bisogni-recupero', number: '01', title: 'Di cosa ha bisogno il tuo cane?', detail: 'Riposo, attività e una giornata equilibrata.', duration: '9 min' },
  { slug: 'routine-sicurezza-autonomia', number: '02', title: 'Una quotidianità che funziona', detail: 'Routine, sicurezza e autonomia, passo dopo passo.', duration: '9 min' },
  { slug: 'osservazione-timing-marker', number: '03', title: 'Come impara un cane', detail: 'Osservazione, clicker e un semplice esercizio di shaping.', duration: '12 min' },
];

function PublicHomePage() {
  return (
    <main className="pc-home" id="main-content">
      <section className="pc-home-hero pc-entry-container" aria-labelledby="home-title">
        <div className="pc-home-introduction">
          <p className="pc-home-eyebrow"><span aria-hidden="true" /> DALLA PARTE DEL VOSTRO BINOMIO</p>
          <h1 id="home-title">Vivere bene,<br /><em>insieme al tuo cane.</em></h1>
          <p className="pc-home-lead">Impara a capirlo, trova il supporto giusto e costruisci una relazione che cresce ogni giorno.</p>
          <p className="pc-home-description">La cultura cinofila di base è gratuita. I professionisti ti aiutano a metterla in pratica nella vostra vita insieme.</p>
          <RouteLink to="/impara" className="pc-entry-button pc-entry-secondary"><BookOpen size={19} aria-hidden="true" /> Inizia a conoscere il cane <ArrowRight size={18} aria-hidden="true" /></RouteLink>
          <span className="pc-home-free-note">Lezioni, attività pratiche e strumenti per osservare.</span>
        </div>
        <HomeProfessionalSearch />
      </section>

      <section className="pc-home-services pc-entry-container" aria-label="Servizi per la vita quotidiana" id="services">
        <div><strong>Un aiuto nella vita quotidiana</strong><span>Trova il servizio di cui hai bisogno.</span></div>
        <div className="pc-home-service-links">
          {everydayServices.map(({ type, title, icon: Icon }) => <RouteLink key={type} to={`/search?type=${type}`}><Icon size={20} aria-hidden="true" /><span>{title}</span><ChevronRight size={15} aria-hidden="true" /></RouteLink>)}
        </div>
      </section>

      <section className="pc-home-learning pc-entry-container" aria-labelledby="home-learning-title">
        <div className="pc-home-lessons">
          <div className="pc-home-section-heading">
            <div><p className="pc-home-eyebrow">IMPARA · GRATUITO E APERTO A TUTTI</p><h2 id="home-learning-title">Capirlo cambia<br />il vostro modo di stare insieme.</h2></div>
          </div>
          <p className="pc-home-section-copy">Parti da una domanda concreta. Ogni lezione unisce spiegazioni semplici, esempi e un’attività da provare.</p>
          <div className="pc-home-lesson-list">
            {starterLessons.map(lesson => <RouteLink key={lesson.slug} to={`/impara/stage-1/${lesson.slug}`} className="pc-home-lesson">
              <span className="pc-home-lesson-number" aria-hidden="true">{lesson.number}</span>
              <span className="pc-home-lesson-text"><strong>{lesson.title}</strong><span>{lesson.detail}</span></span>
              <span className="pc-home-lesson-duration"><Clock3 size={13} aria-hidden="true" />{lesson.duration}</span><ArrowRight size={18} aria-hidden="true" />
            </RouteLink>)}
          </div>
          <RouteLink to="/impara" className="pc-entry-text-link">Scopri tutto il percorso Impara <ArrowRight size={17} aria-hidden="true" /></RouteLink>
        </div>
        <aside className="pc-home-before" aria-labelledby="home-before-title">
          <Compass size={32} strokeWidth={1.5} aria-hidden="true" />
          <p className="pc-home-eyebrow">PRIMA DI PRENDERE UN CANE</p>
          <h2 id="home-before-title">Il vostro percorso<br />inizia dalla scelta.</h2>
          <p>Tempo, abitudini, spazi e aspettative: parti dalla tua vita per capire quale cane potresti accogliere.</p>
          <ul><li><Check size={16} aria-hidden="true" /> Rifletti sulla tua quotidianità</li><li><Check size={16} aria-hidden="true" /> Conosci bisogni e differenze</li><li><Check size={16} aria-hidden="true" /> Preparati al confronto con un professionista</li></ul>
          <RouteLink to="/prima-del-cane" className="pc-entry-button pc-entry-secondary">Prepara la tua scelta <ArrowRight size={17} aria-hidden="true" /></RouteLink>
        </aside>
      </section>

      <section className="pc-home-specialists pc-entry-container" aria-label="Percorsi sportivi e area professionisti">
        <div className="pc-home-sport" aria-labelledby="home-sport-title">
          <div className="pc-home-sport-label"><Trophy size={21} aria-hidden="true" /><span>UN’AREA DEDICATA ALLO SPORT</span></div>
          <h2 id="home-sport-title">Una passione.<br />Una disciplina. Un binomio.</h2>
          <p>Obedience, Agility, IGP e altre discipline: cerca un addestratore per lo sport che vuoi praticare insieme al tuo cane.</p>
          <RouteLink to="/sport" className="pc-entry-button pc-entry-inverse">Esplora gli sport cinofili <ArrowRight size={18} aria-hidden="true" /></RouteLink>
        </div>
        <div className="pc-home-pro" aria-labelledby="home-pro-title">
          <GraduationCap size={31} strokeWidth={1.5} aria-hidden="true" />
          <p className="pc-home-eyebrow">PER I PROFESSIONISTI</p>
          <h2 id="home-pro-title">Il tuo lavoro,<br />con la continuità che merita.</h2>
          <p>Presenta le tue competenze. Gestisci richieste, appuntamenti e percorsi con i cani che segui, in un’unica area.</p>
          <RouteLink to="/become-a-pro" className="pc-entry-text-link">Scopri l’area professionisti <ArrowRight size={18} aria-hidden="true" /></RouteLink>
        </div>
      </section>
    </main>
  );
}

// Returning users keep their existing direct access to the operational area.
export function HomePage() {
  const { user, profile, loading } = useAuth();
  const { navigate } = useRouter();
  useEffect(() => {
    if (loading || !user || !profile?.role) return;
    navigate(profile.role === 'professional' ? '/pro' : profile.role === 'admin' ? '/admin' : '/owner');
  }, [loading, user, profile?.role, navigate]);

  if (loading || user) return <div className="min-h-[calc(100vh-4rem)] bg-[var(--pc-bone-50)] flex items-center justify-center px-6"><div className="text-center max-w-md" role="status"><div className="mx-auto w-10 h-10 rounded-full border-2 border-[var(--pc-line)] border-t-[var(--pc-forest-900)] animate-spin" /><p className="mt-4 font-semibold text-[var(--pc-ink-950)]">Apro la tua area…</p></div></div>;
  return <PublicHomePage />;
}
