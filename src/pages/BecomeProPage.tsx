import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Dog,
  Euro,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Users,
} from 'lucide-react';
import { useRouter } from '../lib/RouterContext';

const services = [
  'Educazione e addestramento',
  'Pensione cani',
  'Cane walking',
  'Pet sitting',
  'Visite a domicilio',
  'Toelettatura',
];

const steps = [
  {
    title: 'Crea il profilo',
    text: 'Inserisci nome, zona, servizi, prezzi, esperienza, qualifiche e documenti disponibili.',
  },
  {
    title: 'Verifica admin',
    text: 'Controlliamo il profilo prima di renderlo visibile ai clienti.',
  },
  {
    title: 'Ricevi richieste',
    text: 'I clienti possono trovarti per zona e servizio, poi inviarti richieste di prenotazione.',
  },
  {
    title: 'Accetta o rifiuta',
    text: 'Gestisci le richieste dal tuo pannello professionista.',
  },
];

const requirements = [
  'Email e telefono verificabili',
  'Descrizione chiara dei servizi offerti',
  'Zona servita e prezzi indicativi',
  'Esperienza, qualifiche o formazione dichiarate',
  'Documenti/autorizzazioni se richiesti per la tua attività',
  'Disponibilità a rispondere in modo rapido ai clienti',
];

const faqs = [
  {
    q: 'Devo pagare per entrare?',
    a: 'Nella fase iniziale locale, l’inserimento dei primi professionisti può essere gratuito o promozionale. L’obiettivo è validare il servizio e portare richieste reali.',
  },
  {
    q: 'Appaio subito nella ricerca?',
    a: 'No. Dopo la registrazione il profilo resta in pending. Un admin lo approva prima di renderlo visibile ai clienti.',
  },
  {
    q: 'Posso offrire più servizi?',
    a: 'Sì. Puoi avere più servizi attivi, per esempio addestramento, dog walking e pensione. La ricerca mostra il tuo profilo nelle categorie corrispondenti.',
  },
  {
    q: 'Serve partita IVA?',
    a: 'Dipende dal servizio e dalla tua situazione. K9World può raccogliere le informazioni, ma non sostituisce consulenza fiscale o legale.',
  },
];

