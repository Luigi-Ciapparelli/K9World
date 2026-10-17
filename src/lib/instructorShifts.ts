export type ShiftWindow = { day: number; start: string; end: string };
export type InstructorShifts = { instructor_id: string; enabled: boolean; slots: ShiftWindow[]; version: string | null; can_edit: boolean; affected_bookings: number; timezone: 'Europe/Rome' };
export const weekDays = ['Lunedì','Martedì','Mercoledì','Giovedì','Venerdì','Sabato','Domenica'];
export function shiftsForDay(slots: ShiftWindow[], date: string) {
 const day = new Date(`${date}T12:00:00Z`).getUTCDay() || 7;
 return slots.filter(s => s.day === day).sort((a,b) => a.start.localeCompare(b.start));
}
export function validateShifts(slots: ShiftWindow[], enabled: boolean) {
 if (enabled && !slots.length) return 'Aggiungi almeno una fascia prima di attivare i turni.';
 for (let day=1;day<=7;day++) {
  const rows=slots.filter(s=>s.day===day).sort((a,b)=>a.start.localeCompare(b.start));
  if(rows.length>4)return 'Puoi indicare fino a quattro fasce per giorno.';
  for(let i=0;i<rows.length;i++) {
   const row=rows[i];
   if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(row.start)||!/^(([01]\d|2[0-3]):[0-5]\d|24:00)$/.test(row.end)||row.start>=row.end)return 'Ogni fascia deve avere inizio e fine nello stesso giorno, in quest’ordine.';
   if(i&&rows[i-1].end>=row.start)return 'Unisci le fasce adiacenti o sovrapposte dello stesso giorno.';
  }
 }
 return '';
}
