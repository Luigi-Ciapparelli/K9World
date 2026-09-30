import { Mail, ShieldCheck } from 'lucide-react';
import { useRouter } from '../lib/RouterContext';

const CONTACT_EMAIL = 'info@portalecinofilo.com';

export function Footer() {
  const { navigate } = useRouter();

  return (
    <footer className="bg-[#18211C] text-[#D7DED8] border-t border-[#2E3932]">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="grid md:grid-cols-[1.35fr_0.8fr_1.15fr] gap-8">
          <div>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex items-center gap-3 text-white"
            >
              <img
                src="/brand/portalecinofilo-mark.png"
                alt=""
                aria-hidden="true"
                className="w-9 h-9 object-contain brightness-0 invert"
              />
              <span className="text-xl font-semibold tracking-tight">PortaleCinofilo</span>
            </button>

            <p className="text-sm text-[#AAB4AD] mt-4 max-w-md">
              Conoscenza cinofila, professionisti verificabili e continuità tra persona, cane e professionista.
            </p>

            <div className="inline-flex items-center gap-2 mt-5 rounded-full border border-[#235B40] bg-[#163D2A]/70 px-4 py-2 text-sm text-[#E4EEE7]">
              <ShieldCheck className="w-4 h-4" />
              Cultura cinofila accessibile
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
              <button type="button" onClick={() => navigate('/ranking')} className="block hover:text-white">
                Come funziona il ranking
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-white font-bold mb-3">Informazioni e regole</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-y-2 gap-x-4 text-sm">
              <button type="button" onClick={() => navigate('/privacy')} className="text-left hover:text-white">
                Privacy
              </button>
              <button type="button" onClick={() => navigate('/cookies')} className="text-left hover:text-white">
                Cookie
              </button>
              <button type="button" onClick={() => navigate('/terms')} className="text-left hover:text-white">
                Termini utenti
              </button>
              <button type="button" onClick={() => navigate('/professional-terms')} className="text-left hover:text-white">
                Termini professionisti
              </button>
              <button type="button" onClick={() => navigate('/contact')} className="text-left hover:text-white">
                Contatti
              </button>
              <a
                href={`mailto:${CONTACT_EMAIL}?subject=Segnalazione%20PortaleCinofilo`}
                className="hover:text-white"
              >
                Segnala un problema
              </a>
            </div>

            <div className="flex items-center gap-2 text-sm text-[#AAB4AD] mt-5">
              <Mail className="w-4 h-4 shrink-0" />
              <a className="hover:text-white break-all" href={`mailto:${CONTACT_EMAIL}`}>
                {CONTACT_EMAIL}
              </a>
            </div>
            {/* portal-public-phone-3534077841 */}
            <a
              href="tel:+393534077841"
              className="mt-3 inline-flex items-center gap-2 rounded text-sm text-[#AAB4AD] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D5A33A]"
            >
              Telefono: +39 353 407 7841
            </a>
          </div>
        </div>

        <div className="border-t border-[#2E3932] mt-8 pt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-[#859189]">
          <p>© 2026 PortaleCinofilo · Luigi Ciapparelli. Tutti i diritti riservati.</p>
          <p>Formazione di base gratuita · pagamenti delle prestazioni concordati direttamente.</p>
        </div>
      </div>
    </footer>
  );
}
