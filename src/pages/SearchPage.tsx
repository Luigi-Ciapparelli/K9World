import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Filter,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  UserRound,
  Award,
  Trophy,
  Info,
} from 'lucide-react';
import { readTrainingFocus } from '../lib/trainerSpecializations';
import { supabase } from '../lib/supabase';
import { useRouter } from '../lib/RouterContext';
import { SearchCard } from '../components/SearchCard';
import { findSupportedCity } from '../lib/locations';
import { DAILY_SERVICE_TYPES, EXHIBITION_SERVICE_TYPES, SERVICE_CATEGORIES } from '../lib/serviceCategories';
import { RouteLink } from '../components/RouteLink';
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
type SortMode = 'relevance' | 'distance' | 'experience' | 'price';

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

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

// ECOSYSTEM_PASS_V1
export function SearchPage({ sport = false, exhibitions = false }: { sport?: boolean; exhibitions?: boolean }) {
  const { path } = useRouter();
  const qs = new URLSearchParams(path.split('?')[1] || '');
  const bounded = (key: string, fallback: number, low: number, high: number) => {
    const raw = qs.get(key), value = Number(raw);
    return raw !== null && Number.isFinite(value) && value >= low && value <= high ? value : fallback;
  };
  const [reloadKey, setReloadKey] = useState(0);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [pros, setPros] = useState<ProResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [maxPrice, setMaxPrice] = useState(() => bounded('max_price', 200, 10, 200));
  const [loadError, setLoadError] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>(() => ['professional', 'facility'].includes(qs.get('subject') || '') ? qs.get('subject') as SubjectFilter : 'all');
  const [experienceStep, setExperienceStep] = useState(() => Math.round(bounded('experience_step', 0, 0, 2)));
  const [sortMode, setSortMode] = useState<SortMode>(() => ['distance', 'experience', 'price'].includes(qs.get('sort') || '') ? qs.get('sort') as SortMode : 'relevance');

  const journey = readJourneyContext();
  const typeFilter = sport ? 'trainer' : qs.get('type') || (exhibitions ? 'groomer' : 'trainer');
  const unsupportedCategory = !sport && !(exhibitions ? EXHIBITION_SERVICE_TYPES : DAILY_SERVICE_TYPES).some(type => type === typeFilter);
  const trainingSearch = !sport && !exhibitions && typeFilter === 'trainer';
  const trainingFocus = trainingSearch ? readTrainingFocus(qs.get('training')) : 'companion';
  const invalidTrainingFocus = trainingSearch && trainingFocus === null;
  const specialistSearch = trainingSearch && trainingFocus !== null && trainingFocus !== 'companion';
  const disciplineFilter = sport ? qs.get('discipline') : null;
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
      if (unsupportedCategory || invalidTrainingFocus) { setPros([]); setLoading(false); setLoadError(''); return; }
      setLoading(true);
      setLoadError('');

      try {
      const { data, error } = await supabase.rpc(specialistSearch ? 'search_training_professionals' : sport ? 'search_sport_professionals' : exhibitions ? 'search_exhibition_professionals' : 'search_public_professionals', {
        p_lat: selectedCoordinates?.lat ?? null,
        p_lng: selectedCoordinates?.lng ?? null,
        p_zone_text: selectedCoordinates?.explicit ? null : (selectedCity?.name ?? addressFilter?.trim()) || null,
        ...(specialistSearch ? { p_focus: trainingFocus } : sport ? { p_discipline_id: disciplineFilter || null } : { p_service_type: typeFilter }),
        p_max_price: maxPrice >= 200 ? null : maxPrice,
        ...(!specialistSearch ? { p_min_rating: null } : {}),
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
      } catch {
        if (!cancelled) { setPros([]); setLoadError('Impossibile caricare i professionisti in questo momento.'); }
      } finally { if (!cancelled) setLoading(false); }
    };

    const timer = window.setTimeout(() => {
      void load();
    }, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [reloadKey, sport, exhibitions, specialistSearch, trainingSearch, trainingFocus, invalidTrainingFocus, unsupportedCategory, disciplineFilter, typeFilter, addressFilter, selectedCity, selectedCoordinates, maxPrice]);

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
  ].filter(Boolean) as Array<{ key: string; label: string }>;

  const clearFilter = (key: string) => {
    if (key === 'subject') setSubjectFilter('all');
    if (key === 'experience') setExperienceStep(0);
    if (key === 'price') setMaxPrice(200);
  };

  const resetFilters = () => {
    setSubjectFilter('all');
    setExperienceStep(0);
    setMaxPrice(200);
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
      : filtered.length === 1 ? 'disponibile' : 'disponibili';

  return (
    <div className="min-h-screen bg-[var(--pc-bone-50)]">
      <div className="max-w-7xl mx-auto px-6 py-8 md:py-12">
        {!sport && !exhibitions && <h1 className="sr-only">Trova aiuto per il cane</h1>}
        {sport ? <header className="mb-8 max-w-3xl">
          <p className="pc-kicker">Un percorso sportivo con il tuo cane</p>
          <h1 className="pc-display text-4xl md:text-5xl font-semibold mt-3">Sport cinofili</h1>
          <p className="pc-lead mt-4">Cerca chi insegna la disciplina che vuoi praticare. Confronta esperienza e attività nel profilo, poi contatta il professionista.</p>
        </header> : exhibitions ? <header className="mb-8 max-w-3xl">
          <p className="pc-kicker">Cura del mantello e presentazione sul ring</p>
          <h1 className="pc-display text-4xl md:text-5xl font-semibold mt-3">Esposizioni</h1>
          <p className="pc-lead mt-4">Trova un toelettatore o un handler per preparare e presentare il tuo cane in esposizione. La toelettatura è disponibile anche per la cura quotidiana, senza partecipare a una gara.</p>
        </header> : <JourneyContextNotice context={journey} className="mb-6" />}
        {exhibitions && qs.get('moved') === 'exhibitions' && <p role="status" className="pc-card p-4 mb-4">Toelettatura e handler sono ora in Esposizioni. Abbiamo mantenuto la zona della tua ricerca.</p>}
        {unsupportedCategory && <div role="status" className="pc-card p-5 mb-4">
          <h2 className="font-bold">Questa categoria non è disponibile in questa ricerca</h2>
          <p className="mt-2">Pet sitting e passeggiate non sono più offerti su PortaleCinofilo. Le prenotazioni precedenti restano nella tua area. Seleziona uno dei servizi disponibili qui sotto e premi Cerca.</p>
          <RouteLink to="/esposizioni" className="inline-block mt-3 underline">Cerchi toelettatura o un handler? Vai a Esposizioni</RouteLink>
        </div>}
        {invalidTrainingFocus && <p role="alert" className="pc-card p-4 mb-4">Attività non riconosciuta. Premi Cerca per tornare all’educazione quotidiana.</p>}
        <SearchCard compact sport={sport} exhibitions={exhibitions} />

        <div className="grid lg:grid-cols-[280px_1fr] gap-6 mt-8">
          <aside className="pc-card p-5 md:p-6 h-fit lg:sticky lg:top-24">
            <button type="button" className="lg:hidden w-full min-h-[44px] flex items-center justify-between gap-3 font-semibold" aria-expanded={mobileFiltersOpen} aria-controls="optional-search-filters" onClick={() => setMobileFiltersOpen(value => !value)}>
              <span><SlidersHorizontal className="w-4 h-4 inline mr-2" />Filtri facoltativi{activeFilterChips.length ? ` (${activeFilterChips.length})` : ''}</span><span aria-hidden="true">{mobileFiltersOpen ? '−' : '+'}</span>
            </button>
            <div id="optional-search-filters" className={`${mobileFiltersOpen ? 'block' : 'hidden'} lg:block`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[var(--pc-forest-700)]" />
                <h3 className="font-bold text-[var(--pc-ink-950)]">Filtra la ricerca</h3>
              </div>


              {activeFilterChips.length > 0 && (
                <button type="button" onClick={resetFilters} className="text-xs font-bold text-[var(--pc-forest-900)] hover:underline">
                  Azzera
                </button>
              )}
            </div>

            <p className="text-sm text-[var(--pc-muted-600)] leading-6 mt-3">
              Filtri fattuali per restringere il campo. La competenza si valuta entrando nel profilo.
            </p>

            <details className="rounded-xl bg-[var(--pc-bone-50)] p-3 mt-4">
              <summary className="cursor-pointer text-sm font-semibold"><Info className="w-4 h-4 inline mr-2" />Come sono ordinati?</summary>
              <p className="mt-3 text-sm leading-6 text-[var(--pc-muted-600)]">
                {sport ? 'Compaiono i professionisti che offrono la disciplina cercata, con un servizio di addestramento attivo e copertura nella zona scelta.' : 'Compaiono i professionisti che offrono il servizio cercato e coprono la zona scelta.'}
                {' '}L’ordine iniziale segue la distanza, quando disponibile, poi il nome. Puoi scegliere un altro ordinamento. I risultati sportivi non danno precedenza generale.
              </p>
            </details>

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
                <label htmlFor="search-max-price" className="text-sm font-semibold text-[var(--pc-ink-800)]">Prezzo massimo per servizio</label>
                <input id="search-max-price" type="range" min="10" max="200" step="5" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[var(--pc-forest-700)] mt-3" />
                <div className="flex justify-between gap-3 mt-1 text-xs text-[var(--pc-muted-600)]">
                  <span>€10</span>
                  <strong className="text-[var(--pc-ink-950)]">{maxPrice >= 200 ? 'Nessun limite' : `Fino a €${maxPrice}`}</strong>
                  <span>€200+</span>
                </div>
              </div>

            </details>
            </div>
          </aside>

          <main>
            <div className="mb-6">
              <div className="flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
                <div>
                  <p className="pc-kicker">Confronta dati, poi entra nel profilo</p>
                  <h2 className="pc-display text-3xl md:text-4xl font-semibold text-[var(--pc-ink-950)] mt-2">
                    {loading ? 'Ricerca professionisti…' : `${resultsLabel} ${titleLocation}`}
                  </h2>
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
              <div role="alert" className="bg-rose-50 rounded-2xl border border-rose-200 p-8 text-rose-700">
                <p>{loadError}</p><button type="button" className="mt-3 font-semibold underline" onClick={() => setReloadKey(key => key + 1)}>Riprova</button>
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

                              </div>

                              <RouteLink
                                to={(() => { const params = new URLSearchParams(qs); if (sport) params.set('context', 'sport'); else if (exhibitions) params.set('context', 'exhibitions'); else params.delete('context'); params.set('type', typeFilter); params.set('max_price', String(maxPrice)); params.delete('min_rating'); params.set('subject', subjectFilter); params.set('experience_step', String(experienceStep)); params.set('sort', sortMode); return '/p/' + pro.id + (params.toString() ? `?${params}` : ''); })()}
                                className="pc-btn pc-btn-primary w-full sm:w-auto lg:w-full justify-center group/cta"
                              >
                                Vedi profilo e competenze
                                <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/cta:translate-x-1" />
                              </RouteLink>
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
