export type BreedGuide = {
  title: string;
  description: string;
  lead: string;
  origin: string;
  function: string;
  standard: number;
  standardDate: string;
  checkedOn: string;
  history: string;
  standardSummary: string;
  everyday: { title: string; text: string }[];
  questions: string[];
  takeaway: string;
  lessons: { label: string; slug: string }[];
  sources: { label: string; url: string }[];
};

/** Original editorial guidance. Breed facts are paraphrased from the linked FCI sources. */
export const BREED_GUIDES: Readonly<Partial<Record<string, BreedGuide>>> = {
  shikoku: {
    title: 'Shikoku: origini, convivenza e scelta consapevole',
    description: 'Conoscere lo Shikoku prima di sceglierlo: funzione di caccia, vita quotidiana, domande per l’allevatore e fonti FCI.',
    lead: 'Ti attira lo Shikoku? Prima dell’aspetto, prova a immaginarlo nelle tue passeggiate, negli incontri e nei momenti in cui gli chiedi di fermarsi.',
    origin: 'Giappone',
    function: 'Caccia e compagnia',
    standard: 319,
    standardDate: '30 ottobre 2016 · edizione inglese 10 febbraio 2017',
    checkedOn: '2026-10-09',
    history: 'Lo Shikoku è legato alla prefettura giapponese di Kochi. Lo standard FCI ne ricorda l’impiego nella caccia al cinghiale in territorio montuoso: una storia che aiuta a capire perché movimento, esplorazione e interesse per l’ambiente meritino attenzione nella scelta.',
    standardSummary: 'La FCI lo colloca tra gli Spitz asiatici del gruppo 5. Descrive resistenza, vivacità e attenzione all’ambiente. Sono caratteristiche ricercate nella razza, non una previsione del comportamento di ogni cucciolo.',
    everyday: [
      { title: 'Passeggiate, fauna e richiamo', text: 'Nella tua zona ci sono boschi, animali liberi o sentieri affollati? Descrivi questi contesti all’allevatore e al professionista. Chiedi come lavorare sul richiamo e quali spazi usare per esplorare in sicurezza. La somiglianza con un cane visto online non dice come reagirà quello che incontrerai.' },
      { title: 'Una giornata che includa anche il riposo', text: 'Fai un esempio concreto: uscita del mattino, ore di lavoro, rientro e serata. Chi accompagnerà il cane? Dove potrà riposare? Mettere tutto su carta aiuta a verificare se il tuo interesse per questa razza può diventare una routine sostenibile, anche nei giorni meno liberi.' },
      { title: 'Gli incontri si preparano', text: 'Se vivi con altri animali, racconta specie, età e organizzazione degli spazi. Chiedi quali esperienze ha già fatto il soggetto proposto e costruisci inserimenti graduali con chi lo conosce. La sola etichetta “socializzato” non descrive gli incontri né le reazioni osservate.' },
    ],
    questions: [
      'Posso conoscere alcuni adulti della vostra selezione e osservare come trascorrono una normale giornata?',
      'Che interesse mostrano genitori e parenti per fauna, odori e movimento? Come lo gestite durante le uscite?',
      'Quali esperienze concrete ha fatto questo cucciolo con città, trasporti, persone e altri animali?',
      'Quali controlli sanitari documentati avete svolto sui riproduttori e quale supporto offrite dopo l’affido?',
    ],
    takeaway: 'Porta al primo colloquio una giornata tipo e la descrizione dei luoghi in cui uscireste. Servono più di una richiesta generica di un cane “facile”.',
    lessons: [
      { label: 'Preparare routine e autonomia', slug: 'routine-sicurezza-autonomia' },
      { label: 'Gestire spazi e incontri', slug: 'spazi-risorse-prossemica' },
    ],
    sources: [
      { label: 'FCI · scheda Shikoku, n. 319', url: 'https://www.fci.be/en/nomenclature/SHIKOKU-319.html' },
      { label: 'FCI · standard Shikoku in inglese (PDF)', url: 'https://www.fci.be/nomenclature/Standards/319g05-en.pdf' },
    ],
  },
  'clumber-spaniel': {
    title: 'Clumber Spaniel: attività, cura e scelta consapevole',
    description: 'Il Clumber Spaniel oltre l’aspetto tranquillo: origini da cane da cerca, vita quotidiana, cura del mantello e domande per l’allevatore.',
    lead: 'Il Clumber Spaniel ti incuriosisce per l’aspetto posato? Per conoscerlo, parti da come esplora e lavora, poi confronta le sue esigenze con la tua giornata.',
    origin: 'Gran Bretagna',
    function: 'Cane da cerca',
    standard: 109,
    standardDate: '8 settembre 2026 · edizione inglese 6 ottobre 2026',
    checkedOn: '2026-10-09',
    history: 'Il Clumber Spaniel appartiene al gruppo FCI 8, sezione dei cani da cerca. Lo standard collega la sua storia a Clumber Park, nel Nottinghamshire, e descrive un lavoro più misurato rispetto ad altri spaniel. Il ritmo non cancella la funzione per cui è stato selezionato.',
    standardSummary: 'Lo standard ne sottolinea l’olfatto, la solidità e la capacità di lavorare sul terreno. Il mantello è abbondante e presenta frange. La descrizione ufficiale riguarda il modello di razza: attività e gestione vanno adattate al singolo cane.',
    everyday: [
      { title: 'Un’uscita non è solo distanza', text: 'Chiedi all’allevatore di mostrarti un adulto mentre esplora. Quanto tempo dedica agli odori? Come mantiene il contatto con la persona? Usa queste osservazioni per progettare uscite con occasioni di ricerca e pause, senza scegliere l’attività soltanto contando i chilometri.' },
      { title: 'La cura entra nella routine', text: 'Le frange e il mantello richiedono un’organizzazione concreta dopo uscite su erba o terreno bagnato. Fatti mostrare gli strumenti usati e come il cane viene abituato alle manipolazioni. Per il tuo soggetto concorda le cure con allevatore, toelettatore e veterinario.' },
      { title: 'Valuta anche la logistica', text: 'Pensa a scale, accesso all’auto, superfici di casa e spazio per riposare. Un cane dalla struttura robusta va considerato anche nei gesti quotidiani. Chiedi come organizzare movimento e crescita con il veterinario; un intervallo di peso di razza non è una prescrizione alimentare.' },
    ],
    questions: [
      'Posso osservare adulti della vostra selezione durante una passeggiata e un’attività di cerca?',
      'Come alternate attività, esplorazione e recupero nella vita dei vostri Clumber?',
      'Mi mostrate la routine di cura del mantello e le manipolazioni già introdotte ai cuccioli?',
      'Quali controlli sanitari hanno i genitori, con quali referti e date, e quali indicazioni riceverò per la crescita?',
    ],
    takeaway: 'Prima di decidere, prova a descrivere un’uscita e il rientro a casa: attività, cura del mantello, asciugatura e riposo fanno parte dello stesso impegno.',
    lessons: [
      { label: 'Bilanciare attività e recupero', slug: 'bisogni-recupero' },
      { label: 'Conoscere gioco e motivazione', slug: 'gioco-lavoro-motivazione' },
    ],
    sources: [
      { label: 'FCI · scheda Clumber Spaniel, n. 109', url: 'https://www.fci.be/en/nomenclature/CLUMBER-SPANIEL-109.html' },
      { label: 'FCI · standard Clumber Spaniel in inglese (PDF)', url: 'https://www.fci.be/Nomenclature/Standards/109g08-en.pdf' },
    ],
  },
  dobermann: {
    title: 'Dobermann: relazione, attività e scelta consapevole',
    description: 'Conoscere il Dobermann: storia di selezione, convivenza, attività condivise e domande da portare ad allevatore e professionista. Fonti FCI.',
    lead: 'Scegliere un Dobermann significa pensare a una relazione quotidiana. Prima di immaginarlo in gara o in giardino, chiediti quale tempo e quale percorso potrete condividere.',
    origin: 'Germania',
    function: 'Compagnia, difesa e lavoro',
    standard: 143,
    standardDate: '13 novembre 2015 · edizione inglese 17 dicembre 2015',
    checkedOn: '2026-10-09',
    history: 'Il Dobermann prende il nome da Friedrich Louis Dobermann, che avviò la selezione in Germania nell’Ottocento. La FCI lo classifica nel gruppo 2 e ne indica l’impiego come cane da compagnia, difesa e lavoro. Questa origine va letta insieme alle necessità della convivenza attuale.',
    standardSummary: 'Nello standard trovano spazio il legame con la famiglia, il piacere del lavoro e l’adattabilità all’ambiente sociale. La selezione non è una garanzia automatica di equilibrio: è importante conoscere soggetti, esperienze e contesto di crescita.',
    everyday: [
      { title: 'Relazione anche fuori dal campo', text: 'Una sessione di addestramento è solo una parte della giornata. Nel colloquio parla anche di ospiti, uscite, momenti tranquilli e periodi in cui il cane resterà solo. Chiedi come introdurre queste situazioni progressivamente e come osservare se il carico proposto è sostenibile.' },
      { title: 'Sport come progetto condiviso', text: 'Se ti interessa una disciplina, incontra il professionista prima di scegliere il cucciolo. Spiega esperienza, tempi e obiettivi: potrà aiutarti a valutare il percorso. I risultati di un parente sono informazioni utili, ma non promettono gli stessi risultati per un altro cane.' },
      { title: 'Oltre l’immagine del cane da guardia', text: 'Metti a fuoco ciò che desideri nella vita reale: passeggiare, viaggiare, ricevere amici o praticare sport. Discuti questi obiettivi con chi conosce la selezione. Chiedere soltanto che il cane “protegga” lascia fuori la gestione delle situazioni in cui dovrà sentirsi e comportarsi serenamente.' },
    ],
    questions: [
      'Posso osservare gli adulti della vostra selezione sia nel lavoro sia in una normale situazione quotidiana?',
      'Per quali caratteristiche avete scelto questo accoppiamento e cosa avete osservato nelle cucciolate precedenti?',
      'Quali accertamenti sanitari documentati hanno i genitori, quando sono stati eseguiti e quali approfondimenti suggerisce il veterinario?',
      'Quali esperienze di riposo, manipolazione, trasporto e contatto con le persone sono state proposte al cucciolo?',
    ],
    takeaway: 'Arriva al colloquio con due obiettivi distinti: la vita quotidiana che vuoi condividere e l’eventuale disciplina che ti interessa. Si costruiscono insieme, senza confondere una gara con tutta la relazione.',
    lessons: [
      { label: 'Leggere il cane e la relazione', slug: 'etogramma-relazione-lettura' },
      { label: 'Capire come apprende', slug: 'doti-apprendimento' },
    ],
    sources: [
      { label: 'FCI · scheda Dobermann, n. 143', url: 'https://www.fci.be/en/nomenclature/DOBERMANN-143.html' },
      { label: 'FCI · standard Dobermann in inglese (PDF)', url: 'https://www.fci.be/Nomenclature/Standards/143g02-en.pdf' },
    ],
  },
};
