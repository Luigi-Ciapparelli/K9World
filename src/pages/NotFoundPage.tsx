import { RouteLink } from '../components/RouteLink';
export function NotFoundPage() {
  return <main className="max-w-3xl mx-auto px-6 py-20"><p className="text-sm font-semibold">404</p><h1 className="text-3xl font-bold mt-3">Pagina non trovata</h1><p className="mt-4">Questo indirizzo non corrisponde a una pagina di PortaleCinofilo.</p><div className="flex flex-wrap gap-5 mt-8"><RouteLink to="/" className="font-semibold underline">Torna alla Home</RouteLink><RouteLink to="/impara" className="font-semibold underline">Apri Impara</RouteLink><RouteLink to="/search" className="font-semibold underline">Trova aiuto per il cane</RouteLink></div></main>;
}
