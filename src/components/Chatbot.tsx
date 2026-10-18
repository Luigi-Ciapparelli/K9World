import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronDown, HelpCircle, Search, X } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { useRouter } from '../lib/RouterContext';
import { continuityEnabled } from '../lib/continuity';
import { filterHelpArticles, helpArticlesFor, type HelpAudience } from '../lib/siteHelp';
import { RouteLink } from './RouteLink';

function QuickHelp({ audience, onClose }: { audience: HelpAudience; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);
  const { path } = useRouter();
  const openedPath = useRef(path);
  const close = useCallback(() => { dialog.current?.close(); onClose(); }, [onClose]);
  const articles = filterHelpArticles(helpArticlesFor(audience, continuityEnabled), query);

  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    searchInput.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { element?.close(); document.body.style.overflow = previousOverflow; };
  }, []);
  useEffect(() => { if (path !== openedPath.current) close(); }, [path, close]);

  return (
    <dialog ref={dialog} aria-labelledby="quick-help-title" aria-describedby="quick-help-description"
      onCancel={event => { event.preventDefault(); close(); }}
      className="m-auto w-[calc(100%-2rem)] max-w-xl max-h-[calc(100dvh-2rem)] rounded-3xl border border-stone-200 bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-stone-950/50 open:flex flex-col overflow-hidden">
      <header className="shrink-0 border-b border-stone-200 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="mb-1 text-xs font-bold uppercase tracking-widest text-emerald-800">PortaleCinofilo · Aiuto</p>
            <h2 id="quick-help-title" className="text-2xl font-bold">Guida rapida</h2></div>
          <button type="button" onClick={close} aria-label="Chiudi la guida" className="rounded-full p-3 hover:bg-stone-100 focus-visible:outline-emerald-700"><X className="h-5 w-5" /></button>
        </div>
        <p id="quick-help-description" className="mt-2 text-sm leading-relaxed text-stone-600">Trova il passaggio che ti serve e apri la pagina giusta.</p>
        <label htmlFor="quick-help-search" className="mt-4 block text-sm font-semibold">Cerca nella guida</label>
        <div className="relative mt-2"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-5 w-5 text-stone-500" />
          <input ref={searchInput} id="quick-help-search" type="search" value={query} onChange={event => setQuery(event.target.value)} maxLength={100}
            placeholder="Es. prenotazione, email, pacchetto" className="w-full rounded-xl border border-stone-300 py-3 pl-10 pr-3 text-base outline-offset-2 focus:outline-emerald-700" />
        </div>
      </header>
      <div className="min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6">
        <p role="status" className="mb-3 text-xs text-stone-500">{articles.length} {articles.length === 1 ? 'argomento disponibile' : 'argomenti disponibili'}</p>
        {articles.length ? <div className="space-y-3">{articles.map(article => (
          <details key={article.id} className="group rounded-2xl border border-stone-200 bg-stone-50/60">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl p-4 font-semibold focus-visible:outline-emerald-700 [&::-webkit-details-marker]:hidden">
              {article.title}<ChevronDown aria-hidden="true" className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" />
            </summary>
            <div className="space-y-3 px-4 pb-4 text-sm leading-relaxed text-stone-700">
              {article.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              <div className="flex flex-wrap gap-2 pt-1">{article.links.map(link => (
                <RouteLink key={link.to} to={link.to} onClick={event => { if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) close(); }}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 py-2 font-semibold text-emerald-900 hover:bg-emerald-50">
                  {link.label}<ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                </RouteLink>
              ))}</div>
            </div>
          </details>
        ))}</div> : <div className="rounded-2xl bg-stone-50 p-5">
          <p className="font-semibold">Nessun argomento trovato</p><p className="mt-2 text-sm text-stone-600">Prova una parola più semplice oppure sfoglia tutti gli argomenti.</p>
          <button type="button" onClick={() => { setQuery(''); searchInput.current?.focus(); }} className="mt-3 min-h-11 font-semibold text-emerald-800 underline">Mostra tutti gli argomenti</button>
        </div>}
      </div>
      <footer className="shrink-0 border-t border-stone-200 bg-stone-50 px-5 py-4 text-sm sm:px-6">
        <p className="text-stone-600">Non trovi la risposta? <a href="mailto:info@portalecinofilo.com" className="font-semibold text-emerald-800 underline">Scrivici via email</a></p>
        <p className="mt-1 text-xs text-stone-500">Questa è una guida, non una chat. La ricerca resta sul tuo dispositivo.</p>
      </footer>
    </dialog>
  );
}

export function Chatbot() {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const audience: HelpAudience = user && profile ? profile.role : 'visitor';
  const close = useCallback(() => { setOpen(false); requestAnimationFrame(() => trigger.current?.focus()); }, []);
  return <>
    <button ref={trigger} type="button" onClick={() => setOpen(true)} aria-label="Apri la guida rapida" aria-haspopup="dialog" aria-expanded={open}
      className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-emerald-800 px-4 py-3 font-semibold text-white shadow-lg transition hover:bg-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700 motion-reduce:transition-none">
      <HelpCircle aria-hidden="true" className="h-5 w-5" />Aiuto
    </button>
    {open && <QuickHelp key={`${user?.id || 'visitor'}:${audience}`} audience={audience} onClose={close} />}
  </>;
}
