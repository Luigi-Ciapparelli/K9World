export type LessonSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type ImparaLesson = {
  slug: string;
  order: number;
  title: string;
  summary: string;
  durationMinutes: number;
  objectives: string[];
  sections: LessonSection[];
  reflection: string;
};

export const STAGE_1_LESSONS: ImparaLesson[] = [
  {
    slug: 'bisogni-di-base',
    order: 1,
    title: 'Bisogni di base: partire da ciò che serve davvero',
    summary:
      'Prima dell’educazione vengono le condizioni che permettono al cane di stare bene: risorse fisiologiche, riposo e gestione coerente.',
    durationMinutes: 8,
    objectives: [
      'Distinguere i bisogni essenziali dalle preferenze del proprietario.',
      'Osservare se alimentazione, acqua e riposo sono realmente accessibili e adeguati.',
      'Leggere la giornata del cane come un insieme di bisogni da bilanciare.',
    ],
    sections: [
      {
        title: 'La base viene prima della prestazione',
        paragraphs: [
          'Negli appunti del corso ENCI 2024 i bisogni vengono affrontati partendo dagli elementi fisiologici: alimentazione, acqua, sonno e riposo.',
          'Il principio didattico di PawConnect è semplice: prima di interpretare un comportamento come disobbedienza o problema, bisogna chiedersi se il cane dispone delle condizioni di base necessarie per stare bene.',
        ],
      },
      {
        title: 'Fame e sete',
        bullets: [
          'L’alimentazione deve essere adeguata al singolo cane e alla sua situazione.',
          'L’acqua deve essere disponibile in modo regolare e sicuro.',
          'Gestire le risorse non significa privare il cane dei bisogni essenziali.',
        ],
      },
      {
        title: 'Guardare la giornata nel suo insieme',
        paragraphs: [
          'Mangiare, bere, riposare, muoversi e avere momenti di interazione non sono elementi separati. La qualità della gestione nasce dal loro equilibrio nella vita reale del cane.',
          'Questa lezione non propone una formula universale: costruisce una prima checklist osservativa.',
        ],
      },
    ],
    reflection:
      'Per un giorno osserva senza correggere nulla: quali bisogni del tuo cane sono soddisfatti con regolarità e quali dipendono troppo dal caso?',
  },
  {
    slug: 'sonno-e-riposo',
    order: 2,
    title: 'Sonno e riposo: creare le condizioni per staccare',
    summary:
      'Riposo non significa soltanto non fare attività: il cane deve poter dormire e recuperare senza essere continuamente richiamato dagli stimoli.',
    durationMinutes: 9,
    objectives: [
      'Distinguere inattività da riposo effettivo.',
      'Individuare le principali interruzioni del sonno nella vita quotidiana.',
      'Valutare se il cane dispone di una zona realmente tranquilla.',
    ],
    sections: [
      {
        title: 'Dormire deve essere possibile',
        paragraphs: [
          'Il materiale del corso insiste sul fatto che il sonno debba essere un riposo profondo e indisturbato.',
          'Un cane sdraiato ma costantemente impegnato a monitorare porte, campanello, persone e movimenti non sta necessariamente recuperando come un cane che riesce davvero a staccare.',
        ],
      },
      {
        title: 'Il luogo conta',
        bullets: [
          'La zona di riposo dovrebbe essere protetta dalle interruzioni continue.',
          'Non dovrebbe essere scelta soltanto per comodità umana o estetica.',
          'Bisogna osservare dove il cane riesce spontaneamente ad abbassare l’attivazione.',
        ],
      },
      {
        title: 'Osservare prima di etichettare',
        paragraphs: [
          'Negli appunti, scarso riposo e iperattivazione vengono messi in relazione. In PawConnect questo viene trattato come punto di osservazione e non come diagnosi automatica.',
          'Se un cane appare costantemente agitato, una delle domande da porsi è quindi: quando e dove riesce davvero a dormire?',
        ],
      },
    ],
    reflection:
      'Segna per una giornata quante volte il tuo cane viene interrotto mentre riposa: persone, rumori, porte, altri animali o richieste di interazione.',
  },
  {
    slug: 'routine-e-sicurezza',
    order: 3,
    title: 'Routine e sicurezza: rendere la giornata comprensibile',
    summary:
      'Prevedibilità non significa rigidità assoluta. Significa dare al cane riferimenti leggibili tra attività, riposo, interazione e autonomia.',
    durationMinutes: 11,
    objectives: [
      'Capire la funzione della prevedibilità nella gestione quotidiana.',
      'Separare i momenti di attività dai momenti di recupero.',
      'Riconoscere quando la routine aiuta e quando diventa eccessivamente rigida.',
    ],
    sections: [
      {
        title: 'Una giornata leggibile',
        paragraphs: [
          'Negli appunti del corso la routine è presentata come uno strumento di sicurezza: il cane dovrebbe poter riconoscere momenti di attività, alimentazione, gioco, riposo e autonomia.',
          'Per PawConnect il concetto centrale non sarà fare tutto alla stessa ora, ma evitare che la giornata sia completamente imprevedibile.',
        ],
      },
      {
        title: 'Prevedibilità non è monotonia',
        bullets: [
          'Una struttura di base può restare riconoscibile anche variando attività e contesti.',
          'La varietà può evitare una routine povera o eccessivamente ripetitiva.',
          'Il cane deve poter incontrare anche momenti in cui non succede nulla e non gli viene richiesto di partecipare.',
        ],
      },
      {
        title: 'Sicurezza e autonomia',
        paragraphs: [
          'Il materiale collega la sicurezza anche alla capacità del cane di stare in uno spazio tranquillo senza dover seguire continuamente il proprietario.',
          'Questo tema diventerà un modulo specifico su relazione, distanza comunicativa e gestione degli spazi. Qui ci interessa il principio: una buona routine contiene sia relazione sia possibilità di riposo autonomo.',
        ],
      },
    ],
    reflection:
      'Descrivi la giornata del tuo cane in cinque blocchi: risveglio, attività, riposo, seconda attività, notte. Quanto è leggibile e quanto cambia senza motivo?',
  },
];

export function getStage1Lesson(slug: string) {
  return STAGE_1_LESSONS.find((lesson) => lesson.slug === slug) || null;
}
