const romeClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

export function lessonLocalTime(date = new Date()): string {
  if (!Number.isFinite(date.getTime())) return '';
  const parts = romeClock.formatToParts(date);
  const part = (key: string) => parts.find(p => p.type === key)?.value;
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}:${part('second')}`;
}

// Resolve Italian wall-clock time, never the device timezone. DST overlaps
// have two valid instants and require an explicit choice in the form.
export function lessonTimeOptions(value: string): string[] {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(value)) return [];
  const normalized = value.length === 16 ? `${value}:00` : value;
  const wall = Date.parse(`${normalized}Z`);
  if (!Number.isFinite(wall) || new Date(wall).toISOString().slice(0, 19) !== normalized) return [];
  const offsets = new Set([-86400000, 0, 86400000].map(delta => {
    const instant = wall + delta;
    return Date.parse(`${lessonLocalTime(new Date(instant))}Z`) - instant;
  }));
  return [...offsets].map(offset => new Date(wall - offset).toISOString())
    .filter(instant => lessonLocalTime(new Date(instant)) === normalized).sort();
}

export function lessonTimeOptionLabel(instant: string) {
  return new Intl.DateTimeFormat('it-IT', {
    timeZone: 'Europe/Rome', hour: '2-digit', minute: '2-digit', timeZoneName: 'shortOffset',
  }).format(new Date(instant));
}
