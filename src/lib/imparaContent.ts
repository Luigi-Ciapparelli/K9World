// Content revision: 2026-09-26. Examples and activities authored by PortaleCinofilo.
export type ImparaSublesson = { id: string; title: string; durationMinutes: number; paragraphs: string[]; example: string; tryThis: string };
export type ImparaActivity = { id: string; type: 'reflection' | 'checklist' | 'video-lab'; title: string; summary: string; instructions: string[]; completionHint: string; fields?: string[]; videoSrc?: string; markerTargets?: number[]; markerToleranceMs?: number };
export type ImparaQuizQuestion = { id: string; prompt: string; options: string[]; correctIndex: number; explanation: string };
export type ImparaLesson = { slug: string; order: number; moduleId: string; moduleOrder: number; moduleTitle: string; title: string; summary: string; durationMinutes: number; practiceMinutes: string; objectives: string[]; sublessons: ImparaSublesson[]; activities: ImparaActivity[]; quiz: ImparaQuizQuestion[]; sources: {label: string; url: string}[]; caseStudy: {title: string; text: string}; links?: {label: string; path: string}[] };
export type ImparaModule = { id: string; order: number; title: string; description: string };
export const STAGE_1_MODULES: ImparaModule[] = [
  {
    "id": "benessere-osservazione",
    "order": 1,
    "title": "Capire i bisogni",
    "description": "Riposo, giornata e osservazione: da qui si comincia."
  },
  {
    "id": "sicurezza-gestione",
    "order": 2,
    "title": "Vivere insieme",
    "description": "Routine, spazi e incontri gestiti con attenzione."
  },
  {
    "id": "funzione-motivazione",
    "order": 3,
    "title": "Conoscere il tuo cane",
    "description": "Predisposizioni, gioco e attività adatte al singolo cane."
  },
  {
    "id": "relazione-apprendimento",
    "order": 4,
    "title": "Costruire la relazione",
    "description": "Descrivere i comportamenti e imparare a comunicare."
  }
];

