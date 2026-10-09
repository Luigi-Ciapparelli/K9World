import { useEffect, useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { ProfileImageEditor } from './ProfileImageEditor';
import { useUnsavedChanges } from '../lib/RouterContext';

export function useClientPortraits(clientIds: string[] = [], bookingIds: string[] = [], refresh = 0) {
  const { user } = useAuth();
  const [cycle, setCycle] = useState(0);
  const [state, setState] = useState<{ key: string; urls: Record<string, string> }>({ key: '', urls: {} });
  const clients = [...new Set(clientIds)].sort().slice(0, 100).join(',');
  const bookings = [...new Set(bookingIds)].sort().slice(0, 100).join(',');
  const key = `${user?.id || ''}:${clients}:${bookings}:${refresh}:${cycle}`;
  useEffect(() => {
    let active = true;
    if (!user || (!clients && !bookings)) return;
    void (async () => {
      const { data, error } = await supabase.rpc('get_client_portraits', { p_client_ids: clients ? clients.split(',') : [], p_booking_ids: bookings ? bookings.split(',') : [] });
      if (!active || error || !data?.length) return;
      const rows = data as { client_id: string; booking_id: string | null; object_path: string }[];
      const paths = [...new Set(rows.map(row => row.object_path))];
      const signed = await supabase.storage.from('client-portraits').createSignedUrls(paths, 60);
      if (!active || signed.error) return;
      const byPath = new Map((signed.data || []).filter(item => !item.error).map(item => [item.path, item.signedUrl]));
      const urls: Record<string, string> = {};
      rows.forEach(row => { const url = byPath.get(row.object_path); if (url) { urls[row.client_id] = url; if (row.booking_id) urls[row.booking_id] = url; } });
      if (active) setState({ key, urls });
    })().catch(() => { /* A missing optional portrait must not block bookings. */ });
    const renew = () => { if (active && document.visibilityState === 'visible') setCycle(n => n + 1); };
    const expire = window.setTimeout(() => { if (active) { setState({ key, urls: {} }); renew(); } }, 60_000);
    document.addEventListener('visibilitychange', renew);
    return () => { active = false; window.clearTimeout(expire); document.removeEventListener('visibilitychange', renew); };
  }, [key, user?.id, clients, bookings]);
  return state.key === key ? state.urls : {};
}

export function ClientPortrait({ src, name, className = 'h-11 w-11' }: { src?: string; name: string; className?: string }) {
  const [failed, setFailed] = useState('');
  const initials = name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  return src && src !== failed ? <img src={src} onError={() => setFailed(src)} alt={`Foto di ${name}`} loading="lazy" decoding="async" className={`${className} rounded-full object-cover shrink-0`} /> : <span aria-hidden="true" className={`${className} rounded-full bg-emerald-50 text-emerald-900 flex items-center justify-center text-sm font-bold shrink-0`}>{initials || '—'}</span>;
}

export function OwnerPortraitEditor() {
  const { user, profile } = useAuth();
  const [refresh, setRefresh] = useState(0), [active, setActive] = useState(false);
  const urls = useClientPortraits(user ? [user.id] : [], [], refresh);
  useUnsavedChanges(active, '/account/contacts');
  if (!user || profile?.role !== 'owner') return null;
  return <ProfileImageEditor key={user.id} userId={user.id} kind="client" currentUrl={urls[user.id]} onActivity={setActive} onSaved={() => setRefresh(n => n + 1)} />;
}
