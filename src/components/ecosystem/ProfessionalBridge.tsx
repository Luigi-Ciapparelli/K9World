import { ArrowRight, Search } from 'lucide-react';
import { useRouter } from '../../lib/RouterContext';
import {
  hasJourneyContext,
  journeyPresentation,
  type JourneyContext,
  type JourneySource,
  withJourneyContext,
} from '../../lib/journeyContext';

type ProfessionalBridgeProps = {
  source: JourneySource;
  topic?: string;
  title?: string;
  text?: string;
  cta?: string;
  className?: string;
};

export function ProfessionalBridge({
  source,
  topic,
  title = 'Quello che impari diventa più utile quando entra nel lavoro sul binomio.',
  text = 'Le informazioni ti aiutano a osservare e fare domande migliori. Il professionista porta esperienza, metodo e continuità nel percorso con il singolo cane.',
  cta = 'Trova un professionista',
  className = '',
}: ProfessionalBridgeProps) {
  const { navigate } = useRouter();

  const goToSearch = () => {
    navigate(
      withJourneyContext('/search', {
        source,
        topic,
        intent: 'professional-support',
      })
    );
  };

  return (
    <section className={`pc-card overflow-hidden ${className}`.trim()}>
      <div className="grid lg:grid-cols-[1fr_auto] gap-6 items-center p-6 md:p-8">
        <div className="max-w-3xl">
          <p className="pc-kicker">Dal sapere alla pratica</p>
          <h2 className="pc-display text-2xl md:text-3xl font-semibold text-[var(--pc-ink-950)] mt-2">
            {title}
          </h2>
          <p className="text-[var(--pc-muted-600)] leading-7 mt-3">{text}</p>
        </div>
        <button type="button" onClick={goToSearch} className="pc-btn pc-btn-primary shrink-0">
          <Search className="w-4 h-4" />
          {cta}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
      <div className="border-t border-[var(--pc-line)] bg-[var(--pc-forest-100)] px-6 md:px-8 py-3 text-sm font-semibold text-[var(--pc-forest-900)]">
        osserva → comprendi → confrontati → lavora sul binomio → continua
      </div>
    </section>
  );
}

export function JourneyContextNotice({
  context,
  className = '',
}: {
  context: JourneyContext;
  className?: string;
}) {
  if (!hasJourneyContext(context)) return null;

  const presentation = journeyPresentation(context);

  return (
    <section
      className={`pc-evidence-surface border border-[#cedde1] rounded-[var(--pc-radius-lg)] p-5 md:p-6 ${className}`.trim()}
    >
      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--pc-evidence-700)]">
        {presentation.kicker}
      </p>
      <h2 className="pc-display text-2xl md:text-3xl font-semibold text-[var(--pc-ink-950)] mt-2">
        {presentation.title}
      </h2>
      <p className="text-[var(--pc-muted-600)] leading-7 mt-3 max-w-3xl">
        {presentation.text}
      </p>
    </section>
  );
}
