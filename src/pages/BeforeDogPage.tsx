import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Compass,
  GraduationCap,
  Home,
  PawPrint,
  RotateCcw,
  Target,
  Users,
  WalletCards,
} from 'lucide-react';
import { useRouter } from '../lib/RouterContext';
import { FCI_GROUP_CONTENT, FCI_GROUP_NAMES } from '../lib/fciGroups';

type Answers = {
  experience: string;
  dailyTime: string;
  aloneTime: string;
  activity: string;
  household: string[];
  goal: string;
  budget: string;
  management: string;
};

type StepOption = {
  value: string;
  label: string;
  detail: string;
};

const STORAGE_KEY = 'pawconnect-before-dog-v1';

const initialAnswers: Answers = {
  experience: '',
  dailyTime: '',
  aloneTime: '',
  activity: '',
  household: [],
  goal: '',
  budget: '',
  management: '',
};

const steps: Array<{
  key: keyof Answers;
  eyebrow: string;
  title: string;
  description: string;
  icon: typeof Compass;
  multiple?: boolean;
  options: StepOption[];
}> = [
  {
    key: 'experience',
    eyebrow: 'Esperienza',
    title: 'Qual è il tuo rapporto attuale con i cani?',
    description: 'L’esperienza non rende automaticamente adatti a ogni cane, ma cambia il livello di supporto e gestione che può essere realistico.',
    icon: GraduationCap,
    options: [
      { value: 'first', label: 'Sarebbe il mio primo cane', detail: 'Voglio partire con basi chiare e supporto.' },
      { value: 'past', label: 'Ho già vissuto con uno o più cani', detail: 'Ho esperienza quotidiana, ma non necessariamente tecnica.' },
      { value: 'advanced', label: 'Ho esperienza avanzata', detail: 'Formazione, sport, lavoro o gestione di cani complessi.' },
    ],
  },
  {
    key: 'dailyTime',
    eyebrow: 'Tempo reale',
    title: 'Quanto tempo puoi dedicare ogni giorno in modo stabile?',
    description: 'Non il tempo ideale del weekend: quello che puoi garantire davvero nella routine.',
    icon: Clock3,
    options: [
      { value: 'under1', label: 'Meno di 1 ora', detail: 'Tempo quotidiano molto limitato.' },
      { value: '1to2', label: '1–2 ore', detail: 'Routine moderata tra uscite, gestione e relazione.' },
      { value: '2to3', label: '2–3 ore', detail: 'Buona disponibilità quotidiana.' },
      { value: '3plus', label: 'Più di 3 ore', detail: 'Il cane può occupare una parte importante della giornata.' },
    ],
  },
  {
    key: 'aloneTime',
    eyebrow: 'Routine',
    title: 'Per quanto tempo resterebbe normalmente solo?',
    description: 'La capacità di stare soli si costruisce, ma la tua organizzazione quotidiana resta un vincolo concreto.',
    icon: Home,
    options: [
      { value: 'under2', label: 'Meno di 2 ore', detail: 'Presenza quasi costante o buona rete di supporto.' },
      { value: '2to4', label: '2–4 ore', detail: 'Assenze contenute durante la giornata.' },
      { value: '4to6', label: '4–6 ore', detail: 'Serve pianificare bene gestione, uscite e abitudini.' },
      { value: '6plus', label: 'Più di 6 ore', detail: 'È un vincolo importante da considerare prima della scelta.' },
    ],
  },
  {
    key: 'activity',
    eyebrow: 'Stile di vita',
    title: 'Che livello di attività vuoi condividere con il cane?',
    description: 'Non cerchiamo “energia alta = cane migliore”: cerchiamo compatibilità con la vita che fai davvero.',
    icon: Activity,
    options: [
      { value: 'calm', label: 'Vita tranquilla', detail: 'Passeggiate e quotidianità senza obiettivi sportivi.' },
      { value: 'moderate', label: 'Attività moderata', detail: 'Uscite regolari, escursioni occasionali, vita dinamica.' },
      { value: 'active', label: 'Vita molto attiva', detail: 'Movimento frequente e attività strutturate.' },
      { value: 'sport', label: 'Sport cinofilo', detail: 'Voglio costruire un percorso tecnico o agonistico.' },
    ],
  },
  {
    key: 'household',
    eyebrow: 'Famiglia',
    title: 'Chi dovrà convivere con il cane?',
    description: 'Puoi selezionare più voci. La convivenza reale conta più dell’immagine ideale della razza.',
    icon: Users,
    multiple: true,
    options: [
      { value: 'adults', label: 'Solo adulti', detail: 'Nucleo adulto.' },
      { value: 'children', label: 'Bambini', detail: 'Servono compatibilità e gestione delle interazioni.' },
      { value: 'dogs', label: 'Altri cani', detail: 'La convivenza intraspecifica è parte della scelta.' },
      { value: 'cats', label: 'Gatti o altri animali', detail: 'Predazione, gestione e introduzioni vanno considerate.' },
    ],
  },
  {
    key: 'goal',
    eyebrow: 'Obiettivo',
    title: 'Che tipo di relazione vuoi costruire?',
    description: 'L’obiettivo influenza ciò che dovrai valutare nel singolo cane e nel percorso educativo.',
    icon: Target,
    options: [
      { value: 'companion', label: 'Compagno di vita', detail: 'Famiglia, quotidianità e relazione.' },
      { value: 'outdoor', label: 'Compagno per vita attiva', detail: 'Escursioni, viaggi e attività condivise.' },
      { value: 'sport', label: 'Sport e formazione', detail: 'Voglio lavorare con metodo su competenze e discipline.' },
      { value: 'work', label: 'Attività o lavoro specifico', detail: 'Ho un obiettivo funzionale preciso da approfondire.' },
    ],
  },
  {
    key: 'budget',
    eyebrow: 'Sostenibilità',
    title: 'Quanto margine economico vuoi riservare alla gestione?',
    description: 'Alimentazione, prevenzione, veterinario, educazione, attrezzatura e imprevisti fanno parte della scelta.',
    icon: WalletCards,
    options: [
      { value: 'essential', label: 'Budget essenziale', detail: 'Devo contenere con attenzione i costi ricorrenti.' },
      { value: 'balanced', label: 'Budget medio', detail: 'Posso sostenere gestione ordinaria e formazione.' },
      { value: 'flexible', label: 'Budget flessibile', detail: 'Ho margine anche per attività, supporto e imprevisti.' },
    ],
  },
  {
    key: 'management',
    eyebrow: 'Gestione',
    title: 'Quanta complessità quotidiana sei disposto a gestire?',
    description: 'Pelo, forza fisica, motivazioni, vocalità, necessità educative e logistica possono pesare più della taglia.',
    icon: PawPrint,
    options: [
      { value: 'low', label: 'Preferisco gestione semplice', detail: 'Voglio ridurre il più possibile la complessità quotidiana.' },
      { value: 'medium', label: 'Posso gestire un impegno medio', detail: 'Sono disposto a imparare e organizzarmi.' },
      { value: 'high', label: 'Accetto una gestione impegnativa', detail: 'Tempo, formazione e organizzazione possono essere importanti.' },
    ],
  },
];

