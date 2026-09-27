// A deliberately forgiving, illustrative shaping exercise, not a skills assessment.
export const SHAPING_VERSION = 'platform-front-paws-v1' as const;
export const SHAPING_STEPS = [
  { id: 'orient', title: 'Guarda la piattaforma', criterion: 'Il cane orienta la testa verso la piattaforma.', hint: 'Per ora basta che la guardi. Non aspettare che salga.', explanation: 'All’inizio rinforzi un’approssimazione molto piccola: l’orientamento verso la piattaforma.' },
  { id: 'approach', title: 'Si avvicina', criterion: 'Il cane raggiunge il bordo della piattaforma.', hint: 'Ora il criterio è avvicinarsi. Guardarla soltanto non basta più.', explanation: 'Quando il passo precedente è facile e ripetibile, il criterio può diventare un piccolo avvicinamento.' },
  { id: 'one-paw', title: 'Una zampa anteriore sopra', criterion: 'Una zampa anteriore tocca la superficie della piattaforma.', hint: 'Aspetta il contatto con la superficie, non il solo sollevamento della zampa.', explanation: 'Rinforzi il contatto della prima zampa: non chiedi ancora la posizione finale.' },
  { id: 'two-paws', title: 'Entrambe le zampe anteriori sopra', criterion: 'La seconda zampa anteriore si appoggia: entrambe sono sulla piattaforma.', hint: 'La prima zampa è già sopra. Segna l’appoggio della seconda.', explanation: 'Hai raggiunto la forma finale di questo esempio. La durata della posizione sarebbe un criterio successivo, distinto.' },
] as const;
export type ShapingStepId = typeof SHAPING_STEPS[number]['id'];
export type ShapingResult = { exercise: typeof SHAPING_VERSION; completed: ShapingStepId[] };
export const TARGET_AT = 3.2;
export const WINDOW_END = 5.2;
export const SCENE_END = 6.3;
export function judgeShapingClick(time: number): 'early' | 'correct' | 'late' {
  if (!Number.isFinite(time) || time < TARGET_AT) return 'early';
  return time <= WINDOW_END ? 'correct' : 'late';
}
export function normalizeShapingResult(value: unknown): ShapingResult | undefined {
  if (!value || typeof value !== 'object') return;
  const raw = value as {exercise?: unknown; completed?: unknown};
  if(raw.exercise !== SHAPING_VERSION || !Array.isArray(raw.completed)) return;
  // Only a completed prefix of the sequence can be restored.
  const completed: ShapingStepId[] = [];
  for(const step of SHAPING_STEPS) { if(raw.completed.includes(step.id)) completed.push(step.id); else break; }
  return {exercise:SHAPING_VERSION,completed};
}
export const shapingPassed = (value?: ShapingResult) => value?.exercise === SHAPING_VERSION && SHAPING_STEPS.every(step=>value.completed.includes(step.id));
const ramp=(time:number,start:number,end:number)=>Math.max(0,Math.min(1,(time-start)/(end-start)));
export function shapingPose(step: number, time: number) {
  const reach = ramp(time,1.2,TARGET_AT);
  const leaving = ramp(time,WINDOW_END,SCENE_END);
  const x = step===0 ? 195 : step===1 ? 195 + 229*reach - 26*leaving : 424;
  const look = step===0 ? 32*(1-reach)+18*leaving : 0;
  const paw1 = step===2 ? reach*(1-leaving) : step===3 ? 1 : 0;
  const paw2 = step===3 ? reach*(1-leaving) : 0;
  const walking = step===1 && time>1.2 && time<TARGET_AT;
  return {x,look,paw1,paw2,gait:walking ? Math.sin(time*13)*8 : 0};
}
