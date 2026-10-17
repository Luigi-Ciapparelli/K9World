export interface ClientDog {
  id: string; name: string; breed: string | null; photo_url: string | null;
}
export interface ProfessionalClient {
  id: string; full_name: string; email: string | null; phone: string | null;
  booking_count: number; total_spend: number; last_visit: string | null;
  next_booking: string | null; missing_prices: number; dogs: ClientDog[]; tags: string[];
}
export interface ClientNote { id: string; content: string; created_at: string }
export interface ClientPage { total: number; page: number; rows: ProfessionalClient[] }

export const clientMoney = (value: number) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(value);
export const clientDate = (value: string | null) => value && Number.isFinite(Date.parse(value))
  ? new Intl.DateTimeFormat('it-IT', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Rome' }).format(new Date(value)) : '—';

export function parseClientPage(data: unknown, page: number): ClientPage {
  const result = data as ClientPage | null;
  if (!result || !Number.isSafeInteger(result.total) || result.total < 0 || result.page !== page || !Array.isArray(result.rows) || result.rows.length > 20) throw new Error('Invalid client response');
  for (const row of result.rows) {
    if (!row || typeof row.id !== 'string' || typeof row.full_name !== 'string' || !Array.isArray(row.dogs) || !Array.isArray(row.tags)
      || row.total_spend == null || !Number.isFinite(Number(row.total_spend)) || Number(row.total_spend) < 0 || !Number.isSafeInteger(Number(row.booking_count))
      || !Number.isSafeInteger(row.missing_prices) || row.missing_prices < 0
      || row.tags.some(tag => typeof tag !== 'string') || row.dogs.some(dog => !dog || typeof dog.id !== 'string' || typeof dog.name !== 'string')) throw new Error('Invalid client row');
  }
  return { ...result, rows: result.rows.map(row => ({ ...row, total_spend: Number(row.total_spend), booking_count: Number(row.booking_count) })) };
}

export function clientFailure(error: unknown, fallback: string): string {
  const code = (error as { code?: string } | null)?.code;
  return code === '42501' ? 'Accesso non disponibile. Verifica il tuo account o aggiorna la pagina.' : fallback;
}
