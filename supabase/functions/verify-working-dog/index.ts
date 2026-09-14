import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const WORKING_DOG_HOSTS = ['working-dog.com', 'working-dog.eu'];

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function normalize(value: string | null | undefined) {
  return (value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function decodeEntities(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function sourceText(html: string) {
  const title =
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '';

  const description =
    html.match(
      /<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']*)["'][^>]*>/i
    )?.[1] ||
    html.match(
      /<meta[^>]+content=["']([^"']*)["'][^>]+(?:name|property)=["'](?:description|og:description)["'][^>]*>/i
    )?.[1] ||
    '';

  const jsonLd = Array.from(
    html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
    )
  )
    .map((match) => match[1])
    .join(' ');

  const body = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');

  return decodeEntities(`${title} ${description} ${jsonLd} ${body}`);
}

function isWorkingDogHost(hostname: string) {
  const host = hostname.toLowerCase();
  return WORKING_DOG_HOSTS.some(
    (base) => host === base || host.endsWith(`.${base}`)
  );
}

function canonicalWorkingDogUrl(raw: string) {
  const url = new URL(raw);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('URL Working-Dog non valido.');
  }

  if (!isWorkingDogHost(url.hostname)) {
    throw new Error('La fonte non appartiene a Working-Dog.');
  }

  url.hash = '';
  if (url.pathname.length > 1) {
    url.pathname = url.pathname.replace(/\/+$/, '');
  }

  return url.toString();
}

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((part) => part.toString(16).padStart(2, '0'))
    .join('');
}

async function fetchWorkingDog(rawUrl: string) {
  const url = canonicalWorkingDogUrl(rawUrl);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent':
          'PortaleCinofilo/1.0 source-verifier (+professional credential verification)',
      },
    });

    if (!response.ok) {
      throw new Error(`Working-Dog non raggiungibile (${response.status}).`);
    }

    const finalUrl = new URL(response.url);
    if (!isWorkingDogHost(finalUrl.hostname)) {
      throw new Error('Working-Dog ha reindirizzato verso un dominio non autorizzato.');
    }

    const contentType = response.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('text/html')) {
      throw new Error('La fonte Working-Dog non è una pagina HTML verificabile.');
    }

    const html = await response.text();
    if (html.length > 2_500_000) {
      throw new Error('Pagina Working-Dog troppo grande per la verifica automatica.');
    }

    const text = sourceText(html);

    return {
      url: finalUrl.toString(),
      text,
      normalized: normalize(text),
      fingerprint: await sha256(text),
      title: decodeEntities(
        html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ''
      ).trim(),
    };
  } finally {
    clearTimeout(timeout);
  }
}

function meaningfulNameTokens(name: string) {
  return normalize(name)
    .split(' ')
    .filter((token) => token.length >= 2);
}

function personMatches(fullName: string, pageText: string) {
  const tokens = meaningfulNameTokens(fullName);
  if (tokens.length < 2) return false;

  const normalizedPage = normalize(pageText);
  const phrase = normalize(fullName);

  if (phrase && normalizedPage.includes(phrase)) return true;

  return tokens.every((token) => normalizedPage.includes(token));
}

function valueMatches(value: string | null | undefined, pageText: string) {
  const normalizedValue = normalize(value);
  if (!normalizedValue) return true;

  const page = normalize(pageText);
  const tokens = normalizedValue
    .split(' ')
    .filter((token) => token.length >= 2);

  return tokens.length > 0 && tokens.every((token) => page.includes(token));
}

