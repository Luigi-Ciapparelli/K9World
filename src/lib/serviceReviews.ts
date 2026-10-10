import { supabase } from './supabase';

export type ServiceReview = {
  id: string; kind: 'trainer' | 'boarding' | 'other'; review_scope: 'booking_service' | 'legacy_relationship'; booking_id: string; completed_at: string;
  counterpart_name: string; service_name: string; end_at: string | null;
  owner_rating: number | null; owner_comment: string | null; owner_updated_at: string | null;
  professional_rating: number | null; professional_updated_at: string | null;
  version: number; own_rating: number | null; own_comment: string; pending: boolean; can_write: boolean;
};
export type ServiceReviews = { items: ServiceReview[]; count: number; pending_count: number };
export async function loadServiceReviews(professional: boolean, page = 0, size = 5): Promise<ServiceReviews> {
  const { data, error } = await supabase.rpc('get_my_service_reviews', { p_professional: professional, p_offset: page * size, p_limit: size });
  if (error) throw error;
  if (!data || !Array.isArray(data.items) || typeof data.count !== 'number') throw new Error('Invalid review response');
  return data as ServiceReviews;
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
