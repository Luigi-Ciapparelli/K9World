import { useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Footprints, Search } from 'lucide-react';
import { RouteLink } from '../components/RouteLink';
import { findExercise } from '../lib/homeExercises';
import { exerciseIndex, exercisePath, practiceGroups, practicePath } from '../lib/practiceCatalog';
import { NotFoundPage } from './NotFoundPage';
import '../field-practice.css';

export function FieldPracticePage({slug}: {slug?:string}) {
  const [query,setQuery] = useState('');
  const [group,setGroup] = useState('');
  if (slug !== undefined) {
    const ex = findExercise(slug);
    if (!ex) return <NotFoundPage />;
    return <main className="field-practice"><div className="fp-wrap fp-reading">
      <RouteLink className="fp-back" to={practicePath}><ArrowLeft size={16}/> Tutti gli esercizi</RouteLink>
      <header className="fp-intro"><p className="fp-kicker">Dal campo a casa · {ex.group}</p><h1>{ex.title}</h1><p>{ex.aim}</p></header>
      <section className="fp-block"><h2>Prima di iniziare</h2><p>{ex.setup}</p>
      <h2>Come provare</h2><ol className="fp-steps">{ex.steps.map((s,i)=><li key={s}><span aria-hidden="true">{i+1}</span>{s}</li>)}</ol></section>
      <section className="fp-observe"><h2>Cosa osservare</h2><p>{ex.observe}</p></section>
      <div className="fp-block"><h2>Rendilo più facile</h2><p>{ex.easier}</p><h2>Quando fermarsi</h2><p>{ex.stop}</p></div>
      <p className="fp-foot">Hai ricevuto questo esercizio dopo una lezione? Segui il passo concordato con l’istruttore. Puoi raccontargli com’è andata in <RouteLink to="/owner/bookings">Prenotazioni → Messaggi</RouteLink>.</p>
      <RouteLink className="fp-back" to={practicePath}><ArrowLeft size={16}/> Torna al catalogo</RouteLink>
    </div></main>;
  }
  const normalize = (s:string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('it');
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  const matches = exerciseIndex.filter(ex=>(!group||ex.group===group)&&words.every(word=>normalize([ex.title,ex.aim,ex.group,ex.slug].join(' ')).includes(word)));
  return <main className="field-practice"><div className="fp-wrap">
    <RouteLink className="fp-back" to="/impara"><ArrowLeft size={16}/> Impara</RouteLink>
    <header className="fp-intro"><p className="fp-kicker">Quaderno pratico · PortaleCinofilo</p><h1>Dal campo a casa</h1><p>Scegli una cosa da provare nella vostra giornata. Ogni scheda spiega come iniziare, cosa osservare e quando fermarti.</p></header>
    <div className="fp-filters"><label><Search size={17}/> Cerca un esercizio<input type="search" value={query} placeholder="Ad esempio: guinzaglio" onChange={e=>setQuery(e.target.value)}/></label><label>Situazione<select value={group} onChange={e=>setGroup(e.target.value)}><option value="">Tutte le situazioni</option>{practiceGroups.map(g=><option key={g}>{g}</option>)}</select></label></div>
    <p className="fp-count" role="status">{matches.length} {matches.length===1?'scheda':'schede'}</p>
    {practiceGroups.map(g=>{const list=matches.filter(ex=>ex.group===g);return list.length>0&&<section className="fp-group" key={g}><h2>{g}</h2><div className="fp-grid">{list.map(ex=><RouteLink className="fp-card" to={exercisePath(ex.slug)} key={ex.slug}><h3>{ex.title}</h3><p>{ex.aim}</p><span>Apri la scheda <ArrowRight size={15}/></span></RouteLink>)}</div></section>;})}
    {!matches.length&&<button type="button" className="fp-action" onClick={()=>{setQuery('');setGroup('');}}>Mostra tutti gli esercizi</button>}
    <aside className="fp-foot"><Footprints size={18}/> Parti da un ambiente facile e da una richiesta già alla portata del cane. Per paura intensa, aggressioni o morsi già avvenuti chiedi un percorso individuale. <RouteLink to="/search?type=trainer">Trova un professionista</RouteLink>.</aside>
    <RouteLink className="fp-back" to="/impara"><BookOpen size={16}/> Le otto lezioni di base</RouteLink>
  </div></main>;
}
