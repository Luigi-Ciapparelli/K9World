import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

interface RouterContextType {
  path: string;
  params: Record<string, string>;
  navigate: (path: string, params?: Record<string, string>) => void;
}

const RouterContext = createContext<RouterContextType | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState<string>(() => window.location.hash.slice(1) || '/');
  const [params, setParams] = useState<Record<string, string>>({});

  useEffect(() => {
    const handler = () => setPath(window.location.hash.slice(1) || '/');
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigate = (to: string, p: Record<string, string> = {}) => {
    window.location.hash = to;
    setParams(p);
    window.scrollTo(0, 0);
  };

  return <RouterContext.Provider value={{ path, params, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used inside RouterProvider');
  return ctx;
}
