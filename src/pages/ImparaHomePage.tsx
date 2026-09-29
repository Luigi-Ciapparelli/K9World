import { useRef, useState } from 'react';
import { ArrowRight, BookOpen, Check, Clock3, Download, Leaf, NotebookPen, Search, Target, Upload } from 'lucide-react';
import { STAGE_1_LESSONS, STAGE_1_MODULES } from '../lib/imparaContent';
import { downloadText, emptyProgress, lessonStatus, normalizeProgress, notebookText } from '../lib/imparaProgress';
import { useImparaProgress } from '../lib/useImparaProgress';
import { RouteLink } from '../components/RouteLink';
import { useRouter } from '../lib/RouterContext';
import '../impara.css';

export function ImparaHomePage() {
  const { navigate } = useRouter();
  const { progress, update, saved } = useImparaProgress();
  const [search,setSearch] = useState('');
  const [message,setMessage] = useState('');
  const [reset,setReset] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  const complete = STAGE_1_LESSONS.filter(l=>lessonStatus(l,progress).complete).length;
  const started = STAGE_1_LESSONS.some(l=>lessonStatus(l,progress).started);
  const resumed = STAGE_1_LESSONS.find(l=>l.slug===progress.resume && !lessonStatus(l,progress).complete);
  const next = resumed || STAGE_1_LESSONS.find(l=>!lessonStatus(l,progress).complete) || STAGE_1_LESSONS[0];
  const go = (slug: string) => navigate(`/impara/stage-1/${slug}`);
  const query = search.trim().toLocaleLowerCase('it');
  const matches = STAGE_1_LESSONS.filter(l=>[l.title,l.summary,l.moduleTitle,...l.objectives,...l.sublessons.map(s=>s.title)].join(' ').toLocaleLowerCase('it').includes(query));
  const restore = async (file: File) => {
    if (file.size > 1_000_000) {setMessage('Il file è troppo grande. Seleziona un backup del percorso.');return;}
    try { const value=JSON.parse(await file.text()); if(value?.format!=='portalecinofilo-impara-backup' || value.progress?.version!==3) throw new Error();
      if(!window.confirm('Importare il backup? Sostituirà progressi e appunti di questo browser.')) return;
      update(()=>normalizeProgress(value.progress));setMessage('Backup importato. Puoi riprendere il percorso.');
    } catch {setMessage('File non riconosciuto. Usa un backup esportato da questa sezione.');}
  };
  return <main className="impara im-home">
    <div className="im-wrap">
      <header className="im-hero">
        <div>
          <p className="im-eyebrow"><Leaf size={15}/> IMPARA · PORTALECINOFILO</p>
          <h1>Vivere meglio insieme<br/>{' '}<em>si impara.</em></h1>
          <p className="im-lead">Comprendi i bisogni del cane, osserva quello che ti comunica e porta una cosa utile nella vostra giornata. Un passo alla volta.</p>
          <div className="im-actions"><button className="im-button" onClick={()=>go(next.slug)}>{complete===STAGE_1_LESSONS.length ? 'Rileggi il percorso' : started ? 'Riprendi il percorso' : 'Inizia dalle basi'}<ArrowRight size={18}/></button><button className="im-link" onClick={()=>document.getElementById('im-programma')?.scrollIntoView({behavior:'smooth'})}>Esplora le lezioni ↓</button></div>
          <p className="im-small im-benefits">Gratuito · Senza iscrizione · Anche prima di avere un cane</p>
        </div>
        <aside className="im-course-card" aria-label="Il tuo percorso">
          <div className="im-card-top"><span className="im-eyebrow">IL TUO PERCORSO</span><BookOpen size={24}/></div>
          <h2>Le fondamenta<br/>della relazione.</h2>
          <div className="im-course-map" aria-hidden="true">{STAGE_1_MODULES.map(m=><div key={m.id}><span>{String(m.order).padStart(2,'0')}</span><strong>{m.title}</strong></div>)}</div>
          <div className="im-progress-label"><span>{complete===8?'Percorso completato':`${complete} di 8 lezioni completate`}</span><strong>{Math.round(complete/8*100)}%</strong></div>
          <progress value={complete} max={8} aria-label="Lezioni completate"/>
          <p className="im-small">Leggi, osserva, metti alla prova ciò che hai capito.</p>
        </aside>
      </header>
      {!saved && <p className="im-notice" role="alert">Il browser non consente il salvataggio. Puoi continuare; scarica il backup prima di chiudere questa pagina.</p>}
      {progress.migrated && <p className="im-notice">Abbiamo recuperato le tue letture precedenti. Attività e verifiche sono nuove: completale per aggiornare il percorso.</p>}
      {complete===8 && <section className="im-milestone"><Check size={30}/><div><h2>Hai completato le fondamenta.</h2><p>Il prossimo passo è nella vita quotidiana. Rileggi il quaderno, scegli un obiettivo concreto e, se vuoi, confrontati con un professionista. Questo risultato è un’autoverifica, non una qualifica.</p><button className="im-link" onClick={()=>downloadText('PortaleCinofilo-il-mio-quaderno.txt',notebookText(progress))}>Scarica il tuo quaderno <Download size={16}/></button></div></section>}
      <section className="im-feature-row" aria-label="Strumenti per imparare">
        <button onClick={()=>go('osservazione-timing-marker')}><Target size={24}/><span><strong>Allena il tuo timing</strong><small>Un laboratorio da provare, non solo da leggere.</small></span><ArrowRight size={20}/></button>
        <button onClick={()=>navigate('/prima-del-cane')}><Leaf size={24}/><span><strong>Stai pensando a un cane?</strong><small>Parti dalla vita che puoi offrirgli.</small></span><ArrowRight size={20}/></button>
      </section>
      <section id="im-programma" className="im-program" aria-labelledby="program-title">
        <div className="im-section-heading"><div><p className="im-eyebrow">01 — FONDAMENTA</p><h2 id="program-title">Otto lezioni. Una relazione da costruire.</h2><p>Segui l’ordine suggerito oppure apri subito il tema che ti serve.</p></div><label className="im-search"><Search size={18}/><span className="sr-only">Cerca nelle lezioni</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Cerca un argomento" type="search"/></label></div>
        {matches.length===0 && <div className="im-panel"><p>Nessuna lezione trovata per “{search}”.</p><button className="im-link" onClick={()=>setSearch('')}>Mostra tutte le lezioni</button></div>}
        {STAGE_1_MODULES.map(module=>{
          const lessons=matches.filter(l=>l.moduleId===module.id);if(!lessons.length)return null;
          return <section className="im-module" key={module.id} aria-labelledby={`module-${module.id}`}>
            <div className="im-module-title"><span className="im-number">0{module.order}</span><div><h3 id={`module-${module.id}`}>{module.title}</h3><p>{module.description}</p></div></div>
            <div className="im-lessons-grid">{lessons.map(l=>{const status=lessonStatus(l,progress);return <RouteLink to={`/impara/stage-1/${l.slug}`} key={l.slug} className={`im-lesson-card ${status.complete?'complete':''}`} >
              <div className="im-card-top"><span className="im-eyebrow">LEZIONE {String(l.order).padStart(2,'0')}</span><span className={`im-status ${status.complete?'done':''}`}>{status.complete?<><Check size={14}/>Completata</>:status.started?'In corso':'Da iniziare'}</span></div>
              <h4>{l.title}</h4><p>{l.summary}</p>
              <div className="im-card-bottom"><span><Clock3 size={15}/>{l.durationMinutes} min + pratica</span><span>{status.complete?'Ripassa':'Apri lezione'}<ArrowRight size={17}/></span></div>
            </RouteLink>;})}</div>
          </section>;
        })}
      </section>
      <section className="im-notebook" aria-labelledby="notebook-title"><NotebookPen size={30}/><div><p className="im-eyebrow">DALLE LEZIONI ALLA TUA GIORNATA</p><h2 id="notebook-title">Il tuo quaderno di osservazione.</h2><p>Raccogli appunti, casi e domande durante le attività. Puoi scaricarli e portarli a un professionista. Restano in questo browser: chi usa lo stesso dispositivo può leggerli.</p>
        <div className="im-actions"><button className="im-button secondary" onClick={()=>downloadText('PortaleCinofilo-il-mio-quaderno.txt',notebookText(progress))}><Download size={17}/>Scarica il quaderno</button><button className="im-link" onClick={()=>navigate('/search?type=trainer&from=impara')}>Trova un addestratore<ArrowRight size={16}/></button></div>
        <details className="im-storage"><summary>Gestisci progressi e backup</summary><p>I progressi non sono sincronizzati con un account. Per spostarli su un altro browser esporta il backup e importalo lì. Cancellare i dati del browser può eliminarli.</p><div className="im-actions"><button className="im-button secondary" onClick={()=>downloadText('PortaleCinofilo-progressi.json',JSON.stringify({format:'portalecinofilo-impara-backup',exportedAt:new Date().toISOString(),progress},null,2),'application/json')}><Download size={16}/>Esporta backup</button><button className="im-button secondary" onClick={()=>upload.current?.click()}><Upload size={16}/>Importa backup</button><button className="im-link" onClick={()=>setReset(!reset)}>Azzera il percorso</button></div><input ref={upload} type="file" accept=".json,application/json" hidden onChange={e=>{const file=e.target.files?.[0];if(file)void restore(file);e.target.value='';}}/>
          {reset && <div className="im-notice"><p>Vuoi cancellare appunti e progressi da questo browser? Esporta prima un backup se vuoi conservarli.</p><div className="im-actions"><button className="im-button secondary" onClick={()=>setReset(false)}>Annulla</button><button className="im-button" onClick={()=>{update(()=>emptyProgress());setReset(false);setMessage('Appunti e progressi azzerati.');}}>Conferma azzeramento</button></div></div>}
          {message && <p role="status">{message}</p>}
        </details>
      </div></section>
      <p className="im-footnote">Un percorso educativo di PortaleCinofilo. Per difficoltà specifiche costruisci il lavoro con un professionista; per cambiamenti improvvisi o sospetti problemi di salute rivolgiti al veterinario.</p>
    </div>
  </main>;
}
