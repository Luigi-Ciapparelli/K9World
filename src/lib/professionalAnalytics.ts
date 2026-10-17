export type ActivityRange = { from: string; to: string };
export type ActivitySummary = ActivityRange & {
  time_zone: string; as_of: string;
  total: number; completed: number; pending: number; accepted: number;
  declined: number; cancelled: number; other: number;
  customers: number; returning_customers: number; returning_percent: number | null;
  completed_value: number; missing_prices: number; service_groups: number;
  top_services: { name: string; completed: number; value: number; missing_prices: number }[];
};

export function italianToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type)?.value).join('-');
}
export function activityPreset(preset: 'month' | '90days' | 'year', now = new Date()): ActivityRange {
  const to = italianToday(now);
  if (preset === 'month') return { from: to.slice(0, 7) + '-01', to };
  if (preset === 'year') return { from: to.slice(0, 4) + '-01-01', to };
  const start = new Date(to + 'T12:00:00Z');
  start.setUTCDate(start.getUTCDate() - 89);
  return { from: start.toISOString().slice(0, 10), to };
}
export function activityRangeError(range: ActivityRange): string {
  const valid = (date: string) => /^\d{4}-\d{2}-\d{2}$/.test(date)
    && Number.isFinite(Date.parse(date + 'T00:00:00Z'))
    && new Date(date + 'T00:00:00Z').toISOString().slice(0, 10) === date
    && date >= '2000-01-01' && date <= '2100-12-31';
  if (!valid(range.from) || !valid(range.to)) return 'Inserisci entrambe le date, tra il 2000 e il 2100.';
  const days = (Date.parse(range.to) - Date.parse(range.from)) / 86400000;
  if (days < 0) return 'La data finale deve essere uguale o successiva a quella iniziale.';
  if (days > 365) return 'Scegli un periodo di massimo 366 giorni.';
  return '';
}
// An unavailable or incompatible API must never become an apparently empty report.
export function readActivitySummary(value: unknown, range: ActivityRange): ActivitySummary {
  if (!value || typeof value !== 'object') throw new Error('Invalid activity summary');
  const data = value as ActivitySummary;
  const counts = [data.total, data.completed, data.pending, data.accepted, data.declined,
    data.cancelled, data.other, data.customers, data.returning_customers, data.missing_prices, data.service_groups];
  const amount = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;
  if (data.from !== range.from || data.to !== range.to || data.time_zone !== 'Europe/Rome'
    || !Number.isFinite(Date.parse(data.as_of))
    || counts.some(n => !Number.isSafeInteger(n) || n < 0)
    || data.completed + data.pending + data.accepted + data.declined + data.cancelled + data.other !== data.total
    || data.customers > data.completed || data.returning_customers > data.customers
    || data.missing_prices > data.completed || !amount(data.completed_value)
    || (data.customers === 0 ? data.returning_percent !== null
      : !amount(data.returning_percent) || data.returning_percent > 100)
    || !Array.isArray(data.top_services) || data.top_services.length > 5
    || data.top_services.some(s => !s || typeof s.name !== 'string'
      || !Number.isSafeInteger(s.completed) || s.completed < 1 || !amount(s.value)
      || !Number.isSafeInteger(s.missing_prices) || s.missing_prices < 0 || s.missing_prices > s.completed)) {
    throw new Error('Invalid activity summary');
  }
  return data;
}
