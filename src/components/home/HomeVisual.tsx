import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Pause, Play, X } from 'lucide-react';
import { RouteLink } from '../RouteLink';

function ShapingPreview({ onClose, reducedMotion }: { onClose: () => void; reducedMotion: boolean }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaError, setMediaError] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    const video = videoRef.current;
    const overflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = 'hidden';
    const pauseWhenHidden = () => { if (document.hidden) video?.pause(); };
    document.addEventListener('visibilitychange', pauseWhenHidden);
    return () => {
      video?.pause();
      dialog?.close();
      document.body.style.overflow = overflow;
      document.removeEventListener('visibilitychange', pauseWhenHidden);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (reducedMotion) video?.pause();
    else void video?.play().catch(() => { /* Native controls remain available. */ });
  }, [reducedMotion]);

  return <dialog ref={dialogRef} className="pc-home-video-dialog" aria-labelledby="home-video-title" aria-describedby="home-video-description"
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) { const box = event.currentTarget.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose(); } }}>
    <div className="pc-video-heading"><div><span>UN ESEMPIO DA IMPARA</span><h2 id="home-video-title">Piccoli passi: lo shaping.</h2></div><button type="button" autoFocus onClick={onClose} aria-label="Chiudi anteprima" className="pc-video-close"><X size={22} /></button></div>
    <video ref={videoRef} controls playsInline autoPlay={!reducedMotion} muted preload="metadata" width="720" height="420" poster="/media/home/shaping-poster.webp" aria-label="Anteprima animata dello shaping, 12 secondi" onError={() => setMediaError(true)}>
      <source src="/media/home/shaping-preview.mp4" type="video/mp4" />
      <source src="/media/home/shaping-preview.webm" type="video/webm" />
      Il browser non supporta il video. La sequenza è descritta qui sotto.
    </video>
    {mediaError && <p className="pc-video-error" role="alert">Il video non è disponibile. Puoi leggere la sequenza qui sotto o aprire l’esercizio.</p>}
    <div className="pc-video-description"><p id="home-video-description">Il cane guarda la piattaforma, si avvicina, appoggia una zampa e infine entrambe le zampe anteriori. Ogni piccolo obiettivo raggiunto viene seguito dal click e dal premio.</p><p>È un’animazione esemplificativa. Nella realtà si procede con ripetizioni e tempi adatti al singolo cane.</p><RouteLink to="/impara/stage-1/osservazione-timing-marker" onClick={onClose}>Apri l’esercizio in Impara <ArrowRight size={16} aria-hidden="true" /></RouteLink></div>
  </dialog>;
}

export function HomeVisual() {
  const previewButtonRef = useRef<HTMLButtonElement>(null);
  const [reducedMotion, setReducedMotion] = useState(() => typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [paused, setPaused] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  return <div className="pc-home-visual" data-motion={paused || reducedMotion ? 'paused' : 'running'}>
    <picture className="pc-home-photo">
      <img src="/media/home/training-1280.webp" srcSet="/media/home/training-768.webp 768w, /media/home/training-1280.webp 1280w" sizes="(max-width: 767px) 100vw, 55vw" alt="Immagine illustrativa di una conduttrice e un cane con le zampe anteriori su una pedana bassa." width="1280" height="854" loading="eager" decoding="async" />
    </picture>
    <span className="pc-photo-label">Immagine illustrativa</span>
    {!reducedMotion && <button type="button" className="pc-photo-motion" aria-label={paused ? 'Riprendi movimento immagine' : 'Ferma movimento immagine'} aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? <Play size={16} aria-hidden="true" /> : <Pause size={16} aria-hidden="true" />}</button>}
    <button ref={previewButtonRef} type="button" className="pc-shaping-preview-button" onClick={() => setPreviewOpen(true)} aria-label="Guarda l’anteprima animata dello shaping, 12 secondi">
      <span className="pc-preview-play"><Play size={22} fill="currentColor" aria-hidden="true" /></span>
      <span><small>12 SECONDI · ANIMAZIONE</small><strong>Lo shaping, in pratica.</strong><span>Guarda un piccolo esempio <ArrowRight size={14} aria-hidden="true" /></span></span>
    </button>
    {previewOpen && <ShapingPreview reducedMotion={reducedMotion} onClose={() => {
      setPreviewOpen(false);
      requestAnimationFrame(() => previewButtonRef.current?.focus());
    }} />}
  </div>;
}
