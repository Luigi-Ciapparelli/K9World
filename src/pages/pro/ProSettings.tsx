import { ProfileImageEditor } from '../../components/ProfileImageEditor';
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import {
  Save,
  ArrowLeft,
  ArrowRight,
  Check,
  Mail,
  Phone,
  BadgeCheck,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Trash2,
  Award,
  ExternalLink,
  FileUp,
  Plus,
  Trophy,
} from 'lucide-react';
import { ENCI_SECTIONS, enciSectionLabel } from '../../lib/trainerSpecializations';
import { loadItalianCities, cityLabel, normalizeCitySearch, type ItalianCity } from '../../lib/italianCities';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { VerificationModal } from '../../components/VerificationModal';
import { useRouter, useUnsavedChanges } from '../../lib/RouterContext';
import { ProSetupOverview } from '../../components/ProSetupOverview';
import { setupSteps, setupPath, parseSetupStep, profileStepFields } from '../../lib/proSetup';
import { ProLayout } from './ProLayout';
import { CalendarServices } from '../../components/CalendarServices';
import { ProfessionalSearchSettings } from '../../components/ProfessionalSearchSettings';
import { ProfessionalReplyTemplates } from '../../components/ProfessionalReplyTemplates';



type CredentialType =
  | 'course_certificate'
  | 'seminar_attendance'
  | 'professional_qualification'
  | 'official_test'
  | 'sport_result'
  | 'other';

type ProfessionalCredential = {
  id: string;
  professional_id: string;
  credential_type: CredentialType;
  enci_section?: number | null;
  title: string;
  issuer_name: string | null;
  issued_at: string | null;
  discipline: string | null;
  achievement: string | null;
  description: string | null;
  external_url: string | null;
  document_path: string | null;
  dog_name: string | null;
  event_name: string | null;
  event_scope: string | null;
  placement: number | null;
  score_text: string | null;
  source_provider: 'working_dog' | 'external' | 'uploaded_document' | null;
  verification_method: 'working_dog_auto' | 'manual_admin' | null;
  source_verified_at: string | null;
  source_checked_at: string | null;
  verification_note: string | null;
  is_public: boolean;
  verification_status: 'self_declared' | 'pending' | 'verified' | 'rejected' | 'revoked';
};

type ExternalIdentity = {
  id: string;
  provider: 'working_dog';
  profile_url: string;
  external_display_name: string | null;
  verification_status: 'pending' | 'verified' | 'rejected' | 'revoked';
  verification_method: 'working_dog_auto' | 'manual_admin' | null;
  verified_at: string | null;
  last_checked_at: string | null;
  verification_note: string | null;
};

const CREDENTIAL_TYPES: Array<{ value: CredentialType; label: string }> = [
  { value: 'professional_qualification', label: 'Qualifica professionale' },
  { value: 'course_certificate', label: 'Corso / attestato' },
  { value: 'seminar_attendance', label: 'Seminario / stage' },
  { value: 'official_test', label: 'Prova / brevetto ufficiale' },
  { value: 'sport_result', label: 'Risultato gara / titolo sportivo' },
  { value: 'other', label: 'Altro' },
];

const EMPTY_CREDENTIAL = {
  credential_type: 'course_certificate' as CredentialType,
  enci_section: '',
  title: '',
  issuer_name: '',
  issued_at: '',
  discipline: '',
  achievement: '',
  description: '',
  external_url: '',
  dog_name: '',
  event_name: '',
  event_scope: '',
  placement: '',
  score_text: '',
  is_public: true,
};

function credentialStatusLabel(status: ProfessionalCredential['verification_status']) {
  if (status === 'verified') return 'Verificato';
  if (status === 'pending') return 'In verifica';
  if (status === 'rejected') return 'Non verificato';
  if (status === 'revoked') return 'Verifica revocata';
  return 'Dichiarato';
}

function isWorkingDogUrl(value: string) {
  if (!value.trim()) return false;

  try {
    const host = new URL(value).hostname.toLowerCase();
    return (
      host === 'working-dog.com' ||
      host.endsWith('.working-dog.com') ||
      host === 'working-dog.eu' ||
      host.endsWith('.working-dog.eu')
    );
  } catch {
    return false;
  }
}

type ProfessionalSettings = {
  [key: string]: unknown;
  id: string; professional_type: string; listing_type: string; bio: string; zone_text: string;
  latitude?: number | null; longitude?: number | null; coverage_radius_km: number; starting_price: number;
  business_name?: string | null; main_contact_name?: string | null; team_size?: number;
  vat_number?: string | null; website_url?: string | null; instagram_url?: string | null; cover_photo_url?: string | null;
  experience_start_year?: number | null; qualification_summary?: string | null; insurance_summary?: string | null;
  experience_verification_status?: string; approval_status?: string; approved?: boolean; admin_notes?: string | null; rejection_reason?: string | null;
};
type BookingRules = { [key: string]: unknown; min_lead_hours: number; cancellation_hours: number; min_duration_minutes: number; max_duration_minutes: number; buffer_minutes: number };
type SettingsService = { id: string; name: string; service_type: string; price: number | string; duration_minutes: number; duration_kind: string; calendar_color?: string; active: boolean };

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

const PROFESSIONAL_TYPES = [
  { value: 'trainer', label: 'Educatore / addestratore' },
  { value: 'boarding', label: 'Pensione' },
  { value: 'handler', label: 'Handler per esposizioni' },
  { value: 'groomer', label: 'Toelettatore' },
];

const CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  rimini: { latitude: 44.0678, longitude: 12.5695 },
  riccione: { latitude: 43.9994, longitude: 12.6561 },
  cattolica: { latitude: 43.9633, longitude: 12.7386 },
  'misano adriatico': { latitude: 43.9775, longitude: 12.6983 },
  coriano: { latitude: 43.9697, longitude: 12.6003 },
  'santarcangelo di romagna': { latitude: 44.0633, longitude: 12.4464 },
  cesena: { latitude: 44.1391, longitude: 12.2431 },
  'san marino': { latitude: 43.9424, longitude: 12.4578 },
};

function findCityCoordinates(zoneText: string) {
  const normalized = zoneText.trim().toLowerCase();

  if (!normalized) return null;

  const exact = CITY_COORDINATES[normalized];
  if (exact) return exact;

  const match = Object.entries(CITY_COORDINATES).find(([city]) =>
    normalized.includes(city)
  );

  return match ? match[1] : null;
}


