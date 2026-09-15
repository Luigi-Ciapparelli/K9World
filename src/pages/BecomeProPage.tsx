import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CalendarCheck,
  CheckCircle2,
  Dog,
  MapPin,
  Medal,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { useRouter } from '../lib/RouterContext';

const valuePoints = [
  {
    icon: <BadgeCheck />,
    title: 'Profilo che racconta il lavoro vero',
    text: 'Servizi, esperienza, qualifiche, risultati, zona e prezzi indicativi in un profilo leggibile e confrontabile.',
  },
  {
    icon: <Medal />,
    title: 'Merito distinguibile',
    text: 'Dichiarato, verificato e risultato sportivo non vengono confusi. Le fonti e gli stati di verifica restano espliciti.',
  },
  {
    icon: <MessageCircle />,
    title: 'Richieste più chiare',
    text: 'Il proprietario arriva dal profilo e invia una richiesta contestualizzata invece di disperdere tutto tra messaggi e social.',
  },
  {
    icon: <CalendarCheck />,
    title: 'Continuità nel tempo',
    text: 'PortaleCinofilo è pensato per evolvere verso storico, CRM e continuità tra cane, proprietario e professionista.',
  },
];

const steps = [
  {
    title: 'Entra nella beta',
    text: 'Crei l’account professionista e compili il profilo con i dati che servono davvero.',
  },
  {
    title: 'Costruisci credibilità',
    text: 'Aggiungi esperienza, servizi, qualifiche, risultati e fonti. Le verifiche restano distinte dalle semplici dichiarazioni.',
  },
  {
    title: 'Diventa trovabile',
    text: 'Il profilo entra nella ricerca quando è approvato e coerente con i requisiti della piattaforma.',
  },
  {
    title: 'Ricevi richieste',
    text: 'Gestisci le richieste dal pannello professionista senza comprare una posizione migliore nel ranking.',
  },
];

const requirements = [
  'Identità e contatti professionali verificabili',
  'Descrizione chiara dei servizi realmente offerti',
  'Zona servita e prezzi indicativi',
  'Esperienza, qualifiche o formazione dichiarate in modo trasparente',
  'Documentazione o fonti quando necessarie per una verifica',
  'Disponibilità a rispondere ai proprietari con serietà',
];

const faqs = [
  {
    q: 'Quanto costa entrare nella beta?',
    a: 'Per il primo gruppo di professionisti la beta è gratuita. L’obiettivo adesso è validare il servizio, costruire una rete credibile e generare relazioni reali.',
  },
  {
    q: 'Pagando posso comparire più in alto?',
    a: 'No. PortaleCinofilo non vende il ranking meritocratico. Un futuro piano Pro potrà offrire strumenti aggiuntivi, non acquistare competenza o verifiche.',
  },
  {
    q: 'Appaio subito nella ricerca?',
    a: 'No. Il profilo deve essere completato e approvato prima di essere mostrato pubblicamente.',
  },
  {
    q: 'Devo avere risultati sportivi?',
    a: 'No. I risultati sportivi contano quando pertinenti, ma PortaleCinofilo distingue servizi, esperienza, formazione, qualifiche e carriera senza ridurre tutto alla competizione.',
  },
  {
    q: 'Serve partita IVA?',
    a: 'Dipende dalla tua attività e situazione fiscale. PortaleCinofilo non sostituisce una consulenza fiscale o legale.',
  },
  {
    q: 'PortaleCinofilo incassa il pagamento del cliente?',
    a: 'Non nella beta. La piattaforma facilita ricerca e richiesta; il pagamento della prestazione resta fuori dal portale in questa fase.',
  },
];

