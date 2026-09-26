/** Small, dependency-free parser for public Working-Dog result tables.
 * It deliberately returns candidate evidence, never a verification decision.
 * A provider HTML change must produce `null`/review, never a false positive.
 */
export type WorkingDogResultRow = {
  rawText: string;
  placement: number | null;
  score: number | null;
  qualification: string | null;
  classCode: string | null;
  dogName: string | null;
  handlerName: string | null;
  eventName: string | null;
};

function decode(value: string) {
  return value
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&nbsp;|&#160;/gi, ' ');
}

export function normalizeResultText(value: string | null | undefined) {
  return decode(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function number(value: string | undefined) {
  if (!value) return null;
  const normalized = value.trim();
  const parsed = normalized.includes(',')
    ? Number(normalized.replace(/\./g, '').replace(',', '.'))
    : Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function findScore(text: string) {
  const match = text.match(/(?:total|totale|points?|punti|score|punteggio)\s*:?\s*(\d{1,3}(?:[.,]\d{1,2})?)/i);
  return number(match?.[1]);
}

function findPlacement(text: string) {
  const match = text.match(/^\s*(\d{1,3})(?:\s|[.)])/);
  return match ? Number(match[1]) : null;
}

function findQualification(text: string) {
  const match = text.match(/\b(EX|Eccellente|Excellent|Sehr gut|Very good|Molto buono|Buono|Good|DQ|Disqualified|Squalificato)\b/i);
  return match?.[1] || null;
}

function findClassCode(text: string) {
  const match = text.match(/\b(?:classe|class|klasse)\s*([123])\b|\b(IGP\s*[123]|IFH\s*[123]|H[123]|RH-MT\s*[VAB])\b/i);
  return match ? (match[1] || match[2] || null)?.replace(/\s+/g, '') : null;
}

function extractCells(rowHtml: string) {
  return Array.from(rowHtml.matchAll(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi))
    .map(match => normalizeResultText(match[1]));
}

function cellWithLink(rowHtml: string, pattern: RegExp) {
  const match = rowHtml.match(pattern);
  return match ? normalizeResultText(match[1]) : null;
}

export function parseWorkingDogResultRows(html: string, eventName: string | null = null): WorkingDogResultRow[] {
  const pageClasses = Array.from(html.matchAll(/\b(?:classe|class|klasse)\s*([123])\b/gi))
    .map(match => match[1]);
  const pageClassCode = [...new Set(pageClasses)].length === 1 ? pageClasses[0] : null;
  const rows: WorkingDogResultRow[] = [];
  for (const match of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const rowHtml = match[1];
    const cells = extractCells(rowHtml);
    if (cells.length < 2) continue;
    const rawText = normalizeResultText(rowHtml);
    const score = findScore(rawText) ?? number(cells.find(cell => /^\d{2,3}(?:[.,]\d{1,2})?$/.test(cell)));
    const qualification = findQualification(rawText);
    if (!score && !qualification) continue;
    const linked = Array.from(rowHtml.matchAll(/<a\b[^>]*>([\s\S]*?)<\/a>/gi))
      .map(match => normalizeResultText(match[1]))
      .filter(Boolean);
    const dogName = linked[0] || cells.find(cell => /\b(?:dog|cane|border collie|rottweiler|malinois)\b/i.test(cell)) || null;
    const handlerName = linked[1] || null;
    rows.push({
      rawText,
      placement: findPlacement(rawText),
      score,
      qualification,
      classCode: findClassCode(rawText) || pageClassCode,
      dogName,
      handlerName,
      eventName,
    });
  }
  return rows;
}

export function findMatchingWorkingDogResult(rows: WorkingDogResultRow[], personName: string,
  dogName: string | null, eventName: string | null) {
  const normalize = (value: string) => value.toLocaleLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const person = normalize(personName);
  const dog = dogName ? normalize(dogName) : '';
  if (!person || person.split(' ').length < 2) return null;
  const candidates = rows.filter(row => {
    const rowText = normalize(row.rawText);
    const rowPerson = row.handlerName ? normalize(row.handlerName) : '';
    const personMatch = rowPerson === person || (rowPerson && rowPerson.includes(person));
    const rowDog = row.dogName ? normalize(row.dogName) : '';
    const dogMatch = !dog || rowDog === dog || rowDog.includes(dog) || rowText.includes(dog);
    return personMatch && dogMatch && (!eventName || normalize(row.eventName || '').includes(normalize(eventName)) || !row.eventName);
  });
  return candidates.length === 1 ? candidates[0] : null;
}
