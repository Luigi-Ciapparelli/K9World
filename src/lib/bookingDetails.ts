export type BookingDetailsRow = {
  booking_id: string;
  end_at: string | null;
  service_name: string;
  service_source: 'recorded' | 'catalogue' | 'unavailable';
  dog_names: string[];
  dogs_unavailable: boolean;
};
export function readBookingDetails(value: unknown, ids: string[]): Record<string, BookingDetailsRow> {
  if (!Array.isArray(value)) throw new Error('Invalid booking details');
  const wanted = new Set(ids);
  const result: Record<string, BookingDetailsRow> = {};
  for (const row of value as BookingDetailsRow[]) {
    if (!row || !wanted.has(row.booking_id) || result[row.booking_id]
      || typeof row.service_name !== 'string' || !row.service_name.trim()
      || !['recorded', 'catalogue', 'unavailable'].includes(row.service_source)
      || (row.end_at !== null && (typeof row.end_at !== 'string' || !Number.isFinite(Date.parse(row.end_at))))
      || !Array.isArray(row.dog_names) || row.dog_names.some(name => typeof name !== 'string' || !name.trim())
      || typeof row.dogs_unavailable !== 'boolean') throw new Error('Invalid booking details');
    result[row.booking_id] = row;
  }
  // Missing rows mean unavailable context, never an empty dog list.
  return result;
}
export function bookingDateTime(value: string | null | undefined) {
  return value && Number.isFinite(Date.parse(value))
    ? new Intl.DateTimeFormat('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
    : 'Orario non disponibile';
}
export function bookingPrice(value: number | string | null) {
  const number = value === null || value === '' ? NaN : Number(value);
  return Number.isFinite(number) && number >= 0
    ? number.toLocaleString('it-IT', { style: 'currency', currency: 'EUR' }) : 'Prezzo da confermare';
}
// Italian day boundaries include the 23/25-hour daylight-saving days.
export function bookingTodayBounds(now = new Date()) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  });
  function parts(date: Date) {
    const values = formatter.formatToParts(date);
    return ['year','month','day','hour','minute','second'].map(type => Number(values.find(p => p.type === type)?.value));
  }
  const [year, month, day] = parts(now);
  function midnight(offset: number) {
    const target = Date.UTC(year, month - 1, day + offset);
    let instant = target;
    for (let i = 0; i < 3; i++) {
      const [y,m,d,h,min,s] = parts(new Date(instant));
      instant += target - Date.UTC(y,m-1,d,h,min,s);
    }
    return new Date(instant).toISOString();
  }
  return { from: midnight(0), until: midnight(1) };
}