export function BecomeProPage() {
  const { navigate } = useRouter();

  return (
    <main className="min-h-screen bg-[#F5F1E7] text-[#18211C]">
      <section className="border-b border-[#D8D5CC] bg-[#FFFEFA]">
        <div className="max-w-7xl mx-auto px-6 py-16 lg:py-20 grid lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <div>
            <div className="pc-kicker mb-5">PortaleCinofilo · Beta professionisti</div>

            <h1 className="pc-display text-4xl md:text-6xl leading-[1.02] max-w-4xl">
              Fatti trovare per quello che sai realmente fare,
              <span className="block text-[#235B40]">non per quanto paghi.</span>
            </h1>

            <p className="text-lg md:text-xl text-[#536058] mt-6 max-w-2xl leading-relaxed">
              Stiamo selezionando il primo gruppo di professionisti della Romagna.
              La beta è gratuita: profilo strutturato, competenze distinguibili, richieste
              ordinate e ranking non acquistabile.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <button
                type="button"
                onClick={() => navigate('/signup?role=professional')}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#163D2A] px-6 py-3.5 font-semibold text-white hover:bg-[#235B40] transition"
              >
                Entra nella beta
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/ranking')}
                className="inline-flex items-center justify-center rounded-full border border-[#AEB8B0] bg-[#FFFEFA] px-6 py-3.5 font-semibold text-[#18211C] hover:border-[#163D2A] transition"
              >
                Come funziona il ranking
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#657168]">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#235B40]" />
                Beta gratuita
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#235B40]" />
                Nessun pay-to-rank
              </span>
              <span className="inline-flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#235B40]" />
                Partenza dalla Romagna
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-[#E4EEE7]" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[2rem] border border-[#C9D5CC] bg-[#FFFEFA] p-6 md:p-8 shadow-sm">
              <img
                src="/brand/portalecinofilo-lockup.png"
                alt="PortaleCinofilo, binomio persona-cane al lavoro"
                className="w-full max-h-[430px] object-contain"
              />

              <div className="mt-6 border-t border-[#E3DFD6] pt-5 grid sm:grid-cols-2 gap-4">
                <MicroProof
                  icon={<Users />}
                  title="Primo gruppo locale"
                  text="Non stiamo importando migliaia di profili vuoti."
                />
                <MicroProof
                  icon={<Briefcase />}
                  title="Profilo professionale"
                  text="Esperienza, servizi e merito restano leggibili."
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="max-w-3xl mb-9">
          <div className="pc-kicker">Perché esserci adesso</div>
          <h2 className="pc-display text-3xl md:text-5xl mt-3">
            Non un'altra vetrina. Un posto in cui il lavoro professionale resta riconoscibile.
          </h2>
          <p className="text-[#5D6961] mt-5 text-lg">
            PortaleCinofilo nasce per distinguere ciò che è dichiarato da ciò che è verificato,
            rendere comparabili informazioni utili e aiutare proprietari e professionisti a
            costruire una relazione che continui oltre il primo contatto.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {valuePoints.map((item) => (
            <article key={item.title} className="pc-card p-6">
              <div className="w-11 h-11 rounded-2xl bg-[#E4EEE7] text-[#163D2A] flex items-center justify-center [&>svg]:w-5 [&>svg]:h-5">
                {item.icon}
              </div>
              <h3 className="font-bold text-xl mt-5">{item.title}</h3>
              <p className="text-[#5D6961] mt-2 leading-relaxed">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-[#18211C] text-white">
        <div className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-[0.9fr_1.1fr] gap-12 items-start">
          <div>
            <div className="pc-kicker text-[#D5A33A]">Una scelta precisa</div>
            <h2 className="pc-display text-3xl md:text-5xl mt-3">
              La posizione in classifica non è in vendita.
            </h2>
            <p className="text-[#C5CEC8] text-lg mt-5 leading-relaxed">
              Un eventuale abbonamento futuro potrà offrire CRM, calendario, continuità,
              analytics e strumenti professionali. Non potrà comprare una qualifica,
              una verifica o una posizione meritocratica migliore.
            </p>

            <button
              type="button"
              onClick={() => navigate('/ranking')}
              className="mt-7 inline-flex items-center gap-2 text-[#E4EEE7] font-semibold underline underline-offset-4 hover:text-white"
            >
              Leggi i criteri di ranking
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <DarkCard
              title="Profilo approvato"
              text="Significa che il profilo può essere pubblicato."
            />
            <DarkCard
              title="Professionista verificato"
              text="Indica il completamento del processo previsto per il profilo."
            />
            <DarkCard
              title="Qualifica verificata"
              text="Riguarda quella specifica qualifica, non tutto il curriculum."
            />
            <DarkCard
              title="Risultato verificato"
              text="Riguarda quello specifico risultato e la relativa fonte."
            />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-10">
          <div>
            <div className="pc-kicker">Come funziona</div>
            <h2 className="pc-display text-3xl md:text-4xl mt-3">
              Quattro passaggi, senza burocrazia finta.
            </h2>
            <p className="text-[#5D6961] mt-4">
              Il controllo serve a rendere la rete credibile, non a riempire il profilo di badge.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {steps.map((step, index) => (
              <article key={step.title} className="pc-card p-5">
                <div className="text-xs font-bold tracking-[0.18em] text-[#235B40]">
                  0{index + 1}
                </div>
                <h3 className="font-bold text-lg mt-3">{step.title}</h3>
                <p className="text-sm text-[#5D6961] mt-2 leading-relaxed">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#D8D5CC] bg-[#FFFEFA]">
        <div className="max-w-7xl mx-auto px-6 py-16 grid lg:grid-cols-2 gap-8">
          <div className="pc-card p-6 md:p-8">
            <div className="flex items-center gap-3">
              <BadgeCheck className="w-6 h-6 text-[#163D2A]" />
              <h2 className="text-2xl font-bold">Cosa chiediamo</h2>
            </div>

            <div className="mt-6 space-y-4">
              {requirements.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#235B40] mt-0.5 shrink-0" />
                  <span className="text-[#4F5B53]">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-[#C8D7CC] bg-[#E4EEE7] p-6 md:p-8">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-[#163D2A]" />
              <h2 className="text-2xl font-bold">Perché la beta è gratuita</h2>
            </div>

            <p className="text-[#425047] mt-5 text-lg leading-relaxed">
              Prima di vendere strumenti vogliamo dimostrare che PortaleCinofilo genera valore reale:
              proprietari che trovano il professionista giusto, richieste che ricevono risposta e
              professionisti che tornano a usare il portale.
            </p>

            <div className="mt-6 rounded-2xl bg-[#FFFEFA] border border-[#C8D7CC] p-5">
              <div className="font-semibold">Il futuro modello Pro</div>
              <p className="text-sm text-[#5D6961] mt-2">
                Se il modello funziona, la monetizzazione sarà orientata a strumenti professionali
                come CRM, calendario, continuità e automazioni. Non alla vendita del ranking.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-16">
        <div className="max-w-3xl">
          <div className="pc-kicker">Domande frequenti</div>
          <h2 className="pc-display text-3xl md:text-4xl mt-3">
            Prima di candidarti.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-8">
          {faqs.map((faq) => (
            <article key={faq.q} className="pc-card p-5">
              <h3 className="font-bold">{faq.q}</h3>
              <p className="text-sm text-[#5D6961] mt-2 leading-relaxed">{faq.a}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="rounded-[2rem] bg-[#163D2A] text-white p-8 md:p-10 grid md:grid-cols-[1fr_auto] gap-7 items-center">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-[#D5A33A]">
              Primo gruppo PortaleCinofilo
            </div>
            <h2 className="pc-display text-3xl md:text-4xl mt-3">
              Se il tuo lavoro merita di essere capito, rendiamolo visibile bene.
            </h2>
            <p className="text-[#D6E0D9] mt-3 max-w-2xl">
              Crea il profilo professionista. Durante la beta possiamo seguire manualmente
              i primi ingressi per costruire una rete locale credibile.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/signup?role=professional')}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#FFFEFA] text-[#163D2A] px-6 py-3.5 font-bold hover:bg-[#F5F1E7] transition shrink-0"
          >
            Entra nella beta
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </main>
  );
}

function MicroProof({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="text-[#163D2A] [&>svg]:w-5 [&>svg]:h-5 mt-0.5">{icon}</div>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <p className="text-xs text-[#657168] mt-1">{text}</p>
      </div>
    </div>
  );
}

function DarkCard({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <h3 className="font-bold">{title}</h3>
      <p className="text-sm text-[#BFC8C2] mt-2 leading-relaxed">{text}</p>
    </article>
  );
}
