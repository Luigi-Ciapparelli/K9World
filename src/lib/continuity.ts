import { supabase } from './supabase';

// Enable only after deploying the tested continuity schema and RPCs.
export const continuityEnabled = import.meta.env.VITE_PROFESSIONAL_CONTINUITY === 'true';
export const relationshipLabels = {
  invited: 'In attesa', active: 'Attiva', ended: 'Conclusa', revoked: 'Revocata', declined: 'Rifiutata',
} as const;
export interface Relationship {
  id: string; dog_name: string; professional_name: string;
  status: keyof typeof relationshipLabels; authorized_at: string;
  accepted_at: string | null; ended_at: string | null; revoked_at: string | null;
}
export interface NoteRevision {
  session_id: string; note_id: string; dog_name: string; author_name: string;
  occurred_at: string; activity: string; revision_number: number;
  body: string; change_reason: string | null; revision_created_at: string;
}
export async function continuityRpc<T>(name: string, args = {}): Promise<T> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw error;
  return data as T;
}
export function continuityError(error: unknown): string {
  const code = (error as { code?: string })?.code;
  if (code === 'PGRST202' || code === '42883') return 'Questa funzione non è ancora disponibile. Riprova più tardi.';
  if (code === '42501') return 'Operazione non autorizzata. Aggiorna le relazioni e verifica che il consenso sia ancora valido.';
  if (code === '40001') return 'La nota ha una revisione più recente. Il tuo testo è rimasto nel modulo: consulta la cronologia prima di riprovare.';
  if (code === '22023') return 'Controlla i dati inseriti e il periodo della relazione. Se hai già inviato questa sessione, verifica prima l’archivio.';
  if (code === '55000') return 'La relazione è cambiata. Aggiorna l’elenco prima di procedere.';
  return 'Esito non confermato. Controlla l’elenco aggiornato prima di inviare di nuovo.';
}
export function localDateTime() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}
export function displayDate(value: string) {
  return new Date(value).toLocaleString('it-IT', { dateStyle: 'medium', timeStyle: 'short' });
}
