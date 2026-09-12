export type ImparaSublesson = {
  id: string;
  title: string;
  durationMinutes: number;
  paragraphs: string[];
  bullets?: string[];
  sourceNote?: string;
};

export type ImparaActivityType = 'reflection' | 'checklist' | 'video-lab';

export type ImparaActivity = {
  id: string;
  type: ImparaActivityType;
  title: string;
  summary: string;
  instructions: string[];
  completionHint: string;
  videoSrc?: string;
  markerTargets?: number[];
  markerToleranceMs?: number;
};

export type ImparaQuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
};

export type ImparaLesson = {
  slug: string;
  order: number;
  moduleId: string;
  moduleOrder: number;
  moduleTitle: string;
  title: string;
  summary: string;
  durationMinutes: number;
  objectives: string[];
  sublessons: ImparaSublesson[];
  activities: ImparaActivity[];
  quiz: ImparaQuizQuestion[];
};

export type ImparaModule = {
  id: string;
  order: number;
  title: string;
  description: string;
};

export const STAGE_1_MODULES: ImparaModule[] = [
  {
    id: 'benessere-osservazione',
    order: 1,
    title: 'Benessere e osservazione',
    description:
      'Prima di interpretare o chiedere comportamenti, impariamo a leggere bisogni, recupero, contesto e segnali osservabili.',
  },
  {
    id: 'sicurezza-gestione',
    order: 2,
    title: 'Sicurezza e gestione quotidiana',
    description:
      'Routine, autonomia, spazi, risorse e prossemica diventano strumenti concreti di gestione.',
  },
  {
    id: 'funzione-motivazione',
    order: 3,
    title: 'Funzione, motivazione e memoria di razza',
    description:
      'Colleghiamo selezione, sequenze comportamentali, gioco, lavoro e bisogni del singolo cane.',
  },
  {
    id: 'relazione-apprendimento',
    order: 4,
    title: 'Relazione, lettura e apprendimento',
    description:
      'Etogramma, lettura individuale, caratteristiche del soggetto e principi di apprendimento.',
  },
];

