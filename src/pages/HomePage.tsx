import { useEffect, useState } from 'react';
import { Star, Shield, Heart, Search, CreditCard, Smile, ChevronDown, Compass, PawPrint, ArrowRight } from 'lucide-react';
import { SearchCard } from '../components/SearchCard';
import { useRouter } from '../lib/RouterContext';
import { LocalExcellenceShowcase } from '../components/home/LocalExcellenceShowcase';

const faqs = [
  {
    q: `Che cos'è PawConnect?`,
    a: `PawConnect è una rete locale che rende trovabile online il passaparola cinofilo: proprietari di cani e professionisti selezionati, approvati manualmente prima di apparire nella ricerca.`,
  },
  {
    q: `Come vengono verificati i professionisti?`,
    a: `Ogni professionista completa il profilo con servizi, zona, esperienza e recapiti. Gli admin possono controllare qualifiche, documenti e informazioni prima dell'approvazione.`,
  },
  {
    q: `È sicuro?`,
    a: `PawConnect usa professionisti approvati manualmente, richieste tracciate, recensioni e informazioni chiare sui servizi per aiutare i proprietari a scegliere meglio.`,
  },
  {
    q: `Come funzionano i pagamenti?`,
    a: `In questa fase beta le richieste vengono gestite tramite la piattaforma. I pagamenti online saranno integrati in una fase successiva.`,
  },
];

export function HomePage() {
  useEffect(() => {
    const queryParams = window.location.hash.includes('?')
      ? new URLSearchParams(window.location.hash.split('?')[1])
      : new URLSearchParams();

    if (queryParams.get('section') === 'services') {
      setTimeout(() => {
        document.getElementById('services')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 50);
    }
  }, []);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const { navigate } = useRouter();

  return (
    <div className="bg-white">
      <section className="relative">
        <div className="absolute inset-0">
          <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1920" className="w-full h-full object-cover" alt="" />
          <div className="absolute inset-0 bg-gradient-to-r from-stone-900/60 via-stone-900/40 to-stone-900/60" />
        </div>
        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-28">
          <div className="text-center text-white mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-3 tracking-tight">Vivere bene con un cane inizia prima della scelta</h1>
            <p className="text-lg md:text-xl text-white/90 max-w-4xl mx-auto">PawConnect ti accompagna dalla scelta consapevole del cane alla sua gestione quotidiana, fino ai professionisti giusti quando servono.</p>
          </div>
          <div className="max-w-4xl mx-auto">
            <SearchCard />
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 text-white/90 text-sm">
            <div className="flex -space-x-0.5">
              {[1,2,3,4,5].map((i) => <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
            </div>
            <span className="font-semibold">Beta PawConnect</span>
            <span className="text-white/70">rete selezionata di professionisti</span>
          </div>
        </div>
      </section>

      <section className="border-b border-stone-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-14">
          <div className="max-w-3xl mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700 mb-3">Da dove vuoi partire?</p>
            <h2 className="text-3xl md:text-4xl font-bold text-stone-900 tracking-tight">
              PawConnect non inizia dalla prenotazione. Inizia dal cane.
            </h2>
            <p className="text-stone-600 mt-3 leading-relaxed">
              Se hai già un cane puoi cercare servizi e professionisti. Se stai ancora pensando di prenderne uno, partiamo prima da te: tempo, esperienza, famiglia, obiettivi e gestione reale.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-5">
            <button
              type="button"
              onClick={() => navigate('/prima-del-cane')}
              className="group text-left rounded-3xl border border-emerald-200 bg-emerald-50/60 p-7 hover:bg-emerald-50 hover:border-emerald-300 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-5">
                <Compass className="w-6 h-6 text-emerald-700" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">Sto pensando di prendere un cane</h3>
              <p className="text-stone-600 mt-2 leading-relaxed">
                Costruisci il tuo profilo di compatibilità prima di parlare di razze. Nessuna “razza perfetta”: solo criteri più seri per scegliere consapevolmente.
              </p>
              <span className="inline-flex items-center gap-2 mt-5 text-sm font-bold text-emerald-800">
                Inizia il percorso <ArrowRight className="w-4 h-4 transition group-hover:translate-x-1" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/services')}
              className="group text-left rounded-3xl border border-stone-200 bg-stone-50 p-7 hover:bg-stone-100 transition"
            >
              <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center mb-5">
                <PawPrint className="w-6 h-6 text-stone-700" />
              </div>
              <h3 className="text-xl font-bold text-stone-900">Ho già un cane</h3>
              <p className="text-stone-600 mt-2 leading-relaxed">
                Cerca professionisti, gestisci il profilo del tuo cane e usa PawConnect come punto di riferimento per la sua vita quotidiana.
              </p>
              <span className="inline-flex items-center gap-2 mt-5 text-sm font-bold text-stone-800">
                Vai ai servizi <ArrowRight className="w-4 h-4 transition group-hover:translate-x-1" />
              </span>
            </button>
          </div>
        </div>
      </section>

      <LocalExcellenceShowcase />

      <section className="bg-amber-50 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 text-center mb-14">Professionisti locali che trattano il tuo cane con cura</h2>
          <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {[
              { icon: Search, title: '1. Cerca', text: 'Consulta i profili verificati e scegli il professionista più adatto al tuo cane.' },
              { icon: CreditCard, title: '2. Richiedi una prenotazione', text: 'Invia una richiesta chiara con date, servizio e informazioni sul cane.' },
              { icon: Smile, title: '3. Conferma e rilassati', text: 'Il professionista può accettare o rifiutare la richiesta dal proprio pannello.' },
            ].map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.title} className="text-center">
                  <div className="w-24 h-24 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-5">
                    <Icon className="w-10 h-10 text-emerald-700" />
                  </div>
                  <h3 className="font-bold text-stone-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-stone-700 leading-relaxed">{s.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-16 items-start">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-stone-900 mb-3">Domande frequenti</h2>
          <p className="text-stone-600 mb-8">Domande frequenti su PawConnect</p>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="border border-stone-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex justify-between items-center p-4 text-left hover:bg-stone-50"
                >
                  <span className="font-semibold text-stone-900">{f.q}</span>
                  <ChevronDown className={`w-5 h-5 text-stone-500 transition ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && <div className="p-4 pt-0 text-stone-600 text-sm leading-relaxed">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-stone-50 rounded-3xl p-10 flex flex-col items-center text-center border border-stone-100">
          <Heart className="w-14 h-14 text-rose-500 mb-4" />
          <h3 className="text-2xl font-bold text-stone-900 mb-2">Diventa professionista su PawConnect</h3>
          <p className="text-stone-600 mb-6">Entra in una rete selezionata di professionisti cinofili. Gestisci profilo, servizi, richieste, clienti e prenotazioni da un unico pannello.</p>
          <button onClick={() => navigate('/become-pro')} className="px-6 py-3 bg-stone-900 text-white rounded-full font-semibold hover:bg-stone-800 transition">
            Inizia ora
          </button>
          <div className="flex items-center gap-2 mt-6 text-sm text-stone-500">
            <Shield className="w-4 h-4" /> Beta locale con professionisti approvati manualmente
          </div>
        </div>
      </section>
    </div>
  );
}
