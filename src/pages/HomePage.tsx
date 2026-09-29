import { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { RouteLink } from '../components/RouteLink';
import { HomeVisual } from '../components/home/HomeVisual';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';

function PublicHomePage() {
  return (
    <main className="pc-home" id="main-content">
      <section className="pc-home-editorial pc-entry-container" aria-labelledby="home-title">
        <div className="pc-home-story">
          <p className="pc-home-eyebrow"><span aria-hidden="true" /> PortaleCinofilo · Italia</p>
          <h1 id="home-title">Conosci<br /> meglio <em>il cane.</em></h1>
          <p className="pc-home-purpose">Costruisci un binomio più consapevole.</p>
          <p className="pc-home-intro">Dalla scelta alla vita quotidiana, PortaleCinofilo ti aiuta a capire bisogni e comportamento, trovare professionisti competenti e costruire con loro un percorso che continui nel tempo.</p>
          <p className="pc-home-access">Cultura cinofila di base gratuita, aperta a tutti.</p>
        </div>
        <HomeVisual />
      </section>

      <section className="pc-home-principles pc-entry-container" aria-label="Il percorso di conoscenza">
        <div><span aria-hidden="true">01</span><h2>Comprendere.</h2><p>Conoscere i bisogni e il modo in cui il cane apprende.</p></div>
        <div><span aria-hidden="true">02</span><h2>Osservare.</h2><p>Leggere il comportamento nella vostra vita quotidiana.</p></div>
        <div><span aria-hidden="true">03</span><h2>Costruire insieme.</h2><p>Trasformare la conoscenza in un percorso, con il supporto professionale quando serve.</p></div>
      </section>

      <section className="pc-home-before-strip pc-entry-container" aria-labelledby="home-before-title">
        <div><h2 id="home-before-title">Stai pensando di prendere un cane?</h2><p>Parti dal tempo, dalle abitudini e dalla vita che puoi condividere.</p></div>
        <RouteLink to="/prima-del-cane" className="pc-home-before-link">Prima del cane <ArrowRight size={18} aria-hidden="true" /></RouteLink>
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