export function BecomeProPage() {
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen bg-stone-50">
      <section className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-stone-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm font-semibold mb-6">
              <MapPin className="w-4 h-4" />
              Lancio locale: Rimini, Riccione, Cattolica e dintorni
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Porta i tuoi servizi cinofili online, senza complicarti la vita.
            </h1>

            <p className="text-emerald-50 text-lg mt-6 max-w-xl">
              K9World aiuta educatori, addestratori, pensioni, dog sitter e dog walker
              a ricevere richieste da proprietari di cani nella propria zona.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                type="button"
                onClick={() => navigate('/signup?role=professional')}
                className="px-6 py-3 rounded-full bg-white text-emerald-900 font-bold hover:bg-emerald-50 flex items-center justify-center gap-2"
              >
                Candidati come professionista
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/search?type=trainer&address=Rimini')}
                className="px-6 py-3 rounded-full border border-white/30 text-white font-bold hover:bg-white/10"
              >
                Guarda la ricerca
              </button>
            </div>

            <p className="text-sm text-emerald-100 mt-4">
              Dopo il signup scegli il profilo professionista e completa la pagina impostazioni.
            </p>
          </div>

          <div className="bg-white text-stone-900 rounded-3xl p-6 shadow-2xl">
            <div className="grid sm:grid-cols-2 gap-4">
              <Metric icon={<Users />} title="Più visibilità locale" text="Fatti trovare per zona e servizio." />
              <Metric icon={<CalendarCheck />} title="Richieste ordinate" text="Gestisci booking e stato richiesta." />
              <Metric icon={<ShieldCheck />} title="Profilo verificato" text="Badge e approvazione admin." />
              <Metric icon={<MessageCircle />} title="Meno caos" text="Niente messaggi sparsi ovunque." />
            </div>

            <div className="mt-6 border border-stone-200 rounded-2xl p-5 bg-stone-50">
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-amber-500 mt-0.5" />
                <div>
                  <div className="font-bold text-stone-900">Primi professionisti</div>
                  <p className="text-sm text-stone-600 mt-1">
                    I primi profili locali possono essere inseriti e seguiti manualmente
                    per costruire una rete di qualità nella zona di Rimini.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <h2 className="text-3xl font-bold text-stone-900">Per chi è K9World?</h2>
            <p className="text-stone-600 mt-3">
              Per professionisti e strutture che vogliono ricevere richieste più chiare,
              apparire in una ricerca locale e costruire fiducia con i clienti.
            </p>
          </div>

          <div className="lg:col-span-2 grid sm:grid-cols-2 gap-3">
            {services.map((service) => (
              <div key={service} className="bg-white border border-stone-200 rounded-2xl p-5 flex items-center gap-3">
                <Dog className="w-5 h-5 text-emerald-700" />
                <span className="font-semibold text-stone-900">{service}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border-y border-stone-200">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold text-stone-900 mb-8">Come funziona</h2>

          <div className="grid md:grid-cols-4 gap-4">
            {steps.map((step, index) => (
              <div key={step.title} className="border border-stone-200 rounded-2xl p-5">
                <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold mb-4">
                  {index + 1}
                </div>
                <h3 className="font-bold text-stone-900">{step.title}</h3>
                <p className="text-sm text-stone-600 mt-2">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-8">
        <div className="bg-white border border-stone-200 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <BadgeCheck className="w-6 h-6 text-emerald-700" />
            <h2 className="text-2xl font-bold text-stone-900">Cosa serve per essere approvati</h2>
          </div>

          <div className="space-y-3">
            {requirements.map((item) => (
              <div key={item} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <span className="text-stone-700">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-5">
            <Euro className="w-6 h-6 text-emerald-700" />
            <h2 className="text-2xl font-bold text-stone-900">Modello iniziale</h2>
          </div>

          <p className="text-stone-700">
            Durante la fase iniziale, l’obiettivo non è vendere abbonamenti complicati,
            ma creare domanda reale e professionisti affidabili.
          </p>

          <div className="mt-5 space-y-3">
            <PriceLine title="Ingresso iniziale" text="Possibile inserimento gratuito per i primi profili locali." />
            <PriceLine title="Richieste clienti" text="Ricevi richieste ordinate dal sito." />
            <PriceLine title="Futuro" text="Commissione o piano premium solo quando il servizio porta valore reale." />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-16">
        <h2 className="text-3xl font-bold text-stone-900 mb-6">Domande frequenti</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="bg-white border border-stone-200 rounded-2xl p-5">
              <h3 className="font-bold text-stone-900">{faq.q}</h3>
              <p className="text-sm text-stone-600 mt-2">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="bg-stone-900 text-white rounded-3xl p-8 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h2 className="text-3xl font-bold">Vuoi essere tra i primi professionisti?</h2>
            <p className="text-stone-300 mt-2">
              Crea il profilo, completa i dati e attendi l’approvazione admin.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/signup?role=professional')}
            className="px-6 py-3 rounded-full bg-emerald-600 text-white font-bold hover:bg-emerald-700 flex items-center justify-center gap-2 shrink-0"
          >
            Candidati ora
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}

function Metric({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="border border-stone-200 rounded-2xl p-4">
      <div className="text-emerald-700 [&>svg]:w-5 [&>svg]:h-5">{icon}</div>
      <div className="font-bold text-stone-900 mt-3">{title}</div>
      <p className="text-sm text-stone-600 mt-1">{text}</p>
    </div>
  );
}

function PriceLine({ title, text }: { title: string; text: string }) {
  return (
    <div className="bg-white border border-emerald-100 rounded-2xl p-4">
      <div className="font-bold text-stone-900">{title}</div>
      <p className="text-sm text-stone-600 mt-1">{text}</p>
    </div>
  );
}
