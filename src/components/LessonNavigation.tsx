import { Check, Layers, Repeat2 } from 'lucide-react';
import { RouteLink } from './RouteLink';
import '../studio-tools.css';

type Kind = 'passes' | 'subscriptions';
export function LessonNavigation({ professional, active }: { professional: boolean; active: Kind }) {
  const base = professional ? '/pro' : '/owner';
  return <nav aria-label="Lezioni" className="pc-work-tabs">
    {([{ id:'passes', name:'Pacchetti', Icon:Layers },{ id:'subscriptions', name:'Abbonamenti', Icon:Repeat2 }] as const).map(({id,name,Icon}) =>
      <RouteLink key={id} to={base+'/'+id} aria-current={active===id?'page':undefined}><Icon aria-hidden="true" size={18} />{name}{active===id&&<Check aria-hidden="true" size={15} />}</RouteLink>)}
  </nav>;
}

export function LessonSetupSteps({ kind, service, model, onPrepare, onAssign, onView }: {
  kind: Kind; service: boolean; model: boolean; onPrepare: () => void; onAssign: () => void; onView: () => void;
}) {
  const stage = !service ? 0 : !model ? 1 : 2;
  const isPass = kind === 'passes';
  return <section className="pc-work-steps" aria-label="Percorso di assegnazione">
    <ol>{['Servizio attivo',isPass?'Modello':'Piano','Assegnazione'].map((s,i)=><li key={s} aria-current={i===stage?'step':undefined}><span aria-hidden="true">{i<stage?<Check size={15}/>:i+1}</span>{s}</li>)}</ol>
    <p>{stage===0?'Attiva un servizio per collegarlo alle lezioni.':stage===1?'Scegli durata, lezioni e prezzo per questo servizio.':'Puoi assegnare le condizioni concordate a un cliente abilitato.'}</p>
    <div>{stage===0?<RouteLink className="pc-work-action" to="/pro/settings?step=services">Configura un servizio</RouteLink>:<button type="button" className="pc-work-action" onClick={stage===1?onPrepare:onAssign}>{stage===1?(isPass?'Crea il primo modello':'Crea il primo piano'):'Scegli un cliente'}</button>}
      {stage===2&&<button type="button" className="pc-work-link" onClick={onView}>{isPass?'Rivedi i modelli':'Rivedi i piani'}</button>}
      {stage>0&&<RouteLink className="pc-work-link" to="/pro/settings?step=services">Torna ai servizi</RouteLink>}
    </div>
  </section>;
}
