import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Filter,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  Star,
  UserRound,
  Award,
  Trophy,
  Medal,
  Info,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/RouterContext';
import { SearchCard } from '../components/SearchCard';
import { findSupportedCity } from '../lib/locations';
import { SERVICE_CATEGORIES } from '../lib/serviceCategories';
import { readJourneyContext } from '../lib/journeyContext';
import { JourneyContextNotice } from '../components/ecosystem/ProfessionalBridge';

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
  entity_kind?: 'professional' | 'facility' | null;
  experience_start_year?: number | null;
  facility_start_year?: number | null;
  experience_verified?: boolean | null;
  professional_verified?: boolean | null;
  credentials_count?: number | null;
  specialties?: string[] | null;
  honor_tier?: 'gold' | 'silver' | 'bronze' | null;
  highest_igp_level?: number | null;
  sport_discipline_priority?: number | null;
  verified_sport_results?: number | null;
  honor_out_of_area?: boolean | null;
  credential_highlights?: Array<{
    id: string;
    credential_type: string;
    title: string;
    issuer_name: string | null;
    discipline: string | null;
    achievement: string | null;
    external_url: string | null;
    verification_status: string;
  }> | null;
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



type SubjectFilter = 'all' | 'professional' | 'facility';
type SortMode = 'relevance' | 'distance' | 'experience' | 'price' | 'rating';

const EXPERIENCE_STEPS = [0, 10, 20] as const;

function getEntityKind(pro: ProResult): 'professional' | 'facility' {
  return pro.entity_kind === 'facility' ? 'facility' : 'professional';
}

function getExperienceYears(pro: ProResult): number | null {
  const currentYear = new Date().getFullYear();
  const startYear =
    getEntityKind(pro) === 'facility'
      ? pro.facility_start_year
      : pro.experience_start_year;

  if (
    typeof startYear !== 'number' ||
    !Number.isFinite(startYear) ||
    startYear < 1900 ||
    startYear > currentYear
  ) {
    return null;
  }

  return Math.max(0, currentYear - startYear);
}

function honorLabel(pro: ProResult) {
  if (pro.honor_tier === 'gold') return 'Maestro Addestratore · Oro IGP3';
  if (pro.honor_tier === 'silver') return 'Albo d’Oro · Argento IGP2';
  if (pro.honor_tier === 'bronze') return 'Albo d’Oro · Bronzo IGP1';
  if ((pro.verified_sport_results || 0) > 0) return 'Attività sportiva verificata';
  return '';
}