export const STAGE_1_LESSONS: ImparaLesson[] = [
  {
    "slug": "bisogni-recupero",
    "order": 1,
    "moduleId": "benessere-osservazione",
    "moduleOrder": 1,
    "moduleTitle": "Capire i bisogni",
    "title": "Bisogni, sonno e recupero",
    "summary": "Il comportamento non si legge nel vuoto: prima vengono risorse essenziali, riposo reale e una giornata sostenibile.",
    "durationMinutes": 9,
    "objectives": [
      "Distinguere bisogni essenziali, attività e preferenze del proprietario.",
      "Riconoscere la differenza tra inattività e recupero effettivo.",
      "Costruire una prima osservazione della giornata del cane."
    ],
    "sublessons": [
      {
        "id": "bisogni-fisiologici",
        "title": "Prima di chiedere, controlla i bisogni",
        "durationMinutes": 2,
        "paragraphs": [
          "Acqua, alimentazione adeguata, salute, possibilità di eliminare e riposo sono il punto di partenza. A questi si aggiungono movimento, esplorazione e relazioni compatibili con il singolo cane. Una richiesta di attenzione può avere molte spiegazioni: prima di chiamarla capriccio, osserva la giornata.",
          "Non serve riempire ogni ora di attività. Cerca un equilibrio sostenibile per entrambi e adatta le proposte a età, condizioni fisiche e preferenze. Un cambiamento improvviso nel comportamento va discusso con il veterinario."
        ],
        "example": "Rientri e il cane ti segue ovunque. Invece di decidere che è disobbediente, ricostruisci quando ha bevuto, riposato, passeggiato e avuto compagnia.",
        "tryThis": "Scrivi una cosa che già funziona nella sua giornata e una condizione da controllare."
      },
      {
        "id": "sonno-profondo",
        "title": "Un posto in cui poter riposare",
        "durationMinutes": 2,
        "paragraphs": [
          "Essere sdraiato non racconta, da solo, quanto un cane stia recuperando. Guarda anche le interruzioni: persone che passano, rumori, richieste di contatto, altri animali. Offri una zona comoda e tranquilla dalla quale possa allontanarsi liberamente.",
          "Osserva senza svegliarlo per fare una prova. Non trasformare il riposo in una gara a raggiungere un numero di ore uguale per tutti. Annota quello che vedi e confronta più giornate."
        ],
        "example": "La cuccia è davanti alla porta. Ogni ingresso interrompe il riposo. Puoi predisporre un secondo posto più tranquillo e vedere quale sceglie.",
        "tryThis": "Disegna mentalmente i passaggi vicini al suo posto di riposo: quale puoi ridurre?"
      },
      {
        "id": "giornata-intera",
        "title": "Guarda tutta la giornata",
        "durationMinutes": 2,
        "paragraphs": [
          "Un episodio ha più senso quando conosci ciò che lo precede. Nel diario separa l’attività proposta dal modo in cui il cane reagisce e dal recupero successivo. “Passeggiata di venti minuti” descrive il programma; “ha annusato e poi si è disteso” aggiunge un’osservazione.",
          "Scegli un piccolo cambiamento per volta. Se modifichi passeggiata, orari, giochi e ambiente insieme, sarà difficile capire che cosa ha aiutato. Porta il diario a un professionista se vuoi costruire una routine su misura."
        ],
        "example": "Dopo una mattina piena di ospiti il cane fatica a fermarsi. Aggiungere un gioco intenso non è l’unica risposta possibile: puoi ridurre le richieste e offrirgli tranquillità.",
        "tryThis": "Confronta un momento impegnativo e uno tranquillo della stessa giornata."
      }
    ],
    "activities": [
      {
        "id": "diario-24h",
        "type": "checklist",
        "title": "Diario di 24 ore",
        "summary": "Per un giorno registra ciò che succede davvero, non ciò che pensi dovrebbe succedere.",
        "instructions": [
          "Ho descritto il contesto o il caso usato.",
          "Ho distinto i fatti osservati dalle mie ipotesi.",
          "Ho indicato un passo concreto o una domanda da approfondire."
        ],
        "completionHint": "Compila i tre appunti e conferma le osservazioni. Se non hai ancora un cane, lavora sul caso della lezione e scrivilo nel quaderno.",
        "fields": [
          "Una giornata: attività, pasti, uscite e riposo",
          "Quando il riposo viene interrotto",
          "Una cosa che funziona e un piccolo cambiamento"
        ]
      }
    ],
    "quiz": [
      {
        "id": "q1",
        "prompt": "Qual è il primo controllo prima di interpretare un comportamento come “problema”?",
        "options": [
          "Se il cane conosce abbastanza comandi",
          "Se bisogni, recupero e contesto sono adeguati",
          "Se il cane appartiene a una razza facile"
        ],
        "correctIndex": 1,
        "explanation": "La lettura parte dalle condizioni di base e dal contesto, non dall’etichetta."
      },
      {
        "id": "q2",
        "prompt": "Un cane sdraiato sta necessariamente riposando bene?",
        "options": [
          "No, può continuare a monitorare l’ambiente",
          "Solo se è sul suo cuscino",
          "Sì"
        ],
        "correctIndex": 0,
        "explanation": "Inattività e recupero non sono sinonimi."
      },
      {
        "id": "q3",
        "prompt": "Prevedibilità significa fare tutto ogni giorno alla stessa ora?",
        "options": [
          "Solo per i pasti",
          "Sì",
          "No"
        ],
        "correctIndex": 2,
        "explanation": "Una struttura leggibile può contenere varietà."
      },
      {
        "id": "caso-pratico",
        "prompt": "Il cane si alza ogni volta che qualcuno attraversa il corridoio accanto alla cuccia. Qual è il primo intervento da valutare?",
        "options": [
          "Offrire anche un posto di riposo più tranquillo e osservare",
          "Aumentare sempre la durata delle corse",
          "Togliergli la cuccia finché non resta fermo"
        ],
        "correctIndex": 0,
        "explanation": "Modificare il contesto permette di osservare se le interruzioni diminuiscono, senza attribuire subito una causa al comportamento."
      }
    ],
    "sources": [
      {
        "label": "RSPCA · Ambiente e riposo",
        "url": "https://www.rspca.org.uk/adviceandwelfare/pets/dogs/environment"
      },
      {
        "label": "Dogs Trust · Organizzare una routine",
        "url": "https://www.dogstrust.org.uk/dog-advice/training/home/create-routine"
      }
    ],
    "practiceMinutes": "15 minuti di osservazione, da distribuire nella giornata",
    "caseStudy": {
      "title": "Una situazione da osservare",
      "text": "Il cane si alza ogni volta che qualcuno attraversa il corridoio accanto alla cuccia. Qual è il primo intervento da valutare? Puoi usare questo caso nel quaderno se non hai ancora un cane."
    }
  },
  {
    "slug": "osservazione-timing-marker",
    "order": 2,
    "moduleId": "benessere-osservazione",
    "moduleOrder": 1,
    "moduleTitle": "Capire i bisogni",
    "title": "Osservazione e clicker: allenare il timing",
    "summary": "Osserva senza etichette e allena la precisione di occhio e mano nel laboratorio clicker.",
    "durationMinutes": 12,
    "objectives": [
      "Separare ciò che vedi da ciò che stai già interpretando.",
      "Osservare direzione del corpo, traiettoria, velocità e ritmo.",
      "Allenare il timing di un marker/click senza trasformarlo in un esercizio meccanico."
    ],
    "sublessons": [
      {
        "id": "descrivere-prima",
        "title": "Descrivere prima di interpretare",
        "durationMinutes": 2,
        "paragraphs": [
          "“È geloso” è un’interpretazione. “Si mette tra me e l’ospite, corpo fermo e bocca chiusa” è una descrizione. La seconda frase permette a un’altra persona di capire che cosa hai osservato, senza dover condividere subito la tua spiegazione.",
          "Annota luogo, distanza, persone o animali presenti, ciò che accade prima e ciò che segue. Nessun singolo segnale permette di leggere con certezza uno stato emotivo: contesto e insieme dei segnali contano."
        ],
        "example": "Il cane gira la testa mentre qualcuno allunga la mano. Registra il movimento e lascia spazio: non ripetere l’avvicinamento per ottenere una reazione più evidente.",
        "tryThis": "Trasforma “fa i dispetti” in una frase che una telecamera potrebbe documentare."
      },
      {
        "id": "movimento-prossemica",
        "title": "Corpo, movimento e distanza",
        "durationMinutes": 2,
        "paragraphs": [
          "Guarda l’intero cane: postura, distribuzione del peso, orientamento, velocità e possibilità di allontanarsi. Le distanze fanno parte della comunicazione. Un cane che si sposta può aver bisogno di spazio, anche se non abbaia.",
          "Osservare non significa mettere alla prova la tolleranza. Non bloccare le vie di uscita e non cercare un contatto per verificare la tua ipotesi. In caso di tensione interrompi l’interazione e crea distanza in sicurezza."
        ],
        "example": "Un ospite si china sul cane e lui arretra. Chiedere all’ospite di fermarsi e lasciarlo scegliere ti dà informazioni senza forzare l’incontro.",
        "tryThis": "Nel prossimo incontro tranquillo, nota chi si avvicina e chi sceglie di interrompere."
      },
      {
        "id": "marker-timing",
        "title": "Il momento del segnale",
        "durationMinutes": 2,
        "paragraphs": [
          "Un marker è un segnale breve, come una parola o un click, usato per indicare il comportamento che si vuole rinforzare. Per avere significato va prima associato a una conseguenza gradita; non è un richiamo né un ordine.",
          "Il laboratorio allena soltanto l’occhio e la mano, senza coinvolgere il cane. Segna quando il centro del punto attraversa la linea. La finestra di precisione è una regola di questo esercizio, non una misura della tua competenza cinofila."
        ],
        "example": "Vuoi indicare un istante preciso, ma premi quando il movimento è già finito. Il confronto tra il tuo click e l’attraversamento ti aiuta a riconoscere il ritardo.",
        "tryThis": "Prima osserva un passaggio senza cliccare, poi avvia un tentativo completo."
      }
    ],
    "activities": [
      {
        "id": "video-lab",
        "type": "video-lab",
        "title": "Laboratorio: cogli il momento",
        "summary": "Allena il timing su un filmato animato del portale, senza coinvolgere il cane.",
        "instructions": [
          "Avvia il video. Il punto attraversa quattro volte la linea verticale.",
          "Premi Segna il momento quando il centro del punto incontra la linea.",
          "Guarda il confronto, poi riprova: servono almeno tre centri e nessun click extra."
        ],
        "completionHint": "L’esercizio allena la precisione del gesto, non valuta abilità pratiche con il cane.",
        "videoSrc": "/media/impara/timing-linea-v1.mp4",
        "markerTargets": [
          2,
          5,
          8,
          11
        ],
        "markerToleranceMs": 350
      },
      {
        "id": "osservazione-neutra",
        "type": "reflection",
        "title": "Cinque frasi senza etichette",
        "summary": "Descrivi un cane per cinque frasi senza usare parole come dominante, aggressivo, testardo, felice o ansioso.",
        "instructions": [
          "Ho descritto il contesto o il caso usato.",
          "Ho distinto i fatti osservati dalle mie ipotesi.",
          "Ho indicato un passo concreto o una domanda da approfondire."
        ],
        "completionHint": "Compila i tre appunti e conferma le osservazioni. Se non hai ancora un cane, lavora sul caso della lezione e scrivilo nel quaderno.",
        "fields": [
          "Contesto: dove, quando e chi era presente",
          "Tre comportamenti descritti senza interpretazioni",
          "Una domanda che questa osservazione lascia aperta"
        ]
      }
    ],
    "quiz": [
      {
        "id": "q1",
        "prompt": "Quale frase è una descrizione osservabile?",
        "options": [
          "Il cane orienta il corpo frontalmente e riduce la distanza",
          "Il cane vuole sicuramente attaccare",
          "Il cane è dominante"
        ],
        "correctIndex": 0,
        "explanation": "Descrive ciò che accade senza assegnare automaticamente una motivazione."
      },
      {
        "id": "q2",
        "prompt": "A cosa serve il marker nell’esercizio?",
        "options": [
          "A sostituire l’osservazione",
          "A rendere il cane più eccitato",
          "A segnare un istante comportamentale scelto"
        ],
        "correctIndex": 2,
        "explanation": "Il marker allena la precisione del timing."
      },
      {
        "id": "q3",
        "prompt": "Come usi il laboratorio di timing?",
        "options": [
          "Per certificare la capacità di addestrare",
          "Per allenare occhio e mano senza coinvolgere il cane",
          "Per scegliere la razza migliore"
        ],
        "correctIndex": 1,
        "explanation": "Il filmato animato è un esercizio di precisione, non una valutazione pratica sul cane."
      },
      {
        "id": "caso-pratico",
        "prompt": "Un cane si allontana quando una persona allunga la mano. Quale nota è più utile?",
        "options": [
          "Non ama le persone",
          "È dominante",
          "Arretra di due passi quando la mano si avvicina"
        ],
        "correctIndex": 2,
        "explanation": "La terza frase descrive un evento osservabile. Lasciare spazio evita di forzare un contatto."
      }
    ],
    "sources": [
      {
        "label": "RSPCA · Linguaggio del corpo",
        "url": "https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour/understanding"
      },
      {
        "label": "Dogs Trust · Ricompense e timing",
        "url": "https://www.dogstrust.org.uk/dog-advice/training/techniques/positive-reinforcement-training-with-rewards"
      }
    ],
    "practiceMinutes": "3 minuti nel laboratorio e una breve osservazione",
    "caseStudy": {
      "title": "Una situazione da osservare",
      "text": "Un cane si allontana quando una persona allunga la mano. Quale nota è più utile? Puoi usare questo caso nel quaderno se non hai ancora un cane."
    }
  },
  {
    "slug": "routine-sicurezza-autonomia",
    "order": 3,
    "moduleId": "sicurezza-gestione",
    "moduleOrder": 2,
    "moduleTitle": "Vivere insieme",
    "title": "Routine, sicurezza e autonomia",
    "summary": "Una giornata leggibile deve contenere relazione, attività, recupero e la capacità di non dover seguire continuamente il proprietario.",
    "durationMinutes": 9,
    "objectives": [
      "Usare la routine come riferimento e non come rigidità.",
      "Individuare luoghi e momenti di recupero.",
      "Osservare dipendenza, autonomia e gestione delle assenze senza diagnosi fai-da-te."
    ],
    "sublessons": [
      {
        "id": "prevedibilita",
        "title": "Una giornata prevedibile, non rigida",
        "durationMinutes": 2,
        "paragraphs": [
          "Una routine aiuta a organizzare uscite, pasti, attività e riposo. Non richiede che ogni evento avvenga al minuto: costruisci abitudini comprensibili e compatibili con la vita reale.",
          "Considera anche le transizioni. Dopo una passeggiata o l’arrivo di ospiti può essere utile un momento più tranquillo. Prepara ciò che serve prima di una situazione impegnativa, invece di intervenire solo quando il cane è già in difficoltà."
        ],
        "example": "Prima di una visita predisponi acqua, un posto tranquillo e una separazione gestibile. Il cane non deve salutare ogni persona che entra.",
        "tryThis": "Scegli una transizione della giornata che puoi rendere più semplice."
      },
      {
        "id": "zona-recupero",
        "title": "Un ambiente sicuro",
        "durationMinutes": 2,
        "paragraphs": [
          "Controlla accessi, recinzioni, balconi, cavi, oggetti ingeribili e sostanze da tenere fuori portata. Gestire l’ambiente evita molte prove rischiose: non devi aspettare che il cane commetta un errore per intervenire.",
          "In presenza di bambini la supervisione attiva e la separazione quando un adulto non può seguire l’interazione restano essenziali. Il cane deve poter riposare e sottrarsi al contatto. Una zona tranquilla non è un luogo di punizione."
        ],
        "example": "Durante una telefonata non puoi seguire bambino e cane. Organizza spazi separati prima, invece di affidarti al fatto che finora siano andati d’accordo.",
        "tryThis": "Individua una situazione in cui oggi la sicurezza dipende soltanto dalla tua attenzione."
      },
      {
        "id": "autonomia-appartenenza",
        "title": "Imparare a stare soli, gradualmente",
        "durationMinutes": 2,
        "paragraphs": [
          "La solitudine si costruisce con passaggi piccoli e adatti al cane. Parti da distanze e durate che riesce a gestire tranquillamente; una tabella uguale per tutti non ti dice se sta davvero affrontando bene l’esperienza.",
          "Se osservi agitazione, vocalizzazioni persistenti o tentativi di fuga, non prolungare l’assenza per farlo abituare. Riduci la difficoltà e chiedi una valutazione professionale; coinvolgi il veterinario quando occorre escludere cause di salute."
        ],
        "example": "Il cane si agita già quando prendi le chiavi. Il punto di partenza non è lasciarlo solo per un’ora: serve un programma costruito sulle sue reazioni.",
        "tryThis": "Annota come reagisce alle normali separazioni che già conosce, senza crearne una più difficile."
      }
    ],
    "activities": [
      {
        "id": "mappa-routine",
        "type": "checklist",
        "title": "Mappa della routine",
        "summary": "Disegna cinque blocchi della giornata reale del cane.",
        "instructions": [
          "Ho descritto il contesto o il caso usato.",
          "Ho distinto i fatti osservati dalle mie ipotesi.",
          "Ho indicato un passo concreto o una domanda da approfondire."
        ],
        "completionHint": "Compila i tre appunti e conferma le osservazioni. Se non hai ancora un cane, lavora sul caso della lezione e scrivilo nel quaderno.",
        "fields": [
          "Una routine abituale e una transizione difficile",
          "Una misura per rendere sicuro l’ambiente",
          "Un piccolo cambiamento sostenibile"
        ]
      }
    ],
    "quiz": [
      {
        "id": "q1",
        "prompt": "Routine significa rigidità assoluta?",
        "options": [
          "Solo per un cucciolo",
          "Sì",
          "No"
        ],
        "correctIndex": 2,
        "explanation": "La prevedibilità può convivere con la varietà."
      },
      {
        "id": "q2",
        "prompt": "Un “punto di sicurezza” è necessariamente un kennel?",
        "options": [
          "Sì",
          "No",
          "Solo per cani grandi"
        ],
        "correctIndex": 1,
        "explanation": "Il concetto riguarda la funzione dello spazio, non un singolo oggetto obbligatorio."
      },
      {
        "id": "q3",
        "prompt": "Una forte difficoltà a restare soli va diagnosticata dal proprietario?",
        "options": [
          "No",
          "Solo dopo un video",
          "Sì"
        ],
        "correctIndex": 0,
        "explanation": "L’osservazione è utile, ma una diagnosi richiede competenze professionali."
      },
      {
        "id": "caso-pratico",
        "prompt": "Il cane si agita già quando prendi le chiavi. Come imposti il lavoro sulla solitudine?",
        "options": [
          "Lo lasci da solo più a lungo ogni giorno comunque",
          "Parti da passaggi che riesce a gestire e chiedi aiuto per adattarli",
          "Aspetti che smetta senza modificare nulla"
        ],
        "correctIndex": 1,
        "explanation": "La durata non è l’unico criterio: bisogna osservare la risposta e adattare il percorso."
      }
    ],
    "sources": [
      {
        "label": "Dogs Trust · Abituarsi alla solitudine",
        "url": "https://www.dogstrust.org.uk/dog-advice/training/home/time-alone"
      }
    ],
    "practiceMinutes": "15 minuti di osservazione, da distribuire nella giornata",
    "caseStudy": {
      "title": "Una situazione da osservare",
      "text": "Il cane si agita già quando prendi le chiavi. Come imposti il lavoro sulla solitudine? Puoi usare questo caso nel quaderno se non hai ancora un cane."
    }
  },
  {
    "slug": "spazi-risorse-prossemica",
    "order": 4,
    "moduleId": "sicurezza-gestione",
    "moduleOrder": 2,
    "moduleTitle": "Vivere insieme",
    "title": "Spazi, risorse e incontri",
    "summary": "Dove il cane si posiziona, come attraversa gli spazi e come vengono gestite le risorse cambia la vita quotidiana più di molte etichette.",
    "durationMinutes": 9,
    "objectives": [
      "Leggere l’uso dello spazio senza attribuire intenzioni automatiche.",
      "Ridurre conflitti ambientali attraverso organizzazione e prevenzione.",
      "Usare distanza e movimento come variabili osservabili."
    ],
    "sublessons": [
      {
        "id": "mappa-spazio",
        "title": "Leggere gli spazi di casa",
        "durationMinutes": 2,
        "paragraphs": [
          "Porte, corridoi stretti e passaggi obbligati possono rendere difficile allontanarsi. Osserva dove il cane si ferma, dove riposa e dove avvengono gli incontri. Una mappa semplice ti aiuta a vedere i punti affollati.",
          "Offri alternative pratiche. Più distanza tra un posto di riposo e una porta, oppure accessi separati per due animali, possono rendere la gestione più facile. Il cambiamento va osservato, non dato per risolutivo in automatico."
        ],
        "example": "Due cani devono attraversare lo stesso corridoio per raggiungere le ciotole. Puoi organizzare i pasti in spazi separati e tranquilli.",
        "tryThis": "Segna un passaggio obbligato e una possibile alternativa."
      },
      {
        "id": "risorse",
        "title": "Cibo, oggetti e tranquillità",
        "durationMinutes": 2,
        "paragraphs": [
          "Cibo, giochi e luoghi di riposo possono essere importanti per il cane. Non sottrarre oggetti o toccare la ciotola per provare che si fida di te. Prevenire conflitti e organizzare gli spazi è più utile che mettere alla prova la tolleranza.",
          "Se il cane si irrigidisce o ringhia quando qualcuno si avvicina a una risorsa, fermati e crea distanza. Evita confronti fisici e chiedi aiuto per un percorso individuale. Un esercizio online non è una procedura per gestire un rischio di morso."
        ],
        "example": "Il cane ha un masticativo e un bambino si avvicina. Intervieni sull’ambiente e sulla supervisione, non chiedendo al cane di sopportare la situazione.",
        "tryThis": "Elenca dove vengono consumati cibo e masticativi e chi può avvicinarsi."
      },
      {
        "id": "distanze",
        "title": "Lo spazio personale negli incontri",
        "durationMinutes": 2,
        "paragraphs": [
          "Prossemica significa, qui, osservare come viene usata la distanza. In un incontro conta anche se il cane può scegliere di avvicinarsi, fermarsi o allontanarsi. Non tutti desiderano contatto con ogni persona o cane.",
          "Puoi rifiutare un saluto e scegliere un tragitto più largo. Guinzaglio e attrezzatura vanno scelti e usati in modo adeguato al soggetto e alla situazione; da soli non insegnano a gestire un incontro."
        ],
        "example": "Sul marciapiede arriva un cane frontalmente. Se lo spazio è poco, puoi fermarti in una zona più ampia o cambiare lato in sicurezza.",
        "tryThis": "Pensa a una passeggiata abituale: dove puoi creare spazio senza fretta?"
      }
    ],
    "activities": [
      {
        "id": "mappa-casa",
        "type": "reflection",
        "title": "Disegna la mappa della casa",
        "summary": "Segna riposo, pasti, gioco, passaggi stretti, porte e luoghi di maggiore attivazione.",
        "instructions": [
          "Ho descritto il contesto o il caso usato.",
          "Ho distinto i fatti osservati dalle mie ipotesi.",
          "Ho indicato un passo concreto o una domanda da approfondire."
        ],
        "completionHint": "Compila i tre appunti e conferma le osservazioni. Se non hai ancora un cane, lavora sul caso della lezione e scrivilo nel quaderno.",
        "fields": [
          "Posti di riposo, risorse e passaggi della casa",
          "Un incontro o una situazione in cui manca spazio",
          "Una modifica pratica da proporre"
        ]
      }
    ],
    "quiz": [
      {
        "id": "q1",
        "prompt": "Il punto in cui il cane si posiziona permette da solo una diagnosi?",
        "options": [
          "Sì",
          "No",
          "Solo in casa"
        ],
        "correctIndex": 1,
        "explanation": "Serve sempre il contesto e una sequenza osservativa."
      },
      {
        "id": "q2",
        "prompt": "Gestire le risorse significa necessariamente privare il cane?",
        "options": [
          "No",
          "Solo per il gioco",
          "Sì"
        ],
        "correctIndex": 0,
        "explanation": "Gestione significa organizzazione e chiarezza, non privazione dei bisogni."
      },
      {
        "id": "q3",
        "prompt": "Quali variabili descrivono un avvicinamento?",
        "options": [
          "Solo la postura della coda",
          "Solo la distanza",
          "Traiettoria, velocità, ritmo e direzione"
        ],
        "correctIndex": 2,
        "explanation": "Il movimento va letto come insieme di componenti."
      },
      {
        "id": "caso-pratico",
        "prompt": "Un bambino vuole toccare il cane mentre mangia. Che cosa fai?",
        "options": [
          "Lo lasci fare per abituare il cane",
          "Togli la ciotola per provare la tolleranza",
          "Impedisci l’avvicinamento e organizzi uno spazio tranquillo"
        ],
        "correctIndex": 2,
        "explanation": "Sicurezza e prevenzione vengono prima di una prova di tolleranza. Non si provocano reazioni per valutarle."
      }
    ],
    "sources": [
      {
        "label": "RSPCA · Comportamento e gestione",
        "url": "https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour"
      }
    ],
    "practiceMinutes": "15 minuti di osservazione, da distribuire nella giornata",
    "caseStudy": {
      "title": "Una situazione da osservare",
      "text": "Un bambino vuole toccare il cane mentre mangia. Che cosa fai? Puoi usare questo caso nel quaderno se non hai ancora un cane."
    }
  },
  {
    "slug": "funzione-memoria-razza",
    "order": 5,
    "moduleId": "funzione-motivazione",
    "moduleOrder": 3,
    "moduleTitle": "Conoscere il tuo cane",
    "title": "Razze, funzioni e differenze individuali",
    "summary": "La razza non è un destino comportamentale, ma la funzione storica aiuta a capire quali motivazioni e gestioni meritano attenzione.",
    "durationMinutes": 9,
    "objectives": [
      "Collegare funzione storica e predisposizioni possibili.",
      "Separare aspettative di razza e osservazioni sul soggetto.",
      "Formulare domande utili prima di scegliere un cane o un’attività."
    ],
    "sublessons": [
      {
        "id": "funzione-storica",
        "title": "La storia di una razza è un punto di partenza",
        "durationMinutes": 2,
        "paragraphs": [
          "La selezione per attività diverse aiuta a capire alcune predisposizioni. Consultare funzione originaria e standard può orientare le domande, ma non descrive automaticamente ogni individuo.",
          "Anche esperienza, salute, ambiente e apprendimento contano. Se non conosci le origini del cane, parti da ciò che osservi. Non occorre attribuire una razza a un meticcio per costruire attività adatte a lui."
        ],
        "example": "Sai che una razza è stata selezionata per collaborare nel lavoro. Ti chiedi quali attività gradisca quel cane, senza presumere che debba praticare uno sport.",
        "tryThis": "Scrivi una predisposizione possibile e, separatamente, un comportamento realmente osservato."
      },
      {
        "id": "sequenza-predatoria",
        "title": "Osservare le attività preferite",
        "durationMinutes": 2,
        "paragraphs": [
          "Annusare, esplorare, inseguire o riportare sono azioni diverse. Nota quali il cane sceglie e in quali condizioni, senza organizzare prove su animali o persone per scoprire quanto siano forti.",
          "Una preferenza può diventare una proposta sicura: per esempio un’esplorazione tranquilla o una ricerca semplice con materiali appropriati. Non ogni attività intensa è utile in ogni momento. Chiedi aiuto per adattarla a capacità fisiche e gestione del cane."
        ],
        "example": "Il cane segue a lungo gli odori sul prato. Questa osservazione è più utile di definirlo pigro perché non vuole inseguire una pallina.",
        "tryThis": "Quale attività cerca spontaneamente quando l’ambiente è tranquillo?"
      },
      {
        "id": "dal-gruppo-al-soggetto",
        "title": "Dal gruppo al singolo cane",
        "durationMinutes": 2,
        "paragraphs": [
          "I gruppi FCI organizzano le razze, non sono classifiche di facilità o bravura. Due cani dello stesso gruppo possono richiedere organizzazioni molto diverse.",
          "Prima di scegliere un cane confronta tempo, spazi, risorse e aspettative della famiglia con i bisogni possibili del soggetto. Se il cane vive già con te, usa queste informazioni per formulare domande, non etichette definitive."
        ],
        "example": "Una foto ti attira, ma la funzione e le necessità della razza sollevano dubbi sulla tua routine. Approfondire prima della scelta evita aspettative sbagliate.",
        "tryThis": "Prepara una domanda da rivolgere a un allevatore, a un rifugio o a un professionista."
      }
    ],
    "activities": [
      {
        "id": "scheda-funzione",
        "type": "reflection",
        "title": "Dalla funzione alla gestione",
        "summary": "Scegli una razza che conosci e ricostruisci la sua funzione prima di descriverne il carattere.",
        "instructions": [
          "Ho descritto il contesto o il caso usato.",
          "Ho distinto i fatti osservati dalle mie ipotesi.",
          "Ho indicato un passo concreto o una domanda da approfondire."
        ],
        "completionHint": "Compila i tre appunti e conferma le osservazioni. Se non hai ancora un cane, lavora sul caso della lezione e scrivilo nel quaderno.",
        "fields": [
          "Funzione originaria nota, oppure origini non conosciute",
          "Preferenze realmente osservate nel singolo cane",
          "Una domanda da approfondire prima di scegliere attività"
        ]
      }
    ],
    "quiz": [
      {
        "id": "q1",
        "prompt": "La funzione storica permette di prevedere con certezza il singolo cane?",
        "options": [
          "No",
          "Solo se ha pedigree",
          "Sì"
        ],
        "correctIndex": 0,
        "explanation": "Aiuta a formulare domande, non a determinare il soggetto."
      },
      {
        "id": "q2",
        "prompt": "Il cane preferisce annusare invece di inseguire un gioco. Che cosa fai?",
        "options": [
          "Lo definisco pigro",
          "Osservo questa preferenza e valuto attività adatte",
          "Insisto finché cambia preferenza"
        ],
        "correctIndex": 1,
        "explanation": "Le preferenze osservate aiutano a scegliere proposte per quel soggetto."
      },
      {
        "id": "q3",
        "prompt": "Qual è il percorso corretto di approfondimento?",
        "options": [
          "Estetica → colore → taglia",
          "Gruppo/funzione → razza → selezione → soggetto",
          "Razza → stereotipo → scelta"
        ],
        "correctIndex": 1,
        "explanation": "La scelta diventa progressivamente più specifica."
      },
      {
        "id": "caso-pratico",
        "prompt": "Conosci il gruppo FCI di un cane. Che cosa puoi dedurne?",
        "options": [
          "Hai un contesto da approfondire, ma devi osservare il soggetto",
          "Sai già quale premio preferisce",
          "Puoi prevedere ogni suo comportamento"
        ],
        "correctIndex": 0,
        "explanation": "La funzione storica orienta le domande; non sostituisce la conoscenza del singolo cane."
      }
    ],
    "sources": [
      {
        "label": "FCI · Gruppi e standard di razza",
        "url": "https://www.fci.be/en/Nomenclature/"
      },
      {
        "label": "RSPCA · Razze e differenze individuali",
        "url": "https://www.rspca.org.uk/adviceandwelfare/pets/dogs/puppy/breeds"
      }
    ],
    "practiceMinutes": "15 minuti di osservazione, da distribuire nella giornata",
    "caseStudy": {
      "title": "Una situazione da osservare",
      "text": "Conosci il gruppo FCI di un cane. Che cosa puoi dedurne? Puoi usare questo caso nel quaderno se non hai ancora un cane."
    },
    "links": [
      {
        "label": "Prima di scegliere un cane",
        "path": "/prima-del-cane"
      },
      {
        "label": "Esplora i gruppi FCI",
        "path": "/gruppi-fci/1"
      }
    ]
  },
  {
    "slug": "gioco-lavoro-motivazione",
    "order": 6,
    "moduleId": "funzione-motivazione",
    "moduleOrder": 3,
    "moduleTitle": "Conoscere il tuo cane",
    "title": "Gioco, lavoro, motivazione e recupero",
    "summary": "Gioco, esplorazione e pause: scegli attività adatte al tuo cane e osserva come recupera.",
    "durationMinutes": 9,
    "objectives": [
      "Distinguere quantità e qualità dell’attività.",
      "Riconoscere il ruolo di motivazione e recupero.",
      "Evitare di usare il gioco come semplice scarico indiscriminato."
    ],
    "sublessons": [
      {
        "id": "qualita-attivita",
        "title": "Attività e qualità della giornata",
        "durationMinutes": 2,
        "paragraphs": [
          "Una buona proposta non si giudica solo da quanto il cane corre. Osserva interesse, possibilità di fare pause e comportamento successivo. Esplorazione e attività tranquille possono avere un posto accanto al movimento.",
          "Adatta durata e impegno alle condizioni del singolo cane. Dolore, zoppia o affaticamento insolito richiedono attenzione veterinaria, non una sfida a resistere. Non usare l’esercizio per sfinire il cane."
        ],
        "example": "Dopo molte rincorse il cane continua a cercare la pallina e fatica a fermarsi. Questo dato va considerato insieme all’entusiasmo durante il gioco.",
        "tryThis": "Registra il prima, il durante e il dopo di un’attività abituale."
      },
      {
        "id": "motivazione",
        "title": "Capire che cosa è motivante",
        "durationMinutes": 2,
        "paragraphs": [
          "Cibo, gioco, esplorazione o un’interazione possono avere valore diverso a seconda del cane e del momento. Un premio scelto da te non è automaticamente interessante per lui.",
          "Proponi alternative semplici in una situazione tranquilla e osserva la risposta. Se non partecipa, valuta ambiente, difficoltà, stanchezza e salute: non è necessario aumentare la pressione per ottenere coinvolgimento."
        ],
        "example": "A casa il cane gradisce un boccone, in una strada rumorosa non lo cerca. Il contesto è cambiato; non puoi dedurne da solo che il cane sia testardo.",
        "tryThis": "Quale ricompensa cerca spontaneamente in una situazione tranquilla?"
      },
      {
        "id": "arousal-recupero",
        "title": "Pause e recupero fanno parte del gioco",
        "durationMinutes": 2,
        "paragraphs": [
          "Alternare attività e pause permette di osservare come il cane passa da un momento all’altro. L’attivazione è il livello di prontezza del soggetto: “più” non significa sempre “meglio”.",
          "Scegli un’attività già conosciuta e facile, interrompi prima di arrivare alla fatica e lascia spazio al recupero. Per iniziare una disciplina sportiva cerca un professionista che valuti il binomio e costruisca un percorso graduale."
        ],
        "example": "Una sessione breve termina mentre il cane è ancora coinvolto. Annoti se riesce poi ad annusare, bere o riposare, senza chiedere altri esercizi.",
        "tryThis": "Quale pausa puoi inserire nella prossima attività senza renderla una prova più difficile?"
      }
    ],
    "activities": [
      {
        "id": "registro-attivita",
        "type": "checklist",
        "title": "Registro attività e recupero",
        "summary": "Confronta due attività diverse svolte in giorni differenti.",
        "instructions": [
          "Ho descritto il contesto o il caso usato.",
          "Ho distinto i fatti osservati dalle mie ipotesi.",
          "Ho indicato un passo concreto o una domanda da approfondire."
        ],
        "completionHint": "Compila i tre appunti e conferma le osservazioni. Se non hai ancora un cane, lavora sul caso della lezione e scrivilo nel quaderno.",
        "fields": [
          "Attività e comportamento prima di iniziare",
          "Come partecipa e quando fa una pausa",
          "Comportamento dopo e una modifica possibile"
        ]
      }
    ],
    "quiz": [
      {
        "id": "q1",
        "prompt": "Più attività significa sempre più benessere?",
        "options": [
          "Solo nei cani sportivi",
          "Sì",
          "No"
        ],
        "correctIndex": 2,
        "explanation": "Conta la qualità e il recupero, non solo la quantità."
      },
      {
        "id": "q2",
        "prompt": "La stessa attività produce sempre lo stesso effetto su tutti i cani?",
        "options": [
          "Sì",
          "No",
          "Solo se sono della stessa razza"
        ],
        "correctIndex": 1,
        "explanation": "Motivazione, esperienza e individuo cambiano la risposta."
      },
      {
        "id": "q3",
        "prompt": "Quando termina davvero una sessione?",
        "options": [
          "Quando consideri anche il ritorno alla calma e il recupero",
          "Quando il cane è esausto",
          "Quando metti via il gioco"
        ],
        "correctIndex": 0,
        "explanation": "Il recupero è parte della sessione."
      },
      {
        "id": "caso-pratico",
        "prompt": "Durante il gioco il cane partecipa molto, ma dopo fatica a fermarsi. Come valuti l’attività?",
        "options": [
          "È sempre perfetta se corre molto",
          "Consideri anche pause e recupero, adattando la proposta",
          "La prolunghi finché si esaurisce"
        ],
        "correctIndex": 1,
        "explanation": "Il comportamento successivo è parte dell’osservazione, insieme all’interesse durante l’attività."
      }
    ],
    "sources": [
      {
        "label": "Dogs Trust · Imparare a rilassarsi",
        "url": "https://www.dogstrust.org.uk/dog-advice/training/basics/settle-training"
      }
    ],
    "practiceMinutes": "15 minuti di osservazione, da distribuire nella giornata",
    "caseStudy": {
      "title": "Una situazione da osservare",
      "text": "Durante il gioco il cane partecipa molto, ma dopo fatica a fermarsi. Come valuti l’attività? Puoi usare questo caso nel quaderno se non hai ancora un cane."
    }
  },
  {
    "slug": "etogramma-relazione-lettura",
    "order": 7,
    "moduleId": "relazione-apprendimento",
    "moduleOrder": 4,
    "moduleTitle": "Costruire la relazione",
    "title": "Leggere il cane, costruire la relazione",
    "summary": "Leggere un cane significa integrare comportamento specie-specifico, storia individuale, ambiente e relazione senza ridurlo a un’etichetta.",
    "durationMinutes": 9,
    "objectives": [
      "Descrivere azioni, distanze e contesto.",
      "Confrontare situazioni senza provocare reazioni.",
      "Formulare un obiettivo quotidiano concreto."
    ],
    "sublessons": [
      {
        "id": "etogramma",
        "title": "Un vocabolario di comportamenti",
        "durationMinutes": 2,
        "paragraphs": [
          "Un etogramma è una descrizione organizzata di comportamenti osservabili. Per iniziare non serve un catalogo scientifico: usa pochi verbi concreti come guarda, annusa, si allontana, si ferma.",
          "Evita di assegnare un significato unico a ogni gesto. Descrivi postura, ambiente e sequenza degli eventi. “Scodinzola” da solo non basta a concludere che un incontro sia sicuro o desiderato."
        ],
        "example": "Scrivi “si ferma a due metri, guarda e poi torna indietro” invece di “è antipatico con gli altri cani”.",
        "tryThis": "Scegli tre verbi che userai nel tuo prossimo appunto."
      },
      {
        "id": "lettura-multipla",
        "title": "Confrontare contesti diversi",
        "durationMinutes": 2,
        "paragraphs": [
          "Osservare lo stesso cane in situazioni tranquille diverse ti aiuta a riconoscere variazioni. Confronta luogo, distanza, persone presenti e possibilità di scegliere, senza provocare una difficoltà per ottenere dati.",
          "Distingui osservazione e ipotesi anche nel quaderno. Un professionista può aiutarti a collegare i dati e a decidere quali altre informazioni servono. Le note non sono una diagnosi."
        ],
        "example": "Il cane accetta un contatto a casa ma si allontana al parco. Non è una contraddizione: descrivi le differenze tra i due contesti.",
        "tryThis": "Confronta due situazioni già avvenute, annotando anche ciò che non sai."
      },
      {
        "id": "relazione-termini",
        "title": "Una relazione fatta di scelte comprensibili",
        "durationMinutes": 2,
        "paragraphs": [
          "Una relazione si costruisce con esperienze ripetute: prevedibilità, attività adeguate, attenzione ai segnali e richieste comprensibili. Anche permettere di interrompere un contatto fornisce informazioni utili.",
          "Scegli obiettivi concreti e piccoli: preparare una passeggiata più tranquilla, riconoscere quando serve distanza, organizzare il riposo. Per progettare un percorso puoi rivolgerti a un professionista anche prima che esista un problema."
        ],
        "example": "Il tuo obiettivo passa da “deve obbedire sempre” a “voglio gestire meglio l’uscita di casa”. Ora puoi descrivere cosa accade e chiedere un aiuto preciso.",
        "tryThis": "Formula un obiettivo quotidiano osservabile per il vostro binomio."
      }
    ],
    "activities": [
      {
        "id": "osservazione-contesti",
        "type": "reflection",
        "title": "Lo stesso cane in tre contesti",
        "summary": "Osserva lo stesso soggetto in tre momenti o ambienti diversi.",
        "instructions": [
          "Ho descritto il contesto o il caso usato.",
          "Ho distinto i fatti osservati dalle mie ipotesi.",
          "Ho indicato un passo concreto o una domanda da approfondire."
        ],
        "completionHint": "Compila i tre appunti e conferma le osservazioni. Se non hai ancora un cane, lavora sul caso della lezione e scrivilo nel quaderno.",
        "fields": [
          "Contesto uno: azioni e distanze",
          "Contesto due: che cosa cambia",
          "Un obiettivo quotidiano e le informazioni mancanti"
        ]
      }
    ],
    "quiz": [
      {
        "id": "q1",
        "prompt": "A cosa serve l’etogramma in questa lezione?",
        "options": [
          "A dare un voto al cane",
          "A descrivere repertori comportamentali",
          "A scegliere la razza più intelligente"
        ],
        "correctIndex": 1,
        "explanation": "Serve a organizzare l’osservazione del comportamento."
      },
      {
        "id": "q2",
        "prompt": "Una sola osservazione basta per descrivere stabilmente un soggetto?",
        "options": [
          "No",
          "Solo se dura più di un’ora",
          "Sì"
        ],
        "correctIndex": 0,
        "explanation": "Contesti diversi possono mostrare risposte diverse."
      },
      {
        "id": "q3",
        "prompt": "Per capire il comportamento, quale confronto è più utile?",
        "options": [
          "Una foto isolata",
          "Solo quello che fa quando lo provoco",
          "Osservazioni in contesti tranquilli diversi"
        ],
        "correctIndex": 2,
        "explanation": "Si confrontano situazioni reali senza creare difficoltà apposta."
      },
      {
        "id": "caso-pratico",
        "prompt": "Quale obiettivo è più utile da discutere con un professionista?",
        "options": [
          "Deve essere perfetto",
          "Deve capire chi comanda",
          "Vorrei gestire meglio l’uscita di casa; ecco cosa accade"
        ],
        "correctIndex": 2,
        "explanation": "Un obiettivo concreto permette di raccogliere informazioni e costruire un percorso verificabile."
      }
    ],
    "sources": [
      {
        "label": "RSPCA · Capire il linguaggio del corpo",
        "url": "https://www.rspca.org.uk/adviceandwelfare/pets/dogs/behaviour/understanding"
      }
    ],
    "practiceMinutes": "15 minuti di osservazione, da distribuire nella giornata",
    "caseStudy": {
      "title": "Una situazione da osservare",
      "text": "Quale obiettivo è più utile da discutere con un professionista? Puoi usare questo caso nel quaderno se non hai ancora un cane."
    }
  },
  {
    "slug": "doti-apprendimento",
    "order": 8,
    "moduleId": "relazione-apprendimento",
    "moduleOrder": 4,
    "moduleTitle": "Costruire la relazione",
    "title": "Imparare insieme, un passo alla volta",
    "summary": "Comprendi come si impara, rispetta contatto e distanze e costruisci un piccolo piano per continuare insieme.",
    "durationMinutes": 9,
    "objectives": [
      "Descrivere il singolo cane senza etichette rigide.",
      "Comprendere rinforzo, contatto e uso dello spazio.",
      "Scegliere un prossimo passo per il binomio."
    ],
    "sublessons": [
      {
        "id": "doti-caratteriali",
        "title": "Conoscere il soggetto senza etichettarlo",
        "durationMinutes": 2,
        "paragraphs": [
          "Parole come sensibile o vivace possono essere utili solo se spieghi a quali comportamenti ti riferisci. Non sono voti sul cane e non decidono da sole quale attività possa affrontare.",
          "Descrivi in quali condizioni partecipa, interrompe o cerca distanza. Per qualsiasi percorso, quotidiano o sportivo, il punto di partenza è il singolo soggetto con la sua storia."
        ],
        "example": "Dire “si distrae con i rumori vicino alla strada” suggerisce una modifica dell’ambiente. Dire soltanto “non ha carattere” non indica cosa fare.",
        "tryThis": "Riscrivi una caratteristica del tuo cane come osservazione situata."
      },
      {
        "id": "predazione-preda",
        "title": "Come una conseguenza influenza il comportamento",
        "durationMinutes": 2,
        "paragraphs": [
          "Un rinforzo è una conseguenza che rende più probabile un comportamento. Non basta che tu chiami qualcosa premio: conta l’effetto nel tempo e se il cane lo gradisce in quella situazione.",
          "Per insegnare una piccola abilità prepara un ambiente semplice, rendi chiaro ciò che chiedi e premia tempestivamente la risposta desiderata. Aumenta la difficoltà gradualmente. Se il cane fatica, semplifica invece di ripetere la richiesta sempre più forte.",
          "Nel linguaggio tecnico, positivo significa aggiungere e negativo togliere uno stimolo; non sono giudizi morali. Rinforzo indica un aumento della probabilità del comportamento, punizione una sua riduzione. Sono definizioni degli effetti, non un invito a sperimentare interventi punitivi: questo percorso usa gestione, gradualità e ricompense."
        ],
        "example": "Vuoi lavorare su una risposta facile già conosciuta. Inizi in un posto tranquillo prima di aspettarti lo stesso risultato tra molti stimoli.",
        "tryThis": "Indica una difficoltà che puoi ridurre: durata, distanza o distrazioni."
      },
      {
        "id": "rinforzo-punizione",
        "title": "Contatto, spazio e comunicazione",
        "durationMinutes": 2,
        "paragraphs": [
          "Anche il contatto e la distanza fanno parte della comunicazione. Aptica indica lo studio del contatto; prossemica quello dell’uso dello spazio. Per iniziare osserva se il cane cerca un contatto, vi resta o preferisce allontanarsi.",
          "Una carezza non è sempre una ricompensa: dipende dal soggetto e dal momento. Lascia la possibilità di interrompere e non trattenere il cane per ottenere una risposta. Puoi imparare molto anche osservando senza intervenire."
        ],
        "example": "Il cane si avvicina, riceve una breve carezza e poi si sposta. Rispetti la pausa senza richiamarlo per continuare.",
        "tryThis": "Scrivi un esempio di contatto cercato dal cane e uno di distanza scelta."
      },
      {
        "id": "aptica-prossemica",
        "title": "Portare le basi nella vita reale",
        "durationMinutes": 2,
        "paragraphs": [
          "Alla fine del percorso hai strumenti per osservare, organizzare e porre domande migliori. Una verifica online misura la comprensione dei contenuti, non la capacità di gestire ogni cane o una qualifica professionale.",
          "Rileggi il quaderno, scegli un cambiamento sostenibile e un obiettivo per il mese successivo. Se vuoi iniziare uno sport, l’area Sport è un percorso separato; se cerchi aiuto quotidiano puoi trovare direttamente un addestratore."
        ],
        "example": "Porti a un professionista una descrizione concreta della giornata e due domande. L’incontro può partire dai fatti invece che da una lista di etichette.",
        "tryThis": "Scegli una cosa da mantenere, una da adattare e una domanda da approfondire."
      }
    ],
    "activities": [
      {
        "id": "glossario-personale",
        "type": "checklist",
        "title": "Glossario e piano personale",
        "summary": "Spiega i termini con parole tue e trasformali in un piccolo obiettivo per la vita insieme.",
        "instructions": [
          "Ho descritto il contesto o il caso usato.",
          "Ho distinto i fatti osservati dalle mie ipotesi.",
          "Ho indicato un passo concreto o una domanda da approfondire."
        ],
        "completionHint": "Compila i tre appunti e conferma le osservazioni. Se non hai ancora un cane, lavora sul caso della lezione e scrivilo nel quaderno.",
        "fields": [
          "Tre termini utili: marker, rinforzo e prossemica, con parole tue",
          "Un esempio pratico e una difficoltà da ridurre",
          "Un obiettivo e una domanda da portare a un professionista"
        ]
      }
    ],
    "quiz": [
      {
        "id": "q1",
        "prompt": "Come valuti se una conseguenza funziona da rinforzo?",
        "options": [
          "Dal fatto che io la chiamo premio",
          "Dal suo effetto sul comportamento nel tempo",
          "Dal costo del premio"
        ],
        "correctIndex": 1,
        "explanation": "La definizione riguarda l’effetto sulla probabilità del comportamento."
      },
      {
        "id": "q2",
        "prompt": "Il cane fatica in un esercizio. Quale modifica consideri?",
        "options": [
          "Semplificare durata, distanza o distrazioni",
          "Ripetere sempre più forte",
          "Chiedere subito una prova più lunga"
        ],
        "correctIndex": 0,
        "explanation": "Ridurre una difficoltà rende la richiesta più affrontabile e aiuta a capire cosa serve."
      },
      {
        "id": "q3",
        "prompt": "Qual è il rischio principale di un’etichetta caratteriale?",
        "options": [
          "Essere troppo lunga",
          "Sostituire l’osservazione concreta del soggetto",
          "Essere difficile da ricordare"
        ],
        "correctIndex": 1,
        "explanation": "Il termine deve aiutare l’osservazione, non sostituirla."
      },
      {
        "id": "caso-pratico",
        "prompt": "Hai completato lezioni e quiz. Che cosa dimostra questo risultato?",
        "options": [
          "Una qualifica da addestratore",
          "La comprensione di queste basi, da applicare con gradualità",
          "Che puoi gestire qualsiasi problema comportamentale"
        ],
        "correctIndex": 1,
        "explanation": "Il percorso è educativo e non rilascia qualifiche professionali o una valutazione pratica certificata."
      }
    ],
    "sources": [
      {
        "label": "RSPCA · Principi di educazione",
        "url": "https://www.rspca.org.uk/adviceandwelfare/pets/dogs/training"
      }
    ],
    "practiceMinutes": "15 minuti di osservazione, da distribuire nella giornata",
    "caseStudy": {
      "title": "Una situazione da osservare",
      "text": "Hai completato lezioni e quiz. Che cosa dimostra questo risultato? Puoi usare questo caso nel quaderno se non hai ancora un cane."
    },
    "links": [
      {
        "label": "Scopri gli sport cinofili",
        "path": "/sport"
      }
    ]
  }
];

export const getStage1Lesson = (slug: string) => STAGE_1_LESSONS.find(lesson => lesson.slug === slug);
export const getStage1LessonsForModule = (id: string) => STAGE_1_LESSONS.filter(lesson => lesson.moduleId === id);
