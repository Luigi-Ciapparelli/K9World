import { ENCI_SECTIONS, ENCI_REGISTER_URL, ENCI_RULES_URL } from '../lib/trainerSpecializations';
import { RouteLink } from './RouteLink';
export function EnciTrainerGuide() {
  return <section className="im-panel my-8" aria-labelledby="enci-guide-title">
    <h2 id="enci-guide-title" className="text-2xl font-bold">Chi può aiutarti con il tuo cane?</h2>
    <p className="mt-3 leading-7">Per educazione, passeggiate e convivenza puoi cercare direttamente un addestratore o educatore nella tua zona. Racconta le vostre esigenze e chiedi come lavora: non occorre conoscere le categorie dei registri.</p>
    <RouteLink to="/search?type=trainer" className="im-link inline-flex mt-3 min-h-[44px] items-center">Trova aiuto per il cane</RouteLink>
    <details className="mt-4 rounded-xl border border-[var(--pc-line)] p-4">
      <summary className="cursor-pointer font-semibold">Capire le qualifiche ENCI e le specializzazioni</summary>
      <p className="mt-3 leading-7">Il Registro ENCI distingue tre sezioni per gli addestratori. Sono ambiti di iscrizione, non livelli in una graduatoria. Sul portale le attività offerte e le qualifiche sono informazioni separate.</p>
      <ul className="my-4 space-y-3">{ENCI_SECTIONS.map(section => <li key={section.id}><strong>Sezione {section.id} · {section.label}</strong><p className="mt-1 leading-6">{section.description}</p></li>)}</ul>
      <p className="leading-7">Un cane da caccia o da pastore può aver bisogno di educazione quotidiana: è l’obiettivo del percorso a guidare la ricerca, non la razza. Per una disciplina sportiva usa Sport cinofili. L’handler prepara e presenta il cane nelle esposizioni ed è una figura distinta, con un proprio registro.</p>
      <p className="mt-3 leading-7">Una qualifica inserita dal professionista resta dichiarata finché non viene verificata. Il completamento di queste lezioni non costituisce una qualifica ENCI.</p>
      <div className="mt-4 flex flex-wrap gap-4"><RouteLink to="/sport" className="underline min-h-[44px] inline-flex items-center">Sport cinofili</RouteLink><RouteLink to="/esposizioni?type=handler" className="underline min-h-[44px] inline-flex items-center">Cerca un handler</RouteLink></div>
      <p className="mt-4 text-sm">Fonti: <a className="underline" href={ENCI_RULES_URL} target="_blank" rel="noreferrer">Disciplinare ENCI, articoli 2 e 3</a> · <a className="underline" href={ENCI_REGISTER_URL} target="_blank" rel="noreferrer">Registro addestratori</a>. Consultati il 10 ottobre 2026.</p>
    </details>
  </section>;
}
