import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { useRouter } from '../lib/RouterContext';
import { useAuth } from '../lib/AuthContext';
import { toolTours, markToolExplored } from '../lib/proSetup';

export function ProToolGuide() {
  const { path, navigate } = useRouter();
  const id = new URLSearchParams(path.split('?')[1] || '').get('tour');
  const tool = toolTours.find(t => t.id === id && path.split('?')[0] === t.path);
  return tool ? <Guide key={tool.id} tool={tool} close={() => navigate(tool.path)} /> : null;
}
function Guide({ tool, close }: { tool: typeof toolTours[number]; close: () => void }) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [stored, setStored] = useState(true);
  return <aside className="pg-tour" aria-label={`Guida: ${tool.title}`}>
    <button type="button" onClick={close} className="pg-tour-close" aria-label="Chiudi guida"><X size={18} /></button>
    <div className="pg-eyebrow">{tool.title} · {done ? 'ESPLORATO' : `${step + 1} DI 3`}</div>
    <div aria-live="polite"><h2>{done ? 'Ora puoi usarlo con i tuoi clienti.' : tool.steps[step][0]}</h2><p>{done ? 'La guida è terminata. Le azioni sulla pagina vengono eseguite solo quando le confermi tu.' : tool.steps[step][1]}</p></div>
    <div className="pg-tour-actions">{step > 0 && !done && <button onClick={() => setStep(step - 1)} className="pg-text-link"><ArrowLeft size={16} /> Indietro</button>}{done ? <button onClick={close} className="pg-primary">Continua nello strumento <ArrowRight size={16} /></button> : <button className="pg-primary" onClick={() => { if (step < 2) setStep(step + 1); else { setStored(Boolean(user && markToolExplored(user.id, tool.id))); setDone(true); } }}>{step < 2 ? 'Passaggio successivo' : 'Termina guida'}{step < 2 ? <ArrowRight size={16} /> : <Check size={16} />}</button>}</div>
    {!stored && <p role="status">Il browser non ha conservato questo progresso. Puoi comunque usare lo strumento.</p>}
  </aside>;
}
