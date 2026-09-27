import { useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Volume2, Target } from 'lucide-react';
import { type ImparaActivity } from '../../lib/imparaContent';
import { labPassed, scoreMarkers, type LabResult } from '../../lib/imparaProgress';

export function TimingLab({ activity, previous, onResult }: { activity: ImparaActivity; previous?: LabResult; onResult: (result: LabResult) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const clicks = useRef<number[]>([]);
  const running = useRef(false);
  const started = useRef(0);
  const audio = useRef<AudioContext>();
  const onResultRef = useRef(onResult); onResultRef.current = onResult;
  const [playing, setPlaying] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [time, setTime] = useState(0);
  const [count, setCount] = useState(0);
  const [sound, setSound] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [result, setResult] = useState<LabResult | undefined>(previous);
  const [message, setMessage] = useState('');
  const finish = () => {
    if (!running.current) return;
    running.current = false; setPlaying(false);
    const score = scoreMarkers(activity.markerTargets || [], clicks.current, activity.markerToleranceMs || 350);
    setResult(score); onResultRef.current(score);
  };
  const finishRef = useRef(finish); finishRef.current = finish;
  useEffect(() => {
    if (!playing || !fallback) return;
    let frame = 0;
    const tick = () => { const elapsed = (performance.now() - started.current) / 1000 * speed; setTime(Math.min(13,elapsed)); if (elapsed >= 13) finishRef.current(); else frame = requestAnimationFrame(tick); };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, fallback, speed]);
  useEffect(() => {
    const cancel = () => {
      if (document.hidden && running.current) { running.current = false; setPlaying(false); video.current?.pause(); setMessage('Tentativo interrotto perché hai cambiato finestra. Avvialo di nuovo quando sei pronto.'); }
    };
    document.addEventListener('visibilitychange',cancel);
    return () => { document.removeEventListener('visibilitychange',cancel); running.current = false; void audio.current?.close(); };
  }, []);
  const start = async () => {
    running.current = false; video.current?.pause(); clicks.current=[]; setCount(0); setResult(undefined); setTime(0); setMessage('');
    if (sound) { try { audio.current ||= new AudioContext(); await audio.current.resume(); } catch { /* Optional audio. */ } }
    if (fallback) { started.current = performance.now(); running.current = true; setPlaying(true); return; }
    const el = video.current;
    if (!el) return;
    el.currentTime = 0; el.playbackRate = speed;
    try { await el.play(); running.current = true; setPlaying(true); }
    catch { setFallback(true); setMessage('Il video non può partire. Avvia la versione animata: esercizio e tempi sono gli stessi.'); }
  };
  const mark = () => {
    if (!running.current) return;
    const timestamp = fallback ? (performance.now()-started.current)/1000*speed : video.current?.currentTime || 0;
    if (clicks.current.length >= 50) return;
    clicks.current.push(timestamp); setCount(clicks.current.length);
    if (sound && audio.current) { const ctx=audio.current; const osc=ctx.createOscillator(); const gain=ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.frequency.value=1200; gain.gain.setValueAtTime(.06,ctx.currentTime); gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+.035); osc.start(); osc.stop(ctx.currentTime+.04); osc.onended=()=>{osc.disconnect();gain.disconnect();}; }
  };
  return <div className="im-lab">
    <div className="im-video">
      {fallback ? <svg viewBox="0 0 720 360" role="img" aria-label="Esercizio animato: il punto attraversa la linea quattro volte"><rect width="720" height="360" fill="#163d2a"/><path d="M360 30V330M40 180H680" stroke="#aac8af" strokeWidth="2"/><circle cx={360+260*Math.sin(Math.PI*(time-2)/3)} cy="180" r="18" fill="#f1cc76"/></svg>
        : <video ref={video} src={activity.videoSrc} preload="metadata" playsInline muted aria-label="Filmato di timing: segna il passaggio del punto al centro" onEnded={finish} onError={()=>{ running.current=false;setPlaying(false);setFallback(true);setMessage('Video non disponibile: puoi usare la versione animata con gli stessi tempi.'); }} />}
      <span className="im-video-label">OCCHIO + MANO <span>04 passaggi</span></span>
    </div>
    <p>Premi quando il <strong>centro del punto</strong> attraversa la linea verticale. Puoi usare il pulsante con il mouse, il tocco o, quando ha il fuoco, Spazio e Invio.</p>
    <div className="im-actions">
      <button className="im-button secondary" onClick={()=>void start()}><span aria-hidden="true">{playing ? <RotateCcw size={17}/> : <Play size={17}/>}</span>{playing ? 'Ricomincia' : result ? 'Riprova il timing' : 'Avvia esercizio'}</button>
      <button className="im-button im-marker" disabled={!playing} onPointerDown={event=>{ if (event.button !== 0) return; event.preventDefault(); event.currentTarget.focus(); mark(); }} onClick={event=>{ if (event.detail === 0) mark(); }} onKeyDown={event=>{ if (event.key===' '||event.key==='Enter') {event.preventDefault();if(!event.repeat) mark();} }} onKeyUp={event=>{if(event.key===' '||event.key==='Enter') event.preventDefault();}}><Target size={18}/>Segna il momento</button>
      <span className="im-small" aria-live="off">{count} click</span>
    </div>
    <div className="im-lab-options">
      <label>Velocità <select value={speed} disabled={playing} onChange={e=>setSpeed(Number(e.target.value))}><option value={1}>Normale</option><option value={.75}>Lenta · allenamento</option></select></label>
      <label><input type="checkbox" checked={sound} disabled={playing} onChange={e=>setSound(e.target.checked)}/><Volume2 size={16}/>Suono del click</label>
    </div>
    {message && <p role="status" className="im-notice">{message}</p>}
    {result && <div className={`im-feedback ${labPassed(result)?'success':''}`} aria-live="polite">
      <strong>{labPassed(result) ? 'Timing completato.' : 'Guarda il confronto e riprova.'} {result.hits}/{result.total} passaggi centrati.</strong>
      <p>{result.extras} click fuori bersaglio o ripetuti. Obiettivo: almeno 3 passaggi entro ±350 ms e nessun click extra.</p>
      <ol className="im-timing-results">{result.offsets.map((value,i)=><li key={i}>Passaggio {i+1}<strong>{value === null ? 'Non centrato' : value===0 ? 'In tempo' : `${Math.abs(value)} ms ${value<0?'in anticipo':'in ritardo'}`}</strong></li>)}</ol>
    </div>}
    <details><summary>Come leggere questa prova</summary><p>Filmato astratto originale di PortaleCinofilo. I passaggi sono a 2, 5, 8 e 11 secondi del video. Ogni click può segnare un solo passaggio; i click ripetuti non aumentano il punteggio. La velocità lenta facilita l’allenamento. Dispositivo e riproduzione possono incidere sulla precisione. Il risultato non valuta la capacità di lavorare con un cane.</p></details>
  </div>;
}
