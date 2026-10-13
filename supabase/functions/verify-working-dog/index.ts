import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  findMatchingWorkingDogResult,
  parseWorkingDogResultRows,
} from '../_shared/workingDogResultParser.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

import { workingDogUrl, fetchWorkingDogHtml } from '../_shared/workingDogSource.ts';

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

async function sha256(value: string) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((part) => part.toString(16).padStart(2, '0'))
    .join('');
}

async function fetchWorkingDog(rawUrl: string) {
  const {url, html} = await fetchWorkingDogHtml(rawUrl);
  const text = sourceText(html);
  return {url, html, text, fingerprint: await sha256(html),
    title: decodeEntities(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim()};
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

  if (!authorization) return json(401, { error: 'authentication_required' });
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
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
    if (!body || typeof body !== 'object' || Array.isArray(body)) return json(400, { error: 'invalid_json' });
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

    let profileUrl: string;
    try { profileUrl = workingDogUrl(body.profileUrl, 'user'); }
    catch (error) { return json(400, { verified: false, reason: error instanceof Error ? error.message : 'URL non valido.' }); }
    const {data: identity, error} = await userClient.rpc('request_working_dog_identity', {p_url: profileUrl});
    if (error) return json(error.code === '23505' ? 409 : 400, {verified: false, reason: error.message});
    return json(200, {verified: identity?.verification_status === 'verified',
      reason: identity?.verification_note || 'Collegamento ricevuto. La titolarità deve essere verificata: il solo nome non basta.', profileUrl});
  }

  if (body.mode === 'credential') {
    if (!body.credentialId) {
      return json(400, { error: 'credential_id_required' });
    }

    const { data: credential, error: credentialError } = await service
      .from('professional_credentials')
      .select(
        'id, professional_id, credential_type, title, discipline, achievement, external_url, dog_name, event_name, issued_at, placement, score_text, verification_status, verification_version'
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

    if (['rejected', 'revoked'].includes(credential.verification_status)) {
      return json(200, { verified: false, reason: 'Questo risultato richiede una nuova revisione amministrativa.' });
    }

    if (!credential.external_url) {
      return json(200, {
        verified: false,
        reason: 'Manca l’URL Working-Dog della prova o del risultato.',
      });
    }

    const { data: identity, error: identityError } = await service.from('professional_external_identities')
      .select('provider_user_id, verification_version, verification_status, verification_method')
      .eq('professional_id', credential.professional_id).eq('provider', 'working_dog').maybeSingle();
    if (identityError) return json(500, {verified: false, reason: 'Non è stato possibile controllare il collegamento Working-Dog.'});
    if (!identity || identity.verification_status !== 'verified' || identity.verification_method !== 'manual_admin' || !identity.provider_user_id) {
      return json(200, {verified: false, reason: 'Prima dei risultati, la titolarità del profilo Working-Dog deve essere verificata. Aggiungi il collegamento nelle tue credenziali.'});
    }
    if (Deno.env.get('WORKING_DOG_RESULT_AUTOVERIFY_ENABLED') !== 'true') {
      return json(200, { verified: false, reason: 'Il collegamento è verificato. Il risultato sarà controllato manualmente: la verifica automatica della fonte non è ancora attiva.' });
    }
    const { data: professionalProfile } = await service.from('profiles').select('full_name').eq('id', credential.professional_id).maybeSingle();
    let source;
    try {
      source = await fetchWorkingDog(credential.external_url);
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : 'Working-Dog non disponibile.';

      const { error: checkError } = await service.rpc('commit_bound_working_dog_check', {
        p_identity_version: identity.verification_version, p_handler_id: identity.provider_user_id,
        p_credential_id: credential.id, p_expected_version: credential.verification_version,
        p_actor_id: user.id, p_outcome: 'unavailable', p_fingerprint: null, p_reason: reason,
      });
      if (checkError) return json(checkError.code === '40001' ? 409 : 500, {
        verified: false, error: 'credential_check_not_saved',
        reason: checkError.code === '40001' ? 'I dati sono cambiati durante il controllo. Ricarica e riprova.' : 'Controllo non salvato. Riprova.',
      });

      return json(200, {
        verified: false,
        reason,
      });
    }

    const discipline = normalize(credential.discipline);

    // The handler and dog must be found in one result row. Whole-page token
    // matches can combine two different competitors and are not evidence.
    const resultRows = parseWorkingDogResultRows(source.html, source.title || null);
    const matchedResult = findMatchingWorkingDogResult(
      resultRows,
      professionalProfile?.full_name || '',
      credential.dog_name,
      credential.event_name || source.title || null,
      identity.provider_user_id
    );
    const personMatch = Boolean(matchedResult?.handlerName);

    const levelMatch = matchedResult
      ? discipline === 'igp'
        ? igpLevelMatches(credential.achievement, matchedResult.rawText)
        : (() => {
            const compactAchievement = normalize(credential.achievement).replace(/\s+/g, '');
            const classNumber = compactAchievement.match(/(?:class|classe|klasse)([123])/)?.[1];
            if (classNumber) return matchedResult.classCode === classNumber;
            return valueMatches(credential.achievement, `${matchedResult.rawText} ${source.title}`);
          })()
      : false;

    const disciplineMatch = Boolean(matchedResult) && valueMatches(credential.discipline, source.title);

    const dogRequired = true;
    const dogMatch = credential.dog_name
      ? Boolean(matchedResult?.dogName)
      : !dogRequired;

    const eventMatch = Boolean(matchedResult) && (credential.event_name
      ? valueMatches(credential.event_name, source.title)
      : true);

    // Only the currently supported positive outcome is automatic. Other disciplines,
    // ambiguous qualifiers and failed/disqualified trials stay for manual review.
    const positiveOutcome = Boolean(matchedResult && discipline === 'obedience' &&
      /^[123]$/.test(matchedResult.classCode || '') && /^(EX|Excellent|Eccellente)$/i.test(matchedResult.qualification || '') &&
      matchedResult.score !== null && matchedResult.score >= 256 && matchedResult.score <= 320);
    const verified = positiveOutcome &&
      personMatch &&
      disciplineMatch &&
      levelMatch &&
      dogMatch &&
      eventMatch;

    const reason = verified
      ? 'Risultato verificato automaticamente: conduttore, cane, disciplina, livello e gara coincidono nella stessa riga della fonte Working-Dog.'
      : [
          !personMatch ? 'identificativo del conduttore non coincidente' : null,
          !positiveOutcome ? 'esito o disciplina da verificare manualmente' : null,
          !disciplineMatch ? 'disciplina non coincidente' : null,
          !levelMatch ? 'livello/risultato non coincidente' : null,
          !dogMatch
            ? credential.dog_name
              ? 'cane non coincidente'
              : 'cane obbligatorio per verificare il binomio'
            : null,
          !eventMatch ? 'prova/gara non coincidente' : null,
          !matchedResult ? 'riga risultato non identificata in modo univoco' : null,
        ]
          .filter(Boolean)
          .join('; ');

    const { data: committed, error: updateError } = await service.rpc('commit_bound_working_dog_check', {
        p_identity_version: identity.verification_version, p_handler_id: identity.provider_user_id,
      p_credential_id: credential.id, p_expected_version: credential.verification_version,
      p_actor_id: user.id, p_outcome: verified ? 'matched' : 'not_matched',
      p_fingerprint: source.fingerprint, p_reason: reason || 'Corrispondenza automatica insufficiente.',
      p_placement: verified ? matchedResult?.placement ?? null : null,
      p_score_text: verified && matchedResult?.score !== null && matchedResult?.score !== undefined ? String(matchedResult.score) : null,
    });

    if (updateError) return json(updateError.code === '40001' ? 409 : 500, {
      verified: false, error: 'credential_update_failed',
      reason: updateError.code === '40001' ? 'I dati sono cambiati durante il controllo. Ricarica e riprova.' : 'Verifica non salvata. Riprova.',
    });
    if (!committed || (verified && committed.verification_status !== 'verified')) return json(409, {
      verified: false, reason: 'Verifica non confermata dal database. Ricarica e riprova.',
    });

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
      result: matchedResult
        ? {
            placement: matchedResult.placement,
            score: matchedResult.score,
            qualification: matchedResult.qualification,
            classCode: matchedResult.classCode,
          }
        : null,
      sourceUrl: source.url,
    });
  }

  return json(400, { error: 'unsupported_mode' });
});
