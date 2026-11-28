import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Archive, BarChart3, Building2, CalendarDays, CalendarPlus, ChevronDown, Contact, ExternalLink, Handshake, Inbox, LogOut, PawPrint, UserRound,
  LayoutDashboard, LayoutGrid, Repeat2, SlidersHorizontal, Ticket, X, type LucideIcon,
} from 'lucide-react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { ProToolGuide } from '../../components/ProToolGuide';
import { RouteLink } from '../../components/RouteLink';
import { useAuth } from '../../lib/AuthContext';
import { continuityEnabled } from '../../lib/continuity';
import { useRouter } from '../../lib/RouterContext';
import { StudioAgendaProvider, useStudioAgenda } from '../../components/StudioAgendaContext';
import '../../professional-workspace.css';
import '../../studio-orientation.css';

type Tool = { id: string; label: string; path: string; icon: LucideIcon; available?: 'centre' | 'continuity' };
const groups: { label: string; tools: Tool[] }[] = [
  { label: 'Lavoro quotidiano', tools: [
    { id: 'dashboard', label: 'La tua giornata', icon: LayoutDashboard, path: '/pro' },
    { id: 'new-appointment', label: 'Nuovo appuntamento', icon: CalendarPlus, path: '/pro/calendar?new=1' },
    { id: 'bookings', label: 'Richieste e messaggi', icon: Inbox, path: '/pro/bookings' },
    { id: 'calendar', label: 'Calendario', icon: CalendarDays, path: '/pro/calendar' },
    { id: 'team', label: 'Istruttori del centro', icon: Building2, path: '/pro/team', available: 'centre' },
    { id: 'collaborations', label: 'Le mie collaborazioni', icon: Handshake, path: '/account/centres' },
  ] },
  { label: 'Clienti e lezioni', tools: [
    { id: 'crm', label: 'Clienti', icon: Contact, path: '/pro/crm' },
    { id: 'archive', label: 'Relazioni e archivio', icon: Archive, path: '/pro/archive', available: 'continuity' },
    { id: 'passes', label: 'Pacchetti', icon: Ticket, path: '/pro/passes' },
    { id: 'subscriptions', label: 'Abbonamenti alle lezioni', icon: Repeat2, path: '/pro/subscriptions' },
  ] },
  { label: 'Configurazione', tools: [
    { id: 'settings', label: 'Profilo guidato', icon: SlidersHorizontal, path: '/pro/settings' },
    { id: 'analytics', label: 'Statistiche', icon: BarChart3, path: '/pro/analytics' },
  ] },
];

export function ProLayout({ children, active }: { children: ReactNode; active: string }) {
  return <StudioAgendaProvider><StudioFrame active={active}>{children}</StudioFrame></StudioAgendaProvider>;
}
function StudioFrame({children,active}:{children:ReactNode;active:string}) {
  const { profile, signOut } = useAuth();
  const agenda=useStudioAgenda();
  const { path, navigate } = useRouter();
  const [leaving, setLeaving] = useState(false);
  const [logoutError, setLogoutError] = useState(false);
  const accountRef = useRef<HTMLDetailsElement>(null);
  const leave = async () => { if (leaving) return; setLeaving(true); setLogoutError(false); try { await signOut(); navigate('/'); } catch { setLogoutError(true); } finally { setLeaving(false); } };
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const currentLabel = groups.flatMap(g => g.tools).find(t => t.id === active)?.label || 'Area professionista';

  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (accountRef.current?.open) { accountRef.current.open = false; accountRef.current.querySelector('summary')?.focus(); }
      if (open) { setOpen(false); menuRef.current?.focus(); }
    };
    const closeAccount = (event: PointerEvent) => {
      if (accountRef.current?.open && event.target instanceof Node && !accountRef.current.contains(event.target)) accountRef.current.open = false;
    };
    window.addEventListener('keydown', onKey); document.addEventListener('pointerdown', closeAccount);
    return () => { window.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', closeAccount); };
  }, [open]);

  return <div className="pg-workspace">
    <header className="pg-studio-bar">
      <div className="pg-studio-identity"><span className="pg-studio-mobile-mark" aria-hidden="true"><PawPrint size={19} /></span>
        <strong>PortaleCinofilo</strong><span className="pg-studio-divider" /><span className="pg-studio-name">Studio professionista</span></div>
      <div className="pg-studio-tools">
        <RouteLink to="/search?type=trainer" className="pg-studio-public"><ExternalLink size={16} /> Visita il portale</RouteLink>
        <details className="pg-studio-account" ref={accountRef}><summary aria-label="Menu account"><UserRound size={18} /><span>{profile?.full_name?.trim().split(/\s+/)[0] || 'Account'}</span><ChevronDown size={14} /></summary>
          <div className="pg-account-panel"><strong>{profile?.full_name || 'Il tuo account'}</strong><RouteLink to="/account/contacts">Recapiti account</RouteLink><RouteLink to="/search?type=trainer">Visita il portale</RouteLink>
            <div><ThemeToggle /></div><button type="button" onClick={event=>{if(accountRef.current)accountRef.current.open=false;window.dispatchEvent(new CustomEvent('pc:help',{detail:accountRef.current?.querySelector('summary')??event.currentTarget}));}}>Aiuto</button><button type="button" onClick={leave} disabled={leaving}><LogOut size={16} /> {leaving ? 'Uscita…' : 'Esci'}</button>
            {logoutError && <span role="alert">Uscita non riuscita. Riprova.</span>}</div></details>
        <button type="button" className="pg-studio-menu" ref={menuRef} aria-label={open ? 'Chiudi menu professionista' : 'Apri menu professionista'}
          aria-expanded={open} aria-controls="professional-navigation" onClick={() => setOpen(value => !value)}>
          {open ? <X size={19} /> : <LayoutGrid size={19} />} Strumenti</button>
      </div>
    </header>
    <aside className="pg-rail" id="professional-navigation" data-open={open}>
      <div className="pg-rail-inner">
        <RouteLink to="/pro" className="pg-rail-id" aria-label="Studio professionista, inizio"><PawPrint size={23} aria-hidden="true" /></RouteLink>
        <nav aria-label="Navigazione professionista" >
          {groups.map(group => <div className="pg-tool-group" key={group.label}><p className="pg-group-name" aria-hidden="true">{group.label}</p><ul aria-label={group.label} className="pg-rail-group">
            {group.tools.filter(tool => (tool.id !== 'new-appointment' || agenda.step?.kind === 'ready') && (tool.available === 'centre' ? agenda.centre : tool.available !== 'continuity' || continuityEnabled))
              .map(({ id, label, path: to, icon: Icon }) => <li key={id}>
                <RouteLink to={to} aria-label={label} aria-current={id === active ? 'page' : undefined} data-action={id === 'new-appointment' || undefined} className="pg-rail-link"
                  onClick={event => {
                    if (open && path === to && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
                      setOpen(false); menuRef.current?.focus();
                    }
                  }}>
                  <Icon size={23} strokeWidth={1.8} aria-hidden="true" />
                  <span className="pg-rail-label" aria-hidden="true">{label}</span>
                </RouteLink>
              </li>)}
          </ul></div>)}
        </nav>
      </div>
    </aside>
    <main className="pg-workspace-main" aria-label={currentLabel}><ProToolGuide />{children}</main>
  </div>;
}
