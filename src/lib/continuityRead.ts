import { continuityRpc } from './continuity';

const invalidResponse = () => new Error('Invalid continuity read response');
const text = (value: unknown) => typeof value === 'string';
const date = (value: unknown) => text(value) && Number.isFinite(Date.parse(value as string));
const id = (value: unknown) => text(value) && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value as string);
const count = (value: unknown) => (typeof value === 'number' || (text(value) && /^\d+$/.test(value as string))) && Number.isSafeInteger(Number(value)) && Number(value) >= 0;
type Row = Record<string, unknown>;
const note = (row: Row) => id(row.note_id) && text(row.dog_name) && text(row.activity) && date(row.occurred_at) && text(row.body) && count(row.revision_number) && Number(row.revision_number) > 0 && count(row.total_count);
const sharedNote = (row: Row) => note(row) && id(row.publication_id) && text(row.author_name) && date(row.shared_at);
const validators: Record<string, (row: Row) => boolean> = {
  read_received_continuity_notes: sharedNote,
  list_owner_continuity_publications: sharedNote,
  list_owner_continuity_recipients: row => id(row.relationship_id) && text(row.professional_name),
  list_my_continuity_notes: row => note(row) && (row.publication_id === null || id(row.publication_id)) && typeof row.can_publish === 'boolean',
  list_my_continuity_grants: row => id(row.grant_id) && text(row.dog_name) && text(row.professional_name) && text(row.purpose)
    && date(row.created_at) && date(row.expires_at) && (row.revoked_at === null || date(row.revoked_at))
    && (row.revocation_reason === null || text(row.revocation_reason)) && typeof row.is_current === 'boolean'
    && count(row.selected_count) && count(row.available_count) && count(row.total_count),
};

// A successful HTTP response is not necessarily a usable list. Never turn malformed
// results into an empty archive, or pass unvalidated note bodies into React.
export async function readSharingRows<T>(name: string, args: Record<string, unknown>, signal: AbortSignal): Promise<T[]> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal.aborted) throw new DOMException('Aborted', 'AbortError');
  signal.addEventListener('abort', abort, { once: true });
  const timeout = window.setTimeout(abort, 15000);
  try {
    const result = await continuityRpc<unknown>(name, args, controller.signal);
    if (controller.signal.aborted) throw new DOMException('Aborted', 'AbortError');
    const validate = validators[name];
    if (!validate || !Array.isArray(result) || !result.every(row => row && typeof row === 'object' && !Array.isArray(row) && validate(row))) throw invalidResponse();
    return result as T[];
  } finally {
    window.clearTimeout(timeout);
    signal.removeEventListener('abort', abort);
  }
}

export function sharingReadError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === '42501') return 'Accesso non più disponibile. L’autorizzazione potrebbe essere scaduta o revocata, oppure il contributo ritirato.';
  if (code === 'PGRST202' || code === '42883') return 'Lo storico condiviso non è ancora disponibile in questa versione. Riprova più tardi.';
  return 'Non è stato possibile verificare l’accesso e caricare lo storico. I contributi non vengono mostrati: controlla la connessione e riprova.';
}
