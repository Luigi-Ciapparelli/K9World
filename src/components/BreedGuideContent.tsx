import { ArrowRight, ExternalLink } from 'lucide-react';
import type { BreedGuide } from '../lib/breedGuides';
import { RouteLink } from './RouteLink';

export function BreedGuideContent({ guide, name }: { guide: BreedGuide; name: string }) {
  return <article className="mt-6 space-y-6" aria-label={`Conoscere ${name}`}>
    <section className="rounded-3xl border border-stone-200 bg-white p-7 md:p-8" aria-labelledby="breed-history">
      <p className="text-sm font-semibold text-emerald-700">Conoscere la razza</p>
      <h2 id="breed-history" className="mt-1 text-2xl font-bold text-stone-900">La storia aiuta a fare le domande giuste</h2>
      <dl className="my-6 grid gap-4 border-y border-stone-200 py-5 sm:grid-cols-3">
        {[['Origine',guide.origin],['Funzione nello standard',guide.function],['Standard FCI',`N. ${guide.standard}`]].map(([label,value])=><div key={label}><dt className="text-sm text-stone-500">{label}</dt><dd className="mt-1 font-semibold text-stone-900">{value}</dd></div>)}
      </dl>
      <div className="max-w-3xl space-y-4 leading-relaxed text-stone-700"><p>{guide.history}</p><p>{guide.standardSummary}</p></div>
      <a className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-800 underline underline-offset-4" href={guide.sources[1].url} target="_blank" rel="noreferrer">Leggi lo standard FCI<ExternalLink size={15}/></a>
    </section>
    <section className="rounded-3xl border border-stone-200 bg-white p-7 md:p-8" aria-labelledby="breed-everyday">
      <p className="text-sm font-semibold text-emerald-700">Dalla razza al singolo cane</p>
      <h2 id="breed-everyday" className="mt-1 text-2xl font-bold text-stone-900">Immagina la vostra giornata</h2>
      <p className="mt-3 max-w-3xl text-sm leading-relaxed text-stone-600">Spunti di PortaleCinofilo per preparare il confronto con chi conosce il cane. Non sono regole di comportamento valide per tutti i soggetti.</p>
      <div className="mt-6 divide-y divide-stone-200">{guide.everyday.map((item,i)=><div key={item.title} className="grid gap-3 py-5 first:pt-0 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:gap-8"><h3 className="font-bold text-stone-900"><span className="mr-2 text-emerald-700">0{i+1}</span>{item.title}</h3><p className="leading-relaxed text-stone-700">{item.text}</p></div>)}</div>
      <p className="mt-2 border-l-4 border-emerald-600 bg-emerald-50 p-4 leading-relaxed text-stone-800">{guide.takeaway}</p>
    </section>
    <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-7 md:p-8" aria-labelledby="breed-next">
      <h2 id="breed-next" className="text-2xl font-bold text-stone-900">Un passo utile prima di decidere</h2>
      <p className="mt-3 leading-relaxed text-stone-700">Approfondisci gratuitamente gli argomenti collegati, valuta la tua giornata o confrontati con un addestratore nella tua zona. Puoi partire dal punto che ti serve.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">{guide.lessons.map(lesson=><RouteLink key={lesson.slug} to={`/impara/stage-1/${lesson.slug}`} className="inline-flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-white p-4 font-semibold text-emerald-900 hover:bg-emerald-100">{lesson.label}<ArrowRight className="shrink-0" size={18}/></RouteLink>)}</div>
      <div className="mt-5 flex flex-wrap gap-3"><RouteLink to="/prima-del-cane" className="rounded-xl border border-emerald-700 px-5 py-3 font-semibold text-emerald-800">Valuta la scelta del cane</RouteLink><RouteLink to="/search?type=trainer" className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800">Trova un addestratore</RouteLink></div>
    </section>
  </article>;
}
