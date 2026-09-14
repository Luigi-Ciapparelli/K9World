import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, FileText, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/AuthContext';

type CredentialRow = {
  id: string;
  professional_id: string;
  credential_type: string;
  title: string;
  issuer_name: string | null;
  discipline: string | null;
  achievement: string | null;
  dog_name: string | null;
  event_name: string | null;
  external_url: string | null;
  document_path: string | null;
  source_provider: string | null;
  verification_method: string | null;
  verification_status: string;
  verification_note: string | null;
};

export function CredentialReviewPanel() {
  const { user } = useAuth();
  const [rows, setRows] = useState<CredentialRow[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const pending = useMemo(
    () =>
      rows.filter(
        (row) =>
          row.verification_status === 'pending' ||
          row.verification_status === 'rejected'
      ),
    [rows]
  );

  const load = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('professional_credentials')
      .select(
        'id, professional_id, credential_type, title, issuer_name, discipline, achievement, dog_name, event_name, external_url, document_path, source_provider, verification_method, verification_status, verification_note'
      )
      .in('verification_status', ['pending', 'rejected'])
      .order('created_at', { ascending: true });

    if (error) {
      setNotice(error.message);
      setRows([]);
      setLoading(false);
      return;
    }

    const credentialRows = (data || []) as CredentialRow[];
    setRows(credentialRows);

    const ids = Array.from(
      new Set(credentialRows.map((row) => row.professional_id))
    );

    if (ids.length > 0) {
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', ids);

      setNames(
        Object.fromEntries(
          (profileRows || []).map((profile) => [
            profile.id,
            profile.full_name || 'Professionista',
          ])
        )
      );
    } else {
      setNames({});
    }

    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const review = async (
    credentialId: string,
    status: 'verified' | 'rejected' | 'revoked'
  ) => {
    if (!user || busyId) return;

    setBusyId(credentialId);
    setNotice('');

    const { error } = await supabase.rpc(
      'admin_review_professional_credential',
      {
        p_credential_id: credentialId,
        p_status: status,
        p_note: null,
      }
    );

    if (error) {
      setNotice(error.message);
    } else {
      setNotice(
        status === 'verified'
          ? 'Credenziale verificata.'
          : status === 'rejected'
            ? 'Credenziale rifiutata.'
            : 'Verifica revocata.'
      );
      await load();
    }

    setBusyId(null);
  };

  const retryWorkingDog = async (credentialId: string) => {
    setBusyId(credentialId);
    setNotice('');

    const { data, error } = await supabase.functions.invoke(
      'verify-working-dog',
      {
        body: {
          mode: 'credential',
          credentialId,
        },
      }
    );

    if (error) {
      setNotice(error.message);
    } else {
      setNotice(
        data?.verified
          ? 'Working-Dog ha verificato automaticamente la credenziale.'
          : data?.reason || 'Working-Dog non ha prodotto una corrispondenza sufficiente.'
      );
      await load();
    }

    setBusyId(null);
  };

  const openEvidence = async (row: CredentialRow) => {
    if (!row.document_path) return;

    const { data, error } = await supabase.storage
      .from('professional-credentials')
      .createSignedUrl(row.document_path, 120);

    if (error || !data?.signedUrl) {
      setNotice(error?.message || 'Documento non disponibile.');
      return;
    }

    window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="pc-card p-6 md:p-8 mb-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <p className="pc-kicker">Verifica professionale</p>
          <h2 className="pc-display text-2xl md:text-3xl font-semibold text-[var(--pc-ink-950)] mt-2">
            Credenziali che richiedono intervento
          </h2>
          <p className="text-[var(--pc-muted-600)] leading-7 mt-3 max-w-3xl">
            Working-Dog viene verificato automaticamente quando identità e fatto sportivo
            coincidono. Qui arrivano soltanto i casi ambigui, le altre fonti e le eccezioni.
          </p>
        </div>

        <button type="button" onClick={() => void load()} className="pc-btn pc-btn-secondary">
          <RefreshCw className="w-4 h-4" />
          Aggiorna
        </button>
      </div>

      {notice && (
        <p role="status" className="mt-4 text-sm font-semibold text-[var(--pc-ink-800)]">
          {notice}
        </p>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-[var(--pc-muted-600)]">Caricamento…</p>
      ) : pending.length === 0 ? (
        <p className="mt-6 text-sm text-[var(--pc-muted-600)]">
          Nessuna credenziale richiede revisione manuale.
        </p>
      ) : (
        <div className="grid gap-4 mt-6">
          {pending.map((row) => (
            <article
              key={row.id}
              className="rounded-2xl border border-[var(--pc-line)] bg-white p-5"
            >
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--pc-muted-600)]">
                    {names[row.professional_id] || row.professional_id.slice(0, 8)}
                  </p>
                  <h3 className="text-lg font-extrabold text-[var(--pc-ink-950)] mt-1">
                    {row.title}
                  </h3>
                  <p className="text-sm text-[var(--pc-muted-600)] mt-2">
                    {[
                      row.discipline?.toUpperCase(),
                      row.achievement,
                      row.dog_name ? `con ${row.dog_name}` : null,
                      row.event_name,
                      row.issuer_name,
                    ]
                      .filter(Boolean)
                      .join(' · ') || 'Dettagli non indicati'}
                  </p>

                  {row.verification_note && (
                    <p className="text-xs text-[var(--pc-muted-600)] mt-2">
                      {row.verification_note}
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    {row.external_url && (
                      <a
                        href={row.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="pc-btn pc-btn-secondary"
                      >
                        Fonte
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}

                    {row.document_path && (
                      <button
                        type="button"
                        onClick={() => void openEvidence(row)}
                        className="pc-btn pc-btn-secondary"
                      >
                        <FileText className="w-4 h-4" />
                        Documento privato
                      </button>
                    )}

                    {row.source_provider === 'working_dog' && (
                      <button
                        type="button"
                        disabled={busyId !== null}
                        onClick={() => void retryWorkingDog(row.id)}
                        className="pc-btn pc-btn-secondary"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Riprova Working-Dog
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void review(row.id, 'verified')}
                    className="pc-btn pc-btn-primary"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Verifica
                  </button>

                  <button
                    type="button"
                    disabled={busyId !== null}
                    onClick={() => void review(row.id, 'rejected')}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-4 py-2 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    Rifiuta
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
