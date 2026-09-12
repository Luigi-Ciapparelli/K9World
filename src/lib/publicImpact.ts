export type PublicImpactMetric = {
  label: string;
  value: number;
  suffix?: string;
  description: string;
};

export type PublicImpactTestimonial = {
  quote: string;
  role: string;
  context?: string;
  verified: boolean;
};

// Regola: nessun dato o testimonial inventato.
// Finché non esistono prove reali sufficienti, ImpactProof non viene mostrato.
export const PUBLIC_IMPACT_METRICS: PublicImpactMetric[] = [];
export const PUBLIC_IMPACT_TESTIMONIALS: PublicImpactTestimonial[] = [];

export const MIN_PUBLIC_METRICS = 2;
export const MIN_PUBLIC_TESTIMONIALS = 1;
