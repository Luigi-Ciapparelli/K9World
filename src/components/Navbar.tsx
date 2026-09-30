import { useEffect, useRef, useState } from 'react';
import { AlertCircle, BookOpen, GraduationCap, LogOut, Menu, Search, Trophy, User, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import { RouteLink } from './RouteLink';
import { ThemeToggle } from './ThemeToggle';
import '../public-entry.css';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { path, navigate } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const mobileButton = useRef<HTMLButtonElement>(null);
  const basePath = path.split('?')[0];
  const dashboard = profile?.role === 'admin' ? '/admin' : profile?.role === 'professional' ? '/pro' : '/owner';
  const close = () => setMobileOpen(false);

  useEffect(close, [path]);
  useEffect(() => {
    if (!mobileOpen) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!header.current?.contains(target)) close();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMobileOpen(false);
      mobileButton.current?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [mobileOpen]);

  const leave = async () => { await signOut(); close(); navigate('/'); };
  const links = [
    { to: '/search?type=trainer', label: 'Trova aiuto per il cane', icon: Search, active: basePath === '/search', kind: 'help' },
    { to: '/impara', label: 'Impara', icon: BookOpen, active: basePath.startsWith('/impara') || basePath === '/prima-del-cane', kind: 'learn' },
    { to: '/sport', label: 'Sport cinofili', icon: Trophy, active: basePath === '/sport', kind: 'sport' },
  ];

  return (
    <header ref={header} className={`pc-site-header${mobileOpen ? ' is-open' : ''}`}>
      <div className="pc-header-top pc-entry-container">
        <RouteLink to="/" className="pc-brand" aria-label="PortaleCinofilo, pagina iniziale" onClick={close}>
          <img src="/brand/portalecinofilo-mark.png" alt="" width="40" height="40" />
          <span>PortaleCinofilo<small>Conoscere. Capire. Vivere insieme.</small></span>
        </RouteLink>
        <div className="pc-header-utilities">
          <ThemeToggle />
          <RouteLink to="/become-a-pro" className="pc-pro-link" aria-current={basePath === '/become-a-pro' ? 'page' : undefined}>
            <GraduationCap size={17} aria-hidden="true" /> Per i professionisti
          </RouteLink>
          {user ? <>
            <RouteLink to={dashboard} className="pc-account-link"><User size={17} aria-hidden="true" /><span>{profile?.full_name || 'La tua area'}</span></RouteLink>
            <RouteLink to="/account/contacts" className="pc-login-link">Recapiti</RouteLink>
            <button type="button" onClick={leave} className="pc-icon-button" aria-label="Esci dall’account"><LogOut size={19} /></button>
          </> : <>
            <RouteLink to="/signin" className="pc-login-link">Accedi</RouteLink>
            <RouteLink to="/signup" className="pc-register-link">Registrati</RouteLink>
          </>}
        </div>
        <div className="pc-mobile-controls">
          <RouteLink to={user ? dashboard : '/signin'} className="pc-mobile-account" aria-label={user ? 'Apri la tua area' : 'Accedi'}>
            {user ? <User size={20} /> : 'Accedi'}
          </RouteLink>
          <button ref={mobileButton} type="button" className="pc-icon-button" onClick={() => setMobileOpen(!mobileOpen)} aria-label={mobileOpen ? 'Chiudi menu' : 'Apri menu'} aria-expanded={mobileOpen} aria-controls="pc-primary-navigation">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      <nav id="pc-primary-navigation" aria-label="Navigazione principale" className="pc-primary-nav pc-entry-container">
        {links.map(({ to, label, icon: Icon, active, kind }) => (
          <RouteLink key={to} to={to} onClick={close} className={`pc-nav-tile pc-nav-${kind}${active ? ' is-current' : ''}`} aria-current={active ? 'page' : undefined}>
            <Icon size={19} aria-hidden="true" /><span>{label}</span>
          </RouteLink>
        ))}
        <div className="pc-mobile-extras">
          <RouteLink to="/become-a-pro" onClick={close} className="pc-pro-link"><GraduationCap size={18} aria-hidden="true" /> Per i professionisti</RouteLink>
          {user ? <>
            <RouteLink to={dashboard} onClick={close} className="pc-account-link"><User size={18} aria-hidden="true" /> {profile?.full_name || 'La tua area'}</RouteLink>
            <RouteLink to="/account/contacts" onClick={close} className="pc-pro-link">Email e telefono</RouteLink>
            <button type="button" onClick={leave} className="pc-pro-link"><LogOut size={18} aria-hidden="true" /> Esci</button>
          </> : <RouteLink to="/signup" onClick={close} className="pc-register-link">Crea il tuo account</RouteLink>}
          <div className="pc-mobile-theme"><span>Aspetto</span><ThemeToggle /></div>
        </div>
      </nav>
      {user && profile && !profile.email_verified && <RouteLink to="/account/contacts" className="pc-verification-notice">
        <AlertCircle size={16} aria-hidden="true" /><span>Conferma la tua email per attivare le prenotazioni.</span>
      </RouteLink>}
    </header>
  );
}
