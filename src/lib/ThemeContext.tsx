import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { BROWSER_DATA_EVENT, THEME_KEY } from './browserData';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readTheme(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  } catch { return 'system'; }
}

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const shouldUseDark = theme === 'dark' || (theme === 'system' && prefersDark);

  root.classList.toggle('dark', shouldUseDark);
  root.dataset.theme = theme;
  root.style.colorScheme = shouldUseDark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'system';
    return readTheme();
  });

  const setTheme = (nextTheme: ThemeMode) => {
    try { window.localStorage.setItem(THEME_KEY, nextTheme); } catch { /* Apply for this visit even if storage is disabled. */ }
    setThemeState(nextTheme);
    applyTheme(nextTheme);
  };

  useEffect(() => {
    const sync = (event: Event) => {
      if (event instanceof StorageEvent && event.key !== THEME_KEY && event.key !== null) return;
      if (event instanceof CustomEvent && event.detail !== 'theme') return;
      setThemeState(readTheme());
    };
    window.addEventListener('storage', sync);
    window.addEventListener(BROWSER_DATA_EVENT, sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener(BROWSER_DATA_EVENT, sync); };
  }, []);

  useEffect(() => {
    applyTheme(theme);

    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const onChange = () => {
      if (theme === 'system') applyTheme('system');
    };

    media.addEventListener('change', onChange);

    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// This hook and its provider intentionally share the same context module.
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const ctx = useContext(ThemeContext);

  if (!ctx) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }

  return ctx;
}
