import { Component, useEffect, useRef, useState, type ReactNode } from 'react';

function useOnlineStatus() {
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);
  return online;
}

function ReloadButton({ online }: { online: boolean }) {
  return <button type="button" disabled={!online} onClick={() => window.location.reload()}
    className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-5 py-3 font-semibold text-white hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">
    Ricarica la pagina
  </button>;
}

function PageFailure({ kind }: { kind: 'load' | 'render' }) {
  const online = useOnlineStatus();
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { heading.current?.focus(); }, []);
  return <main className="mx-auto flex min-h-[55vh] max-w-3xl items-center px-5 py-12 sm:px-8">
    <section aria-labelledby="page-recovery-title" className="w-full rounded-3xl border border-stone-200 bg-white p-6 text-stone-900 shadow-sm sm:p-10">
      <p className="text-sm font-semibold text-emerald-800">PortaleCinofilo</p>
      <h1 ref={heading} tabIndex={-1} id="page-recovery-title" className="mt-3 text-2xl font-bold tracking-tight outline-none sm:text-3xl">
        {online ? kind === 'load' ? 'Non siamo riusciti a caricare questa pagina' : 'Questa pagina ha incontrato un problema' : 'La connessione sembra assente'}
      </h1>
      <p role="status" className="mt-4 leading-relaxed text-stone-600">
        {online ? 'Puoi ricaricare la pagina e riprovare. Se il problema continua, torna alla home o contattaci.' : 'Controlla la connessione. Quando torna disponibile, potrai ricaricare la pagina.'}
      </p>
      <div className="mt-6 flex flex-wrap items-center gap-4">
        <ReloadButton online={online} />
        <a href="/" className="inline-flex min-h-11 items-center rounded-xl border border-stone-300 px-5 py-3 font-semibold hover:bg-stone-50">Torna alla home</a>
      </div>
      <p className="mt-5 text-sm leading-relaxed text-stone-600">Le modifiche non salvate potrebbero andare perse ricaricando o cambiando pagina.</p>
      <a href="mailto:info@portalecinofilo.com" className="mt-4 inline-block break-all text-sm font-semibold text-emerald-800 underline underline-offset-4">info@portalecinofilo.com</a>
    </section>
  </main>;
}

/** Keep failures inside the current page; do not retry imports or replay writes automatically. */
export class PageErrorBoundary extends Component<{ children: ReactNode }, { failure: 'load' | 'render' | null }> {
  state: { failure: 'load' | 'render' | null } = { failure: null };
  static getDerivedStateFromError(error: unknown): { failure: 'load' | 'render' } {
    const message = error instanceof Error ? error.message : '';
    return { failure: /dynamically imported|module script|loading chunk|preload CSS/i.test(message) ? 'load' : 'render' };
  }
  render() {
    return this.state.failure ? <PageFailure kind={this.state.failure} /> : this.props.children;
  }
}

export function PageLoading() {
  const online = useOnlineStatus();
  const [slow, setSlow] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), 10000);
    return () => window.clearTimeout(timer);
  }, []);
  return <div className="flex min-h-[50vh] items-center justify-center px-5 py-10 text-center">
    <div className="max-w-md">
      <p role="status" className="font-semibold text-stone-700">{!online ? 'La connessione sembra assente.' : slow ? 'Il caricamento sta richiedendo più tempo del previsto.' : 'Caricamento…'}</p>
      {slow && <div className="mt-5">
        <p className="mb-5 text-sm leading-relaxed text-stone-600">{online ? 'Puoi attendere ancora oppure ricaricare la pagina.' : 'Riconnettiti per riprovare.'} Le modifiche non salvate potrebbero andare perse ricaricando.</p>
        <ReloadButton online={online} />
      </div>}
    </div>
  </div>;
}

export function ConnectionNotice() {
  const online = useOnlineStatus();
  if (online) return null;
  return <div role="status" className="border-y border-amber-200 bg-amber-50 px-5 py-3 text-center text-sm text-amber-950">
    Connessione assente. Riconnettiti prima di inviare o salvare.
  </div>;
}
