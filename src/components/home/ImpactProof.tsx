import { BarChart3, CheckCircle2, MessageSquareQuote } from 'lucide-react';
import {
  MIN_PUBLIC_METRICS,
  MIN_PUBLIC_TESTIMONIALS,
  PUBLIC_IMPACT_METRICS,
  PUBLIC_IMPACT_TESTIMONIALS,
} from '../../lib/publicImpact';

export function ImpactProof() {
  const verifiedTestimonials = PUBLIC_IMPACT_TESTIMONIALS.filter(
    (item) => item.verified
  );

  const hasMetrics = PUBLIC_IMPACT_METRICS.length >= MIN_PUBLIC_METRICS;
  const hasTestimonials =
    verifiedTestimonials.length >= MIN_PUBLIC_TESTIMONIALS;

  if (!hasMetrics && !hasTestimonials) return null;

  return (
    <section className="border-t border-[var(--pc-line)] bg-[var(--pc-paper)]">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="max-w-3xl">
          <p className="pc-kicker">PortaleCinofilo in pratica</p>
          <h2 className="pc-display text-4xl md:text-5xl font-semibold mt-3">
            Non contiamo visite. Contiamo cose utili.
          </h2>
          <p className="pc-lead mt-5">
            Qui mostriamo soltanto prove reali: attività completate,
            verifiche superate, richieste pertinenti e testimonianze autentiche.
          </p>
        </div>

        {hasMetrics && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {PUBLIC_IMPACT_METRICS.map((metric) => (
              <div key={metric.label} className="pc-card p-5 md:p-6">
                <div className="flex items-center gap-2 text-[var(--pc-evidence-700)]">
                  <BarChart3 className="w-4 h-4" />
                  <span className="text-xs font-extrabold uppercase tracking-[0.12em]">
                    {metric.label}
                  </span>
                </div>
                <div className="pc-display text-4xl font-semibold mt-4">
                  {metric.value.toLocaleString('it-IT')}{metric.suffix || ''}
                </div>
                <p className="text-sm text-[var(--pc-muted-600)] leading-6 mt-3">
                  {metric.description}
                </p>
              </div>
            ))}
          </div>
        )}

        {hasTestimonials && (
          <div className="mt-10 grid lg:grid-cols-2 gap-4">
            {verifiedTestimonials.slice(0, 4).map((item, index) => (
              <figure key={item.role + index} className="pc-card p-6 md:p-7">
                <MessageSquareQuote className="w-5 h-5 text-[var(--pc-forest-700)]" />
                <blockquote className="pc-display text-2xl leading-snug mt-5">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[var(--pc-forest-700)] mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <div className="font-bold">{item.role}</div>
                    {item.context && (
                      <div className="text-[var(--pc-muted-600)] mt-1">
                        {item.context}
                      </div>
                    )}
                    <div className="text-xs text-[var(--pc-forest-700)] font-bold mt-2">
                      Testimonianza verificata
                    </div>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
