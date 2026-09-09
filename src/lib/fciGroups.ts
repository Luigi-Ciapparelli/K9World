export type FciGroupContent = {
  group: number;
  intro: string;
  selection: string;
  needs: string[];
  management: string[];
  activities: string[];
};

export const FCI_GROUP_CONTENT: Record<number, FciGroupContent> = {
  1: {
    group: 1,
    intro:
      'Comprende principalmente cani selezionati per collaborare con l’uomo nella conduzione e nel controllo del bestiame.',
    selection:
      'La selezione per il lavoro a stretto contatto con il conduttore può favorire attenzione all’ambiente, disponibilità alla collaborazione e sensibilità ai movimenti.',
    needs: [
      'Attività mentale regolare',
      'Movimento adeguato al singolo individuo',
      'Possibilità di collaborare e svolgere compiti',
      'Riposo e capacità di staccare dall’attività',
    ],
    management: [
      'Evitare una stimolazione continua senza momenti di calma',
      'Premiare attenzione e collaborazione senza creare dipendenza costante dal proprietario',
      'Curare gradualmente l’esposizione a movimento, persone, animali e ambiente',
    ],
    activities: [
      'Ricerca olfattiva',
      'Problem solving',
      'Passeggiate esplorative',
      'Attività cooperative',
    ],
  },

  2: {
    group: 2,
    intro:
      'Riunisce Pinscher, Schnauzer, Molossoidi e Bovari Svizzeri: tipologie sviluppate storicamente per funzioni diverse, tra cui guardia, protezione, conduzione e collaborazione con l’uomo.',
    selection:
      'In alcuni soggetti possono emergere sicurezza, territorialità, forza fisica e una certa autonomia decisionale. La variabilità individuale rimane però molto ampia.',
    needs: [
      'Socializzazione ed esposizione graduale e di qualità',
      'Movimento compatibile con struttura fisica, età e salute',
      'Attività mentale senza eccessiva eccitazione',
      'Spazi e tempi adeguati per il riposo',
    ],
    management: [
      'Lavorare sulla gestione al guinzaglio fin dai primi mesi',
      'Non forzare interazioni sociali indesiderate',
      'Premiare comportamenti calmi e scelte appropriate',
      'Gestire responsabilmente forza fisica e ambiente',
    ],
    activities: [
      'Ricerca olfattiva',
      'Passeggiate strutturate ed esplorative',
      'Esercizi di autocontrollo',
      'Attività cooperative con il proprietario',
    ],
  },

  3: {
    group: 3,
    intro:
      'I Terrier sono stati selezionati in gran parte per affrontare piccoli animali e lavorare con determinazione anche in condizioni difficili.',
    selection:
      'La storia funzionale del gruppo può essere associata a tenacia, rapidità di attivazione, curiosità e forte interesse verso movimento e ambiente.',
    needs: [
      'Esplorazione',
      'Attività olfattiva',
      'Possibilità di utilizzare iniziativa e problem solving',
      'Movimento e gioco adeguati',
    ],
    management: [
      'Non interpretare l’indipendenza come disobbedienza',
      'Allenare richiamo e gestione dell’impulso progressivamente',
      'Fornire alternative appropriate all’inseguimento',
    ],
    activities: [
      'Ricerca',
      'Problem solving',
      'Giochi di fiuto',
      'Passeggiate in ambienti vari',
    ],
  },

  4: {
    group: 4,
    intro:
      'Il gruppo comprende i Bassotti, cani selezionati storicamente per il lavoro venatorio anche in tana.',
    selection:
      'Determinazione, interesse olfattivo e autonomia possono essere caratteristiche frequenti, pur con importanti differenze individuali.',
    needs: [
      'Esplorazione olfattiva',
      'Movimento regolare',
      'Attività mentale',
      'Gestione attenta della particolare struttura corporea',
    ],
    management: [
      'Evitare sovrappeso',
      'Prestare attenzione ad attività eccessivamente traumatiche per la colonna',
      'Allenare richiamo e collaborazione con gradualità',
    ],
    activities: [
      'Ricerca olfattiva',
      'Passeggiate esplorative',
      'Problem solving',
      'Attività cooperative a basso impatto',
    ],
  },

  5: {
    group: 5,
    intro:
      'Comprende Spitz e cani di tipo primitivo, con storie selettive molto diverse tra loro e spesso una maggiore autonomia rispetto ad altri gruppi.',
    selection:
      'In alcuni soggetti possono essere evidenti indipendenza, attenzione all’ambiente, comunicazione marcata e forte motivazione esplorativa.',
    needs: [
      'Esplorazione',
      'Possibilità di scelta controllata',
      'Attività olfattiva',
      'Relazione basata sulla collaborazione',
    ],
    management: [
      'Non basare la relazione solo sull’obbedienza formale',
      'Curare particolarmente richiamo e sicurezza in libertà',
      'Rispettare segnali comunicativi e distanze individuali',
    ],
    activities: [
      'Escursioni',
      'Ricerca olfattiva',
      'Problem solving',
      'Attività esplorative',
    ],
  },

  6: {
    group: 6,
    intro:
      'Comprende segugi e cani da pista di sangue, selezionati soprattutto per seguire tracce attraverso l’olfatto.',
    selection:
      'L’interesse per gli odori può essere estremamente rilevante e, durante una traccia, l’ambiente può diventare più importante del proprietario.',
    needs: [
      'Uso dell’olfatto',
      'Esplorazione',
      'Movimento regolare',
      'Possibilità di seguire tracce in contesti sicuri',
    ],
    management: [
      'Non aspettarsi attenzione costante durante l’esplorazione',
      'Costruire il richiamo senza punire l’interesse ambientale',
      'Utilizzare longhina quando la libertà non è sicura',
    ],
    activities: [
      'Mantrailing ludico',
      'Ricerca olfattiva',
      'Passeggiate esplorative',
      'Piste semplici',
    ],
  },

  7: {
    group: 7,
    intro:
      'I cani da ferma sono stati selezionati per individuare la selvaggina e collaborare con il conduttore durante l’attività venatoria.',
    selection:
      'Possono presentare elevato interesse ambientale, resistenza, motivazione olfattiva e propensione alla ricerca.',
    needs: [
      'Movimento',
      'Esplorazione olfattiva',
      'Attività di ricerca',
      'Collaborazione con il proprietario',
    ],
    management: [
      'Offrire attività che non siano soltanto passeggiate brevi al guinzaglio',
      'Lavorare sul richiamo in modo progressivo',
      'Bilanciare attività fisica con lavoro mentale e riposo',
    ],
    activities: [
      'Ricerca olfattiva',
      'Escursioni',
      'Piste',
      'Attività cooperative',
    ],
  },

  8: {
    group: 8,
    intro:
      'Comprende Retriever, cani da cerca e cani da acqua, selezionati per cooperare strettamente con l’uomo nel recupero e nella ricerca.',
    selection:
      'Collaborazione, interesse per il trasporto di oggetti, ricerca e spesso attrazione per l’acqua possono essere frequenti.',
    needs: [
      'Interazione sociale equilibrata',
      'Ricerca e riporto',
      'Movimento',
      'Attività mentale',
    ],
    management: [
      'Non confondere socievolezza con necessità di salutare chiunque',
      'Insegnare calma e gestione dell’eccitazione',
      'Usare riporto e ricerca in maniera strutturata',
    ],
    activities: [
      'Riporto',
      'Ricerca olfattiva',
      'Nuoto quando appropriato',
      'Problem solving',
    ],
  },

  9: {
    group: 9,
    intro:
      'Comprende numerose razze selezionate principalmente per la compagnia, con caratteristiche fisiche e comportamentali molto eterogenee.',
    selection:
      'La vicinanza sociale all’uomo può essere particolarmente importante, ma ogni razza e ogni individuo presentano esigenze proprie.',
    needs: [
      'Relazione sociale',
      'Passeggiate ed esplorazione',
      'Attività mentale',
      'Riposo e autonomia',
    ],
    management: [
      'Non considerare un cane piccolo come privo di bisogni comportamentali',
      'Evitare di sostituire sempre il movimento con il trasporto in braccio',
      'Favorire autonomia e competenze',
    ],
    activities: [
      'Passeggiate esplorative',
      'Ricerca olfattiva',
      'Problem solving',
      'Apprendimento cooperativo',
    ],
  },

  10: {
    group: 10,
    intro:
      'I Levrieri sono stati selezionati principalmente per l’inseguimento a vista e presentano una struttura fisica fortemente specializzata.',
    selection:
      'La sensibilità al movimento e la motivazione all’inseguimento possono essere particolarmente rilevanti in alcuni soggetti.',
    needs: [
      'Possibilità di correre in sicurezza',
      'Riposo adeguato',
      'Esplorazione',
      'Gestione rispettosa della sensibilità individuale',
    ],
    management: [
      'Valutare attentamente la libertà in presenza di possibili stimoli di inseguimento',
      'Utilizzare aree sicure per la corsa',
      'Non confondere tranquillità domestica con assenza di bisogni',
    ],
    activities: [
      'Corsa in aree sicure',
      'Passeggiate esplorative',
      'Ricerca olfattiva',
      'Attività cooperative',
    ],
  },
};
