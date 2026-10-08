import { supabase } from './supabase';
import { continuityRpc } from './continuity';

export type ExportScope = 'owner' | 'professional' | 'received';
export type ExportCounts = Record<'relationships' | 'bookings' | 'messages' | 'notes', number>;
export type ExportPreview = { dog_name: string; counts: ExportCounts; data_bytes: number; checked_at: string; photo_present: boolean };
type Row = Record<string, string | number | boolean | null>;
export type DogHistory = {
  schema_version: number; generated_at: string; scope: ExportScope; subject_id: string;
  range: { from: string | null; until_exclusive: string | null };
  dog: Row; relationships: Row[]; bookings: Row[]; messages: Row[]; notes: Row[];
  counts: ExportCounts; data_bytes: number; limits: string[];
  photo?: { status: 'included' | 'omitted' | 'absent'; detail: string; data_url?: string };
};
export type ExportRequest = { p_scope: ExportScope; p_subject_id: string; p_from: string | null; p_until: string | null };
export const exportLabels: Record<ExportScope, string> = {
  owner: 'Storico del tuo cane', professional: 'Archivio del professionista', received: 'Contributi autorizzati',
};
export function exportRequest(scope: ExportScope, id: string, from: string, through: string): ExportRequest {
  const start = from ? new Date(`${from}T00:00:00`) : null;
  const until = through ? new Date(`${through}T00:00:00`) : null;
  if (until) until.setDate(until.getDate() + 1);
  if ((start && !Number.isFinite(start.getTime())) || (until && !Number.isFinite(until.getTime())) || (start && until && start >= until)) throw new Error('range');
  return { p_scope: scope, p_subject_id: id, p_from: start?.toISOString() || null, p_until: until?.toISOString() || null };
}
export function historyRpc<T extends DogHistory | ExportPreview>(request: ExportRequest, preview: boolean) {
  return continuityRpc<T>('export_dog_history', { ...request, p_preview: preview });
}
export function exportError(error: unknown) {
  const code = (error as { code?: string })?.code;
  if (code === '42501') return 'Non puoi più esportare questi dati. La proprietà o l’autorizzazione potrebbero essere cambiate.';
  if (code === '54000') return 'Lo storico è troppo grande per un solo file. Seleziona un periodo più breve e riprova.';
  if (code === '22023' || (error as Error)?.message === 'range') return 'Controlla le date: la fine non può precedere l’inizio.';
  if (code === 'PGRST202' || code === '42883') return 'L’esportazione non è ancora disponibile su questa versione. Riprova dopo l’aggiornamento.';
  return 'Non è stato possibile preparare il file. Nessun download avviato: riprova.';
}
const omitted = (detail: string): NonNullable<DogHistory['photo']> => ({ status: 'omitted', detail });
async function collectPhoto(path: string, userId: string, dogId: string): Promise<NonNullable<DogHistory['photo']>> {
  // No arbitrary URLs, remote tracking images, signed links or SVG in exports.
  if (path !== `${userId}/${dogId}/profile`) return omitted('La foto usa un riferimento precedente o esterno e non è incorporata. Puoi consultarla dalla scheda del cane.');
  try {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const response = await Promise.race([
      supabase.storage.from('dog-photos').download(path),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('photo-timeout')), 15000); }),
    ]).finally(() => clearTimeout(timer));
    const { data, error } = response;
    if (error || !data) throw new Error('photo');
    if (data.size > 8 * 1024 * 1024) return omitted('La foto supera 8 MB e non è incorporata.');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(data.type)) return omitted('Il formato della foto non è supportato per il documento (JPEG, PNG o WebP).');
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader(); reader.onerror = () => reject(new Error('photo')); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(data);
    });
    return { status: 'included', detail: 'Foto del cane incorporata nel file.', data_url: dataUrl };
  } catch { return omitted('Non è stato possibile recuperare la foto. Il documento contiene i dati testuali; riprova per includerla.'); }
}
export async function prepareHistoryDownload(request: ExportRequest, includePhoto: boolean, userId: string, isCurrent: () => boolean): Promise<DogHistory | null> {
  let data = await historyRpc<DogHistory>(request, false);
  if (!isCurrent()) return null;
  const photoPath = typeof data.dog.photo_path === 'string' ? data.dog.photo_path : '';
  if (request.p_scope === 'owner') {
    let photo: NonNullable<DogHistory['photo']> = { status: 'absent', detail: 'Nessuna foto del cane registrata.' };
    if (photoPath) photo = includePhoto ? await collectPhoto(photoPath, userId, request.p_subject_id) : omitted('Foto esclusa per tua scelta.');
    if (!isCurrent()) return null;
    // Photo acquisition is asynchronous: ownership, publications and revisions
    // are read afresh before delivery. No earlier note body survives this call.
    const fresh = await historyRpc<DogHistory>(request, false);
    if (!isCurrent()) return null;
    if ((fresh.dog.photo_path || '') !== photoPath) photo = omitted('La foto è cambiata durante la preparazione. Scarica di nuovo per includere quella attuale.');
    data = fresh; data.photo = photo;
  }
  const { data: current } = await supabase.auth.getSession();
  if (!isCurrent() || current.session?.user.id !== userId) return null;
  delete data.dog.photo_path; // Never distribute storage paths or expiring URLs.
  return data;
}
const escape = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
const date = (value: unknown) => typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toLocaleString('it-IT', { timeZone: 'Europe/Rome', dateStyle: 'medium', timeStyle: 'short' }) : 'Non registrata';
const status: Record<string, string> = { pending: 'In attesa', accepted: 'Accettata', completed: 'Completata', declined: 'Rifiutata', cancelled: 'Annullata', invited: 'Invito in attesa', active: 'Attiva', ended: 'Conclusa', revoked: 'Revocata', finalized: 'Registrata', draft: 'Bozza' };
const value = (v: unknown) => escape(v === null || v === undefined || v === '' ? 'Non indicato' : v);
const fact = (label: string, v: unknown) => `<div><dt>${escape(label)}</dt><dd>${value(v)}</dd></div>`;
const body = (v: unknown) => `<p class="note">${escape(v)}</p>`;
export function historyHtml(data: DogHistory) {
  const d = data.dog;
  const photo = data.photo?.status === 'included' && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data.photo.data_url || '') ? `<img class="photo" alt="Foto del cane" src="${data.photo.data_url}">` : '';
  const relations = data.relationships.map(r => `<article><h3>${value(r.professional_name)}</h3><dl>${fact('Stato', status[String(r.status)] || r.status)}${fact('Invito', date(r.authorized_at))}${r.accepted_at ? fact('Accettazione', date(r.accepted_at)) : ''}${r.ended_at || r.revoked_at || r.declined_at ? fact('Chiusura', date(r.revoked_at || r.ended_at || r.declined_at)) : ''}</dl></article>`).join('');
  const bookings = data.bookings.map(b => `<article><h3>${value(b.service_name || 'Servizio non più disponibile')} · ${value(b.professional_name)}</h3><dl>${fact('Dal', date(b.start_at))}${fact('Al', date(b.end_at))}${fact('Stato', status[String(b.status)] || b.status)}${fact('Prezzo registrato (€)', b.price)}${fact('Categoria attuale del servizio', b.service_type)}${fact('Luogo registrato', b.recorded_location)}</dl><h4>Nota della richiesta</h4>${body(b.notes || 'Nessuna nota.')}<details open><summary>Conversazione dell’appuntamento</summary>${data.messages.filter(m => m.booking_id === b.id).map(m => `<div class="message"><strong>${m.sender_kind === 'owner' ? 'Proprietario' : 'Professionista'}</strong> · ${escape(date(m.created_at))}${m.automatic_event ? ' · risposta automatica' : ''}${body(m.body)}</div>`).join('') || '<p>Nessun messaggio.</p>'}</details><p class="reference">Riferimento ${escape(b.id)}</p></article>`).join('');
  const notes = data.notes.map(n => `<article><h3>${value(n.activity)}</h3><dl>${fact('Autore', n.author_name)}${fact('Attività', date(n.occurred_at))}${fact('Revisione', n.revision_number)}${fact('Registrata', date(n.revision_created_at))}${fact('Accesso', n.access_kind === 'private_archive' ? 'Archivio privato dell’autore' : 'Revisione condivisa')}${n.shared_at ? fact('Condivisa', date(n.shared_at)) : ''}</dl>${body(n.body)}${n.change_reason ? `<h4>Motivo della rettifica</h4>${body(n.change_reason)}` : ''}<p class="reference">Nota ${escape(n.note_id)}${n.booking_reference ? ` · Appuntamento ${escape(n.booking_reference)}` : ''}</p></article>`).join('');
  return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data:; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><meta name="referrer" content="no-referrer"><title>${escape(d.name)} · Storico PortaleCinofilo</title><style>
