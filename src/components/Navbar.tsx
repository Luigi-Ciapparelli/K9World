import { useEffect, useRef, useState } from 'react';
import { AlertCircle, BookOpen, ChevronDown, GraduationCap, Home, LogOut, Menu, Scissors, Search, Trophy, User, X, Footprints } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import { RouteLink } from './RouteLink';
import { ThemeToggle } from './ThemeToggle';
import '../public-entry.css';

const services = [
  { type: 'boarding', title: 'Pensioni', description: 'Un posto dove soggiornare', icon: Home },
  { type: 'sitter', title: 'Pet sitting', description: 'Compagnia e cura a domicilio', icon: User },
  { type: 'walker', title: 'Passeggiate', description: 'Un aiuto nelle uscite quotidiane', icon: Footprints },
  { type: 'groomer', title: 'Toelettatura', description: 'Igiene e cura del mantello', icon: Scissors },
];

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const { path, navigate } = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const serviceMenu = useRef<HTMLDivElement>(null);
  const serviceButton = useRef<HTMLButtonElement>(null);
  const mobileButton = useRef<HTMLButtonElement>(null);
  const basePath = path.split('?')[0];
  const serviceType = new URLSearchParams(path.split('?')[1]).get('type') || 'trainer';
  const onServices = basePath === '/search' && serviceType !== 'trainer';
  const dashboard = profile?.role === 'admin' ? '/admin' : profile?.role === 'professional' ? '/pro' : '/owner';
  const close = () => { setMobileOpen(false); setServicesOpen(false); };

  useEffect(close, [path]);
  useEffect(() => {
    if (!mobileOpen && !servicesOpen) return;
    const outside = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!header.current?.contains(target)) close();
      else if (!serviceMenu.current?.contains(target)) setServicesOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (servicesOpen) { setServicesOpen(false); serviceButton.current?.focus(); }
      else { setMobileOpen(false); mobileButton.current?.focus(); }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [mobileOpen, servicesOpen]);

  const leave = async () => { await signOut(); close(); navigate('/'); };
  const links = [
    { to: '/search?type=trainer', label: 'Trova aiuto per il cane', icon: Search, active: basePath === '/search' && !onServices, kind: 'help' },
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
          <button ref={mobileButton} type="button" className="pc-icon-button" onClick={() => { setMobileOpen(!mobileOpen); setServicesOpen(false); }} aria-label={mobileOpen ? 'Chiudi menu' : 'Apri menu'} aria-expanded={mobileOpen} aria-controls="pc-primary-navigation">
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
        <div className="pc-services-nav" ref={serviceMenu}>
          <button ref={serviceButton} type="button" className={`pc-nav-tile${onServices ? ' is-current' : ''}`} aria-expanded={servicesOpen} aria-controls="pc-service-links" onClick={() => setServicesOpen(!servicesOpen)}>
            <Home size={19} aria-hidden="true" /><span>Servizi per il cane</span><ChevronDown size={16} className={servicesOpen ? 'pc-chevron-open' : ''} aria-hidden="true" />
          </button>
          {servicesOpen && <div id="pc-service-links" className="pc-service-dropdown">
            {services.map(({ type, title, description, icon: Icon }) => <RouteLink key={type} to={`/search?type=${type}`} onClick={close} className="pc-service-link">
              <Icon size={20} aria-hidden="true" /><span><strong>{title}</strong><small>{description}</small></span>
            </RouteLink>)}
          </div>}
        </div>
        <div className="pc-mobile-extras">
          <RouteLink to="/become-a-pro" onClick={close} className="pc-pro-link"><GraduationCap size={18} aria-hidden="true" /> Per i professionisti</RouteLink>
          {user ? <>
            <RouteLink to={dashboard} onClick={close} className="pc-account-link"><User size={18} aria-hidden="true" /> {profile?.full_name || 'La tua area'}</RouteLink>
            <button type="button" onClick={leave} className="pc-pro-link"><LogOut size={18} aria-hidden="true" /> Esci</button>
          </> : <RouteLink to="/signup" onClick={close} className="pc-register-link">Crea il tuo account</RouteLink>}
          <div className="pc-mobile-theme"><span>Aspetto</span><ThemeToggle /></div>
        </div>
      </nav>
      {user && profile && !profile.email_verified && <RouteLink to={dashboard} className="pc-verification-notice">
        <AlertCircle size={16} aria-hidden="true" /><span>Conferma la tua email per attivare le prenotazioni.</span>
      </RouteLink>}
    </header>
  );
}
