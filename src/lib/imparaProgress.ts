import { STAGE_1_LESSONS, type ImparaLesson } from './imparaContent';
import { normalizeShapingResult, shapingPassed, SHAPING_STEPS, type ShapingResult } from './shapingLab';

export const PROGRESS_KEY = 'portalecinofilo-impara-v3';
export const LEGACY_KEY = 'pawconnect-impara-stage1-v2';
export const PROGRESS_EVENT = 'portalecinofilo-impara-progress';
export type TimingResult = { hits: number; extras: number; total: number; offsets: (number | null)[] };
export type LabResult = TimingResult | ShapingResult;
export type ActivityDraft = { fields: string[]; checks: boolean[]; done: boolean; lab?: LabResult };
export type QuizAttempt = { answers: number[]; date: string };
export type LearningProgress = {
  version: 3; studied: string[]; activities: Record<string, ActivityDraft>;
  quizzes: Record<string, QuizAttempt[]>; resume: string; migrated: boolean;
};
export const emptyProgress = (): LearningProgress => ({ version: 3, studied: [], activities: {}, quizzes: {}, resume: '', migrated: false });
export const learningKey = (slug: string, id: string) => `${slug}:${id}`;
const record = (x: unknown): Record<string, unknown> => x && typeof x === 'object' && !Array.isArray(x) ? x as Record<string, unknown> : {};
export function normalizeProgress(value: unknown): LearningProgress {
  const raw = record(value); const result = emptyProgress();
  const knownReadings = new Set(STAGE_1_LESSONS.flatMap(l => l.sublessons.map(s => learningKey(l.slug, s.id))));
  result.studied = Array.isArray(raw.studied) ? [...new Set(raw.studied.filter((x): x is string => typeof x === 'string' && knownReadings.has(x)))] : [];
  result.resume = STAGE_1_LESSONS.some(l => l.slug === raw.resume) ? raw.resume as string : '';
  result.migrated = raw.migrated === true || raw.version !== 3 && result.studied.length > 0;
  // Old self-declared activity/verified flags are not equivalent to the new exercises.
  if (raw.version !== 3) return result;
  for (const lesson of STAGE_1_LESSONS) {
    for (const activity of lesson.activities) {
      const key = learningKey(lesson.slug, activity.id);
      const source = record(record(raw.activities)[key]);
      const fields = (activity.fields || []).map((_, i) => Array.isArray(source.fields) && typeof source.fields[i] === 'string' ? source.fields[i].slice(0, 3000) : '');
      const checks = activity.instructions.map((_, i) => Array.isArray(source.checks) && source.checks[i] === true);
      const draft: ActivityDraft = { fields, checks, done: false };
      if (activity.type === 'video-lab' && activity.labKind === 'shaping') {
        draft.lab = normalizeShapingResult(source.lab);
        draft.done = source.done === true && !!draft.lab && shapingPassed(draft.lab);
      } else if (activity.type === 'video-lab') {
        const lab = record(source.lab); const total = activity.markerTargets?.length || 0;
        const offsets = Array.isArray(lab.offsets) && lab.offsets.length === total ? lab.offsets.map(x => typeof x === 'number' && Number.isFinite(x) ? x : null) : [];
        const hits = offsets.filter(x => x !== null && Math.abs(x) <= (activity.markerToleranceMs || 350)).length;
        if (total && offsets.length === total && typeof lab.extras === 'number' && Number.isInteger(lab.extras) && lab.extras >= 0) {
          draft.lab = { hits, total, extras: lab.extras, offsets };
          draft.done = source.done === true && labPassed(draft.lab);
        }
      } else draft.done = source.done === true && fields.length > 0 && fields.every(s => s.trim()) && checks.every(Boolean);
      if (Object.keys(source).length) result.activities[key] = draft;
    }
    const attempts = record(raw.quizzes)[lesson.slug];
    if (Array.isArray(attempts)) result.quizzes[lesson.slug] = attempts.slice(-5).flatMap(a => {
      const v = record(a);
      if (!Array.isArray(v.answers) || v.answers.length !== lesson.quiz.length || !v.answers.every((n, i) => Number.isInteger(n) && n >= 0 && n < lesson.quiz[i].options.length)) return [];
      return [{ answers: v.answers as number[], date: typeof v.date === 'string' && Number.isFinite(Date.parse(v.date)) ? v.date : '' }];
    });
  }
  return result;
}
export const scoreQuiz = (lesson: ImparaLesson, answers: number[]) => lesson.quiz.filter((q, i) => answers[i] === q.correctIndex).length;
export const passScore = (lesson: ImparaLesson) => Math.ceil(lesson.quiz.length * 0.75);
export const labPassed = (r: LabResult) => 'exercise' in r ? shapingPassed(r) : r.hits >= Math.ceil(r.total * .75) && r.total > 0 && r.extras === 0;
export function lessonStatus(lesson: ImparaLesson, p: LearningProgress) {
  const studied = lesson.sublessons.filter(s => p.studied.includes(learningKey(lesson.slug, s.id))).length;
  const activities = lesson.activities.filter(a => p.activities[learningKey(lesson.slug, a.id)]?.done).length;
  const attempts = p.quizzes[lesson.slug] || [];
  const latest = attempts[attempts.length - 1];
  const ready = studied === lesson.sublessons.length && activities === lesson.activities.length;
  const passed = !!latest && scoreQuiz(lesson, latest.answers) >= passScore(lesson);
  return { studied, activities, ready, passed, complete: ready && passed, started: studied > 0 || lesson.activities.some(a => !!p.activities[learningKey(lesson.slug, a.id)]) || attempts.length > 0 };
}
// Match a click to at most one crossing. Extra clicks never improve the score.
export function scoreMarkers(targets: number[], clicks: number[], toleranceMs: number): TimingResult {
  const offsets: (number | null)[] = targets.map(() => null); let extras = 0;
  for (const click of clicks) {
    if (!Number.isFinite(click)) { extras++; continue; }
    let nearest = -1; let delta = Infinity;
    targets.forEach((target, i) => { const d = Math.abs(click - target) * 1000; if (d < delta) { nearest = i; delta = d; } });
    if (nearest >= 0 && delta <= toleranceMs && offsets[nearest] === null) offsets[nearest] = Math.round((click - targets[nearest]) * 1000);
    else extras++;
  }
  return { hits: offsets.filter(v => v !== null).length, extras, total: targets.length, offsets };
}
let memory: LearningProgress | undefined;
let available = true;
export const storageAvailable = () => available;
export function readProgress(): LearningProgress {
  if (typeof window === 'undefined') return emptyProgress();
  try {
    if (!available && memory) return memory;
    const saved = window.localStorage.getItem(PROGRESS_KEY);
    const legacy = saved === null ? window.localStorage.getItem(LEGACY_KEY) : null;
    try { memory = normalizeProgress(JSON.parse(saved || legacy || '{}')); }
    catch { memory = emptyProgress(); }
  } catch { available = false; memory = memory || emptyProgress(); }
  return memory;
}
export function writeProgress(progress: LearningProgress) {
  memory = normalizeProgress(progress);
  try { window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(memory)); available = true; }
  catch { available = false; }
  window.dispatchEvent(new Event(PROGRESS_EVENT));
}
export function notebookText(p: LearningProgress): string {
  return ['PortaleCinofilo · Il mio quaderno', 'Appunti personali e autoverifiche. Non è un attestato o una valutazione professionale.', '',
    ...STAGE_1_LESSONS.flatMap(l => [l.title, `Stato: ${lessonStatus(l,p).complete ? 'Completata' : 'Da completare'}`,
      ...l.activities.flatMap(a => { const draft = p.activities[learningKey(l.slug,a.id)]; return [a.title,
        ...(a.fields || []).map((label,i) => `${label}\n${draft?.fields[i] || '(non compilato)'}`),
        ...(draft?.lab ? ['exercise' in draft.lab ? `Shaping: ${draft.lab.completed.length}/${SHAPING_STEPS.length} approssimazioni completate` : `Timing: ${draft.lab.hits}/${draft.lab.total}; click extra: ${draft.lab.extras}`] : [])]; }), ''])].join('\n\n');
}
export function downloadText(filename: string, value: string, mime = 'text/plain') {
  const url = URL.createObjectURL(new Blob([value], { type: `${mime};charset=utf-8` }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
