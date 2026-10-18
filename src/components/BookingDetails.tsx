import { bookingDateTime, type BookingDetailsRow } from '../lib/bookingDetails';
export function BookingDetails({ row, loading, onRetry }: {
  row?: BookingDetailsRow; loading: boolean; onRetry: () => void;
}) {
  if (loading) return <p role="status" className="mt-3 text-sm">Caricamento servizio e cane…</p>;
  if (!row) return <p role="alert" className="mt-3 text-sm">Dettagli della prenotazione non disponibili. <button type="button" onClick={onRetry} className="font-semibold underline">Riprova dettagli</button></p>;
  return <div className="mt-3 space-y-1 break-words text-sm" aria-label="Dettagli della prenotazione">
    <p><strong>Servizio:</strong> {row.service_name}</p>
    {row.service_source === 'catalogue' && <p className="text-xs text-[var(--pc-muted-600)]">Nome dal catalogo attuale; non è disponibile una copia registrata.</p>}
    <p><strong>{row.dog_names.length > 1 ? 'Cani' : 'Cane'}:</strong> {row.dog_names.length ? row.dog_names.join(', ') : 'Dato non disponibile'}</p>
    {row.dogs_unavailable && <p className="text-xs text-[var(--pc-muted-600)]">Alcuni dati del cane non sono più disponibili per questa prenotazione.</p>}
    <p><strong>Fine prevista:</strong> {bookingDateTime(row.end_at)}</p>
  </div>;
}