export function ProSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const { path, navigate } = useRouter();
  const step = parseSetupStep(path);
  const currentStep = setupSteps.find(item => item.id === step);
  const [savedState, setSavedState] = useState<{ pro: ProfessionalSettings; rules: BookingRules; name: string } | null>(null);
  const [cities, setCities] = useState<ItalianCity[]>([]);
  const [cityError, setCityError] = useState('');
  const [cityAttempt, setCityAttempt] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [saveMessage, setSaveMessage] = useState('');
  const [saveError, setSaveError] = useState('');
  const [credentialFormOpen, setCredentialFormOpen] = useState(false);
  const [credentialStage, setCredentialStage] = useState(0);
  const saveLock = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const [pro, setPro] = useState<ProfessionalSettings | null>(null);
  const [profileExists, setProfileExists] = useState(false);
  const [services, setServices] = useState<SettingsService[]>([]);
  const [rules, setRules] = useState<BookingRules | null>(null);
  const [name, setName] = useState(profile?.full_name || '');
  const [verifying, setVerifying] = useState<'email' | 'phone' | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarActive, setAvatarActive] = useState(false);
  const [coverActive, setCoverActive] = useState(false);
  const brandingBusy = avatarActive || coverActive;
  const [credentials, setCredentials] = useState<ProfessionalCredential[]>([]);
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialBusy, setCredentialBusy] = useState(false);
  const [credentialNotice, setCredentialNotice] = useState('');
  const [credentialDraft, setCredentialDraft] = useState(EMPTY_CREDENTIAL);
  const [credentialFile, setCredentialFile] = useState<File | null>(null);
  const [workingDogIdentity, setWorkingDogIdentity] = useState<ExternalIdentity | null>(null);
  const [workingDogProfileUrl, setWorkingDogProfileUrl] = useState('');
  const [workingDogBusy, setWorkingDogBusy] = useState(false);
  const [workingDogNotice, setWorkingDogNotice] = useState('');

  const userId = user?.id;
  const initialName = useRef(profile?.full_name || '');
  initialName.current = profile?.full_name || '';
  const load = useCallback(async () => {
    if (!userId) return;

    setLoadingData(true);

    const [p, s, r] = await Promise.all([
      supabase.from('professionals').select('*').eq('id', userId).maybeSingle(),
      supabase.from('services').select('*').eq('professional_id', userId).order('created_at', { ascending: false }),
      supabase.from('booking_rules').select('*').eq('professional_id', userId).maybeSingle(),
    ]);

    if (p.error || s.error || r.error) {
      setLoadError('Non riesco a leggere i dati del profilo. Riprova prima di modificarli.');
      setLoadingData(false);
      return;
    }
    setLoadError('');
    setProfileExists(Boolean(p.data));
    const loadedPro = (
      p.data || {
        id: userId,
        professional_type: 'trainer',
        bio: '',
        zone_text: '',
        latitude: null,
        longitude: null,
        coverage_radius_km: 10,
        starting_price: 0,
        business_name: '',
        vat_number: '',
        website_url: '',
        instagram_url: '',
        years_experience: 0,
        experience_start_year: null,
        qualification_summary: '',
        insurance_summary: '',
        approval_status: 'pending',
        approved: false,
        listing_type: 'individual',
        main_contact_name: '',
        has_facility: false,
        facility_description: '',
        team_size: 1,
      }
    );

    setServices(s.data || []);
    const loadedRules = (
      r.data || {
        min_lead_hours: 4,
        cancellation_hours: 24,
        min_duration_minutes: 30,
        max_duration_minutes: 480,
        buffer_minutes: 15,
      }
    );

    setPro(loadedPro);
    setRules(loadedRules);
    setName(initialName.current);
    setSavedState({ pro: loadedPro, rules: loadedRules, name: initialName.current });
    setLoadingData(false);
  }, [userId]);

  useEffect(() => { void load(); }, [load]);


  const loadCredentials = useCallback(async () => {
    if (!userId) {
      setCredentials([]);
      setWorkingDogIdentity(null);
      return;
    }

    setCredentialsLoading(true);

    const [credentialsRes, identityRes] = await Promise.all([
      supabase
        .from('professional_credentials')
        .select(
          'id, professional_id, credential_type, enci_section, title, issuer_name, issued_at, discipline, achievement, description, external_url, document_path, dog_name, event_name, event_scope, placement, score_text, source_provider, verification_method, source_verified_at, source_checked_at, verification_note, is_public, verification_status'
        )
        .eq('professional_id', userId)
        .order('issued_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }),

      supabase
        .from('professional_external_identities')
        .select(
          'id, provider, profile_url, external_display_name, verification_status, verification_method, verified_at, last_checked_at, verification_note'
        )
        .eq('professional_id', userId)
        .eq('provider', 'working_dog')
        .maybeSingle(),
    ]);

    if (credentialsRes.error) {
      console.warn('Professional credentials load error:', credentialsRes.error);
      setCredentials([]);
    } else {
      setCredentials((credentialsRes.data || []) as ProfessionalCredential[]);
    }

    if (identityRes.error) {
      console.warn('Working-Dog identity load error:', identityRes.error);
      setWorkingDogIdentity(null);
    } else {
      const identity = (identityRes.data || null) as ExternalIdentity | null;
      setWorkingDogIdentity(identity);
      if (identity?.profile_url) setWorkingDogProfileUrl(identity.profile_url);
    }

    setCredentialsLoading(false);
  }, [userId]);

  useEffect(() => { if (step === 'credentials') void loadCredentials(); }, [loadCredentials, step]);

  const connectWorkingDog = async () => {
    if (!user || workingDogBusy) return;

    const url = workingDogProfileUrl.trim();
    if (!isWorkingDogUrl(url)) {
      setWorkingDogNotice(
        'Inserisci un URL working-dog.com o working-dog.eu valido.'
      );
      return;
    }

    setWorkingDogBusy(true);
    setWorkingDogNotice('');

    try {
      const { data, error } = await supabase.functions.invoke(
        'verify-working-dog',
        {
          body: {
            mode: 'profile',
            profileUrl: url,
          },
        }
      );

      if (error) throw error;

      setWorkingDogNotice(
        data?.verified
          ? 'Profilo Working-Dog collegato e verificato automaticamente.'
          : data?.reason ||
              'Profilo collegato, ma la corrispondenza automatica non è ancora sufficiente.'
      );

      await loadCredentials();
    } catch (error) {
      setWorkingDogNotice(
        error instanceof Error
          ? error.message
          : 'Non è stato possibile verificare Working-Dog.'
      );
    } finally {
      setWorkingDogBusy(false);
    }
  };

  const verifyWorkingDogCredential = async (credentialId: string) => {
    const { data, error } = await supabase.functions.invoke(
      'verify-working-dog',
      {
        body: {
          mode: 'credential',
          credentialId,
        },
      }
    );

    if (error) throw error;
    return data as { verified?: boolean; reason?: string } | null;
  };

  const submitCredential = async () => {
    if (!user || credentialBusy) return;

    const title = credentialDraft.title.trim();
    if (title.length < 2) {
      setCredentialNotice('Inserisci il titolo dell’attestato, prova o risultato.');
      return;
    }

    const externalUrl = credentialDraft.external_url.trim();
    if (externalUrl && !/^https?:\/\//i.test(externalUrl)) {
      setCredentialNotice('Il link esterno deve iniziare con http:// oppure https://.');
      return;
    }

    const isSport =
      credentialDraft.credential_type === 'sport_result' ||
      credentialDraft.credential_type === 'official_test';

    if (isSport && !credentialDraft.discipline.trim()) {
      setCredentialNotice('Indica la disciplina sportiva.');
      return;
    }

    if (
      isSport &&
      credentialDraft.discipline === 'igp' &&
      !['IGP1', 'IGP2', 'IGP3'].includes(credentialDraft.achievement)
    ) {
      setCredentialNotice('Per IGP seleziona IGP1, IGP2 o IGP3.');
      return;
    }

    if (
      isSport &&
      credentialDraft.discipline === 'igp' &&
      !credentialDraft.dog_name.trim()
    ) {
      setCredentialNotice(
        'Per un brevetto IGP indica il cane condotto: serve per misurare la replicabilità su cani diversi.'
      );
      return;
    }

    if (
      credentialFile &&
      !new Set([
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
      ]).has(credentialFile.type)
    ) {
      setCredentialNotice('Per l’evidenza usa PDF, JPG, PNG o WebP.');
      return;
    }

    if (credentialFile && credentialFile.size > 10 * 1024 * 1024) {
      setCredentialNotice('Il documento deve pesare meno di 10 MB.');
      return;
    }

    setCredentialBusy(true);
    setCredentialNotice('');

    const id = crypto.randomUUID();
    let documentPath: string | null = null;

    try {
      if (credentialFile) {
        const extension =
          credentialFile.type === 'application/pdf'
            ? 'pdf'
            : credentialFile.type === 'image/png'
              ? 'png'
              : credentialFile.type === 'image/webp'
                ? 'webp'
                : 'jpg';

        documentPath = `${user.id}/${id}/evidence.${extension}`;

        const { error: uploadError } = await supabase.storage
          .from('professional-credentials')
          .upload(documentPath, credentialFile, {
            upsert: false,
            contentType: credentialFile.type,
            cacheControl: '3600',
          });

        if (uploadError) throw uploadError;
      }

      const workingDogSource = isWorkingDogUrl(externalUrl);
      const hasEvidence = Boolean(documentPath || externalUrl);

      const sourceProvider = workingDogSource
        ? 'working_dog'
        : externalUrl
          ? 'external'
          : documentPath
            ? 'uploaded_document'
            : null;

      const { error: insertError } = await supabase
        .from('professional_credentials')
        .insert({
          id,
          professional_id: user.id,
          credential_type: credentialDraft.credential_type,
          title,
          enci_section: credentialDraft.credential_type === 'professional_qualification' && credentialDraft.enci_section ? Number(credentialDraft.enci_section) : null,
          issuer_name: credentialDraft.credential_type === 'professional_qualification' && credentialDraft.enci_section ? 'ENCI' : credentialDraft.issuer_name.trim() || null,
          issued_at: credentialDraft.issued_at || null,
          discipline: credentialDraft.discipline.trim() || null,
          achievement: credentialDraft.achievement.trim() || null,
          description: credentialDraft.description.trim() || null,
          external_url: externalUrl || null,
          document_path: documentPath,
          dog_name: isSport ? credentialDraft.dog_name.trim() || null : null,
          event_name: isSport ? credentialDraft.event_name.trim() || null : null,
          event_scope: isSport ? credentialDraft.event_scope || null : null,
          placement:
            isSport && Number(credentialDraft.placement) > 0
              ? Number(credentialDraft.placement)
              : null,
          score_text: isSport ? credentialDraft.score_text.trim() || null : null,
          source_provider: sourceProvider,
          is_public: credentialDraft.is_public,
          verification_status: hasEvidence ? 'pending' : 'self_declared',
        });

      if (insertError) {
        if (documentPath) {
          await supabase.storage
            .from('professional-credentials')
            .remove([documentPath]);
        }
        throw insertError;
      }

      let automaticMessage = '';

      if (workingDogSource) {
        try {
          const result = await verifyWorkingDogCredential(id);
          automaticMessage = result?.verified
            ? ' Working-Dog ha confermato automaticamente il risultato.'
            : ` Working-Dog collegato: ${
                result?.reason ||
                'la corrispondenza automatica non è sufficiente; resta in verifica.'
              }`;
        } catch (error) {
          console.warn('Working-Dog automatic verification error:', error);
          automaticMessage =
            ' Working-Dog collegato, ma la verifica automatica non è riuscita: la voce resta in verifica.';
        }
      }

      setCredentialDraft(EMPTY_CREDENTIAL);
      setCredentialFormOpen(false);
      setCredentialStage(0);
      setCredentialFile(null);
      setCredentialNotice(
        hasEvidence
          ? `Evidenza aggiunta.${automaticMessage}`
          : 'Voce aggiunta come dichiarazione non verificata.'
      );

      await loadCredentials();
    } catch (error) {
      setCredentialNotice(
        error instanceof Error
          ? error.message
          : 'Non è stato possibile aggiungere la credenziale.'
      );
    } finally {
      setCredentialBusy(false);
    }
  };

  const deleteCredential = async (credential: ProfessionalCredential) => {
    if (!user || credentialBusy) return;

    const confirmed = window.confirm(
      `Eliminare “${credential.title}” dal profilo professionale?`
    );
    if (!confirmed) return;

    setCredentialBusy(true);
    setCredentialNotice('');

    try {
      const { error: deleteError } = await supabase
        .from('professional_credentials')
        .delete()
        .eq('id', credential.id)
        .eq('professional_id', user.id);

      if (deleteError) throw deleteError;

      if (credential.document_path) {
        const { error: storageError } = await supabase.storage
          .from('professional-credentials')
          .remove([credential.document_path]);

        if (storageError) {
          console.warn('Credential evidence cleanup error:', storageError);
        }
      }

      setCredentialNotice('Voce eliminata.');
      await loadCredentials();
    } catch (error) {
      setCredentialNotice(
        error instanceof Error
          ? error.message
          : 'Non è stato possibile eliminare la voce.'
      );
    } finally {
      setCredentialBusy(false);
    }
  };

  const profileDirty = Boolean(savedState && (name !== savedState.name || Object.values(profileStepFields).flat().some(key => JSON.stringify(pro?.[key]) !== JSON.stringify(savedState.pro?.[key])) || JSON.stringify(rules) !== JSON.stringify(savedState.rules)));
  const evidenceDirty = JSON.stringify(credentialDraft) !== JSON.stringify(EMPTY_CREDENTIAL) || Boolean(credentialFile);
  useUnsavedChanges(profileDirty || evidenceDirty || workingDogProfileUrl !== (workingDogIdentity?.profile_url || '') || saving || brandingBusy || credentialBusy || workingDogBusy, '/pro/settings');

  useEffect(() => {
    setSaveMessage(''); setSaveError('');
    if (step) headingRef.current?.focus({ preventScroll: true });
  }, [step]);

  useEffect(() => {
    if (step !== 'area') return;
    let active = true;
    setCityError('');
    void loadItalianCities().then(rows => { if (active) setCities(rows); }).catch(() => { if (active) setCityError('Elenco comuni non disponibile. Riprova per cambiare zona.'); });
    return () => { active = false; };
  }, [step, cityAttempt]);

  const goNext = () => {
    const base = setupSteps.filter(item => item.group === 'base');
    const index = base.findIndex(item => item.id === step);
    navigate(index >= 0 && index < base.length - 1 ? setupPath(base[index + 1].id) : setupPath());
  };

  const saveProfile = async (continueAfter = false) => {
    if (!user || !pro || !rules || !step || !savedState || saveLock.current) return;
    saveLock.current = true; setSaving(true); setSaveError(''); setSaveMessage('');
    try {
      if (step === 'rules') {
        const values = ['min_lead_hours', 'cancellation_hours', 'min_duration_minutes', 'max_duration_minutes', 'buffer_minutes'];
        if (values.some(key => !Number.isFinite(Number(rules[key])) || Number(rules[key]) < 0) || Number(rules.min_duration_minutes) < 1 || Number(rules.max_duration_minutes) < Number(rules.min_duration_minutes)) throw new Error('Controlla i tempi: usa numeri positivi e una durata massima non inferiore alla minima.');
        const payload = Object.fromEntries(values.map(key => [key, Number(rules[key])]));
        const { error } = await supabase.from('booking_rules').upsert({ ...payload, professional_id: user.id });
        if (error) throw error;
        setSavedState(current => current && ({ ...current, rules: { ...rules } }));
      } else {
        const fields = profileStepFields[step];
        if (!fields) return;
        const payload = Object.fromEntries(fields.map(key => [key, pro[key] ?? null]));
        if (step === 'identity') {
          if (!name.trim()) throw new Error('Inserisci il tuo nome.');
          if (pro.listing_type !== 'individual' && !String(pro.business_name || '').trim()) throw new Error('Inserisci il nome dell’attività.');
          if (pro.listing_type === 'individual') { payload.business_name = null; payload.main_contact_name = null; payload.team_size = 1; }
        }
        if (step === 'area') {
          if (!String(pro.zone_text || '').trim()) throw new Error('Indica la zona in cui lavori.');
          if (!Number.isFinite(Number(pro.coverage_radius_km)) || Number(pro.coverage_radius_km) < 1 || !Number.isFinite(Number(pro.starting_price)) || Number(pro.starting_price) < 0) throw new Error('Controlla raggio di copertura e prezzo.');
          const normalized = normalizeCitySearch(pro.zone_text || '');
          const matches = cities.filter(city => normalizeCitySearch(cityLabel(city)) === normalized || normalizeCitySearch(city.name) === normalized);
          const selected = matches.length === 1 ? matches[0] : null;
          const legacyCity = findCityCoordinates(pro.zone_text || '');
          const unchanged = pro.zone_text === savedState.pro.zone_text;
          const latitude = selected?.lat ?? legacyCity?.latitude ?? (unchanged ? pro.latitude : null);
          const longitude = selected?.lng ?? legacyCity?.longitude ?? (unchanged ? pro.longitude : null);
          if (latitude == null || longitude == null) throw new Error('Scegli un comune dall’elenco, indicando anche la provincia se ci sono omonimi.');
          payload.latitude = latitude; payload.longitude = longitude;
        }
        if (step === 'story' && !String(pro.bio || '').trim()) throw new Error('Scrivi una breve presentazione del tuo lavoro.');
        if (step === 'experience') {
          const value = pro.experience_start_year == null ? null : Number(pro.experience_start_year);
          if (value !== null && (!Number.isInteger(value) || value < 1950 || value > new Date().getFullYear())) throw new Error('Controlla l’anno di inizio dell’attività.');
          payload.experience_start_year = value;
        }
        const { data: existing, error: readError } = await supabase.from('professionals').select('id').eq('id', user.id).maybeSingle();
        if (readError) throw readError;
        const result = existing
          ? await supabase.from('professionals').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', user.id)
          : await supabase.from('professionals').insert({ id: user.id, professional_type: pro.professional_type || 'trainer', listing_type: pro.listing_type || 'individual', ...payload });
        if (result.error) throw result.error;
        setProfileExists(true);
        if (step === 'identity') {
          const { error } = await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', user.id);
          if (error) throw error;
        }
        setPro(current => current && ({ ...current, ...payload }));
        setSavedState(current => current && ({ ...current, pro: { ...current.pro, ...payload }, name: step === 'identity' ? name.trim() : current.name }));
        if (step === 'identity') { setName(name.trim()); await refreshProfile(); }
      }
      setSaveMessage('Modifiche salvate. Puoi riprendere da qui anche in un secondo momento.');
      if (continueAfter) goNext();
    } catch (error) {
      setSaveError(error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Salvataggio non confermato. Riprova: i dati inseriti sono ancora qui.');
    } finally { saveLock.current = false; setSaving(false); }
  };



  const isIndividualProfile = (pro?.listing_type || 'individual') === 'individual';

  if (loadError) return <ProLayout active="settings"><div className="pg-shell"><p role="alert">{loadError}</p><button className="pg-primary" onClick={() => void load()}>Riprova</button></div></ProLayout>;
  if (loadingData || !pro || !rules || !savedState) return <ProLayout active="settings"><div className="pg-shell" role="status">Carico il tuo percorso…</div></ProLayout>;

  return <ProLayout active="settings"><div className="pg-shell">
    {!step ? <ProSetupOverview name={savedState.name} pro={profileExists ? savedState.pro : null} services={services} onOpen={id => navigate(setupPath(id))} /> : <>
      <button className="pg-back" disabled={saving || brandingBusy || credentialBusy || workingDogBusy} onClick={() => navigate(setupPath())}><ArrowLeft size={16} /> Il tuo percorso</button>
      <div className="pg-editor-layout">
        <nav className="pg-step-nav" aria-label="Passaggi del profilo">{setupSteps.map((item, i) => <button key={item.id} disabled={saving || brandingBusy || credentialBusy || workingDogBusy} aria-current={step === item.id ? 'step' : undefined} onClick={() => navigate(setupPath(item.id))}><span>{String(i + 1).padStart(2, '0')}</span>{item.short}</button>)}</nav>
        <section className="pg-editor-content">
          <header className="pg-editor-heading"><span className="pg-eyebrow">{currentStep?.group === 'base' ? 'LE BASI DEL PROFILO' : 'CURA IL TUO PROFILO'}</span><h1 ref={headingRef} tabIndex={-1}>{currentStep?.label}</h1><p>{currentStep?.description}</p></header>
          <div key={step} className="pg-panel-enter">
            <fieldset disabled={saving} className="pg-fields">
              {step === 'identity' && <>
<Section title="Come vuoi presentarti">          <Field label="Nome e cognome" value={name} onChange={setName} />

          <div>
            <label className="text-sm font-semibold text-stone-700">Tipo profilo</label>
            <select
              value={pro.listing_type || 'individual'}
              onChange={(e) => setPro({ ...pro, listing_type: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
            >
              <option value="individual">Professionista individuale</option>
              <option value="business">Attività professionale</option>
              <option value="center">Centro cinofilo</option>
              <option value="boarding_facility">Pensione / struttura</option>
            </select>
            <p className="text-xs text-stone-500 mt-1">
              Se scegli Professionista individuale, il profilo pubblico usa il tuo nome:
              i campi da organizzazione vengono nascosti e ignorati.
            </p>
          </div>

          {!isIndividualProfile && (
            <>
              <div className="grid md:grid-cols-2 gap-3">
                <Field
                  label="Referente principale"
                  value={pro.main_contact_name || ''}
                  onChange={(v) => setPro({ ...pro, main_contact_name: v })}
                />
                <Field
                  label="Numero persone nel team"
                  type="number"
                  value={String(pro.team_size ?? 1)}
                  onChange={(v) => setPro({ ...pro, team_size: Number(v) })}
                />
              </div>

              <Field
                label="Nome attività / struttura"
                value={pro.business_name || ''}
                onChange={(v) => setPro({ ...pro, business_name: v })}
              />
            </>
          )}

          <Field
            label="Partita IVA / identificativo fiscale professionale"
            value={pro.vat_number || ''}
            onChange={(v) => setPro({ ...pro, vat_number: v })}
          />

          <div>
            <label className="text-sm font-semibold text-stone-700">Attività principale</label>
            <select
              value={pro.professional_type || 'trainer'}
              onChange={(e) => setPro({ ...pro, professional_type: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
            >
              {pro.professional_type && !PROFESSIONAL_TYPES.some(type => type.value === pro.professional_type) && <option value={pro.professional_type}>Attività precedente (non più offerta al pubblico)</option>}
              {PROFESSIONAL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

</Section>              </>}
              {step === 'area' && <>
<Section title="La tua zona di lavoro">          <div className="grid md:grid-cols-3 gap-3">
            <label className="text-sm font-semibold text-stone-700">Comune o zona
              <input list="professional-city-options" value={pro.zone_text || ''} onChange={event => setPro({ ...pro, zone_text: event.target.value })} placeholder="Es. Rimini (RN)" className="mt-1 border w-full" />
              <datalist id="professional-city-options">{cities.filter(city => normalizeCitySearch(cityLabel(city)).includes(normalizeCitySearch(pro.zone_text || ''))).slice(0, 20).map(city => <option key={city.code} value={cityLabel(city)} />)}</datalist>
            </label>
            {cityError && <p role="status">{cityError} <button className="underline" onClick={() => setCityAttempt(value => value + 1)}>Riprova</button></p>}
            <Field
              label="Raggio di copertura (km)"
              type="number"
              value={String(pro.coverage_radius_km ?? 10)}
              onChange={(v) => setPro({ ...pro, coverage_radius_km: Number(v) })}
            />
            <Field
              label="Prezzo indicativo da (€)"
              type="number"
              value={String(pro.starting_price ?? 0)}
              onChange={(v) => setPro({ ...pro, starting_price: Number(v) })}
            />
          </div>

</Section>              </>}
              {step === 'story' && <>
<Section title="Cosa troveranno i clienti">          <div>
            <label className="text-sm font-semibold text-stone-700">Bio</label>
            <textarea
              value={pro.bio || ''}
              onChange={(e) => setPro({ ...pro, bio: e.target.value })}
              rows={4}
              className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
              placeholder="Racconta chi aiuti, come lavori e cosa può aspettarsi il proprietario."
            />
          </div>
</Section>              </>}
              {step === 'appearance' && <>
        {user && <>
          <ProfileImageEditor key={`${user.id}-avatar`} userId={user.id} kind="avatar" currentUrl={profile?.avatar_url} onActivity={setAvatarActive} onSaved={async () => { await refreshProfile(); }} />
          <ProfileImageEditor key={`${user.id}-cover`} userId={user.id} kind="cover" currentUrl={pro.cover_photo_url || ''} onActivity={setCoverActive} onSaved={url => {
            setPro(current => current && ({ ...current, cover_photo_url: url }));
            setSavedState(current => current && ({ ...current, pro: { ...current.pro, cover_photo_url: url } }));
          }} />
        </>}

<Section title="I tuoi collegamenti">          <div className="grid md:grid-cols-2 gap-3">
            <Field
              label="Sito web"
              value={pro.website_url || ''}
              onChange={(v) => setPro({ ...pro, website_url: v })}
            />
            <Field
              label="Profilo Instagram"
              value={pro.instagram_url || ''}
              onChange={(v) => setPro({ ...pro, instagram_url: v })}
            />
          </div>

</Section>              </>}
              {step === 'experience' && <>
                  <section className="pc-card p-6 md:p-7 mb-5">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_220px] gap-6 lg:items-end">
            <div>
              <p className="pc-kicker">Esperienza professionale</p>
              <h2 className="pc-display text-2xl md:text-3xl font-semibold text-[var(--pc-ink-950)] mt-2">
                Anno di inizio dell’attività professionale
              </h2>
              <p className="text-[var(--pc-muted-600)] leading-7 mt-3 max-w-2xl">
                PortaleCinofilo calcola gli anni di esperienza da questo anno.
                Non inseriamo più un numero di anni statico che diventa obsoleto col tempo.
              </p>

              <div className="flex flex-wrap gap-2 mt-4 text-xs font-bold">
                <span className="rounded-full bg-[var(--pc-bone-50)] px-3 py-1.5 text-[var(--pc-ink-800)]">
                  Dato dichiarato dal professionista
                </span>
                {pro.experience_verification_status === 'verified' ? (
                  <span className="rounded-full bg-[var(--pc-evidence-100)] px-3 py-1.5 text-[var(--pc-evidence-700)]">
                    Esperienza verificata
                  </span>
                ) : (
                  <span className="rounded-full border border-[var(--pc-line)] px-3 py-1.5 text-[var(--pc-muted-600)]">
                    Verifica documentale non completata
                  </span>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="experience-start-year"
                className="block text-sm font-bold text-[var(--pc-ink-950)]"
              >
                Anno di inizio
              </label>
              <input
                id="experience-start-year"
                type="number"
                inputMode="numeric"
                min="1950"
                max={new Date().getFullYear()}
                placeholder="es. 2018"
                value={pro.experience_start_year ?? ''}
                onChange={(event) =>
                  setPro({
                    ...pro,
                    experience_start_year:
                      event.target.value === '' ? null : Number(event.target.value),
                  })
                }
                className="mt-2 w-full rounded-xl border border-[var(--pc-line)] bg-white px-4 py-3 text-[var(--pc-ink-950)] focus:border-[var(--pc-forest-700)] focus:outline-none focus:ring-2 focus:ring-[var(--pc-forest-100)]"
              />

              {typeof pro.experience_start_year === 'number' &&
                pro.experience_start_year >= 1950 &&
                pro.experience_start_year <= new Date().getFullYear() && (
                  <p className="mt-2 text-sm font-semibold text-[var(--pc-forest-900)]">
                    {Math.max(0, new Date().getFullYear() - pro.experience_start_year)} anni di esperienza
                    calcolati automaticamente
                  </p>
                )}
            </div>
          </div>
        </section>

<Section title="Formazione e documenti">          <div>
            <label className="text-sm font-semibold text-stone-700">
              Sintesi formazione / qualifiche
            </label>
            <textarea
              value={pro.qualification_summary || ''}
              onChange={(e) =>
                setPro({ ...pro, qualification_summary: e.target.value })
              }
              rows={3}
              className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
              placeholder="Sintesi facoltativa. Le evidenze importanti vanno inserite sotto in forma strutturata."
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-stone-700">
              Assicurazione / documenti professionali
            </label>
            <textarea
              value={pro.insurance_summary || ''}
              onChange={(e) =>
                setPro({ ...pro, insurance_summary: e.target.value })
              }
              rows={2}
              className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
              placeholder="Es. assicurazione professionale, autorizzazioni, documentazione disponibile."
            />
          </div>

</Section>              </>}
              {step === 'credentials' && <>
<details className="pg-provider"><summary>Collega Working-Dog <span>Facoltativo, per chi pratica sport</span></summary>
          <div className="rounded-2xl border border-[var(--pc-line)] bg-[var(--pc-evidence-100)] p-5 md:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <p className="pc-kicker">Fonte sportiva</p>
                <h3 className="pc-display text-xl md:text-2xl font-semibold text-[var(--pc-ink-950)] mt-1">
                  Collega Working-Dog
                </h3>
                <p className="text-sm text-[var(--pc-muted-600)] leading-6 mt-2 max-w-3xl">
                  PortaleCinofilo controlla il profilo pubblico Working-Dog lato server.
                  Se nome e fonte coincidono, il collegamento viene verificato automaticamente.
                  Per ogni brevetto o risultato con URL Working-Dog il sistema controlla anche
                  disciplina, livello e cane prima di assegnare lo stato verificato.
                </p>
              </div>

              <div className="shrink-0">
                {workingDogIdentity?.verification_status === 'verified' ? (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-extrabold text-[var(--pc-evidence-700)] ring-1 ring-[var(--pc-line)]">
                    <BadgeCheck className="w-4 h-4" />
                    Working-Dog verificato
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-[var(--pc-muted-600)] ring-1 ring-[var(--pc-line)]">
                    Collegamento da verificare
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3 mt-5">
              <input
                type="url"
                value={workingDogProfileUrl}
                onChange={(event) => setWorkingDogProfileUrl(event.target.value)}
                placeholder="https://www.working-dog.com/..."
                className="flex-1 rounded-xl border border-[var(--pc-line)] bg-white px-4 py-3 text-sm text-[var(--pc-ink-950)]"
              />

              <button
                type="button"
                disabled={workingDogBusy}
                onClick={() => void connectWorkingDog()}
                className="pc-btn pc-btn-primary shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
                {workingDogBusy ? 'Controllo…' : 'Collega e verifica'}
              </button>
            </div>

            {workingDogNotice && (
              <p role="status" className="mt-3 text-sm font-semibold text-[var(--pc-ink-800)]">
                {workingDogNotice}
              </p>
            )}

            <p className="mt-3 text-xs leading-5 text-[var(--pc-muted-600)]">
              Un semplice link non basta: se la pagina non permette di confermare in modo
              univoco identità e risultato, la voce resta in verifica invece di ottenere
              automaticamente una medaglia.
            </p>
          </div>

</details>
          <div className="rounded-2xl border border-[var(--pc-line)] bg-[var(--pc-bone-50)] p-5 md:p-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <p className="pc-kicker">Evidenze professionali</p>
                <h3 className="pc-display text-xl md:text-2xl font-semibold text-[var(--pc-ink-950)] mt-1">
                  Attestati, brevetti e risultati
                </h3>
                <p className="text-sm text-[var(--pc-muted-600)] leading-6 mt-2 max-w-3xl">
                  I risultati sportivi vengono salvati come fatti: disciplina, livello,
                  cane, prova, piazzamento, punteggio e fonte. Questo consente di distinguere
                  un singolo risultato da una carriera replicata su cani diversi.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-2 text-xs font-bold text-[var(--pc-ink-800)] ring-1 ring-[var(--pc-line)]">
                <Trophy className="w-4 h-4 text-[var(--pc-evidence-700)]" />
                IGP → Obedience → Agility
              </div>
            </div>

            {!credentialFormOpen ? <button className="pg-primary mt-5" onClick={() => { setCredentialFormOpen(true); setCredentialStage(0); }}><Plus size={18} /> Aggiungi attestato o risultato</button> : <div className="pg-evidence-editor">
              <div className="pg-mini-steps" aria-label="Passaggi della nuova evidenza">{['Dati principali', 'Dettagli', 'Fonte e visibilità'].map((label, i) => <span key={label} aria-current={i === credentialStage ? 'step' : undefined}>{i + 1}. {label}</span>)}</div>
              <fieldset disabled={credentialBusy} className="grid md:grid-cols-2 gap-4 mt-5">
              {credentialStage === 0 && <>
              <label className="text-sm font-semibold text-stone-700">
                Tipo evidenza
                <select
                  value={credentialDraft.credential_type}
                  onChange={(event) =>
                    setCredentialDraft({
                      ...credentialDraft,
                      credential_type: event.target.value as CredentialType,
                      enci_section: '',
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                >
                  {CREDENTIAL_TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              {credentialDraft.credential_type === 'professional_qualification' && isIndividualProfile && <label className="text-sm font-semibold text-stone-700">
                Sezione ENCI (facoltativa)
                <select value={credentialDraft.enci_section} onChange={event => {
                  const section = event.target.value;
                  setCredentialDraft({ ...credentialDraft, enci_section: section,
                    ...(section ? { issuer_name: 'ENCI', title: `Addestratore ENCI · ${enciSectionLabel(Number(section))}` } : {}) });
                }} className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white">
                  <option value="">Altra qualifica / sezione non indicata</option>
                  {ENCI_SECTIONS.map(section => <option key={section.id} value={section.id}>{enciSectionLabel(section.id)}</option>)}
                </select>
                <span className="block text-xs font-normal mt-2">Aggiungi una voce per ciascuna sezione in cui sei iscritto. Una selezione è una dichiarazione: serve una fonte o un documento da verificare. Non cambia le ricerche in cui compari.</span>
              </label>}

              <Field
                label="Titolo"
                value={credentialDraft.title}
                onChange={(value) =>
                  setCredentialDraft({ ...credentialDraft, title: value })
                }
              />

              {credentialDraft.enci_section ? <div className="text-sm font-semibold text-stone-700">Ente / organizzatore<p className="mt-2 font-normal">ENCI</p></div> : <Field
                label="Ente / organizzatore"
                value={credentialDraft.issuer_name}
                onChange={(value) =>
                  setCredentialDraft({ ...credentialDraft, issuer_name: value })
                }
              />}

              <label className="text-sm font-semibold text-stone-700">
                Data
                <input
                  type="date"
                  value={credentialDraft.issued_at}
                  onChange={(event) =>
                    setCredentialDraft({
                      ...credentialDraft,
                      issued_at: event.target.value,
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                />
              </label>

              </>}
              {credentialStage === 1 && <>
              {(credentialDraft.credential_type === 'sport_result' ||
                credentialDraft.credential_type === 'official_test') ? (
                <>
                  <label className="text-sm font-semibold text-stone-700">
                    Disciplina
                    <select
                      value={credentialDraft.discipline}
                      onChange={(event) =>
                        setCredentialDraft({
                          ...credentialDraft,
                          discipline: event.target.value,
                          achievement:
                            event.target.value === 'igp'
                              ? credentialDraft.achievement
                              : '',
                        })
                      }
                      className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                    >
                      <option value="">Seleziona disciplina</option>
                      <option value="igp">IGP</option>
                      <option value="obedience">Obedience</option>
                      <option value="agility">Agility</option>
                      <option value="other">Altra disciplina</option>
                    </select>
                  </label>

                  {credentialDraft.discipline === 'igp' ? (
                    <label className="text-sm font-semibold text-stone-700">
                      Livello IGP
                      <select
                        value={credentialDraft.achievement}
                        onChange={(event) =>
                          setCredentialDraft({
                            ...credentialDraft,
                            achievement: event.target.value,
                          })
                        }
                        className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                      >
                        <option value="">Seleziona livello</option>
                        <option value="IGP1">IGP1 · Bronzo</option>
                        <option value="IGP2">IGP2 · Argento</option>
                        <option value="IGP3">IGP3 · Oro / Maestro Addestratore</option>
                      </select>
                    </label>
                  ) : (
                    <Field
                      label="Livello / risultato"
                      value={credentialDraft.achievement}
                      onChange={(value) =>
                        setCredentialDraft({
                          ...credentialDraft,
                          achievement: value,
                        })
                      }
                    />
                  )}

                  <Field
                    label="Cane condotto"
                    value={credentialDraft.dog_name}
                    onChange={(value) =>
                      setCredentialDraft({ ...credentialDraft, dog_name: value })
                    }
                  />

                  <Field
                    label="Prova / gara"
                    value={credentialDraft.event_name}
                    onChange={(value) =>
                      setCredentialDraft({ ...credentialDraft, event_name: value })
                    }
                  />

                  <label className="text-sm font-semibold text-stone-700">
                    Livello competizione
                    <select
                      value={credentialDraft.event_scope}
                      onChange={(event) =>
                        setCredentialDraft({
                          ...credentialDraft,
                          event_scope: event.target.value,
                        })
                      }
                      className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                    >
                      <option value="">Non specificato</option>
                      <option value="club">Club / prova locale</option>
                      <option value="regional">Regionale</option>
                      <option value="national">Nazionale</option>
                      <option value="international">Internazionale</option>
                      <option value="world">Mondiale</option>
                    </select>
                  </label>

                  <Field
                    label="Piazzamento"
                    type="number"
                    value={credentialDraft.placement}
                    onChange={(value) =>
                      setCredentialDraft({ ...credentialDraft, placement: value })
                    }
                  />

                  <Field
                    label="Punteggio / dettaglio"
                    value={credentialDraft.score_text}
                    onChange={(value) =>
                      setCredentialDraft({ ...credentialDraft, score_text: value })
                    }
                  />
                </>
              ) : (
                <>
                  <Field
                    label="Disciplina / ambito"
                    value={credentialDraft.discipline}
                    onChange={(value) =>
                      setCredentialDraft({ ...credentialDraft, discipline: value })
                    }
                  />

                  <Field
                    label="Livello / risultato"
                    value={credentialDraft.achievement}
                    onChange={(value) =>
                      setCredentialDraft({ ...credentialDraft, achievement: value })
                    }
                  />
                </>
              )}

              </>}
              {credentialStage === 2 && <>
              <div className="md:col-span-2">
                <Field
                  label="Working-Dog / fonte ufficiale URL"
                  value={credentialDraft.external_url}
                  onChange={(value) =>
                    setCredentialDraft({ ...credentialDraft, external_url: value })
                  }
                />
                <p className="text-xs text-stone-500 mt-1">
                  Se il link è Working-Dog, PortaleCinofilo prova la verifica automatica
                  lato server. Le altre fonti restano disponibili per revisione.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-stone-700">
                  Descrizione facoltativa
                </label>
                <textarea
                  value={credentialDraft.description}
                  onChange={(event) =>
                    setCredentialDraft({
                      ...credentialDraft,
                      description: event.target.value,
                    })
                  }
                  rows={2}
                  className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white"
                  placeholder="Contesto utile non già rappresentato dai campi strutturati."
                />
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="pc-btn pc-btn-secondary cursor-pointer">
                  <FileUp className="w-4 h-4" />
                  {credentialFile ? 'Cambia documento' : 'Carica attestato / prova'}
                  <input
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    className="sr-only"
                    onChange={(event) => {
                      setCredentialFile(event.target.files?.[0] || null);
                      event.currentTarget.value = '';
                    }}
                  />
                </label>

                {credentialFile && (
                  <span className="text-sm text-[var(--pc-muted-600)] break-all">
                    {credentialFile.name}
                  </span>
                )}

                <label className="sm:ml-auto inline-flex items-center gap-2 text-sm font-semibold text-[var(--pc-ink-800)]">
                  <input
                    type="checkbox"
                    checked={credentialDraft.is_public}
                    onChange={(event) =>
                      setCredentialDraft({
                        ...credentialDraft,
                        is_public: event.target.checked,
                      })
                    }
                  />
                  Mostra questa voce nel profilo pubblico
                </label>
              </div>
              </>}
              </fieldset>
              {credentialStage === 2 && <>
            <div className="flex flex-wrap items-center gap-3 mt-5">
              <button
                type="button"
                disabled={credentialBusy}
                onClick={() => void submitCredential()}
                className="pc-btn pc-btn-primary"
              >
                <Plus className="w-4 h-4" />
                {credentialBusy ? 'Salvataggio…' : 'Aggiungi evidenza'}
              </button>

              <span className="text-xs text-[var(--pc-muted-600)]">
                PDF/JPG/PNG/WebP · max 10 MB
              </span>
            </div>

              </>}
              <div className="pg-editor-actions"><button type="button" disabled={credentialBusy} className="pg-secondary" onClick={() => credentialStage > 0 ? setCredentialStage(credentialStage - 1) : setCredentialFormOpen(false)}>{credentialStage > 0 ? 'Indietro' : 'Chiudi bozza'}</button>
              {credentialStage < 2 && <button className="pg-primary" disabled={credentialBusy || (credentialStage === 0 && !credentialDraft.title.trim())} onClick={() => setCredentialStage(credentialStage + 1)}>Continua <ArrowRight size={16} /></button>}</div>
            </div>}

            {credentialNotice && (
              <p role="status" className="mt-3 text-sm font-semibold text-[var(--pc-ink-800)]">
                {credentialNotice}
              </p>
            )}

            <div className="mt-7">
              <h4 className="font-bold text-[var(--pc-ink-950)]">
                Evidenze inserite
              </h4>

              {credentialsLoading ? (
                <p className="text-sm text-[var(--pc-muted-600)] mt-3">Caricamento…</p>
              ) : credentials.length === 0 ? (
                <p className="text-sm text-[var(--pc-muted-600)] mt-3">
                  Nessun attestato o risultato ancora inserito.
                </p>
              ) : (
                <div className="grid gap-3 mt-3">
                  {credentials.map((credential) => (
                    <article
                      key={credential.id}
                      className="rounded-xl bg-white p-4 ring-1 ring-[var(--pc-line)]"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            {credential.credential_type === 'sport_result' ||
                            credential.credential_type === 'official_test' ? (
                              <Trophy className="w-4 h-4 text-[var(--pc-evidence-700)]" />
                            ) : (
                              <Award className="w-4 h-4 text-[var(--pc-forest-700)]" />
                            )}

                            <h5 className="font-extrabold text-[var(--pc-ink-950)]">
                              {credential.title}
                            </h5>

                            <span className="rounded-full bg-[var(--pc-bone-50)] px-2.5 py-1 text-xs font-bold text-[var(--pc-muted-600)]">
                              {credentialStatusLabel(credential.verification_status)}
                            </span>

                            {credential.verification_method === 'working_dog_auto' && (
                              <span className="rounded-full bg-[var(--pc-evidence-100)] px-2.5 py-1 text-xs font-extrabold text-[var(--pc-evidence-700)]">
                                Working-Dog automatico
                              </span>
                            )}
                          </div>

                          <p className="text-sm text-[var(--pc-muted-600)] mt-2">
                            {[
                              credential.discipline?.toUpperCase(),
                              credential.achievement,
                              credential.dog_name
                                ? `con ${credential.dog_name}`
                                : null,
                              credential.event_name,
                              credential.issuer_name,
                            ]
                              .filter(Boolean)
                              .join(' · ') || 'Dettagli non indicati'}
                          </p>

                          {credential.verification_note && (
                            <p className="mt-2 text-xs text-[var(--pc-muted-600)]">
                              {credential.verification_note}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-3 mt-2 text-xs font-semibold">
                            {credential.document_path && (
                              <span className="text-[var(--pc-forest-900)]">
                                Documento privato caricato
                              </span>
                            )}

                            {credential.external_url && (
                              <a
                                href={credential.external_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[var(--pc-evidence-700)] hover:underline"
                              >
                                Fonte esterna
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}

                            <span className="text-[var(--pc-muted-600)]">
                              {credential.is_public ? 'Visibile pubblicamente' : 'Privata'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          disabled={credentialBusy}
                          onClick={() => void deleteCredential(credential)}
                          className="inline-flex items-center gap-1.5 text-sm font-bold text-rose-700 hover:bg-rose-50 rounded-full px-3 py-1.5 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                          Elimina
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
              </>}
              {step === 'services' && <>
<CalendarServices key={user?.id} services={services} onChange={setServices} defaultType={pro.professional_type} />              </>}
              {step === 'visibility' && <>
<ProfessionalSearchSettings key={user?.id} services={services} professionalType={pro.professional_type} />              </>}
              {step === 'replies' && <>
<ProfessionalReplyTemplates key={user?.id} />              </>}
              {step === 'rules' && <>
        <Section title="Tempi delle prenotazioni">
          <div className="grid md:grid-cols-2 gap-3">
            <Field
              label="Anticipo minimo (ore)"
              type="number"
              value={String(rules.min_lead_hours)}
              onChange={(v) => setRules({ ...rules, min_lead_hours: Number(v) })}
            />
            <Field
              label="Termine cancellazione (ore)"
              type="number"
              value={String(rules.cancellation_hours)}
              onChange={(v) => setRules({ ...rules, cancellation_hours: Number(v) })}
            />
            <Field
              label="Durata minima (minuti)"
              type="number"
              value={String(rules.min_duration_minutes)}
              onChange={(v) => setRules({ ...rules, min_duration_minutes: Number(v) })}
            />
            <Field
              label="Durata massima (minuti)"
              type="number"
              value={String(rules.max_duration_minutes)}
              onChange={(v) => setRules({ ...rules, max_duration_minutes: Number(v) })}
            />
            <Field
              label="Pausa tra appuntamenti (minuti)"
              type="number"
              value={String(rules.buffer_minutes)}
              onChange={(v) => setRules({ ...rules, buffer_minutes: Number(v) })}
            />
          </div>
        </Section>

              </>}
              {step === 'verification' && <>
<ApprovalBox status={(pro.approval_status || "pending") as ApprovalStatus} approved={!!pro.approved} adminNotes={pro.admin_notes} rejectionReason={pro.rejection_reason} />        <Section title="Verifica dei contatti">
          <VerifyLine
            icon={<Mail className="w-4 h-4" />}
            label="Email"
            value={profile?.email || ''}
            verified={profile?.email_verified || false}
            onVerify={() => setVerifying('email')}
          />
          <VerifyLine
            icon={<Phone className="w-4 h-4" />}
            label="Telefono"
            value={profile?.phone || ''}
            verified={profile?.phone_verified || false}
            onVerify={() => setVerifying('phone')}
          />
        <button type="button" onClick={() => navigate('/account/contacts')} className="mt-4 rounded-xl border border-emerald-700 px-4 py-3 font-semibold text-emerald-800">Modifica email o telefono</button>
        </Section>

              </>}
            </fieldset>
          </div>
          {saveError && <p role="alert" className="pg-error">{saveError}</p>}
          {saveMessage && <p role="status" className="pg-success"><Check size={18} /> {saveMessage}</p>}
          <footer className="pg-editor-footer">
            {profileStepFields[step] || step === 'rules' ? <><button className="pg-primary" disabled={saving} onClick={() => void saveProfile(true)}>{saving ? 'Salvataggio…' : currentStep?.group === 'base' ? 'Salva e continua' : 'Salva e torna al percorso'}<ArrowRight size={16} /></button><button className="pg-secondary" disabled={saving} onClick={() => void saveProfile()}><Save size={16} /> Salva</button><span>Salva questo passaggio prima di uscire.</span></> : <button className="pg-secondary" onClick={goNext}>Torna al percorso <ArrowRight size={16} /></button>}
          </footer>
        </section>
      </div>
    </>}
  </div>
  {verifying && <VerificationModal type={verifying} target={verifying === 'email' ? profile?.email || '' : profile?.phone || ''} onClose={() => setVerifying(null)} onVerified={() => setVerifying(null)} />}
  </ProLayout>;
}

function ApprovalBox({
  status,
  approved,
  adminNotes,
  rejectionReason,
}: {
  status: ApprovalStatus;
  approved: boolean;
  adminNotes?: string | null;
  rejectionReason?: string | null;
}) {
  if (status === 'approved' && approved) {
    return (
      <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-700 mt-0.5" />
        <div>
          <div className="font-bold text-emerald-900">Approvato</div>
          <p className="text-sm text-emerald-800 mt-1">
            L’approvazione è confermata. La comparsa nelle ricerche dipende anche dai servizi attivi e dalle tue preferenze.
          </p>
          {adminNotes && <p className="text-xs text-emerald-700 mt-2">Nota amministrazione: {adminNotes}</p>}
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="mb-5 bg-rose-50 border border-rose-200 rounded-2xl p-5 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-700 mt-0.5" />
        <div>
          <div className="font-bold text-rose-900">Da rivedere</div>
          <p className="text-sm text-rose-800 mt-1">
            Aggiorna le informazioni richieste e contatta l’amministrazione per una nuova revisione.
          </p>
          {rejectionReason && <p className="text-xs text-rose-700 mt-2">Motivo: {rejectionReason}</p>}
          {adminNotes && <p className="text-xs text-rose-700 mt-1">Nota amministrazione: {adminNotes}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
      <Clock className="w-5 h-5 text-amber-700 mt-0.5" />
      <div>
        <div className="font-bold text-amber-900">In attesa di approvazione</div>
        <p className="text-sm text-amber-800 mt-1">
          Completa le informazioni essenziali. L’amministrazione deve approvare il profilo prima che sia disponibile nella ricerca.
        </p>
        {adminNotes && <p className="text-xs text-amber-700 mt-2">Nota amministrazione: {adminNotes}</p>}
      </div>
    </div>
  );
}

function VerifyLine({
  icon,
  label,
  value,
  verified,
  onVerify,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  verified: boolean;
  onVerify: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-3 text-sm">
        <div className="text-stone-500">{icon}</div>
        <div>
          <div className="font-semibold text-stone-900">{label}</div>
          <div className="text-xs text-stone-500">{value || 'Non indicato'}</div>
        </div>
      </div>
      {verified ? (
        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1 font-semibold">
          <BadgeCheck className="w-3 h-3" /> Verificato
        </span>
      ) : (
        <button
          type="button"
          onClick={onVerify}
          disabled={!value}
          className="text-xs bg-amber-500 text-white hover:bg-amber-600 px-3 py-1 rounded-full font-semibold disabled:opacity-50"
        >
          Verifica
        </button>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pg-form-section">
      <h2 className="text-lg font-bold text-stone-900 mb-4">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="text-sm font-semibold text-stone-700">{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
      />
    </div>
  );
}
