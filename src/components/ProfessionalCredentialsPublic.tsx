import { useEffect, useState } from 'react';
import { Award, BadgeCheck, ExternalLink, Medal, Trophy } from 'lucide-react';
import { supabase } from '../lib/supabase';

type PublicCredential = {
  id: string;
  credential_type: string;
  title: string;
  issuer_name: string | null;
  issued_at: string | null;
  discipline: string | null;
  achievement: string | null;
  description: string | null;
  external_url: string | null;
  verification_status: string;
  verification_method: string | null;
  source_provider: string | null;
  source_verified_at: string | null;
  dog_name: string | null;
  event_name: string | null;
  event_scope: string | null;
  placement: number | null;
  score_text: string | null;
};

type SportMerit = {
  honor_tier: 'gold' | 'silver' | 'bronze' | null;
  highest_igp_level: number;
  verified_sport_results: number;
  verified_sport_dogs: number;
};

type ExternalIdentity = {
  provider: string;
  profile_url: string;
  external_display_name: string | null;
  verified_at: string | null;
};

function honorLabel(tier: SportMerit['honor_tier']) {
  if (tier === 'gold') return 'Maestro Addestratore · Oro IGP3';
  if (tier === 'silver') return 'Albo d’Oro · Argento IGP2';
  if (tier === 'bronze') return 'Albo d’Oro · Bronzo IGP1';
  return '';
}

function statusLabel(credential: PublicCredential) {
  if (
    credential.verification_status === 'verified' &&
    credential.verification_method === 'working_dog_auto'
  ) {
    return 'Verificato automaticamente tramite Working-Dog';
  }

  if (credential.verification_status === 'verified') {
    return 'Verificato da PortaleCinofilo';
  }

  if (credential.verification_status === 'pending') return 'In verifica';
  return 'Dichiarato';
}

export function ProfessionalCredentialsPublic({
  professionalId,
}: {
  professionalId: string;
}) {
  const [credentials, setCredentials] = useState<PublicCredential[]>([]);
  const [merit, setMerit] = useState<SportMerit | null>(null);
  const [identities, setIdentities] = useState<ExternalIdentity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);

      const [credentialsRes, meritRes, identitiesRes] = await Promise.all([
        supabase.rpc('get_public_professional_credentials', {
          p_professional_id: professionalId,
        }),
        supabase
          .from('public_professional_sport_merit')
          .select(
            'honor_tier, highest_igp_level, verified_sport_results, verified_sport_dogs'
          )
          .eq('professional_id', professionalId)
          .maybeSingle(),
        supabase.rpc('get_public_professional_external_identities', {
          p_professional_id: professionalId,
        }),
      ]);

      if (!active) return;

      if (!credentialsRes.error) {
        setCredentials((credentialsRes.data || []) as PublicCredential[]);
      }

      if (!meritRes.error) {
        setMerit((meritRes.data || null) as SportMerit | null);
      }

      if (!identitiesRes.error) {
        setIdentities((identitiesRes.data || []) as ExternalIdentity[]);
      }

      setLoading(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [professionalId]);

  if (loading) {
    return (
      <section className="pc-card p-6 md:p-8">
        <p className="text-sm text-[var(--pc-muted-600)]">
          Caricamento carriera professionale…
        </p>
      </section>
    );
  }

  if (credentials.length === 0 && !merit && identities.length === 0) {
    return null;
  }

  const workingDog = identities.find(
    (identity) => identity.provider === 'working_dog'
  );

  return (
    <section className="pc-card p-6 md:p-8">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
        <div>
          <p className="pc-kicker">Carriera cinofila</p>
          <h2 className="pc-display text-2xl md:text-3xl font-semibold text-[var(--pc-ink-950)] mt-2">
            Brevetti, risultati e formazione
          </h2>
          <p className="text-[var(--pc-muted-600)] leading-7 mt-3 max-w-3xl">
            PortaleCinofilo separa ciò che è dichiarato da ciò che è verificato.
            Le fonti sportive verificabili rendono leggibile la storia reale del
            professionista, non soltanto la sua bio.
          </p>
        </div>

        {merit?.honor_tier && (
          <div
            className={
              merit.honor_tier === 'gold'
                ? 'rounded-2xl bg-amber-50 px-4 py-3 text-amber-950 ring-1 ring-amber-200'
                : merit.honor_tier === 'silver'
                  ? 'rounded-2xl bg-slate-50 px-4 py-3 text-slate-800 ring-1 ring-slate-200'
                  : 'rounded-2xl bg-orange-50 px-4 py-3 text-orange-950 ring-1 ring-orange-200'
            }
          >
            <div className="flex items-center gap-2 text-sm font-extrabold">
              <Medal className="w-5 h-5" />
              {honorLabel(merit.honor_tier)}
            </div>
            <p className="text-xs mt-1 opacity-80">
              {merit.verified_sport_dogs || 0} cani distinti ·{' '}
              {merit.verified_sport_results || 0} risultati verificati
            </p>
          </div>
        )}
      </div>

      {workingDog && (
        <a
          href={workingDog.profile_url}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-[var(--pc-evidence-100)] px-3 py-2 text-xs font-extrabold text-[var(--pc-evidence-700)]"
        >
          <BadgeCheck className="w-4 h-4" />
          Profilo Working-Dog verificato
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      )}

      {credentials.length > 0 && (
        <div className="grid gap-3 mt-6">
          {credentials.map((credential) => {
            const sport =
              credential.credential_type === 'sport_result' ||
              credential.credential_type === 'official_test';

            return (
              <article
                key={credential.id}
                className="rounded-2xl border border-[var(--pc-line)] bg-white p-5"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {sport ? (
                        <Trophy className="w-4 h-4 text-[var(--pc-evidence-700)]" />
                      ) : (
                        <Award className="w-4 h-4 text-[var(--pc-forest-700)]" />
                      )}

                      <h3 className="font-extrabold text-[var(--pc-ink-950)]">
                        {credential.title}
                      </h3>

                      <span
                        className={
                          credential.verification_status === 'verified'
                            ? 'rounded-full bg-[var(--pc-evidence-100)] px-2.5 py-1 text-xs font-extrabold text-[var(--pc-evidence-700)]'
                            : 'rounded-full bg-[var(--pc-bone-50)] px-2.5 py-1 text-xs font-bold text-[var(--pc-muted-600)]'
                        }
                      >
                        {statusLabel(credential)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-[var(--pc-muted-600)]">
                      {[
                        credential.discipline?.toUpperCase(),
                        credential.achievement,
                        credential.dog_name
                          ? `con ${credential.dog_name}`
                          : null,
                        credential.event_name,
                        credential.placement
                          ? `${credential.placement}° posto`
                          : null,
                        credential.score_text,
                        credential.issuer_name,
                      ]
                        .filter(Boolean)
                        .join(' · ') || 'Dettagli non indicati'}
                    </p>
                  </div>

                  {credential.external_url && (
                    <a
                      href={credential.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="pc-btn pc-btn-secondary shrink-0"
                    >
                      Fonte
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