function compareCynologyMerit(a: ProResult, b: ProResult) {
  const igp = (b.highest_igp_level || 0) - (a.highest_igp_level || 0);
  if (igp !== 0) return igp;

  const discipline =
    (b.sport_discipline_priority || 0) - (a.sport_discipline_priority || 0);
  if (discipline !== 0) return discipline;

  return (b.verified_sport_results || 0) - (a.verified_sport_results || 0);
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

// ECOSYSTEM_PASS_V1
export function SearchPage() {
  const { navigate } = useRouter();
  const [pros, setPros] = useState<ProResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxPrice, setMaxPrice] = useState(200);
  const [minRating, setMinRating] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('all');
  const [experienceStep, setExperienceStep] = useState(0);
  const [sortMode, setSortMode] = useState<SortMode>('relevance');

  const journey = readJourneyContext();
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

  const filtered = useMemo(() => {
    const minExperience = EXPERIENCE_STEPS[experienceStep];

    const rows = pros.filter((pro) => {
      const kind = getEntityKind(pro);

      if (subjectFilter !== 'all' && kind !== subjectFilter) return false;

      if (minExperience > 0) {
        const years = getExperienceYears(pro);
        if (years === null || years < minExperience) return false;
      }

      return true;
    });

    return [...rows].sort((a, b) => {
      const meritOrder = compareCynologyMerit(a, b);
      if (meritOrder !== 0) return meritOrder;

      if (sortMode === 'distance') {
        return (a.distance_km ?? Number.POSITIVE_INFINITY) -
          (b.distance_km ?? Number.POSITIVE_INFINITY);
      }
      if (sortMode === 'experience') {
        return (getExperienceYears(b) ?? -1) - (getExperienceYears(a) ?? -1);
      }
      if (sortMode === 'price') {
        return (a.starting_price ?? Number.POSITIVE_INFINITY) -
          (b.starting_price ?? Number.POSITIVE_INFINITY);
      }
      if (sortMode === 'rating') {
        return (b.rating ?? -1) - (a.rating ?? -1);
      }
      return 0;
    });
  }, [pros, subjectFilter, experienceStep, sortMode]);

  const minExperience = EXPERIENCE_STEPS[experienceStep];

  const activeFilterChips = [
    subjectFilter === 'professional'
      ? { key: 'subject', label: 'Solo professionisti' }
      : subjectFilter === 'facility'
        ? { key: 'subject', label: 'Solo strutture' }
        : null,
    minExperience > 0
      ? {
          key: 'experience',
          label:
            subjectFilter === 'facility'
              ? `${minExperience}+ anni di attività`
              : `${minExperience}+ anni di esperienza`,
        }
      : null,
    maxPrice < 200 ? { key: 'price', label: `Massimo €${maxPrice}` } : null,
    minRating > 0 ? { key: 'rating', label: `Rating ${minRating}+` } : null,
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const clearFilter = (key: string) => {
    if (key === 'subject') setSubjectFilter('all');
    if (key === 'experience') setExperienceStep(0);
    if (key === 'price') setMaxPrice(200);
    if (key === 'rating') setMinRating(0);
  };

  const resetFilters = () => {
    setSubjectFilter('all');
    setExperienceStep(0);
    setMaxPrice(200);
    setMinRating(0);
    setSortMode('relevance');
  };
  const resultsLabel =
    filtered.length === 1
      ? subjectFilter === 'facility'
        ? '1 struttura'
        : subjectFilter === 'professional'
          ? '1 professionista'
          : '1 risultato'
      : subjectFilter === 'facility'
        ? `${filtered.length} strutture`
        : subjectFilter === 'professional'
          ? `${filtered.length} professionisti`
          : `${filtered.length} risultati`;

  const titleLocation = addressFilter?.trim()
    ? `vicino a ${addressFilter.trim()}`
    : selectedCoordinates?.explicit
      ? 'vicino alla posizione selezionata'
      : 'disponibili';

  return (
    <div className="min-h-screen bg-[var(--pc-bone-50)]">
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
        <JourneyContextNotice context={journey} className="mb-6" />
        <SearchCard compact />

        <div className="grid lg:grid-cols-[280px_1fr] gap-6 mt-8">
          <aside className="pc-card p-5 md:p-6 h-fit lg:sticky lg:top-24">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[var(--pc-forest-700)]" />
                <h3 className="font-bold text-[var(--pc-ink-950)]">Filtra la ricerca</h3>
              </div>
              <details className="pc-evidence-surface border border-[var(--pc-line)] rounded-2xl px-5 py-4 mt-5">
                <summary className="cursor-pointer list-none flex items-center gap-2 text-sm font-extrabold text-[var(--pc-forest-900)]">
                  <Info className="w-4 h-4" />
                  Perché vedo questi professionisti?
                </summary>
                <div className="mt-3 text-sm leading-6 text-[var(--pc-muted-600)] max-w-4xl">
                  <p>
                    PortaleCinofilo dà priorità alle competenze cinofile documentabili.
                    IGP3, IGP2, IGP1 e gli altri risultati sportivi incidono sull’ordine
                    soltanto quando sono verificati.
                  </p>
                  <p className="mt-2">
                    Un professionista sportivo può restare visibile anche oltre il normale
                    raggio locale. Distanza, prezzo e rating vengono dopo il merito cinofilo
                    verificato; sponsorizzazioni e abbonamenti non possono comprare questa precedenza.
                  </p>
                  <p className="mt-2 font-semibold text-[var(--pc-ink-800)]">
                    Albo d’Oro IGP: Oro = IGP3 · Argento = IGP2 · Bronzo = IGP1.
                  </p>
                </div>
              </details>

              {activeFilterChips.length > 0 && (
                <button type="button" onClick={resetFilters} className="text-xs font-bold text-[var(--pc-forest-900)] hover:underline">
                  Azzera
                </button>
              )}
            </div>

            <p className="text-sm text-[var(--pc-muted-600)] leading-6 mt-3">
              Filtri fattuali per restringere il campo. La competenza si valuta entrando nel profilo.
            </p>

            <div className="pc-rule my-5" />

            <div>
              <p className="text-sm font-bold text-[var(--pc-ink-950)]">Tipo di risultato</p>
              <div className="grid gap-2 mt-3">
                {([
                  ['all', 'Tutti', Filter],
                  ['professional', 'Professionista', UserRound],
                  ['facility', 'Struttura / centro', Building2],
                ] as const).map(([value, label, Icon]) => {
                  const selected = subjectFilter === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setSubjectFilter(value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-semibold text-left transition ${
                        selected
                          ? 'border-[var(--pc-forest-700)] bg-[var(--pc-forest-100)] text-[var(--pc-forest-900)]'
                          : 'border-[var(--pc-line)] text-[var(--pc-muted-600)] hover:border-[var(--pc-forest-700)]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pc-rule my-5" />

            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-[var(--pc-ink-950)]">
                    {subjectFilter === 'facility' ? 'Anni di attività della struttura' : 'Esperienza minima'}
                  </p>
                  <p className="text-xs text-[var(--pc-muted-600)] leading-5 mt-1">
                    {minExperience === 0 ? 'Qualsiasi anzianità' : `Almeno ${minExperience} anni`}
                  </p>
                </div>
                <span className="text-sm font-extrabold text-[var(--pc-evidence-700)]">{minExperience}+</span>
              </div>

              <div className="relative mt-5 px-1">
                <div className="absolute left-3 right-3 top-3 h-px bg-[var(--pc-line)]" />
                <div className="relative grid grid-cols-3">
                  {EXPERIENCE_STEPS.map((years, index) => {
                    const selected = experienceStep === index;
                    return (
                      <button key={years} type="button" onClick={() => setExperienceStep(index)} className="group flex flex-col items-center gap-2">
                        <span className={`relative z-10 w-6 h-6 rounded-full border-2 transition ${selected ? 'border-[var(--pc-evidence-700)] bg-[var(--pc-evidence-700)] shadow-sm' : 'border-[var(--pc-line)] bg-white group-hover:border-[var(--pc-forest-700)]'}`}>
                          {selected && <span className="absolute inset-[5px] rounded-full bg-white" />}
                        </span>
                        <span className={`text-xs font-bold ${selected ? 'text-[var(--pc-evidence-700)]' : 'text-[var(--pc-muted-600)]'}`}>{years}+</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {minExperience > 0 && (
                <p className="text-xs text-[var(--pc-muted-600)] leading-5 mt-3">
                  I risultati senza un anno di inizio disponibile non vengono inclusi.
                </p>
              )}
            </div>

            <details className="mt-6 group">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 py-3 border-t border-[var(--pc-line)] text-sm font-bold text-[var(--pc-ink-950)]">
                Altri filtri pratici
                <span className="text-[var(--pc-forest-700)] group-open:rotate-180 transition">⌄</span>
              </summary>

              <div className="pt-2">
                <label className="text-sm font-semibold text-[var(--pc-ink-800)]">Prezzo massimo per servizio</label>
                <input type="range" min="10" max="200" step="5" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[var(--pc-forest-700)] mt-3" />
                <div className="flex justify-between gap-3 mt-1 text-xs text-[var(--pc-muted-600)]">
                  <span>€10</span>
                  <strong className="text-[var(--pc-ink-950)]">{maxPrice >= 200 ? 'Nessun limite' : `Fino a €${maxPrice}`}</strong>
                  <span>€200+</span>
                </div>
              </div>

              <div className="mt-6">
                <label className="text-sm font-semibold text-[var(--pc-ink-800)]">Valutazione minima</label>
                <p className="text-xs text-[var(--pc-muted-600)] leading-5 mt-1">Filtro pratico secondario: non misura la competenza.</p>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {[0, 3, 4, 4.5].map((rating) => (
                    <button key={rating} type="button" onClick={() => setMinRating(rating)} className={'py-2 rounded-lg text-xs font-semibold border transition ' + (minRating === rating ? 'border-[var(--pc-forest-700)] bg-[var(--pc-forest-100)] text-[var(--pc-forest-900)]' : 'border-[var(--pc-line)] text-[var(--pc-muted-600)]')}>
                      {rating === 0 ? 'Tutte' : `${rating}+`}
                    </button>
                  ))}
                </div>
              </div>
            </details>
          </aside>

          <main>
            <div className="mb-6">
              <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
                <div>
                  <p className="pc-kicker">Confronta dati, poi entra nel profilo</p>
                  <h1 className="pc-display text-3xl md:text-4xl font-semibold text-[var(--pc-ink-950)] mt-2">
                    {loading ? 'Ricerca professionisti…' : `${resultsLabel} ${titleLocation}`}
                  </h1>
                  <p className="text-[var(--pc-muted-600)] mt-2 leading-6 max-w-3xl">
                    Servizio, zona, esperienza e budget servono a scremare. Per scegliere, guarda competenze,
                    formazione, attività e contesto professionale.
                  </p>
                </div>

                <label className="text-sm font-semibold text-[var(--pc-ink-800)]">
                  Ordina per
                  <select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)} className="block mt-2 min-w-52 rounded-xl border border-[var(--pc-line)] bg-white px-3 py-2.5 text-sm text-[var(--pc-ink-950)]">
                    <option value="relevance">Pertinenza</option>
                    <option value="distance">Distanza</option>
                    <option value="experience">Esperienza / attività</option>
                    <option value="price">Prezzo crescente</option>
                    <option value="rating">Valutazione</option>
                  </select>
                </label>
              </div>

              {activeFilterChips.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mt-5">
                  {activeFilterChips.map((chip) => (
                    <button key={chip.key} type="button" onClick={() => clearFilter(chip.key)} className="inline-flex items-center gap-2 rounded-full border border-[var(--pc-line)] bg-white px-3 py-1.5 text-xs font-bold text-[var(--pc-ink-800)] hover:border-[var(--pc-forest-700)] transition">
                      {chip.label}<span aria-hidden="true">×</span>
                    </button>
                  ))}
                  <button type="button" onClick={resetFilters} className="inline-flex items-center gap-1 text-xs font-bold text-[var(--pc-forest-900)] hover:underline">
                    <RotateCcw className="w-3.5 h-3.5" /> Azzera filtri
                  </button>
                </div>
              )}
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
                Nessun risultato corrisponde ai filtri attivi. Riduci i vincoli oppure prova un'altra zona o servizio.
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
                    <article
                        key={pro.id}
                        className="pc-card pc-card-interactive group relative overflow-hidden"
                      >
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-[var(--pc-forest-100)] opacity-70 blur-3xl transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="relative p-5 md:p-6 lg:p-7">
                          <div className="grid gap-5 md:grid-cols-[112px_minmax(0,1fr)] lg:grid-cols-[112px_minmax(0,1fr)_auto] md:gap-6">
                            <div className="shrink-0">
                              {pro.avatar_url ? (
                                <div className="w-24 h-24 md:w-28 md:h-28 rounded-[1.35rem] overflow-hidden bg-white ring-1 ring-[var(--pc-line)] shadow-sm">
                                  <img
                                    src={pro.avatar_url}
                                    alt={`${pro.display_name || 'Professionista'} · foto o logo`}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                </div>
                              ) : (
                                <div className="w-24 h-24 md:w-28 md:h-28 rounded-[1.35rem] bg-[var(--pc-forest-100)] ring-1 ring-[var(--pc-line)] text-[var(--pc-forest-900)] flex items-center justify-center pc-display text-2xl font-semibold shadow-sm">
                                  {initials(pro.display_name || 'Professionista') || 'PC'}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--pc-muted-600)]">
                                <span className="inline-flex items-center gap-1.5 text-[var(--pc-forest-900)]">
                                  {getEntityKind(pro) === 'facility' ? (
                                    <Building2 className="w-3.5 h-3.5" />
                                  ) : (
                                    <UserRound className="w-3.5 h-3.5" />
                                  )}
                                  {getEntityKind(pro) === 'facility'
                                    ? 'Struttura / centro cinofilo'
                                    : serviceLabel}
                                </span>
                                {honorLabel(pro) && (
                                  <span
                                    className={
                                      pro.honor_tier === 'gold'
                                        ? 'inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 normal-case tracking-normal text-amber-900 ring-1 ring-amber-200'
                                        : pro.honor_tier === 'silver'
                                          ? 'inline-flex items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 normal-case tracking-normal text-slate-700 ring-1 ring-slate-200'
                                          : pro.honor_tier === 'bronze'
                                            ? 'inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 normal-case tracking-normal text-orange-900 ring-1 ring-orange-200'
                                            : 'inline-flex items-center gap-1.5 rounded-full bg-[var(--pc-bone-50)] px-2.5 py-1 normal-case tracking-normal text-[var(--pc-ink-800)] ring-1 ring-[var(--pc-line)]'
                                    }
                                  >
                                    <Medal className="w-3.5 h-3.5" />
                                    {honorLabel(pro)}
                                  </span>
                                )}

                                {Boolean(pro.professional_verified) ? (
                                  <span className="inline-flex items-center gap-1.5 normal-case tracking-normal text-[var(--pc-evidence-700)]">
                                    <BadgeCheck className="w-3.5 h-3.5" />
                                    Professionista verificato
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 normal-case tracking-normal text-[var(--pc-muted-600)]">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--pc-forest-700)]" />
                                    Profilo approvato
                                  </span>
                                )}
                              </div>

                              <h2 className="pc-display text-[1.8rem] md:text-[2.05rem] leading-tight font-semibold text-[var(--pc-ink-950)] mt-2">
                                {pro.display_name || 'Professionista'}
                              </h2>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-[var(--pc-muted-600)]">
                                <span className="inline-flex items-center gap-1.5">
                                  <MapPin className="w-4 h-4" />
                                  {pro.zone_text || 'Zona non specificata'}
                                </span>
                                {typeof pro.distance_km === 'number' && (
                                  <span>entro {Math.max(5, Math.ceil(pro.distance_km / 5) * 5)} km</span>
                                )}
                              </div>

                              {pro.honor_out_of_area && (
                                <p className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-[var(--pc-evidence-700)]">
                                  <Medal className="w-3.5 h-3.5" />
                                  Albo d’Oro: mostrato anche fuori dal raggio locale
                                </p>
                              )}

                              <p className="mt-4 text-[var(--pc-ink-800)] leading-7 line-clamp-3 max-w-3xl">
                                {pro.bio || 'Apri il profilo per conoscere servizi, esperienza e percorso professionale.'}
                              </p>

                              <div className="mt-5 flex flex-wrap items-start gap-x-7 gap-y-4">
                                <div className="min-w-[130px]">
                                  <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[var(--pc-muted-600)]">
                                    {getEntityKind(pro) === 'facility' ? 'Anni di attività' : 'Esperienza'}
                                  </p>
                                  <p className="mt-1 text-sm font-extrabold text-[var(--pc-ink-950)]">
                                    {getExperienceYears(pro) === null ? 'Da documentare' : `${getExperienceYears(pro)} anni`}
                                    {Boolean(pro.experience_verified) && (
                                      <span className="ml-1.5 font-bold text-[var(--pc-evidence-700)]">verificata</span>
                                    )}
                                  </p>
                                </div>

                                <div className="min-w-0 flex-1">
                                  <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[var(--pc-muted-600)]">
                                    {Array.isArray(pro.specialties) && pro.specialties.length > 0 ? 'Ambiti' : 'Servizi'}
                                  </p>
                                  <div className="flex flex-wrap gap-2 mt-1.5">
                                    {(Array.isArray(pro.specialties) && pro.specialties.length > 0
                                      ? pro.specialties.slice(0, 3)
                                      : (pro.matching_services || []).slice(0, 3).map((service) => service.name)
                                    ).map((item) => (
                                      <span
                                        key={item}
                                        className="rounded-full bg-[var(--pc-bone-50)] px-2.5 py-1 text-xs font-bold text-[var(--pc-ink-800)]"
                                      >
                                        {item}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                                                {(Array.isArray(pro.credential_highlights) &&
                                  pro.credential_highlights.length > 0) ||
                                (typeof pro.credentials_count === 'number' &&
                                  pro.credentials_count > 0) ? (
                                  <div className="min-w-[180px] flex-1">
                                    <p className="text-[0.68rem] font-extrabold uppercase tracking-[0.14em] text-[var(--pc-muted-600)]">
                                      Evidenze professionali
                                    </p>

                                    <div className="flex flex-wrap gap-2 mt-1.5">
                                      {(pro.credential_highlights || []).slice(0, 2).map((credential) => (
                                        <span
                                          key={credential.id}
                                          className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-[var(--pc-ink-800)] ring-1 ring-[var(--pc-line)]"
                                        >
                                          {credential.credential_type === 'sport_result' ||
                                          credential.credential_type === 'official_test' ? (
                                            <Trophy className="w-3.5 h-3.5 text-[var(--pc-evidence-700)]" />
                                          ) : (
                                            <Award className="w-3.5 h-3.5 text-[var(--pc-forest-700)]" />
                                          )}
                                          {credential.title}
                                          <span className="font-semibold text-[var(--pc-muted-600)]">
                                            ·{' '}
                                            {credential.verification_status === 'verified'
                                              ? 'verificato'
                                              : credential.verification_status === 'pending'
                                                ? 'in verifica'
                                                : 'dichiarato'}
                                          </span>
                                        </span>
                                      ))}
                                    </div>

                                    {typeof pro.credentials_count === 'number' &&
                                      pro.credentials_count > 0 && (
                                        <p className="mt-2 text-xs font-bold text-[var(--pc-evidence-700)]">
                                          {pro.credentials_count}{' '}
                                          {pro.credentials_count === 1
                                            ? 'evidenza verificata'
                                            : 'evidenze verificate'}
                                        </p>
                                      )}
                                  </div>
                                ) : null}
                              </div>
                            </div>

                            <div className="lg:min-w-[190px] lg:self-stretch flex flex-col sm:flex-row lg:flex-col sm:items-center lg:items-end sm:justify-between lg:justify-between gap-4">
                              <div className="lg:text-right">
                                <p className="text-lg font-extrabold text-[var(--pc-ink-950)]">
                                  {typeof pro.starting_price === 'number' && pro.starting_price > 0
                                    ? `Da €${pro.starting_price}`
                                    : 'Tariffe nel profilo'}
                                </p>
                                <p className="mt-1 inline-flex lg:justify-end items-center gap-1.5 text-sm text-[var(--pc-muted-600)]">
                                  <Star className="w-4 h-4" />
                                  {(pro.review_count || 0) > 0
                                    ? `${(pro.rating || 0).toFixed(1)} · ${pro.review_count} ${(pro.review_count || 0) === 1 ? 'recensione' : 'recensioni'}`
                                    : 'Nessuna recensione'}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => navigate('/p/' + pro.id + (qs.toString() ? `?${qs.toString()}` : ''))}
                                className="pc-btn pc-btn-primary w-full sm:w-auto lg:w-full justify-center group/cta"
                              >
                                Vedi profilo e competenze
                                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/cta:translate-x-1" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
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
