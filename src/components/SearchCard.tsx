import { useEffect, useMemo, useRef, useState, type Ref } from 'react';
import '../discovery.css';
import {
  Home,
  Check,
  Award,
  MapPin,
  Search,
  Scissors,
  GraduationCap,
  Navigation,
} from 'lucide-react';
import { readTrainingFocus, TRAINING_ACTIVITIES, type TrainingFocus } from '../lib/trainerSpecializations';
import { useSportDisciplines } from '../lib/sportSearch';
import { useRouter } from '../lib/RouterContext';
import { cityLabel, loadItalianCities, normalizeCitySearch, type ItalianCity } from '../lib/italianCities';
import type { ServiceCategoryType } from '../lib/serviceCategories';

const dailyServices: Array<{ id: ServiceCategoryType; label: string; icon: typeof Home }> = [
  { id: 'trainer', label: 'Addestratori', icon: GraduationCap },
  { id: 'boarding', label: 'Pensioni', icon: Home },
];
const exhibitionServices: typeof dailyServices = [
  { id: 'groomer', label: 'Toelettatura', icon: Scissors },
  { id: 'handler', label: 'Handler per esposizioni', icon: Award },
];

// ECOSYSTEM_PASS_V1
export function SearchCard({ compact = false, sport = false, exhibitions = false, cityInputRef }: { compact?: boolean; sport?: boolean; exhibitions?: boolean; cityInputRef?: Ref<HTMLInputElement> }) {
  const services = exhibitions ? exhibitionServices : dailyServices;
  const catalog = useSportDisciplines(sport);
  const [discipline, setDiscipline] = useState('');
  const [trainingFocus, setTrainingFocus] = useState<TrainingFocus>('companion');
  const { path, navigate } = useRouter();
  const [service, setServizio] = useState<ServiceCategoryType>(exhibitions ? 'groomer' : 'trainer');
  const [address, setAddress] = useState('');
  const geoRequest = useRef<symbol | null>(null);
  const [locationMessage, setLocationMessage] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [cities, setCities] = useState<ItalianCity[]>([]);
  const [selectedCity, setSelectedCity] = useState<ItalianCity | null>(null);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const params = path.includes('?')
      ? new URLSearchParams(path.split('?')[1])
      : new URLSearchParams();

    const type = params.get('type');
    const nextAddress = params.get('address') || '';
    const lat = Number(params.get('lat'));
    const lng = Number(params.get('lng'));
    const hasCoords =
      params.get('lat') !== null &&
      params.get('lng') !== null &&
      Number.isFinite(lat) &&
      Number.isFinite(lng);

    setServizio(sport ? 'trainer' : type ? type as ServiceCategoryType : exhibitions ? 'groomer' : 'trainer');
    setDiscipline(params.get('discipline') || '');
    setTrainingFocus(readTrainingFocus(params.get('training')) || 'companion');
    setAddress(nextAddress);
    setSelectedCity(null);
    setGpsCoords(hasCoords ? { lat, lng } : null);
    setLocationAccuracy(null);
    setLocationMessage(''); setLocationLoading(false);
    return () => { geoRequest.current = null; };
  }, [path, sport, exhibitions]);

  useEffect(() => {
    let active = true;

    loadItalianCities()
      .then((data) => {
        if (active) setCities(data);
      })
      .catch((error) => {
        console.error('Errore caricamento comuni italiani:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  const suggestions = useMemo(() => {
    const needle = normalizeCitySearch(address);

    if (needle.length < 2 || selectedCity || gpsCoords) return [];

    return cities
      .filter((city) =>
        normalizeCitySearch(
          `${city.name} ${city.province} ${city.region}`
        ).includes(needle)
      )
      .sort((a, b) => {
        const aStarts = normalizeCitySearch(a.name).startsWith(needle);
        const bStarts = normalizeCitySearch(b.name).startsWith(needle);

        if (aStarts !== bStarts) return aStarts ? -1 : 1;
        return a.name.localeCompare(b.name, 'it');
      })
      .slice(0, 8);
  }, [address, cities, selectedCity, gpsCoords]);

  const handleCerca = (focusOverride?: TrainingFocus) => {
    let city = selectedCity;

    if (!city && address.trim()) {
      const needle = normalizeCitySearch(address);

      city =
        cities.find(
          (candidate) =>
            normalizeCitySearch(cityLabel(candidate)) === needle ||
            normalizeCitySearch(candidate.name) === needle
        ) || null;
    }

    const coords =
      gpsCoords ||
      (city ? { lat: city.lat, lng: city.lng } : null);

    const params = new URLSearchParams({
      type: sport || focusOverride ? 'trainer' : service,
      address,
    });

    const currentParams = path.includes('?')
      ? new URLSearchParams(path.split('?')[1])
      : new URLSearchParams();
    ['source', 'topic', 'intent'].forEach((key) => {
      const value = currentParams.get(key);
      if (value) params.set(key, value);
    });

    if (coords) {
      params.set('lat', String(coords.lat));
      params.set('lng', String(coords.lng));
    }

    if (!sport && !exhibitions && (focusOverride || service === 'trainer')) {
      const focus = focusOverride || trainingFocus;
      if (focus !== 'companion') params.set('training', focus);
    }
    if (sport && discipline) params.set('discipline', discipline);
    if (sport) params.set('context', 'sport');
    if (exhibitions) params.set('context', 'exhibitions');
    navigate(`${sport ? '/sport' : exhibitions ? '/esposizioni' : '/search'}?${params.toString()}`);
  };

  const handleUseLocation = () => {
    const sequence = Symbol(); geoRequest.current = sequence;
    if (!navigator.geolocation) {
      setLocationMessage('La posizione non è disponibile. Puoi scrivere il comune.'); return;
    }
    setLocationLoading(true); setLocationMessage(''); setLocationAccuracy(null);
    navigator.geolocation.getCurrentPosition(pos => {
      if (sequence !== geoRequest.current) return;
      const squaredDistance = (c: ItalianCity) => (c.lat - pos.coords.latitude) ** 2 + (c.lng - pos.coords.longitude) ** 2;
      const nearest = cities.length ? cities.reduce((best, c) => squaredDistance(c) < squaredDistance(best) ? c : best) : null;
      setGpsCoords({lat: pos.coords.latitude, lng: pos.coords.longitude});
      setSelectedCity(null); setAddress(nearest ? cityLabel(nearest) : 'Posizione attuale');
      setLocationLoading(false); setLocationAccuracy(pos.coords.accuracy);
    }, () => {
      if (sequence !== geoRequest.current) return;
      setLocationLoading(false); setLocationMessage('Posizione non disponibile. Inserisci il comune e premi Cerca.');
    }, {enableHighAccuracy: true, maximumAge: 0, timeout: 10000});
  };

  return (
    <form role="search" aria-label={sport ? 'Ricerca per disciplina' : exhibitions ? 'Ricerca per esposizioni' : 'Ricerca di aiuto per il cane'}
      onSubmit={e => {e.preventDefault(); handleCerca();}} className={`pc-card pc-discovery-search ${compact ? 'p-4 md:p-5' : 'p-5 md:p-6'}`}>
      {sport ? <div className="mb-4">
        <label htmlFor="sport-discipline" className="block text-sm font-bold mb-2">Disciplina sportiva</label>
        {catalog.error ? <div role="alert"><p>{catalog.error}</p><button type="button" className="underline mt-2" onClick={catalog.retry}>Riprova</button></div>
          : <select id="sport-discipline" value={discipline} disabled={catalog.loading}
              onChange={e => setDiscipline(e.target.value)} className="w-full rounded-xl border border-[var(--pc-line)] bg-[var(--pc-paper)] p-3 text-[var(--pc-ink-950)]">
              <option value="">{catalog.loading ? 'Caricamento discipline…' : 'Tutte le discipline'}</option>
              {discipline && !catalog.loading && !catalog.disciplines.some(d => d.id === discipline) && <option value={discipline}>Disciplina non disponibile</option>}
              {catalog.disciplines.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>}
        {catalog.disciplines.find(d => d.id === discipline)?.description && <p className="mt-2 text-sm text-[var(--pc-muted-600)]">{catalog.disciplines.find(d => d.id === discipline)?.description}</p>}
      </div> : <>
      <p className="text-sm font-bold text-[var(--pc-ink-950)] mb-2">
        Servizio
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        {services.map((s) => {
          const Icon = s.icon;
          const active = service === s.id;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => { setServizio(s.id); setTrainingFocus('companion'); }}
              aria-pressed={active}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 transition ${
                active
                  ? 'border-[var(--pc-forest-700)] bg-[var(--pc-forest-100)] text-[var(--pc-forest-900)]'
                  : 'border-[var(--pc-line)] hover:border-[var(--pc-forest-700)] text-[var(--pc-ink-800)]'
              }`}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="inline-flex items-center gap-1 text-sm font-semibold">{active && <Check size={15} aria-hidden="true"/>}{s.label}</span>
            </button>
          );
        })}
      </div>

      </>}

      {!sport && !exhibitions && service === 'trainer' && trainingFocus !== 'companion' && <div className="mb-4">
        <p className="font-semibold">{TRAINING_ACTIVITIES.find(item => item.id === trainingFocus)?.label}</p>
        <button type="button" onClick={() => handleCerca('companion')} className="text-sm underline min-h-[44px] text-[var(--pc-forest-700)]">Torna all’educazione quotidiana</button>
      </div>}
      <label htmlFor="search-address" className="pc-search-city-label">Città o zona <span>(facoltativa)</span></label>
      <div className="pc-search-fields">
        <div className="pc-search-city-group">
          <div className="pc-search-city-field"><MapPin aria-hidden="true" size={18}/>
            <input id="search-address" ref={cityInputRef} name="address" type="text" autoComplete="off"
              placeholder="Es. Polignano a Mare" value={address} maxLength={120}
              onChange={e => {geoRequest.current = null;setAddress(e.target.value);setSelectedCity(null);setGpsCoords(null);setLocationLoading(false);setLocationAccuracy(null);setLocationMessage('');}} />
          </div>
          {suggestions.length > 0 && <div className="pc-city-options" aria-label="Comuni suggeriti">
            {suggestions.map(city => <button key={city.code} type="button"
              onClick={() => {setAddress(cityLabel(city));setSelectedCity(city);setGpsCoords(null);}}>
              <strong>{city.name}</strong> <span>({city.province}) · {city.region}</span>
            </button>)}
          </div>}
        </div>
        <button type="submit" className="pc-btn pc-btn-primary pc-search-submit"><Search size={18} aria-hidden="true" />{sport ? 'Trova addestratore per disciplina' : 'Cerca'}</button>
      </div>
      <div className="pc-search-position">
        <button type="button" onClick={handleUseLocation} disabled={locationLoading}><Navigation size={15} aria-hidden="true"/>Usa la mia posizione</button>
        <span aria-live="polite">{locationLoading ? 'Rilevamento in corso…' : locationAccuracy !== null ? `Posizione rilevata (±${Math.round(locationAccuracy)} m).` : locationMessage}</span>
      </div>
      {!sport && !exhibitions && service === 'trainer' && <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--pc-muted-600)]" aria-label="Attività specifiche">
        <span>Cerchi un’attività specifica?</span>
        {TRAINING_ACTIVITIES.filter(item => item.id !== 'companion').map(item => <button key={item.id} type="button"
          aria-pressed={trainingFocus === item.id} onClick={() => handleCerca(item.id)}
          className="min-h-[44px] underline underline-offset-4 hover:text-[var(--pc-forest-700)]">{item.label}</button>)}
      </div>}
    </form>
  );
}
