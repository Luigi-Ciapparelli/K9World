import { useEffect, useId, useRef, useState } from 'react';
import type { ImparaActivity } from '../../lib/imparaContent';
import { labPassed, type LabResult } from '../../lib/imparaProgress';
import { normalizeRexResult } from '../../lib/shapingLab';

export function TimingLab({ activity, previous, onResult }: {
  activity: ImparaActivity; previous?: LabResult; onResult: (result: LabResult) => void;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const channel = useId();
  const initial = useRef(normalizeRexResult(previous));
  const callback = useRef(onResult);
  callback.current = onResult;
  const [height, setHeight] = useState(700);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);
  const complete = !!previous && labPassed(previous);

  useEffect(() => {
    let received = false;
    const send = (data: Record<string, unknown>) => frame.current?.contentWindow?.postMessage({
      source: 'portalecinofilo', channel, ...data,
    }, '*'); // Sandboxed child has an opaque origin; source + channel are checked both ways.
    const theme = () => send({ type: 'theme', dark: document.documentElement.classList.contains('dark') });
    const listener = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || event.origin !== 'null') return;
      const data = event.data;
      if (!data || data.source !== 'rex-clicker' || data.channel !== channel) return;
      if (data.type === 'ready') {
        received = true; setReady(true); setFailed(false);
        send({ type: 'init', progress: initial.current }); theme();
      } else if (data.type === 'resize' && Number.isFinite(data.height)) {
        setHeight(Math.max(260, Math.min(1200, Math.ceil(data.height))));
      } else if (data.type === 'progress') {
        const result = normalizeRexResult(data.progress);
        if (result) { initial.current = result; callback.current(result); }
      }
    };
    window.addEventListener('message', listener);
    send({ type: 'hello' });
    const timer = window.setTimeout(() => { if (!received) setFailed(true); }, 12000);
    const observer = new MutationObserver(theme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const visibility = new IntersectionObserver(entries => send({ type: 'visibility', visible: entries[0]?.isIntersecting ?? true }));
    if (frame.current) visibility.observe(frame.current);
    return () => {
      window.removeEventListener('message', listener); window.clearTimeout(timer);
      observer.disconnect(); visibility.disconnect();
    };
  }, [channel, reload]);

  return <div className="im-lab im-rex" aria-label={activity.title}>
    <p>Osserva Rex e segna il comportamento richiesto con <strong>CLICK!</strong>, toccando la scena o usando la barra spaziatrice nel gioco.</p>
    {complete && <p className="im-feedback" role="status">Attività già completata. Puoi rigiocare: il completamento rimane salvato.</p>}
    {!ready && !failed && <p role="status">Caricamento di Rex e il Clicker…</p>}
    {failed && <div role="alert"><p>Il gioco non è stato caricato. Riprova senza perdere i progressi.</p><button type="button" className="im-button" onClick={() => { setReady(false); setFailed(false); setReload(n => n + 1); }}>Ricarica il gioco</button></div>}
    <iframe key={reload} ref={frame} title="Rex e il Clicker: laboratorio di shaping" src={`/games/rex-clicker.html#${encodeURIComponent(channel)}`}
      sandbox="allow-scripts" referrerPolicy="same-origin" style={{ width: '100%', height, display: 'block', border: 0, borderRadius: 16, margin: '20px 0' }} />
    <p className="im-help">Il click indica il momento, poi arriva il premio. Nel gioco bastano pochi esempi; con un cane reale i passi vanno adattati e ripetuti. I punti non sono una valutazione professionale.</p>
  </div>;
}