function igpLevelMatches(level: string | null, pageText: string) {
  const compactLevel = normalize(level).replace(/\s+/g, '');
  if (!['igp1', 'igp2', 'igp3'].includes(compactLevel)) return false;

  const compactPage = normalize(pageText).replace(/\s+/g, '');
  return compactPage.includes(compactLevel);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const authorization = req.headers.get('Authorization');

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !authorization) {
    return json(500, { error: 'server_configuration_missing' });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: authorization,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const service = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
    error: authError,
  } = await userClient.auth.getUser();

  if (authError || !user) {
    return json(401, { error: 'authentication_required' });
  }

  const { data: accountProfile } = await service
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!accountProfile || !['professional', 'admin'].includes(accountProfile.role)) {
    return json(403, { error: 'professional_or_admin_required' });
  }

  let body: {
    mode?: 'profile' | 'credential';
    profileUrl?: string;
    credentialId?: string;
  };

  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid_json' });
  }

  if (body.mode === 'profile') {
    if (!body.profileUrl) {
      return json(400, { error: 'profile_url_required' });
    }

    if (accountProfile.role !== 'professional') {
      return json(400, {
        error: 'admin_profile_claim_not_supported',
      });
    }

    let source;
    try {
      source = await fetchWorkingDog(body.profileUrl);
    } catch (error) {
      return json(200, {
        verified: false,
        reason:
          error instanceof Error
            ? error.message
            : 'Working-Dog non disponibile.',
      });
    }

    const { data: duplicate } = await service
      .from('professional_external_identities')
      .select('professional_id')
      .eq('provider', 'working_dog')
      .eq('profile_url', source.url)
      .neq('professional_id', user.id)
      .maybeSingle();

    if (duplicate) {
      return json(409, {
        verified: false,
        reason:
          'Questo profilo Working-Dog è già collegato a un altro account PortaleCinofilo.',
      });
    }

    const nameMatch = personMatches(accountProfile.full_name || '', source.text);
    const now = new Date().toISOString();

    const identityPayload = {
      professional_id: user.id,
      provider: 'working_dog',
      profile_url: source.url,
      external_display_name: source.title || null,
      verification_status: nameMatch ? 'verified' : 'pending',
      verification_method: nameMatch ? 'working_dog_auto' : null,
      verified_at: nameMatch ? now : null,
      last_checked_at: now,
      verification_note: nameMatch
        ? 'Identità verificata automaticamente tramite corrispondenza del profilo pubblico Working-Dog.'
        : 'Il nome del profilo PortaleCinofilo non coincide in modo sufficiente con la pagina Working-Dog.',
      source_fingerprint: source.fingerprint,
      updated_at: now,
    };

    const { error: upsertError } = await service
      .from('professional_external_identities')
      .upsert(identityPayload, {
        onConflict: 'provider,professional_id',
      });

    if (upsertError) {
      return json(500, {
        error: 'identity_upsert_failed',
        detail: upsertError.message,
      });
    }

    return json(200, {
      verified: nameMatch,
      reason: identityPayload.verification_note,
      profileUrl: source.url,
    });
  }

  if (body.mode === 'credential') {
    if (!body.credentialId) {
      return json(400, { error: 'credential_id_required' });
    }

    const { data: credential, error: credentialError } = await service
      .from('professional_credentials')
      .select(
        'id, professional_id, credential_type, title, discipline, achievement, external_url, dog_name, event_name, issued_at, verification_status'
      )
      .eq('id', body.credentialId)
      .maybeSingle();

    if (credentialError || !credential) {
      return json(404, { error: 'credential_not_found' });
    }

    if (
      accountProfile.role !== 'admin' &&
      credential.professional_id !== user.id
    ) {
      return json(403, { error: 'credential_not_owned' });
    }

    if (!['official_test', 'sport_result'].includes(credential.credential_type)) {
      return json(200, {
        verified: false,
        reason:
          'La verifica automatica Working-Dog è riservata a brevetti e risultati sportivi.',
      });
    }

    if (!credential.external_url) {
      return json(200, {
        verified: false,
        reason: 'Manca l’URL Working-Dog della prova o del risultato.',
      });
    }

    const { data: professionalProfile } = await service
      .from('profiles')
      .select('full_name')
      .eq('id', credential.professional_id)
      .maybeSingle();

    let source;
    try {
      source = await fetchWorkingDog(credential.external_url);
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : 'Working-Dog non disponibile.';

      await service
        .from('professional_credentials')
        .update({
          source_provider: 'working_dog',
          source_checked_at: new Date().toISOString(),
          verification_note: reason,
        })
        .eq('id', credential.id);

      return json(200, {
        verified: false,
        reason,
      });
    }

    const personMatch = personMatches(
      professionalProfile?.full_name || '',
      source.text
    );

    const discipline = normalize(credential.discipline);

    const levelMatch =
      discipline === 'igp'
        ? igpLevelMatches(credential.achievement, source.text)
        : valueMatches(credential.achievement, source.text);

    const disciplineMatch = valueMatches(credential.discipline, source.text);

    const dogRequired = discipline === 'igp';
    const dogMatch = credential.dog_name
      ? valueMatches(credential.dog_name, source.text)
      : !dogRequired;

    const eventMatch = credential.event_name
      ? valueMatches(credential.event_name, source.text)
      : true;

    const verified =
      personMatch &&
      disciplineMatch &&
      levelMatch &&
      dogMatch &&
      eventMatch;

    const now = new Date().toISOString();

    const reason = verified
      ? 'Risultato verificato automaticamente: identità, disciplina, livello e cane coincidono con la fonte Working-Dog.'
      : [
          !personMatch ? 'identità non coincidente' : null,
          !disciplineMatch ? 'disciplina non coincidente' : null,
          !levelMatch ? 'livello/risultato non coincidente' : null,
          !dogMatch
            ? credential.dog_name
              ? 'cane non coincidente'
              : 'cane obbligatorio per IGP'
            : null,
          !eventMatch ? 'prova/gara non coincidente' : null,
        ]
          .filter(Boolean)
          .join('; ');

    const updatePayload = verified
      ? {
          source_provider: 'working_dog',
          verification_status: 'verified',
          verification_method: 'working_dog_auto',
          source_verified_at: now,
          source_checked_at: now,
          source_fingerprint: source.fingerprint,
          verification_note: reason,
          reviewed_at: null,
          reviewed_by: null,
        }
      : {
          source_provider: 'working_dog',
          verification_status: 'pending',
          verification_method: null,
          source_verified_at: null,
          source_checked_at: now,
          source_fingerprint: source.fingerprint,
          verification_note: reason || 'Corrispondenza automatica insufficiente.',
        };

    const { error: updateError } = await service
      .from('professional_credentials')
      .update(updatePayload)
      .eq('id', credential.id);

    if (updateError) {
      return json(500, {
        error: 'credential_update_failed',
        detail: updateError.message,
      });
    }

    return json(200, {
      verified,
      reason,
      matches: {
        person: personMatch,
        discipline: disciplineMatch,
        level: levelMatch,
        dog: dogMatch,
        event: eventMatch,
      },
      sourceUrl: source.url,
    });
  }

  return json(400, { error: 'unsupported_mode' });
});
