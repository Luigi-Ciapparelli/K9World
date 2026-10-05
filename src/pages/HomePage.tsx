import { useEffect } from 'react';
import { ArrowRight, BookOpen, Compass, HeartHandshake, MapPin } from 'lucide-react';
import { RouteLink } from '../components/RouteLink';
import { PortalEntrance } from '../components/home/PortalEntrance';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import '../portal-home.css';

const journey = [
  { title: 'Parti dalla scelta', text: 'La tua vita, le tue abitudini e i bisogni del cane: il test ti aiuta a orientarti.', action: 'Fai il test di scelta', to: '/prima-del-cane', icon: Compass },
  { title: 'Impara a capirlo', text: 'Scopri come comunica, come impara e di cosa ha bisogno per stare bene.', action: 'Esplora Impara', to: '/impara', icon: BookOpen },
  { title: 'Scegli con un addestratore', text: 'Prima di accogliere un cane, confrontati con un professionista per sceglierlo insieme.', action: 'Trova chi ti accompagna', to: '/search?type=trainer&source=home&topic=scelta-responsabile&intent=choose-dog', icon: HeartHandshake },
  { title: 'Crescete insieme', text: 'Trova un addestratore nella tua zona per costruire la vostra relazione, giorno dopo giorno.', action: 'Cerca nella tua zona', to: '/search?type=trainer', icon: MapPin },
];

function PublicHomePage() {
  return (
    <main className="pc-portal-home" id="main-content">
      <section className="pc-portal-hero pc-entry-container" aria-labelledby="home-title">
        <div className="pc-portal-copy">
          <p className="pc-portal-eyebrow"><span aria-hidden="true" /> Cultura cinofila, aperta a tutti</p>
          <h1 id="home-title">Apri la porta<br />al suo <em>mondo.</em></h1>
          <p className="pc-portal-description">Conosci i suoi bisogni, scopri come impara e trova il professionista adatto a voi per vivere felici e sereni la vostra relazione.</p>
          <div className="pc-portal-actions">
            <div>
              <p>Stai pensando a un cane?</p>
              <RouteLink to="/prima-del-cane" className="pc-portal-primary">Fai il test di scelta <ArrowRight size={17} aria-hidden="true" /></RouteLink>
            </div>
            <div>
              <p>Hai già un cane?</p>
              <RouteLink to="/search?type=trainer" className="pc-portal-secondary">Trova un addestratore <ArrowRight size={17} aria-hidden="true" /></RouteLink>
            </div>
          </div>
          <p className="pc-portal-free">Il test e le lezioni sono gratuiti, senza iscrizione.</p>
        </div>
        <PortalEntrance />
      </section>
      <section className="pc-journey pc-entry-container" aria-labelledby="journey-title">
        <div className="pc-journey-heading">
          <div>
            <p className="pc-portal-eyebrow">Una relazione si costruisce</p>
            <h2 id="journey-title">Dalla scelta alla vita insieme.</h2>
          </div>
          <p>Un percorso consigliato, al tuo ritmo.<br /><strong>Puoi partire dalla tappa che ti serve.</strong></p>
        </div>
        <ol className="pc-journey-steps">
          {journey.map(({ title, text, action, to, icon: Icon }, index) => (
            <li key={to}>
              <RouteLink to={to} className="pc-journey-step">
                <div className="pc-journey-marker" aria-hidden="true"><span>0{index + 1}</span><Icon size={22} strokeWidth={1.5} /></div>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="pc-journey-action">{action}<ArrowRight size={16} aria-hidden="true" /></span>
              </RouteLink>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

export function HomePage() {
  const { user, profile, loading } = useAuth();
  const { navigate } = useRouter();
  useEffect(() => {
    if (loading || !user || !profile?.role) return;
    navigate(profile.role === 'professional' ? '/pro' : profile.role === 'admin' ? '/admin' : '/owner');
  }, [loading, user, profile?.role, navigate]);

  if (loading || user) return <div className="min-h-[calc(100vh-4rem)] bg-[var(--pc-bone-50)] flex items-center justify-center px-6"><div className="text-center max-w-md" role="status"><div className="mx-auto w-10 h-10 rounded-full border-2 border-[var(--pc-line)] border-t-[var(--pc-forest-900)] animate-spin" /><p className="mt-4 font-semibold text-[var(--pc-ink-950)]">Apro la tua area…</p></div></div>;
  return <PublicHomePage />;
}
