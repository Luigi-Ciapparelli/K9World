import { ArrowRight, Check, Compass, MapPin, UserRound, FileText, Package, Camera, CalendarDays, MessageCircle, Users, BookOpen, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import { continuityEnabled } from '../lib/continuity';
import { profileSetupStatus, baseSetupSteps, extraSetupSteps, readExploredTools, setupPath, toolTours, type SetupStep } from '../lib/proSetup';

export function ProSetupOverview({ name, pro, services, onOpen }: { name: string; pro: Record<string, unknown> | null; services: Array<{ active: boolean }>; onOpen: (step: SetupStep) => void }) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<'profile' | 'tools'>('profile');
  const { completed, count, next } = profileSetupStatus(name, pro, services);
  const base = baseSetupSteps;
  const approved = pro?.approved === true && pro?.approval_status === 'approved';
  const rejected = pro?.approval_status === 'rejected';
  const explored = user ? readExploredTools(user.id) : [];
  const tours = toolTours.filter(tool => tool.id !== 'archive' || continuityEnabled);
  const icons = [UserRound, MapPin, FileText, Package];
  const toolIcons = { calendar: CalendarDays, messages: MessageCircle, users: Users, archive: BookOpen, package: Package, repeat: RefreshCw };
  return <>
    <header className="pg-guide-summary">
      <div><span className="pg-eyebrow">Studio professionista</span><h1>Profilo guidato</h1>
        <p>{next ? 'Prepara le quattro informazioni di base per presentarti ai clienti.' : 'Hai completato le quattro informazioni di base. Puoi aggiornarle quando vuoi.'}</p>
      </div>
      <div className="pg-guide-progress">
        <span><strong>{count} di {base.length}</strong> passaggi di base completati</span>
        <progress value={count} max={base.length} aria-label="Passaggi di base completati" />
        {next ? <button type="button" className="pg-primary" onClick={() => onOpen(next.id)}>{next.label}</button>
          : <button type="button" className="pg-secondary" onClick={() => setTab('tools')}>Esplora gli strumenti</button>}
      </div>
    </header>
    <div className="pg-tabs" role="tablist" aria-label="Il tuo percorso" onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); const next = tab === "profile" ? "tools" : "profile"; setTab(next); document.getElementById(`pg-${next}-tab`)?.focus(); } }}><button id="pg-profile-tab" role="tab" tabIndex={tab === 'profile' ? 0 : -1} aria-selected={tab === 'profile'} aria-controls="pg-profile-panel" onClick={() => setTab('profile')}><span>Profilo</span></button><button id="pg-tools-tab" role="tab" tabIndex={tab === 'tools' ? 0 : -1} aria-selected={tab === 'tools'} aria-controls="pg-tools-panel" onClick={() => setTab('tools')}><span>Esplora gli strumenti</span></button></div>
    {tab === 'profile' ? <section id="pg-profile-panel" role="tabpanel" aria-labelledby="pg-profile-tab" className="pg-panel-enter">
      <div className="pg-section-heading"><div><h2>I quattro passaggi di base</h2><p>Ogni passaggio si salva separatamente. Puoi aprirli nell’ordine che preferisci.</p></div>{user && approved && <a href={`/p/${user.id}`} target="_blank" rel="noreferrer" className="pg-text-link">Apri profilo pubblico <ArrowRight size={16} /></a>}</div>
      <div className="pg-approval-notice" role="status">
        <strong>{approved ? 'Profilo approvato' : rejected ? 'Profilo da rivedere' : 'Profilo in attesa di approvazione'}</strong>
        <p>{approved ? 'Per comparire nella ricerca controlla zona, servizi attivi e preferenze di visibilità.' : rejected ? 'Apri le verifiche per leggere le indicazioni ricevute e aggiornare il profilo.' : next ? 'Le informazioni di base e il controllo dell’amministrazione sono separati. Puoi continuare a preparare il profilo.' : 'Le informazioni di base sono complete. Nei dettagli puoi controllare i requisiti e lo stato della verifica.'}</p>
        <button type="button" className="pg-text-link" onClick={() => onOpen(approved ? 'visibility' : 'verification')}>{approved ? 'Controlla la visibilità' : 'Vedi stato e verifiche'} <ArrowRight size={16} /></button>
      </div>
      <div className="pg-task-list">{base.map((step, index) => { const Icon = icons[index]; const done = completed[step.id]; return <button key={step.id} className={`pg-task ${done ? 'is-done' : ''}`} onClick={() => onOpen(step.id)}><span className="pg-task-icon">{done ? <Check size={22} /> : <Icon size={22} />}</span><span className="pg-task-copy"><strong>{step.label}</strong><span>{step.description}</span></span><span className="pg-task-status">{done ? 'Completato' : next?.id === step.id ? 'Prossimo passo' : 'Da completare'}</span><ArrowRight size={18} aria-hidden="true" /></button>; })}</div>
      <p className="pg-footnote">L’avanzamento indica i dati salvati. L’approvazione del profilo e le verifiche delle competenze restano separate.</p>
      <div className="pg-section-heading"><div><h2>Approfondimenti</h2><p>Foto, competenze e preferenze si gestiscono separatamente dai quattro passaggi di base.</p></div><Camera size={24} aria-hidden="true" /></div>
      <div className="pg-extra-grid">{extraSetupSteps.map(step => <button key={step.id} onClick={() => onOpen(step.id)}><strong>{step.short} <ArrowRight size={16} /></strong><span>{step.description}</span></button>)}</div>
    </section> : <section id="pg-tools-panel" role="tabpanel" aria-labelledby="pg-tools-tab" className="pg-panel-enter">
      <div className="pg-section-heading"><div><h2>Conosci i tuoi strumenti.</h2><p>Una breve guida accanto alla funzione reale. Scegli da dove iniziare.</p></div><span className="pg-counter">{tours.filter(tool => explored.includes(tool.id)).length} / {tours.length} esplorati</span></div>
      <div className="pg-tool-grid">{tours.map(tool => { const Icon = toolIcons[tool.icon]; return <button key={tool.id} onClick={() => navigate(`${tool.path}?tour=${tool.id}`)}><Icon size={24} /><span className="pg-tool-tag">{explored.includes(tool.id) ? 'Guida completata' : '3 piccoli passi'}</span><h3>{tool.title}</h3><p>{tool.description}</p><strong>Apri la guida <ArrowRight size={16} /></strong></button>; })}</div>
      <p className="pg-footnote">Le guide non creano prenotazioni o dati di prova. I progressi delle guide restano in questo browser e sono separati per account.</p>
      <button className="pg-text-link" onClick={() => navigate(setupPath('replies'))}><Compass size={18} /> Prepara i tuoi modelli di risposta</button>
    </section>}
  </>;
}
