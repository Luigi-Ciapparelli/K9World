/**
 * PortaleCinofilo editorial merit policy. SERVER-ONLY foundation, not a provider
 * adapter or authentication boundary. Call only with an independently verified
 * official result and a verified binding to its handler. Never pass request JSON
 * directly here. Existing whole-page/name matching is NOT sufficient evidence.
 */
export const POLICY_VERSION = 'pc-sport-merit-2026-09-26-draft1';
export type Medal = 'bronze' | 'silver' | 'gold';
export type Discipline = 'igp' | 'obedience' | 'agility' | 'rally-obedience'
  | 'mondioring' | 'tracking' | 'mantrailing' | 'hoopers' | 'dog-dancing'
  | 'disc-dog' | 'flyball';

export interface VerifiedResult {
  provider: string;
  resultId: string;
  eventId: string;
  eventDate: string; // YYYY-MM-DD, no future results
  sourceUrl: string;
  evidenceHash: string; // SHA-256 of the exact evidence, not just its URL
  evidenceStatus: 'verified' | 'pending' | 'revoked';
  evidenceMethod: 'authorized_provider_record' | 'manual_official_review' | 'page_text_match';
  handlerId: string;
  dogId: string;
  role: 'handler' | 'owner' | 'trainer' | 'unknown';
  discipline: Discipline;
  ruleset: string; // exact regulation edition; never inferred from score alone
  classCode: string;
  variant: string;
  outcome: 'passed' | 'completed' | 'failed' | 'disqualified' | 'withdrawn' | 'unknown';
  score?: number;
  maxScore?: number;
  totalPenalties?: number; // course AND time; never course penalties alone
  phaseScores?: number[]; // IGP A/B/C or the two IGP-FH tracks
  criterionScores?: number[]; // the four ENCI Dog Dancing criteria
  isPublic: boolean;
}

export interface HandlerBinding {
  provider: string;
  handlerId: string;
  status: 'verified' | 'pending' | 'revoked';
  method: 'provider_account_proof' | 'manual_identity_review' | 'name_match';
}

export interface Decision {
  status: 'awarded' | 'below_threshold' | 'needs_review' | 'ineligible';
  medal: Medal | null;
  reason: string;
  policyVersion: string;
}

type Rule = {
  discipline: Discipline;
  ruleset: string;
  variants: readonly string[];
  classes: Readonly<Record<string, Medal>>;
  threshold: 'pass' | 'score' | 'clear';
  minimum?: number;
  maximum?: number;
};

// Edition-specific. Other federations, historic editions and naming aliases need
// their own validated adapter mapping; "UPr3" is never FCI Obedience or full IGP3.
export const MERIT_RULES: readonly Rule[] = [
  { discipline: 'igp', ruleset: 'fci-igp-2025', variants: ['full'],
    classes: { IGP1: 'bronze', IGP2: 'silver', IGP3: 'gold' }, threshold: 'pass' },
  { discipline: 'obedience', ruleset: 'fci-obedience-2025', variants: ['individual'],
    classes: { '1': 'bronze', '2': 'silver', '3': 'gold' }, threshold: 'score', minimum: 256, maximum: 320 },
  { discipline: 'agility', ruleset: 'fci-agility-2025', variants: ['agility'],
    classes: { '1': 'bronze', '2': 'silver', '3': 'gold' }, threshold: 'clear' },
  { discipline: 'rally-obedience', ruleset: 'enci-rally-obedience-2026', variants: ['individual'],
    classes: { '1': 'bronze', '2': 'silver', '3': 'gold' }, threshold: 'score', minimum: 90, maximum: 100 },
  { discipline: 'mondioring', ruleset: 'fci-mondioring-17191', variants: ['individual'],
    classes: { I: 'bronze' }, threshold: 'score', minimum: 160, maximum: 200 },
  { discipline: 'mondioring', ruleset: 'fci-mondioring-17191', variants: ['individual'],
    classes: { II: 'silver' }, threshold: 'score', minimum: 240, maximum: 300 },
  { discipline: 'mondioring', ruleset: 'fci-mondioring-17191', variants: ['individual'],
    classes: { III: 'gold' }, threshold: 'score', minimum: 320, maximum: 400 },
  { discipline: 'tracking', ruleset: 'fci-igp-2025', variants: ['individual'],
    classes: { IFH1: 'bronze', IFH2: 'silver', IFH3: 'gold', 'IGP-FH': 'gold' }, threshold: 'pass' },
  { discipline: 'mantrailing', ruleset: 'fci-iro-rescue-2025', variants: ['sport-test'],
    classes: { 'RH-MT V': 'bronze', 'RH-MT A': 'silver', 'RH-MT B': 'gold' }, threshold: 'pass' },
  { discipline: 'hoopers', ruleset: 'fci-hoopers-2026', variants: ['individual'],
    classes: { H1: 'bronze', H2: 'silver', H3: 'gold' }, threshold: 'clear' },
  { discipline: 'dog-dancing', ruleset: 'enci-dog-dancing-2024', variants: ['freestyle', 'heelwork-to-music'],
    classes: { '1': 'bronze', '2': 'silver', '3': 'gold' }, threshold: 'score', minimum: 34, maximum: 40 },
];

