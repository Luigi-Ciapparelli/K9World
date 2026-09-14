export type JourneySource = 'home' | 'impara' | 'before-dog' | 'breed' | 'search';

export type JourneyContext = {
  source?: JourneySource;
  topic?: string;
  intent?: string;
};

const SOURCES = new Set<JourneySource>(['home', 'impara', 'before-dog', 'breed', 'search']);

function clean(value: string | null, maxLength = 80): string | undefined {
  const normalized = value?.trim().slice(0, maxLength);
  return normalized || undefined;
}

export function readJourneyContext(hash = window.location.hash): JourneyContext {
  const query = hash.includes('?') ? hash.split('?')[1] : '';
  const params = new URLSearchParams(query);
  const rawSource = clean(params.get('source'), 32);

  return {
    source: rawSource && SOURCES.has(rawSource as JourneySource)
      ? (rawSource as JourneySource)
      : undefined,
    topic: clean(params.get('topic')),
    intent: clean(params.get('intent')),
  };
}

export function hasJourneyContext(context: JourneyContext): boolean {
  return Boolean(context.source || context.topic || context.intent);
}

export function withJourneyContext(path: string, context: JourneyContext): string {
  const [base, rawQuery = ''] = path.split('?');
  const params = new URLSearchParams(rawQuery);

  if (context.source) params.set('source', context.source);
  if (context.topic) params.set('topic', context.topic);
  if (context.intent) params.set('intent', context.intent);

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function journeyPresentation(context: JourneyContext) {
  if (context.source === 'before-dog') {
    return {
      kicker: 'Continui da Prima del cane',
      title: 'Prima della scelta, porta il tuo quadro nel confronto con un professionista.',
      text:
        'Il profilo di compatibilità ti aiuta a fare domande migliori. Il professionista aggiunge esperienza, osservazione e conoscenza del singolo soggetto.',
    };
  }

  if (context.source === 'impara') {
    return {
      kicker: 'Continui da Impara',
      title: 'Quello che hai imparato ora può entrare nel lavoro sul binomio.',
      text:
        'Le basi ti aiutano a osservare e descrivere meglio ciò che accade. Il professionista trasforma queste informazioni in un percorso adatto a persona, cane e contesto.',
    };
  }

  if (context.source === 'breed') {
    return {
      kicker: 'Continui dall’approfondimento sulla razza',
      title: 'La razza orienta le domande. Il singolo cane richiede competenza.',
      text:
        'Funzione, selezione e caratteristiche di razza sono una lente: il confronto professionale serve a riportarle al soggetto e alla vita reale.',
    };
  }

  return {
    kicker: 'Il professionista è parte del percorso',
    title: 'Il professionista non è l’ultimo passo: è parte del percorso.',
    text:
      'PortaleCinofilo collega conoscenza, gestione del binomio e professionisti perché il lavoro non finisca in una singola prenotazione.',
  };
}
