import { useState } from 'react';
import { Home, Building2, MapPin, Search, Bone, Scissors, GraduationCap, Navigation } from 'lucide-react';
import { useRouter } from '../lib/RouterContext';

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
  const { navigate } = useRouter();

  const handleSearch = () => {
    const q = new URLSearchParams({ type: service, address, date }).toString();
    navigate(`/search?${q}`);
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setAddress(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
    });
  };

  return (
    <div className={`bg-white rounded-2xl shadow-xl border border-stone-100 ${compact ? 'p-4' : 'p-6'} w-full`}>
      <div className="text-xs font-semibold text-stone-500 tracking-wide mb-3">CHOOSE A SERVICE</div>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-5">
        {services.map((s) => {
          const Icon = s.icon;
          const active = service === s.id;
          return (
            <button
              key={s.id}
              onClick={() => setService(s.id)}
              className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border-2 transition ${
                active ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-stone-200 hover:border-stone-300 text-stone-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-semibold">{s.label}</span>
            </button>
          );
        })}
      </div>
      <div className="grid md:grid-cols-[1fr_auto_auto] gap-3">
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Add your address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full pl-10 pr-24 py-3 border border-stone-300 rounded-xl text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
          <button onClick={handleUseLocation} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1">
            <Navigation className="w-3 h-3" /> Use mine
          </button>
        </div>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-4 py-3 border border-stone-300 rounded-xl text-sm focus:border-emerald-500 focus:outline-none"
        />
        <button onClick={handleSearch} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition flex items-center gap-2 justify-center">
          <Search className="w-4 h-4" /> Search
        </button>
      </div>
    </div>
  );
}
