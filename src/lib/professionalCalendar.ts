export const calendarTimeZone = 'Europe/Rome';

export type CalendarBooking = {
  id: string; start_at: string; end_at: string; status: string;
  price: number | string | null; notes: string | null; client_name: string;
  service_id: string | null; service_name: string; service_type: string; calendar_color: string;
};
export type TimeOff = {
  id: string; start_date: string; end_date: string; private_note: string; accepted_bookings: number;
};
export type Schedule = { paused: boolean; periods: TimeOff[] };
export type PublicAvailability = { paused: boolean; periods: { start_date: string; end_date: string }[] };

const dayFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: calendarTimeZone, year: 'numeric', month: '2-digit', day: '2-digit',
});
export function romeDay(value: Date | string = new Date()) {
  const parts = dayFormatter.formatToParts(new Date(value));
  const part = (name: string) => parts.find((p) => p.type === name)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}
export function addDays(day: string, amount: number) {
  const date = new Date(`${day}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}
export function shiftMonth(month: string, amount: number) {
  const date = new Date(`${month}-01T12:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + amount);
  return date.toISOString().slice(0, 7);
}
export function monthDays(month: string) {
  const first = `${month}-01`;
  const offset = (new Date(`${first}T12:00:00Z`).getUTCDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) => addDays(first, i - offset));
}
export function bookingOnDay(booking: CalendarBooking, day: string) {
  const start = new Date(booking.start_at).getTime();
  const end = Math.max(start, new Date(booking.end_at).getTime() - 1);
  return romeDay(new Date(start)) <= day && romeDay(new Date(end)) >= day;
}
export function dayLabel(day: string, long = false) {
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: 'UTC', day: 'numeric', month: long ? 'long' : 'short', year: 'numeric',
    ...(long ? { weekday: 'long' as const } : {}),
  }).format(new Date(`${day}T12:00:00Z`));
}
export function calendarDateTime(value: string) {
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: calendarTimeZone, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}
export function calendarTime(value: string) {
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: calendarTimeZone, hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}
export function serviceColor(value: unknown) {
  return typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : '#57534E';
}
export function bookingAvailabilityError(error: unknown): string | null {
  const code = (error as { code?: string } | null)?.code;
  if (code === 'PCA01') return 'Il professionista ha sospeso le nuove richieste. Nessuna prenotazione è stata creata.';
  if (code === 'PCA02') return 'Il periodo si sovrappone a un’indisponibilità del professionista. Scegli un’altra data.';
  return null;
}
export function acceptanceError(error: unknown) {
  return (error as { code?: string } | null)?.code === 'PCA02'
    ? 'Richiesta ancora in attesa: il periodo è segnato come indisponibile. Gestisci l’indisponibilità nel Calendario prima di accettare.'
    : 'Non è stato possibile confermare l’esito. Aggiorna e controlla lo stato prima di riprovare.';
}
