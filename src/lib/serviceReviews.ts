import { supabase } from './supabase';

export type ServiceReview = {
  id: string; kind: 'trainer' | 'boarding' | 'other'; review_scope: 'booking_service' | 'legacy_relationship'; booking_id: string; completed_at: string;
  counterpart_name: string; service_name: string; end_at: string | null;
  owner_rating: number | null; owner_comment: string | null; owner_updated_at: string | null;
  professional_rating: number | null; professional_updated_at: string | null;
  version: number; own_rating: number | null; own_comment: string; pending: boolean; can_write: boolean;
};
export type ServiceReviews = { items: ServiceReview[]; count: number; pending_count: number };
// A timeout only ends the wait: it does not prove that a write was rolled back.
export async function reviewRpc(name: string, args: Record<string, unknown>, parent?: AbortSignal) {
  const controller = new AbortController();
  let rejectAbort: (error: Error) => void = () => {};
  const aborted = new Promise<never>((_, reject) => { rejectAbort = reject; });
  const abort = () => { controller.abort(); rejectAbort(new DOMException('Aborted', 'AbortError')); };
  if (parent?.aborted) throw new DOMException('Aborted', 'AbortError');
  parent?.addEventListener('abort', abort, { once: true });
  const timer = window.setTimeout(abort, 15000);
  try {
    const result = await Promise.race([supabase.rpc(name, args).abortSignal(controller.signal), aborted]);
    if (result.error) throw result.error;
    return result.data as unknown;
  } finally { window.clearTimeout(timer); parent?.removeEventListener('abort', abort); }
}
const uuid = (value: unknown) => typeof value === 'string' && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
const text = (value: unknown) => typeof value === 'string';
const date = (value: unknown) => text(value) && Number.isFinite(Date.parse(value as string));
const nullableText = (value: unknown) => value === null || text(value);
const nullableDate = (value: unknown) => value === null || date(value);
const integer = (value: unknown) => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const rating = (value: unknown) => value === null || (integer(value) && Number(value) >= 1 && Number(value) <= 5);
export async function loadServiceReviews(professional: boolean, page = 0, size = 5, signal?: AbortSignal): Promise<ServiceReviews> {
  const data = await reviewRpc('get_my_service_reviews', { p_professional: professional, p_offset: page * size, p_limit: size }, signal) as ServiceReviews | null;
  if (!data || !Array.isArray(data.items) || !integer(data.count) || !integer(data.pending_count)
    || data.pending_count > data.count || data.items.length > size || data.count < data.items.length
    || new Set(data.items.map(row => row?.id)).size !== data.items.length
    || data.items.some(row => !row || !uuid(row.id) || !uuid(row.booking_id)
      || !['trainer', 'boarding', 'other'].includes(row.kind) || !['booking_service', 'legacy_relationship'].includes(row.review_scope)
      || !date(row.completed_at) || !nullableDate(row.end_at) || !text(row.service_name) || !text(row.counterpart_name)
      || !rating(row.owner_rating) || !rating(row.professional_rating) || !rating(row.own_rating)
      || !nullableText(row.owner_comment) || !text(row.own_comment) || !nullableDate(row.owner_updated_at)
      || !nullableDate(row.professional_updated_at) || !integer(row.version)
      || typeof row.pending !== 'boolean' || typeof row.can_write !== 'boolean')) throw new Error('Invalid review response');
  return data;
}
export function reviewError(error: unknown) {
  switch ((error as { code?: string })?.code) {
    case '40001': return 'La valutazione è cambiata in un’altra finestra. Chiudi e aggiorna prima di modificarla.';
    case 'PCR01': return 'Puoi confermare un servizio svolto solo dopo il suo orario di fine.';
    case 'PCR02': return 'Questa esperienza non è ancora valutabile. Aggiorna l’elenco delle valutazioni.';
    case 'PCR03': return 'La valutazione è già presente. Puoi rettificarla entro 7 giorni dall’invio. La prossima prestazione avrà una valutazione distinta.';
    case 'PCR04': return 'Questa valutazione precedente è conservata nello storico. Valuta le nuove prestazioni dalla loro scheda.';
    case '42501': return 'Questa valutazione non è disponibile per il tuo account.';
    case '22023': return 'Scegli un voto da 1 a 5 e un commento entro 500 caratteri.';
    default: return 'Esito non confermato. Riprova senza cambiare i dati: un eventuale invio già riuscito non verrà duplicato.';
  }
}
