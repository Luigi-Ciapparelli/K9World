import { useEffect, useState } from 'react';
import {
  Save,
  Mail,
  Phone,
  BadgeCheck,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Camera,
  Upload,
  Trash2,
  Award,
  ExternalLink,
  FileUp,
  Plus,
  Trophy,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';
import { VerificationModal } from '../../components/VerificationModal';
import { ProLayout } from './ProLayout';
import { CalendarServices } from '../../components/CalendarServices';
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

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

const PROFESSIONAL_TYPES = [
  { value: 'walker', label: 'Dog walker' },
  { value: 'trainer', label: 'Trainer / Educator' },
  { value: 'boarding', label: 'Boarding' },
  { value: 'sitter', label: 'Pet sitter' },
  { value: 'groomer', label: 'Groomer' },
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


function getBrandingInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

function professionalBrandingObjectPath(url: string | null | undefined) {
  if (!url) return null;
  const marker = '/storage/v1/object/public/professional-branding/';
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split('?')[0] || '') || null;
}

export function ProSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const [pro, setPro] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [rules, setRules] = useState<any>(null);
  const [name, setName] = useState(profile?.full_name || '');
  const [verifying, setVerifying] = useState<'email' | 'phone' | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brandingFile, setBrandingFile] = useState<File | null>(null);
  const [brandingPreview, setBrandingPreview] = useState('');
  const [brandingBusy, setBrandingBusy] = useState(false);
  const [brandingStatus, setBrandingStatus] = useState('');
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

  const load = async () => {
    if (!user) return;

    setLoadingData(true);

    const [p, s, r] = await Promise.all([
      supabase.from('professionals').select('*').eq('id', user.id).maybeSingle(),
      supabase.from('services').select('*').eq('professional_id', user.id).order('created_at', { ascending: false }),
      supabase.from('booking_rules').select('*').eq('professional_id', user.id).maybeSingle(),
    ]);

    if (p.error) {
      console.error('Professionista settings load error:', p.error);
      alert(p.error.message);
    }

    if (s.error) {
      console.error('Services load error:', s.error);
      alert(s.error.message);
    }

    if (r.error) {
      console.error('Booking rules load error:', r.error);
    }

    setPro(
      p.data || {
        id: user.id,
        professional_type: 'walker',
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
    setRules(
      r.data || {
        min_lead_hours: 4,
        cancellation_hours: 24,
        min_duration_minutes: 30,
        max_duration_minutes: 480,
        buffer_minutes: 15,
      }
    );

    setLoadingData(false);
  };

  useEffect(() => {
    if (!user) return;
    setName(profile?.full_name || '');
    load();
  }, [user, profile?.full_name]);


  const selectBrandingFile = (file: File) => {
    setBrandingStatus('');
    const allowed = new Set(['image/jpeg', 'image/png', 'image/webp']);

    if (!allowed.has(file.type)) {
      setBrandingStatus('Usa un file JPG, PNG o WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setBrandingStatus('L’immagine deve pesare meno di 5 MB.');
      return;
    }

    if (brandingPreview) URL.revokeObjectURL(brandingPreview);
    setBrandingFile(file);
    setBrandingPreview(URL.createObjectURL(file));
  };

  const cancelBrandingSelection = () => {
    if (brandingPreview) URL.revokeObjectURL(brandingPreview);
    setBrandingFile(null);
    setBrandingPreview('');
    setBrandingStatus('');
  };

  const uploadBrandingImage = async () => {
    if (!user || !brandingFile) return;

    setBrandingBusy(true);
    setBrandingStatus('');

    try {
      const extension =
        brandingFile.type === 'image/png'
          ? 'png'
          : brandingFile.type === 'image/webp'
            ? 'webp'
            : 'jpg';

      const previousUrl = profile?.avatar_url || '';
      const previousPath = professionalBrandingObjectPath(previousUrl);
      const objectPath = `${user.id}/identity-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('professional-branding')
        .upload(objectPath, brandingFile, {
          upsert: false,
          contentType: brandingFile.type,
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('professional-branding')
        .getPublicUrl(objectPath);

      const publicUrl = publicUrlData.publicUrl;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (profileError) {
        await supabase.storage.from('professional-branding').remove([objectPath]);
        throw profileError;
      }

      if (previousPath && previousPath !== objectPath) {
        const { error: cleanupError } = await supabase.storage
          .from('professional-branding')
          .remove([previousPath]);
        if (cleanupError) console.warn('Professional branding cleanup error:', cleanupError);
      }

      if (brandingPreview) URL.revokeObjectURL(brandingPreview);
      setBrandingFile(null);
      setBrandingPreview('');
      await refreshProfile();
      setBrandingStatus('Immagine pubblica aggiornata.');
    } catch (error) {
      setBrandingStatus(
        error instanceof Error ? error.message : 'Impossibile aggiornare l’immagine.'
      );
    } finally {
      setBrandingBusy(false);
    }
  };

  const removeBrandingImage = async () => {
    if (!user || !profile?.avatar_url) return;

    setBrandingBusy(true);
    setBrandingStatus('');

    try {
      const previousPath = professionalBrandingObjectPath(profile.avatar_url);

      if (previousPath) {
        const { error: removeError } = await supabase.storage
          .from('professional-branding')
          .remove([previousPath]);
        if (removeError) throw removeError;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ avatar_url: '' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      await refreshProfile();
      setBrandingStatus('Immagine rimossa. Nella ricerca verranno mostrate le iniziali.');
    } catch (error) {
      setBrandingStatus(
        error instanceof Error ? error.message : 'Impossibile rimuovere l’immagine.'
      );
    } finally {
      setBrandingBusy(false);
    }
  };



  const loadCredentials = async () => {
    if (!user) {
      setCredentials([]);
      setWorkingDogIdentity(null);
      return;
    }

    setCredentialsLoading(true);

    const [credentialsRes, identityRes] = await Promise.all([
      supabase
        .from('professional_credentials')
        .select(
          'id, professional_id, credential_type, title, issuer_name, issued_at, discipline, achievement, description, external_url, document_path, dog_name, event_name, event_scope, placement, score_text, source_provider, verification_method, source_verified_at, source_checked_at, verification_note, is_public, verification_status'
        )
        .eq('professional_id', user.id)
        .order('issued_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }),

      supabase
        .from('professional_external_identities')
        .select(
          'id, provider, profile_url, external_display_name, verification_status, verification_method, verified_at, last_checked_at, verification_note'
        )
        .eq('professional_id', user.id)
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
  };

  useEffect(() => {
    if (!user) return;
    void loadCredentials();
  }, [user?.id]);

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
          issuer_name: credentialDraft.issuer_name.trim() || null,
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

  const saveProfile = async () => {
    if (!user || !pro) return;

    setSaving(true);

    const city = findCityCoordinates(pro.zone_text || '');

    const currentYear = new Date().getFullYear();
    const parsedExperienceStartYear =
      pro.experience_start_year === null ||
      pro.experience_start_year === undefined ||
      String(pro.experience_start_year).trim() === ''
        ? null
        : Number(pro.experience_start_year);

    if (
      parsedExperienceStartYear !== null &&
      (!Number.isInteger(parsedExperienceStartYear) ||
        parsedExperienceStartYear < 1950 ||
        parsedExperienceStartYear > currentYear)
    ) {
      setSaving(false);
      alert(`Inserisci un anno di inizio compreso tra 1950 e ${currentYear}.`);
      return;
    }

    const normalizedExperienceStartYear = parsedExperienceStartYear;

    const professionalPayload = {
      professional_type: pro.professional_type || 'walker',
      bio: pro.bio || '',
      zone_text: pro.zone_text || '',
      latitude: city?.latitude ?? pro.latitude ?? null,
      longitude: city?.longitude ?? pro.longitude ?? null,
      coverage_radius_km: Number(pro.coverage_radius_km) || 10,
      starting_price: Number(pro.starting_price) || 0,
      cover_photo_url:
        (pro.listing_type || 'individual') === 'individual'
          ? null
          : pro.cover_photo_url || null,
      business_name:
        (pro.listing_type || 'individual') === 'individual'
          ? null
          : pro.business_name || null,
      vat_number: pro.vat_number || null,
      website_url: pro.website_url || null,
      instagram_url: pro.instagram_url || null,
      experience_start_year: normalizedExperienceStartYear,
      qualification_summary: pro.qualification_summary || null,
      insurance_summary: pro.insurance_summary || null,
      listing_type: pro.listing_type || 'individual',
      main_contact_name:
        (pro.listing_type || 'individual') === 'individual'
          ? null
          : pro.main_contact_name || null,
      has_facility: !!pro.has_facility,
      facility_description: pro.facility_description || null,
      team_size:
        (pro.listing_type || 'individual') === 'individual'
          ? 1
          : Number(pro.team_size) || 1,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: name })
      .eq('id', user.id);

    if (profileError) {
      setSaving(false);
      alert(profileError.message);
      return;
    }

    const { data: existingProfessionista, error: existingProfessionistaError } = await supabase
      .from('professionals')
      .select('id')
      .eq('id', user.id)
      .maybeSingle();

    if (existingProfessionistaError) {
      setSaving(false);
      alert(existingProfessionistaError.message);
      return;
    }

    const professionalResult = existingProfessionista
      ? await supabase
          .from('professionals')
          .update(professionalPayload)
          .eq('id', user.id)
      : await supabase
          .from('professionals')
          .insert({
            id: user.id,
            ...professionalPayload,
          });

    const professionalError = professionalResult.error;

    if (professionalError) {
      setSaving(false);
      alert(professionalError.message);
      return;
    }

    if (rules) {
      const { error: rulesError } = await supabase
        .from('booking_rules')
        .upsert({ ...rules, professional_id: user.id });

      if (rulesError) {
        setSaving(false);
        alert(rulesError.message);
        return;
      }
    }

    await refreshProfile();
    await load();

    setSaving(false);
    alert('Profile saved. Admin approval status is unchanged.');
  };

  const brandingImage = brandingPreview || profile?.avatar_url || '';
  const brandingInitials = getBrandingInitials(name || profile?.full_name || 'PC') || 'PC';

  const isIndividualProfile = (pro?.listing_type || 'individual') === 'individual';

  if (loadingData || !pro || !rules) {
    return (
      <ProLayout active="settings">
        <div className="p-8">Loading...</div>
      </ProLayout>
    );
  }

  return (
    <ProLayout active="settings">
      <div className="p-8 max-w-5xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-stone-900">Professionista profile</h1>
          <p className="text-stone-600 mt-1">
            Complete your profile so admins can verify you and clients can trust your services.
          </p>
        </div>

        <ApprovalBox
          status={(pro.approval_status || 'pending') as ApprovalStatus}
          approved={!!pro.approved}
          adminNotes={pro.admin_notes}
          rejectionReason={pro.rejection_reason}
        />

        <section className="pc-card relative overflow-hidden mb-5">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-52 w-52 rounded-full bg-[var(--pc-forest-100)] opacity-70 blur-3xl"
          />
          <div className="relative p-6 md:p-7">
            <div className="grid md:grid-cols-[144px_minmax(0,1fr)] gap-6 items-center">
              <div className="w-36 h-36 rounded-[1.6rem] overflow-hidden bg-white ring-1 ring-[var(--pc-line)] shadow-sm">
                {brandingImage ? (
                  <img
                    src={brandingImage}
                    alt="Anteprima immagine profilo o logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[var(--pc-forest-100)] text-[var(--pc-forest-900)] flex items-center justify-center pc-display text-3xl font-semibold">
                    {brandingInitials}
                  </div>
                )}
              </div>

              <div>
                <p className="pc-kicker">Identità pubblica</p>
                <h2 className="pc-display text-2xl md:text-3xl font-semibold text-[var(--pc-ink-950)] mt-2">
                  Immagine profilo o logo
                </h2>
                <p className="text-[var(--pc-muted-600)] leading-7 mt-3 max-w-2xl">
                  È l’immagine principale che le persone vedono nella ricerca e nel profilo pubblico.
                  Può essere una tua foto professionale oppure il logo della tua attività.
                </p>

                <div className="flex flex-wrap gap-3 mt-5">
                  <label className="pc-btn pc-btn-secondary cursor-pointer">
                    <Camera className="w-4 h-4" />
                    {brandingImage ? 'Scegli un’altra immagine' : 'Aggiungi foto o logo'}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) selectBrandingFile(file);
                        event.currentTarget.value = '';
                      }}
                    />
                  </label>

                  {brandingFile && (
                    <>
                      <button
                        type="button"
                        onClick={() => void uploadBrandingImage()}
                        disabled={brandingBusy}
                        className="pc-btn pc-btn-primary"
                      >
                        <Upload className="w-4 h-4" />
                        {brandingBusy ? 'Caricamento…' : 'Pubblica immagine'}
                      </button>
                      <button
                        type="button"
                        onClick={cancelBrandingSelection}
                        disabled={brandingBusy}
                        className="px-4 py-2 text-sm font-bold text-[var(--pc-muted-600)] hover:text-[var(--pc-ink-950)]"
                      >
                        Annulla
                      </button>
                    </>
                  )}

                  {!brandingFile && profile?.avatar_url && (
                    <button
                      type="button"
                      onClick={() => void removeBrandingImage()}
                      disabled={brandingBusy}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Rimuovi immagine
                    </button>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[var(--pc-muted-600)]">
                  <span>JPG, PNG o WebP</span>
                  <span>Massimo 5 MB</span>
                  <span>Formato quadrato consigliato</span>
                </div>

                {brandingStatus && (
                  <p role="status" className="mt-3 text-sm font-semibold text-[var(--pc-ink-800)]">
                    {brandingStatus}
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <Section title="Account verification">
          <VerifyLine
            icon={<Mail className="w-4 h-4" />}
            label="Email"
            value={profile?.email || ''}
            verified={profile?.email_verified || false}
            onVerify={() => setVerifying('email')}
          />
          <VerifyLine
            icon={<Phone className="w-4 h-4" />}
            label="Phone"
            value={profile?.phone || ''}
            verified={profile?.phone_verified || false}
            onVerify={() => setVerifying('phone')}
          />
        </Section>

        <Section title="Business details">
          <Field label="Full name" value={name} onChange={setName} />

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

          <div className="grid md:grid-cols-2 gap-3">
            <Field
              label="Website URL"
              value={pro.website_url || ''}
              onChange={(v) => setPro({ ...pro, website_url: v })}
            />
            <Field
              label="Instagram URL"
              value={pro.instagram_url || ''}
              onChange={(v) => setPro({ ...pro, instagram_url: v })}
            />
          </div>

          {!isIndividualProfile && (
            <div>
              <Field
                label="URL foto copertina attività"
                value={pro.cover_photo_url || ''}
                onChange={(v) => setPro({ ...pro, cover_photo_url: v })}
              />
              <p className="text-xs text-stone-500 mt-1">
                Foto orizzontale della sede, campo o struttura. Non viene richiesta
                al professionista individuale.
              </p>
            </div>
          )}
        </Section>

        <Section title="Public profile">
          <div>
            <label className="text-sm font-semibold text-stone-700">Professionista type</label>
            <select
              value={pro.professional_type || 'walker'}
              onChange={(e) => setPro({ ...pro, professional_type: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
            >
              {PROFESSIONAL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-3 gap-3">
            <Field
              label="Zone / area, e.g. Rimini"
              value={pro.zone_text || ''}
              onChange={(v) => setPro({ ...pro, zone_text: v })}
            />
            <Field
              label="Coverage radius (km)"
              type="number"
              value={String(pro.coverage_radius_km ?? 10)}
              onChange={(v) => setPro({ ...pro, coverage_radius_km: Number(v) })}
            />
            <Field
              label="Starting price (€)"
              type="number"
              value={String(pro.starting_price ?? 0)}
              onChange={(v) => setPro({ ...pro, starting_price: Number(v) })}
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-stone-700">Bio</label>
            <textarea
              value={pro.bio || ''}
              onChange={(e) => setPro({ ...pro, bio: e.target.value })}
              rows={4}
              className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
              placeholder="Tell clients who you are, your experience, and what kind of dogs you work with."
            />
          </div>
        </Section>

        <Section title="Experience and verification details">
          <div>
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

            <div className="grid md:grid-cols-2 gap-4 mt-6">
              <label className="text-sm font-semibold text-stone-700">
                Tipo evidenza
                <select
                  value={credentialDraft.credential_type}
                  onChange={(event) =>
                    setCredentialDraft({
                      ...credentialDraft,
                      credential_type: event.target.value as CredentialType,
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

              <Field
                label="Titolo"
                value={credentialDraft.title}
                onChange={(value) =>
                  setCredentialDraft({ ...credentialDraft, title: value })
                }
              />

              <Field
                label="Ente / organizzatore"
                value={credentialDraft.issuer_name}
                onChange={(value) =>
                  setCredentialDraft({ ...credentialDraft, issuer_name: value })
                }
              />

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
            </div>

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
        </Section>

        <Section title="Servizi e colori del calendario">
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

        <CalendarServices key={user?.id} services={services} onChange={setServices} />
        </Section>

        <Section title="Messaggi e risposte automatiche">
          <ProfessionalReplyTemplates key={user?.id} />
        </Section>

        <Section title="Booking rules">
          <div className="grid md:grid-cols-2 gap-3">
            <Field
              label="Min lead time (hours)"
              type="number"
              value={String(rules.min_lead_hours)}
              onChange={(v) => setRules({ ...rules, min_lead_hours: Number(v) })}
            />
            <Field
              label="Cancellation window (hours)"
              type="number"
              value={String(rules.cancellation_hours)}
              onChange={(v) => setRules({ ...rules, cancellation_hours: Number(v) })}
            />
            <Field
              label="Min duration (min)"
              type="number"
              value={String(rules.min_duration_minutes)}
              onChange={(v) => setRules({ ...rules, min_duration_minutes: Number(v) })}
            />
            <Field
              label="Max duration (min)"
              type="number"
              value={String(rules.max_duration_minutes)}
              onChange={(v) => setRules({ ...rules, max_duration_minutes: Number(v) })}
            />
            <Field
              label="Buffer between bookings (min)"
              type="number"
              value={String(rules.buffer_minutes)}
              onChange={(v) => setRules({ ...rules, buffer_minutes: Number(v) })}
            />
          </div>
        </Section>

        <button
          type="button"
          onClick={saveProfile}
          disabled={saving}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save professional profile'}
        </button>
      </div>

      {verifying && (
        <VerificationModal
          type={verifying}
          target={verifying === 'email' ? profile?.email || '' : profile?.phone || ''}
          onClose={() => setVerifying(null)}
          onVerified={() => setVerifying(null)}
        />
      )}
    </ProLayout>
  );
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
          <div className="font-bold text-emerald-900">Approved</div>
          <p className="text-sm text-emerald-800 mt-1">
            Your profile is visible in public search results.
          </p>
          {adminNotes && <p className="text-xs text-emerald-700 mt-2">Admin note: {adminNotes}</p>}
        </div>
      </div>
    );
  }

  if (status === 'rejected') {
    return (
      <div className="mb-5 bg-rose-50 border border-rose-200 rounded-2xl p-5 flex gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-700 mt-0.5" />
        <div>
          <div className="font-bold text-rose-900">Rejected</div>
          <p className="text-sm text-rose-800 mt-1">
            Your profile is not visible. Update your details and contact the admin for review.
          </p>
          {rejectionReason && <p className="text-xs text-rose-700 mt-2">Reason: {rejectionReason}</p>}
          {adminNotes && <p className="text-xs text-rose-700 mt-1">Admin note: {adminNotes}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
      <Clock className="w-5 h-5 text-amber-700 mt-0.5" />
      <div>
        <div className="font-bold text-amber-900">Pending admin approval</div>
        <p className="text-sm text-amber-800 mt-1">
          Complete your profile. An admin must approve you before clients can find you in search.
        </p>
        {adminNotes && <p className="text-xs text-amber-700 mt-2">Admin note: {adminNotes}</p>}
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
          <div className="text-xs text-stone-500">{value || 'Not set'}</div>
        </div>
      </div>
      {verified ? (
        <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1 font-semibold">
          <BadgeCheck className="w-3 h-3" /> Verified
        </span>
      ) : (
        <button
          type="button"
          onClick={onVerify}
          disabled={!value}
          className="text-xs bg-amber-500 text-white hover:bg-amber-600 px-3 py-1 rounded-full font-semibold disabled:opacity-50"
        >
          Verify now
        </button>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-5">
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
  return (
    <div>
      <label className="text-sm font-semibold text-stone-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
      />
    </div>
  );
}
