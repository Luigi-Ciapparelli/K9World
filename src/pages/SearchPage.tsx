import { useEffect, useMemo, useState } from 'react';
import { Star, MapPin, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/RouterContext';
import { SearchCard } from '../components/SearchCard';
import { findSupportedCity } from '../lib/locations';
import { SERVICE_CATEGORIES } from '../lib/serviceCategories';

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
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError('');

      const { data, error } = await supabase.rpc('search_public_professionals', {
        p_lat: selectedCoordinates?.lat ?? null,
        p_lng: selectedCoordinates?.lng ?? null,
        p_zone_text: selectedCoordinates?.explicit ? null : selectedCity?.name ?? null,
        p_service_type: typeFilter || null,
        p_max_price: maxPrice >= 200 ? null : maxPrice,
        p_min_rating: minRating > 0 ? minRating : null,
      });

      if (cancelled) return;

      if (error) {
        console.error('Public professional search error:', error);
        setPros([]);
        setLoadError('Impossibile caricare i professionisti in questo momento.');
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

    const timer = window.setTimeout(() => {
      void load();
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [typeFilter, selectedCity, selectedCoordinates, maxPrice, minRating]);

  const filtered = pros;

  const resultsLabel =
    filtered.length === 1 ? '1 professionista' : `${filtered.length} professionisti`;

  const titleLocation = addressFilter?.trim()
    ? `vicino a ${addressFilter.trim()}`
    : selectedCoordinates?.explicit
      ? 'vicino alla posizione selezionata'
      : 'disponibili';

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
              <p className="text-sm text-stone-500 mt-1">
                {maxPrice >= 200 ? 'Nessun limite' : `Fino a €${maxPrice}`}
              </p>
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
                {loading ? 'Ricerca professionisti…' : `${resultsLabel} ${titleLocation}`}
              </h1>
              <p className="text-stone-600 mt-1">
                La ricerca si basa sui servizi attivi: un professionista può comparire in più categorie.
              </p>
            </div>

            {loading ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8">
                Caricamento professionisti...
              </div>
            ) : loadError ? (
              <div className="bg-rose-50 rounded-2xl border border-rose-200 p-8 text-rose-700">
                {loadError} Riprova tra poco.
              </div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8">
                Nessun professionista corrisponde ai filtri. Prova un'altra città, servizio o filtro.
              </div>
            ) : (
              <div className="grid gap-4">
                {filtered.map((pro) => {
                  const firstServizio = pro.matching_services?.[0];
                  const serviceType =
                    firstServizio?.service_type || pro.professional_type || '';
                  const serviceLabel =
                    SERVICE_CATEGORIES.find((category) => category.type === serviceType)?.title ||
                    serviceType ||
                    'Servizi per cani';

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
                            {(pro.review_count || 0) > 0 && (
                              <span className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                <b>{(pro.rating || 0).toFixed(1)}</b>
                              </span>
                            )}

                            <span>{serviceLabel}</span>

                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {pro.zone_text || 'Zona non specificata'}
                            </span>

                            {typeof pro.distance_km === 'number' && (
                              <span>
                                entro {Math.max(5, Math.ceil(pro.distance_km / 5) * 5)} km
                              </span>
                            )}
                          </div>

                          <p className="mt-3 text-stone-700">
                            {pro.bio || 'Consulta il profilo per conoscere servizi, esperienza e disponibilità.'}
                          </p>

                          {pro.matching_services && pro.matching_services.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4">
                              {pro.matching_services.slice(0, 3).map((service) => (
                                <span
                                  key={service.id}
                                  className="text-xs bg-stone-100 text-stone-700 px-2 py-1 rounded-full"
                                >
                                  {service.price > 0
                                    ? `${service.name} · €${service.price}`
                                    : service.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm text-stone-500">
                            {(pro.review_count || 0) === 0
                              ? 'Nessuna recensione'
                              : (pro.review_count || 0) === 1
                                ? '1 recensione'
                                : `${pro.review_count} recensioni`}
                          </p>
                          <p className="font-bold text-stone-900 mt-2">
                            {typeof pro.starting_price === 'number' && pro.starting_price > 0
                              ? `Da €${pro.starting_price}`
                              : 'Prezzo nel profilo'}
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
