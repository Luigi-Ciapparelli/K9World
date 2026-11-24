import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Archive, BarChart3, Building2, CalendarDays, Contact, Handshake, Inbox,
  LayoutDashboard, LayoutGrid, Repeat2, SlidersHorizontal, Ticket, X, type LucideIcon,
} from 'lucide-react';
import { ProToolGuide } from '../../components/ProToolGuide';
import { RouteLink } from '../../components/RouteLink';
import { useAuth } from '../../lib/AuthContext';
import { continuityEnabled } from '../../lib/continuity';
import { useRouter } from '../../lib/RouterContext';
import { supabase } from '../../lib/supabase';
import '../../professional-workspace.css';

type Tool = { id: string; label: string; path: string; icon: LucideIcon; available?: 'centre' | 'continuity' };
const groups: { label: string; tools: Tool[] }[] = [
  { label: 'Lavoro quotidiano', tools: [
    { id: 'dashboard', label: 'La tua giornata', icon: LayoutDashboard, path: '/pro' },
    { id: 'bookings', label: 'Richieste e messaggi', icon: Inbox, path: '/pro/bookings' },
    { id: 'calendar', label: 'Calendario', icon: CalendarDays, path: '/pro/calendar' },
    { id: 'team', label: 'Istruttori del centro', icon: Building2, path: '/pro/team', available: 'centre' },
    { id: 'collaborations', label: 'Le mie collaborazioni', icon: Handshake, path: '/account/centres' },
  ] },
  { label: 'Percorsi dei clienti', tools: [
    { id: 'crm', label: 'Clienti', icon: Contact, path: '/pro/crm' },
    { id: 'archive', label: 'Relazioni e archivio', icon: Archive, path: '/pro/archive', available: 'continuity' },
    { id: 'passes', label: 'Pacchetti', icon: Ticket, path: '/pro/passes' },
    { id: 'subscriptions', label: 'Abbonamenti alle lezioni', icon: Repeat2, path: '/pro/subscriptions' },
  ] },
  { label: 'Attività professionale', tools: [
    { id: 'settings', label: 'Profilo guidato', icon: SlidersHorizontal, path: '/pro/settings' },
    { id: 'analytics', label: 'Statistiche', icon: BarChart3, path: '/pro/analytics' },
  ] },
];

export function ProLayout({ children, active }: { children: ReactNode; active: string }) {
  const { user, profile } = useAuth();
  const userId = user?.id;
  const [centreUser, setCentreUser] = useState<string | null>(null);
  useEffect(() => {
    let current = true;
    setCentreUser(null);
    if (!userId) return;
    void supabase.from('professionals').select('listing_type').eq('id', userId).maybeSingle().then(({ data, error }) => {
      if (current && !error && data?.listing_type === 'center') setCentreUser(userId);
    });
    return () => { current = false; };
  }, [userId]);

  const { path } = useRouter();
  const [open, setOpen] = useState(false);
  const [dismissedHint, setDismissedHint] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const currentLabel = groups.flatMap(g => g.tools).find(t => t.id === active)?.label || 'Area professionista';

  useEffect(() => { setOpen(false); setDismissedHint(false); }, [path]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setDismissedHint(true);
      if (open) { setOpen(false); menuRef.current?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return <div className="pg-workspace">
    <div className="pg-tools-bar">
      <strong>{currentLabel}</strong>
      <button type="button" ref={menuRef} aria-label={open ? 'Chiudi menu professionista' : 'Apri menu professionista'}
        aria-expanded={open} aria-controls="professional-navigation" onClick={() => setOpen(value => !value)}>
        {open ? <X size={20} aria-hidden="true" /> : <LayoutGrid size={20} aria-hidden="true" />} Strumenti
      </button>
    </div>
    <aside className="pg-rail" id="professional-navigation" data-open={open}>
      <div className="pg-rail-inner">
        <div className="pg-rail-id" aria-hidden="true">{profile?.full_name?.trim().slice(0, 1).toUpperCase() || 'P'}</div>
        <nav aria-label="Navigazione professionista" data-hints-off={dismissedHint}>
          {groups.map(group => <ul key={group.label} aria-label={group.label} className="pg-rail-group">
            {group.tools.filter(tool => tool.available === 'centre' ? !!userId && centreUser === userId : tool.available !== 'continuity' || continuityEnabled)
              .map(({ id, label, path: to, icon: Icon }) => <li key={id}>
                <RouteLink to={to} aria-label={label} aria-current={id === active ? 'page' : undefined} className="pg-rail-link"
                  onPointerEnter={() => setDismissedHint(false)} onFocus={() => setDismissedHint(false)}
                  onClick={event => {
                    if (open && path === to && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
                      setOpen(false); menuRef.current?.focus();
                    }
                  }}>
                  <Icon size={23} strokeWidth={1.8} aria-hidden="true" />
                  <span className="pg-rail-label" aria-hidden="true">{label}</span>
                </RouteLink>
              </li>)}
          </ul>)}
        </nav>
      </div>
    </aside>
    <main className="pg-workspace-main"><ProToolGuide />{children}</main>
  </div>;
}
