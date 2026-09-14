import { useCallback, useEffect, useState } from 'react';
import { continuityRpc } from './continuity';

export const sharingChanged = 'pc-continuity-sharing-changed';
export const sharingButton = 'rounded-xl bg-emerald-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50';
export const sharingSecondary = 'rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50';
export const sharingField = 'mt-1 block w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-stone-900';
export function notifySharingChanged() { window.dispatchEvent(new Event(sharingChanged)); }
export function sharingError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === '42501') return 'Accesso non disponibile: controlla consenso, relazione e proprietario attuale. Il contributo potrebbe essere stato ritirato.';
  if (code === '40001') return 'La nota o la sua condivisione è cambiata. Aggiorna e leggi la revisione corrente prima di confermare.';
  if (code === '22023') return 'Controlla selezione, durata e dati inseriti. Una richiesta già inviata non può essere riutilizzata con dati diversi.';
  if (code === 'PGRST202' || code === '42883') return 'Lo storico condiviso non è ancora disponibile in questa versione. Riprova più tardi.';
  return 'Esito non confermato. Riprova la stessa richiesta oppure aggiorna per verificarne lo stato.';
}
export type OwnContinuityNote = {
  note_id: string; dog_name: string; activity: string; occurred_at: string;
  revision_number: number; body: string; publication_id: string | null; can_publish: boolean; total_count: number;
};
export type SharedContinuityNote = {
  publication_id: string; note_id: string; revision_number: number; dog_name: string;
  author_name: string; activity: string; occurred_at: string; body: string; shared_at: string; total_count: number;
};
export type ContinuityRecipient = { relationship_id: string; professional_name: string };
export type ContinuityGrant = {
  grant_id: string; dog_name: string; professional_name: string; purpose: string;
  created_at: string; expires_at: string; revoked_at: string | null; revocation_reason: string | null;
  is_current: boolean; selected_count: number; available_count: number; total_count: number;
};
export function grantStatus(grant: ContinuityGrant) {
  if (grant.revocation_reason === 'relationship') return 'Relazione conclusa';
  if (grant.revocation_reason === 'ownership') return 'Proprietario cambiato';
  if (grant.revocation_reason === 'dog_deleted') return 'Cane rimosso';
  if (grant.revoked_at) return 'Revocata';
  if (new Date(grant.expires_at).getTime() <= Date.now()) return 'Scaduta';
  return grant.is_current ? 'Attiva' : 'Non disponibile';
}

// Every list is keyed by its arguments. A late response for another dog or page
// cannot replace the current data; account changes remount the parent workspace.
export function useSharingRows<T>(name: string, args: Record<string, unknown>, refreshKey = 0) {
  const key = JSON.stringify(args);
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{ key: string; rows: T[]; loading: boolean; error: string }>({ key: '', rows: [], loading: true, error: '' });
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    setState({ key, rows: [], loading: true, error: '' });
    void continuityRpc<T[]>(name, JSON.parse(key))
      .then((rows) => { if (active) setState({ key, rows: rows || [], loading: false, error: '' }); })
      .catch((error) => { if (active) setState({ key, rows: [], loading: false, error: sharingError(error) }); });
    return () => { active = false; };
  }, [name, key, revision, refreshKey]);
  useEffect(() => { window.addEventListener(sharingChanged, reload); return () => window.removeEventListener(sharingChanged, reload); }, [reload]);
  return { ...(state.key === key ? state : { rows: [] as T[], loading: true, error: '' }), reload };
}