function loadStoredAnswers(): Answers {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialAnswers;
    return { ...initialAnswers, ...(JSON.parse(raw) as Partial<Answers>) };
  } catch {
    return initialAnswers;
  }
}

export function BeforeDogPage() {
  const { navigate } = useRouter();
  const [answers, setAnswers] = useState<Answers>(() => loadStoredAnswers());
  const [stepIndex, setStepIndex] = useState(0);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  }, [answers]);

  const step = steps[stepIndex];
  const Icon = step.icon;
  const currentValue = answers[step.key];
  const isComplete = Array.isArray(currentValue)
    ? currentValue.length > 0
    : Boolean(currentValue);

  const considerations = useMemo(() => {
    const items: string[] = [];

    if (answers.experience === 'first') {
      items.push('Dai priorità a prevedibilità, supporto educativo e disponibilità dell’allevatore o del professionista nel post-affido.');
    }
    if (answers.aloneTime === '6plus') {
      items.push('Più di 6 ore di solitudine abituale è un vincolo forte: valuta organizzazione, supporto esterno e capacità individuale del cane, non solo la razza.');
    }
    if (answers.dailyTime === 'under1') {
      items.push('Il tempo quotidiano dichiarato è limitato: evita di sottostimare uscite, relazione, educazione e gestione mentale.');
    }
    if (answers.household.includes('children')) {
      items.push('La presenza di bambini richiede attenzione a temperamento individuale, gestione degli spazi e supervisione delle interazioni.');
    }
    if (answers.household.includes('dogs')) {
      items.push('Con altri cani in casa, la compatibilità individuale e la qualità delle introduzioni diventano criteri centrali.');
    }
    if (answers.household.includes('cats')) {
      items.push('Con gatti o altri animali, valuta con attenzione motivazioni predatorie, autocontrollo e gestione ambientale.');
    }
    if (answers.activity === 'sport' || answers.goal === 'sport') {
      items.push('Se vuoi fare sport, valuta attitudini, salute, motivazioni e qualità della selezione: non basta scegliere una razza “sportiva”.');
    }
    if (answers.goal === 'work') {
      items.push('Per un obiettivo di lavoro specifico serve partire dalla funzione richiesta e dalla selezione delle linee, non dall’estetica.');
    }
    if (answers.budget === 'essential') {
      items.push('Con un budget essenziale, considera con attenzione taglia, prevenzione sanitaria, alimentazione, assicurazione e possibili costi educativi.');
    }
    if (answers.management === 'low') {
      items.push('Se vuoi una gestione semplice, considera anche forza fisica, manutenzione del mantello, vocalità e intensità motivazionale.');
    }

    if (items.length === 0) {
      items.push('Il tuo profilo non mostra un singolo vincolo dominante: la scelta dovrà concentrarsi sulla qualità del singolo cane, della selezione e della gestione futura.');
    }

    return items;
  }, [answers]);


  const explorationLenses = useMemo(() => {
    const lenses: string[] = [
      'Confronta sempre storia funzionale, bisogni e gestione con il tempo che puoi garantire davvero.',
    ];

    if (answers.experience === 'first') {
      lenses.push('Da primo proprietario, valuta quanto supporto educativo e quanta prevedibilità gestionale richiede il singolo cane.');
    }

    if (answers.aloneTime === '6plus' || answers.dailyTime === 'under1') {
      lenses.push('Il tuo vincolo principale è il tempo: nessun gruppo FCI annulla il bisogno di presenza, relazione e organizzazione.');
    }

    if (answers.household.includes('children')) {
      lenses.push('Con bambini, leggi ogni gruppo pensando a gestione degli spazi, intensità fisica e supervisione delle interazioni.');
    }

    if (answers.household.includes('dogs') || answers.household.includes('cats')) {
      lenses.push('Con altri animali, considera motivazioni, predazione, comunicazione e compatibilità individuale oltre alla razza.');
    }

    if (answers.activity === 'sport' || answers.goal === 'sport' || answers.goal === 'work') {
      lenses.push('Per sport o lavoro, la funzione storica è solo un punto di partenza: contano salute, linee di selezione, motivazioni e soggetto.');
    }

    if (answers.management === 'low') {
      lenses.push('Se cerchi una gestione semplice, osserva forza fisica, vocalità, mantello, autonomia e intensità motivazionale, non solo la taglia.');
    }

    if (answers.budget === 'essential') {
      lenses.push('Integra nella scelta costi realistici di alimentazione, prevenzione, veterinario, educazione, attrezzatura e imprevisti.');
    }

    return lenses;
  }, [answers]);

  const fciGroups = useMemo(
    () => Object.values(FCI_GROUP_CONTENT).sort((a, b) => a.group - b.group),
    []
  );

  const toggleOption = (value: string) => {
    if (step.multiple) {
      const current = answers[step.key] as string[];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      setAnswers({ ...answers, [step.key]: next });
      return;
    }

    setAnswers({ ...answers, [step.key]: value });
  };

  const reset = () => {
    setAnswers(initialAnswers);
    setStepIndex(0);
    setShowResult(false);
    window.localStorage.removeItem(STORAGE_KEY);
  };

  if (showResult) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-5xl mx-auto px-6 py-12 md:py-16">
          <button
            type="button"
            onClick={() => setShowResult(false)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 mb-8"
          >
            <ArrowLeft className="w-4 h-4" /> Torna alle risposte
          </button>

          <div className="rounded-[2rem] bg-white border border-stone-200 p-7 md:p-10 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">
              <CheckCircle2 className="w-7 h-7 text-emerald-700" />
            </div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700 mb-3">
              Il tuo profilo di compatibilità
            </p>
            <h1 className="text-3xl md:text-5xl font-bold text-stone-900 tracking-tight">
              Prima della razza, questi sono i criteri da rispettare.
            </h1>
            <p className="text-stone-600 mt-4 max-w-3xl leading-relaxed">
              PawConnect non assegna una “razza perfetta”. Questo profilo evidenzia i vincoli reali della tua vita che dovrebbero guidare la scelta del singolo cane, dell’allevamento e del percorso educativo.
            </p>

            <div className="mt-8 space-y-3">
              {considerations.map((item) => (
                <div key={item} className="flex gap-3 rounded-2xl bg-stone-50 border border-stone-100 p-4">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
                  <p className="text-sm md:text-base text-stone-700 leading-relaxed">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-bold text-stone-900">Cosa non fa questo risultato</p>
              <p className="text-sm text-stone-700 mt-1 leading-relaxed">
                Non diagnostica il comportamento futuro di un cane e non sostituisce la conoscenza del soggetto, delle linee di selezione, dell’allevatore e del contesto in cui vivrà.
              </p>
            </div>


            <div className="mt-10 border-t border-stone-200 pt-9">
              <div className="max-w-3xl">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700 mb-3">
                  Dal tuo profilo ai gruppi FCI
                </p>
                <h2 className="text-2xl md:text-3xl font-bold text-stone-900">
                  Esplora, confronta, poi scendi alla singola razza.
                </h2>
                <p className="text-stone-600 mt-3 leading-relaxed">
                  Non ordiniamo i gruppi dal “più adatto” al “meno adatto”. Il gruppo FCI racconta soprattutto origine e funzione:
                  usalo come mappa per capire quali domande fare prima di scegliere una razza o un singolo cane.
                </p>
              </div>

              <div className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-100 p-5">
                <p className="font-bold text-stone-900 mb-3">Le lenti con cui leggere i gruppi, in base alle tue risposte</p>
                <div className="space-y-2">
                  {explorationLenses.map((lens) => (
                    <div key={lens} className="flex gap-3 text-sm text-stone-700 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                      <span>{lens}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-7 grid md:grid-cols-2 gap-4">
                {fciGroups.map((group) => (
                  <button
                    key={group.group}
                    type="button"
                    onClick={() => navigate(`/gruppi-fci/${group.group}`)}
                    className="group text-left rounded-2xl border border-stone-200 p-5 hover:border-emerald-300 hover:bg-emerald-50/40 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-700">
                          Gruppo FCI {group.group}
                        </div>
                        <h3 className="font-bold text-stone-900 mt-1">
                          {FCI_GROUP_NAMES[group.group]}
                        </h3>
                      </div>
                      <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 group-hover:translate-x-1 transition" />
                    </div>

                    <p className="text-sm text-stone-600 mt-3 leading-relaxed">
                      {group.intro}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {group.needs.slice(0, 2).map((need) => (
                        <span
                          key={need}
                          className="text-xs bg-stone-100 text-stone-700 px-2.5 py-1 rounded-full"
                        >
                          {need}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-7 rounded-2xl border border-stone-200 bg-stone-50 p-5">
                <p className="font-bold text-stone-900">Quando una razza ti interessa davvero</p>
                <p className="text-sm text-stone-700 mt-2 leading-relaxed">
                  Il passo successivo non è “comprarla”: è approfondire standard, funzione, salute, linee di selezione,
                  caratteristiche dei genitori e qualità dell’allevamento. PawConnect collegherà questo passaggio alle fonti ENCI ufficiali,
                  senza creare una certificazione parallela.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-5 py-3 rounded-xl bg-stone-900 text-white font-semibold hover:bg-stone-800"
              >
                Torna a PawConnect
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-stone-300 text-stone-800 font-semibold hover:bg-stone-50"
              >
                <RotateCcw className="w-4 h-4" /> Ricomincia
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-6 py-10 md:py-14">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-stone-600 hover:text-stone-900 mb-7"
        >
          <ArrowLeft className="w-4 h-4" /> Home
        </button>

        <div className="grid lg:grid-cols-[0.75fr_1.25fr] gap-8 items-start">
          <aside className="lg:sticky lg:top-24">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700 mb-3">
              Prima del cane
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-stone-900 tracking-tight">
              Una scelta consapevole parte dalla tua vita reale.
            </h1>
            <p className="text-stone-600 mt-4 leading-relaxed">
              Otto passaggi brevi. Nessun test magico e nessuna razza assegnata automaticamente.
            </p>

            <div className="mt-7">
              <div className="flex justify-between text-xs font-semibold text-stone-500 mb-2">
                <span>Passaggio {stepIndex + 1} di {steps.length}</span>
                <span>{Math.round(((stepIndex + 1) / steps.length) * 100)}%</span>
              </div>
              <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all"
                  style={{ width: `${((stepIndex + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
          </aside>

          <section className="rounded-[2rem] bg-white border border-stone-200 p-6 md:p-9 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-5">
              <Icon className="w-6 h-6 text-emerald-700" />
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700 mb-2">
              {step.eyebrow}
            </p>
            <h2 className="text-2xl md:text-3xl font-bold text-stone-900">{step.title}</h2>
            <p className="text-stone-600 mt-3 leading-relaxed">{step.description}</p>

            <div className="mt-7 grid gap-3">
              {step.options.map((option) => {
                const selected = Array.isArray(currentValue)
                  ? currentValue.includes(option.value)
                  : currentValue === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className={`text-left rounded-2xl border p-4 transition ${
                      selected
                        ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                        : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        selected ? 'border-emerald-600 bg-emerald-600' : 'border-stone-300'
                      }`}>
                        {selected && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </div>
                      <div>
                        <div className="font-bold text-stone-900">{option.label}</div>
                        <div className="text-sm text-stone-600 mt-1">{option.detail}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex justify-between gap-3">
              <button
                type="button"
                disabled={stepIndex === 0}
                onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-stone-300 text-stone-700 font-semibold disabled:opacity-30"
              >
                <ArrowLeft className="w-4 h-4" /> Indietro
              </button>

              {stepIndex < steps.length - 1 ? (
                <button
                  type="button"
                  disabled={!isComplete}
                  onClick={() => setStepIndex((value) => Math.min(steps.length - 1, value + 1))}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-40"
                >
                  Continua <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!isComplete}
                  onClick={() => setShowResult(true)}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-40"
                >
                  Vedi il profilo <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
