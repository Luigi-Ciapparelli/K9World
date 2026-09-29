import { continuityEnabled } from '../../lib/continuity';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { LayoutDashboard, Calendar, CalendarDays, Package, RefreshCw, Users, BarChart3, Compass, Menu, X, ArrowUpRight } from 'lucide-react';
import { useRouter } from '../../lib/RouterContext';
import { useAuth } from '../../lib/AuthContext';
import { ProToolGuide } from '../../components/ProToolGuide';
import '../../professional-workspace.css';

export function ProLayout({ children, active }: { children: ReactNode; active: string }) {
  const { navigate } = useRouter();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLButtonElement>(null);
  const nav = [
    { id: 'dashboard', label: 'La tua giornata', icon: LayoutDashboard, path: '/pro', group: 'IL TUO LAVORO' },
    { id: 'bookings', label: 'Richieste e messaggi', icon: Calendar, path: '/pro/bookings' },
    { id: 'calendar', label: 'Calendario', icon: CalendarDays, path: '/pro/calendar' },
    { id: 'crm', label: 'Clienti', icon: Users, path: '/pro/crm', group: 'I PERCORSI DEI CLIENTI' },
    ...(continuityEnabled ? [{ id: 'archive', label: 'Relazioni e archivio', icon: Users, path: '/pro/archive' }] : []),
    { id: 'passes', label: 'Pacchetti', icon: Package, path: '/pro/passes' },
    { id: 'subscriptions', label: 'Abbonamenti', icon: RefreshCw, path: '/pro/subscriptions' },
    { id: 'settings', label: 'Profilo guidato', icon: Compass, path: '/pro/settings', group: 'LA TUA PRESENZA' },
    { id: 'analytics', label: 'Statistiche', icon: BarChart3, path: '/pro/analytics' },
  ];
  useEffect(() => {
    if (!open) return;
    const keydown = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); menuRef.current?.focus(); } };
    window.addEventListener('keydown', keydown);
    return () => window.removeEventListener('keydown', keydown);
  }, [open]);
  const handleNav = (path: string) => { navigate(path); setOpen(false); };
  return <div className="pg-workspace">
    <div className="pg-mobile-bar"><span>{nav.find(item => item.id === active)?.label || 'Area professionista'}</span><button ref={menuRef} onClick={() => setOpen(!open)} aria-label={open ? 'Chiudi menu professionista' : 'Apri menu professionista'} aria-expanded={open} aria-controls="professional-navigation"><Menu size={21} /></button></div>
    {open && <button className="pg-menu-overlay" aria-label="Chiudi menu professionista" onClick={() => { setOpen(false); menuRef.current?.focus(); }} />}
    <aside id="professional-navigation" className={`pg-sidebar ${open ? 'is-open' : ''}`}>
      <div className="pg-sidebar-identity"><span className="pg-avatar">{profile?.full_name?.trim().slice(0, 1) || 'P'}</span><div><small>AREA PROFESSIONISTA</small><strong>{profile?.full_name || 'Il tuo spazio'}</strong></div><button className="pg-close-mobile" aria-label="Chiudi navigazione" onClick={() => { setOpen(false); menuRef.current?.focus(); }}><X size={20} /></button></div>
      <nav aria-label="Navigazione professionista">{nav.map(item => { const Icon = item.icon; return <div key={item.id}>{'group' in item && item.group && <p className="pg-nav-group">{item.group}</p>}<button className={active === item.id ? 'is-active' : ''} aria-current={active === item.id ? 'page' : undefined} onClick={() => handleNav(item.path)}><Icon size={18} /><span>{item.label}</span></button></div>; })}</nav>
      <button className="pg-sidebar-help" onClick={() => handleNav('/pro/settings')}><Compass size={20} /><span>Da dove cominciare?<small>Costruisci il tuo percorso</small></span><ArrowUpRight size={17} /></button>
    </aside>
    <main className="pg-workspace-main"><ProToolGuide />{children}</main>
  </div>;
}
