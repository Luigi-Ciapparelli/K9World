import { PawPrint, Mail, ShieldCheck } from 'lucide-react';
import { useRouter } from '../lib/RouterContext';

export function Footer() {
  const { navigate } = useRouter();

  return (
    <footer className="bg-stone-950 text-stone-300 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-[1.3fr_1fr_1fr] gap-8">
          <div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-2 text-white"
            >
              <PawPrint className="w-7 h-7 text-emerald-500" />
              <span className="text-xl font-bold">PawConnect</span>
            </button>

            <p className="text-sm text-stone-400 mt-4 max-w-md">
              Il passaparola cinofilo, finalmente online. Una rete locale di professionisti
              approvati manualmente prima di apparire nella ricerca.
            </p>

            <div className="inline-flex items-center gap-2 mt-5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-100">
              <ShieldCheck className="w-4 h-4" />
              Beta locale Rimini e dintorni
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3">Piattaforma</h3>
            <div className="space-y-2 text-sm">
              <button type="button" onClick={() => navigate('/search')} className="block hover:text-white">
                Trova un professionista
              </button>
              <button type="button" onClick={() => navigate('/become-a-pro')} className="block hover:text-white">
                Diventa professionista
              </button>
              <button type="button" onClick={() => navigate('/?section=services')} className="block hover:text-white">
                Eccellenze locali
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3">Informazioni</h3>
            <div className="space-y-2 text-sm">
              <button type="button" onClick={() => navigate('/privacy')} className="block hover:text-white">
                Privacy Policy
              </button>
              <button type="button" onClick={() => navigate('/terms')} className="block hover:text-white">
                Termini di utilizzo
              </button>
              <button type="button" onClick={() => navigate('/contact')} className="block hover:text-white">
                Contatti
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-stone-400 mt-5">
              <Mail className="w-4 h-4" />
              <span>DearerMetal525@proton.me</span>
            </div>
          </div>
        </div>

        <div className="border-t border-stone-800 mt-8 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-stone-500">
          <p>© 2026 PawConnect / PortaleCinofilo.it. Tutti i diritti riservati.</p>
          <p>Progetto in fase beta. Le informazioni legali sono bozze operative da finalizzare.</p>
        </div>
      </div>
    </footer>
  );
}