const value = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n);
const between = (n: unknown, min: number, max: number): n is number => value(n) && n >= min && n <= max;
function validDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(date + 'T00:00:00Z');
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}
const decision = (status: Decision['status'], reason: string, medal: Medal | null = null): Decision =>
  ({ status, reason, medal, policyVersion: POLICY_VERSION });

export function evaluateMerit(result: VerifiedResult, binding: HandlerBinding, today: string): Decision {
  if (!validDate(today) || !validDate(result.eventDate) || result.eventDate > today)
    return decision('needs_review', 'invalid_or_future_date');
  if (!result.isPublic || result.evidenceStatus === 'revoked' || binding.status === 'revoked')
    return decision('ineligible', 'private_or_revoked');
  if (result.evidenceStatus !== 'verified' || result.evidenceMethod === 'page_text_match'
      || binding.status !== 'verified' || binding.method === 'name_match')
    return decision('needs_review', 'independent_result_and_identity_verification_required');
  if (result.role !== 'handler' || result.handlerId !== binding.handlerId || result.provider !== binding.provider)
    return decision('ineligible', 'not_the_verified_handler');
  if (![result.provider, result.resultId, result.eventId, result.handlerId, result.dogId].every(x => x?.trim())
      || !/^[a-f0-9]{64}$/i.test(result.evidenceHash))
    return decision('needs_review', 'missing_evidence_identifiers');
  try {
    const url = new URL(result.sourceUrl);
    if (url.protocol !== 'https:' || url.username || url.password) throw new Error();
  } catch { return decision('needs_review', 'invalid_source_url'); }
  if (['failed', 'disqualified', 'withdrawn'].includes(result.outcome))
    return decision('ineligible', 'unsuccessful_result');
  if (result.outcome === 'unknown') return decision('needs_review', 'missing_outcome');
  const rule = MERIT_RULES.find(r => r.discipline === result.discipline && r.ruleset === result.ruleset
    && r.variants.includes(result.variant) && Object.hasOwn(r.classes, result.classCode));
  if (!rule) return decision('needs_review', 'unsupported_ruleset_class_or_variant');

  if (rule.threshold === 'pass') {
    // "Passed" must be the official outcome of the COMPLETE test, not an inference
    // from the total score or an isolated exercise/phase. Missing outcome stays pending.
    if (result.outcome !== 'passed') return decision('needs_review', 'official_pass_required');
    if (result.discipline === 'igp' && result.score !== undefined
        && (!between(result.score, 210, 300) || result.maxScore !== 300))
      return decision('needs_review', 'contradictory_igp_total');
    if (result.discipline === 'igp' && result.phaseScores) {
      if (result.phaseScores.length !== 3 || !result.phaseScores.every(n => between(n, 70, 100)))
        return decision('needs_review', 'contradictory_igp_phases');
      if (result.score !== undefined && result.phaseScores.reduce((a, b) => a + b, 0) !== result.score)
        return decision('needs_review', 'contradictory_total');
    }
    if (result.discipline === 'tracking' && result.classCode !== 'IGP-FH' && result.score !== undefined
        && (!between(result.score, 70, 100) || result.maxScore !== 100))
      return decision('needs_review', 'contradictory_tracking_score');
    if (result.classCode === 'IGP-FH' && result.phaseScores
        && (result.phaseScores.length !== 2 || !result.phaseScores.every(n => between(n, 70, 100))))
      return decision('needs_review', 'contradictory_tracking_phases');
  } else if (rule.threshold === 'clear') {
    if (!value(result.totalPenalties) || result.totalPenalties < 0)
      return decision('needs_review', 'complete_penalties_required');
    if (result.totalPenalties !== 0) return decision('below_threshold', 'not_a_clear_round');
  } else {
    if (!between(result.score, 0, rule.maximum!) || result.maxScore !== rule.maximum)
      return decision('needs_review', 'missing_or_incompatible_score_scale');
    if (result.discipline === 'dog-dancing') {
      const criteria = result.criterionScores;
      if (!criteria || criteria.length !== 4 || !criteria.every(n => between(n, 0, 10)))
        return decision('needs_review', 'four_judging_criteria_required');
      if (Math.abs(criteria.reduce((a, b) => a + b, 0) - result.score) > 0.001)
        return decision('needs_review', 'contradictory_total');
      if (criteria.some(n => n < 5)) return decision('ineligible', 'unqualified_judging_criterion');
    }
    if (result.score < rule.minimum!) return decision('below_threshold', 'score_below_medal_threshold');
  }
  return decision('awarded', 'qualifying_verified_result', rule.classes[result.classCode]);
}

