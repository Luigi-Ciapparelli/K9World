import { useEffect, useRef, useState, type FormEvent } from 'react';
import { BookOpen, MapPin, Search } from 'lucide-react';
import { RouteLink } from '../components/RouteLink';
import { AccountProfileRecovery } from '../components/AccountProfileRecovery';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import { cityLabel, loadItalianCities, normalizeCitySearch, type ItalianCity } from '../lib/italianCities';
import '../portal-home.css';

const beforeDogHelp = '/search?type=trainer&source=home&topic=scelta-responsabile&intent=choose-dog';
const readings = [
  { slug: 'guinzaglio-morbido', context: 'In passeggiata', title: 'Due passi con il guinzaglio morbido' },
  { slug: 'rispondere-al-nome', context: 'Con il cucciolo', title: 'Quando sente il suo nome' },
  { slug: 'riposo-sul-tappeto', context: 'In casa', title: 'Riposare sul tappetino' },
];

function NearbySearch() {
  const { navigate } = useRouter();
  const [zone, setZone] = useState('');
  const [cities, setCities] = useState<ItalianCity[]>([]);
  const requested = useRef(false);
  const needle = normalizeCitySearch(zone);
  const choices = needle.length < 2 ? [] : cities.filter(c => normalizeCitySearch(cityLabel(c)).startsWith(needle)).slice(0, 8);
  const changeZone = (value: string) => {
    setZone(value);
    if (value.trim().length < 2 || requested.current) return;
    requested.current = true;
    // Suggestions are optional. The regular GET form and text search also work without them.
    void loadItalianCities().then(setCities, () => { requested.current = false; });
  };
  const search = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const button = (event.nativeEvent as SubmitEvent).submitter;
    const query = new URLSearchParams({ type: button instanceof HTMLButtonElement && button.value === 'boarding' ? 'boarding' : 'trainer' });
    const place = zone.trim();
    if (place) {
      query.set('address', place);
      const exact = cities.filter(c => normalizeCitySearch(c.name) === needle || normalizeCitySearch(cityLabel(c)) === needle);
      if (exact.length === 1) { query.set('lat', String(exact[0].lat)); query.set('lng', String(exact[0].lng)); }
    }
    navigate('/search?' + query.toString());
  };
  return <form action="/search" method="get" role="search" aria-label="Aiuto per il cane nella tua zona" className="pc-nearby" onSubmit={search}>
    <label htmlFor="home-comune">Il tuo comune <span>(facoltativo)</span></label>
    <div className="pc-nearby-line">
      <div className="pc-city-input"><MapPin size={19} aria-hidden="true" /><input id="home-comune" name="address" type="text" maxLength={120} list="home-comuni" placeholder="Es. Rimini" value={zone} onChange={e => changeZone(e.target.value)} autoComplete="off" /></div>
      <datalist id="home-comuni">{choices.map(c => <option key={c.code} value={cityLabel(c)} />)}</datalist>
      <button type="submit" name="type" value="trainer" className="pc-find-trainer"><Search size={18} aria-hidden="true" />Cerca un addestratore</button>
    </div>
    <div className="pc-nearby-alternatives"><button type="submit" name="type" value="boarding">Cerca una pensione</button><RouteLink to="/impara">Leggi le lezioni gratuite</RouteLink></div>
  </form>;
}

function PublicHomePage() {
  return <main className="pc-landing" id="main-content">
    <section className="pc-landing-hero pc-entry-container" aria-labelledby="home-title">
      <div className="pc-landing-intro">
        <p className="pc-landing-kicker">Educazione e vita con il cane</p>
        <h1 id="home-title">Conosci il tuo cane. <em>Trova chi ti aiuta.</em></h1>
        <p className="pc-landing-lead">Impara a leggere i suoi segnali e prova un esercizio a casa. Se vi serve una mano, cerca un educatore o un addestratore vicino a te.</p>
        <NearbySearch />
      </div>
      <figure className="pc-landing-cover">
        <RouteLink to="/impara/esercizi/piattaforma-shaping" aria-label="Leggi l’esercizio: Due zampe sulla piattaforma">
          <img src="/media/home/training-768.webp" srcSet="/media/home/training-768.webp 768w, /media/home/training-1280.webp 1280w" sizes="(max-width: 760px) calc(100vw - 36px), (max-width: 1350px) 46vw, 580px" width={1280} height={853} alt="Scena illustrativa: un cane appoggia le zampe anteriori su una pedana accanto a una persona accovacciata." decoding="async" {...{ fetchpriority: 'high' }} />
          <div className="pc-landing-cover-caption"><span><span className="pc-cover-label">Dal campo a casa</span><strong>Due zampe sulla piattaforma</strong><span className="pc-cover-read">Leggi l’esercizio</span></span><BookOpen aria-hidden="true" size={26} strokeWidth={1.6} /></div>
        </RouteLink>
      </figure>
    </section>
    <div className="pc-landing-library pc-entry-container">
      <section className="pc-field-reading" aria-labelledby="field-title">
        <p className="pc-landing-kicker">Il quaderno di Impara</p><h2 id="field-title">Da provare insieme.</h2>
        <p className="pc-section-lead">Una scheda alla volta, con istruzioni gratuite da portare al campo o provare a casa.</p>
        <ul>{readings.map(item => <li key={item.slug}><RouteLink to={'/impara/esercizi/' + item.slug}><small>{item.context}</small><span>{item.title}</span><BookOpen aria-hidden="true" size={18} strokeWidth={1.6} /></RouteLink></li>)}</ul>
        <RouteLink className="pc-text-link" to="/impara/esercizi">Tutti gli esercizi</RouteLink>
      </section>
      <section className="pc-before-dog" aria-labelledby="before-title">
        <img src="/media/home/portal-static-640.webp" width={640} height={427} loading="lazy" decoding="async" alt="" />
        <div><p className="pc-landing-kicker">Prima del cane</p><h2 id="before-title">Stai pensando di prendere un cane?</h2>
          <p>Parti dal tempo, dagli spazi e dalle abitudini della tua famiglia. Il test gratuito ti aiuta a capire cosa considerare prima della scelta.</p>
          <RouteLink to="/prima-del-cane" className="pc-choice-link">Fai il test di scelta</RouteLink>
          <RouteLink to={beforeDogHelp} className="pc-text-link">Parlane con un addestratore</RouteLink>
        </div>
      </section>
    </div>
  </main>;
}

export function HomePage() {
  const { user, profile, loading } = useAuth();
  const { navigate } = useRouter();
  useEffect(() => {
    if (loading || !user || !profile?.role) return;
    navigate(profile.role === 'professional' ? '/pro' : profile.role === 'admin' ? '/admin' : '/owner');
  }, [loading, user, profile?.role, navigate]);
  if (!user) return <PublicHomePage />;
  if (!loading && !profile) return <AccountProfileRecovery key={user.id} />;
  return <main className="pc-entry-container py-12" aria-busy="true"><p role="status">Apro la tua area…</p></main>;
}