export const STAGE_1_LESSONS: ImparaLesson[] = [
  {
    slug: 'bisogni-recupero',
    order: 1,
    moduleId: 'benessere-osservazione',
    moduleOrder: 1,
    moduleTitle: 'Benessere e osservazione',
    title: 'Bisogni, sonno e recupero',
    summary:
      'Il comportamento non si legge nel vuoto: prima vengono risorse essenziali, riposo reale e una giornata sostenibile.',
    durationMinutes: 24,
    objectives: [
      'Distinguere bisogni essenziali, attività e preferenze del proprietario.',
      'Riconoscere la differenza tra inattività e recupero effettivo.',
      'Costruire una prima osservazione della giornata del cane.',
    ],
    sublessons: [
      {
        id: 'bisogni-fisiologici',
        title: '1. Bisogni fisiologici prima della prestazione',
        durationMinutes: 6,
        paragraphs: [
          'Gli appunti del corso partono da fame, sete, sonno e riposo. PawConnect usa questo come principio operativo: prima di interpretare un comportamento come disobbedienza o problema, controlla che le condizioni di base siano realmente soddisfatte.',
          'Gestire una risorsa non significa limitare l’accesso ai bisogni essenziali. Acqua, alimentazione adeguata, possibilità di eliminare e recuperare restano prerequisiti.',
        ],
        bullets: [
          'Acqua disponibile e sicura.',
          'Alimentazione coerente con il singolo cane e con le indicazioni veterinarie.',
          'Possibilità reale di dormire e recuperare.',
          'Tempi per movimento, esplorazione, relazione e fisiologica.',
        ],
        sourceNote: 'Base: appunti del corso ENCI 2024, sezione bisogni primari.',
      },
      {
        id: 'sonno-profondo',
        title: '2. Riposare non significa soltanto stare fermi',
        durationMinutes: 7,
        paragraphs: [
          'Nel materiale del corso il sonno viene trattato come recupero profondo e indisturbato. Un cane sdraiato che continua a monitorare porte, campanello, persone o altri animali può essere inattivo senza essere davvero in recupero.',
          'PawConnect non trasforma agitazione, ansia o aggressività in una diagnosi causata automaticamente dal sonno. Il riposo è una delle variabili da osservare insieme al resto del contesto.',
        ],
        bullets: [
          'Conta quante volte il cane viene interrotto mentre riposa.',
          'Osserva dove riesce spontaneamente ad abbassare l’attivazione.',
          'Valuta rumori, passaggi, finestre, porte e richieste continue di interazione.',
        ],
        sourceNote: 'Base: appunti del corso ENCI 2024, sonno e riposo.',
      },
      {
        id: 'giornata-intera',
        title: '3. Leggere la giornata come un sistema',
        durationMinutes: 6,
        paragraphs: [
          'Attività, alimentazione, gioco, riposo e relazione non sono compartimenti indipendenti. Una giornata utile è leggibile, ma non necessariamente identica ogni giorno.',
          'L’obiettivo non è costruire un orario militare: è evitare che il cane passi da lunghi periodi privi di stimoli a picchi casuali di attività o richieste continue.',
        ],
        sourceNote: 'Base: appunti del corso ENCI 2024, routine e prevedibilità; formulazione PawConnect in revisione.',
      },
    ],
    activities: [
      {
        id: 'diario-24h',
        type: 'checklist',
        title: 'Diario di 24 ore',
        summary:
          'Per un giorno registra ciò che succede davvero, non ciò che pensi dovrebbe succedere.',
        instructions: [
          'Segna sonno/riposo, pasti, fisiologica, passeggiate, gioco, interazioni e periodi di solitudine.',
          'Evidenzia ogni interruzione del riposo.',
          'Alla fine identifica un punto forte e un punto da migliorare.',
        ],
        completionHint: 'Completa l’attività dopo aver osservato almeno una giornata reale.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Qual è il primo controllo prima di interpretare un comportamento come “problema”?',
        options: [
          'Se il cane conosce abbastanza comandi',
          'Se bisogni, recupero e contesto sono adeguati',
          'Se il cane appartiene a una razza facile',
        ],
        correctIndex: 1,
        explanation: 'La lettura parte dalle condizioni di base e dal contesto, non dall’etichetta.',
      },
      {
        id: 'q2',
        prompt: 'Un cane sdraiato sta necessariamente riposando bene?',
        options: ['Sì', 'No, può continuare a monitorare l’ambiente', 'Solo se è sul suo cuscino'],
        correctIndex: 1,
        explanation: 'Inattività e recupero non sono sinonimi.',
      },
      {
        id: 'q3',
        prompt: 'Prevedibilità significa fare tutto ogni giorno alla stessa ora?',
        options: ['Sì', 'No', 'Solo per i pasti'],
        correctIndex: 1,
        explanation: 'Una struttura leggibile può contenere varietà.',
      },
    ],
  },
  {
    slug: 'osservazione-timing-marker',
    order: 2,
    moduleId: 'benessere-osservazione',
    moduleOrder: 1,
    moduleTitle: 'Benessere e osservazione',
    title: 'Osservazione e clicker: allenare il timing',
    summary:
      'Prima osserva, poi interpreta. Nel laboratorio guardi un video preparato da PawConnect e usi il mouse come clicker per allenare la precisione del timing.',
    durationMinutes: 35,
    objectives: [
      'Separare ciò che vedi da ciò che stai già interpretando.',
      'Osservare direzione del corpo, traiettoria, velocità e ritmo.',
      'Allenare il timing di un marker/click senza trasformarlo in un esercizio meccanico.',
    ],
    sublessons: [
      {
        id: 'descrivere-prima',
        title: '1. Descrivere prima di spiegare',
        durationMinutes: 6,
        paragraphs: [
          '“È dominante”, “è ansioso”, “vuole attaccare” sono interpretazioni. Prima servono descrizioni: dove guarda, come è orientato, quale distanza mantiene, quanto velocemente si muove e cosa cambia prima e dopo uno stimolo.',
          'Una buona osservazione riduce il rischio di costruire una spiegazione su un singolo fotogramma.',
        ],
        sourceNote: 'Direzione didattica PawConnect, coerente con la parte di lettura e prossemica degli appunti.',
      },
      {
        id: 'movimento-prossemica',
        title: '2. Movimento e prossemica',
        durationMinutes: 8,
        paragraphs: [
          'Per leggere un’interazione non basta guardare dove si trova il cane. Osserva come usa lo spazio: orientamento del corpo, traiettoria, velocità, ritmo e variazioni della distanza.',
          'Le stesse distanze possono avere significati diversi in casa, in strada o in un campo aperto. Per questo la prossemica va letta come una sequenza nel contesto, non come una fotografia isolata.',
        ],
        bullets: [
          'Direzione del corpo: frontale, laterale, allontanamento.',
          'Traiettoria: diretta, curva, interrotta.',
          'Velocità: aumenta, diminuisce o resta stabile.',
          'Ritmo: fluido, spezzato, esitante.',
          'Distanza: chi la riduce, chi la aumenta e in quale momento.',
        ],
        sourceNote: 'Tema di studio: prossemica e uso dello spazio.',
      },
      {
        id: 'marker-timing',
        title: '3. Marker e timing: segnare un istante',
        durationMinutes: 7,
        paragraphs: [
          'Un marker serve a rendere riconoscibile un istante preciso. Il valore didattico dell’esercizio non è “cliccare tanto”, ma imparare a decidere quale micro-comportamento stai marcando.',
          'Il clicker non è trattato nel documento del corso usato come base: questa parte è un’attività PawConnect aggiunta alla struttura didattica.',
        ],
        bullets: [
          'Decidi prima quale comportamento vuoi osservare.',
          'Clicca una sola volta sull’istante scelto.',
          'Riguarda la sequenza e chiediti se hai marcato davvero ciò che volevi.',
        ],
        sourceNote: 'Attività PawConnect; non attribuita agli appunti del corso.',
      },
    ],
    activities: [
      {
        id: 'video-lab',
        type: 'video-lab',
        title: 'Clicker Lab · timing su video',
        summary:
          'Il video viene scelto e pubblicato da PawConnect. Tu devi soltanto osservarlo e cliccare nel momento esatto in cui avresti usato il clicker.',
        instructions: [
          'Prima passata: guarda il video senza cliccare e individua il comportamento bersaglio.',
          'Seconda passata: usa il mouse come clicker e marca ogni istante che ritieni corretto.',
          'Ripeti la prova per verificare se il tuo timing diventa più stabile.',
          'Quando saranno impostati i marker di riferimento, PawConnect potrà confrontare automaticamente i tuoi click con i tempi corretti.',
        ],
        completionHint: 'Registra almeno un marker durante il video.',
        videoSrc: '/media/impara/stage-1/osservazione-timing-marker.mp4',
        markerTargets: [],
        markerToleranceMs: 250,
      },
      {
        id: 'osservazione-neutra',
        type: 'reflection',
        title: 'Cinque frasi senza etichette',
        summary:
          'Descrivi un cane per cinque frasi senza usare parole come dominante, aggressivo, testardo, felice o ansioso.',
        instructions: [
          'Usa solo posizione, movimento, distanza, orientamento e risposta a eventi osservabili.',
          'Poi aggiungi separatamente le tue ipotesi interpretative.',
        ],
        completionHint: 'Segna completata quando hai separato descrizione e interpretazione.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Quale frase è una descrizione osservabile?',
        options: [
          'Il cane è dominante',
          'Il cane orienta il corpo frontalmente e riduce la distanza',
          'Il cane vuole sicuramente attaccare',
        ],
        correctIndex: 1,
        explanation: 'Descrive ciò che accade senza assegnare automaticamente una motivazione.',
      },
      {
        id: 'q2',
        prompt: 'A cosa serve il marker nell’esercizio?',
        options: [
          'A rendere il cane più eccitato',
          'A segnare un istante comportamentale scelto',
          'A sostituire l’osservazione',
        ],
        correctIndex: 1,
        explanation: 'Il marker allena la precisione del timing.',
      },
      {
        id: 'q3',
        prompt: 'Perché guardare prima il video senza audio?',
        options: [
          'Per rendere l’esercizio più difficile senza motivo',
          'Per separare meglio osservazione visiva e informazioni contestuali',
          'Perché l’audio non conta mai',
        ],
        correctIndex: 1,
        explanation: 'La seconda visione permette di confrontare quanto il contesto sonoro influenza l’interpretazione.',
      },
    ],
  },
  {
    slug: 'routine-sicurezza-autonomia',
    order: 3,
    moduleId: 'sicurezza-gestione',
    moduleOrder: 2,
    moduleTitle: 'Sicurezza e gestione quotidiana',
    title: 'Routine, sicurezza e autonomia',
    summary:
      'Una giornata leggibile deve contenere relazione, attività, recupero e la capacità di non dover seguire continuamente il proprietario.',
    durationMinutes: 26,
    objectives: [
      'Usare la routine come riferimento e non come rigidità.',
      'Individuare luoghi e momenti di recupero.',
      'Osservare dipendenza, autonomia e gestione delle assenze senza diagnosi fai-da-te.',
    ],
    sublessons: [
      {
        id: 'prevedibilita',
        title: '1. Prevedibilità senza rigidità',
        durationMinutes: 7,
        paragraphs: [
          'Nel corso la routine comprende attività, alimentazione, gioco e riposo. PawConnect mantiene il principio di una giornata leggibile, ma evita di trasformarlo nell’obbligo di ripetere tutto alla stessa ora.',
          'La struttura serve a ridurre caos e richieste contraddittorie, mentre la varietà mantiene flessibilità.',
        ],
        sourceNote: 'Base: appunti del corso ENCI 2024, prevedibilità e routine.',
      },
      {
        id: 'zona-recupero',
        title: '2. Un luogo in cui poter davvero staccare',
        durationMinutes: 6,
        paragraphs: [
          'Gli appunti usano il concetto di “punto di sicurezza”. PawConnect lo traduce operativamente come uno spazio in cui il cane può recuperare e non viene continuamente disturbato.',
          'La forma concreta può variare molto tra individui e contesti: non esiste un oggetto universale che renda automaticamente uno spazio sicuro.',
        ],
        sourceNote: 'Base terminologica: “punto di sicurezza” negli appunti; formulazione PawConnect in revisione.',
      },
      {
        id: 'autonomia-appartenenza',
        title: '3. Appartenenza non significa presenza continua',
        durationMinutes: 7,
        paragraphs: [
          'Il materiale collega appartenenza e gestione dei riferimenti familiari. Un cane deve poter costruire relazioni coerenti senza essere costretto a seguire ogni movimento umano.',
          'Periodi di solitudine e cambi di gestione vanno preparati progressivamente. Se compaiono segnali compatibili con forte disagio da separazione, la piattaforma non sostituisce una valutazione professionale.',
        ],
        sourceNote: 'Base: appunti del corso ENCI 2024, appartenenza e distanza comunicativa.',
      },
    ],
    activities: [
      {
        id: 'mappa-routine',
        type: 'checklist',
        title: 'Mappa della routine',
        summary: 'Disegna cinque blocchi della giornata reale del cane.',
        instructions: [
          'Risveglio e prima uscita.',
          'Prima parte della giornata.',
          'Periodo centrale e recupero.',
          'Seconda attività/interazione.',
          'Notte e luogo di riposo.',
        ],
        completionHint: 'Completa quando hai individuato almeno un punto imprevedibile e uno stabile.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Routine significa rigidità assoluta?',
        options: ['Sì', 'No', 'Solo per un cucciolo'],
        correctIndex: 1,
        explanation: 'La prevedibilità può convivere con la varietà.',
      },
      {
        id: 'q2',
        prompt: 'Un “punto di sicurezza” è necessariamente un kennel?',
        options: ['Sì', 'No', 'Solo per cani grandi'],
        correctIndex: 1,
        explanation: 'Il concetto riguarda la funzione dello spazio, non un singolo oggetto obbligatorio.',
      },
      {
        id: 'q3',
        prompt: 'Una forte difficoltà a restare soli va diagnosticata dal proprietario?',
        options: ['Sì', 'No', 'Solo dopo un video'],
        correctIndex: 1,
        explanation: 'L’osservazione è utile, ma una diagnosi richiede competenze professionali.',
      },
    ],
  },
  {
    slug: 'spazi-risorse-prossemica',
    order: 4,
    moduleId: 'sicurezza-gestione',
    moduleOrder: 2,
    moduleTitle: 'Sicurezza e gestione quotidiana',
    title: 'Spazi, risorse e prossemica',
    summary:
      'Dove il cane si posiziona, come attraversa gli spazi e come vengono gestite le risorse cambia la vita quotidiana più di molte etichette.',
    durationMinutes: 28,
    objectives: [
      'Leggere l’uso dello spazio senza attribuire intenzioni automatiche.',
      'Ridurre conflitti ambientali attraverso organizzazione e prevenzione.',
      'Usare distanza e movimento come variabili osservabili.',
    ],
    sublessons: [
      {
        id: 'mappa-spazio',
        title: '1. Lo spazio comunica',
        durationMinutes: 7,
        paragraphs: [
          'Gli appunti propongono esempi di lettura del posizionamento: angoli, centro della stanza, porte e zone di passaggio. PawConnect li usa come domande osservative, non come formule diagnostiche.',
          'La domanda utile è: cosa succede prima, durante e dopo che il cane occupa quella posizione?',
        ],
        sourceNote: 'Base: appunti del corso ENCI 2024, prossemica e gestione degli spazi.',
      },
      {
        id: 'risorse',
        title: '2. Prevenire conflitti attraverso la gestione',
        durationMinutes: 7,
        paragraphs: [
          'Cibo, riposo, gioco, accessi e attenzione sociale sono risorse. Organizzarle significa rendere il contesto più comprensibile e ridurre occasioni di conflitto.',
          'Gli appunti contengono prescrizioni metodologiche specifiche sull’accesso alle risorse: PawConnect non le assume automaticamente come regole universali e le sottoporrà a revisione editoriale.',
        ],
        sourceNote: 'Base: appunti del corso ENCI 2024, gestione delle risorse; contenuto metodologico da validare.',
      },
      {
        id: 'distanze',
        title: '3. Distanze, traiettorie e avvicinamenti',
        durationMinutes: 7,
        paragraphs: [
          'La distanza utile cambia tra casa, strada, campo e altri ambienti. Anche un avvicinamento va letto come combinazione di direzione, traiettoria, velocità e ritmo.',
          'L’obiettivo pratico è imparare a riconoscere quando un’interazione sta diventando più intensa prima di arrivare al conflitto.',
        ],
        sourceNote: 'Base: appunti del corso ENCI 2024, prossemica.',
      },
    ],
    activities: [
      {
        id: 'mappa-casa',
        type: 'reflection',
        title: 'Disegna la mappa della casa',
        summary: 'Segna riposo, pasti, gioco, passaggi stretti, porte e luoghi di maggiore attivazione.',
        instructions: [
          'Individua due zone in cui il cane viene disturbato spesso.',
          'Individua una risorsa che crea aspettativa o competizione.',
          'Pensa a una modifica ambientale semplice prima di pensare a una correzione.',
        ],
        completionHint: 'Completa dopo aver individuato almeno una modifica ambientale concreta.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Il punto in cui il cane si posiziona permette da solo una diagnosi?',
        options: ['Sì', 'No', 'Solo in casa'],
        correctIndex: 1,
        explanation: 'Serve sempre il contesto e una sequenza osservativa.',
      },
      {
        id: 'q2',
        prompt: 'Gestire le risorse significa necessariamente privare il cane?',
        options: ['Sì', 'No', 'Solo per il gioco'],
        correctIndex: 1,
        explanation: 'Gestione significa organizzazione e chiarezza, non privazione dei bisogni.',
      },
      {
        id: 'q3',
        prompt: 'Quali variabili descrivono un avvicinamento?',
        options: [
          'Solo la distanza',
          'Traiettoria, velocità, ritmo e direzione',
          'Solo la postura della coda',
        ],
        correctIndex: 1,
        explanation: 'Il movimento va letto come insieme di componenti.',
      },
    ],
  },
  {
    slug: 'funzione-memoria-razza',
    order: 5,
    moduleId: 'funzione-motivazione',
    moduleOrder: 3,
    moduleTitle: 'Funzione, motivazione e memoria di razza',
    title: 'Funzione, selezione e memoria di razza',
    summary:
      'La razza non è un destino comportamentale, ma la funzione storica aiuta a capire quali motivazioni e gestioni meritano attenzione.',
    durationMinutes: 30,
    objectives: [
      'Collegare funzione storica e selezione senza determinismo.',
      'Conoscere la sequenza predatoria come schema descrittivo.',
      'Usare la memoria di razza come domanda, non come etichetta.',
    ],
    sublessons: [
      {
        id: 'funzione-storica',
        title: '1. Perché esiste una razza',
        durationMinutes: 8,
        paragraphs: [
          'Molte razze sono state selezionate per funzioni specifiche. Questo può rendere più probabili certe motivazioni o caratteristiche, ma non permette di prevedere in modo certo il comportamento del singolo cane.',
          'Per questo PawConnect collega gruppo FCI, funzione, selezione, salute e soggetto individuale.',
        ],
        sourceNote: 'Sintesi PawConnect basata sul tema “memoria di razza” presente negli appunti.',
      },
      {
        id: 'sequenza-predatoria',
        title: '2. La sequenza predatoria come lente',
        durationMinutes: 8,
        paragraphs: [
          'Negli appunti viene descritta una sequenza che comprende orientamento, inseguimento, cattura, combattimento/uccisione, trasporto e consumo o seppellimento.',
          'PawConnect la presenta come schema descrittivo utile a leggere comportamenti e selezione, evitando l’equazione automatica “sequenza incompleta = aggressività”. Le relazioni causali forti presenti nel materiale richiedono revisione scientifica.',
        ],
        bullets: [
          'Orientamento.',
          'Inseguimento.',
          'Cattura.',
          'Fasi terminali della sequenza.',
        ],
        sourceNote: 'Base: appunti del corso ENCI 2024, schema predatorio; causalità forti non adottate senza verifica.',
      },
      {
        id: 'dal-gruppo-al-soggetto',
        title: '3. Dal gruppo FCI al soggetto',
        durationMinutes: 7,
        paragraphs: [
          'Il gruppo FCI è una mappa storica e funzionale. La razza aggiunge maggiore specificità; linea di selezione, genitori, crescita, salute ed esperienza individuale restringono ancora di più la previsione.',
          'L’errore opposto è ignorare completamente la funzione e scegliere soltanto per estetica.',
        ],
        sourceNote: 'Direzione editoriale PawConnect.',
      },
    ],
    activities: [
      {
        id: 'scheda-funzione',
        type: 'reflection',
        title: 'Dalla funzione alla gestione',
        summary: 'Scegli una razza che conosci e ricostruisci la sua funzione prima di descriverne il carattere.',
        instructions: [
          'Gruppo FCI e funzione storica.',
          'Quale comportamento era utile nel lavoro originario?',
          'Come potrebbe emergere oggi nella vita quotidiana?',
          'Quali differenze individuali impediscono di generalizzare?',
        ],
        completionHint: 'Completa quando hai scritto almeno un vantaggio e una difficoltà gestionale plausibile.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'La funzione storica permette di prevedere con certezza il singolo cane?',
        options: ['Sì', 'No', 'Solo se ha pedigree'],
        correctIndex: 1,
        explanation: 'Aiuta a formulare domande, non a determinare il soggetto.',
      },
      {
        id: 'q2',
        prompt: 'A cosa serve lo schema predatorio in questa lezione?',
        options: [
          'A diagnosticare aggressività',
          'Come lente descrittiva di sequenze comportamentali',
          'A classificare cani buoni e cattivi',
        ],
        correctIndex: 1,
        explanation: 'PawConnect evita causalità automatiche.',
      },
      {
        id: 'q3',
        prompt: 'Qual è il percorso corretto di approfondimento?',
        options: [
          'Estetica → colore → taglia',
          'Gruppo/funzione → razza → selezione → soggetto',
          'Razza → stereotipo → scelta',
        ],
        correctIndex: 1,
        explanation: 'La scelta diventa progressivamente più specifica.',
      },
    ],
  },
  {
    slug: 'gioco-lavoro-motivazione',
    order: 6,
    moduleId: 'funzione-motivazione',
    moduleOrder: 3,
    moduleTitle: 'Funzione, motivazione e memoria di razza',
    title: 'Gioco, lavoro, motivazione e recupero',
    summary:
      'L’attività utile non è semplicemente “stancare il cane”: qualità, motivazione, arousal e recupero vanno osservati insieme.',
    durationMinutes: 27,
    objectives: [
      'Distinguere quantità e qualità dell’attività.',
      'Riconoscere il ruolo di motivazione e recupero.',
      'Evitare di usare il gioco come semplice scarico indiscriminato.',
    ],
    sublessons: [
      {
        id: 'qualita-attivita',
        title: '1. Attività: qualità prima della quantità',
        durationMinutes: 7,
        paragraphs: [
          'Gli appunti collegano intensità e complessità del lavoro all’appagamento. PawConnect conserva l’idea che non basti accumulare minuti di attività: bisogna osservare che cosa il cane sta realmente facendo e con quale stato di attivazione.',
          '“Stancare” non è l’unico obiettivo: apprendimento, esplorazione, relazione e recupero fanno parte della stessa gestione.',
        ],
        sourceNote: 'Base: appunti del corso ENCI 2024, gioco e lavoro.',
      },
      {
        id: 'motivazione',
        title: '2. La motivazione non è un interruttore',
        durationMinutes: 7,
        paragraphs: [
          'Il materiale parla di risorsa ludica, predazione, combattività e variazione delle attività. PawConnect usa questi termini come elementi da osservare nel soggetto e nella disciplina, non come ricetta universale.',
          'La stessa attività può aumentare concentrazione in un cane e sovraeccitazione in un altro.',
        ],
        sourceNote: 'Base: appunti del corso ENCI 2024, risorsa ludica e motivazione.',
      },
      {
        id: 'arousal-recupero',
        title: '3. Attivazione e ritorno alla calma',
        durationMinutes: 6,
        paragraphs: [
          'Un’attività non finisce quando smetti di giocare: conta anche quanto tempo serve al cane per tornare a uno stato di recupero.',
          'Osserva respirazione, capacità di interrompere, ricerca continua dell’attività e qualità del riposo successivo. Se emergono problemi clinici o comportamentali, serve un professionista competente.',
        ],
        sourceNote: 'Sintesi PawConnect ispirata al tema arousal/recupero negli appunti.',
      },
    ],
    activities: [
      {
        id: 'registro-attivita',
        type: 'checklist',
        title: 'Registro attività e recupero',
        summary: 'Confronta due attività diverse svolte in giorni differenti.',
        instructions: [
          'Durata dell’attività.',
          'Livello di attivazione durante.',
          'Tempo necessario per interrompere.',
          'Qualità del riposo nelle ore successive.',
        ],
        completionHint: 'Completa dopo aver confrontato almeno due attività.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Più attività significa sempre più benessere?',
        options: ['Sì', 'No', 'Solo nei cani sportivi'],
        correctIndex: 1,
        explanation: 'Conta la qualità e il recupero, non solo la quantità.',
      },
      {
        id: 'q2',
        prompt: 'La stessa attività produce sempre lo stesso effetto su tutti i cani?',
        options: ['Sì', 'No', 'Solo se sono della stessa razza'],
        correctIndex: 1,
        explanation: 'Motivazione, esperienza e individuo cambiano la risposta.',
      },
      {
        id: 'q3',
        prompt: 'Quando termina davvero una sessione?',
        options: [
          'Quando metti via il gioco',
          'Quando consideri anche il ritorno alla calma e il recupero',
          'Quando il cane è esausto',
        ],
        correctIndex: 1,
        explanation: 'Il recupero è parte della sessione.',
      },
    ],
  },
  {
    slug: 'etogramma-relazione-lettura',
    order: 7,
    moduleId: 'relazione-apprendimento',
    moduleOrder: 4,
    moduleTitle: 'Relazione, lettura e apprendimento',
    title: 'Etogramma, relazione e lettura del soggetto',
    summary:
      'Leggere un cane significa integrare comportamento specie-specifico, storia individuale, ambiente e relazione senza ridurlo a un’etichetta.',
    durationMinutes: 30,
    objectives: [
      'Capire a cosa serve un etogramma.',
      'Separare osservazione individuale e stereotipo di razza.',
      'Riconoscere i limiti dell’autovalutazione del proprietario.',
    ],
    sublessons: [
      {
        id: 'etogramma',
        title: '1. Etogramma: descrivere il repertorio',
        durationMinutes: 7,
        paragraphs: [
          'Negli appunti l’etogramma viene presentato come insieme dei comportamenti tipici della specie e come strumento per comprendere le risposte in diversi contesti.',
          'Per PawConnect è soprattutto un invito a osservare repertori e sequenze prima di attribuire intenzioni umane.',
        ],
        sourceNote: 'Base: appunti del corso ENCI 2024, etogramma.',
      },
      {
        id: 'lettura-multipla',
        title: '2. Una lettura non basta',
        durationMinutes: 8,
        paragraphs: [
          'Il materiale suggerisce di osservare il soggetto in ambiente neutro e in più momenti. Il principio utile è evitare conclusioni definitive da una singola situazione.',
          'Ambiente, orario, presenza di persone o cani, livello di attivazione e familiarità cambiano ciò che osservi.',
        ],
        sourceNote: 'Base: appunti del corso ENCI 2024, lettura del cane.',
      },
      {
        id: 'relazione-termini',
        title: '3. Relazione e linguaggio metodologico',
        durationMinutes: 7,
        paragraphs: [
          'Gli appunti utilizzano frequentemente termini come leadership, punto di riferimento e microbranco. Sono concetti legati al metodo del corso e non vengono trasformati automaticamente in dottrina PawConnect.',
          'La versione definitiva distinguerà sempre tra osservazioni condivise, terminologia di una scuola e affermazioni supportate da fonti indipendenti.',
        ],
        sourceNote: 'Nota editoriale PawConnect sulla terminologia metodologica degli appunti.',
      },
    ],
    activities: [
      {
        id: 'osservazione-contesti',
        type: 'reflection',
        title: 'Lo stesso cane in tre contesti',
        summary: 'Osserva lo stesso soggetto in tre momenti o ambienti diversi.',
        instructions: [
          'Descrivi prima ciò che vedi.',
          'Segna cosa cambia nel contesto.',
          'Confronta le tue prime interpretazioni con l’osservazione successiva.',
        ],
        completionHint: 'Completa dopo tre osservazioni separate.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'A cosa serve l’etogramma in questa lezione?',
        options: [
          'A dare un voto al cane',
          'A descrivere repertori comportamentali',
          'A scegliere la razza più intelligente',
        ],
        correctIndex: 1,
        explanation: 'Serve a organizzare l’osservazione del comportamento.',
      },
      {
        id: 'q2',
        prompt: 'Una sola osservazione basta per descrivere stabilmente un soggetto?',
        options: ['Sì', 'No', 'Solo se dura più di un’ora'],
        correctIndex: 1,
        explanation: 'Contesti diversi possono mostrare risposte diverse.',
      },
      {
        id: 'q3',
        prompt: 'PawConnect assume automaticamente tutta la terminologia del corso come verità generale?',
        options: ['Sì', 'No', 'Solo per la leadership'],
        correctIndex: 1,
        explanation: 'Le formulazioni metodologiche specifiche devono essere distinte e revisionate.',
      },
    ],
  },
  {
    slug: 'doti-apprendimento',
    order: 8,
    moduleId: 'relazione-apprendimento',
    moduleOrder: 4,
    moduleTitle: 'Relazione, lettura e apprendimento',
    title: 'Doti caratteriali e principi di apprendimento',
    summary:
      'Temperamento, tempra, socialità, predazione, rinforzo e punizione compaiono negli appunti: qui impariamo a trattarli come concetti da definire e verificare, non come etichette assolute.',
    durationMinutes: 34,
    objectives: [
      'Conoscere i principali termini caratteriali presenti nel materiale.',
      'Capire rinforzo e punizione come conseguenze sul comportamento.',
      'Distinguere terminologia del corso e formulazione editoriale PawConnect.',
    ],
    sublessons: [
      {
        id: 'doti-caratteriali',
        title: '1. Temperamento, tempra, docilità e socialità',
        durationMinutes: 9,
        paragraphs: [
          'Gli appunti propongono categorie come temperamento, tempra, docilità, diffidenza, combattività e socialità. Sono termini utili per orientarsi nel lessico cinofilo, ma alcune definizioni e scale sono specifiche del corso.',
          'PawConnect le manterrà visibili come materiale di studio, distinguendo ciò che è descrittivo da ciò che richiede validazione o confronto con altre fonti.',
        ],
        sourceNote: 'Base: appunti del corso ENCI 2024, doti caratteriali.',
      },
      {
        id: 'predazione-preda',
        title: '2. Predazione, preda e differenze terminologiche',
        durationMinutes: 7,
        paragraphs: [
          'Nel materiale vengono distinti predazione, preda e istinto predatorio. Prima di usare questi termini per descrivere un cane è necessario chiarire che cosa si sta osservando concretamente.',
          'Il rischio è trasformare un termine tecnico in un giudizio globale sul soggetto.',
        ],
        sourceNote: 'Base: appunti del corso ENCI 2024, doti caratteriali e predazione.',
      },
      {
        id: 'rinforzo-punizione',
        title: '3. Rinforzo e punizione: cosa succede dopo un comportamento',
        durationMinutes: 9,
        paragraphs: [
          'Gli appunti definiscono rinforzo come conseguenza che aumenta la probabilità di un comportamento e punizione come conseguenza che tende a ridurla. Positivo e negativo indicano aggiunta o rimozione, non “buono” e “cattivo”.',
          'La versione PawConnect approfondirà applicazioni, limiti, effetti collaterali e criteri etici con fonti dedicate. In questa fase l’obiettivo è capire il vocabolario.',
        ],
        sourceNote: 'Base: appunti del corso ENCI 2024, parte pratica; approfondimento scientifico previsto.',
      },
      {
        id: 'aptica-prossemica',
        title: '4. Aptica e prossemica come canali di comunicazione',
        durationMinutes: 6,
        paragraphs: [
          'Il materiale introduce comunicazione tattile e uso dello spazio. Questi concetti chiudono lo Stage 1 collegando ciò che il conduttore fa con corpo, mani, distanza e movimento a ciò che il cane può percepire.',
        ],
        sourceNote: 'Base: appunti del corso ENCI 2024, aptica e prossemica.',
      },
    ],
    activities: [
      {
        id: 'glossario-personale',
        type: 'checklist',
        title: 'Costruisci il tuo glossario',
        summary: 'Scrivi una definizione operativa, osservabile e prudente per ogni termine.',
        instructions: [
          'Temperamento.',
          'Tempra.',
          'Socialità.',
          'Predazione.',
          'Rinforzo.',
          'Punizione.',
          'Prossemica.',
        ],
        completionHint: 'Completa quando riesci a distinguere il termine dall’etichetta sul cane.',
      },
    ],
    quiz: [
      {
        id: 'q1',
        prompt: 'Nel linguaggio dell’apprendimento “positivo” significa necessariamente “buono”?',
        options: ['Sì', 'No', 'Solo nel rinforzo'],
        correctIndex: 1,
        explanation: 'Positivo indica aggiunta di uno stimolo, non un giudizio morale.',
      },
      {
        id: 'q2',
        prompt: 'Le scale caratteriali degli appunti vengono pubblicate come verità universali?',
        options: ['Sì', 'No', 'Solo per i cani da lavoro'],
        correctIndex: 1,
        explanation: 'Sono materiale da contestualizzare e validare.',
      },
      {
        id: 'q3',
        prompt: 'Qual è il rischio principale di un’etichetta caratteriale?',
        options: [
          'Essere troppo lunga',
          'Sostituire l’osservazione concreta del soggetto',
          'Essere difficile da ricordare',
        ],
        correctIndex: 1,
        explanation: 'Il termine deve aiutare l’osservazione, non sostituirla.',
      },
    ],
  },
];

export function getStage1Lesson(slug: string) {
  return STAGE_1_LESSONS.find((lesson) => lesson.slug === slug) || null;
}

export function getStage1LessonsForModule(moduleId: string) {
  return STAGE_1_LESSONS.filter((lesson) => lesson.moduleId === moduleId);
}
