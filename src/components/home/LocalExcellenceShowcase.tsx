import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, MapPin, Sparkles, Star, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRouter } from '../../lib/RouterContext';
import { SUPPORTED_CITIES } from '../../lib/locations';
import { SERVICE_CATEGORIES, ServiceCategoryType } from '../../lib/serviceCategories';

type ServiceRow = {
  id: string;
  professional_id: string;
  service_type: ServiceCategoryType;
  name: string;
  description: string | null;
  price: number | null;
  active: boolean;
};

type ProfessionalRow = {
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
  matching_services: ServiceRow[];
};

type ReviewRow = {
  professional_id: string;
  rating: number;
  created_at: string;
};

type FeaturedItem = {
  service: ServiceRow;
  professional: ProfessionalRow;
  distanceKm: number | null;
  recentAverageRating: number | null;
  recentReviewCount: number;
  score: number;
  imageUrl: string | null;
};


export function LocalExcellenceShowcase() {
  const { navigate } = useRouter();
  const [selectedCityName, setSelectedCityName] = useState('Rimini');
  const [featuredByType, setFeaturedByType] = useState<Record<string, FeaturedItem | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const selectedCity = useMemo(() => {
    return (
      SUPPORTED_CITIES.find((city) => city.name === selectedCityName) ||
      SUPPORTED_CITIES[0]
    );
  }, [selectedCityName]);

  useEffect(() => {
    const loadFeatured = async () => {
      setLoading(true);
      setError('');

      const publicProsRes = await supabase.rpc('search_public_professionals', {
        p_lat: selectedCity.lat,
        p_lng: selectedCity.lng,
        p_zone_text: selectedCity.name,
        p_service_type: null,
        p_max_price: null,
        p_min_rating: null,
      });

      if (publicProsRes.error) {
        console.error('Featured public professionals error:', publicProsRes.error);
        setError(publicProsRes.error.message);
        setLoading(false);
        return;
      }

      const professionals = ((publicProsRes.data || []) as unknown as ProfessionalRow[]).map(
        (professional) => ({
          ...professional,
          matching_services: Array.isArray(professional.matching_services)
            ? professional.matching_services
            : [],
        })
      );

      const professionalById = new Map(
        professionals.map((professional) => [professional.id, professional])
      );

      const services = professionals.flatMap(
        (professional) => professional.matching_services
      );

      const professionalIds = professionals.map((professional) => professional.id);

      if (professionalIds.length === 0) {
        setFeaturedByType({});
        setLoading(false);
        return;
      }

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const reviewsRes = await supabase
        .from('public_reviews')
        .select('professional_id, rating, created_at')
        .in('professional_id', professionalIds)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const reviews = reviewsRes.error ? [] : ((reviewsRes.data || []) as ReviewRow[]);

      if (reviewsRes.error) {
        console.warn('Recent reviews unavailable:', reviewsRes.error);
      }

      const reviewStats = new Map<string, { count: number; sum: number }>();

      for (const review of reviews) {
        const current = reviewStats.get(review.professional_id) || { count: 0, sum: 0 };
        reviewStats.set(review.professional_id, {
          count: current.count + 1,
          sum: current.sum + Number(review.rating || 0),
        });
      }

      const nextFeatured: Record<string, FeaturedItem | null> = {};

      for (const category of SERVICE_CATEGORIES) {
        const categoryServices = services.filter(
          (service) => service.service_type === category.type
        );

        const candidates: FeaturedItem[] = [];

        for (const service of categoryServices) {
          const professional = professionalById.get(service.professional_id);

          if (!professional) continue;

          const dist =
            typeof professional.distance_km === 'number'
              ? professional.distance_km
              : null;

          const stats = reviewStats.get(professional.id);
          const recentReviewCount = stats?.count || 0;
          const recentAverageRating = stats && stats.count > 0 ? stats.sum / stats.count : null;

          const distancePenalty = typeof dist === 'number' ? dist * 0.4 : 6;

          const score =
            recentAverageRating !== null
              ? recentAverageRating * 100 + Math.min(recentReviewCount, 20) * 3 - distancePenalty
              : (professional.rating || 0) * 100 +
                Math.min(professional.review_count || 0, 100) * 0.5 -
                distancePenalty;

          const imageUrl = professional.cover_photo_url || professional.avatar_url || null;

          candidates.push({
            service,
            professional,
            distanceKm: dist,
            recentAverageRating,
            recentReviewCount,
            score,
            imageUrl,
          });
        }

        candidates.sort((a, b) => b.score - a.score);
        nextFeatured[category.type] = candidates[0] || null;
      }

      setFeaturedByType(nextFeatured);
      setLoading(false);
    };

    loadFeatured();
  }, [selectedCity]);

  return (
    <section id="services" className="local-excellence-section relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.25),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.18),transparent_30%)]" />

      <div className="relative max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-2 text-sm font-semibold text-emerald-100 mb-5">
              <Sparkles className="w-4 h-4" />
              Rete selezionata
            </div>

            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Eccellenze locali
            </h2>

            <p className="local-excellence-subtitle text-lg mt-4">
              Una selezione visuale dei professionisti approvati più rilevanti nella tua zona,
              basata su servizi attivi, distanza e recensioni recenti.
            </p>
          </div>

          <div className="local-excellence-zone-card rounded-2xl p-3">
            <label className="local-excellence-zone-label block text-xs font-semibold mb-1">
              Zona
            </label>
            <select
              value={selectedCityName}
              onChange={(event) => setSelectedCityName(event.target.value)}
              className="local-excellence-select border rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500"
            >
              {SUPPORTED_CITIES.map((city) => (
                <option key={city.name} value={city.name}>
                  {city.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-rose-100">
            {error}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {SERVICE_CATEGORIES.map((category) => {
            const featured = featuredByType[category.type];
            const hasRecentReviews = !!featured && featured.recentReviewCount > 0;
            const displayedRating =
              featured?.recentAverageRating ?? featured?.professional.rating ?? 0;

            return (
              <article
                key={category.type}
                className="relative min-h-[360px] rounded-[2rem] overflow-hidden border border-white/10 bg-stone-900 shadow-2xl group text-white"
              >
                {featured?.imageUrl ? (
                  <img
                    src={featured.imageUrl}
                    alt={category.title}
                    className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: category.gradient }}
                  />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/55 to-stone-950/10" />

                <div className="relative h-full min-h-[360px] p-6 flex flex-col justify-between">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-flex items-center rounded-full bg-white/15 backdrop-blur border border-white/20 px-3 py-1 text-xs font-bold">
                        {category.badge}
                      </span>

                      <h3 className="text-3xl font-bold mt-4 max-w-md">
                        {category.title}
                      </h3>

                      <p className="text-stone-200 mt-3 max-w-lg">
                        {category.description}
                      </p>
                    </div>

                    {featured && (
                      <div className="hidden sm:flex items-center gap-1 rounded-full bg-amber-400 text-stone-950 px-3 py-1 text-xs font-bold">
                        <Trophy className="w-3.5 h-3.5" />
                        {hasRecentReviews ? 'Top 30 giorni' : 'In evidenza'}
                      </div>
                    )}
                  </div>

                  {loading ? (
                    <div className="rounded-2xl bg-white/10 border border-white/10 p-4 text-stone-200">
                      Caricamento profili in evidenza...
                    </div>
                  ) : featured ? (
                    <div className="local-excellence-result-card rounded-3xl p-5 shadow-xl">
                      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 text-sm text-stone-500">
                            <MapPin className="w-4 h-4" />
                            <span>
                              {featured.professional.zone_text || selectedCity.name}
                              {typeof featured.distanceKm === 'number'
                                ? ' · ' + featured.distanceKm.toFixed(1) + ' km'
                                : ''}
                            </span>
                          </div>

                          <h4 className="text-2xl font-bold mt-1">
                            {featured.professional.display_name || 'Professionista verificato'}
                          </h4>

                          <p className="text-sm text-stone-600 mt-1">
                            {featured.service.name} · da €{featured.service.price || 0}
                          </p>

                          <div className="flex flex-wrap items-center gap-3 mt-3 text-sm">
                            <span className="inline-flex items-center gap-1 font-semibold">
                              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                              {displayedRating.toFixed(1)}
                            </span>

                            <span className="text-stone-500">
                              {hasRecentReviews
                                ? featured.recentReviewCount + ' recensioni negli ultimi 30 giorni'
                                : (featured.professional.review_count || 0) + ' recensioni totali'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate('/p/' + featured.professional.id)}
                          className="shrink-0 px-5 py-3 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition inline-flex items-center justify-center gap-2"
                        >
                          Vedi profilo
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="local-excellence-result-card rounded-3xl p-5">
                      <h4 className="text-xl font-bold">Stiamo selezionando profili</h4>
                      <p className="text-stone-600 mt-2">
                        Nessun professionista approvato per questa categoria nella zona di {selectedCity.name}.
                      </p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="local-excellence-note mt-8 text-sm">
          La vetrina non sostituisce la ricerca completa: per vedere tutti i profili usa “Trova un professionista”.
        </div>
      </div>
    </section>
  );
}
