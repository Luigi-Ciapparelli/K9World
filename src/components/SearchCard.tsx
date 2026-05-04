import { useState } from 'react';
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
import { findNearestCity, SUPPORTED_CITIES } from '../lib/locations';

const services = [
  { id: 'boarding', label: 'Boarding', icon: Home },
  { id: 'sitter', label: 'House Sitting', icon: Building2 },
  { id: 'walker', label: 'Dog Walking', icon: Bone },
  { id: 'trainer', label: 'Training', icon: GraduationCap },
  { id: 'groomer', label: 'Grooming', icon: Scissors },
];

export function SearchCard({ compact = false }: { compact?: boolean }) {
  const [service, setService] = useState('walker');
  const [address, setAddress] = useState('');
  const [date, setDate] = useState('');
  const [locationLoading, setLocationLoading] = useState(false);
  const { navigate } = useRouter();

  const handleSearch = () => {
    const q = new URLSearchParams({
      type: service,
      address,
      date,
    }).toString();

    navigate(`/search?${q}`);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nearest = findNearestCity(
          pos.coords.latitude,
          pos.coords.longitude
        );

        setAddress(nearest.name);
        setLocationLoading(false);
      },
      () => {
        alert('Could not detect your location. Please type your city manually.');
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
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
        CHOOSE A SERVICE
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {services.map((s) => {
          const Icon = s.icon;
          const active = service === s.id;

          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setService(s.id)}
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
            list="supported-cities"
            placeholder="Add your city, e.g. Rimini"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full pl-10 pr-28 py-3 border border-stone-300 rounded-xl text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />

          <datalist id="supported-cities">
            {SUPPORTED_CITIES.map((city) => (
              <option key={city.name} value={city.name} />
            ))}
          </datalist>

          <button
            type="button"
            onClick={handleUseLocation}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
          >
            <Navigation className="w-3 h-3" />
            {locationLoading ? 'Finding...' : 'Use mine'}
          </button>
        </div>

        <input
          id="search-date"
          name="date"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-3 border border-stone-300 rounded-xl text-sm focus:border-emerald-500 focus:outline-none"
        />

        <button
          type="button"
          onClick={handleSearch}
          className="px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>
    </div>
  );
}
