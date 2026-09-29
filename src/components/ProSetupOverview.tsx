import { ArrowRight, Check, Compass, MapPin, UserRound, FileText, Package, Camera, CalendarDays, MessageCircle, Users, BookOpen, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import { continuityEnabled } from '../lib/continuity';
import { completedProfileSteps, readExploredTools, setupSteps, setupPath, toolTours, type SetupStep } from '../lib/proSetup';

export function ProSetupOverview({ name, pro, services, onOpen }: { name: string; pro: Record<string, unknown> | null; services: Array<{ active: boolean }>; onOpen: (step: SetupStep) => void }) {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [tab, setTab] = useState<'profile' | 'tools'>('profile');
  const completed = completedProfileSteps(name, pro, services);
  const base = setupSteps.filter(step => step.group === 'base');
  const count = Object.values(completed).filter(Boolean).length;
  const next = base.find(step => !completed[step.id]);
  const explored = user ? readExploredTools(user.id) : [];
  const tours = toolTours.filter(tool => tool.id !== 'archive' || continuityEnabled);
  const icons = [UserRound, MapPin, FileText, Package];
  const toolIcons = { calendar: CalendarDays, messages: MessageCircle, users: Users, archive: BookOpen, package: Package, repeat: RefreshCw };
  return <>
    <header className="pg-welcome">
      <div><span className="pg-eyebrow">IL TUO SPAZIO PROFESSIONALE</span><h1>Un passo alla volta.<br /><em>Il tuo lavoro prende forma.</em></h1><p>Parti dalle informazioni essenziali. Aggiungi il resto quando ti serve, con i tuoi tempi.</p>
      <button className="pg-primary pg-light" onClick={() => next ? onOpen(next.id) : setTab('tools')}>{next ? 'Continua il profilo' : 'Scopri gli strumenti'} <ArrowRight size={18} /></button></div>
      <div className="pg-progress-card"><div className="pg-progress-count"><strong>{count}</strong><span>/ {base.length}</span><Check size={24} aria-hidden="true" /></div><p>attività di base completate</p><progress value={count} max={base.length} aria-label="Attività di base completate" /><small>{next ? `Prossimo passo: ${next.short.toLowerCase()}.` : 'Le informazioni di base ci sono. Puoi sempre aggiornarle.'}</small></div>
    </header>
    <div className="pg-tabs" role="tablist" aria-label="Il tuo percorso" onKeyDown={event => { if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); const next = tab === "profile" ? "tools" : "profile"; setTab(next); document.getElementById(`pg-${next}-tab`)?.focus(); } }}><button id="pg-profile-tab" role="tab" tabIndex={tab === 'profile' ? 0 : -1} aria-selected={tab === 'profile'} aria-controls="pg-profile-panel" onClick={() => setTab('profile')}>01 <span>Costruisci il profilo</span></button><button id="pg-tools-tab" role="tab" tabIndex={tab === 'tools' ? 0 : -1} aria-selected={tab === 'tools'} aria-controls="pg-tools-panel" onClick={() => setTab('tools')}>02 <span>Esplora gli strumenti</span></button></div>
    {tab === 'profile' ? <section id="pg-profile-panel" role="tabpanel" aria-labelledby="pg-profile-tab" className="pg-panel-enter">
      <div className="pg-section-heading"><div><h2>Le basi, senza complicazioni.</h2><p>Ogni passaggio si salva separatamente. Puoi aprirli nell’ordine che preferisci.</p></div>{user && <a href={`/p/${user.id}`} target="_blank" rel="noreferrer" className="pg-text-link">Apri profilo pubblico <ArrowRight size={16} /></a>}</div>
      <div className="pg-task-list">{base.map((step, index) => { const Icon = icons[index]; const done = completed[step.id]; return <button key={step.id} className={`pg-task ${done ? 'is-done' : ''}`} onClick={() => onOpen(step.id)}><span className="pg-task-icon">{done ? <Check size={22} /> : <Icon size={22} />}</span><span className="pg-task-copy"><strong>{step.label}</strong><span>{step.description}</span></span><span className="pg-task-status">{done ? 'Completato' : 'Da completare'}</span><ArrowRight size={18} aria-hidden="true" /></button>; })}</div>
      <p className="pg-footnote">L’avanzamento indica i dati salvati. L’approvazione del profilo e le verifiche delle competenze restano separate.</p>
      <div className="pg-section-heading"><div><h2>Rendilo tuo.</h2><p>Immagine, competenze e preferenze: scegli cosa curare adesso.</p></div><Camera size={24} aria-hidden="true" /></div>
      <div className="pg-extra-grid">{setupSteps.filter(step => step.group === 'more').map(step => <button key={step.id} onClick={() => onOpen(step.id)}><strong>{step.short} <ArrowRight size={16} /></strong><span>{step.description}</span></button>)}</div>
    </section> : <section id="pg-tools-panel" role="tabpanel" aria-labelledby="pg-tools-tab" className="pg-panel-enter">
      <div className="pg-section-heading"><div><h2>Conosci i tuoi strumenti.</h2><p>Una breve guida accanto alla funzione reale. Scegli da dove iniziare.</p></div><span className="pg-counter">{tours.filter(tool => explored.includes(tool.id)).length} / {tours.length} esplorati</span></div>
      <div className="pg-tool-grid">{tours.map(tool => { const Icon = toolIcons[tool.icon]; return <button key={tool.id} onClick={() => navigate(`${tool.path}?tour=${tool.id}`)}><Icon size={24} /><span className="pg-tool-tag">{explored.includes(tool.id) ? 'Guida completata' : '3 piccoli passi'}</span><h3>{tool.title}</h3><p>{tool.description}</p><strong>Apri la guida <ArrowRight size={16} /></strong></button>; })}</div>
      <p className="pg-footnote">Le guide non creano prenotazioni o dati di prova. I progressi delle guide restano in questo browser e sono separati per account.</p>
      <button className="pg-text-link" onClick={() => navigate(setupPath('replies'))}><Compass size={18} /> Prepara i tuoi modelli di risposta</button>
    </section>}
  </>;
}