*{box-sizing:border-box}body{margin:0;background:#f4f5f1;color:#18211c;font:16px/1.6 system-ui,sans-serif}main{max-width:980px;margin:32px auto;background:white;padding:48px;border-radius:24px}header{border-bottom:3px solid #163d2a;padding-bottom:24px}h1{font-size:38px;margin:8px 0}h2{font-size:24px;margin:36px 0 12px}h3{font-size:18px;margin:0 0 14px}h4{margin-bottom:4px}.brand{font-weight:750;color:#163d2a}.small,.reference{color:#526157;font-size:13px}.note{white-space:pre-wrap;overflow-wrap:anywhere}article{border:1px solid #d9e0d9;border-radius:16px;padding:22px;margin-bottom:16px}dl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 24px;margin:0}dt{font-size:12px;color:#526157}dd{margin:0;overflow-wrap:anywhere}.photo{max-width:100%;max-height:240px;border-radius:16px;margin:20px 0}.message{border-left:3px solid #d9e0d9;padding-left:14px;margin:14px 0}.notice{background:#f1f5ee;border-radius:12px;padding:16px}li{margin:10px 0}summary{font-weight:600}@media(max-width:620px){main{margin:0;padding:24px;border-radius:0}dl{grid-template-columns:1fr}h1{font-size:30px}}@media print{body{background:white;font-size:11pt}main{max-width:none;margin:0;padding:0}article{break-inside:auto;border-radius:0}h2,h3,h4{break-after:avoid}.print-tip{display:none}.photo{max-height:180px}@page{size:A4;margin:16mm}}
</style></head><body><main><header><div class="brand">PortaleCinofilo</div><h1>${escape(d.name)}</h1><p>${escape(exportLabels[data.scope])}</p><p class="small">Esportato il ${escape(date(data.generated_at))} · Orari Europe/Rome</p><p class="small">Periodo attività: ${data.range.from ? escape(date(data.range.from)) : 'dall’inizio'} → ${data.range.until_exclusive ? escape(date(data.range.until_exclusive)) + ' (escluso)' : 'senza limite finale'}</p></header><p class="notice print-tip">Documento autonomo consultabile anche senza Internet. Per un PDF usa Stampa → Salva come PDF nel browser.</p><h2>Anagrafica</h2>${photo}<dl>${fact('Nome', d.name)}${d.source === 'current_owner_record' ? fact('Razza dichiarata', d.breed) + fact('Gruppo FCI', d.fci_group) + fact('Nascita', d.birth_date) + fact('Età dichiarata (anni, se manca la nascita)', d.birth_date ? 'Vedi data di nascita' : d.age) + fact('Peso dichiarato (kg)', d.weight) + fact('Vaccinazioni dichiarate', d.vaccinated ? 'In regola secondo il proprietario' : 'Non indicate') + fact('Reattività segnalata', d.reactivity_reported ? 'Sì' : 'Non indicata') : fact('Nome conservato nello storico', 'I dati anagrafici attuali del proprietario non fanno parte di questo archivio.')}</dl>${d.owner_notes ? '<h3>Informazioni del proprietario</h3>' + body(d.owner_notes) : ''}${data.photo ? '<p class="small">' + escape(data.photo.detail) + '</p>' : ''}${data.scope !== 'received' ? `<h2>Relazioni professionali (${data.counts.relationships})</h2>${relations || '<p>Nessuna relazione nel perimetro esportabile.</p>'}<h2>Appuntamenti (${data.counts.bookings})</h2><p class="small">Nomi e categorie dei servizi sono quelli attualmente registrati; appuntamenti richiesti o annullati non attestano una prestazione svolta.</p>${bookings || '<p>Nessun appuntamento nel periodo e perimetro selezionati.</p>'}` : ''}<h2>Note e revisioni (${data.counts.notes})</h2>${notes || '<p>Nessun contributo esportabile nel periodo selezionato.</p>'}<h2>Come leggere questo storico</h2><ul>${data.limits.map(l => `<li>${escape(l)}</li>`).join('')}</ul><p class="small">${data.scope === 'professional' ? 'Le revisioni private esportate appartengono esclusivamente al tuo archivio per questa relazione.' : 'Le note private altrui e le revisioni non condivise non fanno parte del file. L’assenza di note non dimostra l’assenza di un percorso.'}</p></main></body></html>`;
}
export function downloadHistory(data: DogHistory, format: 'html' | 'json') {
  const content = format === 'html' ? historyHtml(data) : JSON.stringify(data, null, 2);
  const blob = new Blob([content], { type: format === 'html' ? 'text/html;charset=utf-8' : 'application/json;charset=utf-8' });
  if (blob.size > 32 * 1024 * 1024) throw { code: '54000' };
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url;
  const name = String(data.dog.name || 'cane').normalize('NFKD').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 60) || 'cane';
  link.download = `PortaleCinofilo-${name}-${data.scope}-${data.subject_id.slice(0, 8)}-${data.generated_at.slice(0, 10)}.${format}`;
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
