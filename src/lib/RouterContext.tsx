import { createContext, useCallback, useContext, useState, useRef, ReactNode, useEffect } from 'react';
import { normalizeRoute, privateRoute, readBrowserRoute, routeHref } from './routeUrls';

type NavigationGuard = (nextPath: string) => boolean;
interface RouterContextType {
  path: string;
  params: Record<string, string>;
  navigate: (path: string, params?: Record<string, string>) => void;
  registerGuard: (guard: NavigationGuard) => () => void;
}
const RouterContext = createContext<RouterContextType | null>(null);

export function RouterProvider({ children, initialPath }: { children: ReactNode; initialPath?: string }) {
  const [path, setPath] = useState<string>(() => initialPath || readBrowserRoute());
  const [params, setParams] = useState<Record<string, string>>({});
  const currentPath = useRef(path);
  const currentUrl = useRef(typeof window === 'undefined' ? '/' : window.location.pathname + window.location.search + window.location.hash);
  const guards = useRef(new Set<NavigationGuard>());
  const registerGuard = useCallback((guard: NavigationGuard) => { guards.current.add(guard); return () => { guards.current.delete(guard); }; }, []);
  const canNavigate = useCallback((to: string) => !Array.from(guards.current).some(guard => guard(to)) || window.confirm('Hai modifiche non salvate. Vuoi uscire e perderle?'), []);

  useEffect(() => {
    // Do not touch #access_token, recovery codes or other Supabase Auth fragments.
    if (!privateRoute(currentPath.current) && (window.location.hash.startsWith('#/') || (!window.location.hash && window.location.pathname + window.location.search !== routeHref(currentPath.current)))) {
      window.history.replaceState(window.history.state, '', routeHref(currentPath.current));
      currentUrl.current = routeHref(currentPath.current);
    }
    const handler = () => {
      const next = readBrowserRoute();
      if (next === currentPath.current) return;
      if (!canNavigate(next)) { window.history.replaceState(window.history.state, '', currentUrl.current); return; }
      if (!privateRoute(next) && (window.location.hash.startsWith('#/') || (!window.location.hash && window.location.pathname + window.location.search !== routeHref(next)))) window.history.replaceState(window.history.state, '', routeHref(next));
      currentUrl.current = window.location.pathname + window.location.search + window.location.hash;
      currentPath.current = next; setPath(next); setParams({});
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (Array.from(guards.current).some(guard => guard(''))) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('hashchange', handler);
    window.addEventListener('popstate', handler);
    window.addEventListener('beforeunload', beforeUnload);
    return () => { window.removeEventListener('hashchange', handler); window.removeEventListener('popstate', handler); window.removeEventListener('beforeunload', beforeUnload); };
  }, [canNavigate]);

  const navigate = useCallback((to: string, p: Record<string, string> = {}) => {
    to = normalizeRoute(to);
    if (!to.startsWith('/') || to.startsWith('//')) return;
    if (to !== currentPath.current && !canNavigate(to)) return;
    const href = routeHref(to);
    if (window.location.pathname + window.location.search + window.location.hash !== href) window.history.pushState({}, '', href);
    currentUrl.current = href;
    currentPath.current = to; setPath(to); setParams(p);
    window.scrollTo(0, 0);
  }, [canNavigate]);

  return <RouterContext.Provider value={{ path, params, navigate, registerGuard }}>{children}</RouterContext.Provider>;
}
export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used inside RouterProvider');
  return ctx;
}
export function useUnsavedChanges(dirty: boolean, retainedPage?: string) {
  const { registerGuard } = useRouter();
  useEffect(() => registerGuard(next => dirty && (!retainedPage || next.split('?')[0] !== retainedPage)), [dirty, retainedPage, registerGuard]);
}
