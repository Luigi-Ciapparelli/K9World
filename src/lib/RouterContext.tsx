import { createContext, useCallback, useContext, useState, useRef, ReactNode, useEffect } from 'react';

type NavigationGuard = (nextPath: string) => boolean;
interface RouterContextType {
  path: string;
  params: Record<string, string>;
  navigate: (path: string, params?: Record<string, string>) => void;
  registerGuard: (guard: NavigationGuard) => () => void;
}
const RouterContext = createContext<RouterContextType | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(() => window.location.hash.slice(1) || '/');
  const [params, setParams] = useState<Record<string, string>>({});
  const currentPath = useRef(path);
  const guards = useRef(new Set<NavigationGuard>());
  const registerGuard = useCallback((guard: NavigationGuard) => { guards.current.add(guard); return () => { guards.current.delete(guard); }; }, []);
  const canNavigate = useCallback((to: string) => !Array.from(guards.current).some(guard => guard(to)) || window.confirm('Hai modifiche non salvate. Vuoi uscire e perderle?'), []);

  useEffect(() => {
    const handler = () => {
      const next = window.location.hash.slice(1) || '/';
      if (next === currentPath.current) return;
      if (!canNavigate(next)) { window.history.replaceState(window.history.state, '', `#${currentPath.current}`); return; }
      currentPath.current = next; setPath(next); setParams({});
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (Array.from(guards.current).some(guard => guard(''))) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('hashchange', handler);
    window.addEventListener('beforeunload', beforeUnload);
    return () => { window.removeEventListener('hashchange', handler); window.removeEventListener('beforeunload', beforeUnload); };
  }, [canNavigate]);

  const navigate = useCallback((to: string, p: Record<string, string> = {}) => {
    if (to !== currentPath.current && !canNavigate(to)) return;
    currentPath.current = to; setPath(to); setParams(p);
    window.location.hash = to; window.scrollTo(0, 0);
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
