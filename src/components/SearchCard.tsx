import { useEffect, useMemo, useState } from 'react';
import {
  Home,
  Building2,
  MapPin,
  Search,
  Bone,
  Scissors,
  GraduationCap,
  Navigation,
} from 'lucide-react';
import { useRouter } from '../lib/RouterContext';
import { cityLabel, loadItalianCities, normalizeCitySearch, type ItalianCity } from '../lib/italianCities';
import type { ServiceCategoryType } from '../lib/serviceCategories';

const services: Array<{ id: ServiceCategoryType; label: string; icon: typeof Home }> = [
  { id: 'boarding', label: 'Pensione', icon: Home },
  { id: 'sitter', label: 'Pet sitting', icon: Building2 },
  { id: 'walker', label: 'Passeggiate', icon: Bone },
  { id: 'trainer', label: 'Addestramento', icon: GraduationCap },
  { id: 'groomer', label: 'Toelettatura', icon: Scissors },
];

function isServiceCategory(value: string | null): value is ServiceCategoryType {
  return services.some((service) => service.id === value);
}

export function SearchCard({ compact = false }: { compact?: boolean }) {
  const { path, navigate } = useRouter();
  const [service, setServizio] = useState<ServiceCategoryType>('walker');
  const [address, setAddress] = useState('');
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

    setServizio(isServiceCategory(type) ? type : 'walker');
    setAddress(nextAddress);
    setSelectedCity(null);
    setGpsCoords(hasCoords ? { lat, lng } : null);
    setLocationAccuracy(null);
  }, [path]);

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

  const handleCerca = () => {
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
      type: service,
      address,
    });

    if (coords) {
      params.set('lat', String(coords.lat));
      params.set('lng', String(coords.lng));
    }

    navigate(`/search?${params.toString()}`);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert('La geolocalizzazione non è supportata da questo browser.');
      return;
    }

    setLocationLoading(true);
    setLocationAccuracy(null);

    let bestPosition: GeolocationPosition | null = null;
    let watchId: number | null = null;

    const applyPosition = (pos: GeolocationPosition) => {
      const nearestCity = cities.length
        ? cities.reduce((nearest, city) => {
            const nearestDistance =
              (nearest.lat - pos.coords.latitude) ** 2 +
              (nearest.lng - pos.coords.longitude) ** 2;

            const cityDistance =
              (city.lat - pos.coords.latitude) ** 2 +
              (city.lng - pos.coords.longitude) ** 2;

            return cityDistance < nearestDistance ? city : nearest;
          })
        : null;

      setGpsCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });

      setLocationAccuracy(pos.coords.accuracy);
      setSelectedCity(null);
      setAddress(
        nearestCity ? cityLabel(nearestCity) : 'Posizione attuale'
      );
      setLocationLoading(false);

      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };

    const timeoutId = window.setTimeout(() => {
      if (bestPosition) {
        applyPosition(bestPosition);
      } else {
        setLocationLoading(false);
        if (watchId !== null) {
          navigator.geolocation.clearWatch(watchId);
        }
        alert('Impossibile rilevare la posizione. Inserisci la città manualmente.');
      }
    }, 6000);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (
          !bestPosition ||
          pos.coords.accuracy < bestPosition.coords.accuracy
        ) {
          bestPosition = pos;
        }

        if (pos.coords.accuracy <= 100) {
          window.clearTimeout(timeoutId);
          applyPosition(pos);
        }
      },
      () => {
        if (!bestPosition) {
          window.clearTimeout(timeoutId);
          setLocationLoading(false);

          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
          }

          alert('Impossibile rilevare la posizione. Inserisci la città manualmente.');
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  };

  return (
    <div
      className={`bg-white border border-stone-200 shadow-sm rounded-3xl ${
        compact ? 'p-4' : 'p-6'
      }`}
    >
      <p className="text-xs font-bold tracking-wider text-stone-500 mb-3">
        SCEGLI UN SERVIZIO
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {services.map((s) => {
          const Icon = s.icon;
          const active = service === s.id;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setServizio(s.id)}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 transition ${
                active
                  ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                  : 'border-stone-200 hover:border-stone-300 text-stone-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            id="search-address"
            name="address"
            type="text"
            placeholder="Inserisci città, es. Polignano a Mare"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setSelectedCity(null);
              setGpsCoords(null);
              setLocationAccuracy(null);
            }}
            className="w-full pl-10 pr-28 py-3 border border-stone-300 rounded-xl text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />

          {suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden">
              {suggestions.map((city) => (
                <button
                  key={city.code}
                  type="button"
                  onClick={() => {
                    setAddress(cityLabel(city));
                    setSelectedCity(city);
                    setGpsCoords(null);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-stone-50 border-b border-stone-100 last:border-b-0"
                >
                  <span className="font-semibold">{city.name}</span>
                  <span className="text-stone-500">
                    {' '}({city.province}) · {city.region}
                  </span>
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={handleUseLocation}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
          >
            <Navigation className="w-3 h-3" />
            {locationLoading
              ? 'Ricerca GPS...'
              : locationAccuracy !== null
                ? locationAccuracy < 1000
                  ? `±${Math.round(locationAccuracy)} m`
                  : `±${(locationAccuracy / 1000).toFixed(1)} km`
                : 'Usa posizione'}
          </button>
        </div>

        <button
          type="button"
          onClick={handleCerca}
          className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          Cerca
        </button>
      </div>
    </div>
  );
}
