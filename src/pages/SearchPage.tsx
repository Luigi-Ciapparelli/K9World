import { useEffect, useMemo, useState } from 'react';
import { Star, MapPin, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/RouterContext';
import { SearchCard } from '../components/SearchCard';
import { findSupportedCity } from '../lib/locations';

interface ProResult {
  id: string;
  display_name: string;
  avatar_url: string | null;
  professional_type: string | null;
  bio: string | null;
  zone_text: string | null;
  coverage_radius_km: number | null;
  starting_price: number | null;
  cover_photo_url: string | null;
  rating: number | null;
  review_count: number | null;
  distance_km: number | null;
  matching_services: ServizioResult[];
}

interface ServizioResult {
  id: string;
  professional_id: string;
  service_type: string;
  name: string;
  description: string | null;
  price: number;
  duration_kind: string;
  duration_minutes: number;
  active: boolean;
}

export function SearchPage() {
  const { navigate } = useRouter();
  const [pros, setPros] = useState<ProResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxPrice, setMaxPrice] = useState(200);
  const [minRating, setMinRating] = useState(0);
  const [loadError, setLoadError] = useState('');

  const hash = window.location.hash;
  const qs = hash.includes('?')
    ? new URLSearchParams(hash.split('?')[1])
    : new URLSearchParams();

  const typeFilter = qs.get('type');
  const addressFilter = qs.get('address');
  const latParam = qs.get('lat');
  const lngParam = qs.get('lng');

  const selectedCity = useMemo(
    () => findSupportedCity(addressFilter),
    [addressFilter]
  );

  const selectedCoordinates = useMemo(() => {
    if (latParam !== null && lngParam !== null) {
      const lat = Number(latParam);
      const lng = Number(lngParam);

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return { lat, lng, explicit: true };
      }
    }

    if (selectedCity) {
      return {
        lat: selectedCity.lat,
        lng: selectedCity.lng,
        explicit: false,
      };
    }

    return null;
  }, [latParam, lngParam, selectedCity]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError('');

      const { data, error } = await supabase.rpc('search_public_professionals', {
        p_lat: selectedCoordinates?.lat ?? null,
        p_lng: selectedCoordinates?.lng ?? null,
        p_zone_text: selectedCoordinates?.explicit ? null : selectedCity?.name ?? null,
        p_service_type: typeFilter || null,
        p_max_price: maxPrice,
        p_min_rating: minRating,
      });

      if (error) {
        console.error('Public professional search error:', error);
        setPros([]);
        setLoadError(error.message);
        setLoading(false);
        return;
      }

      const rows = ((data as unknown as ProResult[]) || []).map((pro) => ({
        ...pro,
        matching_services: Array.isArray(pro.matching_services)
          ? pro.matching_services
          : [],
      }));

      setPros(rows);
      setLoading(false);
    };

    load();
  }, [typeFilter, selectedCity, selectedCoordinates, maxPrice, minRating]);

  const filtered = pros;

  const titleLocation = selectedCity ? 'near ' + selectedCity.name : 'near you';

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <SearchCard compact />

        <div className="grid lg:grid-cols-[280px_1fr] gap-6 mt-8">
          <aside className="bg-white rounded-2xl border border-stone-200 p-5 h-fit">
            <div className="flex items-center gap-2 mb-5">
              <Filter className="w-4 h-4 text-stone-500" />
              <h3 className="font-bold text-stone-900">Filtri</h3>
            </div>

            <div className="mb-6">
              <label className="text-sm font-semibold text-stone-700">
                Prezzo massimo per servizio
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-full accent-emerald-600 mt-3"
              />
              <p className="text-sm text-stone-500 mt-1">Up to €{maxPrice}</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-stone-700">
                Valutazione minima
              </label>
              <div className="grid grid-cols-4 gap-2 mt-3">
                {[0, 3, 4, 4.5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => setMinRating(rating)}
                    className={
                      'py-2 rounded-lg text-xs font-semibold border ' +
                      (minRating === rating
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                        : 'border-stone-200 text-stone-600')
                    }
                  >
                    {rating === 0 ? 'Qualsiasi' : String(rating) + '+'}
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
                La ricerca si basa sui servizi attivi: un professionista può comparire in più categorie.
              </p>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8">
                Loading...
              </div>
            ) : loadError ? (
              <div className="bg-rose-50 rounded-2xl border border-rose-200 p-8 text-rose-700">
                {loadError}
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8">
                Nessun professionista corrisponde ai filtri. Prova un'altra città, servizio o filtro.
              </div>
            ) : (
              <div className="grid gap-4">
                {filtered.map((pro) => {
                  const firstServizio = pro.matching_services?.[0];

                  return (
                    <button
                      key={pro.id}
                      type="button"
                      onClick={() => navigate('/p/' + pro.id)}
                      className="text-left bg-white rounded-2xl border border-stone-200 p-5 hover:shadow-md hover:border-emerald-200 transition"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-bold text-stone-900">
                            {pro.display_name || 'Professionista'}
                          </h3>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-stone-600">
                            <span className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              <b>{(pro.rating || 0).toFixed(1)}</b>
                            </span>

                            <span className="capitalize">
                              {firstServizio?.service_type || pro.professional_type}
                            </span>

                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {pro.zone_text || 'Nearby'}
                            </span>

                            {typeof pro.distance_km === 'number' && (
                              <span>{pro.distance_km.toFixed(1)} km away</span>
                            )}
                          </div>

                          <p className="mt-3 text-stone-700">
                            {pro.bio || 'Dedicato al benessere e alla cura dei cani.'}
                          </p>

                          {pro.matching_services && pro.matching_services.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {pro.matching_services.slice(0, 3).map((service) => (
                                <span
                                  key={service.id}
                                  className="text-xs bg-stone-100 text-stone-700 px-2 py-1 rounded-full"
                                >
                                  {service.name} · €{service.price}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm text-stone-500">
                            {pro.review_count || 0} recensioni
                          </p>
                          <p className="font-bold text-stone-900 mt-2">
                            Da €{pro.starting_price || 0}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