export interface MeritSummary {
  medal: Medal | null;
  dogsAtBestTier: number;
  eventsAtBestTier: number;
  mostRecentAtBestTier: string | null;
  conflictingRecords: number;
}
const tier = { bronze: 1, silver: 2, gold: 3 };

/** Summarize ONE discipline and variant. No global IGP/Obedience/Agility order.
 * Caller supplies the current source revision only. Conflicting duplicates are
 * excluded rather than choosing the more flattering score. Event counts, not
 * number of heats/imports, prevent duplicate-result inflation.
 */
export function summarizeMerit(results: VerifiedResult[], binding: HandlerBinding,
  discipline: Discipline, variant: string, today: string): MeritSummary {
  const groups = new Map<string, VerifiedResult[]>();
  for (const r of results) {
    const key = JSON.stringify([r.provider, r.resultId]);
    const rows = groups.get(key) ?? [];
    rows.push(r); groups.set(key, rows);
  }
  let conflictingRecords = 0;
  const awards: { result: VerifiedResult; medal: Medal }[] = [];
  const comparable = (r: VerifiedResult) => JSON.stringify(Object.entries(r).sort(([a], [b]) => a.localeCompare(b)));
  for (const rows of groups.values()) {
    const r = rows[0];
    if (rows.some(other => comparable(other) !== comparable(r))) { conflictingRecords++; continue; }
    if (r.discipline !== discipline || r.variant !== variant) continue;
    const award = evaluateMerit(r, binding, today);
    if (award.medal) awards.push({ result: r, medal: award.medal });
  }
  const medal = awards.reduce<Medal | null>((best, a) => !best || tier[a.medal] > tier[best] ? a.medal : best, null);
  const best = awards.filter(a => a.medal === medal).map(a => a.result);
  return { medal, dogsAtBestTier: new Set(best.map(r => r.dogId)).size,
    eventsAtBestTier: new Set(best.map(r => r.eventId)).size,
    mostRecentAtBestTier: best.map(r => r.eventDate).sort().at(-1) ?? null, conflictingRecords };
}
