import { useEffect, useMemo, useState } from 'react';
import { Star, MapPin, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/RouterContext';
import { SearchCard } from '../components/SearchCard';
import { distanceKm, findSupportedCity } from '../lib/locations';

interface ProResult {
  id: string;
  professional_type: string;
  bio: string | null;
  zone_text: string | null;
  latitude: number | null;
  longitude: number | null;
  coverage_radius_km: number | null;
  starting_price: number | null;
  rating: number | null;
  review_count: number | null;
  profiles: { full_name: string; avatar_url: string | null } | null;
  distance_km?: number;
}

export function SearchPage() {
  const { navigate } = useRouter();
  const [pros, setPros] = useState<ProResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxPrice, setMaxPrice] = useState(200);
  const [minRating, setMinRating] = useState(0);

  const hash = window.location.hash;
  const qs = hash.includes('?')
    ? new URLSearchParams(hash.split('?')[1])
    : new URLSearchParams();

  const typeFilter = qs.get('type');
  const addressFilter = qs.get('address');

  const selectedCity = useMemo(
    () => findSupportedCity(addressFilter),
    [addressFilter]
  );

  useEffect(() => {
    (async () => {
      setLoading(true);

      let q = supabase
        .from('professionals')
        .select(
          'id, professional_type, bio, zone_text, latitude, longitude, coverage_radius_km, starting_price, rating, review_count, profiles:id(full_name, avatar_url)'
        )
        .eq('approved', true);

      if (typeFilter) {
        q = q.eq('professional_type', typeFilter);
      }

      const { data, error } = await q;

      if (error) {
        console.error('Search error:', error);
        setPros([]);
        setLoading(false);
        return;
      }

      const rows = ((data as unknown as ProResult[]) || []).map((p) => {
        if (
          selectedCity &&
          typeof p.latitude === 'number' &&
          typeof p.longitude === 'number'
        ) {
          return {
            ...p,
            distance_km: distanceKm(
              selectedCity.lat,
              selectedCity.lng,
              p.latitude,
              p.longitude
            ),
          };
        }

        return p;
      });

      setPros(rows);
      setLoading(false);
    })();
  }, [typeFilter, selectedCity]);

  const filtered = pros
    .filter((p) => {
      const price = p.starting_price ?? 0;
      const rating = p.rating ?? 0;

      if (price > maxPrice) return false;
      if (rating < minRating) return false;

      if (selectedCity) {
        const zoneMatches = (p.zone_text || '')
          .toLowerCase()
          .includes(selectedCity.name.toLowerCase());

        const distanceMatches =
          typeof p.distance_km === 'number' &&
          p.distance_km <= (p.coverage_radius_km || 30);

        return zoneMatches || distanceMatches;
      }

      return true;
    })
    .sort((a, b) => {
      if (typeof a.distance_km === 'number' && typeof b.distance_km === 'number') {
        return a.distance_km - b.distance_km;
      }

      return (b.rating || 0) - (a.rating || 0);
    });

  const titleLocation = selectedCity ? `near ${selectedCity.name}` : 'near you';

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <SearchCard compact />

        <div className="grid lg:grid-cols-[280px_1fr] gap-6 mt-8">
          <aside className="bg-white rounded-2xl border border-stone-200 p-5 h-fit">
            <div className="flex items-center gap-2 mb-5">
              <Filter className="w-4 h-4 text-stone-500" />
              <h3 className="font-bold text-stone-900">Filters</h3>
            </div>

            <div className="mb-6">
              <label className="text-sm font-semibold text-stone-700">
                Max price per service
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-emerald-600 mt-3"
              />
              <p className="text-sm text-stone-500 mt-1">Up to ${maxPrice}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-stone-700">
                Minimum rating
              </label>
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[0, 3, 4, 4.5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setMinRating(r)}
                    className={`py-2 rounded-lg text-xs font-semibold border ${
                      minRating === r
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-stone-200 text-stone-600'
                    }`}
                  >
                    {r === 0 ? 'Any' : `${r}+`}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <main>
            <div className="mb-5">
              <h1 className="text-3xl font-bold text-stone-900">
                {filtered.length} pros {titleLocation}
              </h1>
              <p className="text-stone-600 mt-1">
                All our pros are identity-verified.
              </p>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8">
                Loading...
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8">
                No pros match your filters yet. Try another city, service or
                filter.
              </div>
            ) : (
              <div className="grid gap-4">
                {filtered.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => navigate(`/p/${p.id}`)}
                    className="text-left bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md hover:border-emerald-200 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-xl font-bold text-stone-900">
                          {p.profiles?.full_name || 'Professional'}
                        </h3>

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-stone-600">
                          <span className="flex items-center gap-1">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            {(p.rating || 0).toFixed(1)}
                          </span>

                          <span>{p.professional_type}</span>

                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {p.zone_text || 'Nearby'}
                          </span>

                          {typeof p.distance_km === 'number' && (
                            <span>{p.distance_km.toFixed(1)} km away</span>
                          )}
                        </div>

                        <p className="mt-3 text-stone-700">
                          {p.bio || 'Dedicated to making every dog feel at home.'}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm text-stone-500">
                          {p.review_count || 0} reviews
                        </p>
                        <p className="font-bold text-stone-900 mt-2">
                          From ${p.starting_price || 0}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
